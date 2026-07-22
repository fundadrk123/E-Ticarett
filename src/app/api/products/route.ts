import { NextRequest, NextResponse } from "next/server";
import {
  getAllCategoriesPg,
  getAllBrandsPg,
  listProductsPg,
} from "@/lib/db/postgresDataService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get("category");
    const brandParam = searchParams.get("brand");
    const searchParam = searchParams.get("search");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const onlyNew = searchParams.get("new") === "true";
    const onlyRestocked = searchParams.get("restocked") === "true";
    const onlyInStock = searchParams.get("inStock") === "true";

    let categoryId: string | undefined;
    if (categoryParam) {
      const categories = await getAllCategoriesPg();
      categoryId =
        categories.find((item) => item.slug === categoryParam)?.id ??
        categoryParam;
    }

    let brand: string | undefined;
    if (brandParam) {
      const brands = await getAllBrandsPg();
      brand =
        brands.find((item) => item.slug === brandParam)?.name ?? brandParam;
    }

    const pageSize = limitParam ? Number(limitParam) : 24;
    const page = pageParam ? Number(pageParam) : 1;

    const list = await listProductsPg({
      categoryId,
      brand,
      search: searchParam || undefined,
      onlyNew,
      onlyRestocked,
      onlyInStock,
      page: Number.isNaN(page) ? 1 : page,
      pageSize: Number.isNaN(pageSize) || pageSize <= 0 ? 24 : pageSize,
    });

    return NextResponse.json({
      success: true,
      total: list.total,
      page: list.page,
      pageSize: list.pageSize,
      totalPages: list.totalPages,
      data: list.items,
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      { success: false, message: "Ürünler alınamadı." },
      { status: 500 }
    );
  }
}
