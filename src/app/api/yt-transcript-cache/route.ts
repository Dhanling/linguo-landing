// [watch-yt-transcript-cache-v1] Cache transkrip Watch & Learn di Supabase.
//
// Kenapa: fetch caption dari IP datacenter (Vercel/Supabase) sering diblokir
// YouTube → jatuh ke ASR (Gemini, ~1 menit). Karena katalog = video populer yang
// ditonton berulang, cukup diproses SEKALI per (video, bahasa) — viewer berikutnya
// baca instan dari sini. Baca/tulis pakai service_role (server-only) supaya anon
// key tak bisa mencemari cache (tabel RLS aktif tanpa policy publik).
//
// GET  ?videoId=..&lang=..           → { cues } | { cues: null }
// POST { videoId, lang, cues, source } → { ok: true }

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VIDEO_RE = /^[A-Za-z0-9_-]{11}$/;
// Batas wajar biar payload jahat/kegedean tak masuk DB (transkrip terpanjang pun
// jauh di bawah ini).
const MAX_CUES = 4000;
const MAX_JSON = 2_000_000; // ~2 MB

function validLang(lang: unknown): lang is string {
  return typeof lang === "string" && /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(lang);
}

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get("videoId") ?? "";
  const lang = req.nextUrl.searchParams.get("lang") ?? "";
  if (!VIDEO_RE.test(videoId) || !validLang(lang)) {
    return NextResponse.json({ cues: null }, { status: 200 });
  }
  try {
    // Baca di-cache Next 1 jam — data immutable per (video, bahasa) jadi aman.
    const sb = createServerClient(3600);
    const { data, error } = await sb
      .from("yt_transcripts")
      .select("cues")
      .eq("video_id", videoId)
      .eq("lang", lang)
      .maybeSingle();
    if (error || !data?.cues) return NextResponse.json({ cues: null }, { status: 200 });
    return NextResponse.json({ cues: data.cues }, { status: 200 });
  } catch {
    return NextResponse.json({ cues: null }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const videoId = typeof body?.videoId === "string" ? body.videoId.trim() : "";
    const lang = body?.lang;
    const cues = body?.cues;
    const source = typeof body?.source === "string" ? body.source.slice(0, 20) : null;

    if (!VIDEO_RE.test(videoId) || !validLang(lang)) {
      return NextResponse.json({ ok: false, error: "param tidak valid" }, { status: 400 });
    }
    if (!Array.isArray(cues) || cues.length === 0 || cues.length > MAX_CUES) {
      return NextResponse.json({ ok: false, error: "cues tidak valid" }, { status: 400 });
    }
    // Validasi bentuk tiap cue + batasi ukuran total.
    const clean = cues.filter(
      (c) =>
        c &&
        typeof c.start === "number" &&
        typeof c.end === "number" &&
        typeof c.target === "string" &&
        c.target.length > 0
    );
    if (!clean.length) return NextResponse.json({ ok: false, error: "cues kosong" }, { status: 400 });
    if (JSON.stringify(clean).length > MAX_JSON) {
      return NextResponse.json({ ok: false, error: "cues kegedean" }, { status: 413 });
    }

    const sb = createServerClient(0);
    const { error } = await sb
      .from("yt_transcripts")
      .upsert({ video_id: videoId, lang, cues: clean, source }, { onConflict: "video_id,lang" });
    if (error) return NextResponse.json({ ok: false }, { status: 200 });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
