"use client";

// [lingbook-progress] Persist progres & skor siswa per-bab dengan DUA lapisan:
//   1. localStorage — SELALU jalan (offline, tanpa login). Sumber kebenaran instan.
//   2. Supabase (tabel lingbook_progress) — sinkron lintas-perangkat bila user login
//      DAN migrasi 20260720_lingbook_progress.sql sudah dijalankan.
// Lapisan remote GRACEFUL: gagal apa pun (tanpa sesi / tabel belum ada / RLS /
// jaringan) → diam-diam diabaikan, reader tetap pakai localStorage. Aman dipakai
// sebelum migrasi dijalankan.
import { supabase } from "@/lib/supabase-client";
import type { StepId } from "./types";

export interface LingbookProgress {
  stepsDone: StepId[];
  isDone: boolean;
  score: number | null;
}

const EMPTY: LingbookProgress = { stepsDone: [], isDone: false, score: null };

function localKey(bookSlug: string, chapterSlug: string): string {
  return `lingbook-progress:${bookSlug}:${chapterSlug}`;
}

const VALID_STEPS: StepId[] = ["tujuan", "dialog", "vocab", "grammar", "latihan", "test"];
function sanitizeSteps(arr: unknown): StepId[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((s): s is StepId => VALID_STEPS.includes(s as StepId));
}

// ── Lapisan lokal ────────────────────────────────────────────────────────────
export function loadLocalProgress(bookSlug: string, chapterSlug: string): LingbookProgress {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = localStorage.getItem(localKey(bookSlug, chapterSlug));
    if (!raw) return { ...EMPTY };
    const p = JSON.parse(raw) as Partial<LingbookProgress>;
    return {
      stepsDone: sanitizeSteps(p.stepsDone),
      isDone: !!p.isDone,
      score: typeof p.score === "number" ? p.score : null,
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveLocalProgress(bookSlug: string, chapterSlug: string, p: LingbookProgress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(localKey(bookSlug, chapterSlug), JSON.stringify(p));
  } catch {
    /* kuota penuh / private mode — abaikan */
  }
}

// ── Lapisan remote (graceful) ────────────────────────────────────────────────
/** Ambil progres dari DB. Mengembalikan null bila tanpa sesi / tabel belum ada / error. */
export async function loadRemoteProgress(
  bookSlug: string,
  chapterSlug: string,
): Promise<LingbookProgress | null> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) return null;
    const { data, error } = await supabase
      .from("lingbook_progress")
      .select("steps_done,is_done,score")
      .eq("user_id", uid)
      .eq("book_slug", bookSlug)
      .eq("chapter_slug", chapterSlug)
      .maybeSingle();
    if (error || !data) return null;
    return {
      stepsDone: sanitizeSteps(data.steps_done),
      isDone: !!data.is_done,
      score: typeof data.score === "number" ? data.score : null,
    };
  } catch {
    return null;
  }
}

/** Upsert progres ke DB. No-op diam bila tanpa sesi / tabel belum ada / error. */
export async function saveRemoteProgress(
  bookSlug: string,
  chapterSlug: string,
  p: LingbookProgress,
): Promise<void> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) return;
    await supabase.from("lingbook_progress").upsert(
      {
        user_id: uid,
        book_slug: bookSlug,
        chapter_slug: chapterSlug,
        steps_done: p.stepsDone,
        is_done: p.isDone,
        score: p.score,
      },
      { onConflict: "user_id,book_slug,chapter_slug" },
    );
  } catch {
    /* tabel belum ada / offline — biarkan localStorage yang pegang */
  }
}

/** Gabung dua progres (union step, OR is_done, skor tertinggi) — untuk merge lokal↔remote. */
export function mergeProgress(a: LingbookProgress, b: LingbookProgress): LingbookProgress {
  const steps = new Set<StepId>([...a.stepsDone, ...b.stepsDone]);
  const score =
    a.score == null ? b.score : b.score == null ? a.score : Math.max(a.score, b.score);
  return { stepsDone: [...steps], isDone: a.isDone || b.isDone, score };
}
