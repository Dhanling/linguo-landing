import { describe, it, expect } from 'vitest';
import ready from '../data/englishSessionArtReady.json';
import { englishSessionArtwork, upgradeEnglishSessionCover } from '../data/englishSessionArtwork';
import { parseDeck, serializeDeck } from './materiSlides';

describe('ilustrasi sesi Inggris', () => {
  it('mengaktifkan hanya unit lengkap dan mempertahankan gambar sesudah simpan/baca', () => {
    for (const [key, sessions] of Object.entries(ready)) {
      expect(sessions).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
      const code = key.slice(8).replace(/-(\d+)$/, '.$1').toUpperCase();
      const covers = new Set<string>();
      for (const no of sessions) {
        const art = englishSessionArtwork(key, no)!;
        covers.add(art.cover);
        for (const jenis of ['umum', 'tematik', 'baru']) {
          const slides = [
            { type: 'title' as const, heading: `Sesi ${no} · Materi`, sublevel: code, cover: jenis === 'baru' ? art.cover : jenis === 'tematik' ? '/slide-cover/english-a1-thematic-cover-v1.jpg' : '/slide-cover/english-sampul.jpg' },
            { type: 'points' as const, heading: 'Tujuan', points: ['Memahami materi'], cover: jenis === 'baru' ? art.objectives : jenis === 'tematik' ? '/slide-cover/english-a1-thematic-objectives-v1.jpg' : '/slide-cover/english-tujuan.jpg' },
          ];
          const deck = parseDeck(serializeDeck(slides))!;
          expect(deck.slides[0].cover).toBe(art.cover);
          expect(deck.slides[1].cover).toBe(art.objectives);
          expect(deck.slides[1].points).toEqual(['Memahami materi']);
        }
      }
      expect(covers.size).toBe(16);
    }
  });
  it('mempertahankan cover kustom, A1.1, dan materi tanpa nomor sesi', () => {
    const custom = '/slide-cover/pengajar-kustom.jpg';
    expect(upgradeEnglishSessionCover(custom, 3, 'A1.2')).toBe(custom);
    expect(upgradeEnglishSessionCover('/slide-cover/english-sampul.jpg', undefined, 'A1.2')).toBe('/slide-cover/english-sampul.jpg');
    expect(englishSessionArtwork('english-a1-1', 3)).toBeNull();
    expect(englishSessionArtwork('english-b1-1', 3)).toBeNull();
  });
});
