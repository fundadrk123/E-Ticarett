import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getServerCategoryBySlug,
  getServerProductList,
} from "@/lib/server-data";
import { ProductCard } from "@/components/products/ProductCard";
import { Pagination } from "@/components/products/Pagination";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ sayfa?: string }>;
}

const PAGE_SIZE = 16;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getServerCategoryBySlug(slug);
  return {
    title: category?.name || "Kategori",
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const page = Math.max(1, Number(sp.sayfa) || 1);
  const category = await getServerCategoryBySlug(slug);

  if (!category) notFound();

  const list = await getServerProductList({
    categoryId: category.id,
    page,
    pageSize: PAGE_SIZE,
  });

  const from = list.total === 0 ? 0 : (list.page - 1) * list.pageSize + 1;
  const to = Math.min(list.page * list.pageSize, list.total);

  return (
    <div className="container-site py-8 lg:py-12">
      <div className="mb-8 flex items-center gap-4">
        <span className="text-4xl">{category.icon}</span>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">
            {category.name}
          </h1>
          <p className="mt-1 text-slate-500">
            {list.total} ürün · {from}–{to} gösteriliyor
          </p>
        </div>
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
            basePath={`/kategori/${slug}`}
          />
        </>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-lg font-medium text-slate-600">
            Bu kategoride henüz ürün bulunmuyor.
          </p>
        </div>
      )}
    </div>
  );
}
