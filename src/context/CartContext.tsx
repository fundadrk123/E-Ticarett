"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CartItem, Product } from "@/types";

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalExVat: number;
  totalIncVat: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "mertem-cart";

function toCartProduct(product: Product): Product {
  return {
    id: String(product.id),
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    categoryId: String(product.categoryId),
    priceExVat: Number(product.priceExVat),
    priceIncVat: Number(product.priceIncVat),
    unit: product.unit || "ADET",
    packSize: product.packSize,
    packUnit: product.packUnit,
    inStock: product.inStock !== false,
    image: product.image,
    description: "",
    features: [],
  };
}

function normalizeQty(quantity: unknown): number {
  const n = Math.floor(Number(quantity));
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function itemKey(product: Pick<Product, "id" | "sku">): string {
  return String(product.id || product.sku);
}

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i) => i?.product && i.quantity)
      .map((i) => ({
        product: toCartProduct(i.product),
        quantity: normalizeQty(i.quantity),
      }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  // 1) Önce localStorage'dan yükle
  useEffect(() => {
    setItems(readStoredCart());
    setReady(true);
  }, []);

  // 2) ready olmadan ASLA localStorage'a yazma (boş sepetle üzerine yazmayı engeller)
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const addToCart = useCallback((product: Product, quantity: unknown = 1) => {
    const qty = normalizeQty(quantity);
    const cartProduct = toCartProduct(product);
    const key = itemKey(cartProduct);

    setItems((prev) => {
      const index = prev.findIndex((i) => itemKey(i.product) === key);
      if (index >= 0) {
        const next = [...prev];
        next[index] = {
          ...next[index],
          quantity: next[index].quantity + qty,
        };
        return next;
      }
      return [...prev, { product: cartProduct, quantity: qty }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    const key = String(productId);
    setItems((prev) => prev.filter((i) => itemKey(i.product) !== key));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const key = String(productId);
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => itemKey(i.product) !== key));
      return;
    }
    const qty = normalizeQty(quantity);
    setItems((prev) =>
      prev.map((i) =>
        itemKey(i.product) === key ? { ...i, quantity: qty } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback(
    (productId: string) =>
      items.some((i) => itemKey(i.product) === String(productId)),
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + normalizeQty(i.quantity), 0),
    [items]
  );

  const totalExVat = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + Number(i.product.priceExVat) * normalizeQty(i.quantity),
        0
      ),
    [items]
  );

  const totalIncVat = useMemo(
    () =>
      items.reduce(
        (sum, i) =>
          sum + Number(i.product.priceIncVat) * normalizeQty(i.quantity),
        0
      ),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      totalExVat,
      totalIncVat,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isInCart,
    }),
    [
      items,
      itemCount,
      totalExVat,
      totalIncVat,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isInCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
