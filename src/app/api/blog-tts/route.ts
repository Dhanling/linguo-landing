// [ling-blog-tts-chirp-v2] TTS realistis untuk anotasi 🔊 (.linguo-tts) di artikel blog.
//
// Strategi penyedia — Google Cloud "Chirp 3: HD" dulu, Gemini sbg fallback:
//   1. Chirp 3 HD (utama, GA & produksi): dipakai saat bahasa (data-lang) ada di
//      CHIRP_LOCALES. Voice GA dgn kuota per-karakter (no cap 100 req/hari preview),
//      lebih cepat, balikin MP3 langsung. Auth = service account (OAuth JWT) — SAMA
//      dengan yg dipakai /api/tts (TTS kuis), jadi kredensialnya sudah ada di Vercel.
//      Voice di-kunci ke satu locale (mis. es-ES), nama = `${locale}-Chirp3-HD-${voice}`.
//   2. Gemini 2.5 Flash TTS (fallback): untuk bahasa di luar CHIRP_LOCALES (Gemini
//      multilingual + auto-detect) atau kalau Chirp error / kredensial tak ada.
//      Balikin PCM mentah → dibungkus WAV. Subjek cap 100 req/hari preview, jadi
//      best-effort. Butuh GEMINI_API_KEY.
//
// Kredensial Chirp (urut prioritas, sama spt /api/tts):
//   1. GOOGLE_TTS_CREDENTIALS_JSON  — isi JSON service account (Vercel)
//   2. GOOGLE_APPLICATION_CREDENTIALS — path ke file JSON
//   3. ~/linguo-audio-gen/linguo-tts-key.json — fallback dev lokal
// Env Gemini: GEMINI_API_KEY. Optional: GEMINI_TTS_MODEL, GEMINI_TTS_VOICE.
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// CORS: endpoint ini juga dipanggil dari CMS admin (domain berbeda) buat preview suara
// di editor blog. Tidak ada data sensitif/auth, jadi origin "*" aman.
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Expose-Headers": "x-tts-provider",
};
const jsonCors = (data: unknown, init?: ResponseInit) =>
  NextResponse.json(data, { ...init, headers: { ...CORS_HEADERS, ...(init?.headers || {}) } });

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ── Gemini (fallback) ───────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts";
const DEFAULT_VOICE = process.env.GEMINI_TTS_VOICE || "Aoede";

// ── Chirp 3 HD (utama) ──────────────────────────────────────────────────────
// Base lang (data-lang anotasi) → locale BCP-47 Chirp. Diambil dari implementasi
// mobile (linguo-app) yg locale-nya sudah diverifikasi live. Bahasa di luar map ini
// jatuh ke fallback Gemini (yg multilingual + auto-detect).
const CHIRP_LOCALES: Record<string, string> = {
  es: "es-ES", fr: "fr-FR", de: "de-DE", it: "it-IT", pt: "pt-BR",
  nl: "nl-NL", ja: "ja-JP", ko: "ko-KR", zh: "cmn-CN", yue: "yue-HK",
  ru: "ru-RU", ar: "ar-XA", hi: "hi-IN", bn: "bn-IN", id: "id-ID",
  th: "th-TH", vi: "vi-VN", tr: "tr-TR", pl: "pl-PL", uk: "uk-UA",
  sv: "sv-SE", no: "nb-NO", da: "da-DK", fi: "fi-FI", el: "el-GR",
  cs: "cs-CZ", sk: "sk-SK", ro: "ro-RO", hu: "hu-HU", bg: "bg-BG",
  hr: "hr-HR", sr: "sr-RS", he: "he-IL", ur: "ur-IN", ta: "ta-IN",
  te: "te-IN", sw: "sw-KE", lt: "lt-LT", lv: "lv-LV", et: "et-EE",
  sl: "sl-SI", mr: "mr-IN", gu: "gu-IN", kn: "kn-IN", ml: "ml-IN",
  pa: "pa-IN", en: "en-US",
};
// Speaker valid di semua locale Chirp 3 HD — sama persis dgn voice picker blog/Gemini.
const CHIRP_SPEAKERS = new Set(["Kore", "Aoede", "Leda", "Zephyr", "Puck", "Charon", "Orus", "Fenrir"]);
const CHIRP_ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize";
const TOKEN_URI = "https://oauth2.googleapis.com/token";

// ── Service account → OAuth access token (di-cache sampai mendekati expiry) ──
type SA = { client_email: string; private_key: string; token_uri?: string };
let _sa: SA | null = null;
function loadCreds(): SA {
  if (_sa) return _sa;
  let raw: string | null = null;
  if (process.env.GOOGLE_TTS_CREDENTIALS_JSON) {
    raw = process.env.GOOGLE_TTS_CREDENTIALS_JSON;
  } else {
    const p =
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      path.join(os.homedir(), "linguo-audio-gen", "linguo-tts-key.json");
    raw = readFileSync(p, "utf8");
  }
  const j = JSON.parse(raw);
  _sa = { client_email: j.client_email, private_key: String(j.private_key).replace(/\\n/g, "\n"), token_uri: j.token_uri };
  return _sa;
}

