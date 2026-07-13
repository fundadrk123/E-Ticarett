"use client";

import { useState } from "react";
import { Search, Package } from "lucide-react";

export default function OrderTrackingPage() {
  const [email, setEmail] = useState("");
  const [orderNo, setOrderNo] = useState("");

  return (
    <div className="container-site py-12 lg:py-16">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <Package className="mx-auto h-12 w-12 text-primary-500" />
          <h1 className="mt-4 text-2xl font-bold text-slate-800">
            Sipariş Takibi
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Siparişinize ait kayıtlı e-posta adresinizi ve sipariş numaranızı
            giriniz.
          </p>
        </div>

        <div className="card p-6 lg:p-8">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                E-Posta Adresi
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Sipariş Numarası
              </label>
              <input
                type="text"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                placeholder="SIP-XXXXX"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              <Search className="h-4 w-4" />
              Sorgula
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
