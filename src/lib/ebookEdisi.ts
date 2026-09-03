// [ebook-new-edition-label-v1] Penanda modul "new edition" untuk etalase /toko.
//
// `digital_products` TIDAK punya kolom edisi. Yang membedakan cuma POLA JUDUL:
// modul edisi baru dinamai "<Bahasa> 101 - A1" (nomor tiga angka + tingkat CEFR
// tunggal), sedangkan edisi lama bernama "Modul Belajar Bahasa … 101 (English
// Edition)" dengan `level` rentang "A1-B1".
//
// ⚠️ Jangan pakai file_url/`cover_url` sebagai penanda: sebagian modul edisi
// LAMA juga sudah diunggah ke bucket `ebook-files`, dan sebagian modul edisi
// BARU (French, Persian, Portuguese, Levantine Arabic 101) berkasnya masih
// menumpang Drive. Pola judul satu-satunya penanda yang tidak bohong.
// Sama persis dengan saringan rak Perpustakaan pengajar di repo dashboard.
const POLA_NEW_EDITION = /\b\d{3}\s*[-–—]\s*(A1|A2|B1|B2|C1|C2)\b/i;

export const LABEL_NEW_EDITION = 'New Edition';

export function adalahNewEdition(
  title: string | null | undefined,
  type?: string | null,
): boolean {
  if (!title) return false;
  // Produk e-learning ikut bernomor, tapi label edisi ini soal modul cetak.
  if (type && type !== 'ebook') return false;
  return POLA_NEW_EDITION.test(title);
}

type ProdukEdisi = {
  title?: string | null;
  type?: string | null;
  language?: string | null;
};

/**
 * [etalase-sembunyikan-edisi-lama-v1] Buang modul edisi LAMA dari etalase kalau
 * bahasa yang sama sudah punya modul edisi baru.
 *
 * Kenapa perlu: 26 bahasa punya DUA kartu berdampingan — "Modul Belajar Bahasa
 * Polandia … (English Edition)" 100 halaman Rp79.000 "Lifetime" dan "Polish 101 -
 * A1" 152 halaman Rp79.000/6 bulan. Pembeli yang mengira keduanya modul yang sama
 * memilih yang lifetime, lalu protes karena yang terbuka modul lama (2 Sep 2026:
 * Bahrun; sejak Juni ada 17 pembelian lain yang jatuh ke edisi lama).
 *
 * Barisnya sengaja TIDAK dimatikan di DB: `is_active` masih dipakai halaman
 * /toko/[slug] dan join perpustakaan pembeli lama — mereka harus tetap bisa
 * membuka modul yang sudah dibayar. Yang disembunyikan cuma etalasenya.
 */
export function saringEdisiLama<T extends ProdukEdisi>(produk: T[]): T[] {
  const kunci = (p: ProdukEdisi) => (p.language ?? '').toLowerCase().trim();
  const punyaEdisiBaru = new Set(
    produk
      .filter((p) => adalahNewEdition(p.title, p.type) && kunci(p))
      .map(kunci),
  );
  return produk.filter((p) => {
    if (p.type && p.type !== 'ebook') return true;          // e-learning tak kena
    if (adalahNewEdition(p.title, p.type)) return true;
    const k = kunci(p);
    return !k || !punyaEdisiBaru.has(k);                     // tanpa bahasa → biarkan
  });
}