let _token: { value: string; exp: number } | null = null;
async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (_token && _token.exp - 60 > now) return _token.value;
  const sa = loadCreds();
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const header = b64({ alg: "RS256", typ: "JWT" });
  const claim = b64({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: sa.token_uri || TOKEN_URI,
    iat: now,
    exp: now + 3600,
  });
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const sig = signer.sign(sa.private_key).toString("base64url");
  const assertion = `${header}.${claim}.${sig}`;

  const res = await fetch(sa.token_uri || TOKEN_URI, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!res.ok) throw new Error(`token exchange failed: ${res.status}`);
  const j = await res.json();
  _token = { value: j.access_token, exp: now + (j.expires_in || 3600) };
  return _token.value;
}

// Chirp 3 HD → MP3 base64. Voice dikunci ke locale; speaker divalidasi (fallback Aoede).
async function synthesizeChirp(token: string, text: string, lang: string, voice: string) {
  const locale = CHIRP_LOCALES[lang];
  if (!locale) throw new Error(`chirp: bahasa "${lang}" tidak didukung`);
  const speaker = CHIRP_SPEAKERS.has(voice) ? voice : "Aoede";
  const name = `${locale}-Chirp3-HD-${speaker}`;
  const res = await fetch(CHIRP_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: locale, name },
      audioConfig: { audioEncoding: "MP3" },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`chirp ${res.status}: ${detail.slice(0, 200)}`);
  }
  const j = await res.json();
  if (!j?.audioContent) throw new Error("chirp: no audioContent");
  // Google sudah balikin MP3 base64 — teruskan apa adanya.
  return { audioContent: j.audioContent as string, mimeType: "audio/mpeg" };
}

// Bungkus PCM mentah (16-bit signed LE, mono) jadi file WAV lengkap dgn header.
function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

// Gemini 2.5 Flash TTS → WAV base64 (fallback multilingual).
async function synthesizeGemini(text: string, voice: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    // Kirim key via header x-goog-api-key — kompatibel utk format lama (AIza...) & baru (AQ...).
    headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
      },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`gemini ${res.status}: ${detail.slice(0, 300)}`);
  }
  const j = await res.json();
  const part = j?.candidates?.[0]?.content?.parts?.find((p: any) => p?.inlineData?.data);
  const b64: string | undefined = part?.inlineData?.data;
  if (!b64) throw new Error("gemini: no audio in response");
  // mimeType contoh: "audio/L16;codec=pcm;rate=24000" → ambil sample rate-nya.
  const mime: string = part?.inlineData?.mimeType || "";
  const rateMatch = mime.match(/rate=(\d+)/);
  const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
  const wav = pcmToWav(Buffer.from(b64, "base64"), sampleRate);
  return { audioContent: wav.toString("base64"), mimeType: "audio/wav" };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = String(body?.text || "").trim().slice(0, 600);
    if (!text) return jsonCors({ error: "text kosong" }, { status: 400 });
    const voice = String(body?.voice || DEFAULT_VOICE);
    const lang = String(body?.lang || "").trim().toLowerCase();

    const cacheHeaders = { "Cache-Control": "public, max-age=86400" };

    // 1) Utama: Chirp 3 HD — kalau bahasanya didukung. Error/kredensial-hilang →
    //    jatuh ke Gemini (try/catch), jadi aman walau SA belum diset di env.
    if (lang && CHIRP_LOCALES[lang]) {
      try {
        const token = await getAccessToken();
        const out = await synthesizeChirp(token, text, lang, voice);
        return jsonCors(out, { headers: { ...cacheHeaders, "x-tts-provider": "chirp" } });
      } catch (e: any) {
        console.error("blog-tts: chirp gagal, fallback ke gemini:", e?.message || e);
      }
    }

    // 2) Fallback: Gemini (multilingual, auto-detect bahasa dari teks).
    if (!GEMINI_API_KEY) {
      return jsonCors(
        { error: "TTS belum siap: Chirp gagal/ tak dikonfigurasi & GEMINI_API_KEY kosong" },
        { status: 500 }
      );
    }
    try {
      const out = await synthesizeGemini(text, voice);
      return jsonCors(out, { headers: { ...cacheHeaders, "x-tts-provider": "gemini" } });
    } catch (e: any) {
      return jsonCors({ error: "tts failed", detail: String(e?.message || e).slice(0, 300) }, { status: 502 });
    }
  } catch (e: any) {
    return jsonCors({ error: e?.message || "internal error" }, { status: 500 });
  }
}
