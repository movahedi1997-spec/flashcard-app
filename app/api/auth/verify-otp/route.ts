/**
 * POST /api/auth/verify-otp
 * Body: { code: string }
 *
 * Reads the otp_session cookie to know which user + purpose is being verified.
 * On success:
 *   - email_verification → marks email as verified, issues full session
 *   - login_2fa          → issues full session
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  verifyOtpSession,
  OTP_SESSION_COOKIE,
} from '@/lib/auth';
import { verifyOtp } from '@/lib/otp';
import type { OtpPurpose } from '@/lib/email';
import { issueSession } from '@/app/api/auth/login/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get(OTP_SESSION_COOKIE)?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: 'Session expired. Please start again.' }, { status: 401 });
  }

  const session = await verifyOtpSession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: 'Session invalid or expired. Please start again.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const code = typeof body?.code === 'string' ? body.code.trim() : '';

  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'Please enter the 6-digit code.' }, { status: 400 });
  }

  const result = await verifyOtp(session.userId, code, session.purpose as OtpPurpose);
  if (!result.valid) {
    return NextResponse.json({ error: result.error ?? 'Invalid code.' }, { status: 400 });
  }

  // For email verification — mark the user as verified
  if (session.purpose === 'email_verification') {
    await query(
      `UPDATE users SET email_verified = true WHERE id = $1`,
      [session.userId],
    );
  }

  // Fetch user for session issuance
  const userResult = await query<{ id: string; name: string; email: string }>(
    `SELECT id, name, email FROM users WHERE id = $1`,
    [session.userId],
  );
  const user = userResult.rows[0];
  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  return issueSession(user);
}
