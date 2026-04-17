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

/**
 * Generates a URL-safe slug from a deck title.
 * Appends a 6-character random suffix to ensure uniqueness.
 * e.g. "USMLE Step 1 Cardiology" → "usmle-step-1-cardiology-a3b4c5"
 */
function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
    .replace(/-$/, '');
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || 'deck'}-${suffix}`;
}

export const runtime = 'nodejs';

interface DeckRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  color: string;
  emoji: string;
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
         d.id, d.user_id, d.title, d.description, d.color, d.emoji,
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
        color: row.color ?? 'indigo',
        emoji: row.emoji ?? '📚',
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

  // ── Per-field validation before touching the DB ───────────────────────────
  const VALID_SUBJECTS = ['medicine', 'pharmacy', 'chemistry', 'other'] as const;
  const VALID_COLORS   = ['indigo', 'emerald', 'amber', 'rose', 'sky']  as const;

  if ('title' in body) {
    const t = body.title;
    if (!t || typeof t !== 'string' || t.trim().length === 0)
      return NextResponse.json({ error: 'title cannot be empty.' }, { status: 400 });
    if (t.trim().length > 200)
      return NextResponse.json({ error: 'title must be 200 characters or fewer.' }, { status: 400 });
  }
  if ('description' in body) {
    const d = body.description;
    if (typeof d !== 'string')
      return NextResponse.json({ error: 'description must be a string.' }, { status: 400 });
    if (d.length > 500)
      return NextResponse.json({ error: 'description must be 500 characters or fewer.' }, { status: 400 });
  }
  if ('is_public' in body && typeof body.is_public !== 'boolean')
    return NextResponse.json({ error: 'is_public must be a boolean.' }, { status: 400 });
  if ('subject' in body && body.subject !== null && !VALID_SUBJECTS.includes(body.subject as never))
    return NextResponse.json({ error: `subject must be one of: ${VALID_SUBJECTS.join(', ')}.` }, { status: 400 });
  if ('color' in body && !VALID_COLORS.includes(body.color as never))
    return NextResponse.json({ error: `color must be one of: ${VALID_COLORS.join(', ')}.` }, { status: 400 });
  if ('emoji' in body) {
    const e = body.emoji;
    if (typeof e !== 'string' || e.length === 0 || e.length > 10)
      return NextResponse.json({ error: 'emoji must be a non-empty string of ≤10 characters.' }, { status: 400 });
  }

  // Build dynamic SET clause from allowed fields only
  const ALLOWED = ['title', 'description', 'is_public', 'subject', 'color', 'emoji'] as const;
  const updates: string[] = [];
  const values: unknown[] = [];

  for (const field of ALLOWED) {
    if (field in body) {
      const val = field === 'title'
        ? (body.title as string).trim()
        : body[field];
      updates.push(`${field} = $${values.length + 1}`);
      values.push(val);
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided.' }, { status: 400 });
  }

  // Auto-generate a slug when the deck is being made public for the first time.
  // If the deck already has a slug, keep it (making a deck private then public
  // again preserves its original shareable URL).
  if (body.is_public === true) {
    const existing = await query<{ slug: string | null; title: string }>(
      'SELECT slug, title FROM decks WHERE id = $1 AND user_id = $2',
      [id, user.userId],
    );
    if ((existing.rowCount ?? 0) > 0 && !existing.rows[0].slug) {
      const deckTitle = ('title' in body && typeof body.title === 'string')
        ? body.title.trim()
        : existing.rows[0].title;

      // Retry up to 5 times on the (astronomically unlikely) slug collision
      let slug = generateSlug(deckTitle);
      for (let attempt = 0; attempt < 5; attempt++) {
        const collision = await query<{ id: string }>(
          'SELECT id FROM decks WHERE slug = $1',
          [slug],
        );
        if ((collision.rowCount ?? 0) === 0) break;
        slug = generateSlug(deckTitle); // regenerate on collision
      }

      updates.push(`slug = $${values.length + 1}`);
      values.push(slug);
    }
  }

  // Append WHERE params
  values.push(id, user.userId);
  const whereIdx = values.length;

  try {
    const result = await query<DeckRow>(
      `UPDATE decks
       SET ${updates.join(', ')}
       WHERE id = $${whereIdx - 1} AND user_id = $${whereIdx}
       RETURNING id, user_id, title, description, color, emoji, is_public, slug, subject, created_at, updated_at`,
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
        color: row.color ?? 'indigo',
        emoji: row.emoji ?? '📚',
        isPublic: row.is_public,
        slug: row.slug,
        subject: row.subject,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (err: unknown) {
    // Unique constraint violation on slug (race condition between check and UPDATE)
    if (
      typeof err === 'object' && err !== null &&
      'code' in err && (err as { code: string }).code === '23505' &&
      'constraint' in err && String((err as { constraint: string }).constraint).includes('slug')
    ) {
      return NextResponse.json(
        { error: 'Slug collision — please retry making the deck public.' },
        { status: 409 },
      );
    }
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
