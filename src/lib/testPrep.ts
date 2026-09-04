// =============================================================================
// [test-prep-v1] Sumber tunggal data produk Persiapan Ujian Bahasa (test prep)
// selain IELTS/TOEFL: HSK (Mandarin), JLPT (Jepang), TOPIK (Korea), Goethe (Jerman).
//
// Dipakai bersama oleh:
//   - Halaman flow /persiapan-tes (katalog + checkout)
//   - Kartu produk & nav mega-menu di landing (src/app/page.tsx)
//   - Perhitungan harga server-side di /api/create-funnel-invoice (anti-tamper)
//
// Model kelas (hasil keputusan produk 22 Jul 2026):
//   - Semi-private (grup kecil 3–6) = DEFAULT. Paket tetap 12 sesi @90 menit,
//     harga per orang. Cukup 3 orang untuk buka kelas.
//   - Private 1-on-1 = premium. Harga per sesi × jumlah sesi (8/12/16).
// Tidak pakai model batch besar ala IELTS karena demand bahasa niche lebih tipis.
//
// CATATAN: file ini TIDAK boleh mengimpor React / komponen — dipakai juga di
// route server. Ikon Lucide dipetakan dari `icon` (string) di sisi client.
// =============================================================================

import { getPrivateBase60 } from "./trial-pricing";

export type TestPrepId = "hsk" | "jlpt" | "topik" | "goethe";
export type TestPrepFormat = "semi" | "private";

export interface TestPrepLevel {
  id: string;      // dipakai untuk lead.level (mis. "N5", "HSK 3", "B1")
  label: string;   // tampil di UI
  desc?: string;
  /** Padanan CEFR level ujian ini — dasar penentuan harga (lihat blok harga di bawah). */
  cefr: CefrLevel;
}

export interface TestPrepProduct {
  id: TestPrepId;
  test: string;         // "HSK"
  title: string;        // "HSK — Ujian Kemahiran Mandarin"
  language: string;     // bahasa (untuk lead.language & label)
  flagCode: string;     // ISO-2 untuk RectFlag (bukan emoji)
  icon: string;         // nama ikon Lucide (dipetakan di client)
  accent: string;       // warna aksen kartu
  bg: string;           // warna latar lembut kartu
  demandTag?: string;   // badge, mis. "Demand tinggi"
  blurb: string;        // deskripsi singkat produk
  levels: TestPrepLevel[];
  /**
   * Harga "mulai dari" per orang, paket semi-private 12 sesi, pada level TERENDAH.
   * HANYA untuk label etalase. Tagihan WAJIB lewat quoteTestPrep() yang sadar level.
   */
  semiPrice: number;
}

// Paket semi-private = tetap 12 sesi @90 menit (harga per orang).
export const SEMI_SESSIONS = 12;
export const SESSION_MINUTES = 90;
// Pilihan jumlah sesi untuk Private 1-on-1.
export const PRIVATE_SESSION_OPTS = [8, 12, 16] as const;
export const DEFAULT_PRIVATE_SESSIONS = 12;

// [test-prep-semi-group-info-v1] Ukuran grup semi-private test prep. Angka ini
// dulu cuma hidup sebagai teks "Grup 3–6 orang" di satu bullet halaman
// /persiapan-tes, jadi orang yang langsung membuka modal checkout melihat
// "harga per orang" tanpa pernah tahu per orang dari berapa orang. Sekarang
// jadi konstanta yang dirender di modalnya sendiri.
export const SEMI_GROUP_MIN = 3;
export const SEMI_GROUP_MAX = 6;
/** Jumlah peserta minimum agar kelas semi-private dibuka. */
export const SEMI_GROUP_OPEN_AT = SEMI_GROUP_MIN;

