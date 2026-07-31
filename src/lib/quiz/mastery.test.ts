// [sr-kuis-spaced-repetition-v1] Unit test aturan SM-2 kuis harian.
// Jalankan: npm test
//
// Yang diuji di sini adalah KEBIJAKANNYA, bukan sekadar aritmetika: konsep yang
// salah harus balik besok, konsep yang benar berkali-kali harus makin jarang, dan
// jawaban salah tidak boleh menghapus seluruh progres.

import { describe, it, expect } from "vitest";
import {
  nextMastery,
  newMasteryState,
  INTERVAL_LADDER,
  MIN_EASE,
  MAX_EASE,
  MAX_MASTERY,
  type MasteryState,
} from "./mastery";

const NOW = new Date("2026-08-01T03:00:00.000Z");
const DAY_MS = 86_400_000;

/** Selisih hari (desimal) antara nextReviewAt dan `NOW`. */
const daysUntil = (iso: string) => (new Date(iso).getTime() - NOW.getTime()) / DAY_MS;

describe("nextMastery — jawaban benar", () => {
  it("menaikkan level, streak, dan ease dari state baru", () => {
    const { state, nextReviewAt, lastReviewedAt } = nextMastery(newMasteryState(), true, NOW);
    expect(state.masteryLevel).toBe(1);
    expect(state.streak).toBe(1);
    expect(state.lapses).toBe(0);
    expect(state.easeFactor).toBeCloseTo(2.6, 10);
    expect(state.intervalDays).toBe(INTERVAL_LADDER[0]); // 1 hari
    expect(state.totalAttempts).toBe(1);
    expect(state.totalCorrect).toBe(1);
    // 1 hari × ease 2.6
    expect(daysUntil(nextReviewAt)).toBeCloseTo(2.6, 6);
    expect(lastReviewedAt).toBe(NOW.toISOString());
  });

  it("interval makin panjang tiap kali benar berturut-turut", () => {
    let state = newMasteryState();
    const gaps: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = nextMastery(state, true, NOW);
      state = res.state;
      gaps.push(daysUntil(res.nextReviewAt));
    }
    // Naik monoton: 2.6 → 8.1 → 19.6 → 40.6 → 90 → 180 hari.
    for (let i = 1; i < gaps.length; i++) expect(gaps[i]).toBeGreaterThan(gaps[i - 1]);
    expect(gaps[0]).toBeCloseTo(2.6, 6);
    expect(gaps[5]).toBeCloseTo(180, 6);
  });

  it("level mentok di 5 dan ease mentok di 3.0 walau terus benar", () => {
    let state = newMasteryState();
    for (let i = 0; i < 20; i++) state = nextMastery(state, true, NOW).state;
    expect(state.masteryLevel).toBe(MAX_MASTERY);
    expect(state.easeFactor).toBe(MAX_EASE);
    expect(state.streak).toBe(20);
    expect(state.intervalDays).toBe(INTERVAL_LADDER[INTERVAL_LADDER.length - 1]);
  });
});

describe("nextMastery — jawaban salah", () => {
  const solid: MasteryState = {
    masteryLevel: 4,
    easeFactor: 2.9,
    intervalDays: 30,
    streak: 6,
    lapses: 0,
    totalAttempts: 6,
    totalCorrect: 6,
  };

  it("konsepnya balik besok dan streak-nya putus", () => {
    const { state, nextReviewAt } = nextMastery(solid, false, NOW);
    expect(state.streak).toBe(0);
    expect(state.lapses).toBe(1);
    expect(state.intervalDays).toBe(1);
    expect(daysUntil(nextReviewAt)).toBeCloseTo(1, 6);
  });

  it("turun dua tingkat, BUKAN reset ke nol", () => {
    const { state } = nextMastery(solid, false, NOW);
    expect(state.masteryLevel).toBe(2);
  });

  it("tidak pernah turun di bawah nol", () => {
    const fresh = nextMastery(newMasteryState(), false, NOW).state;
    expect(fresh.masteryLevel).toBe(0);
    const again = nextMastery(fresh, false, NOW).state;
    expect(again.masteryLevel).toBe(0);
    expect(again.lapses).toBe(2);
  });

  it("ease turun 0.2 tapi berhenti di 1.3", () => {
    let state = newMasteryState();
    for (let i = 0; i < 20; i++) state = nextMastery(state, false, NOW).state;
    expect(state.easeFactor).toBe(MIN_EASE);
  });
});

describe("nextMastery — akumulasi statistik", () => {
  it("total_attempts menghitung semua, total_correct cuma yang benar", () => {
    let state = newMasteryState();
    for (const ok of [true, false, true, true, false]) {
      state = nextMastery(state, ok, NOW).state;
    }
    expect(state.totalAttempts).toBe(5);
    expect(state.totalCorrect).toBe(3);
    expect(state.lapses).toBe(2);
  });

  it("tidak memutasi state yang dioper (murni)", () => {
    const before = newMasteryState();
    const snapshot = { ...before };
    nextMastery(before, true, NOW);
    expect(before).toEqual(snapshot);
  });
});
