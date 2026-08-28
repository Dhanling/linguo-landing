// [sr-kuis-spaced-repetition-v1] Jembatan nama bahasa ⇄ kode ISO 639-1.
//
// Kuis harian menyimpan bahasa sebagai KODE ('fi', 'ru'), sementara tabel lama
// menyimpan NAMA:
//   * lms_modules.language    → 'Vietnamese' (nama bahasa Inggris)
//   * registrations.language  → nama KELAS: 'English - Conversation A1.1 (ENG-...)'
// Semua konversi lewat file ini; tanpa itu tiap pemanggil bikin peta sendiri dan
// cepat melenceng (persis yang sudah terjadi di peta bendera vs peta harga).
//
// baseLanguage() dipakai dulu supaya nama kelas ikut terpotong jadi nama bahasa.

import { baseLanguage } from "@/lib/classLanguage";

/**
 * Nama bahasa (Inggris maupun Indonesia, apa adanya dari DB) → ISO 639-1.
 * Kunci ditulis huruf kecil; pencarian selalu di-lowercase.
 *
 * Catatan kanonik yang gampang keliru:
 *   * "Mandarin" = zh. "Chinese" cuma alias — nama kanonik di produk Linguo
 *     adalah Mandarin, dan Cantonese (yue) itu bahasa TERPISAH.
 *   * "Melayu" (ms) bahasa asing, beda dari bahasa daerah Indonesia.
 */
const NAME_TO_CODE: Record<string, string> = {
  english: "en", inggris: "en",
  mandarin: "zh", chinese: "zh",
  // [ebook-taiwan-101-v1] Modul 台灣華語 101 memakai language "Taiwanese Mandarin"
  // supaya katalog Perpustakaan memisahkannya dari Mandarin daratan. Kodenya tetap
  // zh: bahasanya sama, yang beda cuma aksara & sebagian kosakata — dan tanpa alias
  // ini kodeBahasaEbook() balik null, jadi reader kehilangan TTS & ketuk-kata.
  "taiwanese mandarin": "zh", "mandarin taiwan": "zh", taiwan: "zh",
  cantonese: "yue", kanton: "yue",
  japanese: "ja", jepang: "ja",
  korean: "ko", korea: "ko",
  arabic: "ar", arab: "ar",
  // Modul Arab Mesir (ar-eg-a1) memakai kolom language "Egyptian Arabic".
  // Tanpa alias ini kodeBahasaEbook() balik null dan reader kehilangan
  // TTS serta ketuk-kata; suaranya sendiri tetap ar-XA seperti Fusha.
  "egyptian arabic": "ar", "arab mesir": "ar", "bahasa arab mesir": "ar",
  masri: "ar", ammiyya: "ar",
  german: "de", jerman: "de",
  french: "fr", prancis: "fr", perancis: "fr",
  spanish: "es", spanyol: "es",
  italian: "it", italia: "it",
  dutch: "nl", belanda: "nl",
  russian: "ru", rusia: "ru",
  turkish: "tr", turki: "tr",
  thai: "th",
  vietnamese: "vi", vietnam: "vi",
  hindi: "hi",
  portuguese: "pt", portugis: "pt",
  danish: "da", denmark: "da",
  swedish: "sv", swedia: "sv",
  norwegian: "no", norwegia: "no",
  finnish: "fi", finlandia: "fi",
  polish: "pl", polandia: "pl",
  czech: "cs", ceko: "cs",
  greek: "el", yunani: "el",
  persian: "fa", persia: "fa", farsi: "fa",
  hebrew: "he", ibrani: "he",
  georgian: "ka", georgia: "ka",
  hungarian: "hu", hongaria: "hu",
  romanian: "ro", rumania: "ro",
  bulgarian: "bg", bulgaria: "bg",
  ukrainian: "uk", ukraina: "uk",
  icelandic: "is", islandia: "is",
  filipino: "tl", tagalog: "tl",
  basque: "eu", euskara: "eu", euskera: "eu",
  khmer: "km", kamboja: "km",
  lao: "lo",
  burmese: "my", myanmar: "my",
  urdu: "ur",
  swahili: "sw",
  malay: "ms", melayu: "ms",
  indonesian: "id", indonesia: "id", bipa: "id",
  javanese: "jv", jawa: "jv",
  sundanese: "su", sunda: "su",
  balinese: "ban", bali: "ban",
  batak: "bbc",
  bugis: "bug",
  madurese: "mad", madura: "mad",
  /* [pustaka-pengajar-tts-v1] Modul 101 yang kolom `language`-nya sudah terbit
     tapi belum pernah punya alias di sini. Tanpa entrinya kodeBahasaEbook()
     balik null dan reader e-book kehilangan ketuk-kata + suaranya DIAM-DIAM —
     tak ada galat, tak ada tombol mati, cuma halaman yang tak pernah berbunyi.
     Diperiksa langsung ke `digital_products` 28 Agu 2026. */
  bengali: "bn", bangla: "bn",
  estonian: "et", estonia: "et",
  mongolian: "mn", mongolia: "mn",
  pashto: "ps", pashtu: "ps",
  serbian: "sr", serbia: "sr",
  slovak: "sk", slovakia: "sk", slowakia: "sk",
  slovenian: "sl", slovenia: "sl",
  /* Uzbek belum punya voice Chirp sama sekali — dipetakan supaya labelnya benar,
     suaranya tetap mati sendiri lewat bisaDibunyikan(). */
  uzbek: "uz", uzbekistan: "uz",
};

