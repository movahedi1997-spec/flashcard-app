import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const secret = new TextEncoder().encode(
  process.env.ACCESS_JWT_SECRET ?? 'dev-access-secret-change-in-production-32x',
);

const VALID_REASONS = ['spam', 'harassment', 'inappropriate', 'impersonation', 'other'] as const;

export async function POST(req: NextRequest) {
  const token = cookies().get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let reporterId: string;
  try {
    const { payload } = await jwtVerify(token, secret);
    reporterId = payload.userId as string;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const { reportedUserId, reason, description } = body ?? {};

  if (!reportedUserId || typeof reportedUserId !== 'string')
    return NextResponse.json({ error: 'reportedUserId required.' }, { status: 400 });
  if (!VALID_REASONS.includes(reason as typeof VALID_REASONS[number]))
    return NextResponse.json({ error: 'Invalid reason.' }, { status: 400 });
  if (reportedUserId === reporterId)
    return NextResponse.json({ error: 'Cannot report yourself.' }, { status: 400 });

  // Verify reported user exists
  const userCheck = await query<{ id: string }>(
    'SELECT id FROM users WHERE id = $1',
    [reportedUserId],
  );
  if (!userCheck.rows[0]) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  // Rate limit: 5 reports per day per reporter
  const rateRow = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM profile_reports
     WHERE reporter_id = $1 AND created_at > NOW() - INTERVAL '1 day'`,
    [reporterId],
  );
  if (parseInt(rateRow.rows[0]?.count ?? '0', 10) >= 5)
    return NextResponse.json({ error: 'Report limit reached. Try again tomorrow.' }, { status: 429 });

  await query(
    `INSERT INTO profile_reports (reported_user_id, reporter_id, reason, description)
     VALUES ($1, $2, $3, $4)`,
    [reportedUserId, reporterId, reason, description ?? null],
  );

  return NextResponse.json({ ok: true });
}
