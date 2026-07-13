import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, Phone, Mail, MessageCircle } from "lucide-react";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = {
  title: "Yardım",
};

const faqs = [
  {
    q: "Nasıl sipariş verebilirim?",
    a: "Ürünleri sepetinize ekleyerek sipariş verebilirsiniz. Üye girişi yapmanız veya yeni hesap oluşturmanız gerekmektedir.",
  },
  {
    q: "Teslimat süresi ne kadar?",
    a: "Siparişleriniz 1-3 iş günü içinde kargoya verilir. Teslimat süresi bölgenize göre 2-5 iş günü arasında değişmektedir.",
  },
  {
    q: "İade koşulları nelerdir?",
    a: "Ürünlerinizi teslim aldıktan sonra 14 gün içinde iade edebilirsiniz. Detaylar için İade Politikası sayfamızı inceleyebilirsiniz.",
  },
  {
    q: "Toptan fiyat alabilir miyim?",
    a: "Evet, toptan alımlarda özel fiyat teklifleri sunuyoruz. İletişim sayfamızdan bize ulaşabilirsiniz.",
  },
];

export default function HelpPage() {
  return (
    <div className="container-site py-8 lg:py-12">
      <div className="mb-8 text-center">
        <HelpCircle className="mx-auto h-12 w-12 text-primary-500" />
        <h1 className="mt-4 text-2xl font-bold text-slate-800 lg:text-3xl">
          Yardım Merkezi
        </h1>
        <p className="mt-2 text-slate-500">
          Sık sorulan sorular ve destek kanallarımız
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-800">
            Sık Sorulan Sorular
          </h2>
          {faqs.map((faq) => (
            <details key={faq.q} className="card group">
              <summary className="cursor-pointer p-5 font-semibold text-slate-800 marker:content-none">
                <span className="flex items-center justify-between">
                  {faq.q}
                  <span className="text-primary-500 transition group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="border-t border-slate-100 px-5 pb-5 pt-3 text-sm leading-relaxed text-slate-600">
                {faq.a}
              </p>
            </details>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Bize Ulaşın</h2>
          <div className="card p-5">
            <Phone className="mb-2 h-5 w-5 text-primary-500" />
            <p className="font-semibold text-slate-800">Telefon</p>
            <p className="text-sm text-slate-600">{siteConfig.phone}</p>
          </div>
          <div className="card p-5">
            <Mail className="mb-2 h-5 w-5 text-primary-500" />
            <p className="font-semibold text-slate-800">E-Posta</p>
            <p className="text-sm text-slate-600">{siteConfig.email}</p>
          </div>
          <Link href="/iletisim" className="card flex items-center gap-3 p-5 hover:border-primary-300">
            <MessageCircle className="h-5 w-5 text-primary-500" />
            <div>
              <p className="font-semibold text-slate-800">İletişim Formu</p>
              <p className="text-sm text-slate-500">Mesaj gönderin</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
