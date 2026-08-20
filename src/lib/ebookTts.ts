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
const DAFTAR_ID = [
  "yang", "dan", "atau", "dengan", "untuk", "dari", "pada", "dalam", "tidak", "bukan",
  "jangan", "adalah", "akan", "sudah", "belum", "saya", "aku", "kamu", "anda", "dia",
  "mereka", "kita", "ini", "itu", "apa", "apakah", "bagaimana", "mengapa", "kenapa",
  "berapa", "siapa", "kapan", "karena", "kalau", "jika", "ketika", "sampai", "setelah",
  "sesudah", "sebelum", "lalu", "kemudian", "juga", "hanya", "sangat", "lebih", "paling",
  "bisa", "dapat", "harus", "ingin", "suka", "tahu", "ada", "orang", "hari", "malam", "pagi",
  "siang", "sore", "rumah", "sekolah", "kerja", "bekerja", "jalan", "lurus", "kanan", "kiri",
  "belok", "terus", "besar", "kecil", "baik", "banyak", "sedikit", "semua", "setiap",
  "antara", "tentang", "sebagai", "seperti", "namun", "tetapi", "tapi", "supaya", "agar",
  "sehingga", "oleh", "kepada", "terhadap", "harfiah", "permisi", "maaf", "maafkan",
  "terima", "kasih", "bentuk", "perintah", "sopan", "urutan", "catatan", "contoh", "latihan",
  "kosakata", "arti", "artinya", "makna", "bermakna", "kalimat", "halaman", "bahasa", "mana",
  "kemana", "dimana", "menit", "jam", "nomor", "depan", "belakang", "naik", "turun", "ambil",
  "kedua", "ketiga", "sepuluh", "nyasar", "kaki", "mungkin", "menanyakan", "memberi",
  "meminta", "menyebut", "menyatakan", "memperkenalkan", "perkenalan", "petunjuk", "arah",
  "sapaan", "ucapan", "angka", "waktu", "keluarga", "makanan", "minuman", "belanja",
  "pekerjaan", "cuaca", "tubuh", "transportasi", "membaca", "menulis", "mendengar",
  "berbicara", "tata", "bunyi", "huruf", "hafalan", "ringkasan", "tujuan", "target",
];

const KATA_ID = new RegExp(`\\b(${DAFTAR_ID.join("|")})\\b`, "i");
const SET_ID = new Set(DAFTAR_ID);

/* Akhiran -nya (haltenya, caranya, artinya) praktis cuma milik bahasa Indonesia
   dan Melayu — satu kata berakhiran itu sudah cukup menandai baris terjemahan
   yang lolos daftar kata di atas ("Di mana haltenya?" pernah lolos persis
   begitu). Sengaja tidak dipakai untuk modul Indonesia/Melayu sendiri. */
const SUFIKS_ID = /\b\p{L}{3,}nya\b/iu;

/* [ebook-tts-kata-bukan-baris-v1] Penjagaan bahasa Indonesia dinilai PER KATA,
   bukan per baris — inilah yang dulu membungkam hampir seluruh modul.

   Satu potongan teks pdf.js kerap memuat satu BARIS UTUH tabel, dan baris modul
   kita memang dwibahasa dari sananya: "casa (KA-sa) = rumah". Dengan penilaian
   per baris, satu kata "rumah" di ujung kanan cukup untuk membungkam "casa" —
   kata Spanyol yang justru jadi alasan fitur ini ada. Sekarang yang dinilai
   adalah kata yang BENAR-BENAR diketuk. */
export function kataIndonesia(kata: string, kode: string): boolean {
  if (kode === "id" || kode === "ms") return false;
  const k = kata.trim().toLowerCase();
  if (!k) return true;
  return SET_ID.has(k) || SUFIKS_ID.test(k);
}

/* Yang dibuang dari sebuah baris sebelum dibunyikan sebagai kalimat:
   - "(KA-sa)"  → petunjuk cara baca, bukan bagian kalimatnya;
   - "= rumah"  → kolom arti di tabel kosakata;
   - "1." / "•" → nomor & bulir daftar;
   - "harfiah: …" → baris terjemahan harfiah. */
