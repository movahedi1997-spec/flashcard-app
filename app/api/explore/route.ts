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
import { VALID_SUBJECTS } from '@/lib/subjects';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
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
  const liked     = searchParams.get('liked') === 'true';
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
    // Build shared filter conditions.
    // COUNT queries have no JOIN to users, so unqualified column names are fine.
    // UNION halves JOIN to users (which also has subject/title/description),
    // so those need table-qualified names to avoid PostgreSQL ambiguity errors.
    const sharedConds: string[] = [];
    const sharedCondsD: string[] = [];   // for flashcard half (alias d)
    const sharedCondsQD: string[] = [];  // for quiz half (alias qd)
    const sharedVals: unknown[] = [];

    if (subject) {
      sharedVals.push(subject);
      const p = sharedVals.length;
      sharedConds.push(`subject = $${p}`);
      sharedCondsD.push(`d.subject = $${p}`);
      sharedCondsQD.push(`qd.subject = $${p}`);
    }
    if (search) {
      sharedVals.push(`%${search.toLowerCase()}%`);
      const p = sharedVals.length;
      sharedConds.push(`(LOWER(title) LIKE $${p} OR LOWER(description) LIKE $${p})`);
      sharedCondsD.push(`(LOWER(d.title) LIKE $${p} OR LOWER(d.description) LIKE $${p})`);
      sharedCondsQD.push(`(LOWER(qd.title) LIKE $${p} OR LOWER(qd.description) LIKE $${p})`);
    }

    const extraWhere   = sharedConds.length   > 0 ? ' AND ' + sharedConds.join(' AND ')   : '';
    const extraWhereD  = sharedCondsD.length  > 0 ? ' AND ' + sharedCondsD.join(' AND ')  : '';
    const extraWhereQD = sharedCondsQD.length > 0 ? ' AND ' + sharedCondsQD.join(' AND ') : '';
    const nShared = sharedVals.length;

    // Handle liked filter — pre-fetch the user's liked deck IDs
    let likedArrVal: string[] | null = null;
    let likedWhere        = '';  // for COUNT queries (no alias)
    let likedFlashcardWhere = ''; // for UNION flashcard half (alias d)
    let likedQuizWhere    = '';  // for UNION quiz half (alias qd)

    if (liked) {
      if (!user) return NextResponse.json({ decks: [], total: 0, page: 0, totalPages: 0 });
      try {
        const ld = await query<{ deck_id: string }>(
          'SELECT deck_id FROM explore_deck_likes WHERE user_id=$1',
          [user.userId],
        );
        if (ld.rows.length === 0) return NextResponse.json({ decks: [], total: 0, page: 0, totalPages: 0 });
        likedArrVal = ld.rows.map((r) => r.deck_id);
      } catch {
        return NextResponse.json({ decks: [], total: 0, page: 0, totalPages: 0 });
      }
      const p = nShared + 1;
      likedWhere          = ` AND id = ANY($${p}::uuid[])`;
      likedFlashcardWhere = ` AND d.id = ANY($${p}::uuid[])`;
      likedQuizWhere      = ` AND qd.id = ANY($${p}::uuid[])`;
    }

    const countVals = [...sharedVals, ...(likedArrVal ? [likedArrVal] : [])];
    const nAfterLiked = nShared + (likedArrVal ? 1 : 0);

    // Count total (UNION of both tables unless filtered by deckType)
    let totalCount = 0;
    if (deckType !== 'quiz') {
      const cr = await query<{ total: string }>(
        `SELECT COUNT(*)::text AS total FROM decks WHERE is_public=true${extraWhere}${likedWhere}`, countVals,
      );
      totalCount += parseInt(cr.rows[0]?.total ?? '0', 10);
    }
    if (deckType !== 'flashcard') {
      const cr = await query<{ total: string }>(
        `SELECT COUNT(*)::text AS total FROM quiz_decks WHERE is_public=true${extraWhere}${likedWhere}`, countVals,
      );
      totalCount += parseInt(cr.rows[0]?.total ?? '0', 10);
    }

    const orderClause = sort === 'trending'
      ? 'COALESCE(copy_count::integer,0) DESC, created_at DESC, id DESC'
      : 'created_at DESC, id DESC';

    const queryVals = [...countVals, limit, offset];
    const limitParam  = `$${nAfterLiked + 1}`;
    const offsetParam = `$${nAfterLiked + 2}`;

    type UnionRow = {
      id: string; user_id: string; creator_name: string; creator_username: string | null;
      creator_avatar_url: string | null;
      is_verified_creator: boolean; title: string; description: string;
      color: string; emoji: string; slug: string; subject: string | null;
      item_count: string; copy_count: string; created_at: string; updated_at: string;
      deck_type: string;
    };

    let unionSql = '';
    if (deckType === 'flashcard') {
      unionSql = `
        SELECT d.id, d.user_id, u.name AS creator_name, u.username AS creator_username,
               u.avatar_url AS creator_avatar_url,
               COALESCE(u.is_verified_creator,false) AS is_verified_creator,
               d.title, d.description, d.color, d.emoji, d.slug, d.subject,
               COUNT(c.id)::text AS item_count,
               COALESCE(d.copy_count::text,'0') AS copy_count,
               d.created_at, d.updated_at, 'flashcard'::text AS deck_type
        FROM decks d
        JOIN users u ON u.id=d.user_id
        LEFT JOIN cards c ON c.deck_id=d.id
        WHERE d.is_public=true${extraWhereD}${likedFlashcardWhere}
        GROUP BY d.id,u.name,u.username,u.avatar_url,u.is_verified_creator`;
    } else if (deckType === 'quiz') {
      unionSql = `
        SELECT qd.id, qd.user_id, u.name AS creator_name, u.username AS creator_username,
               u.avatar_url AS creator_avatar_url,
               COALESCE(u.is_verified_creator,false) AS is_verified_creator,
               qd.title, qd.description, qd.color, qd.emoji, qd.slug, qd.subject,
               COUNT(qq.id)::text AS item_count, '0' AS copy_count,
               qd.created_at, qd.updated_at, 'quiz'::text AS deck_type
        FROM quiz_decks qd
        JOIN users u ON u.id=qd.user_id
        LEFT JOIN quiz_questions qq ON qq.quiz_deck_id=qd.id
        WHERE qd.is_public=true${extraWhereQD}${likedQuizWhere}
        GROUP BY qd.id,u.name,u.username,u.avatar_url,u.is_verified_creator`;
    } else {
      unionSql = `
        SELECT d.id, d.user_id, u.name AS creator_name, u.username AS creator_username,
               u.avatar_url AS creator_avatar_url,
               COALESCE(u.is_verified_creator,false) AS is_verified_creator,
               d.title, d.description, d.color, d.emoji, d.slug, d.subject,
               COUNT(c.id)::text AS item_count,
               COALESCE(d.copy_count::text,'0') AS copy_count,
               d.created_at, d.updated_at, 'flashcard'::text AS deck_type
        FROM decks d JOIN users u ON u.id=d.user_id LEFT JOIN cards c ON c.deck_id=d.id
        WHERE d.is_public=true${extraWhereD}${likedFlashcardWhere}
        GROUP BY d.id,u.name,u.username,u.avatar_url,u.is_verified_creator
        UNION ALL
        SELECT qd.id, qd.user_id, u.name, u.username,
               u.avatar_url,
               COALESCE(u.is_verified_creator,false),
               qd.title, qd.description, qd.color, qd.emoji, qd.slug, qd.subject,
               COUNT(qq.id)::text, '0',
               qd.created_at, qd.updated_at, 'quiz'::text
        FROM quiz_decks qd JOIN users u ON u.id=qd.user_id LEFT JOIN quiz_questions qq ON qq.quiz_deck_id=qd.id
        WHERE qd.is_public=true${extraWhereQD}${likedQuizWhere}
        GROUP BY qd.id,u.name,u.username,u.avatar_url,u.is_verified_creator`;
    }

    const decksResult = await query<UnionRow>(
      `SELECT * FROM (${unionSql}) feed ORDER BY ${orderClause} LIMIT ${limitParam} OFFSET ${offsetParam}`,
      queryVals,
    );

    let userDeckIds  = new Set<string>();
    let likedDeckIds = new Set<string>();
    if (user) {
      const ud = await query<{ id: string }>('SELECT id FROM decks WHERE user_id=$1', [user.userId]);
      userDeckIds = new Set(ud.rows.map((r) => r.id));

      // Likes table may not exist yet if migration 015 hasn't been run — degrade gracefully
      try {
        const ld = likedArrVal
          ? { rows: likedArrVal.map((id) => ({ deck_id: id })) }
          : await query<{ deck_id: string }>('SELECT deck_id FROM explore_deck_likes WHERE user_id=$1', [user.userId]);
        likedDeckIds = new Set(ld.rows.map((r) => r.deck_id));
      } catch {
        // Table not yet migrated — isLiked will be false for all decks
      }
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
      isLiked:          likedDeckIds.has(row.id),
      creatorAvatarUrl: row.creator_avatar_url ?? null,
    }));

    const totalPages = Math.ceil(totalCount / limit);
    return NextResponse.json({ decks, total: totalCount, page, totalPages });
  } catch (err) {
    console.error('[GET /api/explore]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
