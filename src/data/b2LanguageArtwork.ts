/** Satu paket Imagegen unik per bahasa untuk seluruh B2.1–B2.7 (tes: B2.1–B2.2).
 * Cover, tujuan, dan template isi adalah tiga gambar berbeda. Materi tetap editable.
 * Prompt dan sumber raster: docs/b2-per-language/ dan docs/b2-completion-final/.
 */
export const B2_LANGUAGE_ARTWORK_SLUGS: readonly string[] = [
  "arabic",
  "balinese",
  "batak",
  "bengali",
  "betawi",
  "bipa",
  "bosnian",
  "bugis",
  "bulgarian",
  "burmese",
  "czech",
  "danish",
  "filipino",
  "finnish",
  "french",
  "georgian",
  "greek",
  "hebrew",
  "hindi",
  "hungarian",
  "icelandic",
  "ielts",
  "irish",
  "japanese",
  "javanese",
  "khmer",
  "korean",
  "lao",
  "madurese",
  "malay",
  "norwegian",
  "persian",
  "polish",
  "portuguese-pt",
  "romanian",
  "russian",
  "sundanese",
  "swahili",
  "swedish",
  "thai",
  "toefl-itp",
  "turkish",
  "ukrainian",
  "urdu",
  "vietnamese"
];
const ADA = new Set(B2_LANGUAGE_ARTWORK_SLUGS);

export function b2LanguageArtwork(key: string): {
  cover: string; objectives: string; latar: string;
} | null {
  const match = /^([a-z-]+)-b2-([1-7])$/.exec(key);
  if (!match || !ADA.has(match[1]) || (['ielts','toefl-itp'].includes(match[1]) && Number(match[2])>2)) return null;
  const base = `/slide-cover/${match[1]}-b2-thematic`;
  return {
    cover: `${base}-cover-v1.jpg`,
    objectives: `${base}-objectives-v1.jpg`,
    latar: `${base}-body-v1.jpg`,
  };
}

/** Template kosakata tematik: panel isi 75%, ilustrasi dekoratif di kanan. */
export function isB2LanguageBodyCover(cover?: string): boolean {
  const match = /^\/slide-cover\/([a-z-]+)-b2-thematic-body-v1\.jpg$/.exec(cover || '');
  return !!match && ADA.has(match[1]);
}

/** Lapisan kontras tipis menjaga judul putih terbaca di semua palet bahasa. */
export function isB2LanguageCover(cover?: string): boolean {
  const match = /^\/slide-cover\/([a-z-]+)-b2-thematic-cover-v1\.jpg$/.exec(cover || '');
  return !!match && ADA.has(match[1]);
}
