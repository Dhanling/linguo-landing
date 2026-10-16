// =============================================================================
// /persiapan-tes/<tes> — [seo-tes-kota-v1]
//
// Landing SEO per ujian resmi bahasa asing: JLPT, TOPIK, HSK, Goethe, DELF.
// Kata kuncinya "kursus persiapan <ujian> online" — pola yang dipakai Cakap
// (/persiapan-jlpt). Komponen server murni: seluruh isi, tabel, dan FAQ ikut
// ter-render ke HTML mentah, tanpa satu byte JS klien tambahan.
//
// Data: src/data/persiapanTesBahasa.ts. Harga: lib/testPrep.ts (produk test
// prep) atau lib/trial-pricing.ts (DELF → Private Prancis). Padanan CEFR:
// lib/levelEquivalence.ts. Jangan tulis angka mati di berkas ini.
//
// /persiapan-tes/pte adalah folder STATIS tersendiri — segmen statis selalu
// menang atas [tes], dan "pte" sengaja tidak ada di TES_BAHASA.
// =============================================================================
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ClipboardCheck, MessageCircle } from "lucide-react";

import BreadcrumbLd from "@/components/BreadcrumbLd";
import { pageMetadata } from "@/lib/seo";
import { courseSchema, faqSchema, jsonLd, type FaqItem } from "@/lib/schema";
import { BRAND_FACTS, rupiah } from "@/lib/brand-facts";
import { BANDS, CATATAN_PADANAN, padananTangga, type Band } from "@/lib/levelEquivalence";
import {
  getTestPrepProduct,
  privatePerSessionFor,
  semiPerSessionFor,
  semiPriceFor,
  PRIVATE_SESSION_OPTS,
  SEMI_GROUP_MAX,
  SEMI_GROUP_MIN,
  SEMI_SESSIONS,
  SESSION_MINUTES,
  type TestPrepProduct,
} from "@/lib/testPrep";
import { getPrivateBase60 } from "@/lib/trial-pricing";
import { TES_BAHASA, getTesBahasa, type TesBahasa } from "@/data/persiapanTesBahasa";

const TEAL = BRAND_FACTS.brandColor;

/** Nama level Linguo per band — sama dengan label CEFR di /silabus. */
const NAMA_BAND: Record<Band, string> = {
  A1: "Pemula",
  A2: "Dasar",
  B1: "Menengah",
  B2: "Menengah atas",
};

