import type { Metadata } from "next";

export const metadata: Metadata = { title: "K.V.K.K." };

export default function KvkkPage() {
  return (
    <div className="container-site py-8 lg:py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">
          Kişisel Verilerin Korunması Kanunu
        </h1>
        <div className="prose prose-slate mt-6 max-w-none text-sm leading-relaxed text-slate-600">
          <p>
            Mertem Grup İnşaat Ticaret Ltd. Şti. olarak, 6698 sayılı Kişisel
            Verilerin Korunması Kanunu kapsamında kişisel verilerinizin
            güvenliğine önem veriyoruz. Kişisel verileriniz, yalnızca hizmet
            sunumu amacıyla ve yasal çerçevede işlenmektedir.
          </p>
          <p className="mt-4">
            KVKK kapsamındaki haklarınızı kullanmak için iletişim sayfamızdan
            bize ulaşabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
