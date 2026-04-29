import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getClientIp } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { query } from '@/lib/db';

// Maps locale → subject → seed deck title (must match the "title" field in scripts/seeds/)
const STARTER_DECK_MAP: Record<string, Record<string, string>> = {
  en: {
    medicine:  'Pharmacology Fundamentals — USMLE Step 1',
    pharmacy:  'Top 200 Drugs — NAPLEX Core List',
    chemistry: 'AP Chemistry — Equilibrium, Kinetics & Electrochemistry',
    other:     'Pharmacology Fundamentals — USMLE Step 1',
  },
  de: {
    medicine:  'Pharmakologie Grundlagen — Physikum',
    pharmacy:  'Top 200 Arzneimittel — Pharmazeutische Grundlagen',
    chemistry: 'Organische Chemie — Grundlagen & Reaktionen',
    other:     'Pharmakologie Grundlagen — Physikum',
  },
  fr: {
    medicine:  'Pharmacologie Fondamentale — EDN',
    pharmacy:  'Top 200 Médicaments — Pharmacie Clinique',
    chemistry: 'Chimie Organique — Fondamentaux & Réactions',
    other:     'Pharmacologie Fondamentale — EDN',
  },
  es: {
    medicine:  'Farmacología Básica — MIR',
    pharmacy:  'Top 200 Fármacos — Farmacia Clínica',
    chemistry: 'Química Orgánica — Fundamentos y Reacciones',
    other:     'Farmacología Básica — MIR',
  },
  fa: {
    medicine:  'داروشناسی پایه — کنکور علوم پزشکی',
    pharmacy:  '200 داروی برتر — داروسازی بالینی',
    chemistry: 'شیمی آلی — مفاهیم پایه و واکنش‌ها',
    other:     'داروشناسی پایه — کنکور علوم پزشکی',
  },
};

const SUPPORTED_LOCALES = Object.keys(STARTER_DECK_MAP);

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

  const ip = getClientIp(req);
  const rl = checkRateLimit(`onboarding:${ip}`);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const body = await req.json().catch(() => ({}));
  const subject: string = body.subject ?? 'other';
  const locale: string = body.locale ?? 'en';
  const validSubjects = ['medicine', 'pharmacy', 'chemistry', 'other'];
  if (!validSubjects.includes(subject)) {
    return NextResponse.json({ error: 'Invalid subject' }, { status: 400 });
  }

  // Resolve locale deck map — fall back to English if locale is unsupported
  const resolvedLocale = SUPPORTED_LOCALES.includes(locale) ? locale : 'en';
  const localeMap = STARTER_DECK_MAP[resolvedLocale];

  // 1. Persist subject preference on user profile
  await query(
    `UPDATE users SET subject_preference = $1 WHERE id = $2`,
    [subject, user.userId]
  ).catch(() => {
    // Column may not exist yet — migration 007 adds it; fail silently
  });

  // 2. Find a verified-creator seed deck for this subject + locale, fall back to English
  const deckTitle = localeMap[subject];
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
    // Locale-specific deck not found — try English fallback before giving up
    if (resolvedLocale !== 'en') {
      const fallbackTitle = STARTER_DECK_MAP['en'][subject];
      const fallbackRows = await query<{
        id: string; title: string; description: string; emoji: string; color: string; subject: string;
      }>(
        `SELECT d.id, d.title, d.description, d.emoji, d.color, d.subject
         FROM decks d JOIN users u ON u.id = d.user_id
         WHERE u.is_verified_creator = true AND d.title = $1 AND d.is_public = true LIMIT 1`,
        [fallbackTitle]
      );
      if (fallbackRows.rows.length > 0) {
        seedRows.rows.push(fallbackRows.rows[0]);
      }
    }
    if (seedRows.rows.length === 0) {
      return NextResponse.json({ ok: true, deckAdded: false });
    }
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
    `INSERT INTO decks (user_id, title, description, emoji, color, subject, slug, is_public, copied_from_id)
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
