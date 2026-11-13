// [ai-funnel-v1] Katalog publik Linguo untuk Konsultan AI (/konsultasi) dan
// MCP server (/api/mcp). SATU sumber untuk dua kanal itu.
//
// Sumber angka SENGAJA bukan tabel DB: harga resmi Linguo hidup di
// src/lib/trial-pricing.ts (cermin pricelist admin, dipakai juga oleh semua
// route invoice), dan klaim umum di src/lib/brand-facts.ts. Kalau katalog ini
// membaca sumber lain, harga yang disebut AI bisa beda dari harga yang
// ditagih — persis bug yang dulu dibereskan di funnel.
//
// Daftar bahasa = gabungan pricelist + kurikulum, logikanya sama dengan
// /llms.txt (lihat languageRows di src/lib/llms-txt.ts).

import { BRAND_FACTS } from "@/lib/brand-facts";
import { languages } from "@/data/curriculum/languages";
import { getAllLanguageDetailSlugs, getLanguageDetailBySlug } from "@/data/languages-detail";
import { PRICELIST_TO_CURRICULUM, PRICELIST_ONLY } from "@/lib/llms-txt";
import {
  PRICE_CATEGORIES,
  getLanguageCategory,
  getPrivateBase60,
  getSemiPrivatePrice,
  getKidsBasePerSession,
  isNativeAvailable,
  NATIVE_MULTIPLIER,
} from "@/lib/trial-pricing";
import { isRegulerLang, canonLangName } from "@/lib/programLanguages";
import { ALL_LANG_SLUGS, langSlugOf } from "@/lib/funnelRouting";
import { padananUjian } from "@/lib/levelEquivalence";

export const BASE_URL = BRAND_FACTS.url;
export const WA_ADMIN_URL = BRAND_FACTS.contact.whatsappUrl;
export const UNIMATE_URL = "https://unimate.id";

/** Level CEFR yang punya kurikulum di Linguo. */
export const CEFR_BANDS = ["A1", "A2", "B1", "B2"] as const;
export type CefrBand = (typeof CEFR_BANDS)[number];

/** Sublevel per level (sumber kebenaran: silabus landing). Tiap sublevel 16 sesi. */
export const SUBLEVELS: Record<CefrBand, number> = { A1: 3, A2: 4, B1: 5, B2: 7 };
export const SESSIONS_PER_SUBLEVEL = 16;

export type LanguageEntry = {
  /** id stabil: slug kurikulum ("japanese") atau slug nama pricelist ("traditional-chinese"). */
  id: string;
  /** Nama Indonesia ("Jepang"). */
  name: string;
  /** Nama Inggris yang dipakai pricelist ("Japanese"). Dasar semua hitungan harga. */
  nameEn: string;
  nativeName: string;
  region: string;
  priceCategory: string;
  hasCurriculum: boolean;
  levels: CefrBand[];
  landingUrl: string | null;
  syllabusUrl: string | null;
  placementTestUrl: string | null;
  registerUrl: string;
  regulerAvailable: boolean;
  nativeTeacherAvailable: boolean;
};

// Nama varian di pricelist yang sudah terwakili bahasa induknya.
const SKIP_PRICE_NAMES = new Set([
  "English British",
  "English - British",
  "English - Conversation",
  "Egyptian Arabic Dialect",
  "Portuguese - Brazilian",
  "Farsi",
]);
// Bukan bahasa (program ujian) — dijual sebagai test prep, bukan di daftar bahasa.
const NOT_A_LANGUAGE = new Set(["ielts", "toefl-itp", "toefl"]);

const kebab = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-");

let cache: LanguageEntry[] | null = null;

