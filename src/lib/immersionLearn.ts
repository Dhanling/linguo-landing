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

// ── Segmen berbahasa penjelas (subtitle mengikuti audio) ─────────────────────
// Sebagian video belajar bahasa dituturkan CAMPUR: penutur asli menjelaskan
// bahasa target (mis. Ukraina) memakai bahasa Inggris, lalu berganti ke bahasa
// target. Transkriber (Gemini/ASR) sudah menuliskan tiap segmen APA ADANYA —
// baris Inggris tetap Inggris. Yang dulu keliru: lapisan transliterasi & analisa
// memaksa SEMUA baris ke bahasa target, jadi baris Inggris dapat romanisasi
// Ukraina yang ngawur dan analisa kata pun salah bahasa.
//
// Deteksi murni dari AKSARA, HANYA saat bahasa target NON-LATIN: baris yang
// mayoritas hurufnya Latin jelas BUKAN bahasa target → itu penjelasan, tampilkan
// apa adanya (tanpa baris transliterasi; analisa kata pakai bahasa penjelas).
// Baris beraksara target (Sirilik/Han/Arab/…) tak pernah terpicu → video satu-
// bahasa biasa berperilaku PERSIS seperti sebelumnya (nol regresi). Video tetap
// masuk kategori bahasa target di language selector (kategori tak berubah).
export function isExplanationCue(text: string, langCode: string): boolean {
  if (!isNonLatin(langCode)) return false;
  let letters = 0;
  let latin = 0;
  for (const ch of text) {
    if (!/\p{L}/u.test(ch)) continue;
    letters++;
    // ≤ U+02FF = aksara Latin (termasuk huruf Latin berdiakritik). Di atasnya =
    // Sirilik/Yunani/Han/Arab/dll = aksara bahasa target.
    if ((ch.codePointAt(0) ?? 0) <= 0x2ff) latin++;
  }
  // Ambang: minimal 4 huruf (abaikan potongan simbol/angka) & ≥70% Latin. Kalimat
  // penjelas asli (Inggris) hampir 100% Latin; kalimat target asli ~0%. Margin 0.7
  // menjaga kalimat target pendek yang kebetulan memuat nama merek/serapan Latin
  // panjang (mis. "Це мій iPhone Pro") tetap dikenali sebagai bahasa target.
  return letters >= 4 && latin / letters >= 0.7;
}

// Versi cue-aware: kalau cue membawa `lang` per-segmen (jalur ASR), pakai itu —
// bahasa cue BERBEDA dari bahasa target = segmen penjelas. Ini lebih akurat dari
// deteksi aksara & juga jalan untuk bahasa target beraksara Latin (mis. belajar
// Spanyol via Inggris). Tanpa `lang` (cache lama/caption) → jatuh ke deteksi aksara.
export function cueIsExplanation(cue: { target: string; lang?: string }, langCode: string): boolean {
  if (cue.lang) {
    return cue.lang.split("-")[0].toLowerCase() !== (langCode || "").split("-")[0].toLowerCase();
  }
  return isExplanationCue(cue.target, langCode);
}

