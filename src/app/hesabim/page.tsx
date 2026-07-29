"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, LogOut, MapPin, CreditCard, Shield, Truck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/utils";
import type { Order, SavedAddress } from "@/types";
import { AddressLocationFields } from "@/components/checkout/AddressLocationFields";

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
  const { user, loading, logout, refresh } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [profileMsg, setProfileMsg] = useState("");
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addrForm, setAddrForm] = useState({
    label: "Ev",
    fullName: "",
    phone: "",
    addressLine: "",
    city: "",
    district: "",
    postalCode: "",
    isDefault: false,
  });

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    setProfile({ name: user.name, phone: user.phone || "" });

    let cancelled = false;
    setOrdersLoading(true);
    setOrdersError("");

    Promise.all([
      fetch("/api/orders").then((r) => r.json()),
      fetch("/api/account/addresses").then((r) => r.json()),
    ])
      .then(([ordJson, addrJson]) => {
        if (cancelled) return;
        if (!ordJson.success) {
          setOrdersError(ordJson.message || "Siparişler yüklenemedi.");
          setOrders([]);
        } else {
          setOrders(ordJson.data || []);
        }
        if (addrJson.success) setAddresses(addrJson.data || []);
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

  const saveProfile = async () => {
    setProfileMsg("");
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const json = await res.json();
    if (json.success) {
      setProfileMsg("Profil güncellendi.");
      await refresh();
    } else {
      setProfileMsg(json.message || "Güncellenemedi.");
    }
  };

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addrForm),
    });
    const json = await res.json();
    if (json.success) {
      setAddresses((prev) => [json.data, ...prev]);
      setAddrForm({
        label: "Ev",
        fullName: user?.name || "",
        phone: user?.phone || "",
        addressLine: "",
        city: "",
        district: "",
        postalCode: "",
        isDefault: false,
      });
    } else {
      alert(json.message || "Adres eklenemedi.");
    }
  };

  const removeAddress = async (id: string) => {
    if (!confirm("Adresi silmek istiyor musunuz?")) return;
    await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

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

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-bold text-slate-800">Profil Bilgileri</h2>
          <div className="space-y-3">
            <input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Ad Soyad"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={user.email}
              disabled
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
            <input
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="Telefon"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button type="button" onClick={saveProfile} className="btn-primary !py-2 text-sm">
              Kaydet
            </button>
            {profileMsg && <p className="text-sm text-slate-600">{profileMsg}</p>}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-bold text-slate-800">Kayıtlı Adresler</h2>
          <div className="mb-4 space-y-2">
            {addresses.length === 0 && (
              <p className="text-sm text-slate-500">Henüz kayıtlı adres yok.</p>
            )}
            {addresses.map((a) => (
              <div
                key={a.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-800">
                    {a.label}
                    {a.isDefault ? " · Varsayılan" : ""}
                  </p>
                  <p className="text-slate-500">
                    {a.addressLine}, {a.district}/{a.city}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAddress(a.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={addAddress} className="space-y-2 border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Yeni adres</p>
            <input
              required
              value={addrForm.label}
              onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
              placeholder="Etiket (Ev, İş)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              required
              value={addrForm.fullName}
              onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })}
              placeholder="Ad Soyad"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              required
              value={addrForm.phone}
              onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
              placeholder="Telefon"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <textarea
              required
              rows={2}
              value={addrForm.addressLine}
              onChange={(e) => setAddrForm({ ...addrForm, addressLine: e.target.value })}
              placeholder="Adres"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <AddressLocationFields
              city={addrForm.city}
              district={addrForm.district}
              postalCode={addrForm.postalCode}
              onCityChange={(city) =>
                setAddrForm({ ...addrForm, city, district: "", postalCode: "" })
              }
              onDistrictChange={(district, postalCode) =>
                setAddrForm({ ...addrForm, district, postalCode })
              }
            />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={addrForm.isDefault}
                onChange={(e) =>
                  setAddrForm({ ...addrForm, isDefault: e.target.checked })
                }
              />
              Varsayılan adres
            </label>
            <button type="submit" className="btn-outline !py-2 text-sm">
              Adres Ekle
            </button>
          </form>
        </div>
      </div>

      {user.role === "admin" && (
        <div className="card mb-8 border-accent-200 bg-accent-50/40 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent-600" />
            <h2 className="text-lg font-bold text-slate-800">Yönetim Paneli</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/admin/urunler" className="btn-primary justify-center">
              Ürün / Stok
            </Link>
            <Link href="/admin/markalar" className="btn-outline justify-center">
              Markalar
            </Link>
            <Link href="/admin/kuponlar" className="btn-outline justify-center">
              Kuponlar
            </Link>
            <Link href="/admin/siparisler" className="btn-outline justify-center">
              Siparişler
            </Link>
            <Link href="/admin" className="btn-outline justify-center">
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
                      {(order.trackingNumber || order.cargoCompany) && (
                        <p className="flex items-center gap-1.5">
                          <Truck className="h-4 w-4 text-slate-400" />
                          {order.cargoCompany || "Kargo"}
                          {order.trackingNumber
                            ? ` · Takip: ${order.trackingNumber}`
                            : ""}
                        </p>
                      )}
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
                    ) : null}

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
