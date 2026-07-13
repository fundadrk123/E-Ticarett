"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Minus, Plus, Eye } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const handleAdd = () => {
    if (product.inStock) {
      addToCart(product, quantity);
    }
  };

  return (
    <article className="card group flex flex-col overflow-hidden">
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
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
        <Link
          href={`/urun/${product.slug}`}
          className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100"
        >
          <span className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-lg">
            <Eye className="h-4 w-4" />
            İncele
          </span>
        </Link>
      </div>

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
            <div className="mt-auto space-y-0.5">
              <p className="text-xs text-slate-500">
                {formatPrice(product.priceExVat)}{" "}
                <span className="font-medium">+KDV</span>
              </p>
              <p className="text-lg font-bold text-primary-600">
                {formatPrice(product.priceIncVat)}
              </p>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-slate-200">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-9 w-9 items-center justify-center text-slate-500 hover:bg-slate-50"
                  aria-label="Azalt"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-semibold">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex h-9 w-9 items-center justify-center text-slate-500 hover:bg-slate-50"
                  aria-label="Artır"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                onClick={handleAdd}
                className={cn(
                  "btn-primary flex-1 !py-2",
                  !product.inStock && "opacity-50 cursor-not-allowed"
                )}
              >
                <ShoppingCart className="h-4 w-4" />
                Sepete Ekle
              </button>
            </div>
            <p className="mt-1.5 text-center text-xs text-slate-400">
              {product.unit}
              {product.packSize && ` / ${product.packUnit} (${product.packSize} adet)`}
            </p>
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
