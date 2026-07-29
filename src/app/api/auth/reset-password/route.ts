import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import {
  consumePasswordResetTokenPg,
  updateUserPasswordPg,
} from "@/lib/db/postgresDataService";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();
    if (!token || !password || String(password).length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Geçerli token ve en az 6 karakterlik şifre gerekli.",
        },
        { status: 400 }
      );
    }

    const tokenHash = createHash("sha256").update(String(token)).digest("hex");
    const userId = await consumePasswordResetTokenPg(tokenHash);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Bağlantı geçersiz veya süresi dolmuş." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(String(password));
    await updateUserPasswordPg(userId, passwordHash);

    return NextResponse.json({
      success: true,
      message: "Şifreniz güncellendi. Giriş yapabilirsiniz.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, message: "Şifre sıfırlanamadı." },
      { status: 500 }
    );
  }
}
