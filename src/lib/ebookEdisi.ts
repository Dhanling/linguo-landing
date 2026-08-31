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
