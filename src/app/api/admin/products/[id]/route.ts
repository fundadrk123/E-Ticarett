import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getProductByIdPg,
  updateProductPg,
  deleteProductPg,
} from "@/lib/db/postgresDataService";
import { revalidateCatalog } from "@/lib/cache";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    await requireAuth("admin");
    const { id } = await params;
    const product = await getProductByIdPg(id);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Ürün bulunamadı." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: product });
  } catch {
    return NextResponse.json(
      { success: false, message: "Yetkisiz erişim." },
      { status: 403 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    await requireAuth("admin");
    const { id } = await params;
    const body = await request.json();
    const product = await updateProductPg(id, body);
    revalidateCatalog();
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { success: false, message: "Ürün güncellenemedi." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    await requireAuth("admin");
    const { id } = await params;
    await deleteProductPg(id);
    revalidateCatalog();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { success: false, message: "Ürün silinemedi." },
      { status: 500 }
    );
  }
}
