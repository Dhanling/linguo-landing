import ready from './mongolianA1ArtworkReady.json';

export const MONGOLIAN_A1_BODY = '/slide-cover/mongolian-a1-german-v1/mongolian-a1-body.webp';

/** Ilustrasi Mongolia A1; slide ketiga–penutup berbagi latar agar materi konsisten. */
export function mongolianA1Artwork(key: string, session: number): { cover: string; objectives: string; latar: string } | null {
  if (!/^mongolian-a1-[123]$/.test(key) || !Number.isInteger(session) || session < 1 || session > 16) return null;
  const assets = ready as Record<string, string>;
  const cover = assets[`${key}-sesi-${session}-cover`];
  const objectives = assets[`${key}-sesi-${session}-objectives`];
  const latar = assets['mongolian-a1-body'];
  return cover && objectives && latar ? { cover, objectives, latar } : null;
}

export const isMongolianA1Body = (cover?: string) => cover === MONGOLIAN_A1_BODY;

export const isMongolianA1Objectives = (cover?: string) => /^\/slide-cover\/mongolian-a1-german-v1\/mongolian-a1-[123]-sesi-\d+-objectives\.webp$/.test(cover ?? '');
