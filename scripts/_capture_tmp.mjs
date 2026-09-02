
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2];
const BASE = process.argv[3];
const pages = JSON.parse(process.argv[4]);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  // Cookie banner kapat
  await page.goto(BASE + '/urunler', { waitUntil: 'networkidle', timeout: 60000 });
  const accept = page.locator('button:has-text("Kabul Et")');
  if (await accept.isVisible({ timeout: 3000 }).catch(() => false)) {
    await accept.click();
    await page.waitForTimeout(500);
  }

  for (const [file, url] of pages) {
    console.log('Capture:', file);
    await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(OUT, file),
      fullPage: false,
      type: 'png',
    });
  }

  // Sepet dolu icin urun ekle
  await page.goto(BASE + '/urunler', { waitUntil: 'networkidle' });
  const btn = page.locator('button:has-text("Sepete")').first();
  if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(500);
  }
  await page.goto(BASE + '/sepet', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, '04-sepet.png'), fullPage: false });

  await page.goto(BASE + '/odeme', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, '05-odeme.png'), fullPage: false });

  await browser.close();
  console.log('DONE');
})();
