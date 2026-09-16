const { chromium } = require('playwright');
const outDir = 'C:\\Users\\Satyam\\AppData\\Local\\Temp\\claude\\d--VIGIL\\78c941fe-2a0e-4f1d-a4a4-e12ed400ed70\\scratchpad\\shots3';

(async () => {
  const fs = require('fs');
  fs.mkdirSync(outDir, { recursive: true });
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

  const shot = async (name) => {
    currentPage = name;
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${outDir}\\${name}.png`, fullPage: false });
    console.log(`SHOT ${name}`);
  };

  // Real login
  await page.goto('http://localhost:3000/login', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  currentPage = 'login';
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await shot('dashboard');

  await page.goto('http://localhost:3000/incidents', { waitUntil: 'load' });
  await shot('incidents');

  // click into first incident's TRIAGE link if present
  const triageLink = await page.$('a:has-text("TRIAGE")');
  if (triageLink) {
    await triageLink.click();
    await page.waitForTimeout(1000);
    await shot('incident-detail');

    // try RAG query on detail page
    const ragInput = await page.$('input[placeholder*="cardiac"]');
    if (ragInput) {
      await ragInput.fill('What is the fire evacuation protocol?');
      await page.click('button:has-text("QUERY SOP CHECKLIST")');
      await page.waitForTimeout(3000);
      await shot('incident-detail-rag');
    }
  } else {
    console.log('NO INCIDENTS TO CLICK INTO');
  }

  await page.goto('http://localhost:3000/responders', { waitUntil: 'load' });
  await shot('responders');

  await page.goto('http://localhost:3000/map', { waitUntil: 'load' });
  await shot('map');

  await page.goto('http://localhost:3000/sla', { waitUntil: 'load' });
  await shot('sla');

  await page.goto('http://localhost:3000/audit', { waitUntil: 'load' });
  await shot('audit');

  await page.goto('http://localhost:3000/analytics', { waitUntil: 'load' });
  await shot('analytics');

  await page.goto('http://localhost:3000/system-health', { waitUntil: 'load' });
  await shot('system-health');

  await page.goto('http://localhost:3000/intelligence', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  currentPage = 'intelligence';
  await page.click('button:has-text("QUERY SOP")');
  await page.waitForTimeout(3000);
  await shot('intelligence');

  console.log('CONSOLE_ERRORS_JSON:', JSON.stringify(consoleErrors, null, 2));

  await browser.close();
})();
