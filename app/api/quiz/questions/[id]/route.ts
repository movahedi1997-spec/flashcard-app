// PATCH/DELETE /api/quiz/questions/[id]
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const owned = await query<{ id: string }>('SELECT id FROM quiz_questions WHERE id=$1 AND user_id=$2', [params.id, user.userId]);
  if (!owned.rows[0]) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const fields: string[] = [];
  const vals: unknown[] = [];
  const push = (col: string, val: unknown) => { vals.push(val); fields.push(`${col}=$${vals.length}`); };

  if (typeof body.question_text  === 'string') push('question_text',  body.question_text.trim());
  if (typeof body.correct_answer === 'string') push('correct_answer', body.correct_answer.trim());
  if (typeof body.option_a       === 'string') push('option_a',       body.option_a.trim());
  if (typeof body.option_b       === 'string') push('option_b',       body.option_b.trim());
  if (typeof body.explanation    !== 'undefined') push('explanation', body.explanation ?? null);

  if (fields.length === 0) return NextResponse.json({ ok: true });
  push('updated_at', new Date().toISOString());
  vals.push(params.id);
  await query(`UPDATE quiz_questions SET ${fields.join(', ')} WHERE id=$${vals.length}`, vals);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owned = await query<{ id: string }>('SELECT id FROM quiz_questions WHERE id=$1 AND user_id=$2', [params.id, user.userId]);
  if (!owned.rows[0]) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  await query('DELETE FROM quiz_questions WHERE id=$1', [params.id]);
  return NextResponse.json({ ok: true });
}
