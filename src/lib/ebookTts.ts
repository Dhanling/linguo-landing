/* [ebook-tts-ketuk-kata-v1] Pelafalan kata/kalimat yang diketuk di reader e-book.
 *
 * Modul mandiri Linguo ditulis untuk dibaca SENDIRI: tidak ada pengajar di
 * sebelah siswa yang bisa ditanya "ini bunyinya bagaimana". Ketuk katanya di
 * halaman, suaranya keluar — itu saja lubang yang ditutup fitur ini.
 *
 * Suaranya lewat /api/tts (Google Chirp 3 HD), rute yang sama dengan TTS kuis &
 * Watch and Learn — tidak ada kredensial maupun tagihan baru.
 *
 * Soal biaya: Chirp ditagih per KARAKTER, dan satu kata yang sama diketuk
 * berkali-kali oleh siswa yang sama (dan oleh ratusan siswa lain yang membaca
 * modul yang sama) adalah pola pemakaian yang wajar di reader. Karena itu ada
 * tiga lapis cache:
 *   1. memori    — ketuk ulang di sesi yang sama: nol jaringan, nol tagihan;
 *   2. Cache API — bertahan sesudah tab ditutup, per perangkat;
 *   3. server    — Supabase Storage di /api/tts, DIPAKAI BERSAMA semua siswa,
 *                  jadi satu frasa cuma pernah disintesis sekali seumur hidup.
 */

import { toLangCode } from "@/lib/quiz/language";
import { KODE_CHIRP } from "@/lib/quizTts";

/** Bahasa ini punya suara Chirp 3 HD? Beda dengan `bisaTts` di kuis: di sini
 *  Indonesia IKUT, karena modul BIPA memang bahasa targetnya Indonesia. */
export function bisaDibunyikan(kode?: string | null): boolean {
  const k = (kode || "").trim().toLowerCase();
  return !!k && KODE_CHIRP.has(k);
}

/* Judul katalog memuat edisi bahasa pengantarnya — "… (Edisi Bahasa Indonesia)".
   Kalau bagian itu ikut dipindai, modul Spanyol bisa terbaca sebagai modul
   Indonesia dan seluruh isinya dibunyikan dengan suara yang salah. */
const BUANG_EDISI = /\((?:edisi|indonesian?|english)[^)]*\)|edisi\s+bahasa\s+\p{L}+/giu;

/**
 * Kode bahasa modul: kolom `digital_products.language` dulu, judulnya belakangan.
 * null = jangan tawarkan TTS sama sekali (lebih baik tak ada suara daripada
 * kata Spanyol dilafalkan dengan fonem Vietnam).
 */
export function kodeBahasaEbook(language?: string | null, judul?: string | null): string | null {
  const dariKolom = toLangCode(language);
  if (dariKolom) return dariKolom;
  const bersih = String(judul || "").replace(BUANG_EDISI, " ");
  for (const kata of bersih.split(/[^\p{L}]+/u)) {
    if (kata.length < 3) continue;
    const k = toLangCode(kata);
    if (k) return k;
  }
  return null;
}

/* Baris terjemahan & glosarium "harfiah:" di modul ditulis bahasa Indonesia dan
   duduk PERSIS di bawah kalimat bahasa targetnya. Tanpa penyaring ini, ketukan
   pada baris terjemahan menghasilkan bahasa Indonesia berlogat asing — persis
   yang paling tidak boleh ditiru siswa A1. Daftar kata, bukan deteksi otomatis:
   kata yang kembar dengan bahasa lain sengaja tidak dimasukkan ("di", "para",
   "kami", "mau"), karena satu kata kembar sudah cukup membungkam kalimat
   bahasa target yang seharusnya berbunyi. */
const KATA_ID = /\b(yang|dan|atau|dengan|untuk|dari|pada|dalam|tidak|bukan|jangan|adalah|akan|sudah|belum|saya|aku|kamu|anda|dia|mereka|kita|ini|itu|apa|apakah|bagaimana|mengapa|kenapa|berapa|siapa|kapan|karena|kalau|jika|ketika|sampai|setelah|sesudah|sebelum|lalu|kemudian|juga|hanya|sangat|lebih|paling|bisa|dapat|harus|ingin|suka|tahu|ada|orang|hari|malam|pagi|siang|sore|rumah|sekolah|kerja|bekerja|jalan|lurus|kanan|kiri|belok|terus|besar|kecil|baik|banyak|sedikit|semua|setiap|antara|tentang|sebagai|seperti|namun|tetapi|tapi|supaya|agar|sehingga|oleh|kepada|terhadap|harfiah|permisi|maaf|maafkan|terima|kasih|bentuk|perintah|sopan|urutan|catatan|contoh|latihan|kosakata|arti|artinya|makna|bermakna|kalimat|halaman|bahasa|mana|kemana|dimana|menit|jam|nomor|depan|belakang|naik|turun|ambil|kedua|ketiga|sepuluh|nyasar|kaki|mungkin|menanyakan|memberi|meminta|menyebut|menyatakan|memperkenalkan|perkenalan|petunjuk|arah|sapaan|ucapan|angka|waktu|keluarga|makanan|minuman|belanja|pekerjaan|cuaca|tubuh|transportasi|membaca|menulis|mendengar|berbicara|tata|bunyi|huruf|hafalan|ringkasan|tujuan|target|target)\b/i;

