// Satu pasangan Imagegen berbeda untuk setiap sesi ASL A1.1.
export const ASL_LATAR = '/slide-cover/asl-a1-1-latar-imagegen-v1.jpg';
export function aslSlideArtwork(deckKey: string, no: number): {cover: string; objectives: string; latar: string} | null {
  if (!Number.isInteger(no) || no < 1 || no > 16) return null;
  // [isyarat-asl-a1a2-v1] A1.2–A2.4 belum punya gambar per sesi → sampul & tujuan umum ASL
  if (/^asl-(a1-[23]|a2-[1-4])$/.test(deckKey)) {
    return { cover: '/slide-cover/asl-a1-1-cover-imagegen-v1.jpg', objectives: '/slide-cover/asl-a1-1-tujuan-imagegen-v1.jpg', latar: ASL_LATAR };
  }
  if (deckKey !== 'asl-a1-1') return null;
  return {
    cover: `/slide-cover/asl-a1-1-sesi-${no}-cover-imagegen-v2.jpg`,
    objectives: `/slide-cover/asl-a1-1-sesi-${no}-tujuan-imagegen-v2.jpg`,
    latar: ASL_LATAR,
  };
}

/** Gambar bawaan lama diperbarui sesuai nomor sesi materi tersimpan. */
export function upgradeAslCover(cover: string, session = 1): string {
  const art = aslSlideArtwork('asl-a1-1', session);
  if (!art) return cover;
  if (['/slide-cover/asl-sampul.jpg', '/slide-cover/asl-vrm-sampul.jpg', '/slide-cover/asl-a1-1-cover-imagegen-v1.jpg'].includes(cover)) return art.cover;
  if (['/slide-cover/asl-tujuan.jpg', '/slide-cover/asl-vrm-tujuan.jpg', '/slide-cover/asl-a1-1-tujuan-imagegen-v1.jpg'].includes(cover)) return art.objectives;
  return cover;
}
