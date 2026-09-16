const { chromium } = require('playwright');

const pages = ['/', '/login', '/dashboard', '/incidents', '/map', '/analytics', '/responders', '/audit', '/sla', '/system-health'];
const outDir = 'C:\\Users\\Satyam\\AppData\\Local\\Temp\\claude\\d--VIGIL\\78c941fe-2a0e-4f1d-a4a4-e12ed400ed70\\scratchpad\\shots';

(async () => {
  const fs = require('fs');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.setViewportSize({ width: 1600, height: 1000 });

  for (const p of pages) {
    try {
      await page.goto(`http://localhost:3000${p}`, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(800);
      const name = p === '/' ? 'landing' : p.replace(/\//g, '');
      await page.screenshot({ path: `${outDir}\\${name}.png`, fullPage: false });
      console.log(`OK ${p}`);
    } catch (e) {
      console.log(`FAIL ${p}: ${e.message}`);
    }
  }

  await browser.close();
})();
