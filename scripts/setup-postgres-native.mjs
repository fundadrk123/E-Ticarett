import dotenv from "dotenv";
import pg from "pg";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config({ path: ".env.local" });

const __dirname = dirname(fileURLToPath(import.meta.url));

const APP_USER = process.env.POSTGRES_USER || "mertem";
const APP_PASSWORD = process.env.POSTGRES_PASSWORD || "mertem123";
const APP_DB = process.env.POSTGRES_DB || "mertem_shop";
const APP_HOST = process.env.POSTGRES_HOST || "localhost";
const APP_PORT = Number(process.env.POSTGRES_PORT || 5432);

const ADMIN_USER = process.env.POSTGRES_ADMIN_USER || "postgres";
const ADMIN_PASSWORD = process.env.POSTGRES_ADMIN_PASSWORD || "";

async function query(pool, text, params) {
  const result = await pool.query(text, params);
  return result.rows;
}

async function createRoleAndDatabase(adminPool) {
  const roleExists = await query(
    adminPool,
    "SELECT 1 FROM pg_roles WHERE rolname = $1",
    [APP_USER]
  );

  if (roleExists.length === 0) {
    console.log(`Kullanıcı oluşturuluyor: ${APP_USER}`);
    await adminPool.query(
      `CREATE ROLE ${APP_USER} WITH LOGIN PASSWORD '${APP_PASSWORD.replace(/'/g, "''")}' CREATEDB`
    );
  } else {
    console.log(`Kullanıcı zaten var: ${APP_USER} (şifre güncelleniyor)`);
    await adminPool.query(
      `ALTER ROLE ${APP_USER} WITH PASSWORD '${APP_PASSWORD.replace(/'/g, "''")}'`
    );
  }

  const dbExists = await query(
    adminPool,
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [APP_DB]
  );

  if (dbExists.length === 0) {
    console.log(`Veritabanı oluşturuluyor: ${APP_DB}`);
    await adminPool.query(`CREATE DATABASE ${APP_DB} OWNER ${APP_USER}`);
  } else {
    console.log(`Veritabanı zaten var: ${APP_DB}`);
  }

  await adminPool.query(`GRANT ALL PRIVILEGES ON DATABASE ${APP_DB} TO ${APP_USER}`);
}

async function setupSchema(appPool) {
  await query(appPool, `
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
  `);

  const productCount = await query(appPool, "SELECT COUNT(*)::int AS count FROM products");
  if (Number(productCount[0].count) > 0) {
    console.log("Katalog verileri zaten mevcut, atlanıyor.");
    return;
  }

  console.log("Katalog verileri yükleniyor...");
  const shopJson = JSON.parse(
    readFileSync(join(__dirname, "../data/shop.json"), "utf8")
  );

  for (const c of shopJson.categories) {
    await query(
      appPool,
      `INSERT INTO categories (id,name,slug,icon,product_count,image,description)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
      [c.id, c.name, c.slug, c.icon, c.productCount, c.image || null, c.description || null]
    );
  }

  for (const b of shopJson.brands) {
    await query(
      appPool,
      `INSERT INTO brands (id,name,slug) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING`,
      [b.id, b.name, b.slug]
    );
  }

  for (const p of shopJson.products) {
    await query(
      appPool,
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

async function seedAdmin(appPool) {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@mertemgrup.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
  const existing = await query(appPool, "SELECT id FROM users WHERE email = $1", [adminEmail]);

  if (existing.length > 0) {
    console.log("Admin kullanıcı zaten mevcut.");
    return;
  }

  const hash = await bcrypt.hash(adminPassword, 12);
  await query(
    appPool,
    `INSERT INTO users (id, email, password_hash, name, role) VALUES ($1,$2,$3,$4,'admin')`,
    [randomUUID(), adminEmail, hash, "Site Yöneticisi"]
  );
  console.log(`Admin oluşturuldu: ${adminEmail}`);
}

async function main() {
  if (!ADMIN_PASSWORD) {
    console.error("❌ POSTGRES_ADMIN_PASSWORD gerekli.");
    console.error("");
    console.error("PostgreSQL kurulumu sırasında belirlediğiniz postgres şifresini .env.local dosyasına ekleyin:");
    console.error("  POSTGRES_ADMIN_PASSWORD=sizin_postgres_sifreniz");
    console.error("");
    console.error("Sonra tekrar çalıştırın: npm run db:setup");
    process.exit(1);
  }

  console.log("Yerel PostgreSQL'e bağlanılıyor...");
  console.log(`  Host: ${APP_HOST}:${APP_PORT}`);
  console.log(`  Admin: ${ADMIN_USER}`);

  const adminPool = new pg.Pool({
    user: ADMIN_USER,
    password: ADMIN_PASSWORD,
    host: APP_HOST,
    port: APP_PORT,
    database: "postgres",
  });

  try {
    await query(adminPool, "SELECT 1");
    console.log("✅ PostgreSQL bağlantısı başarılı.");

    await createRoleAndDatabase(adminPool);
    await adminPool.end();

    const appPool = new pg.Pool({
      user: APP_USER,
      password: APP_PASSWORD,
      host: APP_HOST,
      port: APP_PORT,
      database: APP_DB,
    });

    await setupSchema(appPool);
    await seedAdmin(appPool);
    await appPool.end();

    console.log("");
    console.log("✅ Yerel PostgreSQL veritabanı hazır!");
    console.log(`   Veritabanı: ${APP_DB}`);
    console.log(`   Kullanıcı:  ${APP_USER}`);
    console.log(`   Port:       ${APP_PORT}`);
    console.log("");
    console.log("Admin panel girişi:");
    console.log(`   E-posta: ${process.env.ADMIN_EMAIL || "admin@mertemgrup.com"}`);
    console.log(`   Şifre:   ${process.env.ADMIN_PASSWORD || "Admin123!"}`);
  } catch (err) {
    console.error("❌ Hata:", err.message);
    if (err.message.includes("password authentication failed")) {
      console.error("");
      console.error("postgres kullanıcı şifresi yanlış.");
      console.error(".env.local dosyasında POSTGRES_ADMIN_PASSWORD değerini kontrol edin.");
    }
    process.exit(1);
  }
}

main();
