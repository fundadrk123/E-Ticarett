/**
 * Audit Faz 3: KDV %20 uygula + is_new / is_restocked örnek bayrakları doldur.
 * Kullanım: node scripts/audit-catalog-fix.mjs
 */
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

try {
  const vat = await pool.query(`
    UPDATE products
    SET price_inc_vat = ROUND((price_ex_vat * 1.2)::numeric, 2)
    WHERE price_inc_vat IS DISTINCT FROM ROUND((price_ex_vat * 1.2)::numeric, 2)
  `);
  console.log(`KDV güncellendi: ${vat.rowCount} ürün`);

  await pool.query(`UPDATE products SET is_new = false, is_restocked = false`);

  const newest = await pool.query(`
    UPDATE products SET is_new = true
    WHERE id IN (
      SELECT id FROM products
      ORDER BY sku DESC
      LIMIT 48
    )
  `);
  console.log(`is_new işaretlendi: ${newest.rowCount} ürün`);

  const restock = await pool.query(`
    UPDATE products SET is_restocked = true
    WHERE id IN (
      SELECT id FROM products
      WHERE in_stock = true AND is_new = false
      ORDER BY sku ASC
      LIMIT 48
    )
  `);
  console.log(`is_restocked işaretlendi: ${restock.rowCount} ürün`);

  await pool.query(`
    UPDATE categories c
    SET product_count = COALESCE((
      SELECT COUNT(*)::int FROM products p WHERE p.category_id = c.id
    ), 0)
  `);
  console.log("Kategori product_count yenilendi");
} finally {
  await pool.end();
}
