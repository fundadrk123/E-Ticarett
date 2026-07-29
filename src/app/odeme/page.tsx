"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/utils";
import type { PaymentMethod, SavedAddress } from "@/types";
import { AddressLocationFields } from "@/components/checkout/AddressLocationFields";

export default function CheckoutPage() {
  const { items, totalIncVat, clearCart, ready } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [form, setForm] = useState({
    customerName: "",
    email: "",
    phone: "",
    addressLine: "",
    city: "",
    district: "",
    postalCode: "",
    notes: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      customerName: prev.customerName || user.name || "",
      email: prev.email || user.email || "",
      phone: prev.phone || user.phone || "",
    }));
    fetch("/api/account/addresses")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setAddresses(json.data || []);
          const def = (json.data || []).find((a: SavedAddress) => a.isDefault);
          if (def) applyAddress(def);
        }
      })
      .catch(() => undefined);
  }, [user]);

  const applyAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setForm((prev) => ({
      ...prev,
      customerName: addr.fullName,
      phone: addr.phone,
      addressLine: addr.addressLine,
      city: addr.city,
      district: addr.district,
      postalCode: addr.postalCode || "",
    }));
  };

  const applyCoupon = async () => {
    setCouponMsg("");
    setDiscount(0);
    if (!couponCode.trim()) return;
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode.trim(), orderIncVat: totalIncVat }),
    });
    const json = await res.json();
    if (json.success) {
      setDiscount(Number(json.data.discount) || 0);
      setCouponMsg(`Kupon uygulandı: −${formatPrice(json.data.discount)}`);
    } else {
      setCouponMsg(json.message || "Kupon geçersiz.");
    }
  };

  if (!ready || authLoading) {
    return (
      <div className="container-site py-16 text-center text-slate-500">
        Yükleniyor...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-site py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Sepetiniz Boş</h1>
        <Link href="/urunler" className="btn-primary mt-6 inline-flex">
          Alışverişe Başla
        </Link>
      </div>
    );
  }

  const payable = Math.max(0, totalIncVat - discount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
          customerName: form.customerName,
          email: form.email,
          phone: form.phone,
          paymentMethod,
          notes: form.notes || undefined,
          couponCode: couponCode.trim() || undefined,
          shippingAddress: {
            fullName: form.customerName,
            phone: form.phone,
            addressLine: form.addressLine,
            city: form.city,
            district: form.district,
            postalCode: form.postalCode || undefined,
          },
        }),
      });

      const orderJson = await orderRes.json();
      if (!orderJson.success) {
        setError(orderJson.message || "Sipariş oluşturulamadı.");
        setLoading(false);
        return;
      }

      const order = orderJson.data;

      if (paymentMethod === "credit_card") {
        const payRes = await fetch("/api/payment/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id, email: form.email }),
        });
        const payJson = await payRes.json();

        if (payJson.success && payJson.data.checkoutFormContent) {
          const win = window.open("", "_self");
          if (win) {
            win.document.write(payJson.data.checkoutFormContent);
            win.document.close();
          }
          return;
        }

        setError(
          payJson.message ||
            "Kredi kartı ödemesi başlatılamadı. Havale veya kapıda ödeme deneyin."
        );
        setLoading(false);
        return;
      }

      clearCart();
      router.push(
        `/odeme/basarili?orderId=${order.id}&orderNumber=${order.orderNumber}`
      );
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  };

  return (
    <div className="container-site py-8 lg:py-12">
      <h1 className="mb-2 text-2xl font-bold text-slate-800 lg:text-3xl">
        Ödeme ve Teslimat
      </h1>
      <p className="mb-8 text-sm text-slate-500">
        {user ? (
          <>
            Giriş yapan hesap:{" "}
            <span className="font-medium text-slate-700">{user.email}</span>
          </>
        ) : (
          <>
            Misafir olarak devam ediyorsunuz.{" "}
            <Link
              href="/giris?redirect=/odeme"
              className="inline-flex items-center gap-1 font-medium text-primary-600 hover:text-primary-700"
            >
              <LogIn className="h-3.5 w-3.5" />
              Giriş yap
            </Link>
          </>
        )}
      </p>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6">
            <h2 className="mb-4 font-bold text-slate-800">İletişim Bilgileri</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                required
                placeholder="Ad Soyad"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-primary-500"
              />
              <input
                required
                type="email"
                placeholder="E-Posta"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-primary-500"
              />
              <input
                required
                type="tel"
                placeholder="Telefon"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-primary-500 sm:col-span-2"
              />
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 font-bold text-slate-800">Teslimat Adresi</h2>
            {addresses.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Kayıtlı adresler
                </p>
                <div className="flex flex-wrap gap-2">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => applyAddress(addr)}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                        selectedAddressId === addr.id
                          ? "border-primary-500 bg-primary-50 text-primary-800"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="font-medium">{addr.label}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {addr.district} / {addr.city}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid gap-4">
              <textarea
                required
                rows={3}
                placeholder="Adres"
                value={form.addressLine}
                onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-primary-500"
              />
              <AddressLocationFields
                city={form.city}
                district={form.district}
                postalCode={form.postalCode}
                onCityChange={(cityName) =>
                  setForm({ ...form, city: cityName, district: "", postalCode: "" })
                }
                onDistrictChange={(districtName, postalCode) =>
                  setForm({ ...form, district: districtName, postalCode })
                }
              />
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 font-bold text-slate-800">Ödeme Yöntemi</h2>
            <div className="space-y-3">
              {[
                {
                  value: "bank_transfer" as const,
                  label: "Havale / EFT",
                  desc: "Sipariş onayından sonra IBAN bilgisi e-posta ile gönderilir",
                },
                {
                  value: "cash_on_delivery" as const,
                  label: "Kapıda Ödeme",
                  desc: "Teslimat sırasında nakit veya kart ile ödeme",
                },
                {
                  value: "credit_card" as const,
                  label: "Kredi Kartı (iyzico)",
                  desc: "Güvenli online ödeme",
                },
              ].map((method) => (
                <label
                  key={method.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                    paymentMethod === method.value
                      ? "border-primary-500 bg-primary-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={() => setPaymentMethod(method.value)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-semibold text-slate-800">{method.label}</p>
                    <p className="text-sm text-slate-500">{method.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-800">Sipariş Özeti</h2>
          <div className="mt-4 space-y-2 border-b border-slate-100 pb-4">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between text-sm">
                <span className="text-slate-600">
                  {product.name} x{quantity}
                </span>
                <span className="font-medium">
                  {formatPrice(product.priceIncVat * quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Kupon kodu"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
              />
              <button
                type="button"
                onClick={applyCoupon}
                className="btn-outline !px-3 !py-2 text-xs"
              >
                Uygula
              </button>
            </div>
            {couponMsg && (
              <p className="text-xs text-slate-600">{couponMsg}</p>
            )}
          </div>

          {discount > 0 && (
            <div className="mt-3 flex justify-between text-sm text-green-700">
              <span>İndirim</span>
              <span>−{formatPrice(discount)}</span>
            </div>
          )}

          <div className="mt-4 flex justify-between">
            <span className="font-bold text-slate-800">Toplam</span>
            <span className="text-xl font-bold text-primary-600">
              {formatPrice(payable)}
            </span>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-accent mt-6 w-full disabled:opacity-60"
          >
            {loading ? "İşleniyor..." : "Siparişi Onayla"}
          </button>
          <Link
            href="/sepet"
            className="mt-3 block text-center text-sm text-primary-600 hover:text-primary-700"
          >
            Sepete Dön
          </Link>
        </div>
      </form>
    </div>
  );
}
