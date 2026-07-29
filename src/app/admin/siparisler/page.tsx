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
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [cargoDraft, setCargoDraft] = useState<
    Record<string, { company: string; tracking: string }>
  >({});

  const showMsg = (type: "ok" | "err", text: string) => {
    setMessage({ type, text });
    window.setTimeout(() => setMessage(null), 4000);
  };

  const load = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const json = await res.json();
      if (!json.success) {
        showMsg("err", json.message || "Siparişler yüklenemedi.");
        setLoading(false);
        return;
      }
      setOrders(json.data || []);
      const draft: Record<string, { company: string; tracking: string }> = {};
      for (const o of (json.data || []) as Order[]) {
        draft[o.id] = {
          company: o.cargoCompany || "",
          tracking: o.trackingNumber || "",
        };
      }
      setCargoDraft(draft);
    } catch {
      showMsg("err", "Siparişler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: OrderStatus) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!json.success) {
        showMsg("err", json.message || "Durum güncellenemedi.");
        return;
      }
      showMsg("ok", `Durum: ${statusLabels[status] || status}`);
      await load();
    } catch {
      showMsg("err", "Durum güncellenemedi.");
    } finally {
      setSavingId(null);
    }
  };

  const markPaid = async (id: string) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "paid", status: "confirmed" }),
      });
      const json = await res.json();
      if (!json.success) {
        showMsg("err", json.message || "Ödeme işaretlenemedi.");
        return;
      }
      showMsg("ok", "Sipariş ödendi olarak işaretlendi.");
      await load();
    } catch {
      showMsg("err", "Ödeme işaretlenemedi.");
    } finally {
      setSavingId(null);
    }
  };

  const saveCargo = async (id: string) => {
    const d = cargoDraft[id] || { company: "", tracking: "" };
    if (!d.company.trim()) {
      showMsg("err", "Lütfen kargo firması seçin.");
      return;
    }
    if (!d.tracking.trim()) {
      showMsg("err", "Lütfen takip numarası girin.");
      return;
    }

    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "shipped",
          cargoCompany: d.company.trim(),
          trackingNumber: d.tracking.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showMsg("err", json.message || "Kargo bilgisi kaydedilemedi.");
        return;
      }
      showMsg(
        "ok",
        `Kargoya verildi: ${d.company} · Takip: ${d.tracking}`
      );
      await load();
    } catch {
      showMsg("err", "Kargo bilgisi kaydedilemedi.");
    } finally {
      setSavingId(null);
    }
  };

  const refund = async (id: string) => {
    if (!confirm("Sipariş iade edilsin mi? Stok geri eklenecek.")) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refund" }),
      });
      const json = await res.json();
      if (!json.success) {
        showMsg("err", json.message || "İade yapılamadı.");
        return;
      }
      showMsg("ok", "İade işlemi tamamlandı.");
      await load();
    } catch {
      showMsg("err", "İade yapılamadı.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Sipariş Yönetimi</h1>

      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
            message.type === "ok"
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

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
                    {(order.discountAmount ?? 0) > 0
                      ? ` (indirim ${formatPrice(order.discountAmount)})`
                      : ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    Ödeme: {order.paymentStatus}
                    {order.couponCode ? ` · Kupon: ${order.couponCode}` : ""}
                  </p>
                  {(order.cargoCompany || order.trackingNumber) && (
                    <p className="mt-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-800">
                      Kargo: {order.cargoCompany || "—"}
                      {order.trackingNumber
                        ? ` · Takip no: ${order.trackingNumber}`
                        : ""}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={order.status}
                    disabled={savingId === order.id}
                    onChange={(e) =>
                      updateStatus(order.id, e.target.value as OrderStatus)
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
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
                        type="button"
                        disabled={savingId === order.id}
                        onClick={() => markPaid(order.id)}
                        className="btn-primary !py-2 text-xs disabled:opacity-50"
                      >
                        Ödendi İşaretle
                      </button>
                    )}
                  {order.paymentStatus !== "refunded" && (
                    <button
                      type="button"
                      disabled={savingId === order.id}
                      onClick={() => refund(order.id)}
                      className="btn-outline !py-2 text-xs text-red-600 disabled:opacity-50"
                    >
                      İade Et
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:grid-cols-3">
                <select
                  value={cargoDraft[order.id]?.company || ""}
                  disabled={savingId === order.id}
                  onChange={(e) =>
                    setCargoDraft((prev) => ({
                      ...prev,
                      [order.id]: {
                        company: e.target.value,
                        tracking: prev[order.id]?.tracking || "",
                      },
                    }))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
                >
                  <option value="">Kargo firması seçin</option>
                  {CARGO_COMPANIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  value={cargoDraft[order.id]?.tracking || ""}
                  disabled={savingId === order.id}
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
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
                />
                <button
                  type="button"
                  disabled={savingId === order.id}
                  onClick={() => saveCargo(order.id)}
                  className={`!py-2 text-sm disabled:opacity-50 ${
                    order.status === "shipped" &&
                    order.cargoCompany &&
                    order.trackingNumber
                      ? "btn-outline"
                      : "btn-primary"
                  }`}
                >
                  {savingId === order.id
                    ? "Kaydediliyor..."
                    : order.status === "shipped" &&
                        order.cargoCompany &&
                        order.trackingNumber
                      ? "Kargoya Verildi"
                      : "Kargoya Ver / Kaydet"}
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
