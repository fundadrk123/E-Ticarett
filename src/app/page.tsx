import { Hero } from "@/components/home/Hero";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ProductSection } from "@/components/home/ProductSection";
import { BrandSection } from "@/components/home/BrandSection";
import {
  getServerProductList,
  getServerNewProducts,
  getServerRestockedProducts,
} from "@/lib/server-data";

export default async function HomePage() {
  const [featured, newProducts, restockedProducts] = await Promise.all([
    getServerProductList({ page: 1, pageSize: 8 }),
    getServerNewProducts(4),
    getServerRestockedProducts(4),
  ]);

  return (
    <>
      <Hero />
      <CategoryGrid />
      <ProductSection
        title="Yeni Ürünler"
        subtitle="En son eklenen ürünlerimizi keşfedin"
        products={
          newProducts.length > 0 ? newProducts : featured.items.slice(0, 4)
        }
        viewAllHref="/urunler?filtre=yeni"
      />
      <BrandSection />
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
