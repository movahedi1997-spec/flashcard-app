import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FREE_MONTHLY_LIMIT = 200;

const secret = new TextEncoder().encode(
  process.env.ACCESS_JWT_SECRET ?? 'dev-access-secret-change-in-production-32x',
);

export async function GET() {
  const token = cookies().get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secret);
    userId = payload.userId as string;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [userRow, usageRow] = await Promise.all([
    query<{ is_pro: boolean }>('SELECT is_pro FROM users WHERE id = $1', [userId]),
    query<{ cards_generated: number }>(
      `SELECT cards_generated FROM ai_usage WHERE user_id = $1 AND month = $2`,
      [userId, new Date().toISOString().slice(0, 7)],
    ),
  ]);

  const isPro = userRow.rows[0]?.is_pro ?? false;
  const used = usageRow.rows[0]?.cards_generated ?? 0;

  return NextResponse.json({
    isPro,
    used,
    limit: isPro ? null : FREE_MONTHLY_LIMIT,
    remaining: isPro ? null : Math.max(0, FREE_MONTHLY_LIMIT - used),
  });
}
