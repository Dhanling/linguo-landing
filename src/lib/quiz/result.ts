// [sr-kuis-spaced-repetition-v1] Perakit layar hasil kuis.
//
// Satu bentuk hasil dipakai tiga tempat: balasan /api/quiz/submit, pembukaan
// ulang sesi yang sudah selesai (/api/quiz/session/[token]), dan ringkasan teks
// untuk WhatsApp. Dirakit di satu tempat supaya angka di WA tidak pernah beda
// dari angka di layar.
//
// Hasil kuis yang SUDAH selesai boleh memuat kunci jawaban & penjelasan — itu
// justru inti belajarnya. Yang tidak boleh bocor cuma soal yang belum dijawab.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuizSessionRow, QuestionType } from "./db";
import { masteryLabel } from "./mastery";

export interface ResultItem {
  no: number;
  question_id: string;
  concept_id: string;
  concept_name: string;
  question_type: QuestionType;
  prompt: string;
  prompt_translit: string | null;
  choices: string[] | null;
  choices_translit: string[] | null;
  student_answer: string | null;
  /** Teks jawaban siswa yang enak dibaca (untuk `mc`, isi pilihannya). */
  student_answer_text: string | null;
  correct_answer_text: string;
  correct_answer_translit: string | null;
  is_correct: boolean;
  explanation: string;
  ai_feedback: string | null;
}

export interface ResultConcept {
  concept_id: string;
  name: string;
  mastery_level: number;
  mastery_label: string;
  next_review_at: string | null;
  correct: number;
  total: number;
}

export interface SessionResult {
  session_id: string;
  language_code: string;
  status: QuizSessionRow["status"];
  completed_at: string | null;
  score_total: number;
  score_mc: number;
  score_translation: number;
  total_questions: number;
  total_mc: number;
  total_translation: number;
  items: ResultItem[];
  concepts: ResultConcept[];
}

interface AnswerJoin {
  question_id: string;
  concept_id: string;
  question_type: QuestionType;
  student_answer: string | null;
  is_correct: boolean | null;
  ai_feedback: string | null;
  sr_question_bank: {
    prompt: string;
    prompt_translit: string | null;
    choices: string[] | null;
    choices_translit: string[] | null;
    correct_index: number | null;
    correct_answer: string | null;
    explanation: string;
  } | null;
  sr_concepts: { name: string } | null;
}

/** Ambil satu (bukan array) dari hasil embed PostgREST. */
function one<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export async function buildSessionResult(
  admin: SupabaseClient,
  session: QuizSessionRow
): Promise<SessionResult> {
  const { data, error } = await admin
    .from("sr_quiz_answers")
    .select(
      `question_id, concept_id, question_type, student_answer, is_correct, ai_feedback,
       sr_question_bank!inner(prompt, prompt_translit, choices, choices_translit, correct_index, correct_answer, explanation),
       sr_concepts!inner(name)`
    )
    .eq("session_id", session.id);
  if (error) throw new Error(`Gagal baca jawaban: ${error.message}`);

  const rows = (data ?? []) as unknown as AnswerJoin[];
  // Urutkan sesuai urutan soal yang dibekukan di sesi, bukan urutan insert.
  const order = new Map((session.question_ids ?? []).map((id, i) => [id, i]));
  rows.sort((a, b) => (order.get(a.question_id) ?? 0) - (order.get(b.question_id) ?? 0));

  const items: ResultItem[] = rows.map((r, i) => {
    const q = one(r.sr_question_bank);
    const c = one(r.sr_concepts);
    const choices = q?.choices ?? null;
    const translit = q?.choices_translit ?? null;

    let studentText: string | null = r.student_answer;
    let correctText = q?.correct_answer ?? "";
    let correctTranslit: string | null = null;

    if (r.question_type === "mc" && choices) {
      const picked = Number(r.student_answer);
      studentText = Number.isInteger(picked) && choices[picked] !== undefined ? choices[picked] : null;
      const ci = q?.correct_index ?? -1;
      correctText = choices[ci] ?? "";
      correctTranslit = translit?.[ci] ?? null;
    }

    return {
      no: i + 1,
      question_id: r.question_id,
      concept_id: r.concept_id,
      concept_name: c?.name ?? "",
      question_type: r.question_type,
      prompt: q?.prompt ?? "",
      prompt_translit: q?.prompt_translit ?? null,
      choices,
      choices_translit: translit,
      student_answer: r.student_answer,
      student_answer_text: studentText,
      correct_answer_text: correctText,
      correct_answer_translit: correctTranslit,
      is_correct: Boolean(r.is_correct),
      explanation: q?.explanation ?? "",
      ai_feedback: r.ai_feedback,
    };
  });

  // Ringkasan per konsep: berapa benar dari berapa soal, plus jadwal berikutnya.
  const conceptIds = [...new Set(items.map((i) => i.concept_id))];
  const { data: masteryRows } = await admin
    .from("sr_student_mastery")
    .select("concept_id, mastery_level, next_review_at, sr_concepts!inner(name)")
    .eq("student_id", session.student_id)
    .in("concept_id", conceptIds.length ? conceptIds : ["00000000-0000-0000-0000-000000000000"]);

  const masteryByConcept = new Map(
    ((masteryRows ?? []) as unknown as {
      concept_id: string;
      mastery_level: number;
      next_review_at: string | null;
      sr_concepts: { name: string } | { name: string }[];
    }[]).map((m) => [m.concept_id, m])
  );

  const concepts: ResultConcept[] = conceptIds.map((id) => {
    const own = items.filter((i) => i.concept_id === id);
    const m = masteryByConcept.get(id);
    const level = m?.mastery_level ?? 0;
    return {
      concept_id: id,
      name: own[0]?.concept_name || one(m?.sr_concepts ?? null)?.name || "",
      mastery_level: level,
      mastery_label: masteryLabel(level),
      next_review_at: m?.next_review_at ?? null,
      correct: own.filter((i) => i.is_correct).length,
      total: own.length,
    };
  });

  const mc = items.filter((i) => i.question_type === "mc");
  const tr = items.filter((i) => i.question_type === "translation");

  return {
    session_id: session.id,
    language_code: session.language_code,
    status: session.status,
    completed_at: session.completed_at,
    score_total: items.filter((i) => i.is_correct).length,
    score_mc: mc.filter((i) => i.is_correct).length,
    score_translation: tr.filter((i) => i.is_correct).length,
    total_questions: items.length,
    total_mc: mc.length,
    total_translation: tr.length,
    items,
    concepts,
  };
}
