// src/app/kursus/page.tsx
//
// [seo-kelas-hub-v1] Dua masalah sekaligus diselesaikan halaman ini:
//
// 1. Breadcrumb di /kursus/bahasa-* menaut ke induknya — padahal dulu rute itu
//    tidak pernah ada (hanya folder [lang]). Jadi tautan induk di setiap landing
//    page bahasa mendarat di 404.
// 2. Landing page bahasa jadi halaman yatim: tidak ada satu pun tautan internal
//    menuju ke sana dari mana pun di situs, jadi crawler tidak punya jalan masuk
//    meski schema & metadata-nya sudah rapi.
//
// Halaman ini menjadi hub-nya: satu tempat yang menaut ke semua landing bahasa,
// ditaut balik dari footer homepage.

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { RectFlag, FLAG_CODE_BY_SLUG } from "@/components/RectFlag";
import {
  getAllLanguageDetailSlugs,
  getLanguageDetailBySlug,
  getLanguageMetaForDetail,
} from "@/data/languages-detail";
import { languages as curriculumLanguages } from "@/data/curriculum";

const BASE = "https://linguo.id";
const WA = "6282217866789";

export const metadata: Metadata = {
  title: "Kursus Bahasa Asing Online — 60+ Bahasa, Kelas Live 1-on-1 | Linguo.id",
  description:
    "Pilih kelas bahasa yang kamu mau: Inggris, Jepang, Korea, Mandarin, dan 60+ bahasa lain. Kelas live via Zoom bersama pengajar berpengalaman, mulai Rp90.000/sesi.",
  keywords: [
    "kursus bahasa asing online",
    "les bahasa online",
    "kursus bahasa online indonesia",
    "belajar bahasa asing",
    "kelas bahasa private online",
  ],
  alternates: { canonical: `${BASE}/kursus` },
  openGraph: {
    title: "Kursus Bahasa Asing Online — 60+ Bahasa | Linguo.id",
    description:
      "Kelas live via Zoom bersama pengajar berpengalaman. 60+ bahasa, mulai Rp90.000/sesi.",
    url: `${BASE}/kursus`,
    siteName: "Linguo.id",
    locale: "id_ID",
    type: "website",
  },
};

