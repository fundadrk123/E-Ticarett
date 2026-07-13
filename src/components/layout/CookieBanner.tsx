"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("mertem-cookies");
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("mertem-cookies", "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white p-4 shadow-lg sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-md sm:rounded-xl sm:border">
      <p className="text-sm text-slate-600">
        İnternet sitemizde çerezlerden faydalanılmaktadır. Detaylı bilgi için{" "}
        <Link href="/kvkk" className="font-medium text-primary-600 hover:underline">
          KVKK
        </Link>
        ,{" "}
        <Link href="/gizlilik" className="font-medium text-primary-600 hover:underline">
          Gizlilik Sözleşmesi
        </Link>{" "}
        ve{" "}
        <Link href="/cerez" className="font-medium text-primary-600 hover:underline">
          Çerez Politikası
        </Link>
        &apos;mızı inceleyebilirsiniz.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setVisible(false)}
          className="btn-outline flex-1 !py-2 text-xs"
        >
          Reddet
        </button>
        <button onClick={accept} className="btn-primary flex-1 !py-2 text-xs">
          Kabul Et
        </button>
      </div>
    </div>
  );
}
