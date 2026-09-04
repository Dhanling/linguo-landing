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
 * [reguler-lang-gate-server-v1] Dulu pemeriksaannya CUMA cocok-cocokan string
 * persis di UI: "Kelas Reguler" + "English". Akibatnya masih ada celah —
 * "reguler" (slug), "Denmark" (nama Indonesia), atau "English - Conversation"
 * (nama batch) lolos begitu saja, dan API checkout/enroll tidak memeriksa apa
 * pun sehingga lead "Kelas Reguler Danish" tetap bisa lahir dari luar UI.
 * Sekarang nama program & bahasa dinormalkan dulu (canonProgram/canonLangName),
 * dan gerbang yang sama dipasang di /api/create-funnel-invoice + /api/enroll.
 *
 * Nambah bahasa reguler baru? cukup update REGULER_LANGS di sini (+ halaman
 * /jadwal-kelas-reguler & tabel regular_batches).
 */

import { baseLanguage } from "@/lib/classLanguage";
import { LANG_SEARCH_ALIAS } from "@/lib/langAlias";

/** Bahasa yang PUNYA batch di /jadwal-kelas-reguler (tabel regular_batches).
 *  English di tabel batch tersimpan sebagai "English - Conversation" — sudah
 *  ditangani canonLangName(), jadi cukup tulis nama polosnya di sini.
 *  Bahasa Isyarat (Sign Language) sesekali dibuka sebagai batch tambahan, tapi
 *  belum jadi pilihan funnel — jangan ditambah ke sini sebelum halaman
 *  /kursus & kategori harganya ada. */
export const REGULER_LANGS = [
  "English", "Mandarin", "Japanese", "Korean", "Arabic",
  "French", "German", "Italian", "Dutch", "Spanish", "Tagalog",
];

// ── Normalisasi nama bahasa ─────────────────────────────────────────────────
// Nama bahasa masuk ke sini dalam banyak bentuk: nama Inggris dari funnel
// ("Danish"), nama Indonesia dari chat/WA ("Denmark"), atau nama batch
// ("English - Conversation A1.1"). Semua dipetakan ke satu nama kanonik dulu
// sebelum dicocokkan ke REGULER_LANGS.
const CANON_BY_KEY: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const [en, aliases] of Object.entries(LANG_SEARCH_ALIAS)) {
    m.set(en.toLowerCase(), en);
    for (const a of aliases) {
      const key = a.toLowerCase();
      if (!m.has(key)) m.set(key, en);
    }
  }
  return m;
})();

/** Nama bahasa kanonik (Inggris) dari bentuk apa pun. "" kalau kosong. */
export function canonLangName(raw?: string | null): string {
  const base = baseLanguage(raw || "").trim();
  if (!base) return "";
  return CANON_BY_KEY.get(base.toLowerCase()) || base;
}

/** Nama bahasa buat pesan ke user — pakai nama Indonesia kalau ada ("Denmark",
 *  bukan "Danish"). Sengaja diturunkan dari LANG_SEARCH_ALIAS, bukan impor
 *  funnelRouting: funnelRouting sudah mengimpor modul ini. */
export function langNameIdShort(raw?: string | null): string {
  const en = canonLangName(raw);
  if (!en) return String(raw || "").trim();
  const alias = LANG_SEARCH_ALIAS[en]?.[0];
  if (!alias) return en;
  return alias.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}

/** Bahasa ini punya jadwal Kelas Reguler? */
export function isRegulerLang(lang?: string | null): boolean {
  const c = canonLangName(lang);
  return !!c && REGULER_LANGS.includes(c);
}

// ── Normalisasi nama program ────────────────────────────────────────────────
// Slug funnel ("reguler", "ielts-toefl"), label UI ("Kelas Reguler"), dan nama
// produk di registrasi ("English Test Preparation") semuanya menunjuk program
// yang sama.
const PROGRAM_ALIAS: Record<string, string> = {
  "reguler": "Kelas Reguler",
  "regular": "Kelas Reguler",
  "kelas reguler": "Kelas Reguler",
  "kelas regular": "Kelas Reguler",
  "ielts-toefl": "IELTS/TOEFL Prep",
  "ielts/toefl": "IELTS/TOEFL Prep",
  "ielts/toefl prep": "IELTS/TOEFL Prep",
  "english test preparation": "IELTS/TOEFL Prep",
};

/** Nama program kanonik (label UI). Program tanpa alias dikembalikan apa adanya. */
export function canonProgram(raw?: string | null): string {
  const p = (raw || "").trim();
  if (!p) return "";
  return PROGRAM_ALIAS[p.toLowerCase()] || p;
}

/** Program yang punya batasan bahasa. Program lain = bebas semua bahasa. */
const PROGRAM_LANG_RULES: Record<string, (lang: string) => boolean> = {
  "Kelas Reguler": (l) => isRegulerLang(l),
  // ETP kadang disimpan dengan "bahasa" = nama tesnya sendiri ("IELTS/TOEFL")
  // — itu tetap sah, yang dilarang cuma ETP untuk bahasa selain Inggris.
  "IELTS/TOEFL Prep": (l) => canonLangName(l) === "English" || /ielts|toefl/i.test(l),
};

/**
 * Boleh nggak kombinasi program × bahasa ini?
 * Program/bahasa yang masih kosong dianggap boleh (belum dipilih ≠ salah).
 */
export function isProgramLangAllowed(program?: string | null, language?: string | null): boolean {
  const p = canonProgram(program);
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

/**
 * Pesan tolakan siap pakai untuk API. null = kombinasinya sah.
 * Dipakai gerbang server supaya alasannya seragam di semua endpoint.
 */
export function programLangRejection(program?: string | null, language?: string | null): string | null {
  if (isProgramLangAllowed(program, language)) return null;
  const lang = langNameIdShort(language);
  if (canonProgram(program) === "Kelas Reguler") {
    return `Kelas Reguler tidak tersedia untuk bahasa ${lang}. Kelas Reguler hanya dibuka untuk bahasa yang punya jadwal batch (lihat linguo.id/jadwal-kelas-reguler). Untuk ${lang}, pilih Kelas Private atau Semi Private.`;
  }
  return `Program ini tidak tersedia untuk bahasa ${lang}. Pilih program lain ya.`;
}
