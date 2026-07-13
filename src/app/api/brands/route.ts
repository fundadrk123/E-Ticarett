import { NextResponse } from "next/server";
import { brands } from "@/lib/store";

export async function GET() {
  return NextResponse.json({
    success: true,
    total: brands.length,
    data: brands,
  });
}
