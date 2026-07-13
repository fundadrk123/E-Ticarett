import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-site flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-6xl font-bold text-primary-200">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-800">Sayfa Bulunamadı</h1>
      <p className="mt-2 text-slate-500">
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
