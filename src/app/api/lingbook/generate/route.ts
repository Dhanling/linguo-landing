// [lingbook-cms] Generator lesson (bab) Lingbook dengan AI — dipanggil dari CMS
// admin. Hasil = JSON bab siap-kurasi (glossary + dialog + tujuan + kosakata +
// grammar + latihan + test + roleplay), PERSIS mengikuti tipe Chapter di landing
// (src/data/lingbook/types.ts) tapi snake_case utk kolom DB. Best-effort: balikin
// { error } saat gagal biar UI CMS tetap jalan. Anthropic via raw fetch.
import { NextResponse } from "next/server";
import { corsHeaders } from "../_cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Coba model kuat dulu (kualitas struktur), fallback ke haiku bila tak tersedia.
const MODELS = ["claude-sonnet-5", "claude-haiku-4-5"];

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

export async function POST(req: Request) {
  const cors = corsHeaders(req.headers.get("origin"));
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI belum aktif (ANTHROPIC_API_KEY kosong)." }, { status: 503, headers: cors });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const langName = str(body.langName, 40) || "asing";
    const nativeName = str(body.nativeName, 40);
    const speechLang = str(body.speechLang, 20);
    const script = str(body.script, 20) || "latin";
    const level = str(body.level, 20) || "A1";
    const topic = str(body.topic, 200);
    const unitLabel = str(body.label, 120);

    if (!topic) {
      return NextResponse.json({ error: "Topik lesson wajib diisi." }, { status: 400, headers: cors });
    }

    const system =
      `Kamu penyusun kurikulum bahasa ${langName}${nativeName ? ` (${nativeName})` : ""} untuk ebook interaktif Linguo. ` +
      `Buat SATU unit/bab lengkap level ${level} bertema "${topic}". Skrip tulisan: ${script}. ` +
      `Semua teks penjelasan & terjemahan WAJIB Bahasa Indonesia. Konten harus akurat, alami, dan cocok level ${level}.\n\n` +
      `Keluaran HANYA berupa JSON valid (tanpa markdown, tanpa penjelasan di luar JSON) dengan bentuk:\n` +
      `{\n` +
      `  "title": string (judul dlm bahasa ${langName}),\n` +
      `  "subtitle": string (terjemahan/topik singkat Indonesia),\n` +
      `  "label": string (mis. "Unit 1 — <judul>"),\n` +
      `  "meta": string (mis. "± 10 menit · dialog + latihan"),\n` +
      `  "glossary": Record<string, Word>,  // key = id kata singkat (latin, tanpa spasi)\n` +
      `  "blocks": ContentBlock[],  // isi bacaan step Dialog\n` +
      `  "objectives": Objective[],\n` +
      `  "vocab_refs": string[],    // key glossary kata kunci\n` +
      `  "grammar_points": GrammarPointBlock[],\n` +
      `  "exercises": Exercise[],\n` +
      `  "test": TestQuestion[],\n` +
      `  "roleplay": RoleplayTurn[]\n` +
      `}\n\n` +
      `Definisi tipe:\n` +
      `Word = { surface: string(tulisan asli), reading?: string(cara baca utk CJK), romaji?: string(transliterasi latin), meaning: string(arti Indonesia), pos: string(kelas kata Indonesia), grammar?: Record<string,string> }\n` +
      `Token = { "ref": <keyGlossary> } | { "text": <literal, mis. tanda baca> }. Setiap "ref" WAJIB ada di glossary.\n` +
      `ContentBlock salah satu: ` +
      `{ "type":"heading", "text":string, "sub"?:string } | ` +
      `{ "type":"paragraph", "tokens":Token[], "translation"?:string } | ` +
      `{ "type":"dialog", "lines":[{ "speaker":string, "role"?:string, "tokens":Token[], "translation"?:string }] } | ` +
      `{ "type":"callout", "variant":"info"|"warning"|"tips", "title":string, "body":string }.\n` +
      `Objective = { "text":string, "section":"tujuan"|"dialog"|"vocab"|"grammar"|"latihan"|"test" }\n` +
      `GrammarPointBlock = { "type":"grammar_point", "title":string, "body":string, "pattern"?:string, "example"?:{ "tokens":Token[], "translation"?:string } }\n` +
      `Exercise salah satu: ` +
      `{ "type":"mc"|"fill", "q":string, "qTrans"?:string, "opts":string[], "ans":number(index benar), "expl":string } | ` +
      `{ "type":"match", "qTrans":string, "pairs":[string,string][] } | ` +
      `{ "type":"order", "qTrans":string, "words":string[](urutan benar), "expl":string }\n` +
      `TestQuestion = { "q":string, "opts":string[], "ans":number, "topic":string }\n` +
      `RoleplayTurn = { "ai":string, "trans":string, "choices": [{ "t":string, "tr":string }] | null }  // turn terakhir choices:null\n\n` +
      `Aturan: 8–14 entri glossary; 1 heading + 1 dialog (4–8 baris) di blocks; 3–4 objectives; ` +
      `vocab_refs 6–10 key; 2–3 grammar_points; 4–6 exercises campur tipe; 4–5 test; roleplay 3–5 turn. ` +
      `Untuk skrip non-latin isi reading/romaji. Jangan pakai key glossary yang tak didefinisikan.`;

    const userMsg = `Buat unit level ${level} tema "${topic}"${unitLabel ? ` (label acuan: ${unitLabel})` : ""} untuk bahasa ${langName}${speechLang ? ` (TTS ${speechLang})` : ""}. Balas HANYA JSON.`;

    let lastErr = "AI tidak merespons.";
    for (const model of MODELS) {
      try {
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: 8000,
            system,
            messages: [{ role: "user", content: userMsg }],
          }),
        });

        if (!r.ok) {
          lastErr = `Model ${model}: ${r.status}`;
          continue; // coba model berikutnya
        }

        const data = (await r.json()) as { content?: Array<{ type?: string; text?: string }> };
        const raw = Array.isArray(data.content)
          ? data.content.filter((b) => b.type === "text").map((b) => b.text || "").join("\n").trim()
          : "";

        // Bersihkan pagar markdown bila ada, ambil objek JSON pertama.
        const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");
        if (start === -1 || end === -1) {
          lastErr = "Keluaran AI bukan JSON.";
          continue;
        }
        let parsed: any;
        try {
          parsed = JSON.parse(cleaned.slice(start, end + 1));
        } catch {
          lastErr = "JSON dari AI tidak valid.";
          continue;
        }

        // Normalisasi + default aman.
        const chapter = {
          title: str(parsed.title, 200),
          subtitle: str(parsed.subtitle, 200),
          label: str(parsed.label, 200) || unitLabel,
          meta: str(parsed.meta, 200),
          glossary: parsed.glossary && typeof parsed.glossary === "object" ? parsed.glossary : {},
          blocks: Array.isArray(parsed.blocks) ? parsed.blocks : [],
          steps: [
            { id: "tujuan", label: "Tujuan" },
            { id: "dialog", label: "Dialog" },
            { id: "vocab", label: "Kosakata" },
            { id: "grammar", label: "Grammar" },
            { id: "latihan", label: "Latihan" },
            { id: "test", label: "Test Yourself" },
          ],
          objectives: Array.isArray(parsed.objectives) ? parsed.objectives : [],
          vocab_refs: Array.isArray(parsed.vocab_refs) ? parsed.vocab_refs : [],
          grammar_points: Array.isArray(parsed.grammar_points) ? parsed.grammar_points : [],
          exercises: Array.isArray(parsed.exercises) ? parsed.exercises : [],
          test: Array.isArray(parsed.test) ? parsed.test : [],
          roleplay: Array.isArray(parsed.roleplay) ? parsed.roleplay : [],
        };

        return NextResponse.json({ chapter, model }, { headers: cors });
      } catch (e: any) {
        lastErr = e?.message || String(e);
      }
    }

    return NextResponse.json({ error: `Gagal generate: ${lastErr}` }, { status: 502, headers: cors });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Kesalahan tak terduga." }, { status: 500, headers: cors });
  }
}
