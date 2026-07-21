import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Check } from "lucide-react";
import { getServerProductBySlug, getServerCategoryById } from "@/lib/server-data";
import { formatPrice } from "@/lib/utils";
import { ProductActions } from "@/components/products/ProductActions";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getServerProductBySlug(slug);

  if (!product) notFound();

  const category = await getServerCategoryById(product.categoryId);

  return (
    <div className="container-site py-8 lg:py-12">
      <nav className="mb-6 flex items-center gap-1 text-sm text-slate-500">
        <Link href="/" className="hover:text-primary-600">
          Ana Sayfa
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/urunler" className="hover:text-primary-600">
          Ürünler
        </Link>
        {category && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link
              href={`/kategori/${category.slug}`}
              className="hover:text-primary-600"
            >
              {category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-800">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-lg bg-slate-800 px-4 py-2 text-lg font-bold text-white">
                Yakında Stokta
              </span>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent-500">
            {product.brand}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-800 lg:text-3xl">
            ({product.sku}) {product.name}
          </h1>

          {product.inStock ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                <span className="font-medium">Liste Fiyatı</span>
              </p>
              <p className="mt-1 text-3xl font-bold text-primary-600">
                {formatPrice(product.priceIncVat)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Birim: {product.unit}
                {product.packSize &&
                  ` | ${product.packUnit} (${product.packSize} adet)`}
              </p>
            </div>
          ) : null}

          <p className="mt-6 leading-relaxed text-slate-600">
            {product.description}
          </p>

          {product.features.length > 0 && (
            <ul className="mt-4 space-y-2">
              {product.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="h-4 w-4 text-green-500" />
                  {f}
                </li>
              ))}
            </ul>
          )}

          {product.inStock && <ProductActions product={product} />}
        </div>
      </div>
    </div>
  );
}
