/**
 * PATCH /api/account/2fa
 * Body: { enabled: boolean, code?: string }
 *
 * Enabling:   no code required (just turn it on)
 * Disabling:  requires a valid OTP sent to the user's email first
 *             Call POST /api/auth/resend-otp with purpose=disable_2fa to get the code
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';
import { verifyOtp, storeAndSendOtp } from '@/lib/otp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const secret = new TextEncoder().encode(
  process.env.ACCESS_JWT_SECRET ?? 'dev-access-secret-change-in-production-32x',
);

export async function PATCH(req: NextRequest) {
  const token = cookies().get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  let userEmail: string;
  let userName: string;
  try {
    const { payload } = await jwtVerify(token, secret);
    userId    = payload.userId as string;
    userEmail = payload.email  as string;
    userName  = payload.name   as string;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const { enabled, code } = body ?? {};

  if (typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled (boolean) is required.' }, { status: 400 });
  }

  // ── Enabling 2FA — no confirmation needed ─────────────────────────────────
  if (enabled) {
    await query(`UPDATE users SET two_fa_enabled = true WHERE id = $1`, [userId]);
    return NextResponse.json({ two_fa_enabled: true });
  }

  // ── Disabling 2FA — require OTP ───────────────────────────────────────────
  if (!code) {
    // No code yet: generate and send one, return a flag so UI shows code input
    await storeAndSendOtp(userId, 'disable_2fa', userEmail, userName);
    return NextResponse.json({ requires_code: true });
  }

  if (typeof code !== 'string' || !/^\d{6}$/.test(code.trim())) {
    return NextResponse.json({ error: 'Please enter the 6-digit code.' }, { status: 400 });
  }

  const result = await verifyOtp(userId, code.trim(), 'disable_2fa');
  if (!result.valid) {
    return NextResponse.json({ error: result.error ?? 'Invalid code.' }, { status: 400 });
  }

  await query(`UPDATE users SET two_fa_enabled = false WHERE id = $1`, [userId]);
  return NextResponse.json({ two_fa_enabled: false });
}
