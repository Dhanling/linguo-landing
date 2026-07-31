// [sr-kuis-spaced-repetition-v1] Penjadwal kuis harian — sisi database.
//
// Dua tanggung jawab:
//   1. pickConceptsForSession() — konsep apa yang diuji hari ini
//   2. updateMastery()          — hasil jawaban dituliskan balik ke jadwal
//
// Aturan SM-2-nya sendiri murni & terpisah di mastery.ts (ada unit test-nya).
// File ini cuma soal ambil/tulis baris.

import type { SupabaseClient } from "@supabase/supabase-js";
import { nextMastery, newMasteryState, type MasteryState } from "./mastery";
import type { Concept, MasteryRow } from "./db";

/**
 * Batas konsep review per sesi. SENGAJA dibatasi: siswa yang bolos tiga hari
 * bisa punya 20+ konsep jatuh tempo, dan menyodorkan semuanya sekaligus =
 * kuis 60 soal yang tak akan disentuh. Yang paling lemah & paling telat duluan,
 * sisanya menunggu besok.
 */
export const MAX_REVIEW_CONCEPTS = 5;
/** Batas konsep BARU per sesi — materi baru selalu porsi kecil. */
export const MAX_NEW_CONCEPTS = 3;
/** Kalau tidak ada konsep baru sama sekali, sesi jadi 100% review sampai segini. */
export const MAX_REVIEW_ONLY = 8;

export interface PickedConcepts {
  newConcepts: Concept[];
  reviewConcepts: Concept[];
}

const CONCEPT_COLS = "id, language_code, cefr_level, category, name, description, sort_order";

/**
 * Susun daftar konsep untuk satu sesi kuis.
 *
 * Urutan prioritas:
 *   1. konsep jatuh tempo (`next_review_at <= now`), paling lemah duluan;
 *   2. konsep baru dari sesi Belajar Terstruktur yang sudah diselesaikan;
 *   3. kalau tidak ada konsep baru → antrean review diperlebar;
 *   4. kalau siswa belum punya apa-apa → konsep A1 paling awal (pembuka).
 */
