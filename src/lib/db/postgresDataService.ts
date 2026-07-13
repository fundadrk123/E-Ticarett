import { query, initPostgresSchema, seedPostgresData } from "./postgres";
import type { Category, Product, Brand } from "@/types";

function parseFeatures(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split("||").filter(Boolean);
}

export async function initializePostgres() {
  await initPostgresSchema();
  await seedPostgresData();
}

export async function getAllCategoriesPg(): Promise<Category[]> {
  const rows = await query<{ id: string; name: string; slug: string; icon: string; product_count: number; image: string | null; description: string | null }>(`
    SELECT id, name, slug, icon, product_count, image, description
    FROM categories
    ORDER BY name ASC
  `);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    productCount: Number(row.product_count),
    image: row.image || undefined,
    description: row.description || undefined,
  }));
}

export async function getAllBrandsPg(): Promise<Brand[]> {
  const rows = await query<{ id: string; name: string; slug: string }>(`
    SELECT id, name, slug
    FROM brands
    ORDER BY name ASC
  `);

  return rows.map((row) => ({ id: row.id, name: row.name, slug: row.slug }));
}

export async function getAllProductsPg(): Promise<Product[]> {
  const rows = await query<{
    id: string;
    sku: string;
    name: string;
    slug: string;
    brand: string;
    category_id: string;
    price_ex_vat: string;
    price_inc_vat: string;
    unit: string;
    pack_size: number | null;
    pack_unit: string | null;
    in_stock: boolean;
    is_new: boolean;
    is_restocked: boolean;
    image: string;
    description: string;
    features: string | null;
  }>(`
    SELECT id, sku, name, slug, brand, category_id, price_ex_vat, price_inc_vat, unit, pack_size, pack_unit,
           in_stock, is_new, is_restocked, image, description, features
    FROM products
    ORDER BY name ASC
  `);

  return rows.map((row) => ({
    id: row.id,
    sku: row.sku,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    categoryId: row.category_id,
    priceExVat: Number(row.price_ex_vat),
    priceIncVat: Number(row.price_inc_vat),
    unit: row.unit,
    packSize: row.pack_size ?? undefined,
    packUnit: row.pack_unit ?? undefined,
    inStock: row.in_stock,
    isNew: row.is_new,
    isRestocked: row.is_restocked,
    image: row.image,
    description: row.description,
    features: parseFeatures(row.features),
  }));
}

export async function getProductBySlugPg(slug: string): Promise<Product | undefined> {
  const rows = await query<{
    id: string;
    sku: string;
    name: string;
    slug: string;
    brand: string;
    category_id: string;
    price_ex_vat: string;
    price_inc_vat: string;
    unit: string;
    pack_size: number | null;
    pack_unit: string | null;
    in_stock: boolean;
    is_new: boolean;
    is_restocked: boolean;
    image: string;
    description: string;
    features: string | null;
  }>(`SELECT id, sku, name, slug, brand, category_id, price_ex_vat, price_inc_vat, unit, pack_size, pack_unit,
          in_stock, is_new, is_restocked, image, description, features
   FROM products WHERE slug = $1`, [slug]);

  const row = rows[0];
  if (!row) return undefined;

  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    categoryId: row.category_id,
    priceExVat: Number(row.price_ex_vat),
    priceIncVat: Number(row.price_inc_vat),
    unit: row.unit,
    packSize: row.pack_size ?? undefined,
    packUnit: row.pack_unit ?? undefined,
    inStock: row.in_stock,
    isNew: row.is_new,
    isRestocked: row.is_restocked,
    image: row.image,
    description: row.description,
    features: parseFeatures(row.features),
  };
}
