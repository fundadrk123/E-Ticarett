import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOrderByIdPg, updatePaymentStatusPg } from "@/lib/db/postgresDataService";
import { initializeIyzicoCheckout, isIyzicoConfigured } from "@/lib/payment/iyzico";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Ödeme için giriş yapmanız gerekiyor." },
        { status: 401 }
      );
    }

    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Sipariş ID gerekli." },
        { status: 400 }
      );
    }

    if (!isIyzicoConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Kredi kartı ödemesi şu an yapılandırılmamış. Havale veya kapıda ödeme seçebilirsiniz.",
        },
        { status: 503 }
      );
    }

    const order = await getOrderByIdPg(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Sipariş bulunamadı." },
        { status: 404 }
      );
    }

    if (order.userId && order.userId !== user.userId && user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Bu sipariş için yetkiniz yok." },
        { status: 403 }
      );
    }

    if (!order.userId && order.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json(
        { success: false, message: "Bu sipariş için yetkiniz yok." },
        { status: 403 }
      );
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json(
        { success: false, message: "Bu sipariş zaten ödenmiş." },
        { status: 400 }
      );
    }

    const buyerIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const checkout = await initializeIyzicoCheckout(order, buyerIp);
    return NextResponse.json({ success: true, data: checkout });
  } catch (error) {
    console.error("Payment initiate error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Ödeme başlatılamadı.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token gerekli." },
        { status: 400 }
      );
    }

    const { retrieveIyzicoPayment } = await import("@/lib/payment/iyzico");
    const result = await retrieveIyzicoPayment(token);

    if (result.paymentStatus === "SUCCESS" && result.conversationId) {
      const order = await getOrderByIdPg(result.conversationId);
      if (
        order &&
        (order.userId === user.userId ||
          order.email.toLowerCase() === user.email.toLowerCase() ||
          user.role === "admin")
      ) {
        await updatePaymentStatusPg(result.conversationId, "paid");
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Payment callback error:", error);
    return NextResponse.json(
      { success: false, message: "Ödeme doğrulanamadı." },
      { status: 500 }
    );
  }
}
