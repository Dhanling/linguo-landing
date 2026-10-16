"use client";
// [cek-jadwal-popup-v1] Menu "Cek Jadwal" membuka pop-up pilih jenis kelas (menggantikan halaman /jadwal):
// Private → pilih bahasa → /jadwal/<bahasa> · Reguler → /jadwal-kelas-reguler · Test Prep → ?tab=etp.

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ClipboardList, School, Search, User, X } from "lucide-react";
import { GRUP } from "@/app/jadwal/PilihBahasa";
import { useOverlayLock } from "@/lib/overlayStore";
import { FLAG_CODE_BY_SLUG, RectFlag } from "@/components/RectFlag";

const JENIS = [
  { key: "private", icon: User, title: "Kelas Private 1-on-1", desc: "Lihat jam kosong pengajar 2 minggu ke depan, per bahasa." },
  { key: "reguler", icon: School, title: "Kelas Reguler", desc: "Jadwal batch grup yang sedang dibuka.", href: "/jadwal-kelas-reguler" },
  { key: "etp", icon: ClipboardList, title: "Test Prep TOEFL / IELTS", desc: "Jadwal batch persiapan tes intensif.", href: "/jadwal-kelas-reguler?tab=etp" },
] as const;

export default function CekJadwalPopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [langkah, setLangkah] = useState<"jenis" | "bahasa">("jenis");
  const [cari, setCari] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useOverlayLock(open);

  useEffect(() => {
    if (!open) { setLangkah("jenis"); setCari(""); return; }
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  useEffect(() => { if (langkah === "bahasa") input.current?.focus(); }, [langkah]);

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return GRUP;
    return GRUP.map((g) => ({ ...g, langs: g.langs.filter((l) => l.nama.toLowerCase().includes(q) || l.slug.includes(q)) }))
      .filter((g) => g.langs.length);
  }, [cari]);

  const ke = (href: string) => { window.location.href = href; };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]"
          />
          <motion.div
            role="dialog" aria-modal="true" aria-label="Cek Jadwal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed z-[80] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="px-6 pt-6 pb-2 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                {langkah === "bahasa" && (
                  <button onClick={() => { setLangkah("jenis"); setCari(""); }} aria-label="Kembali" className="-ml-2 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-gray-900">{langkah === "jenis" ? "Cek jadwal kelas apa?" : "Bahasa apa?"}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {langkah === "jenis" ? "Pilih jenis kelasnya dulu." : "Kelas Private · jam kosong pengajar 2 minggu ke depan."}
                  </p>
                </div>
              </div>
              <button onClick={onClose} aria-label="Tutup" className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {langkah === "jenis" ? (
              <div className="px-6 pb-6 pt-2 space-y-3">
                {JENIS.map((j) => (
                  <button
                    key={j.key}
                    onClick={() => ("href" in j ? ke(j.href) : setLangkah("bahasa"))}
                    className="group w-full text-left rounded-2xl border-2 border-gray-200 bg-white p-4 hover:border-[#1A9E9E] hover:bg-[#1A9E9E]/5 transition-all duration-200 active:scale-[0.99] flex items-center gap-3"
                  >
                    <span className="w-10 h-10 rounded-xl bg-[#1A9E9E]/10 text-[#1A9E9E] flex items-center justify-center shrink-0"><j.icon className="w-5 h-5" /></span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-bold text-gray-900">{j.title}</span>
                      <span className="block text-xs text-gray-500 mt-0.5">{j.desc}</span>
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#1A9E9E] shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="pb-3">
                <div className="mx-6 mt-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 focus-within:border-[#1A9E9E]">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    ref={input}
                    value={cari}
                    onChange={(e) => setCari(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && tampil[0]?.langs[0]) ke(`/jadwal/${tampil[0].langs[0].slug}`); }}
                    placeholder="Cari bahasa…"
                    className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>
                <div className="mt-2 max-h-[55vh] overflow-y-auto overscroll-contain px-2">
                  {tampil.length === 0 && <p className="px-4 py-3 text-sm text-slate-400">Bahasa tidak ditemukan</p>}
                  {tampil.map((g) => (
                    <div key={g.label}>
                      <p className="px-4 pb-1 pt-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{g.label}</p>
                      {g.langs.map((l) => (
                        <a key={l.slug} href={`/jadwal/${l.slug}`} className="group flex items-center gap-3 rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-[#1A9E9E]/10 hover:text-[#1A9E9E]">
                          {/* [cek-jadwal-bendera-v1] bendera rounded-rectangle + zoom saat hover */}
                          <span className="flex items-center gap-3 origin-left transition-transform duration-200 ease-out group-hover:scale-110">
                            <RectFlag code={FLAG_CODE_BY_SLUG[l.en.toLowerCase()]} h={18} className="shadow-sm" />
                            <span>{l.nama}</span>
                          </span>
                        </a>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
