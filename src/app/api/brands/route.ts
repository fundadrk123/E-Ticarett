import { NextResponse } from "next/server";
import { getAllBrandsPg } from "@/lib/db/postgresDataService";

export async function GET() {
  try {
    const brands = await getAllBrandsPg();
    return NextResponse.json({ success: true, data: brands });
  } catch (error) {
    console.error("Brands API error:", error);
    return NextResponse.json(
      { success: false, message: "Markalar alınamadı." },
      { status: 500 }
    );
  }
}