export async function pickConceptsForSession(
  admin: SupabaseClient,
  studentId: string,
  languageCode: string,
  now: Date = new Date()
): Promise<PickedConcepts> {
  // ── 1. Konsep baru dulu, karena jumlahnya menentukan lebar antrean review ──
  const { data: newRaw, error: newErr } = await admin.rpc("sr_new_concept_candidates", {
    p_student: studentId,
    p_lang: languageCode,
    p_limit: MAX_NEW_CONCEPTS,
  });
  if (newErr) throw new Error(`Gagal ambil konsep baru: ${newErr.message}`);
  const newConcepts = (newRaw ?? []) as Concept[];

  // ── 2. Antrean review ────────────────────────────────────────────────────
  const reviewLimit = newConcepts.length > 0 ? MAX_REVIEW_CONCEPTS : MAX_REVIEW_ONLY;
  const { data: dueRaw, error: dueErr } = await admin
    .from("sr_student_mastery")
    .select(`concept_id, mastery_level, next_review_at, sr_concepts!inner(${CONCEPT_COLS})`)
    .eq("student_id", studentId)
    .eq("sr_concepts.language_code", languageCode)
    .eq("sr_concepts.is_active", true)
    .lte("next_review_at", now.toISOString())
    // Yang paling lemah duluan; kalau selevel, yang paling lama telat.
    .order("mastery_level", { ascending: true })
    .order("next_review_at", { ascending: true })
    .limit(reviewLimit);
  if (dueErr) throw new Error(`Gagal ambil konsep review: ${dueErr.message}`);

  type DueRow = { sr_concepts: Concept | Concept[] };
  const reviewConcepts: Concept[] = ((dueRaw ?? []) as DueRow[])
    .map((r) => (Array.isArray(r.sr_concepts) ? r.sr_concepts[0] : r.sr_concepts))
    .filter((c): c is Concept => Boolean(c));

  if (newConcepts.length > 0 || reviewConcepts.length > 0) {
    return { newConcepts, reviewConcepts };
  }

  // ── 3. Tidak ada yang jatuh tempo & tidak ada lesson selesai ─────────────
  // Ambil konsep paling awal di silabus yang BELUM PERNAH diuji ke siswa ini.
  //
  // Penyaring "belum pernah diuji" itu yang penting: tanpa itu, siswa yang
  // kemarin menjawab semuanya benar (jadwal berikutnya 2-3 hari lagi) besok
  // menerima kuis berisi konsep yang persis sama — spaced repetition-nya jadi
  // tidak ada artinya, dan siswa merasa kuisnya mengulang-ulang.
  const { data: knownRaw, error: knownErr } = await admin
    .from("sr_student_mastery")
    .select("concept_id")
    .eq("student_id", studentId)
    .limit(1000);
  if (knownErr) throw new Error(`Gagal baca konsep yang sudah dipelajari: ${knownErr.message}`);
  const known = (knownRaw ?? []).map((r) => (r as { concept_id: string }).concept_id);

  let seedQuery = admin
    .from("sr_concepts")
    .select(CONCEPT_COLS)
    .eq("language_code", languageCode)
    .eq("is_active", true)
    .order("cefr_level", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .limit(MAX_NEW_CONCEPTS);
  if (known.length) seedQuery = seedQuery.not("id", "in", `(${known.join(",")})`);

  const { data: seedRaw, error: seedErr } = await seedQuery;
  if (seedErr) throw new Error(`Gagal ambil konsep pembuka: ${seedErr.message}`);

  // Daftar kosong itu jawaban yang SAH: semua materi sudah dipelajari dan belum
  // ada yang jatuh tempo. Hari ini siswa memang tidak perlu kuis.
  return { newConcepts: (seedRaw ?? []) as Concept[], reviewConcepts: [] };
}

/** Baca state mastery jadi bentuk murni yang dipahami mastery.ts. */
function toState(row: MasteryRow | null): MasteryState {
  if (!row) return newMasteryState();
  return {
    masteryLevel: row.mastery_level,
    easeFactor: Number(row.ease_factor),
    intervalDays: row.interval_days,
    streak: row.streak,
    lapses: row.lapses,
    totalAttempts: row.total_attempts,
    totalCorrect: row.total_correct,
  };
}

export interface MasteryUpdateResult {
  conceptId: string;
  masteryLevel: number;
  nextReviewAt: string;
  wasCorrect: boolean;
}

/**
 * Terapkan satu hasil jawaban ke jadwal konsep. Upsert: baris dibuat kalau
 * konsepnya baru pertama kali diuji.
 */
export async function updateMastery(
  admin: SupabaseClient,
  studentId: string,
  conceptId: string,
  wasCorrect: boolean,
  now: Date = new Date()
): Promise<MasteryUpdateResult> {
  const { data: existing, error: readErr } = await admin
    .from("sr_student_mastery")
    .select("*")
    .eq("student_id", studentId)
    .eq("concept_id", conceptId)
    .maybeSingle();
  if (readErr) throw new Error(`Gagal baca mastery: ${readErr.message}`);

  const { state, nextReviewAt, lastReviewedAt } = nextMastery(
    toState(existing as MasteryRow | null),
    wasCorrect,
    now
  );

  const { error: writeErr } = await admin.from("sr_student_mastery").upsert(
    {
      student_id: studentId,
      concept_id: conceptId,
      mastery_level: state.masteryLevel,
      ease_factor: state.easeFactor,
      interval_days: state.intervalDays,
      streak: state.streak,
      lapses: state.lapses,
      last_reviewed_at: lastReviewedAt,
      next_review_at: nextReviewAt,
      total_attempts: state.totalAttempts,
      total_correct: state.totalCorrect,
    },
    { onConflict: "student_id,concept_id" }
  );
  if (writeErr) throw new Error(`Gagal simpan mastery: ${writeErr.message}`);

  return {
    conceptId,
    masteryLevel: state.masteryLevel,
    nextReviewAt,
    wasCorrect,
  };
}

/**
 * Terapkan beberapa hasil sekaligus. Satu konsep bisa muncul di >1 soal dalam
 * satu sesi; jawabannya digabung dulu (semua benar → benar) supaya konsep tidak
 * naik-turun dua kali dalam satu sesi dan `total_attempts` tetap = 1 sesi 1 kali.
 */
export async function applySessionMastery(
  admin: SupabaseClient,
  studentId: string,
  results: { conceptId: string; wasCorrect: boolean }[],
  now: Date = new Date()
): Promise<MasteryUpdateResult[]> {
  const merged = new Map<string, boolean>();
  for (const r of results) {
    merged.set(r.conceptId, (merged.get(r.conceptId) ?? true) && r.wasCorrect);
  }
  const out: MasteryUpdateResult[] = [];
  for (const [conceptId, wasCorrect] of merged) {
    out.push(await updateMastery(admin, studentId, conceptId, wasCorrect, now));
  }
  return out;
}
