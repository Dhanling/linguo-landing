"use client";

/* [ui-lang-switcher-v1] Pemilih bahasa antarmuka (ID ⇄ EN) untuk dashboard siswa.
   Duduk di pojok kanan atas, persis di kiri lonceng & avatar. Bentuknya segmented
   (dua pilihan terlihat sekaligus) — bukan dropdown: cuma ada dua bahasa, jadi
   menyembunyikan salah satunya di balik satu klik tambahan tak ada untungnya.
   Di layar sempit teksnya disembunyikan, benderanya saja yang tinggal. */

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

  return (
    <div
      role="group"
      aria-label={t("Bahasa antarmuka")}
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-2xl p-1 ${
        dark ? "bg-white/10" : "bg-white shadow-[0_10px_30px_-22px_rgba(18,23,43,0.6)]"
      } ${className}`}
    >
      {OPTIONS.map((o) => {
        const on = lang === o.code;
        return (
          <button
            key={o.code}
            type="button"
            onClick={() => setUiLang(o.code)}
            aria-pressed={on}
            title={t(o.label)}
            className={`flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-[12.5px] font-extrabold transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16796E]/40 ${
              on
                ? dark
                  ? "bg-white text-[#16796E]"
                  : "bg-[#16796E] text-white"
                : dark
                  ? "text-white/70 hover:bg-white/10 hover:text-white"
                  : "text-[#6B7280] hover:bg-slate-100 hover:text-[#12172B]"
            }`}
          >
            <RectFlag code={o.flag} h={14} />
            <span className="hidden sm:inline">{o.short}</span>
          </button>
        );
      })}
    </div>
  );
}
