import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getAllCategoriesPg,
  createCategoryPg,
} from "@/lib/db/postgresDataService";
import { revalidateCatalog } from "@/lib/cache";

export async function GET() {
  try {
    await requireAuth("admin");
    const categories = await getAllCategoriesPg();
    return NextResponse.json({ success: true, data: categories });
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
    const category = await createCategoryPg(body);
    revalidateCatalog();
    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { success: false, message: "Kategori oluşturulamadı." },
      { status: 500 }
    );
  }
}
