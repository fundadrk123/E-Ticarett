"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Pencil, Trash2, Upload, Plus } from "lucide-react";
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

type FormState = typeof empty & { id?: string };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setCategories(json.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: data });
      const json = await res.json();
      if (json.success && json.data?.url) {
        setForm((prev) => (prev ? { ...prev, image: json.data.url } : prev));
      } else {
        alert(json.message || "Görsel yüklenemedi.");
      }
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form?.name.trim()) {
      alert("Kategori adı zorunludur.");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug || toSlug(form.name),
      icon: form.icon || "📦",
      productCount: form.productCount || 0,
      image: form.image,
      description: form.description || form.name,
    };

    const isEdit = Boolean(form.id);
    const res = await fetch(
      isEdit ? `/api/admin/categories/${form.id}` : "/api/admin/categories",
      {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const json = await res.json();
    setSaving(false);
    if (!json.success) {
      alert(json.message || "Kategori kaydedilemedi.");
      return;
    }
    setForm(null);
    load();
  };

  const remove = async (cat: Category) => {
    if (cat.productCount > 0) {
      alert(
        `“${cat.name}” kategorisinde ${cat.productCount} ürün var. Silmek için önce ürünleri başka kategoriye taşıyın.`
      );
      return;
    }
    if (!confirm(`“${cat.name}” kategorisini silmek istediğinize emin misiniz?`)) {
      return;
    }
    const res = await fetch(`/api/admin/categories/${cat.id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!json.success) {
      alert(json.message || "Kategori silinemedi.");
      return;
    }
    load();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kategori Yönetimi</h1>
          <p className="text-sm text-slate-500">
            Kategori ekleyin, düzenleyin veya çıkarın
          </p>
        </div>
        <button
          type="button"
          onClick={() => setForm({ ...empty })}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Yeni Kategori
        </button>
      </div>

      {form && (
        <div className="card mb-6 space-y-4 p-5">
          <h2 className="font-bold text-slate-800">
            {form.id ? "Kategori Düzenle" : "Yeni Kategori"}
          </h2>
          <div className="grid gap-4 lg:grid-cols-[160px_1fr]">
            <div className="space-y-2">
              <div className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                {form.image ? (
                  <Image
                    src={form.image}
                    alt="Kategori görseli"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">
                    {form.icon}
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file);
                }}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="btn-outline flex w-full items-center justify-center gap-2 !py-2 text-sm"
              >
                <Upload className="h-4 w-4" />
                {uploading ? "Yükleniyor..." : "Görsel Yükle"}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                placeholder="Kategori adı *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
              />
              <input
                placeholder="İkon (emoji)"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Slug (opsiyonel)"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Açıklama"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => setForm(null)}
              className="btn-outline"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Yükleniyor...</p>
      ) : categories.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">
          Henüz kategori yok. “Yeni Kategori” ile ekleyin.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat.id} className="card overflow-hidden">
              <div className="relative h-28 bg-slate-100">
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">
                    {cat.icon}
                  </div>
                )}
              </div>
              <div className="flex items-start justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-slate-800">
                    <span className="mr-1">{cat.icon}</span>
                    {cat.name}
                  </p>
                  <p className="text-sm text-slate-500">{cat.productCount} ürün</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    title="Düzenle"
                    onClick={() =>
                      setForm({
                        id: cat.id,
                        name: cat.name,
                        slug: cat.slug,
                        icon: cat.icon,
                        productCount: cat.productCount,
                        image: cat.image || empty.image,
                        description: cat.description || "",
                      })
                    }
                    className="rounded p-1.5 text-primary-600 hover:bg-primary-50"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Sil"
                    onClick={() => remove(cat)}
                    className="rounded p-1.5 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
