// [watch-deck-ai-v1] Generate deck flashcard TEMATIK untuk Watch & Learn.
//
// Kenapa route ini ada: selain kata yang disimpan saat menonton, siswa bisa minta
// AI membuatkan satu deck kosakata berdasarkan TEMA (mis. "makanan & restoran",
// "perjalanan") di bahasa yang sedang dipelajari — arti dalam Bahasa Indonesia,
// contoh kalimat natural, plus transliterasi untuk bahasa non-Latin. Pola sama
// dengan /api/word-deep (Gemini flash tanpa thinking, JSON mode).
//
// Best-effort: balikin { error } saat gagal biar UI tetap jalan.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
// Rantai model fallback — samakan dengan /api/word-deep. Kuota free-tier Gemini
// dihitung PER-MODEL per hari; saat model utama kena 429 RESOURCE_EXHAUSTED
// (gejalanya "AI tidak mengembalikan JSON." karena callGemini balikin ""), kita
// jatuh ke model berikutnya yang punya jatah harian sendiri agar fitur tetap hidup.
const MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-flash-lite-latest"];

// [word-deep-claude-fallback-v1] Cadangan LINTAS-PROVIDER — samakan dengan
// /api/word-deep. Rantai MODELS di atas tak menolong saat kuota Gemini habis
// SEAKUN (saldo prepaid dipakai bareng semua model), jadi Claude jadi jaring
// terakhir dengan kunci & akun terpisah.
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const CLAUDE_MODEL = "claude-haiku-4-5";

// [word-deep-groq-tier-v1] Lapis TENGAH open-weight — samakan dengan /api/word-deep.
// Jauh lebih murah dari Claude untuk kerja mengarang JSON, akun terpisah dari Gemini.
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = "openai/gpt-oss-120b";
// Hanya seri 2.5+/3 (dan alias *-latest yang menunjuk ke sana) yang menerima
// thinkingConfig; model lain akan 400 kalau dikirim.
function supportsThinking(model: string): boolean {
  return (
    model.startsWith("gemini-2.5") ||
    model.startsWith("gemini-3") ||
    model.endsWith("-latest")
  );
}
const EXPLANATION_LANGUAGE = "Bahasa Indonesia";

// Nama Inggris tiap bahasa — dimasukkan langsung ke prompt ("... in French").
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

const NON_LATIN = new Set([
  "ja", "ko", "zh", "ar", "ru", "hi", "th", "he", "fa", "el", "ka", "bg", "uk",
  "km", "lo", "my", "ur", "am", "hy",
]);

const CEFR_LEVELS = new Set(["A1", "A2", "B1", "B2", "C1"]);

// Satu panggilan generateContent ke SATU model, mode JSON; balikin teks gabungan
// (atau "" saat gagal — termasuk 429 kuota harian, sinyal untuk coba model berikut).
async function callModel(model: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
        responseMimeType: "application/json",
        ...(supportsThinking(model) ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
      },
    }),
  });
  if (!res.ok) return "";
  const data = await res.json();
  return (
    data?.candidates?.[0]?.content?.parts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ?.map((p: any) => (typeof p?.text === "string" ? p.text : ""))
      .join("") ?? ""
  );
}

// Lewati Gemini sementara setelah satu putaran gagal total (kuota habis bertahan
// berjam-jam) supaya tak buang 3 round-trip sia-sia tiap permintaan.
const GEMINI_COOLDOWN_MS = 10 * 60 * 1000;
let geminiCooldownUntil = 0;

// Coba tiap model di MODELS berurutan sampai ada yang membalas teks non-kosong.
// Balikin "" hanya bila semua model habis kuota/gagal.
async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY || Date.now() < geminiCooldownUntil) return "";
  for (const model of MODELS) {
    try {
      const text = await callModel(model, prompt);
      if (text.trim()) {
        geminiCooldownUntil = 0;
        return text;
      }
    } catch {
      /* coba model berikutnya */
    }
  }
  geminiCooldownUntil = Date.now() + GEMINI_COOLDOWN_MS;
  return "";
}

// [word-deep-groq-tier-v1] Lapis tengah: Groq (API ala OpenAI), kontrak balasan sama.
async function callGroq(prompt: string): Promise<string> {
  if (!GROQ_API_KEY) return "";
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.5,
        // Deck bisa sampai puluhan kartu (kata + arti + contoh + translit).
        max_completion_tokens: 8000,
        messages: [
          {
            role: "system",
            content:
              "You are a language tutor API. Reply with ONLY the JSON requested — " +
              "no prose, no markdown fences.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === "string" ? text : "";
  } catch {
    return "";
  }
}

// [word-deep-claude-fallback-v1] Jaring terakhir: Claude (Messages API), kontrak
// balasan sama (JSON mentah) jadi parser di bawah tak peduli asal jawabannya.
async function callClaude(prompt: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) return "";
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        // Deck bisa sampai puluhan kartu (kata + arti + contoh + translit).
        max_tokens: 8000,
        system:
          "You are a language tutor API. Reply with ONLY the JSON requested — " +
          "no prose, no markdown fences.",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return Array.isArray(data?.content)
      ? data.content
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((b: any) => (b?.type === "text" && typeof b.text === "string" ? b.text : ""))
          .join("")
      : "";
  } catch {
    return "";
  }
}

