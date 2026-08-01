// [watch-translit-server-v1] Transliterasi baris (aksara non-Latin → Latin) via
// Gemini — dipakai bersama oleh dua route server:
//   • /api/translit            — tambalan LIVE untuk penonton yang sedang menonton
//   • /api/yt-transcript-cache — pengisian SEKALI JALAN ke cache transkrip
// Dulu logikanya cuma ada di /api/translit; dipisah ke sini supaya cache bisa
// diisi tanpa lewat klien (alignment stored-cue ↔ hasil dijamin benar karena
// yang diromanisasi persis baris yang tersimpan).

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// [watch-translit-claude-fallback-v1] Cadangan LINTAS-PROVIDER. Kuota harian
// Gemini free-tier (10rb/model) HABIS diam-diam → SEMUA model di MODELS balas 429
// dan transliterasi hilang total dari Watch & Learn (pinyin/romaji tak muncul
// sama sekali, bukan cuma telat). Rantai cadangan sesama Gemini tak menolong
// karena kuotanya seakun. Claude Haiku dipakai sebagai jaring terakhir: kunci
// ANTHROPIC_API_KEY sudah ada di Vercel (dipakai chat Ling & Lingbook) dan
// romanisasi itu tugas mekanis — Haiku (model termurah) sudah lebih dari cukup.
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const CLAUDE_MODEL = "claude-haiku-4-5";

// Rantai model fallback. Kuota free-tier Gemini dihitung PER-MODEL per hari
// (limit ~10k/model). Saat model utama kena 429 RESOURCE_EXHAUSTED (mentok
// harian) — gejalanya transliterasi (romaji/pinyin/dll) HILANG total di
// transkrip Watch & Learn — kita jatuh ke model cadangan yang punya jatah
// harian sendiri. Samakan pola dengan /api/word-deep.
const MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-flash-lite-latest"];

// Skema romanisasi per bahasa — biar hasilnya baku (mis. pinyin bertanda nada).
export const SCHEME: Record<string, string> = {
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
  bg: "the official Bulgarian Streamlined System romanization",
  // "standard Latin romanization" doang bikin Gemini kadang balas IPA fonetik
  // (T͡sɛ mɔjɑ…) — kunci ke sistem resmi + contoh biar hasilnya Latin biasa.
  uk: 'the official Ukrainian National (2010) romanization, e.g. "Це моя бабуся" → "Tse moia babusia"',
  km: "UNGEGN romanization",
  lo: "standard Latin romanization",
  my: "MLC romanization",
  ur: "standard Latin romanization (with vowels)",
  am: "standard Latin romanization",
  hy: "standard Latin romanization",
};

/** Bahasa yang PUNYA skema romanisasi (dipakai gerbang "perlu translit?"). */
export function hasTranslitScheme(langCode: string): boolean {
  return !!(SCHEME[langCode] ?? SCHEME[langCode.split("-")[0]]);
}

// Satu panggilan generateContent ke SATU model. Balikin teks (atau "" saat
// gagal — termasuk 429 kuota harian, yang jadi sinyal untuk coba model berikut).
async function callModel(model: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
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
  if (!res.ok) return "";
  const data = await res.json();
  return (
    data?.candidates?.[0]?.content?.parts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ?.map((p: any) => (typeof p?.text === "string" ? p.text : ""))
      .join("") ?? ""
  );
}

// [watch-translit-claude-fallback-v1] Saat kuota harian Gemini habis, SEMUA model
// di MODELS ikut 429 — dan itu bertahan berjam-jam (reset harian). Tanpa penanda,
// tiap permintaan tetap mengetuk 3 model dulu (3 round-trip sia-sia) sebelum jatuh
// ke Claude, jadi pinyin terasa lelet padahal cadangannya sehat. Begitu satu
// putaran Gemini gagal total, lewati Gemini untuk sementara di instance ini.
const GEMINI_COOLDOWN_MS = 10 * 60 * 1000;
let geminiCooldownUntil = 0;

// Coba tiap model di MODELS berurutan sampai ada yang membalas teks non-kosong.
// Balikin "" hanya bila semua model habis kuotanya.
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

