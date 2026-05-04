import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

const secret = new TextEncoder().encode(
  process.env.ACCESS_JWT_SECRET ?? 'dev-access-secret-change-in-production-32x',
);

const intlMiddleware = createMiddleware(routing);

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
function isAdminHost(req: NextRequest): boolean {
  if (process.env.NEXT_PUBLIC_LOCAL_MODE === 'true') return false;
  const host = req.headers.get('host') ?? '';
  return host.startsWith('admin.');
}

// Protected path segments (after optional locale prefix)
const PROTECTED_SEGMENTS = ['/dashboard', '/flashcards', '/settings'];

function isProtected(pathname: string): boolean {
  const stripped = pathname.replace(/^\/(en|de|fr|es|fa)/, '');
  return PROTECTED_SEGMENTS.some((p) => stripped.startsWith(p));
}

function isAuthPage(pathname: string): boolean {
  const stripped = pathname.replace(/^\/(en|de|fr|es|fa)/, '');
  return stripped === '/login' || stripped === '/signup';
}

function localePrefix(pathname: string): string {
  const m = pathname.match(/^\/(en|de|fr|es|fa)(\/|$)/);
  return m ? `/${m[1]}` : '';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin subdomain ───────────────────────────────────────────────────────
  if (isAdminHost(request)) {
    if (pathname.startsWith('/api/')) return NextResponse.next();
    if (pathname.startsWith('/admin')) return NextResponse.next();
    const adminPath = pathname === '/' ? '/admin' : `/admin${pathname}`;
    const url = request.nextUrl.clone();
    url.pathname = adminPath;
    return NextResponse.rewrite(url);
  }

  // ── Skip i18n + auth for API and admin routes ─────────────────────────────
  if (pathname.startsWith('/api/') || pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // ── Cookie-based locale redirect (persists user's explicit language choice) ─
  const savedLocale = request.cookies.get('NEXT_LOCALE')?.value;
  const hasLocalePrefix = /^\/(en|de|fr|es|fa)(\/|$)/.test(pathname);
  // Static public files (SW, workbox chunks, manifest, images…) must never be redirected
  const STATIC_EXT_RE = /\.(?:js|mjs|json|svg|jpg|jpeg|ico|txt|xml|webp|woff2?|ttf|map|css)$/i;
  if (
    !hasLocalePrefix &&
    savedLocale &&
    savedLocale !== routing.defaultLocale &&
    (routing.locales as readonly string[]).includes(savedLocale) &&
    !STATIC_EXT_RE.test(pathname)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/${savedLocale}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url, { status: 302 });
  }

  // ── Run next-intl middleware first (sets x-next-intl-locale header) ────────
  const intlResponse = intlMiddleware(request);

  // ── Auth guard on protected routes ────────────────────────────────────────
  if (isProtected(pathname)) {
    const token = request.cookies.get('token')?.value;
    const prefix = localePrefix(pathname);
    const loginUrl = new URL(`${prefix}/login`, request.url);

    if (!token) return NextResponse.redirect(loginUrl);

    const status = await checkToken(token);
    if (status === 'valid') return intlResponse ?? NextResponse.next();

    if (status === 'expired') {
      const refreshUrl = new URL('/api/auth/silent-refresh', request.url);
      refreshUrl.searchParams.set('next', pathname + request.nextUrl.search);
      return NextResponse.redirect(refreshUrl);
    }

    return NextResponse.redirect(loginUrl);
  }

  // ── Redirect logged-in users away from auth pages ─────────────────────────
  if (isAuthPage(pathname)) {
    const token = request.cookies.get('token')?.value;
    if (token && (await checkToken(token)) === 'valid') {
      const prefix = localePrefix(pathname);
      return NextResponse.redirect(new URL(`${prefix}/flashcards`, request.url));
    }
  }

  return intlResponse ?? NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|icons|uploads|.*\\.(?:png|jpg|jpeg|svg|js|mjs|json|webp|woff2?|ttf|map|css|ico|txt|xml)$).*)',
  ],
};
