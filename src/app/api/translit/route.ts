// [watch-translit-v1] Transliterasi baris transkrip non-Latin → aksara Latin.
//
// Kenapa route ini ada: Edge Function transkrip (yt-transcript/yt-asr) TIDAK
// selalu mengembalikan bacaan Latin (romaji/pinyin/dll), jadi baris bahasa
// Jepang, Mandarin, Arab, dll dari cache lama tak punya transliterasi. Di sini
// kita minta Gemini mentransliterasi tiap baris — cepat, seragam untuk semua
// bahasa non-Latin, dan tak butuh library berat (kuromoji dkk) di client.
//
// Logika Gemini-nya ada di @/lib/translit-gemini (dipakai bareng route cache
// transkrip, yang mengisi bacaan Latin ke DB sekali jalan).
//
// Best-effort: balikin { translit: [] } saat gagal/tak dikonfigurasi biar UI
// tetap jalan tanpa bacaan Latin.

import { NextRequest, NextResponse } from "next/server";
import { transliterateBatch } from "@/lib/translit-gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
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

    const translit = await transliterateBatch(lines, langCode);
    return NextResponse.json({ translit });
  } catch {
    return NextResponse.json({ translit: [] });
  }
}
