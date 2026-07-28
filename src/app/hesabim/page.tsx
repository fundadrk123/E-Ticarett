"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, LogOut, MapPin, CreditCard, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/types";

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  confirmed: "Onaylandı",
  processing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "Ödeme bekleniyor",
  paid: "Ödendi",
  failed: "Ödeme başarısız",
  refunded: "İade edildi",
};

const paymentMethodLabels: Record<string, string> = {
  credit_card: "Kredi kartı",
  bank_transfer: "Havale / EFT",
  cash_on_delivery: "Kapıda ödeme",
};

const statusClass: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-primary-50 text-primary-700",
  processing: "bg-blue-50 text-blue-700",
  shipped: "bg-indigo-50 text-indigo-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
};

export default function AccountPage() {
  const { user, loading, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    let cancelled = false;
    setOrdersLoading(true);
    setOrdersError("");

    fetch("/api/orders")
      .then(async (r) => {
        const json = await r.json();
        if (cancelled) return;
        if (!json.success) {
          setOrdersError(json.message || "Siparişler yüklenemedi.");
          setOrders([]);
          return;
        }
        setOrders(json.data || []);
      })
      .catch(() => {
        if (!cancelled) {
          setOrdersError("Siparişler yüklenirken bir hata oluştu.");
          setOrders([]);
        }
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="container-site py-16 text-center text-slate-500">
        Yükleniyor...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-site py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Hesabım</h1>
        <p className="mt-2 text-slate-500">
          Sipariş geçmişinizi görmek için giriş yapın.
        </p>
        <Link href="/giris?redirect=/hesabim" className="btn-primary mt-6 inline-flex">
          Giriş Yap
        </Link>
      </div>
    );
  }

  return (
    <div className="container-site py-8 lg:py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hesabım</h1>
          <p className="mt-1 text-slate-500">Hoş geldiniz, {user.name}</p>
        </div>
        <button
          onClick={() => logout()}
          className="btn-outline flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Çıkış Yap
        </button>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-slate-500">E-Posta</p>
          <p className="mt-1 font-semibold text-slate-800">{user.email}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Telefon</p>
          <p className="mt-1 font-semibold text-slate-800">{user.phone || "-"}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Toplam Sipariş</p>
          <p className="mt-1 font-semibold text-slate-800">
            {ordersLoading ? "…" : orders.length}
          </p>
        </div>
      </div>

      {user.role === "admin" && (
        <div className="card mb-8 border-accent-200 bg-accent-50/40 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent-600" />
            <h2 className="text-lg font-bold text-slate-800">Yönetim Paneli</h2>
          </div>
          <p className="mb-4 text-sm text-slate-600">
            Ürün, kategori, stok, fiyat, görsel ve kullanıcı rolleri buradan
            yönetilir (Hesabım sayfasından değil).
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/admin/urunler" className="btn-primary justify-center">
              Ürün / Stok / Fiyat / Görsel
            </Link>
            <Link href="/admin/kategoriler" className="btn-outline justify-center">
              Kategoriler
            </Link>
            <Link href="/admin/kullanicilar" className="btn-outline justify-center">
              Kullanıcı Rolleri
            </Link>
            <Link href="/admin/siparisler" className="btn-outline justify-center">
              Siparişler
            </Link>
            <Link href="/admin" className="btn-outline justify-center sm:col-span-2 lg:col-span-1">
              Admin Ana Sayfa
            </Link>
          </div>
        </div>
      )}

      <h2 className="mb-4 text-lg font-bold text-slate-800">Sipariş Geçmişi</h2>

      {ordersLoading ? (
        <div className="card p-8 text-center text-slate-500">
          Siparişleriniz yükleniyor...
        </div>
      ) : ordersError ? (
        <div className="card p-8 text-center text-red-600">{ordersError}</div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-600">Henüz siparişiniz bulunmuyor.</p>
          <Link href="/urunler" className="btn-primary mt-4 inline-flex">
            Alışverişe Başla
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const open = expandedId === order.id;
            const itemCount =
              order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

            return (
              <div key={order.id} className="card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedId(open ? null : order.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 p-5 text-left transition hover:bg-slate-50"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {order.orderNumber}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {new Date(order.createdAt).toLocaleString("tr-TR")}
                      {itemCount > 0 ? ` · ${itemCount} ürün` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        statusClass[order.status] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {statusLabels[order.status] || order.status}
                    </span>
                    <p className="font-bold text-primary-600">
                      {formatPrice(order.totalIncVat)}
                    </p>
                    <span className="text-xs text-slate-400">
                      {open ? "Gizle" : "Detay"}
                    </span>
                  </div>
                </button>

                {open && (
                  <div className="space-y-4 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <p className="flex items-center gap-1.5">
                        <CreditCard className="h-4 w-4 text-slate-400" />
                        {paymentMethodLabels[order.paymentMethod] ||
                          order.paymentMethod}
                        {" · "}
                        {paymentStatusLabels[order.paymentStatus] ||
                          order.paymentStatus}
                      </p>
                      {order.shippingAddress && (
                        <p className="flex items-start gap-1.5">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <span>
                            {order.shippingAddress.fullName}
                            {", "}
                            {order.shippingAddress.addressLine}
                            {", "}
                            {order.shippingAddress.district} /{" "}
                            {order.shippingAddress.city}
                          </span>
                        </p>
                      )}
                    </div>

                    {order.items && order.items.length > 0 ? (
                      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                        {order.items.map((item) => (
                          <li
                            key={item.id}
                            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                          >
                            <div>
                              <p className="font-medium text-slate-800">
                                {item.productName}
                              </p>
                              <p className="text-xs text-slate-500">
                                SKU: {item.sku} · {item.quantity} adet ×{" "}
                                {formatPrice(item.unitPriceIncVat)}
                              </p>
                            </div>
                            <p className="font-semibold text-slate-700">
                              {formatPrice(
                                item.unitPriceIncVat * item.quantity
                              )}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Sipariş kalemleri bulunamadı.
                      </p>
                    )}

                    <div className="flex justify-end text-sm">
                      <p className="font-bold text-slate-800">
                        Toplam (KDV dahil): {formatPrice(order.totalIncVat)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
