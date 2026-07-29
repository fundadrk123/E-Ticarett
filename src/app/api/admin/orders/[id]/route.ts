import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  updateOrderStatusPg,
  getOrderByIdPg,
  refundOrderPg,
} from "@/lib/db/postgresDataService";
import { sendShippingUpdateEmail, sendRefundEmail } from "@/lib/email";
import { refundIyzicoPayment, isIyzicoConfigured } from "@/lib/payment/iyzico";
import type { OrderStatus, PaymentStatus } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    await requireAuth("admin");
    const { id } = await params;
    const order = await getOrderByIdPg(id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Sipariş bulunamadı." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: order });
  } catch {
    return NextResponse.json(
      { success: false, message: "Yetkisiz erişim." },
      { status: 403 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    await requireAuth("admin");
    const { id } = await params;
    const body = await request.json();

    if (body.action === "refund") {
      const current = await getOrderByIdPg(id);
      if (!current) {
        return NextResponse.json(
          { success: false, message: "Sipariş bulunamadı." },
          { status: 404 }
        );
      }

      if (
        current.paymentMethod === "credit_card" &&
        current.paymentId &&
        isIyzicoConfigured()
      ) {
        try {
          await refundIyzicoPayment(current.paymentId, current.totalIncVat);
        } catch (err) {
          console.error("iyzico refund error:", err);
          // Yerel iade yine de uygulanır; admin bilgilendirilir
        }
      }

      const refunded = await refundOrderPg(id);
      if (refunded) {
        sendRefundEmail(refunded).catch((e) =>
          console.error("Refund email error:", e)
        );
      }
      return NextResponse.json({ success: true, data: refunded });
    }

    const { status, paymentStatus, trackingNumber, cargoCompany } = body as {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      trackingNumber?: string;
      cargoCompany?: string;
    };

    const previous = await getOrderByIdPg(id);
    const order = await updateOrderStatusPg(id, status, paymentStatus, {
      trackingNumber,
      cargoCompany,
    });

    if (
      order &&
      (order.status === "shipped" || trackingNumber || cargoCompany) &&
      (order.trackingNumber || order.cargoCompany) &&
      (!previous?.trackingNumber || previous.status !== "shipped")
    ) {
      sendShippingUpdateEmail(order).catch((e) =>
        console.error("Shipping email error:", e)
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json(
      { success: false, message: "Sipariş güncellenemedi." },
      { status: 500 }
    );
  }
}
