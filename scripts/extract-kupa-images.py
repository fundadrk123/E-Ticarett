# -*- coding: utf-8 -*-
"""Render PDF catalog pages and extract per-page product images."""
import fitz
import json
import os
import re

PDF_PATH = r"C:\Users\MaptechOfis1\Downloads\Kupa Tools Haziran 2026 (1).pdf"
PRODUCTS_JSON = r"C:\Users\MaptechOfis1\Desktop\E-Ticaret\scripts\kupa-extract\products.json"
PUBLIC_DIR = r"C:\Users\MaptechOfis1\Desktop\E-Ticaret\public\products\kupa"
PAGE_DIR = os.path.join(PUBLIC_DIR, "pages")

os.makedirs(PAGE_DIR, exist_ok=True)

doc = fitz.open(PDF_PATH)

# Render catalog pages (7+) as PNG thumbnails
page_images = {}
for page_num in range(6, doc.page_count):  # 0-indexed, page 7+
    page = doc[page_num]
    pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
    fname = f"page-{page_num + 1:03d}.jpg"
    fpath = os.path.join(PAGE_DIR, fname)
    pix.save(fpath, jpg_quality=85)
    page_images[page_num + 1] = f"/products/kupa/pages/{fname}"

print(f"Rendered {len(page_images)} page images")

# Extract largest product photo per page (skip small icons)
product_images = {}
for page_num in range(6, doc.page_count):
    page = doc[page_num]
    images = page.get_images(full=True)
    best = None
    best_size = 0
    for img_index, img in enumerate(images):
        xref = img[0]
        try:
            base = doc.extract_image(xref)
            w, h = base.get("width", 0), base.get("height", 0)
            area = w * h
            # Skip tiny icons/logos (< 150x150)
            if w < 150 or h < 150:
                continue
            if area > best_size:
                best_size = area
                best = (img_index, base)
        except Exception:
            pass

    if best:
        img_index, base = best
        ext = base["ext"]
        if ext == "jpeg":
            ext = "jpg"
        fname = f"page-{page_num + 1:03d}-main.{ext}"
        fpath = os.path.join(PUBLIC_DIR, fname)
        with open(fpath, "wb") as f:
            f.write(base["image"])
        product_images[page_num + 1] = f"/products/kupa/{fname}"

print(f"Extracted {len(product_images)} main product images")

# Map SKUs to images via page number
if os.path.exists(PRODUCTS_JSON):
    with open(PRODUCTS_JSON, encoding="utf-8") as f:
        products = json.load(f)

    for p in products:
        pg = p["page"]
        p["image"] = product_images.get(pg) or page_images.get(pg, "/products/kupa/placeholder.jpg")

    with open(PRODUCTS_JSON, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    print(f"Updated {len(products)} products with image paths")

doc.close()
