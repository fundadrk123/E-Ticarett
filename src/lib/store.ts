/**
 * @deprecated Legacy JSON store facade. Not used by the App Router runtime.
 * Use async helpers from `@/lib/server-data` (PostgreSQL) instead.
 *
 * Kept for backward compatibility with old scripts/docs references only.
 */
import {
  getAllCategories,
  getAllProducts,
  getAllBrands,
  getCategoryBySlugDb,
  getCategoryByIdDb,
  getProductBySlugDb,
  getProductsByCategoryDb,
  getNewProductsDb,
  getRestockedProductsDb,
  searchProductsDb,
} from "./db/dataService";

export const categories = getAllCategories();
export const brands = getAllBrands();
export const products = getAllProducts();

export function getCategoryBySlug(slug: string) {
  return getCategoryBySlugDb(slug);
}

export function getCategoryById(id: string) {
  return getCategoryByIdDb(id);
}

export function getProductBySlug(slug: string) {
  return getProductBySlugDb(slug);
}

export function getProductsByCategory(categoryId: string) {
  return getProductsByCategoryDb(categoryId);
}

export function getNewProducts() {
  return getNewProductsDb();
}

export function getRestockedProducts() {
  return getRestockedProductsDb();
}

export function searchProducts(query: string) {
  return searchProductsDb(query);
}
