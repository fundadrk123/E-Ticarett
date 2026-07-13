import { cache } from "react";
import { getAllCategories, getAllProducts, getAllBrands, getCategoryBySlugDb, getCategoryByIdDb, getProductBySlugDb, getProductsByCategoryDb, getNewProductsDb, getRestockedProductsDb, searchProductsDb } from "./db/dataService";

export const getServerCategories = cache(() => getAllCategories());
export const getServerBrands = cache(() => getAllBrands());
export const getServerProducts = cache(() => getAllProducts());
export const getServerCategoryBySlug = cache((slug: string) => getCategoryBySlugDb(slug));
export const getServerCategoryById = cache((id: string) => getCategoryByIdDb(id));
export const getServerProductBySlug = cache((slug: string) => getProductBySlugDb(slug));
export const getServerProductsByCategory = cache((categoryId: string) => getProductsByCategoryDb(categoryId));
export const getServerNewProducts = cache(() => getNewProductsDb());
export const getServerRestockedProducts = cache(() => getRestockedProductsDb());
export const getServerSearchProducts = cache((query: string) => searchProductsDb(query));
