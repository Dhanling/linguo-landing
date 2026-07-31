// [sr-kuis-spaced-repetition-v1] Perakit sesi kuis harian.
//
// Dipakai bareng oleh /api/quiz/create-session (satu siswa) dan
// /api/quiz/cron-daily (semua siswa aktif) — satu-satunya tempat aturan
// "sesi hari ini isinya soal apa" ditulis.
//
// SERVER-ONLY (memakai service role & membaca kunci jawaban).

import type { SupabaseClient } from "@supabase/supabase-js";
import { pickConceptsForSession } from "./scheduler";
import type { BankQuestion, Concept, QuizSessionRow } from "./db";
import { callQuizFunction } from "./edge";

/** Soal dari konsep BARU per sesi. */
export const QUESTIONS_NEW = 10;
/** Soal dari konsep REVIEW per sesi. */
export const QUESTIONS_REVIEW = 10;
/** Umur link kuis. Lewat ini, sesi hangus dan siswa dapat link baru besok. */
export const SESSION_TTL_HOURS = 48;

export interface BuiltSession {
  session: QuizSessionRow;
  questions: BankQuestion[];
  concepts: Concept[];
  url: string;
}

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || "https://linguo.id").replace(/\/+$/, "");
}

/**
 * Soal yang pernah keluar untuk siswa ini — supaya kuis tidak mengulang soal
 * yang sama persis. Diambil sekali per pembuatan sesi.
 */
async function servedQuestionIds(admin: SupabaseClient, studentId: string): Promise<Set<string>> {
  const { data, error } = await admin
    .from("sr_quiz_answers")
    .select("question_id, sr_quiz_sessions!inner(student_id)")
    .eq("sr_quiz_sessions.student_id", studentId)
    .limit(2000);
  if (error) throw new Error(`Gagal baca riwayat soal: ${error.message}`);
  return new Set((data ?? []).map((r) => (r as { question_id: string }).question_id));
}

/** Bagi rata jatah soal ke tiap konsep; sisa pembagian diberikan ke konsep awal. */
function quota(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  const extra = total % n;
  return Array.from({ length: n }, (_, i) => base + (i < extra ? 1 : 0));
}

/**
 * Ambil soal untuk sederet konsep.
 *
 * Prioritas per konsep: soal yang BELUM pernah dilihat siswa, lalu yang paling
 * jarang disajikan. Kalau soal belum-pernah-dilihat habis, soal lama boleh
 * dipakai ulang (lebih baik mengulang daripada konsepnya tidak diuji) DAN
 * generator bank dipanggil di latar belakang supaya besok stoknya sudah ada.
 */
