"use client";
// [jadwal-blok-v1] Dropdown pilih bahasa untuk /jadwal — dipilih dulu, baru pindah ke
// kalender /jadwal/<bahasa>. Dipakai juga di halaman kalender untuk ganti bahasa.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Search } from "lucide-react";
import { LANG_CATEGORIES, langNameId, langSlugOf } from "@/lib/funnelRouting";

// Populer di atas, kategori lain tanpa mengulang bahasa yang sudah tampil.
export const GRUP = (() => {
  const sudah = new Set<string>();
  return LANG_CATEGORIES.map((c) => {
    const langs = c.langs.filter((l) => !sudah.has(l));
    langs.forEach((l) => sudah.add(l));
    return { label: c.label, langs: langs.map((l) => ({ slug: langSlugOf(l), nama: langNameId(l) })) };
  }).filter((g) => g.langs.length);
})();

export default function PilihBahasa({ current, kecil = false }: { current?: string; kecil?: boolean }) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [cari, setCari] = useState("");
  const kotak = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const namaKini = GRUP.flatMap((g) => g.langs).find((l) => l.slug === current)?.nama;

  useEffect(() => {
    if (!buka) return;
    input.current?.focus();
    const tutup = (e: MouseEvent) => { if (!kotak.current?.contains(e.target as Node)) setBuka(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setBuka(false); };
    document.addEventListener("mousedown", tutup);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", tutup); document.removeEventListener("keydown", esc); };
  }, [buka]);

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return GRUP;
    return GRUP.map((g) => ({ ...g, langs: g.langs.filter((l) => l.nama.toLowerCase().includes(q) || l.slug.includes(q)) }))
      .filter((g) => g.langs.length);
  }, [cari]);

  const pilih = (slug: string) => {
    setBuka(false);
    setCari("");
    if (slug !== current) router.push(`/jadwal/${slug}`);
  };

  return (
    <div ref={kotak} className={`relative ${kecil ? "" : "w-full max-w-md"}`}>
      <button
        type="button"
        onClick={() => setBuka((b) => !b)}
        aria-haspopup="listbox"
        aria-expanded={buka}
        className={kecil
          ? "inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-[#1A9E9E] hover:text-[#1A9E9E]"
          : "flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left text-base font-semibold text-slate-800 shadow-sm hover:border-[#1A9E9E]"}
      >
        <span className={namaKini || kecil ? "" : "text-slate-400"}>
          {kecil ? "Ganti bahasa" : namaKini ? `Bahasa ${namaKini}` : "Pilih bahasa…"}
        </span>
        <ChevronDown className={`${kecil ? "h-3.5 w-3.5" : "h-5 w-5"} text-slate-400 transition-transform ${buka ? "rotate-180" : ""}`} />
      </button>

      {buka && (
        <div className={`absolute z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ${kecil ? "right-0" : "left-0 sm:w-full"}`}>
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              ref={input}
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && tampil[0]?.langs[0]) pilih(tampil[0].langs[0].slug); }}
              placeholder="Cari bahasa…"
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>
          <div role="listbox" className="max-h-80 overflow-y-auto py-1">
            {tampil.length === 0 && <p className="px-4 py-3 text-sm text-slate-400">Bahasa tidak ditemukan</p>}
            {tampil.map((g) => (
              <div key={g.label}>
                <p className="px-4 pb-1 pt-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{g.label}</p>
                {g.langs.map((l) => (
                  <button
                    key={l.slug}
                    type="button"
                    role="option"
                    aria-selected={l.slug === current}
                    onClick={() => pilih(l.slug)}
                    className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-[#1A9E9E]/10 ${l.slug === current ? "font-bold text-[#1A9E9E]" : "text-slate-700"}`}
                  >
                    {l.nama}
                    {l.slug === current && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
