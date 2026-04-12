/**
 * POST /api/auth/refresh
 * Rotates the refresh token and issues a fresh access + refresh token pair.
 *
 * Token rotation protocol (TASK-005):
 *   1. Read `refresh_token` HTTP-only cookie (scoped to /api/auth).
 *   2. Verify JWT signature with REFRESH_JWT_SECRET.
 *   3. Look up jti in `refresh_tokens` DB table.
 *        a. Not found → 401 (token was never issued or already pruned).
 *        b. Found + revoked = true → THEFT SIGNAL: revoke ALL user sessions,
 *           clear both cookies, return 401. The legitimate user must re-login.
 *        c. Expired (expires_at < NOW()) → 401.
 *   4. Revoke the old jti (set revoked = true).
 *   5. Issue new access token (15 min) + new refresh token (30 days).
 *   6. Persist new jti to DB.
 *   7. Set both cookies on the response.
 *
 * Rate limited: 5 calls / min per IP (prevents brute-force jti guessing).
 *
 * Response 200: { user: { userId, email, name } }
 * Response 401: invalid / expired / revoked refresh token
 * Response 429: rate limit exceeded
 * Response 500: internal error
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  verifyRefreshToken,
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

// Shared 401 response — never hint at *why* the token was rejected to prevent
// oracle attacks (was it expired? revoked? wrong user? client must re-login).
const INVALID_RESPONSE = NextResponse.json(
  { error: 'Invalid or expired session. Please log in again.' },
  { status: 401 },
);

function clearBothCookies(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  response.cookies.set(REFRESH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/api/auth',
  });
}

export async function POST(req: NextRequest) {
  // ── Rate limit ─────────────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const rl = checkRateLimit(`refresh:${ip}`);

  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
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

  // ── Read + verify refresh token JWT ───────────────────────────────────────
  const rawToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (!rawToken) return INVALID_RESPONSE;

  const refreshPayload = await verifyRefreshToken(rawToken);
  if (!refreshPayload) return INVALID_RESPONSE; // expired or bad signature

  const { userId, jti } = refreshPayload;

  try {
    // ── DB revocation check ────────────────────────────────────────────────
    const tokenRow = await query<{
      revoked: boolean;
      expires_at: string;
    }>(
      `SELECT revoked, expires_at
         FROM refresh_tokens
        WHERE jti = $1
          AND user_id = $2`,
      [jti, userId],
    );

    // Token not found in DB (pruned, or spoofed jti with valid signature)
    if ((tokenRow.rowCount ?? 0) === 0) return INVALID_RESPONSE;

    const row = tokenRow.rows[0];

    // ── Theft detection ────────────────────────────────────────────────────
    // A revoked token being presented means the old token may have been stolen.
    // Invalidate ALL sessions for this user immediately.
    if (row.revoked) {
      await query(
        `UPDATE refresh_tokens SET revoked = true WHERE user_id = $1`,
        [userId],
      ).catch((err) => console.error('[refresh] bulk revoke error:', err));

      const theftResponse = NextResponse.json(
        { error: 'Session invalidated. Please log in again.' },
        { status: 401 },
      );
      clearBothCookies(theftResponse);
      console.warn(`[SECURITY] Refresh token reuse detected for user ${userId} from IP ${ip}`);
      return theftResponse;
    }

    // DB-side expiry check (belt-and-suspenders on top of JWT exp)
    if (new Date(row.expires_at) < new Date()) return INVALID_RESPONSE;

    // ── Fetch user for new access token claims ─────────────────────────────
    const userRow = await query<{ id: string; name: string; email: string }>(
      'SELECT id, name, email FROM users WHERE id = $1',
      [userId],
    );
    if ((userRow.rowCount ?? 0) === 0) return INVALID_RESPONSE;
    const user = userRow.rows[0];

    // ── Rotate: revoke old jti, issue new token pair ───────────────────────
    const [accessToken, newRefresh] = await Promise.all([
      signAccessToken({ userId: user.id, email: user.email, name: user.name }),
      signRefreshToken(user.id),
    ]);

    // Run revocation and new-jti insert in a single round-trip via transaction
    await query('BEGIN');
    try {
      await query(
        `UPDATE refresh_tokens SET revoked = true WHERE jti = $1`,
        [jti],
      );
      await query(
        `INSERT INTO refresh_tokens (jti, user_id, expires_at)
         VALUES ($1, $2, $3)`,
        [newRefresh.jti, user.id, newRefresh.expiresAt],
      );
      await query('COMMIT');
    } catch (txErr) {
      await query('ROLLBACK');
      throw txErr;
    }

    // ── Issue new cookies ──────────────────────────────────────────────────
    const response = NextResponse.json({
      user: { userId: user.id, email: user.email, name: user.name },
    });

    response.cookies.set(COOKIE_NAME, accessToken, COOKIE_OPTIONS);
    response.cookies.set(REFRESH_COOKIE_NAME, newRefresh.token, REFRESH_COOKIE_OPTIONS);

    return response;
  } catch (err) {
    console.error('[POST /api/auth/refresh]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