export function listLanguages(): LanguageEntry[] {
  if (cache) return cache;
  const curriculumBySlug = new Map(languages.map((l) => [l.slug, l]));
  const landingBySlug = new Map<string, string>();
  for (const urlSlug of getAllLanguageDetailSlugs()) {
    const d = getLanguageDetailBySlug(urlSlug);
    if (d) landingBySlug.set(d.languageSlug, `${BASE_URL}/kursus/bahasa-${d.urlSlug}`);
  }
  const daftarSlugs = new Set(ALL_LANG_SLUGS);
  const out = new Map<string, LanguageEntry>();

  const build = (
    id: string,
    nameEn: string,
    meta: { name: string; nativeName: string; region: string },
    curriculumSlug: string | null,
  ): LanguageEntry => {
    const cur = curriculumSlug ? curriculumBySlug.get(curriculumSlug) : undefined;
    const hasCurriculum = !!cur && cur.available !== false;
    const daftarSlug = langSlugOf(nameEn);
    return {
      id,
      name: meta.name,
      nameEn,
      nativeName: meta.nativeName,
      region: meta.region,
      priceCategory: getLanguageCategory(nameEn) || "C",
      hasCurriculum,
      levels: [...CEFR_BANDS],
      landingUrl: (curriculumSlug && landingBySlug.get(curriculumSlug)) || null,
      syllabusUrl: hasCurriculum ? `${BASE_URL}/silabus/${curriculumSlug}` : null,
      placementTestUrl: hasCurriculum ? `${BASE_URL}/silabus/${curriculumSlug}/coba` : null,
      registerUrl: daftarSlugs.has(daftarSlug) ? `${BASE_URL}/daftar/${daftarSlug}` : `${BASE_URL}/daftar`,
      regulerAvailable: isRegulerLang(nameEn),
      nativeTeacherAvailable: isNativeAvailable(nameEn),
    };
  };

  // 1. Bahasa berkategori harga (bisa ditagih hari ini).
  for (const nameEn of Object.values(PRICE_CATEGORIES).flat()) {
    if (SKIP_PRICE_NAMES.has(nameEn)) continue;
    const slug = PRICELIST_TO_CURRICULUM[nameEn] || (curriculumBySlug.has(kebab(nameEn)) ? kebab(nameEn) : null);
    if (slug && NOT_A_LANGUAGE.has(slug)) continue;
    const id = slug || kebab(nameEn);
    if (out.has(id)) continue;
    const cur = slug ? curriculumBySlug.get(slug) : undefined;
    const manual = PRICELIST_ONLY[nameEn];
    const meta = cur
      ? { name: cur.name, nativeName: cur.nativeName ?? cur.name, region: cur.region ?? "other" }
      : manual ?? { name: nameEn, nativeName: nameEn, region: "other" };
    out.set(id, build(id, nameEn, meta, slug));
  }

  // 2. Bahasa yang punya kurikulum tapi belum masuk pricelist (harga jatuh ke kategori C).
  for (const l of languages) {
    if (l.available === false || NOT_A_LANGUAGE.has(l.slug) || out.has(l.slug)) continue;
    const nameEn = l.slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
    out.set(
      l.slug,
      build(l.slug, nameEn, { name: l.name, nativeName: l.nativeName ?? l.name, region: l.region ?? "other" }, l.slug),
    );
  }

  cache = [...out.values()].sort((a, b) => a.name.localeCompare(b.name, "id"));
  return cache;
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/^bahasa\s+/, "").replace(/[^a-z0-9]+/g, " ").trim();

/** Cari bahasa dari input bebas ("jepang", "Japanese", "日本語", "bahasa korea"). */
export function findLanguage(query: string | null | undefined): LanguageEntry | null {
  const q = norm(String(query || ""));
  if (!q) return null;
  const all = listLanguages();
  const canon = norm(canonLangName(String(query)));
  for (const l of all) {
    const keys = [l.id, l.name, l.nameEn, l.nativeName].map((k) => norm(k));
    if (keys.includes(q) || (canon && keys.includes(canon))) return l;
  }
  const curAlias = languages.find((l) => (l.aliases || []).some((a) => norm(a) === q));
  if (curAlias) return all.find((l) => l.id === curAlias.slug) || null;
  return all.find((l) => norm(l.name).startsWith(q) || norm(l.nameEn).startsWith(q)) || null;
}

// ─── Program ────────────────────────────────────────────────────────────────

export type ProgramFormat = "private" | "semi-private" | "reguler" | "kids" | "test-prep";

