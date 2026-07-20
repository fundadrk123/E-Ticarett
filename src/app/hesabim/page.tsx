"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, LogOut } from "lucide-react";
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

export default function AccountPage() {
  const { user, loading, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (user) {
      fetch("/api/orders")
        .then((r) => r.json())
        .then((json) => {
          if (json.success) setOrders(json.data);
        });
    }
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
        <p className="mt-2 text-slate-500">Siparişlerinizi görmek için giriş yapın.</p>
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
          <p className="mt-1 text-slate-500">
            Hoş geldiniz, {user.name}
          </p>
        </div>
        <button onClick={() => logout()} className="btn-outline flex items-center gap-2">
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
          <p className="mt-1 font-semibold text-slate-800">{orders.length}</p>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-bold text-slate-800">Siparişlerim</h2>
      {orders.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-600">Henüz siparişiniz bulunmuyor.</p>
          <Link href="/urunler" className="btn-primary mt-4 inline-flex">
            Alışverişe Başla
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-800">{order.orderNumber}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                    {statusLabels[order.status] || order.status}
                  </span>
                  <p className="mt-1 font-bold text-primary-600">
                    {formatPrice(order.totalIncVat)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
