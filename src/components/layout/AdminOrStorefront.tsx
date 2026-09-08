"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Admin rotalarında yalnızca sayfa içeriği; diğer rotalarda sunucuda
 * oluşturulmuş StorefrontLayout ağacını gösterir.
 */
export function AdminOrStorefront({
  children,
  storefront,
}: {
  children: ReactNode;
  storefront: ReactNode;
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }
  return <>{storefront}</>;
}
