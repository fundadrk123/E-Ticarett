import { cache } from "react";
import {
  getAllCategoriesPg,
  getAllProductsPg,
  getAllBrandsPg,
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

export const getServerCategories = cache(async () => getAllCategoriesPg());
export const getServerBrands = cache(async () => getAllBrandsPg());
export const getServerProducts = cache(async () => getAllProductsPg());
export const getServerCategoryBySlug = cache(async (slug: string) =>
  getCategoryBySlugPg(slug)
);
export const getServerCategoryById = cache(async (id: string) =>
  getCategoryByIdPg(id)
);
export const getServerProductBySlug = cache(async (slug: string) =>
  getProductBySlugPg(slug)
);
export const getServerProductsByCategory = cache(async (categoryId: string) =>
  getProductsByCategoryPg(categoryId)
);
export const getServerNewProducts = cache(async (limit = 8) =>
  getNewProductsPg(limit)
);
export const getServerRestockedProducts = cache(async (limit = 8) =>
  getRestockedProductsPg(limit)
);
export const getServerSearchProducts = cache(async (query: string) =>
  searchProductsPg(query)
);
export const getServerProductList = cache(async (filters: ProductListFilters) =>
  listProductsPg(filters)
);
export const getServerCategoryMinPrices = cache(async () =>
  getCategoryMinPricesPg()
);
