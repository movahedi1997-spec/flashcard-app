import { test, expect } from '@playwright/test';

test.describe('Explore page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/explore');
  });

  test('renders subject hub tiles', async ({ page }) => {
    await expect(page.getByText('Medicine')).toBeVisible();
    await expect(page.getByText('Pharmacy')).toBeVisible();
    await expect(page.getByText('Chemistry')).toBeVisible();
  });

  test('shows login/signup nav for unauthenticated users', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get Started Free' })).toBeVisible();
  });

  test('page title is correct', async ({ page }) => {
    await expect(page).toHaveTitle(/Explore Flashcard Decks/);
  });

  test('heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Free Flashcard Decks' })).toBeVisible();
  });

  test('logo links to homepage for unauthenticated users', async ({ page }) => {
    const logo = page.getByRole('link', { name: /FlashcardAI/ }).first();
    await expect(logo).toHaveAttribute('href', '/');
  });
});