export type ProgramOffer = {
  /** "<program>:<language id>" atau id produk umum ("ielts-toefl"). */
  program_id: string;
  program: string;
  format: ProgramFormat;
  language: string | null;
  description: string;
  session_minutes: number | null;
  /** Harga per sesi per siswa, per level CEFR. null = bukan tarif per sesi. */
  price_per_session_idr: Partial<Record<CefrBand, number>> | null;
  /** Harga paket flat (Reguler / test prep). */
  package_price_idr: number | null;
  package_note: string | null;
  native_teacher_note: string | null;
  url: string;
};

function perBand(fn: (band: CefrBand) => number): Partial<Record<CefrBand, number>> {
  const o: Partial<Record<CefrBand, number>> = {};
  for (const b of CEFR_BANDS) {
    const v = fn(b);
    if (v > 0) o[b] = v;
  }
  return o;
}

function programsFor(lang: LanguageEntry): ProgramOffer[] {
  const native = lang.nativeTeacherAvailable
    ? `Pengajar native tersedia untuk bahasa ini dengan tarif ${NATIVE_MULTIPLIER}× tarif pengajar lokal.`
    : null;
  const list: ProgramOffer[] = [
    {
      program_id: `private:${lang.id}`,
      program: "Kelas Private",
      format: "private",
      language: lang.name,
      description: "1-on-1 live via Zoom, jadwal & materi fleksibel, rekaman sesi + modul + e-certificate.",
      session_minutes: 60,
      price_per_session_idr: perBand((b) => getPrivateBase60(lang.nameEn, b)),
      package_price_idr: null,
      package_note: "Satu sublevel = 16 sesi. Jumlah sesi bisa dipilih saat daftar.",
      native_teacher_note: native,
      url: lang.registerUrl,
    },
    {
      program_id: `semi-private:${lang.id}`,
      program: "Kelas Semi Private",
      format: "semi-private",
      language: lang.name,
      description: "Grup kecil 2–10 siswa (daftar bersama teman), live via Zoom. Harga di sini untuk grup 2 orang, per siswa.",
      session_minutes: 60,
      price_per_session_idr: perBand((b) => getSemiPrivatePrice(lang.nameEn, b, 2).perStudent),
      package_price_idr: null,
      package_note: "Makin besar grup, makin murah per siswa.",
      native_teacher_note: null,
      url: lang.registerUrl,
    },
    {
      program_id: `kids:${lang.id}`,
      program: "Kelas Kids (5–12 tahun)",
      format: "kids",
      language: lang.name,
      description: "Little Learner 5–8 th (30 menit) & Young Explorer 9–12 th (45 menit). Harga di sini Young Explorer.",
      session_minutes: 45,
      price_per_session_idr: perBand((b) => getKidsBasePerSession("young-explorer", lang.nameEn, b)),
      package_price_idr: null,
      package_note: `Little Learner mulai ${getKidsBasePerSession("little-learner", lang.nameEn, "A1").toLocaleString("id-ID")} per sesi 30 menit.`,
      native_teacher_note: null,
      url: `${BASE_URL}/kelas-anak`,
    },
  ];
  if (lang.regulerAvailable) {
    list.push({
      program_id: `reguler:${lang.id}`,
      program: "Kelas Reguler",
      format: "reguler",
      language: lang.name,
      description: "Kelas grup 8–15 siswa, 90 menit, 8 pertemuan per batch, jadwal tetap.",
      session_minutes: 90,
      price_per_session_idr: null,
      package_price_idr: BRAND_FACTS.price.reguler,
      package_note: "Harga per batch (2 bulan). Ketersediaan batch tergantung jadwal yang sedang dibuka.",
      native_teacher_note: null,
      url: `${BASE_URL}${BRAND_FACTS.programs.find((p) => p.name === "Kelas Reguler")?.slug ?? "/daftar"}`,
    });
  }
  if (lang.id === "english") list.push(...testPrepPrograms());
  return list;
}

