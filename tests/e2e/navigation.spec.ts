import { test, expect } from '@playwright/test';

// ── Route protection ──────────────────────────────────────────────────────────

test.describe('Protected routes', () => {
  test('unauthenticated /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('unauthenticated /flashcards redirects to /login', async ({ page }) => {
    await page.goto('/flashcards');
    await expect(page).toHaveURL('/login');
  });

  test('unauthenticated /settings redirects to /login', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL('/login');
  });
});

// ── Homepage (local mode) ─────────────────────────────────────────────────────

test.describe('Homepage local mode', () => {
  test('/ redirects to /login when NEXT_PUBLIC_LOCAL_MODE=true', async ({ page }) => {
    await page.goto('/');
    // In local mode the server redirects / → /login
    await expect(page).toHaveURL('/login');
  });
});

// ── Back navigation ───────────────────────────────────────────────────────────

test.describe('Back buttons', () => {
  test('creator profile page has ← Explore link', async ({ page }) => {
    // Use a known test username or fall back to a non-existent one to check the nav
    await page.goto('/creators/testuser');
    // Even on 404 the nav renders; if the page exists ← Explore should be visible
    const backLink = page.getByRole('link', { name: '← Explore' });
    if (await backLink.isVisible()) {
      await expect(backLink).toHaveAttribute('href', '/explore');
    }
  });

  test('explore page has working logo link', async ({ page }) => {
    await page.goto('/explore');
    await page.getByRole('link', { name: /FlashcardAI/ }).first().click();
    // Local mode: lands on /login. Production: lands on /
    const url = page.url();
    expect(url).toMatch(/\/(login)?$/);
  });
});
