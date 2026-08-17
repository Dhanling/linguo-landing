// src/app/kursus/[lang]/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getAllLanguageDetailSlugs,
  getLanguageDetailBySlug,
  getLanguageMetaForDetail,
  type LanguageDetail,
} from "../../../data/languages-detail";
import {
  aggregateRatingFor,
  testimonialsForLang,
  type Testimonial,
} from "../../../data/testimonials";
import { ArrowRight, Check, DetailIcon } from "./DetailIcon";
import LanguageSwitcher, { type LangOption } from "./LanguageSwitcher";
import {
  getLanguageCategory,
  PRICE_PRIVATE_60MIN,
  SEMI_PRIVATE_PRICE_BASIC,
} from "../../../lib/trial-pricing";
import { REGULER_LANGS } from "../../../lib/programLanguages";

// ============================================================================
// PARAM PARSING
// URL pattern is /kursus/bahasa-{slug} which matches [lang] folder.
// params.lang will contain the FULL segment (e.g. "bahasa-korea"),
// so we strip the "bahasa-" prefix before looking up detail data.
// ============================================================================

function parseBahasaSlug(lang: string): string | null {
  if (!lang.startsWith("bahasa-")) return null;
  return lang.slice("bahasa-".length);
}

// ============================================================================
// STATIC PARAMS — generates 1 static page per bahasa at build time
// ============================================================================

export async function generateStaticParams() {
  return getAllLanguageDetailSlugs().map((slug) => ({ lang: `bahasa-${slug}` }));
}

// ============================================================================
// METADATA — per-bahasa SEO
// ============================================================================

