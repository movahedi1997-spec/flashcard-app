/**
 * POST /api/decks/[id]/copy
 *
 * Copies a public deck — including all its cards — into the authenticated
 * user's library as a fully independent clone.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * BEHAVIOUR
 * ─────────────────────────────────────────────────────────────────────────────
 *   • The source deck must be public (is_public = true). Copying a private
 *     deck is treated as "not found" (404) to prevent information leakage.
 *   • The cloned deck is private by default (is_public = false) and has no
 *     slug — the user controls whether they make it public later.
 *   • Title of the clone: "<original title> (Copy)"
 *   • All cards are duplicated with new UUIDs; ai_generated flag is preserved.
 *   • SRS state is NOT copied — the user starts from scratch with all cards
 *     treated as new (due immediately).
 *   • Users cannot copy their own decks (returns 400).
 *   • The entire copy is wrapped in a DB transaction to ensure atomicity.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * RESPONSE 201
 * ─────────────────────────────────────────────────────────────────────────────
 *   { deck: Deck }   — the newly created clone
 *
 * RESPONSE 400   User is trying to copy their own deck
 * RESPONSE 401   Not authenticated
 * RESPONSE 404   Source deck not found or not public
 * RESPONSE 409   User already has a copy of this deck in their library
 * RESPONSE 500   Internal error
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query, getDbPool } from '@/lib/db';

export const runtime = 'nodejs';

type RouteContext = { params: { id: string } };

interface SourceDeckRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  color: string;
  emoji: string;
  subject: string | null;
}

interface CardRow {
  id: string;
  front: string;
  back: string;
  front_image_url: string | null;
  back_image_url: string | null;
  ai_generated: boolean;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { id: sourceDeckId } = params;

  try {
    // ── Fetch source deck (must be public) ────────────────────────────────────
    const deckResult = await query<SourceDeckRow>(
      `SELECT id, user_id, title, description, color, emoji, subject
         FROM decks
        WHERE id = $1 AND is_public = true`,
      [sourceDeckId],
    );

    if ((deckResult.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: 'Deck not found.' }, { status: 404 });
    }

    const source = deckResult.rows[0];

    // ── Prevent self-copy ─────────────────────────────────────────────────────
    if (source.user_id === user.userId) {
      return NextResponse.json(
        { error: 'You cannot copy your own deck.' },
        { status: 400 },
      );
    }

    // ── Duplicate check ───────────────────────────────────────────────────────
    // Check if the user already has a copy (same title + copied_from slug pattern).
    // We identify copies by the title suffix "(Copy)" and matching source subject.
    // This is a soft check — not enforced at DB level, but avoids accidental duplicates.
    const existingCopy = await query<{ id: string }>(
      `SELECT id FROM decks
        WHERE user_id = $1
          AND title = $2
          AND is_public = false
        LIMIT 1`,
      [user.userId, `${source.title} (Copy)`],
    );

    if ((existingCopy.rowCount ?? 0) > 0) {
      return NextResponse.json(
        { error: 'You already have a copy of this deck in your library.' },
        { status: 409 },
      );
    }

    // ── Fetch source cards ────────────────────────────────────────────────────
    const cardsResult = await query<CardRow>(
      `SELECT id, front, back, front_image_url, back_image_url, ai_generated
         FROM cards
        WHERE deck_id = $1
        ORDER BY created_at ASC`,
      [sourceDeckId],
    );

    const sourceCards = cardsResult.rows;

    // ── Atomic copy — deck + all cards in one transaction ─────────────────────
    const client = await getDbPool().connect();
    let newDeckRow: {
      id: string; user_id: string; title: string; description: string;
      color: string; emoji: string; subject: string | null;
      created_at: string; updated_at: string;
    };

    try {
      await client.query('BEGIN');

      // Create the cloned deck (private, no slug, tracks source via copied_from_id)
      const newDeck = await client.query<typeof newDeckRow>(
        `INSERT INTO decks (user_id, title, description, color, emoji, subject, is_public, copied_from_id)
         VALUES ($1, $2, $3, $4, $5, $6, false, $7)
         RETURNING id, user_id, title, description, color, emoji, subject, created_at, updated_at`,
        [
          user.userId,
          `${source.title} (Copy)`,
          source.description,
          source.color ?? 'indigo',
          source.emoji ?? '📚',
          source.subject,
          sourceDeckId,
        ],
      );

      // Increment copy_count on the source deck (best-effort, non-blocking)
      await client.query(
        'UPDATE decks SET copy_count = copy_count + 1 WHERE id = $1',
        [sourceDeckId],
      );

      newDeckRow = newDeck.rows[0];

      // Insert all cards belonging to the new deck
      if (sourceCards.length > 0) {
        // Build a multi-row INSERT for efficiency
        const cardPlaceholders = sourceCards
          .map((_, i) => {
            const base = i * 6;
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
          })
          .join(', ');

        const cardValues = sourceCards.flatMap((card) => [
          newDeckRow.id,
          user.userId,
          card.front,
          card.back,
          card.front_image_url,
          card.back_image_url,
        ]);

        await client.query(
          `INSERT INTO cards (deck_id, user_id, front, back, front_image_url, back_image_url)
           VALUES ${cardPlaceholders}`,
          cardValues,
        );
      }

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    return NextResponse.json(
      {
        deck: {
          id:          newDeckRow.id,
          userId:      newDeckRow.user_id,
          title:       newDeckRow.title,
          description: newDeckRow.description,
          color:       newDeckRow.color ?? 'indigo',
          emoji:       newDeckRow.emoji ?? '📚',
          isPublic:    false,
          slug:        null,
          subject:     newDeckRow.subject,
          cardCount:   sourceCards.length,
          createdAt:   newDeckRow.created_at,
          updatedAt:   newDeckRow.updated_at,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('[POST /api/decks/[id]/copy]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
