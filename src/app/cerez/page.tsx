import type { Metadata } from "next";

export const metadata: Metadata = { title: "Çerez Politikası" };

export default function CookiePage() {
  return (
    <div className="container-site py-8 lg:py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">
          Çerez Politikası
        </h1>
        <p className="mt-6 text-sm leading-relaxed text-slate-600">
          İnternet sitemizde çerezlerden faydalanılmaktadır. Çerezler, site
          deneyiminizi iyileştirmek ve alışveriş sepetinizi hatırlamak amacıyla
          kullanılmaktadır.
        </p>
      </div>
    </div>
  );
}
