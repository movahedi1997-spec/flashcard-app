import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,       // sequential — tests share a live DB
  workers: 1,                 // one browser project at a time — prevents fixture email collision
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 30_000,
  expect: { timeout: 8_000 },

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',   // record trace only when a test fails
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium',        use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',         use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',          use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome',   use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari',   use: { ...devices['iPhone 13'] } },
  ],

  // Start the Next.js dev server automatically before the test run.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,   // reuse if already running (local dev)
    timeout: 60_000,
  },
});
