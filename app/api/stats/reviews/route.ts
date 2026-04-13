/**
 * GET /api/stats/reviews?period=day|week|month
 *
 * Returns per-period review counts broken down by grade, for the
 * authenticated user.  Missing periods are filled with zeros so
 * the chart always gets a complete, contiguous series.
 *
 * Response shape:
 *   {
 *     period: "day" | "week" | "month",
 *     data: Array<{
 *       label:  string,   // display label  e.g. "Apr 13" / "Apr 7" / "Apr"
 *       period: string,   // ISO key        e.g. "2026-04-13" / "2026-04-07" / "2026-04"
 *       again:  number,
 *       hard:   number,
 *       good:   number,
 *       easy:   number,
 *       total:  number,
 *     }>
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

type Period = 'day' | 'week' | 'month';

interface GradeRow {
  period: string;
  again: string;
  hard: string;
  good: string;
  easy: string;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function toISODate(d: Date) {
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

function toISOMonth(d: Date) {
  return d.toISOString().slice(0, 7); // YYYY-MM
}

/** Monday of the ISO week containing `d` */
function weekStart(d: Date): Date {
  const day = d.getUTCDay(); // 0=Sun … 6=Sat
  const diff = (day === 0 ? -6 : 1 - day);
  const mon = new Date(d);
  mon.setUTCDate(d.getUTCDate() + diff);
  mon.setUTCHours(0, 0, 0, 0);
  return mon;
}

function formatDayLabel(iso: string) {
  const [, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
}

function formatWeekLabel(iso: string) {
  return formatDayLabel(iso); // show the Monday date
}

function formatMonthLabel(iso: string) {
  const [y, m] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const label = months[parseInt(m, 10) - 1];
  // Show year if not current year
  const currentYear = new Date().getUTCFullYear().toString();
  return y === currentYear ? label : `${label} '${y.slice(2)}`;
}

// ── Generate empty scaffold for the full range ────────────────────────────────

function buildScaffold(period: Period): Map<string, { label: string; again: number; hard: number; good: number; easy: number }> {
  const map = new Map<string, { label: string; again: number; hard: number; good: number; easy: number }>();
  const now = new Date();

  if (period === 'day') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setUTCDate(now.getUTCDate() - i);
      d.setUTCHours(0, 0, 0, 0);
      const key = toISODate(d);
      map.set(key, { label: formatDayLabel(key), again: 0, hard: 0, good: 0, easy: 0 });
    }
  } else if (period === 'week') {
    const thisWeekMon = weekStart(now);
    for (let i = 11; i >= 0; i--) {
      const mon = new Date(thisWeekMon);
      mon.setUTCDate(thisWeekMon.getUTCDate() - i * 7);
      const key = toISODate(mon);
      map.set(key, { label: formatWeekLabel(key), again: 0, hard: 0, good: 0, easy: 0 });
    }
  } else {
    // month — last 12 calendar months including current
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const key = toISOMonth(d);
      map.set(key, { label: formatMonthLabel(key), again: 0, hard: 0, good: 0, easy: 0 });
    }
  }

  return map;
}

// ── SQL per period ────────────────────────────────────────────────────────────

function buildQuery(period: Period): { sql: string; lookback: string } {
  if (period === 'day') {
    return {
      sql: `
        SELECT
          DATE(reviewed_at AT TIME ZONE 'UTC')::text AS period,
          COUNT(*) FILTER (WHERE grade = 'again')::text AS again,
          COUNT(*) FILTER (WHERE grade = 'hard')::text  AS hard,
          COUNT(*) FILTER (WHERE grade = 'good')::text  AS good,
          COUNT(*) FILTER (WHERE grade = 'easy')::text  AS easy
        FROM review_log
        WHERE user_id = $1
          AND reviewed_at >= NOW() - INTERVAL '30 days'
        GROUP BY period
      `,
      lookback: '30 days',
    };
  }

  if (period === 'week') {
    return {
      sql: `
        SELECT
          DATE_TRUNC('week', reviewed_at AT TIME ZONE 'UTC')::date::text AS period,
          COUNT(*) FILTER (WHERE grade = 'again')::text AS again,
          COUNT(*) FILTER (WHERE grade = 'hard')::text  AS hard,
          COUNT(*) FILTER (WHERE grade = 'good')::text  AS good,
          COUNT(*) FILTER (WHERE grade = 'easy')::text  AS easy
        FROM review_log
        WHERE user_id = $1
          AND reviewed_at >= NOW() - INTERVAL '84 days'
        GROUP BY period
      `,
      lookback: '84 days',
    };
  }

  // month
  return {
    sql: `
      SELECT
        TO_CHAR(reviewed_at AT TIME ZONE 'UTC', 'YYYY-MM') AS period,
        COUNT(*) FILTER (WHERE grade = 'again')::text AS again,
        COUNT(*) FILTER (WHERE grade = 'hard')::text  AS hard,
        COUNT(*) FILTER (WHERE grade = 'good')::text  AS good,
        COUNT(*) FILTER (WHERE grade = 'easy')::text  AS easy
      FROM review_log
      WHERE user_id = $1
        AND reviewed_at >= NOW() - INTERVAL '365 days'
      GROUP BY period
    `,
    lookback: '365 days',
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rawPeriod = searchParams.get('period') ?? 'day';

  if (!['day', 'week', 'month'].includes(rawPeriod)) {
    return NextResponse.json({ error: 'period must be day, week, or month.' }, { status: 400 });
  }

  const period = rawPeriod as Period;

  try {
    const { sql } = buildQuery(period);
    const result = await query<GradeRow>(sql, [user.userId]);

    // Merge DB rows into the zero-filled scaffold
    const scaffold = buildScaffold(period);
    for (const row of result.rows) {
      const entry = scaffold.get(row.period);
      if (entry) {
        entry.again = parseInt(row.again, 10);
        entry.hard  = parseInt(row.hard,  10);
        entry.good  = parseInt(row.good,  10);
        entry.easy  = parseInt(row.easy,  10);
      }
    }

    const data = Array.from(scaffold.entries()).map(([key, v]) => ({
      period: key,
      label:  v.label,
      again:  v.again,
      hard:   v.hard,
      good:   v.good,
      easy:   v.easy,
      total:  v.again + v.hard + v.good + v.easy,
    }));

    return NextResponse.json({ period, data });
  } catch (err) {
    console.error('[GET /api/stats/reviews]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
