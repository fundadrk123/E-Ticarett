"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const orderId = searchParams.get("orderId");
  const shouldClear = searchParams.get("clearCart") === "1";
  const { clearCart } = useCart();

  useEffect(() => {
    if (shouldClear) clearCart();
  }, [shouldClear, clearCart]);

  return (
    <div className="container-site py-16 text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
      <h1 className="mt-4 text-2xl font-bold text-slate-800">
        Siparişiniz Alındı!
      </h1>
      {orderNumber && (
        <p className="mt-2 text-lg text-primary-600">
          Sipariş No: <strong>{orderNumber}</strong>
        </p>
      )}
      {!orderNumber && orderId && (
        <p className="mt-2 text-sm text-slate-500">
          Sipariş referansı: <strong>{orderId.slice(0, 8)}…</strong>
        </p>
      )}
      <p className="mx-auto mt-4 max-w-md text-slate-500">
        Siparişiniz başarıyla oluşturuldu. Sipariş durumunu hesabınızdan veya
        sipariş takip sayfasından kontrol edebilirsiniz.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/siparis-takip" className="btn-primary">
          Sipariş Takibi
        </Link>
        <Link href="/hesabim" className="btn-outline">
          Hesabım
        </Link>
        <Link href="/urunler" className="btn-outline">
          Alışverişe Devam Et
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="container-site py-16 text-center">Yükleniyor...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
