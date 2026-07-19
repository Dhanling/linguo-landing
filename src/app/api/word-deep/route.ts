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
// Rantai model fallback. Kuota free-tier Gemini dihitung PER-MODEL per hari
// (limit ~10k/model). Saat model utama kena 429 RESOURCE_EXHAUSTED (mentok
// harian) — gejalanya drawer "Gagal memuat materi" — kita jatuh ke model
// berikutnya yang punya jatah harian sendiri, jadi fitur tetap hidup.
const MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];
// Hanya seri 2.5+/3 yang menerima thinkingConfig; 2.0 akan 400 kalau dikirim.
function supportsThinking(model: string): boolean {
  return model.startsWith("gemini-2.5") || model.startsWith("gemini-3");
}
// Bahasa penjelasan default (saat klien tak mengirim baseCode) — pengguna Linguo
// berbahasa Indonesia. Kalau baseCode dikirim (bahasa terjemahan pilihan pengguna),
// materi & jawaban ditulis dalam bahasa itu (lihat `explanationLanguage` di bawah).
const DEFAULT_EXPLANATION_LANGUAGE = "Indonesian";

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

// Perbaiki JSON dari model yang lupa meng-escape newline/tab MENTAH di dalam
// nilai string — kasus paling sering saat model menyisipkan tabel markdown ke
// field "answer" (baris baru asli bikin JSON.parse gagal, lalu seluruh blob
// {"answer":...,"followups":...} bocor mentah ke gelembung chat). Kita jalan per
// karakter dan hanya meng-escape kontrol saat sedang berada DI DALAM string,
// supaya newline struktural antar-token JSON tak ikut dirusak.
function repairJson(raw: string): string {
  let out = "";
  let inStr = false;
  let esc = false;
  for (const ch of raw) {
    if (esc) {
      out += ch;
      esc = false;
      continue;
    }
    if (ch === "\\") {
      out += ch;
      esc = true;
      continue;
    }
    if (ch === '"') {
      inStr = !inStr;
      out += ch;
      continue;
    }
    if (inStr) {
      if (ch === "\n") { out += "\\n"; continue; }
      if (ch === "\r") { out += "\\r"; continue; }
      if (ch === "\t") { out += "\\t"; continue; }
    }
    out += ch;
  }
  return out;
}

