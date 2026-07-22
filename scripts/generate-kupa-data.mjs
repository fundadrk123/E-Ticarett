import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

function getBrand(sku, name) {
  if (sku.startsWith("TYS") || name.toUpperCase().includes("TYSON")) return "TYSON";
  return "Kupa Tools";
}

const raw = JSON.parse(
  readFileSync(join(__dirname, "kupa-extract/products.json"), "utf8")
);

const usedSlugs = new Set();
const products = raw.map((p, idx) => {
  let slug = p.slug;
  if (usedSlugs.has(slug)) slug = `${slug}-${p.sku.toLowerCase()}`;
  usedSlugs.add(slug);

  return {
    id: String(idx + 1),
    sku: p.sku,
    name: p.name,
    slug,
    brand: getBrand(p.sku, p.name),
    categoryId: categoryMap[p.category] || "4",
    priceExVat: p.priceTry ?? p.priceUsd,
    priceIncVat: p.priceTry ?? p.priceUsd,
    unit: "ADET",
    inStock: true,
    isNew: false,
    image: p.image,
    description: p.features?.[0] || p.name,
    features: p.features || [],
  };
});

const categories = KUPA_CATEGORIES.map((c) => ({
  ...c,
  productCount: products.filter((p) => p.categoryId === c.id).length,
  image: "/products/kupa/page-007-main.jpg",
  description: c.name,
}));

// Write shop.json
writeFileSync(
  join(__dirname, "../data/shop.json"),
  JSON.stringify({ categories, brands: KUPA_BRANDS, products }, null, 2),
  "utf8"
);

// Write categories.ts
const categoriesTs = `import { Category } from "@/types";

export const categories: Category[] = ${JSON.stringify(categories, null, 2)};

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getCategoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}
`;
writeFileSync(join(__dirname, "../src/data/categories.ts"), categoriesTs, "utf8");

// Write brands.ts
const brandsTs = `import { Brand } from "@/types";

export const brands: Brand[] = ${JSON.stringify(KUPA_BRANDS, null, 2)};
`;
writeFileSync(join(__dirname, "../src/data/brands.ts"), brandsTs, "utf8");

// Write products.ts (truncated header + products array)
const productsTs = `import { Product } from "@/types";

export const products: Product[] = ${JSON.stringify(products, null, 2)};

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(categoryId: string): Product[] {
  return products.filter((p) => p.categoryId === categoryId);
}
`;
writeFileSync(join(__dirname, "../src/data/products.ts"), productsTs, "utf8");

console.log(`Generated ${products.length} products, ${categories.length} categories`);
