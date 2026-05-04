/**
 * GET /api/explore
 *
 * QUERY PARAMETERS
 *   subject  (optional)  Filter by subject
 *   search   (optional)  Full-text search on title and description
 *   sort     (optional)  'recent' (default) | 'trending'
 *   page     (optional)  0-based page number, default 0
 *   limit    (optional)  Page size 1–50, default 20
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';
import type { Subject } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_SUBJECTS: Subject[] = [
  'medicine', 'pharmacy', 'chemistry',
  'languages', 'law', 'science', 'history', 'mathematics', 'computer_science',
  'other',
];
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
type DeckTypeFilter = 'all' | 'flashcard' | 'quiz';

interface ExploreRow {
  id: string;
  user_id: string;
  creator_name: string;
  creator_username: string | null;
  is_verified_creator: boolean;
  title: string;
  description: string;
  color: string;
  emoji: string;
  slug: string;
  subject: string | null;
  card_count: string;
  copy_count: string;
  created_at: string;
  updated_at: string;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req).catch(() => null);

  const { searchParams } = new URL(req.url);
  const subject   = searchParams.get('subject') ?? null;
  const search    = searchParams.get('search')?.trim() ?? null;
  const sort      = searchParams.get('sort') === 'trending' ? 'trending' : 'recent';
  const rawDeckType = searchParams.get('deckType') ?? 'all';
  const deckType: DeckTypeFilter = ['all','flashcard','quiz'].includes(rawDeckType) ? rawDeckType as DeckTypeFilter : 'all';
  const rawPage   = parseInt(searchParams.get('page') ?? '0', 10);
  const page      = Math.max(0, isNaN(rawPage) ? 0 : rawPage);
  const rawLimit  = parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10);
  const limit     = Math.min(Math.max(1, rawLimit), MAX_LIMIT);
  const offset    = page * limit;

  if (subject && !VALID_SUBJECTS.includes(subject as Subject)) {
    return NextResponse.json(
      { error: `subject must be one of: ${VALID_SUBJECTS.join(', ')}.` },
      { status: 400 },
    );
  }

  try {
    // Build shared filter conditions (used in both halves of UNION)
    const sharedConds: string[] = [];
    const sharedVals: unknown[] = [];

    if (subject) {
      sharedVals.push(subject);
      sharedConds.push(`subject = $${sharedVals.length}`);
    }
    if (search) {
      sharedVals.push(`%${search.toLowerCase()}%`);
      sharedConds.push(`(LOWER(title) LIKE $${sharedVals.length} OR LOWER(description) LIKE $${sharedVals.length})`);
    }

    const extraWhere = sharedConds.length > 0 ? ' AND ' + sharedConds.join(' AND ') : '';
    const nShared = sharedVals.length;

    // Count total (UNION of both tables unless filtered by deckType)
    let totalCount = 0;
    if (deckType !== 'quiz') {
      const cr = await query<{ total: string }>(
        `SELECT COUNT(*)::text AS total FROM decks WHERE is_public=true${extraWhere}`, sharedVals,
      );
      totalCount += parseInt(cr.rows[0]?.total ?? '0', 10);
    }
    if (deckType !== 'flashcard') {
      const cr = await query<{ total: string }>(
        `SELECT COUNT(*)::text AS total FROM quiz_decks WHERE is_public=true${extraWhere}`, sharedVals,
      );
      totalCount += parseInt(cr.rows[0]?.total ?? '0', 10);
    }

    const orderClause = sort === 'trending'
      ? 'COALESCE(copy_count,0) DESC, created_at DESC, id DESC'
      : 'created_at DESC, id DESC';

    const queryVals = [...sharedVals, limit, offset];
    const limitParam  = `$${nShared + 1}`;
    const offsetParam = `$${nShared + 2}`;

    type UnionRow = {
      id: string; user_id: string; creator_name: string; creator_username: string | null;
      is_verified_creator: boolean; title: string; description: string;
      color: string; emoji: string; slug: string; subject: string | null;
      item_count: string; copy_count: string; created_at: string; updated_at: string;
      deck_type: string;
    };

    let unionSql = '';
    if (deckType === 'flashcard') {
      unionSql = `
        SELECT d.id, d.user_id, u.name AS creator_name, u.username AS creator_username,
               COALESCE(u.is_verified_creator,false) AS is_verified_creator,
               d.title, d.description, d.color, d.emoji, d.slug, d.subject,
               COUNT(c.id)::text AS item_count,
               COALESCE(d.copy_count,0)::text AS copy_count,
               d.created_at, d.updated_at, 'flashcard'::text AS deck_type
        FROM decks d
        JOIN users u ON u.id=d.user_id
        LEFT JOIN cards c ON c.deck_id=d.id
        WHERE d.is_public=true${extraWhere}
        GROUP BY d.id,u.name,u.username,u.is_verified_creator`;
    } else if (deckType === 'quiz') {
      unionSql = `
        SELECT qd.id, qd.user_id, u.name AS creator_name, u.username AS creator_username,
               COALESCE(u.is_verified_creator,false) AS is_verified_creator,
               qd.title, qd.description, qd.color, qd.emoji, qd.slug, qd.subject,
               COUNT(qq.id)::text AS item_count, '0' AS copy_count,
               qd.created_at, qd.updated_at, 'quiz'::text AS deck_type
        FROM quiz_decks qd
        JOIN users u ON u.id=qd.user_id
        LEFT JOIN quiz_questions qq ON qq.quiz_deck_id=qd.id
        WHERE qd.is_public=true${extraWhere}
        GROUP BY qd.id,u.name,u.username,u.is_verified_creator`;
    } else {
      unionSql = `
        SELECT d.id, d.user_id, u.name AS creator_name, u.username AS creator_username,
               COALESCE(u.is_verified_creator,false) AS is_verified_creator,
               d.title, d.description, d.color, d.emoji, d.slug, d.subject,
               COUNT(c.id)::text AS item_count,
               COALESCE(d.copy_count,0)::text AS copy_count,
               d.created_at, d.updated_at, 'flashcard'::text AS deck_type
        FROM decks d JOIN users u ON u.id=d.user_id LEFT JOIN cards c ON c.deck_id=d.id
        WHERE d.is_public=true${extraWhere}
        GROUP BY d.id,u.name,u.username,u.is_verified_creator
        UNION ALL
        SELECT qd.id, qd.user_id, u.name, u.username,
               COALESCE(u.is_verified_creator,false),
               qd.title, qd.description, qd.color, qd.emoji, qd.slug, qd.subject,
               COUNT(qq.id)::text, '0',
               qd.created_at, qd.updated_at, 'quiz'::text
        FROM quiz_decks qd JOIN users u ON u.id=qd.user_id LEFT JOIN quiz_questions qq ON qq.quiz_deck_id=qd.id
        WHERE qd.is_public=true${extraWhere}
        GROUP BY qd.id,u.name,u.username,u.is_verified_creator`;
    }

    const decksResult = await query<UnionRow>(
      `SELECT * FROM (${unionSql}) feed ORDER BY ${orderClause} LIMIT ${limitParam} OFFSET ${offsetParam}`,
      queryVals,
    );

    let userDeckIds = new Set<string>();
    if (user) {
      const ud = await query<{ id: string }>('SELECT id FROM decks WHERE user_id=$1', [user.userId]);
      userDeckIds = new Set(ud.rows.map((r) => r.id));
    }

    const decks = decksResult.rows.map((row) => ({
      id:               row.id,
      userId:           row.user_id,
      creatorName:      row.creator_name,
      creatorUsername:  row.creator_username,
      isVerifiedCreator: row.is_verified_creator,
      title:            row.title,
      description:      row.description,
      color:            row.color ?? 'indigo',
      emoji:            row.emoji ?? '📚',
      slug:             row.slug,
      subject:          row.subject,
      cardCount:        parseInt(row.item_count ?? '0', 10),
      copyCount:        parseInt(row.copy_count ?? '0', 10),
      createdAt:        row.created_at,
      updatedAt:        row.updated_at,
      alreadyCopied:    userDeckIds.has(row.id),
      deckType:         row.deck_type as 'flashcard' | 'quiz',
    }));

    const totalPages = Math.ceil(totalCount / limit);
    return NextResponse.json({ decks, total: totalCount, page, totalPages });
  } catch (err) {
    console.error('[GET /api/explore]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
