/**
 * POST /api/ai/generate
 * Accepts multipart/form-data:
 *   - file?  — PDF file (optional)
 *   - text?  — raw text (optional, used if no file)
 *   - deckId — UUID of the deck to add cards to
 *   - count? — number of cards to generate (default 20, max 50)
 *
 * Free users: 189 AI cards/month
 * Pro users:  499 AI cards/month
 *
 * PRIVACY POLICY — TEMPORARY UPLOAD ONLY
 * Uploaded PDFs and pasted source text are processed in memory for this
 * single request only. They are NEVER written to disk, persisted to the
 * database, or stored on any object store. After the AI provider returns
 * generated cards, the input buffer/text is dropped and garbage-collected.
 * Only the generated flashcards are saved (in `cards`).
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';
import { generateFlashcards, generateFlashcardsFromPdf } from '@/lib/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FREE_MONTHLY_LIMIT = 189;
const PRO_MONTHLY_LIMIT  = 499;

const secret = new TextEncoder().encode(
  process.env.ACCESS_JWT_SECRET ?? 'dev-access-secret-change-in-production-32x',
);

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const token = cookies().get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  let isPro = false;
  try {
    const { payload } = await jwtVerify(token, secret);
    userId = payload.userId as string;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check pro status + bonus credits
  const userRow = await query<{ is_pro: boolean; ai_credits: number }>(
    'SELECT is_pro, COALESCE(ai_credits, 0) AS ai_credits FROM users WHERE id = $1', [userId],
  );
  isPro = userRow.rows[0]?.is_pro ?? false;
  const bonusCredits = userRow.rows[0]?.ai_credits ?? 0;

  // ── Quota check (monthly + bonus credits) ─────────────────────────────────
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  const usageRow = await query<{ cards_generated: number }>(
    `SELECT cards_generated FROM ai_usage WHERE user_id = $1 AND month = $2`,
    [userId, month],
  );
  const used = usageRow.rows[0]?.cards_generated ?? 0;
  const limit = isPro ? PRO_MONTHLY_LIMIT : FREE_MONTHLY_LIMIT;
  const monthlyRemaining = Math.max(0, limit - used);
  const totalAvailable   = monthlyRemaining + bonusCredits;

  if (totalAvailable <= 0) {
    return NextResponse.json(
      {
        error: `Monthly limit reached. You've used all ${limit} AI cards for this month.`,
        code: 'QUOTA_EXCEEDED',
        used,
        limit,
        remaining: 0,
        resetsAt: 'next month',
      },
      { status: 402 },
    );
  }

  // ── Parse form data ───────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 });
  }

  const deckId  = formData.get('deckId')  as string | null;
  const rawText = formData.get('text')    as string | null;
  const file    = formData.get('file')    as File   | null;
  const countRaw = parseInt((formData.get('count') as string) ?? '20', 10);
  const count = Math.min(Math.max(1, isNaN(countRaw) ? 20 : countRaw), 50);

  if (!deckId) return NextResponse.json({ error: 'deckId is required.' }, { status: 400 });
  if (!file && !rawText) return NextResponse.json({ error: 'Provide a PDF file or text.' }, { status: 400 });

  // Verify deck ownership
  const deckRow = await query(
    'SELECT id FROM decks WHERE id = $1 AND user_id = $2', [deckId, userId],
  );
  if ((deckRow.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Deck not found.' }, { status: 404 });
  }

  // ── Validate input before touching quota ──────────────────────────────────
  let buffer: Buffer | null = null;
  if (file) {
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 20 MB.' }, { status: 400 });
    }
    buffer = Buffer.from(await file.arrayBuffer());
    const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
    if (!isPdf) {
      return NextResponse.json({ error: 'Only PDF files are supported.' }, { status: 400 });
    }
  } else if (!rawText || rawText.trim().length < 50) {
    return NextResponse.json({ error: 'Not enough text to generate flashcards.' }, { status: 400 });
  }

  // ── Pre-debit quota to prevent double-spend on concurrent requests ─────────
  const toClaim    = Math.min(count, totalAvailable);
  const fromMonthly = Math.min(toClaim, monthlyRemaining);
  const fromCredits = toClaim - fromMonthly;

  if (fromMonthly > 0) {
    await query(
      `INSERT INTO ai_usage (user_id, month, cards_generated)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, month) DO UPDATE
       SET cards_generated = ai_usage.cards_generated + $3`,
      [userId, month, fromMonthly],
    );
  }
  if (fromCredits > 0) {
    await query(
      'UPDATE users SET ai_credits = GREATEST(0, ai_credits - $1) WHERE id = $2',
      [fromCredits, userId],
    );
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

  // ── Generate ──────────────────────────────────────────────────────────────
  let result;
  try {
    result = buffer
      ? await generateFlashcardsFromPdf(buffer, count)
      : await generateFlashcards(rawText!, count);
  } catch (err) {
    console.error('[POST /api/ai/generate]', err);
    await refundQuota(toClaim);
    return NextResponse.json({ error: 'AI generation failed. Please try again.' }, { status: 500 });
  }

  if (result.cards.length === 0) {
    await refundQuota(toClaim);
    return NextResponse.json({ error: 'No cards could be generated from this content.' }, { status: 422 });
  }

  const cards = result.cards.slice(0, toClaim);

  // ── Insert cards ──────────────────────────────────────────────────────────
  try {
    for (const card of cards) {
      await query(
        `INSERT INTO cards (deck_id, user_id, front, back, ai_generated) VALUES ($1, $2, $3, $4, true)`,
        [deckId, userId, card.front, card.back],
      );
    }
  } catch (err) {
    console.error('[POST /api/ai/generate] insert failed', err);
    await refundQuota(toClaim);
    return NextResponse.json({ error: 'Failed to save generated cards. Please try again.' }, { status: 500 });
  }

  // Refund unused quota if AI returned fewer cards than claimed
  const unused = toClaim - cards.length;
  if (unused > 0) await refundQuota(unused);

  const newUsed = used + fromMonthly - Math.min(unused, fromMonthly);
  return NextResponse.json({
    generated: cards.length,
    provider: result.provider,
    model: result.model,
    used: newUsed,
    limit,
    remaining: Math.max(0, limit - newUsed),
  });
}
