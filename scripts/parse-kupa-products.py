# -*- coding: utf-8 -*-
"""Fast block-based parser using pre-extracted pages.json."""
import json
import re
import os

PAGES_JSON = r"C:\Users\MaptechOfis1\Desktop\E-Ticaret\scripts\kupa-extract\pages.json"
OUT_PATH = r"C:\Users\MaptechOfis1\Desktop\E-Ticaret\scripts\kupa-extract\products.json"

CATEGORIES = [
    ("Seramik Makinaları ve Ekipmanları", 7, 13),
    ("Boyacı ve Sıvacı Ekipmanları", 14, 19),
    ("Kimyasal Ekipmanları", 20, 22),
    ("Hırdavat ve El Aletleri", 23, 31),
    ("Teknik Hırdavat", 32, 49),
    ("Yağmurluk Grubu", 50, 51),
    ("Bant Grubu", 52, 61),
    ("Kilit Grubu", 62, 67),
    ("Bağlantı Ekipmanları", 68, 73),
    ("Kaldırma ve İş Güvenliği Ekipmanları", 74, 79),
    ("Ölçü Aletleri", 80, 83),
    ("Elektrik ve Kaynak Ekipmanları", 84, 89),
    ("Pürmüz ve Şalümolar", 90, 91),
    ("Kesici El Aletleri", 92, 93),
    ("Tornavida ve Bits Uç Grubu", 94, 101),
    ("Matkap Ucu Grubu", 102, 111),
    ("Panç Grubu", 112, 115),
    ("Kesici ve Aşındırıcılar", 116, 123),
    ("Testere Grubu", 124, 127),
    ("Bahçe Grubu", 128, 146),
]

SKIP = {
    "www.kupatools.com", "Liste Fiyatı", "Ürün Kodu", "Özellik",
    "Kutu Adedi", "Koli Adedi", "Fiyat", "TYSON", "KUPA TOOLS",
    "Ürün görselinin üstüne tıkla sayfaya git!",
    "P R O F E S S I O N A L H A N D T O O L S",
    "PRO", "Foam", "GUN", "PU", "Endüstriyel ve", "ağır işlerde",
    "kullanılabilir.", "Dayanıklı", "Güçlü", "Vakumlama", "331 IBS",
    "SERAMİK MAK. VE EKİPMANLARI", "KİMYASAL EKİPMANLARI",
}

SKU_RE = re.compile(r"^[A-Z]{1,4}\d{2,5}[A-Z0-9\-]*$")
PRICE_RE = re.compile(r"^(\d+(?:[.,]\d+)?)\s*\$")
TITLE_START = re.compile(r"^(TYSON|KUPA)\b", re.I)
SERIES_RE = re.compile(r" SERIES$")


def slugify(text):
    text = text.lower()
    tr = str.maketrans("çğıöşüÇĞİÖŞÜ", "cgiosucgiosu")
    text = text.translate(tr)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")[:90]


def get_category(page_num):
    for name, start, end in CATEGORIES:
        if start <= page_num <= end:
            return name
    return "Kupa Tools"


def parse_price(s):
    m = PRICE_RE.match(s.strip())
    return float(m.group(1).replace(",", ".")) if m else None


def is_sku(text):
    return bool(SKU_RE.match(text.strip()))


def clean_lines(text):
    out = []
    for raw in text.split("\n"):
        line = raw.strip()
        if not line or line in SKIP:
            continue
        if re.match(r"^\d{1,3}$", line):
            continue
        if SERIES_RE.search(line):
            continue
        out.append(line)
    return out


def collect_titles_before_desc(lines):
    """Titles at page top before first bullet description."""
    titles = []
    current = []
    for line in lines:
        if line.startswith("- "):
            if current:
                titles.append(" ".join(current))
                current = []
            break
        if is_sku(line) or parse_price(line):
            if current:
                titles.append(" ".join(current))
                current = []
            continue
        if any(k in line for k in ["Koli Adedi:", "Kutu Adedi:", "mm Elmas", "Nominal", "Watt", "Volt", "Frekans", "Boştaki", "Bağlantı"]):
            if current:
                titles.append(" ".join(current))
                current = []
            continue
        if TITLE_START.match(line):
            if current:
                titles.append(" ".join(current))
            current = [line]
        elif current:
            current.append(line)
    if current:
        titles.append(" ".join(current))
    return [re.sub(r"\s+", " ", t).strip() for t in titles if len(t) > 5]


