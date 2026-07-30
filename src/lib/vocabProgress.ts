// [beranda-kosakata-v1] Ringkasan penguasaan kosakata siswa untuk kartu di Beranda.
//
// Sampai sekarang jumlah kata yang dikuasai siswa TIDAK pernah muncul di mana pun:
// kata tersimpan Watch & Learn cuma kelihatan di dalam deck flashcard, dan kosakata
// dari materi Belajar Mandiri sama sekali tak pernah dihitung. Modul ini menyatukan
// dua sumber itu jadi satu angka yang bisa dipajang + targetnya.
//
// Dua sumber, dua sifat:
//   1. "materi" — kata di blok Kosakata (lms_blocks.type = 'vocab') dari sesi yang
//      status lms_progress-nya `completed`. Dianggap DIKUASAI kalau kuis sesi itu
//      pernah dijawab benar (lms_quiz_attempts.is_correct); sesi tanpa kuis dihitung
//      dikuasai begitu sesinya diselesaikan. Data server → ikut siswanya ke mana pun.
//   2. "simpanan" — kata yang di-tap & disimpan di Watch & Learn. Ini hidup di
//      localStorage per perangkat (lihat catatan di immersionLearn.ts), jadi
//      angkanya mengikuti browser, BUKAN akun. Statusnya pakai jadwal SRS: interval
//      >= 21 hari (cardStage 'mastered') = dikuasai.
//
// Materi LMS masih ditulis (per Juli 2026 baru segelintir sesi berisi), jadi sumber
// (1) wajar bernilai 0 untuk hampir semua siswa — itu bukan error, dan kartunya
// harus tetap masuk akal dibaca.

import { supabase } from "@/lib/supabase-client";
import { cardStage } from "@/lib/srs";
import type { SavedWord } from "@/lib/immersionLearn";

export type VocabSource = "materi" | "simpanan";

export interface VocabItem {
  word: string;
  meaning: string;
  source: VocabSource;
  /** waktu kata masuk (ms) — dipakai buat mengurutkan chip "terbaru dikuasai" */
  ts: number;
}

export interface VocabSummary {
  mastered: VocabItem[];
  learning: VocabItem[];
  total: number;
  target: number;
  targetLevel: string;
  fromMateri: number;
  fromSimpanan: number;
}

/**
 * Target kosakata per level CEFR — ini target BAHAN AJAR Linguo (kata yang dipakai
 * aktif di kelas & materi sampai lulus level), bukan angka riset kosakata pasif
 * yang jauh lebih besar. Sengaja dibuat bisa dikejar supaya bar progresnya bergerak.
 */
export const LEVEL_VOCAB_TARGET: Record<string, number> = {
  A1: 300,
  A2: 600,
  B1: 1200,
  B2: 2400,
  C1: 4000,
  C2: 8000,
};

const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** "A2.1" / "a2" / "A2 Elementary" → "A2"; yang tak dikenal → null. */
export function normalizeLevel(level: string | null | undefined): string | null {
  const m = (level || "").trim().toUpperCase().match(/^([ABC][12])/);
  return m && LEVEL_VOCAB_TARGET[m[1]] ? m[1] : null;
}

/**
 * Target diambil dari level TERTINGGI yang sedang dijalani siswa — siswa yang
 * belajar A1 dan B1 sekaligus tak masuk akal dikasih target A1. Tanpa level yang
 * kebaca (mis. registrasi masih "TBD") jatuh ke A1.
 */
export function vocabTargetFor(levels: (string | null | undefined)[]): { level: string; target: number } {
  let best = -1;
  levels.forEach((l) => {
    const n = normalizeLevel(l);
    if (!n) return;
    best = Math.max(best, LEVEL_ORDER.indexOf(n));
  });
  const level = LEVEL_ORDER[best] || "A1";
  return { level, target: LEVEL_VOCAB_TARGET[level] };
}

interface VocabBlockRow {
  id: string;
  type: string;
  content: { items?: { vi?: string; id?: string }[] } | null;
  lesson_id: string;
  lms_quiz_questions?: { id: string }[] | null;
}

/** Batas sesi yang ikut dihitung — pagar buat query `in.(...)`, bukan aturan produk. */
const MAX_LESSONS = 300;

/**
 * Kosakata dari materi Belajar Mandiri yang sudah diselesaikan siswa.
 * Selalu best-effort: kegagalan apa pun (RLS, tabel belum ada, jaringan) balik
 * jadi daftar kosong supaya kartunya tetap tampil dengan sumber yang lain.
 */
