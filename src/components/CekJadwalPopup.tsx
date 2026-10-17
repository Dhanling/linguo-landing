"use client";
// [cek-jadwal-popup-v1] Menu "Cek Jadwal" membuka pop-up pilih jenis kelas (menggantikan halaman /jadwal):
// Private → pilih bahasa → level → tujuan → minat → /jadwal/<bahasa>?level=&tujuan=&minat= · Reguler → /jadwal-kelas-reguler · Test Prep → ?tab=etp.

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Baby, Brain, Briefcase, ChevronLeft, ChevronRight, ClipboardList, Globe, GraduationCap, Heart, Palette, Plane, School, Search, User, X,
} from "lucide-react";
import { GRUP } from "@/app/jadwal/PilihBahasa";
import { useOverlayLock } from "@/lib/overlayStore";
import { FLAG_CODE_BY_SLUG, RectFlag } from "@/components/RectFlag";
import { LANG_CATEGORIES, langNameId, langSlugOf } from "@/lib/funnelRouting";
import { LEVEL_PROFIL, MAKS_MINAT, MINAT, TUJUAN, queryProfil } from "@/lib/profilBelajar";

// [cek-jadwal-profil-v1] Sesudah pilih bahasa: Level → Tujuan → Minat, WAJIB semua (tanpa lewati).
type Langkah = "jenis" | "bahasa" | "level" | "tujuan" | "minat";
const SEBELUM: Record<Langkah, Langkah | null> = { jenis: null, bahasa: "jenis", level: "bahasa", tujuan: "level", minat: "tujuan" };
const IKON_TUJUAN: Record<string, typeof User> = {
  hobi: Palette, traveling: Plane, otak: Brain, ujian: GraduationCap, pindah: Globe, keluarga: Heart, kerja: Briefcase, anak: Baby,
};

function SinyalLevel({ n }: { n: number }) {
  return (
    <span className="flex h-7 items-end gap-[3px] shrink-0" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={`w-[5px] rounded-full ${i < n ? "bg-[#1A9E9E]" : "bg-slate-200"}`} style={{ height: i === 0 ? 5 : 8 + i * 5 }} />
      ))}
    </span>
  );
}

// [cek-jadwal-tab-grup-v1] tab grup bahasa seperti pop-up Placement Test. "Semua" = daftar
// berkelompok (GRUP, tanpa duplikat); tab lain = isi penuh kategorinya (Jepang tetap ada di Asia).
const TAB = ["Semua", ...LANG_CATEGORIES.map((c) => c.label)];

const JENIS = [
  { key: "private", icon: User, title: "Kelas Private 1-on-1", desc: "Lihat jam kosong pengajar 2 minggu ke depan, per bahasa." },
  { key: "reguler", icon: School, title: "Kelas Reguler", desc: "Jadwal batch grup yang sedang dibuka.", href: "/jadwal-kelas-reguler" },
  { key: "etp", icon: ClipboardList, title: "Test Prep TOEFL / IELTS", desc: "Jadwal batch persiapan tes intensif.", href: "/jadwal-kelas-reguler?tab=etp" },
] as const;

