// [lingbook-tts-gemini] TTS realistis untuk reader Lingbook — pengucapan kata,
// baris dialog, & paragraf. Pakai Gemini 2.5 Flash TTS (multilingual + auto-detect
// bahasa dari teks) supaya suara terdengar natural, bukan Web Speech browser.
// Balikin PCM mentah → dibungkus WAV base64. Klien fallback ke speechSynthesis
// bila endpoint gagal (mis. kuota Gemini free-tier habis / 429).
//
// Env: GEMINI_API_KEY. Optional: GEMINI_TTS_MODEL, GEMINI_TTS_VOICE.
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts";
const DEFAULT_VOICE = process.env.GEMINI_TTS_VOICE || "Aoede";
// Suara prebuilt Gemini yang valid (sama dgn voice picker blog TTS).
const VOICES = new Set(["Kore", "Aoede", "Leda", "Zephyr", "Puck", "Charon", "Orus", "Fenrir"]);

// Bungkus PCM mentah (16-bit signed LE, mono) jadi file WAV lengkap dgn header.
function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

// Gemini 2.5 Flash TTS → WAV base64 (multilingual, auto-detect bahasa dari teks).
async function synthesizeGemini(text: string, voice: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    // Kirim key via header x-goog-api-key — kompatibel format lama (AIza...) & baru (AQ...).
    headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
      },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`gemini ${res.status}: ${detail.slice(0, 300)}`);
  }
  const j = await res.json();
  const part = j?.candidates?.[0]?.content?.parts?.find((p: any) => p?.inlineData?.data);
  const b64: string | undefined = part?.inlineData?.data;
  if (!b64) throw new Error("gemini: no audio in response");
  // mimeType contoh: "audio/L16;codec=pcm;rate=24000" → ambil sample rate-nya.
  const mime: string = part?.inlineData?.mimeType || "";
  const rateMatch = mime.match(/rate=(\d+)/);
  const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
  const wav = pcmToWav(Buffer.from(b64, "base64"), sampleRate);
  return { audioContent: wav.toString("base64"), mimeType: "audio/wav" };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = String(body?.text || "").trim().slice(0, 500);
    if (!text) return NextResponse.json({ error: "text kosong" }, { status: 400 });
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY belum diset" }, { status: 500 });
    }
    const voice = VOICES.has(String(body?.voice)) ? String(body?.voice) : DEFAULT_VOICE;

    const out = await synthesizeGemini(text, voice);
    return NextResponse.json(out, {
      headers: { "Cache-Control": "public, max-age=86400", "x-tts-provider": "gemini" },
    });
  } catch (e: any) {
    // 502 → klien tahu harus fallback ke Web Speech browser.
    return NextResponse.json(
      { error: "tts failed", detail: String(e?.message || e).slice(0, 300) },
      { status: 502 },
    );
  }
}
