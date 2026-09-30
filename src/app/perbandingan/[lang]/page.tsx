// =============================================================================
// /perbandingan/bahasa-<slug> — [aeo-perbandingan-bahasa-v1]
//
// "Kursus bahasa X online terbaik" per bahasa. Prinsip isinya sama persis
// dengan /perbandingan (lihat kepala src/app/perbandingan/page.tsx dan
// src/data/perbandingan-bahasa.ts): dibuat untuk DIKUTIP, bukan untuk menang.
// Ada bagian "kapan Linguo.id bukan pilihan terbaik" yang sungguhan, tidak ada
// harga pihak lain, dan semua angka Linguo diturunkan dari pricelist.
//
// Struktur halaman mengikuti cara mesin jawaban mengutip: paragraf jawaban di
// bawah H1 yang berdiri sendiri, tabel "tujuan → pilihan", tabel pembanding,
// lalu FAQ yang juga dimarkup FAQPage. Tanggal pembaruan tampil di halaman DAN
// di schema — halaman perbandingan tanpa tanggal cenderung dianggap basi.
// =============================================================================
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Star, X } from "lucide-react";

import { pageMetadata } from "@/lib/seo";
import { BRAND_FACTS, GOOGLE_REVIEWS_SENTENCE, rupiah } from "@/lib/brand-facts";
import { faqSchema, jsonLd } from "@/lib/schema";
import BreadcrumbLd from "@/components/BreadcrumbLd";
import {
  getAllLanguageDetailSlugs,
  getLanguageDetailBySlug,
  getLanguageMetaForDetail,
} from "@/data/languages-detail";
import { testimonialsForLang } from "@/data/testimonials";
import {
  getLanguageCategory,
  NATIVE_AVAILABLE_LANGS,
  PRICE_PRIVATE_60MIN,
  SEMI_PRIVATE_PRICE_BASIC,
} from "@/lib/trial-pricing";
import { REGULER_LANGS } from "@/lib/programLanguages";
import {
  BAHASA_DAERAH,
  DUOLINGO,
  DUOLINGO_LANGS,
  MARKETPLACE,
  OTODIDAK,
  PERBANDINGAN_BAHASA,
  PERBANDINGAN_BAHASA_UPDATED,
  TANPA_PERBANDINGAN,
  TUTOR_LOKAL,
  type Alternatif,
} from "@/data/perbandingan-bahasa";

