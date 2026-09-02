"""
LinkedIn carousel slaytları oluşturur (1080x1080 PNG).
Kullanım: python scripts/build_linkedin_carousel.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SCREENSHOTS = ROOT / "docs" / "linkedin" / "screenshots"
OUT = ROOT / "docs" / "linkedin" / "carousel"

W, H = 1080, 1080
NAVY = (15, 23, 42)
SLATE = (30, 41, 59)
ORANGE = (234, 88, 12)
WHITE = (255, 255, 255)
LIGHT = (241, 245, 249)
MUTED = (148, 163, 184)
ACCENT = (59, 130, 246)


def font(size: int, bold=False):
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw_footer(draw, text="Fullstack Developer · Mertem Grup E-Ticaret"):
    draw.text((W // 2, H - 48), text, fill=MUTED, font=font(22), anchor="mm")


def slide_cover():
    img = Image.new("RGB", (W, H), NAVY)
    draw = ImageDraw.Draw(img)
    # Grid pattern
    for x in range(0, W, 40):
        draw.line([(x, 0), (x, H)], fill=(25, 35, 55), width=1)
    for y in range(0, H, 40):
        draw.line([(0, y), (W, y)], fill=(25, 35, 55), width=1)

    draw.rounded_rectangle([80, 80, 200, 200], radius=24, fill=ACCENT)
    draw.text((140, 140), "MG", fill=WHITE, font=font(52, True), anchor="mm")

    draw.text((80, 260), "Fullstack E-Ticaret", fill=ORANGE, font=font(36, True))
    draw.text((80, 330), "Platformu", fill=WHITE, font=font(64, True))
    draw.text(
        (80, 430),
        "İnşaat Malzemeleri & Hırdavat\nToptan Satış",
        fill=MUTED,
        font=font(32),
    )

    badges = ["Next.js 15", "React 19", "PostgreSQL", "TypeScript", "iyzico", "JWT"]
    x = 80
    y = 560
    for b in badges:
        tw = draw.textlength(b, font=font(24))
        pad = 24
        draw.rounded_rectangle([x, y, x + tw + pad * 2, y + 52], radius=26, fill=SLATE, outline=ACCENT)
        draw.text((x + pad, y + 10), b, fill=WHITE, font=font(24))
        x += tw + pad * 2 + 16
        if x > W - 200:
            x = 80
            y += 68

    draw_footer(draw)
    return img


def slide_screenshot(path: Path, title: str, subtitle: str = "", fullbleed: bool = False):
    """fullbleed=True: screenshot tum slayti kaplar (1080x1080)."""
    if fullbleed and path.exists():
        shot = Image.open(path).convert("RGB")
        iw, ih = shot.size
        # 1920x1080 -> 1080x1080: ustten kirp + olcekle veya genisligi 1080'e sigdir
        target = 1080
        if iw >= ih:
            # landscape: yuksekligi doldur, genislikten merkez kirp
            scale = target / ih
            nw, nh = int(iw * scale), target
            shot = shot.resize((nw, nh), Image.Resampling.LANCZOS)
            if nw > target:
                left = (nw - target) // 2
                shot = shot.crop((left, 0, left + target, target))
            else:
                canvas = Image.new("RGB", (target, target), NAVY)
                canvas.paste(shot, ((target - nw) // 2, 0))
                shot = canvas
        else:
            shot = shot.resize((target, target), Image.Resampling.LANCZOS)
        # Alt etiket
        draw = ImageDraw.Draw(shot)
        draw.rectangle([0, target - 64, target, target], fill=NAVY)
        draw.text((20, target - 44), title, fill=WHITE, font=font(28, True))
        if subtitle:
            draw.text((20, target - 18), subtitle, fill=MUTED, font=font(18))
        return shot

    img = Image.new("RGB", (W, H), LIGHT)
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, W, 120], fill=NAVY)
    draw.text((W // 2, 60), title, fill=WHITE, font=font(40, True), anchor="mm")
    if subtitle:
        draw.text((W // 2, 100), subtitle, fill=MUTED, font=font(22), anchor="mm")

    if path.exists():
        shot = Image.open(path).convert("RGB")
        # Fit into frame
        max_w, max_h = W - 80, H - 220
        ratio = min(max_w / shot.width, max_h / shot.height)
        nw, nh = int(shot.width * ratio), int(shot.height * ratio)
        shot = shot.resize((nw, nh), Image.Resampling.LANCZOS)
        # Shadow
        shadow = Image.new("RGBA", (nw + 20, nh + 20), (0, 0, 0, 0))
        sd = ImageDraw.Draw(shadow)
        sd.rounded_rectangle([10, 10, nw + 10, nh + 10], radius=16, fill=(0, 0, 0, 60))
        shadow = shadow.filter(ImageFilter.GaussianBlur(8))
        img.paste(shadow, ((W - nw) // 2 - 5, 140), shadow)
        # Screenshot with rounded corners mask
        mask = Image.new("L", (nw, nh), 0)
        md = ImageDraw.Draw(mask)
        md.rounded_rectangle([0, 0, nw, nh], radius=12, fill=255)
        img.paste(shot, ((W - nw) // 2, 150))

    draw_footer(draw)
    return img


def slide_tech_stack():
    img = Image.new("RGB", (W, H), NAVY)
    draw = ImageDraw.Draw(img)
    draw.text((W // 2, 100), "Tech Stack", fill=WHITE, font=font(52, True), anchor="mm")
    draw.text((W // 2, 160), "Monolitik Next.js Fullstack", fill=MUTED, font=font(28), anchor="mm")

    stacks = [
        ("Frontend", "Next.js 15 · React 19 · Tailwind CSS v4"),
        ("Backend", "Next.js API Routes · 37 REST Endpoint"),
        ("Database", "PostgreSQL 16 · 12 Tablo · Raw SQL"),
        ("Auth", "JWT · bcrypt · httpOnly Cookie"),
        ("Ödeme", "iyzico · Havale · Kapıda Ödeme"),
        ("Diğer", "Nodemailer · Docker · TypeScript"),
    ]
    y = 220
    for label, value in stacks:
        draw.rounded_rectangle([80, y, W - 80, y + 100], radius=16, fill=SLATE)
        draw.text((110, y + 22), label, fill=ORANGE, font=font(26, True))
        draw.text((110, y + 58), value, fill=WHITE, font=font(24))
        y += 120

    draw_footer(draw)
    return img


def slide_metrics():
    img = Image.new("RGB", (W, H), LIGHT)
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, W, 140], fill=NAVY)
    draw.text((W // 2, 70), "Proje Metrikleri", fill=WHITE, font=font(48, True), anchor="mm")

    metrics = [
        ("37", "REST API\nEndpoint"),
        ("12", "Veritabanı\nTablosu"),
        ("30", "Sayfa\n(Route)"),
        ("3", "Ödeme\nYöntemi"),
    ]
    positions = [(140, 220), (580, 220), (140, 580), (580, 580)]
    for (num, label), (x, y) in zip(metrics, positions):
        draw.rounded_rectangle([x, y, x + 360, y + 300], radius=24, fill=WHITE, outline=(226, 232, 240))
        draw.text((x + 180, y + 100), num, fill=ACCENT, font=font(80, True), anchor="mm")
        draw.text((x + 180, y + 210), label, fill=SLATE, font=font(28), anchor="mm", align="center")

    features = [
        "Sepet senkronu (localStorage + PostgreSQL)",
        "Misafir & üye checkout",
        "Admin paneli + sipariş bildirimleri",
    ]
    fy = 920
    for f in features:
        draw.text((W // 2, fy), f"✓  {f}", fill=SLATE, font=font(24), anchor="mm")
        fy += 36

    draw_footer(draw)
    return img


def slide_cta():
    img = Image.new("RGB", (W, H), NAVY)
    draw = ImageDraw.Draw(img)
    draw.text((W // 2, 200), "Canlı Demo & Kaynak Kod", fill=WHITE, font=font(52, True), anchor="mm")
    draw.text(
        (W // 2, 290),
        "Deploy sonrası linkleri güncelleyin",
        fill=MUTED,
        font=font(28),
        anchor="mm",
    )

    boxes = [
        ("Canlı Demo", "[VERCEL_URL]", ORANGE),
        ("GitHub", "github.com/fundadrk123/E-Ticarett", ACCENT),
        ("Dokümantasyon", "DOCUMENTATION.md", SLATE),
    ]
    y = 380
    for title, url, color in boxes:
        draw.rounded_rectangle([120, y, W - 120, y + 120], radius=20, fill=color)
        draw.text((W // 2, y + 40), title, fill=WHITE, font=font(32, True), anchor="mm")
        draw.text((W // 2, y + 82), url, fill=(255, 255, 255, 200), font=font(22), anchor="mm")
        y += 150

    draw.text((W // 2, 880), "Swipe → Ekran görüntülerine bakın", fill=MUTED, font=font(28), anchor="mm")
    draw_footer(draw)
    return img


def main():
    OUT.mkdir(parents=True, exist_ok=True)

    slides = [
        ("01-cover.png", slide_cover()),
        ("02-magaza.png", slide_screenshot(SCREENSHOTS / "01-home.png", "Mağaza", "Ana Sayfa", fullbleed=True)),
        ("03-katalog.png", slide_screenshot(SCREENSHOTS / "02-urunler.png", "Katalog", "Ürün Listesi", fullbleed=True)),
        ("04-urun-detay.png", slide_screenshot(SCREENSHOTS / "03-urun-detay.png", "Ürün Detay", fullbleed=True)),
        ("05-sepet.png", slide_screenshot(SCREENSHOTS / "04-sepet.png", "Sepet", fullbleed=True)),
        ("06-odeme.png", slide_screenshot(SCREENSHOTS / "05-odeme.png", "Ödeme", "Checkout", fullbleed=True)),
        ("07-admin.png", slide_screenshot(SCREENSHOTS / "06-admin-login.png", "Admin", "Giriş Paneli", fullbleed=True)),
        ("08-tech-stack.png", slide_tech_stack()),
        ("09-cta.png", slide_cta()),
    ]

    for name, img in slides:
        path = OUT / name
        img.save(path, "PNG", optimize=True)
        print(f"OK: {path}")

    print(f"\n{len(slides)} carousel slaytı oluşturuldu.")


if __name__ == "__main__":
    main()
