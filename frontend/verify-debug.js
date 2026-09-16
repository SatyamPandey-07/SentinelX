const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  page.on('console', (m) => console.log('CONSOLE', m.type(), m.text()));
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  page.on('response', (r) => { if (r.url().includes('/api/')) console.log('RESP', r.status(), r.url()); });

  await page.goto('http://localhost:3000/login', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  console.log('URL after submit:', page.url());
  await browser.close();
})();
