// src/app/kelas/[lang]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";

import {
  getAllLanguageDetailSlugs,
  getLanguageDetailBySlug,
  getLanguageMetaForDetail,
  type LanguageDetail,
} from "../../../data/languages-detail";

// ============================================================================
// PARAM PARSING
// URL pattern is /kelas/bahasa-{slug} which matches [lang] folder.
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

  const url = `https://linguo.id/kelas/${lang}`;

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

// ============================================================================
// PAGE
// ============================================================================

export default async function BahasaLandingPage({ params }: PageProps) {
  const { lang } = await params;
  const slug = parseBahasaSlug(lang);
  if (!slug) notFound();
  const detail = getLanguageDetailBySlug(slug);
  if (!detail) notFound();

  const meta = getLanguageMetaForDetail(detail);
  if (!meta) notFound();

  const courseSchema = buildCourseSchema(detail, meta.name);
  const faqSchema = buildFAQSchema(detail);

  return (
    <>
      <Script
        id={`course-schema-${detail.urlSlug}`}
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      <Script
        id={`faq-schema-${detail.urlSlug}`}
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="min-h-screen bg-white text-slate-900">
        <Breadcrumb langName={meta.name} />
        <Hero detail={detail} flag={meta.flag} nativeName={meta.nativeName ?? meta.name} langName={meta.name} />
        <WhyLearn detail={detail} langName={meta.name} />
        <TargetAudience detail={detail} langName={meta.name} />
        <Curriculum detail={detail} langName={meta.name} />
        <Pricing detail={detail} langName={meta.name} />
        <Teachers langName={meta.name} />
        <FAQSection detail={detail} langName={meta.name} />
        <FinalCTA langName={meta.name} />
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
          <Link href="/kelas" className="hover:text-[#1A9E9E]">
            Kelas
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

function Hero({
  detail,
  flag,
  nativeName,
  langName,
}: {
  detail: LanguageDetail;
  flag: string;
  nativeName: string;
  langName: string;
}) {
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
        <div className="flex flex-col items-start gap-6 md:max-w-3xl">
          <div className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            <span className="text-2xl leading-none">{flag}</span>
            <span className="text-white/90">{nativeName}</span>
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Kursus Bahasa {langName} Online
          </h1>

          <p className="text-lg text-white/90 md:text-xl">{detail.tagline}</p>

          <p className="text-base leading-relaxed text-white/80 md:text-lg">
            {detail.heroDescription}
          </p>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <a
              href={buildWaLink(langName)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-[#1A9E9E] shadow-lg transition hover:scale-[1.02] hover:shadow-xl"
            >
              Daftar Bahasa {langName} Sekarang
              <span aria-hidden>→</span>
            </a>
            <Link
              href="/placement-test"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/40 bg-white/5 px-7 py-3.5 font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              Tes Penempatan Gratis
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
            <span className="flex items-center gap-2">
              <span aria-hidden>✓</span> Pengajar bersertifikat
            </span>
            <span className="flex items-center gap-2">
              <span aria-hidden>✓</span> Kurikulum CEFR A1–B2
            </span>
            <span className="flex items-center gap-2">
              <span aria-hidden>✓</span> Jadwal fleksibel
            </span>
            <span className="flex items-center gap-2">
              <span aria-hidden>✓</span> 100% online
            </span>
          </div>
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
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[#1A9E9E]/10 text-3xl">
              {point.icon}
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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#1A9E9E]/10 text-2xl">
                {item.emoji}
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
            Tiga jenis kelas Bahasa {langName} dengan harga transparan. Bayar per sesi — tanpa
            kontrak panjang, tanpa biaya tersembunyi.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          {detail.pricing.map((tier) => (
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
                {tier.classSize} • {tier.sessionDuration}
              </p>

              <div className="my-5">
                <div className="text-3xl font-bold">{formatRupiah(tier.pricePerSession)}</div>
                <div className={`text-sm ${tier.highlighted ? "text-white/80" : "text-slate-500"}`}>
                  per sesi
                </div>
              </div>

              <ul className="mb-6 flex-1 space-y-2.5 text-sm">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex gap-2">
                    <span aria-hidden className={tier.highlighted ? "text-white" : "text-[#1A9E9E]"}>
                      ✓
                    </span>
                    <span className={tier.highlighted ? "text-white/95" : "text-slate-700"}>
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href={buildWaLink(langName)}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-auto inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-semibold transition ${
                  tier.highlighted
                    ? "bg-white text-[#1A9E9E] hover:bg-slate-50"
                    : "border-2 border-[#1A9E9E] text-[#1A9E9E] hover:bg-[#1A9E9E] hover:text-white"
                }`}
              >
                {tier.ctaLabel ?? `Daftar ${tier.name}`}
              </a>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Belum yakin level kamu di mana?{" "}
          <Link href="/placement-test" className="font-semibold text-[#1A9E9E] hover:underline">
            Ambil tes penempatan gratis →
          </Link>
        </p>
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

function FinalCTA({ langName }: { langName: string }) {
  return (
    <section className="bg-gradient-to-br from-[#1A9E9E] to-[#0e6e6e] text-white">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center md:py-20">
        <h2 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
          Siap mulai belajar Bahasa {langName}?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
          Hubungi tim kami via WhatsApp untuk konsultasi gratis dan info promo terbaru. Atau
          langsung ambil tes penempatan untuk tahu level kamu di mana.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={buildWaLink(langName)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-[#1A9E9E] shadow-lg transition hover:scale-[1.02] hover:shadow-xl"
          >
            Chat WhatsApp Sekarang
            <span aria-hidden>→</span>
          </a>
          <Link
            href="/placement-test"
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/40 px-8 py-4 font-semibold text-white transition hover:bg-white/10"
          >
            Tes Penempatan Gratis
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// JSON-LD STRUCTURED DATA
// ============================================================================

function buildCourseSchema(detail: LanguageDetail, langName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `Kursus Bahasa ${langName}`,
    description: detail.metaDescription,
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
    offers: detail.pricing.map((tier) => ({
      "@type": "Offer",
      name: tier.name,
      price: tier.pricePerSession,
      priceCurrency: "IDR",
      category: tier.classSize,
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
