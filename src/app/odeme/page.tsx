"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

export default function CheckoutPage() {
  const { items, totalIncVat, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [form, setForm] = useState({
    customerName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    addressLine: "",
    city: "",
    district: "",
    postalCode: "",
    notes: "",
  });

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
          clearCart();
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
      <h1 className="mb-8 text-2xl font-bold text-slate-800 lg:text-3xl">
        Ödeme ve Teslimat
      </h1>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
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
              <div className="grid gap-4 sm:grid-cols-3">
                <input
                  required
                  placeholder="İl"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-primary-500"
                />
                <input
                  required
                  placeholder="İlçe"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-primary-500"
                />
                <input
                  placeholder="Posta Kodu"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 font-bold text-slate-800">Ödeme Yöntemi</h2>
            <div className="space-y-3">
              {[
                { value: "bank_transfer" as const, label: "Havale / EFT", desc: "Sipariş onayından sonra IBAN bilgisi gönderilir" },
                { value: "cash_on_delivery" as const, label: "Kapıda Ödeme", desc: "Teslimat sırasında nakit veya kart ile ödeme" },
                { value: "credit_card" as const, label: "Kredi Kartı (iyzico)", desc: "Güvenli online ödeme" },
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
