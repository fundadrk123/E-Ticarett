"use client";

import { useState } from "react";
import { ShoppingCart, Minus, Plus, Check } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";

interface ProductActionsProps {
  product: Product;
}

export function ProductActions({ product }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  const handleAdd = () => {
    if (!product.inStock) return;
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
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
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="flex h-11 w-11 items-center justify-center text-slate-500 hover:bg-slate-50"
          aria-label="Azalt"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
        <button
          onClick={() => setQuantity(quantity + 1)}
          className="flex h-11 w-11 items-center justify-center text-slate-500 hover:bg-slate-50"
          aria-label="Artır"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <button onClick={handleAdd} className="btn-primary !px-8 !py-3">
        {added ? (
          <>
            <Check className="h-5 w-5" />
            Sepete Eklendi
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
