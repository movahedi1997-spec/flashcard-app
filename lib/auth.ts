/**
 * lib/auth.ts
 * JWT utilities using `jose` (works in both Node.js and Edge runtimes).
 *
 * Token lifecycle (TASK-005 — auth hardening):
 *
 *   ACCESS TOKEN  — short-lived (15 min), stored in HTTP-only cookie `token`.
 *                   Scoped to path `/` so every API route can read it.
 *
 *   REFRESH TOKEN — long-lived (30 days), stored in HTTP-only cookie `refresh_token`.
 *                   Scoped to path `/api/auth` so only auth endpoints receive it.
 *                   Contains a `jti` (UUID) that is stored in the `refresh_tokens` DB
 *                   table; revoked on rotation or logout, enabling token theft detection.
 *
 * Rotation protocol:
 *   1. Client calls POST /api/auth/refresh with the refresh_token cookie.
 *   2. Server verifies JWT signature + checks jti is not revoked in DB.
 *   3. Server marks old jti as revoked, inserts new jti, issues new token pair.
 *   4. If a revoked jti is re-presented → all user sessions are invalidated (theft signal).
 */

import { SignJWT, jwtVerify } from 'jose';
import { randomUUID } from 'crypto';
import type { NextRequest } from 'next/server';

// ─── Secrets ─────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  if (!process.env.ACCESS_JWT_SECRET)  throw new Error('ACCESS_JWT_SECRET must be set in production');
  if (!process.env.REFRESH_JWT_SECRET) throw new Error('REFRESH_JWT_SECRET must be set in production');
}

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.ACCESS_JWT_SECRET ?? 'dev-access-secret-change-in-production-32x',
);

const REFRESH_SECRET = new TextEncoder().encode(
  process.env.REFRESH_JWT_SECRET ?? 'dev-refresh-secret-change-in-production',
);

// ─── Types ───────────────────────────────────────────────────────────────────

/** Claims embedded in the short-lived access token. */
export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
}

/** Claims embedded in the long-lived refresh token. */
export interface RefreshPayload {
  userId: string;
  jti: string; // UUID — stored in DB for revocation
}

// ─── Access token cookie ──────────────────────────────────────────────────────

export const COOKIE_NAME = 'token';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60, // 30 days — JWT inside expires in 15 min; middleware triggers silent-refresh
  path: '/',
};

// ─── Refresh token cookie ─────────────────────────────────────────────────────

export const REFRESH_COOKIE_NAME = 'refresh_token';

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60, // 30 days
  // Scoped to auth endpoints only — browser will not send this cookie
  // to /api/decks, /api/cards, etc., reducing the attack surface.
  path: '/api/auth',
};

// ─── Access token operations ──────────────────────────────────────────────────

/**
 * signAccessToken — issues a 15-minute JWT containing the user's identity.
 * Stored in the `token` HTTP-only cookie on every login, register, or refresh.
 */
export async function signAccessToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(ACCESS_SECRET);
}

/**
 * verifyAccessToken — validates the access JWT.
 * Returns the decoded payload or null if missing, malformed, or expired.
 */
export async function verifyAccessToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    return {
      userId: payload['userId'] as string,
      email: payload['email'] as string,
      name: payload['name'] as string,
    };
  } catch {
    return null;
  }
}

// ─── Refresh token operations ─────────────────────────────────────────────────

/**
 * signRefreshToken — issues a 30-day refresh JWT.
 *
 * Returns the signed token string AND the jti (UUID) so the caller can
 * persist the jti in the `refresh_tokens` DB table for revocation tracking.
 *
 * The raw token is NEVER stored in the DB — only the jti.
 */
export async function signRefreshToken(userId: string): Promise<{
  token: string;
  jti: string;
  expiresAt: Date;
}> {
  const jti = randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const token = await new SignJWT({ userId, jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setJti(jti)
    .setExpirationTime('30d')
    .sign(REFRESH_SECRET);

  return { token, jti, expiresAt };
}

/**
 * verifyRefreshToken — validates the refresh JWT signature and expiry.
 * Does NOT check DB revocation — callers must do that themselves after this.
 */
export async function verifyRefreshToken(token: string): Promise<RefreshPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return {
      userId: payload['userId'] as string,
      jti: payload['jti'] as string,
    };
  } catch {
    return null;
  }
}

// ─── Request helpers ──────────────────────────────────────────────────────────

/**
 * getAuthUser — reads the access token cookie from a NextRequest and verifies it.
 * Returns the decoded payload or null if unauthenticated / token expired.
 *
 * Use at the top of every protected route handler:
 *
 * @example
 *   const user = await getAuthUser(req);
 *   if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
 */
export async function getAuthUser(req: NextRequest): Promise<JwtPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

/**
 * getClientIp — extracts the real client IP from request headers.
 * Used by the rate limiter. Prefers x-forwarded-for (set by proxies/CDNs),
 * falls back to x-real-ip, then 'unknown'.
 *
 * SECURITY NOTE: x-forwarded-for is client-controlled and can be spoofed unless
 * the deployment platform strips and rewrites it at the edge (e.g. Vercel's
 * x-vercel-forwarded-for). The extracted value is validated as a well-formed
 * IPv4/IPv6 address before use; malformed values fall back to 'unknown'.
 * For multi-instance hardening see FINDING-07 in dev/decisions.md.
 */
export function getClientIp(req: NextRequest): string {
  const raw =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';
  return isValidIp(raw) ? raw : 'unknown';
}

// ─── OTP session (short-lived, bridges password-check → OTP-check) ───────────

export const OTP_SESSION_COOKIE = 'otp_session';

export const OTP_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 15 * 60, // 15 minutes — just long enough to enter the code
  path: '/',
};

export async function signOtpSession(userId: string, purpose: string): Promise<string> {
  return new SignJWT({ userId, purpose, type: 'otp_session' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(ACCESS_SECRET);
}

export async function verifyOtpSession(
  token: string,
): Promise<{ userId: string; purpose: string } | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    if (payload['type'] !== 'otp_session') return null;
    return {
      userId:  payload['userId']  as string,
      purpose: payload['purpose'] as string,
    };
  } catch {
    return null;
  }
}

/** Returns true for well-formed IPv4 or IPv6 addresses. */
function isValidIp(value: string): boolean {
  // IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) {
    return value.split('.').every((octet) => parseInt(octet, 10) <= 255);
  }
  // IPv6 (simplified: presence of colons and valid hex chars)
  if (/^[0-9a-fA-F:]+$/.test(value) && value.includes(':')) return true;
  return false;
}

