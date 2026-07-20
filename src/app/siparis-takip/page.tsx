"use client";

import { useState } from "react";
import { Search, Package } from "lucide-react";
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

const paymentLabels: Record<string, string> = {
  pending: "Ödeme Bekleniyor",
  paid: "Ödendi",
  failed: "Başarısız",
  refunded: "İade Edildi",
};

export default function OrderTrackingPage() {
  const [email, setEmail] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOrder(null);
    setLoading(true);

    try {
      const res = await fetch(
        `/api/orders/track?email=${encodeURIComponent(email)}&orderNumber=${encodeURIComponent(orderNo)}`
      );
      const json = await res.json();
      if (json.success) {
        setOrder(json.data);
      } else {
        setError(json.message || "Sipariş bulunamadı.");
      }
    } catch {
      setError("Sorgulama sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-site py-12 lg:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <Package className="mx-auto h-12 w-12 text-primary-500" />
          <h1 className="mt-4 text-2xl font-bold text-slate-800">
            Sipariş Takibi
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Kayıtlı e-posta adresinizi ve sipariş numaranızı giriniz.
          </p>
        </div>

        <div className="card p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                E-Posta Adresi
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Sipariş Numarası
              </label>
              <input
                type="text"
                required
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                placeholder="MG-20260720-1234"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              <Search className="h-4 w-4" />
              {loading ? "Sorgulanıyor..." : "Sorgula"}
            </button>
          </form>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {order && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Sipariş No</p>
                  <p className="font-semibold">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Tarih</p>
                  <p className="font-semibold">
                    {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Durum</p>
                  <p className="font-semibold text-primary-600">
                    {statusLabels[order.status]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Ödeme</p>
                  <p className="font-semibold">
                    {paymentLabels[order.paymentStatus]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Müşteri</p>
                  <p className="font-semibold">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Toplam</p>
                  <p className="font-bold text-primary-600">
                    {formatPrice(order.totalIncVat)}
                  </p>
                </div>
              </div>

              {order.items && order.items.length > 0 && (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <p className="mb-2 text-sm font-semibold text-slate-700">Ürünler</p>
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between py-1 text-sm text-slate-600"
                    >
                      <span>
                        {item.productName} x{item.quantity}
                      </span>
                      <span>{formatPrice(item.unitPriceIncVat * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
