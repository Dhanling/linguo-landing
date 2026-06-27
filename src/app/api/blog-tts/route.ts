// [ling-blog-tts-gemini-v1] TTS realistis untuk anotasi 🔊 (.linguo-tts) di artikel blog.
// Pakai Gemini 2.5 Flash Preview TTS (generativelanguage API) — multilingual, suaranya
// jauh lebih natural ketimbang Web Speech API browser yang robotik & beda-beda per device.
//
// Gemini TTS balikin PCM mentah (signed 16-bit LE, mono). Kita bungkus jadi WAV di server
// lalu kirim base64 → client tinggal play. Bahasa di-autodetect dari teksnya, jadi satu
// voice multilingual cukup untuk semua bahasa blog (id/en/es/fr/de/ja/ko/...).
//
// Env: GEMINI_API_KEY (wajib). Optional: GEMINI_TTS_MODEL, GEMINI_TTS_VOICE.
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_KEY = process.env.GEMINI_API_KEY || "";
const MODEL = process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts";
// Voice multilingual yang natural & netral. Daftar lengkap: Kore, Puck, Zephyr, Charon,
// Fenrir, Aoede, Leda, Orus, dll. (https://ai.google.dev/gemini-api/docs/speech-generation)
const VOICE = process.env.GEMINI_TTS_VOICE || "Aoede";

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

export async function POST(req: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY belum diset" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const text = String(body?.text || "").trim().slice(0, 600);
    if (!text) return NextResponse.json({ error: "text kosong" }, { status: 400 });

    const voice = String(body?.voice || VOICE);

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

    const res = await fetch(url, {
      method: "POST",
      // Kirim key via header x-goog-api-key — kompatibel utk format key lama (AIza...)
      // maupun format baru Google (AQ...).
      headers: { "Content-Type": "application/json", "x-goog-api-key": API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
          },
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json({ error: "tts failed", detail: detail.slice(0, 300) }, { status: 502 });
    }

    const j = await res.json();
    const part = j?.candidates?.[0]?.content?.parts?.find((p: any) => p?.inlineData?.data);
    const b64: string | undefined = part?.inlineData?.data;
    if (!b64) {
      return NextResponse.json({ error: "no audio in response" }, { status: 502 });
    }

    // mimeType contoh: "audio/L16;codec=pcm;rate=24000" → ambil sample rate-nya.
    const mime: string = part?.inlineData?.mimeType || "";
    const rateMatch = mime.match(/rate=(\d+)/);
    const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

    const pcm = Buffer.from(b64, "base64");
    const wav = pcmToWav(pcm, sampleRate);

    return NextResponse.json(
      { audioContent: wav.toString("base64"), mimeType: "audio/wav" },
      { headers: { "Cache-Control": "public, max-age=86400" } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "internal error" }, { status: 500 });
  }
}
