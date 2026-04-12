/**
 * POST /api/auth/login
 * Validates credentials and issues an HTTP-only JWT cookie on success.
 * Uses a generic error message for both "email not found" and "wrong password"
 * to prevent user enumeration attacks.
 *
 * Body: { email: string, password: string }
 * Response 200: { user: { id, name, email } }
 * Response 400: missing fields
 * Response 401: invalid credentials
 * Response 500: internal error
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signToken, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const { email, password } = body ?? {};

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!email || !password) {
    return NextResponse.json(
      { error: 'email and password are required.' },
      { status: 400 },
    );
  }
  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // ── Fetch user ─────────────────────────────────────────────────────────────
    const result = await query<{
      id: string;
      name: string;
      email: string;
      password_hash: string;
    }>(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [normalizedEmail],
    );

    const user = result.rows[0];

    // Use a constant-time compare even when user doesn't exist, to prevent
    // timing attacks that could enumerate valid email addresses.
    const dummyHash = '$2b$12$invalidhashfortimingattackprevention000000000000000';
    const hashToCompare = user?.password_hash ?? dummyHash;
    const match = await bcrypt.compare(password, hashToCompare);

    if (!user || !match) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 },
      );
    }

    // ── Issue JWT cookie ───────────────────────────────────────────────────────
    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
    });
    response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);

    return response;
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
