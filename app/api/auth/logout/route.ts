/**
 * POST /api/auth/logout
 * Terminates the session by revoking the refresh token in the DB and clearing
 * both HTTP-only cookies.
 *
 * TASK-005 additions:
 *   • Reads the `refresh_token` cookie, verifies it, and marks the jti as
 *     revoked in `refresh_tokens` — prevents the token from being used to
 *     silently re-authenticate after logout.
 *   • Clears both `token` (access) and `refresh_token` cookies.
 *   • Always returns 200 — safe to call even when not authenticated.
 *
 * Response 200: { message: 'Logged out.' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  verifyRefreshToken,
} from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // ── Attempt to revoke the refresh token ───────────────────────────────────
  // We do this on a best-effort basis — if the cookie is missing, malformed,
  // or already expired we still complete the logout (clear the cookies).
  const rawRefresh = req.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (rawRefresh) {
    const refreshPayload = await verifyRefreshToken(rawRefresh);
    if (refreshPayload?.jti) {
      // Mark jti revoked — silently ignore DB errors so logout always succeeds
      await query(
        `UPDATE refresh_tokens
            SET revoked = true
          WHERE jti = $1
            AND revoked = false`,
        [refreshPayload.jti],
      ).catch((err) => console.error('[POST /api/auth/logout] revoke error:', err));
    }
  }

  // ── Clear both cookies ─────────────────────────────────────────────────────
  const response = NextResponse.json({ message: 'Logged out.' });

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

  return response;
}
