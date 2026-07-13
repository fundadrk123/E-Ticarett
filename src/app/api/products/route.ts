import { NextRequest, NextResponse } from "next/server";
import { products, searchProducts } from "@/lib/store";
import { categories, brands } from "@/lib/store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryParam = searchParams.get("category");
  const brandParam = searchParams.get("brand");
  const searchParam = searchParams.get("search");
  const limitParam = searchParams.get("limit");
  const onlyNew = searchParams.get("new") === "true";
  const onlyRestocked = searchParams.get("restocked") === "true";
  const onlyInStock = searchParams.get("inStock") === "true";

  let filtered = [...products];

  if (categoryParam) {
    const categoryId = categories.find((item) => item.slug === categoryParam)?.id ?? categoryParam;
    filtered = filtered.filter((product) => product.categoryId === categoryId);
  }

  if (brandParam) {
    const brandName = brands.find((item) => item.slug === brandParam)?.name ?? brandParam;
    filtered = filtered.filter((product) => product.brand.toLowerCase() === brandName.toLowerCase());
  }

  if (searchParam) {
    filtered = searchProducts(searchParam);
  }

  if (onlyNew) {
    filtered = filtered.filter((product) => product.isNew);
  }

  if (onlyRestocked) {
    filtered = filtered.filter((product) => product.isRestocked);
  }

  if (onlyInStock) {
    filtered = filtered.filter((product) => product.inStock);
  }

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
}
