import { NextRequest, NextResponse } from "next/server";
import { createUserPg } from "@/lib/db/postgresDataService";
import { createToken, setAuthCookie, sanitizeUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: "E-posta, şifre ve ad soyad zorunludur." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Şifre en az 6 karakter olmalıdır." },
        { status: 400 }
      );
    }

    const user = await createUserPg({ email, password, name, phone });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Kayıt oluşturulamadı." },
        { status: 500 }
      );
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      data: sanitizeUser({ ...user, created_at: user.createdAt }),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      return NextResponse.json(
        { success: false, message: "Bu e-posta adresi zaten kayıtlı." },
        { status: 409 }
      );
    }
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, message: "Kayıt sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}
