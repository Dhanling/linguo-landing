"use client";
// [jadwal-blok-v1] Dropdown pilih bahasa untuk /jadwal — dipilih dulu, baru pindah ke
// kalender /jadwal/<bahasa>. GRUP dipakai juga oleh pop-up "Cek Jadwal".

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useOverlayLock } from "@/lib/overlayStore";
import { FLAG_CODE_BY_SLUG, RectFlag } from "@/components/RectFlag";
import { LANG_CATEGORIES, langNameId, langSlugOf } from "@/lib/funnelRouting";

// Populer di atas, kategori lain tanpa mengulang bahasa yang sudah tampil.
export const GRUP = (() => {
  const sudah = new Set<string>();
  return LANG_CATEGORIES.map((c) => {
    const langs = c.langs.filter((l) => !sudah.has(l));
    langs.forEach((l) => sudah.add(l));
    return { label: c.label, langs: langs.map((l) => ({ slug: langSlugOf(l), nama: langNameId(l), en: l })) };
  }).filter((g) => g.langs.length);
})();

const TAB = ["Semua", ...LANG_CATEGORIES.map((c) => c.label)];

// [jadwal-ganti-bahasa-popup-v1] Tombol "Ganti bahasa" di bawah judul /jadwal/<bahasa> → pop-up
// tengah layar berisi bendera rounded + tab grup, seperti langkah bahasa di pop-up "Cek Jadwal".
// Ganti bahasa membawa query profil (?level=&tujuan=&minat=) yang sudah ada.
export default function PilihBahasa({ current }: { current?: string }) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [cari, setCari] = useState("");
  const [tab, setTab] = useState("Semua");
  const input = useRef<HTMLInputElement>(null);
  useOverlayLock(buka);

  const kini = GRUP.flatMap((g) => g.langs).find((l) => l.slug === current);

  useEffect(() => {
    if (!buka) { setCari(""); setTab("Semua"); return; }
    input.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setBuka(false); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [buka]);

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    const kat = LANG_CATEGORIES.find((c) => c.label === tab);
    const basis = kat
      ? [{ label: kat.label, langs: kat.langs.map((l) => ({ slug: langSlugOf(l), nama: langNameId(l), en: l })) }]
      : GRUP;
    if (!q) return basis;
    return basis.map((g) => ({ ...g, langs: g.langs.filter((l) => l.nama.toLowerCase().includes(q) || l.slug.includes(q)) }))
      .filter((g) => g.langs.length);
  }, [cari, tab]);

  const pilih = (slug: string) => {
    setBuka(false);
    if (slug !== current) router.push(`/jadwal/${slug}${window.location.search}`);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setBuka(true)}
        aria-haspopup="dialog"
        className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-[#1A9E9E] hover:text-[#1A9E9E]"
      >
        {kini && <RectFlag code={FLAG_CODE_BY_SLUG[kini.en.toLowerCase()]} h={20} />}
        Ganti bahasa
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      <AnimatePresence>
        {buka && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setBuka(false)}
              className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              role="dialog" aria-modal="true" aria-label="Ganti bahasa"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 z-[80] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3 px-6 pb-2 pt-6">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-gray-900">Ganti bahasa</h2>
                  <p className="mt-0.5 text-sm text-gray-500">Kelas Private · jam kosong pengajar per minggu.</p>
                </div>
                <button onClick={() => setBuka(false)} aria-label="Tutup" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="pb-3">
                <div className="mx-6 mt-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 focus-within:border-[#1A9E9E]">
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
                <div className="scrollbar-hide mt-3 flex gap-1.5 overflow-x-auto px-6 pb-1">
                  {TAB.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={"whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors " +
                        (tab === t ? "bg-[#1A9E9E] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div role="listbox" className="mt-2 max-h-[55vh] overflow-y-auto overscroll-contain px-2">
                  {tampil.length === 0 && <p className="px-4 py-3 text-sm text-slate-400">Bahasa tidak ditemukan</p>}
                  {tampil.map((g) => (
                    <div key={g.label}>
                      {tab === "Semua" && <p className="px-4 pb-1 pt-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">{g.label}</p>}
                      {g.langs.map((l) => {
                        const aktif = l.slug === current;
                        return (
                          <button
                            key={l.slug}
                            type="button"
                            role="option"
                            aria-selected={aktif}
                            onClick={() => pilih(l.slug)}
                            className={`group flex w-full items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-left text-base font-semibold hover:bg-[#1A9E9E]/10 hover:text-[#1A9E9E] ${aktif ? "bg-[#1A9E9E]/5 text-[#1A9E9E]" : "text-gray-900"}`}
                          >
                            <span className="flex origin-left items-center gap-3.5 transition-transform duration-200 ease-out group-hover:scale-105">
                              <RectFlag code={FLAG_CODE_BY_SLUG[l.en.toLowerCase()]} h={28} className="shadow-sm" />
                              <span>{l.nama}</span>
                            </span>
                            {aktif && <Check className="h-5 w-5 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
