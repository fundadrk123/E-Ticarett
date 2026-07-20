import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getAllUsersPg } from "@/lib/db/postgresDataService";

export async function GET() {
  try {
    await requireAuth("admin");
    const users = await getAllUsersPg();
    return NextResponse.json({ success: true, data: users });
  } catch {
    return NextResponse.json(
      { success: false, message: "Yetkisiz erişim." },
      { status: 403 }
    );
  }
}
