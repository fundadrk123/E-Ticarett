import type { Metadata } from "next";

export const metadata: Metadata = { title: "Garanti Şartları" };

export default function WarrantyPage() {
  return (
    <div className="container-site py-8 lg:py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">
          Garanti Şartları
        </h1>
        <p className="mt-6 text-sm leading-relaxed text-slate-600">
          Tüm ürünlerimiz üretici garantisi kapsamındadır. Garanti süreleri
          ürün kategorisine göre değişiklik göstermektedir. Detaylı bilgi için
          ürün sayfalarını inceleyebilir veya müşteri hizmetlerimizle
          iletişime geçebilirsiniz.
        </p>
      </div>
    </div>
  );
}
