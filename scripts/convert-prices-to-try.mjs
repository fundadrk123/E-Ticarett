import dotenv from "dotenv";
import pg from "pg";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config({ path: ".env.local" });

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Katalog USD → TL dönüşüm kuru (22 Temmuz 2026) */
const USD_TRY = 47.2;

const productsPath = join(__dirname, "kupa-extract/products.json");
const products = JSON.parse(readFileSync(productsPath, "utf8"));

for (const p of products) {
  const usd = Number(p.priceUsd) || 0;
  p.priceTry = Math.round(usd * USD_TRY * 100) / 100;
}

writeFileSync(productsPath, JSON.stringify(products, null, 2), "utf8");

const pool = new pg.Pool({
  user: process.env.POSTGRES_USER || "mertem",
  password: process.env.POSTGRES_PASSWORD || "mertem123",
  database: process.env.POSTGRES_DB || "mertem_shop",
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT || 5432),
});

let updated = 0;
for (const p of products) {
  const result = await pool.query(
    `UPDATE products
     SET price_ex_vat = $1, price_inc_vat = $1
     WHERE sku = $2`,
    [p.priceTry, p.sku]
  );
  updated += result.rowCount || 0;
}

console.log(`Converted ${updated} products at rate ${USD_TRY} TRY/USD`);
console.log(`Sample: ${products[0].sku} $${products[0].priceUsd} → ₺${products[0].priceTry}`);
await pool.end();
