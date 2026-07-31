// [sr-kuis-spaced-repetition-v1] Klien Supabase service-role + tipe bersama kuis harian.
//
// SERVER-ONLY. Jangan pernah diimpor dari komponen "use client": kuncinya service
// role, dan `sr_question_bank` (berisi kunci jawaban) sengaja tidak punya policy
// RLS sama sekali — satu-satunya jalan masuk ke tabel itu adalah klien ini, dari
// route server.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let _admin: SupabaseClient | null = null;

/** Klien service-role (singleton per proses lambda). */
export function quizAdmin(): SupabaseClient {
  if (!_admin) {
    if (!SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diset — kuis harian butuh service role.");
    }
    _admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _admin;
}

export type QuestionType = "mc" | "translation";

export interface Concept {
  id: string;
  language_code: string;
  cefr_level: string;
  category: string;
  name: string;
  description: string | null;
  sort_order: number;
}

/** Baris bank soal LENGKAP — termasuk kunci jawaban. Jangan pernah dikirim ke klien. */
export interface BankQuestion {
  id: string;
  concept_id: string;
  question_type: QuestionType;
  prompt: string;
  prompt_translit: string | null;
  choices: string[] | null;
  choices_translit: string[] | null;
  correct_index: number | null;
  correct_answer: string | null;
  accepted_variants: string[];
  explanation: string;
  difficulty: number;
  times_served: number;
  times_correct: number;
}

/** Bentuk soal yang AMAN dikirim ke browser (tanpa kunci jawaban & penjelasan). */
export interface PublicQuestion {
  id: string;
  concept_id: string;
  concept_name: string;
  question_type: QuestionType;
  prompt: string;
  prompt_translit: string | null;
  choices: string[] | null;
  choices_translit: string[] | null;
}

export interface MasteryRow {
  id: string;
  student_id: string;
  concept_id: string;
  mastery_level: number;
  ease_factor: number;
  interval_days: number;
  streak: number;
  lapses: number;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  total_attempts: number;
  total_correct: number;
}

export interface QuizSessionRow {
  id: string;
  student_id: string;
  language_code: string;
  token: string;
  status: "pending" | "in_progress" | "completed" | "expired";
  new_concept_ids: string[];
  review_concept_ids: string[];
  /** Daftar soal sesi ini, URUT. Dibekukan saat sesi dibuat — jangan disusun ulang. */
  question_ids: string[];
  total_questions: number | null;
  score_mc: number | null;
  score_translation: number | null;
  score_total: number | null;
  dispatched_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string;
  created_at: string;
}

/** Buang kunci jawaban sebelum soal dikirim ke browser. */
export function toPublicQuestion(q: BankQuestion, conceptName: string): PublicQuestion {
  return {
    id: q.id,
    concept_id: q.concept_id,
    concept_name: conceptName,
    question_type: q.question_type,
    prompt: q.prompt,
    prompt_translit: q.prompt_translit,
    choices: q.choices,
    choices_translit: q.choices_translit,
  };
}
