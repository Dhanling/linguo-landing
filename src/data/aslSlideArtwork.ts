// Ilustrasi Imagegen per sesi ASL A1–A2; latar isi dipakai bersama.
export const ASL_LATAR = '/slide-cover/asl-a1-1-latar-imagegen-v1.jpg';
export const ASL_READY: Readonly<Record<string, readonly number[]>> = {
  "asl-a1-1": [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16
  ],
  "asl-a1-2": [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16
  ],
  "asl-a1-3": [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16
  ],
  "asl-a2-1": [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16
  ],
  "asl-a2-2": [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16
  ],
  "asl-a2-3": [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16
  ],
  "asl-a2-4": [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16
  ]
};

export function aslSlideArtwork(deckKey: string, no: number): {cover: string; objectives: string; latar: string} | null {
  if (!/^asl-(?:a1-[1-3]|a2-[1-4])$/.test(deckKey) || !Number.isInteger(no) || no < 1 || no > 16) return null;
  if (!ASL_READY[deckKey]?.includes(no)) return {cover:'/slide-cover/asl-a1-1-cover-imagegen-v1.jpg',objectives:'/slide-cover/asl-a1-1-tujuan-imagegen-v1.jpg',latar:ASL_LATAR};
  return {cover:`/slide-cover/${deckKey}-sesi-${no}-cover-imagegen-v2.jpg`,objectives:`/slide-cover/${deckKey}-sesi-${no}-tujuan-imagegen-v2.jpg`,latar:ASL_LATAR};
}

/** Perbarui gambar bawaan lama sesuai sublevel dan sesi materi tersimpan. */
export function upgradeAslCover(cover: string, session=1, sublevel='A1.1'): string {
  const key='asl-'+sublevel.toLowerCase().replace('.', '-');
  const art=aslSlideArtwork(key,session);
  if (!art || !ASL_READY[key]?.includes(session)) return cover;
  if (['/slide-cover/asl-sampul.jpg','/slide-cover/asl-vrm-sampul.jpg','/slide-cover/asl-a1-1-cover-imagegen-v1.jpg'].includes(cover)) return art.cover;
  if (['/slide-cover/asl-tujuan.jpg','/slide-cover/asl-vrm-tujuan.jpg','/slide-cover/asl-a1-1-tujuan-imagegen-v1.jpg'].includes(cover)) return art.objectives;
  return cover;
}
