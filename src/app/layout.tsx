import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteShell } from "@/components/layout/SiteShell";
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
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
