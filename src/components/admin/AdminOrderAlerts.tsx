"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import type { AdminStats } from "@/types";

const SEEN_KEY = "mertem-admin-seen-order";
const POLL_MS = 20_000;

export function AdminOrderAlerts() {
  const pathname = usePathname();
  const [openCount, setOpenCount] = useState(0);
  const [latestNumber, setLatestNumber] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const seenRef = useRef<string | null>(null);
  const firstLoad = useRef(true);

  useEffect(() => {
    try {
      seenRef.current = localStorage.getItem(SEEN_KEY);
    } catch {
      seenRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      const json = await res.json();
      if (!json.success || !json.data) return;
      const stats = json.data as AdminStats;
      setOpenCount(stats.openOrders ?? stats.pendingOrders ?? 0);
      setLatestNumber(stats.latestOrderNumber || null);

      const latestKey = stats.latestOrderAt
        ? `${stats.latestOrderNumber}|${stats.latestOrderAt}`
        : null;

      if (firstLoad.current) {
        firstLoad.current = false;
        if (latestKey && !seenRef.current) {
          seenRef.current = latestKey;
          try {
            localStorage.setItem(SEEN_KEY, latestKey);
          } catch {
            /* ignore */
          }
        }
        return;
      }

      if (latestKey && latestKey !== seenRef.current) {
        seenRef.current = latestKey;
        try {
          localStorage.setItem(SEEN_KEY, latestKey);
        } catch {
          /* ignore */
        }
        setToast(`Yeni sipariş: ${stats.latestOrderNumber}`);
        // Tarayıcı bildirimi (izin varsa)
        if (typeof window !== "undefined" && "Notification" in window) {
          if (Notification.permission === "granted") {
            new Notification("Yeni sipariş", {
              body: `${stats.latestOrderNumber} — panele bakın`,
              tag: stats.latestOrderNumber,
            });
          }
        }
        window.setTimeout(() => setToast(null), 8000);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    poll();
    const id = window.setInterval(poll, POLL_MS);
    return () => window.clearInterval(id);
  }, [poll, pathname]);

  const requestBrowserPermission = () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => undefined);
    }
  };

  const unread =
    latestNumber &&
    seenRef.current &&
    !seenRef.current.startsWith(`${latestNumber}|`)
      ? 1
      : 0;
  const badge = openCount > 0 ? openCount : unread;

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          setPanelOpen((v) => !v);
          requestBrowserPermission();
          if (latestNumber && seenRef.current) {
            /* panel açılınca toast kapat */
            setToast(null);
          }
        }}
        className="relative rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 hover:text-primary-600"
        title="Sipariş bildirimleri"
        aria-label="Sipariş bildirimleri"
      >
        <Bell className="h-5 w-5" />
        {badge > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </button>

      {panelOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Kapat"
            onClick={() => setPanelOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
            <p className="text-sm font-semibold text-slate-800">Siparişler</p>
            <p className="mt-1 text-sm text-slate-500">
              {openCount > 0
                ? `${openCount} sipariş işlem bekliyor (bekleyen / onaylı).`
                : "İşlem bekleyen sipariş yok."}
            </p>
            {latestNumber && (
              <p className="mt-2 text-xs text-slate-400">
                Son sipariş: <span className="font-medium">{latestNumber}</span>
              </p>
            )}
            <Link
              href="/admin/siparisler"
              onClick={() => setPanelOpen(false)}
              className="btn-primary mt-3 flex w-full justify-center !py-2 text-sm"
            >
              Siparişlere git
            </Link>
            {typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "default" && (
                <button
                  type="button"
                  onClick={requestBrowserPermission}
                  className="mt-2 w-full text-center text-xs text-primary-600 hover:underline"
                >
                  Masaüstü bildirimi aç
                </button>
              )}
          </div>
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] max-w-sm rounded-xl border border-primary-200 bg-white px-4 py-3 shadow-lg">
          <p className="text-sm font-semibold text-slate-800">{toast}</p>
          <Link
            href="/admin/siparisler"
            className="mt-1 inline-block text-sm font-medium text-primary-600 hover:underline"
            onClick={() => setToast(null)}
          >
            Siparişleri görüntüle →
          </Link>
        </div>
      )}
    </div>
  );
}
