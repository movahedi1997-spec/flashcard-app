// POST /api/quiz/generate
// Accepts multipart/form-data OR JSON:
//   FormData: { quizDeckId, file?, text?, count? }
//   JSON:     { quizDeckId, text, count? }
// Generates MCQ questions using AI and inserts them into the quiz deck.
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';
import { generateQuizQuestions, generateQuizQuestionsFromPdf } from '@/lib/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FREE_MONTHLY_LIMIT = 94;
const PRO_MONTHLY_LIMIT  = 499;

const secret = new TextEncoder().encode(
  process.env.ACCESS_JWT_SECRET ?? 'dev-access-secret-change-in-production-32x',
);

export async function POST(req: NextRequest) {
  const token = cookies().get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secret);
    userId = payload.userId as string;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRow = await query<{ is_pro: boolean }>('SELECT is_pro FROM users WHERE id=$1', [userId]);
  const isPro = userRow.rows[0]?.is_pro ?? false;

  const month = new Date().toISOString().slice(0, 7);
  const usageRow = await query<{ cards_generated: number }>(
    'SELECT cards_generated FROM ai_usage WHERE user_id=$1 AND month=$2', [userId, month],
  );
  const used = usageRow.rows[0]?.cards_generated ?? 0;
  const limit = isPro ? PRO_MONTHLY_LIMIT : FREE_MONTHLY_LIMIT;
  const remaining = limit - used;

  if (used >= limit)
    return NextResponse.json({ error: `Monthly limit reached (${limit} AI items).`, code: 'QUOTA_EXCEEDED', used, limit }, { status: 402 });

  // ── Parse request (FormData with optional PDF, or JSON) ───────────────────
  const contentType = req.headers.get('content-type') ?? '';
  let quizDeckId: string | null = null;
  let text: string | null = null;
  let file: File | null = null;
  let count = 10;

  if (contentType.includes('multipart/form-data')) {
    let formData: FormData;
    try { formData = await req.formData(); } catch {
      return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 });
    }
    quizDeckId = formData.get('quizDeckId') as string | null;
    text       = formData.get('text')       as string | null;
    file       = formData.get('file')       as File   | null;
    count      = Math.min(50, Math.max(1, parseInt(String(formData.get('count') ?? '10'), 10)));
  } else {
    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    quizDeckId = body?.quizDeckId as string | null;
    text       = body?.text       as string | null;
    count      = Math.min(50, Math.max(1, parseInt(String(body?.count ?? '10'), 10)));
  }

  if (!quizDeckId || typeof quizDeckId !== 'string')
    return NextResponse.json({ error: 'quizDeckId required.' }, { status: 400 });

  if (!file && (!text || typeof text !== 'string' || text.trim().length < 30))
    return NextResponse.json({ error: 'Provide a PDF file or at least 30 characters of text.' }, { status: 400 });

  if (file && !file.type.includes('pdf') && !file.name.endsWith('.pdf'))
    return NextResponse.json({ error: 'Only PDF files are supported.' }, { status: 400 });

  if (file && file.size > 20 * 1024 * 1024)
    return NextResponse.json({ error: 'File too large. Maximum size is 20 MB.' }, { status: 400 });

  const deckCheck = await query<{ id: string }>('SELECT id FROM quiz_decks WHERE id=$1 AND user_id=$2', [quizDeckId, userId]);
  if (!deckCheck.rows[0]) return NextResponse.json({ error: 'Quiz deck not found.' }, { status: 404 });

  let result;
  try {
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      result = await generateQuizQuestionsFromPdf(buffer, count);
    } else {
      result = await generateQuizQuestions((text as string).trim(), count);
    }
  } catch (err) {
    console.error('[quiz/generate]', err);
    return NextResponse.json({ error: 'AI generation failed. Please try again.' }, { status: 500 });
  }

  const questions = result.questions.slice(0, remaining);
  if (questions.length === 0)
    return NextResponse.json({ error: 'No questions could be generated.' }, { status: 422 });

  const inserted = [];
  for (const q of questions) {
    const r = await query<{ id: string; created_at: string }>(
      `INSERT INTO quiz_questions (quiz_deck_id, user_id, question_text, correct_answer, option_a, option_b, explanation, ai_generated)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true) RETURNING id, created_at`,
      [quizDeckId, userId, q.question_text, q.correct_answer, q.option_a, q.option_b, q.explanation || null],
    );
    const row = r.rows[0]!;
    inserted.push({
      id: row.id, quizDeckId, userId,
      questionText: q.question_text, correctAnswer: q.correct_answer,
      optionA: q.option_a, optionB: q.option_b,
      explanation: q.explanation || null, aiGenerated: true,
      srs: null, createdAt: row.created_at,
    });
  }

  await query(
    `INSERT INTO ai_usage (user_id, month, cards_generated) VALUES ($1,$2,$3)
     ON CONFLICT (user_id, month) DO UPDATE SET cards_generated = ai_usage.cards_generated + $3`,
    [userId, month, questions.length],
  );

  return NextResponse.json({ questions: inserted, generated: inserted.length });
}
