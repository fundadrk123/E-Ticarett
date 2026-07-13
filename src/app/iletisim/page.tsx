"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import { siteConfig } from "@/data/site";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="container-site py-8 lg:py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">İletişim</h1>
        <p className="mt-2 text-slate-500">
          Sorularınız için bize ulaşın, en kısa sürede dönüş yapalım
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4">
          <div className="card p-5">
            <Phone className="mb-3 h-6 w-6 text-primary-500" />
            <h3 className="font-semibold text-slate-800">Telefon</h3>
            <a
              href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
              className="mt-1 text-sm text-slate-600 hover:text-primary-600"
            >
              {siteConfig.phone}
            </a>
          </div>
          <div className="card p-5">
            <Mail className="mb-3 h-6 w-6 text-primary-500" />
            <h3 className="font-semibold text-slate-800">E-Posta</h3>
            <a
              href={`mailto:${siteConfig.email}`}
              className="mt-1 text-sm text-slate-600 hover:text-primary-600"
            >
              {siteConfig.email}
            </a>
          </div>
          <div className="card p-5">
            <MapPin className="mb-3 h-6 w-6 text-primary-500" />
            <h3 className="font-semibold text-slate-800">Adres</h3>
            <p className="mt-1 text-sm text-slate-600">{siteConfig.address}</p>
          </div>
          <div className="card p-5">
            <Clock className="mb-3 h-6 w-6 text-primary-500" />
            <h3 className="font-semibold text-slate-800">Çalışma Saatleri</h3>
            <p className="mt-1 text-sm text-slate-600">{siteConfig.workingHours}</p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card p-6 lg:p-8">
            {submitted ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Send className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  Mesajınız Alındı
                </h2>
                <p className="mt-2 text-slate-500">
                  En kısa sürede size dönüş yapacağız.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Ad Soyad
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      E-Posta
                    </label>
                    <input
                      required
                      type="email"
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Konu
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Mesajınız
                  </label>
                  <textarea
                    required
                    rows={5}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  />
                </div>
                <button type="submit" className="btn-primary">
                  <Send className="h-4 w-4" />
                  Gönder
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
