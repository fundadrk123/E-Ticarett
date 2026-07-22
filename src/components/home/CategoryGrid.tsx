import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import {
  getServerCategories,
  getServerCategoryMinPrices,
} from "@/lib/server-data";

export async function CategoryGrid() {
  const [categories, minPrices] = await Promise.all([
    getServerCategories(),
    getServerCategoryMinPrices(),
  ]);

  return (
    <section className="py-12 lg:py-16">
      <div className="container-site">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 lg:text-3xl">
              Kategoriler
            </h2>
            <p className="mt-1 text-slate-500">
              İhtiyacınız olan tüm ürün grupları tek çatı altında
            </p>
          </div>
          <Link
            href="/urunler"
            className="hidden items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 sm:flex"
          >
            Tümünü Gör <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/kategori/${cat.slug}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    cat.image ||
                    "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&h=450&fit=crop"
                  }
                  alt={cat.name}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-contain p-4 transition duration-200 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-lg shadow-sm">
                  {cat.icon}
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800 group-hover:text-primary-600">
                      {cat.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">{cat.description}</p>
                  </div>
                  <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
                    {cat.productCount} ürün
                  </span>
                </div>

                {minPrices[cat.id] != null && (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Başlangıç Fiyatı
                    </p>
                    <p className="mt-1 text-lg font-bold text-primary-600">
                      {formatPrice(minPrices[cat.id])}
                    </p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
