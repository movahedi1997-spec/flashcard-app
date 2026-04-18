import { NextRequest, NextResponse } from 'next/server';
import { checkAdminCredentials, signAdminToken, ADMIN_COOKIE, ADMIN_COOKIE_OPTIONS } from '@/lib/adminAuth';
import { checkRateLimit } from '@/lib/rateLimit';
import { getClientIp } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`admin-login:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const body = await req.json().catch(() => ({}));
  const { username, password } = body as { username?: string; password?: string };

  if (!username || !password || !checkAdminCredentials(username, password)) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
  }

  const token = await signAdminToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, ADMIN_COOKIE_OPTIONS);
  return res;
}