/** Nama tampil (Bahasa Indonesia) per kode — dipakai judul halaman kuis & pesan WA. */
const CODE_TO_LABEL: Record<string, string> = {
  en: "Inggris", zh: "Mandarin", yue: "Kanton", ja: "Jepang", ko: "Korea",
  ar: "Arab", de: "Jerman", fr: "Prancis", es: "Spanyol", it: "Italia",
  nl: "Belanda", ru: "Rusia", tr: "Turki", th: "Thai", vi: "Vietnam",
  hi: "Hindi", pt: "Portugis", da: "Denmark", sv: "Swedia", no: "Norwegia",
  fi: "Finlandia", pl: "Polandia", cs: "Ceko", el: "Yunani", fa: "Persia",
  he: "Ibrani", ka: "Georgia", hu: "Hongaria", ro: "Rumania", bg: "Bulgaria",
  uk: "Ukraina", is: "Islandia", tl: "Filipino", km: "Khmer", lo: "Lao",
  my: "Myanmar", ur: "Urdu", sw: "Swahili", ms: "Melayu", id: "Indonesia",
  jv: "Jawa", su: "Sunda", ban: "Bali", bbc: "Batak", bug: "Bugis", mad: "Madura",
  eu: "Basque",
  bn: "Bengali", et: "Estonia", mn: "Mongolia", ps: "Pashto", sr: "Serbia",
  sk: "Slovakia", sl: "Slovenia", uz: "Uzbek",
};

/**
 * Bahasa non-Latin — soal & pilihan WAJIB punya transliterasi. Dipakai generator
 * bank soal (di sisi Edge Function) dan sebagai penanda tampilan di halaman kuis.
 */
const NON_LATIN = new Set([
  "ru", "uk", "bg", "el", "ar", "fa", "ur", "he", "ja", "ko", "zh", "yue",
  "th", "km", "lo", "my", "hi", "ka",
]);

/**
 * Nama bahasa apa pun → kode ISO 639-1. `null` kalau tidak dikenali — pemanggil
 * WAJIB memperlakukan null sebagai "lewati siswa ini", bukan menebak kode acak
 * (kuis bahasa yang salah lebih buruk daripada tidak ada kuis).
 */
export function toLangCode(raw?: string | null): string | null {
  const base = baseLanguage(raw || "").toLowerCase().trim();
  if (!base) return null;
  if (NAME_TO_CODE[base]) return NAME_TO_CODE[base];
  // Sudah berupa kode ('fi') — terima apa adanya kalau kita kenal labelnya.
  if (CODE_TO_LABEL[base]) return base;
  return null;
}

/** Kode → nama bahasa untuk ditampilkan ke siswa. Fallback: kodenya sendiri. */
export function langLabel(code?: string | null): string {
  const c = (code || "").toLowerCase().trim();
  return CODE_TO_LABEL[c] || c.toUpperCase();
}

/** Bahasa ini pakai aksara non-Latin? (→ transliterasi wajib ada). */
export function needsTranslit(code?: string | null): boolean {
  return NON_LATIN.has((code || "").toLowerCase().trim());
}

/**
 * Nama bahasa dalam bahasa Inggris — dipakai sebagai konteks prompt AI.
 * Ditulis eksplisit (bukan dibalik dari NAME_TO_CODE) karena satu kode punya
 * banyak alias dan hasil pembalikan gampang kepilih alias Indonesianya.
 */
const CODE_TO_EN: Record<string, string> = {
  en: "English", zh: "Mandarin Chinese", yue: "Cantonese", ja: "Japanese",
  ko: "Korean", ar: "Arabic", de: "German", fr: "French", es: "Spanish",
  it: "Italian", nl: "Dutch", ru: "Russian", tr: "Turkish", th: "Thai",
  vi: "Vietnamese", hi: "Hindi", pt: "Portuguese", da: "Danish", sv: "Swedish",
  no: "Norwegian", fi: "Finnish", pl: "Polish", cs: "Czech", el: "Greek",
  fa: "Persian", he: "Hebrew", ka: "Georgian", hu: "Hungarian", ro: "Romanian",
  bg: "Bulgarian", uk: "Ukrainian", is: "Icelandic", tl: "Filipino",
  km: "Khmer", lo: "Lao", my: "Burmese", ur: "Urdu", sw: "Swahili",
  ms: "Malay", id: "Indonesian", jv: "Javanese", su: "Sundanese",
  ban: "Balinese", bbc: "Batak Toba", bug: "Buginese", mad: "Madurese",
  bn: "Bengali", et: "Estonian", mn: "Mongolian", ps: "Pashto", sr: "Serbian",
  sk: "Slovak", sl: "Slovenian", uz: "Uzbek",
};

export function langEnglishName(code?: string | null): string {
  const c = (code || "").toLowerCase().trim();
  return CODE_TO_EN[c] || langLabel(c);
}
