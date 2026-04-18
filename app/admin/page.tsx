import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken, ADMIN_COOKIE } from '@/lib/adminAuth';
import { query } from '@/lib/db';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

async function getStats() {
  const [totalRow, timelineRows, activeDay, activeWeek, activeMonth, recentUsers] =
    await Promise.all([
      query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users'),
      query<{ date: string; new_users: string }>(
        `SELECT
           TO_CHAR(DATE(created_at), 'YYYY-MM-DD') AS date,
           COUNT(*)::text AS new_users
         FROM users
         WHERE created_at >= NOW() - INTERVAL '60 days'
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at)`,
      ),
      query<{ count: string }>(
        `SELECT COUNT(DISTINCT user_id)::text AS count FROM review_log WHERE reviewed_at >= NOW() - INTERVAL '1 day'`,
      ),
      query<{ count: string }>(
        `SELECT COUNT(DISTINCT user_id)::text AS count FROM review_log WHERE reviewed_at >= NOW() - INTERVAL '7 days'`,
      ),
      query<{ count: string }>(
        `SELECT COUNT(DISTINCT user_id)::text AS count FROM review_log WHERE reviewed_at >= NOW() - INTERVAL '30 days'`,
      ),
      query<{ name: string; email: string; created_at: string }>(
        `SELECT name, email, TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') AS created_at
         FROM users ORDER BY created_at DESC LIMIT 10`,
      ),
    ]);

  const total = parseInt(totalRow.rows[0]?.count ?? '0', 10);

  // Build cumulative timeline: fill every day in the last 60 days
  const dailyMap = new Map<string, number>();
  for (const r of timelineRows.rows) {
    dailyMap.set(r.date, parseInt(r.new_users, 10));
  }

  // Count users registered before the 60-day window
  const olderRow = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM users WHERE created_at < NOW() - INTERVAL '60 days'`,
  );
  const olderCount = parseInt(olderRow.rows[0]?.count ?? '0', 10);

  const days: { date: string; total: number }[] = [];
  let running = olderCount;
  for (let i = 59; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toISOString().slice(0, 10);
    running += dailyMap.get(label) ?? 0;
    days.push({ date: label, total: running });
  }

  return {
    total,
    activeDay: parseInt(activeDay.rows[0]?.count ?? '0', 10),
    activeWeek: parseInt(activeWeek.rows[0]?.count ?? '0', 10),
    activeMonth: parseInt(activeMonth.rows[0]?.count ?? '0', 10),
    timeline: days,
    recentUsers: recentUsers.rows,
  };
}

export default async function AdminPage() {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;

  if (!token || !(await verifyAdminToken(token))) {
    redirect('/admin/login');
  }

  const stats = await getStats();

  return <AdminDashboardClient stats={stats} />;
}
