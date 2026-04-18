import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';

// ── Startup validation ────────────────────────────────────────────────────────
// In production all three env vars are REQUIRED. The server will refuse to start
// (first admin request throws) rather than silently fall back to insecure defaults
// that are visible in the public git repository.

function requireEnvInProd(key: string, devFallback: string): string {
  const val = process.env[key];
  if (val) return val;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `[adminAuth] ${key} environment variable is required in production. ` +
      `Set it in your server environment / .env file and restart.`,
    );
  }
  return devFallback;
}

const ADMIN_SECRET = new TextEncoder().encode(
  requireEnvInProd('ADMIN_JWT_SECRET', 'admin-dev-secret-local-only-not-for-production'),
);

const ADMIN_USERNAME = requireEnvInProd('ADMIN_USERNAME', 'admin');
const ADMIN_PASSWORD = requireEnvInProd('ADMIN_PASSWORD', 'admin-dev-password-local-only');

export const ADMIN_COOKIE = 'admin_token';

export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 8 * 60 * 60, // 8 hours
  path: '/',
};

export function checkAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
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
