/**
 * POST /api/auth/register
 *
 * Creates a new user (email_verified=false) and sends a 6-digit OTP.
 * Returns { requires_verification: true } — NO session cookies yet.
 * Cookies are issued after the user verifies their email at POST /api/auth/verify-otp.
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import {
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
  const rl = checkRateLimit(`register:${ip}`);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const { name, email, password, coppa_verified } = body ?? {};

  if (coppa_verified !== true) {
    return NextResponse.json(
      { error: 'Age verification required.', code: 'COPPA_NOT_VERIFIED' },
      { status: 400 },
    );
  }

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'name, email, and password are required.' }, { status: 400 });
  }
  if (typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json({ error: 'Name must be at least 2 characters.' }, { status: 400 });
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }
  if (/^(.)\1+$/.test(password)) {
    return NextResponse.json({ error: 'Password is too weak.' }, { status: 400 });
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9!@#$%^&*()\-_=+[\]{}|;:'",.<>?/\\`~]/.test(password)) {
    return NextResponse.json(
      { error: 'Password must contain at least one letter and one number or symbol.' },
      { status: 400 },
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if ((existing.rowCount ?? 0) > 0) {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query<{ id: string; name: string; email: string }>(
      `INSERT INTO users (name, email, password_hash, coppa_verified, email_verified, two_fa_enabled)
       VALUES ($1, $2, $3, true, false, true)
       RETURNING id, name, email`,
      [name.trim(), normalizedEmail, passwordHash],
    );
    const user = result.rows[0];

    // Generate + send OTP
    await storeAndSendOtp(user.id, 'email_verification', user.email, user.name);

    // Issue a short-lived OTP session cookie so the verify page knows who's verifying
    const otpSessionToken = await signOtpSession(user.id, 'email_verification');

    const response = NextResponse.json({ requires_verification: true }, { status: 201 });
    response.cookies.set(OTP_SESSION_COOKIE, otpSessionToken, OTP_SESSION_COOKIE_OPTIONS);
    return response;
  } catch (err) {
    console.error('[POST /api/auth/register]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
