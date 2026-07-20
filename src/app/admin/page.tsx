"use client";

import { useEffect, useState } from "react";
import { Package, ShoppingBag, Users, TrendingUp, Clock } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { AdminStats } from "@/types";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setStats(json.data);
      });
  }, []);

  const cards = stats
    ? [
        { label: "Toplam Ürün", value: stats.totalProducts, icon: Package },
        { label: "Toplam Sipariş", value: stats.totalOrders, icon: ShoppingBag },
        { label: "Bekleyen Sipariş", value: stats.pendingOrders, icon: Clock },
        { label: "Kullanıcı", value: stats.totalUsers, icon: Users },
        {
          label: "Toplam Gelir",
          value: formatPrice(stats.totalRevenue),
          icon: TrendingUp,
        },
      ]
    : [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Dashboard</h1>

      {!stats ? (
        <p className="text-slate-500">Yükleniyor...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className="card flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                <card.icon className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="text-2xl font-bold text-slate-800">{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