// Satu pintu, tiga lapis lintas-akun: Gemini → Groq/open-weight → Claude.
async function generate(prompt: string): Promise<string> {
  return (await callGemini(prompt)) || (await callGroq(prompt)) || (await callClaude(prompt));
}

export interface GeneratedCard {
  word: string;
  meaning: string;
  example: string;
  exampleTranslation: string;
  translit: string;
}

export async function POST(req: NextRequest) {
  try {
    // Cukup salah satu provider terpasang (Gemini utama / Groq / Claude cadangan).
    if (!GEMINI_API_KEY && !GROQ_API_KEY && !ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Kunci AI belum diset." }, { status: 500 });
    }
    const body = (await req.json()) as {
      theme?: string;
      langCode?: string;
      level?: string;
      count?: number;
    };
    const theme = (body.theme ?? "").trim().slice(0, 120);
    const langCode = (body.langCode ?? "").trim();
    const level = CEFR_LEVELS.has((body.level ?? "").toUpperCase())
      ? (body.level ?? "").toUpperCase()
      : "";
    const count = Math.min(24, Math.max(4, Number(body.count) || 12));
    if (!theme || !langCode) {
      return NextResponse.json({ error: "theme & langCode wajib diisi." }, { status: 400 });
    }

    const language =
      ENGLISH_NAME[langCode] ?? ENGLISH_NAME[langCode.split("-")[0]] ?? "English";
    const nonLatin = NON_LATIN.has(langCode) || NON_LATIN.has(langCode.split("-")[0]);

    const prompt = [
      `You are a vocabulary curator for ${language} learners whose native language is ${EXPLANATION_LANGUAGE}.`,
      `Create a flashcard deck of exactly ${count} essential ${language} vocabulary items for the theme "${theme}"${level ? `, suitable for CEFR level ${level}` : ""}.`,
      `Return ONLY valid JSON with this exact shape:`,
      `{"title":"<judul deck singkat dalam Bahasa Indonesia (maks 5 kata)>","cards":[{"w":"<word/phrase in ${language}>","m":"<arti singkat dalam Bahasa Indonesia, maks 5 kata>","ex":"<one short natural example sentence in ${language}>","ext":"<terjemahan Bahasa Indonesia yang natural dari kalimat ex>"${nonLatin ? `,"tl":"<Latin transliteration of w>"` : ""}}]}`,
      `Rules: single words or short common phrases (max 3 words each), no duplicates, order from most common to least, pick words a learner would actually use for this theme.`,
    ].join("\n");

    const raw = await generate(prompt);
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) {
      return NextResponse.json({ error: "AI tidak mengembalikan JSON." }, { status: 502 });
    }
    let parsed: { title?: unknown; cards?: unknown };
    try {
      parsed = JSON.parse(raw.slice(start, end + 1)) as { title?: unknown; cards?: unknown };
    } catch {
      return NextResponse.json({ error: "Gagal parse hasil AI." }, { status: 502 });
    }

    const seen = new Set<string>();
    const cards: GeneratedCard[] = Array.isArray(parsed.cards)
      ? (parsed.cards as unknown[])
          .map((c) => {
            const o = (c ?? {}) as Record<string, unknown>;
            return {
              word: typeof o.w === "string" ? o.w.trim() : "",
              meaning: typeof o.m === "string" ? o.m.trim() : "",
              example: typeof o.ex === "string" ? o.ex.trim() : "",
              exampleTranslation: typeof o.ext === "string" ? o.ext.trim() : "",
              translit: typeof o.tl === "string" ? o.tl.trim() : "",
            };
          })
          .filter((c) => {
            if (!c.word || !c.meaning) return false;
            const k = c.word.toLowerCase();
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          })
          .slice(0, count)
      : [];
    if (!cards.length) {
      return NextResponse.json({ error: "Deck kosong — coba tema lain." }, { status: 502 });
    }

    const title =
      typeof parsed.title === "string" && parsed.title.trim()
        ? parsed.title.trim().slice(0, 80)
        : theme;
    return NextResponse.json({ title, cards });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
