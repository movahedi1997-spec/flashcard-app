import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'https://flashcardai.app';
const EMAIL = 'movahedi1997@gmail.com';
const PASSWORD = 'Test2Test2';
const OUT = path.join(process.cwd(), 'scripts', 'screenshots');

fs.mkdirSync(OUT, { recursive: true });

async function shot(page: import('playwright').Page, name: string) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`📸 ${name} → ${file}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Desktop viewport
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await desktop.newPage();

  // 1. Landing page
  console.log('\n── 1. Landing page');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await shot(page, '01-landing');

  // 2. Login page
  console.log('\n── 2. Login page');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await shot(page, '02-login');

  // 3. Fill login form
  console.log('\n── 3. Filling credentials');
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await shot(page, '03-login-filled');

  // 4. Submit and capture API response
  console.log('\n── 4. Submitting login');
  const [apiResponse] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/auth/login'), { timeout: 15_000 }),
    page.click('button[type="submit"]'),
  ]);
  const status = apiResponse.status();
  let body: unknown;
  try { body = await apiResponse.json(); } catch { body = '(body unavailable)'; }
  console.log(`  API /api/auth/login → ${status}`, JSON.stringify(body));

  if (status !== 200) {
    await shot(page, '04-login-error');
    console.error('  ✗ Login API failed — captured error state');
    await browser.close();
    process.exit(1);
  }

  // Check cookies immediately after login
  const siteCookies = await desktop.cookies(`${BASE}`);
  const tokenCookie = siteCookies.find(c => c.name === 'token');
  console.log(`  token cookie: ${tokenCookie ? `SET (httpOnly=${tokenCookie.httpOnly}, secure=${tokenCookie.secure}, sameSite=${tokenCookie.sameSite})` : 'NOT SET'}`);
  console.log(`  all cookies:`, siteCookies.map(c => c.name).join(', ') || '(none)');

  // Navigate directly to dashboard (cookie is set)
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
  console.log(`  URL after goto /dashboard: ${page.url()}`);
  await shot(page, '04-post-login');

  // 5. Dashboard — scroll to see full page
  console.log('\n── 5. Dashboard (full page)');
  await page.screenshot({ path: path.join(OUT, '05-dashboard-full.png'), fullPage: true });
  console.log(`📸 05-dashboard-full → scripts/screenshots/05-dashboard-full.png`);

  // 6. Navigate to My Decks
  console.log('\n── 6. My Decks');
  await page.goto(`${BASE}/flashcards`, { waitUntil: 'networkidle' });
  await shot(page, '06-my-decks');

  // 7. Explore
  console.log('\n── 7. Explore');
  await page.goto(`${BASE}/explore`, { waitUntil: 'networkidle' });
  await shot(page, '07-explore');

  // 8. Settings
  console.log('\n── 8. Settings');
  await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
  await shot(page, '08-settings');

  // 9. Mobile view of dashboard
  console.log('\n── 9. Mobile dashboard (iPhone 14 Pro)');
  const mobile = await browser.newContext({
    viewport: { width: 393, height: 852 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const mpage = await mobile.newPage();

  // Copy cookies from desktop session to mobile
  const cookies = await desktop.cookies();
  await mobile.addCookies(cookies);

  await mpage.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
  await mpage.screenshot({ path: path.join(OUT, '09-mobile-dashboard.png'), fullPage: true });
  console.log(`📸 09-mobile-dashboard → scripts/screenshots/09-mobile-dashboard.png`);

  // 10. Mobile settings (username field)
  console.log('\n── 10. Mobile settings (username overflow check)');
  await mpage.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
  await mpage.screenshot({ path: path.join(OUT, '10-mobile-settings.png'), fullPage: true });
  console.log(`📸 10-mobile-settings → scripts/screenshots/10-mobile-settings.png`);

  await browser.close();
  console.log('\n✅ All screenshots saved to scripts/screenshots/');
})();
