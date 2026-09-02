
const { chromium } = require('playwright');
const path = require('path');
const OUT = "C:/Users/MaptechOfis1/Desktop/E-Ticaret/docs/linkedin/screenshots";
const BASE = "http://localhost:3000";
const pages = [["01-home.png", "/"], ["02-urunler.png", "/urunler"], ["03-urun-detay.png", "/urun/111-aaaa"], ["06-admin-login.png", "/giris?redirect=/admin"]];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(BASE + '/urunler', { waitUntil: 'networkidle', timeout: 60000 });
  const accept = page.locator('button:has-text("Kabul Et")');
  if (await accept.isVisible({ timeout: 3000 }).catch(() => false)) {
    await accept.click();
    await page.waitForTimeout(500);
  }
  for (const [file, url] of pages) {
    console.log('Capture:', file);
    await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(OUT, file), fullPage: false });
  }
  await page.goto(BASE + '/urunler', { waitUntil: 'networkidle' });
  for (let i = 0; i < 2; i++) {
    const btn = page.locator('button:has-text("Sepete")').nth(i);
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(400);
    }
  }
  await page.goto(BASE + '/sepet', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT, '04-sepet.png'), fullPage: false });
  await page.goto(BASE + '/odeme', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT, '05-odeme.png'), fullPage: false });
  await browser.close();
  console.log('DONE');
})();
