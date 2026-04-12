/**
 * POST /api/auth/register
 * Creates a new user account, hashes the password, issues an HTTP-only JWT cookie.
 *
 * Body: { name: string, email: string, password: string }
 * Response 201: { user: { id, name, email } }
 * Response 400: validation error
 * Response 409: email already exists
 * Response 500: internal error
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signToken, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth';

// Force Node.js runtime — pg and bcryptjs require it
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Parse body safely
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const { name, email, password } = body ?? {};

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!name || !email || !password) {
    return NextResponse.json(
      { error: 'name, email, and password are required.' },
      { status: 400 },
    );
  }
  if (typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json(
      { error: 'Name must be at least 2 characters.' },
      { status: 400 },
    );
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: 'A valid email address is required.' },
      { status: 400 },
    );
  }
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 },
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // ── Duplicate check ────────────────────────────────────────────────────────
    const existing = await query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail],
    );
    if ((existing.rowCount ?? 0) > 0) {
      return NextResponse.json(
        { error: 'An account with that email already exists.' },
        { status: 409 },
      );
    }

    // ── Hash + insert ──────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await query<{ id: string; name: string; email: string }>(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name.trim(), normalizedEmail, passwordHash],
    );

    const user = result.rows[0];

    // ── Issue JWT cookie ───────────────────────────────────────────────────────
    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json(
      { user: { id: user.id, name: user.name, email: user.email } },
      { status: 201 },
    );
    response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);

    return response;
  } catch (err) {
    console.error('[POST /api/auth/register]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
