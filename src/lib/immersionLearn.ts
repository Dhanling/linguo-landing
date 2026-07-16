// Watch & Learn — lapisan "belajar" untuk player: transkrip dwibahasa (subtitle
// bahasa target + terjemahan Indonesia), arti kata yang di-tap, dan analisa
// kalimat (kelas kata). Semua jalan lewat Edge Function di project Supabase yang
// sama dengan app mobile (yt-transcript & word-info) — anon key aman di client.

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jbtgciepdmqxxcjflrxz.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Terjemahan/penjelasan DEFAULT dalam bahasa pengguna Linguo (Indonesia). Ini juga
// bahasa `base` yang disimpan di cache transkrip server. Pengguna bisa memilih bahasa
// terjemahan lain (lihat BASE_LANGS) → baris `target` diterjemah ulang di klien.
const EXPLANATION_LANGUAGE = "Bahasa Indonesia";

// ── Bahasa terjemahan ("kamu bicara bahasa apa?") ────────────────────────────
// Bahasa yang dipakai untuk baris terjemahan di bawah subtitle. Default Indonesia
// (sesuai cache server); pilihan lain: Inggris + 5 bahasa resmi PBB lainnya. `name`
// = nama Inggris yang ditaruh ke prompt AI (explanationLanguage). `country` untuk
// bendera. Aksara kanan-ke-kiri (Arab) ditangani lewat isRtl(code).
export interface BaseLang {
  code: string;
  label: string; // ditulis dalam bahasa itu sendiri
  english: string; // nama Inggris (subjudul di picker)
  name: string; // dikirim ke AI sebagai explanationLanguage
  country: string; // untuk RectFlag
}

export const BASE_LANGS: BaseLang[] = [
  { code: "id", label: "Bahasa Indonesia", english: "Indonesian", name: "Bahasa Indonesia", country: "ID" },
  { code: "en", label: "English", english: "English", name: "English", country: "GB" },
  { code: "ar", label: "العربية", english: "Arabic", name: "Arabic", country: "SA" },
  { code: "zh", label: "中文", english: "Chinese", name: "Chinese (Simplified)", country: "CN" },
  { code: "fr", label: "Français", english: "French", name: "French", country: "FR" },
  { code: "ru", label: "Русский", english: "Russian", name: "Russian", country: "RU" },
  { code: "es", label: "Español", english: "Spanish", name: "Spanish", country: "ES" },
];

export const DEFAULT_BASE_LANG = "id";

const BASE_PREF_KEY = "linguo:watch:base:v1";

export function getBaseLangDef(code: string): BaseLang {
  return BASE_LANGS.find((b) => b.code === code) ?? BASE_LANGS[0];
}

/** Bahasa terjemahan tersimpan, atau null kalau belum pernah dipilih (→ tanya). */
export function getStoredBaseLang(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(BASE_PREF_KEY);
    return v && BASE_LANGS.some((b) => b.code === v) ? v : null;
  } catch {
    return null;
  }
}

export function storeBaseLang(code: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BASE_PREF_KEY, code);
  } catch {
    /* abaikan */
  }
}

// Edge Function word-info menaruh nama bahasa langsung ke prompt ("You are a
// concise Spanish tutor…"), jadi ia butuh nama Inggris — bukan label Indonesia.
const ENGLISH_NAME: Record<string, string> = {
  en: "English", ja: "Japanese", ko: "Korean", zh: "Chinese", es: "Spanish",
  fr: "French", de: "German", it: "Italian", pt: "Portuguese", nl: "Dutch",
  ru: "Russian", ar: "Arabic", tr: "Turkish", th: "Thai", vi: "Vietnamese",
  hi: "Hindi", he: "Hebrew", fa: "Persian", el: "Greek", ka: "Georgian",
  sv: "Swedish", no: "Norwegian", da: "Danish", fi: "Finnish", pl: "Polish",
  cs: "Czech", hu: "Hungarian", ro: "Romanian", bg: "Bulgarian", uk: "Ukrainian",
  is: "Icelandic", id: "Indonesian", jv: "Javanese", su: "Sundanese",
  fil: "Filipino", km: "Khmer", lo: "Lao", my: "Burmese", ur: "Urdu",
  sw: "Swahili", am: "Amharic", hy: "Armenian",
};

// Bahasa beraksara non-Latin — pemicu transliterasi (romaji/pinyin/dll).
const NON_LATIN = new Set([
  "ja", "ko", "zh", "ar", "ru", "hi", "th", "he", "fa", "el", "ka", "bg", "uk",
  "km", "lo", "my", "ur", "am", "hy",
]);

export function isNonLatin(code: string): boolean {
  // Varian regional (mis. "ar-EG") → cek base code juga biar transliterasi tetap
  // dipicu untuk semua dialek Arab dsb.
  return NON_LATIN.has(code) || NON_LATIN.has(code.split("-")[0]);
}

// Bahasa beraksara kanan-ke-kiri (Arab, Ibrani, Persia, Urdu, dll). Subtitle
// bahasa target untuk bahasa-bahasa ini WAJIB dirender dir="rtl" biar tanda baca
// & urutan kata benar. Transliterasi (Latin) & terjemahan Indonesia tetap LTR.
const RTL = new Set(["ar", "he", "fa", "ur", "ps", "sd", "ug", "ckb", "yi", "dv"]);

export function isRtl(code: string): boolean {
  return RTL.has((code || "").split("-")[0]);
}

// Tag BCP-47 untuk Web Speech API (tombol dengar di tooltip).
export const SPEECH_LANG: Record<string, string> = {
  en: "en-US", ja: "ja-JP", ko: "ko-KR", zh: "zh-CN", es: "es-ES", fr: "fr-FR",
  de: "de-DE", it: "it-IT", pt: "pt-PT", "pt-BR": "pt-BR", "pt-PT": "pt-PT", nl: "nl-NL", ru: "ru-RU", ar: "ar-SA",
  tr: "tr-TR", th: "th-TH", vi: "vi-VN", hi: "hi-IN", he: "he-IL", fa: "fa-IR",
  el: "el-GR", ka: "ka-GE", sv: "sv-SE", no: "nb-NO", da: "da-DK", fi: "fi-FI",
  pl: "pl-PL", cs: "cs-CZ", hu: "hu-HU", ro: "ro-RO", bg: "bg-BG", uk: "uk-UA",
  is: "is-IS", id: "id-ID", jv: "id-ID", su: "id-ID", fil: "fil-PH", km: "km-KH",
  lo: "lo-LA", my: "my-MM", ur: "ur-PK", sw: "sw-KE", am: "am-ET", hy: "hy-AM",
};

// ── TTS bersama (Chirp 3 HD lewat /api/tts, fallback Web Speech) ─────────────
// Dipakai tooltip kata & flashcard. Satu elemen audio dipakai ulang biar bisa
// dibatalkan saat suara baru diminta (tak numpuk).
let ttsAudio: HTMLAudioElement | null = null;

function speakBrowser(text: string, langCode: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = SPEECH_LANG[langCode] ?? SPEECH_LANG[langCode.split("-")[0]] ?? "en-US";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch {
    /* best-effort */
  }
}

// [wl-tts-cache-v1] Cache audio TTS: sekali sebuah (teks, bahasa) di-generate,
// klik berikutnya pakai audio yang sama — hemat kuota Google TTS. Dua lapis:
//   1. Map in-memory (tercepat, per page-load, dibatasi TTS_MEM_MAX entri)
//   2. Cache API browser (persist antar reload/halaman, best-effort)
// Request in-flight juga di-dedupe biar klik ganda cepat tak memicu dua fetch.
const TTS_MEM_MAX = 60;
const ttsMem = new Map<string, string>();
const ttsInflight = new Map<string, Promise<string>>();

function ttsRemember(key: string, b64: string) {
  ttsMem.delete(key);
  ttsMem.set(key, b64); // re-insert → jadi entri termuda (Map jaga urutan insert)
  while (ttsMem.size > TTS_MEM_MAX) {
    const tertua = ttsMem.keys().next().value;
    if (tertua === undefined) break;
    ttsMem.delete(tertua);
  }
}

async function ttsCacheStore(): Promise<Cache | null> {
  try {
    if (typeof caches === "undefined") return null;
    return await caches.open("wl-tts-v1");
  } catch {
    return null; // mis. private mode / konteks non-secure
  }
}

// URL sintetis sebagai kunci Cache API (POST tak bisa di-cache, jadi kunci GET buatan)
function ttsCacheKey(text: string, langCode: string): string {
  return `/api/tts?wl-cache=1&lang=${encodeURIComponent(langCode)}&text=${encodeURIComponent(text)}`;
}

async function fetchTtsAudio(text: string, langCode: string): Promise<string> {
  const key = `${langCode}|${text}`;
  const hit = ttsMem.get(key);
  if (hit) return hit;
  const inflight = ttsInflight.get(key);
  if (inflight) return inflight;
  const p = (async () => {
    const store = await ttsCacheStore();
    if (store) {
      const cached = await store.match(ttsCacheKey(text, langCode)).catch(() => undefined);
      if (cached) {
        const b64 = await cached.text();
        if (b64) {
          ttsRemember(key, b64);
          return b64;
        }
      }
    }
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang: langCode }),
    });
    if (!res.ok) throw new Error(`tts ${res.status}`);
    const data = (await res.json()) as { audioContent?: string };
    if (!data.audioContent) throw new Error("no audio");
    ttsRemember(key, data.audioContent);
    if (store) {
      await store.put(ttsCacheKey(text, langCode), new Response(data.audioContent)).catch(() => {});
    }
    return data.audioContent;
  })();
  ttsInflight.set(key, p);
  try {
    return await p;
  } finally {
    ttsInflight.delete(key);
  }
}

export async function speakText(text: string, langCode: string) {
  if (typeof window === "undefined") return;
  try {
    ttsAudio?.pause();
    window.speechSynthesis?.cancel();
    const audioContent = await fetchTtsAudio(text, langCode);
    if (!ttsAudio) ttsAudio = new Audio();
    ttsAudio.src = `data:audio/mp3;base64,${audioContent}`;
    await ttsAudio.play();
  } catch {
    speakBrowser(text, langCode); // best-effort fallback
  }
}

// ── Transkrip ────────────────────────────────────────────────────────────────

/**
 * Satu baris subtitle bertimestamp. `target` = kalimat bahasa yang dipelajari
 * (kata-katanya bisa di-tap), `base` = terjemahan Indonesia (ditampilkan emas).
 */
export interface LearnCue {
  start: number;
  end: number;
  target: string;
  base: string;
  translit?: string;
  // Analisa kalimat (kelas kata + arti per kata) yang sudah di-precompute &
  // disimpan bareng transkrip → mode Analisa instan tanpa loading. Diisi oleh
  // prewarmBreakdowns() (klien) lalu di-persist ke yt_transcripts.cues[].breakdown.
  breakdown?: SentenceBreakdown;
}

/** Kenapa transkrip kosong — buat pesan yang ramah. `not_ready` = belum ada di
 *  cache (transkripsi kini server-side via kurasi/antrian, bukan on-the-fly). */
export type TranscriptReason = "no_captions" | "empty" | "error" | "ok" | "not_ready";

export interface TranscriptResult {
  cues: LearnCue[];
  reason: TranscriptReason;
}

interface RawCue {
  start: number;
  end: number;
  target: string;
}

