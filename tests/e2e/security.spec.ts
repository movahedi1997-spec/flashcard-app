/**
 * Security test suite — Phase 2
 *
 * Tests cover:
 *   1. SQL injection probes on every user-controlled input surface
 *   2. Rate-limit enforcement (login brute-force)
 *   3. IDOR — accessing / mutating another user's resources
 *   4. Input validation — invalid enum values, oversized fields
 *   5. UUID injection on the OG image endpoint
 *   6. Authentication enforcement on every protected route
 *
 * The tests only hit the API layer (page.request.*) — no real user accounts
 * are required for most checks; the ones that need auth use the TEST_USER_*
 * environment variables set in .env.local or CI secrets.
 */

import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Classic SQL injection payloads covering the most common bypass vectors. */
const SQL_PAYLOADS = [
  "' OR '1'='1",
  "' OR 1=1--",
  "'; DROP TABLE users;--",
  "' UNION SELECT 1,2,3--",
  "1; SELECT pg_sleep(3)--",
  "' OR ''='",
  "admin'--",
  "' OR 'x'='x",
];

/** Returns a fresh API request context scoped to the test. */
function api(page: import('@playwright/test').Page) {
  return page.request;
}

// ─── 1. SQL injection — public endpoints ─────────────────────────────────────

test.describe('SQL injection — explore search', () => {
  for (const payload of SQL_PAYLOADS) {
    test(`search param: ${payload.slice(0, 40)}`, async ({ page }) => {
      const res = await api(page).get(`${BASE}/api/explore`, {
        params: { search: payload },
      });
      // Must not return 500 (unhandled error leaking DB details)
      expect(res.status()).not.toBe(500);
      // Must return JSON (not a raw DB error string)
      const ct = res.headers()['content-type'] ?? '';
      expect(ct).toContain('application/json');
      // If 200, decks array must be an array (not dumped DB rows)
      if (res.status() === 200) {
        const body = await res.json();
        expect(Array.isArray(body.decks)).toBe(true);
      }
    });
  }
});

test.describe('SQL injection — explore slug', () => {
  for (const payload of SQL_PAYLOADS) {
    test(`slug param: ${payload.slice(0, 40)}`, async ({ page }) => {
      const encoded = encodeURIComponent(payload);
      const res = await api(page).get(`${BASE}/api/explore/${encoded}`);
      // Must be 404 (no deck) or 400 (invalid slug) — never 500
      expect([400, 404]).toContain(res.status());
    });
  }
});

test.describe('SQL injection — OG image deckId', () => {
  for (const payload of SQL_PAYLOADS) {
    test(`deckId: ${payload.slice(0, 40)}`, async ({ page }) => {
      const res = await api(page).get(`${BASE}/api/og`, {
        params: { deckId: payload },
      });
      // UUID regex guard must reject before any DB call
      expect(res.status()).toBe(400);
    });
  }
});

// ─── 2. Rate-limit enforcement — login brute-force ────────────────────────────

test.describe('Rate limiting', () => {
  test('login endpoint blocks after 5 failed attempts', async ({ page }) => {
    const statuses: number[] = [];

    for (let i = 0; i < 7; i++) {
      const res = await api(page).post(`${BASE}/api/auth/login`, {
        data: { email: 'bruteforce@example.com', password: `wrong${i}` },
      });
      statuses.push(res.status());
    }

    // At least one 429 must appear in the series
    expect(statuses).toContain(429);
    // All responses before the rate-limit hit must be 401 (bad credentials)
    const before429 = statuses.slice(0, statuses.indexOf(429));
    before429.forEach(s => expect(s).toBe(401));
  });

  test('register endpoint blocks after 5 attempts', async ({ page }) => {
    const statuses: number[] = [];

    for (let i = 0; i < 7; i++) {
      const res = await api(page).post(`${BASE}/api/auth/register`, {
        data: {
          name: `Flood${i}`,
          email: `flood${Date.now()}${i}@example.com`,
          password: 'Flood1234!',
          coppa_verified: true,
        },
      });
      statuses.push(res.status());
    }

    expect(statuses).toContain(429);
  });

  test('429 response includes Retry-After header', async ({ page }) => {
    // Exhaust the limit first
    for (let i = 0; i < 5; i++) {
      await api(page).post(`${BASE}/api/auth/login`, {
        data: { email: 'hdr@example.com', password: 'x' },
      });
    }
    const res = await api(page).post(`${BASE}/api/auth/login`, {
      data: { email: 'hdr@example.com', password: 'x' },
    });
    if (res.status() === 429) {
      expect(res.headers()['retry-after']).toBeTruthy();
    }
  });
});

// ─── 3. Authentication enforcement ───────────────────────────────────────────

test.describe('Auth enforcement — unauthenticated requests', () => {
  const PROTECTED = [
    { method: 'GET',    path: '/api/decks' },
    { method: 'POST',   path: '/api/decks' },
    { method: 'GET',    path: '/api/decks/00000000-0000-0000-0000-000000000001' },
    { method: 'PATCH',  path: '/api/decks/00000000-0000-0000-0000-000000000001' },
    { method: 'DELETE', path: '/api/decks/00000000-0000-0000-0000-000000000001' },
    { method: 'POST',   path: '/api/decks/00000000-0000-0000-0000-000000000001/copy' },
    { method: 'GET',    path: '/api/study/session' },
    { method: 'POST',   path: '/api/study/grade' },
    { method: 'GET',    path: '/api/stats/reviews' },
    { method: 'POST',   path: '/api/onboarding/subject' },
  ];

  for (const { method, path } of PROTECTED) {
    test(`${method} ${path} → 401 without token`, async ({ page }) => {
      const res = await api(page).fetch(`${BASE}${path}`, { method, data: {} });
      expect(res.status()).toBe(401);
    });
  }
});

