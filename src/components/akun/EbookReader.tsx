"use client";

// [ebook-reader-v1] Pembaca e-book di dalam dashboard siswa.
//
// Sebelumnya modul cuma bisa DIUNDUH: siswa keluar dashboard, berkasnya
// mendarat di folder unduhan dan bebas diteruskan ke siapa pun, dan kita tidak
// pernah tahu ada yang membacanya atau tidak. Reader ini membalik semua itu —
// halaman dirender di sini, berkasnya tidak pernah jadi URL yang bisa disalin
// (lihat src/app/api/ebook/route.ts), dan tiap halaman diberi cap nama pembeli.
//
// Soal proteksi, jujur saja: ini friksi, bukan DRM. Tangkapan layar tetap bisa,
// dan byte PDF-nya ada di memori browser. Yang benar-benar menahan orang
// menyebarkan modul adalah CAP NAMA + EMAILNYA di tiap halaman, bukan tombol
// unduh yang disembunyikan.

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { tr, useT } from "@/lib/uiLang"; // [ui-lang-switcher-v1]
import {
  ChevronLeft, ChevronRight, Loader2, Minus, Plus, X, BookOpen, AlertCircle,
} from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
type PdfDoc = any;

const ZOOM_MIN = 0.6;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.2;
/** Batas kerapatan render — 3x di layar HP modern bikin canvas boros memori. */
const DPR_MAX = 2;

const halamanKey = (purchaseId: string) => `ebook-hal:${purchaseId}`;

export interface EbookReaderProps {
  purchaseId: string;
  title: string;
  /** Token sesi Supabase — dipakai route untuk memastikan modul ini memang miliknya. */
  accessToken: string;
  /** Teks cap air, mis. "Rina Dewi · rina@email.com". */
  watermark: string;
  onClose: () => void;
}

