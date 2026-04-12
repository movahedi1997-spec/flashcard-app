/**
 * lib/db.ts
 * Singleton PostgreSQL connection pool using node-postgres (pg).
 *
 * Runs in Node.js runtime only — do NOT import from Edge middleware or
 * Edge-only API routes.
 *
 * Connection string is read from DATABASE_URL environment variable.
 * In development, the pool is attached to globalThis to survive Next.js
 * hot-reloads without exhausting connection limits.
 *
 * LAZY INIT: The pool is created on the first query(), not at module load.
 * This prevents build-time errors when DATABASE_URL is absent (e.g. during
 * `next build` in CI before env vars are injected).
 */

import { Pool, type QueryResultRow } from 'pg';

// ── Extend globalThis to hold the dev pool singleton ─────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

// ── Internal singleton ref ────────────────────────────────────────────────────
let _pool: Pool | null = null;

function getPool(): Pool {
  if (_pool) return _pool;

  // Dev: reuse across hot-reloads via globalThis
  if (process.env.NODE_ENV === 'development' && globalThis._pgPool) {
    _pool = globalThis._pgPool;
    return _pool;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      '[db] DATABASE_URL is not set. Add it to .env.local:\n' +
        '  DATABASE_URL=postgresql://user:password@host:5432/flashcard_db',
    );
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Use SSL in production (e.g. Supabase, Railway, Neon)
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  pool.on('error', (err) => {
    console.error('[db] unexpected pool error:', err);
  });

  _pool = pool;

  if (process.env.NODE_ENV === 'development') {
    globalThis._pgPool = pool;
  }

  return pool;
}

/**
 * Convenience typed query helper.
 * Lazily creates the connection pool on first call.
 * Logs slow queries in development.
 *
 * @example
 *   const { rows } = await query<{ id: string; name: string }>(
 *     'SELECT id, name FROM users WHERE email = $1',
 *     [email],
 *   );
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: unknown[],
) {
  const pool  = getPool();
  const start = Date.now();
  const result = await pool.query<T>(text, values);
  const duration = Date.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log('[db]', {
      query: text.trim().slice(0, 90).replace(/\s+/g, ' '),
      duration: `${duration}ms`,
      rows: result.rowCount,
    });
  }

  return result;
}

/**
 * Expose the pool for advanced use (transactions, streaming).
 * Lazily initialised on first access.
 */
export function getDbPool(): Pool {
  return getPool();
}
