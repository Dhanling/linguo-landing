// ============================================================================
// API: POST /api/quiz/create-session
// [sr-kuis-spaced-repetition-v1] Bikin satu sesi kuis harian untuk satu siswa.
// ----------------------------------------------------------------------------
// Dipakai untuk uji coba manual & kirim ulang link; jalur harian yang sebenarnya
// ada di /api/quiz/cron-daily (yang memanggil perakit sesi yang sama).
//
// Body : { student_id: uuid, language_code?: string }
//        language_code opsional — kalau kosong, diambil dari registrasi AKTIF
//        siswa (nama kelas dipetakan ke kode ISO).
// Auth : Authorization: Bearer <CRON_SECRET | QUIZ_BOT_SECRET>
// ============================================================================

import { NextResponse } from "next/server";
import { quizAdmin } from "@/lib/quiz/db";
import { guardBot } from "@/lib/quiz/auth";
import { createQuizSession, findOpenSession, sessionUrl } from "@/lib/quiz/session";
import { toLangCode } from "@/lib/quiz/language";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const denied = guardBot(req);
  if (denied) return denied;

  let body: { student_id?: string; language_code?: string; force?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON" }, { status: 400 });
  }

  const studentId = (body.student_id || "").trim();
  if (!studentId) return NextResponse.json({ error: "student_id wajib" }, { status: 400 });

  try {
    const admin = quizAdmin();

    let langCode = body.language_code?.trim() || null;
    if (!langCode) {
      // Bahasa diambil dari registrasi AKTIF terbaru. registrations.language
      // isinya nama KELAS ("English - Conversation A1.1 (…)"), jadi wajib lewat
      // toLangCode() — bukan dipakai mentah.
      const { data: reg } = await admin
        .from("registrations")
        .select("language, registration_date")
        .eq("student_id", studentId)
        .eq("status", "Aktif")
        .is("archived_at", null)
        .order("registration_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      langCode = toLangCode(reg?.language);
      if (!langCode) {
        return NextResponse.json(
          { error: "Bahasa siswa tidak terbaca dari registrasi aktif — kirim language_code manual." },
          { status: 422 }
        );
      }
    }

    // Jangan menumpuk link: kalau sesi kemarin belum dikerjakan dan belum
    // hangus, kirim ulang link yang sama.
    if (!body.force) {
      const open = await findOpenSession(admin, studentId);
      if (open) {
        return NextResponse.json({
          reused: true,
          session_id: open.id,
          token: open.token,
          url: sessionUrl(open.token),
          language_code: open.language_code,
          total_questions: open.total_questions,
          expires_at: open.expires_at,
        });
      }
    }

    const built = await createQuizSession(admin, studentId, langCode);
    return NextResponse.json({
      reused: false,
      session_id: built.session.id,
      token: built.session.token,
      url: built.url,
      language_code: langCode,
      total_questions: built.questions.length,
      new_concepts: built.session.new_concept_ids.length,
      review_concepts: built.session.review_concept_ids.length,
      expires_at: built.session.expires_at,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[kuis] create-session gagal:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
