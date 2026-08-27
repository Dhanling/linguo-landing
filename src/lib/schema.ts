// =============================================================================
// src/lib/schema.ts
// [aeo-schema-v1]
//
// Generator structured data (JSON-LD schema.org). Sebelumnya markup ini ditulis
// ulang sebagai object literal di masing-masing halaman: Organization & WebSite
// di src/app/layout.tsx, Course & FAQ di /kursus/bahasa-*, BreadcrumbList
// disalin tiga kali dengan bentuk sedikit berbeda di /kursus, /blog/[slug], dan
// /daftar. Salinan yang tersebar itu pelan-pelan berbeda isinya — persis pola
// yang bikin fakta brand tidak konsisten.
//
// Berkas ini menyatukannya. Semua angka & identitas ditarik dari
// src/lib/brand-facts.ts, jadi schema mustahil menyebut angka yang berbeda dari
// yang tampil di halaman.
//
// ATURAN
// 1. Object literal + JSON.stringify. TIDAK pakai library schema apa pun.
// 2. Suntikkan lewat <script type="application/ld+json"> BIASA, bukan <Script>
//    dari next/script. next/script baru menyuntikkan tag-nya sesudah hidrasi,
//    jadi schema-nya tidak pernah ada di HTML mentah yang dibaca crawler —
//    ini pernah terjadi di repo ini (lihat [seo-review-schema-v1]).
// 3. JANGAN markup sesuatu yang tidak benar-benar tampil di halaman. Rating
//    tanpa testimoni yang dirender, atau SearchAction tanpa halaman pencarian
//    yang berfungsi, membuat seluruh halaman diabaikan.
// =============================================================================

import { BRAND_FACTS } from "./brand-facts";

const BASE = BRAND_FACTS.url;

/** @id stabil supaya node lain bisa merujuk tanpa menyalin ulang isinya. */
export const ORG_ID = `${BASE}/#organization`;
export const WEBSITE_ID = `${BASE}/#website`;

// -----------------------------------------------------------------------------
// Penyuntik
// -----------------------------------------------------------------------------

/**
 * Bentuk props untuk <script type="application/ld+json">.
 *
 * Pemakaian:
 *   <script type="application/ld+json" {...jsonLd(faqSchema(FAQS))} />
 *
 * `<` di-escape jadi \\u003c supaya isi teks yang kebetulan memuat "</script>"
 * tidak bisa menutup tag lebih awal.
 */
export function jsonLd(schema: object) {
  return {
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
    },
  };
}

// -----------------------------------------------------------------------------
// Tingkat situs
// -----------------------------------------------------------------------------

/**
 * EducationalOrganization — dasar knowledge panel & sitelink.
 *
 * Sengaja SATU node bertipe ganda, bukan dua node terpisah Organization +
 * EducationalOrganization. Dua node dengan nama & URL sama membuat mesin
 * pencari menebak mana entitas yang asli; satu node dengan dua tipe menyatakan
 * "ini organisasi, dan spesifiknya lembaga pendidikan" tanpa ambiguitas.
 */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["EducationalOrganization", "Organization"],
    "@id": ORG_ID,
    name: BRAND_FACTS.name,
    legalName: BRAND_FACTS.legalName,
    alternateName: ["Linguo", "Linguo Indonesia"],
    url: BASE,
    logo: {
      "@type": "ImageObject",
      url: BRAND_FACTS.logo,
    },
    image: BRAND_FACTS.logo,
    description: BRAND_FACTS.tagline,
    foundingDate: String(BRAND_FACTS.foundingYear),
    slogan: "Everyone Can Be a Polyglot",
    address: {
      "@type": "PostalAddress",
      streetAddress: BRAND_FACTS.address.streetAddress,
      addressLocality: BRAND_FACTS.address.addressLocality,
      addressRegion: BRAND_FACTS.address.addressRegion,
      postalCode: BRAND_FACTS.address.postalCode,
      addressCountry: BRAND_FACTS.address.addressCountry,
    },
    telephone: BRAND_FACTS.contact.phoneE164,
    email: BRAND_FACTS.contact.email,
    areaServed: { "@type": "Country", name: "Indonesia" },
    knowsLanguage: ["id", "en"],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: BRAND_FACTS.contact.phoneE164,
        email: BRAND_FACTS.contact.email,
        availableLanguage: ["Indonesian", "English"],
        areaServed: "ID",
      },
    ],
    sameAs: [...BRAND_FACTS.social],
  };
}

/**
 * WebSite + SearchAction.
 *
 * `searchTarget` WAJIB URL pencarian yang benar-benar bekerja. Kalau halaman
 * pencarian belum ada, panggil tanpa argumen — lebih baik tidak punya
 * SearchAction daripada punya yang menuju halaman kosong.
 */
export function websiteSchema(searchTarget?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: BASE,
    name: BRAND_FACTS.name,
    description: BRAND_FACTS.tagline,
    inLanguage: "id-ID",
    publisher: { "@id": ORG_ID },
    ...(searchTarget
      ? {
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: searchTarget,
            },
            "query-input": "required name=search_term_string",
          },
        }
      : {}),
  };
}

// -----------------------------------------------------------------------------
// Per halaman
// -----------------------------------------------------------------------------

export type FaqItem = { q: string; a: string };