type PageProps = {
  params: Promise<{ lang: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const slug = parseBahasaSlug(lang);
  if (!slug) {
    return {
      title: "Bahasa tidak ditemukan | Linguo.id",
      robots: { index: false, follow: false },
    };
  }
  const detail = getLanguageDetailBySlug(slug);
  if (!detail) {
    return {
      title: "Bahasa tidak ditemukan | Linguo.id",
      robots: { index: false, follow: false },
    };
  }

  const url = `https://linguo.id/kursus/${lang}`;

  return {
    title: detail.metaTitle,
    description: detail.metaDescription,
    keywords: detail.metaKeywords,
    alternates: { canonical: url },
    openGraph: {
      title: detail.metaTitle,
      description: detail.metaDescription,
      type: "website",
      locale: "id_ID",
      url,
      siteName: "Linguo.id",
    },
    twitter: {
      card: "summary_large_image",
      title: detail.metaTitle,
      description: detail.metaDescription,
    },
  };
}

// ============================================================================
// HELPERS
// ============================================================================

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const buildWaLink = (langName: string) => {
  // Linguo official WA number
  const number = "6282217866789";
  const text = encodeURIComponent(
    `Halo Linguo, saya tertarik mendaftar Kursus Bahasa ${langName}. Bisa info jadwal & promo terbaru?`,
  );
  return `https://wa.me/${number}?text=${text}`;
};

// linguo-patch:kelas-funnel-cta-v1 — tombol Daftar TIDAK lagi ke WA, tapi ke
// funnel pendaftaran (FunnelModal) yang cuma di-mount di homepage: redirect
// "/?openFunnel=1&lang=<Inggris>". Nama bahasa WAJIB nama Inggris ("Swedish"),
// bukan meta.name Indonesia — lookup bendera & kategori harga (trial-pricing)
// pakai nama Inggris. Mirror FUNNEL_LANG_OVERRIDE di PlacementTest.tsx.
const FUNNEL_LANG_OVERRIDE: Record<string, string> = {
  filipino: "Tagalog",
  "portuguese-br": "Portuguese",
  "portuguese-pt": "Portuguese",
  bipa: "BIPA",
};

const funnelLangName = (languageSlug: string) =>
  FUNNEL_LANG_OVERRIDE[languageSlug] ||
  languageSlug.charAt(0).toUpperCase() + languageSlug.slice(1);

const buildFunnelHref = (languageSlug: string, urlSlug: string) =>
  `/?openFunnel=1&lang=${encodeURIComponent(funnelLangName(languageSlug))}&from=${encodeURIComponent(`kelas-bahasa-${urlSlug}`)}`;

// ============================================================================
// linguo-patch:kelas-pricelist-sync-v1
// Harga kartu TIDAK lagi pakai defaultPricing hardcode (100/75/50rb rata semua
// bahasa) — dihitung dari pricelist resmi src/lib/trial-pricing.ts per KATEGORI
// bahasa (A–E), sama seperti funnel & /harga. detail.pricing di
// languages-detail.ts sengaja diabaikan.
// - Privat: PRICE_PRIVATE_60MIN[cat][0] (level A1, 60 menit)
// - Semi Privat: SEMI_PRIVATE_PRICE_BASIC[cat][1] / 2 (2 siswa, per siswa)
// - Reguler: paket flat Rp 150.000/2 bulan (mirror REGULER_PRICE di
//   FunnelModal.tsx & api/create-funnel-invoice) — HANYA bahasa REGULER_LANGS
// ============================================================================

const REGULER_PACKAGE_PRICE = 150000;

type ComputedTier = {
  name: string;
  price: number;
  priceUnit: string;
  sub: string;
  features: string[];
  highlighted?: boolean;
  ctaLabel: string;
  note?: string;
};

function buildPricingTiers(languageSlug: string): ComputedTier[] {
  const langEn = funnelLangName(languageSlug);
  // Fallback "C" mirror getPrivateBase60 — jangan sampai halaman tanpa harga.
  const cat = getLanguageCategory(langEn) || "C";
  const privA1 = PRICE_PRIVATE_60MIN[cat][0];
  const semi2PerStudent = Math.round(SEMI_PRIVATE_PRICE_BASIC[cat][1] / 2);

  const tiers: ComputedTier[] = [
    {
      name: "Privat 1:1",
      price: privA1,
      priceUnit: "per sesi",
      sub: "1 siswa • 60 menit",
      features: [
        "Jadwal fleksibel sesuai kesibukan",
        "Materi disesuaikan target kamu",
        "Pengajar bersertifikat",
        "Akses LMS Linguo & rekaman sesi",
      ],
      highlighted: true,
      ctaLabel: "Daftar Privat",
      note: "Harga level A1 — level lanjut menyesuaikan pricelist.",
    },
    {
      name: "Semi Privat",
      price: semi2PerStudent,
      priceUnit: "per siswa / sesi",
      sub: "2–10 siswa • 60 menit",
      features: [
        "Belajar bareng teman / pasangan",
        "Tetap personal, lebih hemat",
        "Makin ramai makin hemat per siswa",
        "Pengajar bersertifikat + akses LMS",
      ],
      ctaLabel: "Daftar Semi Privat",
      note: "Harga grup 2 siswa, level A1.",
    },
  ];

  if (REGULER_LANGS.includes(langEn)) {
    tiers.push({
      name: "Reguler (Grup)",
      price: REGULER_PACKAGE_PRICE,
      priceUnit: "per 2 bulan",
      sub: "8–15 siswa • 90 menit",
      features: [
        "Belajar bareng komunitas",
        "Jadwal fix mingguan",
        "Materi terstruktur per batch",
        "Harga paling terjangkau",
      ],
      ctaLabel: "Daftar Reguler",
      note: "*Level A1 — kelas dibuka minimal 8 peserta.",
    });
  }

  return tiers;
}

// Placement test per bahasa hidup di /silabus/<slug>/coba (route /placement-test
// tidak pernah ada — tombol lama 404).
const buildPlacementHref = (languageSlug: string) => `/silabus/${languageSlug}/coba`;

// ============================================================================
// PAGE
// ============================================================================

// [kursus-language-switcher-v1] Daftar bahasa untuk pemilih di hero. Dihitung di
// server (halaman ini statis, jadi ikut ter-render sekali saat build) dan dioper
// sebagai prop — supaya languages-detail.ts yang 7.000+ baris tidak ikut terbawa
// ke bundle browser.
function buildLangOptions(): LangOption[] {
  return getAllLanguageDetailSlugs()
    .map((slug): LangOption | null => {
      const d = getLanguageDetailBySlug(slug);
      if (!d) return null;
      const m = getLanguageMetaForDetail(d);
      if (!m) return null;
      return {
        urlSlug: d.urlSlug,
        languageSlug: d.languageSlug,
        name: m.name,
        nativeName: m.nativeName ?? m.name,
        region: m.region ?? "other",
      };
    })
    .filter((x) => x !== null);
}

export default async function BahasaLandingPage({ params }: PageProps) {
  const { lang } = await params;
  const slug = parseBahasaSlug(lang);
  if (!slug) notFound();
  const detail = getLanguageDetailBySlug(slug);
  if (!detail) notFound();

  const meta = getLanguageMetaForDetail(detail);
  if (!meta) notFound();

  // [seo-review-schema-v1] Hanya testimoni bahasa INI, dan hanya kalau ada.
  // Yang dirender di halaman = persis yang di-markup di Course schema.
  const testimonials = testimonialsForLang(detail.urlSlug);
  const courseSchema = buildCourseSchema(detail, meta.name, testimonials);
  const faqSchema = buildFAQSchema(detail);

  return (
    <>
      {/* [seo-review-schema-v1] Dulu <Script> dari next/script. Dengan strategy
          bawaan (afterInteractive) tag-nya baru disuntikkan SESUDAH hidrasi,
          jadi Course & FAQ schema tidak pernah ada di HTML mentah — yang
          terkirim ke crawler cuma payload RSC ber-escape. Diganti <script>
          biasa, sama seperti Organization/WebSite di src/app/layout.tsx yang
          memang muncul di HTML. */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="min-h-screen bg-white text-slate-900">
        <Breadcrumb langName={meta.name} />
        <Hero
          detail={detail}
          nativeName={meta.nativeName ?? meta.name}
          langName={meta.name}
          langOptions={buildLangOptions()}
        />
        <WhyLearn detail={detail} langName={meta.name} />
        <TargetAudience detail={detail} langName={meta.name} />
        <Curriculum detail={detail} langName={meta.name} />
        <Pricing detail={detail} langName={meta.name} />
        <Teachers langName={meta.name} />
        <Testimonials items={testimonials} langName={meta.name} />
        <FAQSection detail={detail} langName={meta.name} />
        <FinalCTA detail={detail} langName={meta.name} />
      </main>
    </>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function Breadcrumb({ langName }: { langName: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="border-b border-slate-100 bg-slate-50/50"
    >
      <ol className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 text-sm text-slate-600">
        <li>
          <Link href="/" className="hover:text-[#1A9E9E]">
            Beranda
          </Link>
        </li>
        <li aria-hidden className="text-slate-400">
          /
        </li>
        <li>
          <Link href="/kursus" className="hover:text-[#1A9E9E]">
            Kursus
          </Link>
        </li>
        <li aria-hidden className="text-slate-400">
          /
        </li>
        <li className="font-medium text-slate-900" aria-current="page">
          Bahasa {langName}
        </li>
      </ol>
    </nav>
  );
}

// Ilustrasi hero per bahasa (PNG transparan, ditaruh di public/images/lang-hero/).
// Key = detail.languageSlug. Bahasa tanpa entri di sini tetap pakai hero teks
// satu kolom seperti sebelumnya.
const HERO_ILLUSTRATION: Record<string, string> = {
  korean: "/images/lang-hero/korean.png",
  mandarin: "/images/lang-hero/mandarin.png",
  english: "/images/lang-hero/english.png",
};

function Hero({
  detail,
  nativeName,
  langName,
  langOptions,
}: {
  detail: LanguageDetail;
  nativeName: string;
  langName: string;
  langOptions: LangOption[];
}) {
  const illustration = HERO_ILLUSTRATION[detail.languageSlug] ?? null;

  /* Ukuran judul turun bertahap mengikuti panjang baris pertama, supaya "Online"
     selalu jatuh di baris kedua dan baris pertamanya tak pernah patah.

     Ambang tahap pertama sengaja 24, bukan 21: nama bahasa terpanjang yang ada
     cuma "Finlandia" (23 huruf sebaris dengan "Kursus Bahasa"), jadi ambang 21
     bikin Mandarin/Thailand/Portugis dkk turun kelas ke 2.6rem — judulnya jadi
     kelihatan lebih kecil daripada halaman Korea padahal kolomnya sama lebar.
     Di 680px, lebar kolom teks tersempit di halaman berilustrasi, 24 huruf pada
     3rem masih makan ~580px. Dua tahap sisanya jaring pengaman kalau nanti ada
     nama panjang seperti "Portugis (Brasil)". */
  const barisJudul = `Kursus Bahasa ${langName}`;
  const ukuranJudul =
    barisJudul.length > 29
      ? "text-[clamp(1.2rem,3.9vw,2.15rem)]"
      : barisJudul.length > 24
        ? "text-[clamp(1.45rem,4.6vw,2.6rem)]"
        : "text-[clamp(1.55rem,5.2vw,3rem)]";

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1A9E9E] via-[#168585] to-[#0e6e6e] text-white">
      {/* Soft pattern overlay */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
        {/* Ilustrasi dulu memakan hampir separuh baris (0.95fr), dan kolom teks
            yang tersisa terlalu sempit untuk judul sepanjang "Kursus Bahasa
            Mandarin" — judulnya pecah tiga baris, tombolnya ikut turun. Teks
            yang menjual, gambarnya pelengkap: porsinya dibalik jadi 1.25 : 0.75
            — dan di rentang 1024–1279px, tempat kolomnya paling sempit, gambar
            mengalah sekali lagi ke 0.6fr. Di situ penjelasan kelas mulai kena
            potong elipsis kalau porsinya dipaksa sama dengan layar lebar. */}
        <div
          className={
            illustration
              ? "grid items-center gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)] lg:gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]"
              : ""
          }
        >
        <div className={`flex flex-col items-start gap-6 ${illustration ? "" : "md:max-w-3xl"}`}>
          {/* [kursus-language-switcher-v1] Pil bendera + nama asli bahasa ini
              sekarang jadi tombol pemilih bahasa: satu klik pindah ke landing
              bahasa lain, tanpa mampir ke hub /kursus dulu. */}
          <LanguageSwitcher
            options={langOptions}
            currentSlug={detail.urlSlug}
            currentNativeName={nativeName}
          />

          {/* Dua baris, apa pun bahasanya: "Online" selalu turun sendiri, dan
              baris pertamanya diukur di `ukuranJudul` supaya tidak pernah patah. */}
          <h1 className={`${ukuranJudul} font-bold leading-[1.12] tracking-tight`}>
            <span className="block">{barisJudul}</span>
            <span className="block">Online</span>
          </h1>

          {/* Jatah baris dipatok: 1 untuk tagline, 2 untuk penjelasan — tapi
              HANYA di halaman berilustrasi, yang tinggi kolomnya harus seimbang
              dengan gambar di sebelahnya. Di 44 halaman bahasa lain kolomnya
              selebar hero dan penjelasan terpanjang (Belanda, 204 huruf) makan
              lebih dari dua baris: kalau ikut diklem, ekor kalimatnya hilang
              jadi elipsis di halaman yang justru mengandalkan teks itu untuk
              SEO. Di layar kecil jatahnya juga dilonggarkan. */}
          <p
            className={`text-[15px] text-white/90 md:text-base ${
              illustration ? "line-clamp-2 md:line-clamp-1" : ""
            }`}
          >
            {detail.tagline}
          </p>

          <p
            className={`text-sm leading-relaxed text-white/80 ${
              illustration ? "line-clamp-4 md:line-clamp-2" : ""
            }`}
          >
            {detail.heroDescription}
          </p>

          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href={buildFunnelHref(detail.languageSlug, detail.urlSlug)}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#1A9E9E] shadow-lg transition hover:scale-[1.02] hover:shadow-xl"
            >
              Daftar Bahasa {langName} Sekarang
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
            <Link
              href={buildPlacementHref(detail.languageSlug)}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-white/40 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              Tes Penempatan Gratis
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
            {["Pengajar bersertifikat", "Kurikulum CEFR A1–B2", "Jadwal fleksibel", "100% online"].map(
              (item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check aria-hidden className="h-4 w-4" /> {item}
                </span>
              ),
            )}
          </div>
        </div>

          {/* Gambar melebar ke kanan MELEWATI container, tepat sebanyak sisa
              ruang kosong di kanannya: (100vw − 72rem)/2, dipagari 8rem. Lebar
              kolom teks tak boleh ikut menyusut — penjelasan kelas cuma pas dua
              baris di lebar sekarang, sedikit saja dipersempit ekornya kena
              elipsis. Di bawah 1152px sisa ruangnya nol, jadi rumusnya sendiri
              yang mematikan pelebaran ini — gambar tak pernah kepotong tepi
              layar. */}
          {illustration && (
            <div className="relative hidden lg:-mr-[min(8rem,max(0px,(100vw-72rem)/2))] lg:block">
              <Image
                src={illustration}
                alt={`Belajar Bahasa ${langName} online bersama Linguo`}
                width={1200}
                height={800}
                priority
                sizes="(min-width: 1024px) 55vw, 0px"
                className="h-auto w-full drop-shadow-2xl"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function WhyLearn({ detail, langName }: { detail: LanguageDetail; langName: string }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <header className="mb-12 max-w-2xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#1A9E9E]">
          Kenapa Bahasa {langName}?
        </p>
        <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
          Bahasa yang membuka peluang nyata.
        </h2>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {detail.whyLearn.map((point) => (
          <article
            key={point.title}
            className="group rounded-2xl border border-slate-200 bg-white p-7 transition hover:border-[#1A9E9E]/40 hover:shadow-lg"
          >
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[#1A9E9E]/10 text-[#1A9E9E]">
              <DetailIcon emoji={point.icon} className="h-7 w-7" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-slate-900">{point.title}</h3>
            <p className="leading-relaxed text-slate-600">{point.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function TargetAudience({ detail, langName }: { detail: LanguageDetail; langName: string }) {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <header className="mb-12 max-w-2xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#1A9E9E]">
            Untuk Siapa
          </p>
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
            Siapa yang cocok belajar Bahasa {langName} di Linguo?
          </h2>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {detail.targetAudience.map((item) => (
            <div
              key={item.persona}
              className="flex gap-4 rounded-xl border border-slate-200 bg-white p-6"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#1A9E9E]/10 text-[#1A9E9E]">
                <DetailIcon emoji={item.emoji} className="h-6 w-6" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-slate-900">{item.persona}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{item.benefit}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Curriculum({ detail, langName }: { detail: LanguageDetail; langName: string }) {
  const totalSessions = detail.curriculum.reduce((sum, l) => sum + l.sessionCount, 0);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <header className="mb-12 max-w-2xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#1A9E9E]">
          Kurikulum CEFR
        </p>
        <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
          {totalSessions} sesi terstruktur dari A1 sampai B2.
        </h2>
        <p className="mt-3 text-slate-600">
          Kurikulum Linguo mengikuti standar internasional CEFR (Common European Framework of
          Reference). Setiap level dipecah jadi sublevel intensif berisi 16 sesi — total{" "}
          {totalSessions} sesi untuk perjalanan lengkap belajar Bahasa {langName}.
        </p>
      </header>

      <div className="space-y-4">
        {detail.curriculum.map((level, idx) => (
          <details
            key={level.level}
            className="group rounded-2xl border border-slate-200 bg-white open:border-[#1A9E9E]/40 open:shadow-md"
            open={idx === 0}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 marker:hidden">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#1A9E9E] font-bold text-white">
                  {level.level}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{level.title}</h3>
                  <p className="text-sm text-slate-500">{level.sessionCount} sesi</p>
                </div>
              </div>
              <span
                aria-hidden
                className="text-2xl text-slate-400 transition group-open:rotate-45"
              >
                +
              </span>
            </summary>

            <div className="border-t border-slate-100 px-6 pb-6 pt-4">
              <p className="mb-4 leading-relaxed text-slate-600">{level.description}</p>
              <ul className="space-y-2">
                {level.topics.map((topic) => (
                  <li key={topic} className="flex gap-3 text-slate-700">
                    <span className="mt-1 text-[#1A9E9E]" aria-hidden>
                      ▸
                    </span>
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function Pricing({ detail, langName }: { detail: LanguageDetail; langName: string }) {
  const tiers = buildPricingTiers(detail.languageSlug);

  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <header className="mb-12 max-w-2xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#1A9E9E]">
            Pilihan Kelas
          </p>
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
            Mulai sesuai gaya belajar kamu.
          </h2>
          <p className="mt-3 text-slate-600">
            {tiers.length === 3 ? "Tiga" : "Dua"} jenis kelas Bahasa {langName} dengan harga
            transparan, sama persis dengan pricelist resmi — tanpa kontrak panjang, tanpa biaya
            tersembunyi.
          </p>
        </header>

        <div
          className={`grid gap-6 ${
            tiers.length === 3 ? "md:grid-cols-3" : "mx-auto max-w-3xl md:grid-cols-2"
          }`}
        >
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className={`relative flex flex-col rounded-2xl p-7 ${
                tier.highlighted
                  ? "bg-[#1A9E9E] text-white shadow-xl ring-4 ring-[#1A9E9E]/20"
                  : "border border-slate-200 bg-white text-slate-900"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-4 py-1 text-xs font-bold uppercase tracking-wider text-slate-900 shadow">
                  Paling Populer
                </div>
              )}

              <h3 className="text-xl font-bold">{tier.name}</h3>
              <p className={`mt-1 text-sm ${tier.highlighted ? "text-white/80" : "text-slate-500"}`}>
                {tier.sub}
              </p>

              <div className="my-5">
                <div className="text-3xl font-bold">{formatRupiah(tier.price)}</div>
                <div className={`text-sm ${tier.highlighted ? "text-white/80" : "text-slate-500"}`}>
                  {tier.priceUnit}
                </div>
              </div>

              <ul className="mb-6 flex-1 space-y-2.5 text-sm">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex gap-2">
                    <Check
                      aria-hidden
                      className={`mt-0.5 h-4 w-4 shrink-0 ${tier.highlighted ? "text-white" : "text-[#1A9E9E]"}`}
                    />
                    <span className={tier.highlighted ? "text-white/95" : "text-slate-700"}>
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={buildFunnelHref(detail.languageSlug, detail.urlSlug)}
                className={`mt-auto inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-semibold transition ${
                  tier.highlighted
                    ? "bg-white text-[#1A9E9E] hover:bg-slate-50"
                    : "border-2 border-[#1A9E9E] text-[#1A9E9E] hover:bg-[#1A9E9E] hover:text-white"
                }`}
              >
                {tier.ctaLabel}
              </Link>

              {tier.note && (
                <p
                  className={`mt-3 text-center text-xs ${
                    tier.highlighted ? "text-white/70" : "text-slate-400"
                  }`}
                >
                  {tier.note}
                </p>
              )}
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Belum yakin level kamu di mana?{" "}
          <Link
            href={buildPlacementHref(detail.languageSlug)}
            className="font-semibold text-[#1A9E9E] hover:underline"
          >
            Ambil tes penempatan gratis →
          </Link>
        </p>
      </div>
    </section>
  );
}

// [seo-review-schema-v1] Bagian ini WAJIB ada supaya markup Review di Course
// schema sah: Google mensyaratkan review yang di-markup benar-benar terlihat
// pengunjung di halaman yang sama. Kalau bahasa ini belum punya testimoni,
// bagiannya tidak dirender — dan schema-nya juga tidak memuat rating.
function Testimonials({ items, langName }: { items: Testimonial[]; langName: string }) {
  if (items.length === 0) return null;

  return (
    <section className="border-y border-slate-100 bg-slate-50/60">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#1A9E9E]">
          Kata Siswa
        </p>
        <h2 className="mb-10 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
          Cerita siswa Kelas Bahasa {langName} di Linguo.
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {items.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="mb-3 flex gap-0.5" aria-label={`Rating ${t.rating} dari 5`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <span
                    key={i}
                    aria-hidden
                    className={i < t.rating ? "text-amber-400" : "text-slate-200"}
                  >
                    ★
                  </span>
                ))}
              </div>
              <blockquote className="flex-1 leading-relaxed text-slate-600">
                &ldquo;{t.text}&rdquo;
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${t.color} text-sm font-bold text-white`}
                >
                  {t.initials}
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-900">{t.name}</span>
                  <span className="block text-xs text-[#1A9E9E]">
                    Siswa Kelas Bahasa {t.langLabel}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Teachers({ langName }: { langName: string }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <div className="grid gap-10 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#1A9E9E]">
            Pengajar
          </p>
          <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
            Diajar oleh pengajar bersertifikat & native speaker.
          </h2>
          <div className="space-y-4 leading-relaxed text-slate-600">
            <p>
              Setiap pengajar Bahasa {langName} di Linguo wajib lulus seleksi 3 tahap: tes proficiency,
              demo teaching, dan probation 1 bulan. Mayoritas memiliki sertifikat formal seperti
              TESOL, TEFL, CELTA, atau sertifikasi pengajaran negara asal bahasanya.
            </p>
            <p>
              Untuk level pemula, pengajar Indonesia yang fasih digunakan supaya konsep tata bahasa
              bisa dijelaskan dengan Bahasa Indonesia. Untuk level menengah ke atas, opsi pengajar{" "}
              <span className="font-semibold text-slate-900">native speaker</span> tersedia untuk
              imersi pelafalan dan budaya.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { stat: "60+", label: "Bahasa diajarkan" },
            { stat: "200+", label: "Siswa aktif bulanan" },
            { stat: "5+", label: "Tahun pengalaman" },
            { stat: "4.9★", label: "Rata-rata rating" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6"
            >
              <div className="text-3xl font-bold text-[#1A9E9E]">{item.stat}</div>
              <div className="mt-1 text-sm text-slate-600">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection({ detail, langName }: { detail: LanguageDetail; langName: string }) {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-16 md:py-24">
        <header className="mb-10 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#1A9E9E]">
            Pertanyaan Umum
          </p>
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
            FAQ — Kursus Bahasa {langName}
          </h2>
        </header>

        <div className="space-y-3">
          {detail.faq.map((item) => (
            <details
              key={item.question}
              className="group rounded-xl border border-slate-200 bg-white open:border-[#1A9E9E]/40 open:shadow-md"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 marker:hidden">
                <h3 className="font-semibold text-slate-900">{item.question}</h3>
                <span
                  aria-hidden
                  className="shrink-0 text-2xl text-[#1A9E9E] transition group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="border-t border-slate-100 px-5 pb-5 pt-4 leading-relaxed text-slate-600">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA({ detail, langName }: { detail: LanguageDetail; langName: string }) {
  return (
    <section className="bg-gradient-to-br from-[#1A9E9E] to-[#0e6e6e] text-white">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center md:py-20">
        <h2 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
          Siap mulai belajar Bahasa {langName}?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
          Daftar langsung dan pilih program yang pas — atau ambil tes penempatan gratis dulu
          untuk tahu level kamu di mana. Butuh konsultasi? Tim kami siap di WhatsApp.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={buildFunnelHref(detail.languageSlug, detail.urlSlug)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-[#1A9E9E] shadow-lg transition hover:scale-[1.02] hover:shadow-xl"
          >
            Daftar Sekarang
            <ArrowRight aria-hidden className="h-5 w-5" />
          </Link>
          <Link
            href={buildPlacementHref(detail.languageSlug)}
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/40 px-8 py-4 font-semibold text-white transition hover:bg-white/10"
          >
            Tes Penempatan Gratis
          </Link>
        </div>

        <p className="mt-6 text-sm text-white/80">
          Mau tanya-tanya dulu?{" "}
          <a
            href={buildWaLink(langName)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white underline underline-offset-4 hover:text-white/90"
          >
            Chat WhatsApp tim Linguo →
          </a>
        </p>
      </div>
    </section>
  );
}

// ============================================================================
// JSON-LD STRUCTURED DATA
// ============================================================================

function buildCourseSchema(
  detail: LanguageDetail,
  langName: string,
  testimonials: Testimonial[] = [],
) {
  // [seo-review-schema-v1] aggregateRating & review hanya disertakan kalau
  // halaman ini benar-benar menampilkan testimoninya. Bahasa tanpa testimoni
  // tidak dapat rating sama sekali — schema tanpa bintang jauh lebih baik
  // daripada bintang yang tidak bisa dibuktikan di halaman.
  const rating = aggregateRatingFor(testimonials);

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `Kursus Bahasa ${langName}`,
    description: detail.metaDescription,
    ...(rating
      ? {
          aggregateRating: rating,
          review: testimonials.map((t) => ({
            "@type": "Review",
            author: { "@type": "Person", name: t.name },
            reviewRating: {
              "@type": "Rating",
              ratingValue: t.rating,
              bestRating: 5,
              worstRating: 1,
            },
            reviewBody: t.text,
            itemReviewed: { "@type": "Course", name: `Kursus Bahasa ${langName}` },
          })),
        }
      : {}),
    provider: {
      "@type": "Organization",
      name: "Linguo.id",
      sameAs: "https://linguo.id",
    },
    educationalLevel: "A1, A2, B1, B2 (CEFR)",
    inLanguage: detail.languageSlug,
    courseMode: "online",
    hasCourseInstance: detail.curriculum.map((level) => ({
      "@type": "CourseInstance",
      name: level.title,
      description: level.description,
      courseMode: "online",
      courseWorkload: `PT${level.sessionCount}H`,
    })),
    // [kelas-pricelist-sync-v1] offers = tiers yang benar-benar tampil di
    // halaman (harga pricelist per kategori), bukan detail.pricing hardcode.
    offers: buildPricingTiers(detail.languageSlug).map((tier) => ({
      "@type": "Offer",
      name: tier.name,
      price: tier.price,
      priceCurrency: "IDR",
      category: tier.sub,
      availability: "https://schema.org/InStock",
    })),
  };
}

function buildFAQSchema(detail: LanguageDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: detail.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
