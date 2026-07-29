"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  Clock,
  FolderTree,
  ImagePlus,
  Boxes,
  PackageCheck,
  PackageX,
  Warehouse,
} from "lucide-react";
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
        {
          label: "İşlem Bekleyen",
          value: stats.openOrders ?? stats.pendingOrders,
          icon: ShoppingBag,
        },
        { label: "Kullanıcı", value: stats.totalUsers, icon: Users },
        {
          label: "Toplam Gelir",
          value: formatPrice(stats.totalRevenue),
          icon: TrendingUp,
        },
      ]
    : [];

  const stockCards = stats
    ? [
        {
          label: "Stoğu Olan Ürün",
          value: stats.productsInStock,
          hint: "stock_qty > 0",
          icon: PackageCheck,
          tone: "bg-green-50 text-green-700",
        },
        {
          label: "Stoğu Bitmiş Ürün",
          value: stats.productsOutOfStock,
          hint: "stock_qty = 0",
          icon: PackageX,
          tone: "bg-red-50 text-red-700",
        },
        {
          label: "Toplam Stok Adedi",
          value: stats.totalStockQty.toLocaleString("tr-TR"),
          hint: "Tüm ürünlerin stok toplamı",
          icon: Warehouse,
          tone: "bg-primary-50 text-primary-700",
        },
      ]
    : [];

  const quickLinks = [
    {
      href: "/admin/urunler",
      title: "Ürün Ekle / Stok Güncelle",
      desc: "Yeni ürün, görsel yükleme ve stok durumu",
      icon: ImagePlus,
    },
    {
      href: "/admin/kategoriler",
      title: "Kategori Yönetimi",
      desc: "Kategori ekle, düzenle veya çıkar",
      icon: FolderTree,
    },
    {
      href: "/admin/siparisler",
      title: "Siparişler",
      desc: "Sipariş durumu ve ödeme takibi",
      icon: Boxes,
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Dashboard</h1>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="card flex items-start gap-3 p-4 transition hover:border-primary-300 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <link.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{link.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{link.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {!stats ? (
        <p className="text-slate-500">Yükleniyor...</p>
      ) : (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Stok özeti
          </h2>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {stockCards.map((card) => (
              <Link
                key={card.label}
                href="/admin/urunler"
                className="card flex items-center gap-4 p-5 transition hover:border-primary-300 hover:shadow-md"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.tone}`}
                >
                  <card.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                  <p className="text-xs text-slate-400">{card.hint}</p>
                </div>
              </Link>
            ))}
          </div>

          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Genel
          </h2>
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
        </>
      )}
    </div>
  );
}
