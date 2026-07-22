"use client";

import { useEffect, useState } from "react";
import type { Category } from "@/types";

const empty = {
  name: "",
  slug: "",
  icon: "📦",
  productCount: 0,
  image: "/products/kupa/page-007-main.jpg",
  description: "",
};

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[çÇ]/g, "c")
    .replace(/[ğĞ]/g, "g")
    .replace(/[ıİ]/g, "i")
    .replace(/[öÖ]/g, "o")
    .replace(/[şŞ]/g, "s")
    .replace(/[üÜ]/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<typeof empty | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setCategories(json.data);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form?.name) return;
    setSaving(true);
    const payload = {
      ...form,
      slug: form.slug || toSlug(form.name),
      description: form.description || form.name,
    };
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);
    if (!json.success) {
      alert(json.message || "Kategori eklenemedi.");
      return;
    }
    setForm(null);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kategori Yönetimi</h1>
          <p className="text-sm text-slate-500">Kategorileri görüntüle ve yeni ekle</p>
        </div>
        <button onClick={() => setForm({ ...empty })} className="btn-primary">
          Yeni Kategori
        </button>
      </div>

      {form && (
        <div className="card mb-6 space-y-3 p-5">
          <h2 className="font-bold text-slate-800">Yeni Kategori</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Kategori adı *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="İkon (emoji)"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Açıklama"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button onClick={() => setForm(null)} className="btn-outline">
              İptal
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Yükleniyor...</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat.id} className="card p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <p className="font-semibold text-slate-800">{cat.name}</p>
                  <p className="text-sm text-slate-500">{cat.productCount} ürün</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
