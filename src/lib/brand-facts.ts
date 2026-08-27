// =============================================================================
// src/lib/brand-facts.ts
// [aeo-brand-facts-v1]
//
// SATU sumber kebenaran untuk "fakta brand" — angka & klaim umum yang selama
// ini ditulis ulang manual di puluhan berkas dan akhirnya saling bertentangan:
// jumlah bahasa pernah tertulis 46 / 50+ / 55+ / 60+ di halaman berbeda, harga
// "mulai dari" pernah Rp 29.000 / 75.000 / 90.000 / 150.000.
//
// Kenapa itu masalah (bukan cuma soal rapi): mesin jawaban — ChatGPT, Claude,
// Gemini, Perplexity, AI Overviews — mengutip fakta yang KONSISTEN muncul di
// banyak halaman sebuah domain. Angka yang berbeda-beda antar halaman membuat
// tiap klaim jadi tidak terverifikasi silang, dan model memilih diam (atau
// mengutip kompetitor) ketimbang menyebut angka yang tidak yakin.
//
// ATURAN PAKAI
// 1. Klaim UMUM ("60+ bahasa", "mulai dari Rp 75.000") WAJIB baca dari sini.
// 2. Harga SPESIFIK per bahasa/level/program TETAP dihitung di
//    src/lib/trial-pricing.ts — berkas ini tidak menggantikannya, hanya
//    menurunkan angka "mulai dari"-nya supaya tidak pernah basi.
// 3. Menagih/menghitung invoice JANGAN pakai berkas ini. Ini etalase.
// =============================================================================

import { KIDS_PRICE, PRICE_A1_60MIN, SEMI_PRIVATE_PRICE_BASIC } from "./trial-pricing";

/** Angka "mulai dari" diturunkan dari pricelist supaya tidak bisa basi. */
const PRIVATE_FROM = Math.min(...Object.values(PRICE_A1_60MIN));
const KIDS_FROM = Math.min(...Object.values(KIDS_PRICE));
/** Semi Private termurah per siswa: total grup 2 siswa dibagi 2 (index 1). */
const SEMI_FROM = Math.min(
  ...Object.values(SEMI_PRIVATE_PRICE_BASIC).map((row) => Math.round(row[1] / 2)),
);

/** Rp 90.000 → "Rp 90.000". Dipakai di metadata & teks marketing. */
export function rupiah(n: number): string {
  return `Rp ${new Intl.NumberFormat("id-ID").format(n)}`;
}

