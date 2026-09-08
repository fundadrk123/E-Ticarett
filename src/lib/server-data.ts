import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  getAllCategoriesPg,
  getAllBrandsPg,
  getBrandProductCountsPg,
  getCategoryBySlugPg,
  getCategoryByIdPg,
  getProductBySlugPg,
  getNewProductsPg,
  getRestockedProductsPg,
  searchProductsPg,
  listProductsPg,
  getCategoryMinPricesPg,
  type ProductListFilters,
} from "./db/postgresDataService";

/** Kategori / marka meta — nadiren değişir */
const CATALOG_REVALIDATE = 120;
/** Ürün listesi, stok, fiyat — daha sık yenilenir */
const PRODUCT_REVALIDATE = 30;

type CacheOpts = {
  revalidate: number;
  tags: string[];
};

/** Request içi dedupe (React cache) + istekler arası önbellek (unstable_cache) */
function withPersistentCache<T>(
  key: string[],
  fn: () => Promise<T>,
  opts: CacheOpts
) {
  const cached = unstable_cache(fn, key, opts);
  return cache(async () => cached());
}

export const getServerCategories = withPersistentCache(
  ["catalog-categories"],
  () => getAllCategoriesPg(),
  { revalidate: CATALOG_REVALIDATE, tags: ["categories"] }
);

export const getServerBrands = withPersistentCache(
  ["catalog-brands"],
  () => getAllBrandsPg(),
  { revalidate: CATALOG_REVALIDATE, tags: ["brands"] }
);

export const getServerBrandProductCounts = withPersistentCache(
  ["brand-product-counts"],
  () => getBrandProductCountsPg(),
  { revalidate: CATALOG_REVALIDATE, tags: ["products", "brands"] }
);

export const getServerCategoryBySlug = cache(async (slug: string) =>
  unstable_cache(
    () => getCategoryBySlugPg(slug),
    ["category-slug", slug],
    { revalidate: CATALOG_REVALIDATE, tags: ["categories"] }
  )()
);

export const getServerCategoryById = cache(async (id: string) =>
  unstable_cache(
    () => getCategoryByIdPg(id),
    ["category-id", id],
    { revalidate: CATALOG_REVALIDATE, tags: ["categories"] }
  )()
);

export const getServerProductBySlug = cache(async (slug: string) =>
  unstable_cache(
    () => getProductBySlugPg(slug),
    ["product-slug", slug],
    { revalidate: PRODUCT_REVALIDATE, tags: ["products"] }
  )()
);

export const getServerNewProducts = cache(async (limit = 8) =>
  unstable_cache(
    () => getNewProductsPg(limit),
    ["new-products", String(limit)],
    { revalidate: PRODUCT_REVALIDATE, tags: ["products"] }
  )()
);

export const getServerRestockedProducts = cache(async (limit = 8) =>
  unstable_cache(
    () => getRestockedProductsPg(limit),
    ["restocked-products", String(limit)],
    { revalidate: PRODUCT_REVALIDATE, tags: ["products"] }
  )()
);

export const getServerSearchProducts = cache(async (query: string) => {
  const q = query.trim();
  if (!q) return [];
  return unstable_cache(
    () => searchProductsPg(q),
    ["search-products", q.toLowerCase()],
    { revalidate: PRODUCT_REVALIDATE, tags: ["products"] }
  )();
});

/** Ürün listesi cache anahtarı — parametre değişince farklı önbellek */
export function buildProductListCacheKey(filters: ProductListFilters): string {
  return JSON.stringify({
    categoryId: filters.categoryId || "",
    categorySlug: filters.categorySlug || "",
    brand: filters.brand || "",
    brandSlug: filters.brandSlug || "",
    search: filters.search || "",
    onlyNew: !!filters.onlyNew,
    onlyRestocked: !!filters.onlyRestocked,
    onlyInStock: !!filters.onlyInStock,
    page: filters.page || 1,
    pageSize: filters.pageSize || filters.limit || 24,
    sort: filters.sort || "name-asc",
    skipCount: !!filters.skipCount,
  });
}

/** React cache string key ile dedupe — aynı filtre objesi referansı gerekmez */
export const getServerProductListByKey = cache(async (key: string) => {
  const filters = JSON.parse(key) as ProductListFilters;
  return unstable_cache(
    () => listProductsPg(filters),
    ["product-list", key],
    { revalidate: PRODUCT_REVALIDATE, tags: ["products"] }
  )();
});

export async function getServerProductList(filters: ProductListFilters) {
  const key = buildProductListCacheKey(filters);
  return getServerProductListByKey(key);
}

export const getServerCategoryMinPrices = withPersistentCache(
  ["category-min-prices"],
  () => getCategoryMinPricesPg(),
  { revalidate: PRODUCT_REVALIDATE, tags: ["products", "categories"] }
);
