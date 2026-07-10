// [watch-transcript-enqueue-v1] Tombol "Minta video ini" (siswa) → antrian.
//
// Kenapa: transkripsi tak lagi dipicu diam-diam saat buka video (mahal & tak
// terkontrol). Katalog utama dikurasi admin; siswa boleh MEMINTA video di luar
// katalog, tapi DI-GATE — ada batas harian global supaya biaya tetap terkendali.
// Job masuk `yt_transcript_jobs` (service_role, RLS-safe), worker pg_cron yang
// memproses; hasilnya nanti muncul di tab "Siap".
//
// POST { videoId, lang } → { ok, status: 'queued'|'exists'|'processing'|'ready' }
//                        | { ok:false, error, reason?: 'cap' }

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VIDEO_RE = /^[A-Za-z0-9_-]{11}$/;

function validLang(lang: unknown): lang is string {
  return typeof lang === "string" && /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(lang);
}

// Batas harian GLOBAL untuk permintaan siswa (source='request'). Set lewat env
// WATCH_REQUEST_DAILY_CAP; default konservatif. Set 0 = tutup fitur "Minta"
// (praktis katalog penuh). Job dari admin (source='admin') TIDAK dihitung di sini.
const DAILY_CAP = Math.max(0, parseInt(process.env.WATCH_REQUEST_DAILY_CAP ?? "30", 10) || 0);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const videoId = typeof body?.videoId === "string" ? body.videoId.trim() : "";
    const lang = body?.lang;
    if (!VIDEO_RE.test(videoId) || !validLang(lang)) {
      return NextResponse.json({ ok: false, error: "param tidak valid" }, { status: 400 });
    }

    const sb = createServerClient(0);

    // 1) Sudah ada transkripnya di cache? → langsung siap, tak perlu antre.
    {
      const { data } = await sb
        .from("yt_transcripts")
        .select("video_id")
        .eq("video_id", videoId)
        .eq("lang", lang)
        .maybeSingle();
      if (data) return NextResponse.json({ ok: true, status: "ready" }, { status: 200 });
    }

    // 2) Sudah ada job? → idempoten. Kalau 'failed', reset ke pending; selain itu
    //    laporkan statusnya (jangan bikin duplikat / jangan kena kuota lagi).
    {
      const { data: job } = await sb
        .from("yt_transcript_jobs")
        .select("id, status")
        .eq("video_id", videoId)
        .eq("lang", lang)
        .maybeSingle();
      if (job) {
        if (job.status === "failed") {
          await sb
            .from("yt_transcript_jobs")
            .update({ status: "pending", error: null, locked_at: null })
            .eq("id", job.id);
          return NextResponse.json({ ok: true, status: "queued" }, { status: 200 });
        }
        return NextResponse.json(
          { ok: true, status: job.status === "done" ? "ready" : job.status === "processing" ? "processing" : "exists" },
          { status: 200 }
        );
      }
    }

    // 3) Gate: batas harian global untuk permintaan siswa.
    if (DAILY_CAP <= 0) {
      return NextResponse.json({ ok: false, error: "fitur permintaan sedang ditutup", reason: "cap" }, { status: 429 });
    }
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { count } = await sb
      .from("yt_transcript_jobs")
      .select("id", { count: "exact", head: true })
      .eq("source", "request")
      .gte("created_at", startOfDay.toISOString());
    if (typeof count === "number" && count >= DAILY_CAP) {
      return NextResponse.json(
        { ok: false, error: "kuota permintaan harian penuh, coba lagi besok", reason: "cap" },
        { status: 429 }
      );
    }

    // 4) Masukkan job baru.
    const { error } = await sb
      .from("yt_transcript_jobs")
      .insert({ video_id: videoId, lang, source: "request" });
    if (error) {
      // Balapan: baris keburu dibuat request lain (unique) → anggap sudah antre.
      if (error.code === "23505") return NextResponse.json({ ok: true, status: "exists" }, { status: 200 });
      return NextResponse.json({ ok: false, error: "gagal menyimpan" }, { status: 200 });
    }
    return NextResponse.json({ ok: true, status: "queued" }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "error" }, { status: 200 });
  }
}
