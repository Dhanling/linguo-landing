// [ebook-kata-deepseek-v1] Arti kata yang diketuk di reader e-book.
//
// Sebelumnya popup memanggil edge function `word-info` — jalur yang dipakai
// bareng Watch and Learn. Dua alasan pindah ke rute sendiri:
//   1. kuotanya HABIS (`{"error":"Kuota AI habis","reason":"quota"}`, 20 Agu
//      2026), jadi baris arti tak pernah terisi di produksi;
//   2. panggilannya mungil (satu kata + satu kalimat, keluaran ±30 token) —
//      penyedia termurah yang ada saja sudah cukup, tak perlu model besar.
//
// ⚠️ Urutan penyedianya BISA DIGESER TANPA DEPLOY lewat env `EBOOK_KATA_ORDER`
// (mis. `gemini,deepseek,groq`). Ini bukan hiasan: tarif LLM berubah tanpa
// pemberitahuan — 16 Agu 2026 DeepSeek naik ±2x sekaligus memperkenalkan tarif
// peak/off-peak, dan jam peak-nya persis jam kerja Linguo. Untuk bentuk
// panggilan di sini (prompt pendek, nyaris tanpa cache-hit) Gemini Flash-Lite
// justru lebih murah per token. Bawaannya DeepSeek karena tagihannya kantong
// terpisah dan tak ikut tumbang waktu saldo Gemini/Anthropic kosong.
//
// Penghematan terbesar bukan soal pilih penyedia, melainkan CACHE BERSAMA di
// bawah: satu modul dibaca ratusan siswa dan kata yang diketuk itu-itu juga,
// jadi sesudah beberapa hari hampir semua ketukan dijawab tanpa AI sama sekali.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_MODEL = process.env.EBOOK_KATA_DEEPSEEK_MODEL || "deepseek-chat";
const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
// Flash-Lite: model termurah yang masih patuh JSON pendek. Tugasnya cuma
// menyebut arti satu kata — model yang lebih besar tak membuatnya lebih benar.
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = "llama-3.1-8b-instant";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

type Penyedia = "deepseek" | "gemini" | "groq";
const URUTAN_BAWAAN: Penyedia[] = ["deepseek", "gemini", "groq"];

function urutan(): Penyedia[] {
  const dari = (process.env.EBOOK_KATA_ORDER || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is Penyedia => s === "deepseek" || s === "gemini" || s === "groq");
  return dari.length ? dari : URUTAN_BAWAAN;
}

const SISTEM =
  "You are a bilingual dictionary for Indonesian learners. " +
  "Given one word from a language-learning module and the sentence it appears in, " +
  "reply with ONLY a JSON object (no markdown fences, no commentary): " +
  '{"meaning":"arti singkat dalam bahasa Indonesia, maksimal 6 kata",' +
  '"type":"kelas kata dalam bahasa Indonesia (kata benda/kata kerja/kata sifat/kata ganti/kata depan/kata seru/angka)",' +
  '"base":"bentuk dasar/kamus kalau kata ini bentuk turunan atau terkonjugasi, kalau tidak string kosong"}. ' +
  "Give the meaning the word carries IN THAT SENTENCE, not every possible meaning.";

const pesan = (kata: string, kalimat: string, bahasa: string) =>
  `Language: ${bahasa}\nWord: ${kata}\nSentence: ${kalimat || kata}`;

/* ── penyedia ─────────────────────────────────────────────────────────────── */

