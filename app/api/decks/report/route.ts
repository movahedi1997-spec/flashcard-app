/**
 * POST /api/decks/report
 * Body: { deckId, reason, details? }
 * Authenticated users report a public deck.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_REASONS = [
  'illegal_content','copyright','hate_speech',
  'misinformation','spam','violence','other',
] as const;

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const { deckId, reason, details } = body ?? {};

  if (!deckId || typeof deckId !== 'string')
    return NextResponse.json({ error: 'deckId is required.' }, { status: 400 });
  if (!reason || !VALID_REASONS.includes(reason as typeof VALID_REASONS[number]))
    return NextResponse.json({ error: 'Invalid reason.' }, { status: 400 });
  if (details && typeof details === 'string' && details.length > 1000)
    return NextResponse.json({ error: 'Details too long.' }, { status: 400 });

  // Verify deck exists and is public
  const deckRow = await query<{ id: string }>(
    'SELECT id FROM decks WHERE id = $1 AND is_public = true',
    [deckId],
  );
  if (!deckRow.rows[0])
    return NextResponse.json({ error: 'Deck not found.' }, { status: 404 });

  // Prevent duplicate pending reports from same user
  const existing = await query<{ id: string }>(
    `SELECT id FROM deck_reports WHERE deck_id = $1 AND reporter_id = $2 AND status = 'pending'`,
    [deckId, user.userId],
  );
  if (existing.rows[0])
    return NextResponse.json({ error: 'You already reported this deck.' }, { status: 409 });

  await query(
    `INSERT INTO deck_reports (deck_id, reporter_id, reason, details)
     VALUES ($1, $2, $3, $4)`,
    [deckId, user.userId, reason, details ?? null],
  );

  return NextResponse.json({ ok: true });
}
