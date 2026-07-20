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

// Validasi ringan bentuk breakdown ({ translation, tokens:[{word,cat,gloss,...}] })
// sebelum masuk DB — cegah payload sampah mencemari cache transkrip.
const MAX_TOKENS = 200;
// Versi breakdown (0 = lawas/tak ber-versi). Dipakai untuk memutuskan overwrite.
function numVersion(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}
function isValidBreakdown(bd: unknown): boolean {
  if (!bd || typeof bd !== "object") return false;
  const b = bd as { translation?: unknown; tokens?: unknown };
  if (!Array.isArray(b.tokens) || b.tokens.length === 0 || b.tokens.length > MAX_TOKENS) return false;
  if (b.translation != null && typeof b.translation !== "string") return false;
  return b.tokens.every((t) => {
    const tok = t as { word?: unknown };
    return tok && typeof tok === "object" && typeof tok.word === "string" && tok.word.length > 0;
  });
}

// Durasi ≈ akhir cue terakhir. Transkrip menutup hampir seluruh video, jadi ini
// proxy yang cukup akurat untuk badge durasi tab "Siap" — tanpa kuota YouTube
// Data API. Dipakai buat backfill baris yang `dur`-nya belum terisi (video kurasi
// lama). Balikin null kalau cues kosong / tak punya `end`.
function durationFromCues(cues: unknown[]): number | null {
  let max = 0;
  for (const c of cues) {
    const end = (c as { end?: unknown })?.end;
    if (typeof end === "number" && Number.isFinite(end) && end > max) max = end;
  }
  return max > 0 ? Math.round(max) : null;
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const lang = params.get("lang") ?? "";

  // Mode COUNTS: jumlah video "Siap" per bahasa — dipakai badge di pemilih bahasa
  // supaya pengguna tahu bahasa mana yang katalognya paling banyak sebelum memilih.
  // Satu query ringan (hanya kolom `lang`), dihitung per-bahasa di server.
  if (params.get("counts")) {
    try {
      const sb = createServerClient(0);
      // Sama seperti tab "Siap": hanya video ber-metadata (title) & tak 'hidden'.
      let rows: { lang?: unknown }[] | null = null;
      const r = await sb
        .from("yt_transcripts")
        .select("lang")
        .not("title", "is", null)
        .neq("curation", "hidden")
        .limit(20000);
      if (r.error) {
        // Fallback kalau kolom curation belum ada (migrasi belum jalan).
        const r2 = await sb
          .from("yt_transcripts")
          .select("lang")
          .not("title", "is", null)
          .limit(20000);
        rows = Array.isArray(r2.data) ? (r2.data as { lang?: unknown }[]) : null;
      } else {
        rows = Array.isArray(r.data) ? (r.data as { lang?: unknown }[]) : null;
      }
      const counts: Record<string, number> = {};
      for (const row of rows ?? []) {
        const l = row.lang;
        if (typeof l === "string" && l) counts[l] = (counts[l] ?? 0) + 1;
      }
      return NextResponse.json(
        { counts },
        { status: 200, headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } }
      );
    } catch {
      return NextResponse.json({ counts: {} }, { status: 200, headers: { "Cache-Control": "no-store" } });
    }
  }

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
        // Video 'hidden' (kurasi admin, tab Kualitas dashboard) tak boleh tampil
        // di "Siap". Kolom curation NOT NULL default 'new' (migrasi
        // 20260717_watch_quality_curation.sql, repo dashboard) → .neq aman.
        const r = await sb
          .from("yt_transcripts")
          .select("video_id, title, channel, dur, level")
          .eq("lang", lang)
          .not("title", "is", null)
          .neq("curation", "hidden")
          .order("created_at", { ascending: false })
          .limit(limit);
        if (r.error) {
          hasLevel = false;
          // Fallback kalau kolom level/curation belum ada (migrasi belum jalan).
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

      // Backfill lazy dari cues (satu kali ambil, hitung level + durasi): baris
      // yang belum punya level → estimasi CEFR (heuristik teks), yang belum punya
      // `dur` → durasi ≈ akhir cue terakhir. Hasilnya disimpan balik supaya request
      // berikutnya tinggal baca kolomnya. Keduanya berbagi satu fetch cues.
      const levelOf = new Map<string, string | null>();
      const durOf = new Map<string, number | null>();
      const needsLevel = (r: Record<string, unknown>) => hasLevel && asCefrLevel(r.level) == null;
      const needsDur = (r: Record<string, unknown>) => typeof r.dur !== "number";
      const missing = rows
        .filter((r) => needsLevel(r) || needsDur(r))
        .map((r) => r.video_id as string);
      if (missing.length) {
        const cueRes = await sb
          .from("yt_transcripts")
          .select(hasLevel ? "video_id, cues, dur, level" : "video_id, cues, dur")
          .eq("lang", lang)
          .in("video_id", missing);
        if (Array.isArray(cueRes.data)) {
          await Promise.all(
            (cueRes.data as unknown as Record<string, unknown>[]).map(async (cr) => {
              const cues = Array.isArray(cr.cues) ? (cr.cues as unknown[]) : [];
              const vid = cr.video_id as string;
              const update: { level?: string; dur?: number } = {};
              if (hasLevel && asCefrLevel(cr.level) == null) {
                const lvl = estimateCefrLevel(cues as { target?: unknown }[], lang);
                levelOf.set(vid, lvl);
                if (lvl) update.level = lvl;
              }
              if (typeof cr.dur !== "number") {
                const d = durationFromCues(cues);
                if (d) {
                  durOf.set(vid, d);
                  update.dur = d;
                }
              }
              if (Object.keys(update).length) {
                await sb.from("yt_transcripts").update(update).eq("video_id", vid).eq("lang", lang);
              }
            })
          );
        }
      }

      const videos = rows.map((r) => ({
        videoId: r.video_id as string,
        title: (r.title as string) ?? "",
        channel: (r.channel as string) ?? null,
        duration: typeof r.dur === "number" ? r.dur : durOf.get(r.video_id as string) ?? null,
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

    // Mode BREAKDOWN: sisipkan analisa kalimat (kelas kata + arti per kata) yang
    // sudah di-precompute klien ke cue yang target-nya cocok → mode Analisa instan
    // "bareng transkrip" lintas-perangkat/pengguna. Di-key per target text karena
    // breakdown = fungsi murni dari (kalimat, bahasa); aman untuk cue kembar.
    if (body?.breakdowns && typeof body.breakdowns === "object" && !Array.isArray(body.breakdowns)) {
      const incoming = body.breakdowns as Record<string, unknown>;
      const byTarget = new Map<string, unknown>();
      for (const [target, bd] of Object.entries(incoming)) {
        if (typeof target === "string" && target.length > 0 && isValidBreakdown(bd)) {
          byTarget.set(target, bd);
        }
      }
      if (!byTarget.size) return NextResponse.json({ ok: true }, { status: 200 });

      const sb = createServerClient(0);
      const { data, error } = await sb
        .from("yt_transcripts")
        .select("cues")
        .eq("video_id", videoId)
        .eq("lang", lang)
        .maybeSingle();
      if (error || !Array.isArray(data?.cues)) {
        return NextResponse.json({ ok: false }, { status: 200 });
      }
      const stored = data.cues as Record<string, unknown>[];
      let changed = false;
      for (const cue of stored) {
        const t = cue?.target;
        if (typeof t !== "string") continue;
        const bd = byTarget.get(t);
        if (!bd) continue;
        // Timpa hanya kalau breakdown tersimpan lebih lawas (versi lebih kecil / tak
        // ber-versi). Yang sudah versi >= kiriman dibiarkan (hemat tulis). Ini yang
        // membuat cache lama tanpa arti per-kata otomatis diperbarui.
        const storedV = numVersion((cue.breakdown as { v?: unknown } | undefined)?.v);
        const incomingV = numVersion((bd as { v?: unknown }).v);
        if (cue.breakdown && storedV >= incomingV) continue;
        cue.breakdown = bd;
        changed = true;
      }
      if (!changed) return NextResponse.json({ ok: true }, { status: 200 });
      if (JSON.stringify(stored).length > MAX_JSON) {
        // Transkrip + breakdown melebihi batas → lewati persist (cache localStorage
        // klien tetap menutupi). Bukan error yang perlu diteriakkan.
        return NextResponse.json({ ok: false, error: "kegedean" }, { status: 200 });
      }
      const { error: upErr } = await sb
        .from("yt_transcripts")
        .update({ cues: stored })
        .eq("video_id", videoId)
        .eq("lang", lang);
      return NextResponse.json({ ok: !upErr }, { status: 200 });
    }

    // Mode BASEALT: sisipkan terjemahan (bahasa non-Indonesia) yang sudah dihitung
    // klien ke cue yang target-nya cocok → begitu SATU penonton menerjemahkan video
    // ke Inggris (dst.), penonton berikutnya (perangkat/akun mana pun) dapat versi
    // itu instan "bareng transkrip", tanpa terjemah ulang. Di-key per target karena
    // terjemahan = fungsi murni dari (kalimat, bahasa) — aman untuk cue kembar.
    if (body?.baseAlt && typeof body.baseAlt === "object" && !Array.isArray(body.baseAlt)) {
      const baseCode = body?.baseCode;
      // Indonesia disimpan di `base`, bukan di sini; kode bahasa harus valid.
      if (!validLang(baseCode) || baseCode === "id") {
        return NextResponse.json({ ok: false, error: "baseCode tidak valid" }, { status: 400 });
      }
      const incoming = body.baseAlt as Record<string, unknown>;
      const byTarget = new Map<string, string>();
      for (const [target, tr] of Object.entries(incoming)) {
        if (typeof target === "string" && target.length > 0 && typeof tr === "string" && tr.trim()) {
          byTarget.set(target, tr.slice(0, 2000));
        }
        if (byTarget.size >= MAX_CUES) break;
      }
      if (!byTarget.size) return NextResponse.json({ ok: true }, { status: 200 });

      const sb = createServerClient(0);
      const { data, error } = await sb
        .from("yt_transcripts")
        .select("cues")
        .eq("video_id", videoId)
        .eq("lang", lang)
        .maybeSingle();
      if (error || !Array.isArray(data?.cues)) {
        return NextResponse.json({ ok: false }, { status: 200 });
      }
      const stored = data.cues as Record<string, unknown>[];
      let changed = false;
      for (const cue of stored) {
        const t = cue?.target;
        if (typeof t !== "string") continue;
        const tr = byTarget.get(t);
        if (!tr) continue;
        const alt = (cue.baseAlt && typeof cue.baseAlt === "object" ? cue.baseAlt : {}) as Record<
          string,
          unknown
        >;
        if (alt[baseCode] === tr) continue; // sudah sama → hemat tulis
        alt[baseCode] = tr;
        cue.baseAlt = alt;
        changed = true;
      }
      if (!changed) return NextResponse.json({ ok: true }, { status: 200 });
      if (JSON.stringify(stored).length > MAX_JSON) {
        // Transkrip + terjemahan melebihi batas → lewati persist (cache localStorage
        // klien tetap menutupi). Bukan error yang perlu diteriakkan.
        return NextResponse.json({ ok: false, error: "kegedean" }, { status: 200 });
      }
      const { error: upErr } = await sb
        .from("yt_transcripts")
        .update({ cues: stored })
        .eq("video_id", videoId)
        .eq("lang", lang);
      return NextResponse.json({ ok: !upErr }, { status: 200 });
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
