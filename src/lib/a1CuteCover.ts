import ready from '../data/a1CuteCoverReady.json';

const bahasaTujuan = new Set(['danish', 'french', 'polish', 'bulgarian', 'hebrew', 'norwegian', 'romanian', 'arabic']);

/** Ganti hanya SVG bawaan lama; materi dan gambar pilihan pengajar tetap dijaga. */
export function a1CuteCover(cover?: string, isTitle = true): string | undefined {
  if (!cover) return cover;
  if (!isTitle) {
    const tujuan = /^\/slide-cover\/([a-z-]+)-a[12]-[1-4]-sesi-(?:[1-9]|1[0-6])-tujuan-cute-vector-v1\.svg$/.exec(cover);
    if (tujuan && ['japanese', 'korean', 'icelandic'].includes(tujuan[1])) {
      return `/slide-cover/next-priority-textured-v2/${tujuan[1]}-objectives.webp`;
    }
    return tujuan && bahasaTujuan.has(tujuan[1])
      ? `/slide-cover/priority-goals-v1/${tujuan[1]}-objectives.webp`
      : cover;
  }
  const match = /^\/slide-cover\/([a-z-]+)-(a[12]|b[12])-(\d+)-sesi-(\d+)-cover-cute-vector-v1\.svg$/.exec(cover);
  if (!match) return cover;
  const [, language, level, sublevel, session] = match;
  const available = ready as Record<string, string>;
  if (level === 'a1') return available[`${language}-a1-${sublevel}-sesi-${session}`] ?? cover;
  // Level lanjutan sementara memakai sesi bernomor sama dari A1 bahasa tersebut.
  for (const previous of ['3', '2', '1']) {
    const replacement = available[`${language}-a1-${previous}-sesi-${session}`];
    if (replacement) return replacement;
  }
  return Object.entries(available).find(([key]) => key.startsWith(`${language}-a1-`))?.[1] ?? cover;
}
