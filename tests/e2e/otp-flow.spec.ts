import { test, expect } from '@playwright/test';
import { Client } from 'pg';

const TEST_EMAIL = `otp-test-${Date.now()}@example.com`;
const TEST_NAME = 'OTP Tester';
const TEST_PASSWORD = 'TestPass1!';
const TEST_DOB = '2000-01-01';

async function getLatestOtp(email: string): Promise<string | null> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query<{ code: string }>(
      `SELECT oc.code
       FROM otp_codes oc
       JOIN users u ON u.id = oc.user_id
       WHERE u.email = $1 AND oc.used_at IS NULL AND oc.purpose = 'email_verification'
       ORDER BY oc.created_at DESC LIMIT 1`,
      [email],
    );
    return res.rows[0]?.code ?? null;
  } finally {
    await client.end();
  }
}

async function cleanupUser(email: string) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('DELETE FROM users WHERE email = $1', [email]);
  } finally {
    await client.end();
  }
}

test.describe('OTP email verification flow', () => {
  test.afterAll(async () => {
    await cleanupUser(TEST_EMAIL);
  });

  test('register → redirects to /verify-email', async ({ page }) => {
    await page.goto('/signup');

    await page.getByLabel('Full name').fill(TEST_NAME);
    await page.getByLabel('Email').fill(TEST_EMAIL);
    const pwFields = page.getByLabel(/password/i);
    await pwFields.first().fill(TEST_PASSWORD);
    await page.fill('#dob', TEST_DOB);

    await page.getByRole('button', { name: /sign up|create/i }).click();

    await expect(page).toHaveURL('/verify-email', { timeout: 10_000 });
  });

  test('/verify-email page renders 6-digit input', async ({ page }) => {
    await page.goto('/verify-email');
    const inputs = page.locator('input[maxlength="1"]');
    await expect(inputs).toHaveCount(6);
    await expect(page.getByRole('button', { name: /resend/i })).toBeVisible();
  });

  test('wrong code shows error', async ({ page }) => {
    const wrongCodeEmail = `otp-wrong-${Date.now()}@example.com`;

    // Register to get a valid OTP session cookie, then enter a wrong code
    await page.goto('/signup');
    await page.getByLabel('Full name').fill(TEST_NAME);
    await page.getByLabel('Email').fill(wrongCodeEmail);
    const pwFields = page.getByLabel(/password/i);
    await pwFields.first().fill(TEST_PASSWORD);
    await page.fill('#dob', TEST_DOB);
    await page.getByRole('button', { name: /sign up|create/i }).click();
    await expect(page).toHaveURL('/verify-email', { timeout: 10_000 });

    const inputs = page.locator('input[maxlength="1"]');
    for (let i = 0; i < 6; i++) {
      await inputs.nth(i).fill('0');
    }
    // verifyOtp returns 'Ungültiger Code.' for a wrong code
    await expect(page.getByText(/ungültig|invalid|incorrect|wrong/i)).toBeVisible({ timeout: 8_000 });

    await cleanupUser(wrongCodeEmail);
  });

  test('correct OTP code verifies email and redirects to /onboarding', async ({ page }) => {
    const uniqueEmail = `otp-verify-${Date.now()}@example.com`;

    await page.goto('/signup');
    await page.getByLabel('Full name').fill(TEST_NAME);
    await page.getByLabel('Email').fill(uniqueEmail);
    const pwFields = page.getByLabel(/password/i);
    await pwFields.first().fill(TEST_PASSWORD);
    await page.fill('#dob', TEST_DOB);

    await page.getByRole('button', { name: /sign up|create/i }).click();
    await expect(page).toHaveURL('/verify-email', { timeout: 10_000 });

    // Fetch OTP from DB
    let code: string | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      code = await getLatestOtp(uniqueEmail);
      if (code) break;
      await page.waitForTimeout(500);
    }
    expect(code).toBeTruthy();

    // Enter the 6-digit code
    const inputs = page.locator('input[maxlength="1"]');
    for (let i = 0; i < 6; i++) {
      await inputs.nth(i).fill(code![i]);
    }

    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 });

    await cleanupUser(uniqueEmail);
  });
});
