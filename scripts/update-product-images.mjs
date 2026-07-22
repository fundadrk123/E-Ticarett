import dotenv from "dotenv";
import pg from "pg";
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

const products = JSON.parse(
  readFileSync(join(__dirname, "kupa-extract/products.json"), "utf8")
);

let updated = 0;
for (const p of products) {
  if (!p.image || !p.sku) continue;
  const result = await pool.query(
    "UPDATE products SET image = $1 WHERE sku = $2",
    [p.image, p.sku]
  );
  updated += result.rowCount || 0;
}

console.log(`Updated images for ${updated} products`);
await pool.end();
