// =============================================================================
// src/lib/levelEquivalence.ts
// [padanan-ujian-v1]
//
// SATU sumber kebenaran padanan level CEFR Linguo (A1–B2) ke ujian resmi tiap
// bahasa — TOPIK, JLPT, HSK, dan kawan-kawan. Dipakai di:
//   • pesan WA/email hasil placement test (placementNotify.ts)
//   • layar hasil placement test + peta CEFR (PlacementTest.tsx, CefrLevelMap.tsx)
//   • silabus per bahasa (CurriculumViewer.tsx, page.tsx metadata, SilabusHub.tsx)
//   • halaman kursus /kursus/bahasa-* (kursus/[lang]/page.tsx)
//   • kartu pilih level di /daftar (FunnelFlow.tsx)
//   • dashboard siswa: Cek Level, halaman verifikasi sertifikat
//   • Minling (api/chat) & llms.txt
//
// Aturan:
//   • Padanan ditulis di level INDUK saja (B1 → TOPIK II Level 3). Ujian resmi
//     tidak mengenal sublevel B1.5, jadi jangan dipaksa.
//   • Ini PERKIRAAN. Placement test Linguo bukan ujian resmi — selalu tampilkan
//     dengan "≈" dan catatan `CATATAN_PADANAN` kalau ruangnya ada.
//   • Bahasa yang ujiannya tidak umum dikenal (Arab, Hindi, Thai, Kanton, bahasa
//     daerah) sengaja TIDAK ada di tabel → helper mengembalikan null dan UI
//     tidak menampilkan apa-apa. Lebih baik kosong daripada dipaksakan.
//   • Mandarin memakai HSK 2.0 (yang masih diujikan). HSK 3.0 (9 band) petanya
//     beda — kalau nanti resmi menggantikan, ubah di sini saja.
//   • Angka B2 = TOPIK II Level 4 / JLPT N2 / HSK 5 WAJIB sama dengan target
//     chapter test prep (B2.7) di data kurikulum & testPrep.ts.
// =============================================================================

export type Band = "A1" | "A2" | "B1" | "B2";
export const BANDS: Band[] = ["A1", "A2", "B1", "B2"];

export type PadananBahasa = {
  /** Nama ujian untuk tag ringkas ("TOPIK", "JLPT"). */
  ujian: string;
  /** Nama panjang ujian — untuk tooltip / Minling. */
  namaUjian: string;
  /** Label per level; null = tidak ada padanan di level itu. */
  level: Record<Band, string | null>;
};

export const CATATAN_PADANAN =
  "Padanan ujian resmi bersifat perkiraan, bukan hasil ujian resmi.";

// Kunci = slug kurikulum/silabus (src/data/curriculum/languages.ts).
const TABEL: Record<string, PadananBahasa> = {
  korean: {
    ujian: "TOPIK",
    namaUjian: "TOPIK (Test of Proficiency in Korean)",
    level: { A1: "TOPIK I Level 1", A2: "TOPIK I Level 2", B1: "TOPIK II Level 3", B2: "TOPIK II Level 4" },
  },
  japanese: {
    ujian: "JLPT",
    namaUjian: "JLPT (Japanese-Language Proficiency Test)",
    level: { A1: "JLPT N5", A2: "JLPT N4", B1: "JLPT N3", B2: "JLPT N2" },
  },
  mandarin: {
    ujian: "HSK",
    namaUjian: "HSK 2.0 (Hanyu Shuiping Kaoshi)",
    level: { A1: "HSK 1–2", A2: "HSK 3", B1: "HSK 4", B2: "HSK 5" },
  },
  vietnamese: {
    ujian: "KNLTV",
    namaUjian: "Khung năng lực tiếng Việt (ujian kemampuan bahasa Vietnam untuk penutur asing, 6 bậc)",
    level: { A1: "Tiếng Việt Bậc 1", A2: "Tiếng Việt Bậc 2", B1: "Tiếng Việt Bậc 3", B2: "Tiếng Việt Bậc 4" },
  },
  bipa: {
    ujian: "UKBI",
    namaUjian: "UKBI (Uji Kemahiran Berbahasa Indonesia)",
    level: { A1: "UKBI Terbatas", A2: "UKBI Marginal", B1: "UKBI Semenjana", B2: "UKBI Madya" },
  },
  russian: {
    ujian: "TORFL",
    namaUjian: "TORFL / ТРКИ (Test of Russian as a Foreign Language)",
    level: { A1: "TEU (ТЭУ)", A2: "TBU (ТБУ)", B1: "TORFL-I (ТРКИ-1)", B2: "TORFL-II (ТРКИ-2)" },
  },
  english: {
    ujian: "IELTS",
    namaUjian: "IELTS (band keseluruhan)",
    level: { A1: null, A2: "IELTS 3.0–3.5", B1: "IELTS 4.0–5.0", B2: "IELTS 5.5–6.5" },
  },
  german: {
    ujian: "Goethe",
    namaUjian: "Goethe-Zertifikat",
    level: { A1: "Goethe-Zertifikat A1 (Start Deutsch 1)", A2: "Goethe-Zertifikat A2", B1: "Goethe-Zertifikat B1", B2: "Goethe-Zertifikat B2" },
  },
  french: {
    ujian: "DELF",
    namaUjian: "DELF (Diplôme d'études en langue française)",
    level: { A1: "DELF A1", A2: "DELF A2", B1: "DELF B1", B2: "DELF B2" },
  },
  spanish: {
    ujian: "DELE",
    namaUjian: "DELE (Diplomas de Español como Lengua Extranjera)",
    level: { A1: "DELE A1", A2: "DELE A2", B1: "DELE B1", B2: "DELE B2" },
  },
  italian: {
    ujian: "CILS",
    namaUjian: "CILS (Certificazione di Italiano come Lingua Straniera)",
    level: { A1: "CILS A1", A2: "CILS A2", B1: "CILS UNO-B1", B2: "CILS DUE-B2" },
  },
  dutch: {
    ujian: "NT2",
    namaUjian: "Staatsexamen NT2 / Inburgering",
    level: { A1: null, A2: "Inburgeringsexamen (A2)", B1: "Staatsexamen NT2 Programma I", B2: "Staatsexamen NT2 Programma II" },
  },
  greek: {
    ujian: "ΚΠΓ",
    namaUjian: "Πιστοποίηση Ελληνομάθειας (sertifikat kemahiran bahasa Yunani)",
    level: { A1: "Ελληνομάθεια A1", A2: "Ελληνομάθεια A2", B1: "Ελληνομάθεια B1", B2: "Ελληνομάθεια B2" },
  },
};

