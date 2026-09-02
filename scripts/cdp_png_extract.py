"""CDP screenshot JSON dosyalarindan PNG cikarir."""
import base64
import json
import sys
from pathlib import Path

def extract(in_path: Path, out_path: Path):
    data = json.loads(in_path.read_text(encoding="utf-8"))
    b64 = data.get("result", {}).get("data")
    if not b64:
        raise ValueError(f"No image data in {in_path}")
    out_path.write_bytes(base64.b64decode(b64))
    print(f"Saved {out_path} ({out_path.stat().st_size} bytes)")

if __name__ == "__main__":
    extract(Path(sys.argv[1]), Path(sys.argv[2]))
