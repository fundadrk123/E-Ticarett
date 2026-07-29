import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getAllProductsPg,
  createProductPg,
} from "@/lib/db/postgresDataService";
import { revalidateCatalog } from "@/lib/cache";

export async function GET() {
  try {
    await requireAuth("admin");
    const products = await getAllProductsPg();
    return NextResponse.json({ success: true, data: products });
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
    const product = await createProductPg(body);
    revalidateCatalog();
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { success: false, message: "Ürün oluşturulamadı." },
      { status: 500 }
    );
  }
}
