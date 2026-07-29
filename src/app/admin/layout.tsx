import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  FolderTree,
  ArrowLeft,
  Tag,
  TicketPercent,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/urunler", label: "Ürünler", icon: Package },
  { href: "/admin/siparisler", label: "Siparişler", icon: ShoppingBag },
  { href: "/admin/kategoriler", label: "Kategoriler", icon: FolderTree },
  { href: "/admin/markalar", label: "Markalar", icon: Tag },
  { href: "/admin/kuponlar", label: "Kuponlar", icon: TicketPercent },
  { href: "/admin/kullanicilar", label: "Kullanıcılar", icon: Users },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="border-b border-slate-200 bg-white">
        <div className="container-site flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500 text-sm font-bold text-white">
              MG
            </div>
            <div>
              <p className="font-bold text-slate-800">Admin Panel</p>
              <p className="text-xs text-slate-500">Mertem Grup Yönetim</p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-primary-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Siteye Dön
          </Link>
        </div>
      </div>

      <div className="container-site grid gap-6 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-primary-50 hover:text-primary-600"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