const BUANG_KURUNG = /\([^)]*\)/g;
/** Nomor urut & bulir di kepala baris: "1.", "2)", "–", "•". */
const BUANG_NOMOR = /^\s*(?:\d{1,3}[.):]|[-–—•·*])\s*/u;
/* Nomor baris dialog itu angka TELANJANG ("1 Ana: ¡Hola!") — nomornya duduk di
   kolom terpisah selebar 6 mm, dan jarak sesempit itu tak selalu terbaca
   sebagai batas kolom. Sengaja hanya dibuang kalau yang menyusul memang nama
   penutur (kata berawal huruf besar lalu titik dua), supaya kalimat yang
   sungguh dimulai angka — "24 horas al día" — tidak ikut terpangkas. */
const BUANG_NOMOR_DIALOG = /^\s*\d{1,2}\s+(?=\p{Lu}[\p{L}'’.\-]{0,14}\s*:)/u;
/* Hanya "=" dan "→". Titik dua SENGAJA tidak ikut: baris dialog modul ditulis
   "Ana: Hola, ¿qué tal?" — memenggalnya di titik dua menyisakan nama tokohnya
   saja. Baris "harfiah: …" tetap tersaring oleh penjagaan bahasa Indonesia. */
const PISAH_ARTI = /\s*(?:=|→)\s*/;

/**
 * [ebook-tts-kalimat-v1] Satu baris halaman → kalimat bahasa target yang layak
 * diputar. Kosong = tak ada yang bisa dibunyikan dari baris itu.
 */
export function kalimatTarget(baris: string, kode: string): string {
  let s = String(baris || "")
    .replace(BUANG_KURUNG, " ")
    .replace(BUANG_NOMOR_DIALOG, "")
    .replace(BUANG_NOMOR, "");
  // "casa = rumah" → yang dibunyikan sisi KIRI. Di modul bahasa, sisi kanan
  // "=" praktis selalu kolom arti; kalimat yang benar-benar memuat tanda sama
  // dengan tidak ada di materi A1.
  const bagian = s.split(PISAH_ARTI).map((x) => x.trim()).filter(Boolean);
  if (bagian.length > 1) s = bagian[0];
  s = s.replace(/\s{2,}/g, " ").trim();
  if (s.length < 2) return "";
  if (barisTerjemahan(s, kode)) return "";
  return s.slice(0, 400);
}

/** Potongan ini kelihatan bahasa Indonesia (baris terjemahan), bukan bahasa target? */
export function barisTerjemahan(teks: string, kode: string): boolean {
  if (kode === "id" || kode === "ms") return false; // modul BIPA/Melayu: itu justru bahasa targetnya
  return KATA_ID.test(teks) || SUFIKS_ID.test(teks);
}

/* ── pemutaran ─────────────────────────────────────────────────────────────
   [ebook-tts-data-url-v2] Audionya dipasang sebagai **data: URL**, bukan
   objectURL dari Blob — dan itulah sebabnya versi pertama diam total di Safari
   walau /api/tts membalas 200 dan cache-nya terisi rapi.

   Dua jebakan Safari yang kena sekaligus:
     1. `blob:` di elemen <audio>. Safari memuat media lewat permintaan yang
        mendukung byte-range; sumber blob tak melayani itu, jadi elemennya
        menggantung di readyState 0 — tanpa galat, tanpa bunyi.
     2. `audio.currentTime = 0` tepat setelah `src` diganti. Di WebKit itu
        melempar InvalidStateError selama readyState masih HAVE_NOTHING, dan
        lemparan itu terjadi SEBELUM play() sempat dipanggil.

   Jalur yang dipakai sekarang persis jalur `speakText` Watch and Learn (yang
   memang berbunyi di Safari yang sama): base64 → data: URL → play(). Cache pun
   menyimpan base64, bukan Blob, supaya tak ada objectURL sama sekali.

   SATU elemen Audio dipakai berulang, dan sengaja "dibuka kuncinya" lewat
   ketukan pertama siswa: iOS Safari cuma mengizinkan play() yang lahir dari
   gerakan pengguna, sementara ketukan kata kita selalu melewati setidaknya satu
   await (cache/jaringan). Elemen yang SUDAH pernah bunyi di dalam gesture tetap
   boleh diputar sesudahnya — itulah celah yang dipakai di sini. */
const SENYAP = "data:audio/wav;base64,UklGRmQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

/** Tag BCP-47 untuk suara bawaan browser — jaring terakhir kalau Chirp gagal. */
const SUARA_BROWSER: Record<string, string> = {
  es: "es-ES", fr: "fr-FR", de: "de-DE", it: "it-IT", pt: "pt-PT", nl: "nl-NL",
  ja: "ja-JP", ko: "ko-KR", zh: "zh-CN", ru: "ru-RU", ar: "ar-SA", hi: "hi-IN",
  th: "th-TH", vi: "vi-VN", tr: "tr-TR", en: "en-US", id: "id-ID", ms: "ms-MY",
  da: "da-DK", sv: "sv-SE", no: "nb-NO", fi: "fi-FI", pl: "pl-PL", cs: "cs-CZ",
  el: "el-GR", he: "he-IL", uk: "uk-UA", ro: "ro-RO", hu: "hu-HU",
};

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
  if (audio) { try { audio.pause(); } catch { /* diam */ } }
  if (typeof window !== "undefined") {
    try { window.speechSynthesis?.cancel(); } catch { /* diam */ }
  }
}

/* Suara bawaan browser. Mutunya jauh di bawah Chirp — ini bukan pengganti,
   melainkan supaya ketukan tetap MENGELUARKAN bunyi waktu jalur utamanya
   bermasalah. Diam total tak terbedakan dari tombol rusak. */
function ucapkanBrowser(teks: string, kode: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(teks);
    u.lang = SUARA_BROWSER[kode] ?? SUARA_BROWSER[kode.split("-")[0]] ?? "en-US";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch {
    /* sudah sejauh ini — biarkan diam */
  }
}

async function mainkan(base64: string): Promise<boolean> {
  if (!audio) audio = new Audio();
  try { audio.pause(); } catch { /* diam */ }
  try { window.speechSynthesis?.cancel(); } catch { /* diam */ }
  audio.volume = 1;
  // ⚠️ JANGAN menyetel currentTime di sini — lihat jebakan (2) di atas.
  audio.src = `data:audio/mp3;base64,${base64}`;
  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

/* ── cache ─────────────────────────────────────────────────────────────────── */
const memori = new Map<string, string>(); // `${kode}|${teks}` → base64 mp3
const NAMA_CACHE = "linguo-tts-v1";
const alamat = (kode: string, teks: string) => `/__tts/${kode}/${encodeURIComponent(teks)}`;

async function dariCacheTetap(kode: string, teks: string): Promise<string | null> {
  try {
    if (typeof caches === "undefined") return null;
    const c = await caches.open(NAMA_CACHE);
    const r = await c.match(alamat(kode, teks));
    if (!r) return null;
    const isi = (await r.text()).trim();
    // Entri versi lama menyimpan Blob mp3, bukan base64 — kenali dari isinya
    // (base64 tak pernah memuat karakter di luar abjad base64) lalu buang.
    if (!isi || !/^[A-Za-z0-9+/=\s]+$/.test(isi.slice(0, 64))) {
      await c.delete(alamat(kode, teks)).catch(() => {});
      return null;
    }
    return isi;
  } catch {
    return null; // penyimpanan penuh / mode privat — bukan alasan gagal bunyi
  }
}

async function keCacheTetap(kode: string, teks: string, base64: string) {
  try {
    if (typeof caches === "undefined") return;
    const c = await caches.open(NAMA_CACHE);
    await c.put(alamat(kode, teks), new Response(base64, { headers: { "Content-Type": "text/plain" } }));
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
  const saya = ++seq;
  const putar = async (b64: string) => {
    // Siswa sudah mengetuk kata lain sementara ini menunggu jaringan.
    if (saya !== seq) return "ok" as const;
    if (await mainkan(b64)) return "ok" as const;
    ucapkanBrowser(teks, kode);
    return "gagal" as const;
  };

  const ada = memori.get(kunci);
  if (ada) return putar(ada);

  const tersimpan = await dariCacheTetap(kode, teks);
  if (tersimpan) { memori.set(kunci, tersimpan); return putar(tersimpan); }

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: teks, lang: kode }),
    });
    if (!res.ok) { ucapkanBrowser(teks, kode); return "gagal"; }
    const { audioContent } = await res.json();
    if (!audioContent) { ucapkanBrowser(teks, kode); return "gagal"; }
    memori.set(kunci, audioContent);
    void keCacheTetap(kode, teks, audioContent);
    return putar(audioContent);
  } catch {
    ucapkanBrowser(teks, kode);
    return "gagal";
  }
}
