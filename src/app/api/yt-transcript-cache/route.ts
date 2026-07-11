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
import { estimateCefrLevel, asCefrLevel } from "@/lib/cefr";

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
  const params = req.nextUrl.searchParams;
  const lang = params.get("lang") ?? "";

  // Mode LIST (tab "Siap"): daftar video yang transkripnya sudah tersimpan untuk
  // sebuah bahasa — kartu dirender dari metadata ini, tanpa panggil YouTube lagi.
  if (params.get("list")) {
    if (!validLang(lang)) return NextResponse.json({ videos: [] }, { status: 200 });
    const limit = Math.min(Math.max(parseInt(params.get("limit") ?? "40", 10) || 40, 1), 100);
    try {
      // Baca DB SEGAR (createServerClient(0), tanpa Next Data Cache). Dulu di-cache
      // 5 menit → begitu worker menandai transkrip 'done', tab "Siap" masih
      // menampilkan daftar lama (tanpa video baru) sampai 5 menit. Query ini ringan
      // (indeks yt_transcripts_ready_idx, ≤100 baris) jadi baca tiap kali aman;
      // CDN tetap kita rem sebentar via s-maxage biar tak dibombardir, tapi cukup
      // pendek supaya video yang baru selesai langsung nongol.
      const sb = createServerClient(0);
      // Sertakan kolom `level` (estimasi CEFR) kalau ada. Kalau migrasi kolom belum
      // dijalankan, select-nya error → jatuh ke query tanpa level (badge absen saja).
      let hasLevel = true;
      let rows: Record<string, unknown>[] | null = null;
      {
        const r = await sb
          .from("yt_transcripts")
          .select("video_id, title, channel, dur, level")
          .eq("lang", lang)
          .not("title", "is", null)
          .order("created_at", { ascending: false })
          .limit(limit);
        if (r.error) {
          hasLevel = false;
          const r2 = await sb
            .from("yt_transcripts")
            .select("video_id, title, channel, dur")
            .eq("lang", lang)
            .not("title", "is", null)
            .order("created_at", { ascending: false })
            .limit(limit);
          rows = Array.isArray(r2.data) ? (r2.data as Record<string, unknown>[]) : null;
        } else {
          rows = Array.isArray(r.data) ? (r.data as Record<string, unknown>[]) : null;
        }
      }
      if (!rows)
        return NextResponse.json({ videos: [] }, { status: 200, headers: { "Cache-Control": "no-store" } });

      // Backfill lazy: baris yang belum punya level → hitung dari cues (murah,
      // heuristik) lalu simpan supaya request berikutnya tinggal baca kolomnya.
      const levelOf = new Map<string, string | null>();
      if (hasLevel) {
        const missing = rows
          .filter((r) => asCefrLevel(r.level) == null)
          .map((r) => r.video_id as string);
        if (missing.length) {
          const cueRes = await sb
            .from("yt_transcripts")
            .select("video_id, cues")
            .eq("lang", lang)
            .in("video_id", missing);
          if (Array.isArray(cueRes.data)) {
            await Promise.all(
              cueRes.data.map(async (cr) => {
                const cues = Array.isArray((cr as { cues?: unknown }).cues)
                  ? ((cr as { cues: unknown[] }).cues)
                  : [];
                const lvl = estimateCefrLevel(cues as { target?: unknown }[], lang);
                levelOf.set(cr.video_id as string, lvl);
                if (lvl) {
                  await sb
                    .from("yt_transcripts")
                    .update({ level: lvl })
                    .eq("video_id", cr.video_id as string)
                    .eq("lang", lang);
                }
              })
            );
          }
        }
      }

      const videos = rows.map((r) => ({
        videoId: r.video_id as string,
        title: (r.title as string) ?? "",
        channel: (r.channel as string) ?? null,
        duration: typeof r.dur === "number" ? r.dur : null,
        level: asCefrLevel(r.level) ?? levelOf.get(r.video_id as string) ?? null,
      }));
      return NextResponse.json(
        { videos },
        { status: 200, headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } }
      );
    } catch {
      return NextResponse.json({ videos: [] }, { status: 200, headers: { "Cache-Control": "no-store" } });
    }
  }

  const videoId = params.get("videoId") ?? "";
  if (!VIDEO_RE.test(videoId) || !validLang(lang)) {
    return NextResponse.json({ cues: null }, { status: 200 });
  }
  try {
    // Query DB tanpa Next Data Cache: dulu miss ("belum ada transkrip") ikut
    // ke-cache 1 jam, jadi setelah worker selesai player masih dibilang "belum
    // tersedia" sampai sejam. Sekarang HIT di-cache di CDN via s-maxage (data
    // immutable per video+bahasa), MISS selalu no-store biar transkrip baru
    // langsung kelihatan.
    const sb = createServerClient(0);
    const { data, error } = await sb
      .from("yt_transcripts")
      .select("cues")
      .eq("video_id", videoId)
      .eq("lang", lang)
      .maybeSingle();
    if (error || !data?.cues) {
      return NextResponse.json(
        { cues: null },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json(
      { cues: data.cues },
      { status: 200, headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" } }
    );
  } catch {
    return NextResponse.json(
      { cues: null },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const videoId = typeof body?.videoId === "string" ? body.videoId.trim() : "";
    const lang = body?.lang;
    const cues = body?.cues;
    const source = typeof body?.source === "string" ? body.source.slice(0, 20) : null;
    // Metadata opsional buat kartu tab "Siap".
    const title = typeof body?.title === "string" ? body.title.slice(0, 300) : null;
    const channel = typeof body?.channel === "string" ? body.channel.slice(0, 200) : null;
    const dur =
      typeof body?.dur === "number" && Number.isFinite(body.dur) && body.dur >= 0
        ? Math.round(body.dur)
        : null;

    if (!VIDEO_RE.test(videoId) || !validLang(lang)) {
      return NextResponse.json({ ok: false, error: "param tidak valid" }, { status: 400 });
    }

    // Mode BACKFILL metadata: transkrip sudah ada di cache (mis. disimpan sebelum
    // ada kolom metadata), cukup isi title/channel/dur biar video muncul di tab
    // "Siap" — tanpa kirim ulang cues. Hanya update baris yang sudah ada.
    if (body?.metaOnly) {
      if (!title) return NextResponse.json({ ok: false, error: "title wajib" }, { status: 400 });
      const sb = createServerClient(0);
      const { error } = await sb
        .from("yt_transcripts")
        .update({ title, channel, dur })
        .eq("video_id", videoId)
        .eq("lang", lang)
        .is("title", null); // jangan timpa metadata yang sudah ada
      if (error) return NextResponse.json({ ok: false }, { status: 200 });
      return NextResponse.json({ ok: true }, { status: 200 });
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
      .upsert(
        { video_id: videoId, lang, cues: clean, source, title, channel, dur },
        { onConflict: "video_id,lang" }
      );
    if (error) return NextResponse.json({ ok: false }, { status: 200 });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
