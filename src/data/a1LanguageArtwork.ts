/** Satu paket Imagegen unik per bahasa untuk seluruh A1.1–A1.3.
 * Cover, tujuan, dan template isi adalah tiga gambar berbeda. Materi tetap editable.
 * Prompt dan sumber raster: docs/a1-per-language/.
 */
export const A1_LANGUAGE_ARTWORK_SLUGS: readonly string[] = [
  "arabic",
  "asl",
  "balinese",
  "batak",
  "bengali",
  "betawi",
  "bipa",
  "bisindo",
  "bosnian",
  "bugis",
  "bulgarian",
  "burmese",
  "cantonese",
  "czech",
  "danish",
  "dutch",
  "english",
  "filipino",
  "finnish",
  "french",
  "georgian",
  "german",
  "greek",
  "hebrew",
  "hindi",
  "hungarian",
  "icelandic",
  "irish",
  "italian",
  "japanese",
  "javanese",
  "khmer",
  "korean",
  "lao",
  "madurese",
  "malay",
  "mandarin",
  "norwegian",
  "persian",
  "polish",
  "portuguese-br",
  "portuguese-pt",
  "romanian",
  "russian",
  "spanish",
  "sundanese",
  "swahili",
  "swedish",
  "thai",
  "turkish",
  "ukrainian",
  "urdu",
  "vietnamese"
];
const ADA = new Set(A1_LANGUAGE_ARTWORK_SLUGS);

export function a1LanguageArtwork(key: string): {
  cover: string; objectives: string; latar: string;
} | null {
  const match = /^([a-z-]+)-a1-[1-3]$/.exec(key);
  if (!match || !ADA.has(match[1])) return null;
  const base = `/slide-cover/${match[1]}-a1-thematic`;
  return {
    cover: `${base}-cover-v1.jpg`,
    objectives: `${base}-objectives-v1.jpg`,
    latar: `${base}-body-v1.jpg`,
  };
}

/** Template kosakata tematik: panel isi 75%, ilustrasi dekoratif di kanan. */
export function isA1LanguageBodyCover(cover?: string): boolean {
  const match = /^\/slide-cover\/([a-z-]+)-a1-thematic-body-v1\.jpg$/.exec(cover || '');
  return !!match && ADA.has(match[1]);
}

/** Lapisan kontras tipis menjaga judul putih terbaca di semua palet bahasa. */
export function isA1LanguageCover(cover?: string): boolean {
  const match = /^\/slide-cover\/([a-z-]+)-a1-thematic-cover-v1\.jpg$/.exec(cover || '');
  return !!match && ADA.has(match[1]);
}
