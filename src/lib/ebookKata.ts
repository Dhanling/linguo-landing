/* [ebook-popup-kata-v1] Arti kata yang diketuk di reader e-book.
 *
 * Sebelumnya ketukan cuma menghasilkan bunyi: siswa tahu "casa" dibaca KA-sa,
 * tapi kalau kata itu muncul di halaman yang tak memuat terjemahannya, artinya
 * tetap harus ditebak. Popup ini menutup lubang itu — bentuknya sengaja meniru
 * balon kata Watch and Learn supaya siswa yang pindah antar produk tidak perlu
 * belajar dua kebiasaan.
 *
 * [ebook-kata-deepseek-v1] Jalurnya lewat /api/ebook-kata — BUKAN lagi edge
 * function `word-info` milik Watch and Learn. Kuota fungsi itu habis (20 Agu
 * 2026) sehingga baris arti tak pernah terisi, dan rute sendiri membuat kita
 * bisa memakai penyedia termurah + cache bersama; lihat catatan di rutenya.
 *
 * Sengaja TIDAK lewat @/lib/immersionLearn: modul itu 150 KB berisi transkrip,
 * deck, & langganan — semuanya ikut terbawa ke bundel reader hanya demi satu
 * pemanggilan.
 */

import { langEnglishName } from "@/lib/quiz/language";

export interface ArtiKata {
  /** Arti singkat dalam bahasa Indonesia. */
  arti: string;
  /** Kelas kata ("verba", "nomina", …) — dipakai sebagai chip kecil. */
  kelas: string;
  /** Bentuk dasar untuk verba terkonjugasi (mis. "llamo" → "llamar"). */
  dasar?: string;
  /**
   * [ebook-kata-translit-v1] Cara baca beraksara Latin ("немного" → "nemnogo").
   * Kosong/undefined untuk bahasa yang aksaranya memang sudah Latin — barisnya
   * disembunyikan, karena "casa → casa" cuma menambah baris tanpa isi.
   */
  translit?: string;
}

/**
 * Kata ini beraksara non-Latin? Pemicunya SKRIP teksnya, bukan kode bahasanya:
 * satu modul bisa mencampur dua aksara (tabel kosakata Rusia yang memuat kata
 * serapan Latin, judul bab berbahasa Inggris), dan memakai kode bahasa membuat
 * baris cara baca muncul di kata yang tak membutuhkannya.
 */
export function perluTranslit(kata: string): boolean {
  const huruf = kata.match(/\p{L}/gu);
  if (!huruf?.length) return false;
  return huruf.some((h) => !/\p{Script=Latin}/u.test(h));
}

/** "mati" = layanan artinya sedang tak bisa dipakai (kuota AI habis / penyedia
 *  ngadat) — beda dari `null` yang berarti satu kata itu saja yang gagal
 *  dibaca. Popup MENYEMBUNYIKAN baris arti waktu "mati": menampilkan "gagal
 *  dimuat" di tiap ketukan cuma bikin fitur yang bekerja (pelafalan) ikut
 *  terasa rusak. Berlakunya SEMENTARA — lihat [ebook-kata-mati-sementara-v1]. */
export type HasilArti = ArtiKata | null | "mati";

/* Kuota AI habis berlaku untuk SELURUH sesi, bukan untuk satu kata: sekali
   ketahuan habis, ketukan berikutnya tidak menembak edge function lagi. */
