// ============================================================================
// API: GET /api/quiz/pending-dispatch
// [sr-kuis-spaced-repetition-v1] Antrean link kuis yang belum dikirim ke WhatsApp.
// ----------------------------------------------------------------------------
// linguo-wa-bot memanggil ini, mengirim tiap link, lalu melapor balik lewat
// /api/quiz/mark-dispatched. Pemisahan itu disengaja: bot boleh crash di
// tengah jalan tanpa membuat siswa menerima dua pesan, karena yang menandai
// "sudah terkirim" cuma laporan balik bot.
//
// Auth  : Authorization: Bearer <QUIZ_BOT_SECRET>
// Query : ?limit=200 (default 200, maks 500)
// ============================================================================

import { NextResponse } from "next/server";
import { quizAdmin } from "@/lib/quiz/db";
import { guardBot } from "@/lib/quiz/auth";
import { sessionUrl } from "@/lib/quiz/session";
import { langLabel } from "@/lib/quiz/language";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = guardBot(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 200, 1), 500);

  try {
    const admin = quizAdmin();
    const { data, error } = await admin
      .from("sr_quiz_sessions")
      .select("id, token, language_code, total_questions, expires_at, created_at, students!inner(id, name, whatsapp)")
      .is("dispatched_at", null)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) throw new Error(error.message);

    type Row = {
      id: string;
      token: string;
      language_code: string;
      total_questions: number | null;
      expires_at: string;
      students: { id: string; name: string | null; whatsapp: string | null }
        | { id: string; name: string | null; whatsapp: string | null }[];
    };

    const rows = ((data ?? []) as unknown as Row[]).map((r) => {
      const s = Array.isArray(r.students) ? r.students[0] : r.students;
      return {
        session_id: r.id,
        student_id: s?.id ?? null,
        name: s?.name ?? null,
        phone: s?.whatsapp ?? null,
        url: sessionUrl(r.token),
        language_code: r.language_code,
        language_label: langLabel(r.language_code),
        total_questions: r.total_questions,
        expires_at: r.expires_at,
      };
    });

    // Siswa tanpa nomor WA tetap dikembalikan, tapi ditandai — biar ketahuan
    // datanya bolong, bukan diam-diam hilang dari antrean.
    return NextResponse.json({
      count: rows.length,
      no_phone: rows.filter((r) => !r.phone?.trim()).length,
      dispatches: rows,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[kuis] pending-dispatch gagal:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
