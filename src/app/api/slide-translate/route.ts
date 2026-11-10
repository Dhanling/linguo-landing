// [slide-terjemah-en-v2] Terjemahan slide materi Indonesia → English untuk penampil
// slide siswa (/akun). Kembaran sisi dashboard memakai /api/ai (callClaude cheap);
// landing tak punya proxy AI umum, jadi rute kecil ini meniru placement-translate:
// klien mengirim DAFTAR kalimat (bukan dek utuh) — struktur slide tak pernah ke AI.
// Gagal → { t: null }, klien tetap menampilkan versi Indonesia.

import { NextRequest, NextResponse } from "next/server";
import { batasLaju, ipPemanggil } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

const SISTEM =
  "You translate teaching-slide text for a language course from Indonesian into natural, concise English. " +
  "Each input line is a numbered piece of slide text written in Indonesian (word meanings, sentence meanings, " +
  "grammar explanations, notes, quiz questions), often mixed with words or sentences in the TARGET language being taught. " +
  "Translate ONLY the Indonesian parts. Keep every target-language word, sentence, script, romanization and quoted " +
  "example EXACTLY as written. Keep markers unchanged: **bold**, ___ blanks, quotes, parentheses, arrows, slashes, emoji. " +
  "If a line has no Indonesian at all, return it unchanged. Keep it short like slide text; do not add explanations. " +
  'Reply with ONLY a JSON object {"t":["<line 1>", "<line 2>", ...]} with exactly one string per input line, in the same order.';

const cache = new Map<string, string>();
const CACHE_MAX = 20000;

async function lewatOpenAICompat(endpoint: string, key: string, model: string, user: string): Promise<string> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: SISTEM }, { role: "user", content: user }],
    }),
    signal: AbortSignal.timeout(35_000),
  });
  if (!res.ok) throw new Error(`${model} ${res.status}`);
  const data = await res.json().catch(() => null);
  return String(data?.choices?.[0]?.message?.content ?? "");
}

async function lewatGemini(user: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SISTEM }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 8000, responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 0 } },
      }),
      signal: AbortSignal.timeout(35_000),
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
      max_tokens: 8000,
      temperature: 0,
      system: SISTEM,
      messages: [{ role: "user", content: user }],
    }),
    signal: AbortSignal.timeout(35_000),
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
    const arr = (JSON.parse(teks.slice(a, b + 1)) as { t?: unknown }).t;
    if (!Array.isArray(arr) || arr.length !== n) return null;
    return arr.map((x) => (typeof x === "string" ? x : ""));
  } catch {
    return null;
  }
}

async function terjemahkan(baris: string[], bahasa: string): Promise<string[] | null> {
  const user = `Target language being taught: ${bahasa || "unknown"}\n` + baris.map((s, i) => `${i + 1}. ${s.replace(/\n/g, " ")}`).join("\n");
  const penyedia: [boolean, () => Promise<string>][] = [
    [!!DEEPSEEK_API_KEY, () => lewatOpenAICompat("https://api.deepseek.com/chat/completions", DEEPSEEK_API_KEY, DEEPSEEK_MODEL, user)],
    [!!GEMINI_API_KEY, () => lewatGemini(user)],
    [!!ANTHROPIC_API_KEY, () => lewatClaude(user)],
  ];
  for (const [ada, panggil] of penyedia) {
    if (!ada) continue;
    try {
      const hasil = urai(await panggil(), baris.length);
      if (hasil) return hasil;
    } catch (e) {
      console.warn("[slide-translate]", (e as Error).message);
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  if (!(await batasLaju(`slide-translate:${ipPemanggil(req.headers)}`, 3600, 120))) {
    return NextResponse.json({ t: null }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const teks = Array.isArray(body.t) ? (body.t as unknown[]).slice(0, 100).map((x) => String(x ?? "").slice(0, 2000)) : null;
  const bahasa = typeof body.language === "string" ? body.language.slice(0, 60) : "";
  if (!teks || teks.length === 0) return NextResponse.json({ t: null });

  const belum = [...new Set(teks.filter((t) => t.trim() && !cache.has(t)))];
  if (belum.length > 0) {
    const hasil = await terjemahkan(belum, bahasa);
    if (!hasil) return NextResponse.json({ t: null });
    belum.forEach((asli, i) => {
      const en = hasil[i]?.trim();
      if (!en) return;
      if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
      cache.set(asli, en);
    });
  }
  return NextResponse.json({ t: teks.map((t) => cache.get(t) ?? t) });
}
