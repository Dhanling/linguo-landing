"use client";

// Modal yang muncul saat pengguna gratis mentok kuota simpan kata (FREE_SAVE_LIMIT).
// Tujuannya BUKAN sekadar jual langganan — tapi mengalirkan pengguna gratis Watch &
// Learn ke produk berbayar Linguo yang LTV-nya jauh lebih tinggi & sudah menghasilkan:
//   1) Kelas dengan guru (mulai dari trial gratis — friksi rendah, nilai tertinggi).
//   2) Simulasi TOEFL/IELTS (buat yang belajar Inggris & mau ukur level).
// Nonton tetap gratis; ini murni titik konversi di momen komitmen.

import { GraduationCap, Sparkles, X, ArrowRight, Bookmark } from "lucide-react";
import { FREE_SAVE_LIMIT } from "@/lib/immersionLearn";

const TEAL = "#1A9E9E";
const GOLD = "#F4B740";
const CARD = "#0A1212";
const BORDER = "rgba(255,255,255,0.1)";
const SUB = "rgba(255,255,255,0.55)";

export default function WatchUpsellModal({
  savedCount,
  onClose,
}: {
  savedCount: number;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] rounded-t-3xl p-6 shadow-2xl sm:rounded-3xl"
        style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "rgba(244,183,64,0.16)" }}
          >
            <Bookmark className="h-5 w-5" style={{ color: GOLD }} />
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="shrink-0 opacity-60 hover:opacity-100"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Judul */}
        <h2 className="mt-3 text-[20px] font-extrabold leading-tight text-white">
          Keren — {savedCount} kata tersimpan! 🎉
        </h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: SUB }}>
          Kamu sudah pakai {FREE_SAVE_LIMIT} kata gratis. Kamu jelas serius belajar —
          ini langkah paling ampuh biar cepat bisa:
        </p>

        {/* CTA 1 — Kelas (LTV tertinggi, mulai dari trial gratis) */}
        <a
          href="/kelas-trial"
          className="mt-4 flex items-center gap-3 rounded-2xl p-3.5 transition hover:brightness-110"
          style={{ backgroundColor: TEAL }}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-white">Belajar bareng guru</p>
            <p className="text-[12px] leading-snug text-white/80">
              Coba kelas trial gratis — ngobrol langsung sama pengajar.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-white" />
        </a>

        {/* CTA 2 — Simulasi */}
        <a
          href="/simulasi"
          className="mt-2.5 flex items-center gap-3 rounded-2xl p-3.5 transition hover:brightness-110"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: "rgba(26,158,158,0.18)" }}
          >
            <Sparkles className="h-5 w-5" style={{ color: "#7FE0E0" }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-white">Ukur levelmu</p>
            <p className="text-[12px] leading-snug" style={{ color: SUB }}>
              Simulasi TOEFL/IELTS — tahu posisimu sekarang.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0" style={{ color: SUB }} />
        </a>

        <button
          onClick={onClose}
          className="mt-4 w-full text-center text-[13px] font-semibold"
          style={{ color: SUB }}
        >
          Nanti aja, lanjut nonton
        </button>
      </div>
    </div>
  );
}
