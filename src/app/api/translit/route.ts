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

// Rantai model fallback. Kuota free-tier Gemini dihitung PER-MODEL per hari
// (limit ~10k/model). Saat model utama kena 429 RESOURCE_EXHAUSTED (mentok
// harian) — gejalanya transliterasi (romaji/pinyin/dll) HILANG total di
// transkrip Watch & Learn — kita jatuh ke model cadangan yang punya jatah
// harian sendiri. Samakan pola dengan /api/word-deep.
const MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-flash-lite-latest"];

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

// Coba tiap model di MODELS berurutan sampai ada yang membalas teks non-kosong.
// Balikin "" hanya bila semua model habis kuotanya.
async function callGemini(prompt: string): Promise<string> {
  for (const model of MODELS) {
    try {
      const text = await callModel(model, prompt);
      if (text.trim()) return text;
    } catch {
      /* coba model berikutnya */
    }
  }
  return "";
}

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) return NextResponse.json({ translit: [] });

    const body = await req.json().catch(() => ({}));
    // PENTING (alignment): jangan buang baris kosong lalu kirim sisanya — itu
    // menggeser indeks, sehingga romanisasi mendarat di baris yang SALAH (pinyin
    // kalimat A muncul di bawah kalimat B). Pertahankan panjang & posisi input;
    // baris kosong / gagal tetap "" di slotnya. Klien memetakan hasil per-posisi.
    const lines: string[] = Array.isArray(body?.lines)
      ? body.lines.map((l: unknown) => (typeof l === "string" ? l : ""))
      : [];
    const langCode = typeof body?.langCode === "string" ? body.langCode : "";
    if (!lines.length) return NextResponse.json({ translit: [] });

    // Keluaran SELALU sepanjang input & sejajar posisinya (kontrak dg pemanggil).
    const out = new Array<string>(lines.length).fill("");

    // Hanya baris non-kosong yang dikirim ke Gemini; simpan indeks aslinya supaya
    // hasil bisa dikembalikan ke posisi yang benar. Batasi jumlah yang diromanisasi
    // (rem biaya), tapi keluaran tetap sepanjang input.
    const items = lines
      .map((l, i) => ({ i, l: l.trim() }))
      .filter((x) => x.l.length > 0)
      .slice(0, 60);
    if (!items.length) return NextResponse.json({ translit: out });

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
    const text = await callGemini(prompt);

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

    return NextResponse.json({ translit: out });
  } catch {
    return NextResponse.json({ translit: [] });
  }
}
