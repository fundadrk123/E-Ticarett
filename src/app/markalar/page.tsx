import type { Metadata } from "next";
import Link from "next/link";
import { getServerBrands, getServerProducts } from "@/lib/server-data";

export const metadata: Metadata = {
  title: "Markalar",
};

export default function BrandsPage() {
  const brands = getServerBrands();
  const products = getServerProducts();

  return (
    <div className="container-site py-8 lg:py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">
          Markalarımız
        </h1>
        <p className="mt-2 text-slate-500">
          Güvenilir markalarla çalışarak kaliteyi garanti ediyoruz
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => {
          const count = products.filter((p) => p.brand === brand.name).length;
          return (
            <Link
              key={brand.id}
              href={`/urunler?marka=${brand.slug}`}
              className="card group flex items-center justify-between p-6 hover:border-primary-300"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-800 group-hover:text-primary-600">
                  {brand.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{count} ürün</p>
              </div>
              <span className="text-2xl font-bold text-primary-200 group-hover:text-primary-400">
                {brand.name.charAt(0)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
