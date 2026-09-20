const { chromium } = require('d:/VIGIL/frontend/node_modules/playwright');
const path = require('path');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function smoothScroll(page, distance, steps = 15, delay = 75) {
  try {
    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, distance / steps);
      await sleep(delay);
    }
  } catch (e) {}
}

(async () => {
  const outputDir = path.resolve('d:/VIGIL/recordings');
  const tmpDir = path.resolve('d:/VIGIL/recordings_tmp');

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  // Clean tmpDir
  fs.readdirSync(tmpDir).forEach(f => {
    try { fs.unlinkSync(path.join(tmpDir, f)); } catch (e) {}
  });

  console.log('===============================================================');
  console.log('Starting Bulletproof 4-Minute SentinelX Demo Video Recording...');
  console.log('Target duration: ~4:15 - 4:30 (full 16-scene complete tour)');
  console.log('===============================================================');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1920,1080',
      '--disable-background-timer-throttling'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: tmpDir,
      size: { width: 1920, height: 1080 }
    }
  });

  // 1. Pre-seed authenticated admin session
  // 2. Add continuous 25fps compositor heartbeat so video duration matches real time exactly
  await context.addInitScript(() => {
    const session = {
      access_token: 'mock-jwt-admin-sentinelx-token',
      refresh_token: 'mock-jwt-admin-refresh-token',
      username: 'Satyam',
      role: 'ROLE_ADMIN',
      user_id: 'usr-superadmin-satyam',
      first_name: 'Satyam',
      last_name: 'Pandey',
      email: 'pandeysatyam1802@gmail.com'
    };
    try {
      window.localStorage.setItem('sentinelx_session', JSON.stringify(session));
    } catch (e) {}

    try {
      window.addEventListener('DOMContentLoaded', () => {
        const dot = document.createElement('div');
        dot.style.cssText = 'position:fixed;bottom:1px;right:1px;width:1px;height:1px;opacity:0.01;z-index:999999;pointer-events:none;';
        document.body.appendChild(dot);
        let count = 0;
        setInterval(() => {
          dot.style.opacity = (count++ % 2 === 0) ? '0.01' : '0.02';
        }, 40);
      });
    } catch (e) {}
  });

  const page = await context.newPage();

  async function safeGoto(url, waitTime = 3000) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (e) {}
    await sleep(waitTime);
  }

  const startTime = Date.now();

  try {
    // 1. Landing Page (20s)
    console.log('[1/16] SentinelX Landing Page (http://localhost:3000)...');
    await safeGoto('http://localhost:3000', 3000);
    await smoothScroll(page, 700, 15, 80);
    await sleep(4000);
    await smoothScroll(page, 700, 15, 80);
    await sleep(4000);
    await smoothScroll(page, -1400, 20, 60);
    await sleep(3000);

    // 2. Sign In Portal (14s)
    console.log('[2/16] Sign In Portal (http://localhost:3000/login?mode=signin)...');
    await safeGoto('http://localhost:3000/login?mode=signin', 3000);
    await smoothScroll(page, 350, 10, 80);
    await sleep(5000);
    await smoothScroll(page, -350, 10, 60);
    await sleep(3000);

    // 3. Live Operations Dashboard (24s)
    console.log('[3/16] Live Operations Dashboard (http://localhost:3000/dashboard)...');
    await safeGoto('http://localhost:3000/dashboard', 3000);
    await smoothScroll(page, 600, 15, 80);
    await sleep(5000);
    await smoothScroll(page, 600, 15, 80);
    await sleep(5000);
    await smoothScroll(page, -1200, 20, 60);
    await sleep(4000);

    // 4. Incidents Queue (20s)
    console.log('[4/16] Incidents Queue & Triage (http://localhost:3000/incidents)...');
    await safeGoto('http://localhost:3000/incidents', 3000);
    await smoothScroll(page, 500, 12, 80);
    await sleep(5000);
    await smoothScroll(page, 500, 12, 80);
    await sleep(4000);
    await smoothScroll(page, -1000, 16, 60);
    await sleep(3000);

    // 5. Grounded AI SOP Assistant (20s)
    console.log('[5/16] Grounded SOP Assistant (http://localhost:3000/intelligence)...');
    await safeGoto('http://localhost:3000/intelligence', 3000);
    await smoothScroll(page, 500, 12, 80);
    await sleep(5000);
    await smoothScroll(page, -500, 12, 60);
    await sleep(4000);

    // 6. Campus Geospatial Defense Map (18s)
    console.log('[6/16] Campus Geospatial Map (http://localhost:3000/map)...');
    await safeGoto('http://localhost:3000/map', 4000);
    await smoothScroll(page, 400, 10, 80);
    await sleep(5000);
    await smoothScroll(page, -400, 10, 60);
    await sleep(3000);

    // 7. Tactical Responders (16s)
    console.log('[7/16] Active Responder Units (http://localhost:3000/responders)...');
    await safeGoto('http://localhost:3000/responders', 3000);
    await smoothScroll(page, 450, 12, 80);
    await sleep(5000);
    await smoothScroll(page, -450, 12, 60);
    await sleep(3000);

    // 8. Redis SLA Engine (16s)
    console.log('[8/16] Redis SLA Deadlines Engine (http://localhost:3000/sla)...');
    await safeGoto('http://localhost:3000/sla', 3000);
    await smoothScroll(page, 450, 12, 80);
    await sleep(5000);
    await smoothScroll(page, -450, 12, 60);
    await sleep(3000);

    // 9. SHA-256 Audit Ledger (16s)
    console.log('[9/16] Cryptographic SHA-256 Audit Ledger (http://localhost:3000/audit)...');
    await safeGoto('http://localhost:3000/audit', 3000);
    await smoothScroll(page, 500, 12, 80);
    await sleep(5000);
    await smoothScroll(page, -500, 12, 60);
    await sleep(3000);

    // 10. Spring Cloud API Gateway Health (12s)
    console.log('[10/16] Spring Cloud API Gateway Health (http://localhost:8080/actuator/health)...');
    await safeGoto('http://localhost:8080/actuator/health', 8000);

    // 11. Kafka Management Console (18s)
    console.log('[11/16] Apache Kafka Management Console (http://localhost:8095)...');
    await safeGoto('http://localhost:8095', 3000);
    await smoothScroll(page, 450, 12, 80);
    await sleep(5000);
    await smoothScroll(page, -450, 12, 60);
    await sleep(3000);

    // 12. Jaeger Tracing Waterfall (18s)
    console.log('[12/16] Jaeger Distributed Tracing UI (http://localhost:16686)...');
    await safeGoto('http://localhost:16686', 3000);
    await smoothScroll(page, 400, 10, 80);
    await sleep(5000);
    await smoothScroll(page, -400, 10, 60);
    await sleep(3000);

    // 13. Grafana Observability Dashboard (18s)
    console.log('[13/16] Grafana Monitoring Dashboard (http://localhost:3001)...');
    await safeGoto('http://localhost:3001', 3000);
    await smoothScroll(page, 500, 12, 80);
    await sleep(5000);
    await smoothScroll(page, -500, 12, 60);
    await sleep(3000);

    // 14. Prometheus Metrics Scraper (15s)
    console.log('[14/16] Prometheus Metrics Scraper & Targets (http://localhost:9090/targets)...');
    await safeGoto('http://localhost:9090/targets', 3000);
    await smoothScroll(page, 500, 12, 80);
    await sleep(5000);
    await smoothScroll(page, -500, 12, 60);
    await sleep(3000);

    // 15. Mailpit Email Sandbox (15s)
    console.log('[15/16] Mailpit / Mailhog Emergency Email Sandbox (http://localhost:8025)...');
    await safeGoto('http://localhost:8025', 3000);
    await smoothScroll(page, 400, 10, 80);
    await sleep(5000);
    await smoothScroll(page, -400, 10, 60);
    await sleep(3000);

    // 16. System Health Finale (15s)
    console.log('[16/16] Finale: SentinelX System Health Overview (http://localhost:3000/system-health)...');
    await safeGoto('http://localhost:3000/system-health', 3000);
    await smoothScroll(page, 500, 12, 80);
    await sleep(5000);

    // Pacing Buffer to guarantee >= 245 seconds (4 minutes 5 seconds)
    const elapsedSec = (Date.now() - startTime) / 1000;
    if (elapsedSec < 245) {
      const padMs = Math.ceil((245 - elapsedSec) * 1000);
      console.log(`[Pacing Buffer] Holding finale for ${Math.round(padMs/1000)}s to ensure 4+ minutes...`);
      await sleep(padMs);
    }

    const totalDurationSec = Math.round((Date.now() - startTime) / 1000);
    console.log('===============================================================');
    console.log(`Full Tour Complete! Total Duration: ${Math.floor(totalDurationSec/60)}m ${totalDurationSec%60}s`);
    console.log('===============================================================');

  } catch (err) {
    console.error('Recording encountered an error:', err);
  } finally {
    console.log('Closing page to flush video frames...');
    await page.close();
    const rawVideoPath = await page.video().path();
    console.log('Raw video generated at:', rawVideoPath);

    await context.close();
    await browser.close();

    // Copy to final output location
    const finalTarget = path.join(outputDir, 'sentinelx_demo_4min.webm');
    try {
      if (fs.existsSync(finalTarget)) {
        try { fs.unlinkSync(finalTarget); } catch (e) {}
      }
      fs.copyFileSync(rawVideoPath, finalTarget);
      console.log('\n===============================================================');
      console.log('Single 4-Minute Video File Ready:');
      console.log('>>>', finalTarget);
      console.log('===============================================================');
    } catch (e) {
      console.error('Copy to target error:', e);
    }

    // Clean up temporary files
    try {
      fs.readdirSync(tmpDir).forEach(f => {
        try { fs.unlinkSync(path.join(tmpDir, f)); } catch (err) {}
      });
    } catch (e) {}
  }
})();
