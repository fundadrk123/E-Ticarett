import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  updateCategoryPg,
  deleteCategoryPg,
} from "@/lib/db/postgresDataService";

interface Props {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    await requireAuth("admin");
    const { id } = await params;
    const body = await request.json();
    const category = await updateCategoryPg(id, body);
    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("Update category error:", error);
    const notFound = error instanceof Error && error.message === "NOT_FOUND";
    return NextResponse.json(
      {
        success: false,
        message: notFound ? "Kategori bulunamadı." : "Kategori güncellenemedi.",
      },
      { status: notFound ? 404 : 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    await requireAuth("admin");
    const { id } = await params;
    await deleteCategoryPg(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete category error:", error);
    const message =
      error instanceof Error ? error.message : "UNKNOWN";
    if (message.startsWith("HAS_PRODUCTS:")) {
      const count = message.split(":")[1];
      return NextResponse.json(
        {
          success: false,
          message: `Bu kategoride ${count} ürün var. Önce ürünleri başka kategoriye taşıyın veya silin.`,
        },
        { status: 400 }
      );
    }
    if (message === "NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "Kategori bulunamadı." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Kategori silinemedi." },
      { status: 500 }
    );
  }
}
