// =============================================================================
// [daftar-page-funnel-v1]
// Peta URL ↔ pilihan funnel pendaftaran (/daftar).
//
// Dulu funnel cuma hidup sebagai modal di homepage: semua CTA "Daftar" dari 45
// landing /kursus/bahasa-* menunjuk ke "/?openFunnel=1&lang=Korean". Akibatnya
// tidak ada satu pun URL yang bisa diindeks / diiklankan untuk niat "daftar
// kursus bahasa X", dan seluruh link equity CTA nyasar balik ke homepage
// berparameter.
//
// Sekarang tiap langkah punya URL sendiri:
//   /daftar                                  → pilih bahasa
//   /daftar/korea                            → pilih program        (indexable)
//   /daftar/korea/private                    → level & paket        (noindex)
//   /daftar/korea/private/a1                 → data diri            (noindex)
//   /daftar/korea/private/a1/konfirmasi      → ringkasan & bayar    (noindex)
//
// ATURAN: slug bahasa memakai urlSlug yang SAMA dengan /kursus/bahasa-<slug>
// (bahasa Indonesia: "korea", "jepang"), sedangkan nilai yang dikirim ke
// /api/create-funnel-invoice tetap nama Inggris ("Korean") — jangan tertukar,
// kategori harga di lib/trial-pricing di-lookup pakai nama Inggris.
// =============================================================================

import { languageDetails } from "@/data/languages-detail";
import { languages as CURRICULUM_LANGUAGES } from "@/data/curriculum/languages";
import { isRegulerLang } from "@/lib/programLanguages";

// ─────────────────────────────────────────────────────────────────────────────
// BAHASA
// ─────────────────────────────────────────────────────────────────────────────

/** Daftar bahasa funnel per kategori (dipakai step 1 & picker lain). */
export const LANG_CATEGORIES: Array<{ label: string; langs: string[] }> = [
  { label: "Populer", langs: ["English","Japanese","Korean","Mandarin","Arabic","French","German","Spanish"] },
  { label: "Asia", langs: ["Japanese","Korean","Mandarin","Arabic","Thai","Vietnamese","Hindi","Turkish","Hebrew","Persian","Tagalog","Malay","Georgian","Urdu","Bengali"] },
  { label: "Eropa", langs: ["English","French","German","Spanish","Italian","Dutch","Portuguese","Russian","Polish","Swedish","Norwegian","Danish","Finnish","Greek","Czech","Hungarian","Romanian"] },
  { label: "Nusantara", langs: ["Javanese","Sundanese","Betawi","BIPA"] },
  { label: "Afrika", langs: ["Swahili"] },
];

/** Bahasa yang muncul di picker langkah 1, unik, urutan mengikuti LANG_CATEGORIES. */
export const ALL_FUNNEL_LANGS: string[] = [
  ...new Set(LANG_CATEGORIES.flatMap((c) => c.langs)),
];

// Nama Inggris di funnel → languageSlug di src/data/languages-detail.ts.
// Hanya untuk yang tidak sama dengan lowercase namanya sendiri.
const DETAIL_SLUG_OVERRIDE: Record<string, string> = {
  Tagalog: "filipino",
  Portuguese: "portuguese-br",
  BIPA: "bipa",
};

// Bahasa yang belum punya halaman /kursus/bahasa-* → slug URL ditentukan manual
// (nama Indonesia) supaya URL /daftar tetap konsisten berbahasa Indonesia.
const STANDALONE_SLUG: Record<string, string> = {
  Malay: "melayu",
  Swahili: "swahili",
  Bengali: "bengali",
};

// languageSlug ("korean") → urlSlug ("korea"), dari master languages-detail.
const URL_SLUG_BY_DETAIL_SLUG: Record<string, string> = {};
Object.values(languageDetails).forEach((d) => {
  URL_SLUG_BY_DETAIL_SLUG[d.languageSlug] = d.urlSlug;
});

/** Slug URL /daftar untuk nama bahasa Inggris funnel. "Korean" → "korea". */
export function langSlugOf(langEn: string): string {
  const standalone = STANDALONE_SLUG[langEn];
  if (standalone) return standalone;
  const detailSlug = DETAIL_SLUG_OVERRIDE[langEn] || langEn.toLowerCase();
  return URL_SLUG_BY_DETAIL_SLUG[detailSlug] || detailSlug;
}