/* Akhiran -nya (haltenya, caranya, artinya) praktis cuma milik bahasa Indonesia
   dan Melayu — satu kata berakhiran itu sudah cukup menandai baris terjemahan
   yang lolos daftar kata di atas ("Di mana haltenya?" pernah lolos persis
   begitu). Sengaja tidak dipakai untuk modul Indonesia/Melayu sendiri. */
const SUFIKS_ID = /\b\p{L}{3,}nya\b/iu;

/** Potongan ini kelihatan bahasa Indonesia (baris terjemahan), bukan bahasa target? */
export function barisTerjemahan(teks: string, kode: string): boolean {
  if (kode === "id" || kode === "ms") return false; // modul BIPA/Melayu: itu justru bahasa targetnya
  return KATA_ID.test(teks) || SUFIKS_ID.test(teks);
}

/* ── pemutaran ─────────────────────────────────────────────────────────────
   SATU elemen Audio dipakai berulang, dan sengaja "dibuka kuncinya" lewat
   ketukan pertama siswa: iOS Safari cuma mengizinkan play() yang lahir dari
   gerakan pengguna, sementara ketukan kata kita selalu melewati setidaknya satu
   await (cache/jaringan). Elemen yang SUDAH pernah bunyi di dalam gesture tetap
   boleh diputar sesudahnya — itulah celah yang dipakai di sini. */
const SENYAP = "data:audio/wav;base64,UklGRmQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

let audio: HTMLAudioElement | null = null;
let seq = 0;

/** Dipanggil dari ketukan pertama di reader — lihat catatan SENYAP di atas. */
export function bukaKunciAudio() {
  if (typeof window === "undefined" || audio) return;
  audio = new Audio(SENYAP);
  audio.volume = 0;
  void audio.play().catch(() => {}).then(() => {
    if (audio) audio.volume = 1;
  });
}

export function hentikanEbookTts() {
  seq++;
  if (audio) { try { audio.pause(); audio.currentTime = 0; } catch { /* diam */ } }
}

function mainkan(url: string) {
  if (!audio) audio = new Audio();
  try { audio.pause(); } catch { /* diam */ }
  audio.volume = 1;
  audio.src = url;
  audio.currentTime = 0;
  void audio.play().catch(() => {});
}

/* ── cache ─────────────────────────────────────────────────────────────────── */
const memori = new Map<string, string>(); // `${kode}|${teks}` → objectURL
const NAMA_CACHE = "linguo-tts-v1";
const alamat = (kode: string, teks: string) => `/__tts/${kode}/${encodeURIComponent(teks)}`;

async function dariCacheTetap(kode: string, teks: string): Promise<Blob | null> {
  try {
    if (typeof caches === "undefined") return null;
    const c = await caches.open(NAMA_CACHE);
    const r = await c.match(alamat(kode, teks));
    return r ? await r.blob() : null;
  } catch {
    return null; // penyimpanan penuh / mode privat — bukan alasan gagal bunyi
  }
}

async function keCacheTetap(kode: string, teks: string, blob: Blob) {
  try {
    if (typeof caches === "undefined") return;
    const c = await caches.open(NAMA_CACHE);
    await c.put(alamat(kode, teks), new Response(blob, { headers: { "Content-Type": "audio/mpeg" } }));
  } catch {
    /* diam */
  }
}

export type HasilUcap = "ok" | "gagal" | "dilewati";

/**
 * Bunyikan potongan teks bahasa target.
 * @returns "dilewati" kalau memang tak layak dibunyikan (bukan galat).
 */
export async function ucapkanEbook(teksMentah: string, kode: string): Promise<HasilUcap> {
  const teks = String(teksMentah || "").trim().slice(0, 400);
  if (!teks || !bisaDibunyikan(kode)) return "dilewati";

  const kunci = `${kode}|${teks}`;
  const ada = memori.get(kunci);
  if (ada) { seq++; mainkan(ada); return "ok"; }

  const saya = ++seq;
  const pasang = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    memori.set(kunci, url);
    if (saya === seq) mainkan(url);
  };

  const tersimpan = await dariCacheTetap(kode, teks);
  if (tersimpan) { pasang(tersimpan); return "ok"; }

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: teks, lang: kode }),
    });
    if (!res.ok) return "gagal";
    const { audioContent } = await res.json();
    if (!audioContent) return "gagal";
    const bytes = Uint8Array.from(atob(audioContent), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: "audio/mpeg" });
    void keCacheTetap(kode, teks, blob);
    pasang(blob);
    return "ok";
  } catch {
    return "gagal";
  }
}
