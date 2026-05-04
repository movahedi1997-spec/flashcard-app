// GET /api/quiz/decks/[id]/session — due questions for SRS quiz
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const deck = await query<{ id: string }>('SELECT id FROM quiz_decks WHERE id=$1 AND user_id=$2', [params.id, user.userId]);
  if (!deck.rows[0]) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const rows = await query<{
    id: string; question_text: string; correct_answer: string;
    option_a: string; option_b: string; explanation: string | null;
    srs_interval: number | null; srs_ease: number | null;
    srs_due: string | null; srs_count: number | null;
  }>(
    `SELECT qq.id, qq.question_text, qq.correct_answer, qq.option_a, qq.option_b, qq.explanation,
            s.interval AS srs_interval, s.ease_factor AS srs_ease,
            s.due_date AS srs_due, s.review_count AS srs_count
     FROM quiz_questions qq
     LEFT JOIN quiz_srs_state s ON s.question_id = qq.id AND s.user_id = $2
     WHERE qq.quiz_deck_id = $1
       AND (s.due_date IS NULL OR s.due_date <= NOW())
     ORDER BY COALESCE(s.due_date, NOW()) ASC, qq.created_at ASC`,
    [params.id, user.userId],
  );

  const questions = rows.rows.map((r) => ({
    id: r.id, questionText: r.question_text, correctAnswer: r.correct_answer,
    optionA: r.option_a, optionB: r.option_b, explanation: r.explanation,
    srs: r.srs_interval !== null
      ? { interval: r.srs_interval, easeFactor: r.srs_ease ?? 2.5, dueDate: r.srs_due, reviewCount: r.srs_count ?? 0 }
      : null,
  }));

  return NextResponse.json({ questions, dueCount: questions.length });
}
