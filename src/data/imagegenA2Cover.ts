import { imagegenA2Artwork } from './imagegenA2Artwork';
import { a11ImagegenArtwork } from './a11ImagegenArtwork';
import { cuteVectorA2Artwork } from './cuteVectorA2Artwork';

/** Pulihkan artwork sesi; paket Imagegen bersama tidak boleh menimpanya. */
export function upgradeImagegenA2Cover(cover: string, session?: number): string {
  const lama = /^\/slide-cover\/([a-z-]+-a[12]-[1-4])-sesi-(\d+)-(cover|tujuan)-cute-vector-v1\.svg$/.exec(cover);
  if (lama) {
    // Raster khusus sesi boleh memperbarui SVG, bukan gambar bersama sublevel.
    const baru = a11ImagegenArtwork(lama[1], Number(lama[2]));
    return baru ? lama[3] === 'cover' ? baru.cover : baru.objectives : cover;
  }
  const bersama = /^\/slide-cover\/([a-z-]+-a[12]-[1-4])-(cover|tujuan)-imagegen-v3\.jpg$/.exec(cover);
  if (bersama && Number.isInteger(session) && session! >= 1 && session! <= 16) {
    // Dek tersimpan lama juga dipulihkan memakai nomor sesi dari judul dek.
    const baru = a11ImagegenArtwork(bersama[1], session!) ?? cuteVectorA2Artwork(bersama[1], session!);
    if (baru) return bersama[2] === 'cover' ? baru.cover : baru.objectives;
  }
  return cover;
}

/** Area teks tujuan berhenti sebelum ilustrasi karakter di sisi kanan. */
export function isImagegenA2GoalCover(cover?: string): boolean {
  const cocok = /^\/slide-cover\/([a-z-]+-a[12]-[1-4])-tujuan-imagegen-v3\.jpg$/.exec(cover || '');
  return !!cocok && !!imagegenA2Artwork(cocok[1], 1);
}
