/* [tts-kunci-bersama-v1] Nama voice Chirp + kunci cache TTS — SATU sumber untuk
 * server (/api/tts) dan klien (reader e-book).
 *
 * Kenapa dipisah ke sini: sejak reader boleh mengambil mp3 langsung dari
 * Supabase Storage (tanpa melewati fungsi serverless sama sekali), klien harus
 * bisa menghitung SENDIRI nama berkas yang dipakai server waktu menyimpannya.
 * Kalau peta locale atau pembersih teksnya berbeda seujung kuku, kuncinya beda,
 * dan setiap ketukan jatuh ke jalur lambat tanpa satu pun galat yang kelihatan.
 *
 * ⚠️ Jangan menyalin isi berkas ini ke tempat lain — impor.
 */

/** Kode bahasa → locale BCP-47 yang punya voice Chirp 3 HD (diverifikasi live
 *  lewat GET /v1/voices; lihat catatan di /api/tts). */
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
  eu: "eu-ES",
  ms: "ms-MY",
  /* Basa Jawa tak punya suara sama sekali di katalog Google (dicek 25 Agu 2026:
     nol voice untuk jv-*). Dipetakan ke id-ID karena ejaan Jawa memakai
     kesepakatan huruf yang sama dengan bahasa Indonesia — suara Indonesia
     membacanya nyaris benar, kecuali `a` di ujung kata yang berbunyi `o` dan
     pasangan dh/th. Tanpa pemetaan ini ia jatuh ke en-US dan terbaca kacau. */
  jv: "id-ID",
  /* [ebook-tts-sunda-v1] Sama seperti jv: katalog Google nol voice untuk su-*
     (dicek 25 Agu 2026). Basa Sunda memakai kesepakatan huruf Latin yang sama
     dengan bahasa Indonesia, jadi suara id-ID membacanya nyaris benar —
     kecuali vokal `eu` yang keluar sebagai dua bunyi terpisah. */
  su: "id-ID",
};

/** Kore = suara Chirp 3 HD bawaan (ada di semua locale di peta atas). */
export const CHIRP_SPEAKER = "Kore";

/** Locale yang belum punya Chirp 3 HD → voice terbaik yang tersedia. */
export const VOICE_OVERRIDE: Record<string, string> = {
  "fil-PH": "fil-ph-Neural2-A",
  // Euskara belum punya Chirp 3 HD; satu-satunya suara yang ada di katalog Google.
  "eu-ES": "eu-ES-Standard-B",
};

export const BUCKET_TTS = "tts-cache";

/** Locale Chirp untuk sebuah kode bahasa; null = tak ada suaranya. */
export function localeChirp(kode?: string | null): string | null {
  const k = String(kode || "").trim().toLowerCase().split("-")[0];
  return (k && CHIRP_LOCALES[k]) || null;
}

/** Nama voice persis seperti yang dipakai /api/tts waktu menyimpan ke cache. */
export function namaVoice(kode?: string | null): string | null {
  const locale = localeChirp(kode);
  if (!locale) return null;
  return VOICE_OVERRIDE[locale] ?? `${locale}-Chirp3-HD-${CHIRP_SPEAKER}`;
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
