import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { StorefrontLayout } from "@/components/layout/StorefrontLayout";
import { AdminOrStorefront } from "@/components/layout/AdminOrStorefront";
import { siteConfig } from "@/data/site";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.shortName} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.shortName}`,
  },
  description:
    "Mertem Grup İnşaat Ticaret Ltd. Şti. - İnşaat malzemeleri ve hırdavat toptan satış. Uygun fiyat, hızlı teslimat.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" data-scroll-behavior="smooth">
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <Providers>
          <AdminOrStorefront storefront={<StorefrontLayout>{children}</StorefrontLayout>}>
            {children}
          </AdminOrStorefront>
        </Providers>
      </body>
    </html>
  );
}
