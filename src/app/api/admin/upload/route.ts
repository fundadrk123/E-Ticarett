import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { requireAuth } from "@/lib/auth";

type ImageKind = "jpeg" | "png" | "webp" | "gif";

function sniffImage(buffer: Buffer): ImageKind | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return "gif";
  }
  // RIFF....WEBP
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

const EXT: Record<ImageKind, string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  gif: "gif",
};

export async function POST(request: NextRequest) {
  try {
    await requireAuth("admin");
    const form = await request.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Dosya bulunamadı." },
        { status: 400 }
      );
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "Dosya boyutu 8MB'dan büyük olamaz." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const kind = sniffImage(buffer);
    if (!kind) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Dosya içeriği geçersiz. Sadece JPG, PNG, WEBP veya GIF yüklenebilir.",
        },
        { status: 400 }
      );
    }

    const dir = path.join(process.cwd(), "public", "uploads", "products");
    await mkdir(dir, { recursive: true });

    const filename = `${randomUUID()}.${EXT[kind]}`;
    await writeFile(path.join(dir, filename), buffer);

    const url = `/uploads/products/${filename}`;
    return NextResponse.json({ success: true, data: { url } });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: "Yükleme başarısız veya yetkisiz." },
      { status: 403 }
    );
  }
}
