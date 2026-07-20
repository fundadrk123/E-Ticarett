"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

const emptyProduct = {
  sku: "",
  name: "",
  slug: "",
  brand: "",
  categoryId: "1",
  priceExVat: 0,
  priceIncVat: 0,
  unit: "ADET",
  inStock: true,
  image: "",
  description: "",
  features: [] as string[],
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProducts(json.data);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing?.name || !editing.sku) return;

    const payload = {
      ...emptyProduct,
      ...editing,
      slug:
        editing.slug ||
        editing.name
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") ||
        "",
      priceIncVat: editing.priceIncVat || (editing.priceExVat || 0) * 1.2,
    };

    const isNew = !editing.id;
    const url = isNew ? "/api/admin/products" : `/api/admin/products/${editing.id}`;
    const method = isNew ? "POST" : "PUT";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Ürün Yönetimi</h1>
        <button
          onClick={() => setEditing({ ...emptyProduct })}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Yeni Ürün
        </button>
      </div>

      {editing && (
        <div className="card mb-6 space-y-3 p-5">
          <h2 className="font-bold text-slate-800">
            {editing.id ? "Ürün Düzenle" : "Yeni Ürün"}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Stok Kodu"
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
              placeholder="Ürün Adı"
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              type="number"
              placeholder="Fiyat (+KDV)"
              value={editing.priceExVat || ""}
              onChange={(e) =>
                setEditing({ ...editing, priceExVat: Number(e.target.value) })
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Görsel URL"
              value={editing.image || ""}
              onChange={(e) => setEditing({ ...editing, image: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Açıklama"
              value={editing.description || ""}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="btn-primary">
              Kaydet
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
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold">Ürün</th>
                <th className="px-4 py-3 font-semibold">Marka</th>
                <th className="px-4 py-3 font-semibold">Fiyat</th>
                <th className="px-4 py-3 font-semibold">Stok</th>
                <th className="px-4 py-3 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">{product.sku}</td>
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3">{product.brand}</td>
                  <td className="px-4 py-3">{formatPrice(product.priceIncVat)}</td>
                  <td className="px-4 py-3">
                    {product.inStock ? (
                      <span className="text-green-600">Var</span>
                    ) : (
                      <span className="text-red-500">Yok</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditing(product)}
                        className="rounded p-1.5 text-primary-600 hover:bg-primary-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(product.id)}
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
