'use client';

// [materi-slide-v1] Penonton slide materi kelas — sisi SISWA.
//
// ⚠️ SALINAN dari linguo-admin-dashboard/src/components/materi/SlideDeckViewer.tsx.
// Pengajar menyusun deknya di sana, siswa menontonnya di sini, dan keduanya
// membaca baris `class_materials` yang sama. Kalau tata letak satu jenis slide
// diubah di repo dashboard, salin lagi ke sini — kalau tidak, materi yang sama
// tampil beda antara yang diajarkan pengajar dan yang dibuka siswa.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft, ChevronRight, X, Maximize2, Minimize2, Eye, EyeOff,
} from "lucide-react";
import type { MateriSlide } from "@/lib/materiSlides";

const TEAL = "#1A9E9E";

/* ── Isi satu slide ──────────────────────────────────────────────────────── */

export function SlideBody({ s }: { s: MateriSlide }) {
  if (s.type === "title") {
    return (
      <div className="flex h-full flex-col items-center justify-center px-[6%] text-center">
        <h2 className="text-[clamp(1.4rem,3.6cqw,2.6rem)] font-extrabold leading-tight text-gray-900">{s.heading}</h2>
        {s.subheading && <p className="mt-3 text-[clamp(0.8rem,1.7cqw,1.15rem)] text-gray-500">{s.subheading}</p>}
        {s.note && (
          <p className="mt-5 rounded-xl bg-teal-50 px-4 py-2 text-[clamp(0.7rem,1.4cqw,0.95rem)] font-medium" style={{ color: TEAL }}>
            {s.note}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col px-[6%] py-[5%]">
      <h3 className="shrink-0 text-[clamp(1rem,2.4cqw,1.7rem)] font-extrabold leading-snug text-gray-900">{s.heading}</h3>
      {s.subheading && <p className="mt-1 shrink-0 text-[clamp(0.68rem,1.4cqw,0.95rem)] text-gray-500">{s.subheading}</p>}

      <div className="mt-[3%] min-h-0 flex-1 overflow-y-auto pr-1 text-[clamp(0.7rem,1.5cqw,1.05rem)]">
        {s.type === "vocab" && (
          <ul className="space-y-[2.5%]">
            {(s.items || []).map((it, i) => (
              <li key={i} className="rounded-xl bg-gray-50 px-[3%] py-[2%]">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-bold text-gray-900">{it.term}</span>
                  {it.translit && <span className="text-gray-400">/{it.translit}/</span>}
                  <span className="text-gray-600">— {it.meaning}</span>
                </div>
                {it.example && (
                  <div className="mt-1 border-l-2 pl-2 text-[0.92em] italic text-gray-500" style={{ borderColor: TEAL }}>
                    {it.example}
                    {it.example_meaning && <span className="not-italic text-gray-400"> ({it.example_meaning})</span>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {s.type === "pattern" && (
          <div className="space-y-[3%]">
            {s.pattern && (
              <div className="rounded-xl px-[3%] py-[2.5%] text-center font-bold text-white" style={{ background: TEAL }}>
                {s.pattern}
              </div>
            )}
            <ul className="space-y-[2%]">
              {(s.examples || []).map((e, i) => (
                <li key={i} className="rounded-xl bg-gray-50 px-[3%] py-[2%]">
                  <div className="font-semibold text-gray-900">{e.target}</div>
                  {e.meaning && <div className="text-gray-500">{e.meaning}</div>}
                </li>
              ))}
            </ul>
            {s.note && <p className="rounded-xl bg-amber-50 px-[3%] py-[2%] text-amber-800">{s.note}</p>}
          </div>
        )}

        {(s.type === "points" || s.type === "recap") && (
          <ul className="space-y-[2.5%]">
            {(s.points || []).map((p, i) => (
              <li key={i} className="flex gap-2.5 text-gray-700">
                <span className="mt-[0.55em] h-[0.4em] w-[0.4em] shrink-0 rounded-full" style={{ background: TEAL }} />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        )}

        {s.type === "practice" && (
          <ol className="space-y-[2.5%]">
            {(s.questions || []).map((q, i) => (
              <li key={i} className="flex gap-2.5 text-gray-700">
                <span className="shrink-0 font-bold" style={{ color: TEAL }}>{i + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {s.type === "recap" && s.homework && (
        <div className="mt-[3%] shrink-0 rounded-xl bg-teal-50 px-[3%] py-[2%] text-[clamp(0.68rem,1.4cqw,0.95rem)]">
          <span className="font-bold" style={{ color: TEAL }}>PR: </span>
          <span className="text-gray-700">{s.homework}</span>
        </div>
      )}
    </div>
  );
}

/** Panel kunci jawaban — sengaja terpisah supaya bisa disembunyikan saat mengajar. */
function KunciJawaban({ s }: { s: MateriSlide }) {
  const jawab = (s.answers || []).filter(Boolean);
  if (s.type !== "practice" || !jawab.length) return null;
  return (
    <div className="border-t border-gray-200 bg-gray-50 px-[6%] py-[2.5%] text-[clamp(0.62rem,1.25cqw,0.85rem)]">
      <div className="mb-1 font-bold text-gray-500">Kunci jawaban</div>
      <ol className="flex flex-wrap gap-x-4 gap-y-1">
        {jawab.map((a, i) => (
          <li key={i} className="text-gray-700"><span className="font-semibold">{i + 1}.</span> {a}</li>
        ))}
      </ol>
    </div>
  );
}

/* ── Kartu slide 16:9 ────────────────────────────────────────────────────── */

export function SlideCard({ s, showAnswers, className = "" }: { s: MateriSlide; showAnswers?: boolean; className?: string }) {
  return (
    // `container-type: size` bikin clamp(...cqw) menskala ikut LEBAR KARTU, bukan
    // lebar layar — itu yang bikin teks slide ikut membesar saat fullscreen.
    <div className={`flex flex-col overflow-hidden bg-white text-left ${className}`} style={{ containerType: "size" }}>
      <div className="min-h-0 flex-1"><SlideBody s={s} /></div>
      {showAnswers && <KunciJawaban s={s} />}
    </div>
  );
}

/* ── Slideshow ───────────────────────────────────────────────────────────── */

export function SlideDeckViewer({
  slides, title, subtitle, onClose,
}: {
  slides: MateriSlide[];
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  const [i, setI] = useState(0);
  const [fs, setFs] = useState(false);
  const [kunci, setKunci] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sentuh = useRef<number | null>(null);

  const total = slides.length;
  const maju = useCallback(() => setI((c) => Math.min(c + 1, total - 1)), [total]);
  const mundur = useCallback(() => setI((c) => Math.max(c - 1, 0)), []);

  /* Fullscreen ASLI (Fullscreen API), bukan sekadar kartu dibesarkan: pengajar
     memakai ini sambil share screen, jadi bilah browser harus benar-benar hilang. */
  const toggleFs = useCallback(async () => {
    const el = wrapRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch {
      // Safari/iOS kadang menolak tanpa gestur langsung — biarkan mode jendela.
    }
  }, []);

  useEffect(() => {
    const sync = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); maju(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); mundur(); }
      else if (e.key === "f" || e.key === "F") toggleFs();
      // Saat fullscreen, Esc dipakai browser untuk keluar fullscreen dulu —
      // jangan sekalian menutup slideshow-nya.
      else if (e.key === "Escape" && !document.fullscreenElement) onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [maju, mundur, toggleFs, onClose]);

  const s = slides[i];
  if (!s) return null;

  return (
    <div
      ref={wrapRef}
      className="fixed inset-0 z-[120] flex flex-col bg-gray-950"
      onTouchStart={(e) => { sentuh.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (sentuh.current == null) return;
        const d = e.changedTouches[0].clientX - sentuh.current;
        if (Math.abs(d) > 50) (d < 0 ? maju : mundur)();
        sentuh.current = null;
      }}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-800 bg-gray-900/80 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white" style={{ background: TEAL }}>L</span>
          <span className="truncate text-sm font-semibold text-white/90">{title}</span>
          {subtitle && <span className="hidden truncate text-xs text-gray-400 sm:inline">· {subtitle}</span>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {s.type === "practice" && (
            <button onClick={() => setKunci((k) => !k)} title={kunci ? "Sembunyikan kunci jawaban" : "Tampilkan kunci jawaban"}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-800 hover:text-white">
              {kunci ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
          <span className="px-1 text-xs tabular-nums text-gray-500">{i + 1} / {total}</span>
          <button onClick={toggleFs} title={fs ? "Keluar layar penuh (F)" : "Layar penuh (F)"}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-800 hover:text-white">
            {fs ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button onClick={onClose} title="Tutup" className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-800 hover:text-white">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center p-3 sm:p-6">
        <button onClick={mundur} disabled={i === 0} aria-label="Slide sebelumnya"
          className="absolute left-2 z-10 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20 disabled:opacity-20 sm:left-4 sm:p-3">
          <ChevronLeft size={22} />
        </button>
        <SlideCard s={s} showAnswers={kunci} className="aspect-[16/9] max-h-full w-full max-w-[min(1100px,92vw)] rounded-2xl shadow-2xl" />
        <button onClick={maju} disabled={i === total - 1} aria-label="Slide berikutnya"
          className="absolute right-2 z-10 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20 disabled:opacity-20 sm:right-4 sm:p-3">
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-center gap-1.5 bg-gray-900/80 py-3">
        {slides.map((_, n) => (
          <button key={n} onClick={() => setI(n)} aria-label={`Slide ${n + 1}`}
            className={`rounded-full transition-all ${n === i ? "h-2 w-6" : "h-2 w-2 bg-gray-600 hover:bg-gray-500"}`}
            style={n === i ? { background: TEAL } : undefined} />
        ))}
      </div>
    </div>
  );
}
