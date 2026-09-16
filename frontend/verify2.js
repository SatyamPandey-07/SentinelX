const { chromium } = require('playwright');
const outDir = 'C:\\Users\\Satyam\\AppData\\Local\\Temp\\claude\\d--VIGIL\\78c941fe-2a0e-4f1d-a4a4-e12ed400ed70\\scratchpad\\shots3';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const consoleErrors = {};
  let currentPage = 'init';
  page.on('console', (m) => {
    if (m.type() === 'error') {
      consoleErrors[currentPage] = consoleErrors[currentPage] || [];
      consoleErrors[currentPage].push(m.text());
    }
  });

  await page.goto('http://localhost:3000/login', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(500);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 20000 });

  const shot = async (name, url) => {
    currentPage = name;
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${outDir}\\${name}.png` });
    console.log(`SHOT ${name}`);
  };

  await shot('analytics', 'http://localhost:3000/analytics');
  await shot('system-health', 'http://localhost:3000/system-health');

  currentPage = 'intelligence';
  await page.goto('http://localhost:3000/intelligence', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(500);
  await page.click('button:has-text("QUERY SOP")');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${outDir}\\intelligence.png` });
  console.log('SHOT intelligence');

  console.log('CONSOLE_ERRORS_JSON:', JSON.stringify(consoleErrors, null, 2));
  await browser.close();
})();
