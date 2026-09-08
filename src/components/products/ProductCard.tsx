import Link from "next/link";
import { Product } from "@/types";
import { formatPrice, productThumb } from "@/lib/utils";
import { ProductCardActions } from "@/components/products/ProductCardActions";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const thumb = productThumb(product.image);

  return (
    <article className="card group flex flex-col overflow-hidden">
      <Link
        href={`/urun/${product.slug}`}
        className="relative aspect-square overflow-hidden bg-slate-50"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt={product.name}
          width={320}
          height={320}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-contain p-2 transition duration-200 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.isNew && (
            <span className="rounded bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              YENİ
            </span>
          )}
          {product.isRestocked && (
            <span className="rounded bg-primary-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              STOK
            </span>
          )}
          {!product.inStock && (
            <span className="rounded bg-slate-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              YAKINDA
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-accent-500">
          {product.brand}
        </p>
        <Link href={`/urun/${product.slug}`}>
          <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug text-slate-800 hover:text-primary-600">
            ({product.sku}) {product.name}
          </h3>
        </Link>

        {product.inStock ? (
          <>
            <p className="mt-auto text-base font-bold text-primary-600">
              {formatPrice(product.priceIncVat)}
              <span className="ml-1 text-[10px] font-medium text-slate-400">
                KDV dahil
              </span>
            </p>
            <ProductCardActions product={product} />
          </>
        ) : (
          <button
            disabled
            className="btn-outline mt-auto w-full cursor-not-allowed opacity-60"
          >
            Yakında Stokta
          </button>
        )}
      </div>
    </article>
  );
}
