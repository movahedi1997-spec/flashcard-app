// POST /api/explore/likes
// Body: { deckId: string }
// Toggles a like for the given deck (works for both flashcard and quiz decks).
// Returns { liked: boolean } reflecting the new state.

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { deckId?: string };
  if (!body.deckId || typeof body.deckId !== 'string') {
    return NextResponse.json({ error: 'deckId required' }, { status: 400 });
  }

  try {
    const existing = await query<{ user_id: string }>(
      'SELECT user_id FROM explore_deck_likes WHERE user_id=$1 AND deck_id=$2',
      [user.userId, body.deckId],
    );

    if ((existing.rowCount ?? 0) > 0) {
      await query('DELETE FROM explore_deck_likes WHERE user_id=$1 AND deck_id=$2', [user.userId, body.deckId]);
      return NextResponse.json({ liked: false });
    }

    await query(
      'INSERT INTO explore_deck_likes (user_id, deck_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [user.userId, body.deckId],
    );
    return NextResponse.json({ liked: true });
  } catch {
    return NextResponse.json({ error: 'Likes not available yet. Run migration 015.' }, { status: 503 });
  }
}
