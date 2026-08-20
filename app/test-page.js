const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://pilateswithneelam.in/login');
  await page.waitForLoadState('networkidle');
  
  const title = await page.title();
  console.log('Page Title:', title);
  
  // Check various selectors for brand/logo
  const brandSelectors = ['.brand-wordmark', '.logo-mark', '.pw', '.neelam', '.brand-emblem'];
  for (const sel of brandSelectors) {
    const el = page.locator(sel);
    const visible = await el.isVisible();
    const count = await el.count();
    console.log('Selector "' + sel + '": visible=' + visible + ', count=' + count);
  }
  
  // Check dark theme background
  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  console.log('Body background-color:', bodyBg, '(rgb(12, 10, 9) = #0c0a09)');
  
  // Check form inputs with different selectors
  const inputSelectors = [
    'input[type="email"]',
    'input[name="email"]', 
    'input[placeholder*="email"]',
    'input[autocomplete="username"]'
  ];
  for (const sel of inputSelectors) {
    const el = page.locator(sel);
    const visible = await el.isVisible();
    const count = await el.count();
    if (count > 0) {
      console.log('Email input selector "' + sel + '": visible=' + visible + ', count=' + count);
      break;
    }
  }
  
  // Check password input
  const pwdSelectors = [
    'input[type="password"]',
    'input[name="password"]',
    'input[placeholder*="password"]'
  ];
  for (const sel of pwdSelectors) {
    const el = page.locator(sel);
    const visible = await el.isVisible();
    const count = await el.count();
    if (count > 0) {
      console.log('Password input selector "' + sel + '": visible=' + visible + ', count=' + count);
      break;
    }
  }
  
  // Check sign in button
  const btnSelectors = [
    'button[type="submit"]',
    '.auth-submit',
    'button:has-text("Sign in")',
    'button.btn-primary'
  ];
  for (const sel of btnSelectors) {
    const el = page.locator(sel);
    const visible = await el.isVisible();
    const count = await el.count();
    if (count > 0) {
      console.log('Button selector "' + sel + '": visible=' + visible + ', count=' + count);
      break;
    }
  }
  
  // Check primary class (gold gradient)
  const goldAccents = await page.locator('.text-[#c9975a]').count();
  console.log('Elements with #c9975a color:', goldAccents);
  
  const darkBg = await page.locator('[style*="bg-deep"]').count();
  console.log('Elements with bg-deep:', darkBg);
  
  // Attempt login
  try {
    await page.fill('input[name="email"]', 'neelamr');
    await page.fill('input[name="password"]', 'rules123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    const url = page.url();
    console.log('URL after login attempt:', url);
    console.log('Navigated away from login:', !url.includes('/login'));
  } catch (e) {
    console.log('Login attempt timed out or failed:', e.message);
  }
  
  await browser.close();
  console.log('\\n=== Demo Complete ===');
})();