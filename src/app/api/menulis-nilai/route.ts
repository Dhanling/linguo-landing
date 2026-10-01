// [latihan-menulis-v1] Penilaian tulisan tangan oleh AI untuk menu "Latihan Menulis".
// Klien mengirim PNG tulisan siswa (tinta hitam di atas putih) + aksara yang
// seharusnya ditulis; model vision membalas skor + komentar singkat.
//
// Wajib login: tiap panggilan memakan kuota AI, jadi rute ini tidak boleh bisa
// ditembak anonim. Yang dicek cuma "tokennya sah", bukan kepemilikan apa pun —
// tak ada data siswa yang dibaca/ditulis di sini.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
// Flash dulu (lebih jeli membaca tulisan tangan), Flash-Lite sebagai cadangan.
const MODEL = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
const BATAS_PNG = 600_000; // base64; kanvas 320px jauh di bawah ini

/* Pagar boros best-effort per kontainer: 40 penilaian / 10 menit per akun. */
const JENDELA = 10 * 60_000;
const MAKS = 40;
const hitung = new Map<string, number[]>();
function kenaBatas(uid: string): boolean {
  const kini = Date.now();
  const baru = (hitung.get(uid) ?? []).filter((t) => kini - t < JENDELA);
  if (baru.length >= MAKS) { hitung.set(uid, baru); return true; }
  baru.push(kini);
  hitung.set(uid, baru);
  return false;
}

const sistem = (bahasaBalasan: string) => `Kamu guru menulis aksara yang teliti dan ramah. Kamu menerima gambar tulisan tangan seorang pelajar (tinta hitam di atas putih, ditulis dengan jari atau stylus) dan aksara yang SEHARUSNYA ia tulis.
Nilai tulisan itu: apakah aksaranya terbaca sebagai aksara target, kelengkapan goresan, proporsi, dan bentuk tiap bagian. Tulisan jari boleh sedikit goyah — jangan menghukum garis yang tidak mulus, nilai bentuknya.
Kalau gambar kosong, coretan acak, atau jelas aksara lain, beri skor di bawah 30 dan katakan terus terang.
Balas HANYA JSON: {"score": bilangan bulat 0-100, "feedback": "1-2 kalimat penilaian", "tips": ["maksimal 3 saran perbaikan yang konkret, masing-masing satu kalimat pendek"]}.
Tulis feedback dan tips dalam ${bahasaBalasan}. Jangan menyapa, jangan memakai emoji.`;

async function tanyaGemini(model: string, png: string, pesan: string, bahasaBalasan: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sistem(bahasaBalasan) }] },
        contents: [{ role: "user", parts: [{ text: pesan }, { inlineData: { mimeType: "image/png", data: png } }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 400,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    },
  );
  if (!res.ok) throw new Error(`${model} ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  const data = await res.json().catch(() => null);
  const teks = String(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
  if (!teks) throw new Error(`${model} balas kosong`);
  return teks;
}

export async function POST(req: NextRequest) {
  try {
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "login dulu" }, { status: 401 });
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authErr } = await sb.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: "sesi tidak sah" }, { status: 401 });
    if (kenaBatas(user.id)) return NextResponse.json({ error: "terlalu sering, coba lagi nanti" }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const png = String(body?.png || "");
    const aksara = String(body?.char || "").trim().slice(0, 16);
    const baca = String(body?.roman || "").trim().slice(0, 40);
    const jenis = String(body?.script || "").trim().slice(0, 60);
    const bahasaBalasan = body?.uiLang === "en" ? "English" : "bahasa Indonesia";
    if (!aksara || !png || png.length > BATAS_PNG || !/^[A-Za-z0-9+/=]+$/.test(png)) {
      return NextResponse.json({ error: "png/char tidak sah" }, { status: 400 });
    }
    if (!GEMINI_API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY belum diset" }, { status: 503 });

    const pesan = `Aksara target: "${aksara}"${baca ? ` (dibaca: ${baca})` : ""}${jenis ? `. Jenis aksara: ${jenis}` : ""}. Nilai tulisan tangan pada gambar.`;
    const galat: string[] = [];
    for (const model of MODEL) {
      try {
        const teks = await tanyaGemini(model, png, pesan, bahasaBalasan);
        const a = teks.indexOf("{");
        const b = teks.lastIndexOf("}");
        if (a === -1 || b <= a) throw new Error("jawaban bukan JSON");
        const p = JSON.parse(teks.slice(a, b + 1)) as Record<string, unknown>;
        const skor = Math.round(Number(p.score));
        if (!Number.isFinite(skor)) throw new Error("skor kosong");
        return NextResponse.json({
          score: Math.max(0, Math.min(100, skor)),
          feedback: typeof p.feedback === "string" ? p.feedback.trim().slice(0, 400) : "",
          tips: Array.isArray(p.tips)
            ? p.tips.filter((x): x is string => typeof x === "string").map((x) => x.trim().slice(0, 200)).filter(Boolean).slice(0, 3)
            : [],
        });
      } catch (e) {
        galat.push(String((e as Error)?.message || e).slice(0, 160));
      }
    }
    return NextResponse.json({ error: galat.join(" | ") }, { status: 502 });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error)?.message || e).slice(0, 300) }, { status: 500 });
  }
}
