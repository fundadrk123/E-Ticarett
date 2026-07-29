import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getAllBrandsPg,
  createBrandPg,
} from "@/lib/db/postgresDataService";
import { revalidateCatalog } from "@/lib/cache";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  try {
    await requireAuth("admin");
    const brands = await getAllBrandsPg();
    return NextResponse.json({ success: true, data: brands });
  } catch {
    return NextResponse.json(
      { success: false, message: "Yetkisiz erişim." },
      { status: 403 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth("admin");
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json(
        { success: false, message: "Marka adı gerekli." },
        { status: 400 }
      );
    }
    const brand = await createBrandPg({
      name: String(body.name).trim(),
      slug: body.slug ? String(body.slug) : slugify(String(body.name)),
    });
    revalidateCatalog();
    return NextResponse.json({ success: true, data: brand });
  } catch (error) {
    console.error("Create brand error:", error);
    return NextResponse.json(
      { success: false, message: "Marka eklenemedi." },
      { status: 500 }
    );
  }
}
