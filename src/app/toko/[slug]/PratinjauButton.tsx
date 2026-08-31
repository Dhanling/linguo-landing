"use client";

/* [ebook-pratinjau-unit1-v1] "Baca Gratis Unit 1" di halaman produk publik.
 *
 * Kenapa tombolnya di sini, bukan cuma di Perpustakaan: orang yang sedang
 * menimbang beli ada DI HALAMAN INI. Menyuruhnya bikin akun dulu, masuk
 * dashboard, lalu mencari modulnya di rak untuk sekadar mengintip = tiga langkah
 * sebelum melihat satu kalimat pun isinya.
 *
 * Akun tetap wajib, dan itu memang disengaja: aksesnya berupa baris
 * `digital_purchases` milik seseorang (batasnya diperiksa server tiap halaman
 * dibuka), dan calon pembeli yang sudah punya akun jauh lebih mudah ditindaklanjuti
 * daripada pengunjung anonim. Yang dihilangkan cuma langkah mencari-carinya:
 *   tamu  → /akun?next=/toko/<slug>?coba=1 → balik ke sini, tombolnya jalan sendiri
 *   login → baris cicip terbit → langsung mendarat di reader modulnya.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

export default function PratinjauButton({ productId, slug }: { productId: string; slug: string }) {
  const [busy, setBusy] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  /** Penjaga jalan-sendiri sesudah login: sekali saja, walau efeknya berjalan dua kali. */
  const sudahOtomatis = useRef(false);

  const jalan = useCallback(async () => {
    setBusy(true);
    setGalat(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        // Balik ke halaman ini dengan ?coba=1 — sesudah masuk, tombolnya
        // menekan dirinya sendiri.
        const balik = `/toko/${slug}?coba=1`;
        window.location.href = `/akun?next=${encodeURIComponent(balik)}`;
        return;
      }
      const res = await fetch("/api/ebook/pratinjau", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: session.access_token, productId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Gagal membuka pratinjau.");
      // Mendarat langsung di readernya, bukan di daftar rak.
      window.location.href = `/akun?menu=pustaka&ebook=${encodeURIComponent(String(j.purchase_id))}`;
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Gagal membuka pratinjau.");
      setBusy(false);
    }
  }, [productId, slug]);

  useEffect(() => {
    if (sudahOtomatis.current) return;
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("coba") !== "1") return;
    sudahOtomatis.current = true;
    // Param sekali pakai — kalau ditinggal, refresh halaman ini besok memicu
    // pratinjau lagi tanpa diminta.
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete("coba");
      window.history.replaceState(null, "", u.toString());
    } catch {}
    void jalan();
  }, [jalan]);

  return (
    <div className="mt-3">
      <button
        onClick={() => void jalan()}
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-teal-600 bg-white py-3.5 text-[15px] font-semibold text-teal-700 transition-colors hover:bg-teal-50 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <BookOpen className="h-5 w-5" strokeWidth={2} aria-hidden />}
        Baca Gratis Unit 1
      </button>
      <p className="mt-2 text-center text-xs text-gray-500">
        Coba dulu sebelum beli — Unit 1 terbuka penuh, gratis. Butuh akun Linguo (gratis).
      </p>
      {galat && <p className="mt-2 text-center text-xs font-semibold text-rose-600">{galat}</p>}
    </div>
  );
}
