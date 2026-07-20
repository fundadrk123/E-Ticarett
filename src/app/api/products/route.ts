import { NextRequest, NextResponse } from "next/server";
import {
  getAllCategoriesPg,
  getAllProductsPg,
  searchProductsPg,
  getNewProductsPg,
  getRestockedProductsPg,
  getAllBrandsPg,
} from "@/lib/db/postgresDataService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get("category");
    const brandParam = searchParams.get("brand");
    const searchParam = searchParams.get("search");
    const limitParam = searchParams.get("limit");
    const onlyNew = searchParams.get("new") === "true";
    const onlyRestocked = searchParams.get("restocked") === "true";
    const onlyInStock = searchParams.get("inStock") === "true";

    let filtered = await getAllProductsPg();

    if (categoryParam) {
      const categories = await getAllCategoriesPg();
      const categoryId =
        categories.find((item) => item.slug === categoryParam)?.id ?? categoryParam;
      filtered = filtered.filter((product) => product.categoryId === categoryId);
    }

    if (brandParam) {
      const brands = await getAllBrandsPg();
      const brandName =
        brands.find((item) => item.slug === brandParam)?.name ?? brandParam;
      filtered = filtered.filter(
        (product) => product.brand.toLowerCase() === brandName.toLowerCase()
      );
    }

    if (searchParam) {
      filtered = await searchProductsPg(searchParam);
    }

    if (onlyNew) filtered = await getNewProductsPg();
    if (onlyRestocked) filtered = await getRestockedProductsPg();
    if (onlyInStock) filtered = filtered.filter((product) => product.inStock);

    if (limitParam) {
      const limit = Number(limitParam);
      if (!Number.isNaN(limit) && limit > 0) {
        filtered = filtered.slice(0, limit);
      }
    }

    return NextResponse.json({
      success: true,
      total: filtered.length,
      data: filtered,
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      { success: false, message: "Ürünler alınamadı." },
      { status: 500 }
    );
  }
}
