import { NextRequest, NextResponse } from "next/server";
import { validateCouponPg } from "@/lib/db/postgresDataService";

export async function POST(request: NextRequest) {
  try {
    const { code, orderIncVat } = await request.json();
    if (!code) {
      return NextResponse.json(
        { success: false, message: "Kupon kodu gerekli." },
        { status: 400 }
      );
    }
    const result = await validateCouponPg(
      String(code),
      Number(orderIncVat) || 0
    );
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "COUPON_INVALID";
    if (msg.startsWith("COUPON_MIN_ORDER:")) {
      const min = Number(msg.split(":")[1] || 0);
      return NextResponse.json(
        {
          success: false,
          message: `Bu kupon için minimum sipariş tutarı ${min.toLocaleString("tr-TR")} TL (KDV dahil).`,
        },
        { status: 400 }
      );
    }
    const messages: Record<string, string> = {
      COUPON_INVALID: "Geçersiz kupon kodu.",
      COUPON_EXPIRED: "Kuponun süresi dolmuş.",
      COUPON_EXHAUSTED: "Kupon kullanım limiti dolmuş.",
      COUPON_MIN_ORDER: "Sipariş tutarı kupon için yetersiz.",
    };
    // DB hatası (tablo yok vb.)
    if (
      error instanceof Error &&
      (error.message.includes("does not exist") ||
        error.message.includes("relation"))
    ) {
      console.error("Coupon validate DB error:", error);
      return NextResponse.json(
        { success: false, message: "Kupon sistemi hazır değil. Sunucuyu yeniden başlatın." },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, message: messages[msg] || "Kupon geçersiz." },
      { status: 400 }
    );
  }
}
