/**
 * POST /api/auth/logout
 * Clears the HTTP-only auth cookie by setting it to expired.
 * Always returns 200 — safe to call even when not authenticated.
 *
 * Response 200: { message: 'Logged out.' }
 */

import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out.' });

  // Clear the cookie by setting maxAge to 0
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
