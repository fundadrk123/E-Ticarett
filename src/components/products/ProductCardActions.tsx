"use client";

import { useRef, useState } from "react";
import { ShoppingCart, Minus, Plus, Check } from "lucide-react";
import { Product } from "@/types";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

interface ProductCardActionsProps {
  product: Product;
}

export function ProductCardActions({ product }: ProductCardActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const qtyRef = useRef(1);
  const [justAdded, setJustAdded] = useState<number | null>(null);
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
    setJustAdded(qty);
    window.setTimeout(() => setJustAdded(null), 2000);
  };

  return (
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
  );
}