// languageSlug di languages-detail → nama yang dipakai funnel & pricelist
// (lib/trial-pricing memakai nama Inggris). Hanya yang tidak sama dengan
// TitleCase slug-nya sendiri.
const EN_NAME_BY_DETAIL_SLUG: Record<string, string> = {
  filipino: "Tagalog",
  "portuguese-br": "Portuguese",
  "portuguese-pt": "Portuguese",
  bipa: "BIPA",
};

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const LANG_BY_SLUG: Record<string, string> = {};
ALL_FUNNEL_LANGS.forEach((l) => {
  LANG_BY_SLUG[langSlugOf(l)] = l;
});

// Bahasa yang punya landing /kursus/bahasa-* tapi tidak ada di picker langkah 1
// (Islandia, Bulgaria, Khmer, Bali, dst). Slug-nya WAJIB tetap sah di /daftar —
// kalau tidak, tombol "Daftar" di landing itu mendarat di 404.
Object.values(languageDetails).forEach((d) => {
  if (LANG_BY_SLUG[d.urlSlug]) return;
  LANG_BY_SLUG[d.urlSlug] = EN_NAME_BY_DETAIL_SLUG[d.languageSlug] || titleCase(d.languageSlug);
});

/** Kebalikan langSlugOf. "korea" → "Korean". null kalau slug tak dikenal. */
export function langFromSlug(slug: string): string | null {
  return LANG_BY_SLUG[slug.toLowerCase()] || null;
}

/** Semua slug bahasa yang sah di /daftar (dipakai generateStaticParams & sitemap). */
export const ALL_LANG_SLUGS: string[] = Object.keys(LANG_BY_SLUG);

/**
 * Nama bahasa dalam bahasa Indonesia untuk judul halaman ("Korean" → "Korea").
 * Sumbernya master kurikulum; kalau bahasanya belum ada di sana, pakai slug
 * ber-kapital ("melayu" → "Melayu").
 */
