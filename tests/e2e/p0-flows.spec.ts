/**
 * TASK-030 — P0 flow regression tests
 * Covers: login, create deck, add card, study session, share deck,
 *         explore page, account deletion, paywall UI.
 * Stripe checkout and AI generation (file upload) are tested manually.
 */
import {
  test,
  expect,
  createVerifiedUser,
  cleanupFixtureUser,
  dismissSplash,
  dismissPWA,
  FIXTURE_EMAIL,
  FIXTURE_PASSWORD,
} from './fixtures';

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  await createVerifiedUser();
});

test.afterAll(async () => {
  await cleanupFixtureUser();
});

// ── Login flow ────────────────────────────────────────────────────────────────

test('login with valid credentials → redirects to /flashcards', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(FIXTURE_EMAIL);
  await page.getByLabel(/password/i).fill(FIXTURE_PASSWORD);
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  await expect(page).toHaveURL(/\/(flashcards|dashboard)/, { timeout: 10_000 });
});

// ── Create deck ───────────────────────────────────────────────────────────────

test('create deck → deck appears in list', async ({ authedPage: page }) => {
  await page.goto('/flashcards');
  await dismissSplash(page);

  const createBtn = page.getByRole('button', { name: /new deck|create deck/i }).first();
  await expect(createBtn).toBeVisible({ timeout: 8_000 });
  await createBtn.click();

  const titleInput = page.getByLabel(/deck name/i).or(page.getByPlaceholder(/spanish vocabulary/i)).first();
  await expect(titleInput).toBeVisible({ timeout: 5_000 });
  await titleInput.fill('QA Test Deck');

  await page.locator('form').getByRole('button', { name: 'Create Deck' }).click();

  await expect(page.getByText('QA Test Deck')).toBeVisible({ timeout: 8_000 });
});

// ── Add card ──────────────────────────────────────────────────────────────────

test('add card to deck → card appears', async ({ authedPage: page }) => {
  await page.goto('/flashcards');
  await dismissSplash(page);

  await page.getByText('QA Test Deck').click();

  const addCardBtn = page.getByRole('button', { name: 'Add Card' }).first();
  await expect(addCardBtn).toBeVisible({ timeout: 8_000 });
  await addCardBtn.click();

  const frontInput = page.getByPlaceholder('What is the capital of France?');
  await expect(frontInput).toBeVisible({ timeout: 5_000 });
  await frontInput.fill('What is the capital of France?');

  await page.getByPlaceholder('Paris').fill('Paris');

  await page.locator('form').getByRole('button', { name: 'Add Card' }).click();

  await expect(page.getByText('What is the capital of France?')).toBeVisible({ timeout: 8_000 });
});

// ── Study session ─────────────────────────────────────────────────────────────

test('study session — card flip renders front and back', async ({ authedPage: page }) => {
  await page.goto('/flashcards');
  await dismissSplash(page);

  await page.getByText('QA Test Deck').click();
  await dismissPWA(page);

  const studyBtn = page.getByRole('button', { name: /study|start studying/i });
  await expect(studyBtn).toBeVisible({ timeout: 8_000 });
  await studyBtn.click();

  // Mode selector appears — pick Turbo (shows all cards, no SRS due-date dependency)
  await page.getByText('Turbo').click();

  await expect(page.getByText('What is the capital of France?')).toBeVisible({ timeout: 8_000 });

  // Flip the card — try button first, fall back to clicking the card itself
  const flipBtn = page.getByRole('button', { name: /flip|show answer|reveal/i });
  if (await flipBtn.count() > 0) {
    await flipBtn.click();
  } else {
    await page.locator('[class*="flashcard"], [class*="card-flip"], [class*="card"]').first().click();
  }

  await expect(page.getByText('Paris')).toBeVisible({ timeout: 8_000 });
});

// ── Paywall UI ────────────────────────────────────────────────────────────────

test('pricing page loads and shows Free + Pro plans', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByText('Free', { exact: true })).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText('Pro', { exact: true }).first()).toBeVisible({ timeout: 8_000 });
  await expect(
    page.getByRole('button', { name: 'Upgrade to Pro' })
  ).toBeVisible({ timeout: 8_000 });
});

// ── Share deck ────────────────────────────────────────────────────────────────

test('share deck → toggle public → share URL shown', async ({ authedPage: page }) => {
  await page.goto('/flashcards');
  await dismissSplash(page);

  await page.getByText('QA Test Deck').click();

  const shareBtn = page.getByRole('button', { name: /share/i });
  await expect(shareBtn).toBeVisible({ timeout: 8_000 });
  await shareBtn.click();

  // The toggle is a plain <button aria-label="Make public"> when deck is private
  const makePublicBtn = page.getByRole('button', { name: /make public/i });
  if (await makePublicBtn.count() > 0) {
    await makePublicBtn.click();
  }

  // After toggling public the slug is auto-generated and the share URL renders
  // in a <p class="font-mono"> containing "/explore/<slug>"
  await expect(
    page.locator('p.font-mono').or(page.getByText(/\/explore\//))
  ).toBeVisible({ timeout: 10_000 });
});

// ── Explore page ──────────────────────────────────────────────────────────────

test('explore page — subject filter pills visible', async ({ page }) => {
  await page.goto('/explore');
  // h1 reads "Free Flashcard Decks"; subject tiles are <div> elements, not buttons
  await expect(page.getByRole('heading', { name: /free flashcard decks/i })).toBeVisible({ timeout: 8_000 });
  await expect(
    page.getByText(/medicine|pharmacy|chemistry/i).first()
  ).toBeVisible();
});

// ── Account deletion ──────────────────────────────────────────────────────────

test('account deletion — requires password confirmation', async ({ authedPage: page }) => {
  await page.goto('/settings');
  await expect(page).toHaveURL('/settings', { timeout: 10_000 });

  const deleteSection = page.getByText(/delete account|danger zone/i).first();
  await expect(deleteSection).toBeVisible({ timeout: 8_000 });
  await deleteSection.scrollIntoViewIfNeeded();

  const deleteBtn = page.getByRole('button', { name: /delete account|delete my account/i });
  await expect(deleteBtn).toBeVisible({ timeout: 5_000 });
  await deleteBtn.click();

  await expect(
    page.getByLabel(/password/i).or(page.getByPlaceholder(/password|confirm/i)).first()
  ).toBeVisible({ timeout: 5_000 });
});
