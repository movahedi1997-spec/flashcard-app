// GET/PATCH/DELETE /api/quiz/decks/[id]
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

async function ownedDeck(deckId: string, userId: string) {
  const r = await query<{ id: string }>('SELECT id FROM quiz_decks WHERE id=$1 AND user_id=$2', [deckId, userId]);
  return r.rows[0] ?? null;
}

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await ownedDeck(params.id, user.userId)) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const r = await query<{
    id: string; title: string; description: string; color: string; emoji: string;
    is_public: boolean; slug: string | null; subject: string | null;
    question_count: string; created_at: string; updated_at: string;
  }>(
    `SELECT qd.id, qd.title, qd.description, qd.color, qd.emoji, qd.is_public, qd.slug, qd.subject,
            COUNT(qq.id)::text AS question_count, qd.created_at, qd.updated_at
     FROM quiz_decks qd LEFT JOIN quiz_questions qq ON qq.quiz_deck_id = qd.id
     WHERE qd.id = $1 GROUP BY qd.id`,
    [params.id],
  );
  const d = r.rows[0];
  if (!d) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  return NextResponse.json({ deck: { id: d.id, userId: user.userId, title: d.title, description: d.description, color: d.color, emoji: d.emoji, isPublic: d.is_public, slug: d.slug, subject: d.subject, questionCount: parseInt(d.question_count, 10), createdAt: d.created_at, updatedAt: d.updated_at } });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await ownedDeck(params.id, user.userId)) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const fields: string[] = [];
  const vals: unknown[] = [];
  const push = (col: string, val: unknown) => { vals.push(val); fields.push(`${col}=$${vals.length}`); };

  if (typeof body.title       === 'string') push('title',       body.title.trim());
  if (typeof body.description === 'string') push('description', body.description.trim());
  if (typeof body.color       === 'string') push('color',       body.color);
  if (typeof body.emoji       === 'string') push('emoji',       body.emoji);
  if (typeof body.subject     !== 'undefined') push('subject',  body.subject ?? null);
  if (typeof body.isPublic    === 'boolean') push('is_public',  body.isPublic);

  if (fields.length === 0) return NextResponse.json({ ok: true });

  push('updated_at', new Date().toISOString());
  vals.push(params.id);
  await query(`UPDATE quiz_decks SET ${fields.join(', ')} WHERE id=$${vals.length}`, vals);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await ownedDeck(params.id, user.userId)) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  await query('DELETE FROM quiz_decks WHERE id=$1', [params.id]);
  return NextResponse.json({ ok: true });
}
