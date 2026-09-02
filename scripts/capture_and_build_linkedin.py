"""
Tam ekran (1920x1080) ekran goruntuleri alir ve LinkedIn carousel uretir.
Gereksinim: npx playwright (otomatik indirilir)
Kullanim: python scripts/capture_and_build_linkedin.py
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SHOT_DIR = ROOT / "docs" / "linkedin" / "screenshots"
CAROUSEL_DIR = ROOT / "docs" / "linkedin" / "carousel"
DESKTOP = Path.home() / "Desktop"
PACK = DESKTOP / "LinkedIn-Paylasim-Paketi"
BASE = "http://localhost:3000"

PAGES = [
    ("01-home.png", "/"),
    ("02-urunler.png", "/urunler"),
    ("03-urun-detay.png", "/urun/111-aaaa"),
    ("04-sepet.png", "/sepet"),
    ("05-odeme.png", "/odeme"),
    ("06-admin-login.png", "/giris?redirect=/admin"),
]

PLAYWRIGHT_SCRIPT = """
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
"""


def run_playwright_capture():
    SHOT_DIR.mkdir(parents=True, exist_ok=True)
    js_path = ROOT / "scripts" / "_capture_tmp.mjs"
    js_path.write_text(
        PLAYWRIGHT_SCRIPT.replace("process.argv[2]", "process.argv[2]")
        if False
        else PLAYWRIGHT_SCRIPT,
        encoding="utf-8",
    )

    # Inline node script
    node_code = f"""
const {{ chromium }} = require('playwright');
const path = require('path');
const OUT = {json.dumps(str(SHOT_DIR).replace(chr(92), '/'))};
const BASE = {json.dumps(BASE)};
const pages = {json.dumps([[f, u] for f, u in PAGES if f not in ('04-sepet.png', '05-odeme.png')])};