/* [ebook-kata-mati-sementara-v1] "Mati" itu JEDA, bukan vonis sepanjang sesi.
   Dulu satu balasan 502 mengunci baris arti sampai tab ditutup — dan 502 ikut
   dipakai untuk kegagalan yang cuma menyangkut SATU kata (jawaban model bukan
   JSON, arti kosong). Akibatnya: siswa membaca beberapa halaman dengan arti +
   cara baca lengkap, lalu tiba-tiba popupnya jadi kartu pelafalan telanjang di
   halaman berikutnya tanpa sebab yang kelihatan.

   Sekarang galat per kata dibalas 422 oleh rute/edge function (dianggap `null`
   = kata itu saja), dan 502/429 cuma menahan tembakan sebentar. Kuota AI yang
   benar-benar habis tetap tak menghujani API: satu ketukan tiap beberapa menit.
*/
const JEDA_TUMBANG_MS = 90_000;   // 502 — penyedia lagi ngadat
const JEDA_KUOTA_MS = 10 * 60_000; // 429 — kuota/rate limit
let matiSampai = 0;
const sedangMati = () => Date.now() < matiSampai;
export const artiSedangMati = () => sedangMati();

/* Satu kata yang sama diketuk berkali-kali sepanjang satu modul — cache memori
   ini yang menahannya jadi puluhan panggilan AI. Kuncinya memuat kalimat:
   arti kata bergantung konteks ("como" = "seperti" vs "saya makan"). */
const memori = new Map<string, ArtiKata>();
const kunci = (kode: string, kata: string, kalimat: string) =>
  `${kode}|${kata.toLowerCase()}|${kalimat.slice(0, 120)}`;

export function artiTersimpan(kata: string, kalimat: string, kode: string): HasilArti | undefined {
  const ada = memori.get(kunci(kode, kata, kalimat));
  if (ada) return ada;
  return sedangMati() ? "mati" : undefined;
}

/**
 * Arti kata dalam konteks kalimatnya. `null` = tak terbaca (jaringan mati, AI
 * kehabisan kuota) — pemanggil menampilkan popup TANPA baris arti, bukan galat:
 * pelafalannya tetap jalan dan itu bagian yang paling dibutuhkan.
 */
export async function artiKataEbook(
  kata: string,
  kalimat: string,
  kode: string,
): Promise<HasilArti> {
  const k = kunci(kode, kata, kalimat);
  const ada = memori.get(k);
  if (ada) return ada;
  if (sedangMati()) return "mati";

  try {
    const res = await fetch("/api/ebook-kata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        word: kata,
        // Kalimat kosong pun tak apa — modelnya cuma kehilangan konteks.
        sentence: kalimat || kata,
        language: langEnglishName(kode),
      }),
    });
    const p = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    // 502 dari rute = SEMUA penyedia gagal (biasanya kuota). Bukan galat sesaat
    // per kata — matikan sampai sesi berakhir, jangan diulang tiap ketukan.
    if (res.status === 429 || res.status === 502) {
      matiSampai = Date.now() + (res.status === 429 ? JEDA_KUOTA_MS : JEDA_TUMBANG_MS);
      return "mati";
    }
    if (!res.ok) return null;
    const arti = typeof p.meaning === "string" ? p.meaning.trim() : "";
    const kelas = typeof p.type === "string" ? p.type.trim() : "";
    const dasar = typeof p.base === "string" ? p.base.trim() : "";
    const translit = typeof p.translit === "string" ? p.translit.trim() : "";
    if (!arti && !kelas) return null;
    const hasil: ArtiKata = {
      arti,
      kelas,
      dasar: dasar && dasar.toLowerCase() !== kata.toLowerCase() ? dasar : undefined,
      // Model kadang mengembalikan kata aslinya bulat-bulat untuk bahasa Latin;
      // itu bukan cara baca, jadi dibuang di sini sekali untuk semua pemakai.
      translit:
        translit && perluTranslit(kata) && translit.toLowerCase() !== kata.toLowerCase()
          ? translit
          : undefined,
    };
    // Cuma hasil yang BERHASIL yang disimpan: kegagalan sesaat (jaringan siswa
    // putus sebentar) tak boleh membekukan kata itu jadi "tak ada arti"
    // sepanjang sesi — ketukan berikutnya berhak mencoba lagi.
    memori.set(k, hasil);
    return hasil;
  } catch {
    return null;
  }
}
