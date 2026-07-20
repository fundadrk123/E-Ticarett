import Link from "next/link";
import { XCircle } from "lucide-react";

export default function PaymentFailedPage() {
  return (
    <div className="container-site py-16 text-center">
      <XCircle className="mx-auto h-16 w-16 text-red-500" />
      <h1 className="mt-4 text-2xl font-bold text-slate-800">
        Ödeme Başarısız
      </h1>
      <p className="mx-auto mt-4 max-w-md text-slate-500">
        Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin veya farklı bir ödeme
        yöntemi seçin.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/odeme" className="btn-primary">
          Tekrar Dene
        </Link>
        <Link href="/sepet" className="btn-outline">
          Sepete Dön
        </Link>
      </div>
    </div>
  );
}
