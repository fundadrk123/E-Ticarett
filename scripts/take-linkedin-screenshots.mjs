/**
 * LinkedIn paylaşımı için 8 sayfa ekran görüntüsü alır.
 * Kullanım: node scripts/take-linkedin-screenshots.mjs
 * Önkoşul: npm run dev çalışıyor olmalı
 */
import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "docs", "linkedin", "screenshots");
const BASE = "http://localhost:3000";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@mertemgrup.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123!";

const PAGES = [
  { file: "01-home.png", url: "/", wait: 2000 },
  { file: "02-urunler.png", url: "/urunler", wait: 2000 },
  {
    file: "03-urun-detay.png",
    url: "/urun/tys9800-tyson-i-ki-devi-rli-boya-ve-harc-karistiricisi-senkronize-calisan-2-kademeli-guclu",
    wait: 2000,
  },
];

async function setupCart(page) {
  // Ürün sayfasından sepete ekle
  await page.goto(`${BASE}/urunler`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const addBtn = page.locator('button:has-text("Sepete")').first();
  if (await addBtn.isVisible()) {
    await addBtn.click();
    await page.waitForTimeout(500);
  }
  const addBtn2 = page.locator('button:has-text("Sepete")').nth(1);
  if (await addBtn2.isVisible()) {
    await addBtn2.click();
    await page.waitForTimeout(500);
  }
}

async function loginAdmin(page) {
  await page.goto(`${BASE}/giris`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"], input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  console.log("Screenshot klasörü:", OUT_DIR);

  // Mağaza sayfaları
  for (const { file, url, wait } of PAGES) {
    console.log(`→ ${file}`);
    await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(wait);
    await page.screenshot({
      path: path.join(OUT_DIR, file),
      fullPage: false,
    });
  }

  // Sepet (dolu)
  console.log("→ 04-sepet.png");
  await setupCart(page);
  await page.goto(`${BASE}/sepet`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT_DIR, "04-sepet.png") });

  // Ödeme
  console.log("→ 05-odeme.png");
  await page.goto(`${BASE}/odeme`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT_DIR, "05-odeme.png") });

  // Admin (giriş yap)
  console.log("→ Admin girişi...");
  await loginAdmin(page);

  const adminPages = [
    { file: "06-admin-dashboard.png", url: "/admin" },
    { file: "07-admin-siparisler.png", url: "/admin/siparisler" },
    { file: "08-admin-urunler.png", url: "/admin/urunler" },
  ];

  for (const { file, url } of adminPages) {
    console.log(`→ ${file}`);
    await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT_DIR, file) });
  }

  await browser.close();
  console.log("\nTamamlandı! 8 screenshot kaydedildi.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
