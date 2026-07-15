// [watch-cue-search-v1] Pencarian kata di transkrip Watch & Learn (ala YouGlish).
//
// GET ?q=<kata>&lang=<kode> → { results: WordHit[] }
//
// Memanggil RPC `search_cues` (lihat sql/20260715_watch_cue_search.sql) lewat
// service role: RPC mencari di indeks cue ber-GIN-trigram (`yt_cue_index`), jadi
// query cepat & tak menyentuh kolom cues JSONB besar. Hasil = kalimat nyata dari
// video katalog + detik kata diucapkan (buat seek player).

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validLang(lang: unknown): lang is string {
  return typeof lang === "string" && /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(lang);
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const q = (params.get("q") ?? "").trim();
  const lang = params.get("lang") ?? "";
  const limit = Math.min(Math.max(parseInt(params.get("limit") ?? "40", 10) || 40, 1), 100);

  // Minimal 2 karakter: kata 1 huruf → kandidat trigram membludak (scan mahal) &
  // hasil tak bermakna sebagai "contoh pemakaian".
  if (q.length < 2 || q.length > 80 || !validLang(lang)) {
    return NextResponse.json({ results: [] }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const sb = createServerClient(0);
    const { data, error } = await sb.rpc("search_cues", {
      p_word: q,
      p_lang: lang,
      p_limit: limit,
    });
    if (error || !Array.isArray(data)) {
      return NextResponse.json({ results: [] }, { status: 200, headers: { "Cache-Control": "no-store" } });
    }
    const results = data.map((r: Record<string, unknown>) => ({
      videoId: r.video_id as string,
      title: (r.title as string) ?? "",
      channel: (r.channel as string) ?? null,
      level: (r.level as string) ?? null,
      start: typeof r.cue_start === "number" ? r.cue_start : 0,
      end: typeof r.cue_end === "number" ? r.cue_end : null,
      target: (r.target as string) ?? "",
      base: (r.base as string) ?? null,
    }));
    // Hasil per (kata, bahasa) cukup stabil (katalog jarang berubah) → CDN boleh
    // menahan sebentar biar pencarian berulang tak selalu memukul DB.
    return NextResponse.json(
      { results },
      { status: 200, headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } }
    );
  } catch {
    return NextResponse.json({ results: [] }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
}
