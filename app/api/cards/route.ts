/**
 * POST /api/cards
 * Creates a new card in a deck owned by the authenticated user.
 *
 * Body: {
 *   deckId: string,
 *   front: string,
 *   back: string,
 *   frontImageUrl?: string,
 *   backImageUrl?: string,
 *   aiGenerated?: boolean,
 * }
 * Response 201: { card: Card }
 * Response 400: validation error
 * Response 403: deck not owned by this user
 * Response 404: deck not found
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const {
    deckId,
    front,
    back,
    frontImageUrl = null,
    backImageUrl = null,
    aiGenerated = false,
  } = body ?? {};

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!deckId || typeof deckId !== 'string') {
    return NextResponse.json({ error: 'deckId is required.' }, { status: 400 });
  }
  if (!front || typeof front !== 'string' || front.trim().length === 0) {
    return NextResponse.json({ error: 'front (question) is required.' }, { status: 400 });
  }
  if (!back || typeof back !== 'string' || back.trim().length === 0) {
    return NextResponse.json({ error: 'back (answer) is required.' }, { status: 400 });
  }
  if (front.trim().length > 2000) {
    return NextResponse.json({ error: 'front must be 2000 characters or fewer.' }, { status: 400 });
  }
  if (back.trim().length > 2000) {
    return NextResponse.json({ error: 'back must be 2000 characters or fewer.' }, { status: 400 });
  }

  try {
    // ── Ownership check ────────────────────────────────────────────────────────
    const deckCheck = await query(
      'SELECT id FROM decks WHERE id = $1 AND user_id = $2',
      [deckId, user.userId],
    );
    if ((deckCheck.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: 'Deck not found.' }, { status: 404 });
    }

    // ── Insert card ────────────────────────────────────────────────────────────
    const result = await query<{
      id: string;
      deck_id: string;
      user_id: string;
      front: string;
      back: string;
      front_image_url: string | null;
      back_image_url: string | null;
      ai_generated: boolean;
      created_at: string;
      updated_at: string;
    }>(
      `INSERT INTO cards (deck_id, user_id, front, back, front_image_url, back_image_url, ai_generated)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, deck_id, user_id, front, back,
                 front_image_url, back_image_url, ai_generated,
                 created_at, updated_at`,
      [
        deckId,
        user.userId,
        front.trim(),
        back.trim(),
        frontImageUrl ?? null,
        backImageUrl ?? null,
        Boolean(aiGenerated),
      ],
    );

    const row = result.rows[0];
    return NextResponse.json(
      {
        card: {
          id: row.id,
          deckId: row.deck_id,
          userId: row.user_id,
          front: row.front,
          back: row.back,
          frontImageUrl: row.front_image_url,
          backImageUrl: row.back_image_url,
          aiGenerated: row.ai_generated,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('[POST /api/cards]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
