import dotenv from "dotenv";
import pg from "pg";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config({ path: ".env.local" });

const __dirname = dirname(fileURLToPath(import.meta.url));

const pool = new pg.Pool({
  user: process.env.POSTGRES_USER || "mertem",
  password: process.env.POSTGRES_PASSWORD || "mertem123",
  database: process.env.POSTGRES_DB || "mertem_shop",
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT || 5432),
});

const KUPA_CATEGORIES = [
  { id: "1", name: "Seramik Makinaları ve Ekipmanları", slug: "seramik-makinalari", icon: "🏗️" },
  { id: "2", name: "Boyacı ve Sıvacı Ekipmanları", slug: "boyaci-sivaci", icon: "🎨" },
  { id: "3", name: "Kimyasal Ekipmanları", slug: "kimyasal-ekipmanlari", icon: "🧪" },
  { id: "4", name: "Hırdavat ve El Aletleri", slug: "hirdavat-el-aletleri", icon: "🔧" },
  { id: "5", name: "Teknik Hırdavat", slug: "teknik-hirdavat", icon: "⚙️" },
  { id: "6", name: "Yağmurluk Grubu", slug: "yagmurluk-grubu", icon: "🌧️" },
  { id: "7", name: "Bant Grubu", slug: "bant-grubu", icon: "📦" },
  { id: "8", name: "Kilit Grubu", slug: "kilit-grubu", icon: "🔒" },
  { id: "9", name: "Bağlantı Ekipmanları", slug: "baglanti-ekipmanlari", icon: "🔗" },
  { id: "10", name: "Kaldırma ve İş Güvenliği Ekipmanları", slug: "is-guvenligi-kaldirma", icon: "🦺" },
  { id: "11", name: "Ölçü Aletleri", slug: "olcu-aletleri", icon: "📏" },
  { id: "12", name: "Elektrik ve Kaynak Ekipmanları", slug: "elektrik-kaynak", icon: "⚡" },
  { id: "13", name: "Pürmüz ve Şalümolar", slug: "purmuz-salumolar", icon: "🔥" },
  { id: "14", name: "Kesici El Aletleri", slug: "kesici-el-aletleri", icon: "✂️" },
  { id: "15", name: "Tornavida ve Bits Uç Grubu", slug: "tornavida-bits", icon: "🪛" },
  { id: "16", name: "Matkap Ucu Grubu", slug: "matkap-ucu", icon: "🔩" },
  { id: "17", name: "Panç Grubu", slug: "panc-grubu", icon: "⭕" },
  { id: "18", name: "Kesici ve Aşındırıcılar", slug: "kesici-asindiricilar", icon: "💿" },
  { id: "19", name: "Testere Grubu", slug: "testere-grubu", icon: "🪚" },
  { id: "20", name: "Bahçe Grubu", slug: "bahce-grubu", icon: "🌿" },
];

const KUPA_BRANDS = [
  { id: "1", name: "Kupa Tools", slug: "kupa-tools" },
  { id: "2", name: "TYSON", slug: "tyson" },
];

const categoryMap = Object.fromEntries(KUPA_CATEGORIES.map((c) => [c.name, c.id]));

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[çÇ]/g, "c")
    .replace(/[ğĞ]/g, "g")
    .replace(/[ıİ]/g, "i")
    .replace(/[öÖ]/g, "o")
    .replace(/[şŞ]/g, "s")
    .replace(/[üÜ]/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

function getBrand(sku, name) {
  if (sku.startsWith("TYS") || name.toUpperCase().includes("TYSON")) return "TYSON";
  return "Kupa Tools";
}

function serializeFeatures(features) {
  return (features || []).join("||");
}

async function main() {
  const productsPath = join(__dirname, "kupa-extract/products.json");
  const raw = JSON.parse(readFileSync(productsPath, "utf8"));

  console.log(`Importing ${raw.length} Kupa Tools products...`);

  await pool.query("DELETE FROM order_items");
  await pool.query("DELETE FROM orders");
  await pool.query("DELETE FROM products");
  await pool.query("DELETE FROM brands");
  await pool.query("DELETE FROM categories");

  for (const c of KUPA_CATEGORIES) {
    const count = raw.filter((p) => p.category === c.name).length;
    await pool.query(
      `INSERT INTO categories (id, name, slug, icon, product_count, image, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [c.id, c.name, c.slug, c.icon, count, `/products/kupa/page-007-main.jpg`, c.name]
    );
  }

  for (const b of KUPA_BRANDS) {
    await pool.query(`INSERT INTO brands (id, name, slug) VALUES ($1, $2, $3)`, [
      b.id,
      b.name,
      b.slug,
    ]);
  }

  const usedSlugs = new Set();
  let inserted = 0;

  for (const p of raw) {
    const categoryId = categoryMap[p.category] || "4";
    const brand = getBrand(p.sku, p.name);
    const price = Number(p.priceUsd);
    let slug = p.slug || slugify(`${p.sku}-${p.name}`);
    if (usedSlugs.has(slug)) slug = `${slug}-${p.sku.toLowerCase()}`;
    usedSlugs.add(slug);

    const description =
      p.features?.[0] ||
      `${p.name} - Kupa Tools profesyonel el aletleri katalog ürünü.`;

    await pool.query(
      `INSERT INTO products (
        id, sku, name, slug, brand, category_id, price_ex_vat, price_inc_vat, unit,
        pack_size, pack_unit, in_stock, is_new, is_restocked, image, description, features
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        randomUUID(),
        p.sku,
        p.name,
        slug,
        brand,
        categoryId,
        price,
        price,
        "ADET",
        null,
        null,
        true,
        false,
        false,
        p.image || "/products/kupa/placeholder.jpg",
        description,
        serializeFeatures(p.features),
      ]
    );
    inserted++;
  }

  console.log(`✓ ${inserted} ürün veritabanına aktarıldı.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
