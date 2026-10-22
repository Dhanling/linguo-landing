// [dek-siswa-v1] Slide SIAP PAKAI per sesi silabus untuk siswa (tab Materi kelas).
//
// Dek-nya ditulis & dirakit di repo dashboard (src/data/dekSilabus → build
// scripts/dek-siswa-json.ts → teach.linguo.id/dek-siswa/<kunci>.json), lengkap
// dengan badge sublevel, bendera, dan ilustrasi per sesi. Repo ini tidak punya
// salinan dek maupun peta artwork-nya — cukup di-fetch per sublevel (CORS *).
//
// Gambar `/slide-cover/...` yang belum ada di public/ landing diteruskan ke
// dashboard lewat rewrite `fallback` di next.config.ts.
//
// Kunci sublevel: `<slug>-<kode>` dengan titik → strip, mis. "dutch-a1-1" —
// slug dari languageSlug() (sama dengan silabus, lib/silabusSesi).

import { normalizeSlide, type MateriSlide } from '@/lib/materiSlides';

const SUMBER = 'https://teach.linguo.id/dek-siswa';

/** nomor sesi (1-based) → slide */
export type DekSublevelSiswa = Record<number, MateriSlide[]>;

const cache = new Map<string, Promise<DekSublevelSiswa | null>>();

export const kunciDekSiswa = (slug: string, code: string) =>
  `${slug}-${code}`.toLowerCase().replace(/\./g, '-');

// Ilustrasi dek siap pakai tersimpan di subfolder yang tak semuanya dikenal
// normalizeSlide (pagar itu untuk dek buatan pengajar/AI). Sumber di sini dek
// kita sendiri, jadi cover yang lolos pola aman ini dipasang lagi apa adanya.
const COVER_AMAN = /^\/slide-cover\/[\w./-]+\.(?:jpe?g|png|webp|svg)$/;

async function ambil(k: string): Promise<DekSublevelSiswa | null> {
  const res = await fetch(`${SUMBER}/${k}.json`);
  if (res.status === 404) return null;
  if (!res.ok || !(res.headers.get('content-type') || '').includes('json')) throw new Error(`dek ${k}: ${res.status}`);
  const raw = await res.json();
  if (!raw || typeof raw !== 'object') return null;
  const out: DekSublevelSiswa = {};
  Object.entries(raw as Record<string, any[]>).forEach(([no, slides]) => {
    const bersih: MateriSlide[] = [];
    (slides || []).forEach((r) => {
      const s = normalizeSlide(r);
      if (!s) return;
      if (typeof r?.cover === 'string' && COVER_AMAN.test(r.cover) && !r.cover.includes('..')) {
        s.cover = r.cover;
        if (r.ruang === 'kiri' && s.type !== 'title') s.ruang = 'kiri';
      }
      bersih.push(s);
    });
    if (bersih.length) out[Number(no)] = bersih;
  });
  return out;
}

/** Dek satu sublevel (null = belum ada dek untuk sublevel itu). */
export function loadDekSiswa(slug: string | null, code: string | null | undefined): Promise<DekSublevelSiswa | null> {
  if (!slug || !code) return Promise.resolve(null);
  const k = kunciDekSiswa(slug, code);
  let p = cache.get(k);
  if (!p) {
    // Gagal jaringan jangan di-cache — boleh dicoba lagi saat tab dibuka ulang.
    p = ambil(k).catch(() => { cache.delete(k); return null; });
    cache.set(k, p);
  }
  return p;
}
