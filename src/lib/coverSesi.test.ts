import { describe, it, expect } from 'vitest';
import { parseDeck, serializeDeck } from './materiSlides';
import { upgradeImagegenA2Cover } from '../data/imagegenA2Cover';
import { CUTE_VECTOR_A2_LANGUAGES, cuteVectorA2Artwork } from '../data/cuteVectorA2Artwork';
import { a11ImagegenArtwork } from '../data/a11ImagegenArtwork';

describe('cover sesi setelah materi disimpan dan dibaca siswa', () => {
  it('mempertahankan SVG atau raster khusus sesi untuk 2.576 sesi A1–A2', () => {
    let jumlah = 0;
    for (const slug of CUTE_VECTOR_A2_LANGUAGES) {
      for (const [level, total] of [['a1', 3], ['a2', 4]] as const) {
        for (let sub = 1; sub <= total; sub++) {
          const key = `${slug}-${level}-${sub}`;
          for (let no = 1; no <= 16; no++) {
            const expected = a11ImagegenArtwork(key, no) ?? cuteVectorA2Artwork(key, no)!;
            const slides = [
              { type: 'title' as const, heading: `Sesi ${no} · Materi`, cover: expected.cover },
              { type: 'points' as const, heading: 'Tujuan', points: ['Memahami materi'], cover: expected.objectives, ruang: 'kiri' as const },
            ];
            const hasil = parseDeck(serializeDeck(slides))!;
            expect(hasil.slides[0].cover).toBe(expected.cover);
            expect(hasil.slides[1].cover).toBe(expected.objectives);
            const lama = slides.map((s, i) => ({ ...s, cover: `/slide-cover/${key}-${i ? 'tujuan' : 'cover'}-imagegen-v3.jpg` }));
            const pulih = parseDeck(serializeDeck(lama))!;
            expect(pulih.slides[0].cover).toBe(expected.cover);
            expect(pulih.slides[1].cover).toBe(expected.objectives);
            jumlah++;
          }
        }
      }
    }
    expect(jumlah).toBe(2576);
  });
  it('mempertahankan latar isi dan cover kustom', () => {
    for (const path of ['/slide-cover/french-a1-a2-latar-cute-vector-v1.svg', '/slide-cover/pengajar-kustom.jpg']) {
      expect(upgradeImagegenA2Cover(path, 5)).toBe(path);
    }
  });
  it('tidak menebak sesi untuk materi tanpa nomor atau nomor invalid', () => {
    const path = '/slide-cover/french-a2-1-cover-imagegen-v3.jpg';
    for (const no of [undefined, 0, 17, NaN]) expect(upgradeImagegenA2Cover(path, no)).toBe(path);
    const hasil = parseDeck(serializeDeck([{type:'title',heading:'Materi',cover:path}]))!;
    expect(hasil.slides[0].cover).toBe(path);
  });
});