// fetch dengan timeout — jalur transkrip best-effort, jangan sampai menggantung
// UI selamanya kalau server/edge function hang (mis. ASR yang tak pernah balas).
async function fetchTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ── Cache transkrip (Supabase lewat /api/yt-transcript-cache) ────────────────
// Sekali sebuah (video, bahasa) diproses, hasilnya disimpan → viewer berikutnya
// baca instan (tak perlu fetch caption / ASR ~1 menit lagi). Best-effort: kalau
// cache mati, pipeline biasa tetap jalan.
async function readTranscriptCache(videoId: string, langCode: string): Promise<LearnCue[] | null> {
  try {
    const res = await fetchTimeout(
      // `v=15` = pemecah cache CDN (s-maxage 24 jam): tanpa bump ini, edge CDN
      // masih menyajikan versi lama sampai sehari.
      // (v=20 fix video "Easy Finnish" kotityöt tACeFtUkm0E: caption creator DWIBAHASA
      // (Finnish/ gloss Inggris) → target & terjemahan tercemar teks Inggris + section
      // paragraf raksasa. Sumber caption memang bilingual (bukan echo model), jadi
      // di-bersihkan sekali via Gemini: buang gloss Inggris, sisakan Finnish +
      // tanda baca, terjemahan ID — timestamp caption asli dipertahankan (timing benar
      // + cakupan penuh). Juga: kata sambung FINLANDIA (ja/mutta/koska/…) ditambah ke
      // pemecah klausa + prompt yt-asr kini larang baca teks tertanam di layar.)
      // Di-bump dari v=14 setelah
      // re-transcribe Peppa Bulgaria ls64k49ueuA: cache lama = window caption TANPA
      // tanda baca (restorePunctuation diam-diam gagal karena Groq 429 tanpa retry)
      // → satu section mencampur beberapa kalimat & PEMBICARA + karaoke meleset.
      // Fix: groqPunctuate kini retry 429/5xx (worker) → transkrip di-restore jadi
      // 1 kalimat/1 pembicara per section; klien interpTime menyandarkan waktu
      // potongan ke batas window ASLI (anchor) biar sorotan menempel ke audio.
      // (v=19 fix AKAR echo prompt kode-mentah: transcript-worker prompt penerjemah
      // dulu pakai KODE bahasa ("FI") → gpt-oss meng-echo teks sumber (Finnish balik
      // Finnish) → base=target tersimpan TANPA flag `pending` → self-heal buta. Fix
      // worker: LANG_NAMES (nama penuh "Finnish") + penjaga isSourceEcho + retranslate
      // pindai semua baris. Sweep backlog 81 video / 25 bahasa (hu/da/es/pt/en/pl/…,
      // ~3,5rb baris) diterjemah via Mode A yt-transcript (Anthropic) + PATCH; sisa
      // echo cuma lirik/nama diri;
      // v=18 backfill massal 25 video `pending` (base=bahasa asli muncul sbg
      // terjemahan, regres Groq 429) — 15 video Inggris (A1 Cooking uVGV8LG3HHM
      // yang dilaporkan + A1 Supermarket/Language Learning, "Learn English With
      // Words…", English Conversation/Restaurant, Daily Routine, 6 Minute English,
      // Bluey/Peppa, lagu) + 10 non-Inggris (de/fil/he/hi/ka/tr/vi) → diterjemah
      // via Mode A yt-transcript (Anthropic, bukan Groq) + PATCH service_role →
      // base ID; sisa `pending` cuma nama/interjeksi ("Mr.", "Hmm.", [Music]);
      // v=17 backfill ulang kartun Peppa Bulgaria ls64k49ueuA "Kukleniyat
      // teatar na Kloi": 48/48 cue `pending` (base=Bulgaria muncul sbg terjemahan,
      // regres Groq 429) → diterjemah + PATCH service_role → base ID;
      // v=16 [watch-tagalog-conjunctions]: kata sambung Tagalog (fil/tl:
      // at/o/ngunit/kaya/dahil/…) ditambah ke pemecah klausa transcript-worker →
      // kalimat Tagalog panjang tak lagi jadi section raksasa; backfill lagu anak
      // "Tatlong Bibe" lJCSu8RmSjE: reproses (35→58 section) + 58 cue diterjemah ID;
      // v=15 (lihat bawah);
      // v=14 backfill vlog/kartun Hindi gHB-EcsWhgo (Bluey "The Beach"): 56/76 cue
      // `pending` (base=Hindi) → diterjemah + PATCH service_role → base ID;
      // v=13 backfill vlog Peppa Bulgaria ls64k49ueuA (89 section);
      // v=12 backfill vlog Hindi qK0wnEnaNE0 Jason Vlogs;
      // v=11 [watch-base-driven-split]: target auto-caption TANPA tanda baca (mis.
      // vlog Hindi) tak lagi jadi paragraf raksasa — dipecah per KALIMAT/KLAUSA base
      // (terjemahan Indonesia) dgn target proporsional + kata sambung Hindi/non-Latin;
      // v=10 backfill 2 video Swedia; v=9 pemecah KLAUSA di transcript-worker;
      // v=8 restorasi tanda baca caption auto; v=7 [watch-pair-safe-v1] split kalimat
      // hanya saat jumlah target == base; v=6 vlog Spanyol gpFqVxLDEJ0; v=5 vlog
      // Persia 3WMSN12Q598; v=4 vlog Hindi G-dcJA_lA0g; v=3 cues SATU KALIMAT UTUH;
      // v=2 untuk `translit`.)
      `/api/yt-transcript-cache?videoId=${encodeURIComponent(videoId)}&lang=${encodeURIComponent(langCode)}&v=20`,
      { method: "GET" },
      6000
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { cues?: unknown };
    const cues = Array.isArray(data.cues)
      ? (data.cues as LearnCue[]).filter(
          (c) => c && typeof c.start === "number" && typeof c.target === "string" && c.target.length > 0
        )
      : [];
    return cues.length ? cues : null;
  } catch {
    return null;
  }
}

/** Metadata ringan video buat kartu tab "Siap" (disimpan bareng transkrip). */
export interface TranscriptVideoMeta {
  title?: string;
  channel?: string | null;
  duration?: number | null;
}

function saveTranscriptCache(
  videoId: string,
  langCode: string,
  cues: LearnCue[],
  source: "caption" | "asr",
  meta?: TranscriptVideoMeta
): void {
  // Fire-and-forget — jangan menahan render; kegagalan simpan tak masalah.
  try {
    void fetch("/api/yt-transcript-cache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId,
        lang: langCode,
        cues,
        source,
        title: meta?.title,
        channel: meta?.channel,
        dur: meta?.duration,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* abaikan */
  }
}

/**
 * Isi metadata (title/channel/dur) untuk transkrip yang SUDAH ada di cache tapi
 * belum punya metadata (baris lama) — biar video ikut muncul di tab "Siap".
 * Fire-and-forget; hanya menyentuh baris yang title-nya masih kosong.
 */
function backfillTranscriptMeta(videoId: string, langCode: string, meta: TranscriptVideoMeta): void {
  if (!meta.title) return;
  try {
    void fetch("/api/yt-transcript-cache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metaOnly: true,
        videoId,
        lang: langCode,
        title: meta.title,
        channel: meta.channel,
        dur: meta.duration,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* abaikan */
  }
}

// Ambil + parse caption dari route Next `/api/yt-transcript` (server Next fetch
// InnerTube; IP Vercel tak seketat Deno/Supabase + browser tak bisa fetch caption
// langsung karena CORS). Balikin cue mentah (belum diterjemah) + kode bahasa track.
async function fetchRawCuesFromServer(
  videoId: string,
  langCode: string
): Promise<{ cues: RawCue[]; trackLang: string; reason: string }> {
  try {
    const res = await fetchTimeout("/api/yt-transcript", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Katalog sudah dibias ke bahasa target, jadi WAJIB caption di bahasa itu.
      // Kalau tak ada, JANGAN ambil track bahasa lain (dulu `allowForeign: true`
      // bikin video Spanyol tanpa caption Spanyol malah nampilkan track Hungaria) —
      // biarkan null supaya jatuh ke ASR yang mentranskrip audio di bahasa target.
      body: JSON.stringify({ videoId, language: langCode, allowForeign: false }),
    }, 25000);
    if (!res.ok) return { cues: [], trackLang: "", reason: "error" };
    const data = (await res.json()) as { cues?: RawCue[]; trackLang?: string; reason?: string };
    const cues = Array.isArray(data.cues)
      ? data.cues.filter(
          (c) => c && typeof c.start === "number" && typeof c.target === "string" && c.target.length > 0
        )
      : [];
    return { cues, trackLang: data.trackLang ?? "", reason: data.reason ?? "ok" };
  } catch {
    return { cues: [], trackLang: "", reason: "error" };
  }
}

// Terjemahkan cue mentah ke Indonesia lewat Edge Function `yt-transcript` mode
// translate-only (Mode A) — reuse infra AI yang sama dengan app. Kalau terjemahan
// gagal, balikin cue tanpa `base` (target tetap bisa di-tap).
async function translateCues(
  cues: RawCue[],
  trackLang: string,
  langCode: string
): Promise<LearnCue[]> {
  const fallback = cues.map((c) => ({ ...c, base: "" }));
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return fallback;
  try {
    const res = await fetchTimeout(`${SUPABASE_URL}/functions/v1/yt-transcript`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        cues,
        trackLang: trackLang || langCode,
        language: langCode,
        explanationLanguage: EXPLANATION_LANGUAGE,
      }),
    }, 45000);
    if (!res.ok) return fallback;
    const data = (await res.json()) as { cues?: LearnCue[] };
    const out = Array.isArray(data.cues)
      ? data.cues.filter(
          (c) => c && typeof c.start === "number" && typeof c.target === "string" && c.target.length > 0
        )
      : [];
    return out.length ? out : fallback;
  } catch {
    return fallback;
  }
}

// ── Terjemahan ulang ke bahasa pengguna (selain Indonesia) ───────────────────
// Cache server menyimpan `base` dalam Bahasa Indonesia. Kalau pengguna memilih
// bahasa terjemahan lain (English/PBB), kita terjemahkan ULANG baris `target`
// (bahasa asli video) ke bahasa itu lewat yt-transcript mode translate-only, lalu
// simpan hasilnya di localStorage per (bahasa, video) — buka lagi = instan.
const BASE_CACHE_PREFIX = "linguo:watch:basecues:bv1";
const baseCacheKey = (base: string, lang: string, videoId: string) =>
  `${BASE_CACHE_PREFIX}:${base}:${lang}:${videoId}`;

function readBaseCache(base: string, lang: string, videoId: string, n: number): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(baseCacheKey(base, lang, videoId));
    if (!raw) return null;
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) && arr.length === n ? arr.map((x) => String(x)) : null;
  } catch {
    return null;
  }
}

function writeBaseCache(base: string, lang: string, videoId: string, bases: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(baseCacheKey(base, lang, videoId), JSON.stringify(bases));
  } catch {
    /* kuota localStorage penuh — abaikan, cuma kehilangan cache */
  }
}

/**
 * Terjemahkan baris `target` cue ke bahasa terjemahan pilihan pengguna (mis.
 * English, Arab). Untuk Indonesia (default) langsung pakai `base` bawaan cache.
 * Balikin array `base` selaras urutan `cues`, atau null saat gagal — pemanggil
 * sebaiknya menyembunyikan terjemahan (jangan tampilkan Indonesia ke penutur lain).
 */
export async function translateCuesToBase(
  videoId: string,
  langCode: string,
  baseCode: string,
  cues: LearnCue[]
): Promise<string[] | null> {
  if (!cues.length) return [];
  if (baseCode === DEFAULT_BASE_LANG) return cues.map((c) => c.base);

  const cached = readBaseCache(baseCode, langCode, videoId, cues.length);
  if (cached) return cached;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const into = getBaseLangDef(baseCode).name;
  try {
    const res = await fetchTimeout(
      `${SUPABASE_URL}/functions/v1/yt-transcript`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          cues: cues.map((c) => ({ start: c.start, end: c.end, target: c.target })),
          trackLang: langCode,
          language: langCode,
          explanationLanguage: into,
        }),
      },
      60000
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { cues?: { base?: string }[] };
    const out = Array.isArray(data.cues) ? data.cues : [];
    // Mode translate-only mempertahankan urutan & jumlah cue (hanya buang target
    // kosong — cue kita sudah tersaring). Beda jumlah = anggap gagal biar tak salah-selaras.
    if (out.length !== cues.length) return null;
    const bases = out.map((c) => (typeof c.base === "string" ? c.base : ""));
    if (!bases.some((b) => b.trim())) return null;
    writeBaseCache(baseCode, langCode, videoId, bases);
    return bases;
  } catch {
    return null;
  }
}