export function langNameId(langEn: string): string {
  const detailSlug = DETAIL_SLUG_OVERRIDE[langEn] || langEn.toLowerCase();
  const meta = CURRICULUM_LANGUAGES.find((l) => l.slug === detailSlug);
  if (meta) return meta.name;
  const slug = langSlugOf(langEn);
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

/**
 * Slug /daftar dari slug kurikulum/silabus ("korean" → "korea").
 * null kalau itu bukan bahasa kelas (mis. "ielts", "toefl-itp") — pemanggil
 * wajib menyiapkan jalur lain, jangan mengarang URL yang berujung 404.
 */
export function daftarSlugFromLanguageSlug(languageSlug: string): string | null {
  const slug = URL_SLUG_BY_DETAIL_SLUG[languageSlug] || languageSlug;
  return LANG_BY_SLUG[slug] ? slug : null;
}

/** Slug landing /kursus/bahasa-* untuk bahasa ini, atau null kalau belum ada. */
export function kursusSlugOf(langEn: string): string | null {
  const detailSlug = DETAIL_SLUG_OVERRIDE[langEn] || langEn.toLowerCase();
  return URL_SLUG_BY_DETAIL_SLUG[detailSlug] ? langSlugOf(langEn) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRAM
// ─────────────────────────────────────────────────────────────────────────────

/** Label program — WAJIB persis sama dengan yang dibaca /api/create-funnel-invoice. */
export const PROGRAM_LABELS = {
  private: "Kelas Private",
  "semi-private": "Semi Private",
  reguler: "Kelas Reguler",
  kids: "Kelas Kids",
  "ielts-toefl": "IELTS/TOEFL Prep",
} as const;

export type ProgramSlug = keyof typeof PROGRAM_LABELS;

const PROGRAM_SLUG_BY_LABEL: Record<string, ProgramSlug> = Object.fromEntries(
  Object.entries(PROGRAM_LABELS).map(([slug, label]) => [label, slug as ProgramSlug]),
) as Record<string, ProgramSlug>;

export function programSlugOf(label: string): ProgramSlug | null {
  return PROGRAM_SLUG_BY_LABEL[label] || null;
}

export function programFromSlug(slug: string): string | null {
  return PROGRAM_LABELS[slug.toLowerCase() as ProgramSlug] || null;
}

/**
 * Program yang tersedia untuk sebuah bahasa. Kelas Reguler hanya untuk bahasa
 * yang punya jadwal batch, IELTS/TOEFL hanya English — sama persis dengan
 * gating di funnel lama.
 */
export function programsForLang(langEn: string): ProgramSlug[] {
  const list: ProgramSlug[] = ["private", "semi-private"];
  if (isRegulerLang(langEn)) list.push("reguler");
  list.push("kids");
  if (langEn === "English") list.push("ielts-toefl");
  return list;
}

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL
// ─────────────────────────────────────────────────────────────────────────────

const KIDS_LEVELS: Record<string, string> = {
  "little-learner": "Little Learner",
  "young-explorer": "Young Explorer",
};

const CEFR_LEVELS = ["A1", "A2", "B1", "B2"];

export function levelSlugOf(level: string): string {
  const kids = Object.entries(KIDS_LEVELS).find(([, label]) => label === level);
  return kids ? kids[0] : level.toLowerCase();
}

/** Level valid untuk program ini (label seperti yang disimpan ke lead/invoice). */
export function levelsForProgram(programSlug: ProgramSlug): string[] {
  if (programSlug === "kids") return Object.values(KIDS_LEVELS);
  if (programSlug === "reguler") return ["A1"];
  return CEFR_LEVELS;
}

export function levelFromSlug(slug: string, programSlug: ProgramSlug): string | null {
  const key = slug.toLowerCase();
  const label = KIDS_LEVELS[key] || (CEFR_LEVELS.includes(key.toUpperCase()) ? key.toUpperCase() : null);
  if (!label) return null;
  return levelsForProgram(programSlug).includes(label) ? label : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PATH
// ─────────────────────────────────────────────────────────────────────────────

export type FunnelStep = 1 | 2 | 3 | 4 | 5;

export type FunnelRoute = {
  step: FunnelStep;
  langEn: string | null;
  programSlug: ProgramSlug | null;
  program: string | null;
  level: string | null;
};

/** Segmen terakhir langkah konfirmasi. */
export const CONFIRM_SEGMENT = "konfirmasi";

/**
 * Baca segmen URL /daftar/... jadi keadaan funnel.
 * null = kombinasi tidak valid → halaman balas 404 (bukan diam-diam dibetulkan,
 * biar tidak lahir URL sampah yang ikut ke-crawl).
 */
export function parseFunnelPath(segments: string[]): FunnelRoute | null {
  if (segments.length === 0) {
    return { step: 1, langEn: null, programSlug: null, program: null, level: null };
  }
  if (segments.length > 4) return null;

  const langEn = langFromSlug(segments[0]);
  if (!langEn) return null;
  if (segments.length === 1) {
    return { step: 2, langEn, programSlug: null, program: null, level: null };
  }

  const programSlug = (segments[1].toLowerCase() as ProgramSlug);
  const program = programFromSlug(segments[1]);
  if (!program || !programsForLang(langEn).includes(programSlug)) return null;
  if (segments.length === 2) {
    return { step: 3, langEn, programSlug, program, level: null };
  }

  const level = levelFromSlug(segments[2], programSlug);
  if (!level) return null;
  if (segments.length === 3) {
    return { step: 4, langEn, programSlug, program, level };
  }

  if (segments[3].toLowerCase() !== CONFIRM_SEGMENT) return null;
  return { step: 5, langEn, programSlug, program, level };
}

/** Bentuk URL /daftar dari keadaan funnel (tanpa query). */
export function buildFunnelPath(opts: {
  langEn?: string | null;
  programSlug?: ProgramSlug | null;
  level?: string | null;
  confirm?: boolean;
}): string {
  const parts = ["daftar"];
  if (opts.langEn) parts.push(langSlugOf(opts.langEn));
  if (opts.langEn && opts.programSlug) parts.push(opts.programSlug);
  if (opts.langEn && opts.programSlug && opts.level) parts.push(levelSlugOf(opts.level));
  if (opts.langEn && opts.programSlug && opts.level && opts.confirm) parts.push(CONFIRM_SEGMENT);
  return "/" + parts.join("/");
}
