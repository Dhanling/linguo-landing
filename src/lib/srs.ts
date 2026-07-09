// Penjadwalan spaced-repetition (varian ringkas SM-2) untuk deck flashcard web.
// Port dari srs.ts di app Linguo (linguo-app) supaya perilakunya SAMA persis:
// tiap kata tersimpan membawa state SRS (reps, interval, ease, jatuh tempo). Saat
// pengguna menilai kartu, state berikutnya dihitung di sini. Interval dalam HARI.

// Empat respons ala Anki: "Lagi" (lupa), "Sulit" (ingat dengan susah), "Bagus"
// (ingat), "Mudah" (sepele).
export type SrsGrade = "again" | "hard" | "good" | "easy";

/** Tahap kematangan kartu — dipakai badge & statistik deck. */
export type CardStage = "new" | "learning" | "mastered";

/** Interval (hari) di mana kartu dianggap "Dikuasai". */
export const MASTERED_INTERVAL_DAYS = 21;

/** Kelompokkan kartu berdasarkan progres SRS (baru → belajar → dikuasai). */
export function cardStage(s?: Pick<SrsState, "reps" | "intervalDays">): CardStage {
  if (!s || s.reps <= 0) return "new";
  if (s.intervalDays >= MASTERED_INTERVAL_DAYS) return "mastered";
  return "learning";
}

export interface SrsState {
  reps: number;
  intervalDays: number;
  ease: number;
  dueAt: string | null; // ISO; null = jatuh tempo sekarang
  lastReviewedAt: string | null;
  reviewCount: number;
}

const MIN_EASE = 1.3;
const DAY_MS = 24 * 60 * 60 * 1000;

/** State SRS default untuk kata yang baru disimpan (jatuh tempo langsung). */
export function newSrsState(): SrsState {
  return {
    reps: 0,
    intervalDays: 0,
    ease: 2.5,
    dueAt: null,
    lastReviewedAt: null,
    reviewCount: 0,
  };
}

/** Apakah kartu jatuh tempo sekarang (tanpa dueAt = jatuh tempo). */
export function isDue(s: Pick<SrsState, "dueAt"> | undefined, now: number = Date.now()): boolean {
  if (!s || !s.dueAt) return true;
  return new Date(s.dueAt).getTime() <= now;
}

/**
 * Terapkan nilai ke state SRS saat ini, balikin state berikutnya. "again" mereset
 * kartu (belajar ulang); "good"/"easy" menumbuhkan interval dengan faktor ease,
 * "easy" dapat bonus + menaikkan ease.
 */
export function gradeCard(prev: SrsState, grade: SrsGrade, now: number = Date.now()): SrsState {
  const reviewCount = prev.reviewCount + 1;
  const nowIso = new Date(now).toISOString();

  if (grade === "again") {
    // Lupa: reset progres, tampil lagi ~1 hari (dan lagi di sesi ini).
    return {
      reps: 0,
      intervalDays: 0,
      ease: Math.max(MIN_EASE, prev.ease - 0.2),
      dueAt: new Date(now + DAY_MS).toISOString(),
      lastReviewedAt: nowIso,
      reviewCount,
    };
  }

  const reps = prev.reps + 1;
  let ease = prev.ease;
  if (grade === "easy") ease = prev.ease + 0.15;
  else if (grade === "hard") ease = prev.ease - 0.15;
  ease = Math.max(MIN_EASE, ease);

  // "Sulit": lulus lemah — ease turun & interval tumbuh pelan (×1.2).
  let intervalDays: number;
  if (grade === "hard") {
    intervalDays = prev.reps === 0 ? 1 : Math.round(prev.intervalDays * 1.2);
  } else if (reps === 1) {
    intervalDays = grade === "easy" ? 3 : 1;
  } else if (reps === 2) {
    intervalDays = grade === "easy" ? 6 : 4;
  } else {
    // Setelahnya interval tumbuh geometris dengan faktor ease (SM-2).
    intervalDays = Math.round(prev.intervalDays * ease * (grade === "easy" ? 1.3 : 1));
  }
  intervalDays = Math.max(1, intervalDays);

  return {
    reps,
    intervalDays,
    ease,
    dueAt: new Date(now + intervalDays * DAY_MS).toISOString(),
    lastReviewedAt: nowIso,
    reviewCount,
  };
}

/** Label kapan kartu muncul lagi (mis. "1 hari", "3 hari", "2 bln"). */
export function nextReviewLabel(intervalDays: number): string {
  if (intervalDays <= 0) return "segera";
  if (intervalDays === 1) return "1 hari";
  if (intervalDays < 30) return `${intervalDays} hari`;
  if (intervalDays < 365) return `${Math.round(intervalDays / 30)} bln`;
  return `${Math.round(intervalDays / 365)} thn`;
}

/** Petunjuk singkat di bawah tiap tombol nilai (kapan kartu kembali). */
export function gradePreviewLabel(prev: SrsState, grade: SrsGrade): string {
  if (grade === "again") return "<1 mnt";
  return nextReviewLabel(gradeCard(prev, grade).intervalDays);
}
