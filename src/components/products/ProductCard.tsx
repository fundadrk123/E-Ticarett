"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { Product } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAdd = () => {
    if (product.inStock) addToCart(product, 1);
  };

  return (
    <article className="card group flex flex-col overflow-hidden">
      <Link
        href={`/urun/${product.slug}`}
        className="relative aspect-square overflow-hidden bg-slate-100"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          loading={priority ? "eager" : "lazy"}
          priority={priority}
          className="object-contain p-2 transition duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.isNew && (
            <span className="rounded-md bg-accent-500 px-2 py-0.5 text-xs font-bold text-white">
              YENİ
            </span>
          )}
          {product.isRestocked && (
            <span className="rounded-md bg-green-500 px-2 py-0.5 text-xs font-bold text-white">
              STOKTA
            </span>
          )}
          {!product.inStock && (
            <span className="rounded-md bg-slate-600 px-2 py-0.5 text-xs font-bold text-white">
              YAKINDA
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-accent-500">
          {product.brand}
        </p>
        <Link href={`/urun/${product.slug}`}>
          <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug text-slate-800 transition hover:text-primary-600">
            ({product.sku}) {product.name}
          </h3>
        </Link>

        {product.inStock ? (
          <>
            <div className="mt-auto">
              <p className="text-lg font-bold text-primary-600">
                {formatPrice(product.priceIncVat)}
              </p>
            </div>
            <button
              onClick={handleAdd}
              className={cn("btn-primary mt-3 w-full !py-2")}
            >
              <ShoppingCart className="h-4 w-4" />
              Sepete Ekle
            </button>
          </>
        ) : (
          <div className="mt-auto">
            <button
              disabled
              className="btn-outline w-full cursor-not-allowed opacity-60"
            >
              Yakında Stokta
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