/** Bahasa yang punya landing page sendiri (konten lengkap + Course schema). */
function getFeaturedLanguages() {
  return getAllLanguageDetailSlugs()
    .map((slug) => {
      const detail = getLanguageDetailBySlug(slug);
      if (!detail) return null;
      const meta = getLanguageMetaForDetail(detail);
      if (!meta) return null;
      return { slug, detail, meta };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

export default function KelasIndexPage() {
  const featured = getFeaturedLanguages();
  const featuredSlugs = new Set(featured.map((f) => f.detail.languageSlug));

  // Sisa bahasa yang tersedia tapi belum punya landing sendiri — tetap ditaut
  // ke silabusnya supaya tidak ada halaman yatim di sisi kurikulum juga.
  const lainnya = curriculumLanguages.filter(
    (l) => l.available && !featuredSlugs.has(l.slug),
  );

  // ItemList membantu Google memahami bahwa ini halaman koleksi, dan
  // memunculkan landing bahasa sebagai hasil turunan.
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Daftar kursus bahasa Linguo.id",
    itemListElement: featured.map((f, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `Kursus Bahasa ${f.meta.name}`,
      url: `${BASE}/kursus/bahasa-${f.detail.urlSlug}`,
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: BASE },
      { "@type": "ListItem", position: 2, name: "Kursus Bahasa", item: `${BASE}/kursus` },
    ],
  };

  return (
    <>
      {/* [seo-review-schema-v1] <script> biasa, bukan <Script> next/script —
          next/script baru menyuntikkan tag-nya sesudah hidrasi, jadi schema
          ini tidak pernah muncul di HTML mentah yang dibaca crawler. */}
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* HERO */}
      <section className="bg-[#1A9E9E] text-white pt-24 pb-14 lg:pt-32 lg:pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <nav aria-label="Breadcrumb" className="text-sm text-white/70 mb-5">
            <Link href="/" className="hover:text-white transition-colors">Beranda</Link>
            <span className="mx-2">/</span>
            <span className="text-white">Kelas Bahasa</span>
          </nav>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
            Kursus Bahasa Asing Online
          </h1>
          <p className="text-white/85 text-base sm:text-lg max-w-2xl leading-relaxed">
            60+ bahasa, kelas live 1-on-1 maupun grup via Zoom bersama pengajar
            berpengalaman. Materi disesuaikan tujuanmu — mulai Rp90.000 per sesi.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6 text-sm text-white/85">
            {["Rekaman tiap sesi", "Bebas pilih jadwal", "E-Certificate", "Pengajar tersertifikasi"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 shrink-0" aria-hidden />{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* BAHASA UNGGULAN — kartu penuh, tiap kartu punya landing sendiri */}
      <section className="bg-white py-14 lg:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-2">
            Bahasa Paling Diminati
          </h2>
          <p className="text-slate-600 mb-8">
            Kurikulum, harga, dan jadwal lengkapnya bisa kamu lihat di halaman masing-masing.
          </p>

          <div className="grid sm:grid-cols-2 gap-5">
            {featured.map(({ detail, meta }) => (
              <Link
                key={detail.urlSlug}
                href={`/kursus/bahasa-${detail.urlSlug}`}
                className="group block rounded-2xl border border-slate-200 p-6 hover:border-[#1A9E9E] hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <RectFlag code={FLAG_CODE_BY_SLUG[detail.languageSlug]} h={30} />
                  <h3 className="font-heading text-xl font-bold text-slate-900">
                    Kursus Bahasa {meta.name}
                  </h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  {detail.tagline}
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A9E9E]">
                  Lihat kurikulum &amp; harga
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BAHASA LAIN — tautan ringkas ke silabus masing-masing */}
      <section className="bg-slate-50 py-14 lg:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-2">
            Bahasa Lain yang Tersedia
          </h2>
          <p className="text-slate-600 mb-8">
            Semua bahasa di bawah bisa diambil sebagai Kelas Private. Klik untuk melihat silabusnya.
          </p>

          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2.5">
            {lainnya.map((l) => (
              <li key={l.slug}>
                <Link
                  href={`/silabus/${l.slug}`}
                  className="flex items-center gap-2.5 py-1.5 text-sm text-slate-700 hover:text-[#1A9E9E] transition-colors"
                >
                  <RectFlag code={FLAG_CODE_BY_SLUG[l.slug]} h={18} />
                  <span className="truncate">Bahasa {l.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA + tautan silang ke halaman publik lain (bantu perataan crawler) */}
      <section className="bg-white py-14 lg:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-2xl bg-[#1A9E9E] text-white p-8 sm:p-10">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-3">
              Belum yakin mulai dari mana?
            </h2>
            <p className="text-white/85 mb-6 max-w-xl leading-relaxed">
              Ikut kelas trial dulu, atau cek jadwal kelas reguler yang sedang dibuka.
              Tim kami juga siap bantu menentukan level lewat WhatsApp.
            </p>
            <div className="flex flex-wrap gap-3">
              {/* [daftar-page-funnel-v1] Hub kursus sebelumnya tidak punya jalan
                  masuk ke pendaftaran sama sekali — pengunjung harus mundur ke
                  halaman bahasa dulu. */}
              <Link href="/daftar" className="rounded-xl bg-white text-[#1A9E9E] font-semibold px-5 py-3 hover:bg-white/90 transition-colors">
                Daftar Sekarang
              </Link>
              <Link href="/kelas-trial" className="rounded-xl bg-white/15 font-semibold px-5 py-3 hover:bg-white/25 transition-colors">
                Ikut Kelas Trial
              </Link>
              <Link href="/jadwal-kelas-reguler" className="rounded-xl bg-white/15 font-semibold px-5 py-3 hover:bg-white/25 transition-colors">
                Jadwal Kelas Reguler
              </Link>
              <a href={`https://wa.me/${WA}?text=${encodeURIComponent("Halo Linguo, saya mau tanya kelas bahasa.")}`}
                target="_blank" rel="noopener noreferrer"
                className="rounded-xl bg-white/15 font-semibold px-5 py-3 hover:bg-white/25 transition-colors">
                Tanya via WhatsApp
              </a>
            </div>
          </div>

          <nav aria-label="Halaman terkait" className="flex flex-wrap gap-x-6 gap-y-2 mt-8 text-sm text-slate-600">
            <Link href="/harga" className="hover:text-[#1A9E9E] transition-colors">Harga Kelas</Link>
            <Link href="/persiapan-tes" className="hover:text-[#1A9E9E] transition-colors">Persiapan TOEFL &amp; IELTS</Link>
            <Link href="/kelas-anak" className="hover:text-[#1A9E9E] transition-colors">Kelas Anak</Link>
            <Link href="/silabus" className="hover:text-[#1A9E9E] transition-colors">Silabus &amp; Kurikulum</Link>
            <Link href="/corporate" className="hover:text-[#1A9E9E] transition-colors">Kelas Corporate</Link>
            <Link href="/blog" className="hover:text-[#1A9E9E] transition-colors">Blog</Link>
          </nav>
        </div>
      </section>
    </>
  );
}
