/**
 * GET /api/creators/[username]
 *
 * Returns a creator's public profile including their public decks.
 *
 * Auth: optional — public endpoint.
 *
 * Response 200:
 *   {
 *     creator: {
 *       id, name, username, bio, avatarUrl, isVerifiedCreator,
 *       deckCount, totalCopies, joinedAt
 *     },
 *     decks: PublicDeck[]
 *   }
 *
 * Response 404: username not found
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

type RouteContext = { params: { username: string } };

interface UserRow {
  id:                  string;
  name:                string;
  username:            string;
  bio:                 string | null;
  avatar_url:          string | null;
  is_verified_creator: boolean;
  created_at:          string;
}

interface DeckRow {
  id:          string;
  title:       string;
  description: string;
  color:       string;
  emoji:       string;
  slug:        string;
  subject:     string | null;
  card_count:  string;
  copy_count:  string;
  created_at:  string;
  updated_at:  string;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { username } = params;

  try {
    // ── Look up creator by username (case-insensitive) ────────────────────────
    const userResult = await query<UserRow>(
      `SELECT id, name, username, bio, avatar_url,
              COALESCE(is_verified_creator, false) AS is_verified_creator,
              created_at
         FROM users
        WHERE LOWER(username) = LOWER($1)`,
      [username],
    );

    if ((userResult.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: 'Creator not found.' }, { status: 404 });
    }

    const creator = userResult.rows[0];

    // ── Fetch public decks ────────────────────────────────────────────────────
    const decksResult = await query<DeckRow>(
      `SELECT d.id, d.title, d.description, d.color, d.emoji, d.slug, d.subject,
              COUNT(c.id)::text AS card_count,
              COALESCE(d.copy_count, 0)::text AS copy_count,
              d.created_at, d.updated_at
         FROM decks d
         LEFT JOIN cards c ON c.deck_id = d.id
        WHERE d.user_id = $1 AND d.is_public = true
        GROUP BY d.id
        ORDER BY d.created_at DESC`,
      [creator.id],
    );

    // ── Aggregate stats ───────────────────────────────────────────────────────
    const decks = decksResult.rows;
    const totalCopies = decks.reduce((sum, d) => sum + parseInt(d.copy_count, 10), 0);

    return NextResponse.json({
      creator: {
        id:                 creator.id,
        name:               creator.name,
        username:           creator.username,
        bio:                creator.bio,
        avatarUrl:          creator.avatar_url,
        isVerifiedCreator:  creator.is_verified_creator,
        deckCount:          decks.length,
        totalCopies,
        joinedAt:           creator.created_at,
      },
      decks: decks.map((d) => ({
        id:           d.id,
        userId:       creator.id,
        creatorName:  creator.name,
        title:        d.title,
        description:  d.description,
        color:        d.color ?? 'indigo',
        emoji:        d.emoji ?? '📚',
        isPublic:     true,
        slug:         d.slug,
        subject:      d.subject,
        cardCount:    parseInt(d.card_count, 10),
        copyCount:    parseInt(d.copy_count, 10),
        alreadyCopied: false, // not checking per-user here — profile is public
        createdAt:    d.created_at,
        updatedAt:    d.updated_at,
      })),
    });
  } catch (err) {
    console.error('[GET /api/creators/[username]]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
