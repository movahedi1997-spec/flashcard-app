import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/adminAuth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const isAdmin = await getAdminUser(req);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [totalRow, timelineRows, activeDay, activeWeek, activeMonth, recentUsers] =
      await Promise.all([
        // Total accounts
        query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users'),

        // Daily signups for the last 60 days (for the growth chart)
        query<{ date: string; new_users: string }>(
          `SELECT
             TO_CHAR(DATE(created_at), 'YYYY-MM-DD') AS date,
             COUNT(*)::text AS new_users
           FROM users
           WHERE created_at >= NOW() - INTERVAL '60 days'
           GROUP BY DATE(created_at)
           ORDER BY DATE(created_at)`,
        ),

        // Active today — had at least one card review in last 24 h
        query<{ count: string }>(
          `SELECT COUNT(DISTINCT user_id)::text AS count
           FROM review_log
           WHERE reviewed_at >= NOW() - INTERVAL '1 day'`,
        ),

        // Active this week
        query<{ count: string }>(
          `SELECT COUNT(DISTINCT user_id)::text AS count
           FROM review_log
           WHERE reviewed_at >= NOW() - INTERVAL '7 days'`,
        ),

        // Active this month
        query<{ count: string }>(
          `SELECT COUNT(DISTINCT user_id)::text AS count
           FROM review_log
           WHERE reviewed_at >= NOW() - INTERVAL '30 days'`,
        ),

        // 10 most recent registrations
        query<{ name: string; email: string; created_at: string }>(
          `SELECT name, email, TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') AS created_at
           FROM users
           ORDER BY created_at DESC
           LIMIT 10`,
        ),
      ]);

    return NextResponse.json({
      total: parseInt(totalRow.rows[0]?.count ?? '0', 10),
      activeDay: parseInt(activeDay.rows[0]?.count ?? '0', 10),
      activeWeek: parseInt(activeWeek.rows[0]?.count ?? '0', 10),
      activeMonth: parseInt(activeMonth.rows[0]?.count ?? '0', 10),
      timeline: timelineRows.rows.map((r) => ({
        date: r.date,
        newUsers: parseInt(r.new_users, 10),
      })),
      recentUsers: recentUsers.rows,
    });
  } catch (err) {
    console.error('[GET /api/admin/stats]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
