# -*- coding: utf-8 -*-
"""Extract one image per SKU by matching SKU text position to nearest product photo."""
import fitz
import json
import os
import re

PDF_PATH = r"C:\Users\MaptechOfis1\Downloads\Kupa Tools Haziran 2026 (1).pdf"
PRODUCTS_JSON = r"C:\Users\MaptechOfis1\Desktop\E-Ticaret\scripts\kupa-extract\products.json"
OUT_DIR = r"C:\Users\MaptechOfis1\Desktop\E-Ticaret\public\products\kupa\sku"

os.makedirs(OUT_DIR, exist_ok=True)

SKU_RE = re.compile(r"^[A-Z]{1,4}\d{2,5}[A-Z0-9\-]*$")

with open(PRODUCTS_JSON, encoding="utf-8") as f:
    products = json.load(f)

by_page = {}
for p in products:
    by_page.setdefault(p["page"], []).append(p)

doc = fitz.open(PDF_PATH)
mapped = 0
fallback = 0


def find_sku_positions(page):
    found = []
    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            text = "".join(s["text"] for s in line["spans"]).strip()
            if SKU_RE.match(text):
                x0, y0, x1, y1 = line["bbox"]
                found.append({
                    "sku": text,
                    "x": (x0 + x1) / 2,
                    "y": (y0 + y1) / 2,
                })
    return found


def get_image_rects(page):
    results = []
    for info in page.get_image_info(xrefs=True):
        xref = info.get("xref")
        bbox = info.get("bbox")
        if not xref or not bbox:
            continue
        w = info.get("width", 0) or 0
        h = info.get("height", 0) or 0
        if w < 100 or h < 100:
            continue
        area = abs((bbox[2] - bbox[0]) * (bbox[3] - bbox[1]))
        if area < 8000:
            continue
        results.append({
            "xref": xref,
            "rect": fitz.Rect(bbox),
            "cx": (bbox[0] + bbox[2]) / 2,
            "cy": (bbox[1] + bbox[3]) / 2,
            "area": area,
        })
    results.sort(key=lambda r: -r["area"])
    return results


def save_image(doc, xref, out_path):
    try:
        pix = fitz.Pixmap(doc, xref)
        if pix.n - pix.alpha > 3:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        elif pix.alpha:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        pix.save(out_path, jpg_quality=90)
        return True
    except Exception:
        try:
            base = doc.extract_image(xref)
            # write bytes then convert via Pixmap from memory
            import tempfile
            ext = base["ext"]
            with tempfile.NamedTemporaryFile(suffix="." + ext, delete=False) as tmp:
                tmp.write(base["image"])
                tmp_path = tmp.name
            try:
                img_doc = fitz.open(tmp_path)
                pix = img_doc[0].get_pixmap(alpha=False)
                pix.save(out_path, jpg_quality=90)
                img_doc.close()
                return True
            finally:
                os.unlink(tmp_path)
        except Exception as e:
            print(f"  fail xref {xref}: {e}")
            return False


def clip_save(page, rect, out_path):
    clip = fitz.Rect(rect) & page.rect
    if clip.width < 40 or clip.height < 40:
        return False
    pix = page.get_pixmap(matrix=fitz.Matrix(2.2, 2.2), clip=clip, alpha=False)
    pix.save(out_path, jpg_quality=88)
    return True


for page_num, page_products in sorted(by_page.items()):
    if page_num < 7:
        continue
    page = doc[page_num - 1]
    page_w = page.rect.width
    page_h = page.rect.height
    sku_pos = {s["sku"]: s for s in find_sku_positions(page)}
    images = get_image_rects(page)
    used = set()

    for p in page_products:
        sku = p["sku"]
        out_path = os.path.join(OUT_DIR, f"{sku}.jpg")
        web_path = f"/products/kupa/sku/{sku}.jpg"
        pos = sku_pos.get(sku)

        best = None
        best_score = 1e18

        if pos and images:
            for img in images:
                if img["xref"] in used:
                    continue
                dy = pos["y"] - img["cy"]  # >0 => image above SKU
                dx = abs(pos["x"] - img["cx"])
                if dy < -80:
                    continue
                score = dx * 1.8 + max(0, -dy) * 3 + abs(dy) * 0.15
                score -= min(img["area"] / 20000, 40)
                if score < best_score:
                    best_score = score
                    best = img

        ok = False
        if best is not None:
            ok = save_image(doc, best["xref"], out_path)
            if ok:
                used.add(best["xref"])
                mapped += 1

        if not ok and pos:
            # Column clip above SKU
            if pos["x"] < page_w * 0.36:
                left, right = 15, page_w * 0.50
            elif pos["x"] > page_w * 0.64:
                left, right = page_w * 0.50, page_w - 15
            else:
                left, right = page_w * 0.22, page_w * 0.78
            top = max(30, pos["y"] - 300)
            bottom = max(top + 100, pos["y"] - 8)
            ok = clip_save(page, (left, top, right, bottom), out_path)
            if ok:
                fallback += 1

        if not ok:
            # full content area
            ok = clip_save(page, (20, 40, page_w - 20, page_h - 40), out_path)
            if ok:
                fallback += 1

        if ok:
            p["image"] = web_path

doc.close()

with open(PRODUCTS_JSON, "w", encoding="utf-8") as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print(f"Done. mapped={mapped} fallback={fallback} total={len(products)}")
