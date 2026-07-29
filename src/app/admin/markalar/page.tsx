"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Brand } from "@/types";

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

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ id?: string; name: string; slug: string } | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/admin/brands")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setBrands(json.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form?.name.trim()) {
      alert("Marka adı zorunlu.");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug || toSlug(form.name),
    };
    const isEdit = Boolean(form.id);
    const res = await fetch(
      isEdit ? `/api/admin/brands/${form.id}` : "/api/admin/brands",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const json = await res.json();
    setSaving(false);
    if (!json.success) {
      alert(json.message || "Kaydedilemedi.");
      return;
    }
    setForm(null);
    load();
  };

  const remove = async (brand: Brand) => {
    if (!confirm(`“${brand.name}” silinsin mi?`)) return;
    const res = await fetch(`/api/admin/brands/${brand.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) {
      alert(json.message || "Silinemedi.");
      return;
    }
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Marka Yönetimi</h1>
        <button
          onClick={() => setForm({ name: "", slug: "" })}
          className="btn-primary flex items-center gap-2 !py-2 text-sm"
        >
          <Plus className="h-4 w-4" />
          Yeni Marka
        </button>
      </div>

      {form && (
        <div className="card mb-6 space-y-3 p-5">
          <input
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
                slug: form.id ? form.slug : toSlug(e.target.value),
              })
            }
            placeholder="Marka adı"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="slug"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="btn-primary !py-2 text-sm">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button onClick={() => setForm(null)} className="btn-outline !py-2 text-sm">
              İptal
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Yükleniyor...</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Ad</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{b.name}</td>
                  <td className="px-4 py-3 text-slate-500">{b.slug}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setForm(b)}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(b)}
                        className="rounded p-1.5 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
