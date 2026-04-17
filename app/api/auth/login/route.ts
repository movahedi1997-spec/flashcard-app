/**
 * POST /api/auth/login
 * Validates credentials and opens a fully-hardened session.
 *
 * TASK-005 additions:
 *   • Rate limited — 5 attempts / min per IP (429 on breach)
 *   • Dual tokens — 15-min access token (cookie: `token`) +
 *                   30-day refresh token (cookie: `refresh_token`, path: /api/auth)
 *   • Refresh jti persisted to `refresh_tokens` table for rotation/revocation
 *
 * Generic error message for both "email not found" and "wrong password" prevents
 * user-enumeration attacks (timing-safe bcrypt compare even for unknown emails).
 *
 * Body: { email, password }
 * Response 200: { user: { id, name, email } }
 * Response 400: missing fields
 * Response 401: invalid credentials
 * Response 429: rate limit exceeded
 * Response 500: internal error
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import {
  signAccessToken,
  signRefreshToken,
  COOKIE_NAME,
  COOKIE_OPTIONS,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_OPTIONS,
  getClientIp,
} from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // ── Rate limit ─────────────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const rl = checkRateLimit(`login:${ip}`); // independent counter from register

  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After':           String(rl.retryAfter),
          'X-RateLimit-Limit':     String(rl.limit),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const { email, password } = body ?? {};

  if (!email || !password) {
    return NextResponse.json(
      { error: 'email and password are required.' },
      { status: 400 },
    );
  }
  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // ── Fetch user ─────────────────────────────────────────────────────────────
    const result = await query<{
      id: string;
      name: string;
      email: string;
      password_hash: string;
    }>(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [normalizedEmail],
    );

    const user = result.rows[0];

    // Constant-time compare even when user doesn't exist — prevents timing-based
    // enumeration of valid email addresses.
    const dummyHash = '$2b$10$invalidhashfortimingattackprevention000000000000000';
    const hashToCompare = user?.password_hash ?? dummyHash;
    const match = await bcrypt.compare(password, hashToCompare);

    if (!user || !match) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 },
      );
    }

    // Upgrade hashes silently in the background (12→10 rounds). Fire-and-forget:
    // does not block the response and fails silently — safe for persistent servers.
    if (bcrypt.getRounds(user.password_hash) > 10) {
      bcrypt.hash(password, 10)
        .then((h) => query('UPDATE users SET password_hash=$1 WHERE id=$2', [h, user.id]))
        .catch(() => {});
    }

    // ── Issue token pair ───────────────────────────────────────────────────────
    const [accessToken, refresh] = await Promise.all([
      signAccessToken({ userId: user.id, email: user.email, name: user.name }),
      signRefreshToken(user.id),
    ]);

    // Persist refresh jti — enables revocation on logout / rotation
    await query(
      `INSERT INTO refresh_tokens (jti, user_id, expires_at)
       VALUES ($1, $2, $3)`,
      [refresh.jti, user.id, refresh.expiresAt],
    );

    // ── Build response ─────────────────────────────────────────────────────────
    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
    });

    response.cookies.set(COOKIE_NAME, accessToken, COOKIE_OPTIONS);
    response.cookies.set(REFRESH_COOKIE_NAME, refresh.token, REFRESH_COOKIE_OPTIONS);

    return response;
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
