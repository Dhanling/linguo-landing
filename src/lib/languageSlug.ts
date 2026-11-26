// [materi-bahasa-siswa-v1]
// SATU sumber penerjemah "nama bahasa dalam bentuk apa pun" → slug kanonik yang
// dipakai silabus (/silabus/<slug>, src/data/curriculum/data/<slug>.ts) dan LMS
// (lms_modules.language).
//
// Kenapa perlu: registrations.language isinya campur aduk —
//   "Russian" (nama Inggris) · "Rusia" (nama Indonesia) · "Inggris" ·
//   "English - Conversation A1.1 (ENG-A11-AUG26)" (nama kelas reguler) ·
//   "Test Prep - IELTS" (label produk).
// Sebelum file ini, slug dibikin ad-hoc (lowercase + spasi jadi strip), jadi siswa
// yang bahasanya tersimpan dengan nama Indonesia SELALU dapat "Silabus belum
// tersedia" — atau lebih parah, jatuh ke fallback "english": bahasa yang bukan
// miliknya ikut nongol di menu Kelas & Materi.

import { baseLanguage, displayLanguage } from "./classLanguage";
import { languages as CURRICULUM_LANGUAGES } from "@/data/curriculum/languages";

const norm = (v: string) => v.trim().toLowerCase();

// Nama yang tidak terjawab tabel kurikulum: label produk test prep & nama alternatif.
const ALIAS: Record<string, string> = {
  ielts: "ielts",
  "ielts prep": "ielts",
  "test prep - ielts": "ielts",
  toefl: "toefl-itp",
  "toefl itp": "toefl-itp",
  "test prep - toefl": "toefl-itp",
  // [#f67267e2] registrations.language Private PTE = "PTE prep" — dulu null → tab Materi kosong.
  pte: "pte",
  "pte prep": "pte",
  "pte academic": "pte",
  "pte academic prep": "pte",
  "pte preparation": "pte",
  "test prep - pte": "pte",
  // [silabus-business-english-v1] registrations.language = "English For Business"
  "business english": "business-english",
  "english for business": "business-english",
  "inggris bisnis": "business-english",
  chinese: "mandarin",
  "mandarin (china)": "mandarin",
  // [#d19e7d41] Mandarin aksara tradisional (Taiwan) — silabusnya tetap Mandarin.
  // "Chinese (Traditional)" sudah jatuh ke "chinese" karena kurung dibuang
  // displayLanguage(); bentuk tanpa kurung ini dulu null → tab Materi kosong.
  "traditional chinese": "mandarin",
  "chinese traditional": "mandarin",
  "mandarin traditional": "mandarin",
  "traditional mandarin": "mandarin",
  china: "mandarin",
  tagalog: "filipino",
  portuguese: "portuguese-br",
  portugis: "portuguese-br",
  // [bendera-brasil-v1] registrations.language kelas Brasil = "Portuguese - Brazilian";
  // tanpa alias ini kartu kelas jatuh ke ikon globe.
  "portuguese - brazilian": "portuguese-br",
  "portuguese – brazilian": "portuguese-br",
  "portuguese (brazil)": "portuguese-br",
  "brazilian portuguese": "portuguese-br",
  "portugis brasil": "portuguese-br",
  "portuguese - european": "portuguese-pt",
  "portuguese (portugal)": "portuguese-pt",
  "european portuguese": "portuguese-pt",
  indonesian: "bipa",
  "bahasa indonesia": "bipa",
  // [isyarat-3d-v1] registrations.language = "Sign Language - ASL"
  "sign language - asl": "asl",
  "sign language (asl)": "asl",
  "bahasa isyarat asl": "asl",
  // [isyarat-bisindo-v1] registrations.language = "Sign Language - BISINDO"
  "sign language - bisindo": "bisindo",
  "sign language (bisindo)": "bisindo",
  "bahasa isyarat bisindo": "bisindo",
};

// slug ↔ nama Indonesia ↔ nama asli, langsung dari master kurikulum (jangan
// diduplikasi di tempat lain — nambah bahasa cukup di data/curriculum/languages.ts).
const BY_NAME: Record<string, string> = {};
CURRICULUM_LANGUAGES.forEach((l) => {
  BY_NAME[norm(l.slug)] = l.slug;
  BY_NAME[norm(l.name)] = l.slug;
  BY_NAME[norm(l.nativeName)] = l.slug;
});

/**
 * Slug kanonik bahasa, atau null kalau nilainya bukan bahasa tunggal yang kita kenal
 * (mis. "All Languages", "TBD", "Korea, Inggris, Mandarin").
 * null itu SENGAJA: lebih baik "silabus belum tersedia" daripada menampilkan materi
 * bahasa lain yang tidak diambil siswa.
 */
export function languageSlug(raw?: string | null): string | null {
  // [silabus-business-english-v1] "English - Business …" punya silabus sendiri — cek SEBELUM
  // baseLanguage() membuang varian "- Business" (pemangkasan itu tetap dipakai bendera/foto).
  if (/^english\s*[-–—]\s*business\b/i.test(displayLanguage(raw).trim())) return "business-english";
  const base = baseLanguage(raw);
  if (!base) return null;
  const key = norm(base);
  return (
    ALIAS[key] ||
    BY_NAME[key] ||
    BY_NAME[key.replace(/^bahasa\s+/, "")] ||
    null
  );
}

/** true kalau dua nama bahasa (bentuk apa pun) menunjuk bahasa yang sama. */
export function sameLanguage(a?: string | null, b?: string | null): boolean {
  const x = languageSlug(a);
  return !!x && x === languageSlug(b);
}
