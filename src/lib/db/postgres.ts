import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

let pool: Pool | null = null;
let initialized = false;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      user: process.env.POSTGRES_USER,
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DB,
      password: process.env.POSTGRES_PASSWORD,
      port: Number(process.env.POSTGRES_PORT || 5432),
    });
  }
  return pool;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | undefined> {
  const rows = await query<T>(text, params);
  return rows[0];
}

export function parseFeatures(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw.split("||").filter(Boolean);
}

export function serializeFeatures(features: string[]): string {
  return features.join("||");
}

export async function testConnection(): Promise<boolean> {
  try {
    await query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

export async function initPostgresSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

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
      category_id TEXT NOT NULL REFERENCES categories(id),
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
      features TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      user_id TEXT REFERENCES users(id),
      email TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      phone TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_status TEXT NOT NULL DEFAULT 'pending',
      payment_method TEXT NOT NULL,
      total_ex_vat NUMERIC(12,2) NOT NULL,
      total_inc_vat NUMERIC(12,2) NOT NULL,
      shipping_address JSONB NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      sku TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price_ex_vat NUMERIC(12,2) NOT NULL,
      unit_price_inc_vat NUMERIC(12,2) NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
    CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
  `);
}

async function seedCatalogData() {
  const count = await queryOne<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM products"
  );
  if (Number(count?.count || 0) > 0) return;

  const { categories: staticCategories } = await import("@/data/categories");
  const { brands: staticBrands } = await import("@/data/brands");
  const { products: staticProducts } = await import("@/data/products");

  for (const category of staticCategories) {
    await query(
      `INSERT INTO categories (id, name, slug, icon, product_count, image, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
      [
        category.id,
        category.name,
        category.slug,
        category.icon,
        category.productCount,
        category.image || null,
        category.description || null,
      ]
    );
  }

  for (const brand of staticBrands) {
    await query(
      `INSERT INTO brands (id, name, slug) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
      [brand.id, brand.name, brand.slug]
    );
  }

  for (const product of staticProducts) {
    await query(
      `INSERT INTO products (
        id, sku, name, slug, brand, category_id, price_ex_vat, price_inc_vat, unit,
        pack_size, pack_unit, in_stock, is_new, is_restocked, image, description, features
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
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
        serializeFeatures(product.features),
      ]
    );
  }
}

async function seedAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@mertemgrup.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
  const existing = await queryOne<{ id: string }>(
    "SELECT id FROM users WHERE email = $1",
    [adminEmail]
  );
  if (existing) return;

  const hash = await bcrypt.hash(adminPassword, 12);
  await query(
    `INSERT INTO users (id, email, password_hash, name, role)
     VALUES ($1, $2, $3, $4, 'admin')`,
    [randomUUID(), adminEmail, hash, "Site Yöneticisi"]
  );
}

export async function initializeDatabase() {
  if (initialized) return;
  await initPostgresSchema();
  await seedCatalogData();
  await seedAdminUser();
  initialized = true;
}
