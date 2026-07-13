import fs from "fs";
import path from "path";
import type { Category, Product, Brand } from "@/types";
import { categories as staticCategories } from "@/data/categories";
import { brands as staticBrands } from "@/data/brands";
import { products as staticProducts } from "@/data/products";

export interface ShopDatabase {
  categories: Category[];
  brands: Brand[];
  products: Product[];
}

const dbDir = path.join(process.cwd(), "data");
const dbPath = path.join(dbDir, "shop.json");

function ensureDbDir() {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

function createDefaultDatabase(): ShopDatabase {
  return {
    categories: staticCategories,
    brands: staticBrands,
    products: staticProducts,
  };
}

function writeDatabase(data: ShopDatabase) {
  ensureDbDir();
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
}

function readDatabase(): ShopDatabase {
  ensureDbDir();

  if (!fs.existsSync(dbPath)) {
    const initialData = createDefaultDatabase();
    writeDatabase(initialData);
    return initialData;
  }

  try {
    const raw = fs.readFileSync(dbPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<ShopDatabase>;
    return {
      categories: parsed.categories ?? [],
      brands: parsed.brands ?? [],
      products: parsed.products ?? [],
    };
  } catch {
    const initialData = createDefaultDatabase();
    writeDatabase(initialData);
    return initialData;
  }
}

export function initSeed() {
  const db = readDatabase();
  if (db.categories.length === 0 || db.brands.length === 0 || db.products.length === 0) {
    writeDatabase(createDefaultDatabase());
  }
}

export function getDb(): ShopDatabase {
  initSeed();
  return readDatabase();
}

export function seedIfNeeded() {
  initSeed();
}

seedIfNeeded();
