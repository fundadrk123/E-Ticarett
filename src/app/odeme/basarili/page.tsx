"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");

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
      <p className="mx-auto mt-4 max-w-md text-slate-500">
        Siparişiniz başarıyla oluşturuldu. Onay e-postası kısa süre içinde
        gönderilecektir.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/siparis-takip" className="btn-primary">
          Sipariş Takibi
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
