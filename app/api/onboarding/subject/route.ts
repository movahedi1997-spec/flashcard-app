import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

// Maps subject → preferred seed deck title to copy into the user's library
const STARTER_DECK_MAP: Record<string, string> = {
  medicine:  'Pharmacology Fundamentals — USMLE Step 1',
  pharmacy:  'Top 200 Drugs — NAPLEX Core List',
  chemistry: 'AP Chemistry — Equilibrium, Kinetics & Electrochemistry',
  other:     'Pharmacology Fundamentals — USMLE Step 1',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const subject: string = body.subject ?? 'other';
  const validSubjects = ['medicine', 'pharmacy', 'chemistry', 'other'];
  if (!validSubjects.includes(subject)) {
    return NextResponse.json({ error: 'Invalid subject' }, { status: 400 });
  }

  // 1. Persist subject preference on user profile
  await query(
    `UPDATE users SET subject_preference = $1 WHERE id = $2`,
    [subject, user.userId]
  ).catch(() => {
    // Column may not exist yet — migration 007 adds it; fail silently
  });

  // 2. Find a verified-creator seed deck for this subject
  const deckTitle = STARTER_DECK_MAP[subject];
  const seedRows = await query<{
    id: string;
    title: string;
    description: string;
    emoji: string;
    color: string;
    subject: string;
  }>(
    `SELECT d.id, d.title, d.description, d.emoji, d.color, d.subject
     FROM decks d
     JOIN users u ON u.id = d.user_id
     WHERE u.is_verified_creator = true
       AND d.title = $1
       AND d.is_public = true
     LIMIT 1`,
    [deckTitle]
  );

  if (seedRows.rows.length === 0) {
    // Seeds not imported yet — return success without adding a deck
    return NextResponse.json({ ok: true, deckAdded: false });
  }

  const source = seedRows.rows[0];

  // 3. Check user doesn't already have a deck with the same title
  const existing = await query(
    `SELECT id FROM decks WHERE user_id = $1 AND title = $2 LIMIT 1`,
    [user.userId, source.title]
  );
  if (existing.rows.length > 0) {
    return NextResponse.json({ ok: true, deckAdded: false });
  }

  // 4. Generate unique slug for this user
  let baseSlug = slugify(source.title);
  let slug = baseSlug;
  for (let i = 1; i <= 5; i++) {
    const collision = await query(`SELECT id FROM decks WHERE slug = $1 LIMIT 1`, [slug]);
    if (collision.rows.length === 0) break;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
  }

  // 5. Copy deck record
  const newDeck = await query<{ id: string }>(
    `INSERT INTO decks (user_id, title, description, emoji, color, subject, slug, is_public, copied_from)
     VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8)
     RETURNING id`,
    [
      user.userId,
      source.title,
      source.description,
      source.emoji,
      source.color,
      source.subject,
      slug,
      source.id,
    ]
  );
  const newDeckId = newDeck.rows[0].id;

  // 6. Copy all cards from the seed deck
  await query(
    `INSERT INTO cards (deck_id, user_id, front, back, ai_generated)
     SELECT $1, $2, front, back, ai_generated
     FROM cards
     WHERE deck_id = $3`,
    [newDeckId, user.userId, source.id]
  );

  // 7. Update copy count on source deck
  await query(
    `UPDATE decks SET copy_count = COALESCE(copy_count, 0) + 1 WHERE id = $1`,
    [source.id]
  );

  return NextResponse.json({ ok: true, deckAdded: true, deckId: newDeckId, slug });
}
