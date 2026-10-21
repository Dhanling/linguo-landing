// [lingwords-v2] Tema kata untuk Peta Kata Lingwords (makanan, keluarga, …).
//
// Klien (src/lib/lingwordsTema.ts) mengirim kata yang belum punya tema di cache
// lokalnya. Rute ini:
//   1. menjawab dari tabel bersama word_themes (siswa lain sudah pernah menandai);
//   2. sisanya diklasifikasi AI SEKALIGUS satu batch (bukan per kata), lalu
//      disimpan ke word_themes lewat service role — kata yang sama tak pernah
//      ditanyakan dua kali ke AI.
// Tabel belum dibuat → tetap menjawab dari AI (klien menyimpannya di localStorage).
//
// [sesi-cukup] Untuk semua siswa yang login (bukan staf): cuma mengklasifikasi
// kata milik pemanggil, maks 120 kata per panggilan, dan hasilnya di-cache global.
// Urutan penyedia bisa digeser lewat env LINGWORDS_TEMA_ORDER (pola EBOOK_KATA_ORDER).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { LW_THEME_IDS } from "@/lib/lingwordsTemaDaftar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jbtgciepdmqxxcjflrxz.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

type Penyedia = "deepseek" | "gemini" | "groq" | "claude";
const URUTAN_BAWAAN: Penyedia[] = ["deepseek", "gemini", "claude", "groq"];

function urutan(): Penyedia[] {
  const sah = new Set<string>(URUTAN_BAWAAN);
  const dari = (process.env.LINGWORDS_TEMA_ORDER || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is Penyedia => sah.has(s));
  return dari.length ? dari : URUTAN_BAWAAN;
}

const SISTEM =
  "You sort vocabulary of a language learner into topic groups. " +
  `Allowed theme ids: ${LW_THEME_IDS.join(", ")}. ` +
  "Meaning of each id: makanan = food, drinks, cooking, eating; keluarga = family, people, body, professions as persons, pronouns for people; " +
  "angka_waktu = numbers, days, months, time, dates, frequency; transportasi = vehicles, travel, directions, places in a city; " +
  "rumah = house, rooms, furniture, household items; cuaca = weather, seasons, nature, animals, plants; " +
  "belanja = shopping, money, prices, clothes, colors, sizes; sekolah_kerja = school, study, office, work, tools, technology; " +
  "sapaan = greetings, polite phrases, fixed expressions, interjections; kata_umum = common verbs, adjectives, adverbs, " +
  "prepositions, conjunctions and grammar words that do not belong to a topic above; lainnya = anything else. " +
  "Prefer a concrete topic over kata_umum when the word clearly belongs to it. " +
  'Reply with ONLY a JSON object {"themes":["<id>", ...]} with exactly one id per input line, in the same order.';

const pesan = (bahasa: string, kata: { word: string; meaning: string }[]) =>
  `Language code: ${bahasa}\n` + kata.map((k, i) => `${i + 1}. ${k.word}${k.meaning ? ` — ${k.meaning}` : ""}`).join("\n");

async function lewatOpenAICompat(endpoint: string, key: string, model: string, user: string): Promise<string> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SISTEM },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`${model} ${res.status}`);
  const data = await res.json().catch(() => null);
  return String(data?.choices?.[0]?.message?.content ?? "");
}

async function lewatGemini(user: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SISTEM }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 2000, responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 0 } },
      }),
      signal: AbortSignal.timeout(20_000),
    }
  );
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  const data = await res.json().catch(() => null);
  return String(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "");
}

async function lewatClaude(user: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-5-5",
      max_tokens: 2000,
      temperature: 0,
      system: SISTEM,
      messages: [{ role: "user", content: user }],
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`claude ${res.status}`);
  const data = await res.json().catch(() => null);
  return String(data?.content?.[0]?.text ?? "");
}

