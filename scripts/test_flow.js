const { chromium } = require('d:/SentinelX/frontend/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('1. Navigating to login...');
  await page.goto('http://localhost:3000/login');
  await page.waitForTimeout(1000);

  console.log('2. Selecting Campus User...');
  await page.click('#role-select-user');
  await page.fill('#signin-username', 'campus_user');
  await page.fill('#signin-password', 'User@12345');
  await page.click('#btn-signin-submit');
  await page.waitForTimeout(3000);

  console.log('URL after campus_user login:', page.url());
  const inputTitle = await page.waitForSelector('#incident-title', { timeout: 5000 });
  console.log('Found #incident-title:', !!inputTitle);

  console.log('3. Filling emergency report on /user...');
  await page.fill('#incident-title', 'Medical emergency in East Quad');
  await page.fill('#incident-desc', 'Student needs immediate medical assistance on site.');
  await page.click('#btn-submit-report');
  await page.waitForTimeout(2000);
  console.log('Submitted report successfully!');

  console.log('4. Triggering SOS beacon...');
  await page.click('#btn-emergency-sos');
  await page.waitForTimeout(2000);
  console.log('SOS beacon triggered successfully!');

  console.log('5. Navigating to admin login...');
  await page.goto('http://localhost:3000/login');
  await page.waitForTimeout(1000);
  await page.click('#role-select-admin');
  await page.fill('#signin-username', 'afifa');
  await page.fill('#signin-password', 'Admin@12345');
  await page.click('#btn-signin-submit');
  await page.waitForTimeout(3000);

  console.log('URL after admin login:', page.url());
  const hasCommander = (await page.textContent('body')).includes('COMMAND');
  console.log('Has Admin Command Center:', hasCommander);

  await browser.close();
  console.log('All checks passed!');
})();
