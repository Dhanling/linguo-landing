// Watch & Learn — lapisan "belajar" untuk player: transkrip dwibahasa (subtitle
// bahasa target + terjemahan Indonesia), arti kata yang di-tap, dan analisa
// kalimat (kelas kata). Semua jalan lewat Edge Function di project Supabase yang
// sama dengan app mobile (yt-transcript & word-info) — anon key aman di client.

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jbtgciepdmqxxcjflrxz.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Terjemahan/penjelasan selalu ditulis dalam bahasa pengguna Linguo (Indonesia).
const EXPLANATION_LANGUAGE = "Bahasa Indonesia";

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
  return NON_LATIN.has(code);
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

export async function speakText(text: string, langCode: string) {
  if (typeof window === "undefined") return;
  try {
    ttsAudio?.pause();
    window.speechSynthesis?.cancel();
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang: langCode }),
    });
    if (!res.ok) throw new Error(`tts ${res.status}`);
    const data = (await res.json()) as { audioContent?: string };
    if (!data.audioContent) throw new Error("no audio");
    if (!ttsAudio) ttsAudio = new Audio();
    ttsAudio.src = `data:audio/mp3;base64,${data.audioContent}`;
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
      // `v=3` = pemecah cache CDN (s-maxage 24 jam): cues kini SATU KALIMAT UTUH
      // per section hasil resegmentasi server (worker + backfill resegmentCache) —
      // tanpa bump ini, edge CDN masih menyajikan versi lama sampai sehari.
      // (v=2 dulu untuk `translit` hasil backfill.)
      `/api/yt-transcript-cache?videoId=${encodeURIComponent(videoId)}&lang=${encodeURIComponent(langCode)}&v=3`,
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
  return t.match(/[^.!?…]+[.!?…]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [t];
}

/**
 * Pecah satu cue jadi beberapa cue satu-kalimat. Timing dibagi proporsional dengan
 * panjang tiap kalimat. Hanya dipecah kalau terjemahan (base) & transliterasi bisa
 * dipisah ke jumlah kalimat yang SAMA — kalau tidak, cue dibiarkan utuh biar
 * terjemahan tak salah pasang dengan kalimat targetnya.
 */
function splitCueBySentence(cue: LearnCue): LearnCue[] {
  const targets = splitSentences(cue.target);
  if (targets.length <= 1) return [cue];
  const bases = cue.base ? splitSentences(cue.base) : null;
  const translits = cue.translit ? splitSentences(cue.translit) : null;
  if (bases && bases.length !== targets.length) return [cue];
  if (translits && translits.length !== targets.length) return [cue];

  const dur = Math.max(0.001, cue.end - cue.start);
  const total = targets.reduce((n, s) => n + s.length, 0) || 1;
  let acc = 0;
  return targets.map((tg, i) => {
    const start = cue.start + dur * (acc / total);
    acc += tg.length;
    const end = i === targets.length - 1 ? cue.end : cue.start + dur * (acc / total);
    return {
      start,
      end: Math.max(end, start + 0.3),
      target: tg,
      base: bases ? bases[i] : "",
      ...(translits ? { translit: translits[i] } : {}),
    };
  });
}

// Panjang maksimum satu section transkrip (≈ satu baris di panel). Kalimat yang
// lebih panjang dipecah lagi biar tiap section ringkas & enak dibaca — bukan blok
// paragraf. ~60 karakter kira-kira pas satu baris pada lebar panel transkrip.
const MAX_CUE_CHARS = 60;

/** Pisah teks jadi klausa di batas tanda baca (,;:—–) — delimiter ikut klausa sebelumnya. */
function splitClauses(text: string): string[] {
  const parts = text.match(/[^,;:—–]+[,;:—–]*/g);
  return parts ? parts.map((s) => s.trim()).filter(Boolean) : [text.trim()];
}

