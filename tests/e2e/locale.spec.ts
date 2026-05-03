import { test, expect, createVerifiedUser, cleanupFixtureUser } from './fixtures';

test.beforeAll(async () => { await createVerifiedUser(); });
test.afterAll(async ()  => { await cleanupFixtureUser(); });

test.describe('Locale switcher regression', () => {
  test('de → en: dashboard and my-decks stay in English after locale switch', async ({ authedPage: page }) => {
    // Put the browser into German locale
    await page.context().addCookies([{
      name: 'NEXT_LOCALE', value: 'de',
      domain: 'localhost', path: '/',
      sameSite: 'Lax', secure: false,
    }]);

    // Middleware should redirect /settings → /de/settings
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/de\/settings/);

    // Click the English language button (native label is always "English")
    await page.getByRole('button', { name: /English/ }).first().click();

    // Full-page navigation via window.location.href — wait for English settings URL
    await page.waitForURL(/\/settings$/, { timeout: 10_000 });
    await expect(page).not.toHaveURL(/\/de\//);

    // Navigate to dashboard — must stay English (no /de/ prefix)
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL(/\/de\//);

    // Navigate to my decks — must stay English
    await page.goto('/flashcards');
    await expect(page).not.toHaveURL(/\/de\//);
  });
});
