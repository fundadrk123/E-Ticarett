import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
};

function hrefFor(
  basePath: string,
  page: number,
  searchParams?: Record<string, string | undefined>
) {
  const params = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "sayfa") params.set(key, value);
    }
  }
  if (page > 1) params.set("sayfa", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({ page, totalPages, basePath, searchParams }: Props) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const window = 2;
  const start = Math.max(1, page - window);
  const end = Math.min(totalPages, page + window);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
      aria-label="Sayfalama"
    >
      <Link
        href={hrefFor(basePath, Math.max(1, page - 1), searchParams)}
        aria-disabled={page <= 1}
        className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium ${
          page <= 1
            ? "pointer-events-none border-slate-100 text-slate-300"
            : "border-slate-200 text-slate-700 hover:bg-slate-50"
        }`}
      >
        <ChevronLeft className="h-4 w-4" />
        Önceki
      </Link>

      {start > 1 && (
        <>
          <Link
            href={hrefFor(basePath, 1, searchParams)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            1
          </Link>
          {start > 2 && <span className="px-1 text-slate-400">…</span>}
        </>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(basePath, p, searchParams)}
          className={`rounded-lg border px-3 py-2 text-sm font-medium ${
            p === page
              ? "border-primary-500 bg-primary-500 text-white"
              : "border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          {p}
        </Link>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-slate-400">…</span>}
          <Link
            href={hrefFor(basePath, totalPages, searchParams)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {totalPages}
          </Link>
        </>
      )}

      <Link
        href={hrefFor(basePath, Math.min(totalPages, page + 1), searchParams)}
        aria-disabled={page >= totalPages}
        className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium ${
          page >= totalPages
            ? "pointer-events-none border-slate-100 text-slate-300"
            : "border-slate-200 text-slate-700 hover:bg-slate-50"
        }`}
      >
        Sonraki
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
