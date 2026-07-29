import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateBrandPg, deleteBrandPg } from "@/lib/db/postgresDataService";
import { revalidateCatalog } from "@/lib/cache";

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    await requireAuth("admin");
    const { id } = await params;
    const body = await request.json();
    const brand = await updateBrandPg(id, body);
    revalidateCatalog();
    return NextResponse.json({ success: true, data: brand });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "Marka bulunamadı." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Marka güncellenemedi." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    await requireAuth("admin");
    const { id } = await params;
    await deleteBrandPg(id);
    revalidateCatalog();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("HAS_PRODUCTS")) {
      return NextResponse.json(
        {
          success: false,
          message: "Bu markaya bağlı ürünler var, silinemez.",
        },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "Marka bulunamadı." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Marka silinemedi." },
      { status: 500 }
    );
  }
}
