import { revalidateTag } from "next/cache";

/** Admin ürün/kategori/marka değişikliklerinde katalog önbelleğini temizle */
export function revalidateCatalog() {
  try {
    revalidateTag("products");
    revalidateTag("categories");
    revalidateTag("brands");
  } catch {
    // build / non-request context
  }
}
