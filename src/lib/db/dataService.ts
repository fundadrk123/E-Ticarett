import { getDb } from "./index";
import type { Category, Product, Brand } from "@/types";

const db = getDb();

function parseFeatures(raw: string | string[] | undefined): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") return raw ? raw.split("||") : [];
  return [];
}

function serializeFeatures(features: string[]): string {
  return features.join("||");
}

export function getAllCategories(): Category[] {
  return db.categories.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export function getCategoryBySlugDb(slug: string): Category | undefined {
  return db.categories.find((category) => category.slug === slug);
}

export function getCategoryByIdDb(id: string): Category | undefined {
  return db.categories.find((category) => category.id === id);
}

export function getAllBrands(): Brand[] {
  return db.brands.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export function getAllProducts(): Product[] {
  return db.products.map((product) => ({
    ...product,
    features: parseFeatures(product.features as unknown as string),
  }));
}

export function getProductBySlugDb(slug: string): Product | undefined {
  const product = db.products.find((item) => item.slug === slug);
  if (!product) return undefined;

  return {
    ...product,
    features: parseFeatures(product.features as unknown as string),
  };
}

export function getProductsByCategoryDb(categoryId: string): Product[] {
  return db.products
    .filter((product) => product.categoryId === categoryId)
    .map((product) => ({
      ...product,
      features: parseFeatures(product.features as unknown as string),
    }));
}

export function getNewProductsDb(): Product[] {
  return getAllProducts().filter((product) => product.isNew);
}

export function getRestockedProductsDb(): Product[] {
  return getAllProducts().filter((product) => product.isRestocked);
}

export function searchProductsDb(query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return getAllProducts();

  return getAllProducts().filter((product) => {
    return (
      product.name.toLowerCase().includes(q) ||
      product.brand.toLowerCase().includes(q) ||
      product.sku.toLowerCase().includes(q)
    );
  });
}

export function seedProductsFromStaticData() {
  const currentDb = getDb();
  if (currentDb.products.length > 0) return;

  const { products: staticProducts } = require("@/data/products");
  const nextDb = {
    categories: currentDb.categories,
    brands: currentDb.brands,
    products: staticProducts.map((product: Product) => ({
      ...product,
      features: serializeFeatures(product.features || []),
    })),
  };

  const fs = require("fs");
  const path = require("path");
  const filePath = path.join(process.cwd(), "data", "shop.json");
  fs.writeFileSync(filePath, JSON.stringify(nextDb, null, 2), "utf8");
}

export function initializeDatabase() {
  seedProductsFromStaticData();
}

initializeDatabase();
