"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { siteConfig } from "@/data/site";
import { categories as categoryData } from "@/data/categories";
import { useCart } from "@/context/CartContext";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const categories = categoryData;
  const { itemCount } = useCart();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/urunler?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="container-site flex items-center gap-4 py-4 lg:gap-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500 text-lg font-bold text-white shadow-md">
            MG
          </div>
          <div className="hidden sm:block">
            <p className="text-lg font-bold leading-tight text-primary-700">
              {siteConfig.shortName}
            </p>
            <p className="text-xs text-slate-500">{siteConfig.tagline}</p>
          </div>
        </Link>

        <form onSubmit={handleSearch} className="hidden flex-1 md:flex">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Ürün, marka veya stok kodu ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            href="/giris"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:flex"
          >
            <User className="h-5 w-5" />
            <span className="hidden lg:inline">Giriş Yap</span>
          </Link>

          <Link
            href="/sepet"
            className="relative flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-primary-600"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="hidden sm:inline">Sepet</span>
            {itemCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
            aria-label="Menü"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <nav className="hidden border-t border-slate-100 bg-slate-50 lg:block">
        <div className="container-site flex items-center gap-1">
          <div
            className="relative"
            onMouseEnter={() => setCatOpen(true)}
            onMouseLeave={() => setCatOpen(false)}
          >
            <button className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-primary-600 transition hover:bg-primary-50">
              <Menu className="h-4 w-4" />
              Kategoriler
              <ChevronDown className="h-4 w-4" />
            </button>
            {catOpen && (
              <div className="absolute left-0 top-full z-50 w-[600px] rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                <div className="grid grid-cols-2 gap-1">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/kategori/${cat.slug}`}
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-primary-50 hover:text-primary-600"
                    >
                      <span>{cat.icon}</span>
                      {cat.name}
                      <span className="ml-auto text-xs text-slate-400">
                        ({cat.productCount})
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/urunler?filtre=yeni"
            className="rounded-lg px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-primary-600"
          >
            Yeni Ürünler
          </Link>
          <Link
            href="/urunler?filtre=stok"
            className="rounded-lg px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-primary-600"
          >
            Yeniden Stoğa Girenler
          </Link>
          <Link
            href="/markalar"
            className="rounded-lg px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-primary-600"
          >
            Markalar
          </Link>
          <Link
            href="/iletisim"
            className="rounded-lg px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-primary-600"
          >
            İletişim
          </Link>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <form onSubmit={handleSearch} className="container-site py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Ürün ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary-500"
              />
            </div>
          </form>
          <div className="container-site space-y-1 pb-4">
            <p className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Kategoriler
            </p>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/kategori/${cat.slug}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <span>{cat.icon}</span>
                {cat.name}
              </Link>
            ))}
            <hr className="my-2 border-slate-200" />
            <Link
              href="/giris"
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-2 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Giriş Yap / Hesap Oluştur
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
