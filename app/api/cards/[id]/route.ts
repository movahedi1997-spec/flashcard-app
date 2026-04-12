/**
 * /api/cards/[id]
 *
 * GET    — fetch a single card (owner only)
 * PATCH  — update card fields (owner only)
 * DELETE — delete a card (owner only)
 *
 * Ownership is always verified against the JWT userId to prevent IDOR.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

type RouteContext = { params: { id: string } };

interface CardRow {
  id: string;
  deck_id: string;
  user_id: string;
  front: string;
  back: string;
  front_image_url: string | null;
  back_image_url: string | null;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

function formatCard(row: CardRow) {
  return {
    id: row.id,
    deckId: row.deck_id,
    userId: row.user_id,
    front: row.front,
    back: row.back,
    frontImageUrl: row.front_image_url,
    backImageUrl: row.back_image_url,
    aiGenerated: row.ai_generated,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── GET /api/cards/[id] ───────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  try {
    const result = await query<CardRow>(
      `SELECT id, deck_id, user_id, front, back,
              front_image_url, back_image_url, ai_generated,
              created_at, updated_at
       FROM cards
       WHERE id = $1 AND user_id = $2`,
      [params.id, user.userId],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Card not found.' }, { status: 404 });
    }

    return NextResponse.json({ card: formatCard(result.rows[0]) });
  } catch (err) {
    console.error('[GET /api/cards/[id]]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// ── PATCH /api/cards/[id] ─────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: 'Request body is required.' }, { status: 400 });
  }

  // Only these fields may be updated
  const ALLOWED = ['front', 'back', 'front_image_url', 'back_image_url', 'ai_generated'] as const;
  const updates: string[] = [];
  const values: unknown[] = [];

  // Map camelCase client fields → snake_case DB columns
  const fieldMap: Record<string, string> = {
    front: 'front',
    back: 'back',
    frontImageUrl: 'front_image_url',
    backImageUrl: 'back_image_url',
    aiGenerated: 'ai_generated',
  };

  for (const [clientKey, dbCol] of Object.entries(fieldMap)) {
    if (clientKey in body && ALLOWED.includes(dbCol as typeof ALLOWED[number])) {
      updates.push(`${dbCol} = $${values.length + 1}`);
      values.push(body[clientKey]);
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided.' }, { status: 400 });
  }

  // Validate text lengths
  if ('front' in body && (typeof body.front !== 'string' || body.front.trim().length === 0)) {
    return NextResponse.json({ error: 'front cannot be empty.' }, { status: 400 });
  }
  if ('back' in body && (typeof body.back !== 'string' || body.back.trim().length === 0)) {
    return NextResponse.json({ error: 'back cannot be empty.' }, { status: 400 });
  }

  // When a user manually edits a card, strip the ai_generated flag
  // (editing = implicit human verification)
  if ('front' in body || 'back' in body) {
    const aiIdx = updates.findIndex(u => u.startsWith('ai_generated'));
    if (aiIdx === -1) {
      updates.push(`ai_generated = $${values.length + 1}`);
      values.push(false);
    }
  }

  values.push(params.id, user.userId);
  const whereIdIdx = values.length - 1;
  const whereUserIdx = values.length;

  try {
    const result = await query<CardRow>(
      `UPDATE cards
       SET ${updates.join(', ')}
       WHERE id = $${whereIdIdx} AND user_id = $${whereUserIdx}
       RETURNING id, deck_id, user_id, front, back,
                 front_image_url, back_image_url, ai_generated,
                 created_at, updated_at`,
      values,
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Card not found.' }, { status: 404 });
    }

    return NextResponse.json({ card: formatCard(result.rows[0]) });
  } catch (err) {
    console.error('[PATCH /api/cards/[id]]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// ── DELETE /api/cards/[id] ────────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  try {
    // srs_state rows cascade-delete automatically (FK ON DELETE CASCADE)
    const result = await query(
      'DELETE FROM cards WHERE id = $1 AND user_id = $2',
      [params.id, user.userId],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Card not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Card deleted.' });
  } catch (err) {
    console.error('[DELETE /api/cards/[id]]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
