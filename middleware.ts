import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.ACCESS_JWT_SECRET ?? 'dev-access-secret-change-in-production-32x',
);

type TokenStatus = 'valid' | 'expired' | 'invalid';

async function checkToken(token: string): Promise<TokenStatus> {
  try {
    await jwtVerify(token, secret, { algorithms: ['HS256'] });
    return 'valid';
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'ERR_JWT_EXPIRED'
    ) {
      return 'expired';
    }
    return 'invalid';
  }
}

// ── Admin subdomain routing ───────────────────────────────────────────────────
// Requests to admin.flashcardai.app (or admin.localhost in dev) are internally
// rewritten to /admin/* so they're served by app/admin/ without a separate
// deployment. The original URL is preserved for the browser.

function isAdminHost(req: NextRequest): boolean {
  // Admin subdomain is production-only — disabled in local dev mode
  if (process.env.NEXT_PUBLIC_LOCAL_MODE === 'true') return false;
  const host = req.headers.get('host') ?? '';
  return host.startsWith('admin.');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin subdomain ───────────────────────────────────────────────────────
  if (isAdminHost(request)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.next();
    }

    // Already an /admin/* path (e.g. after a server-side redirect) — serve directly
    if (pathname.startsWith('/admin')) {
      return NextResponse.next();
    }

    // Rewrite / → /admin, /login → /admin/login, etc.
    const adminPath = pathname === '/' ? '/admin' : `/admin${pathname}`;
    const url = request.nextUrl.clone();
    url.pathname = adminPath;
    return NextResponse.rewrite(url);
  }

  // ── Regular app ───────────────────────────────────────────────────────────
  const token = request.cookies.get('token')?.value;

  // Protect /dashboard, /flashcards, and /settings
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/flashcards') ||
    pathname.startsWith('/settings')
  ) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const status = await checkToken(token);

    if (status === 'valid') {
      return NextResponse.next();
    }

    if (status === 'expired') {
      const refreshUrl = new URL('/api/auth/silent-refresh', request.url);
      refreshUrl.searchParams.set('next', pathname + request.nextUrl.search);
      return NextResponse.redirect(refreshUrl);
    }

    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect already-logged-in users away from auth pages
  if (pathname === '/login' || pathname === '/signup') {
    if (token && (await checkToken(token)) === 'valid') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Regular app protected routes + auth pages
    '/dashboard/:path*',
    '/flashcards/:path*',
    '/settings/:path*',
    '/login',
    '/signup',
    // Catch all paths so admin subdomain routing fires on every request
    '/((?!_next/static|_next/image|favicon.ico|icons|uploads|.*\\.png$).*)',
  ],
};