// Transkrip AI: transkripsi audio video pakai Edge Function `yt-asr` (Gemini) —
// dipakai saat caption tak bisa diambil (IP datacenter Vercel/Supabase diblokir
// YouTube untuk endpoint caption, TAPI CDN audio tidak). Lambat (~1 menit) tapi
// jalan universal + langsung diterjemah ke Indonesia. Best-effort → [] saat gagal.
async function fetchAsrTranscript(
  videoId: string,
  langCode: string
): Promise<LearnCue[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  try {
    // ASR (Gemini transkripsi audio) lambat (~1 menit) — beri jendela lebar tapi
    // TETAP terbatas biar tak menggantung "loading" selamanya kalau edge fn hang.
    const res = await fetchTimeout(`${SUPABASE_URL}/functions/v1/yt-asr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        videoId,
        language: langCode,
        explanationLanguage: EXPLANATION_LANGUAGE,
      }),
    }, 120000);
    if (!res.ok) return [];
    const data = (await res.json()) as { cues?: LearnCue[] };
    return Array.isArray(data.cues)
      ? data.cues.filter(
          (c) =>
            c &&
            typeof c.start === "number" &&
            typeof c.end === "number" &&
            typeof c.target === "string" &&
            c.target.length > 0
        )
      : [];
  } catch {
    return [];
  }
}

// ── Pecah per kalimat ────────────────────────────────────────────────────────
// Cue dari caption/ASR sering menggabung beberapa kalimat jadi satu baris panjang.
// Kita pecah tiap cue jadi satu-kalimat-per-baris biar transkrip rapi & fokus.

/** Pisah teks jadi kalimat. Pakai Intl.Segmenter (paham banyak bahasa), fallback regex. */
function splitSentences(text: string, locale?: string): string[] {
  const t = text.trim();
  if (!t) return [];
  try {
    const Seg = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
    if (Seg) {
      const seg = new Seg(locale, { granularity: "sentence" });
      const parts = Array.from(seg.segment(t), (s) => s.segment.trim()).filter(Boolean);
      if (parts.length) return parts;
    }
  } catch {
    /* fallback regex */
  }
  return t.match(/[^.!?…।。！？؟۔]+[.!?…।。！？؟۔]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [t];
}

// [watch-karaoke-anchor-v1] Cue yang digabung dari BEBERAPA window caption
// (mergeCueFragments) membawa "anchor" waktu: pasangan [offset-karakter, detik]
// di tiap batas window ASLI YouTube. Saat cue itu dipecah ulang, waktu tiap
// potongan TAK lagi ditebak rata per-karakter (yang bikin sorotan karaoke meleset
// dari audio saat satu potongan menyeberang batas window), melainkan diinterpolasi
// terhadap batas window ASLI — sorotan menempel ke timing sebenarnya. Cue window
// tunggal (tanpa anchor) tetap pakai perkiraan linear seperti sebelumnya.
type TimedCue = LearnCue & { _anc?: Array<[number, number]> };

/** Detik untuk offset-karakter `chars` di dalam cue, snap ke batas window asli bila ada. */
function interpTime(cue: LearnCue, chars: number, total: number): number {
  const { start, end } = cue;
  const frac = total > 0 ? Math.max(0, Math.min(1, chars / total)) : 0;
  const anc = (cue as TimedCue)._anc;
  if (!anc || !anc.length) return start + (end - start) * frac;
  // Titik kontrol (fraksi-karakter → detik): awal, tiap anchor window, lalu akhir.
  const pts: Array<[number, number]> = [
    [0, start],
    ...anc.map(([c, t]) => [Math.max(0, Math.min(1, c / total)), t] as [number, number]),
    [1, end],
  ];
  for (let i = 1; i < pts.length; i++) {
    const [f0, t0] = pts[i - 1];
    const [f1, t1] = pts[i];
    if (frac >= f0 && frac <= f1) return f1 <= f0 ? t0 : t0 + (t1 - t0) * ((frac - f0) / (f1 - f0));
  }
  return end;
}

/**
 * Pecah satu cue jadi beberapa cue SATU-KALIMAT — target "1 baris = 1 kalimat".
 *
 * Masalah: target hasil auto-caption / ASR (mis. Arab dialek, Jepang) sering datang
 * TANPA tanda baca akhir kalimat, jadi kalau kita cuma andalkan tanda baca target,
 * satu blob banyak kalimat tak bisa dipecah → section jadi paragraf panjang.
 * Tapi transliterasi & terjemahan (dibuat LLM) MEMBUBUHKAN tanda baca kalimat.
 *
 * Jadi: jumlah kalimat `n` diambil dari sinyal TERBANYAK yang tersedia (target /
 * base / translit). Tiap field yang tanda bacanya sendiri sudah pas jadi `n`
 * kalimat dipakai apa adanya (paling akurat); yang tidak (mis. target tanpa tanda
 * baca) dibagi proporsional di batas KATA jadi `n` potongan. Transliterasi seurutan
 * dengan target (romanisasi kata-per-kata), jadi pembagian proporsional target
 * mengikuti batas kalimat translit dengan wajar — bukan tebakan buta.
 */
function splitCueBySentence(cue: LearnCue): LearnCue[] {
  const targets = splitSentences(cue.target);
  const bases = cue.base ? splitSentences(cue.base) : null;
  const translits = cue.translit ? splitSentences(cue.translit) : null;

  // [watch-pair-safe-v1] Section = satu kalimat, TAPI pecah HANYA kalau target, base,
  // & translit SAMA-SAMA terpecah jadi jumlah kalimat yang sama → pasangan 1:1
  // tepercaya (target[i] ↔ base[i]). Dulu jumlah kalimat `n` diambil dari base lalu
  // target dibagi rata PER-KATA untuk menyamakannya — itu akar "subtitle tak sinkron
  // dengan terjemahan": batas kalimat base (Indonesia bertanda baca) hampir tak
  // pernah jatuh di titik yang sama dengan potongan-kata target (mis. Spanyol ASR
  // tanpa tanda baca), jadi base[i] berakhir jadi arti target[i-1] — geser satu baris.
  // Kalau jumlahnya BEDA, biarkan cue UTUH: satu baris memang lebih panjang tapi
  // target↔arti PAS. Itulah syarat hover-sync (underline arti muncul di section yang
  // SAMA saat kata target di-hover). Perapian panjang yang tetap aman (pecah di batas
  // tanda baca hanya saat jumlah penggal target==base) dikerjakan splitLongCue berikutnya.
  const n = targets.length;
  if (n <= 1) {
    // [watch-base-driven-split] Target satu blob TANPA tanda baca (auto-caption
    // Hindi/Arab dll yang belum di-restore) → tak bisa dipecah dari sinyalnya
    // sendiri. Tapi kalau base (terjemahan) banyak kalimat, pecah per kalimat
    // base + target proporsional biar tak jadi paragraf raksasa (approx, lihat
    // splitByBasePieces). Jalur pasangan-aman di bawah TIDAK berubah.
    if (bases && bases.length > 1) return splitByBasePieces(cue, bases);
    return [cue];
  }
  if (bases && bases.length !== n) return [cue];
  if (translits && translits.length !== n) return [cue];

  const tgt = targets;
  const bas = bases;
  const tr = translits;

  const total = tgt.reduce((sum, s) => sum + s.length, 0) || 1;
  let acc = 0;
  return tgt.map((tg, i) => {
    const start = interpTime(cue, acc, total);
    acc += tg.length;
    const end = i === tgt.length - 1 ? cue.end : interpTime(cue, acc, total);
    return {
      start,
      end: Math.max(end, start + 0.3),
      target: tg,
      base: bas ? bas[i] ?? "" : "",
      ...(tr ? { translit: tr[i] ?? "" } : {}),
    };
  });
}

// Panjang maksimum satu section transkrip (≈ satu baris di panel). Kalimat yang
// lebih panjang dipecah lagi di batas klausa biar tiap section ringkas & tak
// overwhelming — bukan blok paragraf. ~50 karakter menjaga satu section tetap
// muat satu baris pada lebar panel transkrip (target "1 kalimat / 1 baris").
const MAX_CUE_CHARS = 50;

// Kata sambung lintas-bahasa (fokus katalog: EN/ES/ID/FR/DE/PT/IT). Dipakai jadi
// titik pisah klausa TAMBAHAN untuk transkrip tanpa tanda baca (ASR/auto-caption),
// biar kalimat panjang tetap terpecah jadi section 1–2 baris. Pisah terjadi
// SEBELUM kata sambung (ia memimpin klausa berikutnya, mis. "…crezcan | ya los
// conozco | porque…"). Klausa pendek digabung lagi ke ≤ MAX_CUE_CHARS di
// splitLongCue, jadi tak jadi remah.
const CLAUSE_CONJUNCTIONS = [
  // Indonesia
  "dan", "tetapi", "tapi", "namun", "atau", "karena", "sehingga", "sedangkan",
  "meskipun", "walaupun", "supaya", "agar", "ketika", "sementara", "yang",
  // English
  "and", "but", "or", "because", "although", "though", "while", "however",
  "therefore", "since", "when", "which", "that", "who",
  // Spanish
  "pero", "porque", "aunque", "mientras", "sino", "pues", "cuando", "que",
  "quien", "donde", "ya",
  // French
  "et", "mais", "car", "parce", "tandis", "qui", "quand", "lorsque", "donc", "puisque",
  // German
  "und", "aber", "oder", "weil", "obwohl", "während", "dass", "wenn", "denn", "sondern",
  // Portuguese / Italian
  "embora", "enquanto", "porém", "perché", "benché", "mentre", "poiché", "quindi",
  // Finnish (ja=dan, sekä=serta, tai/vai=atau, mutta/vaan=tetapi, koska/sillä=karena,
  // että=bahwa, kun=ketika, jos=jika, vaikka=meskipun, joten=jadi, jotta=supaya,
  // joka/mikä=yang) — video "Easy Finnish" sering ASR tanpa tanda baca, jadi kata
  // sambung ini yang memecah kalimat panjang jadi 1 klausa/section.
  "ja", "sekä", "tai", "vai", "mutta", "vaan", "koska", "sillä", "että", "kun",
  "jos", "vaikka", "joten", "jotta", "joka", "mikä", "kunnes",
  // Hindi (Devanagari — batas kata \b ASCII tak berlaku, dipakai lookahead spasi)
  "और", "लेकिन", "पर", "परन्तु", "या", "क्योंकि", "तो", "फिर", "तथा", "कि", "जब", "अगर", "जबकि",
  // Bulgaria/Slavia Sirilik (и=dan, а/но=tapi, или=atau, защото=karena, макар=meskipun,
  // докато=sementara, когато=ketika) — caption Cyrillic dari ASR sering tanpa tanda baca,
  // jadi kata sambung ini yang memecah kalimat panjang jadi 1 klausa/section.
  "и", "а", "но", "или", "защото", "понеже", "макар", "докато", "когато", "затова", "тогава", "после",
];
// Pisah di spasi yang MENDAHULUI kata sambung. Batas sesudah kata sambung ditandai
// spasi/tanda baca/akhir teks (BUKAN \b yang cuma ASCII → gagal utk Devanagari/Arab).
const CONJ_SPLIT_RE = new RegExp(
  `\\s+(?=(?:${CLAUSE_CONJUNCTIONS.join("|")})(?:\\s|[.,;:!?،؛।]|$))`,
  "iu"
);

/**
 * Pisah teks jadi klausa: pertama di batas tanda baca (termasuk non-Latin ، ؛ 、
 * ， ；), lalu tiap penggal dipecah lagi di batas KATA SAMBUNG. Pemecahan kata
 * sambung inilah yang menyelamatkan transkrip ASR tanpa tanda baca — tanpa itu
 * satu kalimat panjang tak punya titik potong sama sekali (delimiter ikut klausa
 * sebelumnya; kata sambung memimpin klausa berikutnya).
 */
function splitClauses(text: string): string[] {
  const out: string[] = [];
  for (const seg of splitByPunct(text)) {
    for (const piece of seg.split(CONJ_SPLIT_RE)) {
      const t = piece.trim();
      if (t) out.push(t);
    }
  }
  return out.length ? out : [text.trim()];
}

/**
 * Pisah teks HANYA di batas tanda baca (koma/titik-koma/titik-dua + non-Latin
 * ، ؛ 、 ， ；). Beda dari splitClauses: TIDAK memecah di kata sambung. Batas tanda
 * baca dipertahankan penerjemah, jadi korespondensinya terjaga lintas bahasa —
 * ini yang dipakai memasangkan terjemahan ke target (lihat splitLongCue). Batas
 * kata sambung sebaliknya spesifik-bahasa (Spanyol "Aunque"/"ya" memecah, Indonesia
 * tidak) → memasangkan di sana bikin arti salah geser.
 */
function splitByPunct(text: string): string[] {
  return (
    text.match(/[^,;:—–،؛、，；]+[,;:—–،؛、，；]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text.trim()]
  );
}

/**
 * Bagi durasi cue ke tiap grup teks (berbobot panjang target) lalu bentuk sub-cue.
 * base/translit sudah dipasangkan seiring indeks target oleh pemanggil.
 */
function spreadOverGroups(
  cue: LearnCue,
  targetGroups: string[],
  baseGroups: string[] | null,
  translitGroups: string[] | null
): LearnCue[] {
  const weights = targetGroups.map((s) => s.length);
  const total = weights.reduce((n, w) => n + w, 0) || 1;
  let acc = 0;
  return targetGroups.map((tg, g) => {
    const start = interpTime(cue, acc, total);
    acc += weights[g];
    const end = g === targetGroups.length - 1 ? cue.end : interpTime(cue, acc, total);
    return {
      start,
      end: Math.max(end, start + 0.3),
      target: tg,
      base: baseGroups ? baseGroups[g] ?? "" : "",
      ...(translitGroups ? { translit: translitGroups[g] ?? "" } : {}),
    };
  });
}

// Greedy: kelompokkan penggal berurutan jadi grup indeks yang gabungan target-nya
// ≤ MAX_CUE_CHARS (grup awal boleh melebihi kalau satu penggal sudah panjang).
function greedyGroups(segs: string[]): number[][] {
  const groups: number[][] = [];
  let cur: number[] = [];
  let curLen = 0;
  segs.forEach((t, i) => {
    if (cur.length && curLen + 1 + t.length > MAX_CUE_CHARS) {
      groups.push(cur);
      cur = [i];
      curLen = t.length;
    } else {
      cur.push(i);
      curLen = cur.length === 1 ? t.length : curLen + 1 + t.length;
    }
  });
  if (cur.length) groups.push(cur);
  return groups;
}

/**
 * Pecah cue TANPA terjemahan/translit (ASR/caption mentah) di batas KLAUSA (tanda
 * baca + kata sambung) untuk keterbacaan — aman karena tak ada pasangan arti yang
 * bisa salah geser.
 */
function splitCueClausesNoBase(cue: LearnCue): LearnCue[] {
  const targets = splitClauses(cue.target);
  if (targets.length <= 1) return [cue];
  const groups = greedyGroups(targets);
  if (groups.length <= 1) return [cue];
  const targetGroups = groups.map((idx) => idx.map((i) => targets[i]).join(" ").trim());
  return spreadOverGroups(cue, targetGroups, null, null);
}

/**
 * Pecah cue yang masih kepanjangan (> MAX_CUE_CHARS) jadi baris-baris pendek.
 *
 * Cue BERTERJEMAHAN tak boleh dipecah di batas kata sambung/klausa: batas itu
 * spesifik-bahasa (Spanyol "Aunque ya…" pecah jadi 2, Indonesia "Meskipun…" tetap 1)
 * → memasangkan klausa per-indeks bikin arti salah geser satu baris ("Aunque" dapat
 * seluruh kalimat terjemahan, dst). Jadi cue berterjemahan HANYA dipecah di batas
 * TANDA BACA (koma/titik-koma — dipertahankan penerjemah, korespondensi terjaga) DAN
 * hanya kalau jumlah penggal target == base (== translit kalau ada) → pemasangan 1:1
 * tepercaya. Kalau tak sama, biarkan kalimat UTUH: satu baris agak panjang tapi arti
 * PAS — jauh lebih baik daripada sinkron yang meleset. Cue tanpa terjemahan tetap
 * dipecah di batas klausa untuk keterbacaan (splitCueClausesNoBase).
 */
function splitLongCue(cue: LearnCue): LearnCue[] {
  if (cue.target.trim().length <= MAX_CUE_CHARS) return [cue];
  if (!cue.base && !cue.translit) return splitCueClausesNoBase(cue);

  const tSeg = splitByPunct(cue.target);
  const bSeg = splitByPunct(cue.base ?? "");
  const trSeg = cue.translit ? splitByPunct(cue.translit) : null;
  if (
    tSeg.length <= 1 ||
    tSeg.length !== bSeg.length ||
    (trSeg && trSeg.length !== tSeg.length)
  ) {
    // [watch-base-driven-split] Tak bisa dipasangkan aman lewat tanda baca (target
    // tak terpunktuasi). Kalau base masih panjang & punya batas KLAUSA (tanda baca
    // atau kata sambung dan/atau/karena/…), pecah per klausa base + target
    // proporsional biar satu kalimat panjang tak overwhelming. Kalau base pun tak
    // punya batas klausa, biarkan utuh.
    if ((cue.base ?? "").trim().length > MAX_CUE_CHARS) {
      const baseClauses = splitClauses(cue.base ?? "");
      if (baseClauses.length > 1) {
        const groups = greedyGroups(baseClauses).map((idx) =>
          idx.map((i) => baseClauses[i]).join(" ").trim()
        );
        if (groups.length > 1) return splitByBasePieces(cue, groups);
      }
    }
    return [cue];
  }

  // Gabung penggal seiring: target, base, translit pakai indeks grup yang SAMA →
  // tiap baris tetap sepasang.
  const groups = greedyGroups(tSeg);
  if (groups.length <= 1) return [cue];
  const join = (seg: string[], idx: number[]) => idx.map((i) => seg[i]).join(" ").trim();
  const targetGroups = groups.map((idx) => join(tSeg, idx));
  const baseGroups = groups.map((idx) => join(bSeg, idx));
  const translitGroups = trSeg ? groups.map((idx) => join(trSeg, idx)) : null;
  return spreadOverGroups(cue, targetGroups, baseGroups, translitGroups);
}

/** Pak kata jadi potongan ≤ maxChars (greedy). Kata tunggal > maxChars berdiri sendiri. */
function chunkWords(text: string, maxChars: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let cur = "";
  for (const w of words) {
    if (!cur) cur = w;
    else if (cur.length + 1 + w.length <= maxChars) cur += " " + w;
    else {
      chunks.push(cur);
      cur = w;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

/** Bagi kata jadi TEPAT n grup berurutan, ukuran serata mungkin (buat pasangkan base/translit). */
function distributeWords(text: string, n: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (n <= 1) return [words.join(" ")];
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const from = Math.floor((i * words.length) / n);
    const to = Math.floor(((i + 1) * words.length) / n);
    out.push(words.slice(from, to).join(" "));
  }
  return out;
}

/**
 * Bagi teks jadi TEPAT n potongan berurutan. Kalau cukup banyak kata (bahasa
 * berspasi: Hindi/Arab/Latin) → per KATA; kalau tidak (bahasa tanpa spasi:
 * Jepang/Mandarin/Thai) → per HURUF. Dipakai membagi target/translit proporsional
 * saat pemasangan lewat tanda baca tak mungkin (target auto-caption tanpa punktuasi).
 */
function distributeUnits(text: string, n: number): string[] {
  const t = text.trim();
  if (n <= 1) return [t];
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length >= n) return distributeWords(t, n);
  const chars = Array.from(t);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const from = Math.floor((i * chars.length) / n);
    const to = Math.floor(((i + 1) * chars.length) / n);
    out.push(chars.slice(from, to).join("").trim());
  }
  return out;
}

/**
 * [watch-base-driven-split] Pemasangan APPROKSIMATIF untuk cue yang TARGET-nya
 * datang TANPA tanda baca (auto-caption mentah — mis. Hindi/Arab yang belum
 * di-restore punktuasinya oleh worker) sehingga tak bisa dipecah aman lewat
 * pencocokan jumlah penggal. `base` (terjemahan Indonesia) SUDAH bertanda baca,
 * jadi kita jadikan ia penggerak: pecah base jadi `basePieces` (kalimat/klausa),
 * lalu target & translit dibagi proporsional ke jumlah yang SAMA. Pemasangan
 * per-kata jadi perkiraan (batas kata target ≠ batas kalimat base — inilah yang
 * dulu di-rem [watch-pair-safe-v1]), TAPI dipakai HANYA saat alternatifnya adalah
 * satu paragraf raksasa (target sama sekali tak terpunktuasi). Tiap section kini =
 * satu kalimat/klausa arti utuh → jauh lebih terbaca & tak overwhelming.
 */
function splitByBasePieces(cue: LearnCue, basePieces: string[]): LearnCue[] {
  const n = basePieces.length;
  if (n <= 1) return [cue];
  const tgt = distributeUnits(cue.target, n);
  const tr = cue.translit ? distributeUnits(cue.translit, n) : null;
  const total = tgt.reduce((sum, s) => sum + s.length, 0) || 1;
  let acc = 0;
  return basePieces.map((b, i) => {
    const start = interpTime(cue, acc, total);
    acc += tgt[i].length;
    const end = i === n - 1 ? cue.end : interpTime(cue, acc, total);
    return {
      start,
      end: Math.max(end, start + 0.3),
      target: tgt[i] ?? "",
      base: b,
      ...(tr ? { translit: tr[i] ?? "" } : {}),
    };
  });
}

/**
 * Fallback terakhir: pecah cue yang MASIH kepanjangan setelah pemecahan kalimat &
 * klausa (mis. hasil ASR/Whisper TANPA tanda baca → tak ada batas kalimat/koma untuk
 * dipotong). Dipecah per KATA jadi potongan ≤ MAX_CUE_CHARS; terjemahan (base) &
 * transliterasi ikut dibagi proporsional ke jumlah potongan yang SAMA. Perpasangan
 * jadi PERKIRAAN (beda bahasa, urutan kata tak selalu sejajar), tapi tiap section
 * jadi satu baris pendek — sesuai target "1 kalimat / 1 baris" utk semua sumber.
 */
function splitCueByWords(cue: LearnCue): LearnCue[] {
  if (cue.target.trim().length <= MAX_CUE_CHARS) return [cue];
  // Pemecahan per-KATA tak bisa memasangkan target↔base↔translit dengan benar
  // (urutan & jumlah kata beda antar bahasa → terjemahan/bacaan Latin salah geser,
  // mis. Arab: baris "baytan" tapi bacaannya "fa-ṣnaʿū yā aḥbābī baytan"). Jadi
  // kalau cue SUDAH bawa terjemahan/transliterasi, biarkan utuh (satu baris agak
  // panjang tapi PASANGANNYA BENAR) — lebih baik daripada sinkron yang meleset.
  // Pemecahan per-kata hanya untuk cue mentah tanpa apa pun yang bisa salah pasang.
  if (cue.base || cue.translit) return [cue];
  const targets = chunkWords(cue.target, MAX_CUE_CHARS);
  if (targets.length <= 1) return [cue];
  const bases = cue.base ? distributeWords(cue.base, targets.length) : null;
  const translits = cue.translit ? distributeWords(cue.translit, targets.length) : null;

  const total = targets.reduce((n, s) => n + s.length, 0) || 1;
  let acc = 0;
  return targets.map((tg, i) => {
    const start = interpTime(cue, acc, total);
    acc += tg.length;
    const end = i === targets.length - 1 ? cue.end : interpTime(cue, acc, total);
    return {
      start,
      end: Math.max(end, start + 0.3),
      target: tg,
      base: bases ? bases[i] : "",
      ...(translits ? { translit: translits[i] } : {}),
    };
  });
}

// Batas atas panjang satu kalimat wajar saat menggabung penggalan (pengaman biar
// transkrip ASR TANPA tanda baca tak terkumpul jadi satu blok raksasa) & jeda maks
// antar cue yang masih dianggap satu kalimat berlanjut.
const MERGE_MAX_CHARS = 240;
const MERGE_MAX_GAP = 2.5;
// Cue dianggap MENGAKHIRI kalimat kalau target-nya berakhir tanda titik kalimat
// (termasuk CJK。！？) — opsional diikuti kutип/kurung penutup.
const SENTENCE_END_RE = /[.!?…。！？।؟۔]["'”’)\]]*\s*$/u;

function joinText(a: string | undefined, b: string | undefined): string {
  return [a?.trim(), b?.trim()].filter(Boolean).join(" ");
}

/**
 * Gabungkan kembali cue yang merupakan PENGGALAN satu kalimat jadi cue se-kalimat,
 * supaya di-split ulang dengan logika terkini.
 *
 * Kenapa perlu: transkrip yang di-cache menyimpan hasil SPLIT lama (dulu memasangkan
 * terjemahan per-klausa → arti bisa salah geser antar baris). Tapi urutan penggalan
 * base tetap utuh: menyambungnya kembali memulihkan kalimat + terjemahan yang BENAR,
 * lalu splitCuesBySentence memecahnya ulang dengan pemasangan tanda-baca yang aman.
 * Idempoten untuk cue yang sudah benar (kalimat utuh berakhir titik → tak digabung).
 *
 * Aman: hanya menggabung selama cue sebelumnya BELUM mengakhiri kalimat, dengan
 * pengaman panjang (MERGE_MAX_CHARS) & jeda waktu (MERGE_MAX_GAP) supaya ASR tanpa
 * tanda baca tak menyatu jadi satu blok.
 */
function mergeCueFragments(cues: LearnCue[]): LearnCue[] {
  const out: LearnCue[] = [];
  for (const c of cues) {
    const prev = out[out.length - 1];
    const gap = prev ? c.start - prev.end : Infinity;
    const canMerge =
      prev &&
      !SENTENCE_END_RE.test(prev.target) &&
      prev.target.length + 1 + c.target.length <= MERGE_MAX_CHARS &&
      gap <= MERGE_MAX_GAP;
    if (canMerge) {
      // [watch-karaoke-anchor-v1] Catat batas window ASLI: offset-karakter tempat
      // `c` mulai di target gabungan → waktu asli c.start. Dipakai interpTime saat
      // cue gabungan ini dipecah ulang, biar sorotan menempel ke timing sebenarnya.
      const tp = prev as TimedCue;
      (tp._anc ??= []).push([prev.target.length + (prev.target ? 1 : 0), c.start]);
      prev.end = c.end;
      prev.target = joinText(prev.target, c.target);
      prev.base = joinText(prev.base, c.base);
      const tr = joinText(prev.translit, c.translit);
      if (tr) prev.translit = tr;
    } else {
      out.push({ ...c });
    }
  }
  return out;
}

// Rapikan transkrip jadi satu section per baris: satukan dulu penggalan jadi kalimat
// utuh (memulihkan pasangan target↔arti dari cache lama), lalu pecah per kalimat
// (akurat), di batas tanda baca, lalu — kalau MASIH kepanjangan (ASR tanpa tanda
// baca) — per kata. Tak ada lagi section paragraf panjang, apa pun sumbernya.
function splitCuesBySentence(cues: LearnCue[]): LearnCue[] {
  return mergeCueFragments(cues)
    .flatMap(splitCueBySentence)
    .flatMap(splitLongCue)
    .flatMap(splitCueByWords)
    // Buang anchor internal (dipakai interpTime) supaya tak ikut tersimpan ke cache.
    .map(({ start, end, target, base, translit }) =>
      translit ? { start, end, target, base, translit } : { start, end, target, base }
    );
}

/**
 * Ambil transkrip dwibahasa untuk sebuah video YouTube. Dua jalur:
 * (1) CEPAT — server Next fetch + parse caption YouTube, lalu Edge Function
 *     menerjemahkannya (jalan kalau IP-nya tak diblokir & video bercaption).
 * (2) ANDAL — kalau (1) gagal, transkripsi audio via `yt-asr` (Gemini, ~1 menit);
 *     ini jalan universal karena CDN audio tidak diblokir seperti endpoint caption.
 * `onAsr` dipanggil saat masuk jalur (2) biar player bisa ganti pesan loading.
 * Best-effort: balikin daftar kosong + alasan → player pakai CC bawaan YouTube.
 */
export async function fetchTranscript(
  videoId: string,
  langCode: string,
  opts?: { onAsr?: () => void; meta?: TranscriptVideoMeta; cacheOnly?: boolean }
): Promise<TranscriptResult> {
  // 0) Cache: kalau (video, bahasa) ini pernah diproses, langsung pakai — hemat
  //    fetch caption / ASR (~1 menit). Katalog = video populer ditonton berulang.
  const cached = await readTranscriptCache(videoId, langCode);
  if (cached?.length) {
    // Backfill metadata: baris cache lama (disimpan sebelum ada kolom metadata)
    // belum punya title → tak muncul di tab "Siap". Isi sekarang biar muncul.
    if (opts?.meta?.title) backfillTranscriptMeta(videoId, langCode, opts.meta);
    // Rapikan lagi walau dari cache: transkrip lama mungkin masih punya section
    // panjang (belum kena pemecahan per-baris). Idempoten untuk cache baru.
    return { cues: splitCuesBySentence(cached), reason: "ok" };
  }

  // cacheOnly: transkripsi kini dilakukan SERVER (kurasi admin + tombol "Minta"),
  // BUKAN di browser saat buka video (hemat & terkontrol). Kalau belum ada di
  // cache, jangan picu caption/ASR — beri tahu pemanggil biar tampilkan "Minta".
  if (opts?.cacheOnly) return { cues: [], reason: "not_ready" };

  // 1) Jalur cepat: cue mentah dari server Next + terjemahan.
  const raw = await fetchRawCuesFromServer(videoId, langCode);
  if (raw.cues.length) {
    const cues = await translateCues(raw.cues, raw.trackLang, langCode);
    const out = splitCuesBySentence(cues);
    saveTranscriptCache(videoId, langCode, out, "caption", opts?.meta);
    return { cues: out, reason: "ok" };
  }

  // 2) Jalur andal: transkripsi audio AI.
  opts?.onAsr?.();
  const asr = await fetchAsrTranscript(videoId, langCode);
  if (asr.length) {
    const out = splitCuesBySentence(asr);
    saveTranscriptCache(videoId, langCode, out, "asr", opts?.meta);
    return { cues: out, reason: "ok" };
  }

  return { cues: [], reason: raw.reason === "no_captions" ? "no_captions" : "empty" };
}

// ── Dedup + batas konkurensi pemrosesan transkrip (Fase 1, client-side) ──────
// Tiga jalur bisa memicu pemrosesan transkrip: (a) video yang SEDANG ditonton,
// (b) prewarm rekomendasi/katalog, (c) video yang DITINGGAL sebelum ASR-nya
// selesai. Tanpa koordinasi, loncat-loncat antar video bisa menumpuk banyak
// panggilan ASR (Gemini, ~1 menit) sekaligus dari satu tab. Dua pengaman di sini:
//   1. Dedup in-flight per (video, bahasa) → video aktif & prewarm berbagi SATU
//      pemrosesan, tak ada panggilan Gemini dobel.
//   2. Limiter background (maks BG_CONCURRENCY) untuk prewarm/video-yang-ditinggal
//      supaya tak membanjiri Edge Function yt-asr / kena rate limit Gemini.
// Batas ini per-tab; batas GLOBAL lintas-user menyusul di antrian server (Fase 2).

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

interface PrewarmVideo {
  videoId: string;
  title?: string;
  channel?: string | null;
  duration?: number | null;
}

// (video, bahasa) yang pemrosesannya masih berjalan — dipakai untuk dedup.
const inFlightTranscripts = new Map<string, Promise<TranscriptResult>>();

/**
 * Proses transkrip untuk satu (video, bahasa) dengan DEDUP: kalau permintaan yang
 * sama sudah berjalan (mis. sudah dihangatkan prewarm lalu penonton mengklik video
 * itu), keduanya berbagi promise yang sama alih-alih memicu ASR kedua.
 *
 * Promise-nya hidup lepas dari komponen React: kalau penonton keluar / pindah
 * video sebelum ASR selesai, pemrosesan TETAP tuntas di tab ini dan hasilnya
 * tersimpan ke cache → video muncul di tab "Siap" & instan saat dibuka lagi.
 *
 * Dipakai player untuk video yang sedang ditonton (langsung jalan, tak lewat
 * limiter — hanya ada ~1 video aktif). Prewarm memakainya lewat limiter background.
 */
export function processTranscript(
  videoId: string,
  langCode: string,
  opts?: { onAsr?: () => void; meta?: TranscriptVideoMeta; cacheOnly?: boolean }
): Promise<TranscriptResult> {
  const key = `${langCode}::${videoId}`;
  const existing = inFlightTranscripts.get(key);
  if (existing) return existing;
  const p = fetchTranscript(videoId, langCode, opts).finally(() => {
    inFlightTranscripts.delete(key);
  });
  inFlightTranscripts.set(key, p);
  return p;
}

// Sesi ini: (video|lang) yang sudah dititip ke antrian prewarm — jangan kirim ulang
// tiap render / kunjungan tab (hemat panggilan endpoint & insert DB). Ditandai
// SEBELUM fetch: prewarm best-effort, gagal sekali biar tak nyepam; jalur reaktif
// "Minta video ini" tetap jadi jaring pengaman, dan sesi berikutnya coba lagi.
const prewarmedThisSession = new Set<string>();
// Cuma hangatkan video TERATAS tiap daftar (paling mungkin diklik) — konservatif,
// biar antrian & biaya server tetap terkendali. Server punya cap harian sendiri.
const PREWARM_MAX = 8;

/**
 * Pra-hangatkan transkrip untuk daftar video (hasil tab browse / rekomendasi) SEBELUM
 * siswa mengkliknya: titipkan ke antrian server `yt_transcript_jobs` (source
 * 'prewarm') lewat `/api/yt-transcript/prewarm`. Worker pg_cron (tiap menit)
 * memprosesnya di latar belakang, jadi saat siswa membuka video, transkrip biasanya
 * SUDAH siap → tampil instan.
 *
 * Tidak lagi memicu transkripsi di browser (dulu no-op karena itu mahal/tak
 * terkontrol) — di sini klien hanya MENITIP enqueue; kerja beratnya di server, yang
 * men-dedup (skip yang sudah siap/antre) & membatasi kuota harian. Fire-and-forget:
 * tak menahan UI, kegagalan diabaikan diam-diam.
 */
export function prewarmTranscripts(videos: PrewarmVideo[], langCode: string): void {
  if (typeof window === "undefined") return;
  if (!/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(langCode)) return;

  const ids: string[] = [];
  for (const v of videos) {
    const id = v?.videoId;
    if (!id || !VIDEO_ID_RE.test(id)) continue;
    const key = `${langCode}::${id}`;
    if (prewarmedThisSession.has(key)) continue;
    prewarmedThisSession.add(key);
    ids.push(id);
    if (ids.length >= PREWARM_MAX) break;
  }
  if (!ids.length) return;

  void fetch("/api/yt-transcript/prewarm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoIds: ids, lang: langCode }),
    keepalive: true, // tetap terkirim walau siswa buru-buru pindah/klik video
  }).catch(() => {
    /* best-effort — prewarm tak boleh mengganggu; abaikan kegagalan */
  });
}

/**
 * Tombol "Minta video ini": titipkan (video, bahasa) ke antrian server supaya
 * ditranskripsi (di-gate di endpoint). Balikin status ringkas untuk UI.
 *   'queued'     → baru masuk antrian
 *   'exists'     → sudah antre sebelumnya
 *   'processing' → sedang diproses
 *   'ready'      → transkrip sudah siap (buka lagi = langsung ada)
 *   'cap'        → kuota permintaan penuh / fitur ditutup
 *   'error'      → gagal
 */
export type RequestStatus = "queued" | "exists" | "processing" | "ready" | "cap" | "error";

export async function requestTranscript(videoId: string, langCode: string): Promise<RequestStatus> {
  try {
    const res = await fetch("/api/yt-transcript/enqueue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, lang: langCode }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; status?: string; reason?: string };
    if (data?.ok && typeof data.status === "string") return data.status as RequestStatus;
    if (data?.reason === "cap") return "cap";
    return "error";
  } catch {
    return "error";
  }
}

/**
 * Ambil daftar video yang transkripnya SUDAH tersimpan di cache untuk sebuah
 * bahasa — sumber tab "Siap". Instan (baca cache Supabase), tanpa kuota YouTube /
 * biaya AI. Best-effort: balikin [] kalau gagal.
 */
export async function fetchReadyVideos(
  langCode: string,
  limit = 40
): Promise<import("./immersion").ImmersionVideo[]> {
  try {
    const res = await fetchTimeout(
      `/api/yt-transcript-cache?list=1&lang=${encodeURIComponent(langCode)}&limit=${limit}`,
      { method: "GET" },
      6000
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { videos?: unknown };
    if (!Array.isArray(data.videos)) return [];
    return (data.videos as Record<string, unknown>[])
      .filter((v) => v && typeof v.videoId === "string" && (v.videoId as string).length > 0)
      .map((v) => ({
        videoId: v.videoId as string,
        title: typeof v.title === "string" && v.title ? (v.title as string) : "Video",
        thumbnail: null,
        channel: typeof v.channel === "string" ? (v.channel as string) : null,
        duration: typeof v.duration === "number" ? (v.duration as number) : null,
        level: asCefrLevel(v.level),
      }));
  } catch {
    return [];
  }
}

/**
 * Transliterasi sekumpulan baris (kalimat target) ke aksara Latin lewat
 * `/api/translit` (Gemini). Dipakai untuk bahasa non-Latin yang transkripnya tak
 * membawa bacaan Latin. Diproses per-batch biar respons tetap andal & selaras
 * indeksnya. Balikin array sepanjang `lines` (item kosong "" untuk yang gagal) —
 * best-effort, non-Latin dipanggil di background biar transkrip tampil dulu.
 */
export async function transliterateLines(
  lines: string[],
  langCode: string
): Promise<string[]> {
  const out = new Array<string>(lines.length).fill("");
  if (!isNonLatin(langCode) || !lines.length) return out;
  const CHUNK = 40;
  // Jalankan semua batch PARALEL (bukan berurutan) biar bacaan Latin muncul cepat —
  // transkrip panjang (ratusan baris) tak perlu nunggu batch demi batch. Tiap batch
  // best-effort: yang gagal dibiarkan kosong, tak menahan yang lain.
  const jobs: Promise<void>[] = [];
  for (let i = 0; i < lines.length; i += CHUNK) {
    const start = i;
    const slice = lines.slice(i, i + CHUNK);
    jobs.push(
      (async () => {
        try {
          const res = await fetch("/api/translit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lines: slice, langCode }),
          });
          if (!res.ok) return;
          const data = (await res.json()) as { translit?: unknown };
          const arr = Array.isArray(data.translit) ? data.translit : [];
          for (let j = 0; j < slice.length; j++) {
            const v = arr[j];
            if (typeof v === "string") out[start + j] = v.trim();
          }
        } catch {
          /* best-effort — biarkan kosong */
        }
      })()
    );
  }
  await Promise.all(jobs);
  return out;
}

// ── word-info (arti kata, grammar, analisa kalimat) ──────────────────────────

type WordInfoMode = "meaning" | "grammar" | "breakdown";

async function callWordInfo(params: {
  word: string;
  sentence: string;
  mode: WordInfoMode;
  langCode: string;
}): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Supabase env belum diset.");
  const res = await fetch(`${SUPABASE_URL}/functions/v1/word-info`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      word: params.word,
      sentence: params.sentence,
      mode: params.mode,
      language: ENGLISH_NAME[params.langCode] ?? ENGLISH_NAME[params.langCode.split("-")[0]] ?? "English",
      explanationLanguage: EXPLANATION_LANGUAGE,
      nonLatin: isNonLatin(params.langCode),
    }),
  });
  if (!res.ok) throw new Error(`word-info gagal (${res.status})`);
  const data = (await res.json()) as { text?: string };
  if (!data.text) throw new Error("word-info tidak mengembalikan teks.");
  return data.text;
}

/** Arti singkat sebuah kata + kelas katanya, keduanya dalam bahasa Indonesia. */
export interface WordMeaning {
  meaning: string;
  type: string;
  /** Bentuk dasar/kamus (infinitive) untuk verba yang terkonjugasi — mis. "produjo"
   *  → "producir". Kosong/undefined untuk non-verba atau kata yang sudah bentuk dasar. */
  base?: string;
}

export async function getWordMeaning(params: {
  word: string;
  sentence: string;
  langCode: string;
}): Promise<WordMeaning> {
  const raw = await callWordInfo({ ...params, mode: "meaning" });
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) throw new Error("Gagal parse arti.");
  const parsed = JSON.parse(raw.slice(start, end + 1)) as {
    meaning?: unknown;
    type?: unknown;
    base?: unknown;
  };
  const meaning = typeof parsed.meaning === "string" ? parsed.meaning.trim() : "";
  const type = typeof parsed.type === "string" ? parsed.type.trim() : "";
  const base = typeof parsed.base === "string" ? parsed.base.trim() : "";
  if (!meaning && !type) throw new Error("Arti kosong.");
  return { meaning, type, base: base || undefined };
}

/** Penjelasan tata bahasa singkat (teks bebas) untuk kata yang di-tap. */
export async function getWordGrammar(params: {
  word: string;
  sentence: string;
  langCode: string;
}): Promise<string> {
  const text = await callWordInfo({ ...params, mode: "grammar" });
  return text.trim();
}

// ── Belajar mendalami kata (mode layar penuh) ────────────────────────────────
// Lebih kaya dari tooltip: tingkat kesopanan (register), kapan/bagaimana dipakai,
// nuansa, kata mirip yang gampang ketuker, contoh kalimat — plus tanya-jawab
// lanjutan bebas. Backed by route Next /api/word-deep (Gemini).

export interface WordSimilar {
  word: string;
  tl?: string;
  diff: string;
}

export interface WordExample {
  target: string;
  tl?: string;
  gloss: string;
}

/**
 * Satu segmen kata dalam tabel konjugasi. `c: true` menandai bagian yang BERUBAH
 * antar-baris paradigma (afiks terkonjugasi) — diwarnai di UI; `c: false` = stem
 * yang tetap. Gabungan `t` seluruh part = bentuk kata utuh.
 */
export interface ConjugationPart {
  t: string;
  c: boolean;
}

/** Satu baris tabel konjugasi (mis. satu persona/subjek). */
export interface ConjugationRow {
  label: string; // label persona/subjek dalam bahasa Indonesia
  parts: ConjugationPart[];
  suffix: string; // afiks yang berubah (kolom "Suffix")
  tl?: string; // bacaan Latin bentuk utuh (bahasa non-Latin)
  gloss: string; // arti bentuk ini dalam bahasa Indonesia
}

/** Tabel konjugasi kata kerja — hanya ada saat kata yang dibuka adalah verb. */
export interface WordConjugation {
  caption: string;
  note: string;
  rows: ConjugationRow[];
}

export interface WordDeepDive {
  register: string; // "netral" | "formal" | "casual" | "sopan" | "vulgar" | ""
  registerNote: string;
  usage: string;
  nuance: string;
  similar: WordSimilar[];
  examples: WordExample[];
  // Tabel konjugasi (verb saja; null untuk kelas kata lain).
  conjugation: WordConjugation | null;
  // Istilah tata bahasa baru yang muncul di penjelasan (mis. "vokatif") — dipakai
  // untuk menawarkan chip "Apa itu <istilah>?" di bawah kartu Pelajari.
  terms: string[];
}

/** Ambil kartu belajar mendalam untuk sebuah kata (register, penggunaan, dll). */
export async function getWordDeepDive(params: {
  word: string;
  sentence: string;
  langCode: string;
}): Promise<WordDeepDive> {
  const res = await fetch("/api/word-deep", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, mode: "overview" }),
  });
  if (!res.ok) throw new Error(`word-deep gagal (${res.status})`);
  const data = (await res.json()) as Partial<WordDeepDive> & { error?: string };
  if (data.error) throw new Error(data.error);
  const conj = data.conjugation;
  return {
    register: data.register ?? "",
    registerNote: data.registerNote ?? "",
    usage: data.usage ?? "",
    nuance: data.nuance ?? "",
    similar: Array.isArray(data.similar) ? data.similar : [],
    examples: Array.isArray(data.examples) ? data.examples : [],
    conjugation:
      conj && Array.isArray(conj.rows) && conj.rows.length
        ? { caption: conj.caption ?? "", note: conj.note ?? "", rows: conj.rows }
        : null,
    terms: Array.isArray(data.terms) ? data.terms.filter((t) => typeof t === "string" && t.trim()) : [],
  };
}

/**
 * Satu usulan pertanyaan lanjutan. `tl` = transliterasi (bacaan Latin) kata
 * bahasa target non-Latin yang tersisip di dalam pertanyaan — kosong utk
 * bahasa Latin. Dipakai chip "Lanjut tanya" agar Arab dll bisa dibaca.
 */
export interface FollowupQ {
  q: string;
  tl?: string;
}

/** Jawaban tanya-lanjutan + usulan pertanyaan berikutnya yang kontekstual. */
export interface WordAnswer {
  answer: string;
  followups: FollowupQ[];
}

/** Tanya-jawab lanjutan bebas tentang sebuah kata (mis. "bedanya dengan …?"). */
export async function askWordQuestion(params: {
  word: string;
  sentence: string;
  langCode: string;
  question: string;
}): Promise<WordAnswer> {
  const res = await fetch("/api/word-deep", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, mode: "ask" }),
  });
  if (!res.ok) throw new Error(`word-deep gagal (${res.status})`);
  const data = (await res.json()) as {
    answer?: string;
    followups?: unknown[];
    error?: string;
  };
  if (data.error) throw new Error(data.error);
  // Terima bentuk lama (string[]) maupun baru ({ q, tl }[]) biar tahan versi.
  const followups: FollowupQ[] = Array.isArray(data.followups)
    ? data.followups
        .map((it): FollowupQ => {
          if (typeof it === "string") return { q: it.trim() };
          const o = (it ?? {}) as Record<string, unknown>;
          return {
            q: typeof o.q === "string" ? o.q.trim() : "",
            tl: typeof o.tl === "string" ? o.tl.trim() : "",
          };
        })
        .filter((f) => f.q)
        .slice(0, 3)
    : [];
  return {
    answer: (data.answer ?? "").trim(),
    followups,
  };
}

/** Kelas kata kanonik untuk pewarnaan token dalam analisa kalimat. */
export type PosCategory =
  | "noun" | "verb" | "pronoun" | "adjective" | "adverb" | "preposition"
  | "conjunction" | "determiner" | "numeral" | "interjection" | "particle"
  | "auxiliary" | "punctuation" | "other";

const POS_CATEGORIES: PosCategory[] = [
  "noun", "verb", "pronoun", "adjective", "adverb", "preposition", "conjunction",
  "determiner", "numeral", "interjection", "particle", "auxiliary", "punctuation", "other",
];

export interface SentenceToken {
  word: string;
  cat: PosCategory;
  gloss: string;
  pos?: string;
  translit?: string;
}

export interface SentenceBreakdown {
  translation: string;
  tokens: SentenceToken[];
  // Versi bentuk/isi breakdown. Naikkan tiap kali aturan arti/token berubah supaya
  // cache lama (localStorage + yt_transcripts.cues[].breakdown) dianggap basi &
  // dihitung ulang otomatis — bukan menampilkan hasil lawas tanpa arti per-kata.
  v?: number;
}

// v2: arti per-kata (gloss) ditaruh di atas tiap kata + kata fungsi (partikel/kata
// bantu) sengaja dikosongkan artinya + tanda baca berdiri sendiri dibuang. Cache
// breakdown lama (tanpa `v` atau v<2) tak lagi dipakai → di-refetch.
export const BREAKDOWN_VERSION = 2;

/** Apakah breakdown ini hasil versi terbaru (bukan cache lawas yang perlu dihitung ulang). */
export function isFreshBreakdown(bd: SentenceBreakdown | undefined | null): boolean {
  return !!bd && bd.v === BREAKDOWN_VERSION;
}

// Kata fungsi yang—buat pelajar—tak punya arti leksikal berdiri sendiri; barisnya
// dikosongkan (fungsinya sudah terwakili label kelas kata di bawah). Kata isi
// (benda/kerja/sifat/keterangan/sambung/dll.) tetap diberi arti.
const NO_GLOSS_CATS = new Set<PosCategory>(["particle", "auxiliary", "punctuation"]);

// Token tanpa satu pun huruf/angka = tanda baca/simbol berdiri sendiri ("、", "。",
// "?") → dibuang dari analisa (bukan kata untuk dipelajari).
function isPunctuationOnly(word: string): boolean {
  return !/[\p{L}\p{N}]/u.test(word);
}

// ── Cache analisa kalimat (breakdown) ────────────────────────────────────────
// Breakdown = fungsi murni dari (kalimat, bahasa) → aman di-cache permanen. Di-key
// per kalimat (bukan per video) supaya kalimat identik di video lain ikut instan.
// localStorage = cache per-perangkat; persist ke yt_transcripts.cues[].breakdown
// (lewat prewarmBreakdowns) = cache lintas-perangkat/pengguna "bareng transkrip".
const BREAKDOWN_CACHE_PREFIX = "linguo:watch:breakdown:v1:";

function breakdownCacheKey(sentence: string, langCode: string): string {
  let h = 5381;
  const s = `${langCode}|${sentence}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return BREAKDOWN_CACHE_PREFIX + (h >>> 0).toString(36);
}

function readBreakdownCache(sentence: string, langCode: string): SentenceBreakdown | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(breakdownCacheKey(sentence, langCode));
    if (!v) return null;
    const bd = JSON.parse(v) as SentenceBreakdown;
    // Cache versi lawas (belum ada arti per-kata / partikel belum dikosongkan) →
    // anggap tak ada supaya dihitung ulang dengan aturan terbaru.
    return isFreshBreakdown(bd) && Array.isArray(bd?.tokens) && bd.tokens.length ? bd : null;
  } catch {
    return null;
  }
}

