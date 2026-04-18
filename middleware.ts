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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
      // Access token expired — try to silently refresh using the refresh_token
      // cookie (which the silent-refresh route can read because it's under /api/auth).
      const refreshUrl = new URL('/api/auth/silent-refresh', request.url);
      refreshUrl.searchParams.set('next', pathname + request.nextUrl.search);
      return NextResponse.redirect(refreshUrl);
    }

    // Invalid signature or other JWT error — force re-login
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
  matcher: ['/dashboard/:path*', '/flashcards/:path*', '/settings/:path*', '/login', '/signup'],
};
