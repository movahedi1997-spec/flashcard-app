/**
 * POST /api/auth/login
 *
 * Validates credentials, then:
 *   • If email not verified → resend OTP, return { requires_verification: true }
 *   • If 2FA enabled        → send OTP, return { requires_otp: true }
 *   • Otherwise             → issue full session cookies immediately
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
  signOtpSession,
  OTP_SESSION_COOKIE,
  OTP_SESSION_COOKIE_OPTIONS,
  getClientIp,
} from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { storeAndSendOtp } from '@/lib/otp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`login:${ip}`);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const { email, password } = body ?? {};

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password are required.' }, { status: 400 });
  }
  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const result = await query<{
      id: string;
      name: string;
      email: string;
      password_hash: string;
      email_verified: boolean;
      two_fa_enabled: boolean;
    }>(
      `SELECT id, name, email, password_hash,
              COALESCE(email_verified, false) AS email_verified,
              COALESCE(two_fa_enabled, true)  AS two_fa_enabled
         FROM users WHERE email = $1`,
      [normalizedEmail],
    );

    const user = result.rows[0];
    const dummyHash = '$2b$10$invalidhashfortimingattackprevention000000000000000';
    const hashToCompare = user?.password_hash ?? dummyHash;
    const match = await bcrypt.compare(password, hashToCompare);

    if (!user || !match) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Silent hash upgrade
    if (bcrypt.getRounds(user.password_hash) > 10) {
      bcrypt.hash(password, 10)
        .then((h) => query('UPDATE users SET password_hash=$1 WHERE id=$2', [h, user.id]))
        .catch(() => {});
    }

    // ── Email not verified → resend verification OTP ──────────────────────────
    if (!user.email_verified) {
      await storeAndSendOtp(user.id, 'email_verification', user.email, user.name);
      const otpToken = await signOtpSession(user.id, 'email_verification');
      const res = NextResponse.json({ requires_verification: true });
      res.cookies.set(OTP_SESSION_COOKIE, otpToken, OTP_SESSION_COOKIE_OPTIONS);
      return res;
    }

    // ── 2FA enabled → send login OTP ─────────────────────────────────────────
    if (user.two_fa_enabled) {
      await storeAndSendOtp(user.id, 'login_2fa', user.email, user.name);
      const otpToken = await signOtpSession(user.id, 'login_2fa');
      const res = NextResponse.json({ requires_otp: true });
      res.cookies.set(OTP_SESSION_COOKIE, otpToken, OTP_SESSION_COOKIE_OPTIONS);
      return res;
    }

    // ── No 2FA → issue full session ───────────────────────────────────────────
    return issueSession(user);
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function issueSession(user: { id: string; name: string; email: string }) {
  const [accessToken, refresh] = await Promise.all([
    signAccessToken({ userId: user.id, email: user.email, name: user.name }),
    signRefreshToken(user.id),
  ]);

  await query(
    `INSERT INTO refresh_tokens (jti, user_id, expires_at) VALUES ($1, $2, $3)`,
    [refresh.jti, user.id, refresh.expiresAt],
  );

  const response = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email },
  });
  response.cookies.set(COOKIE_NAME, accessToken, COOKIE_OPTIONS);
  response.cookies.set(REFRESH_COOKIE_NAME, refresh.token, REFRESH_COOKIE_OPTIONS);
  // Clear any leftover OTP session cookie
  response.cookies.set('otp_session', '', { maxAge: 0, path: '/' });
  return response;
}
