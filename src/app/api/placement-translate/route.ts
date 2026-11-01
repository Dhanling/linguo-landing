// [placement-pengantar-inggris-v1] Placement test dengan bahasa pengantar Inggris.
//
// Bank soal semua bahasa ditulis berpengantar Indonesia ("Bagaimana cara mengatakan
// 'halo' dalam bahasa Swedia?"). Peserta yang tak nyaman berbahasa Indonesia (atau
// yang belajar lewat Inggris, mis. Inggris → Swedia) memilih "English" di popup tips;
// klien mengirim set soalnya ke sini dan menerima versi Inggris.
//
// Struktur soal TIDAK pernah diserahkan ke AI: kita cabut dulu teks pengantarnya
// (question/prompt/translation/context/explanation/tip, opsi pilihan ganda, pasangan
// matching, terjemahan "(…)" di ujung template missing) jadi daftar bernomor, AI
// menerjemahkan daftar itu saja, lalu teksnya dipasang balik. Jawaban benar yang
// dicocokkan per string (fillChoice/fill/missing/dragDrop) tidak disentuh, jadi
// penilaian tetap sama dengan versi Indonesia.
//
// Gagal / sebagian gagal → teks aslinya dipakai (tes tetap jalan berbahasa Indonesia).
// Cache per string di memori instance — soal yang sama tak diterjemahkan dua kali.

import { NextRequest, NextResponse } from "next/server";
import type { Question } from "@/data/placement/english";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

const SISTEM =
  "You localize a language placement test from Indonesian into English. " +
  "Each input line is a numbered piece of test text written in Indonesian, often mixed with words or sentences " +
  "in the TARGET language being tested (e.g. Swedish, Japanese, Arabic). " +
  "Translate ONLY the Indonesian parts into natural, concise English. " +
  "Keep every target-language word, sentence, script, romanization and quoted example EXACTLY as written — never translate it. " +
  "Indonesian meanings/glosses of target words (e.g. 'rumah (itu)', 'terima kasih') DO become English ('the house', 'thank you'). " +
  "Keep markers unchanged: **bold**, ___ blanks, quotes, parentheses, arrows, slashes, emoji. " +
  "If a line has no Indonesian at all, return it unchanged. " +
  "When the line is an Indonesian sentence that names a language ('bahasa Swedia'), use the English name ('Swedish'). " +
  'Reply with ONLY a JSON object {"t":["<line 1>", "<line 2>", ...]} with exactly one string per input line, in the same order.';

const cache = new Map<string, string>();
const CACHE_MAX = 5000;

type Slot = { get: () => string; set: (v: string) => void };

// Kumpulkan semua teks pengantar satu soal (setter-nya menulis ke salinan soal).
function slotSoal(q: any): Slot[] {
  const slots: Slot[] = [];
  const field = (obj: any, key: string | number) => {
    if (typeof obj?.[key] === "string" && obj[key].trim()) {
      slots.push({ get: () => obj[key], set: (v) => { obj[key] = v; } });
    }
  };
  for (const k of ["question", "prompt", "translation", "context", "explanation", "tip"]) field(q, k);
  if (q.type === "multiple" && Array.isArray(q.options)) q.options.forEach((_: unknown, i: number) => field(q.options, i));
  if (q.type === "matching" && Array.isArray(q.pairs)) {
    q.pairs.forEach((p: any) => { field(p, "left"); field(p, "right"); });
  }
  // Template missing: cuma terjemahan "(…)" di ujung yang boleh diubah — blank "___" tetap utuh.
  if (q.type === "missing" && typeof q.template === "string") {
    const m = q.template.match(/^([\s\S]*?)(\s*\([^()]*\)\s*)$/);
    if (m && !m[2].includes("___")) {
      const kepala = m[1];
      let ekor = m[2];
      slots.push({ get: () => ekor, set: (v) => { if (!v.includes("___")) { ekor = v; q.template = kepala + v; } } });
    }
  }
  return slots;
}

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
  const user = `Target language being tested: ${bahasa}\n` + baris.map((s, i) => `${i + 1}. ${s.replace(/\n/g, " ")}`).join("\n");
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
      console.warn("[placement-translate]", (e as Error).message);
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const soal = Array.isArray(body.questions) ? (body.questions as Question[]).slice(0, 60) : null;
  const bahasa = typeof body.language === "string" ? body.language.slice(0, 60) : "";
  if (!soal || soal.length === 0) return NextResponse.json({ questions: null });

  const salinan = JSON.parse(JSON.stringify(soal)) as Question[];
  const slots = salinan.flatMap(slotSoal);
  const belum = [...new Set(slots.map((s) => s.get()).filter((t) => t.length <= 2000 && !cache.has(t)))];

  if (belum.length > 0) {
    const hasil = await terjemahkan(belum, bahasa);
    if (!hasil) return NextResponse.json({ questions: null });
    belum.forEach((asli, i) => {
      const en = hasil[i]?.trim();
      // Terjemahan yang membuang blank "___" atau penanda tebal dianggap rusak.
      const blankSama = (asli.match(/_{2,}/g) || []).length === (en?.match(/_{2,}/g) || []).length;
      const tebalSama = (asli.match(/\*\*/g) || []).length === (en?.match(/\*\*/g) || []).length;
      if (en && blankSama && tebalSama) {
        if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
        cache.set(asli, en);
      }
    });
  }

  for (const s of slots) {
    const en = cache.get(s.get());
    if (en) s.set(en);
  }
  return NextResponse.json({ questions: salinan });
}