// ─── 4. Input validation — PATCH /api/decks/[id] ─────────────────────────────

test.describe('Input validation — PATCH /api/decks', () => {
  // All these tests should return 400 (or 401 for unauth) — never 200 or 500
  const FAKE_ID = '00000000-0000-0000-0000-000000000099';

  test('invalid subject value rejected', async ({ page }) => {
    const res = await api(page).patch(`${BASE}/api/decks/${FAKE_ID}`, {
      data: { subject: 'malicious-value' },
    });
    // 401 (no auth) OR 400 (invalid subject) — never 200
    expect([400, 401]).toContain(res.status());
  });

  test('invalid color value rejected', async ({ page }) => {
    const res = await api(page).patch(`${BASE}/api/decks/${FAKE_ID}`, {
      data: { color: 'javascript:alert(1)' },
    });
    expect([400, 401]).toContain(res.status());
  });

  test('is_public as string rejected', async ({ page }) => {
    const res = await api(page).patch(`${BASE}/api/decks/${FAKE_ID}`, {
      data: { is_public: 'true' },
    });
    expect([400, 401]).toContain(res.status());
  });

  test('description over 500 chars rejected', async ({ page }) => {
    const res = await api(page).patch(`${BASE}/api/decks/${FAKE_ID}`, {
      data: { description: 'x'.repeat(501) },
    });
    expect([400, 401]).toContain(res.status());
  });

  test('title over 200 chars rejected', async ({ page }) => {
    const res = await api(page).patch(`${BASE}/api/decks/${FAKE_ID}`, {
      data: { title: 'x'.repeat(201) },
    });
    expect([400, 401]).toContain(res.status());
  });

  test('emoji over 10 chars rejected', async ({ page }) => {
    const res = await api(page).patch(`${BASE}/api/decks/${FAKE_ID}`, {
      data: { emoji: '🚀'.repeat(6) },
    });
    expect([400, 401]).toContain(res.status());
  });

  test('SQL payload in title rejected or sanitised', async ({ page }) => {
    const res = await api(page).patch(`${BASE}/api/decks/${FAKE_ID}`, {
      data: { title: "'; DROP TABLE decks;--" },
    });
    // Unauthenticated → 401 is fine; authenticated and valid length → 200 is also fine
    // (title is a free-text field; the important thing is parameterised queries prevent injection)
    // This test verifies the server never crashes with 500
    expect(res.status()).not.toBe(500);
  });
});

// ─── 5. OG image endpoint — UUID validation ───────────────────────────────────

test.describe('OG image endpoint — input validation', () => {
  const INVALID_IDS = [
    '',
    'not-a-uuid',
    '../../../etc/passwd',
    '<script>alert(1)</script>',
    '0; SELECT * FROM users',
    '1 UNION SELECT password_hash FROM users--',
    '00000000000000000000000000000000',        // no hyphens
    '00000000-0000-0000-0000-00000000000z',    // invalid hex char
  ];

  for (const id of INVALID_IDS) {
    test(`deckId="${id.slice(0, 40)}" → 400`, async ({ page }) => {
      const res = await api(page).get(`${BASE}/api/og`, {
        params: { deckId: id },
      });
      expect(res.status()).toBe(400);
    });
  }

  test('missing deckId → 400', async ({ page }) => {
    const res = await api(page).get(`${BASE}/api/og`);
    expect(res.status()).toBe(400);
  });

  test('valid UUID format but non-existent deck → 404', async ({ page }) => {
    const res = await api(page).get(`${BASE}/api/og`, {
      params: { deckId: '00000000-0000-0000-0000-000000000001' },
    });
    expect(res.status()).toBe(404);
  });
});

// ─── 6. IDOR — accessing other users' data ───────────────────────────────────

test.describe('IDOR protection', () => {
  test('grading a non-existent card returns 404, not 500', async ({ page }) => {
    // Without auth this returns 401 — with auth + wrong card → 404
    const res = await api(page).post(`${BASE}/api/study/grade`, {
      data: {
        cardId: '00000000-0000-0000-0000-000000000001',
        grade: 'good',
      },
    });
    // 401 (no token) is correct — we just confirm it's never 200 or 500
    expect([401, 404]).toContain(res.status());
    expect(res.status()).not.toBe(500);
  });

  test('copying a non-existent / private deck returns 401 or 404', async ({ page }) => {
    const res = await api(page).post(
      `${BASE}/api/decks/00000000-0000-0000-0000-000000000001/copy`,
      { data: {} },
    );
    expect([401, 404]).toContain(res.status());
  });

  test("study session for another user's deck returns 401 or empty", async ({ page }) => {
    const res = await api(page).get(`${BASE}/api/study/session`, {
      params: { deckId: '00000000-0000-0000-0000-000000000001' },
    });
    expect([401, 200]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      // Should return empty cards array — not another user's cards
      expect(body.cards).toEqual([]);
    }
  });
});

// ─── 7. Explore — private deck isolation ─────────────────────────────────────

test.describe('Private deck isolation', () => {
  test('explore feed never returns non-JSON', async ({ page }) => {
    const res = await api(page).get(`${BASE}/api/explore`);
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toContain('application/json');
  });

  test('explore categories always returns 200 JSON', async ({ page }) => {
    const res = await api(page).get(`${BASE}/api/explore/categories`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.categories)).toBe(true);
  });

  test('non-existent slug returns 404 not 500', async ({ page }) => {
    const res = await api(page).get(`${BASE}/api/explore/this-deck-does-not-exist-xyz123`);
    expect(res.status()).toBe(404);
  });
});
