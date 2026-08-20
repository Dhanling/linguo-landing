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
}

/** "mati" = layanan artinya sedang tak bisa dipakai (kuota AI habis) — beda
 *  dari `null` yang berarti satu kata itu saja yang gagal dibaca. Popup
 *  MENYEMBUNYIKAN baris arti waktu "mati": menampilkan "gagal dimuat" di tiap
 *  ketukan cuma bikin fitur yang bekerja (pelafalan) ikut terasa rusak. */
export type HasilArti = ArtiKata | null | "mati";

/* Kuota AI habis berlaku untuk SELURUH sesi, bukan untuk satu kata: sekali
   ketahuan habis, ketukan berikutnya tidak menembak edge function lagi. */
let mati = false;
export const artiSedangMati = () => mati;

/* Satu kata yang sama diketuk berkali-kali sepanjang satu modul — cache memori
   ini yang menahannya jadi puluhan panggilan AI. Kuncinya memuat kalimat:
   arti kata bergantung konteks ("como" = "seperti" vs "saya makan"). */
const memori = new Map<string, ArtiKata>();
const kunci = (kode: string, kata: string, kalimat: string) =>
  `${kode}|${kata.toLowerCase()}|${kalimat.slice(0, 120)}`;

export function artiTersimpan(kata: string, kalimat: string, kode: string): HasilArti | undefined {
  const ada = memori.get(kunci(kode, kata, kalimat));
  if (ada) return ada;
  return mati ? "mati" : undefined;
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
  if (mati) return "mati";

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
    if (res.status === 429 || res.status === 502) { mati = true; return "mati"; }
    if (!res.ok) return null;
    const arti = typeof p.meaning === "string" ? p.meaning.trim() : "";
    const kelas = typeof p.type === "string" ? p.type.trim() : "";
    const dasar = typeof p.base === "string" ? p.base.trim() : "";
    if (!arti && !kelas) return null;
    const hasil: ArtiKata = {
      arti,
      kelas,
      dasar: dasar && dasar.toLowerCase() !== kata.toLowerCase() ? dasar : undefined,
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
