import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });

const pool = new pg.Pool({
  user: process.env.POSTGRES_USER || "mertem",
  password: process.env.POSTGRES_PASSWORD || "mertem123",
  database: process.env.POSTGRES_DB || "mertem_shop",
  host: process.env.POSTGRES_HOST || "localhost",
});

const result = await pool.query(
  "UPDATE categories SET image = '/products/kupa/page-007-main.jpg'"
);
console.log("Updated categories:", result.rowCount);
await pool.end();
