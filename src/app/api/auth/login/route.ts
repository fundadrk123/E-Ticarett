import { NextRequest, NextResponse } from "next/server";
import { getUserByEmailPg } from "@/lib/db/postgresDataService";
import {
  createToken,
  setAuthCookie,
  sanitizeUser,
  verifyPassword,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "E-posta ve şifre zorunludur." },
        { status: 400 }
      );
    }

    const user = await getUserByEmailPg(email);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "E-posta veya şifre hatalı." },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: "E-posta veya şifre hatalı." },
        { status: 401 }
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
      data: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Giriş sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}
