import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateUserRolePg } from "@/lib/db/postgresDataService";

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const admin = await requireAuth("admin");
    const { id } = await params;
    const body = await request.json();
    const role = body.role as "user" | "admin";

    if (role !== "user" && role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Geçersiz rol." },
        { status: 400 }
      );
    }

    if (id === admin.id && role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Kendi admin yetkinizi kaldıramazsınız." },
        { status: 400 }
      );
    }

    const user = await updateUserRolePg(id, role);
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Update user role error:", error);
    const notFound = error instanceof Error && error.message === "NOT_FOUND";
    return NextResponse.json(
      {
        success: false,
        message: notFound ? "Kullanıcı bulunamadı." : "Rol güncellenemedi.",
      },
      { status: notFound ? 404 : 500 }
    );
  }
}