def parse_table_blocks(lines):
    """Parse repeated title + table row blocks."""
    products = []
    i = 0
    while i < len(lines):
        if TITLE_START.match(lines[i]):
            title_parts = [lines[i]]
            i += 1
            while i < len(lines) and not is_sku(lines[i]) and not lines[i].startswith("- "):
                if lines[i] in SKIP or parse_price(lines[i]):
                    break
                if any(h in lines[i] for h in ["Ürün Kodu", "Koli Adedi", "Kutu Adedi"]):
                    break
                title_parts.append(lines[i])
                i += 1
            name = re.sub(r"\s+", " ", " ".join(title_parts)).strip()

            # skip table headers
            while i < len(lines) and lines[i] in SKIP:
                i += 1

            skus, prices = [], []
            while i < len(lines):
                if TITLE_START.match(lines[i]):
                    break
                if lines[i].startswith("- "):
                    break
                if is_sku(lines[i]):
                    skus.append(lines[i])
                    i += 1
                    continue
                p = parse_price(lines[i])
                if p is not None:
                    prices.append(p)
                    i += 1
                    continue
                if skus and not prices:
                    i += 1
                    continue
                if skus and prices:
                    break
                i += 1

            if skus and prices:
                if len(skus) == len(prices):
                    for sku, price in zip(skus, prices):
                        products.append({"sku": sku, "name": name, "priceUsd": price})
                else:
                    for idx, sku in enumerate(skus):
                        price = prices[idx] if idx < len(prices) else prices[-1]
                        products.append({"sku": sku, "name": name, "priceUsd": price})
            continue
        i += 1
    return products


def parse_page_layout(lines):
    """Align top titles with SKUs and prices for side-by-side pages."""
    titles = collect_titles_before_desc(lines)
    skus = [l for l in lines if is_sku(l)]
    prices = []
    for l in lines:
        p = parse_price(l)
        if p is not None:
            prices.append(p)

    products = []
    if not skus or not prices:
        return products

    if len(titles) == len(skus) == len(prices):
        for name, sku, price in zip(titles, skus, prices):
            products.append({"sku": sku, "name": name, "priceUsd": price})
    elif len(skus) == len(prices):
        for idx, (sku, price) in enumerate(zip(skus, prices)):
            name = titles[idx] if idx < len(titles) else sku
            products.append({"sku": sku, "name": name, "priceUsd": price})
    elif len(skus) == 1 and prices:
        products.append({"sku": skus[0], "name": titles[0] if titles else skus[0], "priceUsd": prices[0]})
    return products


def parse_sku_scan(lines):
    """Fallback: each SKU gets nearest forward price and nearest backward title."""
    products = []
    for idx, line in enumerate(lines):
        if not is_sku(line):
            continue
        sku = line
        price = None
        for j in range(idx + 1, min(idx + 10, len(lines))):
            p = parse_price(lines[j])
            if p is not None:
                price = p
                break
        if price is None:
            continue

        name = None
        for k in range(idx - 1, max(idx - 25, -1), -1):
            if TITLE_START.match(lines[k]):
                parts = [lines[k]]
                for m in range(k + 1, idx):
                    if not is_sku(lines[m]) and parse_price(lines[m]) is None:
                        if not lines[m].startswith("- ") and "Adet" not in lines[m]:
                            parts.append(lines[m])
                name = " ".join(parts)
                break

        products.append({"sku": sku, "name": name or sku, "priceUsd": price})
    return products


def extract_features(text):
    feats = []
    for m in re.finditer(r"- ([^\n]+(?:\n(?![-A-Z])[^\n]+)*)", text):
        f = re.sub(r"\s+", " ", m.group(1)).strip()
        if len(f) > 20 and not f.startswith("Özellikle karo"):
            feats.append(f[:250])
    # dedupe
    seen = set()
    out = []
    for f in feats:
        key = f[:50]
        if key not in seen:
            seen.add(key)
            out.append(f)
    return out[:5]


def parse_page(page_num, text):
    if page_num < 7 or not text.strip():
        return []

    lines = clean_lines(text)
    if not lines:
        return []

    products = parse_table_blocks(lines)
    if not products:
        products = parse_page_layout(lines)
    if not products:
        products = parse_sku_scan(lines)

    seen = set()
    unique = []
    for p in products:
        if p["sku"] not in seen:
            seen.add(p["sku"])
            unique.append(p)
    return unique


def main():
    with open(PAGES_JSON, encoding="utf-8") as f:
        pages = json.load(f)

    all_products = []
    global_seen = set()

    for page in pages:
        pn = page["page"]
        prods = parse_page(pn, page["text"])
        category = get_category(pn)
        features = extract_features(page["text"])

        for p in prods:
            if p["sku"] in global_seen:
                continue
            global_seen.add(p["sku"])
            p["category"] = category
            p["page"] = pn
            p["features"] = features
            p["name"] = re.sub(r"\s+", " ", p["name"]).strip()
            p["slug"] = slugify(f"{p['sku']}-{p['name']}")
            all_products.append(p)

    all_products.sort(key=lambda x: (x["page"], x["sku"]))

    print(f"Total products: {len(all_products)}")
    for p in all_products[:15]:
        print(f"  [{p['page']}] {p['sku']}: {p['name'][:70]} -> ${p['priceUsd']}")

    bad = [p for p in all_products if p["name"] == p["sku"]]
    print(f"SKU-only names: {len(bad)}")

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(all_products, f, ensure_ascii=False, indent=2)
    print(f"Saved {OUT_PATH}")


if __name__ == "__main__":
    main()
