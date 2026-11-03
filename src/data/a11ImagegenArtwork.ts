import { A11_IMAGEGEN_READY } from './a11ImagegenReady';

/** Ilustrasi raster asli Imagegen; tidak mengaktifkan sesi yang asetnya belum lengkap. */
export function a11ImagegenArtwork(deckKey: string, session: number): { cover: string; objectives: string; latar?: string } | null {
  if (!Number.isInteger(session) || !A11_IMAGEGEN_READY[deckKey]?.includes(session)) return null;
  const base = `/slide-cover/${deckKey}-sesi-${session}`;
  return {
    cover: `${base}-cover-imagegen-v1.jpg`,
    objectives: `${base}-tujuan-imagegen-v1.jpg`,
    ...(deckKey === 'mandarin-a1-1' ? { latar: '/slide-cover/mandarin-latar.jpg' } : {}),
  };
}