type PageProps = { params: Promise<{ tes: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return TES_BAHASA.map((t) => ({ tes: t.slug }));
}

// -----------------------------------------------------------------------------
// Harga — dihitung, bukan ditulis
// -----------------------------------------------------------------------------

type BarisHarga = {
  level: string;
  /** Paket semi-private per orang (0 = tidak dijual). */
  semiPaket: number;
  semiPerSesi: number;
  privatPerSesi: number;
};

type Harga = {
  /** Produk test prep (checkout /persiapan-tes) atau null = kelas Private biasa. */
  produk: TestPrepProduct | null;
  menitPerSesi: number;
  baris: BarisHarga[];
  privatMulai: number;
  semiMulai: number;
};

function hitungHarga(t: TesBahasa): Harga {
  const produk = t.testPrepId ? getTestPrepProduct(t.testPrepId) : null;
  if (produk) {
    const baris = produk.levels.map((l) => ({
      level: `${t.tes === "Goethe-Zertifikat" ? "Goethe " : ""}${l.label}`,
      semiPaket: semiPriceFor(produk, l.id),
      semiPerSesi: semiPerSessionFor(produk, l.id),
      privatPerSesi: privatePerSessionFor(produk, l.id),
    }));
    return {
      produk,
      menitPerSesi: SESSION_MINUTES,
      baris,
      privatMulai: Math.min(...baris.map((b) => b.privatPerSesi)),
      semiMulai: Math.min(...baris.map((b) => b.semiPaket).filter((n) => n > 0)),
    };
  }
  // Tanpa produk test prep → pricelist Kelas Private biasa, 60 menit per sesi.
  const baris = BANDS.map((b) => ({
    level: `${t.tes} ${b}`,
    semiPaket: 0,
    semiPerSesi: 0,
    privatPerSesi: getPrivateBase60(t.langEn, b),
  }));
  return {
    produk: null,
    menitPerSesi: 60,
    baris,
    privatMulai: Math.min(...baris.map((b) => b.privatPerSesi)),
    semiMulai: 0,
  };
}

// -----------------------------------------------------------------------------
// Tautan
// -----------------------------------------------------------------------------

const placementHref = (t: TesBahasa) => `/silabus/${t.kurikulumSlug}/coba`;
const daftarHref = (t: TesBahasa) =>
  t.testPrepId ? `/persiapan-tes?produk=${t.testPrepId}` : `/daftar/${t.kursusSlug}/private`;
const waHref = (t: TesBahasa) =>
  `${BRAND_FACTS.contact.whatsappUrl}?text=${encodeURIComponent(
    `Halo Linguo, saya mau tanya kelas persiapan ${t.tes} (bahasa ${t.bahasa}).`,
  )}`;

// -----------------------------------------------------------------------------
// FAQ = FAQ khas ujian + dua pertanyaan yang jawabannya dihitung
// -----------------------------------------------------------------------------

function buildFaq(t: TesBahasa, h: Harga): FaqItem[] {
  const hargaJawab = h.produk
    ? `Kelas persiapan ${t.tes} di ${BRAND_FACTS.name} tersedia dua format. Semi-private (grup ${SEMI_GROUP_MIN}–${SEMI_GROUP_MAX} orang) berupa paket ${SEMI_SESSIONS} sesi @${SESSION_MINUTES} menit mulai ${rupiah(h.semiMulai)} per orang. Private 1-on-1 mulai ${rupiah(h.privatMulai)} per sesi ${SESSION_MINUTES} menit dengan pilihan paket ${PRIVATE_SESSION_OPTS.join(", ")} sesi. Harga naik mengikuti level ujian.`
    : `Persiapan ${t.tes} di ${BRAND_FACTS.name} berjalan lewat Kelas Private bahasa ${t.bahasa} 1-on-1, mulai ${rupiah(h.privatMulai)} per sesi ${h.menitPerSesi} menit untuk level A1. Harga naik mengikuti level; jumlah sesi bisa disesuaikan dengan tanggal ujianmu.`;
  return [
    ...t.faq,
    { q: `Berapa biaya kursus persiapan ${t.tes} di Linguo?`, a: hargaJawab },
    {
      q: `Bagaimana cara mulai persiapan ${t.tes}?`,
      a: `Kerjakan dulu placement test gratis bahasa ${t.bahasa} di linguo.id${placementHref(t)} untuk mengetahui levelmu. Setelah itu pilih format kelas dan daftar online, atau tanya dulu lewat WhatsApp. Tim ${BRAND_FACTS.name} akan mencocokkan jadwal dan pengajar.`,
    },
  ];
}

// -----------------------------------------------------------------------------
// Metadata
// -----------------------------------------------------------------------------

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const t = getTesBahasa((await params).tes);
  if (!t) return { title: "Tidak ditemukan | Linguo.id", robots: { index: false, follow: false } };
  return pageMetadata({
    path: `/persiapan-tes/${t.slug}`,
    title: t.metaTitle,
    description: t.metaDescription,
    keywords: t.keywords,
  });
}

// -----------------------------------------------------------------------------
// Halaman
// -----------------------------------------------------------------------------