function writeBreakdownCache(sentence: string, langCode: string, bd: SentenceBreakdown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(breakdownCacheKey(sentence, langCode), JSON.stringify(bd));
  } catch {
    /* kuota penuh → abaikan */
  }
}

/**
 * Tulis breakdown yang ikut dibawa transkrip (cue.breakdown, cache lintas-pengguna)
 * ke cache localStorage — supaya `getCachedWordMeaning` (dibaca tooltip) menemukannya
 * dan tap kata langsung instan tanpa harus dihitung ulang di perangkat ini. Hanya
 * menulis breakdown versi terbaru; yang lawas diabaikan.
 */
export function primeBreakdownCache(sentence: string, langCode: string, bd: SentenceBreakdown): void {
  if (!isFreshBreakdown(bd)) return;
  writeBreakdownCache(sentence.trim(), langCode, bd);
}

const breakdownInFlight = new Map<string, Promise<SentenceBreakdown>>();

async function fetchSentenceBreakdown(sentence: string, langCode: string): Promise<SentenceBreakdown> {
  const raw = await callWordInfo({
    word: sentence,
    sentence,
    mode: "breakdown",
    langCode,
  });
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) throw new Error("Gagal parse analisa.");
  const parsed = JSON.parse(raw.slice(start, end + 1)) as { tr?: unknown; tk?: unknown };
  const translation = typeof parsed.tr === "string" ? parsed.tr.trim() : "";
  const tokens = Array.isArray(parsed.tk)
    ? (parsed.tk as unknown[])
        .map((t) => {
          const tok = t as { w?: unknown; c?: unknown; g?: unknown; p?: unknown; r?: unknown };
          const cat = (
            typeof tok.c === "string" ? tok.c.trim().toLowerCase() : ""
          ) as string;
          const catNorm = (POS_CATEGORIES.includes(cat as PosCategory) ? cat : "other") as PosCategory;
          const word = typeof tok.w === "string" ? tok.w.trim() : "";
          const rawGloss = typeof tok.g === "string" ? tok.g.trim() : "";
          // Arti dikosongkan untuk kata fungsi (partikel/kata bantu) & bila arti-nya
          // cuma tanda baca / sama persis dengan kata itu sendiri (tak informatif).
          const gloss =
            NO_GLOSS_CATS.has(catNorm) || isPunctuationOnly(rawGloss) || rawGloss === word
              ? ""
              : rawGloss;
          return {
            word,
            cat: catNorm,
            gloss,
            pos: typeof tok.p === "string" ? tok.p.trim() : "",
            translit: typeof tok.r === "string" ? tok.r.trim() : "",
          };
        })
        // Buang token kosong & tanda baca berdiri sendiri (model kadang tetap
        // menyertakannya walau diminta melewati).
        .filter((t) => t.word.length > 0 && !isPunctuationOnly(t.word))
    : [];
  if (!tokens.length) throw new Error("Analisa kosong.");
  return { translation, tokens, v: BREAKDOWN_VERSION };
}

