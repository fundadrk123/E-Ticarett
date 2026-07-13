import Link from "next/link";
import { brands } from "@/data/brands";

export function BrandSection() {
  return (
    <section className="border-y border-slate-200 bg-white py-12">
      <div className="container-site">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-800">Markalarımız</h2>
          <p className="mt-1 text-slate-500">
            Güvenilir markalarla çalışıyoruz
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/urunler?marka=${brand.slug}`}
              className="card flex h-20 items-center justify-center p-4 hover:border-primary-300"
            >
              <span className="text-center text-sm font-bold text-slate-700 transition hover:text-primary-600">
                {brand.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
