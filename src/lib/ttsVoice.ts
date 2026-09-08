/* [tts-kunci-bersama-v1] Nama voice + kunci cache TTS — SATU sumber untuk
 * server (/api/tts) dan klien (reader e-book).
 *
 * Kenapa dipisah ke sini: sejak reader boleh mengambil mp3 langsung dari
 * Supabase Storage (tanpa melewati fungsi serverless sama sekali), klien harus
 * bisa menghitung SENDIRI nama berkas yang dipakai server waktu menyimpannya.
 * Kalau peta locale atau pembersih teksnya berbeda seujung kuku, kuncinya beda,
 * dan setiap ketukan jatuh ke jalur lambat tanpa satu pun galat yang kelihatan.
 *
 * ⚠️ Jangan menyalin isi berkas ini ke tempat lain — impor.
 *
 * [tts-azure-minoritas-v1] Dua penyedia, satu peta:
 *   • Google Chirp 3 HD  — bahasa besar (CHIRP_LOCALES).
 *   • Azure Neural       — bahasa yang di katalog Google NIHIL (Irlandia, Lao,
 *     Khmer, Myanmar, Uzbek, Persia, Georgia), cuma punya suara Standard tua
 *     (Islandia, Basque), atau selama ini DIPINJAMKAN ke suara bahasa lain
 *     (Jawa & Sunda → id-ID, Mongolia → ru-RU, Pashto → ur-IN).
 *   Penyedianya ditentukan dari KODE BAHASA, bukan dari env server: klien
 *   menghitung nama berkas cache dari nama voice, jadi nama itu harus sama
 *   di mana pun dihitung. Kalau kunci Azure belum terpasang di server, rute
 *   /api/tts turun ke suara Google lama (kalau ada) dan menyimpan di bawah
 *   nama Google-nya — lebih lambat (lewat rute, bukan CDN), tapi tetap berbunyi.
 */

/** Kode bahasa → locale BCP-47 yang punya voice Chirp 3 HD (diverifikasi live
 *  lewat GET /v1/voices; lihat catatan di /api/tts). Bahasa yang juga ada di
 *  AZURE_VOICES dipakai HANYA sebagai cadangan waktu kunci Azure tak ada. */
export const CHIRP_LOCALES: Record<string, string> = {
  es: "es-ES", fr: "fr-FR", de: "de-DE", it: "it-IT", pt: "pt-BR",
  nl: "nl-NL", ja: "ja-JP", ko: "ko-KR", zh: "cmn-CN", ru: "ru-RU",
  ar: "ar-XA", hi: "hi-IN", th: "th-TH", vi: "vi-VN", tr: "tr-TR",
  en: "en-US",
  da: "da-DK", sv: "sv-SE", no: "nb-NO", nb: "nb-NO", fi: "fi-FI",
  pl: "pl-PL", cs: "cs-CZ", sk: "sk-SK", hu: "hu-HU", ro: "ro-RO",
  bg: "bg-BG", uk: "uk-UA", el: "el-GR", he: "he-IL", id: "id-ID",
  hr: "hr-HR", sr: "sr-RS", sl: "sl-SI", lt: "lt-LT", lv: "lv-LV",
  et: "et-EE", sw: "sw-KE", ur: "ur-IN", bn: "bn-IN", ta: "ta-IN",
  te: "te-IN", gu: "gu-IN", kn: "kn-IN", ml: "ml-IN", mr: "mr-IN",
  pa: "pa-IN", yue: "yue-HK",
  fil: "fil-PH", tl: "fil-PH",
  ms: "ms-MY",
  /* ── cadangan Google untuk bahasa yang utamanya Azure (lihat AZURE_VOICES) ──
     Dipakai hanya waktu AZURE_SPEECH_KEY tak terpasang di server. */
  eu: "eu-ES",   // eu-ES-Standard-B (VOICE_OVERRIDE)
  is: "is-IS",   // is-IS-Standard-B (VOICE_OVERRIDE), dicek live 8 Sep 2026
  /* Basa Jawa & Sunda tak punya suara di katalog Google (nol voice jv-* dan su-*,
     25 Agu 2026). Dipinjamkan ke id-ID karena ejaannya memakai kesepakatan
     huruf yang sama — nyaris benar kecuali `a` akhir Jawa yang berbunyi `o`,
     pasangan dh/th, dan vokal `eu` Sunda. */
  jv: "id-ID",
  su: "id-ID",
  /* Mongolia: Kiril Mongol = Kiril Rusia + ө/ү; suara Rusia membaca sebagian
     besar katanya, dua huruf khas itu keluar sebagai o/u. Pashto: aksara sama
     persis dengan Urdu; ښ ږ ځ څ ې ۍ keluar sebagai bunyi terdekatnya. */
  mn: "ru-RU",
  ps: "ur-IN",
};

/** Kore = suara Chirp 3 HD bawaan (ada di semua locale di peta atas). */
export const CHIRP_SPEAKER = "Kore";

