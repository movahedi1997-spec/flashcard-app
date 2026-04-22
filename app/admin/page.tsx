import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken, ADMIN_COOKIE } from '@/lib/adminAuth';
import { query } from '@/lib/db';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

async function getStats() {
  const [
    totalRow, proRow, bannedRow, decksRow, cardsRow,
    timelineRows, activeDay, activeWeek, activeMonth,
    aiCardsRow, aiRegenRow, pendingReportsRow, recentUsers,
  ] = await Promise.all([
    query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users'),
    query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM users WHERE COALESCE(is_pro, false) = true`),
    query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM users WHERE COALESCE(is_banned, false) = true`),
    query<{ count: string }>('SELECT COUNT(*)::text AS count FROM decks'),
    query<{ count: string }>('SELECT COUNT(*)::text AS count FROM cards'),
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
    query<{ count: string }>(
      `SELECT COALESCE(SUM(cards_generated), 0)::text AS count FROM ai_usage
       WHERE month = TO_CHAR(NOW(), 'YYYY-MM')`,
    ),
    query<{ count: string }>(
      `SELECT COALESCE(SUM(count), 0)::text AS count FROM ai_regen_usage
       WHERE month = TO_CHAR(NOW(), 'YYYY-MM')`,
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM deck_reports WHERE status = 'pending'`,
    ),
    query<{ id: string; name: string; email: string; created_at: string; is_pro: boolean }>(
      `SELECT id, name, email, TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') AS created_at,
              COALESCE(is_pro, false) AS is_pro
       FROM users ORDER BY created_at DESC LIMIT 10`,
    ),
  ]);

  const total = parseInt(totalRow.rows[0]?.count ?? '0', 10);

  const dailyMap = new Map<string, number>();
  for (const r of timelineRows.rows) {
    dailyMap.set(r.date, parseInt(r.new_users, 10));
  }

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
    proUsers:       parseInt(proRow.rows[0]?.count ?? '0', 10),
    bannedUsers:    parseInt(bannedRow.rows[0]?.count ?? '0', 10),
    totalDecks:     parseInt(decksRow.rows[0]?.count ?? '0', 10),
    totalCards:     parseInt(cardsRow.rows[0]?.count ?? '0', 10),
    activeDay:      parseInt(activeDay.rows[0]?.count ?? '0', 10),
    activeWeek:     parseInt(activeWeek.rows[0]?.count ?? '0', 10),
    activeMonth:    parseInt(activeMonth.rows[0]?.count ?? '0', 10),
    aiCardsMonth:   parseInt(aiCardsRow.rows[0]?.count ?? '0', 10),
    aiRegenMonth:   parseInt(aiRegenRow.rows[0]?.count ?? '0', 10),
    pendingReports: parseInt(pendingReportsRow.rows[0]?.count ?? '0', 10),
    timeline:       days,
    recentUsers:    recentUsers.rows,
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