function urai(teks: string, n: number): string[] | null {
  const a = teks.indexOf("{");
  const b = teks.lastIndexOf("}");
  if (a === -1 || b <= a) return null;
  try {
    const p = JSON.parse(teks.slice(a, b + 1)) as { themes?: unknown };
    if (!Array.isArray(p.themes) || p.themes.length !== n) return null;
    return p.themes.map((x) => ((LW_THEME_IDS as string[]).includes(String(x)) ? String(x) : "lainnya"));
  } catch {
    return null;
  }
}

async function klasifikasi(bahasa: string, kata: { word: string; meaning: string }[]): Promise<string[]> {
  const user = pesan(bahasa, kata);
  const galat: string[] = [];
  for (const p of urutan()) {
    try {
      let teks = "";
      if (p === "deepseek") {
        if (!DEEPSEEK_API_KEY) continue;
        teks = await lewatOpenAICompat("https://api.deepseek.com/chat/completions", DEEPSEEK_API_KEY, "deepseek-chat", user);
      } else if (p === "gemini") {
        if (!GEMINI_API_KEY) continue;
        teks = await lewatGemini(user);
      } else if (p === "claude") {
        if (!ANTHROPIC_API_KEY) continue;
        teks = await lewatClaude(user);
      } else {
        if (!GROQ_API_KEY) continue;
        teks = await lewatOpenAICompat("https://api.groq.com/openai/v1/chat/completions", GROQ_API_KEY, "llama-3.1-8b-instant", user);
      }
      const hasil = urai(teks, kata.length);
      if (hasil) return hasil;
      galat.push(`${p}: jawaban tak sesuai`);
    } catch (e) {
      galat.push(String((e as Error)?.message || e).slice(0, 120));
    }
  }
  throw new Error(galat.join(" | ") || "tak ada penyedia");
}

function admin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "harus login" }, { status: 401 });
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: u, error: authErr } = await userClient.auth.getUser();
  if (authErr || !u.user) return NextResponse.json({ error: "sesi tidak sah" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { lang?: string; words?: { word?: string; meaning?: string }[] };
  const lang = String(body.lang || "").toLowerCase().trim().slice(0, 12);
  if (!/^[a-z-]{2,12}$/.test(lang)) return NextResponse.json({ error: "lang tidak sah" }, { status: 400 });
  const seen = new Set<string>();
  const kata = (Array.isArray(body.words) ? body.words : [])
    .map((w) => ({ word: String(w?.word || "").trim().slice(0, 80), meaning: String(w?.meaning || "").trim().slice(0, 80) }))
    .filter((w) => {
      const k = w.word.toLowerCase();
      if (!w.word || seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 120);
  if (!kata.length) return NextResponse.json({ themes: {} });

  const themes: Record<string, string> = {};
  const sb = admin();
  if (sb) {
    const { data } = await sb
      .from("word_themes")
      .select("word_key,theme")
      .eq("lang", lang)
      .in("word_key", kata.map((k) => k.word.toLowerCase()));
    ((data as { word_key: string; theme: string }[] | null) || []).forEach((r) => (themes[r.word_key] = r.theme));
  }
  const belum = kata.filter((k) => !themes[k.word.toLowerCase()]);
  if (belum.length) {
    let hasil: string[];
    try {
      hasil = await klasifikasi(lang, belum);
    } catch (e) {
      // Sebagian sudah terjawab dari cache → tetap dikirim; klien coba lagi lain kali.
      if (Object.keys(themes).length) return NextResponse.json({ themes, partial: true });
      return NextResponse.json({ error: String((e as Error)?.message || e).slice(0, 300) }, { status: 502 });
    }
    const baris = belum.map((k, i) => ({ lang, word_key: k.word.toLowerCase(), theme: hasil[i] }));
    baris.forEach((r) => (themes[r.word_key] = r.theme));
    if (sb) await sb.from("word_themes").upsert(baris, { onConflict: "lang,word_key", ignoreDuplicates: true }).then(() => {}, () => {});
  }
  return NextResponse.json({ themes });
}
