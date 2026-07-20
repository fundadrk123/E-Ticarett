import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getServerCategoryBySlug,
  getServerProductsByCategory,
} from "@/lib/server-data";
import { ProductCard } from "@/components/products/ProductCard";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getServerCategoryBySlug(slug);
  return {
    title: category?.name || "Kategori",
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getServerCategoryBySlug(slug);

  if (!category) notFound();

  const categoryProducts = await getServerProductsByCategory(category.id);

  return (
    <div className="container-site py-8 lg:py-12">
      <div className="mb-8 flex items-center gap-4">
        <span className="text-4xl">{category.icon}</span>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">
            {category.name}
          </h1>
          <p className="mt-1 text-slate-500">
            {categoryProducts.length} ürün listeleniyor
          </p>
        </div>
      </div>

      {categoryProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categoryProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
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
