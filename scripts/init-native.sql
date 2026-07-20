-- Mertem Grup E-Ticaret - Yerel PostgreSQL Kurulum SQL
-- pgAdmin veya psql ile postgres kullanıcısı olarak çalıştırın.

CREATE ROLE mertem WITH LOGIN PASSWORD 'mertem123' CREATEDB;

CREATE DATABASE mertem_shop OWNER mertem;

GRANT ALL PRIVILEGES ON DATABASE mertem_shop TO mertem;

-- Sonra proje klasöründe: npm run db:setup
