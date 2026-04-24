# Seed Deck Guide

Seed decks are pre-built flashcard decks authored by **verified creators** and automatically copied into new users' libraries during onboarding. A user who selects "Medicine" as their subject gets the medicine seed deck; "Pharmacy" gets the pharmacy deck, and so on.

This guide explains how to create, format, and import seed decks.

---

## Subject → seed deck mapping

| Subject selected at onboarding | Seed deck title |
|---|---|
| Medicine | `Pharmacology Fundamentals — USMLE Step 1` |
| Pharmacy | `Top 200 Drugs — NAPLEX Core List` |
| Chemistry | `AP Chemistry — Equilibrium, Kinetics & Electrochemistry` |
| Other | `Pharmacology Fundamentals — USMLE Step 1` (fallback) |

The mapping is defined in `app/api/onboarding/subject/route.ts` (`STARTER_DECK_MAP`).

---

## What makes a good seed deck

- **50–200 cards** — enough to be immediately useful, not overwhelming.
- **Clear, testable fronts** — one concept per card, phrased as a question or prompt.
- **Concise, accurate backs** — answer the front directly; avoid walls of text.
- **Consistent style** — same voice and format throughout (e.g. always "What is…?" or always "Define…").
- **No images required** — seed decks are text-only for reliable copy operations.
- **Factually verified** — cards in seed decks reach every new user in that subject; errors propagate widely.

---

## Becoming a verified creator

Seed decks must be owned by a user with `is_verified_creator = true`. This flag is set by an admin.

To request verified creator status:

1. Create your deck and add at least 50 well-formed cards.
2. Make the deck public (Settings → Share → toggle "Public").
3. Contact the admin with the deck URL.
4. An admin sets `is_verified_creator = true` on your account via the admin dashboard (`/admin/users`).

Once verified, all your public decks are eligible to be used as seed decks.

---

## Importing a seed deck (admin / CLI)

If you have a CSV or JSON source, the fastest path is a direct SQL import.

### CSV format

```csv
front,back
"What is the mechanism of action of metformin?","Inhibits hepatic gluconeogenesis via Complex I of the mitochondrial respiratory chain (biguanide class)"
"First-line treatment for Type 2 diabetes?","Metformin (if tolerated and no contraindications)"
```

### Import via psql

```bash
# 1. Create the deck for the verified creator account
psql "$DATABASE_URL" <<'SQL'
INSERT INTO decks (user_id, title, description, emoji, color, subject, is_public, slug)
VALUES (
  '<creator-user-uuid>',
  'Top 200 Drugs — NAPLEX Core List',
  'Core pharmacology knowledge for pharmacy licensing.',
  '💊',
  'from-violet-500 to-purple-600',
  'pharmacy',
  true,
  'top-200-drugs-naplex-core-list'
)
RETURNING id;
SQL

# 2. Import cards from CSV (replace <deck-uuid> with the id returned above)
psql "$DATABASE_URL" -c "
\copy (SELECT '') TO '/dev/null'
"

# Easier: use a node script (see below)
```

### Import via Node script

```js
// scripts/import-seed-deck.mjs
import { Client } from 'pg';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const DB = process.env.DATABASE_URL;
const DECK_ID   = process.argv[2];   // pass deck UUID as first arg
const USER_ID   = process.argv[3];   // pass creator UUID as second arg
const CSV_PATH  = process.argv[4];   // path to your CSV file

const client = new Client({ connectionString: DB });
await client.connect();

const rows = parse(readFileSync(CSV_PATH), { columns: true, skip_empty_lines: true });

for (const { front, back } of rows) {
  await client.query(
    `INSERT INTO cards (deck_id, user_id, front, back, ai_generated)
     VALUES ($1, $2, $3, $4, false)`,
    [DECK_ID, USER_ID, front.trim(), back.trim()]
  );
}

console.log(`Imported ${rows.length} cards into deck ${DECK_ID}`);
await client.end();
```

Run it:

```bash
node scripts/import-seed-deck.mjs <deck-uuid> <creator-uuid> ./my-deck.csv
```

---

## Verifying the import

After importing, check the onboarding endpoint picks up the deck:

```bash
curl -X POST http://localhost:3000/api/onboarding/subject \
  -H "Content-Type: application/json" \
  -H "Cookie: token=<test-user-token>" \
  -d '{"subject":"pharmacy"}'
```

Expected response when the seed deck is found:

```json
{ "ok": true, "deckAdded": true, "deckId": "...", "slug": "..." }
```

If `deckAdded: false`, check:

1. The deck title matches `STARTER_DECK_MAP` exactly (case-sensitive).
2. The deck is public (`is_public = true`).
3. The owner has `is_verified_creator = true`.

---

## Adding a new subject

To support a new subject as a seed deck target:

1. Add the subject to the `validSubjects` array in `app/api/onboarding/subject/route.ts`.
2. Add an entry to `STARTER_DECK_MAP` in the same file.
3. Add the subject to the `subject` column `CHECK` constraint in the relevant migration (or create a new migration).
4. Update the subject selector in the onboarding UI (`app/onboarding/subject/page.tsx`).
5. Create and import the corresponding seed deck as described above.

---

## Deck color values

Use one of these Tailwind gradient strings for the `color` field:

| Display | Value |
|---|---|
| Indigo → Violet | `from-indigo-500 to-violet-600` |
| Violet → Purple | `from-violet-500 to-purple-600` |
| Blue → Cyan | `from-blue-500 to-cyan-500` |
| Emerald → Teal | `from-emerald-500 to-teal-600` |
| Rose → Pink | `from-rose-500 to-pink-600` |
| Amber → Orange | `from-amber-500 to-orange-600` |
| Slate → Gray | `from-slate-500 to-gray-600` |
