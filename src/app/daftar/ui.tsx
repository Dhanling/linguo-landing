"use client";
// =============================================================================
// [daftar-page-funnel-v1]
// Potongan UI bersama halaman /daftar.
//
// Catatan penting: file ini SENGAJA tidak memakai useSearchParams. Begitu ada
// komponen di pohon halaman yang memakainya, Next berhenti memprarender pohon
// itu dan yang masuk HTML statis cuma fallback Suspense-nya — langkah 1 & 2
// (satu-satunya yang diindeks) jadi halaman kosong di mata crawler. Kebutuhan
// query di langkah itu dibaca dari window.location SETELAH hidrasi (lihat
// useQueryHints), jadi HTML-nya tetap berisi tautan asli.
// =============================================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { RectFlag } from "@/components/RectFlag";
import { buildFunnelPath, langNameId, type ProgramSlug } from "@/lib/funnelRouting";

// Bendera: nama bahasa Inggris funnel → kode negara ISO-2.
const FLAG_CODES: Record<string, string> = {
  English:"gb",Japanese:"jp",Korean:"kr",Mandarin:"cn",Arabic:"sa",French:"fr",German:"de",Spanish:"es",Italian:"it",Dutch:"nl",Portuguese:"br",Russian:"ru",Thai:"th",Vietnamese:"vn",Hindi:"in",Turkish:"tr",Polish:"pl",Swedish:"se",Norwegian:"no",Danish:"dk",Finnish:"fi",Greek:"gr",Czech:"cz",Hungarian:"hu",Hebrew:"il",Persian:"ir",Swahili:"ke",Tagalog:"ph",Malay:"my",Georgian:"ge",Javanese:"id",Sundanese:"id",Betawi:"id",BIPA:"id",Urdu:"pk",Bengali:"bd",Romanian:"ro",
  Icelandic:"is",Bulgarian:"bg",Ukrainian:"ua",Khmer:"kh",Lao:"la",Burmese:"mm",Cantonese:"hk",Balinese:"id",Batak:"id",Bugis:"id",Madurese:"id",
};
export const getFlagCode = (name: string) => FLAG_CODES[name] || "un";

export const fmtRp = (n: number) => "Rp " + n.toLocaleString("id-ID");

/**
 * Petunjuk dari query yang tidak boleh ikut menentukan HTML awal:
 *  - `program`: dibawa menu Program di navbar (/daftar?program=private)
 *  - `level`  : dibawa hasil tes penempatan (/daftar/korea?level=A2)
 * Dibaca sesudah hidrasi supaya halaman tetap bisa diprarender.
 */
export function useQueryHints() {
  const [hints, setHints] = useState<{ program: string; level: string }>({ program: "", level: "" });
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setHints({ program: q.get("program") || "", level: (q.get("level") || "").toUpperCase() });
  }, []);
  return hints;
}

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8"
    >
      {children}
    </motion.div>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-[#1A9E9E] hover:underline">
      <ArrowLeft className="h-3.5 w-3.5" />
      {children}
    </Link>
  );
}

export function Chosen({ langEn, program, level }: { langEn: string; program?: string | null; level?: string | null }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-xs">
      <RectFlag code={getFlagCode(langEn)} h={16} />
      <span className="font-medium">Bahasa {langNameId(langEn)}</span>
      {program && (
        <>
          <span className="text-slate-300">•</span>
          <span className="font-medium text-[#1A9E9E]">{program}</span>
        </>
      )}
      {level && (
        <>
          <span className="text-slate-300">•</span>
          <span>{levelLabel(level)}</span>
        </>
      )}
    </div>
  );
}

export function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-xs text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

export function Stepper({
  step,
  langEn,
  programSlug,
  level,
}: {
  step: number;
  langEn: string | null;
  programSlug: ProgramSlug | null;
  level: string | null;
}) {
  const items = [
    { n: 1, label: "Bahasa", href: "/daftar" },
    { n: 2, label: "Program", href: langEn ? buildFunnelPath({ langEn }) : null },
    { n: 3, label: "Paket", href: langEn && programSlug ? buildFunnelPath({ langEn, programSlug }) : null },
    { n: 4, label: "Data diri", href: langEn && programSlug && level ? buildFunnelPath({ langEn, programSlug, level }) : null },
    { n: 5, label: "Bayar", href: null },
  ];
  return (
    <>
      <div className="mb-3 flex gap-1.5">
        {items.map((it) => (
          <div key={it.n} className={`h-1 flex-1 rounded-full transition-all duration-500 ${it.n <= step ? "bg-[#1A9E9E]" : "bg-slate-200"}`} />
        ))}
      </div>
      <ol className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
        {items.map((it, i) => (
          <li key={it.n} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden className="text-slate-300">/</span>}
            {it.n < step && it.href ? (
              <Link href={it.href} className="font-medium text-[#1A9E9E] hover:underline">{it.label}</Link>
            ) : (
              <span className={it.n === step ? "font-semibold text-slate-700" : ""}>{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LABEL LEVEL
// ─────────────────────────────────────────────────────────────────────────────

const LEVEL_LABEL: Record<string, string> = {
  A1: "A1 — Basic",
  A2: "A2 — Elementary",
  B1: "B1 — Intermediate",
  B2: "B2 — Upper Intermediate",
  "Little Learner": "Little Learner",
  "Young Explorer": "Young Explorer",
};
const LEVEL_DESC: Record<string, string> = {
  A1: "Pemula, mulai dari nol",
  A2: "Percakapan sederhana",
  B1: "Percakapan sehari-hari",
  B2: "Lancar & kompleks",
  "Little Learner": "Usia 5–8 tahun • fun & interaktif",
  "Young Explorer": "Usia 9–12 tahun • fun & interaktif",
};

export function levelLabel(level: string) { return LEVEL_LABEL[level] || level; }
export function levelDesc(level: string) { return LEVEL_DESC[level] || ""; }
export function levelBadge(level: string) {
  if (level === "Little Learner") return "LL";
  if (level === "Young Explorer") return "YE";
  return level;
}
