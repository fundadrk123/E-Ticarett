import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateOrderStatusPg, getOrderByIdPg } from "@/lib/db/postgresDataService";
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
    const { status, paymentStatus } = body as {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
    };

    const order = await updateOrderStatusPg(id, status || "pending", paymentStatus);
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json(
      { success: false, message: "Sipariş güncellenemedi." },
      { status: 500 }
    );
  }
}
