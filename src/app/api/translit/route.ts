// [watch-translit-v1] Transliterasi baris transkrip non-Latin → aksara Latin.
//
// Kenapa route ini ada: Edge Function transkrip (yt-transcript/yt-asr) TIDAK
// mengembalikan bacaan Latin (romaji/pinyin/dll), jadi baris bahasa Jepang,
// Mandarin, Arab, dll tak punya transliterasi. Di sini kita minta Gemini
// mentransliterasi tiap baris — cepat, seragam untuk semua bahasa non-Latin, dan
// tak butuh library berat (kuromoji dkk) di client.
//
// Best-effort: balikin { translit: [] } saat gagal/tak dikonfigurasi biar UI
// tetap jalan tanpa bacaan Latin.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const MODEL = "gemini-2.5-flash";

// Skema romanisasi per bahasa — biar hasilnya baku (mis. pinyin bertanda nada).
const SCHEME: Record<string, string> = {
  ja: "Hepburn romaji, with spaces between words",
  zh: "Hanyu Pinyin with tone marks",
  ko: "Revised Romanization of Korean",
  ru: "standard Latin romanization",
  ar: "standard Latin romanization (with vowels)",
  hi: "IAST romanization",
  th: "Royal Thai (RTGS) romanization",
  he: "standard Latin romanization (with vowels)",
  fa: "standard Latin romanization (with vowels)",
  el: "standard Latin romanization",
  ka: "national (Latin) romanization",
  bg: "standard Latin romanization",
  uk: "standard Latin romanization",
  km: "UNGEGN romanization",
  lo: "standard Latin romanization",
  my: "MLC romanization",
  ur: "standard Latin romanization (with vowels)",
  am: "standard Latin romanization",
  hy: "standard Latin romanization",
};

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) return NextResponse.json({ translit: [] });

    const body = await req.json().catch(() => ({}));
    const lines: string[] = Array.isArray(body?.lines)
      ? body.lines.filter((l: unknown) => typeof l === "string" && l.trim().length > 0).slice(0, 60)
      : [];
    const langCode = typeof body?.langCode === "string" ? body.langCode : "";
    if (!lines.length) return NextResponse.json({ translit: [] });

    const scheme = SCHEME[langCode] ?? "standard Latin-script romanization";
    const numbered = lines.map((l, i) => `${i + 1}. ${l}`).join("\n");
    const prompt =
      `Transliterate each numbered line below into ${scheme}. ` +
      `Return ONLY a JSON array of strings with EXACTLY ${lines.length} items, in the same ` +
      `order, where each item is the phonetic Latin reading of the corresponding line. ` +
      `Do NOT translate the meaning. No notes, no markdown.\n\n${numbered}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          // Transliterasi tak butuh reasoning — matikan "thinking" biar cepat & murah.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });
    if (!res.ok) return NextResponse.json({ translit: [] });

    const data = await res.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ?.map((p: any) => (typeof p?.text === "string" ? p.text : ""))
        .join("") ?? "";

    let arr: unknown = [];
    try {
      const s = text.indexOf("[");
      const e = text.lastIndexOf("]");
      arr = s !== -1 && e !== -1 && e > s ? JSON.parse(text.slice(s, e + 1)) : [];
    } catch {
      arr = [];
    }
    const translit = Array.isArray(arr) ? arr.map((x) => (typeof x === "string" ? x.trim() : "")) : [];
    return NextResponse.json({ translit });
  } catch {
    return NextResponse.json({ translit: [] });
  }
}
