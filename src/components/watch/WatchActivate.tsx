"use client";

// Aktivasi premium Watch & Learn setelah redirect balik dari checkout Xendit.
// Membaca ?wl=<external_id>, verifikasi LUNAS ke server (Xendit source of truth),
// baru menyalakan flag premium lokal. ?wl=gagal → toast gagal. Tidak menyalakan
// apa pun hanya dari URL tanpa invoice lunas.

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { setWatchPremium } from "@/lib/immersionLearn";

export default function WatchActivate() {
  const params = useSearchParams();
  const router = useRouter();
  const [toast, setToast] = useState<null | { ok: boolean; msg: string }>(null);

  useEffect(() => {
    const wl = params.get("wl");
    if (!wl) return;

    if (wl === "gagal") {
      setToast({ ok: false, msg: "Pembayaran dibatalkan. Coba lagi kapan saja." });
      router.replace("/watch");
      return;
    }

    if (!/^WL-/.test(wl)) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/verify-wl-payment?external_id=${encodeURIComponent(wl)}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.paid) {
          setWatchPremium(true);
          setToast({ ok: true, msg: "Langganan aktif! Arti kata & Analisa terbuka penuh 🎉" });
        } else {
          setToast({ ok: false, msg: "Pembayaran belum terkonfirmasi. Cek email invoice-mu." });
        }
      } catch {
        if (!cancelled) setToast({ ok: false, msg: "Gagal cek status pembayaran." });
      } finally {
        if (!cancelled) router.replace("/watch");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(id);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-[140] flex justify-center px-4">
      <div
        className="flex items-center gap-2.5 rounded-2xl px-4 py-3 text-[13.5px] font-semibold text-white shadow-2xl"
        style={{
          backgroundColor: "#0A1212",
          border: `1px solid ${toast.ok ? "rgba(26,158,158,0.5)" : "rgba(255,255,255,0.12)"}`,
        }}
      >
        {toast.ok ? (
          <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "#1A9E9E" }} />
        ) : (
          <XCircle className="h-5 w-5 shrink-0 text-red-400" />
        )}
        {toast.msg}
      </div>
    </div>
  );
}
