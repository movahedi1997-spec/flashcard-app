/**
 * GET /api/decks/[id]/cards
 * Returns all cards in a deck.
 * Accessible to the deck owner or to any user if the deck is public.
 * Also returns the SRS state for each card (for the study session).
 *
 * Response 200: { cards: CardWithSrs[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

type RouteContext = { params: { id: string } };

export async function GET(req: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { id: deckId } = params;

  try {
    // Verify the deck is accessible to this user
    const deckCheck = await query(
      `SELECT id FROM decks
       WHERE id = $1 AND (user_id = $2 OR is_public = true)`,
      [deckId, user.userId],
    );

    if ((deckCheck.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: 'Deck not found.' }, { status: 404 });
    }

    // Fetch cards with their SRS state joined (NULL if never reviewed = "new" card)
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
      // SRS columns (nullable — NULL means card is new/unreviewed)
      srs_interval: number | null;
      srs_ease_factor: number | null;
      srs_due_date: string | null;
      srs_review_count: number | null;
      srs_last_grade: string | null;
      srs_last_reviewed_at: string | null;
    }>(
      `SELECT
         c.id, c.deck_id, c.user_id, c.front, c.back,
         c.front_image_url, c.back_image_url, c.ai_generated,
         c.created_at, c.updated_at,
         s.interval         AS srs_interval,
         s.ease_factor      AS srs_ease_factor,
         s.due_date         AS srs_due_date,
         s.review_count     AS srs_review_count,
         s.last_grade       AS srs_last_grade,
         s.last_reviewed_at AS srs_last_reviewed_at
       FROM cards c
       LEFT JOIN srs_state s
         ON s.card_id = c.id AND s.user_id = $1
       WHERE c.deck_id = $2
       ORDER BY c.created_at ASC`,
      [user.userId, deckId],
    );

    const cards = result.rows.map((row) => ({
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
      // SRS state — null fields mean the card has never been reviewed
      srs: {
        interval: row.srs_interval ?? 1,
        easeFactor: row.srs_ease_factor ?? 2.5,
        dueDate: row.srs_due_date ?? new Date(0).toISOString(), // epoch = always due
        reviewCount: row.srs_review_count ?? 0,
        lastGrade: row.srs_last_grade ?? null,
        lastReviewedAt: row.srs_last_reviewed_at ?? null,
      },
    }));

    return NextResponse.json({ cards });
  } catch (err) {
    console.error('[GET /api/decks/[id]/cards]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
