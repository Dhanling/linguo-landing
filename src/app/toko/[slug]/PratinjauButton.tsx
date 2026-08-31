"use client";

/* [ebook-pratinjau-publik-v1] "Baca Gratis Unit 1" — popup, TANPA login.
 *
 * Versi pertama tombol ini melempar tamu ke halaman masuk dulu. Salah tempat:
 * orang yang sedang menimbang beli belum punya alasan bikin akun — akunnya baru
 * masuk akal SESUDAH dia melihat isinya bagus. Jadi urutannya dibalik: lihat
 * dulu, akun belakangan (dan akun cuma perlu kalau dia benar-benar membeli).
 *
 * Yang menjaga sisanya bukan gerbang login, tapi berkasnya sendiri:
 * /api/ebook/pratinjau-publik memotong PDF-nya di server dan cuma mengirim
 * halaman Unit 1 — halaman berbayarnya tak pernah sampai ke browser tamu, jadi
 * tak ada yang bisa "dibuka" dari tab Network.
 *
 * Dirender dengan pdf.js ke canvas, bukan <iframe src=".pdf">: pemirsa PDF
 * bawaan browser datang dengan bilah unduh + cetak, dan di Safari iOS iframe PDF
 * sering cuma jadi kotak kosong.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Loader2, X, CreditCard, Lock } from "lucide-react";

export default function PratinjauButton({ slug, title }: { slug: string; title: string }) {
  const [buka, setBuka] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [halaman, setHalaman] = useState(0);
  const wadahRef = useRef<HTMLDivElement | null>(null);
  /** Penjaga render ganda (StrictMode) + pembatal saat popup ditutup di tengah jalan. */
  const jalanRef = useRef(0);

  /* Esc menutup, dan latar halaman dikunci: tanpa itu menggulir di dalam popup
     ikut menyeret halaman produk di belakangnya (terasa seperti dua lapis yang
     berebut jari). */
  useEffect(() => {
    if (!buka) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setBuka(false); };
    window.addEventListener("keydown", onKey);
    const semula = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = semula;
    };
  }, [buka]);

  const render = useCallback(async () => {
    const sesi = ++jalanRef.current;
    setMemuat(true);
    setGalat(null);
    setHalaman(0);
    try {
      const [pdfjs, res] = await Promise.all([
        import("pdfjs-dist/legacy/build/pdf.mjs") as Promise<any>,
        fetch(`/api/ebook/pratinjau-publik?slug=${encodeURIComponent(slug)}`),
      ]);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Pratinjau modul ini belum tersedia.");
      }
      // Worker disajikan dari domain sendiri (disalin saat postinstall).
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
      const buf = await res.arrayBuffer();
      if (sesi !== jalanRef.current) return;

      const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
      if (sesi !== jalanRef.current) return;
      setHalaman(doc.numPages);

      const wadah = wadahRef.current;
      if (!wadah) return;
      wadah.replaceChildren();

      // Lebar kertas = lebar wadah (dikurangi napas kiri-kanan), dinaikkan ke
      // kerapatan layar supaya huruf Arab/Devanagari tidak pecah di layar Retina.
      const lebar = Math.min(wadah.clientWidth - 24, 900);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      for (let n = 1; n <= doc.numPages; n++) {
        const hal = await doc.getPage(n);
        if (sesi !== jalanRef.current) return;
        const vp1 = hal.getViewport({ scale: 1 });
        const skala = lebar / vp1.width;
        const vp = hal.getViewport({ scale: skala * dpr });
        const c = document.createElement("canvas");
        c.width = Math.floor(vp.width);
        c.height = Math.floor(vp.height);
        c.style.width = `${Math.floor(vp.width / dpr)}px`;
        c.style.height = `${Math.floor(vp.height / dpr)}px`;
        c.className = "mx-auto mb-3 rounded-lg bg-white shadow-lg";
        const ctx = c.getContext("2d");
        if (!ctx) continue;
        await hal.render({ canvasContext: ctx, viewport: vp }).promise;
        if (sesi !== jalanRef.current) return;
        wadah.appendChild(c);
        // Halaman pertama sudah boleh dibaca sambil sisanya menyusul.
        if (n === 1) setMemuat(false);
      }
    } catch (err) {
      if (sesi !== jalanRef.current) return;
      setGalat(err instanceof Error ? err.message : "Gagal memuat pratinjau.");
    } finally {
      if (sesi === jalanRef.current) setMemuat(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!buka) { jalanRef.current++; return; }
    void render();
  }, [buka, render]);

  /* Tombol beli di kaki popup memakai tombol checkout yang SUDAH ada di halaman
     (CheckoutSection) — bukan menyalin alur invoicenya ke sini. Satu alur bayar,
     satu tempat memperbaikinya kalau berubah. */
  const keCheckout = () => {
    setBuka(false);
    setTimeout(() => {
      const t = document.getElementById("tombol-beli-sekarang") as HTMLButtonElement | null;
      t?.scrollIntoView({ block: "center", behavior: "smooth" });
      t?.click();
    }, 120);
  };

  return (
    <>
      <div className="mt-3">
        <button
          onClick={() => setBuka(true)}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-teal-600 bg-white py-3.5 text-[15px] font-semibold text-teal-700 transition-colors hover:bg-teal-50"
        >
          <BookOpen className="h-5 w-5" strokeWidth={2} aria-hidden />
          Baca Gratis Unit 1
        </button>
        <p className="mt-2 text-center text-xs text-gray-500">
          Coba dulu sebelum beli — Unit 1 terbuka penuh, gratis, tanpa perlu daftar.
        </p>
      </div>

      {buka && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-[#0B1220]/95 backdrop-blur-sm"
          onClick={() => setBuka(false)}
        >
          {/* kepala */}
          <div
            className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3"
            onClick={(e) => e.stopPropagation()}
          >
            <BookOpen className="hidden h-5 w-5 shrink-0 text-teal-400 sm:block" strokeWidth={2} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-bold text-white">{title}</p>
              <p className="text-[12px] font-medium text-white/50">
                Pratinjau Unit 1{halaman ? ` · ${halaman} halaman` : ""} — gratis
              </p>
            </div>
            <button
              onClick={() => setBuka(false)}
              className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
          </div>

          {/* halaman */}
          <div
            ref={wadahRef}
            className="flex-1 overflow-y-auto px-3 py-4"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          />

          {memuat && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-teal-400" aria-hidden />
                <p className="text-[13px] font-semibold text-white/60">Menyiapkan pratinjau…</p>
              </div>
            </div>
          )}

          {galat && !memuat && (
            <div className="absolute inset-x-0 top-1/2 px-6 text-center">
              <p className="text-[14px] font-bold text-amber-300">{galat}</p>
            </div>
          )}

          {/* kaki: ajakan beli — muncul begitu halamannya terbaca, bukan sesudah
              digulir sampai habis (di HP, ujung bawah itu jauh). */}
          <div
            className="shrink-0 border-t border-white/10 bg-[#0B1220]/80 px-4 py-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex max-w-2xl items-center gap-3">
              <p className="hidden min-w-0 flex-1 items-center gap-1.5 text-[12.5px] font-medium text-white/60 sm:flex">
                <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} aria-hidden />
                Unit 2 sampai akhir modul terbuka setelah pembelian.
              </p>
              <button
                onClick={keCheckout}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-[14px] font-bold text-white transition hover:bg-teal-700 sm:flex-none"
              >
                <CreditCard className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                Beli Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
