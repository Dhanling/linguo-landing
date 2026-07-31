// ============================================================================
// API: GET /api/quiz/session/[token]
// [sr-kuis-spaced-repetition-v1] Isi satu sesi kuis untuk halaman /kuis/[token].
// ----------------------------------------------------------------------------
// Tidak butuh login: token di URL yang jadi kredensialnya (link dikirim ke WA
// pribadi siswa). Karena itu semua akses ke bank soal lewat service role di sini,
// dan `sr_question_bank` tidak punya policy RLS sama sekali.
//
// YANG TIDAK PERNAH DIKIRIM KE BROWSER selama kuis belum selesai:
//   correct_index, correct_answer, accepted_variants, explanation.
// Kalau salah satu bocor, seluruh kuis bisa dijawab dari devtools.
//
// Status:
//   pending / in_progress → daftar soal (tanpa kunci)
//   completed             → hasil lengkap (kunci & penjelasan BOLEH, sudah selesai)
//   kedaluwarsa           → 410 dengan pesan ramah, sekalian ditandai expired
// ============================================================================

import { NextResponse } from "next/server";
import { quizAdmin, toPublicQuestion, type BankQuestion, type QuizSessionRow } from "@/lib/quiz/db";
import { buildSessionResult } from "@/lib/quiz/result";
import { langLabel, needsTranslit } from "@/lib/quiz/language";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Link kuis tidak valid.", code: "invalid" }, { status: 404 });
  }

  try {
    const admin = quizAdmin();
    const { data: sessionRaw, error } = await admin
      .from("sr_quiz_sessions")
      .select("*, students!inner(name)")
      .eq("token", token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!sessionRaw) {
      return NextResponse.json(
        { error: "Link kuis tidak ditemukan.", code: "not_found" },
        { status: 404 }
      );
    }

    const session = sessionRaw as unknown as QuizSessionRow & {
      students: { name: string | null } | { name: string | null }[];
    };
    const studentName = Array.isArray(session.students)
      ? session.students[0]?.name
      : session.students?.name;

    const common = {
      session_id: session.id,
      student_name: studentName ?? null,
      language_code: session.language_code,
      language_label: langLabel(session.language_code),
      needs_translit: needsTranslit(session.language_code),
      expires_at: session.expires_at,
    };

    // ── Sudah dikerjakan → tampilkan hasilnya, bukan soalnya ────────────────
    if (session.status === "completed") {
      const result = await buildSessionResult(admin, session);
      return NextResponse.json({ ...common, status: "completed", result });
    }

    // ── Kedaluwarsa ─────────────────────────────────────────────────────────
    if (new Date(session.expires_at).getTime() <= Date.now()) {
      if (session.status !== "expired") {
        await admin.from("sr_quiz_sessions").update({ status: "expired" }).eq("id", session.id);
      }
      return NextResponse.json(
        {
          ...common,
          status: "expired",
          code: "expired",
          error: "Link kuis ini sudah lewat masa berlakunya (48 jam).",
        },
        { status: 410 }
      );
    }
    if (session.status === "expired") {
      return NextResponse.json(
        { ...common, status: "expired", code: "expired", error: "Link kuis ini sudah hangus." },
        { status: 410 }
      );
    }

    // ── Ambil soal sesuai urutan yang DIBEKUKAN saat sesi dibuat ────────────
    const ids = session.question_ids ?? [];
    if (!ids.length) {
      return NextResponse.json(
        { ...common, error: "Sesi ini tidak punya soal.", code: "empty" },
        { status: 500 }
      );
    }

    const { data: qRaw, error: qErr } = await admin
      .from("sr_question_bank")
      .select("*, sr_concepts!inner(name)")
      .in("id", ids);
    if (qErr) throw new Error(qErr.message);

    const byId = new Map(
      ((qRaw ?? []) as unknown as (BankQuestion & { sr_concepts: { name: string } | { name: string }[] })[])
        .map((q) => [q.id, q])
    );
    const questions = ids
      .map((id) => byId.get(id))
      .filter((q): q is BankQuestion & { sr_concepts: { name: string } | { name: string }[] } => Boolean(q))
      .map((q) => {
        const c = Array.isArray(q.sr_concepts) ? q.sr_concepts[0] : q.sr_concepts;
        return toPublicQuestion(q, c?.name ?? "");
      });

    // Buka pertama kali = sesi dimulai. Dicatat sekali saja supaya `started_at`
    // tetap menandai kapan siswa benar-benar mulai, bukan kapan terakhir refresh.
    if (session.status === "pending") {
      await admin
        .from("sr_quiz_sessions")
        .update({ status: "in_progress", started_at: new Date().toISOString() })
        .eq("id", session.id)
        .eq("status", "pending");
    }

    return NextResponse.json({
      ...common,
      status: "in_progress",
      new_concepts: session.new_concept_ids?.length ?? 0,
      review_concepts: session.review_concept_ids?.length ?? 0,
      concept_names: [...new Set(questions.map((q) => q.concept_name).filter(Boolean))],
      total_questions: questions.length,
      questions,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[kuis] gagal buka sesi:", msg);
    return NextResponse.json({ error: "Kuis gagal dimuat.", code: "server" }, { status: 500 });
  }
}
