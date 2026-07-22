"use client";

import { useRef, useState } from "react";
import { ShoppingCart, Minus, Plus, Check } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";

interface ProductActionsProps {
  product: Product;
}

export function ProductActions({ product }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const qtyRef = useRef(1);
  const [addedQty, setAddedQty] = useState<number | null>(null);
  const { addToCart } = useCart();

  const setQty = (next: number) => {
    const value = Math.max(1, Math.floor(Number(next) || 1));
    qtyRef.current = value;
    setQuantity(value);
  };

  const handleAdd = () => {
    if (!product.inStock) return;
    const qty = Math.max(1, qtyRef.current);
    addToCart(product, qty);
    setAddedQty(qty);
    window.setTimeout(() => setAddedQty(null), 2000);
  };

  if (!product.inStock) {
    return (
      <button disabled className="btn-outline w-full cursor-not-allowed opacity-60">
        Yakında Stokta
      </button>
    );
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-4">
      <div className="flex items-center rounded-lg border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setQty(quantity - 1)}
          className="flex h-11 w-11 items-center justify-center text-slate-500 hover:bg-slate-50"
          aria-label="Azalt"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-14 border-x border-slate-200 px-3 py-2 text-center text-lg font-bold tabular-nums">
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => setQty(quantity + 1)}
          className="flex h-11 w-11 items-center justify-center text-slate-500 hover:bg-slate-50"
          aria-label="Artır"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <button type="button" onClick={handleAdd} className="btn-primary !px-8 !py-3">
        {addedQty != null ? (
          <>
            <Check className="h-5 w-5" />
            {addedQty} adet eklendi
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" />
            Sepete Ekle
          </>
        )}
      </button>
    </div>
  );
}
