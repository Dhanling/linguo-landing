// [watch-word-deep-v1] Mode "Belajar Mendalami Kata" untuk player Watch & Learn.
//
// Kenapa route ini ada: tooltip kata hanya kasih arti singkat + analisa grammar
// (lewat Edge Function word-info yang dipakai bareng app mobile). Untuk mode layar
// penuh kita butuh yang lebih kaya — tingkat kesopanan (register), kapan dipakai,
// nuansa, dan perbandingan dengan kata mirip — plus tanya-jawab lanjutan bebas.
// Semua digenerate Gemini di sini biar tak perlu ubah Edge Function bersama.
//
// Dua mode:
//   overview → JSON terstruktur (register + usage + nuance + similar + examples)
//   ask      → jawaban teks bebas atas pertanyaan lanjutan tentang kata itu
//
// Best-effort: balikin { error } / teks kosong saat gagal biar UI tetap jalan.

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

// Panggil Gemini generateContent; balikin teks gabungan (atau "" saat gagal).
async function callGemini(prompt: string, json: boolean): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        ...(json ? { responseMimeType: "application/json" } : {}),
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

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "not_configured" }, { status: 200 });
    }

    const body = await req.json().catch(() => ({}));
    const word = typeof body?.word === "string" ? body.word.trim().slice(0, 120) : "";
    const sentence = typeof body?.sentence === "string" ? body.sentence.trim().slice(0, 500) : "";
    const langCode = typeof body?.langCode === "string" ? body.langCode : "en";
    const mode = body?.mode === "ask" ? "ask" : "overview";
    if (!word) return NextResponse.json({ error: "no_word" }, { status: 200 });

    const language = ENGLISH_NAME[langCode] ?? ENGLISH_NAME[langCode.split("-")[0]] ?? "English";
    const nonLatin = NON_LATIN.has(langCode) || NON_LATIN.has(langCode.split("-")[0]);
    const translitHint = nonLatin
      ? ` For every ${language} word or example, ALSO give its Latin phonetic reading in a "tl" field.`
      : "";
    const ctx = sentence ? ` It appears in this sentence: "${sentence}".` : "";

    // ── Mode ask: tanya-jawab lanjutan bebas ─────────────────────────────────
    // Balikin jawaban + 3 usulan pertanyaan lanjutan yang nyambung dengan
    // pertanyaan & jawaban ini (biar chip "Lanjutan" muncul lagi tiap giliran).
    if (mode === "ask") {
      const question = typeof body?.question === "string" ? body.question.trim().slice(0, 400) : "";
      if (!question) return NextResponse.json({ answer: "", followups: [] }, { status: 200 });
      const prompt =
        `You are a warm, concise ${language} tutor helping an Indonesian learner. ` +
        `The learner is studying the ${language} word "${word}".${ctx} ` +
        `Answer their question in ${EXPLANATION_LANGUAGE}, clearly and briefly ` +
        `(2-4 short paragraphs max). Use concrete examples when helpful. When you cite a ` +
        `${language} word or phrase, wrap it in «guillemets» and add its meaning in ` +
        `parentheses.${nonLatin ? " Include Latin readings for non-Latin script." : ""} ` +
        `No markdown headings. ALSO propose exactly 3 natural follow-up questions the learner ` +
        `would likely ask NEXT — each a SHORT question in ${EXPLANATION_LANGUAGE} (max ~9 words), ` +
        `directly related to THIS question and answer, without repeating them. ` +
        `Return ONLY a JSON object: {"answer": "...", "followups": ["...", "...", "..."]}.` +
        `\n\nQuestion: ${question}`;
      const raw = await callGemini(prompt, true);
      const s = raw.indexOf("{");
      const e = raw.lastIndexOf("}");
      let answer = "";
      let followups: string[] = [];
      if (s !== -1 && e > s) {
        try {
          const parsed = JSON.parse(raw.slice(s, e + 1)) as Record<string, unknown>;
          answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";
          followups = Array.isArray(parsed.followups)
            ? (parsed.followups as unknown[])
                .map((q) => (typeof q === "string" ? q.trim() : ""))
                .filter(Boolean)
                .slice(0, 3)
            : [];
        } catch {
          /* fallback di bawah */
        }
      }
      // Kalau JSON gagal, pakai teks mentah sebagai jawaban tanpa usulan.
      if (!answer) answer = raw.trim();
      return NextResponse.json({ answer, followups });
    }

    // ── Mode overview: kartu belajar terstruktur ─────────────────────────────
    const prompt =
      `You are a concise ${language} tutor for an Indonesian learner. Analyze the ` +
      `${language} word "${word}".${ctx} Return ONLY a JSON object, all explanatory text ` +
      `in ${EXPLANATION_LANGUAGE}, with this exact shape:\n` +
      `{\n` +
      `  "register": one of "netral" | "formal" | "casual" | "vulgar" | "sopan",\n` +
      `  "registerNote": one short sentence on the word's politeness/formality level and social context,\n` +
      `  "usage": 1-2 sentences on WHEN and HOW this word is typically used,\n` +
      `  "nuance": 1 sentence on connotation/nuance/feeling the word carries (empty string if none),\n` +
      `  "similar": array (0-3) of { "word": a similar/confusable ${language} word,${nonLatin ? ' "tl": its Latin reading,' : ""} "diff": one short sentence on how it differs from "${word}" },\n` +
      `  "examples": array (exactly 2) of { "target": a natural ${language} example sentence using "${word}",${nonLatin ? ' "tl": its Latin reading,' : ""} "gloss": its ${EXPLANATION_LANGUAGE} translation }\n` +
      `}` + translitHint + ` No markdown, no commentary outside the JSON.`;

    const raw = await callGemini(prompt, true);
    const s = raw.indexOf("{");
    const e = raw.lastIndexOf("}");
    if (s === -1 || e === -1 || e < s) {
      return NextResponse.json({ error: "parse_failed" }, { status: 200 });
    }
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw.slice(s, e + 1));
    } catch {
      return NextResponse.json({ error: "parse_failed" }, { status: 200 });
    }

    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const similar = Array.isArray(parsed.similar)
      ? (parsed.similar as unknown[])
          .map((it) => {
            const o = it as Record<string, unknown>;
            return { word: str(o.word), tl: str(o.tl), diff: str(o.diff) };
          })
          .filter((it) => it.word && it.diff)
          .slice(0, 3)
      : [];
    const examples = Array.isArray(parsed.examples)
      ? (parsed.examples as unknown[])
          .map((it) => {
            const o = it as Record<string, unknown>;
            return { target: str(o.target), tl: str(o.tl), gloss: str(o.gloss) };
          })
          .filter((it) => it.target)
          .slice(0, 3)
      : [];

    return NextResponse.json({
      register: str(parsed.register).toLowerCase(),
      registerNote: str(parsed.registerNote),
      usage: str(parsed.usage),
      nuance: str(parsed.nuance),
      similar,
      examples,
    });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 200 });
  }
}
