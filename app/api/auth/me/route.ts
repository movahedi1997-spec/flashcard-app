/**
 * GET /api/auth/me
 * Returns the currently authenticated user's identity from the JWT cookie.
 * Used by client components to hydrate auth state on page load.
 *
 * Response 200: { user: { userId, email, name } }
 * Response 401: not authenticated
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      userId: user.userId,
      email: user.email,
      name: user.name,
    },
  });
}
