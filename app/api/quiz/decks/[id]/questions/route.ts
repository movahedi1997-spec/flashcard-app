// GET/POST /api/quiz/decks/[id]/questions
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const deck = await query<{ id: string }>('SELECT id FROM quiz_decks WHERE id=$1 AND user_id=$2', [params.id, user.userId]);
  if (!deck.rows[0]) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const rows = await query<{
    id: string; question_text: string; correct_answer: string;
    option_a: string; option_b: string; explanation: string | null;
    ai_generated: boolean;
    srs_interval: number | null; srs_ease: number | null;
    srs_due: string | null; srs_count: number | null;
    created_at: string;
  }>(
    `SELECT qq.id, qq.question_text, qq.correct_answer, qq.option_a, qq.option_b,
            qq.explanation, qq.ai_generated,
            s.interval AS srs_interval, s.ease_factor AS srs_ease,
            s.due_date AS srs_due, s.review_count AS srs_count,
            qq.created_at
     FROM quiz_questions qq
     LEFT JOIN quiz_srs_state s ON s.question_id = qq.id AND s.user_id = $2
     WHERE qq.quiz_deck_id = $1
     ORDER BY qq.created_at ASC`,
    [params.id, user.userId],
  );

  const questions = rows.rows.map((r) => ({
    id: r.id, quizDeckId: params.id, userId: user.userId,
    questionText: r.question_text, correctAnswer: r.correct_answer,
    optionA: r.option_a, optionB: r.option_b,
    explanation: r.explanation, aiGenerated: r.ai_generated,
    srs: r.srs_interval !== null ? {
      interval: r.srs_interval, easeFactor: r.srs_ease ?? 2.5,
      dueDate: r.srs_due, reviewCount: r.srs_count ?? 0,
    } : null,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ questions });
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const deck = await query<{ id: string }>('SELECT id FROM quiz_decks WHERE id=$1 AND user_id=$2', [params.id, user.userId]);
  if (!deck.rows[0]) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const { question_text, correct_answer, option_a, option_b, explanation } = body ?? {};

  if (!question_text || typeof question_text !== 'string' || !question_text.trim())
    return NextResponse.json({ error: 'question_text is required.' }, { status: 400 });
  if (!correct_answer || typeof correct_answer !== 'string')
    return NextResponse.json({ error: 'correct_answer is required.' }, { status: 400 });
  if (!option_a || typeof option_a !== 'string')
    return NextResponse.json({ error: 'option_a is required.' }, { status: 400 });
  if (!option_b || typeof option_b !== 'string')
    return NextResponse.json({ error: 'option_b is required.' }, { status: 400 });

  const r = await query<{ id: string; created_at: string }>(
    `INSERT INTO quiz_questions (quiz_deck_id, user_id, question_text, correct_answer, option_a, option_b, explanation)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, created_at`,
    [params.id, user.userId, question_text.trim(), correct_answer.trim(),
     option_a.trim(), option_b.trim(),
     typeof explanation === 'string' ? explanation.trim() || null : null],
  );
  const q = r.rows[0]!;
  return NextResponse.json({
    question: {
      id: q.id, quizDeckId: params.id, userId: user.userId,
      questionText: question_text.trim(), correctAnswer: correct_answer.trim(),
      optionA: option_a.trim(), optionB: option_b.trim(),
      explanation: typeof explanation === 'string' ? explanation.trim() || null : null,
      aiGenerated: false, srs: null, createdAt: q.created_at,
    },
  }, { status: 201 });
}
