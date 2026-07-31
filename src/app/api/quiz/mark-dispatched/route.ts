// ============================================================================
// API: POST /api/quiz/mark-dispatched
// [sr-kuis-spaced-repetition-v1] Tandai link kuis sudah dikirim ke WhatsApp.
// ----------------------------------------------------------------------------
// Body: { session_ids: uuid[] }
// Auth: Authorization: Bearer <QUIZ_BOT_SECRET>
//
// Hanya baris yang dispatched_at-nya masih NULL yang diubah, jadi laporan yang
// dikirim dua kali (bot retry) tidak menggeser cap waktu pengiriman pertama.
// ============================================================================

import { NextResponse } from "next/server";
import { quizAdmin } from "@/lib/quiz/db";
import { guardBot } from "@/lib/quiz/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const denied = guardBot(req);
  if (denied) return denied;

  let body: { session_ids?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON" }, { status: 400 });
  }

  const ids = (body.session_ids ?? []).filter((id) => typeof id === "string" && id.length === 36);
  if (!ids.length) return NextResponse.json({ error: "session_ids wajib" }, { status: 400 });

  try {
    const admin = quizAdmin();
    const { data, error } = await admin
      .from("sr_quiz_sessions")
      .update({ dispatched_at: new Date().toISOString() })
      .in("id", ids)
      .is("dispatched_at", null)
      .select("id");
    if (error) throw new Error(error.message);

    return NextResponse.json({
      ok: true,
      marked: data?.length ?? 0,
      already_marked: ids.length - (data?.length ?? 0),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[kuis] mark-dispatched gagal:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
