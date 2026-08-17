"use client";
// =============================================================================
// [daftar-page-funnel-v1] Langkah 2 — pilih program untuk satu bahasa.
//
// Halaman ini DIINDEKS (/daftar/<bahasa>), jadi kartunya <a href> nyata dan
// harganya dirender di server: harga "Mulai dari" per kategori bahasa itu isi
// halaman yang justru dicari orang. Jangan pakai useSearchParams — lihat ui.tsx.
// =============================================================================

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  getLanguageCategory,
  PRICE_A1_60MIN,
  getSemiPrivatePrice,
  getKidsBasePerSession,
} from "@/lib/trial-pricing";
import {
  PROGRAM_LABELS,
  kursusSlugOf,
  langNameId,
  langSlugOf,
  programsForLang,
  type ProgramSlug,
} from "@/lib/funnelRouting";
import { Card, BackLink, Chosen, fmtRp, useQueryHints } from "./ui";

// Ringkasan kartu program. Harga WAJIB dari lib/trial-pricing (kategori bahasa
// A–E), bukan angka hardcode — sumber yang sama dengan /harga & invoice.
function programMeta(slug: ProgramSlug, langEn: string) {
  const cat = getLanguageCategory(langEn) || "C";
  switch (slug) {
    case "private":
      return {
        desc: "1-on-1 via Zoom, jadwal fleksibel, materi menyesuaikan targetmu",
        price: "Mulai " + fmtRp(PRICE_A1_60MIN[cat] ?? 100000) + "/sesi",
        highlight: true,
        note: "",
      };
    case "semi-private": {
      const per = getSemiPrivatePrice(langEn, "A1", 10, 60).perStudent;
      return {
        desc: "Grup kecil 2–10 orang, lebih hemat per orang",
        price: per > 0 ? "Mulai " + fmtRp(per) + "/orang/sesi" : "Patungan grup — hemat per orang",
        highlight: false,
        note: "",
      };
    }
    case "reguler":
      return {
        desc: "Grup class, jadwal tetap, 8 sesi @90 menit",
        price: "Rp 150.000/2 bulan",
        highlight: false,
        note: "*Kelas dibuka minimal 8 peserta",
      };
    case "kids":
      return {
        desc: "1-on-1 untuk anak 5–12 tahun, fun & interaktif",
        price: "Mulai " + fmtRp(getKidsBasePerSession("little-learner", langEn)) + "/sesi",
        highlight: false,
        note: "",
      };
    case "ielts-toefl":
      return {
        desc: "16 sesi @90 menit, persiapan intensif IELTS / TOEFL",
        price: "Rp 300.000/2 bulan",
        highlight: false,
        note: "",
      };
  }
}

export default function StepProgram({ langEn }: { langEn: string }) {
  const hints = useQueryHints();
  const langId = langNameId(langEn);
  const kursusSlug = kursusSlugOf(langEn);
  const levelQuery = hints.level ? `?level=${encodeURIComponent(hints.level)}` : "";

  return (
    <Card>
      <BackLink href="/daftar">Ganti bahasa</BackLink>
      <Chosen langEn={langEn} />
      <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
        Daftar Kursus Bahasa {langId}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Pilih jenis kelas yang paling pas. Setelah pembayaran, tim Linguo mengatur jadwal &amp; pengajarmu.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {programsForLang(langEn).map((slug) => {
          const meta = programMeta(slug, langEn)!;
          return (
            <Link
              key={slug}
              href={`/daftar/${langSlugOf(langEn)}/${slug}${levelQuery}`}
              className={`flex items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all hover:border-[#1A9E9E]/40 hover:shadow-md ${meta.highlight ? "border-[#1A9E9E]/20 bg-[#1A9E9E]/[0.02]" : "border-slate-100"}`}
            >
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold">{PROGRAM_LABELS[slug]}</h2>
                  {meta.highlight && (
                    <span className="shrink-0 rounded-full bg-[#1A9E9E] px-2 py-0.5 text-[10px] font-bold text-white">POPULER</span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{meta.desc}</p>
                <p className="mt-2 text-sm font-bold text-[#1A9E9E]">{meta.price}</p>
                {meta.note && <p className="mt-1 text-[10px] text-slate-400">{meta.note}</p>}
              </div>
              <ChevronRight aria-hidden className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
            </Link>
          );
        })}
      </div>

      {kursusSlug && (
        <p className="mt-5 text-center text-xs text-slate-400">
          Masih menimbang?{" "}
          <Link href={`/kursus/bahasa-${kursusSlug}`} className="font-semibold text-[#1A9E9E] hover:underline">
            Lihat detail kursus Bahasa {langId}
          </Link>
        </p>
      )}
    </Card>
  );
}
