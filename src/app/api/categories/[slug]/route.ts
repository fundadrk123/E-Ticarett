import { NextResponse } from "next/server";
import { getCategoryById, getCategoryBySlug, getProductsByCategory } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug) ?? getCategoryById(slug);

  if (!category) {
    return NextResponse.json(
      { success: false, error: "Kategori bulunamadı" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      category,
      products: getProductsByCategory(category.id),
    },
  });
}
