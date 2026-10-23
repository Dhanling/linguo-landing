import { imagegenA2Artwork } from './imagegenA2Artwork';

/** Memutakhirkan URL bawaan lama ketika ilustrasi Imagegen sudah tersedia. */
export function upgradeImagegenA2Cover(cover: string): string {
  const lama = /^\/slide-cover\/([a-z-]+-a[12]-[1-4])-sesi-(\d+)-(cover|tujuan)-cute-vector-v1\.svg$/.exec(cover);
  if (lama) {
    const baru = imagegenA2Artwork(lama[1], Number(lama[2]));
    if (baru) return lama[3] === 'cover' ? baru.cover : baru.objectives;
  }
  const latar = /^\/slide-cover\/([a-z-]+)-a1-a2-latar-cute-vector-v1\.svg$/.exec(cover);
  return latar && imagegenA2Artwork(`${latar[1]}-a1-1`, 1) ? '' : cover;
}

/** Area teks tujuan berhenti sebelum ilustrasi karakter di sisi kanan. */
export function isImagegenA2GoalCover(cover?: string): boolean {
  const cocok = /^\/slide-cover\/([a-z-]+-a[12]-[1-4])-tujuan-imagegen-v3\.jpg$/.exec(cover || '');
  return !!cocok && !!imagegenA2Artwork(cocok[1], 1);
}
