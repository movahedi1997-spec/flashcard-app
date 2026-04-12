/**
 * lib/auth.ts
 * JWT utilities using `jose` (works in both Node.js and Edge runtimes).
 *
 * Token lifecycle:
 *  - Issued on login/register, stored in an HTTP-only cookie (7-day expiry).
 *  - Verified on every authenticated API request and server-side page render.
 *  - TASK-005 will add refresh token rotation — for now a single 7-day token
 *    is used (acceptable for Phase 1 internal testing).
 */

import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';

// ─── Secret ──────────────────────────────────────────────────────────────────

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-key-change-in-production',
);

const JWT_EXPIRES_IN = '7d';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
}

// ─── Cookie config ───────────────────────────────────────────────────────────

export const COOKIE_NAME = 'token';

/**
 * Cookie options for response.cookies.set().
 * `secure` is only enforced in production — allows plain HTTP in local dev.
 */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  path: '/',
};

// ─── Token operations ────────────────────────────────────────────────────────

/**
 * signToken — creates a signed JWT containing the user's identity claims.
 */
export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);
}

/**
 * verifyToken — validates a JWT string and returns the payload.
 * Returns null if the token is missing, malformed, or expired.
 */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload['userId'] as string,
      email: payload['email'] as string,
      name: payload['name'] as string,
    };
  } catch {
    return null;
  }
}

/**
 * getAuthUser — reads the auth cookie from a NextRequest and verifies it.
 * Returns the decoded payload or null if unauthenticated.
 *
 * Use this at the top of every protected route handler:
 *
 * @example
 *   const user = await getAuthUser(req);
 *   if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
 */
export async function getAuthUser(req: NextRequest): Promise<JwtPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
