// [ling-lms-quiz-tts-v1] Google Cloud TTS on-demand untuk teks opsi kuis.
// Server-side biar service-account key ga ke-expose ke client. Voice config disamain
// dengan audio vocab (gen-vietnam-audio.mjs): vi-VN, Chirp3-HD (auto-pick / TTS_VOICE), MP3.
//
// Kredensial (urut prioritas):
//   1. process.env.GOOGLE_TTS_CREDENTIALS_JSON  — isi JSON service account (buat deploy/Vercel)
//   2. process.env.GOOGLE_APPLICATION_CREDENTIALS — path ke file JSON
//   3. ~/linguo-audio-gen/linguo-tts-key.json     — fallback dev lokal
//
// [tts-cepat-v1] Dua hal yang bikin rute ini terasa lambat di reader e-book —
// diukur di produksi 21 Agu 2026, balasan CACHE HIT tetap 0,9–2,9 detik:
//   1. token OAuth diambil SEBELUM cache dilihat, jadi tiap kontainer baru
//      membayar satu perjalanan ke Google walau mp3-nya sudah ada;
//   2. tiap ketukan selalu membangunkan fungsi serverless (dingin: 7–20 detik).
// (1) dibereskan di bawah — token baru diambil kalau memang harus menyintesis.
// (2) dibereskan lewat GET yang boleh disimpan CDN + jalur langsung ke Storage
//     di klien (lihat src/lib/ebookTts.ts).
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  BATAS_TEKS_TTS, BUCKET_TTS, bersihkanTeksTts, jalurCacheTts, localeChirp, namaVoice,
} from "@/lib/ttsVoice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LANG_CODE = "vi-VN";
const ENCODING = "MP3";
const TOKEN_URI = "https://oauth2.googleapis.com/token";

/* Audio untuk (voice + teks) yang sama tidak pernah berubah, jadi balasannya
   boleh disimpan selamanya — di browser siswa maupun di CDN Vercel. Header
   inilah yang membuat ketukan kedua (siswa mana pun, perangkat mana pun di POP
   yang sama) tak lagi membangunkan fungsi ini. Hanya untuk GET: browser tak
   pernah menyimpan balasan POST. */
const SETAHUN = "public, max-age=31536000, s-maxage=31536000, immutable";
const HEADER_ABADI = {
  "Cache-Control": SETAHUN,
  "CDN-Cache-Control": SETAHUN,
  "Vercel-CDN-Cache-Control": SETAHUN,
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

/* ── cache bersama (Supabase Storage) ──────────────────────────────────────
   [tts-cache-bersama-v1] Chirp ditagih PER KARAKTER, dan permintaan yang masuk
   ke rute ini sangat berulang: satu kata di modul e-book diketuk berkali-kali
   oleh siswa yang sama, dan modul yang sama dibaca ratusan siswa. Klien punya
   cache sendiri (memori + Cache API), tapi itu per PERANGKAT — siswa berikutnya
   tetap memicu sintesis baru.

   Simpanan di sini dipakai BERSAMA: satu frasa disintesis sekali, lalu semua
   pemanggil berikutnya — kuis, Watch and Learn, reader e-book, siswa mana pun —
   mengambil mp3 yang sama. Kuncinya ikut nama voice, jadi ganti suara tidak
   menyajikan audio lama. Nama berkasnya dihitung di src/lib/ttsVoice.ts karena
   klien pun menghitungnya sendiri.

   Best-effort total: bucket belum ada, kredensial kosong, atau storage error →
   jalan terus ke Google seperti sebelumnya. Cache yang gagal tidak boleh
   membuat suara ikut gagal. */
function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const jalurCache = (voice: string, text: string) =>
  jalurCacheTts(voice, crypto.createHash("sha256").update(`${voice}|${text}`).digest("hex"));

async function dariCache(jalur: string): Promise<string | null> {
  const sb = admin();
  if (!sb) return null;
  try {
    const { data, error } = await sb.storage.from(BUCKET_TTS).download(jalur);
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer()).toString("base64");
  } catch {
    return null;
  }
}

async function keCache(jalur: string, base64: string) {
  const sb = admin();
  if (!sb) return;
  const isi = Buffer.from(base64, "base64");
  const opsi = { contentType: "audio/mpeg", upsert: true, cacheControl: "31536000" };
  try {
    const { error } = await sb.storage.from(BUCKET_TTS).upload(jalur, isi, opsi);
    // Bucket-nya belum pernah dibuat (deploy baru / project lain): bikin sekali,
    // privat, lalu coba sekali lagi. Kalau tetap gagal — biarkan, sekadar cache.
    if (error && /bucket/i.test(error.message || "")) {
      await sb.storage.createBucket(BUCKET_TTS, { public: false }).catch(() => {});
      await sb.storage.from(BUCKET_TTS).upload(jalur, isi, opsi);
    }
  } catch {
    /* diam */
  }
}

/** Balasan rute ini: `abadi` menandai isi yang boleh disimpan CDN/browser. */
type Hasil = { status: number; body: Record<string, unknown>; abadi?: boolean };

