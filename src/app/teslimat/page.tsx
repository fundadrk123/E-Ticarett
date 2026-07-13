import type { Metadata } from "next";

export const metadata: Metadata = { title: "Teslimat Şartları" };

export default function DeliveryPage() {
  return (
    <div className="container-site py-8 lg:py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">
          Teslimat Şartları
        </h1>
        <p className="mt-6 text-sm leading-relaxed text-slate-600">
          Siparişleriniz onaylandıktan sonra 1-3 iş günü içinde kargoya
          verilir. Teslimat süresi bölgenize ve kargo firmasına göre 2-5 iş
          günü arasında değişmektedir. Büyük hacimli siparişlerde nakliye
          seçenekleri için bizimle iletişime geçebilirsiniz.
        </p>
      </div>
    </div>
  );
}
