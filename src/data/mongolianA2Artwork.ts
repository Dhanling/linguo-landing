import ready from './mongolianA2ArtworkReady.json';
import { MONGOLIAN_A1_BODY } from './mongolianA1Artwork';

/** Sampul dan tujuan per sesi A2, dengan latar isi yang konsisten bersama A1. */
export function mongolianA2Artwork(key: string, session: number): { cover: string; objectives: string; latar: string } | null {
  if (!/^mongolian-a2-[1-4]$/.test(key) || !Number.isInteger(session) || session < 1 || session > 16) return null;
  const assets = ready as Record<string, string>;
  const cover = assets[`${key}-sesi-${session}-cover`];
  const objectives = assets[`${key}-sesi-${session}-objectives`];
  return cover && objectives ? { cover, objectives, latar: MONGOLIAN_A1_BODY } : null;
}

export const isMongolianA2Objectives = (cover?: string) => /^\/slide-cover\/mongolian-a2-german-v1\/mongolian-a2-[1-4]-sesi-\d+-objectives\.webp$/.test(cover ?? '');
