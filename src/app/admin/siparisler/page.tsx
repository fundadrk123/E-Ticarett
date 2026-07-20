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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setOrders(json.data);
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
                  {order.paymentStatus !== "paid" && (
                    <button
                      onClick={() => markPaid(order.id)}
                      className="btn-primary !py-2 text-xs"
                    >
                      Ödendi İşaretle
                    </button>
                  )}
                </div>
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
