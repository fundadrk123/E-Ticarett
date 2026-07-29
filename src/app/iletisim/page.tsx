"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import { siteConfig } from "@/data/site";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) setSubmitted(true);
      else setError(json.message || "Mesaj gönderilemedi.");
    } catch {
      setError("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

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
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Ad Soyad
                    </label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Telefon (opsiyonel)
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Konu
                  </label>
                  <input
                    required
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
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
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {loading ? "Gönderiliyor..." : "Gönder"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
