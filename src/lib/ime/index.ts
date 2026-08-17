/**
 * Penentu: bahasa kuis ini perlu bantuan mengetik aksara atau tidak?
 *
 * `quiz_sets.target_lang` berisi NAMA bahasa dalam bahasa Inggris ("Russian",
 * "Mandarin"), bukan kode ISO — itulah yang dikirim quiz-public ke halaman
 * siswa, jadi pencocokannya dilakukan atas nama, dengan kode sebagai cadangan.
 */
import type { Aksara } from "./engine";

export type ModeIme = "auto" | "kandidat";

export interface Ime {
  kode: string;
  aksara: Aksara | "pinyin";
  mode: ModeIme;
  /** Dipakai di label saklar, mis. "Latin → Sirilik". */
  label: string;
  /** Contoh yang ditampilkan saat saklar menyala. */
  contoh: string;
}

const DAFTAR: Array<Ime & { nama: string[] }> = [
  { nama: ["russian", "rusia", "ru"], kode: "ru", aksara: "cyrillic", mode: "auto", label: "Latin → Sirilik", contoh: "ya ne lyublyu → я не люблю" },
  { nama: ["ukrainian", "ukraina", "uk"], kode: "uk", aksara: "cyrillic", mode: "auto", label: "Latin → Sirilik", contoh: "dobryi den → добрий ден" },
  { nama: ["bulgarian", "bulgaria", "bg"], kode: "bg", aksara: "cyrillic", mode: "auto", label: "Latin → Sirilik", contoh: "dobar den → добар ден" },
  { nama: ["serbian", "serbia", "sr"], kode: "sr", aksara: "cyrillic", mode: "auto", label: "Latin → Sirilik", contoh: "dobar dan → добар дан" },
  { nama: ["macedonian", "makedonia", "mk"], kode: "mk", aksara: "cyrillic", mode: "auto", label: "Latin → Sirilik", contoh: "dobar den → добар ден" },
  { nama: ["greek", "yunani", "el"], kode: "el", aksara: "greek", mode: "auto", label: "Latin → Yunani", contoh: "kalimera → καλημερα" },
  { nama: ["japanese", "jepang", "ja"], kode: "ja", aksara: "kana", mode: "auto", label: "Romaji → Kana", contoh: "watashi → わたし" },
  { nama: ["korean", "korea", "ko"], kode: "ko", aksara: "hangul", mode: "auto", label: "Romaja → Hangul", contoh: "annyeong → 안녕" },
  { nama: ["mandarin", "chinese", "mandarin (chinese)", "zh", "cmn"], kode: "zh", aksara: "pinyin", mode: "kandidat", label: "Pinyin → Hanzi", contoh: "xihuan → 喜欢" },
];

export function imeUntuk(bahasa?: string | null): Ime | null {
  const b = String(bahasa ?? "").trim().toLowerCase();
  if (!b) return null;
  const hit = DAFTAR.find((d) => d.nama.some((n) => b === n || b.startsWith(n + " ") || b.includes(n)));
  if (!hit) return null;
  const { nama: _nama, ...ime } = hit;
  return ime;
}

export { konversi, PEMISAH } from "./engine";
export type { Aksara, HasilKonversi } from "./engine";
export { kandidatPinyin, muatIndeksPinyin, mungkinPinyin, indeksSiap } from "./pinyin";
