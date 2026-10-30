/** Satu paket Imagegen unik per bahasa untuk seluruh A2.1–A2.4.
 * Cover, tujuan, dan template isi adalah tiga gambar berbeda. Materi tetap editable.
 * Prompt dan sumber raster: docs/a2-per-language/.
 */
export const A2_LANGUAGE_ARTWORK_SLUGS: readonly string[] = [
  "balinese",
  "batak",
  "bengali",
  "betawi",
  "bosnian",
  "bugis",
  "burmese",
  "czech",
  "filipino",
  "hindi",
  "irish",
  "khmer",
  "lao",
  "madurese",
  "malay",
  "portuguese-pt",
  "swahili",
  "thai",
  "urdu",
  "vietnamese"
];
const ADA = new Set(A2_LANGUAGE_ARTWORK_SLUGS);

export function a2LanguageArtwork(key: string): {
  cover: string; objectives: string; latar: string;
} | null {
  const match = /^([a-z-]+)-a2-[1-4]$/.exec(key);
  if (!match || !ADA.has(match[1])) return null;
  const base = `/slide-cover/${match[1]}-a2-thematic`;
  return {
    cover: `${base}-cover-v1.jpg`,
    objectives: `${base}-objectives-v1.jpg`,
    latar: `${base}-body-v1.jpg`,
  };
}

/** Template kosakata tematik: panel isi 75%, ilustrasi dekoratif di kanan. */
export function isA2LanguageBodyCover(cover?: string): boolean {
  const match = /^\/slide-cover\/([a-z-]+)-a2-thematic-body-v1\.jpg$/.exec(cover || '');
  return !!match && ADA.has(match[1]);
}

/** Lapisan kontras tipis menjaga judul putih terbaca di semua palet bahasa. */
export function isA2LanguageCover(cover?: string): boolean {
  const match = /^\/slide-cover\/([a-z-]+)-a2-thematic-cover-v1\.jpg$/.exec(cover || '');
  return !!match && ADA.has(match[1]);
}