export default function EbookReader({
  purchaseId, title, accessToken, watermark, onClose,
}: EbookReaderProps) {
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wadahRef = useRef<HTMLDivElement | null>(null);
  const renderRef = useRef<any>(null);
  const docRef = useRef<PdfDoc | null>(null);

  /* ── muat dokumen ──────────────────────────────────────────────────────── */
  useEffect(() => {
    let hidup = true;
    (async () => {
      try {
        const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
        // Worker disajikan dari domain sendiri (disalin saat postinstall).
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

        const res = await fetch("/api/ebook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ purchaseId, accessToken }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || "Gagal memuat modul");
        }
        const buf = await res.arrayBuffer();
        if (!hidup) return;

        const d = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
        if (!hidup) { d.destroy?.(); return; }

        docRef.current = d;
        setDoc(d);
        setTotal(d.numPages);
        // Lanjut dari halaman terakhir. Disimpan lokal dulu — menambah kolom di
        // digital_purchases perlu ubah skema, dan itu keputusan terpisah.
        const simpanan = Number(localStorage.getItem(halamanKey(purchaseId)) || "1");
        setPage(Number.isFinite(simpanan) ? Math.min(Math.max(1, simpanan), d.numPages) : 1);
      } catch (e: any) {
        if (hidup) setGalat(e?.message || tr("Gagal memuat modul"));
      } finally {
        if (hidup) setMemuat(false);
      }
    })();
    return () => {
      hidup = false;
      renderRef.current?.cancel?.();
      docRef.current?.destroy?.();
      docRef.current = null;
    };
  }, [purchaseId, accessToken]);

  /* ── gambar halaman ────────────────────────────────────────────────────── */
  const gambar = useCallback(async () => {
    const d = docRef.current;
    const canvas = canvasRef.current;
    const wadah = wadahRef.current;
    if (!d || !canvas || !wadah) return;

    // Render sebelumnya dibatalkan dulu — kalau tidak, dua tugas menulis ke
    // canvas yang sama dan halamannya keluar setengah-setengah.
    renderRef.current?.cancel?.();

    const p = await d.getPage(page);
    const dasar = p.getViewport({ scale: 1 });
    const lebarTersedia = Math.max(280, wadah.clientWidth - 24);
    const viewport = p.getViewport({ scale: (lebarTersedia / dasar.width) * zoom });
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);

    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const tugas = p.render({ canvasContext: ctx, viewport });
    renderRef.current = tugas;
    try {
      await tugas.promise;
    } catch (e: any) {
      // Pembatalan itu normal (pindah halaman cepat) — bukan kegagalan.
      if (e?.name !== "RenderingCancelledException") setGalat(tr("Halaman gagal digambar"));
    }
  }, [page, zoom]);

  useEffect(() => { if (doc) gambar(); }, [doc, gambar]);

  // Lebar wadah berubah (putar HP / ubah ukuran jendela) → gambar ulang.
  useEffect(() => {
    if (!doc) return;
    const ro = new ResizeObserver(() => gambar());
    if (wadahRef.current) ro.observe(wadahRef.current);
    return () => ro.disconnect();
  }, [doc, gambar]);

  useEffect(() => {
    if (doc) localStorage.setItem(halamanKey(purchaseId), String(page));
  }, [page, purchaseId, doc]);

  /* ── navigasi ──────────────────────────────────────────────────────────── */
  const ke = useCallback((n: number) => {
    setPage((p) => Math.min(Math.max(1, n), total || 1));
  }, [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === "PageDown") ke(page + 1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") ke(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, ke, onClose]);

  // Kunci gulir latar selama reader terbuka (di HP, halaman di belakang ikut
  // bergeser waktu siswa menggeser halaman modul).
  useEffect(() => {
    const asal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = asal; };
  }, []);

  const sentuh = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    sentuh.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const a = sentuh.current;
    if (!a) return;
    const dx = e.changedTouches[0].clientX - a.x;
    const dy = e.changedTouches[0].clientY - a.y;
    // Geser mendatar yang tegas saja — kalau tidak, gulir vertikal ikut
    // terbaca sebagai pindah halaman waktu membaca halaman yang di-zoom.
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) ke(page + (dx < 0 ? 1 : -1));
    sentuh.current = null;
  };

  const t = useT(); // [ui-lang-switcher-v1]
  const isi = (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/95 backdrop-blur-sm">
      {/* bilah atas */}
      <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-3 py-2.5 sm:px-5">
        <BookOpen className="h-5 w-5 shrink-0 text-[#3ED9C0]" />
        <h2 className="min-w-0 flex-1 truncate text-[14px] font-bold text-white sm:text-[15px]">{title}</h2>
        <div className="hidden items-center gap-1 sm:flex">
          <button
            onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label={t("Perkecil")}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-[12px] font-bold text-white/70">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label={t("Perbesar")}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label={t("Tutup")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* halaman */}
      <div
        ref={wadahRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative flex-1 overflow-auto px-3 py-4 sm:px-6"
      >
        {memuat && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-[#3ED9C0]" />
              <p className="text-[13px] font-semibold text-white/60">{t("Menyiapkan modul…")}</p>
            </div>
          </div>
        )}

        {galat && !memuat && (
          <div className="flex h-full items-center justify-center px-6">
            <div className="max-w-sm text-center">
              <AlertCircle className="mx-auto mb-3 h-8 w-8 text-amber-400" />
              <p className="text-[14px] font-bold text-white">{galat}</p>
              <button
                onClick={onClose}
                className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-[13px] font-bold text-white transition hover:bg-white/20"
              >
                {t("Tutup")}
              </button>
            </div>
          </div>
        )}

        {!galat && (
          <div className="relative mx-auto w-fit">
            {/* Menu klik-kanan dimatikan: "Simpan gambar" di atas canvas adalah
                jalan pintas paling gampang untuk memanen halaman satu per satu. */}
            <canvas
              ref={canvasRef}
              onContextMenu={(e) => e.preventDefault()}
              className="rounded-lg bg-white shadow-2xl"
            />
            {/* cap air — menempel di atas halaman, tak bisa diklik/diseret */}
            {!memuat && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 select-none overflow-hidden rounded-lg"
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <span
                    key={i}
                    className="absolute whitespace-nowrap text-[13px] font-bold uppercase tracking-widest text-slate-900/[0.07]"
                    style={{ top: `${8 + i * 16}%`, left: "-10%", transform: "rotate(-28deg)" }}
                  >
                    {`${watermark}   ·   ${watermark}   ·   ${watermark}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* bilah bawah */}
      {!galat && (
        <div className="flex shrink-0 items-center justify-center gap-3 border-t border-white/10 px-4 py-2.5">
          <button
            onClick={() => ke(page - 1)}
            disabled={page <= 1}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
            aria-label={t("Halaman sebelumnya")}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-[13px] font-bold text-white/80">
            {total ? `${page} / ${total}` : "—"}
          </span>
          <button
            onClick={() => ke(page + 1)}
            disabled={!total || page >= total}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
            aria-label={t("Halaman berikutnya")}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );

  // Portal ke body: kartu perpustakaan berada di dalam wadah ber-overflow,
  // reader fullscreen tidak boleh ikut terpotong olehnya.
  return typeof document !== "undefined" ? createPortal(isi, document.body) : null;
}
