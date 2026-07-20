import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getAdminStatsPg } from "@/lib/db/postgresDataService";

export async function GET() {
  try {
    await requireAuth("admin");
    const stats = await getAdminStatsPg();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    const status =
      error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 403;
    return NextResponse.json(
      { success: false, message: "Yetkisiz erişim." },
      { status }
    );
  }
}
