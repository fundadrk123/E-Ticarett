"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

const statuses: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  confirmed: "Onaylandı",
  processing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal",
};

const CARGO_COMPANIES = [
  "Yurtiçi Kargo",
  "Aras Kargo",
  "MNG Kargo",
  "PTT Kargo",
  "Sürat Kargo",
  "Diğer",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cargoDraft, setCargoDraft] = useState<
    Record<string, { company: string; tracking: string }>
  >({});

  const load = () => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setOrders(json.data);
          const draft: Record<string, { company: string; tracking: string }> = {};
          for (const o of json.data as Order[]) {
            draft[o.id] = {
              company: o.cargoCompany || "",
              tracking: o.trackingNumber || "",
            };
          }
          setCargoDraft(draft);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: OrderStatus) => {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const markPaid = async (id: string) => {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: "paid", status: "confirmed" }),
    });
    load();
  };

  const saveCargo = async (id: string) => {
    const d = cargoDraft[id] || { company: "", tracking: "" };
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "shipped",
        cargoCompany: d.company || null,
        trackingNumber: d.tracking || null,
      }),
    });
    load();
  };

  const refund = async (id: string) => {
    if (!confirm("Sipariş iade edilsin mi? Stok geri eklenecek.")) return;
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "refund" }),
    });
    load();
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Sipariş Yönetimi</h1>

      {loading ? (
        <p className="text-slate-500">Yükleniyor...</p>
      ) : orders.length === 0 ? (
        <p className="text-slate-500">Henüz sipariş yok.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-slate-800">{order.orderNumber}</p>
                  <p className="text-sm text-slate-500">
                    {order.customerName} — {order.email}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(order.createdAt).toLocaleString("tr-TR")}
                  </p>
                  <p className="mt-1 font-semibold text-primary-600">
                    {formatPrice(order.totalIncVat)}
                    {order.discountAmount > 0
                      ? ` (indirim ${formatPrice(order.discountAmount)})`
                      : ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    Ödeme: {order.paymentStatus}
                    {order.couponCode ? ` · Kupon: ${order.couponCode}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      updateStatus(order.id, e.target.value as OrderStatus)
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {statusLabels[s]}
                      </option>
                    ))}
                  </select>
                  {order.paymentStatus !== "paid" &&
                    order.paymentStatus !== "refunded" && (
                      <button
                        onClick={() => markPaid(order.id)}
                        className="btn-primary !py-2 text-xs"
                      >
                        Ödendi İşaretle
                      </button>
                    )}
                  {order.paymentStatus !== "refunded" && (
                    <button
                      onClick={() => refund(order.id)}
                      className="btn-outline !py-2 text-xs text-red-600"
                    >
                      İade Et
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:grid-cols-3">
                <select
                  value={cargoDraft[order.id]?.company || ""}
                  onChange={(e) =>
                    setCargoDraft((prev) => ({
                      ...prev,
                      [order.id]: {
                        company: e.target.value,
                        tracking: prev[order.id]?.tracking || "",
                      },
                    }))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Kargo firması</option>
                  {CARGO_COMPANIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  value={cargoDraft[order.id]?.tracking || ""}
                  onChange={(e) =>
                    setCargoDraft((prev) => ({
                      ...prev,
                      [order.id]: {
                        company: prev[order.id]?.company || "",
                        tracking: e.target.value,
                      },
                    }))
                  }
                  placeholder="Takip numarası"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => saveCargo(order.id)}
                  className="btn-outline !py-2 text-sm"
                >
                  Kargoya Ver / Kaydet
                </button>
              </div>

              {order.items && (
                <div className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
                  {order.items.map((item) => (
                    <p key={item.id}>
                      {item.productName} x{item.quantity} —{" "}
                      {formatPrice(item.unitPriceIncVat * item.quantity)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
