import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: Number(process.env.POSTGRES_PORT || 5432),
});

export async function query<T = unknown>(text: string, params?: unknown[]) {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function testConnection() {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT NOW() as now");
    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function initPostgresSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT NOT NULL,
      product_count INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      brand TEXT NOT NULL,
      category_id TEXT NOT NULL,
      price_ex_vat NUMERIC(12,2) NOT NULL,
      price_inc_vat NUMERIC(12,2) NOT NULL,
      unit TEXT NOT NULL,
      pack_size INTEGER,
      pack_unit TEXT,
      in_stock BOOLEAN NOT NULL DEFAULT true,
      is_new BOOLEAN NOT NULL DEFAULT false,
      is_restocked BOOLEAN NOT NULL DEFAULT false,
      image TEXT NOT NULL,
      description TEXT NOT NULL,
      features TEXT NOT NULL
    );
  `);
}

export async function seedPostgresData() {
  const categoriesCount = await pool.query("SELECT COUNT(*)::int AS count FROM categories");
  if (Number(categoriesCount.rows[0].count) > 0) {
    return;
  }

  const { categories: staticCategories } = await import("@/data/categories");
  const { brands: staticBrands } = await import("@/data/brands");
  const { products: staticProducts } = await import("@/data/products");

  for (const category of staticCategories) {
    await pool.query(
      `INSERT INTO categories (id, name, slug, icon, product_count, image, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [category.id, category.name, category.slug, category.icon, category.productCount, category.image || null, category.description || null]
    );
  }

  for (const brand of staticBrands) {
    await pool.query(
      `INSERT INTO brands (id, name, slug)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [brand.id, brand.name, brand.slug]
    );
  }

  for (const product of staticProducts) {
    await pool.query(
      `INSERT INTO products (
        id, sku, name, slug, brand, category_id, price_ex_vat, price_inc_vat, unit,
        pack_size, pack_unit, in_stock, is_new, is_restocked, image, description, features
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (id) DO NOTHING`,
      [
        product.id,
        product.sku,
        product.name,
        product.slug,
        product.brand,
        product.categoryId,
        product.priceExVat,
        product.priceIncVat,
        product.unit,
        product.packSize ?? null,
        product.packUnit ?? null,
        product.inStock,
        product.isNew ?? false,
        product.isRestocked ?? false,
        product.image,
        product.description,
        product.features.join("||"),
      ]
    );
  }
}
