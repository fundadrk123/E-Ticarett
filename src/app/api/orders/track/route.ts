import { NextRequest, NextResponse } from "next/server";
import { trackOrderPg } from "@/lib/db/postgresDataService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const orderNumber = searchParams.get("orderNumber");

    if (!email || !orderNumber) {
      return NextResponse.json(
        { success: false, message: "E-posta ve sipariş numarası gerekli." },
        { status: 400 }
      );
    }

    const order = await trackOrderPg(email, orderNumber);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Sipariş bulunamadı." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Track order error:", error);
    return NextResponse.json(
      { success: false, message: "Sipariş sorgulanamadı." },
      { status: 500 }
    );
  }
}
