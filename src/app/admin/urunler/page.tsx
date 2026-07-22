"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Upload, Package } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Category, Product } from "@/types";

const emptyProduct: Partial<Product> = {
  sku: "",
  name: "",
  slug: "",
  brand: "Kupa Tools",
  categoryId: "1",
  priceExVat: 0,
  priceIncVat: 0,
  unit: "ADET",
  inStock: true,
  isNew: false,
  isRestocked: false,
  image: "",
  description: "",
  features: [],
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

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in" | "out">("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    Promise.all([
      fetch("/api/admin/products").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
    ]).then(([prodJson, catJson]) => {
      if (prodJson.success) setProducts(prodJson.data);
      if (catJson.success) setCategories(catJson.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const filtered = products.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchQ =
      !q ||
      p.sku.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q);
    const matchStock =
      stockFilter === "all" ||
      (stockFilter === "in" && p.inStock) ||
      (stockFilter === "out" && !p.inStock);
    return matchQ && matchStock;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const json = await res.json();
      if (json.success && json.data?.url) {
        setEditing((prev) => (prev ? { ...prev, image: json.data.url } : prev));
      } else {
        alert(json.message || "Görsel yüklenemedi.");
      }
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!editing?.name || !editing.sku) {
      alert("SKU ve ürün adı zorunludur.");
      return;
    }
    setSaving(true);
    const price = Number(editing.priceExVat) || 0;
    const payload = {
      ...emptyProduct,
      ...editing,
      slug: editing.slug || toSlug(`${editing.sku}-${editing.name}`),
      priceExVat: price,
      priceIncVat: price,
      unit: editing.unit || "ADET",
      inStock: editing.inStock !== false,
      image: editing.image || "/products/kupa/page-007-main.jpg",
      description: editing.description || editing.name || "",
      features: editing.features || [],
    };

    const isNew = !editing.id;
    const url = isNew ? "/api/admin/products" : `/api/admin/products/${editing.id}`;
    const method = isNew ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);

    if (!json.success) {
      alert(json.message || "Kayıt başarısız.");
      return;
    }
    setEditing(null);
    load();
  };

  const toggleStock = async (product: Product) => {
    await fetch(`/api/admin/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...product, inStock: !product.inStock }),
    });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ürün Yönetimi</h1>
          <p className="text-sm text-slate-500">
            Ürün ekle, görsel yükle, stok durumunu güncelle
          </p>
        </div>
        <button
          onClick={() => setEditing({ ...emptyProduct })}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Yeni Ürün
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          placeholder="SKU, isim veya marka ara..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-w-[220px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={stockFilter}
          onChange={(e) => {
            setStockFilter(e.target.value as "all" | "in" | "out");
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="all">Tüm stok</option>
          <option value="in">Stokta var</option>
          <option value="out">Stokta yok</option>
        </select>
      </div>

      {editing && (
        <div className="card mb-6 space-y-4 p-5">
          <h2 className="font-bold text-slate-800">
            {editing.id ? "Ürün Düzenle" : "Yeni Ürün Ekle"}
          </h2>

          <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
            <div className="space-y-2">
              <div className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                {editing.image ? (
                  <Image
                    src={editing.image}
                    alt="Ürün görseli"
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    <Package className="h-10 w-10" />
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
              <input
                placeholder="veya görsel URL / yol"
                value={editing.image || ""}
                onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                placeholder="Stok Kodu (SKU) *"
                value={editing.sku || ""}
                onChange={(e) => setEditing({ ...editing, sku: e.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Marka"
                value={editing.brand || ""}
                onChange={(e) => setEditing({ ...editing, brand: e.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Ürün Adı *"
                value={editing.name || ""}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
              />
              <select
                value={editing.categoryId || "1"}
                onChange={(e) =>
                  setEditing({ ...editing, categoryId: e.target.value })
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Liste Fiyatı (TL)"
                value={editing.priceExVat ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, priceExVat: Number(e.target.value) })
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Birim (ADET)"
                value={editing.unit || ""}
                onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.inStock !== false}
                  onChange={(e) =>
                    setEditing({ ...editing, inStock: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                Stokta var
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!editing.isNew}
                  onChange={(e) =>
                    setEditing({ ...editing, isNew: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                Yeni ürün
              </label>
              <textarea
                placeholder="Açıklama"
                value={editing.description || ""}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button onClick={() => setEditing(null)} className="btn-outline">
              İptal
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Yükleniyor...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-3 py-3 font-semibold">Görsel</th>
                <th className="px-3 py-3 font-semibold">SKU</th>
                <th className="px-3 py-3 font-semibold">Ürün</th>
                <th className="px-3 py-3 font-semibold">Marka</th>
                <th className="px-3 py-3 font-semibold">Fiyat</th>
                <th className="px-3 py-3 font-semibold">Stok</th>
                <th className="px-3 py-3 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((product) => (
                <tr key={product.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">
                    <div className="relative h-12 w-12 overflow-hidden rounded bg-slate-100">
                      <Image
                        src={product.image}
                        alt=""
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{product.sku}</td>
                  <td className="max-w-[240px] px-3 py-3 font-medium">
                    <span className="line-clamp-2">{product.name}</span>
                  </td>
                  <td className="px-3 py-3">{product.brand}</td>
                  <td className="px-3 py-3">
                    {formatPrice(product.priceIncVat)}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => toggleStock(product)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        product.inStock
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-red-100 text-red-600 hover:bg-red-200"
                      }`}
                      title="Stok durumunu değiştir"
                    >
                      {product.inStock ? "Stokta" : "Yok"}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditing(product)}
                        className="rounded p-1.5 text-primary-600 hover:bg-primary-50"
                        title="Düzenle"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(product.id)}
                        className="rounded p-1.5 text-red-500 hover:bg-red-50"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Ürün bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-400">
          {filtered.length} / {products.length} ürün · sayfa {safePage}/{totalPages}
        </p>
        {totalPages > 1 && (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn-outline !px-3 !py-1.5 text-sm disabled:opacity-40"
            >
              Önceki
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="btn-outline !px-3 !py-1.5 text-sm disabled:opacity-40"
            >
              Sonraki
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