/**
 * Pecah satu baris subtitle kata demi kata untuk mode "Analisa": terjemahan
 * akurat + kelas kata (warna) dan arti tiap kata. Backed by word-info "breakdown".
 * Di-cache di localStorage + de-dup panggilan bersamaan (kalimat sama) supaya
 * mode Analisa & prewarm tak memanggil LLM dua kali untuk kalimat yang sama.
 */
export async function getSentenceBreakdown(params: {
  sentence: string;
  langCode: string;
}): Promise<SentenceBreakdown> {
  const sentence = params.sentence.trim();
  const cached = readBreakdownCache(sentence, params.langCode);
  if (cached) return cached;
  const key = breakdownCacheKey(sentence, params.langCode);
  const inflight = breakdownInFlight.get(key);
  if (inflight) return inflight;
  const p = fetchSentenceBreakdown(sentence, params.langCode)
    .then((bd) => {
      writeBreakdownCache(sentence, params.langCode, bd);
      return bd;
    })
    .finally(() => breakdownInFlight.delete(key));
  breakdownInFlight.set(key, p);
  return p;
}

/**
 * Precompute analisa untuk SEMUA kalimat sebuah transkrip di latar belakang, biar
 * mode Analisa instan (tanpa loading) saat siswa mengklik. Throttled (concurrency
 * kecil + jeda) supaya tak menghajar edge fn. `onOne` dipanggil tiap kalimat siap
 * (dari cache maupun hasil baru) → player mengisi state realtime. Kalimat yang baru
 * dihitung di-persist sekali ke cache transkrip bersama (yt_transcripts) supaya
 * viewer/kunjungan berikutnya baca analisa langsung bareng transkrip.
 */
