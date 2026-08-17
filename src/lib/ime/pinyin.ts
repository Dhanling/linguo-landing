/**
 * IME pinyin → hanzi. Ini satu-satunya aksara di sini yang TIDAK bisa otomatis:
 * "shi" saja punya puluhan hanzi berbeda (是 时 十 事 使 市 …), jadi mesin tidak
 * berhak memilihkan. Yang benar adalah menawarkan kandidat dan siswa yang
 * menunjuk — persis cara IME sungguhan bekerja.
 *
 * Kamusnya (public/ime/pinyin.json, ±500 KB terkompresi) diambil lewat fetch
 * SEKALI dan hanya kalau bahasa kuisnya Mandarin. Kandidat diurut memakai
 * peringkat pemakaian dari korpus film & buku, jadi tebakan pertamanya biasanya
 * yang paling lumrah — lihat scripts/build-ime-pinyin.mjs.
 */

interface Indeks { v: number; syllables: string[]; map: Record<string, string[]> }

let indeks: Indeks | null = null;
let sedangMuat: Promise<Indeks | null> | null = null;

export async function muatIndeksPinyin(): Promise<Indeks | null> {
  if (indeks) return indeks;
  // Dua soal yang butuh kamus bisa memanggil berbarengan; tanpa janji yang
  // dipakai bersama, berkas 1,4 MB itu terunduh dua kali.
  if (!sedangMuat) {
    sedangMuat = fetch("/ime/pinyin.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { indeks = j; return j; })
      .catch(() => null);
  }
  return sedangMuat;
}

/** Sudah siap dipakai tanpa menunggu jaringan? */
export const indeksSiap = () => indeks !== null;

/**
 * Penggal ekor pinyin yang sedang diketik jadi kandidat.
 *
 * Yang dicari lebih dulu adalah SELURUH buffer ("xihuan" → 喜欢), baru
 * dipendekkan suku kata demi suku kata. Urutan ini yang membuat kata majemuk
 * menang atas rangkaian hanzi lepas — tanpa itu "xihuan" keluar jadi 西欢.
 */
export function kandidatPinyin(buffer: string): { kunci: string; kandidat: string[] } {
  const b = buffer.toLowerCase().replace(/[^a-z]/g, "");
  if (!indeks || !b) return { kunci: "", kandidat: [] };

  for (let n = Math.min(b.length, 18); n >= 1; n--) {
    const potong = b.slice(0, n);
    const hit = indeks.map[potong];
    if (hit?.length) return { kunci: potong, kandidat: hit };
  }
  return { kunci: "", kandidat: [] };
}

/** Ketikan masih mungkin jadi pinyin sah? Dipakai untuk memutuskan apakah
 *  bilah kandidat perlu muncul — bukan untuk menolak ketikan. */
export function mungkinPinyin(buffer: string): boolean {
  const b = buffer.toLowerCase();
  if (!indeks || !b) return false;
  return indeks.syllables.some((s) => s.startsWith(b) || b.startsWith(s));
}
