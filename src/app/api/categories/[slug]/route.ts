import { NextResponse } from "next/server";
import {
  getCategoryBySlugPg,
  getProductsByCategoryPg,
} from "@/lib/db/postgresDataService";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: Props) {
  try {
    const { slug } = await params;
    const category = await getCategoryBySlugPg(slug);
    if (!category) {
      return NextResponse.json(
        { success: false, message: "Kategori bulunamadı." },
        { status: 404 }
      );
    }
    const products = await getProductsByCategoryPg(category.id);
    return NextResponse.json({
      success: true,
      data: { category, products },
    });
  } catch (error) {
    console.error("Category API error:", error);
    return NextResponse.json(
      { success: false, message: "Kategori alınamadı." },
      { status: 500 }
    );
  }
}
