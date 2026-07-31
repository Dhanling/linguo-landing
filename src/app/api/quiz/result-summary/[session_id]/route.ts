// ============================================================================
// API: GET /api/quiz/result-summary/[session_id]
// [sr-kuis-spaced-repetition-v1] Ringkasan hasil kuis, siap kirim WhatsApp.
// ----------------------------------------------------------------------------
// Dipakai linguo-wa-bot setelah siswa menyelesaikan kuis. Teks POLOS (✅/❌,
// tanpa markdown) — lihat src/lib/quiz/summary.ts soal kenapa.
//
// Auth: Authorization: Bearer <QUIZ_BOT_SECRET>
// Query: ?format=text mengembalikan text/plain (default JSON).
// ============================================================================

import { NextResponse } from "next/server";
import { quizAdmin, type QuizSessionRow } from "@/lib/quiz/db";
import { guardBot } from "@/lib/quiz/auth";
import { buildSessionResult } from "@/lib/quiz/result";
import { renderWaSummary } from "@/lib/quiz/summary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, props: { params: Promise<{ session_id: string }> }) {
  const denied = guardBot(req);
  if (denied) return denied;

  const { session_id } = await props.params;
  if (!session_id) return NextResponse.json({ error: "session_id wajib" }, { status: 400 });

  try {
    const admin = quizAdmin();
    const { data, error } = await admin
      .from("sr_quiz_sessions")
      .select("*, students!inner(name, whatsapp)")
      .eq("id", session_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });

    const session = data as unknown as QuizSessionRow & {
      students: { name: string | null; whatsapp: string | null }
        | { name: string | null; whatsapp: string | null }[];
    };
    const student = Array.isArray(session.students) ? session.students[0] : session.students;

    if (session.status !== "completed") {
      return NextResponse.json(
        { error: "Sesi belum diselesaikan siswa.", status: session.status },
        { status: 409 }
      );
    }

    const result = await buildSessionResult(admin, session);
    const text = renderWaSummary(result, student?.name);

    if (new URL(req.url).searchParams.get("format") === "text") {
      return new NextResponse(text, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    return NextResponse.json({
      session_id: session.id,
      student_name: student?.name ?? null,
      phone: student?.whatsapp ?? null,
      language_code: session.language_code,
      score_total: result.score_total,
      total_questions: result.total_questions,
      completed_at: session.completed_at,
      text,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[kuis] result-summary gagal:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
