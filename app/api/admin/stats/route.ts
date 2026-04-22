import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/adminAuth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const isAdmin = await getAdminUser(req);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [
      totalUsers, proUsers, bannedUsers,
      totalDecks, totalCards,
      activeDay, activeWeek, activeMonth,
      aiUsageMonth, aiRegenMonth,
      pendingReports,
      timelineRows, recentUsers,
    ] = await Promise.all([
      query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users'),
      query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users WHERE is_pro=true'),
      query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users WHERE COALESCE(is_banned,false)=true'),
      query<{ count: string }>('SELECT COUNT(*)::text AS count FROM decks'),
      query<{ count: string }>('SELECT COUNT(*)::text AS count FROM cards'),
      query<{ count: string }>(
        `SELECT COUNT(DISTINCT user_id)::text AS count FROM review_log WHERE reviewed_at >= NOW() - INTERVAL '1 day'`,
      ),
      query<{ count: string }>(
        `SELECT COUNT(DISTINCT user_id)::text AS count FROM review_log WHERE reviewed_at >= NOW() - INTERVAL '7 days'`,
      ),
      query<{ count: string }>(
        `SELECT COUNT(DISTINCT user_id)::text AS count FROM review_log WHERE reviewed_at >= NOW() - INTERVAL '30 days'`,
      ),
      query<{ total: string }>(
        `SELECT COALESCE(SUM(cards_generated),0)::text AS total FROM ai_usage WHERE month=$1`,
        [new Date().toISOString().slice(0, 7)],
      ),
      query<{ total: string }>(
        `SELECT COALESCE(SUM(count),0)::text AS total FROM ai_regen_usage WHERE month=$1`,
        [new Date().toISOString().slice(0, 7)],
      ),
      query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM deck_reports WHERE status='pending'`,
      ),
      query<{ date: string; new_users: string }>(
        `SELECT TO_CHAR(DATE(created_at),'YYYY-MM-DD') AS date, COUNT(*)::text AS new_users
         FROM users WHERE created_at >= NOW() - INTERVAL '60 days'
         GROUP BY DATE(created_at) ORDER BY DATE(created_at)`,
      ),
      query<{ name: string; email: string; is_pro: boolean; created_at: string }>(
        `SELECT name, email, COALESCE(is_pro,false) AS is_pro,
                TO_CHAR(created_at,'YYYY-MM-DD HH24:MI') AS created_at
         FROM users ORDER BY created_at DESC LIMIT 10`,
      ),
    ]);

    // Build cumulative growth timeline
    const dailyMap = new Map<string, number>();
    for (const r of timelineRows.rows) dailyMap.set(r.date, parseInt(r.new_users, 10));
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

    return NextResponse.json({
      total:          parseInt(totalUsers.rows[0]?.count   ?? '0', 10),
      proUsers:       parseInt(proUsers.rows[0]?.count     ?? '0', 10),
      bannedUsers:    parseInt(bannedUsers.rows[0]?.count  ?? '0', 10),
      totalDecks:     parseInt(totalDecks.rows[0]?.count   ?? '0', 10),
      totalCards:     parseInt(totalCards.rows[0]?.count   ?? '0', 10),
      activeDay:      parseInt(activeDay.rows[0]?.count    ?? '0', 10),
      activeWeek:     parseInt(activeWeek.rows[0]?.count   ?? '0', 10),
      activeMonth:    parseInt(activeMonth.rows[0]?.count  ?? '0', 10),
      aiCardsMonth:   parseInt(aiUsageMonth.rows[0]?.total ?? '0', 10),
      aiRegenMonth:   parseInt(aiRegenMonth.rows[0]?.total ?? '0', 10),
      pendingReports: parseInt(pendingReports.rows[0]?.count ?? '0', 10),
      timeline:       days,
      recentUsers:    recentUsers.rows,
    });
  } catch (err) {
    console.error('[GET /api/admin/stats]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