export async function prewarmBreakdowns(params: {
  videoId: string;
  langCode: string;
  sentences: string[];
  onOne?: (sentence: string, bd: SentenceBreakdown) => void;
  isCancelled?: () => boolean;
}): Promise<void> {
  const { videoId, langCode, onOne, isCancelled } = params;
  const uniq = Array.from(
    new Set(params.sentences.map((s) => s.trim()).filter((s) => s.length > 0))
  );
  // Kalimat yang benar-benar baru dipanggil ke LLM (bukan dari cache) → yang perlu
  // di-persist ke DB. Di-key per target text (breakdown = fungsi murni kalimat).
  const fresh: Record<string, SentenceBreakdown> = {};
  const CONCURRENCY = 2;
  let cursor = 0;

  const worker = async () => {
    while (cursor < uniq.length) {
      if (isCancelled?.()) return;
      const sentence = uniq[cursor++];
      const cached = readBreakdownCache(sentence, langCode);
      if (cached) {
        onOne?.(sentence, cached);
        continue;
      }
      try {
        const bd = await getSentenceBreakdown({ sentence, langCode });
        if (isCancelled?.()) return;
        onOne?.(sentence, bd);
        fresh[sentence] = bd;
      } catch {
        /* satu kalimat gagal → lanjut, jangan gagalkan seluruh prewarm */
      }
      // Jeda kecil biar antrean edge fn tak dibombardir untuk video panjang.
      await new Promise((r) => setTimeout(r, 150));
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const freshKeys = Object.keys(fresh);
  if (isCancelled?.() || !freshKeys.length) return;
  // Persist ke cache transkrip bersama (best-effort). Server menyisipkan breakdown
  // ke cue yang target-nya cocok.
  try {
    void fetch("/api/yt-transcript-cache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, lang: langCode, breakdowns: fresh }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* abaikan */
  }
}

// ── Penjajaran kata target↔terjemahan (hover-sync frasa) ─────────────────────
// Satu grup = sekumpulan indeks kata TARGET yang bermakna sama dengan sekumpulan
// indeks kata TERJEMAHAN (base). Dipakai player untuk menyorot kata + artinya
// bersamaan saat di-hover, dengan frasa multi-kata ("el entrenamiento de fuerza"
// ↔ "strength training") sebagai SATU unit. Indeks mengacu ke urutan kata (token
// isWord) hasil splitWords — sama dengan yang dirender, jadi pasti sinkron.
export interface AlignGroup {
  t: number[];
  b: number[];
}

// v3: penjajaran sekarang DETERMINISTIK & halus per-kata. Edge function word-info
// mode "align" dulu pakai temperature default (acak: baris yang sama bisa dapat grup
// beda tiap panggilan) TANPA schema — model kerap melebur satu klausa jadi SATU grup,
// jadi hover satu kata menyorot seluruh baris (tak sinkron dgn artinya). Sekarang:
// temperature 0 + JSON schema + thinkingBudget → grup sekecil mungkin (1 kata ↔ 1 arti,
// artikel yang jatuh dapat "b":[]). Naikkan versi biar cache v2 yang kasar di-ambil ulang.
const ALIGN_CACHE_PREFIX = "linguo:watch:align:v3:";

function alignCacheKey(target: string, base: string): string {
  // Hash ringkas & stabil (djb2) dari pasangan target|base — cukup untuk kunci cache.
  let h = 5381;
  const s = `${target} ${base}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return ALIGN_CACHE_PREFIX + (h >>> 0).toString(36);
}

function readAlignCache(target: string, base: string): AlignGroup[] | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(alignCacheKey(target, base));
    return v ? (JSON.parse(v) as AlignGroup[]) : null;
  } catch {
    return null;
  }
}

function writeAlignCache(target: string, base: string, groups: AlignGroup[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(alignCacheKey(target, base), JSON.stringify(groups));
  } catch {
    /* kuota penuh → abaikan */
  }
}

const alignInFlight = new Map<string, Promise<AlignGroup[]>>();

/**
 * Ambil penjajaran frasa antara satu baris `target` dan terjemahannya `base`.
 * Tokenisasi dilakukan di sini (splitWords, hanya token isWord) supaya indeks yang
 * dikembalikan model persis sama dengan yang dirender player. Hasil di-cache di
 * localStorage per pasangan kalimat — biaya LLM sekali saja per baris. Best-effort:
 * kalau gagal/kosong, balikin [] (player fallback ke sorot per-kata biasa).
 */
export async function getAlignment(params: {
  target: string;
  base: string;
  langCode: string;
  baseCode: string;
}): Promise<AlignGroup[]> {
  const { target, base, langCode, baseCode } = params;
  if (!target.trim() || !base.trim()) return [];
  const cached = readAlignCache(target, base);
  if (cached) return cached;

  const ck = alignCacheKey(target, base);
  const existing = alignInFlight.get(ck);
  if (existing) return existing;

  const run = (async (): Promise<AlignGroup[]> => {
    const targetTokens = splitWords(target, langCode).filter((w) => w.isWord).map((w) => w.text);
    const baseTokens = splitWords(base, baseCode).filter((w) => w.isWord).map((w) => w.text);
    if (targetTokens.length === 0 || baseTokens.length === 0) return [];
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
    const res = await fetch(`${SUPABASE_URL}/functions/v1/word-info`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        mode: "align",
        word: target,
        sentence: target,
        language: ENGLISH_NAME[langCode] ?? ENGLISH_NAME[langCode.split("-")[0]] ?? "English",
        explanationLanguage: getBaseLangDef(baseCode).name,
        targetTokens,
        baseTokens,
      }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { text?: string };
    const raw = data.text ?? "";
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) return [];
    let parsed: { g?: unknown };
    try {
      parsed = JSON.parse(raw.slice(start, end + 1)) as { g?: unknown };
    } catch {
      return [];
    }
    const tn = targetTokens.length;
    const bn = baseTokens.length;
    const groups: AlignGroup[] = Array.isArray(parsed.g)
      ? (parsed.g as unknown[])
          .map((grp) => {
            const g = grp as { t?: unknown; b?: unknown };
            const clean = (v: unknown, max: number) =>
              Array.isArray(v)
                ? Array.from(
                    new Set(
                      v
                        .map((n) => (typeof n === "number" ? n : Number(n)))
                        .filter((n) => Number.isInteger(n) && n >= 0 && n < max)
                    )
                  )
                : [];
            return { t: clean(g.t, tn), b: clean(g.b, bn) };
          })
          .filter((g) => g.t.length > 0)
      : [];
    if (groups.length) writeAlignCache(target, base, groups);
    return groups;
  })();

  alignInFlight.set(ck, run);
  try {
    return await run;
  } finally {
    alignInFlight.delete(ck);
  }
}

/** Warna per kelas kata — dipakai chip token di mode Analisa. */
export const POS_COLOR: Record<PosCategory, string> = {
  noun: "#5AB0FF", verb: "#FF7A9C", adjective: "#F4B740", adverb: "#B58BFF",
  pronoun: "#4FD1C5", preposition: "#9AE66E", conjunction: "#FFB86B",
  determiner: "#7FE0E0", numeral: "#E0E0E0", interjection: "#FF9F80",
  particle: "#C0C0C0", auxiliary: "#FF9CC8", punctuation: "rgba(255,255,255,0.35)",
  other: "rgba(255,255,255,0.7)",
};

export const POS_LABEL_ID: Record<PosCategory, string> = {
  noun: "benda", verb: "kerja", adjective: "sifat", adverb: "keterangan",
  pronoun: "ganti", preposition: "depan", conjunction: "sambung",
  determiner: "sandang", numeral: "bilangan", interjection: "seru",
  particle: "partikel", auxiliary: "bantu", punctuation: "tanda baca", other: "lainnya",
};

/**
 * Arti sebuah kata dari analisa kalimat (breakdown) yang SUDAH di-cache — INSTAN,
 * tanpa memanggil word-info. `prewarmBreakdowns` menghangatkan cache ini begitu
 * transkrip siap, jadi tap kata bisa langsung memunculkan artinya tanpa loading.
 *
 * Mengembalikan null (→ pemanggil fallback ke `getWordMeaning` + auto-expand frasa)
 * kalau: belum ada breakdown untuk kalimat ini, kata tak ketemu di token, atau
 * token itu kata fungsi tanpa arti mandiri (gloss kosong).
 */
export function getCachedWordMeaning(params: {
  word: string;
  sentence: string;
  langCode: string;
}): (WordMeaning & { translit?: string }) | null {
  const bd = readBreakdownCache(params.sentence.trim(), params.langCode);
  if (!bd) return null;
  const target = cleanWord(params.word).toLowerCase();
  if (!target) return null;
  const tok = bd.tokens.find(
    (t) => cleanWord(t.word).toLowerCase() === target && t.gloss.trim()
  );
  if (!tok) return null;
  return {
    meaning: tok.gloss.trim(),
    type: `kata ${POS_LABEL_ID[tok.cat]}`,
    translit: tok.translit?.trim() || undefined,
  };
}

// ── Kosakata tersimpan (localStorage) ────────────────────────────────────────

import { gradeCard, newSrsState, type SrsGrade, type SrsState } from "./srs";
import { asCefrLevel } from "./cefr";

export interface SavedWord {
  word: string;
  meaning: string;
  langCode: string;
  example: string;
  // Video tempat kata disimpan — dipakai badge "kosakata di video ini" pada player.
  // Opsional: kata lama (sebelum fitur ini) tak punya field ini.
  videoId?: string;
  ts: number;
  // State spaced-repetition (SM-2). Opsional: kata lama (sebelum fitur SRS) tak
  // punya field ini → diperlakukan "baru" / jatuh tempo langsung saat direview.
  srs?: SrsState;
}

const VOCAB_KEY = "linguo:watch:vocab:v1";

export function getSavedWords(): SavedWord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(VOCAB_KEY);
    const arr = raw ? (JSON.parse(raw) as SavedWord[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function keyOf(word: string, langCode: string): string {
  return `${langCode}::${word.trim().toLowerCase()}`;
}

// ── Freemium: kuota simpan kata (ala LingQ) ──────────────────────────────────
// Nonton + transkrip + terjemahan GRATIS tanpa batas (itu mesin akuisisi/SEO).
// Yang dibatasi cuma MENYIMPAN kosakata: pengguna gratis dapat kuota supaya
// sempat merasakan loop "simpan → review → ingat" beberapa kali, lalu diarahkan
// ke produk berbayar Linguo yang sudah ada (kelas guru / simulasi) begitu serius.
//
// `isWatchPremium` sengaja jadi SATU titik sambung: sekarang membaca flag lokal;
// nanti tinggal disambung ke entitlement langganan sebenarnya tanpa mengubah
// call site mana pun.
export const FREE_SAVE_LIMIT = 20;

// Cicip gratis untuk fitur "belajar" (buka arti kata + Analisa grammar). Pengguna
// dingin butuh beberapa tap untuk paham nilai Watch & Learn sebelum diarahkan ke
// langganan — jadi buka arti kata GRATIS beberapa kali, lalu gate. Nonton +
// subtitle + terjemahan tetap gratis tak terbatas (mesin akuisisi/SEO).
export const FREE_LOOKUP_LIMIT = 3;

const PREMIUM_KEY = "linguo:watch:premium:v1";
const LOOKUP_KEY = "linguo:watch:lookups:v1";
// Flag staf (owner/admin Linguo): akses penuh Watch & Learn tanpa langganan —
// biar tim internal bisa nonton & pakai semua fitur belajar tanpa kena gate.
// Disetel oleh WatchAndLearn saat sesi terdeteksi (baca profiles.role), dibaca
// lewat isWatchPremium() supaya SEMUA call site gate ikut terbuka tanpa diubah.
const STAFF_KEY = "linguo:watch:staff:v1";

// Daftar email yang diberi akses penuh Watch & Learn secara cuma-cuma (comp),
// tanpa langganan & tanpa harus owner/admin di profiles. Dipakai untuk akun
// internal/tester tertentu. Email login yang cocok → diperlakukan seperti staf
// (isWatchPremium() true di seluruh player). Cocokkan setelah lowercase+trim.
const WATCH_COMP_EMAILS = new Set<string>([
  "ramadhanimuhamadlutfi@gmail.com",
  "mlutfiramadhani1@gmail.com",
]);

/** Apakah email ini termasuk daftar akses penuh WL cuma-cuma. */
export function isWatchCompedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return WATCH_COMP_EMAILS.has(email.trim().toLowerCase());
}

/** Tandai (atau cabut) akses staf. Dipanggil setelah cek role sesi login. */
export function setWatchStaff(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (on) window.localStorage.setItem(STAFF_KEY, "1");
    else window.localStorage.removeItem(STAFF_KEY);
  } catch {
    /* diblokir — abaikan */
  }
}

/** Akses premium Watch & Learn (buka arti/Analisa tanpa batas). Titik sambung tunggal. */
export function isWatchPremium(): boolean {
  if (typeof window === "undefined") return false;
  try {
    // Staf internal (owner/admin) dianggap premium — pengecualian gate.
    return (
      window.localStorage.getItem(STAFF_KEY) === "1" ||
      window.localStorage.getItem(PREMIUM_KEY) === "1"
    );
  } catch {
    return false;
  }
}

/**
 * Sambungan tunggal untuk MENGAKTIFKAN premium. Sekarang menulis flag lokal
 * (per-perangkat) — dipanggil setelah pembayaran berhasil (halaman redirect) atau
 * saat entitlement langganan asli disambung. TODO: verifikasi entitlement server.
 */
export function setWatchPremium(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (on) window.localStorage.setItem(PREMIUM_KEY, "1");
    else window.localStorage.removeItem(PREMIUM_KEY);
  } catch {
    /* diblokir — abaikan */
  }
}

// ── Kuota cicip: buka arti kata (dipakai bersama Analisa) ────────────────────
function getLookedUpWords(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOOKUP_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** Sisa cicip buka arti (−1 = tak terbatas/premium). */
export function remainingLookups(): number {
  if (isWatchPremium()) return -1;
  return Math.max(0, FREE_LOOKUP_LIMIT - getLookedUpWords().length);
}

/**
 * Boleh buka arti kata / Analisa sekarang? Premium = selalu. Gratis = selama
 * masih ada cicip, ATAU kata itu sudah pernah dibuka (lihat ulang tak menghabiskan
 * kuota — biar tak terasa menghukum).
 */
export function canLookupWord(word?: string, langCode?: string): boolean {
  if (isWatchPremium()) return true;
  if (word && langCode && getLookedUpWords().includes(keyOf(word, langCode))) return true;
  return getLookedUpWords().length < FREE_LOOKUP_LIMIT;
}

/** Catat sebuah kata sudah dibuka artinya (menghabiskan 1 cicip kalau baru). */
export function recordWordLookup(word: string, langCode: string): void {
  if (typeof window === "undefined" || isWatchPremium()) return;
  const key = keyOf(word, langCode);
  const list = getLookedUpWords();
  if (list.includes(key)) return;
  try {
    window.localStorage.setItem(LOOKUP_KEY, JSON.stringify([...list, key].slice(0, 200)));
  } catch {
    /* penuh/diblokir — abaikan */
  }
}

// ── Riwayat kata yang di-study (localStorage) ────────────────────────────────
// Setiap kali siswa mengetuk sebuah kata di player (buka artinya), kita catat di
// sini supaya tombol AI melayang bisa menampilkan "kata yang dipilih terakhir".
// Beda dari LOOKUP_KEY (cuma kunci untuk kuota cicip & tak jalan untuk premium):
// riwayat ini SELALU dicatat + menyimpan kalimat asalnya, jadi bisa dibuka ulang
// instan (arti diambil dari cache breakdown lewat getCachedWordMeaning).
export interface StudyHistoryItem {
  word: string;
  langCode: string;
  sentence: string;
  videoId?: string;
  ts: number;
}

const STUDY_HIST_KEY = "linguo:watch:studyhist:v1";
const STUDY_HIST_MAX = 60;

/** Riwayat kata yang di-study, terbaru di depan. */
export function getStudyHistory(): StudyHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STUDY_HIST_KEY);
    const arr = raw ? (JSON.parse(raw) as StudyHistoryItem[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** Catat sebuah kata yang baru di-study. Dedup per kata+bahasa (yang lama dinaikkan
 *  ke depan), dibatasi STUDY_HIST_MAX. Kembalikan daftar terbaru. */
export function recordStudyHistory(
  item: Omit<StudyHistoryItem, "ts">
): StudyHistoryItem[] {
  if (typeof window === "undefined") return [];
  const w = cleanWord(item.word).trim();
  if (!w) return getStudyHistory();
  const rest = getStudyHistory().filter(
    (h) => keyOf(h.word, h.langCode) !== keyOf(w, item.langCode)
  );
  const next = [{ ...item, word: w, ts: Date.now() }, ...rest].slice(0, STUDY_HIST_MAX);
  try {
    window.localStorage.setItem(STUDY_HIST_KEY, JSON.stringify(next));
  } catch {
    /* penuh/diblokir — abaikan */
  }
  return next;
}

/** Kosongkan riwayat study. */
export function clearStudyHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STUDY_HIST_KEY);
  } catch {
    /* abaikan */
  }
}

// ── Paket langganan Watch & Learn ────────────────────────────────────────────
// Harga IDR untuk pasar Indonesia: 1 bulan sebagai harga impuls, makin panjang
// makin hemat (anchor tahunan). WAJIB sinkron dengan perhitungan server di
// /api/create-wl-invoice (anti-tamper).
export interface WatchPlan {
  id: "monthly" | "biannual" | "annual";
  label: string;
  months: number;
  price: number; // total IDR yang ditagih
  perMonth: number; // untuk badge "≈ x rb/bln"
  savePct?: number; // hemat vs harga bulanan
  badge?: string;
}

export const WATCH_PLANS: WatchPlan[] = [
  { id: "monthly", label: "1 Bulan", months: 1, price: 39000, perMonth: 39000 },
  {
    id: "biannual",
    label: "6 Bulan",
    months: 6,
    price: 149000,
    perMonth: Math.round(149000 / 6),
    savePct: Math.round((1 - 149000 / 6 / 39000) * 100),
  },
  {
    id: "annual",
    label: "1 Tahun",
    months: 12,
    price: 249000,
    perMonth: Math.round(249000 / 12),
    savePct: Math.round((1 - 249000 / 12 / 39000) * 100),
    badge: "Terbaik",
  },
];

export function getWatchPlan(id: string): WatchPlan | undefined {
  return WATCH_PLANS.find((p) => p.id === id);
}

/** Jumlah total kosakata tersimpan (semua bahasa) — buat badge kuota. */
export function savedWordCount(): number {
  return getSavedWords().length;
}

/** Sisa kuota simpan gratis (0 kalau habis; -1 = tak terbatas/premium). */
export function remainingSaveQuota(): number {
  if (isWatchPremium()) return -1;
  return Math.max(0, FREE_SAVE_LIMIT - savedWordCount());
}

/**
 * Boleh menyimpan kata (baru) sekarang? Premium = selalu boleh. Gratis = selama
 * masih di bawah kuota. Kata yang SUDAH tersimpan tak dihitung, jadi menyimpan
 * ulang / menghapus tetap boleh walau kuota penuh.
 */
export function canSaveWord(word?: string, langCode?: string): boolean {
  if (isWatchPremium()) return true;
  if (word && langCode && isWordSaved(word, langCode)) return true;
  return savedWordCount() < FREE_SAVE_LIMIT;
}

/** Jumlah kosakata yang disimpan sewaktu menonton sebuah video (bahasa tertentu). */
export function countSavedForVideo(videoId: string, langCode: string): number {
  if (!videoId) return 0;
  return getSavedWords().filter((w) => w.videoId === videoId && w.langCode === langCode).length;
}

export function isWordSaved(word: string, langCode: string): boolean {
  return getSavedWords().some((w) => keyOf(w.word, w.langCode) === keyOf(word, langCode));
}

export function saveWord(item: Omit<SavedWord, "ts" | "srs">): SavedWord[] {
  const list = getSavedWords().filter(
    (w) => keyOf(w.word, w.langCode) !== keyOf(item.word, item.langCode)
  );
  // Kata baru mulai dengan state SRS default (jatuh tempo langsung) → masuk sesi
  // review berikutnya.
  const next = [{ ...item, ts: Date.now(), srs: newSrsState() }, ...list].slice(0, 500);
  try {
    window.localStorage.setItem(VOCAB_KEY, JSON.stringify(next));
  } catch {
    /* penuh/diblokir — abaikan */
  }
  return next;
}

/**
 * Nilai sebuah kartu (SRS) lalu simpan state barunya ke localStorage. Balikin
 * daftar terbaru. Dipakai flashcard review — tiap nilai menjadwal ulang kartu.
 */
export function gradeSavedWord(word: string, langCode: string, grade: SrsGrade): SavedWord[] {
  const list = getSavedWords();
  const next = list.map((w) => {
    if (keyOf(w.word, w.langCode) !== keyOf(word, langCode)) return w;
    return { ...w, srs: gradeCard(w.srs ?? newSrsState(), grade) };
  });
  try {
    window.localStorage.setItem(VOCAB_KEY, JSON.stringify(next));
  } catch {
    /* abaikan */
  }
  return next;
}

export function removeSavedWord(word: string, langCode: string): SavedWord[] {
  const next = getSavedWords().filter(
    (w) => keyOf(w.word, w.langCode) !== keyOf(word, langCode)
  );
  try {
    window.localStorage.setItem(VOCAB_KEY, JSON.stringify(next));
  } catch {
    /* abaikan */
  }
  return next;
}

// Segmenter per-locale di-cache: bikin Intl.Segmenter itu mahal & splitWords
// dipanggil tiap render (karaoke + daftar transkrip).
const segmenterCache = new Map<string, Intl.Segmenter>();
function getWordSegmenter(langCode: string): Intl.Segmenter | null {
  if (typeof Intl === "undefined" || typeof Intl.Segmenter !== "function") return null;
  let seg = segmenterCache.get(langCode);
  if (!seg) {
    try {
      seg = new Intl.Segmenter(langCode || undefined, { granularity: "word" });
    } catch {
      return null;
    }
    segmenterCache.set(langCode, seg);
  }
  return seg;
}

/**
 * Pisah sebuah kalimat jadi token kata + pemisah, biar tiap kata bisa di-tap.
 * Pakai Intl.Segmenter (segmentasi berbasis kamus) supaya bahasa tanpa spasi —
 * Mandarin, Jepang, Thai, dll — terpisah PER KATA, bukan satu blok kalimat.
 * Fallback ke regex kalau Intl.Segmenter tak ada.
 */
export function splitWords(
  sentence: string,
  langCode?: string
): { text: string; isWord: boolean }[] {
  const seg = getWordSegmenter((langCode || "").split("-")[0]);
  if (seg) {
    const out: { text: string; isWord: boolean }[] = [];
    for (const s of seg.segment(sentence)) {
      if (s.segment) out.push({ text: s.segment, isWord: !!s.isWordLike });
    }
    if (out.length) return out;
  }
  // Cocokkan gugus huruf (termasuk aksara non-Latin) sebagai kata; sisanya (spasi,
  // tanda baca) sebagai pemisah yang tak bisa di-tap.
  const parts = sentence.match(/[\p{L}\p{M}\p{N}]+(?:['’-][\p{L}\p{M}\p{N}]+)*|[^\p{L}\p{M}\p{N}]+/gu);
  if (!parts) return [{ text: sentence, isWord: false }];
  return parts.map((p) => ({ text: p, isWord: /[\p{L}\p{M}\p{N}]/u.test(p) }));
}

/** Bersihkan kata dari tanda baca di ujung sebelum dikirim ke AI. */
export function cleanWord(word: string): string {
  return word.replace(/^[^\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}]+$/gu, "");
}

// ── Cari Kata (YouGlish) ─────────────────────────────────────────────────────
// Satu kemunculan kata di suatu kalimat transkrip video katalog.
export interface WordHit {
  videoId: string;
  title: string;
  channel: string | null;
  level: string | null;
  start: number; // detik kata diucapkan → seek player
  end: number | null;
  target: string; // kalimat bahasa target (kata ada di dalamnya)
  base: string | null; // terjemahan Indonesia (kalau ada)
}

/** Cari sebuah kata di seluruh transkrip katalog bahasa `lang` (lewat RPC
 *  search_cues via /api/watch-search). Kembalikan daftar kalimat contoh + detik
 *  kata diucapkan. Best-effort: gagal / <2 huruf → array kosong. */
export async function searchWordInVideos(word: string, lang: string): Promise<WordHit[]> {
  const q = word.trim();
  if (q.length < 2) return [];
  try {
    const res = await fetchTimeout(
      `/api/watch-search?q=${encodeURIComponent(q)}&lang=${encodeURIComponent(lang)}`,
      { method: "GET" },
      8000
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: unknown };
    return Array.isArray(data.results) ? (data.results as WordHit[]) : [];
  } catch {
    return [];
  }
}
