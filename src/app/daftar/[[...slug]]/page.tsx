// =============================================================================
// [daftar-page-funnel-v1]  /daftar/...
// Funnel pendaftaran sebagai HALAMAN, bukan modal.
//
// Kenapa: seluruh CTA "Daftar" dulu menunjuk ke "/?openFunnel=1&lang=Korean".
// Google melihatnya sebagai homepage berparameter — 45 landing bahasa mengirim
// link equity CTA-nya ke satu URL yang sama, dan tidak ada halaman yang bisa
// diindeks / diiklankan untuk niat "daftar kursus bahasa X".
//
// Aturan indeks di sini:
//   /daftar                → index  (hub pendaftaran)
//   /daftar/<bahasa>       → index  (halaman uang per bahasa)
//   selebihnya             → noindex, follow — langkah transaksional, isinya
//                            tipis & kombinasinya ratusan. JANGAN dibuka indeks;
//                            itu resep duplicate content.
// Halaman yang diindeks WAJIB juga terdaftar di src/app/sitemap.ts.
// =============================================================================

import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import FunnelFlow from "../FunnelFlow";
import StepLang from "../StepLang";
import StepProgram from "../StepProgram";
import { Stepper } from "../ui";
import {
  ALL_LANG_SLUGS,
  langNameId,
  parseFunnelPath,
  kursusSlugOf,
} from "@/lib/funnelRouting";
import { breadcrumbSchema, jsonLd } from "@/lib/schema"; // [aeo-schema-v1]

const BASE = "https://linguo.id";

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

// Langkah 1 & 2 dibuat statis saat build (halaman yang diindeks); langkah
// selanjutnya dirender on-demand.
export function generateStaticParams() {
  return [{ slug: [] as string[] }, ...ALL_LANG_SLUGS.map((s) => ({ slug: [s] }))];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug = [] } = await params;
  const route = parseFunnelPath(slug);

  if (!route) {
    return { title: "Halaman tidak ditemukan | Linguo.id", robots: { index: false, follow: false } };
  }

  const noindex = { index: false, follow: true } as const;

  if (route.step === 1) {
    const title = "Daftar Kursus Bahasa Online — Pilih Bahasa & Program | Linguo.id";
    const description =
      "Daftar kursus bahasa online di Linguo: 60+ bahasa, Kelas Private, Semi Private, Reguler, Kids & IELTS/TOEFL. Pilih bahasa, level, dan jadwal — bayar aman, kelas langsung diatur.";
    return {
      title,
      description,
      alternates: { canonical: `${BASE}/daftar` },
      openGraph: { title, description, url: `${BASE}/daftar`, siteName: "Linguo.id", locale: "id_ID", type: "website" },
      robots: { index: true, follow: true },
    };
  }

  const langId = langNameId(route.langEn!);

  if (route.step === 2) {
    const title = `Daftar Kursus Bahasa ${langId} Online — Pilih Program | Linguo.id`;
    const description = `Formulir pendaftaran kursus Bahasa ${langId} online Linguo. Pilih Kelas Private, Semi Private, Reguler, atau Kids — level A1–B2, jadwal fleksibel, pengajar bersertifikat.`;
    const url = `${BASE}/daftar/${slug[0]}`;
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: { title, description, url, siteName: "Linguo.id", locale: "id_ID", type: "website" },
      robots: { index: true, follow: true },
    };
  }

  // Langkah transaksional: noindex, dan canonical DIARAHKAN ke langkah bahasa —
  // tanpa ini halaman mewarisi canonical homepage dari root layout, sinyal yang
  // menyesatkan (halaman ini bukan homepage).
  return {
    title: `Pendaftaran Kursus Bahasa ${langId} — ${route.program} | Linguo.id`,
    alternates: { canonical: `${BASE}/daftar/${slug[0]}` },
    robots: noindex,
  };
}

export default async function DaftarPage({ params }: PageProps) {
  const { slug = [] } = await params;
  const route = parseFunnelPath(slug);
  if (!route) notFound();

  const langId = route.langEn ? langNameId(route.langEn) : null;
  const kursusSlug = route.langEn ? kursusSlugOf(route.langEn) : null;

  // [aeo-schema-v1] Lewat helper bersama. Bentuk lamanya menaut butir terakhir
  // ke halaman ini sendiri — pola yang Google minta dihindari, dan bikin 49
  // halaman /daftar/* melanggar sekaligus.
  const breadcrumb = breadcrumbSchema([
    { name: "Daftar", path: "/daftar" },
    ...(langId ? [{ name: `Bahasa ${langId}`, path: `/daftar/${slug[0]}` }] : []),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <script type="application/ld+json" {...jsonLd(breadcrumb)} />

      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-extrabold tracking-tight text-[#1A9E9E]">
            Linguo<span className="text-slate-900">.id</span>
          </Link>
          <span className="text-xs font-medium text-slate-400">Pendaftaran kelas</span>
        </div>
      </header>

      <nav aria-label="Breadcrumb" className="border-b border-slate-100 bg-white/60">
        <ol className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-2.5 text-xs text-slate-500">
          <li><Link href="/" className="hover:text-[#1A9E9E]">Beranda</Link></li>
          <li aria-hidden className="text-slate-300">/</li>
          {langId ? (
            <>
              <li><Link href="/daftar" className="hover:text-[#1A9E9E]">Daftar</Link></li>
              <li aria-hidden className="text-slate-300">/</li>
              <li className="font-medium text-slate-900" aria-current="page">Bahasa {langId}</li>
            </>
          ) : (
            <li className="font-medium text-slate-900" aria-current="page">Daftar</li>
          )}
        </ol>
      </nav>

      {/* Langkah 1 & 2 diprarender penuh (halaman yang diindeks); langkah 3–5
          memakai useSearchParams, jadi dibungkus Suspense — HTML-nya tidak
          penting karena noindex. */}
      {route.step <= 2 ? (
        <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6">
          <Stepper step={route.step} langEn={route.langEn} programSlug={null} level={null} />
          {route.step === 1 ? <StepLang /> : <StepProgram langEn={route.langEn!} />}
        </div>
      ) : (
        <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-slate-400">Memuat…</div>}>
          <FunnelFlow route={route} />
        </Suspense>
      )}

      {/* Tautan keluar: halaman langkah tetap punya jalur balik yang bisa dirayapi. */}
      <footer className="mx-auto max-w-2xl px-4 pb-12 text-center text-xs text-slate-400">
        {kursusSlug && route.langEn && (
          <p className="mb-2">
            Butuh info lengkap dulu?{" "}
            <Link href={`/kursus/bahasa-${kursusSlug}`} className="font-semibold text-[#1A9E9E] hover:underline">
              Halaman kursus Bahasa {langId}
            </Link>
          </p>
        )}
        <p>
          <Link href="/kursus" className="hover:text-[#1A9E9E]">Semua bahasa</Link>
          <span className="mx-2 text-slate-300">·</span>
          <Link href="/harga" className="hover:text-[#1A9E9E]">Harga</Link>
          <span className="mx-2 text-slate-300">·</span>
          <Link href="/syarat-ketentuan" className="hover:text-[#1A9E9E]">Syarat &amp; Ketentuan</Link>
          <span className="mx-2 text-slate-300">·</span>
          <Link href="/pengembalian-dana" className="hover:text-[#1A9E9E]">Pengembalian Dana</Link>
        </p>
      </footer>
    </div>
  );
}