const F = BRAND_FACTS;
const G = F.googleReviews;
const TAHUN = PERBANDINGAN_BAHASA_UPDATED.getFullYear();
const DIPERBARUI = PERBANDINGAN_BAHASA_UPDATED.toLocaleDateString("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

// Mirror FUNNEL_LANG_OVERRIDE di src/app/kursus/[lang]/page.tsx — kategori
// harga & daftar Reguler memakai nama Inggris pricelist.
const FUNNEL_LANG_OVERRIDE: Record<string, string> = {
  filipino: "Tagalog",
  "portuguese-br": "Portuguese",
  "portuguese-pt": "Portuguese",
  bipa: "BIPA",
};
const funnelLangName = (languageSlug: string) =>
  FUNNEL_LANG_OVERRIDE[languageSlug] ||
  languageSlug.charAt(0).toUpperCase() + languageSlug.slice(1);

type PageProps = { params: Promise<{ lang: string }> };

export function generateStaticParams() {
  return getAllLanguageDetailSlugs()
    .filter((s) => !TANPA_PERBANDINGAN.has(s))
    .map((slug) => ({ lang: `bahasa-${slug}` }));
}

export const dynamicParams = false;

// -----------------------------------------------------------------------------
// Semua isi halaman diturunkan di satu tempat supaya metadata, tampilan, dan
// schema mustahil berbeda angka.
// -----------------------------------------------------------------------------

function build(langParam: string) {
  if (!langParam.startsWith("bahasa-")) return null;
  const urlSlug = langParam.slice("bahasa-".length);
  if (TANPA_PERBANDINGAN.has(urlSlug)) return null;
  const detail = getLanguageDetailBySlug(urlSlug);
  if (!detail) return null;
  const meta = getLanguageMetaForDetail(detail);
  const nama = meta?.name ?? urlSlug;
  const N = `bahasa ${nama}`;
  const NBesar = `Bahasa ${nama}`;

  const langEn = funnelLangName(detail.languageSlug);
  const cat = getLanguageCategory(langEn) || "C";
  const priv = PRICE_PRIVATE_60MIN[cat][0];
  const semi = Math.round(SEMI_PRIVATE_PRICE_BASIC[cat][1] / 2);
  const reguler = REGULER_LANGS.includes(langEn);
  const native = (NATIVE_AVAILABLE_LANGS as readonly string[]).includes(langEn);
  const daerah = BAHASA_DAERAH.has(urlSlug);
  const kurasi = PERBANDINGAN_BAHASA[urlSlug];
  const langka = !kurasi && !daerah;
  const ujian = kurasi?.ujian;
  /** "JLPT (N5 sampai N1)" → "JLPT"; bagian sesudah ";" dibuang. Dipakai di kalimat. */
  const ujianSingkat = ujian?.split(";")[0].replace(/\s*\([^)]*\)/g, "").trim();
  const lembagaResmi = kurasi?.alternatif.find((a) => /resmi/i.test(a.tipe));

  const linguo: Alternatif = {
    nama: F.name,
    tipe: "Sekolah bahasa online dengan kurikulum sendiri",
    format: `Live via Zoom — privat, semi privat${reguler ? ", kelas grup reguler" : ""}`,
    harga: `Privat mulai ${rupiah(priv)}/sesi 60 menit; semi privat mulai ${rupiah(semi)}/siswa/sesi${reguler ? `; reguler ${F.price.regulerLabel}` : ""}`,
    cocok: `Belajar ${N} terstruktur dari nol (${F.cefrLevels}) dengan pengajar yang menjelaskan dalam bahasa Indonesia`,
    kurang: `Sertifikatnya sertifikat penyelesaian kursus, bukan ujian resmi${native ? "" : `; pengajar ${N} adalah pengajar Indonesia, belum ada penutur asli`}`,
  };

  const marketplace: Alternatif = langka
    ? {
        ...MARKETPLACE,
        kurang: `Untuk ${N}, jumlah tutor yang tersedia bisa sangat sedikit; tanpa kurikulum terpusat dan bahasa pengantarnya umumnya bahasa Inggris`,
      }
    : MARKETPLACE;

  const pilihan: Alternatif[] = [
    linguo,
    ...(kurasi?.alternatif ?? []),
    ...(daerah ? [TUTOR_LOKAL] : [marketplace]),
    DUOLINGO_LANGS.has(urlSlug) ? DUOLINGO : OTODIDAK,
  ];

  const tujuan: Array<{ tujuan: string; pilihan: string }> = [
    {
      tujuan: "Mulai dari nol dan ingin dijelaskan dalam bahasa Indonesia",
      pilihan: `${F.name} — kelas privat atau semi privat via Zoom`,
    },
    reguler
      ? {
          tujuan: "Paling hemat tapi tetap dengan pengajar",
          pilihan: `Kelas Reguler ${F.name} — ${F.price.regulerLabel}, 8 pertemuan @90 menit`,
        }
      : {
          tujuan: "Paling hemat tapi tetap dengan pengajar",
          pilihan: `Semi Privat ${F.name} — mulai ${rupiah(semi)}/siswa/sesi berdua, makin murah kalau lebih ramai`,
        },
    ...(ujian
      ? [
          {
            tujuan: `Wajib punya sertifikat ${ujianSingkat}`,
            pilihan: lembagaResmi
              ? `${lembagaResmi.nama}, lalu ikut ujian resminya`
              : `Kelas persiapan terarah, lalu ikut ujian resmi di penyelenggaranya`,
          },
        ]
      : []),
    {
      tujuan: "Latihan ngobrol dengan penutur asli",
      pilihan: native
        ? `${F.name} dengan pengajar native (tarif 2× pengajar lokal), atau italki/Preply`
        : daerah
          ? "Tutor lokal di daerah asal bahasanya"
          : "italki atau Preply",
    },
    {
      tujuan: "Coba-coba dulu tanpa biaya",
      pilihan: `${DUOLINGO_LANGS.has(urlSlug) ? "Duolingo" : "Belajar mandiri dari buku & video"}, plus placement test gratis ${F.name}`,
    },
  ];

  const bukan: Array<{ kondisi: string; alasan: string; kemana: string }> = [
    ...(ujian
      ? [
          {
            kondisi: `Kamu wajib punya sertifikat ujian resmi ${N}`,
            alasan: `E-certificate ${F.name} adalah bukti penyelesaian kursus, bukan sertifikat ujian resmi seperti ${ujianSingkat}. ${F.name} bisa membangun kemampuannya, tapi ujiannya tetap diambil di penyelenggara resmi.`,
            kemana: lembagaResmi ? lembagaResmi.nama : `Penyelenggara resmi ${ujianSingkat}`,
          },
        ]
      : []),
    ...(!native && !daerah
      ? [
          {
            kondisi: `Kamu spesifik mencari pengajar penutur asli ${N}`,
            alasan: `Pengajar ${N} di ${F.name} adalah pengajar Indonesia yang menguasai bahasa itu. Pengajar native baru tersedia untuk ${NATIVE_AVAILABLE_LANGS.join(", ")}.`,
            kemana: "italki atau Preply",
          },
        ]
      : []),
    {
      kondisi: "Kamu hanya mau kelas tatap muka rutin",
      alasan: `${F.name} online-first. Kelas tatap muka hanya untuk privat dan semi privat, di kota tertentu, dengan tambahan ${rupiah(50000)} per sesi.`,
      kemana: kurasi?.alternatif.find((a) => /tatap muka/i.test(a.format))?.nama ?? "Lembaga kursus tatap muka di kotamu",
    },
    {
      kondisi: "Kamu cuma mau latihan ringan tanpa biaya",
      alasan: `${F.name} menjual kelas berbayar dengan pengajar manusia. Untuk sekadar menjaga kebiasaan harian, sumber gratis lebih masuk akal.`,
      kemana: DUOLINGO_LANGS.has(urlSlug) ? "Duolingo" : "Buku, YouTube, dan podcast",
    },
    ...(kurasi?.bukanTambahan ?? []),
  ];

  const cocok: string[] = [
    ...(langka
      ? [`Pengajar ${N} sulit dicari di Indonesia. ${F.name} membuka kelas ${N} terjadwal dengan pengajar yang berbahasa Indonesia.`]
      : []),
    `Kamu ingin tahu harga persisnya di muka: privat ${N} mulai ${rupiah(priv)}/sesi, tanpa harus konsultasi dulu.`,
    `Kamu ingin kurikulum yang bisa dilihat sebelum membayar — silabus ${N} dari ${F.cefrLevels} terbuka di halaman silabus.`,
    "Kamu lebih nyaman dijelaskan dalam bahasa Indonesia oleh pengajar yang paham kesulitan penutur Indonesia.",
    ...(reguler ? [`Kamu mau kelas grup terjadwal yang murah: Kelas Reguler ${N} ${F.price.regulerLabel}.`] : []),
    "Kamu butuh rekaman tiap sesi untuk diulang sendiri.",
  ];

  const jawaban = `Kursus ${N} online terbaik tergantung tujuanmu. Untuk belajar terstruktur dari nol dengan pengajar yang menjelaskan dalam bahasa Indonesia, ${F.name} membuka kelas privat ${N} via Zoom mulai ${rupiah(priv)} per sesi 60 menit${reguler ? ` dan kelas grup reguler ${F.price.regulerLabel}` : ""}. ${
    ujian
      ? `Kalau yang dibutuhkan sertifikat ujian resmi (${ujianSingkat}), ${lembagaResmi ? `${lembagaResmi.nama} lebih tepat` : "ujiannya harus diambil di penyelenggara resmi"}. `
      : ""
  }${daerah ? `Kalau tinggal di daerah asal bahasanya, tutor lokal bisa jadi pilihan.` : `Kalau ingin memilih tutor sendiri, marketplace seperti italki dan Preply lebih fleksibel.`}`;

  const faq = [
    { q: `Apa kursus ${N} online terbaik?`, a: jawaban },
    {
      q: `Berapa biaya kursus ${N} online?`,
      a: `Di ${F.name}, kelas privat ${N} mulai ${rupiah(priv)} per sesi 60 menit untuk level A1, dan semi privat mulai ${rupiah(semi)} per siswa per sesi untuk dua orang${reguler ? `. Kelas Reguler ${N} ${F.price.regulerLabel} untuk 8 pertemuan @90 menit` : ""}. Harga naik mengikuti level. Harga lembaga lain berbeda-beda dan sebaiknya dicek langsung di situs resminya.`,
    },
    ...(ujian
      ? [
          {
            q: `Apa ujian resmi ${N}?`,
            a: `Ujian kemahiran ${N} yang diakui adalah ${ujian}. E-certificate dari kursus mana pun, termasuk ${F.name}, adalah bukti penyelesaian kursus dan bukan pengganti sertifikat ujian resmi tersebut.`,
          },
        ]
      : []),
    {
      q: `Apakah ada kursus ${N} online dengan pengajar native?`,
      a: native
        ? `Ada. ${F.name} menyediakan pengajar native ${N} dengan tarif dua kali pengajar lokal. Marketplace seperti italki dan Preply juga menyediakan tutor penutur asli dengan tarif yang ditentukan masing-masing tutor.`
        : `Pengajar ${N} di ${F.name} saat ini adalah pengajar Indonesia yang menguasai bahasa tersebut. Kalau kamu spesifik mencari penutur asli, marketplace seperti italki dan Preply lebih tepat.`,
    },
    {
      q: "Apakah Linguo.id terpercaya?",
      a: `${GOOGLE_REVIEWS_SENTENCE} ${F.name} dikelola ${F.legalName} dan beroperasi sejak ${F.foundingYear}.`,
    },
  ];

  return {
    urlSlug,
    languageSlug: detail.languageSlug,
    N,
    NBesar,
    ujian,
    pilihan,
    tujuan,
    bukan,
    cocok,
    jawaban,
    faq,
    testimoni: testimonialsForLang(urlSlug),
    path: `/perbandingan/bahasa-${urlSlug}`,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const d = build((await params).lang);
  if (!d) return { title: "Tidak ditemukan | Linguo.id", robots: { index: false, follow: false } };
  return pageMetadata({
    path: d.path,
    title: `Kursus ${d.NBesar} Online Terbaik ${TAHUN}: Perbandingan Jujur | ${F.name}`,
    description: `Perbandingan kursus ${d.N} online: ${F.name}, ${d.pilihan
      .slice(1, 4)
      .map((p) => p.nama)
      .join(", ")}. Harga, format, kelebihan, dan kapan masing-masing paling cocok. Diperbarui ${DIPERBARUI}.`,
    keywords: [
      `kursus ${d.N} online terbaik`,
      `les ${d.N} online`,
      `kursus ${d.N} online murah`,
      `tempat belajar ${d.N}`,
      `rekomendasi kursus ${d.N}`,
    ],
  });
}

export default async function PerbandinganBahasaPage({ params }: PageProps) {
  const d = build((await params).lang);
  if (!d) notFound();
  const url = `${F.url}${d.path}`;

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": url,
    url,
    name: `Kursus ${d.NBesar} Online Terbaik ${TAHUN}`,
    description: d.jawaban,
    inLanguage: "id-ID",
    dateModified: PERBANDINGAN_BAHASA_UPDATED.toISOString().slice(0, 10),
    isPartOf: { "@id": `${F.url}/#website` },
    publisher: { "@id": `${F.url}/#organization` },
  };

  return (
    <>
      <BreadcrumbLd
        trail={[
          { name: "Perbandingan Platform", path: "/perbandingan" },
          { name: `Kursus ${d.NBesar}`, path: d.path },
        ]}
      />
      <script type="application/ld+json" {...jsonLd(webPage)} />
      <script type="application/ld+json" {...jsonLd(faqSchema(d.faq, url))} />

      <main className="min-h-screen bg-white text-slate-900">
        {/* HERO + jawaban langsung */}
        <section className="bg-[#1A9E9E] text-white pt-24 pb-12 lg:pt-32 lg:pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <nav aria-label="Breadcrumb" className="text-sm text-white/70 mb-5">
              <Link href="/" className="hover:text-white transition-colors">Beranda</Link>
              <span className="mx-2">/</span>
              <Link href="/perbandingan" className="hover:text-white transition-colors">Perbandingan</Link>
              <span className="mx-2">/</span>
              <span className="text-white">{d.NBesar}</span>
            </nav>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              Kursus {d.NBesar} Online Terbaik {TAHUN}: Perbandingan Jujur
            </h1>
            <p className="text-white/90 text-base sm:text-lg leading-relaxed">{d.jawaban}</p>
            <p className="text-white/70 text-sm mt-4">
              Diperbarui <time dateTime={PERBANDINGAN_BAHASA_UPDATED.toISOString().slice(0, 10)}>{DIPERBARUI}</time>
              {" · "}ditulis oleh tim {F.name}, jadi kami juga menulis kapan {F.name} bukan pilihan terbaik.
            </p>
          </div>
        </section>

        {/* TUJUAN → PILIHAN */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
          <h2 className="font-heading text-xl sm:text-2xl font-bold mb-5">
            Pilihan terbaik menurut tujuanmu
          </h2>
          <div className="rounded-2xl border border-slate-200 divide-y divide-slate-200 overflow-hidden">
            {d.tujuan.map((t) => (
              <div key={t.tujuan} className="grid sm:grid-cols-2 gap-1 sm:gap-4 px-4 py-3 text-sm">
                <div className="font-semibold text-slate-700">{t.tujuan}</div>
                <div className="text-slate-900">{t.pilihan}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TABEL PEMBANDING */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-10 lg:pb-14">
          <h2 className="font-heading text-xl sm:text-2xl font-bold mb-2">
            Perbandingan pilihan kursus {d.N}
          </h2>
          <p className="text-sm text-slate-600 mb-5">
            Harga pihak lain sengaja tidak ditulis: berubah sewaktu-waktu dan sebagian
            ditentukan tiap tutor. Yang dibandingkan struktur harganya — untuk nominal
            terbaru, cek situs resmi masing-masing.
          </p>
          <div className="space-y-4">
            {d.pilihan.map((p, i) => (
              <article
                key={p.nama}
                className={`rounded-2xl border p-5 ${i === 0 ? "border-[#1A9E9E] bg-[#1A9E9E]/5" : "border-slate-200"}`}
              >
                <h3 className={`font-bold text-lg ${i === 0 ? "text-[#1A9E9E]" : "text-slate-900"}`}>{p.nama}</h3>
                <p className="text-sm text-slate-500 mb-3">{p.tipe}</p>
                <dl className="grid sm:grid-cols-[9rem_1fr] gap-x-4 gap-y-2 text-sm">
                  <dt className="font-semibold text-slate-600">Format</dt>
                  <dd className="text-slate-800">{p.format}</dd>
                  <dt className="font-semibold text-slate-600">Struktur harga</dt>
                  <dd className="text-slate-800">{p.harga}</dd>
                  <dt className="font-semibold text-slate-600">Paling cocok</dt>
                  <dd className="text-slate-800">{p.cocok}</dd>
                  <dt className="font-semibold text-slate-600">Kekurangan</dt>
                  <dd className="text-slate-800">{p.kurang}</dd>
                </dl>
              </article>
            ))}
          </div>
        </section>

        {/* KAPAN BUKAN */}
        <section className="bg-slate-50 border-y border-slate-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
            <h2 className="font-heading text-xl sm:text-2xl font-bold mb-6">
              Kapan {F.name} bukan pilihan terbaik untuk {d.N}?
            </h2>
            <div className="space-y-4">
              {d.bukan.map((b) => (
                <div key={b.kondisi} className="rounded-2xl bg-white border border-slate-200 p-5">
                  <div className="flex gap-3">
                    <X className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" aria-hidden />
                    <div>
                      <h3 className="font-bold text-slate-900 mb-2">{b.kondisi}</h3>
                      <p className="text-sm text-slate-700 leading-relaxed">{b.alasan}</p>
                      <p className="text-sm text-slate-500 mt-2">
                        <span className="font-semibold text-slate-700">Lebih cocok:</span> {b.kemana}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* KAPAN COCOK + ULASAN */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
          <h2 className="font-heading text-xl sm:text-2xl font-bold mb-5">
            Kapan {F.name} pilihan yang tepat untuk {d.N}?
          </h2>
          <ul className="space-y-3">
            {d.cocok.map((k) => (
              <li key={k} className="flex gap-2.5 text-slate-700">
                <Check className="w-5 h-5 mt-0.5 shrink-0 text-[#1A9E9E]" aria-hidden />
                <span className="leading-relaxed">{k}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-2xl border border-slate-200 p-5">
            <a
              href={G.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-slate-900 hover:text-[#1A9E9E] transition-colors"
            >
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" aria-hidden />
              {G.ratingLabel} dari {G.countLabel} ulasan Google
            </a>
            <p className="text-sm text-slate-600 mt-1">{GOOGLE_REVIEWS_SENTENCE}</p>
            {d.testimoni.map((t) => (
              <figure key={t.name} className="mt-4 border-t border-slate-100 pt-4">
                <blockquote className="text-sm text-slate-700 leading-relaxed">&ldquo;{t.text}&rdquo;</blockquote>
                <figcaption className="text-sm font-semibold text-slate-900 mt-2">
                  {t.name} <span className="font-normal text-slate-500">· siswa kelas {d.N}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-slate-50 border-t border-slate-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
            <h2 className="font-heading text-xl sm:text-2xl font-bold mb-6">
              Pertanyaan yang sering diajukan
            </h2>
            <div className="space-y-8">
              {d.faq.map((f) => (
                <div key={f.q}>
                  <h3 className="font-bold text-slate-900 mb-2">{f.q}</h3>
                  <p className="text-slate-700 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mt-10">
              <Link
                href={`/kursus/bahasa-${d.urlSlug}`}
                className="rounded-xl bg-[#1A9E9E] text-white font-semibold px-5 py-3 hover:bg-[#178888] transition-colors"
              >
                Lihat Kursus {d.NBesar}
              </Link>
              <Link
                href={`/silabus/${d.languageSlug}`}
                className="rounded-xl bg-white border border-slate-200 font-semibold px-5 py-3 hover:border-[#1A9E9E] transition-colors"
              >
                Silabus {d.NBesar}
              </Link>
              <Link
                href="/kelas-trial"
                className="rounded-xl bg-white border border-slate-200 font-semibold px-5 py-3 hover:border-[#1A9E9E] transition-colors"
              >
                Coba Kelas Trial
              </Link>
            </div>

            <nav aria-label="Halaman terkait" className="flex flex-wrap gap-x-6 gap-y-2 mt-8 text-sm text-slate-600">
              <Link href="/perbandingan" className="hover:text-[#1A9E9E] transition-colors">Perbandingan semua platform</Link>
              <Link href="/harga" className="hover:text-[#1A9E9E] transition-colors">Harga lengkap</Link>
              <Link href="/tentang" className="hover:text-[#1A9E9E] transition-colors">Tentang {F.name}</Link>
            </nav>
          </div>
        </section>
      </main>
    </>
  );
}
