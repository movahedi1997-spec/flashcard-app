#!/usr/bin/env tsx
/**
 * scripts/import-seed-decks.ts — TASK-018
 *
 * Idempotent seed deck importer.
 * Reads every JSON file in scripts/seeds/ and upserts decks + cards
 * into the database under the verified creator account.
 *
 * Usage:
 *   SEED_CREATOR_EMAIL=creator@flashcard.app npx tsx scripts/import-seed-decks.ts
 *
 * Idempotency:
 *   A deck with the same (user_id, title) already in the DB is skipped.
 *   Run this script as many times as needed — it will not create duplicates.
 *
 * Seed JSON format (see scripts/seeds/*.json):
 *   {
 *     "title":       string,
 *     "description": string,
 *     "emoji":       string,
 *     "color":       "indigo"|"emerald"|"amber"|"rose"|"sky",
 *     "subject":     "medicine"|"pharmacy"|"chemistry"|"other",
 *     "cards": [
 *       { "front": string, "back": string }
 *     ]
 *   }
 */

import fs   from 'fs';
import path from 'path';
import { Pool } from 'pg';

// ── DB connection (same env vars as the app) ──────────────────────────────────

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/flashcard_dev',
});

// ── Slug generation (mirrors app/api/decks/[id]/route.ts) ────────────────────

function generateSlug(title: string): string {
  const base = title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '').trim()
    .replace(/\s+/g, '-').replace(/-+/g, '-')
    .slice(0, 50).replace(/-$/, '');
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || 'deck'}-${suffix}`;
}

// ── Seed deck type ────────────────────────────────────────────────────────────

interface SeedCard { front: string; back: string }
interface SeedDeck {
  title:       string;
  description: string;
  emoji:       string;
  color:       string;
  subject:     string;
  cards:       SeedCard[];
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const creatorEmail = process.env.SEED_CREATOR_EMAIL;
  if (!creatorEmail) {
    console.error('❌  SEED_CREATOR_EMAIL environment variable is required.');
    process.exit(1);
  }

  // Look up the creator account
  const userResult = await pool.query<{ id: string; name: string }>(
    'SELECT id, name FROM users WHERE email = $1',
    [creatorEmail],
  );
  if (userResult.rowCount === 0) {
    console.error(`❌  No user found with email: ${creatorEmail}`);
    process.exit(1);
  }
  const creator = userResult.rows[0];
  console.log(`✓  Creator: ${creator.name} (${creator.id})`);

  // Ensure the creator has is_verified_creator = true
  await pool.query(
    'UPDATE users SET is_verified_creator = true WHERE id = $1',
    [creator.id],
  );

  // Read all seed JSON files
  const seedsDir = path.join(process.cwd(), 'scripts', 'seeds');
  const files = fs.readdirSync(seedsDir).filter((f) => f.endsWith('.json'));
  console.log(`\n📂  Found ${files.length} seed file(s) in scripts/seeds/\n`);

  let imported = 0;
  let skipped  = 0;

  for (const file of files) {
    const raw  = fs.readFileSync(path.join(seedsDir, file), 'utf-8');
    const deck = JSON.parse(raw) as SeedDeck;

    // Idempotency check — skip if deck with same title already exists for this user
    const existing = await pool.query<{ id: string }>(
      'SELECT id FROM decks WHERE user_id = $1 AND title = $2 LIMIT 1',
      [creator.id, deck.title],
    );
    if ((existing.rowCount ?? 0) > 0) {
      console.log(`  ⏭  Skip  "${deck.title}" (already exists)`);
      skipped++;
      continue;
    }

    // Generate a unique slug
    let slug = generateSlug(deck.title);
    for (let i = 0; i < 5; i++) {
      const collision = await pool.query<{ id: string }>(
        'SELECT id FROM decks WHERE slug = $1 LIMIT 1',
        [slug],
      );
      if ((collision.rowCount ?? 0) === 0) break;
      slug = generateSlug(deck.title);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert deck
      const newDeck = await client.query<{ id: string }>(
        `INSERT INTO decks
           (user_id, title, description, emoji, color, subject, is_public, slug)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7)
         RETURNING id`,
        [creator.id, deck.title, deck.description, deck.emoji, deck.color, deck.subject, slug],
      );
      const deckId = newDeck.rows[0].id;

      // Bulk insert cards — each card row uses explicit $1/$2 for deck_id/user_id
      // and unique params for front/back to avoid UUID type coercion issues
      if (deck.cards.length > 0) {
        const placeholders = deck.cards
          .map((_, i) => `($1::uuid, $2::uuid, $${i * 2 + 3}, $${i * 2 + 4})`)
          .join(', ');
        const values: unknown[] = [deckId, creator.id, ...deck.cards.flatMap((c) => [c.front, c.back])];
        await client.query(
          `INSERT INTO cards (deck_id, user_id, front, back) VALUES ${placeholders}`,
          values,
        );
      }

      await client.query('COMMIT');
      console.log(`  ✓  Import "${deck.title}" — ${deck.cards.length} cards [/explore/${slug}]`);
      imported++;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  ✗  Error importing "${deck.title}":`, err);
    } finally {
      client.release();
    }
  }

  console.log(`\n✅  Done — ${imported} imported, ${skipped} skipped.\n`);
  await pool.end();
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
