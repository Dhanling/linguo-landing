/* wa-quick-program-lang-sync-v1 — SUMBER TUNGGAL "bahasa apa saja yang boleh
 * dipilih untuk sebuah program".
 *
 * Sebelumnya daftar bahasa Kelas Reguler dicopy di page.tsx & FunnelModal.tsx,
 * sementara form "klaim diskon" di hero nggak ngecek sama sekali — jadi orang
 * bisa kirim "Bahasa: Russian + Kelas: Kelas Reguler" padahal Rusia nggak punya
 * batch reguler, dan admin/AI kejebak nawarin kelas yang nggak ada.
 *
 * Aturannya samain dengan FunnelModal:
 *   - Kelas Reguler    → cuma bahasa yang punya batch (REGULER_LANGS)
 *   - IELTS/TOEFL Prep → English saja
 *   - Private / Semi Private / Kelas Kids → semua bahasa
 *
 * Nambah bahasa reguler baru? cukup update REGULER_LANGS di sini (+ halaman
 * /jadwal-kelas-reguler & tabel regular_batches).
 */

export const REGULER_LANGS = [
  "English", "Mandarin", "Japanese", "Korean", "Arabic",
  "French", "German", "Italian", "Dutch", "Spanish", "Tagalog",
];

/** Program yang punya batasan bahasa. Program lain = bebas semua bahasa. */
const PROGRAM_LANG_RULES: Record<string, (lang: string) => boolean> = {
  "Kelas Reguler": (l) => REGULER_LANGS.includes(l),
  "IELTS/TOEFL Prep": (l) => l === "English",
};

/**
 * Boleh nggak kombinasi program × bahasa ini?
 * Program/bahasa yang masih kosong dianggap boleh (belum dipilih ≠ salah).
 */
export function isProgramLangAllowed(program?: string | null, language?: string | null): boolean {
  const p = (program || "").trim();
  const l = (language || "").trim();
  if (!p || !l) return true;
  const rule = PROGRAM_LANG_RULES[p];
  return rule ? rule(l) : true;
}

/** Bahasa yang tersedia untuk sebuah program (dari daftar bahasa apa pun). */
export function langsForProgram(langs: string[], program?: string | null): string[] {
  return langs.filter((l) => isProgramLangAllowed(program, l));
}

/** Program yang tersedia untuk sebuah bahasa (dari daftar program apa pun). */
export function programsForLang(programs: string[], language?: string | null): string[] {
  return programs.filter((p) => isProgramLangAllowed(p, language));
}
