import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  getAllCategoriesPg,
  getAllProductsPg,
  getAllBrandsPg,
  getBrandProductCountsPg,
  getCategoryBySlugPg,
  getCategoryByIdPg,
  getProductBySlugPg,
  getProductsByCategoryPg,
  getNewProductsPg,
  getRestockedProductsPg,
  searchProductsPg,
  listProductsPg,
  getCategoryMinPricesPg,
  type ProductListFilters,
} from "./db/postgresDataService";

const CATALOG_REVALIDATE = 60;
const LIST_REVALIDATE = 30;

export const getServerCategories = cache(async () =>
  unstable_cache(
    async () => getAllCategoriesPg(),
    ["catalog-categories"],
    { revalidate: CATALOG_REVALIDATE, tags: ["categories"] }
  )()
);

export const getServerBrands = cache(async () =>
  unstable_cache(
    async () => getAllBrandsPg(),
    ["catalog-brands"],
    { revalidate: CATALOG_REVALIDATE, tags: ["brands"] }
  )()
);

export const getServerBrandProductCounts = cache(async () =>
  unstable_cache(
    async () => getBrandProductCountsPg(),
    ["brand-product-counts"],
    { revalidate: CATALOG_REVALIDATE, tags: ["products", "brands"] }
  )()
);

/** @deprecated Ağır — storefront'ta kullanma */
export const getServerProducts = cache(async () => getAllProductsPg());

export const getServerCategoryBySlug = cache(async (slug: string) =>
  unstable_cache(
    async () => getCategoryBySlugPg(slug),
    ["category-slug", slug],
    { revalidate: CATALOG_REVALIDATE, tags: ["categories"] }
  )()
);

export const getServerCategoryById = cache(async (id: string) =>
  getCategoryByIdPg(id)
);

export const getServerProductBySlug = cache(async (slug: string) =>
  unstable_cache(
    async () => getProductBySlugPg(slug),
    ["product-slug", slug],
    { revalidate: LIST_REVALIDATE, tags: ["products"] }
  )()
);

export const getServerProductsByCategory = cache(async (categoryId: string) =>
  getProductsByCategoryPg(categoryId)
);

export const getServerNewProducts = cache(async (limit = 8) =>
  unstable_cache(
    async () => getNewProductsPg(limit),
    ["new-products", String(limit)],
    { revalidate: LIST_REVALIDATE, tags: ["products"] }
  )()
);

export const getServerRestockedProducts = cache(async (limit = 8) =>
  unstable_cache(
    async () => getRestockedProductsPg(limit),
    ["restocked-products", String(limit)],
    { revalidate: LIST_REVALIDATE, tags: ["products"] }
  )()
);

export const getServerSearchProducts = cache(async (query: string) =>
  searchProductsPg(query)
);

export const getServerProductList = cache(async (filters: ProductListFilters) => {
  const key = JSON.stringify({
    categoryId: filters.categoryId || "",
    brand: filters.brand || "",
    search: filters.search || "",
    onlyNew: !!filters.onlyNew,
    onlyRestocked: !!filters.onlyRestocked,
    onlyInStock: !!filters.onlyInStock,
    page: filters.page || 1,
    pageSize: filters.pageSize || filters.limit || 24,
    skipCount: !!filters.skipCount,
  });
  return unstable_cache(
    async () => listProductsPg(filters),
    ["product-list", key],
    { revalidate: LIST_REVALIDATE, tags: ["products"] }
  )();
});

export const getServerCategoryMinPrices = cache(async () =>
  unstable_cache(
    async () => getCategoryMinPricesPg(),
    ["category-min-prices"],
    { revalidate: CATALOG_REVALIDATE, tags: ["products", "categories"] }
  )()
);