async function pickQuestions(
  admin: SupabaseClient,
  concepts: Concept[],
  total: number,
  served: Set<string>
): Promise<{ questions: BankQuestion[]; thinConcepts: string[] }> {
  if (!concepts.length || total <= 0) return { questions: [], thinConcepts: [] };

  const quotas = quota(total, concepts.length);
  const picked: BankQuestion[] = [];
  const thinConcepts: string[] = [];
  // Sisa jatah konsep yang stoknya kurang dialihkan ke konsep berikutnya.
  let carry = 0;

  for (let i = 0; i < concepts.length; i++) {
    const want = quotas[i] + carry;
    carry = 0;
    const { data, error } = await admin
      .from("sr_question_bank")
      .select("*")
      .eq("concept_id", concepts[i].id)
      .eq("is_active", true)
      .order("times_served", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(60);
    if (error) throw new Error(`Gagal ambil soal: ${error.message}`);

    const pool = (data ?? []) as BankQuestion[];
    const fresh = pool.filter((q) => !served.has(q.id));
    const reused = pool.filter((q) => served.has(q.id));
    const take = [...fresh, ...reused].slice(0, want);

    // Stok tipis: kuis hari ini tetap jalan (pakai yang ada), tapi tandai konsep
    // ini supaya bank-nya diisi ulang setelah respons dikirim.
    if (fresh.length < want) thinConcepts.push(concepts[i].id);
    carry = want - take.length;
    take.forEach((q) => served.add(q.id));
    picked.push(...take);
  }

  return { questions: picked, thinConcepts };
}

/** Kocok deterministik-ish supaya soal satu konsep tidak menggerombol di awal. */
function interleave(a: BankQuestion[], b: BankQuestion[]): BankQuestion[] {
  const out: BankQuestion[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
}

/**
 * Rakit satu sesi kuis lengkap untuk seorang siswa dan simpan ke DB.
 * Melempar error kalau bahasa itu belum punya konsep/soal sama sekali —
 * pemanggil yang memutuskan mau melewati siswa itu (cron) atau menampilkan
 * pesan (route manual).
 */
export async function createQuizSession(
  admin: SupabaseClient,
  studentId: string,
  languageCode: string,
  now: Date = new Date()
): Promise<BuiltSession> {
  const { newConcepts, reviewConcepts } = await pickConceptsForSession(
    admin,
    studentId,
    languageCode,
    now
  );
  if (!newConcepts.length && !reviewConcepts.length) {
    // Dua sebab, satu pesan yang membedakannya — pemanggil (cron) perlu tahu
    // mana "katalog belum dibuat" (kerjaan tim kurikulum) dan mana "siswa ini
    // memang tidak punya materi jatuh tempo hari ini" (keadaan normal).
    const { count } = await admin
      .from("sr_concepts")
      .select("id", { count: "exact", head: true })
      .eq("language_code", languageCode)
      .eq("is_active", true);
    throw new Error(
      count
        ? `Tidak ada materi jatuh tempo hari ini untuk bahasa "${languageCode}".`
        : `Belum ada konsep aktif untuk bahasa "${languageCode}".`
    );
  }

  const served = await servedQuestionIds(admin, studentId);
  const fromNew = await pickQuestions(admin, newConcepts, QUESTIONS_NEW, served);
  const fromReview = await pickQuestions(admin, reviewConcepts, QUESTIONS_REVIEW, served);

  const questions = interleave(fromNew.questions, fromReview.questions);
  if (!questions.length) {
    throw new Error(
      `Bank soal kosong untuk bahasa "${languageCode}" — jalankan scripts/refill-bank.mjs dulu.`
    );
  }

  const expiresAt = new Date(now.getTime() + SESSION_TTL_HOURS * 3600_000).toISOString();
  const { data: session, error } = await admin
    .from("sr_quiz_sessions")
    .insert({
      student_id: studentId,
      language_code: languageCode,
      status: "pending",
      new_concept_ids: newConcepts.map((c) => c.id),
      review_concept_ids: reviewConcepts.map((c) => c.id),
      question_ids: questions.map((q) => q.id),
      total_questions: questions.length,
      expires_at: expiresAt,
    })
    .select("*")
    .single();
  if (error) throw new Error(`Gagal bikin sesi kuis: ${error.message}`);

  // Isi ulang stok konsep yang menipis — sengaja TIDAK di-await: siswa tidak
  // perlu menunggu model, dan kegagalannya tidak boleh menggagalkan sesi.
  const thin = [...new Set([...fromNew.thinConcepts, ...fromReview.thinConcepts])];
  for (const conceptId of thin) {
    void callQuizFunction("quiz-generate-bank", { concept_id: conceptId, count: 10 }).catch(
      (err) => console.error("[kuis] gagal isi ulang bank soal", conceptId, err)
    );
  }

  return {
    session: session as QuizSessionRow,
    questions,
    concepts: [...newConcepts, ...reviewConcepts],
    url: `${baseUrl()}/kuis/${(session as QuizSessionRow).token}`,
  };
}

/**
 * Sesi "aktif" hari ini untuk seorang siswa: masih pending/in_progress dan belum
 * kedaluwarsa. Dipakai cron supaya link kuis tidak menumpuk.
 */
export async function findOpenSession(
  admin: SupabaseClient,
  studentId: string,
  now: Date = new Date()
): Promise<QuizSessionRow | null> {
  const { data, error } = await admin
    .from("sr_quiz_sessions")
    .select("*")
    .eq("student_id", studentId)
    .in("status", ["pending", "in_progress"])
    .gt("expires_at", now.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Gagal cek sesi berjalan: ${error.message}`);
  return (data as QuizSessionRow) ?? null;
}

/** URL publik satu sesi. */
export function sessionUrl(token: string): string {
  return `${baseUrl()}/kuis/${token}`;
}
