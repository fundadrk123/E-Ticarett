"use client";

import { usePathname } from "next/navigation";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { TopBar } from "@/components/layout/TopBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { CookieBanner } from "@/components/layout/CookieBanner";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  // CartProvider her zaman üstte — sayfa değişince sepet sıfırlanmaz
  return (
    <AuthProvider>
      <CartProvider>
        {isAdmin ? (
          children
        ) : (
          <>
            <TopBar />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <WhatsAppButton />
            <CookieBanner />
          </>
        )}
      </CartProvider>
    </AuthProvider>
  );
}
