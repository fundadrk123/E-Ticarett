"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Minus, Plus, Check } from "lucide-react";
import { Product } from "@/types";
import { formatPrice, productThumb, cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const qtyRef = useRef(1);
  const [justAdded, setJustAdded] = useState<number | null>(null);
  const { addToCart } = useCart();
  const thumb = productThumb(product.image);

  const setQty = (next: number) => {
    const value = Math.max(1, Math.floor(Number(next) || 1));
    qtyRef.current = value;
    setQuantity(value);
  };

  const handleAdd = () => {
    if (!product.inStock) return;
    const qty = Math.max(1, qtyRef.current);
    addToCart(product, qty);
    setJustAdded(qty);
    window.setTimeout(() => setJustAdded(null), 2000);
  };

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
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => setQty(quantity - 1)}
                  className="flex h-9 w-8 items-center justify-center text-slate-600 hover:bg-slate-50"
                  aria-label="Azalt"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-10 border-x border-slate-200 px-2 py-1.5 text-center text-sm font-bold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQty(quantity + 1)}
                  className="flex h-9 w-8 items-center justify-center text-slate-600 hover:bg-slate-50"
                  aria-label="Artır"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={handleAdd}
                className={cn("btn-primary flex-1 !py-2 text-sm")}
              >
                {justAdded != null ? (
                  <>
                    <Check className="h-4 w-4" />
                    {justAdded} adet
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    Sepete
                  </>
                )}
              </button>
            </div>
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
