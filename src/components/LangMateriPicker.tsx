"use client";

/* [produk-digital-per-bahasa-v1]
 * Pemilih bahasa untuk produk e-learning yang isinya banyak bahasa.
 *
 * Paket "12+ Bahasa" itu satu pembelian dengan 12 playlist berbeda. Dulu produk
 * cuma punya satu kolom link, jadi 12 materi itu tak punya tempat dan siswanya
 * mentok di satu link (yang malah masih placeholder). Sekarang tombol "Tonton"
 * membuka daftar ini dulu — bahasa yang playlist-nya belum dipasang admin tidak
 * ikut ditampilkan, biar tak ada tombol yang menuju ke mana-mana.
 *
 * Dipakai bareng: components/akun/LibraryView.tsx & components/PerpustakaanSaya.tsx
 */

import { useEffect } from "react";
import { Play, X } from "lucide-react";
import { FLAG_CODE_BY_SLUG, RectFlag } from "@/components/RectFlag";
import type { ProductLang } from "@/lib/digitalAccess";

export type LangPickerTarget = { title: string; langs: ProductLang[] };

export default function LangMateriPicker({
  target,
  onPick,
  onClose,
}: {
  target: LangPickerTarget | null;
  onPick: (lang: ProductLang) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [target, onClose]);

  if (!target) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Pilih bahasa materi"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-extrabold text-[#12172B]">Pilih bahasa</h3>
            <p className="truncate text-[12px] font-medium text-slate-500">{target.title}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="shrink-0 rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3">
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {target.langs.map((l) => {
              const code = FLAG_CODE_BY_SLUG[l.language.trim().toLowerCase()];
              return (
                <button
                  key={l.id}
                  onClick={() => onPick(l)}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2.5 text-left transition hover:border-[#12A37E]/40 hover:bg-[#12A37E]/5"
                >
                  {code ? (
                    <RectFlag code={code} h={20} />
                  ) : (
                    <span className="h-5 w-7 shrink-0 rounded-[4px] bg-slate-200" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-[#12172B]">
                    {l.language}
                  </span>
                  <Play className="h-4 w-4 shrink-0 text-[#12A37E]" fill="currentColor" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
