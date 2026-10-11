// ============================================================================
// API: /api/cron/recordings-finalize  [rekaman-sambung-server-v1]
// Menyambung rekaman Kelas Video yang potongannya tertinggal di Storage
// (tab pengajar tertutup sebelum berkas utuh naik) — tanpa menunggu pengajar
// menekan "Sambung & simpan". Logikanya di src/lib/recordingsFinalize.ts.
// ----------------------------------------------------------------------------
// Pemicu: pg_cron di Supabase tiap 10 menit (sql/20261011-recordings-finalize-cron.sql)
// lewat net.http_post — BUKAN Vercel Cron (paket Hobby cuma boleh harian).
//
// SECURITY: wajib `Authorization: Bearer <RECORDINGS_FINALIZE_SECRET>` (atau
// CRON_SECRET milik Vercel Cron, atau header `x-cron-secret`). Selain itu 401.
//
// PARAMETER UJI:
//   ?dry=1   → cuma daftar kandidat + alasan dilewati, tidak menyentuh apa pun
//   ?sync=1  → tunggu sampai putaran selesai, balas hasilnya (uji manual)
//   ?max=N   → maksimal N rekaman per putaran (bawaan 2)
// Tanpa ?sync, route langsung membalas 202 dan menggarap di latar lewat
// `after()` — pg_net memutus koneksi setelah beberapa detik, dan pekerjaan
// satu rekaman bisa beberapa menit.
// ============================================================================

import { NextRequest, NextResponse, after } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { finalizeRound, listCandidates } from "@/lib/recordingsFinalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
// Supabase project di ap-southeast-1 — jalankan di Singapura supaya ratusan MB
// tidak bolak-balik lintas benua.
export const preferredRegion = "sin1";

const BUDGET_MS = 270_000; // sisakan ruang di bawah maxDuration

function authorized(req: NextRequest): boolean {
  const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const given = bearer || (req.headers.get("x-cron-secret") ?? "").trim();
  if (!given) return false;
  const secrets = [process.env.RECORDINGS_FINALIZE_SECRET, process.env.CRON_SECRET].filter((s): s is string => !!s);
  const g = Buffer.from(given);
  return secrets.some((s) => { const b = Buffer.from(s); return b.length === g.length && timingSafeEqual(b, g); });
}

function summarize(cands: Awaited<ReturnType<typeof listCandidates>>) {
  return cands.map((c) => ({
    folder: c.folder, bucket: c.bucket, title: c.meta.title, updatedAt: c.updatedAt,
    parts: c.partKeys.length, expected: c.expected, sizeMB: Math.round(c.sizeBytes / 1048576),
    attempts: c.lock?.attempts ?? 0, skip: c.skip ?? null,
  }));
}

async function handle(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const q = req.nextUrl.searchParams;
  const max = Math.max(1, Math.min(5, Number(q.get("max") || 2) || 2));

  if (q.get("dry") === "1") {
    const cands = await listCandidates();
    return NextResponse.json({ dry: true, candidates: summarize(cands) });
  }

  if (q.get("sync") === "1") {
    const { candidates, results } = await finalizeRound({ budgetMs: BUDGET_MS, max });
    return NextResponse.json({ candidates: summarize(candidates), results });
  }

  after(async () => {
    try {
      const { results } = await finalizeRound({ budgetMs: BUDGET_MS, max });
      for (const r of results) {
        if (r.ok && r.key) console.info(`[rekaman-sambung-server] ✓ ${r.key} ${Math.round((r.sizeBytes ?? 0) / 1048576)} MB ${r.durationSec}s dalam ${Math.round(r.ms / 1000)}s`);
        else if (!r.ok) console.warn(`[rekaman-sambung-server] ✗ ${r.folder}: ${r.error}`);
      }
    } catch (e) {
      console.error("[rekaman-sambung-server] putaran gagal", e);
    }
  });
  return NextResponse.json({ accepted: true }, { status: 202 });
}

export async function GET(req: NextRequest) { return handle(req); }
export async function POST(req: NextRequest) { return handle(req); }