export async function fetchMateriVocab(
  userId: string
): Promise<{ mastered: VocabItem[]; learning: VocabItem[] }> {
  const empty = { mastered: [] as VocabItem[], learning: [] as VocabItem[] };
  if (!userId) return empty;
  try {
    const { data: prog } = await supabase
      .from("lms_progress")
      .select("lesson_id,completed_at")
      .eq("user_id", userId)
      .eq("status", "completed");
    const rows = ((prog as { lesson_id: string; completed_at: string | null }[] | null) || []).filter(
      (r) => r.lesson_id
    );
    if (!rows.length) return empty;
    const doneAt = new Map<string, number>();
    rows.forEach((r) => doneAt.set(r.lesson_id, r.completed_at ? new Date(r.completed_at).getTime() : 0));
    const lessonIds = Array.from(doneAt.keys()).slice(0, MAX_LESSONS);

    const [blkRes, attRes] = await Promise.all([
      supabase
        .from("lms_blocks")
        .select("id,type,content,lesson_id, lms_quiz_questions(id)")
        .in("lesson_id", lessonIds),
      supabase.from("lms_quiz_attempts").select("question_id").eq("user_id", userId).eq("is_correct", true),
    ]);

    const blocks = ((blkRes.data as VocabBlockRow[] | null) || []).filter((b) => b?.lesson_id);
    if (!blocks.length) return empty;
    const correct = new Set(
      ((attRes.data as { question_id: string }[] | null) || []).map((a) => a.question_id)
    );

    // Sesi dianggap LULUS kalau tak punya soal sama sekali, atau minimal satu
    // soalnya pernah dijawab benar. Sengaja tidak menuntut semua soal benar:
    // pemutar membolehkan ganti jawaban, jadi "semua benar" bukan sinyal yang jujur.
    const questionsByLesson = new Map<string, string[]>();
    blocks.forEach((b) => {
      const qs = (b.lms_quiz_questions || []).map((q) => q.id);
      if (!qs.length) return;
      questionsByLesson.set(b.lesson_id, (questionsByLesson.get(b.lesson_id) || []).concat(qs));
    });
    const passed = (lessonId: string): boolean => {
      const qs = questionsByLesson.get(lessonId);
      if (!qs || !qs.length) return true;
      return qs.some((q) => correct.has(q));
    };

    const mastered: VocabItem[] = [];
    const learning: VocabItem[] = [];
    blocks.forEach((b) => {
      if (b.type !== "vocab") return;
      const items = b.content?.items || [];
      const ok = passed(b.lesson_id);
      items.forEach((it) => {
        const word = (it?.vi || "").trim();
        if (!word) return;
        (ok ? mastered : learning).push({
          word,
          meaning: (it?.id || "").trim(),
          source: "materi",
          ts: doneAt.get(b.lesson_id) || 0,
        });
      });
    });
    return { mastered, learning };
  } catch {
    return empty;
  }
}

/** Buang kata kembar (beda sumber / beda kapitalisasi); status "dikuasai" menang. */
function dedupe(mastered: VocabItem[], learning: VocabItem[]): { mastered: VocabItem[]; learning: VocabItem[] } {
  const seen = new Set<string>();
  const take = (list: VocabItem[]): VocabItem[] => {
    const out: VocabItem[] = [];
    list.forEach((it) => {
      const k = it.word.toLowerCase();
      if (seen.has(k)) return;
      seen.add(k);
      out.push(it);
    });
    return out;
  };
  const m = take([...mastered].sort((a, b) => b.ts - a.ts));
  const l = take([...learning].sort((a, b) => b.ts - a.ts));
  return { mastered: m, learning: l };
}

/** Gabung kata simpanan (localStorage) + kata materi jadi satu ringkasan siap pajang. */
export function buildVocabSummary(
  saved: SavedWord[],
  materi: { mastered: VocabItem[]; learning: VocabItem[] },
  levels: (string | null | undefined)[]
): VocabSummary {
  const savedMastered: VocabItem[] = [];
  const savedLearning: VocabItem[] = [];
  saved.forEach((w) => {
    const word = (w.word || "").trim();
    if (!word) return;
    const item: VocabItem = {
      word,
      meaning: (w.meaning || "").trim(),
      source: "simpanan",
      ts: w.ts || 0,
    };
    (cardStage(w.srs) === "mastered" ? savedMastered : savedLearning).push(item);
  });

  const { mastered, learning } = dedupe(
    [...materi.mastered, ...savedMastered],
    [...materi.learning, ...savedLearning]
  );
  const { level, target } = vocabTargetFor(levels);
  return {
    mastered,
    learning,
    total: mastered.length + learning.length,
    target,
    targetLevel: level,
    fromMateri: materi.mastered.length + materi.learning.length,
    fromSimpanan: savedMastered.length + savedLearning.length,
  };
}
