/**
 * GET /api/stats/decks
 *
 * Returns per-deck SRS maturity, weekly accuracy trend (12 weeks), and an
 * exam readiness score (0–100) computed from retention, maturity, and streak.
 *
 * Response 200:
 * {
 *   decks: Array<{
 *     id: string, title: string, color: string, emoji: string,
 *     new: number, learning: number, young: number, mature: number,
 *     dueToday: number, totalCards: number
 *   }>,
 *   weeklyAccuracy: Array<{ week: string; rate: number }>, // 12 weeks, oldest first
 *   examReadiness: number  // 0–100
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface DeckMaturityRow {
  id: string;
  title: string;
  color: string;
  emoji: string;
  new_count: string;
  learning_count: string;
  young_count: string;
  mature_count: string;
  due_today: string;
  total_cards: string;
}

interface WeeklyRow {
  week_start: string;
  pass: string;
  total: string;
}

interface GlobalRow {
  streak: string;
  retention: string;
  total_mature: string;
  total_tracked: string;
}

function weekLabel(isoDate: string) {
  const d = new Date(isoDate);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const { userId } = user;

  const [deckRows, weeklyRows, globalRow] = await Promise.all([
    // Per-deck maturity breakdown
    query<DeckMaturityRow>(
      `SELECT
         d.id, d.title, d.color, d.emoji,
         COUNT(c.id) FILTER (WHERE ss.card_id IS NULL OR ss.review_count = 0)::text AS new_count,
         COUNT(ss.card_id) FILTER (WHERE ss.review_count BETWEEN 1 AND 2)::text AS learning_count,
         COUNT(ss.card_id) FILTER (WHERE ss.review_count > 2 AND ss.interval <= 20)::text AS young_count,
         COUNT(ss.card_id) FILTER (WHERE ss.interval > 20)::text AS mature_count,
         COUNT(c.id) FILTER (WHERE ss.card_id IS NULL OR ss.due_date <= CURRENT_DATE)::text AS due_today,
         COUNT(c.id)::text AS total_cards
       FROM decks d
       LEFT JOIN cards c ON c.deck_id = d.id AND c.user_id = $1
       LEFT JOIN srs_state ss ON ss.card_id = c.id
       WHERE d.user_id = $1
       GROUP BY d.id, d.title, d.color, d.emoji
       ORDER BY d.created_at DESC`,
      [userId],
    ),

    // Weekly accuracy — last 12 weeks, oldest first
    query<WeeklyRow>(
      `SELECT
         date_trunc('week', reviewed_at AT TIME ZONE 'UTC')::date::text AS week_start,
         COUNT(*) FILTER (WHERE grade IN ('good','easy'))::text AS pass,
         COUNT(*)::text AS total
       FROM review_log
       WHERE user_id = $1
         AND reviewed_at >= NOW() - INTERVAL '12 weeks'
       GROUP BY week_start
       ORDER BY week_start ASC`,
      [userId],
    ),

    // Global figures needed for exam readiness
    query<GlobalRow>(
      `SELECT
         (
           SELECT COUNT(DISTINCT DATE(reviewed_at AT TIME ZONE 'UTC'))
           FROM review_log
           WHERE user_id = $1
             AND reviewed_at >= NOW() - INTERVAL '365 days'
         )::text AS streak,
         COALESCE(
           ROUND(
             COUNT(*) FILTER (WHERE grade IN ('good','easy')) * 100.0
               / NULLIF(COUNT(*), 0)
           ), 0
         )::text AS retention,
         (SELECT COUNT(*) FROM srs_state ss JOIN cards c ON c.id = ss.card_id
          WHERE c.user_id = $1 AND ss.interval > 20)::text AS total_mature,
         (SELECT COUNT(*) FROM srs_state ss JOIN cards c ON c.id = ss.card_id
          WHERE c.user_id = $1)::text AS total_tracked
       FROM review_log
       WHERE user_id = $1
         AND reviewed_at >= NOW() - INTERVAL '30 days'`,
      [userId],
    ),
  ]);

  // ── Per-deck data ─────────────────────────────────────────────────────────────
  const decks = deckRows.rows.map((r) => ({
    id: r.id,
    title: r.title,
    color: r.color ?? 'indigo',
    emoji: r.emoji ?? '📚',
    new:      parseInt(r.new_count, 10),
    learning: parseInt(r.learning_count, 10),
    young:    parseInt(r.young_count, 10),
    mature:   parseInt(r.mature_count, 10),
    dueToday: parseInt(r.due_today, 10),
    totalCards: parseInt(r.total_cards, 10),
  }));

  // ── Weekly accuracy ───────────────────────────────────────────────────────────
  const weeklyAccuracy = weeklyRows.rows.map((r) => ({
    week: weekLabel(r.week_start),
    rate: parseInt(r.total, 10) === 0
      ? 0
      : Math.round(parseInt(r.pass, 10) * 100 / parseInt(r.total, 10)),
  }));

  // ── Exam readiness ────────────────────────────────────────────────────────────
  const g = globalRow.rows[0];
  const retention    = g ? parseInt(g.retention, 10)    : 0;
  const totalMature  = g ? parseInt(g.total_mature, 10) : 0;
  const totalTracked = g ? parseInt(g.total_tracked, 10): 0;
  const streakDays   = g ? parseInt(g.streak, 10)       : 0;
  const matureRatio  = totalTracked > 0 ? (totalMature / totalTracked) * 100 : 0;
  const streakScore  = Math.min(streakDays, 30) / 30 * 100;
  const examReadiness = Math.round(
    retention   * 0.40 +
    matureRatio * 0.40 +
    streakScore * 0.20,
  );

  return NextResponse.json({ decks, weeklyAccuracy, examReadiness });
}
