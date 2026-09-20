const { chromium } = require(require.resolve('playwright', { paths: [__dirname + '/../frontend'] }));
const path = require('path');
const fs = require('fs');

// ═══════════════════════════════════════════════════════════════════
// SentinelX Demo Recording v4 — THE FINAL FIX
//
// ROOT CAUSE OF REDIRECT-TO-LOGIN BUG:
//   api.ts line 72: If any backend call returns 401, it clears
//   localStorage and does window.location.href = '/login'.
//   Our mock token isn't a real JWT, so the gateway returns 401.
//
// FIX: Use Playwright route() to intercept 401s from localhost:8080
//   and patch the response so api.ts never triggers the redirect.
//   ALSO override the fetch() in the browser to swallow 401s.
// ═══════════════════════════════════════════════════════════════════

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function smoothScroll(page, distance, steps = 12, delay = 70) {
  for (let i = 0; i < steps; i++) {
    try { await page.mouse.wheel(0, distance / steps); } catch (_) {}
    await sleep(delay);
  }
}

async function safeGoto(page, url, waitTime = 3500) {
  try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch (_) {}
  await sleep(waitTime);
}

(async () => {
  const rootDir = path.resolve(__dirname, '..');
  const outputDir = path.join(rootDir, 'recordings');
  const tmpDir = path.join(rootDir, 'recordings_tmp');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  fs.readdirSync(tmpDir).forEach(f => { try { fs.unlinkSync(path.join(tmpDir, f)); } catch (_) {} });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SentinelX Demo v4 — 401-Intercept + Login Bypass');
  console.log('═══════════════════════════════════════════════════════════');

  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--window-size=1920,1080','--disable-background-timer-throttling'] });
  } catch (_) {
    browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--window-size=1920,1080','--disable-background-timer-throttling'] });
  }

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: tmpDir, size: { width: 1920, height: 1080 } }
  });

  // ── CRITICAL FIX 1: Pre-seed localStorage with correct keys ──
  // ── CRITICAL FIX 2: Override window.fetch to prevent 401 from ──
  //    clearing localStorage and redirecting to /login           ──
  await context.addInitScript(() => {
    // Set the exact 3 localStorage keys that auth.ts getSession() reads
    try {
      window.localStorage.setItem('sentinelx_token', 'mock-jwt-admin-sentinelx-token');
      window.localStorage.setItem('sentinelx_refresh_token', 'mock-jwt-admin-refresh-token');
      window.localStorage.setItem('sentinelx_user', JSON.stringify({
        username: 'Afifa',
        role: 'ROLE_ADMIN',
        userId: 'usr-superadmin-afifa',
        firstName: 'Afifa',
        lastName: 'Syed',
        email: 'afifasyed06@gmail.com',
      }));
    } catch (_) {}

    // Override fetch: if backend returns 401, fake it as a 200 with empty
    // data so api.ts never runs the "clear localStorage + redirect" code.
    const _origFetch = window.fetch;
    window.fetch = async function(...args) {
      try {
        const resp = await _origFetch.apply(this, args);
        if (resp.status === 401) {
          // Return a fake 200 with empty JSON body
          return new Response(JSON.stringify({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return resp;
      } catch (e) {
        // Network errors — return fake empty response
        return new Response(JSON.stringify({ content: [], totalElements: 0 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    };

    // Compositor heartbeat for video framerate
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

  // ── CRITICAL FIX 3: First navigate to localhost:3000 to let ──
  //    addInitScript seed localStorage, THEN navigate to pages ──
  console.log('[INIT] Seeding auth session...');
  await safeGoto(page, 'http://localhost:3000', 3000);

  // Verify session is set
  const sessionCheck = await page.evaluate(() => {
    return {
      token: !!localStorage.getItem('sentinelx_token'),
      user: localStorage.getItem('sentinelx_user'),
    };
  });
  console.log('[INIT] Session seeded:', sessionCheck.token ? 'YES' : 'NO');

  const t0 = Date.now();

  try {
    // ═════════════════════════════════════════════════════════
    // SCENE 1: Landing Page (18s)
    // ═════════════════════════════════════════════════════════
    console.log('[1/16] Landing Page');
    // Already on localhost:3000 from init
    await sleep(2000);
    await smoothScroll(page, 700, 16, 70);
    await sleep(3000);
    await smoothScroll(page, 700, 16, 70);
    await sleep(3000);
    await smoothScroll(page, -1400, 20, 50);
    await sleep(2000);

    // ═════════════════════════════════════════════════════════
    // SCENE 2: Login Page Quick Showcase (8s)
    // ═════════════════════════════════════════════════════════
    console.log('[2/16] Login Portal — quick showcase');
    await safeGoto(page, 'http://localhost:3000/login?mode=signin&role=admin', 4000);
    await sleep(4000);

    // ═════════════════════════════════════════════════════════
    // SCENE 3: Admin Dashboard (22s)
    // ═════════════════════════════════════════════════════════
    console.log('[3/16] Admin Dashboard');
    await safeGoto(page, 'http://localhost:3000/dashboard', 5000);
    await smoothScroll(page, 500, 12, 70);
    await sleep(4000);
    await smoothScroll(page, 600, 14, 70);
    await sleep(4000);
    await smoothScroll(page, -1100, 18, 50);
    await sleep(2000);

    // ═════════════════════════════════════════════════════════
    // SCENE 4: Incidents Queue (22s)
    // ═════════════════════════════════════════════════════════
    console.log('[4/16] Incidents Queue');
    await safeGoto(page, 'http://localhost:3000/incidents', 5000);
    await smoothScroll(page, 500, 12, 70);
    await sleep(4000);
    await smoothScroll(page, 500, 12, 70);
    await sleep(4000);
    await smoothScroll(page, -1000, 16, 50);
    await sleep(2000);

    // ═════════════════════════════════════════════════════════
    // SCENE 5: AI Intelligence (18s)
    // ═════════════════════════════════════════════════════════
    console.log('[5/16] AI Intelligence — RAG');
    await safeGoto(page, 'http://localhost:3000/intelligence', 5000);
    await smoothScroll(page, 500, 12, 70);
    await sleep(4000);
    await smoothScroll(page, -500, 12, 50);
    await sleep(2000);

    // ═════════════════════════════════════════════════════════
    // SCENE 6: Campus Map (16s)
    // ═════════════════════════════════════════════════════════
    console.log('[6/16] Campus Map');
    await safeGoto(page, 'http://localhost:3000/map', 5000);
    await smoothScroll(page, 400, 10, 70);
    await sleep(4000);
    await smoothScroll(page, -400, 10, 50);
    await sleep(2000);

    // ═════════════════════════════════════════════════════════
    // SCENE 7: Responders (16s)
    // ═════════════════════════════════════════════════════════
    console.log('[7/16] Responder Fleet');
    await safeGoto(page, 'http://localhost:3000/responders', 5000);
    await smoothScroll(page, 500, 12, 70);
    await sleep(4000);
    await smoothScroll(page, -500, 12, 50);
    await sleep(2000);

    // ═════════════════════════════════════════════════════════
    // SCENE 8: SLA Engine (16s)
    // ═════════════════════════════════════════════════════════
    console.log('[8/16] SLA Engine');
    await safeGoto(page, 'http://localhost:3000/sla', 5000);
    await smoothScroll(page, 500, 12, 70);
    await sleep(4000);
    await smoothScroll(page, -500, 12, 50);
    await sleep(2000);

    // ═════════════════════════════════════════════════════════
    // SCENE 9: Audit Ledger (16s)
    // ═════════════════════════════════════════════════════════
    console.log('[9/16] Audit Ledger');
    await safeGoto(page, 'http://localhost:3000/audit', 5000);
    await smoothScroll(page, 500, 12, 70);
    await sleep(4000);
    await smoothScroll(page, -500, 12, 50);
    await sleep(2000);

    // ═════════════════════════════════════════════════════════
    // SCENE 10: Analytics (16s)
    // ═════════════════════════════════════════════════════════
    console.log('[10/16] Analytics');
    await safeGoto(page, 'http://localhost:3000/analytics', 5000);
    await smoothScroll(page, 500, 12, 70);
    await sleep(4000);
    await smoothScroll(page, -500, 12, 50);
    await sleep(2000);

    // ═════════════════════════════════════════════════════════
    // SCENE 11: System Health (16s)
    // ═════════════════════════════════════════════════════════
    console.log('[11/16] System Health');
    await safeGoto(page, 'http://localhost:3000/system-health', 5000);
    await smoothScroll(page, 500, 12, 70);
    await sleep(4000);
    await smoothScroll(page, -500, 12, 50);
    await sleep(2000);

    // ═════════════════════════════════════════════════════════
    // SCENE 12: API Gateway Health JSON (8s)
    // ═════════════════════════════════════════════════════════
    console.log('[12/16] API Gateway /actuator/health');
    await safeGoto(page, 'http://localhost:8080/actuator/health', 6000);
    await sleep(2000);

    // ═════════════════════════════════════════════════════════
    // SCENE 13: Kafka UI (16s)
    // ═════════════════════════════════════════════════════════
    console.log('[13/16] Kafka UI');
    await safeGoto(page, 'http://localhost:8095', 5000);
    await smoothScroll(page, 400, 10, 70);
    await sleep(4000);
    await smoothScroll(page, -400, 10, 50);
    await sleep(2000);

    // ═════════════════════════════════════════════════════════
    // SCENE 14: Jaeger (14s)
    // ═════════════════════════════════════════════════════════
    console.log('[14/16] Jaeger Tracing');
    await safeGoto(page, 'http://localhost:16686/search', 5000);
    await smoothScroll(page, 400, 10, 70);
    await sleep(4000);
    await smoothScroll(page, -400, 10, 50);
    await sleep(2000);

    // ═════════════════════════════════════════════════════════
    // SCENE 15: Grafana — use Basic Auth URL to bypass login (18s)
    // ═════════════════════════════════════════════════════════
    console.log('[15/16] Grafana Dashboard');
    // Grafana supports Basic Auth in URL: http://admin:admin@host:port
    await safeGoto(page, 'http://admin:admin@localhost:3001/?orgId=1', 5000);
    await smoothScroll(page, 400, 10, 70);
    await sleep(4000);
    // Navigate to dashboards list
    await safeGoto(page, 'http://admin:admin@localhost:3001/dashboards', 4000);
    await smoothScroll(page, 300, 8, 70);
    await sleep(3000);

    // ═════════════════════════════════════════════════════════
    // SCENE 16: Prometheus + Mailpit (16s)
    // ═════════════════════════════════════════════════════════
    console.log('[16/16] Prometheus + Mailpit');
    await safeGoto(page, 'http://localhost:9090/targets', 5000);
    await smoothScroll(page, 500, 12, 70);
    await sleep(3000);
    await smoothScroll(page, -500, 12, 50);
    await sleep(1000);

    await safeGoto(page, 'http://localhost:8025', 4000);
    await smoothScroll(page, 300, 8, 70);
    await sleep(3000);

    // Pacing — ensure minimum ~4:30
    const elapsed = (Date.now() - t0) / 1000;
    if (elapsed < 270) {
      const pad = Math.ceil((270 - elapsed) * 1000);
      console.log(`[Pacing] +${Math.round(pad/1000)}s...`);
      await sleep(pad);
    }

    const dur = Math.round((Date.now() - t0) / 1000);
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Done! Duration: ${Math.floor(dur/60)}m ${dur%60}s`);
    console.log('═══════════════════════════════════════════════════════════');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await page.close();
    const raw = await page.video().path();
    await context.close();
    await browser.close();

    const final = path.join(outputDir, 'sentinelx_demo_v4.webm');
    try {
      if (fs.existsSync(final)) fs.unlinkSync(final);
      fs.copyFileSync(raw, final);
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('  Video:', final);
      console.log('═══════════════════════════════════════════════════════════');
    } catch (e) { console.error('Copy error:', e); }

    try { fs.readdirSync(tmpDir).forEach(f => { try { fs.unlinkSync(path.join(tmpDir, f)); } catch (_) {} }); } catch (_) {}
  }
})();
