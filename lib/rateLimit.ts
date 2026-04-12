/**
 * lib/rateLimit.ts
 * Lightweight in-memory IP-based rate limiter — no external dependency required.
 *
 * Design notes (TASK-005):
 *  - Uses a module-level Map that persists across requests within the same
 *    Node.js process (Next.js long-running server or serverless warm instance).
 *  - Each entry tracks { count, resetAt } for a fixed sliding window.
 *  - A cleanup interval removes stale entries every 60 seconds to prevent
 *    unbounded memory growth under sustained load.
 *  - In a multi-instance / serverless deployment, each instance has its own
 *    store. For strict cross-instance limiting, swap this for a Redis-backed
 *    implementation — the interface is identical.
 *
 * Usage:
 *   import { checkRateLimit } from '@/lib/rateLimit';
 *   import { getClientIp }   from '@/lib/auth';
 *
 *   const ip     = getClientIp(req);
 *   const result = checkRateLimit(`login:${ip}`);      // default: 5 / 60s
 *   if (!result.allowed) {
 *     return NextResponse.json(
 *       { error: 'Too many requests. Try again later.' },
 *       {
 *         status: 429,
 *         headers: {
 *           'Retry-After':       String(result.retryAfter),
 *           'X-RateLimit-Limit': String(result.limit),
 *         },
 *       },
 *     );
 *   }
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // epoch ms when the window expires
}

/** Keyed by an arbitrary string — typically `"<endpoint>:<ip>"` for namespace isolation. */
const store = new Map<string, RateLimitEntry>();

// ── Stale-entry cleanup ───────────────────────────────────────────────────────
// Runs every 60 s; harmless if called before entries expire — they are re-checked
// on access anyway. Using unref() so the timer does not keep the process alive in tests.
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, 60_000);

// Allow the process to exit cleanly during testing / serverless teardown
if (typeof cleanupInterval.unref === 'function') cleanupInterval.unref();

// ─── Public API ───────────────────────────────────────────────────────────────

export interface RateLimitResult {
  /** Whether the request is within the allowed quota. */
  allowed: boolean;
  /** Requests remaining in this window (0 when blocked). */
  remaining: number;
  /** Seconds until the window resets (0 when allowed). Suitable for Retry-After header. */
  retryAfter: number;
  /** The configured ceiling for this check. */
  limit: number;
}

/**
 * checkRateLimit — evaluates whether `key` is within quota.
 *
 * @param key         Namespaced key, e.g. `"login:203.0.113.42"`.
 *                    Namespace your keys per-endpoint so login and register
 *                    have independent counters for the same IP.
 * @param maxRequests Maximum allowed attempts per window (default: 5).
 * @param windowMs    Duration of the window in milliseconds (default: 60 000 = 1 min).
 */
export function checkRateLimit(
  key: string,
  maxRequests = 5,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  let entry = store.get(key);

  // Window expired or first-ever request for this key — start a fresh window
  if (!entry || entry.resetAt <= now) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return {
      allowed: true,
      remaining: maxRequests - 1,
      retryAfter: 0,
      limit: maxRequests,
    };
  }

  // Increment within the existing window
  entry.count += 1;

  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);
  const retryAfter = allowed ? 0 : Math.ceil((entry.resetAt - now) / 1000);

  return { allowed, remaining, retryAfter, limit: maxRequests };
}
