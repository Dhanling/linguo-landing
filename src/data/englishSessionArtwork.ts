import ready from './englishSessionArtReady.json';

/** Aset baru aktif hanya setelah hasil Imagegen tersimpan di repositori. */
export function englishSessionArtwork(key: string, session: number) {
  if (!Number.isInteger(session) || !(ready as Record<string, number[]>)[key]?.includes(session)) return null;
  const image = `/slide-cover/${key}-sesi-${session}-cover-clay-v1.jpg`;
  return { cover: image, objectives: image, latar: '/slide-cover/english-latar.jpg' };
}

/** Pulihkan materi tersimpan yang masih memakai cover umum bawaan Inggris. */
export function upgradeEnglishSessionCover(cover: string, session?: number, sublevel?: string): string {
  if (!session || !sublevel) return cover;
  const bawaan = /^\/slide-cover\/english-(sampul|tujuan)\.jpg$/.exec(cover)
    ?? /^\/slide-cover\/english-a[12]-thematic-(cover|objectives)-v1\.jpg$/.exec(cover);
  if (!bawaan) return cover;
  const artwork = englishSessionArtwork(`english-${sublevel.toLowerCase().replace('.', '-')}`, session);
  if (!artwork) return cover;
  return ['sampul', 'cover'].includes(bawaan[1]) ? artwork.cover : artwork.objectives;
}

/** Penanda ilustrasi sesi untuk menjaga kontras teks pada sampul. */
export function isEnglishSessionArtCover(cover?: string): boolean {
  return /^\/slide-cover\/english-a[12]-[1-4]-sesi-\d+-cover-clay-v1\.jpg$/.test(cover || '');
}
