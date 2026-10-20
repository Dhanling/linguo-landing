"use client";
// =============================================================================
// [daftar-page-funnel-v1] Langkah 1 — pilih bahasa.
//
// Halaman ini DIINDEKS, jadi daftar bahasanya wajib berupa <a href> yang ada di
// HTML (bukan tombol router.push): itu satu-satunya cara crawler menemukan 60+
// halaman /daftar/<bahasa>. Pencarian & tab kategori hanya menyaring tampilan;
// tautannya tetap nyata. Jangan pakai useSearchParams di sini — lihat ui.tsx.
// =============================================================================

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { RectFlag } from "@/components/RectFlag";
import { REGULER_LANGS } from "@/lib/programLanguages";
import { useOpenRegulerLangs } from "@/lib/useOpenRegulerLangs";
import { SEMI_PRIVATE_MIN, SEMI_PRIVATE_MAX } from "@/lib/trial-pricing";
import { regulerLangName } from "@/lib/classLanguage";
import {
  LANG_CATEGORIES,
  langNameId,
  langSlugOf,
  programsForLang,
  type ProgramSlug,
} from "@/lib/funnelRouting";
import { Card, getFlagCode, useQueryHints } from "./ui";

export default function StepLang() {
  const hints = useQueryHints();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Populer");

  // Masuk lewat menu "Kelas Reguler" → cuma bahasa yang punya batch reguler.
  const regulerOnly = hints.program === "reguler";
  // [semi-private-mekanisme-grup-v1] Masuk lewat menu "Semi Private" → mekanisme
  // pembentukan grup dijelaskan SEBELUM bahasa dipilih. Banyak calon siswa mengira
  // Linguo yang mengumpulkan beberapa pendaftar jadi satu grup kecil; kalau salah
  // pahamnya baru ketahuan di percakapan WhatsApp setelah bayar, itu sudah telat.
  const semiPrivateEntry = hints.program === "semi-private";

  // [reguler-buka-dari-batch-v1] hanya bahasa yang batch regulernya sedang dibuka.
  const openReguler = useOpenRegulerLangs();
  const pool = useMemo(() => {
    if (regulerOnly) return openReguler ? REGULER_LANGS.filter((l) => openReguler.includes(l)) : REGULER_LANGS;
    if (search.trim()) return [...new Set(LANG_CATEGORIES.flatMap((c) => c.langs))];
    return LANG_CATEGORIES.find((c) => c.label === activeTab)?.langs || [];
  }, [regulerOnly, search, activeTab, openReguler]);

  const filtered = search.trim()
    ? pool.filter((l) => l.toLowerCase().includes(search.toLowerCase()) || langNameId(l).toLowerCase().includes(search.toLowerCase()))
    : pool;

  // Program & level yang sudah diketahui ikut menempel di tautan SESUDAH hidrasi
  // — HTML awalnya tetap tautan bersih /daftar/<bahasa> supaya bisa dirayapi.
  const hrefFor = (langEn: string) => {
    const base = `/daftar/${langSlugOf(langEn)}`;
    const prog =
      hints.program && programsForLang(langEn).includes(hints.program as ProgramSlug)
        ? `/${hints.program}`
        : "";
    const level = hints.level ? `?level=${encodeURIComponent(hints.level)}` : "";
    return base + prog + level;
  };

  return (
    <Card>
      <h1 className="text-2xl font-extrabold text-slate-900">Mau belajar bahasa apa?</h1>
      <p className="mt-1 text-sm text-slate-500">
        {regulerOnly
          ? "Bahasa yang punya jadwal Kelas Reguler"
          : semiPrivateEntry
          ? "Pilih bahasa untuk kelas Semi-Private grup kecilmu."
          : "Pilih bahasa yang kamu minati — 60+ bahasa, pengajar bersertifikat, kelas mulai dari Rp 90.000/sesi."}
      </p>

      {semiPrivateEntry && (
        <div className="mt-4 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900">💡 Info Semi-Private</p>
          <p className="mt-1 text-[12px] leading-relaxed text-amber-900/90">
            Program Semi-Private diperuntukkan bagi kamu yang <b>sudah memiliki anggota grup sendiri</b>,
            seperti teman, keluarga, atau rekan kerja yang ingin belajar bersama.{" "}
            <b>Linguo tidak mengumpulkan siswa</b> dari pendaftar lain untuk membentuk grup.
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-amber-900/90">
            Satu grup berisi <b>{SEMI_PRIVATE_MIN}–{SEMI_PRIVATE_MAX} orang</b>, dan tiap anggota mendaftar
            serta membayar porsinya masing-masing lewat halaman ini. Belum punya teman belajar?{" "}
            <Link href="/daftar?program=private" className="font-semibold underline">
              Kelas Private 1-on-1
            </Link>{" "}
            mungkin lebih cocok.
          </p>
        </div>
      )}

      <div className="relative mt-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari bahasa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Cari bahasa"
          className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm focus:border-[#1A9E9E] focus:outline-none focus:ring-2 focus:ring-[#1A9E9E]/20"
        />
      </div>

      {!search.trim() && !regulerOnly && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {LANG_CATEGORIES.map((c) => (
            <button
              key={c.label}
              onClick={() => setActiveTab(c.label)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${activeTab === c.label ? "bg-[#1A9E9E] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Pilihan bahasa digulir di dalam kotak supaya kartu tidak memanjang ke bawah. */}
      <div className="mt-4 grid max-h-[22rem] grid-cols-2 gap-2 overflow-y-auto overscroll-contain pr-1 sm:grid-cols-3">
        {filtered.map((l) => (
          <Link
            key={l}
            href={hrefFor(l)}
            className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition-all hover:border-[#1A9E9E]/30 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E]"
          >
            <RectFlag code={getFlagCode(l)} h={22} />
            {regulerOnly ? regulerLangName(l) : langNameId(l)}
          </Link>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        Belum tahu levelmu?{" "}
        <Link href="/silabus/english/coba" className="font-semibold text-[#1A9E9E] hover:underline">
          Ambil tes penempatan gratis
        </Link>{" "}
        dulu — hasilnya langsung terpakai di formulir ini.
      </p>
    </Card>
  );
}