(async () => {{
  const browser = await chromium.launch({{ headless: true }});
  const ctx = await browser.newContext({{ viewport: {{ width: 1920, height: 1080 }}, deviceScaleFactor: 1 }});
  const page = await ctx.newPage();
  await page.goto(BASE + '/urunler', {{ waitUntil: 'networkidle', timeout: 60000 }});
  const accept = page.locator('button:has-text("Kabul Et")');
  if (await accept.isVisible({{ timeout: 3000 }}).catch(() => false)) {{
    await accept.click();
    await page.waitForTimeout(500);
  }}
  for (const [file, url] of pages) {{
    console.log('Capture:', file);
    await page.goto(BASE + url, {{ waitUntil: 'networkidle', timeout: 60000 }});
    await page.waitForTimeout(2500);
    await page.screenshot({{ path: path.join(OUT, file), fullPage: false }});
  }}
  await page.goto(BASE + '/urunler', {{ waitUntil: 'networkidle' }});
  for (let i = 0; i < 2; i++) {{
    const btn = page.locator('button:has-text("Sepete")').nth(i);
    if (await btn.isVisible({{ timeout: 3000 }}).catch(() => false)) {{
      await btn.click();
      await page.waitForTimeout(400);
    }}
  }}
  await page.goto(BASE + '/sepet', {{ waitUntil: 'networkidle' }});
  await page.waitForTimeout(2000);
  await page.screenshot({{ path: path.join(OUT, '04-sepet.png'), fullPage: false }});
  await page.goto(BASE + '/odeme', {{ waitUntil: 'networkidle' }});
  await page.waitForTimeout(2000);
  await page.screenshot({{ path: path.join(OUT, '05-odeme.png'), fullPage: false }});
  await browser.close();
  console.log('DONE');
}})();
"""
    tmp = ROOT / "scripts" / "_capture_run.mjs"
    tmp.write_text(node_code, encoding="utf-8")

    # Install playwright in project if needed
    subprocess.run(
        ["npm", "install", "playwright", "--no-save"],
        cwd=ROOT,
        check=False,
        capture_output=True,
    )
    subprocess.run(
        ["npx", "playwright", "install", "chromium"],
        cwd=ROOT,
        check=False,
        capture_output=True,
    )

    result = subprocess.run(
        ["node", str(tmp)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        timeout=180000,
    )
    print(result.stdout)
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
        return False
    return True


def build_fullbleed_carousel():
    from PIL import Image, ImageDraw, ImageFont

    W = H = 1080
    CAROUSEL_DIR.mkdir(parents=True, exist_ok=True)

    def fnt(size, bold=False):
        p = "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"
        if Path(p).exists():
            return ImageFont.truetype(p, size)
        return ImageFont.load_default()

    def cover_crop(img: Image.Image) -> Image.Image:
        """1920x1080 -> 1080x1080 merkez kirpma, tam ekran dolgu."""
        iw, ih = img.size
        # Hedef kare: genislikten kirp (landscape tam ekran hissi)
        if iw / ih > 1:
            new_h = ih
            new_w = ih  # kare
            left = (iw - new_w) // 2
            img = img.crop((left, 0, left + new_w, ih))
        # Olcekle 1080x1080
        return img.resize((W, H), Image.Resampling.LANCZOS)

    def add_label(img: Image.Image, title: str, num: str) -> Image.Image:
        out = img.copy()
        draw = ImageDraw.Draw(out)
        draw.rectangle([0, H - 72, W, H], fill=(15, 23, 42, 220))
        draw.text((24, H - 52), num, fill=(234, 88, 12), font=fnt(28, True))
        draw.text((80, H - 52), title, fill=(255, 255, 255), font=fnt(26, True))
        return out

    slides = [
        ("01-cover.png", None, "cover"),
        ("02-magaza.png", "01-home.png", "Ana Sayfa"),
        ("03-katalog.png", "02-urunler.png", "Urun Katalogu"),
        ("04-urun-detay.png", "03-urun-detay.png", "Urun Detay"),
        ("05-sepet.png", "04-sepet.png", "Sepet"),
        ("06-odeme.png", "05-odeme.png", "Odeme"),
        ("07-admin.png", "06-admin-login.png", "Admin Giris"),
        ("08-tech-stack.png", None, "tech"),
        ("09-cta.png", None, "cta"),
    ]

    # Import cover/tech/cta from existing builder
    sys.path.insert(0, str(ROOT / "scripts"))
    from build_linkedin_carousel import slide_cover, slide_tech_stack, slide_metrics, slide_cta

    outputs = []
    n = 0
    for out_name, src_name, kind in slides:
        n += 1
        if kind == "cover":
            img = slide_cover()
        elif kind == "tech":
            img = slide_tech_stack()
        elif kind == "cta":
            img = slide_cta()
        else:
            src = SHOT_DIR / src_name
            if src.exists():
                img = cover_crop(Image.open(src).convert("RGB"))
                img = add_label(img, kind, f"{n:02d}")
            else:
                img = slide_cover()
        path = CAROUSEL_DIR / out_name
        img.save(path, "PNG", optimize=True)
        outputs.append(path)
        print(f"Carousel: {path.name} ({path.stat().st_size} bytes)")

    return outputs


def deploy_to_desktop():
    from shutil import copy2

    PACK.mkdir(parents=True, exist_ok=True)
    (PACK / "Gorseller").mkdir(exist_ok=True)

    names = [
        ("01-cover.png", "LinkedIn-1-KAPAK.png"),
        ("02-magaza.png", "LinkedIn-2-ANA-SAYFA.png"),
        ("03-katalog.png", "LinkedIn-3-KATALOG.png"),
        ("04-urun-detay.png", "LinkedIn-4-URUN-DETAY.png"),
        ("05-sepet.png", "LinkedIn-5-SEPET.png"),
        ("06-odeme.png", "LinkedIn-6-ODEME.png"),
        ("07-admin.png", "LinkedIn-7-ADMIN.png"),
        ("08-tech-stack.png", "LinkedIn-8-TECH-STACK.png"),
        ("09-cta.png", "LinkedIn-9-GITHUB.png"),
    ]
    for src_name, dst_name in names:
        s = CAROUSEL_DIR / src_name
        if s.exists():
            copy2(s, DESKTOP / dst_name)
            copy2(s, PACK / "Gorseller" / src_name)
            copy2(s, PACK / dst_name)

    # Ham tam ekran screenshotlar
    raw = PACK / "Tam-Ekran-Screenshotlar"
    raw.mkdir(exist_ok=True)
    for f in SHOT_DIR.glob("*.png"):
        if f.name.startswith("0"):
            copy2(f, raw / f.name)

    subprocess.run(
        ["python", str(ROOT / "scripts" / "build_linkedin_desktop_pack.py")],
        cwd=ROOT,
        check=False,
    )


def main():
    print("1/3 Tam ekran screenshot aliniyor (1920x1080)...")
    ok = run_playwright_capture()
    if not ok:
        print("Playwright basarisiz - mevcut screenshotlarla devam ediliyor.")
    print("2/3 Carousel olusturuluyor (1080x1080 tam dolgu)...")
    build_fullbleed_carousel()
    print("3/3 Masaustune kopyalaniyor...")
    deploy_to_desktop()
    print("\nBitti! Masaustundeki LinkedIn-1-KAPAK.png ... LinkedIn-9-GITHUB.png dosyalarini kontrol edin.")


if __name__ == "__main__":
    main()
