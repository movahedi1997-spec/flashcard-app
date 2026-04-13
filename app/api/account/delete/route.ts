/**
 * POST /api/account/delete
 * Permanently deletes the authenticated user's account and ALL associated data.
 *
 * GDPR compliance (TASK-005 / TASK-022):
 *   • Cascade deletes are enforced at the DB schema level (ON DELETE CASCADE):
 *       users → decks → cards → srs_state
 *       users → srs_state, ai_usage, refresh_tokens (direct CASCADE)
 *   • Deleting the `users` row is therefore sufficient — no manual child-table
 *     cleanup required. This prevents data orphan bugs if new tables are added later.
 *   • The deletion is logged to the console (and should be piped to your audit
 *     log / Sentry in production) for the GDPR Article 17 audit trail.
 *   • Requires password confirmation to prevent CSRF-driven accidental deletions.
 *   • Rate limited at 3 attempts / 15 min per IP to resist credential-stuffing
 *     attacks targeting account takeover via deletion.
 *
 * Body: { password: string }    — required for confirmation
 * Response 200: { message: 'Account deleted.' }
 * Response 400: missing password
 * Response 401: not authenticated | wrong password
 * Response 429: rate limit exceeded
 * Response 500: internal error
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import {
  getAuthUser,
  verifyRefreshToken,
  getClientIp,
  COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // ── Rate limit ─────────────────────────────────────────────────────────────
  // Tighter window for a destructive operation: 3 attempts / 15 min
  const ip = getClientIp(req);

  const rl = checkRateLimit(`account-delete:${ip}`, 3, 15 * 60 * 1000);

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

  // ── Auth check ─────────────────────────────────────────────────────────────
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const { password } = body ?? {};

  if (!password || typeof password !== 'string') {
    return NextResponse.json(
      { error: 'Password confirmation is required to delete your account.' },
      { status: 400 },
    );
  }

  try {
    // ── Password confirmation ──────────────────────────────────────────────
    // Re-fetch password_hash fresh from DB — do not trust the JWT for this.
    const userRow = await query<{ id: string; password_hash: string }>(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [authUser.userId],
    );

    if ((userRow.rowCount ?? 0) === 0) {
      // User was already deleted (race condition)
      return NextResponse.json({ error: 'Account not found.' }, { status: 401 });
    }

    const { password_hash } = userRow.rows[0];
    const match = await bcrypt.compare(password, password_hash);

    if (!match) {
      return NextResponse.json(
        { error: 'Incorrect password. Account deletion cancelled.' },
        { status: 401 },
      );
    }

    // ── Attempt to revoke active refresh token before deletion ─────────────
    // Best-effort — the CASCADE below will delete all refresh_tokens rows anyway.
    const rawRefresh = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
    if (rawRefresh) {
      const rp = await verifyRefreshToken(rawRefresh);
      if (rp?.jti) {
        await query(
          `UPDATE refresh_tokens SET revoked = true WHERE jti = $1`,
          [rp.jti],
        ).catch(() => { /* swallow — we're deleting the user anyway */ });
      }
    }

    // ── GDPR audit log (written BEFORE delete) ────────────────────────────
    // GDPR Art. 17 requires demonstrable proof of erasure. The record is written
    // before the DELETE so that a server crash between audit write and DELETE leaves
    // a visible, actionable record rather than a silent gap.
    // Stored in audit_log (durable, searchable) — see migrations/003_audit_log.sql.
    const auditMeta = JSON.stringify({
      email: authUser.email,
      ip,
      timestamp: new Date().toISOString(),
    });
    await query(
      `INSERT INTO audit_log (event, user_id, metadata)
       VALUES ('gdpr.account_deletion', $1, $2::jsonb)`,
      [authUser.userId, auditMeta],
    ).catch((auditErr) => {
      // Non-fatal: log to stderr so the aggregator captures it even if the
      // audit_log table is unavailable. The deletion proceeds regardless.
      console.error('[GDPR] Failed to write audit_log entry:', auditErr);
      console.info(
        `[GDPR] Fallback audit — user_id=${authUser.userId} email=${authUser.email} ip=${ip}`,
      );
    });

    // ── Cascade delete ─────────────────────────────────────────────────────
    // Deleting the users row triggers ON DELETE CASCADE across:
    //   decks → cards → srs_state (chained CASCADE)
    //   srs_state (direct from users)
    //   ai_usage  (direct from users)
    //   refresh_tokens (direct from users)
    await query('DELETE FROM users WHERE id = $1', [authUser.userId]);

    // ── Clear both auth cookies ────────────────────────────────────────────
    const response = NextResponse.json({
      message: 'Account deleted. All your data has been permanently removed.',
    });

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
  } catch (err) {
    console.error('[POST /api/account/delete]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
