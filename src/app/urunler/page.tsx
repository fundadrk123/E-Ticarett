import { ProductCard } from "@/components/products/ProductCard";
import { Pagination } from "@/components/products/Pagination";
import {
  getServerProductList,
  getServerBrands,
} from "@/lib/server-data";

export const revalidate = 30;

const PAGE_SIZE = 16;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    filtre?: string;
    marka?: string;
    sayfa?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const query = params.q || "";
  const filter = params.filtre || "";
  const brandSlug = params.marka || "";
  const page = Math.max(1, Number(params.sayfa) || 1);

  const listFilters = {
    search: query || undefined,
    onlyNew: filter === "yeni",
    onlyRestocked: filter === "stok",
    brandSlug: brandSlug || undefined,
    page,
    pageSize: PAGE_SIZE,
  };

  if (brandSlug) {
    const [brands, list] = await Promise.all([
      getServerBrands(),
      getServerProductList(listFilters),
    ]);
    const brand = brands.find((b) => b.slug === brandSlug);
    return renderProductsPage({
      title: buildTitle(query, filter, brand),
      list,
      query,
      filter,
      brandSlug,
    });
  }

  const list = await getServerProductList(listFilters);

  return renderProductsPage({
    title: buildTitle(query, filter),
    list,
    query,
    filter,
    brandSlug,
  });
}

function buildTitle(
  query: string,
  filter: string,
  brand?: { name: string }
) {
  if (query) return `"${query}" için arama sonuçları`;
  if (filter === "yeni") return "Yeni Ürünler";
  if (filter === "stok") return "Yeniden Stoğa Giren Ürünler";
  if (brand) return brand.name;
  return "Tüm Ürünler";
}

function renderProductsPage({
  title,
  list,
  query,
  filter,
  brandSlug,
}: {
  title: string;
  list: Awaited<ReturnType<typeof getServerProductList>>;
  query: string;
  filter: string;
  brandSlug: string;
}) {
  const from = list.total === 0 ? 0 : (list.page - 1) * list.pageSize + 1;
  const to = Math.min(list.page * list.pageSize, list.total);

  return (
    <div className="container-site py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">{title}</h1>
        <p className="mt-1 text-slate-500">
          {list.total} ürün · {from}–{to} gösteriliyor
        </p>
      </div>

      {list.items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.items.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 4}
              />
            ))}
          </div>
          <Pagination
            page={list.page}
            totalPages={list.totalPages}
            basePath="/urunler"
            searchParams={{
              q: query || undefined,
              filtre: filter || undefined,
              marka: brandSlug || undefined,
            }}
          />
        </>
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
