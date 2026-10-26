// [konjugasi-animasi-v1] Tabel konjugasi interaktif di modal sesi silabus.
// Satu berkas per bahasa (src/data/konjugasi/{slug}.ts, slug = slug silabus),
// dimuat malas lewat import dinamis — sama seperti data kurikulum.

/** Jenis potongan kata — menentukan warna & urutan animasi.
 *  akar    = akar/stem verba (muncul duluan)
 *  waktu   = penanda tense/aspek/mood (mis. -ed, -iyor, -ba-, -rá-)
 *  persona = akhiran persona/jumlah/gender (mis. -o, -as, -m, -ла)
 *  bantu   = kata kerja bantu terpisah (have, will, haben, avoir)
 *  lain    = penanda lain: negasi, sopan santun, harmoni vokal, prefiks aspek */
export type JenisSegmen = "akar" | "waktu" | "persona" | "bantu" | "lain";

/** [teks, jenis]. Spasi antarkata ditulis di teksnya sendiri ("have " / "habe "). */
export type Segmen = [string, JenisSegmen];

export interface BarisKonjugasi {
  /** subjek/pronomina dalam bahasa aslinya: "yo", "ich", "я", "私" */
  pronomina: string;
  /** arti pronomina dalam bahasa Indonesia: "saya", "kamu", "dia (lk)" */
  arti: string;
  /** bentuk verba yang dipotong per segmen; digabung = bentuk utuh */
  bentuk: Segmen[];
  /** transliterasi bentuk utuh untuk aksara non-Latin (opsional) */
  latin?: string;
}

export interface TabelKonjugasi {
  /** unik di dalam satu bahasa, mis. "presente-ar" */
  id: string;
  /** nama tense seperti yang dipakai di kelas: "Presente (-AR)", "Simple Past" */
  nama: string;
  /** satu kalimat penjelasan pemakaian, bahasa Indonesia */
  ringkas: string;
  /** verba contoh dalam bentuk kamus + artinya */
  verba: string;
  arti: string;
  /** dicocokkan ke judul + topik sesi silabus (case-insensitive disarankan) */
  cocok: RegExp[];
  baris: BarisKonjugasi[];
  /** 1–3 tips pola singkat, bahasa Indonesia */
  catatan?: string[];
  contoh?: { kalimat: string; arti: string; latin?: string };
}

export interface KonjugasiBahasa {
  /** aksara kanan-ke-kiri (Arab, Ibrani, Persia, Urdu) */
  rtl?: boolean;
  tabel: TabelKonjugasi[];
}
