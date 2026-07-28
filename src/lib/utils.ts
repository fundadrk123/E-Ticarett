export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Liste kartları için küçük thumbnail yolu */
export function productThumb(image: string): string {
  const match = image.match(/\/products\/kupa\/sku\/([^/?#]+)\.(?:jpe?g|png|webp)$/i);
  if (match) return `/products/kupa/thumbs/${match[1]}.webp`;
  return image;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Sadece site-içi relative path; açık yönlendirmeyi engeller */
export function sanitizeRedirectPath(
  redirect: string | null | undefined,
  fallback = "/hesabim"
) {
  if (!redirect) return fallback;
  if (
    !redirect.startsWith("/") ||
    redirect.startsWith("//") ||
    redirect.includes("://")
  ) {
    return fallback;
  }
  return redirect;
}
