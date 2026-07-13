import type { Metadata } from "next";

export const metadata: Metadata = { title: "İade Politikası" };

export default function ReturnPage() {
  return (
    <div className="container-site py-8 lg:py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">
          İade Politikası
        </h1>
        <p className="mt-6 text-sm leading-relaxed text-slate-600">
          Ürünlerinizi teslim aldıktan sonra 14 gün içinde, kullanılmamış ve
          orijinal ambalajında olmak kaydıyla iade edebilirsiniz. İade
          talepleriniz için müşteri hizmetlerimizle iletişime geçmeniz
          gerekmektedir.
        </p>
      </div>
    </div>
  );
}
