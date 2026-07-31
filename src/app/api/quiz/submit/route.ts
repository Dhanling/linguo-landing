// ============================================================================
// API: POST /api/quiz/submit
// [sr-kuis-spaced-repetition-v1] Kumpulkan jawaban, nilai, tulis balik jadwal.
// ----------------------------------------------------------------------------
// Body: { token, answers: [{ question_id, answer }] }
//   answer untuk 'mc'          = index pilihan ("0".."3")
//   answer untuk 'translation' = teks jawaban siswa
//
// Urutan kerja:
//   1. validasi token (belum selesai, belum hangus)
//   2. soal pilihan ganda dinilai DETERMINISTIK — cocokkan index, nol AI
//   3. semua soal terjemahan dinilai dalam SATU panggilan quiz-grade
//   4. simpan sr_quiz_answers
//   5. jalankan SM-2 untuk tiap konsep yang tersentuh
//   6. perbarui times_served / times_correct di bank soal
//   7. tutup sesi + kembalikan hasil lengkap
//
// Idempoten di titik terpenting: sesi yang sudah completed langsung memulangkan
// hasil lama, jadi tombol kirim yang diklik dua kali tidak menilai ulang dan
// tidak menggeser jadwal dua kali.
// ============================================================================

import { NextResponse } from "next/server";
import { quizAdmin, type BankQuestion, type QuizSessionRow } from "@/lib/quiz/db";
import { applySessionMastery } from "@/lib/quiz/scheduler";
import { buildSessionResult } from "@/lib/quiz/result";
import { callQuizFunction } from "@/lib/quiz/edge";
import { langEnglishName } from "@/lib/quiz/language";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface SubmittedAnswer {
  question_id: string;
  answer: string;
}

interface GradeResult {
  results: { no: number; is_correct: boolean; feedback: string }[];
  degraded?: boolean;
}

/** Penilaian pilihan ganda: murni cocokkan index. Tidak ada AI di jalur ini. */
function gradeMc(q: BankQuestion, answer: string): boolean {
  const picked = Number.parseInt((answer ?? "").trim(), 10);
  if (!Number.isInteger(picked)) return false;
  return picked === q.correct_index;
}

