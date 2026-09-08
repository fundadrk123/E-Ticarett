"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CartItem, Product } from "@/types";
import { useAuth } from "@/context/AuthContext";

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalExVat: number;
  totalIncVat: number;
  ready: boolean;
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
    stockQty: product.stockQty,
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

function mergeCarts(local: CartItem[], server: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();
  for (const item of server) {
    map.set(itemKey(item.product), {
      product: toCartProduct(item.product),
      quantity: normalizeQty(item.quantity),
    });
  }
  for (const item of local) {
    const key = itemKey(item.product);
    const existing = map.get(key);
    if (existing) {
      map.set(key, {
        ...existing,
        quantity: Math.max(existing.quantity, normalizeQty(item.quantity)),
      });
    } else {
      map.set(key, {
        product: toCartProduct(item.product),
        quantity: normalizeQty(item.quantity),
      });
    }
  }
  return Array.from(map.values());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const skipNextSync = useRef(false);
  const syncedUserId = useRef<string | null>(null);
  /** Hydration sonrası localStorage'a aynı veriyi tekrar yazmayı atla */
  const skipNextPersist = useRef(true);
  /** Ürün doğrulaması yalnızca ilk hydration'da bir kez çalışsın */
  const didValidateRef = useRef(false);

  useEffect(() => {
    setItems(readStoredCart());
    setReady(true);
  }, []);

  // Silinmiş / stoksuz ürünleri sepetten temizle (eski localStorage ID'leri)
  useEffect(() => {
    if (!ready || didValidateRef.current) return;
    didValidateRef.current = true;
    if (items.length === 0) return;

    const current = items;
    let cancelled = false;
    fetch("/api/products/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: current.map((i) => i.product.id) }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled || !json.success) return;
        const invalid = new Set<string>(
          (json.data?.invalid || []).map(String)
        );
        const validMap = new Map<string, Product>(
          ((json.data?.valid || []) as Product[]).map((p) => [String(p.id), p])
        );

        setItems((prev) =>
          prev
            .filter((i) => !invalid.has(String(i.product.id)))
            .map((i) => {
              const fresh = validMap.get(String(i.product.id));
              if (!fresh) return i;
              const stock = fresh.stockQty ?? 0;
              if (stock <= 0) return null;
              return {
                product: toCartProduct(fresh),
                quantity: Math.min(normalizeQty(i.quantity), stock),
              };
            })
            .filter(Boolean) as CartItem[]
        );
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [ready, items]);

  useEffect(() => {
    if (!ready) return;
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  // Girişli kullanıcı: sunucu sepeti ile birleştir ve kaydet
  useEffect(() => {
    if (!ready || authLoading) return;

    if (!user) {
      syncedUserId.current = null;
      return;
    }

    if (syncedUserId.current === user.id) return;
    syncedUserId.current = user.id;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cart");
        const json = await res.json();
        if (cancelled || !json.success) return;
        const serverItems: CartItem[] = (json.data || []).map(
          (i: CartItem) => ({
            product: toCartProduct(i.product),
            quantity: normalizeQty(i.quantity),
          })
        );
        const local = readStoredCart();
        const merged = mergeCarts(local, serverItems);
        skipNextSync.current = true;
        setItems(merged);
        await fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: merged.map((i) => ({
              productId: i.product.id,
              quantity: i.quantity,
            })),
          }),
        });
      } catch {
        // local sepet ile devam
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, ready, authLoading]);

  // Değişiklikleri sunucuya yansıt
  useEffect(() => {
    if (!ready || !user || authLoading) return;
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }
    if (syncedUserId.current !== user.id) return;

    const t = setTimeout(() => {
      fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
        }),
      }).catch(() => undefined);
    }, 400);

    return () => clearTimeout(t);
  }, [items, user, ready, authLoading]);

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

  const clearCart = useCallback(() => {
    setItems([]);
    if (typeof window !== "undefined") {
      fetch("/api/cart", { method: "DELETE" }).catch(() => undefined);
    }
  }, []);

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
      ready,
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
      ready,
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
