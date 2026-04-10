import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-key-change-in-production',
);

async function verifyToken(token: string) {
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Protect /dashboard and /flashcards
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/flashcards')) {
    if (!token || !(await verifyToken(token))) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Redirect already-logged-in users away from auth pages
  if (pathname === '/login' || pathname === '/signup') {
    if (token && (await verifyToken(token))) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/flashcards/:path*', '/login', '/signup'],
};