async function sintesis(teksMentah: unknown, langMentah: unknown): Promise<Hasil> {
  const text = bersihkanTeksTts(String(teksMentah || "")).slice(0, BATAS_TEKS_TTS);
  if (!text) return { status: 400, body: { error: "text kosong" } };

  // [watch-tts-chirp-v1] Kalau client kirim `lang` (mis. "es"), pakai voice Chirp
  // 3 HD sesuai bahasa itu. Tanpa `lang` → perilaku lama (kuis vi-VN) tetap utuh.
  const langRaw = typeof langMentah === "string" ? langMentah.trim().toLowerCase() : "";
  const langBase = langRaw.split("-")[0];
  const chirpLocale = langBase ? localeChirp(langBase) : null;

  // [watch-tts-chirp-v2] Bahasa dikirim tapi tak ada di peta (mis. fa, km, am):
  // JANGAN jatuh ke voice vi-VN (kedengaran bahasa Vietnam!) — balas 422 supaya
  // client fallback ke Web Speech browser.
  if (langBase && !chirpLocale) {
    return { status: 422, body: { error: `lang tidak didukung: ${langBase}` } };
  }

  // ⚠️ Token OAuth SENGAJA tidak diambil di sini. Untuk bahasa ber-Chirp, nama
  // voice-nya bisa dihitung tanpa memanggil Google sama sekali — dan kalau
  // mp3-nya sudah ada di cache, seluruh perjalanan ke Google jadi mubazir.
  // Jalur lawas (tanpa `lang`) tetap butuh token karena voice-nya ditanyakan.
  const languageCode = chirpLocale ?? LANG_CODE;
  const voice = chirpLocale
    ? (namaVoice(langBase) as string)
    : await resolveVoice(await getAccessToken());

  // Sudah pernah disintesis? Balas dari simpanan — nol karakter ditagih.
  const jalur = jalurCache(voice, text);
  const tersimpan = await dariCache(jalur);
  if (tersimpan) return { status: 200, body: { audioContent: tersimpan, cached: true }, abadi: true };

  const token = await getAccessToken();
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
    return { status: 502, body: { error: "tts failed", detail: detail.slice(0, 300) } };
  }
  const j = await res.json();
  // Ditunggu, bukan dilepas: fungsi serverless bisa dimatikan begitu balasan
  // terkirim, dan unggahan yang keburu terpotong = cache yang tak pernah isi.
  if (j.audioContent) await keCache(jalur, j.audioContent);
  // [ling-lms-quiz-tts-v2] balikin base64 apa adanya dari Google → client decode (atob→Uint8Array→Blob).
  // Lebih robust dari body biner di Next route handler, dan match pola decode di client.
  return { status: 200, body: { audioContent: j.audioContent }, abadi: true };
}

/* [pustaka-pengajar-tts-v1] Dashboard pengajar (teach.linguo.id) itu SPA Vite di
   repo lain — ia tak punya rute TTS sendiri, jadi reader modulnya memanggil rute
   ini lintas asal. Yang diizinkan cuma asal milik Linguo: rute ini menagih Chirp
   per karakter, jadi membukanya untuk semua orang sama dengan membuka tagihan.
   Ketukan yang mp3-nya sudah ada tak pernah sampai ke sini — klien mengambilnya
   langsung dari CDN Storage (lihat dariCdn di src/lib/ebookTts.ts). */
const ASAL_BOLEH = [
  /^https:\/\/teach\.linguo\.id$/,
  /^https:\/\/([a-z0-9-]+\.)?linguo\.id$/,
  /^https:\/\/linguo-admin-dashboard[a-z0-9-]*\.vercel\.app$/,
  /^http:\/\/localhost:\d+$/,
];

function headerAsal(req: NextRequest): Record<string, string> {
  const asal = req.headers.get("origin") || "";
  if (!asal || !ASAL_BOLEH.some((p) => p.test(asal))) return {};
  // Vary WAJIB: tanpa itu CDN bisa menyajikan balasan ber-ACAO satu asal kepada
  // asal lain (atau sebaliknya, balasan tanpa ACAO ke pemanggil lintas asal).
  return { "Access-Control-Allow-Origin": asal, Vary: "Origin" };
}

function balas(h: Hasil, boleh_cdn: boolean, cors: Record<string, string> = {}) {
  return NextResponse.json(h.body, {
    status: h.status,
    headers: {
      ...(h.abadi && boleh_cdn ? HEADER_ABADI : { "Cache-Control": "no-store" }),
      ...cors,
    },
  });
}

export async function OPTIONS(req: NextRequest) {
  const cors = headerAsal(req);
  return new NextResponse(null, {
    status: 204,
    headers: Object.keys(cors).length
      ? { ...cors, "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "content-type", "Access-Control-Max-Age": "86400" }
      : {},
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    // POST tak pernah disimpan browser/CDN — headernya sekadar tak menghalangi.
    return balas(await sintesis(body?.text, body?.lang), false, headerAsal(req));
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "internal error" }, { status: 500 });
  }
}

/* [tts-cepat-v1] Bentuk GET dari rute yang sama: satu-satunya bedanya, balasan
   yang berhasil boleh disimpan CDN Vercel + cache browser selama setahun. Kata
   yang sudah pernah diketuk siapa pun di POP yang sama tak lagi membangunkan
   fungsi ini — 1,5 detik jadi puluhan milidetik. */
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams;
    return balas(await sintesis(q.get("text"), q.get("lang")), true, headerAsal(req));
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "internal error" }, { status: 500 });
  }
}