// Parse JSON longgar: coba apa adanya dulu, lalu perbaiki kontrol mentah dalam
// string. Balikin null kalau tetap gagal.
function parseJsonLoose(raw: string): Record<string, unknown> | null {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    try {
      return JSON.parse(repairJson(raw)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

// Satu panggilan generateContent ke SATU model. Balikin teks (atau "" saat
// gagal — termasuk 429 kuota harian, yang jadi sinyal untuk coba model berikut).
async function callModel(model: string, prompt: string, json: boolean): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        ...(json ? { responseMimeType: "application/json" } : {}),
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

// Coba tiap model di MODELS berurutan sampai ada yang membalas teks non-kosong.
// Jadi saat model utama mentok kuota harian (429 → ""), fitur tetap jalan lewat
// model cadangan yang punya jatah harian sendiri. Balikin "" hanya bila semua habis.
async function callGemini(prompt: string, json: boolean): Promise<string> {
  for (const model of MODELS) {
    const text = await callModel(model, prompt, json);
    if (text.trim()) return text;
  }
  return "";
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
    // Bahasa penjelasan = bahasa terjemahan pilihan pengguna (baseCode). Mis. belajar
    // Indonesia dgn terjemahan Inggris → penjelasan drawer dalam bahasa Inggris.
    // Tanpa baseCode → default Indonesia (perilaku lama).
    const baseCode = typeof body?.baseCode === "string" ? body.baseCode : "";
    const explanationLanguage =
      ENGLISH_NAME[baseCode] ?? ENGLISH_NAME[baseCode.split("-")[0]] ?? DEFAULT_EXPLANATION_LANGUAGE;
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
      // Usulan lanjutan sering menyisipkan kata bahasa target dalam «guillemets».
      // Untuk bahasa non-Latin (mis. Arab) minta "tl": bacaan Latin kata target
      // itu saja, biar chip bisa menampilkan transliterasi di bawah pertanyaan.
      const followupSpec = nonLatin
        ? `each an object { "q": a SHORT question in ${explanationLanguage} (max ~9 words) ` +
          `that wraps any cited ${language} word in «guillemets», "tl": the Latin phonetic ` +
          `reading of ONLY the ${language} (non-Latin) words inside «guillemets» in "q", in order ` +
          `(empty string if none) }`
        : `each a SHORT question in ${explanationLanguage} (max ~9 words)`;
      const followupShape = nonLatin
        ? `[{"q":"...","tl":"..."}, {"q":"...","tl":"..."}, {"q":"...","tl":"..."}]`
        : `["...", "...", "..."]`;
      const prompt =
        `You are a warm, concise ${language} tutor helping a learner whose language is ${explanationLanguage}. ` +
        `The learner is studying the ${language} word "${word}".${ctx} ` +
        `Answer their question in ${explanationLanguage}, clearly and briefly ` +
        `(2-4 short paragraphs max). Use concrete examples when helpful. When you cite a ` +
        `${language} word or phrase, wrap it in «guillemets» and add its meaning in ` +
        `parentheses.${nonLatin ? " Include Latin readings for non-Latin script." : ""} ` +
        `When the answer is naturally tabular — e.g. comparing forms, listing the tenses/` +
        `moods/aspects, a conjugation paradigm, or several items each with a few attributes — ` +
        `present THAT part as a GitHub-style markdown pipe table: a header row "| Column | Column |", ` +
        `a separator row "|---|---|", then the data rows. Precede the table with one short prose ` +
        `sentence. Use a table ONLY when it genuinely aids understanding; otherwise plain prose. ` +
        `Keep tables compact (2-4 columns). You may still wrap ${language} words in «guillemets» ` +
        `inside cells. No markdown headings. ALSO propose exactly 3 natural follow-up questions the learner ` +
        `would likely ask NEXT — ${followupSpec}, ` +
        `directly related to THIS question and answer, without repeating them. ` +
        `If your answer introduced a grammatical term the learner may not know (e.g. a case, ` +
        `mood, aspect, gender), make ONE follow-up ask what that term means in the context of ` +
        `${language} — phrased in ${explanationLanguage}, naming the language (e.g. in Indonesian "Apa itu vokatif dalam bahasa Georgia?"). ` +
        `Return ONLY a JSON object: {"answer": "...", "followups": ${followupShape}}.` +
        `\n\nQuestion: ${question}`;
      const raw = await callGemini(prompt, true);
      const s = raw.indexOf("{");
      const e = raw.lastIndexOf("}");
      let answer = "";
      let followups: { q: string; tl?: string }[] = [];
      if (s !== -1 && e > s) {
        const parsed = parseJsonLoose(raw.slice(s, e + 1));
        if (parsed) {
          answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";
          followups = Array.isArray(parsed.followups)
            ? (parsed.followups as unknown[])
                // Terima bentuk string (Latin) maupun objek { q, tl } (non-Latin).
                .map((it) => {
                  if (typeof it === "string") return { q: it.trim(), tl: "" };
                  const o = it as Record<string, unknown>;
                  return {
                    q: typeof o?.q === "string" ? o.q.trim() : "",
                    tl: typeof o?.tl === "string" ? o.tl.trim() : "",
                  };
                })
                .filter((it) => it.q)
                .slice(0, 3)
            : [];
        }
      }
      // Kalau JSON tetap gagal: pakai teks mentah HANYA bila ia bukan blob JSON
      // (kalau diawali "{" berarti JSON rusak — jangan bocorkan mentah ke chat).
      if (!answer) {
        const t = raw.trim();
        answer = t.startsWith("{") ? "Maaf, jawaban gagal dimuat. Coba tanya lagi." : t;
      }
      return NextResponse.json({ answer, followups });
    }

    // ── Mode overview: kartu belajar terstruktur ─────────────────────────────
    const prompt =
      `You are a concise ${language} tutor for a learner whose language is ${explanationLanguage}. Analyze the ` +
      `${language} word "${word}".${ctx} Return ONLY a JSON object, all explanatory text ` +
      `in ${explanationLanguage}, with this exact shape:\n` +
      `{\n` +
      `  "register": one of "netral" | "formal" | "casual" | "vulgar" | "sopan",\n` +
      `  "registerNote": one short sentence on the word's politeness/formality level and social context,\n` +
      `  "usage": 1-2 sentences on WHEN and HOW this word is typically used,\n` +
      `  "nuance": 1 sentence on connotation/nuance/feeling the word carries (empty string if none),\n` +
      `  "similar": array (0-3) of { "word": a similar/confusable ${language} word,${nonLatin ? ' "tl": its Latin reading,' : ""} "diff": one short sentence on how it differs from "${word}" },\n` +
      `  "examples": array (exactly 2) of { "target": a natural ${language} example sentence using "${word}",${nonLatin ? ' "tl": its Latin reading,' : ""} "gloss": its ${explanationLanguage} translation },\n` +
      `  "conjugation": include ONLY if "${word}" is a VERB, otherwise null. Object:\n` +
      `    { "caption": short ${explanationLanguage} label of the paradigm shown (e.g. the tense/aspect, like "Kala kini (present)"),\n` +
      `      "note": one short ${explanationLanguage} sentence about the base/dictionary form and what changes,\n` +
      `      "rows": array (the standard subject persons — saya, kamu, dia, kami, kalian, mereka — or the paradigm most useful for this verb) of\n` +
      `        { "label": the ${explanationLanguage} label for this form (the subject/person),\n` +
      `          "parts": ordered text segments that concatenate EXACTLY to the full ${language} conjugated form, each { "t": the segment text, "c": true ONLY for the segment(s) that CHANGE across the paradigm (the inflected prefix/suffix), false for the invariant stem },\n` +
      `          "suffix": the changing affix(es) for this form as a short ${language} string (e.g. "-s"),${nonLatin ? ' "tl": Latin reading of the full form,' : ""} "gloss": short ${explanationLanguage} meaning of this form } },\n` +
      `  "terms": array (0-4) of grammatical terms in ${explanationLanguage} that you used above and that a beginner may not know (e.g. "vokatif", "nominatif", "aspek", "gender gramatikal"); empty array if none\n` +
      `}` + translitHint + ` No markdown, no commentary outside the JSON.`;

    const raw = await callGemini(prompt, true);
    const s = raw.indexOf("{");
    const e = raw.lastIndexOf("}");
    if (s === -1 || e === -1 || e < s) {
      return NextResponse.json({ error: "parse_failed" }, { status: 200 });
    }
    const parsed = parseJsonLoose(raw.slice(s, e + 1));
    if (!parsed) {
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

    // Tabel konjugasi — hanya untuk kata kerja (null kalau bukan). Tiap baris
    // membawa `parts` (segmen kata; `c:true` = bagian yang berubah/terkonjugasi)
    // supaya klien bisa mewarnai afiks yang berubah di dalam kata utuh.
    const co = parsed.conjugation as Record<string, unknown> | null | undefined;
    let conjugation: {
      caption: string;
      note: string;
      rows: { label: string; parts: { t: string; c: boolean }[]; suffix: string; tl: string; gloss: string }[];
    } | null = null;
    if (co && typeof co === "object" && Array.isArray(co.rows)) {
      const rows = (co.rows as unknown[])
        .map((r) => {
          const o = r as Record<string, unknown>;
          const parts = Array.isArray(o.parts)
            ? (o.parts as unknown[])
                .map((p) => {
                  const po = p as Record<string, unknown>;
                  return { t: str(po.t), c: po.c === true };
                })
                .filter((p) => p.t)
            : [];
          return { label: str(o.label), parts, suffix: str(o.suffix), tl: str(o.tl), gloss: str(o.gloss) };
        })
        .filter((r) => r.parts.length > 0)
        .slice(0, 8);
      if (rows.length) {
        conjugation = { caption: str(co.caption), note: str(co.note), rows };
      }
    }

    const terms = Array.isArray(parsed.terms)
      ? (parsed.terms as unknown[])
          .map((t) => str(t))
          .filter((t) => t.length > 0 && t.length <= 40)
          .slice(0, 4)
      : [];

    return NextResponse.json({
      register: str(parsed.register).toLowerCase(),
      registerNote: str(parsed.registerNote),
      usage: str(parsed.usage),
      nuance: str(parsed.nuance),
      similar,
      examples,
      conjugation,
      terms,
    });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 200 });
  }
}
