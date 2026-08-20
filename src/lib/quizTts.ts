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
export const KODE_CHIRP = new Set([
  "es", "fr", "de", "it", "pt", "nl", "ja", "ko", "zh", "ru", "ar", "hi", "th",
  "vi", "tr", "en", "da", "sv", "no", "nb", "fi", "pl", "cs", "sk", "hu", "ro",
  "bg", "uk", "el", "he", "id", "hr", "sr", "sl", "lt", "lv", "et", "sw", "ur",
  "bn", "ta", "te", "gu", "kn", "ml", "mr", "pa", "yue", "fil", "tl",
]);

export function bisaTts(kode?: string | null): boolean {
  const k = (kode || "").trim().toLowerCase();
  // Bahasa Indonesia dilewat: di kuis ia bahasa PENGANTAR, bukan yang dipelajari.
  if (!k || k === "id") return false;
  return KODE_CHIRP.has(k);
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

/* [kuis-tts-bahasa-target-v1] Yang dibunyikan HANYA bahasa yang sedang dipelajari.
   Sebelumnya penyaringnya cuma daftar kata tanya ("manakah", "yang", "tepat"…),
   jadi pilihan jawaban yang isinya terjemahan Indonesia — "Dia selalu bepergian
   di musim dingin." — lolos dan dibacakan dengan suara Spanyol. Bunyinya bukan
   sekadar aneh: siswa A1 memakai tombol ini justru untuk MENIRU pelafalan, dan
   yang ia tirukan jadi bahasa Indonesia berlogat asing.

   Caranya tetap daftar kata, bukan deteksi bahasa otomatis: salah bunyi jauh
   lebih merusak daripada tombol yang sesekali tidak muncul. Isinya kata-kata
   Indonesia yang praktis mustahil muncul di bahasa Chirp mana pun — kata yang
   kembar dengan bahasa lain SENGAJA tidak dimasukkan ("di" & "para" milik
   Italia/Spanyol, "kami"/"kita" milik Tagalog, "mau" milik Portugis), karena satu
   kata kembar sudah cukup membungkam seluruh kalimat bahasa target. */
const KATA_ID = /\b(manakah|apakah|bagaimana|mengapa|kenapa|berapa|siapa|kapan|yang|berikut|berdasarkan|kalimat|jawaban|jawablah|terjemahkan|terjemahan|tuliskan|tulislah|tulis|isilah|lengkapi|pilihlah|pilih|artinya|berarti|maksud|ungkapan|bahasa|kata|soal|teks|gambar|paling|tepat|sesuai|benar|salah|adalah|akan|sudah|belum|dengan|untuk|dari|pada|dalam|tidak|bukan|jangan|saya|aku|kamu|anda|mereka|ini|itu|apa|karena|kalau|jika|ketika|selalu|sering|jarang|kadang|pernah|sedang|masih|juga|hanya|sangat|lebih|bisa|dapat|harus|ingin|suka|tahu|ada|orang|hari|malam|pagi|siang|musim|dingin|panas|hujan|makan|minum|pergi|bepergian|datang|pulang|rumah|sekolah|kerja|bekerja|jalan|besar|kecil|baik|buruk|banyak|sedikit|semua|setiap|antara|tentang|sebagai|seperti|namun|tetapi|tapi|supaya|agar|sehingga|oleh|kepada|terhadap|atau)\b/i;

/* Soal juga sering memakai bahasa Inggris sebagai pengantar ("Terjemahkan ke
   dalam bahasa Spanyol: 'I never speak Spanish.'") — kalimat yang dikutip itu
   bahasa SUMBER, bukan bahasa target, jadi ia pun tak boleh dibunyikan dengan
   suara Spanyol. Penyaring ini mati sendiri kalau bahasa yang dipelajari memang
   Inggris. Kata yang kembar dengan bahasa Eropa lain dibuang juga: "is"/"was"
   (Belanda/Jerman), "am" (Jerman), "can" (Turki), "has" (Spanyol), "will"
   (Jerman), "do" (Portugis). */
const KATA_EN = /\b(the|are|were|what|which|when|where|why|who|whom|whose|never|always|often|sometimes|usually|speak|speaks|spoke|say|says|said|go|goes|went|going|come|comes|make|makes|take|takes|give|gives|you|she|they|we|it|my|your|his|her|their|our|this|that|these|those|there|here|and|but|because|if|with|without|from|about|into|would|could|should|shall|have|had|not|don't|doesn't|didn't|isn't|aren't|please|thank|thanks|hello|very|more|most|some|any|every|people|day|night|morning|winter|summer|travel|water|food)\b/i;

/** Potongan teks ini kelihatan BUKAN bahasa yang sedang dipelajari? */
function bukanBahasaTarget(potongan: string, kode: string): boolean {
  if (KATA_ID.test(potongan)) return true;
  return kode !== "en" && KATA_EN.test(potongan);
}

/** Bagian teks yang layak dibunyikan; string kosong = tak ada yang dibacakan.
 *  @param kode kode bahasa target — menentukan penyaring mana yang berlaku. */
export function teksUntukTts(teks?: string | null, kode?: string | null): string {
  const t = String(teks ?? "").trim();
  if (!t) return "";
  const k = (kode || "").trim().toLowerCase();
  if (KUTIP.test(t)) {
    // Ada kutipan → isi kutipan itulah kandidatnya. Kalau ternyata kutipannya pun
    // bahasa pengantar, hasilnya kosong — TIDAK jatuh kembali ke seluruh kalimat,
    // karena kalimat di luar kutipan sudah pasti bahasa pengantar.
    const p = petikan(t).filter((x) => !bukanBahasaTarget(x, k));
    if (p.length) return p.join(". ");
    if (petikan(t).length) return "";
  }
  // Perintah dan kalimat targetnya sering dipisah titik dua ("Terjemahkan: …"),
  // jadi disaring per klausa, bukan seluruh teks sekaligus.
  const sisa = t
    .split(/[:\n]+/)
    .map((k2) => k2.trim())
    .filter((k2) => k2 && !bukanBahasaTarget(k2, k));
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
  const lang = (kode || "").trim().toLowerCase();
  const teks = teksUntukTts(teksMentah, lang);
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
