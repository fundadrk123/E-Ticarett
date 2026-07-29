"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Coupon, CouponType } from "@/types";
import { formatPrice, formatPriceAmount, formatPriceInputTyping, parsePriceInput } from "@/lib/utils";

type CouponForm = {
  code: string;
  type: CouponType;
  value: number | "";
  minOrderText: string;
  maxUses: string | number;
  expiresAt: string;
};

const emptyForm: CouponForm = {
  code: "",
  type: "percent",
  value: "",
  minOrderText: "",
  maxUses: "",
  expiresAt: "",
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CouponForm>(emptyForm);

  const load = () => {
    fetch("/api/admin/coupons")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setCoupons(json.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.value === "" || Number(form.value) < 0) {
      alert("Kupon değeri giriniz.");
      return;
    }
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        type: form.type,
        value: Number(form.value),
        minOrderIncVat: parsePriceInput(form.minOrderText) || 0,
        maxUses: form.maxUses === "" ? null : Number(form.maxUses),
        expiresAt: form.expiresAt || null,
      }),
    });
    const json = await res.json();
    if (!json.success) {
      alert(json.message || "Oluşturulamadı.");
      return;
    }
    setForm(emptyForm);
    load();
  };

  const toggleActive = async (coupon: Coupon) => {
    await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !coupon.active }),
    });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Kupon silinsin mi?")) return;
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Kupon Yönetimi</h1>

      <form onSubmit={create} className="card mb-6 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
        <input
          required
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          placeholder="Kod (örn. INDIRIM10)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as CouponType })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="percent">Yüzde (%)</option>
          <option value="fixed">Sabit TL</option>
        </select>
        <input
          required
          type="number"
          min={0}
          step="0.01"
          value={form.value}
          placeholder={form.type === "percent" ? "Örn: 10 (%)" : "Örn: 100 (TL)"}
          onFocus={(e) => {
            if (form.value === 0 || form.value === "") {
              setForm({ ...form, value: "" });
            }
            e.target.select();
          }}
          onChange={(e) => {
            const raw = e.target.value;
            setForm({
              ...form,
              value: raw === "" ? "" : Number(raw),
            });
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="text"
          inputMode="decimal"
          value={form.minOrderText}
          placeholder="Min. sipariş — örn: 1.500,00"
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            setForm({
              ...form,
              minOrderText: formatPriceInputTyping(e.target.value),
            });
          }}
          onBlur={() => {
            const n = parsePriceInput(form.minOrderText);
            if (n != null) {
              setForm({ ...form, minOrderText: formatPriceAmount(n) });
            }
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
          min={0}
          value={form.maxUses}
          onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
          placeholder="Max kullanım (boş = sınırsız)"
          onFocus={(e) => e.target.select()}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={form.expiresAt}
          onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="btn-primary flex items-center justify-center gap-2 !py-2 text-sm sm:col-span-2 lg:col-span-3"
        >
          <Plus className="h-4 w-4" />
          Kupon Oluştur
        </button>
      </form>

      {loading ? (
        <p className="text-slate-500">Yükleniyor...</p>
      ) : coupons.length === 0 ? (
        <p className="text-slate-500">Henüz kupon yok.</p>
      ) : (
        <div className="space-y-3">
          {coupons.map((c) => (
            <div
              key={c.id}
              className="card flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="font-bold text-slate-800">{c.code}</p>
                <p className="text-sm text-slate-500">
                  {c.type === "percent" ? `%${c.value}` : formatPrice(c.value)}
                  {c.minOrderIncVat > 0
                    ? ` · min ${formatPrice(c.minOrderIncVat)}`
                    : ""}
                  {" · "}
                  {c.usedCount}
                  {c.maxUses != null ? `/${c.maxUses}` : ""} kullanım
                  {!c.active ? " · pasif" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleActive(c)}
                  className="btn-outline !py-1.5 text-xs"
                >
                  {c.active ? "Pasifleştir" : "Aktifleştir"}
                </button>
                <button
                  onClick={() => remove(c.id)}
                  className="rounded p-2 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
