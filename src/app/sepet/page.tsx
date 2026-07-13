"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { items, itemCount, totalExVat, totalIncVat, updateQuantity, removeFromCart, clearCart } =
    useCart();

  if (items.length === 0) {
    return (
      <div className="container-site py-16 text-center">
        <div className="mx-auto max-w-md">
          <ShoppingBag className="mx-auto h-16 w-16 text-slate-300" />
          <h1 className="mt-4 text-2xl font-bold text-slate-800">
            Sepetiniz Boş
          </h1>
          <p className="mt-2 text-slate-500">
            Henüz sepetinize ürün eklemediniz. Ürünlerimize göz atarak alışverişe
            başlayabilirsiniz.
          </p>
          <Link href="/urunler" className="btn-primary mt-6 inline-flex">
            Alışverişe Başla
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-site py-8 lg:py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">
            Alışveriş Sepetim
          </h1>
          <p className="mt-1 text-slate-500">{itemCount} ürün</p>
        </div>
        <button
          onClick={clearCart}
          className="text-sm font-medium text-red-500 hover:text-red-600"
        >
          Sepeti Boşalt
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ product, quantity }) => (
            <div
              key={product.id}
              className="card flex gap-4 p-4 sm:gap-6"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-28 sm:w-28">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-accent-500">
                      {product.brand}
                    </p>
                    <Link
                      href={`/urun/${product.slug}`}
                      className="text-sm font-semibold text-slate-800 hover:text-primary-600 sm:text-base"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Stok Kodu: {product.sku}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    aria-label="Kaldır"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-auto flex items-end justify-between">
                  <div className="flex items-center rounded-lg border border-slate-200">
                    <button
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-lg font-bold text-primary-600">
                    {formatPrice(product.priceIncVat * quantity)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">Sipariş Özeti</h2>
          <div className="mt-4 space-y-3 border-b border-slate-100 pb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Ara Toplam (+KDV)</span>
              <span className="font-medium">{formatPrice(totalExVat)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">KDV</span>
              <span className="font-medium">
                {formatPrice(totalIncVat - totalExVat)}
              </span>
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <span className="text-lg font-bold text-slate-800">Toplam</span>
            <span className="text-xl font-bold text-primary-600">
              {formatPrice(totalIncVat)}
            </span>
          </div>
          <Link href="/giris" className="btn-accent mt-6 w-full">
            Siparişi Tamamla
          </Link>
          <Link
            href="/urunler"
            className="mt-3 flex items-center justify-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Alışverişe Devam Et
          </Link>
        </div>
      </div>
    </div>
  );
}
