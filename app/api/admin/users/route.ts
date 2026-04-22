/**
 * GET /api/admin/users?q=&limit=50&offset=0
 * Returns user list with warning count, ban status, subscription status.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/adminAuth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const isAdmin = await getAdminUser(req);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q      = searchParams.get('q') ?? '';
  const limit  = Math.min(100, parseInt(searchParams.get('limit') ?? '50', 10));
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  const rows = await query<{
    id: string; name: string; email: string; is_pro: boolean; is_banned: boolean;
    subscription_status: string | null; registration_ip: string | null;
    last_known_ip: string | null; phone_number: string | null;
    warning_count: string; created_at: string;
  }>(
    `SELECT
       u.id, u.name, u.email, u.is_pro,
       COALESCE(u.is_banned, false) AS is_banned,
       u.subscription_status, u.registration_ip, u.last_known_ip, u.phone_number,
       COUNT(w.id)::text AS warning_count,
       TO_CHAR(u.created_at, 'YYYY-MM-DD') AS created_at
     FROM users u
     LEFT JOIN user_warnings w ON w.user_id = u.id
     WHERE ($1 = '' OR u.name ILIKE $2 OR u.email ILIKE $2)
     GROUP BY u.id
     ORDER BY u.created_at DESC
     LIMIT $3 OFFSET $4`,
    [q, `%${q}%`, limit, offset],
  );

  const countRow = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM users WHERE ($1 = '' OR name ILIKE $2 OR email ILIKE $2)`,
    [q, `%${q}%`],
  );

  return NextResponse.json({
    users: rows.rows,
    total: parseInt(countRow.rows[0]?.count ?? '0', 10),
  });
}
