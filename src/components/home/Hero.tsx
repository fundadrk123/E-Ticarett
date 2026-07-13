import Link from "next/link";
import { ArrowRight, Truck, ShieldCheck, Headphones, BadgePercent } from "lucide-react";
import { siteConfig } from "@/data/site";

const features = [
  {
    icon: Truck,
    title: "Hızlı Teslimat",
    desc: "Türkiye geneli güvenli kargo",
  },
  {
    icon: ShieldCheck,
    title: "Güvenli Alışveriş",
    desc: "256-bit SSL koruması",
  },
  {
    icon: Headphones,
    title: "7/24 Destek",
    desc: "Uzman ekibimiz yanınızda",
  },
  {
    icon: BadgePercent,
    title: "Toptan Fiyat",
    desc: "En uygun fiyat garantisi",
  },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white">
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="container-site relative py-16 lg:py-24">
        <div className="max-w-2xl">
          <span className="mb-4 inline-block rounded-full bg-accent-500/20 px-4 py-1.5 text-sm font-medium text-accent-400">
            Toptan Hırdavat & İnşaat Malzemeleri
          </span>
          <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight lg:text-5xl">
            {siteConfig.shortName}
            <span className="block text-2xl font-normal text-primary-200 lg:text-3xl">
              Güvenilir Toptan Satış Partneriniz
            </span>
          </h1>
          <p className="mb-8 max-w-lg text-lg text-primary-100">
            Binlerce ürün çeşidi, uygun fiyatlar ve hızlı teslimat ile
            inşaat ve hırdavat ihtiyaçlarınız için tek adres.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/urunler" className="btn-accent !px-6 !py-3">
              Ürünleri Keşfet
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/iletisim"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Bize Ulaşın
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-primary-800/50 backdrop-blur-sm">
        <div className="container-site grid grid-cols-2 gap-4 py-6 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-500/20">
                <f.icon className="h-5 w-5 text-accent-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{f.title}</p>
                <p className="text-xs text-primary-300">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
