/**
 * Tam ekran 1920x1080 screenshot - Edge/Chrome headless
 * node scripts/capture_full.mjs
 */
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "docs", "linkedin", "screenshots");
const BASE = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const BROWSERS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

const PAGES = [
  ["01-home.png", "/"],
  ["02-urunler.png", "/urunler"],
  ["03-urun-detay.png", "/urun/111-aaaa"],
  ["06-admin-login.png", "/giris?redirect=/admin"],
];

function findBrowser() {
  for (const p of BROWSERS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Chrome/Edge bulunamadi");
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const executablePath = findBrowser();
  console.log("Browser:", executablePath);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--window-size=1920,1080", "--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  await page.goto(BASE + "/urunler", { waitUntil: "networkidle2", timeout: 90000 });
  const accept = await page.$('button::-p-text(Kabul Et)');
  if (accept) {
    await accept.click();
    await sleep(500);
  }

  for (const [file, url] of PAGES) {
    console.log("Capture", file);
    await page.goto(BASE + url, { waitUntil: "networkidle2", timeout: 90000 });
    await sleep(2500);
    await page.screenshot({
      path: path.join(OUT, file),
      fullPage: false,
      type: "png",
    });
  }

  // Sepet dolu
  await page.goto(BASE + "/urunler", { waitUntil: "networkidle2" });
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate((el) => el.textContent, btn);
    if (text && text.includes("Sepete")) {
      await btn.click();
      await sleep(400);
      break;
    }
  }
  await page.goto(BASE + "/sepet", { waitUntil: "networkidle2" });
  await sleep(2000);
  await page.screenshot({ path: path.join(OUT, "04-sepet.png"), fullPage: false });

  await page.goto(BASE + "/odeme", { waitUntil: "networkidle2" });
  await sleep(2000);
  await page.screenshot({ path: path.join(OUT, "05-odeme.png"), fullPage: false });

  await browser.close();
  console.log("DONE - screenshots in", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
