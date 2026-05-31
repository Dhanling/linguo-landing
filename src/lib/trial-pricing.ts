// =============================================================================
// trial-pricing.ts
// [linguo-patch:trial-class-v1]
// Pricing logic untuk Fitur Trial Class. Dipakai di form /kelas-trial (display
// harga live) DAN di route /api/create-trial-invoice (hitung ulang server-side
// — jangan pernah percaya amount dari client).
//
// Trial = 1 sesi berbayar. Karena trial terjadi SEBELUM placement test (level
// siswa belum diketahui), harga Private pakai kolom A1/Basic.
// =============================================================================

/** Bahasa -> kategori harga. Sumber: pricelist Private (getAutoPrice dashboard). */
export const PRICE_CATEGORIES: Record<string, string[]> = {
  A: [
    "Swahili", "Greek", "Hindi", "Turkish", "Norwegian", "Tagalog",
    "Vietnamese", "Swedish", "Urdu", "Kurdish", "Hebrew", "Polish",
    "Portuguese", "Finnish", "Czech", "Traditional Chinese", "Hungarian",
    "Esperanto", "Farsi", "English British", "Romanian", "Khmer", "Danish",
    "Uzbek", "Serbian", "Estonian", "Latin", "Ancient Egyptian", "Georgian",
    "Irish",
    // linguo-patch:private-pricing-v1 — nama bahasa di funnel landing tidak
    // 100% sama dgn pricelist: "Persian" (= Farsi, sudah ada di atas) dan
    // "Bengali" sebelumnya tidak ketemu kategori → harga jatuh ke fallback.
    // Bengali diasumsikan kategori A (setara Hindi/Urdu) — koreksi bila salah.
    "Persian", "Bengali",
  ],
  B: ["Russian", "Dutch", "Italian", "Spanish", "Thai", "Sign Language"],
  C: ["Arabic", "English", "Japanese", "German", "Korean", "Mandarin", "French"],
  D: [
    "Javanese", "Sundanese", "Madurese", "Batak", "Banjar", "Balinese",
    "Malay", "Bugis",
  ],
  E: ["BIPA"],
};

/** Harga per sesi 60 menit, level A1/Basic, per kategori. */
export const PRICE_A1_60MIN: Record<string, number> = {
  A: 120000,
  B: 110000,
  C: 100000,
  D: 90000,
  E: 150000,
};

/** Kids: harga flat per tipe (per sesi). */
export const KIDS_PRICE: Record<string, number> = {
  "little-learner": 75000,
  "young-explorer": 85000,
};

/** Kids: durasi per tipe (fixed by tipe, bukan pilihan bebas). */
export const KIDS_DURATION: Record<string, number> = {
  "little-learner": 30,
  "young-explorer": 45,
};

/** Pilihan durasi (menit) untuk trial Private. */
export const TRIAL_DURATIONS: number[] = [30, 45, 60, 75, 90];

/** Daftar bahasa yang bisa dihitung harganya (gabungan semua kategori), urut A-Z. */
export const TRIAL_LANGUAGES: string[] = Object.values(PRICE_CATEGORIES)
  .reduce<string[]>((acc, arr) => acc.concat(arr), [])
  .sort((a, b) => a.localeCompare(b));

/** Cari kategori harga sebuah bahasa. null kalau tidak ada di pricelist. */
export function getLanguageCategory(language: string): string | null {
  const found = Object.keys(PRICE_CATEGORIES).find((k) =>
    PRICE_CATEGORIES[k].includes(language)
  );
  return found || null;
}

/**
 * Harga trial Private = harga A1 kategori bahasa, di-scale proporsional ke durasi.
 * Return null kalau bahasa tidak ada di pricelist.
 */
export function computePrivateTrialPrice(
  language: string,
  durationMinutes: number
): number | null {
  const cat = getLanguageCategory(language);
  if (!cat) return null;
  const base60 = PRICE_A1_60MIN[cat];
  const dur = Number(durationMinutes) || 60;
  return Math.round((base60 * dur) / 60);
}

/** Harga trial Kids = flat per tipe. Return null kalau tipe tidak dikenal. */
export function computeKidsTrialPrice(kidsType: string): number | null {
  const p = KIDS_PRICE[kidsType];
  return typeof p === "number" ? p : null;
}

/** Format angka -> "Rp 100.000" */
export function formatRupiah(n: number): string {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}
