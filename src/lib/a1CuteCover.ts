import ready from '../data/a1CuteCoverReady.json';

/** Ganti hanya sampul SVG lama; label level dan materi tetap dari dek asli. */
export function a1CuteCover(cover?: string, isTitle = true): string | undefined {
  if (!isTitle || !cover) return cover;
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
