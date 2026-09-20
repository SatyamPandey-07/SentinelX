const { chromium } = require(require.resolve('playwright', { paths: [__dirname + '/../frontend'] }));
const path = require('path');
const fs = require('fs');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function smoothScroll(page, distance, steps = 14, delay = 60) {
  for (let i = 0; i < steps; i++) {
    try { await page.mouse.wheel(0, distance / steps); } catch (_) {}
    await sleep(delay);
  }
}

async function safeGoto(page, url, waitTime = 2500) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
  } catch (e) {
    console.log(`[Nav] Warning on ${url}:`, e.message);
  }
  await sleep(waitTime);
}

async function typeRealistic(page, selector, text, delayMs = 50) {
  try {
    await page.waitForSelector(selector, { timeout: 4000 });
    await page.click(selector, { timeout: 3000 });
    await sleep(100);
    await page.fill(selector, '');
    for (const char of text) {
      await page.type(selector, char, { delay: delayMs + Math.floor(Math.random() * 20) });
    }
  } catch (e) {
    console.log(`[Type] Selector ${selector} fallback fill:`, e.message);
    try { await page.fill(selector, text, { timeout: 3000 }); } catch (_) {}
  }
}

(async () => {
  const rootDir = path.resolve(__dirname, '..');
  const outputDir = path.join(rootDir, 'recordings');
  const tmpDir = path.join(rootDir, 'recordings_tmp');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  fs.readdirSync(tmpDir).forEach(f => { try { fs.unlinkSync(path.join(tmpDir, f)); } catch (_) {} });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SentinelX Master Demo — Dual-Persona & Complete Platform');
  console.log('═══════════════════════════════════════════════════════════');

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080', '--disable-background-timer-throttling']
    });
  } catch (_) {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080', '--disable-background-timer-throttling']
    });
  }

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: tmpDir, size: { width: 1920, height: 1080 } }
  });

  // Compositor heartbeat for video smoothness
  await context.addInitScript(() => {
    window.addEventListener('DOMContentLoaded', () => {
      try {
        const d = document.createElement('div');
        d.style.cssText = 'position:fixed;bottom:0;right:0;width:1px;height:1px;opacity:0.01;z-index:999999;pointer-events:none';
        document.body.appendChild(d);
        let c = 0;
        setInterval(() => { d.style.opacity = (c++ % 2 === 0) ? '0.01' : '0.02'; }, 40);
      } catch (_) {}
    });
  });

  const page = await context.newPage();
  const t0 = Date.now();

  try {
    // ═════════════════════════════════════════════════════════
    // SCENE 1: Landing Page (22s)
    // ═════════════════════════════════════════════════════════
    console.log('[1/18] Landing Page — 3D Defense Hero & Live Architecture');
    await safeGoto(page, 'http://localhost:3000', 3000);
    await smoothScroll(page, 700, 14, 60);
    await sleep(2500);
    await smoothScroll(page, 800, 14, 60);
    await sleep(2500);
    await smoothScroll(page, 800, 14, 60);
    await sleep(2500);
    await smoothScroll(page, -2300, 20, 45);
    await sleep(1500);

    // ═════════════════════════════════════════════════════════
    // SCENE 2: Campus User Login (20s)
    // ═════════════════════════════════════════════════════════
    console.log('[2/18] Login Portal — Campus User Authentication (Alex Reynolds)');
    await safeGoto(page, 'http://localhost:3000/login?mode=signin&role=user', 2000);
    
    // Select Campus User tab
    try {
      await page.click('#role-select-user');
      await sleep(600);
    } catch (_) {}

    // Type Campus User credentials
    await typeRealistic(page, '#signin-username', 'campus_user', 60);
    await sleep(300);
    await typeRealistic(page, '#signin-password', 'User@12345', 60);
    await sleep(500);

    // Submit user signin
    try {
      await page.click('#btn-signin-submit');
      console.log('-> Authenticated as Campus User');
    } catch (_) {}
    await sleep(2500);

    // ═════════════════════════════════════════════════════════
    // SCENE 3: Campus Safety Portal (26s)
    // ═════════════════════════════════════════════════════════
    console.log('[3/18] Campus Safety Portal — Emergency Dispatch & Panic SOS');
    if (!page.url().includes('/user')) {
      await safeGoto(page, 'http://localhost:3000/user', 2500);
    }
    await sleep(2000);

    // Fill emergency report form
    try {
      await page.waitForSelector('#incident-title', { timeout: 3000 });
      await typeRealistic(page, '#incident-title', 'Medical emergency in Science Library', 45);
      await sleep(300);
      await typeRealistic(page, '#incident-desc', 'Student sustained injury on 2nd floor staircase. First responder team requested immediately.', 40);
      await sleep(500);

      // Submit report
      await page.click('#btn-submit-report');
      console.log('-> Submitted Emergency Report');
      await sleep(2000);
    } catch (e) {
      console.log('User form interaction note:', e.message);
    }

    // Trigger instant panic SOS beacon
    try {
      await page.click('#btn-emergency-sos');
      console.log('-> Triggered Instant Panic SOS Beacon');
      await sleep(2500);
    } catch (_) {}

    await smoothScroll(page, 450, 10, 60);
    await sleep(2500);
    await smoothScroll(page, -450, 10, 45);
    await sleep(1500);

    // ═════════════════════════════════════════════════════════
    // SCENE 4: Super Admin Login Switch (20s)
    // ═════════════════════════════════════════════════════════
    console.log('[4/18] Login Portal — Super Admin Authentication (Afifa Syed)');
    await safeGoto(page, 'http://localhost:3000/login?mode=signin&role=admin', 2000);

    // Select Super Admin
    try {
      await page.click('#role-select-admin');
      await sleep(600);
    } catch (_) {}

    // Type Admin credentials
    await typeRealistic(page, '#signin-username', 'afifa', 60);
    await sleep(300);
    await typeRealistic(page, '#signin-password', 'Admin@12345', 60);
    await sleep(500);

    // Submit admin signin
    try {
      await page.click('#btn-signin-submit');
      console.log('-> Authenticated as Super Admin');
    } catch (_) {}
    await sleep(3000);

    // ═════════════════════════════════════════════════════════
    // SCENE 5: Admin Incident Command Center & Radar (22s)
    // ═════════════════════════════════════════════════════════
    console.log('[5/18] Admin Dashboard — Incident Command Center & Live Radar');
    if (!page.url().includes('/dashboard')) {
      await safeGoto(page, 'http://localhost:3000/dashboard', 2500);
    }
    await sleep(2500);

    // Click through incidents in queue to animate radar spotlight
    try {
      const incidentButtons = await page.$$('button:has-text("CRITICAL"), button:has-text("HIGH"), button:has-text("MEDIUM")');
      if (incidentButtons.length > 1) {
        await incidentButtons[1].click();
        await sleep(1500);
        if (incidentButtons.length > 2) {
          await incidentButtons[2].click();
          await sleep(1500);
        }
        await incidentButtons[0].click();
        await sleep(1500);
      }
    } catch (_) {}

    await smoothScroll(page, 450, 10, 60);
    await sleep(2500);
    await smoothScroll(page, -450, 10, 45);
    await sleep(1500);

    // ═════════════════════════════════════════════════════════
    // SCENE 6: Incidents Management Queue (20s)
    // ═════════════════════════════════════════════════════════
    console.log('[6/18] Incidents Queue — Filtering & Real-time Dispatch');
    await safeGoto(page, 'http://localhost:3000/incidents', 2500);
    await sleep(2000);

    // Interactive filter search
    try {
      const searchInput = await page.$('input[type="text"], input[placeholder*="search" i], input[placeholder*="filter" i]');
      if (searchInput) {
        await searchInput.type('Chemical', { delay: 60 });
        await sleep(1200);
        await searchInput.fill('');
        await sleep(600);
      }
    } catch (_) {}

    await smoothScroll(page, 550, 12, 60);
    await sleep(3000);
    await smoothScroll(page, -550, 12, 45);
    await sleep(1500);

    // ═════════════════════════════════════════════════════════
    // SCENE 7: AI Intelligence & Tactical Copilot (22s)
    // ═════════════════════════════════════════════════════════
    console.log('[7/18] AI Intelligence — Semantic RAG & Vector Retrieval');
    await safeGoto(page, 'http://localhost:3000/intelligence', 2500);
    await sleep(2000);

    // Type query in AI tactical copilot
    try {
      const aiInput = await page.$('input, textarea');
      if (aiInput) {
        await aiInput.click();
        await sleep(200);
        await aiInput.type('Assess multi-point campus hazmat containment protocols', { delay: 45 });
        await sleep(1200);
      }
    } catch (_) {}

    await smoothScroll(page, 450, 10, 60);
    await sleep(3000);
    await smoothScroll(page, -450, 10, 45);
    await sleep(1500);

    // ═════════════════════════════════════════════════════════
    // SCENE 8: Campus Geospatial Map (18s)
    // ═════════════════════════════════════════════════════════
    console.log('[8/18] Campus Map — PostGIS Zone Perimeter Telemetry');
    await safeGoto(page, 'http://localhost:3000/map', 3000);
    await sleep(2500);
    await smoothScroll(page, 400, 10, 60);
    await sleep(2500);
    await smoothScroll(page, -400, 10, 45);
    await sleep(1500);

    // ═════════════════════════════════════════════════════════
    // SCENE 9: Responder Fleet (16s)
    // ═════════════════════════════════════════════════════════
    console.log('[9/18] Responder Fleet — Active Units & Location Telemetry');
    await safeGoto(page, 'http://localhost:3000/responders', 2500);
    await sleep(2000);
    await smoothScroll(page, 450, 10, 60);
    await sleep(2500);
    await smoothScroll(page, -450, 10, 45);
    await sleep(1500);

    // ═════════════════════════════════════════════════════════
    // SCENE 10: SLA Engine & Compliance (18s)
    // ═════════════════════════════════════════════════════════
    console.log('[10/18] SLA Engine — Real-time Deadlines & Breach Protection');
    await safeGoto(page, 'http://localhost:3000/sla', 2500);
    await sleep(2000);
    await smoothScroll(page, 500, 12, 60);
    await sleep(2500);
    await smoothScroll(page, -500, 12, 45);
    await sleep(1500);

    // ═════════════════════════════════════════════════════════
    // SCENE 11: Cryptographic Audit Ledger (18s)
    // ═════════════════════════════════════════════════════════
    console.log('[11/18] Audit Ledger — SHA-256 Hash Chaining & Immutability');
    await safeGoto(page, 'http://localhost:3000/audit', 2500);
    await sleep(2000);
    await smoothScroll(page, 500, 12, 60);
    await sleep(2500);
    await smoothScroll(page, -500, 12, 45);
    await sleep(1500);

    // ═════════════════════════════════════════════════════════
    // SCENE 12: Real-time Analytics (18s)
    // ═════════════════════════════════════════════════════════
    console.log('[12/18] Analytics — MTTA/MTTR Metrics & Operational Insights');
    await safeGoto(page, 'http://localhost:3000/analytics', 2500);
    await sleep(2000);
    await smoothScroll(page, 500, 12, 60);
    await sleep(2500);
    await smoothScroll(page, -500, 12, 45);
    await sleep(1500);

    // ═════════════════════════════════════════════════════════
    // SCENE 13: System Health (18s)
    // ═════════════════════════════════════════════════════════
    console.log('[13/18] System Health — 12 Distributed Microservices Telemetry');
    await safeGoto(page, 'http://localhost:3000/system-health', 2500);
    await sleep(2000);
    await smoothScroll(page, 500, 12, 60);
    await sleep(2500);
    await smoothScroll(page, -500, 12, 45);
    await sleep(1500);

    // ═════════════════════════════════════════════════════════
    // SCENE 14: Spring Boot API Gateway Actuator Health (8s)
    // ═════════════════════════════════════════════════════════
    console.log('[14/18] API Gateway — /actuator/health Live Backend Status');
    await safeGoto(page, 'http://localhost:8080/actuator/health', 2500);
    await sleep(2000);

    // ═════════════════════════════════════════════════════════
    // SCENE 15: Kafka UI (14s)
    // ═════════════════════════════════════════════════════════
    console.log('[15/18] Kafka UI — Event Bus, Topics & Consumers');
    await safeGoto(page, 'http://localhost:8095', 2500);
    await smoothScroll(page, 350, 8, 60);
    await sleep(2000);
    try {
      const topicLink = await page.$('a[href*="/topics"]');
      if (topicLink) {
        await topicLink.click();
        await sleep(2000);
      }
    } catch (_) {}
    await smoothScroll(page, -350, 8, 45);
    await sleep(1000);

    // ═════════════════════════════════════════════════════════
    // SCENE 16: Jaeger Distributed Tracing (Fast & Snappy - 10s)
    // ═════════════════════════════════════════════════════════
    console.log('[16/18] Jaeger — OpenTelemetry Distributed Traces (Fast & Crisp)');
    await safeGoto(page, 'http://localhost:16686/search', 2000);
    try {
      const findBtn = await page.$('button:has-text("Find Traces")');
      if (findBtn) {
        await findBtn.click();
        await sleep(1500);
      }
    } catch (_) {}
    await smoothScroll(page, 300, 8, 60);
    await sleep(1500);
    await smoothScroll(page, -300, 8, 45);
    await sleep(1000);

    // ═════════════════════════════════════════════════════════
    // SCENE 17: Grafana Dashboards (Fast & Snappy - 12s)
    // ═════════════════════════════════════════════════════════
    console.log('[17/18] Grafana — Telemetry & Dashboards (Fast & Crisp)');
    await safeGoto(page, 'http://admin:admin@localhost:3001/dashboards', 2500);
    // If login appears, fast login
    try {
      const userInput = await page.$('input[name="user"], input[aria-label="Username input field"]');
      if (userInput) {
        await userInput.fill('admin');
        const passInput = await page.$('input[name="password"], input[aria-label="Password input field"]');
        if (passInput) await passInput.fill('admin');
        const submitBtn = await page.$('button[type="submit"], button:has-text("Log in")');
        if (submitBtn) await submitBtn.click();
        await sleep(1200);
        const skipBtn = await page.$('button:has-text("Skip"), a:has-text("Skip")');
        if (skipBtn) await skipBtn.click();
        await sleep(1200);
      }
    } catch (_) {}
    await smoothScroll(page, 300, 8, 60);
    await sleep(2500);
    await smoothScroll(page, -300, 8, 45);
    await sleep(1000);

    // ═════════════════════════════════════════════════════════
    // SCENE 18: Prometheus Targets & Mailpit Emergency Alerts (22s)
    // ═════════════════════════════════════════════════════════
    console.log('[18/18] Prometheus Metrics & Mailpit Emergency Alerts');
    await safeGoto(page, 'http://localhost:9090/targets', 2500);
    await smoothScroll(page, 450, 10, 60);
    await sleep(2500);
    await smoothScroll(page, -450, 10, 45);
    await sleep(1000);

    // Mailpit inbox with real emergency alerts
    await safeGoto(page, 'http://localhost:8025', 2500);
    await sleep(1500);

    // Click first email to open full alert modal
    try {
      const emailRow = await page.$('tbody tr, .message, table tr:nth-child(1)');
      if (emailRow) {
        await emailRow.click();
        await sleep(2500);
      }
    } catch (_) {}

    await smoothScroll(page, 300, 8, 60);
    await sleep(3000);

    // Final pacing check: guarantee rich duration (~5 min)
    const elapsed = (Date.now() - t0) / 1000;
    if (elapsed < 300) {
      const pad = Math.ceil((300 - elapsed) * 1000);
      console.log(`[Pacing] Holding final frame for +${Math.round(pad/1000)}s...`);
      await sleep(pad);
    }

    const dur = Math.round((Date.now() - t0) / 1000);
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Done! Duration: ${Math.floor(dur/60)}m ${dur%60}s`);
    console.log('═══════════════════════════════════════════════════════════');

  } catch (err) {
    console.error('Recording Error:', err);
  } finally {
    await page.close();
    const raw = await page.video().path();
    await context.close();
    await browser.close();

    const final = path.join(outputDir, 'sentinelx_demo_master.webm');
    const legacy = path.join(outputDir, 'sentinelx_demo_v4.webm');
    try {
      if (fs.existsSync(final)) fs.unlinkSync(final);
      fs.copyFileSync(raw, final);
      if (fs.existsSync(legacy)) fs.unlinkSync(legacy);
      fs.copyFileSync(raw, legacy);
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('  Master Video Saved Successfully:');
      console.log('  ' + final);
      console.log('═══════════════════════════════════════════════════════════');
    } catch (e) {
      console.error('Copy error:', e);
    }

    try {
      fs.readdirSync(tmpDir).forEach(f => {
        try { fs.unlinkSync(path.join(tmpDir, f)); } catch (_) {}
      });
    } catch (_) {}
  }
})();
