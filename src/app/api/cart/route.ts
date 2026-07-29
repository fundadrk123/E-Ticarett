import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getCartItemsPg,
  setCartItemsPg,
  clearCartPg,
} from "@/lib/db/postgresDataService";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Giriş gerekli." },
        { status: 401 }
      );
    }
    const items = await getCartItemsPg(user.userId);
    return NextResponse.json({
      success: true,
      data: items.map((i) => ({
        product: i.product,
        quantity: i.quantity,
      })),
    });
  } catch (error) {
    console.error("Cart GET error:", error);
    return NextResponse.json(
      { success: false, message: "Sepet alınamadı." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Giriş gerekli." },
        { status: 401 }
      );
    }
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];
    const saved = await setCartItemsPg(
      user.userId,
      items.map((i: { productId: string; quantity: number }) => ({
        productId: String(i.productId),
        quantity: Number(i.quantity),
      }))
    );
    return NextResponse.json({
      success: true,
      data: saved.map((i) => ({ product: i.product, quantity: i.quantity })),
    });
  } catch (error) {
    console.error("Cart PUT error:", error);
    return NextResponse.json(
      { success: false, message: "Sepet kaydedilemedi." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Giriş gerekli." },
        { status: 401 }
      );
    }
    await clearCartPg(user.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart DELETE error:", error);
    return NextResponse.json(
      { success: false, message: "Sepet temizlenemedi." },
      { status: 500 }
    );
  }
}
