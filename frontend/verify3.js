const { chromium } = require('playwright');
const outDir = 'C:\\Users\\Satyam\\AppData\\Local\\Temp\\claude\\d--VIGIL\\78c941fe-2a0e-4f1d-a4a4-e12ed400ed70\\scratchpad\\shots3';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE ERR', m.text()); });

  await page.goto('http://localhost:3000/login', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(500);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 20000 });

  await page.goto('http://localhost:3000/system-health', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(8000);
  await page.screenshot({ path: `${outDir}\\system-health.png` });
  console.log('done');
  await browser.close();
})();