// [watch-translit-claude-fallback-v1] Jaring terakhir: Claude (Messages API).
// Kontraknya SAMA persis dengan jalur Gemini — balas objek berkunci-nomor — jadi
// parser di bawah tak perlu tahu hasilnya datang dari provider yang mana.
async function callClaude(prompt: string, lines: number): Promise<string> {
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
        // ~60 baris romanisasi; longgar biar tak kepotong di kalimat panjang.
        max_tokens: Math.min(8000, 400 + lines * 120),
        system:
          "You transliterate text into Latin script. Reply with ONLY the JSON object — no prose, no markdown fences.",
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

/** Batas baris per panggilan Gemini (rem biaya + jaga akurasi penomoran). */
export const TRANSLIT_MAX_LINES = 60;

/**
 * Romanisasi satu batch baris. Keluaran SELALU sepanjang input & SEJAJAR
 * posisinya (baris kosong / gagal tetap "" di slotnya) — kontrak dengan semua
 * pemanggil, karena pergeseran indeks = pinyin mendarat di kalimat yang salah.
 */
export async function transliterateBatch(lines: string[], langCode: string): Promise<string[]> {
  const out = new Array<string>(lines.length).fill("");
  // [watch-translit-claude-fallback-v1] Cukup SALAH SATU provider yang terpasang —
  // dulu gerbang ini cuma cek kunci Gemini, jadi cadangan Claude tak akan pernah
  // kebagian giliran kalau kunci Gemini hilang/dicabut.
  if ((!GEMINI_API_KEY && !ANTHROPIC_API_KEY) || !lines.length) return out;

  // Hanya baris non-kosong yang dikirim ke Gemini; simpan indeks aslinya supaya
  // hasil bisa dikembalikan ke posisi yang benar. Batasi jumlah yang diromanisasi
  // (rem biaya), tapi keluaran tetap sepanjang input.
  const items = lines
    .map((l, i) => ({ i, l: (typeof l === "string" ? l : "").trim() }))
    .filter((x) => x.l.length > 0)
    .slice(0, TRANSLIT_MAX_LINES);
  if (!items.length) return out;

  // Varian regional (mis. "ar-EG") reuse skema base ("ar") — romanisasi sama.
  const scheme =
    SCHEME[langCode] ?? SCHEME[langCode.split("-")[0]] ?? "standard Latin-script romanization";
  const numbered = items.map((x, k) => `${k + 1}. ${x.l}`).join("\n");
  const prompt =
    `Transliterate each numbered line below into ${scheme}. ` +
    // Objek berkunci-nomor (bukan array polos): kalau model MELEWATI/MENGGABUNG
    // sebuah baris, hanya slot itu yang kosong — baris lain TAK ikut tergeser.
    `Return ONLY a JSON object whose keys are the line numbers (as strings "1", "2", …) ` +
    `and whose values are the Latin-script reading of that exact line, ` +
    `e.g. {"1":"…","2":"…"}. Include EVERY number from 1 to ${items.length}; ` +
    `never merge, split, reorder, or omit lines. ` +
    `Use ONLY ordinary Latin letters (plus the scheme's standard diacritics). ` +
    `NEVER use IPA or phonetic-notation symbols such as ɛ ɔ ɪ ʲ ʋ ə ʃ or tie bars. ` +
    // Penting utk Arab dsb: teks bisa MSA/fushah ATAU dialek (Levantine, Mesir,
    // Teluk, Maroko…). Romanisasikan bunyi yang BENAR-BENAR diucapkan/ditulis —
    // jangan "dibakukan" ke MSA (mis. jangan tambah akhiran i'rab -u/-i/-a yang
    // tak diucapkan). "شلونكم" → "shlonkum", bukan dipaksa jadi bentuk formal.
    `Reflect the actual pronunciation as written, including regional/colloquial ` +
    `(dialectal) forms; do NOT normalize to a formal/standard register. ` +
    `Do NOT translate the meaning. No notes, no markdown.\n\n${numbered}`;

  // Coba tiap model berurutan sampai ada yang membalas teks non-kosong. Model
  // utama yang mentok kuota harian (429 → "") jadi sinyal untuk coba cadangan.
  // [watch-translit-claude-fallback-v1] …dan kalau SELURUH rantai Gemini kosong
  // (kuota seakun habis), lanjut ke Claude — bukan menyerah dengan diam.
  const text = (await callGemini(prompt)) || (await callClaude(prompt, items.length));

  // Petakan hasil kembali ke posisi asli. Utamakan objek {nomor: translit}
  // (tahan baris hilang). Fallback array polos HANYA bila panjangnya PERSIS sama
  // dengan jumlah baris yang dikirim — kalau beda, posisinya tak bisa dipercaya
  // (jangan dipaksa, itu justru sumber salah-geser yang lama).
  try {
    const objStart = text.indexOf("{");
    const objEnd = text.lastIndexOf("}");
    const arrStart = text.indexOf("[");
    const arrEnd = text.lastIndexOf("]");
    const hasObj = objStart !== -1 && objEnd > objStart;
    const objFirst = hasObj && (arrStart === -1 || objStart < arrStart);
    if (objFirst) {
      const obj = JSON.parse(text.slice(objStart, objEnd + 1)) as Record<string, unknown>;
      for (let k = 0; k < items.length; k++) {
        const v = obj[String(k + 1)];
        if (typeof v === "string") out[items[k].i] = v.trim();
      }
    } else if (arrStart !== -1 && arrEnd > arrStart) {
      const arr = JSON.parse(text.slice(arrStart, arrEnd + 1));
      if (Array.isArray(arr) && arr.length === items.length) {
        for (let k = 0; k < items.length; k++) {
          const v = arr[k];
          if (typeof v === "string") out[items[k].i] = v.trim();
        }
      }
    }
  } catch {
    /* biarkan slot yang gagal tetap "" — best-effort */
  }

  return out;
}
