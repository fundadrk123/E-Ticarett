import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createOrderPg, getOrdersByUserPg } from "@/lib/db/postgresDataService";
import type { CreateOrderPayload } from "@/types";

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
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Sipariş için giriş yapmanız gerekiyor." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as CreateOrderPayload;

    if (!body.items?.length || !body.email || !body.customerName || !body.shippingAddress) {
      return NextResponse.json(
        { success: false, message: "Eksik sipariş bilgileri." },
        { status: 400 }
      );
    }

    const order = await createOrderPg(body, user.userId);

    if (body.paymentMethod === "bank_transfer" || body.paymentMethod === "cash_on_delivery") {
      const { updateOrderStatusPg } = await import("@/lib/db/postgresDataService");
      await updateOrderStatusPg(order.id, "confirmed");
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Orders POST error:", error);
    const message =
      error instanceof Error ? error.message : "Sipariş oluşturulamadı.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
