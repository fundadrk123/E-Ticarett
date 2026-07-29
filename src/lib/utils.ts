export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Binlik nokta, ondalık virgül (ör. 1.250,50) — para birimi olmadan */
export function formatPriceAmount(amount: number): string {
  if (!Number.isFinite(amount)) return "";
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Türkçe fiyat metnini sayıya çevirir.
 * "1.250,50" → 1250.5 | "1250,5" → 1250.5 | "1250" → 1250
 */
export function parsePriceInput(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  // Sadece rakam, nokta (binlik) ve virgül (ondalık)
  const cleaned = trimmed.replace(/[^\d.,]/g, "");
  if (!cleaned) return undefined;

  let normalized: string;
  if (cleaned.includes(",")) {
    // Virgül ondalık: binlik noktaları sil
    const [intPart, ...rest] = cleaned.split(",");
    const decimals = rest.join("").replace(/\./g, "").slice(0, 2);
    normalized = `${intPart.replace(/\./g, "")}.${decimals}`;
  } else if ((cleaned.match(/\./g) || []).length > 1) {
    // Birden fazla nokta → binlik ayraç
    normalized = cleaned.replace(/\./g, "");
  } else if (cleaned.includes(".")) {
    // Tek nokta: 3 basamaklı grup ise binlik, değilse ondalık olabilir
    const [left, right] = cleaned.split(".");
    if (right.length === 3 && left.length > 0) {
      normalized = cleaned.replace(/\./g, "");
    } else {
      normalized = cleaned;
    }
  } else {
    normalized = cleaned;
  }

  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n * 100) / 100;
}

/** Yazarken binlik ayraçlı gösterim üretir */
export function formatPriceInputTyping(raw: string): string {
  const cleaned = raw.replace(/[^\d,]/g, "");
  if (!cleaned) return "";

  const commaIdx = cleaned.indexOf(",");
  let intDigits: string;
  let decDigits: string | undefined;

  if (commaIdx >= 0) {
    intDigits = cleaned.slice(0, commaIdx).replace(/\D/g, "");
    decDigits = cleaned.slice(commaIdx + 1).replace(/\D/g, "").slice(0, 2);
  } else {
    intDigits = cleaned.replace(/\D/g, "");
  }

  intDigits = intDigits.replace(/^0+(?=\d)/, "");
  const withThousand = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  if (decDigits !== undefined) {
    return `${withThousand},${decDigits}`;
  }
  return withThousand;
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
