import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateUserProfilePg } from "@/lib/db/postgresDataService";
import { sanitizeUser } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const updated = await updateUserProfilePg(user.userId, {
      name: body.name,
      phone: body.phone,
    });
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Profil güncellenemedi." },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      data: sanitizeUser({
        ...updated,
        created_at: updated.createdAt,
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "Giriş gerekli." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Profil güncellenemedi." },
      { status: 500 }
    );
  }
}
