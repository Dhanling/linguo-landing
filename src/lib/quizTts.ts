/* [kuis-tts-chirp-v1] Pelafalan teks bahasa target di halaman pengerjaan kuis.
 *
 * Siswa A1 sering bisa MEMBACA kalimatnya tapi tidak tahu bunyinya — apalagi di
 * bahasa beraksara non-Latin. Tombol pengeras suara kecil di soal & tiap pilihan
 * menutup lubang itu tanpa mengubah cara kuis dikerjakan.
 *
 * Suaranya lewat /api/tts (Google Chirp 3 HD, kunci service account ada di
 * server) — rute yang sama dengan TTS Watch & Learn, jadi tak ada kredensial
 * atau tagihan baru. Web Speech browser SENGAJA tidak dipakai sebagai cadangan:
 * suaranya bergantung mesin TTS masing-masing HP dan untuk bahasa yang tidak
 * terpasang ia melafalkan teks asing dengan fonem Indonesia — lebih menyesatkan
 * daripada tidak ada suara sama sekali. Bahasa di luar daftar Chirp → tombolnya
 * tidak ditampilkan.
 */

/** Locale yang punya suara Chirp 3 HD di /api/tts. Cerminan CHIRP_LOCALES di
 *  src/app/api/tts/route.ts — kode di luar daftar ini dibalas 422 oleh rute itu,
 *  jadi disaring sejak di klien supaya tombolnya tak pernah muncul sia-sia. */
const CHIRP_CODES = new Set([
  "es", "fr", "de", "it", "pt", "nl", "ja", "ko", "zh", "ru", "ar", "hi", "th",
  "vi", "tr", "en", "da", "sv", "no", "nb", "fi", "pl", "cs", "sk", "hu", "ro",
  "bg", "uk", "el", "he", "id", "hr", "sr", "sl", "lt", "lv", "et", "sw", "ur",
  "bn", "ta", "te", "gu", "kn", "ml", "mr", "pa", "yue", "fil", "tl",
]);

export function bisaTts(kode?: string | null): boolean {
  const k = (kode || "").trim().toLowerCase();
  // Bahasa Indonesia dilewat: di kuis ia bahasa PENGANTAR, bukan yang dipelajari.
  if (!k || k === "id") return false;
  return CHIRP_CODES.has(k);
}

/* Soal kuis ditulis campur: kalimat perintah dalam bahasa Indonesia, potongan
   bahasa target di dalam tanda kutip ("Manakah balasan untuk '¿Por qué…?'").
   Membacakan seluruh kalimat itu dengan suara Spanyol menghasilkan bahasa
   Indonesia berlogat Spanyol. Jadi: kalau ada kutipan, yang dibunyikan HANYA
   isi kutipan; kalau tidak ada, seluruh teks dianggap bahasa target. */
const KUTIP = /['"“”‘’«»„]/;
function petikan(teks: string): string[] {
  const out: string[] = [];
  const re = /['"“‘«„]([^'"“”‘’«»„]{2,})['"”’»]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(teks))) out.push(m[1].trim());
  return out.filter(Boolean);
}

/* Tanpa kutipan pun soalnya bisa berbahasa Indonesia seluruhnya ("Manakah kata
   yang tepat?"). Kata-kata di bawah ini praktis mustahil muncul di kalimat bahasa
   target mana pun yang punya suara Chirp, jadi kehadirannya dipakai sebagai bukti
   "ini kalimat pengantar" — klausa itu tidak dibunyikan. Sengaja tidak memakai
   deteksi bahasa: salah bunyi (Indonesia dibaca dengan fonem Spanyol) jauh lebih
   merusak daripada tombol yang kadang tidak muncul. */
const PENANDA_ID = /\b(manakah|apakah|bagaimana|mengapa|yang|berikut|kalimat|jawaban|terjemahkan|tuliskan|tulis|pilihlah|pilih|artinya|bahasa|paling|tepat|sesuai|adalah|dengan|untuk|tidak|saya|kamu|sebagai|dalam|atau|ini|itu)\b/i;

/** Bagian teks yang layak dibunyikan; string kosong = tak ada yang dibacakan. */
export function teksUntukTts(teks?: string | null): string {
  const t = String(teks ?? "").trim();
  if (!t) return "";
  if (KUTIP.test(t)) {
    const p = petikan(t);
    if (p.length) return p.join(". ");
  }
  // Perintah dan kalimat targetnya sering dipisah titik dua ("Terjemahkan: …"),
  // jadi disaring per klausa, bukan seluruh teks sekaligus.
  const sisa = t
    .split(/[:\n]+/)
    .map((k) => k.trim())
    .filter((k) => k && !PENANDA_ID.test(k));
  return sisa.join(". ");
}

// Satu elemen Audio dipakai bergantian: tap cepat antar pilihan tidak boleh
// menumpuk jadi beberapa suara yang bunyi bersamaan.
let audio: HTMLAudioElement | null = null;
let seq = 0;
const cache = new Map<string, string>(); // `${kode}|${teks}` -> objectURL

function mainkan(url: string) {
  if (audio) { try { audio.pause(); audio.currentTime = 0; } catch {} }
  audio = new Audio(url);
  audio.play().catch(() => {});
}

export function hentikanTts() {
  seq++;
  if (audio) { try { audio.pause(); audio.currentTime = 0; } catch {} }
}

/**
 * Bunyikan teks. Balikannya menandakan berhasil/tidak supaya pemanggil bisa
 * mematikan indikator "sedang memuat" — bukan untuk ditampilkan sebagai galat.
 */
export async function ucapkan(teksMentah?: string | null, kode?: string | null): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const teks = teksUntukTts(teksMentah);
  const lang = (kode || "").trim().toLowerCase();
  if (!teks || !bisaTts(lang)) return false;

  const kunci = `${lang}|${teks}`;
  const ada = cache.get(kunci);
  // Sudah ada di cache → putar SINKRON di dalam gesture tap; satu await saja
  // sebelum play() sudah cukup membuat Safari iOS memblokirnya sebagai autoplay.
  if (ada) { seq++; mainkan(ada); return true; }

  const saya = ++seq;
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: teks.slice(0, 400), lang }),
    });
    if (!res.ok) return false;
    const { audioContent } = await res.json();
    if (!audioContent) return false;
    const bytes = Uint8Array.from(atob(audioContent), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
    cache.set(kunci, url);
    if (saya !== seq) return true; // keburu disusul tap lain — jangan ikut bunyi
    mainkan(url);
    return true;
  } catch {
    return false;
  }
}
