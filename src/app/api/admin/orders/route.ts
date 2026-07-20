import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getAllOrdersPg } from "@/lib/db/postgresDataService";

export async function GET() {
  try {
    await requireAuth("admin");
    const orders = await getAllOrdersPg();
    return NextResponse.json({ success: true, data: orders });
  } catch {
    return NextResponse.json(
      { success: false, message: "Yetkisiz erişim." },
      { status: 403 }
    );
  }
}
