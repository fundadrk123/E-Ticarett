import { NextResponse } from "next/server";
import { getAllCategoriesPg } from "@/lib/db/postgresDataService";

export async function GET() {
  try {
    const categories = await getAllCategoriesPg();
    return NextResponse.json(
      { success: true, data: categories },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Categories API error:", error);
    return NextResponse.json(
      { success: false, message: "Kategoriler alınamadı." },
      { status: 500 }
    );
  }
}
