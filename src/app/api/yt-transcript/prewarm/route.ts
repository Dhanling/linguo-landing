// [watch-transcript-prewarm-v1] Pra-hangatkan transkrip katalog SEBELUM siswa buka.
//
// Kenapa: transkripsi jalan di SERVER (antrian `yt_transcript_jobs` + worker
// pg_cron tiap menit). Kalau video di-enqueue lebih dulu — begitu daftar tab browse
// dirender di klien — worker menghangatkannya di latar belakang; ketika siswa
// mengklik, transkrip biasanya SUDAH siap → tampil instan (bukan nunggu caption/ASR
// live). Ini pelengkap tombol "Minta video ini" (source='request'), bedanya proaktif.
//
// Desain aman & jangka panjang:
//  - source='prewarm' punya CAP HARIAN sendiri (env WATCH_PREWARM_DAILY_CAP),
//    terpisah dari 'request' (siswa) & 'admin' (kurasi). Set 0 = matikan total,
//    tanpa efek samping ke jalur lain.
//  - DEDUP dulu: video yang transkripnya sudah ada / sudah antre TIDAK di-insert →
//    worker tak mengulang kerja (hemat biaya ASR) & tak menyentuh job 'done'/'failed'
//    yang sudah ada (upsert ignoreDuplicates).
//  - Batch dibatasi (≤MAX_BATCH) → payload & insert kecil, ramah IO (DB sensitif IO).
//  - Best-effort MURNI: apa pun errornya balikin 200 — prewarm tak boleh mengganggu UX.
//
// POST { videoIds: string[], lang } → { ok, queued, skipped }

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VIDEO_RE = /^[A-Za-z0-9_-]{11}$/;

function validLang(lang: unknown): lang is string {
  return typeof lang === "string" && /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(lang);
}

// Cuma hangatkan video teratas tiap daftar (yang paling mungkin diklik) — jaga
// payload & jumlah insert tetap kecil. Klien pun sudah membatasi, ini pagar server.
const MAX_BATCH = 12;

// Batas harian GLOBAL untuk prewarm otomatis. Konservatif secara default: mayoritas
// transkrip lahir dari caption (murah), ASR Gemini hanya fallback — tapi karena
// prewarm bersifat proaktif/luas, cap dijaga agar antrian tetap pendek (tak menunda
// job 'request' siswa) & biaya terprediksi. Set 0 = matikan fitur.
const DAILY_CAP = Math.max(0, parseInt(process.env.WATCH_PREWARM_DAILY_CAP ?? "60", 10) || 0);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const lang = body?.lang;
    const rawIds = Array.isArray(body?.videoIds) ? body.videoIds : [];
    if (!validLang(lang)) {
      return NextResponse.json({ ok: false, error: "lang tidak valid" }, { status: 400 });
    }

    // Bersihkan + unik + batasi batch. Nilai non-string / id ngawur dibuang diam-diam.
    const seen = new Set<string>();
    const clean: string[] = [];
    for (const v of rawIds) {
      if (typeof v !== "string") continue;
      const id = v.trim();
      if (!VIDEO_RE.test(id) || seen.has(id)) continue;
      seen.add(id);
      clean.push(id);
      if (clean.length >= MAX_BATCH) break;
    }
    if (!clean.length) {
      return NextResponse.json({ ok: true, queued: 0, skipped: 0 }, { status: 200 });
    }

    // Fitur dimatikan → jangan sentuh DB sama sekali.
    if (DAILY_CAP <= 0) {
      return NextResponse.json({ ok: true, queued: 0, skipped: clean.length }, { status: 200 });
    }

    const sb = createServerClient(0);

    // DEDUP 1 — transkrip sudah tersimpan? (sudah "siap", tak perlu apa-apa)
    const have = new Set<string>();
    {
      const { data } = await sb
        .from("yt_transcripts")
        .select("video_id")
        .eq("lang", lang)
        .in("video_id", clean);
      if (Array.isArray(data)) for (const r of data) have.add(r.video_id as string);
    }
    // DEDUP 2 — sudah ada job (pending/processing/done/failed)? (idempoten; jangan
    // reset job yang sudah ada — beda dari "Minta" yang sengaja retry 'failed').
    {
      const { data } = await sb
        .from("yt_transcript_jobs")
        .select("video_id")
        .eq("lang", lang)
        .in("video_id", clean);
      if (Array.isArray(data)) for (const r of data) have.add(r.video_id as string);
    }
    const fresh = clean.filter((id) => !have.has(id));
    if (!fresh.length) {
      return NextResponse.json({ ok: true, queued: 0, skipped: clean.length }, { status: 200 });
    }

    // Anggaran harian tersisa untuk source='prewarm'.
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { count } = await sb
      .from("yt_transcript_jobs")
      .select("id", { count: "exact", head: true })
      .eq("source", "prewarm")
      .gte("created_at", startOfDay.toISOString());
    const used = typeof count === "number" ? count : 0;
    const remaining = Math.max(0, DAILY_CAP - used);
    if (remaining <= 0) {
      return NextResponse.json({ ok: true, queued: 0, skipped: clean.length }, { status: 200 });
    }

    const toEnqueue = fresh.slice(0, remaining);
    // upsert ignoreDuplicates: aman dari balapan (unique video_id,lang) & tak menimpa
    // job yang sudah ada bila muncul di sela query di atas.
    const { error } = await sb
      .from("yt_transcript_jobs")
      .upsert(
        toEnqueue.map((video_id) => ({ video_id, lang, source: "prewarm" })),
        { onConflict: "video_id,lang", ignoreDuplicates: true }
      );
    if (error) {
      return NextResponse.json({ ok: true, queued: 0, skipped: clean.length }, { status: 200 });
    }
    return NextResponse.json(
      { ok: true, queued: toEnqueue.length, skipped: clean.length - toEnqueue.length },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ ok: true, queued: 0, skipped: 0 }, { status: 200 });
  }
}
