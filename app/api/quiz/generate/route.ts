// POST /api/quiz/generate
// Accepts multipart/form-data OR JSON:
//   FormData: { quizDeckId, file?, text?, count? }
//   JSON:     { quizDeckId, text, count? }
// Generates MCQ questions using AI and inserts them into the quiz deck.
//
// PRIVACY POLICY — TEMPORARY UPLOAD ONLY
// Uploaded PDFs and pasted source text are processed in memory for this
// single request only. They are NEVER written to disk, persisted to the
// database, or stored on any object store. After the AI provider returns
// generated questions, the input buffer/text is dropped and garbage-collected.
// Only the generated MCQ questions are saved (in `quiz_questions`).
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

  const userRow = await query<{ is_pro: boolean; ai_credits: number }>(
    'SELECT is_pro, COALESCE(ai_credits, 0) AS ai_credits FROM users WHERE id=$1', [userId],
  );
  const isPro        = userRow.rows[0]?.is_pro ?? false;
  const bonusCredits = userRow.rows[0]?.ai_credits ?? 0;

  const month = new Date().toISOString().slice(0, 7);
  const usageRow = await query<{ cards_generated: number }>(
    'SELECT cards_generated FROM ai_usage WHERE user_id=$1 AND month=$2', [userId, month],
  );
  const used             = usageRow.rows[0]?.cards_generated ?? 0;
  const limit            = isPro ? PRO_MONTHLY_LIMIT : FREE_MONTHLY_LIMIT;
  const monthlyRemaining = Math.max(0, limit - used);
  const totalAvailable   = monthlyRemaining + bonusCredits;

  if (totalAvailable <= 0)
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

  if (file && file.size > 20 * 1024 * 1024)
    return NextResponse.json({ error: 'File too large. Maximum size is 20 MB.' }, { status: 400 });

  if (file) {
    const header = Buffer.from(await file.slice(0, 4).arrayBuffer());
    const isPdf  = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46; // %PDF
    if (!isPdf)
      return NextResponse.json({ error: 'Only PDF files are supported.' }, { status: 400 });
  }

  const deckCheck = await query<{ id: string }>('SELECT id FROM quiz_decks WHERE id=$1 AND user_id=$2', [quizDeckId, userId]);
  if (!deckCheck.rows[0]) return NextResponse.json({ error: 'Quiz deck not found.' }, { status: 404 });

  // ── Pre-debit quota to prevent double-spend on concurrent requests ─────────
  const toClaim     = Math.min(count, totalAvailable);
  const fromMonthly = Math.min(toClaim, monthlyRemaining);
  const fromCredits = toClaim - fromMonthly;

  if (fromMonthly > 0) {
    await query(
      `INSERT INTO ai_usage (user_id, month, cards_generated) VALUES ($1,$2,$3)
       ON CONFLICT (user_id, month) DO UPDATE SET cards_generated = ai_usage.cards_generated + $3`,
      [userId, month, fromMonthly],
    );
  }
  if (fromCredits > 0) {
    await query('UPDATE users SET ai_credits = GREATEST(0, ai_credits - $1) WHERE id = $2', [fromCredits, userId]);
  }

  const refundQuota = async (n: number) => {
    const refundMonthly = Math.min(n, fromMonthly);
    const refundCredits = n - refundMonthly;
    if (refundMonthly > 0)
      await query(
        `UPDATE ai_usage SET cards_generated = GREATEST(0, cards_generated - $1) WHERE user_id = $2 AND month = $3`,
        [refundMonthly, userId, month],
      ).catch(() => {});
    if (refundCredits > 0)
      await query('UPDATE users SET ai_credits = ai_credits + $1 WHERE id = $2', [refundCredits, userId]).catch(() => {});
  };

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
    await refundQuota(toClaim);
    return NextResponse.json({ error: 'AI generation failed. Please try again.' }, { status: 500 });
  }

  const questions = result.questions.slice(0, toClaim);
  if (questions.length === 0) {
    await refundQuota(toClaim);
    return NextResponse.json({ error: 'No questions could be generated.' }, { status: 422 });
  }

  const inserted = [];
  try {
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
  } catch (err) {
    console.error('[quiz/generate] insert failed', err);
    await refundQuota(toClaim);
    return NextResponse.json({ error: 'Failed to save generated questions. Please try again.' }, { status: 500 });
  }

  // Refund unused quota if AI returned fewer questions than claimed
  const unused = toClaim - inserted.length;
  if (unused > 0) await refundQuota(unused);

  return NextResponse.json({ questions: inserted, generated: inserted.length });
}
