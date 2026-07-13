import type { Metadata } from "next";
import { siteConfig } from "@/data/site";
import { Building2, Target, Users, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "Hakkımızda",
};

const values = [
  {
    icon: Target,
    title: "Misyonumuz",
    desc: "İnşaat ve hırdavat sektöründe kaliteli ürünleri uygun fiyatlarla müşterilerimize ulaştırmak.",
  },
  {
    icon: Building2,
    title: "Vizyonumuz",
    desc: "Türkiye'nin en güvenilir toptan hırdavat ve inşaat malzemeleri tedarikçisi olmak.",
  },
  {
    icon: Users,
    title: "Ekibimiz",
    desc: "Alanında uzman, deneyimli ekibimizle 7/24 müşteri memnuniyeti odaklı hizmet sunuyoruz.",
  },
  {
    icon: Award,
    title: "Kalite",
    desc: "Sadece güvenilir markalarla çalışıyor, tüm ürünlerimizde kalite garantisi veriyoruz.",
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-primary-700 to-primary-800 py-16 text-white">
        <div className="container-site text-center">
          <h1 className="text-3xl font-bold lg:text-4xl">Hakkımızda</h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-100">
            {siteConfig.companyName} olarak yılların deneyimiyle inşaat
            malzemeleri ve hırdavat sektöründe hizmet veriyoruz.
          </p>
        </div>
      </section>

      <section className="container-site py-12 lg:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-slate-800">Biz Kimiz?</h2>
          <p className="mt-4 leading-relaxed text-slate-600">
            Mertem Grup, inşaat malzemeleri ve hırdavat alanında toptan satış
            yapan güvenilir bir firmadır. Geniş ürün yelpazemiz, rekabetçi
            fiyatlarımız ve hızlı teslimat anlayışımızla sektörde fark
            yaratıyoruz. Müşteri memnuniyetini her zaman ön planda tutarak,
            kaliteli ürünleri en uygun fiyatlarla sunmayı hedefliyoruz.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <div key={v.title} className="card p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                <v.icon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-bold text-slate-800">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {v.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