// Nama/slug lain yang beredar di kode → slug kurikulum. Semua sudah huruf kecil.
// Mencakup: urlSlug /daftar & /kursus (korea, jepang…), nama Inggris funnel/
// pricelist (Korean, Japanese…), nama Indonesia (Korea, Jepang…), alias umum.
const ALIAS: Record<string, string> = {
  korea: "korean", kor: "korean",
  jepang: "japanese", japan: "japanese", nihongo: "japanese",
  chinese: "mandarin", china: "mandarin", cina: "mandarin", tionghoa: "mandarin",
  vietnam: "vietnamese",
  indonesia: "bipa", indonesian: "bipa", "bahasa indonesia": "bipa",
  rusia: "russian",
  inggris: "english", "english - british": "english", "english - american": "english",
  jerman: "german",
  prancis: "french", perancis: "french",
  spanyol: "spanish",
  italia: "italian",
  belanda: "dutch",
  yunani: "greek",
};

function slugKurikulum(raw: string | null | undefined): string | null {
  let s = String(raw || "").trim().toLowerCase();
  if (!s) return null;
  // "placement-test-korean-unlocked" / "placement-test-korean-mulai" → "korean"
  const m = s.match(/^placement-test-(.+?)(?:-unlocked|-mulai)?$/);
  if (m) s = m[1];
  s = s.replace(/^bahasa\s+/, "");
  if (TABEL[s]) return s;
  if (ALIAS[s]) return ALIAS[s];
  return null;
}

/** Band induk dari level apa pun: "B1.5" → "B1", "a2" → "A2", "C1" → null. */
export function bandDari(level: string | null | undefined): Band | null {
  const b = String(level || "").trim().slice(0, 2).toUpperCase();
  return (BANDS as string[]).includes(b) ? (b as Band) : null;
}

/** Seluruh tangga padanan untuk satu bahasa, atau null kalau tak ada ujian yang dikenal. */
export function padananTangga(bahasa: string | null | undefined): PadananBahasa | null {
  const slug = slugKurikulum(bahasa);
  return slug ? TABEL[slug] : null;
}

/**
 * Padanan ujian untuk satu level. Menerima slug kurikulum ("korean"), slug URL
 * ("korea"), nama Inggris ("Korean"), nama Indonesia ("Korea"), maupun `source`
 * placement ("placement-test-korean-unlocked"); level boleh sublevel ("B1.5").
 * null = jangan tampilkan apa-apa.
 */
export function padananUjian(
  bahasa: string | null | undefined,
  level: string | null | undefined,
): { ujian: string; namaUjian: string; label: string } | null {
  const t = padananTangga(bahasa);
  const band = bandDari(level);
  if (!t || !band) return null;
  const label = t.level[band];
  return label ? { ujian: t.ujian, namaUjian: t.namaUjian, label } : null;
}

/** Ringkasan rentang A1–B2 untuk meta description / kalimat: "TOPIK I Level 1 sampai TOPIK II Level 4". */
export function ringkasanPadanan(bahasa: string | null | undefined): string | null {
  const t = padananTangga(bahasa);
  if (!t) return null;
  const ada = BANDS.map((b) => t.level[b]).filter(Boolean) as string[];
  if (!ada.length) return null;
  return ada.length === 1 ? ada[0] : `${ada[0]} sampai ${ada[ada.length - 1]}`;
}

/**
 * Daftar padanan dalam teks polos untuk prompt Minling & llms.txt — satu baris
 * per bahasa, supaya jawaban AI konsisten dengan WA hasil tes dan silabus.
 */
export function daftarPadananTeks(): string {
  const namaId: Record<string, string> = {
    korean: "Korea", japanese: "Jepang", mandarin: "Mandarin", vietnamese: "Vietnam", bipa: "BIPA (Indonesia untuk penutur asing)",
    russian: "Rusia", english: "Inggris", german: "Jerman", french: "Prancis", spanish: "Spanyol", italian: "Italia", dutch: "Belanda", greek: "Yunani",
  };
  return Object.entries(TABEL)
    .map(([slug, t]) => {
      const bag = BANDS.map((b) => `${b} ≈ ${t.level[b] || "tidak ada padanan"}`).join(", ");
      return `- ${namaId[slug] || slug} (${t.namaUjian}): ${bag}`;
    })
    .join("\n");
}
