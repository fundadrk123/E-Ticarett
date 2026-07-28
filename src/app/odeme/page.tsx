"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus, ShoppingBag, Lock } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/utils";
import type { PaymentMethod } from "@/types";
import { AddressLocationFields } from "@/components/checkout/AddressLocationFields";

export default function CheckoutPage() {
  const { items, totalIncVat, clearCart, ready } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
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
  }, [user]);

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

  if (!user) {
    return (
      <div className="container-site py-10 lg:py-16">
        <div className="mx-auto max-w-xl">
          <div className="card p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              Siparişi tamamlamak için giriş yapın
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Siparişinizi güvenle takip edebilmeniz için hesabınızla devam
              etmeniz gerekiyor. Hesabınız yoksa hemen ücretsiz kayıt olabilirsiniz.
            </p>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ShoppingBag className="h-4 w-4 text-primary-600" />
                Sepet özeti
              </div>
              <div className="space-y-1.5">
                {items.slice(0, 4).map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="flex justify-between gap-3 text-sm text-slate-600"
                  >
                    <span className="line-clamp-1">
                      {product.name} ×{quantity}
                    </span>
                    <span className="shrink-0 font-medium">
                      {formatPrice(product.priceIncVat * quantity)}
                    </span>
                  </div>
                ))}
                {items.length > 4 && (
                  <p className="text-xs text-slate-400">
                    +{items.length - 4} ürün daha
                  </p>
                )}
              </div>
              <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-sm font-bold text-slate-800">
                <span>Toplam</span>
                <span className="text-primary-600">{formatPrice(totalIncVat)}</span>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                href="/giris?redirect=/odeme"
                className="btn-primary inline-flex items-center justify-center gap-2 !py-3"
              >
                <LogIn className="h-4 w-4" />
                Giriş Yap
              </Link>
              <Link
                href="/giris?mode=register&redirect=/odeme"
                className="btn-outline inline-flex items-center justify-center gap-2 !py-3"
              >
                <UserPlus className="h-4 w-4" />
                Kayıt Ol
              </Link>
            </div>

            <Link
              href="/sepet"
              className="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Sepete dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          body: JSON.stringify({ orderId: order.id }),
        });
        const payJson = await payRes.json();

        if (payJson.success && payJson.data.checkoutFormContent) {
          // Sepeti burada temizleme — ödeme başarılı callback'te / basarili sayfasında
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
      router.push(`/odeme/basarili?orderId=${order.id}&orderNumber=${order.orderNumber}`);
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
        Giriş yapan hesap: <span className="font-medium text-slate-700">{user.email}</span>
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
                  desc: "Sipariş onayından sonra IBAN bilgisi gönderilir",
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
          <div className="mt-4 flex justify-between">
            <span className="font-bold text-slate-800">Toplam</span>
            <span className="text-xl font-bold text-primary-600">
              {formatPrice(totalIncVat)}
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
