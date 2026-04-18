/**
 * POST /api/auth/resend-otp
 * Resends the OTP for the current otp_session.
 * Rate-limited to 3 resends per 5 minutes per user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyOtpSession, OTP_SESSION_COOKIE } from '@/lib/auth';
import { storeAndSendOtp } from '@/lib/otp';
import { checkRateLimit } from '@/lib/rateLimit';
import type { OtpPurpose } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get(OTP_SESSION_COOKIE)?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
  }

  const session = await verifyOtpSession(sessionToken);
  if (!session) {
    return NextResponse.json({ error: 'Session invalid or expired.' }, { status: 401 });
  }

  const rl = checkRateLimit(`resend-otp:${session.userId}`, 3, 5 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many resend attempts. Please wait a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const userResult = await query<{ name: string; email: string }>(
    `SELECT name, email FROM users WHERE id = $1`,
    [session.userId],
  );
  const user = userResult.rows[0];
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  await storeAndSendOtp(session.userId, session.purpose as OtpPurpose, user.email, user.name);

  return NextResponse.json({ sent: true });
}
