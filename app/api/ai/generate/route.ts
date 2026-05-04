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

  // Check pro status
  const userRow = await query<{ is_pro: boolean }>(
    'SELECT is_pro FROM users WHERE id = $1', [userId],
  );
  isPro = userRow.rows[0]?.is_pro ?? false;

  // ── Quota check (monthly) ─────────────────────────────────────────────────
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  const usageRow = await query<{ cards_generated: number }>(
    `SELECT cards_generated FROM ai_usage WHERE user_id = $1 AND month = $2`,
    [userId, month],
  );
  const used = usageRow.rows[0]?.cards_generated ?? 0;
  const limit = isPro ? PRO_MONTHLY_LIMIT : FREE_MONTHLY_LIMIT;
  const remaining = limit - used;

  if (used >= limit) {
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

  // ── Generate ──────────────────────────────────────────────────────────────
  let result;
  try {
    if (file) {
      if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
        return NextResponse.json({ error: 'Only PDF files are supported.' }, { status: 400 });
      }
      if (file.size > 20 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large. Maximum size is 20 MB.' }, { status: 400 });
      }
      // Send PDF directly to Gemini vision — handles text, diagrams, scanned pages
      const buffer = Buffer.from(await file.arrayBuffer());
      result = await generateFlashcardsFromPdf(buffer, count);
    } else {
      if (!rawText || rawText.trim().length < 50) {
        return NextResponse.json({ error: 'Not enough text to generate flashcards.' }, { status: 400 });
      }
      result = await generateFlashcards(rawText, count);
    }
  } catch (err) {
    console.error('[POST /api/ai/generate]', err);
    return NextResponse.json({ error: 'AI generation failed. Please try again.' }, { status: 500 });
  }

  if (result.cards.length === 0) {
    return NextResponse.json({ error: 'No cards could be generated from this content.' }, { status: 422 });
  }

  // Cap at remaining quota
  const cards = result.cards.slice(0, remaining);

  // ── Insert cards ──────────────────────────────────────────────────────────
  for (const card of cards) {
    await query(
      `INSERT INTO cards (deck_id, user_id, front, back, ai_generated)
       VALUES ($1, $2, $3, $4, true)`,
      [deckId, userId, card.front, card.back],
    );
  }

  // ── Update quota ──────────────────────────────────────────────────────────
  await query(
    `INSERT INTO ai_usage (user_id, month, cards_generated)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, month) DO UPDATE
     SET cards_generated = ai_usage.cards_generated + $3`,
    [userId, month, cards.length],
  );

  const newUsed = used + cards.length;
  return NextResponse.json({
    generated: cards.length,
    provider: result.provider,
    model: result.model,
    used: newUsed,
    limit,
    remaining: limit - newUsed,
  });
}
