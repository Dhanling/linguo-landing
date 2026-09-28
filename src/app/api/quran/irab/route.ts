// [quran-irab-ai-v1] Analisa i'rab SATU ayat untuk pembaca /alquran.
//
// Data morfologi (Quranic Arabic Corpus) hanya memberi bentuk kata: jenis, kasus,
// akar, wazan. Peran kata dalam kalimat — fa'il, maf'ul bih, mubtada', khabar,
// na'at, mudhaf ilaih — butuh penalaran sintaksis, jadi dikerjakan AI. Morfologi
// dioper ke prompt sebagai PEGANGAN supaya model tak mengarang kasus/akar sendiri.
//
// Biaya: GET per kunci ayat + CDN s-maxage setahun → tiap ayat (maks 6.236)
// digenerate SEKALI per region, pembaca berikutnya dilayani cache.
// Rantai penyedia: DeepSeek → Claude (pola sama dengan /api/word-deep).
import { NextRequest, NextResponse } from "next/server";
import { ambilAyat, type HasilIrab } from "@/lib/quran/sumber";
import { ringkasKata, uraiSegmen, type SegmenMentah } from "@/lib/quran/morfologi";

export const runtime = "nodejs";
export const maxDuration = 60;

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const CLAUDE_MODEL = "claude-haiku-4-5";

const SISTEM =
  "Kamu ustadz nahwu-sharaf yang mengajar orang Indonesia. Balas HANYA dengan objek JSON " +
  "yang diminta — tanpa prosa pembuka, tanpa markdown fence.";

async function callDeepSeek(prompt: string): Promise<string> {
  if (!DEEPSEEK_API_KEY) return "";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 40_000);
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        temperature: 0.2,
        max_tokens: 8000,
        messages: [
          { role: "system", content: SISTEM },
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
  } finally {
    clearTimeout(timer);
  }
}

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
        max_tokens: 8000,
        system: SISTEM,
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

function parse(raw: string): HasilIrab | null {
  const s = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  try {
    const j = JSON.parse(s);
    if (!Array.isArray(j?.kata)) return null;
    return {
      struktur: String(j.struktur ?? ""),
      kata: j.kata
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((k: any) => ({
          no: Number(k.no),
          ar: String(k.ar ?? ""),
          irab: String(k.irab ?? ""),
          fungsi: String(k.fungsi ?? ""),
        }))
        .filter((k: { no: number }) => Number.isFinite(k.no)),
      catatan: Array.isArray(j.catatan) ? j.catatan.map(String).slice(0, 5) : [],
    };
  } catch {
    return null;
  }
}

const cache = new Map<string, HasilIrab>();
const KUNCI = /^(\d{1,3}):(\d{1,3})$/;

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("ayat") ?? "";
  const m = KUNCI.exec(key);
  if (!m || Number(m[1]) < 1 || Number(m[1]) > 114) {
    return NextResponse.json({ error: "ayat tidak valid" }, { status: 400 });
  }
  const hit = cache.get(key);
  if (hit) return jawab(hit);

  let ayat;
  let morf: Record<string, SegmenMentah[]> = {};
  try {
    ayat = await ambilAyat(key);
    const r = await fetch(new URL(`/quran/morph/${m[1]}.json`, req.nextUrl.origin));
    if (r.ok) morf = await r.json();
  } catch {
    return NextResponse.json({ error: "ayat tidak ditemukan" }, { status: 404 });
  }

  const kata = ayat.kata.filter((k) => !k.akhir);
  const daftar = kata
    .map((k, i) => {
      const seg = morf[k.lok.split(":").slice(1).join(":")];
      const mor = seg ? ringkasKata(seg.map(uraiSegmen), { isolasi: false }) : "";
      return `${i + 1}. ${k.ar} — arti: ${k.arti}${mor ? ` — morfologi: ${mor}` : ""}`;
    })
    .join("\n");

  const prompt = `Analisa i'rab QS ${key} untuk pelajar Indonesia yang baru belajar nahwu.

Teks: ${kata.map((k) => k.ar).join(" ")}
Terjemah Kemenag: ${ayat.terjemah}

Kata per kata (morfologi dari Quranic Arabic Corpus — PERCAYAI kasus & akarnya):
${daftar}

Kembalikan JSON:
{
  "struktur": "1–2 kalimat: jenis kalimat (jumlah ismiyah/fi'liyah/syarthiyah), inti kalimat, dan hubungan antar-bagian",
  "kata": [{"no": 1, "ar": "kata Arab persis seperti di atas", "irab": "i'rab ringkas ala pesantren, mis. 'Fa'il marfu' dengan dhammah'", "fungsi": "peran dalam bahasa awam, mis. 'pelaku: siapa yang berbuat'"}],
  "catatan": ["maks 3 poin pelajaran nahwu/sharaf yang menarik dari ayat ini, bahasa santai"]
}
Aturan: satu entri per kata bernomor (jumlahnya ${kata.length}), urutan sama. Istilah Arab ditulis latin
(fa'il, maf'ul bih, mubtada', khabar, mudhaf ilaih, na'at, jar majrur, dst). Bahasa Indonesia.`;

  const hasil = parse(await callDeepSeek(prompt)) ?? parse(await callClaude(prompt));
  if (!hasil) {
    return NextResponse.json({ error: "analisa gagal" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  cache.set(key, hasil);
  return jawab(hasil);
}

const jawab = (h: HasilIrab) =>
  NextResponse.json(h, {
    headers: { "Cache-Control": "public, s-maxage=31536000, stale-while-revalidate=86400" },
  });
