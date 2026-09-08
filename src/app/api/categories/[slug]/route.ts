import { NextRequest, NextResponse } from "next/server";
import {
  getCategoryBySlugPg,
  listProductsPg,
} from "@/lib/db/postgresDataService";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { slug } = await params;
    const category = await getCategoryBySlugPg(slug);
    if (!category) {
      return NextResponse.json(
        { success: false, message: "Kategori bulunamadı." },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const page = pageParam ? Number(pageParam) : 1;
    const limit = limitParam ? Number(limitParam) : undefined;

    const list = await listProductsPg({
      categoryId: category.id,
      page: Number.isNaN(page) ? 1 : page,
      limit: limit !== undefined && Number.isNaN(limit) ? undefined : limit,
    });

    return NextResponse.json({
      success: true,
      data: { category, products: list.items },
      total: list.total,
      page: list.page,
      pageSize: list.pageSize,
      totalPages: list.totalPages,
      pagination: {
        page: list.page,
        limit: list.pageSize,
        total: list.total,
        totalPages: list.totalPages,
      },
    });
  } catch (error) {
    console.error("Category API error:", error);
    return NextResponse.json(
      { success: false, message: "Kategori alınamadı." },
      { status: 500 }
    );
  }
}
