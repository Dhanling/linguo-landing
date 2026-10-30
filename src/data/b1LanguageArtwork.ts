/** Satu paket Imagegen unik per bahasa untuk seluruh B1.1–B1.5.
 * Cover, tujuan, dan template isi adalah tiga gambar berbeda. Materi tetap editable.
 * Prompt dan sumber raster: docs/b1-per-language/.
 */
export const B1_LANGUAGE_ARTWORK_SLUGS: readonly string[] = [
  "arabic",
  "bipa",
  "danish",
  "filipino",
  "finnish",
  "french",
  "greek",
  "hebrew",
  "hungarian",
  "japanese",
  "javanese",
  "norwegian",
  "persian",
  "polish",
  "romanian",
  "russian",
  "sundanese",
  "swedish",
  "turkish"
];
const ADA = new Set(B1_LANGUAGE_ARTWORK_SLUGS);

export function b1LanguageArtwork(key: string): {
  cover: string; objectives: string; latar: string;
} | null {
  const match = /^([a-z-]+)-b1-[1-5]$/.exec(key);
  if (!match || !ADA.has(match[1])) return null;
  const base = `/slide-cover/${match[1]}-b1-thematic`;
  return {
    cover: `${base}-cover-v1.jpg`,
    objectives: `${base}-objectives-v1.jpg`,
    latar: `${base}-body-v1.jpg`,
  };
}

/** Template kosakata tematik: panel isi 75%, ilustrasi dekoratif di kanan. */
export function isB1LanguageBodyCover(cover?: string): boolean {
  const match = /^\/slide-cover\/([a-z-]+)-b1-thematic-body-v1\.jpg$/.exec(cover || '');
  return !!match && ADA.has(match[1]);
}

/** Lapisan kontras tipis menjaga judul putih terbaca di semua palet bahasa. */
export function isB1LanguageCover(cover?: string): boolean {
  const match = /^\/slide-cover\/([a-z-]+)-b1-thematic-cover-v1\.jpg$/.exec(cover || '');
  return !!match && ADA.has(match[1]);
}
