import { NextRequest, NextResponse } from "next/server";
import { listProductsPg } from "@/lib/db/postgresDataService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get("category");
    const brandParam = searchParams.get("brand");
    const searchParam = searchParams.get("search");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const sortParam = searchParams.get("sort");
    const onlyNew = searchParams.get("new") === "true";
    const onlyRestocked = searchParams.get("restocked") === "true";
    const onlyInStock = searchParams.get("inStock") === "true";

    const page = pageParam ? Number(pageParam) : 1;
    const limit = limitParam ? Number(limitParam) : undefined;

    const list = await listProductsPg({
      categorySlug: categoryParam || undefined,
      brandSlug: brandParam || undefined,
      search: searchParam || undefined,
      onlyNew,
      onlyRestocked,
      onlyInStock,
      page: Number.isNaN(page) ? 1 : page,
      limit: limit !== undefined && Number.isNaN(limit) ? undefined : limit,
      sort: sortParam || undefined,
    });

    return NextResponse.json({
      success: true,
      total: list.total,
      page: list.page,
      pageSize: list.pageSize,
      totalPages: list.totalPages,
      data: list.items,
      pagination: {
        page: list.page,
        limit: list.pageSize,
        total: list.total,
        totalPages: list.totalPages,
      },
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      { success: false, message: "Ürünler alınamadı." },
      { status: 500 }
    );
  }
}