// Bahasa untuk MENGANALISIS/menampilkan sebuah cue: kalau segmen penjelas, pakai
// bahasa cue-nya (fallback "en" — penjelas hampir selalu Inggris); selain itu
// bahasa target video.
export function cueAnalysisLang(cue: { target: string; lang?: string }, langCode: string): string {
  if (!cueIsExplanation(cue, langCode)) return langCode;
  return cue.lang ? cue.lang.split("-")[0].toLowerCase() : "en";
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
  /** Bahasa yang DIUCAPKAN di cue ini (BCP-47 base), diisi jalur ASR untuk video
   *  campur bahasa (mis. penutur menjelaskan bahasa target memakai Inggris). Kosong
   *  = cue lama/caption → jatuh ke deteksi aksara (isExplanationCue). */
  lang?: string;
  // Analisa kalimat (kelas kata + arti per kata) yang sudah di-precompute &
  // disimpan bareng transkrip → mode Analisa instan tanpa loading. Diisi oleh
  // prewarmBreakdowns() (klien) lalu di-persist ke yt_transcripts.cues[].breakdown.
  breakdown?: SentenceBreakdown;
  // Terjemahan alternatif per bahasa (selain Indonesia): kode BCP-47 → teks.
  // Cache server hanya menyimpan `base` Indonesia; kalau pengguna memilih bahasa
  // terjemahan lain, hasil terjemahannya di-persist ke sini (bareng transkrip)
  // → buka lagi dari PERANGKAT/PENGGUNA mana pun = instan, tanpa "Menerjemahkan…".
  // Sama pola dengan `breakdown`. Di-key per bahasa; Indonesia tetap pakai `base`.
  baseAlt?: Record<string, string>;
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
        // Anchor karaoke `_anc` cuma untuk runtime (karaokeFrac) — jangan ikut
        // tersimpan; ia dibangun ulang klien tiap load lewat mergeCueFragments.
        cues: cues.map((c) => {
          const copy = { ...(c as TimedCue) };
          delete copy._anc;
          return copy;
        }),
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
 * Terjemahan alternatif yang SUDAH tersimpan bareng transkrip (cue.baseAlt) untuk
 * bahasa `baseCode`. Balikin array `base` selaras `cues` kalau SEMUA cue punya
 * terjemahannya — ini yang membuat pindah ke Inggris (dst.) INSTAN, tanpa jaringan
 * maupun kedip "Menerjemahkan…". Kalau ada yang bolong → null (jatuh ke terjemah AI).
 */
export function baseAltFromCues(cues: LearnCue[], baseCode: string): string[] | null {
  if (!cues.length) return null;
  const out: string[] = [];
  for (const c of cues) {
    const v = c.baseAlt?.[baseCode];
    if (typeof v !== "string" || !v.trim()) return null;
    out.push(v);
  }
  return out;
}

/**
 * Persist terjemahan (bahasa non-Indonesia) ke cache transkrip server, di-key per
 * teks target — sama pola dengan breakdown. Sekali seorang penonton menerjemahkan
 * sebuah video ke Inggris, penonton berikutnya (perangkat/akun mana pun) langsung
 * dapat versi Inggris bareng transkrip → instan. Fire-and-forget best-effort.
 */
function saveBaseAltCache(
  videoId: string,
  langCode: string,
  baseCode: string,
  cues: LearnCue[],
  bases: string[]
): void {
  if (baseCode === DEFAULT_BASE_LANG) return;
  if (cues.length !== bases.length) return;
  // target → terjemahan (buang yang kosong). Cue kembar berbagi terjemahan yang
  // sama (terjemahan = fungsi murni dari target+bahasa), jadi aman di-key per target.
  const byTarget: Record<string, string> = {};
  for (let i = 0; i < cues.length; i++) {
    const t = cues[i].target;
    const b = bases[i];
    if (typeof t === "string" && t && typeof b === "string" && b.trim()) byTarget[t] = b;
  }
  if (!Object.keys(byTarget).length) return;
  try {
    void fetch("/api/yt-transcript-cache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, lang: langCode, baseCode, baseAlt: byTarget }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* abaikan */
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

  // 0) Sudah tersimpan bareng transkrip (server, lintas perangkat/pengguna) → instan.
  const preloaded = baseAltFromCues(cues, baseCode);
  if (preloaded) return preloaded;

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
    // Simpan juga BARENG transkrip (server) → penonton berikutnya dapat versi ini
    // instan, tanpa terjemah ulang. Fire-and-forget, tak menahan hasil.
    saveBaseAltCache(videoId, langCode, baseCode, cues, bases);
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
 * [watch-karaoke-anchor-v2] Fraksi karakter target (0..1) yang sudah terucap pada
 * detik `time` — KEBALIKAN interpTime. Cue gabungan beberapa window caption membawa
 * anchor batas window ASLI video → sapuan karaoke mengikuti timing sebenarnya
 * (menempel ke audio, seirama caption bawaan video), bukan rata linear per karakter
 * yang melenceng saat tempo ucapan tak rata (lagu, jeda napas panjang).
 * Cue tanpa anchor tetap linear seperti sebelumnya.
 */
export function karaokeFrac(cue: LearnCue, time: number): number {
  const { start, end } = cue;
  const anc = (cue as TimedCue)._anc;
  if (!anc?.length) {
    const dur = Math.max(0.4, end - start);
    return Math.min(1, Math.max(0, (time - start) / dur));
  }
  const total = cue.target.length || 1;
  // Titik kontrol (detik → fraksi-karakter), dijaga monotonic naik dua arah.
  const pts: Array<[number, number]> = [[start, 0]];
  for (const [c, t] of anc) {
    const last = pts[pts.length - 1];
    pts.push([Math.max(last[0], Math.min(end, t)), Math.max(last[1], Math.min(1, c / total))]);
  }
  pts.push([Math.max(pts[pts.length - 1][0], end), 1]);
  if (time <= start) return 0;
  for (let i = 1; i < pts.length; i++) {
    const [t0, f0] = pts[i - 1];
    const [t1, f1] = pts[i];
    if (time <= t1) return t1 <= t0 ? f1 : f0 + (f1 - f0) * ((time - t0) / (t1 - t0));
  }
  return 1;
}

/**
 * Turunkan anchor parent yang jatuh DI DALAM potongan anak (rentang karakter
 * aStart..aEnd pada ruang acc/total pemanggil) — offset di-rebase ke anak, hanya
 * anchor yang waktunya juga di dalam window anak. Biar potongan yang MASIH
 * menyeberang beberapa window caption asli tetap membawa timing sebenarnya
 * untuk sapuan karaoke (karaokeFrac), bukan cuma batas potongannya.
 */
function inheritAnc(parent: LearnCue, child: LearnCue, aStart: number, aEnd: number): LearnCue {
  const anc = (parent as TimedCue)._anc;
  if (anc?.length) {
    const out = anc
      .filter(([c, t]) => c > aStart && c < aEnd && t > child.start && t < child.end)
      .map(([c, t]) => [c - aStart, t] as [number, number]);
    if (out.length) (child as TimedCue)._anc = out;
  }
  return child;
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
function splitCueBySentence(cue: LearnCue, langCode: string): LearnCue[] {
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
    if (bases && bases.length > 1) return splitByBasePieces(cue, bases, langCode);
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
    const aStart = acc;
    const start = interpTime(cue, acc, total);
    acc += tg.length;
    const end = i === tgt.length - 1 ? cue.end : interpTime(cue, acc, total);
    return inheritAnc(
      cue,
      {
        start,
        end: Math.max(end, start + 0.3),
        target: tg,
        base: bas ? bas[i] ?? "" : "",
        ...(tr ? { translit: tr[i] ?? "" } : {}),
      },
      aStart,
      acc
    );
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
    const aStart = acc;
    const start = interpTime(cue, acc, total);
    acc += weights[g];
    const end = g === targetGroups.length - 1 ? cue.end : interpTime(cue, acc, total);
    return inheritAnc(
      cue,
      {
        start,
        end: Math.max(end, start + 0.3),
        target: tg,
        base: baseGroups ? baseGroups[g] ?? "" : "",
        ...(translitGroups ? { translit: translitGroups[g] ?? "" } : {}),
      },
      aStart,
      acc
    );
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

// Klausa lebih pendek dari ini dianggap REMAH: disatukan ke klausa tetangga
// sebelum dijadikan section. Batas 40% MAX_CUE_CHARS — cukup memberi ruang untuk
// klausa pendek yang sah ("kata dia,"), tapi menyapu remah 2–3 kata.
const MIN_CLAUSE_CHARS = Math.round(MAX_CUE_CHARS * 0.4);

/**
 * Satukan klausa remah (< MIN_CLAUSE_CHARS) ke klausa SESUDAHNYA — atau ke
 * sebelumnya kalau ia yang terakhir. Urutan teks tak berubah, cuma batas
 * potongnya yang digeser.
 */
function mergeTinyClauses(pieces: string[]): string[] {
  const out: string[] = [];
  let carry = "";
  pieces.forEach((p, i) => {
    const t = [carry, p.trim()].filter(Boolean).join(" ");
    if (t.length < MIN_CLAUSE_CHARS && i < pieces.length - 1) {
      carry = t; // masih remah → gabung ke klausa berikutnya
      return;
    }
    carry = "";
    if (t.length < MIN_CLAUSE_CHARS && out.length) out[out.length - 1] += " " + t;
    else if (t) out.push(t);
  });
  if (carry) {
    if (out.length) out[out.length - 1] += " " + carry;
    else out.push(carry);
  }
  return out.length ? out : pieces;
}

// ── Anti-section menggantung ─────────────────────────────────────────────────
// [watch-no-dangling-v1] Section tak boleh BERAKHIR dengan kata penghubung —
// kopula/to-be, kata bantu, artikel, preposisi, atau kata sambung. Kata-kata itu
// MEMBUKA bagian berikutnya, jadi kalau ia menutup section, pembaca ditinggal
// menggantung: "…to step up to the challenge | is richie now richie is…".
//
// Kenapa bisa terjadi: transkrip auto-caption datang TANPA tanda baca, jadi batas
// section diambil dari potongan `base` (terjemahan) lalu target dibagi per-KATA
// secara proporsional (splitByBasePieces) — batas kata itu buta tata bahasa. Fungsi
// di bawah menggeser batasnya satu-dua kata: kata penghubung yang menutup section
// dipindah ke AWAL section berikutnya. Urutan teks tak berubah, timing ikut geser
// (dihitung ulang dari panjang teks oleh pemanggil).
//
// Per BAHASA (bukan satu daftar global): "a" artikel di Inggris tapi preposisi di
// Spanyol, "is" kopula Inggris tapi bukan apa-apa di Belanda — daftar campur bikin
// salah potong di bahasa lain. Bahasa yang tak terdaftar dilewati (aman).
const DANGLING_TAIL_WORDS: Record<string, string[]> = {
  en: ["is", "are", "was", "were", "am", "be", "been", "being", "has", "have", "had", "do", "does", "did", "will", "would", "shall", "should", "can", "could", "may", "might", "must", "a", "an", "the", "of", "to", "in", "on", "at", "for", "with", "from", "by", "about", "into", "over", "as", "and", "but", "or", "so", "that", "which", "who", "because", "if", "when", "while", "my", "your", "his", "her", "its", "our", "their", "this", "these", "those"],
  id: ["adalah", "ialah", "merupakan", "yaitu", "yakni", "yang", "dan", "atau", "tapi", "tetapi", "karena", "untuk", "dengan", "dari", "ke", "di", "pada", "oleh", "kalau", "jika", "ketika", "saat", "sebuah", "para", "sang", "akan", "sudah", "telah", "sedang", "bisa", "dapat", "harus", "lebih", "paling"],
  ms: ["adalah", "ialah", "merupakan", "iaitu", "yang", "dan", "atau", "tetapi", "kerana", "untuk", "dengan", "dari", "ke", "di", "pada", "oleh", "kalau", "jika", "ketika", "akan", "sudah", "telah", "sedang", "boleh", "harus"],
  es: ["es", "son", "era", "eran", "está", "están", "ha", "han", "he", "hay", "ser", "estar", "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "a", "al", "en", "con", "por", "para", "sin", "sobre", "y", "e", "o", "u", "pero", "que", "porque", "si", "cuando", "mi", "tu", "su", "este", "esta", "muy", "más"],
  pt: ["é", "são", "era", "eram", "está", "estão", "tem", "têm", "ser", "estar", "o", "a", "os", "as", "um", "uma", "de", "do", "da", "dos", "das", "em", "no", "na", "com", "por", "para", "sem", "sobre", "e", "ou", "mas", "que", "porque", "se", "quando", "meu", "seu", "muito", "mais"],
  fr: ["est", "sont", "était", "étaient", "a", "ont", "ai", "être", "avoir", "le", "la", "les", "un", "une", "des", "du", "de", "à", "au", "aux", "en", "dans", "avec", "par", "pour", "sans", "sur", "et", "ou", "mais", "que", "qui", "parce", "si", "quand", "mon", "ton", "son", "ce", "cette", "très", "plus"],
  de: ["ist", "sind", "war", "waren", "bin", "bist", "sein", "hat", "haben", "hatte", "wird", "werden", "kann", "können", "muss", "müssen", "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer", "von", "zu", "in", "an", "auf", "mit", "für", "ohne", "über", "und", "oder", "aber", "dass", "weil", "wenn", "als", "mein", "dein", "sehr"],
  it: ["è", "sono", "era", "erano", "ha", "hanno", "essere", "avere", "il", "lo", "la", "i", "gli", "le", "un", "uno", "una", "di", "del", "della", "a", "al", "in", "nel", "con", "per", "senza", "su", "e", "ed", "o", "ma", "che", "perché", "se", "quando", "mio", "tuo", "suo", "molto", "più"],
  nl: ["is", "zijn", "was", "waren", "ben", "heeft", "hebben", "had", "wordt", "worden", "kan", "kunnen", "moet", "de", "het", "een", "van", "te", "in", "op", "aan", "met", "voor", "zonder", "over", "en", "of", "maar", "dat", "omdat", "als", "toen", "mijn", "jouw", "zeer", "heel"],
  tr: ["bir", "bu", "şu", "ve", "veya", "ama", "fakat", "çünkü", "eğer", "için", "ile", "gibi", "kadar", "daha", "en", "çok"],
  vi: ["là", "và", "hoặc", "nhưng", "vì", "nên", "của", "cho", "với", "từ", "đến", "trong", "trên", "một", "các", "những", "rất"],
  pl: ["jest", "są", "był", "była", "byli", "ma", "mają", "będzie", "i", "a", "ale", "albo", "lub", "oraz", "bo", "ponieważ", "że", "żeby", "jeśli", "kiedy", "gdy", "w", "na", "do", "od", "z", "ze", "o", "po", "przez", "dla", "bardzo"],
  ru: ["и", "а", "но", "или", "что", "чтобы", "если", "когда", "потому", "в", "на", "с", "со", "к", "по", "из", "от", "для", "о", "об", "при", "это", "очень", "мой", "твой", "его", "её", "их"],
  uk: ["і", "й", "та", "а", "але", "або", "що", "щоб", "якщо", "коли", "бо", "в", "у", "на", "з", "із", "до", "від", "по", "для", "про", "при", "це", "дуже"],
  fil: ["ay", "ang", "ng", "sa", "na", "at", "o", "ni", "kay", "mga", "para", "kung", "dahil", "pero", "ngunit", "napaka"],
  tl: ["ay", "ang", "ng", "sa", "na", "at", "o", "ni", "kay", "mga", "para", "kung", "dahil", "pero", "ngunit", "napaka"],
  fi: ["ja", "sekä", "tai", "vai", "mutta", "vaan", "koska", "sillä", "että", "kun", "jos", "vaikka", "joten", "jotta", "joka", "mikä", "on", "ovat", "oli", "olivat", "olla", "hyvin", "todella"],
  hi: ["और", "या", "लेकिन", "क्योंकि", "कि", "जब", "अगर", "का", "की", "के", "को", "से", "में", "पर", "है", "हैं", "था", "थे", "एक", "बहुत"],
  ar: ["و", "أو", "لكن", "لأن", "أن", "إن", "في", "على", "من", "إلى", "عن", "مع", "هذا", "هذه"],
  ko: ["그리고", "하지만", "그런데", "그래서", "왜냐하면", "또", "매우", "아주"],
  bg: ["и", "а", "но", "или", "защото", "понеже", "макар", "докато", "когато", "затова", "е", "са", "беше", "в", "на", "с", "за", "от", "до", "по", "при", "много"],
};
// Maksimum kata yang boleh berpindah dari satu section. Rem: kalau lebih dari ini,
// batasnya memang jauh salah tempat & menggeser terus cuma memindahkan masalah.
const DANGLING_MAX_MOVE = 3;
// Section sumber wajib menyisakan minimal segini kata — jangan sampai memperbaiki
// ujungnya malah menghasilkan baris kerdil 1 kata.
const DANGLING_MIN_KEEP_WORDS = 2;

const bareWord = (w: string) => w.toLowerCase().replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, "");

/**
 * Geser kata penghubung yang MENUTUP sebuah potongan ke AWAL potongan berikutnya.
 * Beroperasi di batas kata (bahasa berspasi saja); bahasa tanpa spasi
 * (Jepang/Mandarin/Thai) dilewati karena "kata terakhir" tak terdefinisi di sana.
 */
function fixDanglingTails(pieces: string[], langCode: string): string[] {
  if (pieces.length < 2) return pieces;
  const list = DANGLING_TAIL_WORDS[(langCode || "").split("-")[0].toLowerCase()];
  if (!list?.length) return pieces;
  const dangling = new Set(list);
  const words = pieces.map((p) => p.trim().split(/\s+/).filter(Boolean));
  for (let i = 0; i < words.length - 1; i++) {
    let moved = 0;
    while (
      moved < DANGLING_MAX_MOVE &&
      words[i].length > DANGLING_MIN_KEEP_WORDS &&
      dangling.has(bareWord(words[i][words[i].length - 1]))
    ) {
      words[i + 1].unshift(words[i].pop() as string);
      moved++;
    }
  }
  return words.map((w) => w.join(" "));
}

/**
 * Pecah cue TANPA terjemahan/translit (ASR/caption mentah) di batas KLAUSA (tanda
 * baca + kata sambung) untuk keterbacaan — aman karena tak ada pasangan arti yang
 * bisa salah geser.
 */
function splitCueClausesNoBase(cue: LearnCue, langCode: string): LearnCue[] {
  const targets = splitClauses(cue.target);
  if (targets.length <= 1) return [cue];
  const groups = greedyGroups(targets);
  if (groups.length <= 1) return [cue];
  const targetGroups = fixDanglingTails(
    groups.map((idx) => idx.map((i) => targets[i]).join(" ").trim()),
    langCode
  );
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
function splitLongCue(cue: LearnCue, langCode: string): LearnCue[] {
  if (cue.target.trim().length <= MAX_CUE_CHARS) return [cue];
  if (!cue.base && !cue.translit) return splitCueClausesNoBase(cue, langCode);

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
      // Klausa remah (mis. "hari ini aku") disatukan dulu ke tetangganya: potongan
      // sependek itu jadi section sendiri hanya bikin baris kerdil yang pasangan
      // target-nya pasti meleset. Kalau setelah disatukan tinggal satu potongan,
      // cue dibiarkan UTUH — satu baris agak panjang tapi artinya PAS.
      const baseClauses = mergeTinyClauses(splitClauses(cue.base ?? ""));
      if (baseClauses.length > 1) {
        const groups = greedyGroups(baseClauses).map((idx) =>
          idx.map((i) => baseClauses[i]).join(" ").trim()
        );
        if (groups.length > 1) return splitByBasePieces(cue, groups, langCode);
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
 * [watch-base-driven-split-v2] Sama seperti distributeUnits, TAPI porsi tiap
 * potongan SEBANDING `weights` (panjang potongan base pasangannya) — bukan rata.
 *
 * Kenapa perlu: pembagian rata memasangkan potongan base yang panjangnya jauh
 * berbeda ke potongan target yang sama besar. Kasus nyata (ASR Inggris tanpa
 * tanda baca): base terpecah jadi "hari ini aku" (12 huruf) + sisa kalimat (130
 * huruf), tapi target dibagi DUA SAMA RATA → baris pertama menampilkan setengah
 * kalimat Inggris dengan terjemahan cuma "hari ini aku". Dengan bobot, porsi
 * target ikut proporsi base-nya, jadi pasangannya masuk akal.
 */
function distributeUnitsWeighted(text: string, weights: number[]): string[] {
  const n = weights.length;
  const t = text.trim();
  if (n <= 1) return [t];
  const total = weights.reduce((s, w) => s + Math.max(0, w), 0);
  if (total <= 0) return distributeUnits(t, n);
  const words = t.split(/\s+/).filter(Boolean);
  const perWord = words.length >= n;
  const units = perWord ? words : Array.from(t);
  if (units.length < n) return distributeUnits(t, n);
  const out: string[] = [];
  let acc = 0;
  let used = 0;
  for (let i = 0; i < n; i++) {
    acc += Math.max(0, weights[i]);
    // Sisakan minimal 1 unit untuk tiap grup sesudahnya → tak ada baris kosong.
    const ideal = Math.round((acc / total) * units.length);
    const to =
      i === n - 1
        ? units.length
        : Math.min(units.length - (n - 1 - i), Math.max(used + 1, ideal));
    out.push(units.slice(used, to).join(perWord ? " " : "").trim());
    used = to;
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
function splitByBasePieces(cue: LearnCue, basePieces: string[], langCode: string): LearnCue[] {
  const n = basePieces.length;
  if (n <= 1) return [cue];
  // Bobot = panjang tiap potongan base → target & translit dibagi SEBANDING arti
  // yang dipasangkan padanya, bukan rata (lihat distributeUnitsWeighted).
  const weights = basePieces.map((b) => b.trim().length);
  const tr = cue.translit ? distributeUnitsWeighted(cue.translit, weights) : null;
  // [watch-no-dangling-v1] Batas per-kata di sini buta tata bahasa → rapikan
  // ujungnya biar section tak berhenti di "…is"/"…yang"/"…de". Dilewati kalau cue
  // punya transliterasi: translit dibagi dengan bobot yang sama, jadi menggeser
  // kata target saja akan membuat bacaan Latinnya meleset satu kata.
  const rawTgt = distributeUnitsWeighted(cue.target, weights);
  const tgt = tr ? rawTgt : fixDanglingTails(rawTgt, langCode);
  const total = tgt.reduce((sum, s) => sum + s.length, 0) || 1;
  let acc = 0;
  return basePieces.map((b, i) => {
    const aStart = acc;
    const start = interpTime(cue, acc, total);
    acc += tgt[i].length;
    const end = i === n - 1 ? cue.end : interpTime(cue, acc, total);
    return inheritAnc(
      cue,
      {
        start,
        end: Math.max(end, start + 0.3),
        target: tgt[i] ?? "",
        base: b,
        ...(tr ? { translit: tr[i] ?? "" } : {}),
      },
      aStart,
      acc
    );
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
function splitCueByWords(cue: LearnCue, langCode: string): LearnCue[] {
  if (cue.target.trim().length <= MAX_CUE_CHARS) return [cue];
  // Pemecahan per-KATA tak bisa memasangkan target↔base↔translit dengan benar
  // (urutan & jumlah kata beda antar bahasa → terjemahan/bacaan Latin salah geser,
  // mis. Arab: baris "baytan" tapi bacaannya "fa-ṣnaʿū yā aḥbābī baytan"). Jadi
  // kalau cue SUDAH bawa terjemahan/transliterasi, biarkan utuh (satu baris agak
  // panjang tapi PASANGANNYA BENAR) — lebih baik daripada sinkron yang meleset.
  // Pemecahan per-kata hanya untuk cue mentah tanpa apa pun yang bisa salah pasang.
  if (cue.base || cue.translit) return [cue];
  const targets = fixDanglingTails(chunkWords(cue.target, MAX_CUE_CHARS), langCode);
  if (targets.length <= 1) return [cue];
  const bases = cue.base ? distributeWords(cue.base, targets.length) : null;
  const translits = cue.translit ? distributeWords(cue.translit, targets.length) : null;

  const total = targets.reduce((n, s) => n + s.length, 0) || 1;
  let acc = 0;
  return targets.map((tg, i) => {
    const aStart = acc;
    const start = interpTime(cue, acc, total);
    acc += tg.length;
    const end = i === targets.length - 1 ? cue.end : interpTime(cue, acc, total);
    return inheritAnc(
      cue,
      {
        start,
        end: Math.max(end, start + 0.3),
        target: tg,
        base: bases ? bases[i] : "",
        ...(translits ? { translit: translits[i] } : {}),
      },
      aStart,
      acc
    );
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
function splitCuesBySentence(cues: LearnCue[], langCode: string): LearnCue[] {
  return mergeCueFragments(cues)
    .flatMap((c) => splitCueBySentence(c, langCode))
    .flatMap((c) => splitLongCue(c, langCode))
    .flatMap((c) => splitCueByWords(c, langCode))
    // Rapikan field per cue. Anchor `_anc` IKUT dipertahankan — dipakai karaokeFrac
    // di player biar sapuan menempel ke timing window caption asli; ia dibuang saat
    // tulis cache (saveTranscriptCache) supaya format simpanan tak berubah.
    .map((c) => {
      const { start, end, target, base, translit } = c;
      const out: LearnCue = translit
        ? { start, end, target, base, translit }
        : { start, end, target, base };
      const anc = (c as TimedCue)._anc;
      if (anc?.length) (out as TimedCue)._anc = anc;
      // Bawa serta analisa & terjemahan alternatif yang tersimpan bareng transkrip
      // → mode Analisa & pindah bahasa terjemahan (mis. Inggris) tetap instan.
      // Aman: untuk cache yang sudah terpecah per-kalimat (kasus umum), langkah split
      // di atas idempoten sehingga target tak berubah → field ini tetap selaras.
      if (c.breakdown) out.breakdown = c.breakdown;
      if (c.baseAlt) out.baseAlt = c.baseAlt;
      return out;
    });
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
    return { cues: splitCuesBySentence(cached, langCode), reason: "ok" };
  }

  // cacheOnly: transkripsi kini dilakukan SERVER (kurasi admin + tombol "Minta"),
  // BUKAN di browser saat buka video (hemat & terkontrol). Kalau belum ada di
  // cache, jangan picu caption/ASR — beri tahu pemanggil biar tampilkan "Minta".
  if (opts?.cacheOnly) return { cues: [], reason: "not_ready" };

  // 1) Jalur cepat: cue mentah dari server Next + terjemahan.
  const raw = await fetchRawCuesFromServer(videoId, langCode);
  if (raw.cues.length) {
    const cues = await translateCues(raw.cues, raw.trackLang, langCode);
    const out = splitCuesBySentence(cues, langCode);
    saveTranscriptCache(videoId, langCode, out, "caption", opts?.meta);
    return { cues: out, reason: "ok" };
  }

  // 2) Jalur andal: transkripsi audio AI.
  opts?.onAsr?.();
  const asr = await fetchAsrTranscript(videoId, langCode);
  if (asr.length) {
    const out = splitCuesBySentence(asr, langCode);
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
 * Ambil jumlah video "Siap" per bahasa (kode → jumlah) — sumber badge di pemilih
 * bahasa. Instan (baca cache Supabase), best-effort: balikin {} kalau gagal.
 */
export async function fetchReadyCounts(): Promise<Record<string, number>> {
  try {
    const res = await fetchTimeout(`/api/yt-transcript-cache?counts=1`, { method: "GET" }, 6000);
    if (!res.ok) return {};
    const data = (await res.json()) as { counts?: unknown };
    if (!data.counts || typeof data.counts !== "object") return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(data.counts as Record<string, unknown>)) {
      if (typeof v === "number" && Number.isFinite(v) && v > 0) out[k] = v;
    }
    return out;
  } catch {
    return {};
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
  /** Bahasa terjemahan/penjelasan (kode BASE_LANGS) — default Indonesia. */
  baseCode?: string;
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
      // Ikut bahasa terjemahan yang dipilih pengguna ("kamu bicara bahasa apa?") —
      // arti per-kata & penjelasan keluar dalam bahasa itu, bukan selalu Indonesia.
      explanationLanguage: getBaseLangDef(params.baseCode ?? DEFAULT_BASE_LANG).name,
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
  /** Bahasa arti/penjelasan — default Indonesia. */
  baseCode?: string;
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
  /** Bahasa penjelasan — default Indonesia. */
  baseCode?: string;
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
  // Bahasa penjelasan (kode BASE_LANGS) — materi ditulis dalam bahasa ini.
  baseCode?: string;
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
  // Bahasa jawaban (kode BASE_LANGS) — jawaban ditulis dalam bahasa ini.
  baseCode?: string;
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

// ── Belajar mendalami KALIMAT (tombol AI melayang) ───────────────────────────
// Sama backend /api/word-deep tapi `kind: "sentence"`: subjeknya satu kalimat
// utuh yang sedang tayang di video. overview = kartu analisa (arti keseluruhan +
// struktur/tata bahasa + nada + pecahan bermakna); ask = tanya-jawab lanjutan.

/** Satu pecahan bermakna dari kalimat (kata/frasa) dengan peran & artinya. */
export interface SentenceChunk {
  part: string; // potongan bahasa target
  tl?: string; // bacaan Latin (bahasa non-Latin)
  role: string; // label peran tata bahasa singkat (mis. "subjek", "kata kerja")
  gloss: string; // arti potongan ini dalam bahasa penjelasan
}

export interface SentenceDeepDive {
  translation: string; // arti keseluruhan kalimat
  literal: string; // gloss lebih harfiah (kosong bila tak beda berguna)
  grammar: string; // penjelasan struktur/tata bahasa
  tone: string; // nada/register kalimat (kosong bila datar)
  chunks: SentenceChunk[]; // pecahan bermakna berurutan
  terms: string[]; // istilah tata bahasa baru → chip "Apa itu …?"
  // [watch-sentence-followup-grammar-v1] 3 pertanyaan lanjutan yang menempel pada
  // tata bahasa kalimat ini (konstruksi/pola/tense-nya) — menggantikan chip generik.
  followups: string[];
}

/** Ambil kartu analisa mendalam untuk sebuah kalimat (arti, struktur, pecahan). */
export async function getSentenceDeepDive(params: {
  sentence: string;
  langCode: string;
  baseCode?: string;
}): Promise<SentenceDeepDive> {
  const res = await fetch("/api/word-deep", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, kind: "sentence", mode: "overview" }),
  });
  if (!res.ok) throw new Error(`word-deep gagal (${res.status})`);
  const data = (await res.json()) as Partial<SentenceDeepDive> & { error?: string };
  if (data.error) throw new Error(data.error);
  return {
    translation: data.translation ?? "",
    literal: data.literal ?? "",
    grammar: data.grammar ?? "",
    tone: data.tone ?? "",
    chunks: Array.isArray(data.chunks) ? data.chunks : [],
    terms: Array.isArray(data.terms) ? data.terms.filter((t) => typeof t === "string" && t.trim()) : [],
    followups: Array.isArray(data.followups)
      ? data.followups
          .filter((q): q is string => typeof q === "string" && q.trim().length > 0)
          .map((q) => q.trim())
          .slice(0, 3)
      : [],
  };
}

/** Tanya-jawab lanjutan bebas tentang sebuah kalimat (arti, grammar, dll). */
export async function askSentenceQuestion(params: {
  sentence: string;
  langCode: string;
  question: string;
  baseCode?: string;
}): Promise<WordAnswer> {
  const res = await fetch("/api/word-deep", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, kind: "sentence", mode: "ask" }),
  });
  if (!res.ok) throw new Error(`word-deep gagal (${res.status})`);
  const data = (await res.json()) as {
    answer?: string;
    followups?: unknown[];
    error?: string;
  };
  if (data.error) throw new Error(data.error);
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
  return { answer: (data.answer ?? "").trim(), followups };
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

function breakdownCacheKey(sentence: string, langCode: string, baseCode: string): string {
  let h = 5381;
  // Cache di-key juga per bahasa terjemahan (gloss keluar dalam bahasa itu).
  // Format lama (tanpa baseCode) dipertahankan untuk Indonesia supaya cache yang
  // sudah ada di perangkat pengguna tetap valid.
  const s =
    baseCode === DEFAULT_BASE_LANG
      ? `${langCode}|${sentence}`
      : `${langCode}|${baseCode}|${sentence}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return BREAKDOWN_CACHE_PREFIX + (h >>> 0).toString(36);
}

function readBreakdownCache(
  sentence: string,
  langCode: string,
  baseCode: string
): SentenceBreakdown | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(breakdownCacheKey(sentence, langCode, baseCode));
    if (!v) return null;
    const bd = JSON.parse(v) as SentenceBreakdown;
    // Cache versi lawas (belum ada arti per-kata / partikel belum dikosongkan) →
    // anggap tak ada supaya dihitung ulang dengan aturan terbaru.
    return isFreshBreakdown(bd) && Array.isArray(bd?.tokens) && bd.tokens.length ? bd : null;
  } catch {
    return null;
  }
}

function writeBreakdownCache(
  sentence: string,
  langCode: string,
  baseCode: string,
  bd: SentenceBreakdown
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(breakdownCacheKey(sentence, langCode, baseCode), JSON.stringify(bd));
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
  // Breakdown bawaan transkrip (cache server) selalu berbahasa Indonesia → tulis
  // ke slot cache Indonesia; bahasa terjemahan lain dihitung terpisah.
  writeBreakdownCache(sentence.trim(), langCode, DEFAULT_BASE_LANG, bd);
}

const breakdownInFlight = new Map<string, Promise<SentenceBreakdown>>();

async function fetchSentenceBreakdown(
  sentence: string,
  langCode: string,
  baseCode: string
): Promise<SentenceBreakdown> {
  const raw = await callWordInfo({
    word: sentence,
    sentence,
    mode: "breakdown",
    langCode,
    baseCode,
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
  /** Bahasa arti per-kata & terjemahan — default Indonesia. */
  baseCode?: string;
}): Promise<SentenceBreakdown> {
  const sentence = params.sentence.trim();
  const baseCode = params.baseCode ?? DEFAULT_BASE_LANG;
  const cached = readBreakdownCache(sentence, params.langCode, baseCode);
  if (cached) return cached;
  const key = breakdownCacheKey(sentence, params.langCode, baseCode);
  const inflight = breakdownInFlight.get(key);
  if (inflight) return inflight;
  const p = fetchSentenceBreakdown(sentence, params.langCode, baseCode)
    .then((bd) => {
      writeBreakdownCache(sentence, params.langCode, baseCode, bd);
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
  /** Bahasa arti per-kata — default Indonesia. */
  baseCode?: string;
  sentences: string[];
  onOne?: (sentence: string, bd: SentenceBreakdown) => void;
  isCancelled?: () => boolean;
}): Promise<void> {
  const { videoId, langCode, onOne, isCancelled } = params;
  const baseCode = params.baseCode ?? DEFAULT_BASE_LANG;
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
      const cached = readBreakdownCache(sentence, langCode, baseCode);
      if (cached) {
        onOne?.(sentence, cached);
        continue;
      }
      try {
        const bd = await getSentenceBreakdown({ sentence, langCode, baseCode });
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
  // Cache transkrip bersama di server SELALU Indonesia — jangan cemari dengan
  // breakdown bahasa lain (hasil bahasa lain cukup di cache lokal perangkat).
  if (baseCode !== DEFAULT_BASE_LANG) return;
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

// Hasil penjajaran satu baris: `groups` = penjajaran halus per-kata (buat hover),
// `expr` = rentang indeks kata TARGET (ordinal isWord) yang membentuk satu EKSPRESI
// idiomatik ("We're good" → [0,1], "look forward to" → [2,3,4]) yang sebaiknya dibaca
// & disorot sebagai SATU unit. Kedua sinyal INDEPENDEN: satu kata bisa jadi grup hover
// kecil sendiri sekaligus anggota satu `expr` besar. `expr` selalu ada (kosong = tak ada
// ekspresi); rentangnya kontigu, urut, & tak tumpang tindih.
export interface AlignResult {
  groups: AlignGroup[];
  expr: number[][];
}

// v3: penjajaran sekarang DETERMINISTIK & halus per-kata. Edge function word-info
// mode "align" dulu pakai temperature default (acak: baris yang sama bisa dapat grup
// beda tiap panggilan) TANPA schema — model kerap melebur satu klausa jadi SATU grup,
// jadi hover satu kata menyorot seluruh baris (tak sinkron dgn artinya). Sekarang:
// temperature 0 + JSON schema + thinkingBudget → grup sekecil mungkin (1 kata ↔ 1 arti,
// artikel yang jatuh dapat "b":[]). Naikkan versi biar cache v2 yang kasar di-ambil ulang.
// v4: align juga mengembalikan `x` (rentang EKSPRESI idiomatik → highlight 1 unit).
// Cache lama (v3) hanya menyimpan grup tanpa ekspresi → naikkan versi biar di-ambil
// ulang & ikut dapat ekspresi. Bentuk cache berubah: dulu AlignGroup[], kini AlignResult.
// v5: prompt align kini KONTEKSTUAL — kontraksi/frasa-set ("Let's" ↔ "ayo kita",
// "you're in" ↔ "kamu ikut") digabung jadi satu grup/ekspresi & semua padanan satu
// kata dikumpulkan (tak lagi tercecer di grup ganda). Naikkan versi biar hasil lama
// yang kasar di-ambil ulang dengan penjajaran baru.
const ALIGN_CACHE_PREFIX = "linguo:watch:align:v5:";

function alignCacheKey(target: string, base: string): string {
  // Hash ringkas & stabil (djb2) dari pasangan target|base — cukup untuk kunci cache.
  let h = 5381;
  const s = `${target} ${base}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return ALIGN_CACHE_PREFIX + (h >>> 0).toString(36);
}

function readAlignCache(target: string, base: string): AlignResult | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(alignCacheKey(target, base));
    if (!v) return null;
    const parsed = JSON.parse(v) as Partial<AlignResult>;
    if (!Array.isArray(parsed?.groups)) return null;
    return { groups: parsed.groups, expr: Array.isArray(parsed.expr) ? parsed.expr : [] };
  } catch {
    return null;
  }
}

function writeAlignCache(target: string, base: string, result: AlignResult): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(alignCacheKey(target, base), JSON.stringify(result));
  } catch {
    /* kuota penuh → abaikan */
  }
}

const alignInFlight = new Map<string, Promise<AlignResult>>();

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
}): Promise<AlignResult> {
  const { target, base, langCode, baseCode } = params;
  const EMPTY: AlignResult = { groups: [], expr: [] };
  if (!target.trim() || !base.trim()) return EMPTY;
  const cached = readAlignCache(target, base);
  if (cached) return cached;

  const ck = alignCacheKey(target, base);
  const existing = alignInFlight.get(ck);
  if (existing) return existing;

  const run = (async (): Promise<AlignResult> => {
    const targetTokens = splitWords(target, langCode).filter((w) => w.isWord).map((w) => w.text);
    const baseTokens = splitWords(base, baseCode).filter((w) => w.isWord).map((w) => w.text);
    if (targetTokens.length === 0 || baseTokens.length === 0) return EMPTY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return EMPTY;
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
    if (!res.ok) return EMPTY;
    const data = (await res.json()) as { text?: string };
    const raw = data.text ?? "";
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) return EMPTY;
    let parsed: { g?: unknown; x?: unknown };
    try {
      parsed = JSON.parse(raw.slice(start, end + 1)) as { g?: unknown; x?: unknown };
    } catch {
      return EMPTY;
    }
    const tn = targetTokens.length;
    const bn = baseTokens.length;
    const clean = (v: unknown, max: number): number[] =>
      Array.isArray(v)
        ? Array.from(
            new Set(
              v
                .map((n) => (typeof n === "number" ? n : Number(n)))
                .filter((n) => Number.isInteger(n) && n >= 0 && n < max)
            )
          )
        : [];
    const groups: AlignGroup[] = Array.isArray(parsed.g)
      ? (parsed.g as unknown[])
          .map((grp) => {
            const g = grp as { t?: unknown; b?: unknown };
            return { t: clean(g.t, tn), b: clean(g.b, bn) };
          })
          .filter((g) => g.t.length > 0)
      : [];
    // Ekspresi idiomatik ("x"): tiap rentang = indeks kata TARGET yang dibaca 1 unit.
    // Dibersihkan ketat — hanya rentang KONTIGU (run beruntun) ≥2 kata & TAK tumpang
    // tindih (yang mulai lebih dulu menang) — supaya penggabungan chunk aman.
    const rawExpr: number[][] = Array.isArray(parsed.x)
      ? (parsed.x as unknown[])
          .map((sp) => clean(sp, tn).sort((a, b) => a - b))
          // kontigu: [3,4,5] → 5-3+1===3; buang yang bolong / <2 kata
          .filter((sp) => sp.length >= 2 && sp[sp.length - 1] - sp[0] + 1 === sp.length)
          .sort((a, b) => a[0] - b[0])
      : [];
    const expr: number[][] = [];
    let lastEnd = -1;
    for (const sp of rawExpr) {
      if (sp[0] > lastEnd) {
        expr.push(sp);
        lastEnd = sp[sp.length - 1];
      }
    }
    const result: AlignResult = { groups, expr };
    if (groups.length || expr.length) writeAlignCache(target, base, result);
    return result;
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
  /** Bahasa arti — default Indonesia (harus sama dgn yang dipakai saat prewarm). */
  baseCode?: string;
}): (WordMeaning & { translit?: string }) | null {
  const bd = readBreakdownCache(
    params.sentence.trim(),
    params.langCode,
    params.baseCode ?? DEFAULT_BASE_LANG
  );
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
  // Transliterasi/bacaan Latin (romaji, pinyin, dll) untuk kata beraksara non-Latin.
  // Opsional: kata beraksara Latin tak punya; kata lama (sebelum fitur ini) juga
  // belum punya → dashboard mengisinya lazily lewat setSavedWordTranslit().
  translit?: string;
  // Video tempat kata disimpan — dipakai badge "kosakata di video ini" pada player.
  // Opsional: kata lama (sebelum fitur ini) tak punya field ini.
  videoId?: string;
  ts: number;
  // State spaced-repetition (SM-2). Opsional: kata lama (sebelum fitur SRS) tak
  // punya field ini → diperlakukan "baru" / jatuh tempo langsung saat direview.
  srs?: SrsState;
}

const VOCAB_KEY = "linguo:watch:vocab:v1";

// [watch-vocab-durable-v1] Kosakata siswa adalah data yang TAK BOLEH hilang, tapi
// ia berbagi kuota localStorage (~5 MB) dengan cache besar yang bisa diambil ulang
// dari server: transkrip terjemahan per video (basecues), pecahan kalimat
// (breakdown), dan align karaoke. Cache itu tumbuh tiap video ditonton, jadi lama-
// lama kuota habis → `setItem(VOCAB_KEY)` melempar QuotaExceededError dan (dulu)
// ditelan diam-diam: tombol berubah jadi "Tersimpan" padahal tak ada yang tersimpan,
// dan kata itu tak pernah muncul di flashcard.
//
// Sekarang: kalau menulis kosakata gagal, cache yang bisa diambil ulang DIBUANG
// bertahap lalu tulisan diulang; kalau tetap gagal, pemanggil dikasih tahu (ok:false)
// supaya UI bisa jujur, bukan pura-pura sukses.
const DISPOSABLE_CACHE_PREFIXES = [
  BASE_CACHE_PREFIX,
  BREAKDOWN_CACHE_PREFIX,
  ALIGN_CACHE_PREFIX,
];

/** Kunci cache yang boleh dibuang saat penyimpanan penuh. */
function disposableCacheKeys(): string[] {
  const keys: string[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && DISPOSABLE_CACHE_PREFIXES.some((p) => k.startsWith(p))) keys.push(k);
    }
  } catch {
    /* storage diblokir — tak ada yang bisa dibuang */
  }
  return keys;
}

// Perubahan kosakata disiarkan supaya tampilan lain ikut segar TANPA remount:
// badge Kosakata di katalog, dashboard flashcard yang sedang terbuka, dan tab lain
// (lewat event `storage` bawaan browser).
export const VOCAB_CHANGED_EVENT = "linguo:watch:vocab-changed";

/**
 * Pasang pendengar perubahan kosakata (tab ini + tab lain). Balikin fungsi lepas.
 * Dipakai komponen: `useEffect(() => onSavedWordsChanged(refresh), [])`.
 */
export function onSavedWordsChanged(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onLocal = () => cb();
  const onStorage = (e: StorageEvent) => {
    if (!e.key || e.key === VOCAB_KEY) cb();
  };
  window.addEventListener(VOCAB_CHANGED_EVENT, onLocal);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(VOCAB_CHANGED_EVENT, onLocal);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Tulis daftar kosakata ke localStorage dengan JAMINAN: kalau penuh, buang cache
 * yang bisa diambil ulang lalu coba lagi; verifikasi hasil tulisan (Safari mode
 * privat kadang menerima setItem tanpa benar-benar menyimpan). Balikin sukses/tidak.
 */
function writeVocab(list: SavedWord[]): boolean {
  if (typeof window === "undefined") return false;
  const payload = JSON.stringify(list);
  const put = (): boolean => {
    try {
      window.localStorage.setItem(VOCAB_KEY, payload);
      // Verifikasi benar-benar tersimpan, bukan cuma "tidak melempar".
      return window.localStorage.getItem(VOCAB_KEY) === payload;
    } catch {
      return false;
    }
  };
  let ok = put();
  if (!ok) {
    // Buang cache bertahap (batch) — mulai dari sedikit supaya video yang sedang
    // ditonton tak langsung kehilangan seluruh cache-nya.
    const keys = disposableCacheKeys();
    const batch = Math.max(10, Math.ceil(keys.length / 4));
    for (let i = 0; i < keys.length && !ok; i += batch) {
      for (const k of keys.slice(i, i + batch)) {
        try {
          window.localStorage.removeItem(k);
        } catch {
          /* abaikan */
        }
      }
      ok = put();
    }
  }
  if (ok) {
    try {
      window.dispatchEvent(new Event(VOCAB_CHANGED_EVENT));
    } catch {
      /* lingkungan tanpa Event — abaikan */
    }
  }
  return ok;
}

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

/** Hasil simpan kata: `ok:false` = benar-benar gagal tersimpan (penyimpanan penuh
 *  / diblokir), jadi UI JANGAN menampilkan "Tersimpan". */
export interface SaveWordResult {
  ok: boolean;
  list: SavedWord[];
}

export function saveWord(item: Omit<SavedWord, "ts" | "srs">): SaveWordResult {
  const list = getSavedWords().filter(
    (w) => keyOf(w.word, w.langCode) !== keyOf(item.word, item.langCode)
  );
  // Kata baru mulai dengan state SRS default (jatuh tempo langsung) → masuk sesi
  // review berikutnya.
  const next = [{ ...item, ts: Date.now(), srs: newSrsState() }, ...list].slice(0, 500);
  const ok = writeVocab(next);
  return { ok, list: ok ? next : getSavedWords() };
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
  return writeVocab(next) ? next : getSavedWords();
}

export function removeSavedWord(word: string, langCode: string): SavedWord[] {
  const next = getSavedWords().filter(
    (w) => keyOf(w.word, w.langCode) !== keyOf(word, langCode)
  );
  return writeVocab(next) ? next : getSavedWords();
}

/**
 * Isi bacaan Latin (translit) sebuah kata yang tersimpan TANPA translit — dipakai
 * dashboard flashcard untuk membubuhkan romaji/pinyin pada kata lama (disimpan
 * sebelum fitur translit) secara lazy. Hanya menyentuh kata yang cocok & masih
 * kosong; kata beraksara Latin tak pernah dipanggil. Balikin daftar terbaru.
 */
export function setSavedWordTranslit(word: string, langCode: string, translit: string): SavedWord[] {
  const t = translit.trim();
  const list = getSavedWords();
  const next = list.map((w) =>
    keyOf(w.word, w.langCode) === keyOf(word, langCode) && !w.translit && t
      ? { ...w, translit: t }
      : w
  );
  return writeVocab(next) ? next : list;
}

/**
 * Isi arti sebuah kata yang tersimpan TANPA arti — mis. kata fungsi seperti "です"
 * yang saat disimpan lookup-nya balik kosong. Dashboard mengisinya lazily (sekali
 * per kata, hasilnya di-persist) supaya tak menembak word-info berulang. Hanya
 * menyentuh kata yang cocok & artinya masih kosong. Balikin daftar terbaru.
 */
export function setSavedWordMeaning(word: string, langCode: string, meaning: string): SavedWord[] {
  const m = meaning.trim();
  const list = getSavedWords();
  const next = list.map((w) =>
    keyOf(w.word, w.langCode) === keyOf(word, langCode) && !w.meaning && m
      ? { ...w, meaning: m }
      : w
  );
  return writeVocab(next) ? next : list;
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

// ── Pengelompokan frasa untuk karaoke ("the king" → 1 unit) ──────────────────
// [watch-phrase-chunk-v1] Pelajar bahasa belajar per-FRASA, bukan cuma per-kata:
// "the king" = "raja", "for a walk" = "jalan-jalan", phrasal verb "go out" = "keluar".
// Kita gabungkan token kata bersebelahan jadi satu unit karaoke (satu sorotan, satu
// tap → arti frasa) memakai DUA sinyal yang sudah tersedia & di-cache:
//   1. Kelas kata (breakdown POS) — bangun frasa BENDA deterministik:
//        determiner + (kata sifat/bilangan) + kata benda
//        → "the king", "the big house", "the press conference".
//      PREPOSISI SENGAJA TIDAK menggabung ke frasa benda di kanannya: "to"/"of"/"for"
//      punya arti sendiri yang penting dipelajari ("to" = "ke") → biar berdiri sendiri.
//      Jadi "to the press conference" = "to" | "the press conference" (bukan 1 blok).
//   2. Penjajaran AI (alignGroup) — tangkap idiom/phrasal verb yang satu konsep di
//        bahasa terjemahan (mis. "go out"↔"keluar", "give up"↔"menyerah"):
//        kata bersebelahan yang jatuh di grup penjajaran yang SAMA ikut digabung.
// Aman & progresif: kalau POS/penjajaran belum siap → kembalikan null (pemanggil
// sorot per-kata seperti biasa). TAK pernah lebih buruk dari sebelumnya.

// Kelas kata yang boleh MENGAWALI frasa benda (menempel ke kata di kanannya).
// Preposisi TIDAK termasuk — biar "to/of/for" berdiri sendiri (arti tersendiri).
const NP_LEADER: Set<PosCategory> = new Set(["determiner", "adjective", "numeral"]);
// Kelas kata yang boleh menjadi ANGGOTA lanjutan frasa benda.
const NP_MEMBER: Set<PosCategory> = new Set(["determiner", "adjective", "numeral", "noun"]);
// Tanda baca yang MEMUTUS frasa (koma, titik, dsb.) walau kelas kata cocok.
const PHRASE_BREAK_RE = /[.,;:!?…—–()"«»„"'']/;

export interface CueChunks {
  /** Per indeks token (hasil splitWords): id chunk kalau token kata, -1 kalau pemisah. */
  tokenChunk: number[];
  /** Per id chunk: teks frasa utuh + rentang token + jumlah kata. */
  chunks: { text: string; firstTok: number; lastTok: number; words: number }[];
}

/**
 * Hitung pengelompokan frasa satu baris cue. `alignTGroup[k]` = indeks grup
 * penjajaran untuk kata ke-k (dari alignMaps); `breakdown` memberi kelas kata;
 * `exprSpans` = daftar rentang ordinal kata TARGET yang membentuk satu EKSPRESI
 * idiomatik ("We're good" → [0,1]) dari AI — digabung sebagai 1 unit dengan
 * PRIORITAS penuh (menang atas per-kata) supaya pelajar membacanya sebagai satu arti.
 * Kembalikan null kalau tak ada yang bisa digabung (semua kata berdiri sendiri)
 * atau data pendukung belum ada — pemanggil lalu sorot per-kata.
 */
export function computeCueChunks(params: {
  target: string;
  langCode: string;
  breakdown?: SentenceBreakdown | null;
  alignTGroup?: number[] | null;
  exprSpans?: number[][] | null;
}): CueChunks | null {
  const { target, langCode, breakdown, alignTGroup, exprSpans } = params;
  const tokens = splitWords(target, langCode);
  // Indeks token tiap kata (ordinal k → indeks token j) + teks kata.
  const wordTok: number[] = [];
  tokens.forEach((t, j) => t.isWord && wordTok.push(j));
  const n = wordTok.length;
  if (n < 2) return null;

  // Kelas kata per ordinal, dicocokkan berurutan dgn token breakdown (yang membuang
  // tanda baca — sama seperti token kata splitWords). Kalau teks tak cocok, biarkan
  // null (tak dipakai untuk gabung POS; penjajaran tetap boleh).
  const pos: (PosCategory | null)[] = new Array(n).fill(null);
  const bdTokens = breakdown && Array.isArray(breakdown.tokens) ? breakdown.tokens : null;
  if (bdTokens && bdTokens.length === n) {
    for (let k = 0; k < n; k++) {
      const bw = cleanWord(bdTokens[k].word).toLowerCase();
      const tw = cleanWord(tokens[wordTok[k]].text).toLowerCase();
      if (bw && bw === tw) pos[k] = bdTokens[k].cat;
    }
  }

  // [watch-ja-subword-v1] Bahasa tanpa spasi (Jepang/Mandarin/Thai/…): Intl.Segmenter
  // kerap MEMECAH satu kata kamus jadi beberapa token (mis. 伸びてる → 伸び|てる, つらい
  // → つら|い). Untuk mewarnai "kata kontekstual" seperti English, kita gabungkan
  // token-token yang jatuh dalam SATU kata breakdown AI jadi satu unit karaoke —
  // warnanya nyala bareng & tap = arti kata utuh. Pemetaan dicocokkan per-karakter:
  // rangkai kata AI berurutan, konsumsi teks token kata sampai persis menutup satu
  // kata AI. Kalau ada ketidakcocokan (segmenter malah LEBIH kasar / teks beda) →
  // batal total (bwOfWord tetap null → sorot per-kata seperti biasa; tak pernah salah).
  let bwOfWord: number[] | null = null;
  if (isNonLatin(langCode) && bdTokens && bdTokens.length) {
    const norm = (s: string) => s.replace(/\s+/g, "");
    const bdw = bdTokens.map((t) => norm(t.word)).filter((w) => w.length > 0);
    const map: number[] = new Array(n).fill(-1);
    let bi = 0;
    let buf = "";
    let ok = true;
    for (let k = 0; k < n && bi < bdw.length; k++) {
      map[k] = bi;
      buf += norm(tokens[wordTok[k]].text);
      if (buf.length === bdw[bi].length) {
        if (buf !== bdw[bi]) { ok = false; break; }
        buf = "";
        bi++;
      } else if (buf.length > bdw[bi].length) {
        ok = false;
        break;
      }
    }
    // Terpakai hanya bila semua kata segmenter tuntas menutup kata-kata AI tepat pas.
    if (ok && buf === "") bwOfWord = map;
  }

  const ag = alignTGroup ?? null;
  // Ada tanda baca pemutus di antara kata ordinal k-1 dan k?
  const brokenBetween = (k: number): boolean => {
    for (let j = wordTok[k - 1] + 1; j < wordTok[k]; j++) {
      if (!tokens[j].isWord && PHRASE_BREAK_RE.test(tokens[j].text)) return true;
    }
    return false;
  };

  // Ekspresi idiomatik dari AI: exprOf[k] = indeks rentang ekspresi yang memuat
  // ordinal k (atau -1). Dua kata bersebelahan di rentang yang sama → digabung.
  const exprOf: number[] = new Array(n).fill(-1);
  if (exprSpans) {
    exprSpans.forEach((span, si) => {
      for (const k of span) if (Number.isInteger(k) && k >= 0 && k < n && exprOf[k] === -1) exprOf[k] = si;
    });
  }

  const chunkOfWord: number[] = new Array(n);
  let cid = 0;
  chunkOfWord[0] = 0;
  for (let k = 1; k < n; k++) {
    const a = pos[k - 1];
    const b = pos[k];
    // Gabung frasa benda: pemimpin (det/prep/sifat/bilangan) → anggota (det/sifat/bilangan/benda),
    // atau benda+benda (kata majemuk).
    const mergeNP =
      a != null && b != null &&
      ((NP_LEADER.has(a) && NP_MEMBER.has(b)) || (a === "noun" && b === "noun"));
    // Gabung idiom: dua kata bersebelahan di grup penjajaran yang sama.
    const mergeAlign = !!ag && ag[k] != null && ag[k] >= 0 && ag[k] === ag[k - 1];
    // Gabung ekspresi AI: dua kata bersebelahan di rentang ekspresi yang sama.
    const mergeExpr = exprOf[k] >= 0 && exprOf[k] === exprOf[k - 1];
    // [watch-ja-subword-v1] Gabung sub-kata: dua token segmenter dalam satu kata AI.
    const mergeSubword = !!bwOfWord && bwOfWord[k] >= 0 && bwOfWord[k] === bwOfWord[k - 1];
    chunkOfWord[k] =
      (mergeNP || mergeAlign || mergeExpr || mergeSubword) && !brokenBetween(k) ? cid : ++cid;
  }

  // Susun metadata chunk + peta per-token. Token pemisah DI DALAM satu chunk ikut
  // ditandai chunk itu (biar garis grup menyambung); pemisah antar-chunk = -1.
  const chunks: CueChunks["chunks"] = [];
  const tokenChunk: number[] = new Array(tokens.length).fill(-1);
  let anyMulti = false;
  for (let c = 0; c <= cid; c++) {
    const ords: number[] = [];
    for (let k = 0; k < n; k++) if (chunkOfWord[k] === c) ords.push(k);
    if (!ords.length) continue;
    const firstTok = wordTok[ords[0]];
    const lastTok = wordTok[ords[ords.length - 1]];
    for (let j = firstTok; j <= lastTok; j++) tokenChunk[j] = c;
    chunks[c] = {
      text: tokens.slice(firstTok, lastTok + 1).map((t) => t.text).join("").trim(),
      firstTok,
      lastTok,
      words: ords.length,
    };
    if (ords.length > 1) anyMulti = true;
  }
  if (!anyMulti) return null; // tak ada frasa → biar pemanggil sorot per-kata
  return { tokenChunk, chunks };
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
