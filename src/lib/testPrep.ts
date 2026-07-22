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

export type TestPrepId = "hsk" | "jlpt" | "topik" | "goethe";
export type TestPrepFormat = "semi" | "private";

export interface TestPrepLevel {
  id: string;      // dipakai untuk lead.level (mis. "N5", "HSK 3", "B1")
  label: string;   // tampil di UI
  desc?: string;
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
  semiPrice: number;        // harga per orang untuk paket semi-private 12 sesi
  privatePerSession: number; // harga per sesi untuk private 1-on-1
}

// Paket semi-private = tetap 12 sesi @90 menit (harga per orang di `semiPrice`).
export const SEMI_SESSIONS = 12;
export const SESSION_MINUTES = 90;
// Pilihan jumlah sesi untuk Private 1-on-1.
export const PRIVATE_SESSION_OPTS = [8, 12, 16] as const;
export const DEFAULT_PRIVATE_SESSIONS = 12;

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
      { id: "N5", label: "N5", desc: "Dasar" },
      { id: "N4", label: "N4", desc: "Dasar lanjutan" },
      { id: "N3", label: "N3", desc: "Menengah" },
      { id: "N2", label: "N2", desc: "Menengah atas" },
      { id: "N1", label: "N1", desc: "Mahir" },
    ],
    semiPrice: 1200000,
    privatePerSession: 140000,
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
      { id: "TOPIK I", label: "TOPIK I", desc: "Level 1–2 (pemula)" },
      { id: "TOPIK II", label: "TOPIK II", desc: "Level 3–6 (menengah–mahir)" },
    ],
    semiPrice: 1200000,
    privatePerSession: 140000,
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
      { id: "HSK 1", label: "HSK 1", desc: "Pemula" },
      { id: "HSK 2", label: "HSK 2", desc: "Pemula lanjutan" },
      { id: "HSK 3", label: "HSK 3", desc: "Menengah dasar" },
      { id: "HSK 4", label: "HSK 4", desc: "Menengah" },
      { id: "HSK 5", label: "HSK 5", desc: "Menengah atas" },
      { id: "HSK 6", label: "HSK 6", desc: "Mahir" },
    ],
    semiPrice: 1000000,
    privatePerSession: 130000,
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
      { id: "A1", label: "A1", desc: "Pemula" },
      { id: "A2", label: "A2", desc: "Dasar" },
      { id: "B1", label: "B1", desc: "Menengah (syarat umum)" },
      { id: "B2", label: "B2", desc: "Menengah atas (nakes/kuliah)" },
      { id: "C1", label: "C1", desc: "Mahir" },
    ],
    semiPrice: 1500000,
    privatePerSession: 160000,
  },
];

export function getTestPrepProduct(id: string): TestPrepProduct | null {
  return TEST_PREP_PRODUCTS.find((p) => p.id === id) ?? null;
}

export const formatRupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

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
    return {
      amount: product.semiPrice,
      perSession: 0,
      sessions: SEMI_SESSIONS,
      description: `Persiapan ${product.test} ${lvl} — Semi-Private (grup kecil) ${SEMI_SESSIONS} sesi @${SESSION_MINUTES} menit, harga/orang`,
    };
  }
  const n = (PRIVATE_SESSION_OPTS as readonly number[]).includes(sessions ?? -1)
    ? (sessions as number)
    : DEFAULT_PRIVATE_SESSIONS;
  return {
    amount: product.privatePerSession * n,
    perSession: product.privatePerSession,
    sessions: n,
    description: `Persiapan ${product.test} ${lvl} — Private 1-on-1 ${n} sesi @${SESSION_MINUTES} menit`,
  };
}
