/**
 * GET /api/explore
 *
 * Returns a paginated feed of public decks for the Explore page.
 * Authentication is optional — public decks are visible to everyone.
 * When authenticated, the response includes `alreadyCopied: true` for
 * decks the user has already copied to their library.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUERY PARAMETERS
 * ─────────────────────────────────────────────────────────────────────────────
 *   subject  (optional)  Filter by subject: medicine | pharmacy | chemistry | other
 *   search   (optional)  Full-text search on title and description (case-insensitive)
 *   cursor   (optional)  Pagination cursor — the `id` of the last deck in the
 *                        previous page. Omit for the first page.
 *   limit    (optional)  Page size 1–50, default 20.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * RESPONSE 200
 * ─────────────────────────────────────────────────────────────────────────────
 *   {
 *     decks:      PublicDeck[],
 *     nextCursor: string | null,   // pass as `cursor` to get the next page
 *     total:      number,          // total matching decks (for "X decks found")
 *   }
 *
 * Cursor-based pagination is used (not offset) so that inserts between pages
 * do not cause duplicates or skipped rows.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';
import type { Subject } from '@/types/api';

export const runtime = 'nodejs';

const VALID_SUBJECTS: Subject[] = ['medicine', 'pharmacy', 'chemistry', 'other'];
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

interface ExploreRow {
  id: string;
  user_id: string;
  creator_name: string;
  title: string;
  description: string;
  color: string;
  emoji: string;
  slug: string;
  subject: string | null;
  card_count: string;
  created_at: string;
  updated_at: string;
}

export async function GET(req: NextRequest) {
  // Auth is optional — unauthenticated users can browse the explore page
  const user = await getAuthUser(req).catch(() => null);

  const { searchParams } = new URL(req.url);
  const subject   = searchParams.get('subject') ?? null;
  const search    = searchParams.get('search')?.trim() ?? null;
  const cursor    = searchParams.get('cursor') ?? null;
  const rawLimit  = parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10);
  const limit     = Math.min(Math.max(1, rawLimit), MAX_LIMIT);

  // Validate subject filter
  if (subject && !VALID_SUBJECTS.includes(subject as Subject)) {
    return NextResponse.json(
      { error: `subject must be one of: ${VALID_SUBJECTS.join(', ')}.` },
      { status: 400 },
    );
  }

  try {
    // ── Build dynamic WHERE conditions ────────────────────────────────────────
    const conditions: string[] = ['d.is_public = true'];
    const values: unknown[]    = [];

    if (subject) {
      values.push(subject);
      conditions.push(`d.subject = $${values.length}`);
    }

    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      conditions.push(
        `(LOWER(d.title) LIKE $${values.length} OR LOWER(d.description) LIKE $${values.length})`,
      );
    }

    if (cursor) {
      // Fetch the created_at of the cursor deck for keyset pagination
      const cursorRow = await query<{ created_at: string }>(
        'SELECT created_at FROM decks WHERE id = $1 AND is_public = true',
        [cursor],
      );
      if (cursorRow.rows[0]) {
        values.push(cursorRow.rows[0].created_at, cursor);
        conditions.push(
          `(d.created_at < $${values.length - 1} OR (d.created_at = $${values.length - 1} AND d.id < $${values.length}))`,
        );
      }
    }

    const whereClause = conditions.join(' AND ');

    // ── Count total matching decks (for pagination UI) ────────────────────────
    const countResult = await query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM decks d WHERE ${whereClause}`,
      values,
    );
    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    // ── Fetch page of decks ───────────────────────────────────────────────────
    values.push(limit + 1); // fetch one extra to determine if there's a next page
    const decksResult = await query<ExploreRow>(
      `SELECT
         d.id, d.user_id, u.name AS creator_name,
         d.title, d.description, d.color, d.emoji, d.slug, d.subject,
         COUNT(c.id)::text AS card_count,
         d.created_at, d.updated_at
       FROM decks d
       JOIN users u ON u.id = d.user_id
       LEFT JOIN cards c ON c.deck_id = d.id
       WHERE ${whereClause}
       GROUP BY d.id, u.name
       ORDER BY d.created_at DESC, d.id DESC
       LIMIT $${values.length}`,
      values,
    );

    const rows = decksResult.rows;
    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? pageRows[pageRows.length - 1].id : null;

    // ── Determine which decks the user already copied ─────────────────────────
    // A deck is "already in library" if the user owns a deck with the same slug
    // (set on copy) or if it's literally the same deck_id in their library.
    // We check by looking for the original deck_id stored in copied_from_id
    // (added below) OR by comparing slugs.
    // For now (before copy endpoint exists): mark decks the user owns themselves.
    let userDeckIds = new Set<string>();
    if (user) {
      const userDecks = await query<{ id: string }>(
        'SELECT id FROM decks WHERE user_id = $1',
        [user.userId],
      );
      userDeckIds = new Set(userDecks.rows.map((r) => r.id));
    }

    const decks = pageRows.map((row) => ({
      id:           row.id,
      userId:       row.user_id,
      creatorName:  row.creator_name,
      title:        row.title,
      description:  row.description,
      color:        row.color ?? 'indigo',
      emoji:        row.emoji ?? '📚',
      slug:         row.slug,
      subject:      row.subject,
      cardCount:    parseInt(row.card_count ?? '0', 10),
      createdAt:    row.created_at,
      updatedAt:    row.updated_at,
      alreadyCopied: userDeckIds.has(row.id),
    }));

    return NextResponse.json({ decks, nextCursor, total });
  } catch (err) {
    console.error('[GET /api/explore]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
