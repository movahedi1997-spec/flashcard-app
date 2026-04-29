import { SignJWT, jwtVerify } from 'jose';
import { timingSafeEqual, createHash } from 'crypto';
import type { NextRequest } from 'next/server';

// ── Startup validation ────────────────────────────────────────────────────────
// In production AND staging (any non-local environment) all three env vars are
// REQUIRED. The server refuses to start rather than falling back to insecure
// defaults that are visible in the public git repository.

const IS_LOCAL_DEV =
  process.env.NODE_ENV === 'development' && !process.env.RAILWAY_ENVIRONMENT &&
  !process.env.VERCEL && !process.env.FLY_APP_NAME;

function requireEnv(key: string, devFallback: string): string {
  const val = process.env[key];
  if (val) return val;
  if (!IS_LOCAL_DEV) {
    throw new Error(
      `[adminAuth] ${key} environment variable is required. ` +
      `Set it in your server environment / .env file and restart.`,
    );
  }
  console.warn(
    `\n⚠️  [adminAuth] ${key} not set — using insecure dev fallback. ` +
    `Never deploy without setting this variable.\n`,
  );
  return devFallback;
}

const ADMIN_SECRET = new TextEncoder().encode(
  requireEnv('ADMIN_JWT_SECRET', 'admin-dev-secret-local-only-not-for-production'),
);

const ADMIN_USERNAME = requireEnv('ADMIN_USERNAME', 'admin');
const ADMIN_PASSWORD = requireEnv('ADMIN_PASSWORD', 'admin-dev-password-local-only');

export const ADMIN_COOKIE = 'admin_token';

export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 8 * 60 * 60, // 8 hours
  path: '/',
};

// Timing-safe comparison prevents enumeration of valid username/password via response time.
function safeEqual(a: string, b: string): boolean {
  const bufA = createHash('sha256').update(a).digest();
  const bufB = createHash('sha256').update(b).digest();
  return timingSafeEqual(bufA, bufB);
}

export function checkAdminCredentials(username: string, password: string): boolean {
  return safeEqual(username, ADMIN_USERNAME) && safeEqual(password, ADMIN_PASSWORD);
}

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(ADMIN_SECRET);
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, ADMIN_SECRET, { algorithms: ['HS256'] });
    return true;
  } catch {
    return false;
  }
}

export async function getAdminUser(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}
