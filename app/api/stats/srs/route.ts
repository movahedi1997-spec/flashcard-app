/**
 * GET /api/stats/srs
 *
 * Returns SRS health metrics for the authenticated user.
 * Response:
 * {
 *   streak: number,
 *   totalReviews: number,
 *   retentionRate: number,       // 0–100, last 30 days
 *   cardsByMaturity: {
 *     new: number,               // review_count === 0
 *     learning: number,          // review_count 1–2
 *     young: number,             // interval 1–20 days
 *     mature: number,            // interval > 20 days
 *   },
 *   forecast: Array<{ date: string; label: string; count: number }>, // next 14 days
 *   heatmap: Array<{ date: string; count: number }>,                 // last 84 days
 *   easeAvg: number,
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toISODate(d: Date) {
  return d.toISOString().split('T')[0];
}

function dayLabel(iso: string) {
  const [, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const { userId } = user;

  const [
    streakRes,
    totalRes,
    retentionRes,
    maturityRes,
    forecastRes,
    heatmapRes,
    easeRes,
  ] = await Promise.all([
    // Streak: distinct review days desc
    query<{ review_date: string }>(
      `SELECT DISTINCT DATE(reviewed_at AT TIME ZONE 'UTC')::text AS review_date
       FROM review_log WHERE user_id = $1
       ORDER BY review_date DESC LIMIT 365`,
      [userId],
    ),

    // Total reviews all time
    query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM review_log WHERE user_id = $1`,
      [userId],
    ),

    // Retention rate last 30 days (good + easy = pass)
    query<{ pass: string; total: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE grade IN ('good','easy'))::text AS pass,
         COUNT(*)::text AS total
       FROM review_log
       WHERE user_id = $1 AND reviewed_at >= NOW() - INTERVAL '30 days'`,
      [userId],
    ),

    // Cards by maturity bucket from srs_state
    query<{ new_count: string; learning_count: string; young_count: string; mature_count: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE review_count = 0)::text                   AS new_count,
         COUNT(*) FILTER (WHERE review_count BETWEEN 1 AND 2)::text       AS learning_count,
         COUNT(*) FILTER (WHERE review_count > 2 AND interval <= 20)::text AS young_count,
         COUNT(*) FILTER (WHERE interval > 20)::text                      AS mature_count
       FROM srs_state WHERE user_id = $1`,
      [userId],
    ),

    // Due forecast: cards due per day in next 7 days
    query<{ due_day: string; count: string }>(
      `SELECT DATE(due_date AT TIME ZONE 'UTC')::text AS due_day, COUNT(*)::text AS count
       FROM srs_state
       WHERE user_id = $1
         AND due_date >= NOW()
         AND due_date < NOW() + INTERVAL '7 days'
       GROUP BY due_day
       ORDER BY due_day`,
      [userId],
    ),

    // Heatmap: reviews per day last 84 days
    query<{ review_date: string; count: string }>(
      `SELECT DATE(reviewed_at AT TIME ZONE 'UTC')::text AS review_date,
              COUNT(*)::text AS count
       FROM review_log
       WHERE user_id = $1 AND reviewed_at >= NOW() - INTERVAL '84 days'
       GROUP BY review_date`,
      [userId],
    ),

    // Average ease factor
    query<{ ease_avg: string }>(
      `SELECT ROUND(AVG(ease_factor)::numeric, 2)::text AS ease_avg
       FROM srs_state WHERE user_id = $1`,
      [userId],
    ),
  ]);

  // ── Streak ───────────────────────────────────────────────────────────────────
  const dates = streakRes.rows.map((r) => r.review_date);
  let streak = 0;
  if (dates.length > 0) {
    const todayStr     = toISODate(new Date());
    const yesterdayStr = toISODate(new Date(Date.now() - 86_400_000));
    if (dates[0] === todayStr || dates[0] === yesterdayStr) {
      streak = 1;
      for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1] + 'T00:00:00Z');
        const curr = new Date(dates[i]     + 'T00:00:00Z');
        if (Math.round((prev.getTime() - curr.getTime()) / 86_400_000) === 1) streak++;
        else break;
      }
    }
  }

  // ── Retention ────────────────────────────────────────────────────────────────
  const retPass  = parseInt(retentionRes.rows[0]?.pass  ?? '0', 10);
  const retTotal = parseInt(retentionRes.rows[0]?.total ?? '0', 10);
  const retentionRate = retTotal > 0 ? Math.round((retPass / retTotal) * 100) : 0;

  // ── Maturity ─────────────────────────────────────────────────────────────────
  const m = maturityRes.rows[0];
  const cardsByMaturity = {
    new:      parseInt(m?.new_count      ?? '0', 10),
    learning: parseInt(m?.learning_count ?? '0', 10),
    young:    parseInt(m?.young_count    ?? '0', 10),
    mature:   parseInt(m?.mature_count   ?? '0', 10),
  };

  // ── Forecast (fill missing days with 0, 7-day window) ────────────────────────
  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const forecastMap = new Map(forecastRes.rows.map((r) => [r.due_day, parseInt(r.count, 10)]));
  const forecast = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + i);
    const iso = toISODate(d);
    const label = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : DAY_NAMES[d.getUTCDay()];
    return { date: iso, label, count: forecastMap.get(iso) ?? 0 };
  });

  // ── Heatmap ──────────────────────────────────────────────────────────────────
  const heatmapMap = new Map(heatmapRes.rows.map((r) => [r.review_date, parseInt(r.count, 10)]));
  const heatmap = Array.from({ length: 84 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (83 - i));
    const iso = toISODate(d);
    return { date: iso, count: heatmapMap.get(iso) ?? 0 };
  });

  return NextResponse.json({
    streak,
    totalReviews: parseInt(totalRes.rows[0]?.total ?? '0', 10),
    retentionRate,
    cardsByMaturity,
    forecast,
    heatmap,
    easeAvg: parseFloat(easeRes.rows[0]?.ease_avg ?? '0'),
  });
}