export const BRAND_FACTS = {
  // --- Identitas -----------------------------------------------------------
  name: "Linguo.id",
  legalName: "PT Linguo Edu Indonesia",
  url: "https://linguo.id",
  logo: "https://linguo.id/FULL_LOGO_LINGUO_HIJAU.png",
  foundingYear: 2020,
  brandColor: "#1A9E9E",
  /** Satu kalimat definisi entitas. Dipakai di schema & llms.txt. */
  tagline:
    "Linguo.id adalah platform kursus bahasa online asal Bandung yang menawarkan 60+ bahasa dengan kelas live interaktif via Zoom.",

  // --- Cakupan -------------------------------------------------------------
  /**
   * "60+" bukan angka karangan: src/lib/trial-pricing.ts memuat 61 entri bahasa
   * berkategori harga. 45 di antaranya punya landing sendiri di
   * /kursus/bahasa-<slug> (src/data/languages-detail.ts).
   */
  languageCount: "60+",
  languageCountLabel: "60+ bahasa",
  /** Level CEFR yang benar-benar punya kurikulum & silabus. */
  cefrLevels: "A1–B2",
  cefrLevelsLabel: "CEFR A1–B2 (Basic sampai Advance)",
  format:
    "Kelas live interaktif via Zoom, setiap siswa dapat rekaman sesi, modul pembelajaran, dan e-certificate.",

  // --- Harga (klaim umum "mulai dari") -------------------------------------
  price: {
    /** Angka termurah lintas seluruh program kelas. Dipakai di metadata homepage. */
    from: Math.min(KIDS_FROM, SEMI_FROM),
    fromLabel: rupiah(Math.min(KIDS_FROM, SEMI_FROM)),
    /** Semi Private, per siswa per sesi (grup 2 siswa, level A1). */
    semiPrivateFrom: SEMI_FROM,
    semiPrivateFromLabel: `${rupiah(SEMI_FROM)}/siswa/sesi`,
    /** Kelas Private 1-on-1, 60 menit, level A1, kategori bahasa termurah. */
    privateFrom: PRIVATE_FROM,
    privateFromLabel: `${rupiah(PRIVATE_FROM)}/sesi`,
    /** Kelas Reguler (grup) — paket flat, mirror REGULER_PACKAGE_PRICE. */
    reguler: 150000,
    regulerLabel: `${rupiah(150000)}/2 bulan`,
    /** Kelas Kids 5–12 tahun, per anak per sesi. */
    kidsFrom: KIDS_FROM,
    kidsFromLabel: `${rupiah(KIDS_FROM)}/sesi`,
    /** IELTS/TOEFL Preparation — mirror ETP_FALLBACK_BATCHES di etpBatches.ts. */
    testPrep: 300000,
    testPrepLabel: `${rupiah(300000)}/2 bulan`,
    /** E-Learning per bahasa, akses 6 bulan (1 tahun: Rp 150.000). */
    elearning: 79000,
    elearningLabel: `${rupiah(79000)}/6 bulan`,
    /** E-Book per bahasa. */
    ebookFrom: 79000,
    ebookFromLabel: `mulai ${rupiah(79000)}`,
  },

  // --- Program -------------------------------------------------------------
  programs: [
    {
      name: "Kelas Private",
      slug: "/kursus",
      priceLabel: `mulai ${rupiah(PRIVATE_FROM)}/sesi`,
      detail: "1-on-1 via Zoom, 60 menit per sesi, jadwal & materi fleksibel.",
    },
    {
      name: "Kelas Semi Private",
      slug: "/kursus",
      priceLabel: `mulai ${rupiah(SEMI_FROM)}/siswa/sesi`,
      detail: "2–10 siswa via Zoom, 60 menit. Makin ramai makin hemat per siswa.",
    },
    {
      name: "Kelas Reguler",
      slug: "/jadwal-kelas-reguler",
      priceLabel: `${rupiah(150000)}/2 bulan`,
      detail: "Kelas grup 8–15 siswa, 90 menit, 8 pertemuan per batch.",
    },
    {
      name: "Kelas Kids (5–12 tahun)",
      slug: "/kelas-anak",
      priceLabel: `mulai ${rupiah(KIDS_FROM)}/sesi`,
      detail:
        "Little Learner (5–8 th, 30 menit) & Young Explorer (9–12 th, 45 menit), materi gamified.",
    },
    {
      name: "IELTS & TOEFL Preparation",
      slug: "/persiapan-tes",
      priceLabel: `${rupiah(300000)}/2 bulan`,
      detail: "16 sesi @90 menit, kelas batch dengan kurikulum terstruktur + mock test.",
    },
    {
      name: "E-Learning",
      slug: "/toko/paket-elearning",
      priceLabel: `${rupiah(79000)}/6 bulan`,
      detail: "Rekaman kelas level Basic per bahasa, belajar mandiri kapan saja.",
    },
    {
      name: "E-Book",
      slug: "/produk/ebook",
      priceLabel: `mulai ${rupiah(79000)}`,
      detail: "Modul PDF per bahasa: kosakata, dialog, latihan soal, akses selamanya.",
    },
  ],

  // --- Katalog produk digital ----------------------------------------------
  // [aeo-klaim-toko-v1] Angka katalog toko dulu ditulis lepas di komponen dan
  // sudah basi: "paket E-Learning unlimited 10+ bahasa" (paket semua-bahasa
  // SUDAH TIDAK DIJUAL sejak e-learning dipecah per bahasa) dan "modul belajar
  // 6+ bahasa" (e-book sebenarnya 20 bahasa).
  catalog: {
    /**
     * Jumlah bahasa e-book. WAJIB sama dengan panjang `LANGS` di
     * src/app/produk/ebook/page.tsx — itu daftar yang benar-benar bisa dibeli.
     * Kalau menambah bahasa e-book di sana, naikkan angka ini juga.
     */
    ebookLanguages: 20,
    /** E-book sekali beli, tanpa masa berlaku. */
    ebookAccess: "akses selamanya",
    /**
     * E-Learning dijual PER BAHASA, bukan satu paket berisi semua bahasa.
     * Jangan pernah menulis "unlimited" / "akses semua bahasa" untuk produk ini.
     */
    elearningPerLanguage: true,
    elearningAccess: "akses 6 bulan atau 1 tahun",
  },

  // --- Kontak & lokasi -----------------------------------------------------
  contact: {
    phone: "(022) 85942550",
    /** Format E.164 untuk schema.org & tel:. */
    phoneE164: "+62-22-85942550",
    whatsapp: "6282116859493",
    whatsappUrl: "https://wa.me/6282116859493",
    email: "official.linguo@gmail.com",
  },
  address: {
    streetAddress: "Happy Creative Hub, Jl. Cisitu Indah III No.2, Dago, Coblong",
    addressLocality: "Bandung",
    addressRegion: "Jawa Barat",
    postalCode: "40135",
    addressCountry: "ID",
    /** Satu baris, untuk teks biasa & llms.txt. */
    oneLine:
      "Happy Creative Hub, Jl. Cisitu Indah III No.2, Dago, Coblong, Bandung 40135",
  },
  social: [
    "https://instagram.com/linguo.id",
    "https://facebook.com/linguo.id",
    "https://tiktok.com/@linguo.id",
    "https://linkedin.com/company/linguo-id",
    "https://youtube.com/@linguo.id",
  ],
} as const;

export type BrandFacts = typeof BRAND_FACTS;