export async function POST(req: Request) {
  let body: { token?: string; answers?: SubmittedAnswer[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON" }, { status: 400 });
  }

  const token = (body.token || "").trim();
  const answers = Array.isArray(body.answers) ? body.answers : [];
  if (!token) return NextResponse.json({ error: "token wajib" }, { status: 400 });

  try {
    const admin = quizAdmin();

    const { data: sessionRaw, error: sErr } = await admin
      .from("sr_quiz_sessions")
      .select("*")
      .eq("token", token)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!sessionRaw) {
      return NextResponse.json({ error: "Link kuis tidak ditemukan.", code: "not_found" }, { status: 404 });
    }
    const session = sessionRaw as QuizSessionRow;

    // Kiriman ulang (klik dobel, koneksi putus lalu retry) → hasil yang sudah ada.
    if (session.status === "completed") {
      const result = await buildSessionResult(admin, session);
      return NextResponse.json({ already_completed: true, result });
    }
    if (new Date(session.expires_at).getTime() <= Date.now() || session.status === "expired") {
      await admin.from("sr_quiz_sessions").update({ status: "expired" }).eq("id", session.id);
      return NextResponse.json(
        { error: "Link kuis sudah hangus, jawaban tidak bisa dikirim.", code: "expired" },
        { status: 410 }
      );
    }

    // ── Soal yang SAH untuk sesi ini ────────────────────────────────────────
    // Hanya soal yang dibekukan di question_ids. Tanpa penyaring ini, siapa pun
    // bisa mengirim id soal karangan dan menaikkan penguasaan konsep lain.
    const allowed = new Set(session.question_ids ?? []);
    const submitted = answers.filter((a) => a?.question_id && allowed.has(a.question_id));

    const { data: qRaw, error: qErr } = await admin
      .from("sr_question_bank")
      .select("*")
      .in("id", session.question_ids ?? []);
    if (qErr) throw new Error(qErr.message);
    const questions = (qRaw ?? []) as BankQuestion[];
    const byId = new Map(questions.map((q) => [q.id, q]));

    const answerByQ = new Map(submitted.map((a) => [a.question_id, (a.answer ?? "").toString()]));

    // ── 1. Pilihan ganda: deterministik ────────────────────────────────────
    const graded = new Map<string, { isCorrect: boolean; feedback: string | null; answer: string | null }>();
    const translationQs: BankQuestion[] = [];
    for (const id of session.question_ids ?? []) {
      const q = byId.get(id);
      if (!q) continue;
      const raw = answerByQ.get(id) ?? null;
      if (q.question_type === "mc") {
        graded.set(id, { isCorrect: raw !== null && gradeMc(q, raw), feedback: null, answer: raw });
      } else {
        translationQs.push(q);
      }
    }

    // ── 2. Terjemahan: SATU panggilan AI untuk semuanya ─────────────────────
    if (translationQs.length) {
      const items = translationQs.map((q, i) => ({
        no: i + 1,
        prompt: q.prompt,
        correct_answer: q.correct_answer ?? "",
        accepted_variants: q.accepted_variants ?? [],
        student_answer: answerByQ.get(q.id) ?? "",
      }));
      let results: GradeResult["results"] = [];
      try {
        const graded2 = await callQuizFunction<GradeResult>("quiz-grade", {
          items,
          language: langEnglishName(session.language_code),
        });
        results = graded2.results ?? [];
      } catch (err) {
        // Penilai AI mati → jangan menggantung sesi siswa. Jawaban kosong dinilai
        // salah, jawaban terisi dinilai benar sementara dan ditandai perlu dicek:
        // menghukum siswa karena layanan kita yang down itu lebih merugikan.
        console.error("[kuis] quiz-grade gagal, pakai penilaian cadangan:", err);
        results = items.map((i) => ({
          no: i.no,
          is_correct: Boolean(i.student_answer.trim()),
          feedback: "Penilai otomatis sedang bermasalah — jawabanmu akan dicek pengajar.",
        }));
      }
      const byNo = new Map(results.map((r) => [r.no, r]));
      translationQs.forEach((q, i) => {
        const r = byNo.get(i + 1);
        graded.set(q.id, {
          isCorrect: Boolean(r?.is_correct),
          feedback: r?.feedback ?? null,
          answer: answerByQ.get(q.id) ?? null,
        });
      });
    }

    // ── 3. Simpan jawaban ───────────────────────────────────────────────────
    const rows = (session.question_ids ?? [])
      .map((id) => {
        const q = byId.get(id);
        const g = graded.get(id);
        if (!q || !g) return null;
        return {
          session_id: session.id,
          question_id: q.id,
          concept_id: q.concept_id,
          question_type: q.question_type,
          student_answer: g.answer,
          is_correct: g.isCorrect,
          ai_feedback: g.feedback,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    const { error: insErr } = await admin
      .from("sr_quiz_answers")
      .upsert(rows, { onConflict: "session_id,question_id" });
    if (insErr) throw new Error(`Gagal simpan jawaban: ${insErr.message}`);

    // ── 4. Jadwal ulang tiap konsep yang tersentuh ─────────────────────────
    await applySessionMastery(
      admin,
      session.student_id,
      rows.map((r) => ({ conceptId: r.concept_id, wasCorrect: r.is_correct }))
    );

    // ── 5. Statistik bank soal (buat kurasi soal yang terlalu susah/mudah) ──
    // Dijalankan satu per satu lewat RPC penambah; kalau gagal, kuisnya tetap
    // sah — angka statistik bukan data yang boleh menggagalkan sesi siswa.
    for (const r of rows) {
      const { error: statErr } = await admin.rpc("sr_bump_question_stats", {
        p_question: r.question_id,
        p_correct: r.is_correct,
      });
      if (statErr) console.error("[kuis] gagal update statistik soal", r.question_id, statErr.message);
    }

    // ── 6. Tutup sesi ───────────────────────────────────────────────────────
    const scoreMc = rows.filter((r) => r.question_type === "mc" && r.is_correct).length;
    const scoreTr = rows.filter((r) => r.question_type === "translation" && r.is_correct).length;
    const { data: closedRaw, error: upErr } = await admin
      .from("sr_quiz_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        score_mc: scoreMc,
        score_translation: scoreTr,
        score_total: scoreMc + scoreTr,
        total_questions: rows.length,
      })
      .eq("id", session.id)
      .select("*")
      .single();
    if (upErr) throw new Error(`Gagal menutup sesi: ${upErr.message}`);

    const result = await buildSessionResult(admin, closedRaw as QuizSessionRow);
    return NextResponse.json({ already_completed: false, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[kuis] submit gagal:", msg);
    return NextResponse.json({ error: "Jawaban gagal dikirim.", detail: msg }, { status: 500 });
  }
}
