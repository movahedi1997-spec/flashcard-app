/**
 * POST /api/auth/register
 * Creates a new user account and opens a fully-hardened session.
 *
 * TASK-005 additions:
 *   • Rate limited — 5 attempts / min per IP (429 on breach)
 *   • COPPA gate  — `coppa_verified: true` required in body; blocks under-13 registration
 *   • Dual tokens — 15-min access token (cookie: `token`) +
 *                   30-day refresh token (cookie: `refresh_token`, path: /api/auth)
 *   • Refresh jti persisted to `refresh_tokens` table for rotation/revocation
 *
 * Body: { name, email, password, coppa_verified }
 * Response 201: { user: { id, name, email } }
 * Response 400: validation error | COPPA blocked
 * Response 409: email already exists
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

export async function POST(req: NextRequest) {
  // ── Rate limit ─────────────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const rl = checkRateLimit(`register:${ip}`); // 5 attempts / 60 s per IP

  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
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
  const { name, email, password, coppa_verified } = body ?? {};

  // ── COPPA gate ─────────────────────────────────────────────────────────────
  // The client must explicitly pass coppa_verified: true after the user confirms
  // they are 13 years of age or older. This flag must never be set server-side
  // without a genuine affirmative action from the user in the UI.
  if (coppa_verified !== true) {
    return NextResponse.json(
      {
        error: 'Age verification required.',
        code:  'COPPA_NOT_VERIFIED',
        detail: 'You must confirm you are 13 years of age or older to create an account.',
      },
      { status: 400 },
    );
  }

  // ── Field validation ───────────────────────────────────────────────────────
  if (!name || !email || !password) {
    return NextResponse.json(
      { error: 'name, email, and password are required.' },
      { status: 400 },
    );
  }
  if (typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json(
      { error: 'Name must be at least 2 characters.' },
      { status: 400 },
    );
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: 'A valid email address is required.' },
      { status: 400 },
    );
  }
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 },
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // ── Duplicate check ────────────────────────────────────────────────────────
    const existing = await query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail],
    );
    if ((existing.rowCount ?? 0) > 0) {
      return NextResponse.json(
        { error: 'An account with that email already exists.' },
        { status: 409 },
      );
    }

    // ── Hash + insert ──────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await query<{ id: string; name: string; email: string }>(
      `INSERT INTO users (name, email, password_hash, coppa_verified)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email`,
      [name.trim(), normalizedEmail, passwordHash, true],
    );

    const user = result.rows[0];

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
    const response = NextResponse.json(
      { user: { id: user.id, name: user.name, email: user.email } },
      { status: 201 },
    );

    response.cookies.set(COOKIE_NAME, accessToken, COOKIE_OPTIONS);
    response.cookies.set(REFRESH_COOKIE_NAME, refresh.token, REFRESH_COOKIE_OPTIONS);

    return response;
  } catch (err) {
    console.error('[POST /api/auth/register]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
