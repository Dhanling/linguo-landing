// [reguler-english-conversation-v1]
// Nama bahasa di produk kelas selama ini punya 3 bentuk yang campur aduk:
//   1. nama bahasa polos            -> "English"
//   2. nama kelas reguler           -> "English - Conversation"  (= regular_batches.language)
//   3. blob dari form pendaftaran   -> "English - Conversation A1.1 (ENG-A11-AUG26)"
// File ini SATU-SATUNYA sumber aturan konversi antar bentuk itu, dipakai bareng
// oleh funnel landing, wizard daftar di /akun, dan kartu kelas dashboard siswa.

// Kelas Reguler English cuma dibuka sebagai kelas Conversation, jadi nama resminya
// "English - Conversation" (bukan "English" polos). Bahasa lain pakai nama polos.
// Nambah varian reguler baru (mis. "Business")? cukup tambah entri di sini.
export const REGULER_LANG_ALIAS: Record<string, string> = {
  English: "English - Conversation",
};

/** Nama bahasa resmi untuk Kelas Reguler — dipakai saat MENYIMPAN pendaftaran reguler. */
export function regulerLangName(lang?: string | null): string {
  const v = (lang || "").trim();
  return REGULER_LANG_ALIAS[v] || v;
}

/**
 * Nama kelas yang enak dibaca: buang kode batch & level yang nempel di ujung.
 * "English - Conversation A1.1 (ENG-A11-AUG26)" -> "English - Conversation"
 */
export function displayLanguage(raw?: string | null): string {
  if (!raw) return "";
  return raw
    .replace(/\s*\([^)]*\)\s*$/, "") // kode batch "(ENG-A11-AUG26)"
    .replace(/\s+[A-Ca-c][12](?:\.\d+)?\s*$/, "") // level nempel "A1.1"
    .trim();
}

/**
 * Bahasa dasar untuk semua LOOKUP berbasis bahasa (bendera, foto stok, glyph,
 * slug silabus, LMS). Varian kelas ikut dibuang.
 * "English - Conversation A1.1 (ENG-A11-AUG26)" -> "English"
 */
export function baseLanguage(raw?: string | null): string {
  return displayLanguage(raw)
    .replace(/\s*[-–—]\s*(Conversation|Percakapan|Business|Kids)\b.*$/i, "")
    .trim();
}
