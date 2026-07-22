# -*- coding: utf-8 -*-
"""Generate small WebP thumbnails for product list pages."""
import os
from PIL import Image

SRC = r"C:\Users\MaptechOfis1\Desktop\E-Ticaret\public\products\kupa\sku"
OUT = r"C:\Users\MaptechOfis1\Desktop\E-Ticaret\public\products\kupa\thumbs"
SIZE = 320
QUALITY = 68

os.makedirs(OUT, exist_ok=True)
count = 0
total_in = 0
total_out = 0

for name in os.listdir(SRC):
    if not name.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
        continue
    src = os.path.join(SRC, name)
    sku = os.path.splitext(name)[0]
    dst = os.path.join(OUT, f"{sku}.webp")
    try:
        total_in += os.path.getsize(src)
        with Image.open(src) as im:
            im = im.convert("RGB")
            im.thumbnail((SIZE, SIZE), Image.Resampling.LANCZOS)
            im.save(dst, "WEBP", quality=QUALITY, method=4)
        total_out += os.path.getsize(dst)
        count += 1
    except Exception as e:
        print("fail", name, e)

print(f"Created {count} thumbs")
print(f"Before {round(total_in/1e6,1)} MB -> After {round(total_out/1e6,1)} MB")
