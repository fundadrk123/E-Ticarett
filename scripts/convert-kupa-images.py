# -*- coding: utf-8 -*-
"""Convert Kupa product images to web-compatible JPG."""
import json
import os
import fitz

PRODUCTS_JSON = r"C:\Users\MaptechOfis1\Desktop\E-Ticaret\scripts\kupa-extract\products.json"
PUBLIC_DIR = r"C:\Users\MaptechOfis1\Desktop\E-Ticaret\public\products\kupa"

with open(PRODUCTS_JSON, encoding="utf-8") as f:
    products = json.load(f)

converted = 0
for root, _, files in os.walk(PUBLIC_DIR):
    for fname in files:
        if not fname.lower().endswith((".jpx", ".jp2", ".jxr")):
            continue
        src = os.path.join(root, fname)
        dst = os.path.splitext(src)[0] + ".jpg"
        try:
            doc = fitz.open(src)
            page = doc[0]
            pix = page.get_pixmap(matrix=fitz.Matrix(1, 1), alpha=False)
            pix.save(dst, jpg_quality=90)
            doc.close()
            os.remove(src)
            converted += 1
        except Exception as e:
            print(f"Failed {fname}: {e}")

# Update product JSON paths
for p in products:
    img = p.get("image", "")
    if img.endswith((".jpx", ".jp2", ".jxr")):
        p["image"] = img.rsplit(".", 1)[0] + ".jpg"

with open(PRODUCTS_JSON, "w", encoding="utf-8") as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print(f"Converted {converted} images, updated {len(products)} product paths")
