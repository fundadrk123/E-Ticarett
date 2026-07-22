import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });

const pool = new pg.Pool({
  user: process.env.POSTGRES_USER || "mertem",
  password: process.env.POSTGRES_PASSWORD || "mertem123",
  database: process.env.POSTGRES_DB || "mertem_shop",
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT || 5432),
});

await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
  CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
  CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
`);

const cats = await pool.query("SELECT id FROM categories");
for (const cat of cats.rows) {
  const prod = await pool.query(
    `SELECT image FROM products WHERE category_id = $1 ORDER BY name ASC LIMIT 1`,
    [cat.id]
  );
  if (prod.rows[0]?.image) {
    const img = prod.rows[0].image;
    const m = img.match(/\/products\/kupa\/sku\/([^/]+)\./);
    const thumb = m ? `/products/kupa/thumbs/${m[1]}.webp` : img;
    await pool.query(`UPDATE categories SET image = $1 WHERE id = $2`, [thumb, cat.id]);
  }
}

console.log("Indexes + category thumbs updated");
await pool.end();
