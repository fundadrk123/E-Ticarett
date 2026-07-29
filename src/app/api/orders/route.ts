import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  createOrderPg,
  getOrdersByUserPg,
  updateOrderStatusPg,
  clearCartPg,
} from "@/lib/db/postgresDataService";
import { sendOrderConfirmationEmail } from "@/lib/email";
import type { CreateOrderPayload } from "@/types";

function mapOrderError(message: string) {
  if (message.startsWith("INSUFFICIENT_STOCK:")) {
    const parts = message.split(":");
    return `Yetersiz stok: ${parts[1]}${parts[2] != null ? ` (kalan: ${parts[2]})` : ""}`;
  }
  if (message.startsWith("OUT_OF_STOCK:")) {
    return `Stokta yok: ${message.split(":")[1]}`;
  }
  if (message === "COUPON_INVALID") return "Kupon geçersiz.";
  if (message === "COUPON_EXPIRED") return "Kuponun süresi dolmuş.";
  if (message === "COUPON_EXHAUSTED") return "Kupon kullanım limiti dolmuş.";
  if (message === "COUPON_MIN_ORDER") return "Sipariş tutarı kupon için yetersiz.";
  if (message === "EMPTY_CART") return "Sepet boş.";
  return "Sipariş oluşturulamadı.";
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Giriş yapmanız gerekiyor." },
        { status: 401 }
      );
    }
    const orders = await getOrdersByUserPg(user.userId);
    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json(
      { success: false, message: "Siparişler alınamadı." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = (await request.json()) as CreateOrderPayload;

    if (!body.items?.length || !body.email || !body.customerName || !body.shippingAddress) {
      return NextResponse.json(
        { success: false, message: "Eksik sipariş bilgileri." },
        { status: 400 }
      );
    }

    if (!body.phone) {
      return NextResponse.json(
        { success: false, message: "Telefon numarası gerekli." },
        { status: 400 }
      );
    }

    const order = await createOrderPg(body, user?.userId);

    if (body.paymentMethod === "bank_transfer" || body.paymentMethod === "cash_on_delivery") {
      await updateOrderStatusPg(order.id, "confirmed");
    }

    const confirmed = (await import("@/lib/db/postgresDataService")).getOrderByIdPg;
    const finalOrder = (await confirmed(order.id)) || order;

    sendOrderConfirmationEmail(finalOrder).catch((err) =>
      console.error("Order email error:", err)
    );

    if (user) {
      clearCartPg(user.userId).catch(() => undefined);
    }

    return NextResponse.json({ success: true, data: finalOrder });
  } catch (error) {
    console.error("Orders POST error:", error);
    const raw = error instanceof Error ? error.message : "Sipariş oluşturulamadı.";
    return NextResponse.json(
      { success: false, message: mapOrderError(raw) },
      { status: 400 }
    );
  }
}
