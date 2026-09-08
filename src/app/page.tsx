import { Suspense } from "react";
import { Hero } from "@/components/home/Hero";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ProductSection } from "@/components/home/ProductSection";
import { BrandSection } from "@/components/home/BrandSection";
import {
  getServerProductList,
  getServerNewProducts,
  getServerRestockedProducts,
  getServerBrands,
} from "@/lib/server-data";

export const revalidate = 30;

function SectionSkeleton({ title }: { title: string }) {
  return (
    <section className="py-12 lg:py-16">
      <div className="container-site">
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-slate-200" />
        <p className="mb-8 text-sm text-slate-400">{title} yükleniyor…</p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

async function HomeProductSections() {
  const [featured, newProducts, restockedProducts, brands] = await Promise.all([
    getServerProductList({ page: 1, pageSize: 8, skipCount: true }),
    getServerNewProducts(4),
    getServerRestockedProducts(4),
    getServerBrands(),
  ]);

  return (
    <>
      <ProductSection
        title="Yeni Ürünler"
        subtitle="En son eklenen ürünlerimizi keşfedin"
        products={
          newProducts.length > 0 ? newProducts : featured.items.slice(0, 4)
        }
        viewAllHref="/urunler?filtre=yeni"
      />
      <BrandSection brands={brands} />
      <div className="bg-slate-100">
        <ProductSection
          title="Öne Çıkan Ürünler"
          subtitle="En çok tercih edilen ürünler"
          products={featured.items}
          viewAllHref="/urunler"
        />
      </div>
      {restockedProducts.length > 0 && (
        <ProductSection
          title="Yeniden Stoğa Giren Ürünler"
          subtitle="Tekrar stoklarımıza giren ürünler"
          products={restockedProducts}
          viewAllHref="/urunler?filtre=stok"
        />
      )}
    </>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense
        fallback={
          <section className="py-12">
            <div className="container-site grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/3] animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          </section>
        }
      >
        <CategoryGrid />
      </Suspense>
      <Suspense fallback={<SectionSkeleton title="Ürünler" />}>
        <HomeProductSections />
      </Suspense>
    </>
  );
}