/** Locale yang belum punya Chirp 3 HD → voice Google terbaik yang tersedia. */
export const VOICE_OVERRIDE: Record<string, string> = {
  "fil-PH": "fil-ph-Neural2-A",
  // Euskara & Íslenska belum punya Chirp 3 HD; satu-satunya suara di katalog Google.
  "eu-ES": "eu-ES-Standard-B",
  "is-IS": "is-IS-Standard-B",
};

/* [tts-azure-minoritas-v1] Bahasa yang suara neural-nya ada di Azure Speech.
   Nama voice = nama resmi Azure (`<locale>-<Nama>Neural`), dipakai APA ADANYA
   sebagai folder cache di bucket `tts-cache` — jadi mengganti suara di sini
   otomatis memisahkan cache lama. Semua suara perempuan supaya warnanya
   seragam dengan Kore di jalur Google. Daftar ini hanya bahasa yang ADA di
   katalog e-book; verifikasi nama voice live pakai `scripts/cek-azure-tts.mjs`
   sebelum menambah baris. */
export const AZURE_VOICES: Record<string, { locale: string; voice: string }> = {
  is: { locale: "is-IS", voice: "is-IS-GudrunNeural" },
  ga: { locale: "ga-IE", voice: "ga-IE-OrlaNeural" },
  eu: { locale: "eu-ES", voice: "eu-ES-AinhoaNeural" },
  lo: { locale: "lo-LA", voice: "lo-LA-KeomanyNeural" },
  km: { locale: "km-KH", voice: "km-KH-SreymomNeural" },
  my: { locale: "my-MM", voice: "my-MM-NilarNeural" },
  mn: { locale: "mn-MN", voice: "mn-MN-YesuiNeural" },
  ps: { locale: "ps-AF", voice: "ps-AF-LatifaNeural" },
  jv: { locale: "jv-ID", voice: "jv-ID-SitiNeural" },
  su: { locale: "su-ID", voice: "su-ID-TutiNeural" },
  uz: { locale: "uz-UZ", voice: "uz-UZ-MadinaNeural" },
  fa: { locale: "fa-IR", voice: "fa-IR-DilaraNeural" },
  ka: { locale: "ka-GE", voice: "ka-GE-EkaNeural" },
};

/** Format keluaran Azure — mp3 supaya satu bucket, satu tipe berkas. */
export const AZURE_FORMAT = "audio-24khz-48kbitrate-mono-mp3";

/** Semua kode bahasa yang bisa dibunyikan lewat /api/tts (Google ∪ Azure). */
export const KODE_TTS: ReadonlySet<string> = new Set([
  ...Object.keys(CHIRP_LOCALES), ...Object.keys(AZURE_VOICES),
]);

export const BUCKET_TTS = "tts-cache";

const kodeDasar = (kode?: string | null) =>
  String(kode || "").trim().toLowerCase().split("-")[0];

/** Penyedia untuk sebuah kode bahasa; null = tak ada suaranya sama sekali. */
export function penyediaTts(kode?: string | null): "azure" | "google" | null {
  const k = kodeDasar(kode);
  if (!k) return null;
  if (AZURE_VOICES[k]) return "azure";
  return CHIRP_LOCALES[k] ? "google" : null;
}

/** Locale Chirp (Google) untuk sebuah kode bahasa; null = tak ada suaranya. */
export function localeChirp(kode?: string | null): string | null {
  const k = kodeDasar(kode);
  return (k && CHIRP_LOCALES[k]) || null;
}

/** Nama voice GOOGLE persis seperti yang dipakai /api/tts waktu menyimpan ke
 *  cache — juga jadi cadangan bahasa Azure waktu kuncinya belum ada. */
export function namaVoiceGoogle(kode?: string | null): string | null {
  const locale = localeChirp(kode);
  if (!locale) return null;
  return VOICE_OVERRIDE[locale] ?? `${locale}-Chirp3-HD-${CHIRP_SPEAKER}`;
}

/** Nama voice persis seperti yang dipakai /api/tts waktu menyimpan ke cache. */
export function namaVoice(kode?: string | null): string | null {
  const az = AZURE_VOICES[kodeDasar(kode)];
  return az ? az.voice : namaVoiceGoogle(kode);
}

/** Sama seperti cleanText di gen-vietnam-audio.mjs — buang anotasi "(...)" & "·".
 *  Teks yang MASUK ke kunci cache adalah hasil fungsi ini, bukan teks mentah. */
export function bersihkanTeksTts(s: string): string {
  return String(s || "").replace(/\s*\([^)]*\)/g, "").replace(/\s*·\s*/g, ", ").trim();
}

/** Batas panjang yang dipakai rute TTS — ikut disalin klien supaya kuncinya sama. */
export const BATAS_TEKS_TTS = 400;

/** Jalur objek di bucket `tts-cache`. `sha` = sha256(`${voice}|${teks}`) hex. */
export function jalurCacheTts(voice: string, sha: string): string {
  return `${voice}/${sha.slice(0, 40)}.mp3`;
}