/**
 * Pecah cue yang masih kepanjangan di batas KLAUSA (koma dll). Hanya dipecah kalau
 * terjemahan (base) & transliterasi punya jumlah klausa yang SAMA dengan target —
 * jadi tiap section hasil pecahan tetap membawa terjemahannya sendiri (tak ada
 * section tanpa terjemahan / salah pasang). Kalau tak bisa dipasangkan (mis. ASR
 * tanpa koma), cue dibiarkan utuh — terjemahan tetap benar walau sedikit lebih panjang.
 * Klausa pendek digabung sampai ≤ MAX_CUE_CHARS biar tak jadi banyak section mungil.
 */
function splitLongCue(cue: LearnCue): LearnCue[] {
  if (cue.target.trim().length <= MAX_CUE_CHARS) return [cue];
  const targets = splitClauses(cue.target);
  if (targets.length <= 1) return [cue];
  const bases = cue.base ? splitClauses(cue.base) : null;
  const translits = cue.translit ? splitClauses(cue.translit) : null;
  if (bases && bases.length !== targets.length) return [cue];
  if (translits && translits.length !== targets.length) return [cue];

  // Kelompokkan klausa jadi grup ≤ MAX_CUE_CHARS (indeks sama dipakai buat base &
  // translit biar pasangannya tetap sejajar).
  const groups: number[][] = [];
  let cur: number[] = [];
  let curLen = 0;
  targets.forEach((t, i) => {
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
  if (groups.length <= 1) return [cue];

  const join = (arr: string[], idx: number[]) => idx.map((i) => arr[i]).join(" ").trim();
  const dur = Math.max(0.001, cue.end - cue.start);
  const total = targets.reduce((n, s) => n + s.length, 0) || 1;
  let acc = 0;
  return groups.map((idx, g) => {
    const tg = join(targets, idx);
    const start = cue.start + dur * (acc / total);
    acc += idx.reduce((n, i) => n + targets[i].length, 0);
    const end = g === groups.length - 1 ? cue.end : cue.start + dur * (acc / total);
    return {
      start,
      end: Math.max(end, start + 0.3),
      target: tg,
      base: bases ? join(bases, idx) : "",
      ...(translits ? { translit: join(translits, idx) } : {}),
    };
  });
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
 * Fallback terakhir: pecah cue yang MASIH kepanjangan setelah pemecahan kalimat &
 * klausa (mis. hasil ASR/Whisper TANPA tanda baca → tak ada batas kalimat/koma untuk
 * dipotong). Dipecah per KATA jadi potongan ≤ MAX_CUE_CHARS; terjemahan (base) &
 * transliterasi ikut dibagi proporsional ke jumlah potongan yang SAMA. Perpasangan
 * jadi PERKIRAAN (beda bahasa, urutan kata tak selalu sejajar), tapi tiap section
 * jadi satu baris pendek — sesuai target "1 kalimat / 1 baris" utk semua sumber.
 */
function splitCueByWords(cue: LearnCue): LearnCue[] {
  if (cue.target.trim().length <= MAX_CUE_CHARS) return [cue];
  const targets = chunkWords(cue.target, MAX_CUE_CHARS);
  if (targets.length <= 1) return [cue];
  const bases = cue.base ? distributeWords(cue.base, targets.length) : null;
  const translits = cue.translit ? distributeWords(cue.translit, targets.length) : null;

  const dur = Math.max(0.001, cue.end - cue.start);
  const total = targets.reduce((n, s) => n + s.length, 0) || 1;
  let acc = 0;
  return targets.map((tg, i) => {
    const start = cue.start + dur * (acc / total);
    acc += tg.length;
    const end = i === targets.length - 1 ? cue.end : cue.start + dur * (acc / total);
    return {
      start,
      end: Math.max(end, start + 0.3),
      target: tg,
      base: bases ? bases[i] : "",
      ...(translits ? { translit: translits[i] } : {}),
    };
  });
}

// Rapikan transkrip jadi satu section per baris: pecah per kalimat dulu (akurat),
// lalu di batas klausa, lalu — kalau MASIH kepanjangan (ASR/Whisper tanpa tanda
// baca) — per kata. Tak ada lagi section berupa paragraf panjang, apa pun sumbernya.
function splitCuesBySentence(cues: LearnCue[]): LearnCue[] {
  return cues
    .flatMap(splitCueBySentence)
    .flatMap(splitLongCue)
    .flatMap(splitCueByWords);
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

/**
 * NO-OP (sejak Fase 2). Dulu ini menghangatkan cache dengan MEMICU transkripsi di
 * browser (caption/ASR) untuk video rekomendasi — mahal & tak terkontrol. Sekarang
 * transkripsi dilakukan SERVER lewat kurasi admin (antrian `yt_transcript_jobs` +
 * worker pg_cron), jadi klien tak lagi memicu apa pun. Dipertahankan sebagai
 * no-op supaya call site lama tak perlu diubah. `void` argumen agar lint tenang.
 */
export function prewarmTranscripts(_videos: PrewarmVideo[], _langCode: string): void {
  void _videos;
  void _langCode;
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
  };
  const meaning = typeof parsed.meaning === "string" ? parsed.meaning.trim() : "";
  const type = typeof parsed.type === "string" ? parsed.type.trim() : "";
  if (!meaning && !type) throw new Error("Arti kosong.");
  return { meaning, type };
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

export interface WordDeepDive {
  register: string; // "netral" | "formal" | "casual" | "sopan" | "vulgar" | ""
  registerNote: string;
  usage: string;
  nuance: string;
  similar: WordSimilar[];
  examples: WordExample[];
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
  return {
    register: data.register ?? "",
    registerNote: data.registerNote ?? "",
    usage: data.usage ?? "",
    nuance: data.nuance ?? "",
    similar: Array.isArray(data.similar) ? data.similar : [],
    examples: Array.isArray(data.examples) ? data.examples : [],
  };
}

/** Jawaban tanya-lanjutan + usulan pertanyaan berikutnya yang kontekstual. */
export interface WordAnswer {
  answer: string;
  followups: string[];
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
  const data = (await res.json()) as { answer?: string; followups?: string[]; error?: string };
  if (data.error) throw new Error(data.error);
  return {
    answer: (data.answer ?? "").trim(),
    followups: Array.isArray(data.followups) ? data.followups.filter(Boolean).slice(0, 3) : [],
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
}

/**
 * Pecah satu baris subtitle kata demi kata untuk mode "Analisa": terjemahan
 * akurat + kelas kata (warna) dan arti tiap kata. Backed by word-info "breakdown".
 */
export async function getSentenceBreakdown(params: {
  sentence: string;
  langCode: string;
}): Promise<SentenceBreakdown> {
  const raw = await callWordInfo({
    word: params.sentence,
    sentence: params.sentence,
    mode: "breakdown",
    langCode: params.langCode,
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
          const cat = typeof tok.c === "string" ? tok.c.trim().toLowerCase() : "";
          return {
            word: typeof tok.w === "string" ? tok.w.trim() : "",
            cat: (POS_CATEGORIES.includes(cat as PosCategory) ? cat : "other") as PosCategory,
            gloss: typeof tok.g === "string" ? tok.g.trim() : "",
            pos: typeof tok.p === "string" ? tok.p.trim() : "",
            translit: typeof tok.r === "string" ? tok.r.trim() : "",
          };
        })
        .filter((t) => t.word.length > 0)
    : [];
  if (!tokens.length) throw new Error("Analisa kosong.");
  return { translation, tokens };
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

// ── Kosakata tersimpan (localStorage) ────────────────────────────────────────

import { gradeCard, newSrsState, type SrsGrade, type SrsState } from "./srs";
import { asCefrLevel } from "./cefr";

export interface SavedWord {
  word: string;
  meaning: string;
  langCode: string;
  example: string;
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
