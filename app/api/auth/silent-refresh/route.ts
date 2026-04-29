/**
 * GET /api/auth/silent-refresh?next=<path>
 *
 * Called by the middleware when the access token is expired but a refresh_token
 * cookie may still be valid. Because this route lives under /api/auth, the
 * browser sends the refresh_token cookie (path-scoped to /api/auth).
 *
 * Flow:
 *   1. Verify + rotate the refresh token (same logic as POST /api/auth/refresh).
 *   2. On success → set new cookies and redirect to `next`.
 *   3. On failure → redirect to /login.
 *
 * The `next` parameter is validated to only allow known protected paths,
 * preventing open-redirect abuse.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, getDbPool } from '@/lib/db';
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
export const dynamic = 'force-dynamic';

const ALLOWED_PREFIXES = ['/dashboard', '/flashcards', '/settings'];

function sanitizeNext(raw: string | null): string {
  if (!raw) return '/dashboard';
  // Must be a relative path starting with one of the protected prefixes
  if (ALLOWED_PREFIXES.some((p) => raw.startsWith(p))) return raw;
  return '/dashboard';
}

function failRedirect(loginUrl: URL) {
  return NextResponse.redirect(loginUrl);
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const next = sanitizeNext(searchParams.get('next'));
  const loginUrl = new URL('/login', origin);

  // ── Rate limit (share the refresh bucket) ──────────────────────────────────
  const ip = getClientIp(req);
  const rl = checkRateLimit(`refresh:${ip}`);
  if (!rl.allowed) return failRedirect(loginUrl);

  // ── Read refresh token ─────────────────────────────────────────────────────
  const rawToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (!rawToken) return failRedirect(loginUrl);

  const refreshPayload = await verifyRefreshToken(rawToken);
  if (!refreshPayload) return failRedirect(loginUrl);

  const { userId, jti } = refreshPayload;

  try {
    // ── DB revocation check ────────────────────────────────────────────────
    const tokenRow = await query<{ revoked: boolean; expires_at: string }>(
      `SELECT revoked, expires_at FROM refresh_tokens WHERE jti = $1 AND user_id = $2`,
      [jti, userId],
    );
    if ((tokenRow.rowCount ?? 0) === 0) return failRedirect(loginUrl);

    const row = tokenRow.rows[0];

    if (row.revoked) {
      // Theft signal — revoke all sessions
      await query(`UPDATE refresh_tokens SET revoked = true WHERE user_id = $1`, [userId]).catch(
        () => {},
      );
      // Log hashed userId only — raw ID must not appear in shared/centralised logs.
      const idHint = userId.slice(0, 8) + '…';
      console.warn(`[SECURITY] Refresh token reuse detected (user prefix: ${idHint}) — all sessions revoked.`);
      return failRedirect(loginUrl);
    }

    if (new Date(row.expires_at) < new Date()) return failRedirect(loginUrl);

    // ── Fetch user ─────────────────────────────────────────────────────────
    const userRow = await query<{ id: string; name: string; email: string }>(
      'SELECT id, name, email FROM users WHERE id = $1',
      [userId],
    );
    if ((userRow.rowCount ?? 0) === 0) return failRedirect(loginUrl);
    const user = userRow.rows[0];

    // ── Rotate tokens ──────────────────────────────────────────────────────
    const [accessToken, newRefresh] = await Promise.all([
      signAccessToken({ userId: user.id, email: user.email, name: user.name }),
      signRefreshToken(user.id),
    ]);

    const client = await getDbPool().connect();
    try {
      await client.query('BEGIN');
      await client.query(`UPDATE refresh_tokens SET revoked = true WHERE jti = $1`, [jti]);
      await client.query(
        `INSERT INTO refresh_tokens (jti, user_id, expires_at) VALUES ($1, $2, $3)`,
        [newRefresh.jti, user.id, newRefresh.expiresAt],
      );
      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    // ── Redirect to original destination with fresh cookies ────────────────
    const response = NextResponse.redirect(new URL(next, origin));
    response.cookies.set(COOKIE_NAME, accessToken, COOKIE_OPTIONS);
    response.cookies.set(REFRESH_COOKIE_NAME, newRefresh.token, REFRESH_COOKIE_OPTIONS);
    return response;
  } catch (err) {
    console.error('[GET /api/auth/silent-refresh]', err);
    return failRedirect(loginUrl);
  }
}
