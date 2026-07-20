import { NextResponse } from "next/server";
import { getCurrentUser, sanitizeUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: true, data: null });
    }
    return NextResponse.json({
      success: true,
      data: sanitizeUser({ ...user, created_at: user.createdAt }),
    });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json(
      { success: false, message: "Oturum bilgisi alınamadı." },
      { status: 500 }
    );
  }
}
