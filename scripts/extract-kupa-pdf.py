"""Extract text and images from Kupa Tools PDF catalog."""
import fitz
import json
import os
import re

PDF_PATH = r"C:\Users\MaptechOfis1\Downloads\Kupa Tools Haziran 2026 (1).pdf"
OUT_DIR = r"C:\Users\MaptechOfis1\Desktop\E-Ticaret\scripts\kupa-extract"
IMG_DIR = os.path.join(OUT_DIR, "images")

os.makedirs(IMG_DIR, exist_ok=True)

doc = fitz.open(PDF_PATH)
print(f"Pages: {doc.page_count}")

all_text = []
page_data = []

for page_num in range(doc.page_count):
    page = doc[page_num]
    text = page.get_text("text")
    all_text.append(f"=== PAGE {page_num + 1} ===\n{text}")
    
    images = page.get_images(full=True)
    img_info = []
    for img_index, img in enumerate(images):
        xref = img[0]
        try:
            base = doc.extract_image(xref)
            ext = base["ext"]
            img_bytes = base["image"]
            w, h = base.get("width", 0), base.get("height", 0)
            fname = f"page{page_num+1:03d}_img{img_index+1:02d}.{ext}"
            fpath = os.path.join(IMG_DIR, fname)
            with open(fpath, "wb") as f:
                f.write(img_bytes)
            img_info.append({"file": fname, "width": w, "height": h, "size": len(img_bytes)})
        except Exception as e:
            img_info.append({"error": str(e)})
    
    page_data.append({
        "page": page_num + 1,
        "text": text,
        "images": img_info,
    })

# Save full text
with open(os.path.join(OUT_DIR, "full_text.txt"), "w", encoding="utf-8") as f:
    f.write("\n\n".join(all_text))

# Save structured JSON
with open(os.path.join(OUT_DIR, "pages.json"), "w", encoding="utf-8") as f:
    json.dump(page_data, f, ensure_ascii=False, indent=2)

print(f"Extracted to {OUT_DIR}")
print(f"First page preview:\n{page_data[0]['text'][:2000] if page_data else 'empty'}")
