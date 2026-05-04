#!/usr/bin/env tsx
/**
 * scripts/reassign-seed-decks.ts
 *
 * Transfers all public decks (flashcard + quiz) from one user account to
 * another. Use this to move seed decks from a personal account to the
 * official FlashcardAI creator account.
 *
 * Usage:
 *   FROM_USERNAME=momo TO_USERNAME=flashcardai npx tsx scripts/reassign-seed-decks.ts
 *
 * What changes:
 *   decks.user_id          — flashcard deck ownership
 *   cards.user_id          — cards inside those decks
 *   quiz_decks.user_id     — quiz deck ownership
 *   quiz_questions.user_id — questions inside those quiz decks
 *
 * What does NOT change:
 *   srs_state / review_log            — personal study history stays on the source account
 *   quiz_srs_state / quiz_review_log  — same
 *   explore_deck_likes                — references deck_id, not creator user_id
 *   Private decks                     — only is_public=true decks are moved
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/flashcard_dev',
});

async function main() {
  const fromUsername = process.env.FROM_USERNAME;
  const toUsername   = process.env.TO_USERNAME;

  if (!fromUsername || !toUsername) {
    console.error('❌  FROM_USERNAME and TO_USERNAME are required.');
    console.error('    FROM_USERNAME=momo TO_USERNAME=flashcardai npx tsx scripts/reassign-seed-decks.ts');
    process.exit(1);
  }

  // ── Look up both accounts ────────────────────────────────────────────────────

  const fromRow = await pool.query<{ id: string; name: string; email: string }>(
    'SELECT id, name, email FROM users WHERE username = $1',
    [fromUsername],
  );
  if ((fromRow.rowCount ?? 0) === 0) {
    console.error(`❌  No user with username "${fromUsername}"`);
    process.exit(1);
  }
  const fromUser = fromRow.rows[0]!;
  console.log(`  From : ${fromUser.name} <${fromUser.email}> [${fromUser.id}]`);

  const toRow = await pool.query<{ id: string; name: string; email: string }>(
    'SELECT id, name, email FROM users WHERE username = $1',
    [toUsername],
  );
  if ((toRow.rowCount ?? 0) === 0) {
    console.error(`❌  No user with username "${toUsername}"`);
    console.error(`    Create the account at /signup first, then re-run this script.`);
    process.exit(1);
  }
  const toUser = toRow.rows[0]!;
  console.log(`  To   : ${toUser.name} <${toUser.email}> [${toUser.id}]`);

  // ── Preview ──────────────────────────────────────────────────────────────────

  const [flashcardCount, quizCount] = await Promise.all([
    pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM decks WHERE user_id=$1 AND is_public=true',
      [fromUser.id],
    ),
    pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM quiz_decks WHERE user_id=$1 AND is_public=true',
      [fromUser.id],
    ),
  ]);
  console.log(`\n  ${flashcardCount.rows[0]!.count} public flashcard deck(s) to transfer`);
  console.log(`  ${quizCount.rows[0]!.count} public quiz deck(s) to transfer\n`);

  // ── Transfer in a single transaction ────────────────────────────────────────

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Flashcard decks ──────────────────────────────────────────────────────

    const flashDecks = await client.query<{ id: string; title: string }>(
      'SELECT id, title FROM decks WHERE user_id=$1 AND is_public=true ORDER BY title',
      [fromUser.id],
    );

    if (flashDecks.rows.length > 0) {
      const deckIds = flashDecks.rows.map((d) => d.id);

      const cardResult = await client.query(
        'UPDATE cards SET user_id=$1 WHERE deck_id = ANY($2::uuid[]) AND user_id=$3',
        [toUser.id, deckIds, fromUser.id],
      );

      const deckResult = await client.query(
        'UPDATE decks SET user_id=$1 WHERE user_id=$2 AND is_public=true',
        [toUser.id, fromUser.id],
      );

      console.log(`  ✓  ${deckResult.rowCount} flashcard deck(s) + ${cardResult.rowCount} card rows transferred:`);
      for (const d of flashDecks.rows) console.log(`       - ${d.title}`);
    } else {
      console.log('  –  No public flashcard decks to transfer.');
    }

    // ── Quiz decks ───────────────────────────────────────────────────────────

    const quizDecks = await client.query<{ id: string; title: string }>(
      'SELECT id, title FROM quiz_decks WHERE user_id=$1 AND is_public=true ORDER BY title',
      [fromUser.id],
    );

    if (quizDecks.rows.length > 0) {
      const quizDeckIds = quizDecks.rows.map((d) => d.id);

      const questionResult = await client.query(
        'UPDATE quiz_questions SET user_id=$1 WHERE quiz_deck_id = ANY($2::uuid[]) AND user_id=$3',
        [toUser.id, quizDeckIds, fromUser.id],
      );

      const quizDeckResult = await client.query(
        'UPDATE quiz_decks SET user_id=$1 WHERE user_id=$2 AND is_public=true',
        [toUser.id, fromUser.id],
      );

      console.log(`  ✓  ${quizDeckResult.rowCount} quiz deck(s) + ${questionResult.rowCount} question rows transferred:`);
      for (const d of quizDecks.rows) console.log(`       - ${d.title}`);
    } else {
      console.log('  –  No public quiz decks to transfer.');
    }

    // ── Mark destination as verified creator ─────────────────────────────────

    await client.query(
      'UPDATE users SET is_verified_creator=true WHERE id=$1',
      [toUser.id],
    );
    console.log(`  ✓  ${toUser.name} marked as verified creator`);

    await client.query('COMMIT');
    console.log('\n✅  Done.\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌  Error — rolled back. No changes were made.', err);
    process.exit(1);
  } finally {
    client.release();
  }

  await pool.end();
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
