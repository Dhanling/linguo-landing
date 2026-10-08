"use client";

/* [ui-lang-switcher-v1] Pemilih bahasa antarmuka (ID ⇄ EN) untuk dashboard siswa.
   Duduk di pojok kanan atas, persis di kiri lonceng & avatar.
   [ui-lang-switcher-menu-v1] Yang tampil cukup SATU bendera — bahasa yang sedang
   dipakai; pilihan lainnya baru muncul saat diketuk. Bentuk segmented yang lama
   (dua bendera berjajar) memakan tempat di top bar HP yang sudah sesak oleh logo,
   tombol lapor bug, dan lonceng. */

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { RectFlag } from "@/components/RectFlag";
import { setUiLang, useUiLang, useT, type UiLang } from "@/lib/uiLang";

const OPTIONS: { code: UiLang; flag: string; short: string; label: string }[] = [
  { code: "id", flag: "id", short: "ID", label: "Bahasa Indonesia" },
  { code: "en", flag: "gb", short: "EN", label: "Bahasa Inggris" },
];

export default function UiLangSwitcher({
  variant = "light",
  className = "",
}: {
  /** `light` = di atas kanvas putih (top bar /akun); `dark` = di atas sidebar teal. */
  variant?: "light" | "dark";
  className?: string;
}) {
  const lang = useUiLang();
  const t = useT();
  const dark = variant === "dark";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = OPTIONS.find((o) => o.code === lang) ?? OPTIONS[0];

  // tutup saat ketuk di luar / tekan Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t("Bahasa antarmuka")}: ${t(current.label)}`}
        title={t("Bahasa antarmuka")}
        className={`flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-[12.5px] font-extrabold transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16796E]/40 ${
          dark
            ? "bg-white/10 text-white hover:bg-white/15"
            : "bg-white text-[#12172B] shadow-[0_10px_30px_-22px_rgba(18,23,43,0.6)] hover:bg-slate-50"
        }`}
      >
        <RectFlag code={current.flag} h={14} />
        <span className="hidden sm:inline">{current.short}</span>
        <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2.6} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t("Bahasa antarmuka")}
          className="absolute right-0 top-full z-50 mt-2 min-w-[190px] rounded-2xl border border-slate-100 bg-white p-1.5 shadow-[0_18px_40px_-18px_rgba(18,23,43,0.45)]"
        >
          {OPTIONS.map((o) => {
            const on = lang === o.code;
            return (
              <button
                key={o.code}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                onClick={() => {
                  setUiLang(o.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16796E]/40 ${
                  on ? "bg-[#16796E]/10 text-[#16796E]" : "text-[#12172B] hover:bg-slate-100"
                }`}
              >
                <RectFlag code={o.flag} h={14} />
                <span className="flex-1 whitespace-nowrap">{t(o.label)}</span>
                {on && <Check className="h-4 w-4" strokeWidth={2.8} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
