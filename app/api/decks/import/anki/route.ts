/**
 * POST /api/decks/import/anki
 *
 * Accepts a multipart form upload of an Anki .apkg file and creates a new
 * deck with the parsed notes as cards.
 *
 * Request: multipart/form-data
 *   file: File (.apkg)
 *
 * Response 201: { deckId: string, cardCount: number }
 * Response 400: validation error
 * Response 401: not authenticated
 * Response 500: parse or DB error
 *
 * .apkg format: ZIP archive containing:
 *   collection.anki21 or collection.anki2 — SQLite database
 *   notes.flds separates fields with ASCII 0x1f (unit separator)
 *   For basic 2-field notes: field[0] = front, field[1] = back
 */

import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FIELD_SEP = '\x1f';
const MAX_FIELD_LEN = 2000;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid multipart request.' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
  if (!file.name.toLowerCase().endsWith('.apkg')) {
    return NextResponse.json({ error: 'File must be an .apkg file.' }, { status: 400 });
  }

  const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File exceeds 50 MB limit.' }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();

    // Dynamically import to avoid bundler issues with WASM/ZIP modules
    const [JSZip, { default: initSqlJs }] = await Promise.all([
      import('jszip').then((m) => m.default),
      import('sql.js'),
    ]);

    // Extract ZIP
    const zip = await JSZip.loadAsync(buffer);
    const dbFile = zip.file('collection.anki21') ?? zip.file('collection.anki2');
    if (!dbFile) {
      return NextResponse.json({ error: 'Invalid .apkg: no collection database found.' }, { status: 400 });
    }

    const dbBuffer = await dbFile.async('arraybuffer');

    // Init sql.js with WASM binary from node_modules
    const wasmPath = join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
    const SQL = await initSqlJs({ locateFile: () => wasmPath });
    const db = new SQL.Database(new Uint8Array(dbBuffer));

    // Extract notes — each note may have 2+ fields; we use [0]=front, [1]=back
    const cards: Array<{ front: string; back: string }> = [];
    const stmt = db.prepare('SELECT flds FROM notes');
    while (stmt.step()) {
      const row = stmt.getAsObject() as { flds: string };
      const parts = row.flds.split(FIELD_SEP);
      if (parts.length >= 2) {
        const front = stripHtml(parts[0]).slice(0, MAX_FIELD_LEN);
        const back  = stripHtml(parts[1]).slice(0, MAX_FIELD_LEN);
        if (front && back) cards.push({ front, back });
      }
    }
    stmt.free();
    db.close();

    if (cards.length === 0) {
      return NextResponse.json({ error: 'No cards found in the Anki deck.' }, { status: 400 });
    }

    // Deck title from filename, strip .apkg
    const deckTitle = file.name.replace(/\.apkg$/i, '').replace(/_/g, ' ').slice(0, 200) || 'Anki Import';

    // Create the deck
    const deckResult = await query<{ id: string }>(
      `INSERT INTO decks (user_id, title, description, color, emoji)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [user.userId, deckTitle, 'Imported from Anki', 'indigo', '📚'],
    );
    const deckId = deckResult.rows[0].id;

    // Bulk insert in chunks of 100 to stay within Postgres parameter limits
    const CHUNK = 100;
    for (let i = 0; i < cards.length; i += CHUNK) {
      const chunk = cards.slice(i, i + CHUNK);
      const placeholders = chunk
        .map((_, j) => `($${j * 4 + 1}, $${j * 4 + 2}, $${j * 4 + 3}, $${j * 4 + 4})`)
        .join(', ');
      const params = chunk.flatMap((c) => [deckId, user.userId, c.front, c.back]);
      await query(
        `INSERT INTO cards (deck_id, user_id, front, back) VALUES ${placeholders}`,
        params,
      );
    }

    return NextResponse.json({ deckId, cardCount: cards.length }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/decks/import/anki]', err);
    return NextResponse.json({ error: 'Failed to parse Anki file.' }, { status: 500 });
  }
}
