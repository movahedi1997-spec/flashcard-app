/**
 * Shared test fixtures for authenticated E2E tests.
 *
 * Login happens ONCE in createVerifiedUser() — the token cookie is captured
 * from the HTTP response and injected directly into each test's browser context
 * via addCookies(). This avoids hitting the login rate limit (5/min per IP)
 * during a test run with multiple authed tests.
 */
import { test as base, type Page } from '@playwright/test';
import { Client } from 'pg';

const DB = process.env.DATABASE_URL ?? 'postgresql://localhost:5432/flashcard_dev';

export const FIXTURE_EMAIL    = `qa-fixture-${Date.now()}@example.com`;
export const FIXTURE_PASSWORD = 'QaFixture1!';
export const FIXTURE_NAME     = 'QA Fixture';

// Captured once in createVerifiedUser(), reused by all authedPage fixtures
let capturedToken: string | null = null;

async function dbQuery<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const client = new Client({ connectionString: DB });
  await client.connect();
  try {
    const res = await client.query<T>(sql, params);
    return res.rows;
  } finally {
    await client.end();
  }
}

export async function createVerifiedUser(): Promise<void> {
  // Register
  const reg = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: FIXTURE_NAME,
      email: FIXTURE_EMAIL,
      password: FIXTURE_PASSWORD,
      coppa_verified: true,
    }),
  });
  if (!reg.ok) {
    const err = await reg.json() as { error?: string };
    throw new Error(`Fixture registration failed: ${err.error}`);
  }

  // Skip OTP — verify directly in DB
  await dbQuery(`UPDATE users SET email_verified = true WHERE email = $1`, [FIXTURE_EMAIL]);

  // Login once, capture the token cookie from the Set-Cookie header
  const login = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: FIXTURE_EMAIL, password: FIXTURE_PASSWORD }),
  });
  if (!login.ok) {
    throw new Error(`Fixture login failed: ${login.status}`);
  }
  const setCookie = login.headers.get('set-cookie') ?? '';
  const match = setCookie.match(/(?:^|,\s*)token=([^;,]+)/);
  capturedToken = match?.[1] ?? null;
  if (!capturedToken) throw new Error('Fixture login did not return a token cookie');
}

export async function cleanupFixtureUser(): Promise<void> {
  await dbQuery(`DELETE FROM users WHERE email = $1`, [FIXTURE_EMAIL]);
  capturedToken = null;
}

/** Dismisses the /flashcards splash screen if visible. */
export async function dismissSplash(page: Page): Promise<void> {
  const splash = page.getByRole('button', { name: /get started/i });
  if (await splash.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await splash.click();
  }
}

/** Dismisses the PWA install prompt if visible (appears on mobile browsers). */
export async function dismissPWA(page: Page): Promise<void> {
  const btn = page.getByRole('button', { name: /maybe later/i });
  if (await btn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await btn.click();
  }
}

export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    if (!capturedToken) throw new Error('No auth token — did beforeAll run createVerifiedUser()?');

    // Inject the token cookie directly — no UI login needed
    await page.context().addCookies([{
      name:     'token',
      value:    capturedToken,
      domain:   'localhost',
      path:     '/',
      httpOnly: true,
      secure:   false,
      sameSite: 'Lax',
    }]);

    await page.goto('/flashcards');
    await dismissSplash(page);
    await dismissPWA(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
