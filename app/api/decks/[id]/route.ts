/**
 * /api/decks/[id]
 *
 * GET    — fetch a single deck (owner or public)
 * PATCH  — update deck fields (owner only)
 * DELETE — delete deck + all its cards (owner only)
 *
 * All mutations verify the requesting user owns the deck to prevent IDOR.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

interface DeckRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_public: boolean;
  slug: string | null;
  subject: string | null;
  card_count?: string;
  created_at: string;
  updated_at: string;
}

type RouteContext = { params: { id: string } };

// ── GET /api/decks/[id] ───────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { id } = params;

  try {
    const result = await query<DeckRow>(
      `SELECT
         d.id, d.user_id, d.title, d.description,
         d.is_public, d.slug, d.subject,
         COUNT(c.id)::text AS card_count,
         d.created_at, d.updated_at
       FROM decks d
       LEFT JOIN cards c ON c.deck_id = d.id
       WHERE d.id = $1
         AND (d.user_id = $2 OR d.is_public = true)
       GROUP BY d.id`,
      [id, user.userId],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Deck not found.' }, { status: 404 });
    }

    const row = result.rows[0];
    return NextResponse.json({
      deck: {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        isPublic: row.is_public,
        slug: row.slug,
        subject: row.subject,
        cardCount: parseInt(row.card_count ?? '0', 10),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (err) {
    console.error('[GET /api/decks/[id]]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// ── PATCH /api/decks/[id] ─────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { id } = params;
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;

  if (!body) {
    return NextResponse.json({ error: 'Request body is required.' }, { status: 400 });
  }

  // Build dynamic SET clause from allowed fields only
  const ALLOWED = ['title', 'description', 'is_public', 'subject'] as const;
  const updates: string[] = [];
  const values: unknown[] = [];

  for (const field of ALLOWED) {
    if (field in body) {
      updates.push(`${field} = $${values.length + 1}`);
      values.push(body[field]);
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided.' }, { status: 400 });
  }

  // Verify title length if being updated
  if ('title' in body) {
    const title = body.title;
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'title cannot be empty.' }, { status: 400 });
    }
    if (title.trim().length > 200) {
      return NextResponse.json({ error: 'title must be 200 characters or fewer.' }, { status: 400 });
    }
    // Replace the value with trimmed version
    values[updates.findIndex(u => u.startsWith('title'))] = title.trim();
  }

  // Append WHERE params
  values.push(id, user.userId);
  const whereIdx = values.length;

  try {
    const result = await query<DeckRow>(
      `UPDATE decks
       SET ${updates.join(', ')}
       WHERE id = $${whereIdx - 1} AND user_id = $${whereIdx}
       RETURNING id, user_id, title, description, is_public, slug, subject, created_at, updated_at`,
      values,
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Deck not found.' }, { status: 404 });
    }

    const row = result.rows[0];
    return NextResponse.json({
      deck: {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        isPublic: row.is_public,
        slug: row.slug,
        subject: row.subject,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (err) {
    console.error('[PATCH /api/decks/[id]]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// ── DELETE /api/decks/[id] ────────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { id } = params;

  try {
    // ON DELETE CASCADE on cards and srs_state handles cleanup automatically
    const result = await query(
      'DELETE FROM decks WHERE id = $1 AND user_id = $2',
      [id, user.userId],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Deck not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Deck deleted.' });
  } catch (err) {
    console.error('[DELETE /api/decks/[id]]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
