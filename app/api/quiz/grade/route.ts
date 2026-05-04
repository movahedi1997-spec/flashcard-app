// POST /api/quiz/grade
// Body: { questionId, correct: boolean, turbo?: boolean }
// turbo=true: log only, no SRS update
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { schedule, DEFAULT_SRS } from '@/lib/srs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const { questionId, correct, turbo } = body ?? {};

  if (!questionId || typeof questionId !== 'string')
    return NextResponse.json({ error: 'questionId required.' }, { status: 400 });
  if (typeof correct !== 'boolean')
    return NextResponse.json({ error: 'correct (boolean) required.' }, { status: 400 });

  const owned = await query<{ id: string }>(
    'SELECT id FROM quiz_questions WHERE id=$1 AND user_id=$2', [questionId, user.userId],
  );
  if (!owned.rows[0]) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const now = new Date();
  const grade = correct ? 'good' : 'again';

  // Log to quiz_review_log always
  query(
    'INSERT INTO quiz_review_log (question_id, user_id, correct, reviewed_at) VALUES ($1,$2,$3,$4)',
    [questionId, user.userId, correct, now.toISOString()],
  ).catch(() => {});

  if (turbo) return NextResponse.json({ ok: true });

  // SRS update
  const srsRow = await query<{ interval: number; ease_factor: number; review_count: number }>(
    'SELECT interval, ease_factor, review_count FROM quiz_srs_state WHERE question_id=$1 AND user_id=$2',
    [questionId, user.userId],
  );
  const current = srsRow.rows[0]
    ? { interval: srsRow.rows[0].interval, easeFactor: srsRow.rows[0].ease_factor, reviewCount: srsRow.rows[0].review_count }
    : DEFAULT_SRS;

  const next = schedule(current, grade, now);

  await query(
    `INSERT INTO quiz_srs_state (question_id, user_id, interval, ease_factor, due_date, review_count, last_reviewed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (question_id, user_id) DO UPDATE SET
       interval=$3, ease_factor=$4, due_date=$5, review_count=$6, last_reviewed_at=$7`,
    [questionId, user.userId, next.interval, next.easeFactor, next.dueDate.toISOString(), next.reviewCount, now.toISOString()],
  );

  return NextResponse.json({ ok: true, newInterval: next.interval, newDueDate: next.dueDate.toISOString() });
}
