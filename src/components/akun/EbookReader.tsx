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
/** Sisa ruang di sekeliling halaman (px) — dipakai menghitung skala muat-penuh. */
const PADDING_X = 36;
const PADDING_Y = 36;

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
  /** [ebook-reader-serial-v1] nomor giliran render — hasil render basi dibuang. */
  const giliranRef = useRef(0);
  /** Antrean render: satu-satunya jalan menuju canvas, dijaga berurutan. */
  const rantaiRef = useRef<Promise<void>>(Promise.resolve());
  /** Ukuran wadah terakhir; ResizeObserver cuma menggambar ulang kalau benar berubah. */
  const ukuranRef = useRef({ w: 0, h: 0 });

  /* ── muat dokumen ──────────────────────────────────────────────────────── */
  useEffect(() => {
    let hidup = true;
    (async () => {
      try {
        // [ebook-reader-paralel-v1] Dulu berurutan: tunggu bundel pdf.js kelar
        // diunduh DULU, baru mulai meminta berkasnya. Dua penantian itu tidak
        // saling bergantung, jadi sekarang jalan barengan — waktu tunggu
        // "Menyiapkan modul…" tinggal yang paling lama, bukan jumlah keduanya.
        const [pdfjs, res] = await Promise.all([
          import("pdfjs-dist/legacy/build/pdf.mjs") as Promise<any>,
          fetch("/api/ebook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ purchaseId, accessToken }),
          }),
        ]);
        // Worker disajikan dari domain sendiri (disalin saat postinstall).
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

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
  // [ebook-reader-fit-v1] Skala dasar = MUAT SATU HALAMAN PENUH di layar
  // (lebar DAN tinggi), bukan cuma pas lebar. Dulu halaman selalu direntang
  // selebar wadah, jadi di desktop yang lebar tiap halaman jadi jangkung dan
  // wajib digulir ke bawah untuk melihat bagian bawahnya — membaca modul 40
  // halaman berarti menggulir 40 kali. Sekarang zoom 100% = satu halaman utuh;
  // tombol +/- tetap bekerja di atas skala itu (>100% baru muncul gulir).
  const gambarSekali = useCallback(async (giliran: number) => {
    const d = docRef.current;
    const canvas = canvasRef.current;
    const wadah = wadahRef.current;
    if (!d || !canvas || !wadah) return;

    const p = await d.getPage(page);
    if (giliran !== giliranRef.current) return;

    const dasar = p.getViewport({ scale: 1 });
    const lebarTersedia = Math.max(240, wadah.clientWidth - PADDING_X);
    const tinggiTersedia = Math.max(240, wadah.clientHeight - PADDING_Y);
    const skalaMuat = Math.min(lebarTersedia / dasar.width, tinggiTersedia / dasar.height);
    const viewport = p.getViewport({ scale: skalaMuat * zoom });
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
      if (giliran === giliranRef.current) setGalat(null);
    } catch (e: any) {
      // Pembatalan itu normal (pindah halaman cepat) — bukan kegagalan.
      if (e?.name !== "RenderingCancelledException" && giliran === giliranRef.current) {
        setGalat(tr("Halaman gagal digambar"));
      }
    } finally {
      if (renderRef.current === tugas) renderRef.current = null;
    }
  }, [page, zoom]);

  /* [ebook-reader-serial-v1] Semua permintaan menggambar lewat SATU antrean.
     pdf.js v5 melempar "Cannot use the same canvas during multiple render()
     operations" begitu dua render menyentuh canvas yang sama — itulah layar
     "Halaman gagal digambar" yang muncul persis saat reader dibuka: efek muat
     dokumen dan ResizeObserver menembak berbarengan.

     ⚠️ Menjaga `renderRef` saja TIDAK cukup (sudah dicoba dan tetap gagal):
     pemanggil kedua sampai di sini sebelum pemanggil pertama sempat mencatat
     tugasnya — di antaranya ada `await d.getPage()`. Yang benar-benar menjamin
     tidak tumpang tindih cuma rantai promise ini. Tugas yang sedang jalan tetap
     di-cancel dulu supaya antrean cepat maju waktu halaman dibalik cepat-cepat. */
  const gambar = useCallback(() => {
    const giliran = ++giliranRef.current;
    renderRef.current?.cancel?.();
    rantaiRef.current = rantaiRef.current
      .catch(() => {})
      .then(() => gambarSekali(giliran));
    return rantaiRef.current;
  }, [gambarSekali]);

  useEffect(() => { if (doc) gambar(); }, [doc, gambar]);

  // Ukuran wadah berubah (putar HP / ubah ukuran jendela) → gambar ulang.
  // ⚠️ Wajib pakai rem: waktu zoom > 100% batang gulir muncul, itu MENGUBAH
  // clientWidth wadah → ResizeObserver menembak lagi → render tanpa henti.
  // Selisih di bawah 4px dianggap goyangan, bukan perubahan ukuran.
  useEffect(() => {
    if (!doc) return;
    const ro = new ResizeObserver(() => {
      const w = wadahRef.current;
      if (!w) return;
      const { w: lw, h: lh } = ukuranRef.current;
      if (Math.abs(w.clientWidth - lw) < 4 && Math.abs(w.clientHeight - lh) < 4) return;
      ukuranRef.current = { w: w.clientWidth, h: w.clientHeight };
      gambar();
    });
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
      // Jangan bajak tombol panah waktu siswa sedang mengetik di suatu tempat.
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.key === "Escape") { onClose(); return; }
      // preventDefault: tanpa ini panah & spasi JUGA menggulir wadah halaman,
      // jadi terasa "pindah halamannya nyangkut" padahal cuma ikut tergulir.
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault(); ke(page + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp" || e.key === "Backspace") {
        e.preventDefault(); ke(page - 1);
      } else if (e.key === "Home") {
        e.preventDefault(); ke(1);
      } else if (e.key === "End") {
        e.preventDefault(); ke(total || 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, total, ke, onClose]);

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
        className="relative flex flex-1 overflow-auto p-4"
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

        {/* m-auto (bukan justify-center): waktu halaman lebih besar dari wadah
            — zoom > 100% — margin auto tetap menyisakan sisi kiri/atas yang
            bisa digulir, sementara justify-center memotongnya. */}
        {!galat && (
          <div className="relative m-auto w-fit">
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
