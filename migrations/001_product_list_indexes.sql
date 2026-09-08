-- Ürün listeleme filtreleri için ek indexler (manuel uygulama).
-- Çalıştırma: psql -U <user> -d <db> -f migrations/001_product_list_indexes.sql
--
-- Mevcut indexler (initPostgresSchema): slug UNIQUE, category_id, brand, sku, name,
-- partial indexes on is_new, is_restocked, stock_qty > 0

-- Kategori + marka birlikte filtre
CREATE INDEX IF NOT EXISTS idx_products_category_brand
  ON products (category_id, brand);

-- Case-insensitive marka eşleşmesi (LOWER(brand) = LOWER($n))
CREATE INDEX IF NOT EXISTS idx_products_brand_lower
  ON products (LOWER(brand));

-- Kategori + yeni ürün / stok filtreleri
CREATE INDEX IF NOT EXISTS idx_products_category_is_new
  ON products (category_id)
  WHERE is_new = true;

CREATE INDEX IF NOT EXISTS idx_products_category_restocked
  ON products (category_id)
  WHERE is_restocked = true;

-- Not: ILIKE '%term%' araması büyük kataloglarda pg_trgm gerektirebilir.
-- Mevcut ürün hacmi için LIKE + mevcut name/sku indexleri yeterlidir.
