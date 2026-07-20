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
const MODEL = "gemini-2.5-flash";
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

// Panggil Gemini generateContent mode JSON; balikin teks gabungan (atau "").
async function callGemini(prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
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

export interface GeneratedCard {
  word: string;
  meaning: string;
  example: string;
  exampleTranslation: string;
  translit: string;
}

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY belum diset." }, { status: 500 });
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

    const raw = await callGemini(prompt);
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
