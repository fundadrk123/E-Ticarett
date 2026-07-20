import { NextResponse } from "next/server";
import { getAllCategoriesPg } from "@/lib/db/postgresDataService";

export async function GET() {
  try {
    const categories = await getAllCategoriesPg();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("Categories API error:", error);
    return NextResponse.json(
      { success: false, message: "Kategoriler alınamadı." },
      { status: 500 }
    );
  }
}
