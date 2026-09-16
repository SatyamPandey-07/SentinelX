// Real end-to-end browser test of SentinelX: user side + admin side,
// against the live dev server + live backend. No mocks, no stubs.
const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';
const results = [];
const consoleErrors = [];

function log(label, ok, detail = '') {
  results.push({ label, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}${detail ? ' -- ' + detail : ''}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`[${page.url()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(`[${page.url()}] pageerror: ${err.message}`);
  });

  const shot = async (name) => {
    await page.screenshot({ path: `C:/Users/Satyam/AppData/Local/Temp/claude/d--VIGIL/78c941fe-2a0e-4f1d-a4a4-e12ed400ed70/scratchpad/shots/${name}.png`, fullPage: true });
  };

  try {
    // ---------- 1. Landing page, public ----------
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1500);
    log('Landing page loads without auth', page.url() === BASE + '/');
    await shot('01-landing');

    // ---------- 2. Direct nav to protected route without session -> must redirect ----------
    await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1500);
    const gatedUrl = page.url();
    log('Unauthenticated /dashboard redirects to /login', gatedUrl.includes('/login'), gatedUrl);
    await shot('02-gated-redirect');

    // ---------- 3. Sign up a brand-new real user ----------
    const stamp = Date.now();
    const testUsername = `e2e_user_${stamp}`;
    const testEmail = `e2e_user_${stamp}@sentinelx.local`;

    await page.goto(BASE + '/login?mode=signup', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(500);
    await page.click('#tab-signup').catch(() => {});
    await page.fill('#signup-first-name', 'E2E');
    await page.fill('#signup-last-name', 'Tester');
    await page.fill('#signup-username', testUsername);
    await page.fill('#signup-email', testEmail);
    await page.fill('#signup-password', 'TestPass123!');
    await page.fill('#signup-confirm-password', 'TestPass123!');
    await shot('03-signup-filled');
    await page.click('#btn-signup-submit');
    await page.waitForURL('**/user', { timeout: 15000 }).catch(() => {});
    const afterSignupUrl = page.url();
    log('Sign-up redirects new USER to /user', afterSignupUrl.includes('/user'), afterSignupUrl);
    await shot('04-user-portal');

    // ---------- 4. User-side: submit a real incident via the UI ----------
    const incidentTitle = `E2E Test Incident ${stamp}`;
    await page.fill('#incident-title', incidentTitle);
    await page.fill('#incident-desc', 'Automated end-to-end test incident submitted via the real report form.');
    await page.click('#btn-submit-report');
    await page.waitForTimeout(3000);
    const bodyText1 = await page.textContent('body');
    log('Incident submission shows success (not error) toast', bodyText1.includes('received') || bodyText1.includes('Dispatch'), '');
    await shot('05-incident-submitted');

    const myIncidentsVisible = await page.locator(`text=${incidentTitle}`).count();
    log('Submitted incident appears in "My Reported Incidents" (real GET after real POST)', myIncidentsVisible > 0);
    await shot('06-my-incidents-list');

    // ---------- 5. Log out ----------
    await page.goto(BASE + '/profile', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1000);
    const logoutBtn = page.locator('button:has-text("Sign Out"), button:has-text("Logout"), #btn-navbar-logout').first();
    if (await logoutBtn.count()) {
      await logoutBtn.click();
      await page.waitForTimeout(1000);
    }

    // ---------- 6. Admin side: sign in as the new super admin (Satyam) ----------
    await page.goto(BASE + '/login?mode=signin', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(500);
    await page.click('#tab-signin').catch(() => {});
    await page.fill('#signin-username', 'satyam');
    await page.fill('#signin-password', 'Admin@12345');
    await shot('07-admin-login-filled');
    await page.click('#btn-signin-submit');
    await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
    const afterAdminLoginUrl = page.url();
    log('New Super Admin (satyam) signs in and lands on /dashboard', afterAdminLoginUrl.includes('/dashboard'), afterAdminLoginUrl);
    await shot('08-admin-dashboard');

    // ---------- 7. Admin sees the user-reported incident (real cross-account backend proof) ----------
    await page.waitForTimeout(2000);
    const dashboardText = await page.textContent('body');
    log('Admin dashboard shows the incident the test user just created', dashboardText.includes(incidentTitle) || dashboardText.includes('E2E Test Incident'));

    // ---------- 8. Walk every admin page, check it renders + no console errors ----------
    const adminPages = ['/incidents', '/responders', '/map', '/sla', '/analytics', '/intelligence', '/audit', '/system-health', '/settings'];
    for (const route of adminPages) {
      const before = consoleErrors.length;
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(2000);
      const newErrors = consoleErrors.slice(before);
      log(`Admin page ${route} renders`, page.url().includes(route), newErrors.length ? `${newErrors.length} console error(s)` : 'no console errors');
      await shot(`admin-${route.replace(/\//g, '')}`);
    }

    // ---------- 9. Ack/resolve flow on the real incident from the dashboard ----------
    await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    const ackBtn = page.locator('button:has-text("Acknowledge")').first();
    if (await ackBtn.count()) {
      await ackBtn.click();
      await page.waitForTimeout(2000);
      const afterAck = await page.textContent('body');
      log('Acknowledge button updates incident status via real API', afterAck.includes('ACKNOWLEDGED'));
    } else {
      log('Acknowledge button present on dashboard', false, 'no incident selected / button not found');
    }
    await shot('09-after-acknowledge');

  } catch (err) {
    log('Script crashed', false, err.message);
    await shot('99-crash');
  }

  await browser.close();

  console.log('\n=== CONSOLE ERRORS COLLECTED ===');
  consoleErrors.forEach((e) => console.log(e));

  console.log('\n=== SUMMARY ===');
  const passed = results.filter((r) => r.ok).length;
  console.log(`${passed}/${results.length} checks passed`);
  process.exit(results.every((r) => r.ok) ? 0 : 1);
})();