export default function CekJadwalPopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [langkah, setLangkah] = useState<Langkah>("jenis");
  const [bahasa, setBahasa] = useState<{ slug: string; nama: string } | null>(null);
  const [level, setLevel] = useState("");
  const [tujuan, setTujuan] = useState("");
  const [minat, setMinat] = useState<string[]>([]);
  const [cari, setCari] = useState("");
  const [tab, setTab] = useState("Semua");
  const input = useRef<HTMLInputElement>(null);
  useOverlayLock(open);

  useEffect(() => {
    if (!open) { setLangkah("jenis"); setCari(""); setTab("Semua"); setBahasa(null); setLevel(""); setTujuan(""); setMinat([]); return; }
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  useEffect(() => { if (langkah === "bahasa") input.current?.focus(); }, [langkah]);

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

  const ke = (href: string) => { window.location.href = href; };
  const pilihBahasa = (l: { slug: string; nama: string }) => { setBahasa(l); setLangkah("level"); };
  const kembali = () => { const s = SEBELUM[langkah]; if (s) { setLangkah(s); if (s === "jenis") setCari(""); } };
  const selesai = () => {
    if (!bahasa || !level || !tujuan || !minat.length) return;
    ke(`/jadwal/${bahasa.slug}?${queryProfil({ level, tujuan, minat })}`);
  };
  const JUDUL: Record<Langkah, [string, string]> = {
    jenis: ["Cek jadwal kelas apa?", "Pilih jenis kelasnya dulu."],
    bahasa: ["Bahasa apa?", "Kelas Private · jam kosong pengajar 2 minggu ke depan."],
    level: ["Level kamu sekarang?", `Bahasa ${bahasa?.nama ?? ""} · biar materinya pas.`],
    tujuan: ["Tujuan utama belajarnya?", `Kenapa belajar Bahasa ${bahasa?.nama ?? ""}?`],
    minat: ["Minat kamu apa saja?", `Biar pengajarnya cocok. Pilih 1–${MAKS_MINAT}.`],
  };
  const lebar = langkah === "minat" || langkah === "tujuan";

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
            className={`fixed z-[80] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] ${lebar ? "max-w-xl" : "max-w-md"} bg-white rounded-3xl shadow-2xl overflow-hidden`}
          >
            <div className="px-6 pt-6 pb-2 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                {langkah !== "jenis" && (
                  <button onClick={kembali} aria-label="Kembali" className="-ml-2 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-gray-900">{JUDUL[langkah][0]}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {JUDUL[langkah][1]}
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
            ) : langkah === "bahasa" ? (
              <div className="pb-3">
                <div className="mx-6 mt-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 focus-within:border-[#1A9E9E]">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    ref={input}
                    value={cari}
                    onChange={(e) => setCari(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && tampil[0]?.langs[0]) pilihBahasa(tampil[0].langs[0]); }}
                    placeholder="Cari bahasa…"
                    className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>
                <div className="mt-3 flex gap-1.5 overflow-x-auto scrollbar-hide px-6 pb-1">
                  {TAB.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={"px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors " +
                        (tab === t ? "bg-[#1A9E9E] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="mt-2 max-h-[55vh] overflow-y-auto overscroll-contain px-2">
                  {tampil.length === 0 && <p className="px-4 py-3 text-sm text-slate-400">Bahasa tidak ditemukan</p>}
                  {tampil.map((g) => (
                    <div key={g.label}>
                      {tab === "Semua" && <p className="px-4 pb-1 pt-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">{g.label}</p>}
                      {g.langs.map((l) => (
                        <button key={l.slug} type="button" onClick={() => pilihBahasa(l)} className="group flex w-full text-left items-center gap-3 rounded-xl px-4 py-2.5 text-base font-semibold text-gray-900 hover:bg-[#1A9E9E]/10 hover:text-[#1A9E9E]">
                          {/* [cek-jadwal-bendera-v2] bendera & teks sebesar daftar Placement Test (h=28, text-base) + zoom saat hover */}
                          <span className="flex items-center gap-3.5 origin-left transition-transform duration-200 ease-out group-hover:scale-105">
                            <RectFlag code={FLAG_CODE_BY_SLUG[l.en.toLowerCase()]} h={28} className="shadow-sm" />
                            <span>{l.nama}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : langkah === "level" ? (
              <div className="px-6 pb-6 pt-2 space-y-2.5 max-h-[70vh] overflow-y-auto overscroll-contain">
                {LEVEL_PROFIL.map((l) => (
                  <button
                    key={l.key}
                    type="button"
                    onClick={() => { setLevel(l.key); setLangkah("tujuan"); }}
                    className={`w-full text-left rounded-2xl border-2 p-4 flex items-center gap-4 transition-all active:scale-[0.99] ${level === l.key ? "border-[#1A9E9E] bg-[#1A9E9E]/5" : "border-gray-100 bg-white hover:border-[#1A9E9E]/50"}`}
                  >
                    <SinyalLevel n={l.bar} />
                    <span className="min-w-0">
                      <span className="block font-bold text-gray-900">{l.title}</span>
                      <span className="block text-sm text-gray-500 mt-0.5">{l.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : langkah === "tujuan" ? (
              <div className="px-6 pb-6 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[70vh] overflow-y-auto overscroll-contain">
                {TUJUAN.map((t) => {
                  const Ikon = IKON_TUJUAN[t.key] ?? User;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => { setTujuan(t.key); setLangkah("minat"); }}
                      className={`text-left rounded-2xl border-2 p-3 flex items-center gap-3 transition-all active:scale-[0.99] ${tujuan === t.key ? "border-[#1A9E9E] bg-[#1A9E9E]/5" : "border-gray-100 bg-white hover:border-[#1A9E9E]/50"}`}
                    >
                      <span className="w-10 h-10 rounded-xl bg-[#1A9E9E]/10 text-[#1A9E9E] flex items-center justify-center shrink-0"><Ikon className="w-5 h-5" /></span>
                      <span className="font-bold text-gray-900 text-sm sm:text-base">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-6 pb-6 pt-2">
                <div className="flex flex-wrap justify-center gap-2 max-h-[52vh] overflow-y-auto overscroll-contain py-1">
                  {MINAT.map((m) => {
                    const on = minat.includes(m.key);
                    const penuh = !on && minat.length >= MAKS_MINAT;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        disabled={penuh}
                        onClick={() => setMinat((x) => (on ? x.filter((k) => k !== m.key) : [...x, m.key]))}
                        className={`rounded-full border-2 px-3.5 py-2 text-sm font-semibold transition-all ${on ? "border-[#1A9E9E] bg-[#1A9E9E]/10 text-[#1A9E9E]" : "border-gray-100 bg-white text-gray-800 hover:border-[#1A9E9E]/50"} ${penuh ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        <span className="mr-1.5">{m.emoji}</span>{m.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-center text-xs text-gray-400">{minat.length}/{MAKS_MINAT} dipilih</p>
                <button
                  type="button"
                  onClick={selesai}
                  disabled={!minat.length}
                  className="mt-3 w-full rounded-2xl bg-[#1A9E9E] py-3.5 text-base font-bold text-white transition-all hover:bg-[#147a7a] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {minat.length ? "Lihat jadwal →" : "Pilih minimal 1 minat"}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
