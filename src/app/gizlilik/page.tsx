import type { Metadata } from "next";

type PolicyPageProps = {
  title: string;
  children: React.ReactNode;
};

function PolicyPage({ title, children }: PolicyPageProps) {
  return (
    <div className="container-site py-8 lg:py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">{title}</h1>
        <div className="mt-6 text-sm leading-relaxed text-slate-600">{children}</div>
      </div>
    </div>
  );
}

export const metadata: Metadata = { title: "Gizlilik Sözleşmesi" };

export default function PrivacyPage() {
  return (
    <PolicyPage title="Gizlilik Sözleşmesi">
      <p>
        Mertem Grup İnşaat Ticaret Ltd. Şti. olarak müşterilerimizin gizliliğine
        saygı duyuyoruz. Web sitemizde toplanan kişisel bilgiler, yalnızca
        sipariş işlemleri ve müşteri hizmetleri amacıyla kullanılmaktadır.
      </p>
    </PolicyPage>
  );
}