async function lewatOpenAICompat(
  endpoint: string, key: string, model: string, kata: string, kalimat: string, bahasa: string,
): Promise<string> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: 200,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SISTEM },
        { role: "user", content: pesan(kata, kalimat, bahasa) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`${model} ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  const data = await res.json().catch(() => null);
  const teks = String(data?.choices?.[0]?.message?.content ?? "").trim();
  if (!teks) throw new Error(`${model} balas kosong`);
  return teks;
}

async function lewatGemini(kata: string, kalimat: string, bahasa: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SISTEM }] },
        contents: [{ role: "user", parts: [{ text: pesan(kata, kalimat, bahasa) }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 200,
          responseMimeType: "application/json",
          // Tanpa ini Flash-Lite bisa menghabiskan seluruh jatah keluaran untuk
          // berpikir lalu mengembalikan teks kosong — untuk mencari arti satu
          // kata, penalarannya memang tak dibutuhkan.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  const data = await res.json().catch(() => null);
  const teks = String(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
  if (!teks) throw new Error("gemini balas kosong");
  return teks;
}

async function tanyaAI(kata: string, kalimat: string, bahasa: string) {
  const galat: string[] = [];
  for (const p of urutan()) {
    try {
      if (p === "deepseek") {
        if (!DEEPSEEK_API_KEY) { galat.push("deepseek: tanpa kunci"); continue; }
        return {
          teks: await lewatOpenAICompat(DEEPSEEK_ENDPOINT, DEEPSEEK_API_KEY, DEEPSEEK_MODEL, kata, kalimat, bahasa),
          oleh: "deepseek",
        };
      }
      if (p === "gemini") {
        if (!GEMINI_API_KEY) { galat.push("gemini: tanpa kunci"); continue; }
        return { teks: await lewatGemini(kata, kalimat, bahasa), oleh: "gemini" };
      }
      if (!GROQ_API_KEY) { galat.push("groq: tanpa kunci"); continue; }
      return {
        teks: await lewatOpenAICompat(GROQ_ENDPOINT, GROQ_API_KEY, GROQ_MODEL, kata, kalimat, bahasa),
        oleh: "groq",
      };
    } catch (e) {
      galat.push(String((e as Error)?.message || e).slice(0, 160));
    }
  }
  throw new Error(galat.join(" | ") || "tak ada penyedia");
}

/* ── cache bersama (Supabase Storage) ──────────────────────────────────────
   Pola & alasannya sama dengan cache TTS di /api/tts: satu modul dibaca ratusan
   siswa, dan kata yang diketuk itu-itu juga. Best-effort total — bucket belum
   ada / kredensial kosong / storage error = jalan terus ke AI. */
const BUCKET = "ai-kata-cache";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const jalurCache = (bahasa: string, kata: string, kalimat: string) =>
  `${bahasa}/${crypto.createHash("sha256").update(`${bahasa}|${kata}|${kalimat}`).digest("hex").slice(0, 40)}.json`;

async function dariCache(jalur: string): Promise<Record<string, unknown> | null> {
  const sb = admin();
  if (!sb) return null;
  try {
    const { data, error } = await sb.storage.from(BUCKET).download(jalur);
    if (error || !data) return null;
    return JSON.parse(await data.text());
  } catch {
    return null;
  }
}

async function keCache(jalur: string, isi: unknown) {
  const sb = admin();
  if (!sb) return;
  const berkas = Buffer.from(JSON.stringify(isi));
  const opsi = { contentType: "application/json", upsert: true, cacheControl: "31536000" };
  try {
    const { error } = await sb.storage.from(BUCKET).upload(jalur, berkas, opsi);
    // Bucket belum pernah dibuat: bikin sekali (privat), lalu coba lagi.
    if (error && /bucket/i.test(error.message || "")) {
      await sb.storage.createBucket(BUCKET, { public: false }).catch(() => {});
      await sb.storage.from(BUCKET).upload(jalur, berkas, opsi);
    }
  } catch {
    /* sekadar cache */
  }
}

/* ── rute ─────────────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const kata = String(body?.word || "").trim().slice(0, 60);
    const kalimat = String(body?.sentence || "").trim().slice(0, 300);
    const bahasa = String(body?.language || "").trim().slice(0, 40);
    if (!kata || !bahasa) return NextResponse.json({ error: "word/language kosong" }, { status: 400 });

    const jalur = jalurCache(bahasa, kata.toLowerCase(), kalimat);
    const tersimpan = await dariCache(jalur);
    if (tersimpan) return NextResponse.json({ ...tersimpan, cached: true });

    const { teks, oleh } = await tanyaAI(kata, kalimat, bahasa);
    // Model kadang tetap membungkus JSON-nya dengan pagar ```json.
    const a = teks.indexOf("{");
    const b = teks.lastIndexOf("}");
    if (a === -1 || b <= a) return NextResponse.json({ error: "jawaban bukan JSON" }, { status: 502 });
    const p = JSON.parse(teks.slice(a, b + 1)) as Record<string, unknown>;
    const hasil = {
      meaning: typeof p.meaning === "string" ? p.meaning.trim().slice(0, 120) : "",
      type: typeof p.type === "string" ? p.type.trim().slice(0, 40) : "",
      base: typeof p.base === "string" ? p.base.trim().slice(0, 60) : "",
    };
    if (!hasil.meaning && !hasil.type) return NextResponse.json({ error: "arti kosong" }, { status: 502 });

    await keCache(jalur, hasil);
    return NextResponse.json({ ...hasil, by: oleh });
  } catch (e) {
    // Semua penyedia habis pun bukan alasan menjatuhkan popup: klien
    // menyembunyikan baris arti dan pelafalannya tetap jalan.
    return NextResponse.json({ error: String((e as Error)?.message || e).slice(0, 300) }, { status: 502 });
  }
}
