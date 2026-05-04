// GET  /api/quiz/decks        — list user's quiz decks
// POST /api/quiz/decks        — create quiz deck
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function slugify(title: string, id: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
  return `${base}-${id.slice(0, 8)}`;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await query<{
    id: string; title: string; description: string; color: string; emoji: string;
    is_public: boolean; slug: string | null; subject: string | null;
    question_count: string; created_at: string; updated_at: string;
  }>(
    `SELECT qd.id, qd.title, qd.description, qd.color, qd.emoji, qd.is_public, qd.slug, qd.subject,
            COUNT(qq.id)::text AS question_count,
            qd.created_at, qd.updated_at
     FROM quiz_decks qd
     LEFT JOIN quiz_questions qq ON qq.quiz_deck_id = qd.id
     WHERE qd.user_id = $1
     GROUP BY qd.id
     ORDER BY qd.created_at DESC`,
    [user.userId],
  );

  const decks = rows.rows.map((r) => ({
    id: r.id, userId: user.userId,
    title: r.title, description: r.description,
    color: r.color, emoji: r.emoji,
    isPublic: r.is_public, slug: r.slug,
    subject: r.subject, questionCount: parseInt(r.question_count, 10),
    createdAt: r.created_at, updatedAt: r.updated_at,
  }));
  return NextResponse.json({ decks });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const { title, description, color, emoji, subject } = body ?? {};

  if (!title || typeof title !== 'string' || !title.trim())
    return NextResponse.json({ error: 'title is required.' }, { status: 400 });

  const row = await query<{ id: string; created_at: string; updated_at: string }>(
    `INSERT INTO quiz_decks (user_id, title, description, color, emoji, subject)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, created_at, updated_at`,
    [
      user.userId,
      title.trim(),
      typeof description === 'string' ? description.trim() : '',
      typeof color === 'string' ? color : 'indigo',
      typeof emoji === 'string' ? emoji : '🧠',
      typeof subject === 'string' ? subject : null,
    ],
  );
  const r = row.rows[0]!;
  const slug = slugify(title.trim(), r.id);
  await query('UPDATE quiz_decks SET slug = $1 WHERE id = $2', [slug, r.id]);

  return NextResponse.json({
    deck: {
      id: r.id, userId: user.userId,
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      color: typeof color === 'string' ? color : 'indigo',
      emoji: typeof emoji === 'string' ? emoji : '🧠',
      isPublic: false, slug,
      subject: typeof subject === 'string' ? subject : null,
      questionCount: 0,
      createdAt: r.created_at, updatedAt: r.updated_at,
    },
  }, { status: 201 });
}
