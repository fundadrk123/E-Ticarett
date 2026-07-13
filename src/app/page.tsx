import { Hero } from "@/components/home/Hero";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ProductSection } from "@/components/home/ProductSection";
import { BrandSection } from "@/components/home/BrandSection";
import { getServerProducts, getServerNewProducts, getServerRestockedProducts } from "@/lib/server-data";

export default function HomePage() {
  const products = getServerProducts();
  const newProducts = getServerNewProducts();
  const restockedProducts = getServerRestockedProducts();

  return (
    <>
      <Hero />
      <CategoryGrid />
      <ProductSection
        title="Yeni Ürünler"
        subtitle="En son eklenen ürünlerimizi keşfedin"
        products={newProducts.length > 0 ? newProducts : products.slice(0, 4)}
        viewAllHref="/urunler?filtre=yeni"
      />
      <BrandSection />
      <div className="bg-slate-100">
        <ProductSection
          title="Öne Çıkan Ürünler"
          subtitle="En çok tercih edilen ürünler"
          products={products.slice(0, 8)}
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
