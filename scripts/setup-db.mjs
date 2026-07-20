import dotenv from "dotenv";
import pg from "pg";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config({ path: ".env.local" });

const __dirname = dirname(fileURLToPath(import.meta.url));

const pool = new pg.Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: Number(process.env.POSTGRES_PORT || 5432),
});

async function query(text, params) {
  const result = await pool.query(text, params);
  return result.rows;
}

async function main() {
  console.log("PostgreSQL bağlantısı test ediliyor...");
  await query("SELECT 1");
  console.log("✅ Bağlantı başarılı.");

  // Import init via dynamic import of compiled next module won't work easily
  // Run schema via inline SQL (same as postgres.ts)
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
      id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
      icon TEXT NOT NULL, product_count INTEGER NOT NULL DEFAULT 0,
      image TEXT, description TEXT
    );
    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, sku TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE, brand TEXT NOT NULL, category_id TEXT NOT NULL,
      price_ex_vat NUMERIC(12,2) NOT NULL, price_inc_vat NUMERIC(12,2) NOT NULL,
      unit TEXT NOT NULL, pack_size INTEGER, pack_unit TEXT,
      in_stock BOOLEAN NOT NULL DEFAULT true, is_new BOOLEAN NOT NULL DEFAULT false,
      is_restocked BOOLEAN NOT NULL DEFAULT false, image TEXT NOT NULL,
      description TEXT NOT NULL, features TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, order_number TEXT NOT NULL UNIQUE,
      user_id TEXT REFERENCES users(id), email TEXT NOT NULL,
      customer_name TEXT NOT NULL, phone TEXT,
      status TEXT NOT NULL DEFAULT 'pending', payment_status TEXT NOT NULL DEFAULT 'pending',
      payment_method TEXT NOT NULL, total_ex_vat NUMERIC(12,2) NOT NULL,
      total_inc_vat NUMERIC(12,2) NOT NULL, shipping_address JSONB NOT NULL,
      notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL, product_name TEXT NOT NULL, sku TEXT NOT NULL,
      quantity INTEGER NOT NULL, unit_price_ex_vat NUMERIC(12,2) NOT NULL,
      unit_price_inc_vat NUMERIC(12,2) NOT NULL
    );
  `);

  const shopJson = JSON.parse(
    readFileSync(join(__dirname, "../data/shop.json"), "utf8")
  );

  const productCount = await query("SELECT COUNT(*)::int AS count FROM products");
  if (Number(productCount[0].count) === 0) {
    console.log("Katalog verileri yükleniyor...");
    for (const c of shopJson.categories) {
      await query(
        `INSERT INTO categories (id,name,slug,icon,product_count,image,description)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
        [c.id, c.name, c.slug, c.icon, c.productCount, c.image || null, c.description || null]
      );
    }
    for (const b of shopJson.brands) {
      await query(
        `INSERT INTO brands (id,name,slug) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING`,
        [b.id, b.name, b.slug]
      );
    }
    for (const p of shopJson.products) {
      await query(
        `INSERT INTO products (id,sku,name,slug,brand,category_id,price_ex_vat,price_inc_vat,unit,
          pack_size,pack_unit,in_stock,is_new,is_restocked,image,description,features)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) ON CONFLICT (id) DO NOTHING`,
        [
          p.id, p.sku, p.name, p.slug, p.brand, p.categoryId,
          p.priceExVat, p.priceIncVat, p.unit,
          p.packSize ?? null, p.packUnit ?? null, p.inStock,
          p.isNew ?? false, p.isRestocked ?? false,
          p.image, p.description,
          Array.isArray(p.features) ? p.features.join("||") : "",
        ]
      );
    }
  }

  const adminEmail = process.env.ADMIN_EMAIL || "admin@mertemgrup.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
  const existing = await query("SELECT id FROM users WHERE email = $1", [adminEmail]);
  if (existing.length === 0) {
    const hash = await bcrypt.hash(adminPassword, 12);
    await query(
      `INSERT INTO users (id, email, password_hash, name, role) VALUES ($1,$2,$3,$4,'admin')`,
      [randomUUID(), adminEmail, hash, "Site Yöneticisi"]
    );
  }

  console.log("✅ Veritabanı hazır!");
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  await pool.end();
}

main().catch(async (err) => {
  console.error("❌ Hata:", err.message);
  await pool.end();
  process.exit(1);
});
