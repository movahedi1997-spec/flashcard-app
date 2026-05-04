/**
 * GET /api/creators
 *
 * Search public creator profiles.
 *
 * QUERY PARAMETERS
 *   search  (optional)  Name or username substring
 *   page    (optional)  0-based, default 0
 *   limit   (optional)  1–50, default 20
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

interface CreatorRow {
  id:                  string;
  name:                string;
  username:            string;
  bio:                 string | null;
  avatar_url:          string | null;
  is_verified_creator: boolean;
  deck_count:          string;
  total_copies:        string;
  joined_at:           string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search   = (searchParams.get('search')?.trim() ?? '').slice(0, 100);
  const rawPage  = parseInt(searchParams.get('page') ?? '0', 10);
  const page     = Math.max(0, isNaN(rawPage) ? 0 : rawPage);
  const rawLimit = parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10);
  const limit    = Math.min(Math.max(1, rawLimit), MAX_LIMIT);
  const offset   = page * limit;

  try {
    const conditions: string[] = [
      'u.username IS NOT NULL',
      "u.username != ''",
    ];
    const values: unknown[] = [];

    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      conditions.push(
        `(LOWER(u.name) LIKE $${values.length} OR LOWER(u.username) LIKE $${values.length})`,
      );
    }

    const where = 'WHERE ' + conditions.join(' AND ');
    const nBase = values.length;

    const countRow = await query<{ total: string }>(
      `SELECT COUNT(*)::text AS total
         FROM (
           SELECT u.id
             FROM users u
             LEFT JOIN decks d ON d.user_id = u.id AND d.is_public = true
             ${where}
             GROUP BY u.id
             HAVING COUNT(DISTINCT d.id) > 0
         ) sub`,
      values,
    );
    const total = parseInt(countRow.rows[0]?.total ?? '0', 10);

    values.push(limit, offset);

    const result = await query<CreatorRow>(
      `SELECT u.id, u.name, u.username,
              u.bio, u.avatar_url,
              COALESCE(u.is_verified_creator, false) AS is_verified_creator,
              COUNT(DISTINCT d.id)::text           AS deck_count,
              COALESCE(SUM(d.copy_count::integer), 0)::text AS total_copies,
              u.created_at                         AS joined_at
         FROM users u
         LEFT JOIN decks d ON d.user_id = u.id AND d.is_public = true
         ${where}
         GROUP BY u.id
         HAVING COUNT(DISTINCT d.id) > 0
         ORDER BY
           COALESCE(u.is_verified_creator, false) DESC,
           COUNT(DISTINCT d.id) DESC,
           u.created_at DESC
         LIMIT $${nBase + 1} OFFSET $${nBase + 2}`,
      values,
    );

    const creators = result.rows.map((r) => ({
      id:               r.id,
      name:             r.name,
      username:         r.username,
      bio:              r.bio,
      avatarUrl:        r.avatar_url,
      isVerifiedCreator: r.is_verified_creator,
      deckCount:        parseInt(r.deck_count ?? '0', 10),
      totalCopies:      parseInt(r.total_copies ?? '0', 10),
      joinedAt:         r.joined_at,
    }));

    const totalPages = Math.ceil(total / limit);
    return NextResponse.json({ creators, total, page, totalPages });
  } catch (err) {
    console.error('[GET /api/creators]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
