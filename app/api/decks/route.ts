/**
 * /api/decks
 *
 * GET  — list all decks owned by the authenticated user
 * POST — create a new deck for the authenticated user
 *
 * GET response 200:  { decks: Deck[] }
 * POST body:         { title: string, description?: string, subject?: string }
 * POST response 201: { deck: Deck }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Shared Deck row type ─────────────────────────────────────────────────────
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
  card_count?: string; // comes back as string from COUNT()
  created_at: string;
  updated_at: string;
}

// ── GET /api/decks ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  try {
    // Join with cards to get card count per deck in a single query
    const result = await query<DeckRow>(
      `SELECT
         d.id, d.user_id, d.title, d.description, d.color, d.emoji,
         d.is_public, d.slug, d.subject,
         COUNT(c.id)::text AS card_count,
         d.created_at, d.updated_at
       FROM decks d
       LEFT JOIN cards c ON c.deck_id = d.id
       WHERE d.user_id = $1
       GROUP BY d.id
       ORDER BY d.created_at DESC`,
      [user.userId],
    );

    const decks = result.rows.map((row) => ({
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
    }));

    return NextResponse.json({ decks });
  } catch (err) {
    console.error('[GET /api/decks]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// ── POST /api/decks ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const { title, description = '', subject = null, color = 'indigo', emoji = '📚' } = body ?? {};

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json(
      { error: 'title is required.' },
      { status: 400 },
    );
  }
  if (title.trim().length > 200) {
    return NextResponse.json(
      { error: 'title must be 200 characters or fewer.' },
      { status: 400 },
    );
  }

  const VALID_SUBJECTS = ['medicine', 'pharmacy', 'chemistry', 'other'];
  if (subject !== null && !VALID_SUBJECTS.includes(subject as string)) {
    return NextResponse.json(
      { error: `subject must be one of: ${VALID_SUBJECTS.join(', ')}.` },
      { status: 400 },
    );
  }

  try {
    const result = await query<DeckRow>(
      `INSERT INTO decks (user_id, title, description, subject, color, emoji)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, title, description, color, emoji, is_public, slug, subject, created_at, updated_at`,
      [user.userId, title.trim(), String(description).slice(0, 1000), subject, String(color), String(emoji)],
    );

    const row = result.rows[0];
    const deck = {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      color: row.color ?? 'indigo',
      emoji: row.emoji ?? '📚',
      isPublic: row.is_public,
      slug: row.slug,
      subject: row.subject,
      cardCount: 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return NextResponse.json({ deck }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/decks]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
