import type { ReactNode } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { CookieBanner } from "@/components/layout/CookieBanner";

/** Mağaza sayfaları için layout chrome — Server Component. */
export function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TopBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
      <CookieBanner />
    </>
  );
}