export const TEST_PREP_PRODUCTS: TestPrepProduct[] = [
  {
    id: "jlpt",
    test: "JLPT",
    title: "JLPT — Ujian Kemahiran Bahasa Jepang",
    language: "Japanese",
    flagCode: "jp",
    icon: "PenTool",
    accent: "#E4572E",
    bg: "#FDECE7",
    demandTag: "Demand tinggi",
    blurb:
      "Persiapan intensif JLPT N5–N1: kanji, tata bahasa, dokkai (reading), dan choukai (listening). Fokus strategi menjawab + mock test.",
    levels: [
      { id: "N5", label: "N5", desc: "Dasar", cefr: "A1" },
      { id: "N4", label: "N4", desc: "Dasar lanjutan", cefr: "A2" },
      { id: "N3", label: "N3", desc: "Menengah", cefr: "B1" },
      { id: "N2", label: "N2", desc: "Menengah atas", cefr: "B2" },
      { id: "N1", label: "N1", desc: "Mahir", cefr: "C1" },
    ],
    semiPrice: 1200000,
  },
  {
    id: "topik",
    test: "TOPIK",
    title: "TOPIK — Ujian Kemahiran Bahasa Korea",
    language: "Korean",
    flagCode: "kr",
    icon: "GraduationCap",
    accent: "#3D5AFE",
    bg: "#E8ECFF",
    demandTag: "Cepat naik",
    blurb:
      "Persiapan TOPIK I & II: kosakata, tata bahasa, 읽기 (reading), 듣기 (listening), dan 쓰기 (writing). Latihan format resmi NIIED + mock test.",
    levels: [
      { id: "TOPIK I", label: "TOPIK I", desc: "Level 1–2 (pemula)", cefr: "A1" },
      { id: "TOPIK II", label: "TOPIK II", desc: "Level 3–6 (menengah–mahir)", cefr: "B1" },
    ],
    semiPrice: 1200000,
  },
  {
    id: "hsk",
    test: "HSK",
    title: "HSK — Ujian Kemahiran Bahasa Mandarin",
    language: "Mandarin",
    flagCode: "cn",
    icon: "ScrollText",
    accent: "#D7263D",
    bg: "#FCE8EA",
    demandTag: "Beasiswa & bisnis",
    blurb:
      "Persiapan HSK 1–6: hanzi, kosakata, tata bahasa, membaca, dan menyimak. Sesuai format ujian resmi Hanban + mock test.",
    levels: [
      { id: "HSK 1", label: "HSK 1", desc: "Pemula", cefr: "A1" },
      { id: "HSK 2", label: "HSK 2", desc: "Pemula lanjutan", cefr: "A1" },
      { id: "HSK 3", label: "HSK 3", desc: "Menengah dasar", cefr: "A2" },
      { id: "HSK 4", label: "HSK 4", desc: "Menengah", cefr: "B1" },
      { id: "HSK 5", label: "HSK 5", desc: "Menengah atas", cefr: "B2" },
      { id: "HSK 6", label: "HSK 6", desc: "Mahir", cefr: "C1" },
    ],
    semiPrice: 1000000,
  },
  {
    id: "goethe",
    test: "Goethe",
    title: "Goethe-Zertifikat — Ujian Kemahiran Bahasa Jerman",
    language: "German",
    flagCode: "de",
    icon: "Award",
    accent: "#111827",
    bg: "#EEF0F3",
    demandTag: "Ausbildung & nakes",
    blurb:
      "Persiapan Goethe-Zertifikat A1–C1: Lesen, Hören, Schreiben, Sprechen. Cocok untuk syarat Ausbildung, kuliah, atau kerja nakes di Jerman.",
    levels: [
      { id: "A1", label: "A1", desc: "Pemula", cefr: "A1" },
      { id: "A2", label: "A2", desc: "Dasar", cefr: "A2" },
      { id: "B1", label: "B1", desc: "Menengah (syarat umum)", cefr: "B1" },
      { id: "B2", label: "B2", desc: "Menengah atas (nakes/kuliah)", cefr: "B2" },
      { id: "C1", label: "C1", desc: "Mahir", cefr: "C1" },
    ],
    semiPrice: 1500000,
  },
];

export function getTestPrepProduct(id: string): TestPrepProduct | null {
  return TEST_PREP_PRODUCTS.find((p) => p.id === id) ?? null;
}

export const formatRupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

// =============================================================================
// [test-prep-level-pricing-v1] Harga Persiapan Ujian IKUT LEVEL UJIAN
//
// Sebelumnya tiap produk punya dua angka mati (`semiPrice`, `privatePerSession`)
// yang dipakai untuk SEMUA level: JLPT N5 dan N1 sama-sama Rp140.000/90 menit.
// Dua akibatnya, dua-duanya salah:
//
//  1. Tarif tidak naik walau tingkat kesulitannya naik — N1 dijual seharga N5.
//  2. Tarif privat test prep JATUH DI BAWAH kelas Private biasa. Private Bahasa
//     Jepang Basic = Rp100.000/60 mnt (kategori C, tier A1) alias Rp150.000 per
//     90 menit; test prep-nya cuma Rp140.000. Persiapan ujian jadi lebih murah
//     daripada kelas reguler bahasa yang sama.
//
// Sekarang:
//
//  • PRIVATE diturunkan dari pricelist resmi kelas Private (getPrivateBase60 →
//    kategori bahasa × tier level) dikali PRIVATE_PREMIUM. Premi 1,2× dipilih
//    karena angkanya persis mereproduksi tarif privat test prep yang SUDAH
//    berlaku untuk IELTS/TOEFL: kategori C level A1 = Rp100.000/jam × 1,2 =
//    Rp120.000/jam — sama dengan TEST_PREP_PRIVATE.perHour di dashboard admin.
//    Jadi ini bukan tarif baru, cuma aturan lama yang akhirnya dipakai konsisten
//    untuk JLPT/TOPIK/HSK/Goethe dan akhirnya ikut naik per level.
//
//  • SEMI-PRIVATE memakai harga paket yang sudah diiklankan tiap produk sebagai
//    level TERENDAH (biar tarif masuk yang sudah beredar tidak berubah), lalu
//    naik per level memakai LEVEL_MULTIPLIER yang sama dengan kelas Semi Private
//    biasa di lib/trial-pricing.
//
// Kalau kebijakan harganya berubah, yang diubah CUKUP konstanta di bawah —
// jangan tulis angka mati lagi di komponen halaman.
// =============================================================================

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1";

