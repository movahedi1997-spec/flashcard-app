import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FLASHCARD_FREE_LIMIT = 189;
const FLASHCARD_PRO_LIMIT  = 499;
const QUIZ_FREE_LIMIT      = 94;
const QUIZ_PRO_LIMIT       = 499;

const secret = new TextEncoder().encode(
  process.env.ACCESS_JWT_SECRET ?? 'dev-access-secret-change-in-production-32x',
);

export async function GET() {
  const token = cookies().get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secret);
    userId = payload.userId as string;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [userRow, usageRow] = await Promise.all([
    query<{ is_pro: boolean; ai_credits: number }>(
      'SELECT is_pro, COALESCE(ai_credits, 0) AS ai_credits FROM users WHERE id = $1',
      [userId],
    ),
    query<{ cards_generated: number }>(
      'SELECT cards_generated FROM ai_usage WHERE user_id = $1 AND month = $2',
      [userId, new Date().toISOString().slice(0, 7)],
    ),
  ]);

  const isPro   = userRow.rows[0]?.is_pro ?? false;
  const credits = userRow.rows[0]?.ai_credits ?? 0;
  const used    = usageRow.rows[0]?.cards_generated ?? 0;

  const flashcardLimit    = isPro ? FLASHCARD_PRO_LIMIT : FLASHCARD_FREE_LIMIT;
  const quizLimit         = isPro ? QUIZ_PRO_LIMIT : QUIZ_FREE_LIMIT;
  const flashcardMonthly  = Math.max(0, flashcardLimit - used);
  const quizMonthly       = Math.max(0, quizLimit - used);

  return NextResponse.json({
    isPro,
    used,
    // Flashcard fields (kept for backward-compat with AIGenerateModal)
    limit:     flashcardLimit,
    remaining: flashcardMonthly,
    // Quiz-specific fields
    quizLimit,
    quizRemaining: quizMonthly,
    // Bonus credits (shared pool, applied after monthly quota)
    credits,
  });
}
