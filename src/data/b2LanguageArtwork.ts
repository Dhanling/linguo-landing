/** Satu paket Imagegen unik per bahasa untuk seluruh B2.1–B2.7.
 * Cover, tujuan, dan template isi adalah tiga gambar berbeda. Materi tetap editable.
 * Prompt dan sumber raster: docs/b2-per-language/.
 */
export const B2_LANGUAGE_ARTWORK_SLUGS: readonly string[] = [
  "arabic",
  "danish",
  "filipino",
  "finnish",
  "french",
  "greek",
  "hungarian",
  "japanese",
  "norwegian",
  "polish",
  "romanian",
  "russian",
  "swedish",
  "turkish"
];
const ADA = new Set(B2_LANGUAGE_ARTWORK_SLUGS);

export function b2LanguageArtwork(key: string): {
  cover: string; objectives: string; latar: string;
} | null {
  const match = /^([a-z-]+)-b2-[1-7]$/.exec(key);
  if (!match || !ADA.has(match[1])) return null;
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
