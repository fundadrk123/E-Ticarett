import { ProductCard } from "@/components/products/ProductCard";
import {
  getServerProducts,
  getServerNewProducts,
  getServerRestockedProducts,
  getServerSearchProducts,
  getServerBrands,
} from "@/lib/server-data";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; filtre?: string; marka?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const query = params.q || "";
  const filter = params.filtre || "";
  const brandSlug = params.marka || "";

  const products = await getServerProducts();
  const brands = await getServerBrands();
  let filteredProducts = products;

  if (query) {
    filteredProducts = await getServerSearchProducts(query);
  } else if (filter === "yeni") {
    filteredProducts = await getServerNewProducts();
  } else if (filter === "stok") {
    filteredProducts = await getServerRestockedProducts();
  }

  if (brandSlug) {
    const brand = brands.find((b) => b.slug === brandSlug);
    if (brand) {
      filteredProducts = filteredProducts.filter((p) => p.brand === brand.name);
    }
  }

  const title = query
    ? `"${query}" için arama sonuçları`
    : filter === "yeni"
      ? "Yeni Ürünler"
      : filter === "stok"
        ? "Yeniden Stoğa Giren Ürünler"
        : brandSlug
          ? brands.find((b) => b.slug === brandSlug)?.name || "Ürünler"
          : "Tüm Ürünler";

  return (
    <div className="container-site py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">{title}</h1>
        <p className="mt-1 text-slate-500">
          {filteredProducts.length} ürün listeleniyor
        </p>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-lg font-medium text-slate-600">
            Aradığınız kriterlere uygun ürün bulunamadı.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Farklı bir arama terimi deneyebilir veya kategorilere göz atabilirsiniz.
          </p>
        </div>
      )}
    </div>
  );
}
