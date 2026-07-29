import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import {
  getUserByEmailPg,
  createPasswordResetTokenPg,
} from "@/lib/db/postgresDataService";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "E-posta gerekli." },
        { status: 400 }
      );
    }

    // Yanıt her zaman aynı (email enumeration koruması)
    const ok = NextResponse.json({
      success: true,
      message:
        "E-posta kayıtlıysa şifre sıfırlama bağlantısı gönderildi.",
    });

    const user = await getUserByEmailPg(email.trim());
    if (!user) return ok;

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await createPasswordResetTokenPg(user.id, tokenHash, expiresAt);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    await sendPasswordResetEmail(
      user.email,
      `${siteUrl}/sifre-sifirla?token=${token}`
    );

    return ok;
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, message: "İşlem başarısız." },
      { status: 500 }
    );
  }
}
