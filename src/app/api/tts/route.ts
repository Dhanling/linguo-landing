// [ling-lms-quiz-tts-v1] Google Cloud TTS on-demand untuk teks opsi kuis.
// Server-side biar service-account key ga ke-expose ke client. Voice config disamain
// dengan audio vocab (gen-vietnam-audio.mjs): vi-VN, Chirp3-HD (auto-pick / TTS_VOICE), MP3.
//
// Kredensial (urut prioritas):
//   1. process.env.GOOGLE_TTS_CREDENTIALS_JSON  — isi JSON service account (buat deploy/Vercel)
//   2. process.env.GOOGLE_APPLICATION_CREDENTIALS — path ke file JSON
//   3. ~/linguo-audio-gen/linguo-tts-key.json     — fallback dev lokal
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LANG_CODE = "vi-VN";
const ENCODING = "MP3";
const TOKEN_URI = "https://oauth2.googleapis.com/token";

// [watch-tts-chirp-v1] Peta kode bahasa → locale BCP-47 Chirp 3 HD. Dipakai TTS
// multi-bahasa Watch & Learn (tombol "Dengar" di tooltip kata). Diverifikasi live
// di app mobile (~/linguo-app/supabase/functions/tts). Voice = `${locale}-Chirp3-HD-Kore`.
const CHIRP_LOCALES: Record<string, string> = {
  es: "es-ES", fr: "fr-FR", de: "de-DE", it: "it-IT", pt: "pt-BR",
  nl: "nl-NL", ja: "ja-JP", ko: "ko-KR", zh: "cmn-CN", ru: "ru-RU",
  ar: "ar-XA", hi: "hi-IN", th: "th-TH", vi: "vi-VN", tr: "tr-TR",
  en: "en-US",
  // [watch-tts-chirp-v2] Locale tambahan (Danish dkk) — diverifikasi live via
  // GET /v1/voices 2026-07-13: semua locale di bawah punya varian Chirp3-HD-Kore.
  da: "da-DK", sv: "sv-SE", no: "nb-NO", nb: "nb-NO", fi: "fi-FI",
  pl: "pl-PL", cs: "cs-CZ", sk: "sk-SK", hu: "hu-HU", ro: "ro-RO",
  bg: "bg-BG", uk: "uk-UA", el: "el-GR", he: "he-IL", id: "id-ID",
  hr: "hr-HR", sr: "sr-RS", sl: "sl-SI", lt: "lt-LT", lv: "lv-LV",
  et: "et-EE", sw: "sw-KE", ur: "ur-IN", bn: "bn-IN", ta: "ta-IN",
  te: "te-IN", gu: "gu-IN", kn: "kn-IN", ml: "ml-IN", mr: "mr-IN",
  pa: "pa-IN", yue: "yue-HK",
  // Tagalog/Filipino — kode kanonik `fil`, `tl` alias ISO-639-1. Chirp3-HD fil-PH.
  fil: "fil-PH", tl: "fil-PH",
};
// Kore = suara Chirp 3 HD default (valid di semua locale di atas).
const CHIRP_SPEAKER = "Kore";

// [watch-tts-tagalog] Locale yang BELUM punya voice Chirp 3 HD → pakai voice
// terbaik yang tersedia (diverifikasi live via GET /v1/voices 2026-07-14). Tanpa
// override, nama `${locale}-Chirp3-HD-Kore` tak eksis → sintesis 400 "voice not found".
const VOICE_OVERRIDE: Record<string, string> = {
  "fil-PH": "fil-ph-Neural2-A", // Tagalog: Neural2 wanita (Chirp3-HD belum ada di fil-PH)
};

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
  // private_key dari env bisa punya "\n" literal — normalisasi ke newline asli
  _sa = { client_email: j.client_email, private_key: String(j.private_key).replace(/\\n/g, "\n"), token_uri: j.token_uri };
  return _sa;
}

// ---- OAuth access token via JWT bearer (di-cache sampai mendekati expiry) ----
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
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`token exchange failed: ${res.status}`);
  const j = await res.json();
  _token = { value: j.access_token, exp: now + (j.expires_in || 3600) };
  return _token.value;
}

// ---- resolve voice sekali (TTS_VOICE override, atau auto-pick Chirp3-HD pertama) ----
let _voice: string | null = null;
async function resolveVoice(token: string): Promise<string> {
  if (_voice) return _voice;
  if (process.env.TTS_VOICE) {
    _voice = process.env.TTS_VOICE;
    return _voice;
  }
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/voices?languageCode=${LANG_CODE}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const j = await res.json().catch(() => ({}));
  const voices: any[] = j.voices || [];
  const chirp = voices.find((v) => /Chirp3-HD/i.test(v.name || ""));
  const name: string = (chirp || voices[0])?.name || "vi-VN-Wavenet-A";
  _voice = name;
  return name;
}

// sama seperti cleanText di gen-vietnam-audio.mjs — buang anotasi "(...)" & "·"
function cleanText(s: string) {
  return String(s || "").replace(/\s*\([^)]*\)/g, "").replace(/\s*·\s*/g, ", ").trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = cleanText(body?.text || "").slice(0, 400);
    if (!text) return NextResponse.json({ error: "text kosong" }, { status: 400 });

    // [watch-tts-chirp-v1] Kalau client kirim `lang` (mis. "es"), pakai voice Chirp
    // 3 HD sesuai bahasa itu. Tanpa `lang` → perilaku lama (kuis vi-VN) tetap utuh.
    const langRaw = typeof body?.lang === "string" ? body.lang.trim().toLowerCase() : "";
    const langBase = langRaw.split("-")[0];
    const chirpLocale = langBase ? CHIRP_LOCALES[langBase] : undefined;

    // [watch-tts-chirp-v2] Bahasa dikirim tapi tak ada di peta (mis. fa, km, am):
    // JANGAN jatuh ke voice vi-VN (kedengaran bahasa Vietnam!) — balas 422 supaya
    // client fallback ke Web Speech browser.
    if (langBase && !chirpLocale) {
      return NextResponse.json({ error: `lang tidak didukung: ${langBase}` }, { status: 422 });
    }

    const token = await getAccessToken();

    const languageCode = chirpLocale ?? LANG_CODE;
    const voice = chirpLocale
      ? (VOICE_OVERRIDE[chirpLocale] ?? `${chirpLocale}-Chirp3-HD-${CHIRP_SPEAKER}`)
      : await resolveVoice(token);

    const res = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode, name: voice },
        audioConfig: { audioEncoding: ENCODING },
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json({ error: "tts failed", detail: detail.slice(0, 300) }, { status: 502 });
    }
    const j = await res.json();
    // [ling-lms-quiz-tts-v2] balikin base64 apa adanya dari Google → client decode (atob→Uint8Array→Blob).
    // Lebih robust dari body biner di Next route handler, dan match pola decode di client.
    return NextResponse.json(
      { audioContent: j.audioContent },
      { headers: { "Cache-Control": "public, max-age=86400" } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "internal error" }, { status: 500 });
  }
}
