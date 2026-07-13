import Link from "next/link";
import { siteConfig } from "@/data/site";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Shield,
} from "lucide-react";

const footerLinks = {
  alisveris: [
    { label: "K.V.K. Kanunu", href: "/kvkk" },
    { label: "Gizlilik Sözleşmesi", href: "/gizlilik" },
    { label: "Çerez Politikası", href: "/cerez" },
    { label: "Garanti Şartları", href: "/garanti" },
    { label: "Teslimat Şartları", href: "/teslimat" },
    { label: "İade Politikası", href: "/iade" },
  ],
  hizmetler: [
    { label: "Yardım", href: "/yardim" },
    { label: "Sipariş Takibi", href: "/siparis-takip" },
    { label: "İstek ve Öneriler", href: "/iletisim" },
    { label: "Yeni Ürünler", href: "/urunler?filtre=yeni" },
  ],
  kurumsal: [
    { label: "Hakkımızda", href: "/hakkimizda" },
    { label: "İletişim", href: "/iletisim" },
    { label: "Markalar", href: "/markalar" },
  ],
};

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-primary-900 text-primary-100">
      <div className="container-site py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500 text-sm font-bold text-white">
                MG
              </div>
              <div>
                <p className="font-bold text-white">{siteConfig.shortName}</p>
                <p className="text-xs text-primary-300">Toptan Hırdavat</p>
              </div>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-primary-300">
              {siteConfig.companyName} olarak inşaat malzemeleri ve hırdavat
              sektöründe güvenilir toptan satış hizmeti sunuyoruz.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-800 text-primary-300 transition hover:bg-accent-500 hover:text-white"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-800 text-primary-300 transition hover:bg-accent-500 hover:text-white"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Alışveriş
            </h3>
            <ul className="space-y-2">
              {footerLinks.alisveris.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-300 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Hizmetler
            </h3>
            <ul className="space-y-2">
              {footerLinks.hizmetler.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-300 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              İrtibat
            </h3>
            <ul className="space-y-3 text-sm text-primary-300">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                {siteConfig.address}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-accent-400" />
                <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`} className="hover:text-white">
                  {siteConfig.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-accent-400" />
                <a href={`mailto:${siteConfig.email}`} className="hover:text-white">
                  {siteConfig.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-primary-800">
        <div className="container-site flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-xs text-primary-400">
            &copy; {new Date().getFullYear()} {siteConfig.companyName} — Tüm
            hakları saklıdır.
          </p>
          <div className="flex items-center gap-2 text-xs text-primary-400">
            <Shield className="h-4 w-4 text-green-400" />
            Kredi kartı bilgileriniz 256-bit SSL ile korunmaktadır.
          </div>
        </div>
      </div>
    </footer>
  );
}
