// [sr-kuis-spaced-repetition-v1] Inti spaced repetition kuis harian (SM-2 ringkas).
//
// SENGAJA MURNI: tidak menyentuh Supabase sama sekali, semua state masuk & keluar
// lewat argumen. Itu yang bikin aturan penjadwalannya bisa diuji tanpa DB —
// lihat mastery.test.ts. Sisi database-nya ada di scheduler.ts.
//
// Beda dari srs.ts (deck flashcard): di sana pengguna menilai diri sendiri dengan
// 4 tombol ala Anki. Di sini nilainya BINER — soal kuis benar atau salah — jadi
// tangga intervalnya ditetapkan di muka, bukan dihitung dari kualitas ingatan.

/** Tangga interval dasar (hari) per tingkat penguasaan 0-5. */
export const INTERVAL_LADDER = [1, 3, 7, 14, 30, 60] as const;

export const MAX_MASTERY = 5;
export const MIN_EASE = 1.3;
export const MAX_EASE = 3.0;

/** Kolom sr_student_mastery yang ikut berubah tiap kali soal dijawab. */
export interface MasteryState {
  masteryLevel: number;
  easeFactor: number;
  intervalDays: number;
  streak: number;
  lapses: number;
  totalAttempts: number;
  totalCorrect: number;
}

export interface MasteryTransition {
  state: MasteryState;
  /** ISO — kapan konsep ini muncul lagi di kuis. */
  nextReviewAt: string;
  lastReviewedAt: string;
}

/** State awal konsep yang belum pernah diuji sama sekali. */
export function newMasteryState(): MasteryState {
  return {
    masteryLevel: 0,
    easeFactor: 2.5,
    intervalDays: 0,
    streak: 0,
    lapses: 0,
    totalAttempts: 0,
    totalCorrect: 0,
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const DAY_MS = 86_400_000;

/**
 * Hitung state berikutnya setelah satu jawaban.
 *
 * BENAR → naik satu tingkat, interval melompat ke anak tangga berikutnya, ease
 * naik 0.1. Tangga dibaca pada tingkat SEBELUM kenaikan (`INTERVAL_LADDER[level
 * lama]`), bukan tingkat baru: kalau dibaca pada tingkat baru, satu jawaban benar
 * pertama langsung menjadwalkan ulang ~8 hari lagi (3 hari × ease 2.6) padahal
 * konsepnya baru sekali kelihatan. Dengan cara ini urutannya jadi ±2,6 → 8 → 20
 * → 41 → 90 → 180 hari, yang masih lazim untuk SM-2.
 *
 * SALAH → turun DUA tingkat (bukan reset ke 0: reset total bikin siswa merasa
 * usahanya hangus), ease turun 0.2, dan konsepnya balik besok.
 */
export function nextMastery(
  prev: MasteryState,
  wasCorrect: boolean,
  now: Date = new Date()
): MasteryTransition {
  const nowIso = now.toISOString();
  const totalAttempts = prev.totalAttempts + 1;
  const totalCorrect = prev.totalCorrect + (wasCorrect ? 1 : 0);

  if (!wasCorrect) {
    const state: MasteryState = {
      masteryLevel: clamp(prev.masteryLevel - 2, 0, MAX_MASTERY),
      easeFactor: clamp(prev.easeFactor - 0.2, MIN_EASE, MAX_EASE),
      intervalDays: 1,
      streak: 0,
      lapses: prev.lapses + 1,
      totalAttempts,
      totalCorrect,
    };
    return {
      state,
      nextReviewAt: new Date(now.getTime() + DAY_MS).toISOString(),
      lastReviewedAt: nowIso,
    };
  }

  const prevLevel = clamp(prev.masteryLevel, 0, MAX_MASTERY);
  const intervalDays = INTERVAL_LADDER[Math.min(prevLevel, INTERVAL_LADDER.length - 1)];
  const easeFactor = clamp(prev.easeFactor + 0.1, MIN_EASE, MAX_EASE);
  const state: MasteryState = {
    masteryLevel: clamp(prevLevel + 1, 0, MAX_MASTERY),
    easeFactor,
    intervalDays,
    streak: prev.streak + 1,
    lapses: prev.lapses,
    totalAttempts,
    totalCorrect,
  };
  return {
    state,
    nextReviewAt: new Date(now.getTime() + intervalDays * easeFactor * DAY_MS).toISOString(),
    lastReviewedAt: nowIso,
  };
}

/** Label penguasaan untuk ringkasan di layar hasil & pesan WA. */
export function masteryLabel(level: number): string {
  if (level >= 5) return "Dikuasai";
  if (level >= 3) return "Hampir solid";
  if (level >= 1) return "Sedang belajar";
  return "Perlu diulang";
}
