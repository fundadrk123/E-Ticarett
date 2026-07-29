import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  updateCouponPg,
  deleteCouponPg,
} from "@/lib/db/postgresDataService";

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    await requireAuth("admin");
    const { id } = await params;
    const body = await request.json();
    const coupon = await updateCouponPg(id, body);
    return NextResponse.json({ success: true, data: coupon });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "Kupon bulunamadı." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Kupon güncellenemedi." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    await requireAuth("admin");
    const { id } = await params;
    await deleteCouponPg(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Kupon silinemedi." },
      { status: 500 }
    );
  }
}
