import { NextResponse } from "next/server";
import { categories } from "@/lib/store";

export async function GET() {
  return NextResponse.json({
    success: true,
    total: categories.length,
    data: categories,
  });
}
