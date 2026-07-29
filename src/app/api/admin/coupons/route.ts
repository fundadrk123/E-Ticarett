import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getAllCouponsPg,
  createCouponPg,
} from "@/lib/db/postgresDataService";
import type { CouponType } from "@/types";

export async function GET() {
  try {
    await requireAuth("admin");
    const coupons = await getAllCouponsPg();
    return NextResponse.json({ success: true, data: coupons });
  } catch {
    return NextResponse.json(
      { success: false, message: "Yetkisiz erişim." },
      { status: 403 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth("admin");
    const body = await request.json();
    if (!body.code || !body.type || body.value == null) {
      return NextResponse.json(
        { success: false, message: "Kod, tip ve değer gerekli." },
        { status: 400 }
      );
    }
    const coupon = await createCouponPg({
      code: String(body.code),
      type: body.type as CouponType,
      value: Number(body.value),
      minOrderIncVat: Number(body.minOrderIncVat) || 0,
      maxUses: body.maxUses != null ? Number(body.maxUses) : null,
      active: body.active !== false,
      expiresAt: body.expiresAt || null,
    });
    return NextResponse.json({ success: true, data: coupon });
  } catch (error) {
    console.error("Create coupon error:", error);
    return NextResponse.json(
      { success: false, message: "Kupon oluşturulamadı." },
      { status: 500 }
    );
  }
}
