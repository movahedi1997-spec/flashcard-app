import { test, expect } from '@playwright/test';

// ── Login page ────────────────────────────────────────────────────────────────

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders form elements', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
  });

  test('shows error on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: 'Log In' }).click();
    // HTML5 validation prevents submit — email field should be focused/invalid
    const email = page.getByLabel('Email');
    await expect(email).toBeFocused();
  });

  test('shows error on wrong credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('nobody@example.com');
    await page.getByLabel('Password').fill('wrongpassword1!');
    await page.getByRole('button', { name: 'Log In' }).click();
    await expect(page.getByText('Invalid email or password.')).toBeVisible();
  });

  test('password visibility toggle works', async ({ page }) => {
    const passwordInput = page.getByLabel('Password');
    await passwordInput.fill('secret123');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await page.getByRole('button').filter({ has: page.locator('svg') }).last().click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('link to signup page works', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign up free' }).click();
    await expect(page).toHaveURL('/signup');
  });

  test('redirects to dashboard when already logged in', async ({ page, context }) => {
    // Seed a valid access token cookie via the login API
    const res = await page.request.post('/api/auth/login', {
      data: {
        email: process.env.TEST_USER_EMAIL ?? 'test@example.com',
        password: process.env.TEST_USER_PASSWORD ?? 'TestPass1!',
      },
    });
    // Only assert the redirect if the test account exists
    if (res.ok()) {
      await page.goto('/login');
      await expect(page).toHaveURL('/dashboard');
    } else {
      test.skip(); // no test account configured
    }
  });
});

// ── Sign-up page ──────────────────────────────────────────────────────────────

test.describe('Signup page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('renders all form fields', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /create/i })).toBeVisible();
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
  });

  test('rejects password without letter + number/symbol', async ({ page }) => {
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('newuser@example.com');
    // Fill both password fields
    const pwFields = page.getByLabel(/password/i);
    await pwFields.first().fill('alllowercase');
    const count = await pwFields.count();
    if (count > 1) await pwFields.nth(1).fill('alllowercase');

    // Submit — expect validation error
    await page.getByRole('button', { name: /sign up|create/i }).click();
    await expect(page.getByText(/letter.*number|number.*symbol/i)).toBeVisible();
  });

  test('link to login page works', async ({ page }) => {
    await page.getByRole('link', { name: /log in/i }).click();
    await expect(page).toHaveURL('/login');
  });
});