/**
 * FAQPage. `items` harus persis pertanyaan-jawaban yang DIRENDER di halaman —
 * FAQ yang cuma ada di markup dianggap manipulatif.
 */
export function faqSchema(items: FaqItem[], pageUrl?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    ...(pageUrl ? { "@id": `${pageUrl}#faq`, url: pageUrl } : {}),
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export type Crumb = {
  name: string;
  /** Path absolut dari root ("/kursus"). Butir TERAKHIR boleh tanpa path. */
  path?: string;
};

/**
 * BreadcrumbList. Butir "Beranda" ditambahkan otomatis di posisi 1 — jangan
 * ikut dioper, nanti dobel.
 *
 * Butir terakhir sengaja boleh tanpa `item`: itu halaman yang sedang dibuka,
 * dan menautkannya ke dirinya sendiri adalah pola yang Google minta dihindari.
 */
export function breadcrumbSchema(trail: Crumb[]) {
  const items = [{ name: "Beranda", path: "/" }, ...trail];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((crumb, i) => {
      const isLast = i === items.length - 1;
      return {
        "@type": "ListItem",
        position: i + 1,
        name: crumb.name,
        ...(crumb.path && !isLast
          ? { item: `${BASE}${crumb.path === "/" ? "" : crumb.path}` }
          : {}),
      };
    }),
  };
}

export type CourseOffer = {
  name: string;
  price: number;
  /** Keterangan singkat paket ("1 siswa • 60 menit"). */
  category?: string;
  /** "per sesi", "per 2 bulan". Ditulis ke priceSpecification. */
  unit?: string;
};

export type CourseInstanceInput = {
  name: string;
  description?: string;
  /** Jumlah sesi. Diterjemahkan jadi courseWorkload ISO 8601 duration. */
  sessionCount?: number;
};

export type CourseSchemaInput = {
  /** Nama lengkap kursus, mis. "Kursus Bahasa Korea Online". */
  name: string;
  description: string;
  url: string;
  /** Kode bahasa yang DIAJARKAN (BCP-47 kalau bisa), mis. "ko". */
  inLanguage?: string;
  offers?: CourseOffer[];
  instances?: CourseInstanceInput[];
  aggregateRating?: object;
  review?: object[];
};

/**
 * Course + Offer.
 *
 * Catatan soal dua field yang gampang salah:
 * - `provider` merujuk @id organisasi, bukan menyalin nama & alamatnya lagi.
 * - Google mewajibkan Offer punya `price` DAN `priceCurrency`; tanpa keduanya
 *   seluruh blok Course di-drop tanpa pesan error di Search Console.
 * - `hasCourseInstance` wajib punya `courseMode` DAN `courseWorkload`, kalau
 *   tidak instance-nya diabaikan diam-diam.
 */
export function courseSchema(input: CourseSchemaInput) {
  const {
    name,
    description,
    url,
    inLanguage,
    offers = [],
    instances = [],
    aggregateRating,
    review,
  } = input;

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${url}#course`,
    name,
    description,
    url,
    provider: { "@id": ORG_ID },
    ...(inLanguage ? { inLanguage } : {}),
    educationalLevel: BRAND_FACTS.cefrLevels,
    educationalCredentialAwarded: "E-Certificate Linguo.id",
    isAccessibleForFree: false,
    courseMode: "online",
    ...(aggregateRating ? { aggregateRating } : {}),
    ...(review?.length ? { review } : {}),
    ...(instances.length
      ? {
          hasCourseInstance: instances.map((level) => ({
            "@type": "CourseInstance",
            name: level.name,
            ...(level.description ? { description: level.description } : {}),
            courseMode: "online",
            // ISO 8601: jumlah sesi × 1 jam. Sesi baku Private 60 menit.
            courseWorkload: `PT${level.sessionCount ?? 1}H`,
            inLanguage: "id-ID",
            courseSchedule: {
              "@type": "Schedule",
              repeatFrequency: "P1W",
              repeatCount: level.sessionCount ?? 1,
            },
            offers: offers.slice(0, 1).map((offer) => ({
              "@type": "Offer",
              price: offer.price,
              priceCurrency: "IDR",
              availability: "https://schema.org/InStock",
              category: "Paid",
              url,
            })),
          })),
        }
      : {}),
    ...(offers.length
      ? {
          offers: offers.map((offer) => ({
            "@type": "Offer",
            name: offer.name,
            price: offer.price,
            priceCurrency: "IDR",
            availability: "https://schema.org/InStock",
            url,
            ...(offer.category ? { category: offer.category } : {}),
            ...(offer.unit
              ? {
                  priceSpecification: {
                    "@type": "UnitPriceSpecification",
                    price: offer.price,
                    priceCurrency: "IDR",
                    unitText: offer.unit,
                  },
                }
              : {}),
          })),
        }
      : {}),
  };
}

/**
 * AboutPage — halaman yang mendefinisikan entitas Linguo.id itu sendiri.
 * `mainEntity` menunjuk node organisasi supaya mesin jawaban tahu halaman ini
 * adalah sumber resmi tentang entitas tersebut, bukan sekadar halaman biasa.
 */
export function aboutPageSchema(url: string, name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${url}#about`,
    url,
    name,
    description,
    inLanguage: "id-ID",
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
  };
}