/** Premi kelas persiapan ujian di atas tarif Private biasa (guru spesialis + mock test). */
export const PRIVATE_PREMIUM = 1.2;

/** Kenaikan harga per tier level — mirror LEVEL_MULTIPLIER di lib/trial-pricing. */
const LEVEL_STEP: number[] = [1.0, 1.15, 1.3, 1.45];

/** CEFR → indeks LEVEL_STEP. A1→0, A2→1, B1/B2→2, C1/C2→3. */
function levelStepIndex(cefr: CefrLevel): number {
  if (cefr === "A1") return 0;
  if (cefr === "A2") return 1;
  if (cefr === "B1" || cefr === "B2") return 2;
  return 3;
}

/** Level ujian (id seperti "N3") → CEFR-nya. Level tak dikenal jatuh ke level pertama produk. */
export function cefrOfLevel(product: TestPrepProduct, levelId: string): CefrLevel {
  const found = product.levels.find((l) => l.id === levelId);
  return (found ?? product.levels[0])?.cefr ?? "A1";
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/**
 * Tarif Private 1-on-1 per sesi (SESSION_MINUTES menit) untuk level ini.
 * Dasar = pricelist Private resmi bahasa tersebut pada tier level yang setara,
 * dikali PRIVATE_PREMIUM. Dijamin tidak pernah lebih murah dari Private biasa.
 */
export function privatePerSessionFor(product: TestPrepProduct, levelId: string): number {
  const cefr = cefrOfLevel(product, levelId);
  const base60 = getPrivateBase60(product.language, cefr);
  const perSessionBiasa = Math.round((base60 * SESSION_MINUTES) / 60);
  return Math.max(perSessionBiasa, roundTo(perSessionBiasa * PRIVATE_PREMIUM, 5000));
}

/** Harga paket semi-private (12 sesi, per orang) untuk level ini. */
export function semiPriceFor(product: TestPrepProduct, levelId: string): number {
  const dasar = levelStepIndex(product.levels[0]?.cefr ?? "A1");
  const target = levelStepIndex(cefrOfLevel(product, levelId));
  return roundTo((product.semiPrice * LEVEL_STEP[target]) / LEVEL_STEP[dasar], 1000);
}

/**
 * Harga per orang per sesi semi-private — cuma untuk ditampilkan berdampingan
 * dengan harga paket, supaya "harga per orang" tidak lagi terbaca sebagai
 * harga satu sesi.
 */
export function semiPerSessionFor(product: TestPrepProduct, levelId: string): number {
  return Math.round(semiPriceFor(product, levelId) / SEMI_SESSIONS);
}

/**
 * Pembanding "hemat dibanding privat": total paket private dengan jumlah sesi
 * yang sama. 0 kalau tidak ada penghematan.
 */
export function semiSavingPct(product: TestPrepProduct, levelId: string): number {
  const privat = privatePerSessionFor(product, levelId) * SEMI_SESSIONS;
  const semi = semiPriceFor(product, levelId);
  if (!privat || semi >= privat) return 0;
  return Math.round(((privat - semi) / privat) * 100);
}

// ── Perhitungan harga (dipakai client & server; server sumber kebenaran) ──────
export interface TestPrepQuote {
  amount: number;      // total tagihan
  perSession: number;  // 0 untuk semi (paket), harga/sesi untuk private
  sessions: number;    // jumlah sesi termasuk dalam paket
  description: string;  // deskripsi invoice/lead
}

export function quoteTestPrep(
  product: TestPrepProduct,
  format: TestPrepFormat,
  level: string,
  sessions?: number,
): TestPrepQuote {
  const lvl = level || product.levels[0]?.id || "";
  if (format === "semi") {
    const amount = semiPriceFor(product, lvl);
    return {
      amount,
      // perSession diisi (dulu 0) supaya ringkasan harga bisa menyebut angka per
      // sesi juga — "harga per orang" saja terbaca ambigu, lihat SEMI_GROUP_MIN.
      perSession: semiPerSessionFor(product, lvl),
      sessions: SEMI_SESSIONS,
      description:
        `Persiapan ${product.test} ${lvl} — Semi-Private (grup ${SEMI_GROUP_MIN}–${SEMI_GROUP_MAX} orang) ` +
        `${SEMI_SESSIONS} sesi @${SESSION_MINUTES} menit, harga/orang`,
    };
  }
  const n = (PRIVATE_SESSION_OPTS as readonly number[]).includes(sessions ?? -1)
    ? (sessions as number)
    : DEFAULT_PRIVATE_SESSIONS;
  const perSession = privatePerSessionFor(product, lvl);
  return {
    amount: perSession * n,
    perSession,
    sessions: n,
    description: `Persiapan ${product.test} ${lvl} — Private 1-on-1 ${n} sesi @${SESSION_MINUTES} menit`,
  };
}
