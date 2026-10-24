// Satu set Imagegen untuk seluruh sesi ASL A1.1; gerakan avatar tetap dari materi.
export const ASL_ARTWORK = {
  cover: '/slide-cover/asl-a1-1-cover-imagegen-v1.jpg',
  objectives: '/slide-cover/asl-a1-1-tujuan-imagegen-v1.jpg',
  latar: '/slide-cover/asl-a1-1-latar-imagegen-v1.jpg',
} as const;

export function aslSlideArtwork(deckKey: string, no: number): typeof ASL_ARTWORK | null {
  return deckKey === 'asl-a1-1' && Number.isInteger(no) && no >= 1 && no <= 16 ? ASL_ARTWORK : null;
}

/** Materi tersimpan dengan cover bawaan lama ikut memakai ilustrasi terbaru. */
export function upgradeAslCover(cover: string): string {
  if (cover === '/slide-cover/asl-sampul.jpg' || cover === '/slide-cover/asl-vrm-sampul.jpg') return ASL_ARTWORK.cover;
  if (cover === '/slide-cover/asl-tujuan.jpg' || cover === '/slide-cover/asl-vrm-tujuan.jpg') return ASL_ARTWORK.objectives;
  return cover;
}
