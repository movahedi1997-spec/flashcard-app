/**
 * GET /api/explore/[slug]
 *
 * Returns a single public deck by its slug, including the first 10 cards
 * as a preview (used on the SEO landing page and the explore card detail modal).
 *
 * Auth: optional. When authenticated, includes `alreadyCopied` and `isOwner`.
 *
 * Response 200:
 *   {
 *     deck:       PublicDeck & { copyCount: number; isVerifiedCreator: boolean },
 *     cards:      ApiCard[],   // first 10 cards, front only for unauthenticated users
 *     totalCards: number,
 *   }
 *
 * Response 404: deck not found or not public (never 403 — prevents slug enumeration)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

type RouteContext = { params: { slug: string } };

interface DeckRow {
  id: string;
  user_id: string;
  creator_name: string;
  is_verified_creator: boolean;
  title: string;
  description: string;
  color: string;
  emoji: string;
  slug: string;
  subject: string | null;
  is_public: boolean;
  copy_count: number;
  created_at: string;
  updated_at: string;
}

interface CardRow {
  id: string;
  front: string;
  back: string;
  front_image_url: string | null;
  back_image_url: string | null;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(req).catch(() => null);
  const { slug } = params;

  try {
    // ── Fetch deck by slug ────────────────────────────────────────────────────
    const deckResult = await query<DeckRow>(
      `SELECT
         d.id, d.user_id, u.name AS creator_name,
         COALESCE(u.is_verified_creator, false) AS is_verified_creator,
         d.title, d.description, d.color, d.emoji, d.slug, d.subject,
         d.is_public, COALESCE(d.copy_count, 0) AS copy_count,
         d.created_at, d.updated_at
       FROM decks d
       JOIN users u ON u.id = d.user_id
       WHERE d.slug = $1 AND d.is_public = true`,
      [slug],
    );

    if ((deckResult.rowCount ?? 0) === 0) {
      // Return 404 regardless of whether the deck exists but is private —
      // this prevents confirming that a slug belongs to an existing private deck.
      return NextResponse.json({ error: 'Deck not found.' }, { status: 404 });
    }

    const deck = deckResult.rows[0];

    // ── Total card count ──────────────────────────────────────────────────────
    const countResult = await query<{ total: string }>(
      'SELECT COUNT(*)::text AS total FROM cards WHERE deck_id = $1',
      [deck.id],
    );
    const totalCards = parseInt(countResult.rows[0]?.total ?? '0', 10);

    // ── Preview cards (first 10) ──────────────────────────────────────────────
    // Unauthenticated users see the front face only (back is hidden to encourage sign-up).
    // Authenticated users (or the deck owner) see both faces.
    const isOwner = user?.userId === deck.user_id;
    const showBack = !!user; // any authenticated user gets full preview

    const cardsResult = await query<CardRow>(
      `SELECT id, front, ${showBack ? 'back' : "'' AS back"},
              front_image_url, ${showBack ? 'back_image_url' : 'NULL AS back_image_url'},
              ai_generated, created_at, updated_at
         FROM cards
        WHERE deck_id = $1
        ORDER BY created_at ASC
        LIMIT 10`,
      [deck.id],
    );

    // ── alreadyCopied check ───────────────────────────────────────────────────
    let alreadyCopied = false;
    if (user && !isOwner) {
      const copyCheck = await query<{ id: string }>(
        'SELECT id FROM decks WHERE user_id = $1 AND copied_from_id = $2 LIMIT 1',
        [user.userId, deck.id],
      );
      alreadyCopied = (copyCheck.rowCount ?? 0) > 0;
    }

    const cards = cardsResult.rows.map((row) => ({
      id:            row.id,
      deckId:        deck.id,
      userId:        deck.user_id,
      front:         row.front,
      back:          row.back,
      frontImageUrl: row.front_image_url,
      backImageUrl:  row.back_image_url,
      aiGenerated:   row.ai_generated,
      createdAt:     row.created_at,
      updatedAt:     row.updated_at,
    }));

    return NextResponse.json({
      deck: {
        id:                 deck.id,
        userId:             deck.user_id,
        creatorName:        deck.creator_name,
        isVerifiedCreator:  deck.is_verified_creator,
        title:              deck.title,
        description:        deck.description,
        color:              deck.color ?? 'indigo',
        emoji:              deck.emoji ?? '📚',
        isPublic:           true,
        slug:               deck.slug,
        subject:            deck.subject,
        cardCount:          totalCards,
        copyCount:          deck.copy_count,
        createdAt:          deck.created_at,
        updatedAt:          deck.updated_at,
        alreadyCopied,
        isOwner,
      },
      cards,
      totalCards,
      previewOnly: !showBack,
    });
  } catch (err) {
    console.error('[GET /api/explore/[slug]]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