function testPrepPrograms(): ProgramOffer[] {
  return [
    {
      program_id: "ielts-toefl",
      program: "IELTS & TOEFL Preparation",
      format: "test-prep",
      language: "Inggris",
      description: "Kelas batch 16 sesi @90 menit, kurikulum terstruktur + mock test.",
      session_minutes: 90,
      price_per_session_idr: null,
      package_price_idr: BRAND_FACTS.price.testPrep,
      package_note: "Harga per batch (2 bulan).",
      native_teacher_note: null,
      url: `${BASE_URL}/persiapan-tes`,
    },
    {
      program_id: "pte",
      program: "PTE Academic Preparation",
      format: "test-prep",
      language: "Inggris",
      description: "Private 1-on-1 persiapan PTE Academic, sesi 90 menit, paket 8/12/16 sesi.",
      session_minutes: 90,
      price_per_session_idr: { A1: 180000, A2: 180000, B1: 180000, B2: 180000 },
      package_price_idr: null,
      package_note: "Rp 120.000/jam → Rp 180.000 per sesi 90 menit.",
      native_teacher_note: null,
      url: `${BASE_URL}/persiapan-tes?produk=pte`,
    },
    {
      program_id: "toeic",
      program: "TOEIC Preparation",
      format: "test-prep",
      language: "Inggris",
      description: "Private 1-on-1 persiapan TOEIC Listening & Reading, sesi 90 menit, paket 8/12/16 sesi.",
      session_minutes: 90,
      price_per_session_idr: { A1: 180000, A2: 180000, B1: 180000, B2: 180000 },
      package_price_idr: null,
      package_note: "Rp 120.000/jam → Rp 180.000 per sesi 90 menit.",
      native_teacher_note: null,
      url: `${BASE_URL}/persiapan-tes?produk=toeic`,
    },
  ];
}

/** Bentuk ProgramOffer tanpa harga per level yang tak relevan → untuk respons ringkas. */
export function searchPrograms(args: {
  language: string;
  level?: string | null;
  format?: string | null;
  max_budget_idr?: number | null;
}): { language: LanguageEntry | null; programs: ProgramOffer[] } {
  const lang = findLanguage(args.language);
  if (!lang) return { language: null, programs: [] };
  const band = toBand(args.level) ?? null;
  const fmt = normalizeFormat(args.format);
  let list = programsFor(lang);
  if (fmt) list = list.filter((p) => p.format === fmt);
  if (args.max_budget_idr && args.max_budget_idr > 0) {
    const max = args.max_budget_idr;
    list = list.filter((p) => {
      if (p.package_price_idr != null) return p.package_price_idr <= max;
      const prices = p.price_per_session_idr || {};
      const v = band ? prices[band] : Math.min(...Object.values(prices).filter((n): n is number => !!n));
      return v != null && v <= max;
    });
  }
  return { language: lang, programs: list };
}

export function getProgramDetails(programId: string): ProgramOffer | null {
  const id = String(programId || "").trim().toLowerCase();
  if (["ielts-toefl", "pte", "toeic"].includes(id)) return testPrepPrograms().find((p) => p.program_id === id) || null;
  const [prog, langId] = id.split(":");
  const lang = listLanguages().find((l) => l.id === langId) || findLanguage(langId);
  if (!lang) return null;
  return programsFor(lang).find((p) => p.program_id.split(":")[0] === prog) || null;
}

export function normalizeFormat(v: string | null | undefined): ProgramFormat | null {
  const s = String(v || "").toLowerCase().replace(/[\s_]+/g, "-");
  if (!s) return null;
  if (s.includes("semi")) return "semi-private";
  if (s.includes("priv")) return "private";
  if (s.includes("reg") || s.includes("group") || s.includes("grup")) return "reguler";
  if (s.includes("kid") || s.includes("anak")) return "kids";
  if (s.includes("test") || s.includes("ielts") || s.includes("toefl") || s.includes("tes")) return "test-prep";
  return null;
}

/** "b1.3" → "B1"; "pemula"/"nol"/"A0" → null (belum punya level). */
export function toBand(v: string | null | undefined): CefrBand | null {
  const s = String(v || "").trim().toUpperCase();
  const b = s.slice(0, 2);
  return (CEFR_BANDS as readonly string[]).includes(b) ? (b as CefrBand) : null;
}

export function examEquivalent(lang: LanguageEntry, band: CefrBand) {
  return padananUjian(lang.id, band) || padananUjian(lang.nameEn, band);
}