export default async function PersiapanTesBahasaPage({ params }: PageProps) {
  const t = getTesBahasa((await params).tes);
  if (!t) notFound();

  const path = `/persiapan-tes/${t.slug}`;
  const url = `${BRAND_FACTS.url}${path}`;
  const h = hitungHarga(t);
  const faq = buildFaq(t, h);
  const tangga = padananTangga(t.kurikulumSlug);
  const lain = TES_BAHASA.filter((x) => x.slug !== t.slug);
  const h1 = `Kursus Persiapan ${t.tes} Online`;

  const courseLd = courseSchema({
    name: h1,
    description: t.metaDescription,
    url,
    offers: [
      {
        name: `Private 1-on-1 persiapan ${t.tes}`,
        price: h.privatMulai,
        category: `1 siswa • ${h.menitPerSesi} menit`,
        unit: "per sesi",
      },
    ],
  });

  return (
    <>
      <BreadcrumbLd
        trail={[
          { name: "Persiapan Ujian Bahasa", path: "/persiapan-tes" },
          { name: `Persiapan ${t.tes}`, path },
        ]}
      />
      <script type="application/ld+json" {...jsonLd(courseLd)} />
      <script type="application/ld+json" {...jsonLd(faqSchema(faq, url))} />

      <main className="min-h-screen bg-white pb-16 text-slate-900">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
            <Link href="/persiapan-tes" className="flex items-center gap-2 font-bold text-slate-800 hover:text-teal-600">
              <ArrowLeft className="h-4 w-4" /> Persiapan Ujian
            </Link>
            <a href={waHref(t)} target="_blank" rel="noopener" className="text-sm font-medium text-teal-600">
              Butuh bantuan?
            </a>
          </div>
        </header>

        {/* Breadcrumb tampil — pasangan BreadcrumbList di atas */}
        <nav aria-label="Breadcrumb" className="mx-auto max-w-4xl px-4 pt-5 text-xs text-slate-500">
          <Link href="/" className="hover:text-teal-600">Beranda</Link>
          <span className="mx-1.5">/</span>
          <Link href="/persiapan-tes" className="hover:text-teal-600">Persiapan Ujian Bahasa</Link>
          <span className="mx-1.5">/</span>
          <span className="text-slate-700">Persiapan {t.tes}</span>
        </nav>

        {/* Hero — tanpa animasi opacity supaya LCP tidak tertunda */}
        <section className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
          <p className="mb-3 inline-flex rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            Bahasa {t.bahasa} · {t.namaPanjang}
          </p>
          <h1 className="font-heading text-3xl font-extrabold leading-tight sm:text-5xl">{h1}</h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">{t.ringkasan}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            {[
              `Private mulai ${rupiah(h.privatMulai)}/sesi`,
              ...(h.semiMulai ? [`Semi-private mulai ${rupiah(h.semiMulai)}/${SEMI_SESSIONS} sesi`] : []),
              `${h.menitPerSesi} menit per sesi`,
              "Live via Zoom",
            ].map((x) => (
              <span key={x} className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700">{x}</span>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={placementHref(t)}
              className="flex items-center gap-1.5 rounded-xl px-5 py-3 text-sm font-bold text-white shadow"
              style={{ background: TEAL }}
            >
              <ClipboardCheck className="h-4 w-4" /> Placement Test Gratis
            </Link>
            <Link
              href={daftarHref(t)}
              className="flex items-center gap-1.5 rounded-xl border-2 px-5 py-3 text-sm font-bold"
              style={{ borderColor: TEAL, color: TEAL }}
            >
              Daftar kelas {t.tes} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Apa itu ujiannya */}
        <section className="mx-auto max-w-4xl px-4 py-8">
          <h2 className="font-heading text-2xl font-extrabold">Apa itu {t.tes}?</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
            {t.tes} diselenggarakan oleh {t.penyelenggara}. Informasi resmi soal jadwal, lokasi, dan biaya ujian ada di situs
            penyelenggara ({t.situsResmi}). Bagian yang diujikan:
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {t.bagian.map((b) => (
              <div key={b.nama} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-bold leading-snug text-slate-900">{b.nama}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{b.isi}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600">{t.catatanSkor}</p>
        </section>

        {/* Tabel level */}
        <section className="mx-auto max-w-4xl px-4 py-8">
          <h2 className="font-heading text-2xl font-extrabold">Level {t.tes}, CEFR, dan level di Linguo</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
            Kurikulum bahasa {t.bahasa} di Linguo memakai level CEFR {BRAND_FACTS.cefrLevels}. Tabel ini membantu memilih target
            ujian dari level yang sedang kamu pelajari.
          </p>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Level {t.tes}</th>
                  <th className="px-4 py-2 text-left font-semibold">CEFR</th>
                  <th className="px-4 py-2 text-left font-semibold">Level Linguo</th>
                  <th className="px-4 py-2 text-left font-semibold">Gambaran</th>
                </tr>
              </thead>
              <tbody>
                {BANDS.map((b) => {
                  const label = tangga?.level[b];
                  if (!label) return null;
                  return (
                    <tr key={b} className="border-t border-slate-100 align-top">
                      <td className="px-4 py-2.5 font-semibold text-slate-800">≈ {label}</td>
                      <td className="px-4 py-2.5 text-slate-600">{b}</td>
                      <td className="px-4 py-2.5 text-slate-600">{b} · {NAMA_BAND[b]}</td>
                      <td className="px-4 py-2.5 text-slate-500">{t.catatanLevel[b] ?? ""}</td>
                    </tr>
                  );
                })}
                {(t.levelTambahan ?? []).map((r) => (
                  <tr key={r.label} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-2.5 font-semibold text-slate-800">≈ {r.label}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.cefr}</td>
                    <td className="px-4 py-2.5 text-slate-600">Di atas kurikulum inti</td>
                    <td className="px-4 py-2.5 text-slate-500">{r.catatan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            {CATATAN_PADANAN} Placement test Linguo juga bukan ujian resmi; hasilnya dipakai untuk menentukan titik mulai kelas.
          </p>
        </section>

        {/* Kegunaan */}
        <section className="mx-auto max-w-4xl px-4 py-8">
          <h2 className="font-heading text-2xl font-extrabold">Untuk apa sertifikat {t.tes}?</h2>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-600">
            {t.kegunaan.map((k) => (
              <li key={k} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" /><span>{k}</span></li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-400">
            Syarat level selalu ditentukan lembaga tujuan (kampus, pemberi kerja, kedutaan) dan bisa berubah — cek syarat resminya sebelum memilih target.
          </p>
        </section>

        {/* Cara Linguo menyiapkan */}
        <section className="mx-auto max-w-4xl px-4 py-8">
          <h2 className="font-heading text-2xl font-extrabold">Cara Linguo menyiapkanmu untuk {t.tes}</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <ul className="space-y-2.5 text-sm leading-relaxed text-slate-600">
              {t.fokus.map((f) => (
                <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" /><span>{f}</span></li>
              ))}
            </ul>
            <ul className="space-y-2.5 text-sm leading-relaxed text-slate-600">
              {[
                `Mulai dari placement test gratis bahasa ${t.bahasa}, supaya kelas tidak mengulang yang sudah kamu kuasai.`,
                "Kelas live via Zoom dengan pengajar, bukan video rekaman; jadwal dicocokkan dengan kesibukanmu.",
                ...(t.babSilabus
                  ? [`Silabus bahasa ${t.bahasa} Linguo punya bab khusus persiapan ujian (${t.babSilabus}) yang membahas struktur dan latihan ${t.tes}.`]
                  : []),
                "Porsi latihan digeser mengikuti hasil mock test dan tanggal ujianmu.",
              ].map((f) => (
                <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" /><span>{f}</span></li>
              ))}
            </ul>
          </div>
        </section>

        {/* Harga */}
        <section className="mx-auto max-w-4xl px-4 py-8">
          <h2 className="font-heading text-2xl font-extrabold">Biaya kursus persiapan {t.tes}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
            {h.produk
              ? `Semi-private: grup ${SEMI_GROUP_MIN}–${SEMI_GROUP_MAX} orang, paket tetap ${SEMI_SESSIONS} sesi @${SESSION_MINUTES} menit, harga per orang. Private 1-on-1: harga per sesi ${SESSION_MINUTES} menit, paket ${PRIVATE_SESSION_OPTS.join(" / ")} sesi.`
              : `Persiapan ${t.tes} berjalan lewat Kelas Private bahasa ${t.bahasa} 1-on-1, ${h.menitPerSesi} menit per sesi. Jumlah sesi disesuaikan dengan level awal dan tanggal ujianmu.`}
          </p>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Level</th>
                  {h.produk && <th className="px-4 py-2 text-right font-semibold">Semi-private ({SEMI_SESSIONS} sesi/orang)</th>}
                  <th className="px-4 py-2 text-right font-semibold">Private 1-on-1 / sesi</th>
                </tr>
              </thead>
              <tbody>
                {h.baris.map((b) => (
                  <tr key={b.level} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 font-semibold text-slate-800">{b.level}</td>
                    {h.produk && (
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                        {b.semiPaket ? (
                          <>
                            {rupiah(b.semiPaket)}
                            <span className="block text-[11px] text-slate-400">≈ {rupiah(b.semiPerSesi)}/sesi</span>
                          </>
                        ) : "—"}
                      </td>
                    )}
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-800">{rupiah(b.privatPerSesi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Harga kelas di Linguo, belum termasuk biaya pendaftaran ujian resmi yang dibayar ke penyelenggara.
          </p>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-4xl px-4 py-8">
          <h2 className="font-heading text-2xl font-extrabold">Pertanyaan seputar persiapan {t.tes}</h2>
          <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {faq.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none text-sm font-bold text-slate-900 marker:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {f.q}
                    <span className="text-slate-400 transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Tautan internal */}
        <section className="mx-auto max-w-4xl px-4 py-8">
          <h2 className="font-heading text-xl font-extrabold">Pelajari lebih lanjut</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { href: `/kursus/bahasa-${t.kursusSlug}`, judul: `Kursus Bahasa ${t.bahasa}`, sub: "Program, harga, dan FAQ" },
              { href: `/silabus/${t.kurikulumSlug}`, judul: `Silabus Bahasa ${t.bahasa}`, sub: `Kurikulum ${BRAND_FACTS.cefrLevels} per sesi` },
              { href: placementHref(t), judul: "Placement Test Gratis", sub: `Cek level bahasa ${t.bahasa}-mu` },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="rounded-2xl border border-slate-200 p-4 transition hover:border-teal-300 hover:bg-teal-50/40">
                <p className="font-bold text-slate-900">{l.judul}</p>
                <p className="mt-0.5 text-xs text-slate-500">{l.sub}</p>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-sm font-semibold text-slate-700">Persiapan tes bahasa lain</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {lain.map((x) => (
              <Link key={x.slug} href={`/persiapan-tes/${x.slug}`} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:border-teal-300 hover:text-teal-700">
                {x.tes} ({x.bahasa})
              </Link>
            ))}
            <Link href="/persiapan-tes/pte" className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:border-teal-300 hover:text-teal-700">
              PTE Academic (Inggris)
            </Link>
            <Link href="/persiapan-tes" className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:border-teal-300 hover:text-teal-700">
              IELTS & TOEFL
            </Link>
          </div>
        </section>

        {/* Penutup */}
        <section className="mx-auto max-w-4xl px-4 pt-4">
          <div className="rounded-3xl bg-slate-900 px-6 py-8 text-center sm:px-10">
            <h2 className="font-heading text-xl font-extrabold text-white sm:text-2xl">Siap mulai persiapan {t.tes}?</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
              Cek levelmu dulu lewat placement test gratis, lalu tim Linguo mencocokkan jadwal dan pengajar lewat WhatsApp.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                href={placementHref(t)}
                className="flex items-center gap-1.5 rounded-xl px-5 py-3 text-sm font-bold text-white shadow"
                style={{ background: TEAL }}
              >
                <ClipboardCheck className="h-4 w-4" /> Placement Test Gratis
              </Link>
              <a
                href={waHref(t)}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-1.5 rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white"
              >
                <MessageCircle className="h-4 w-4" /> Tanya lewat WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
