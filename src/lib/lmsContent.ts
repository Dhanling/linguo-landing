// [lms-content-readiness-v1] Sumber tunggal "sesi ini sudah ada isinya atau belum".
//
// Katalog Belajar Mandiri di-seed lengkap (judul modul & 16 sesi per modul) jauh
// sebelum materinya ditulis. Per 28 Juli 2026 cuma 16 dari 304 sesi yang benar-benar
// punya blok materi. Tanpa penyaring ini:
//   * progres siswa dibagi TOTAL sesi termasuk yang kosong → selamanya nyangkut di ~5%;
//   * tombol "Lanjut" mengarah ke sesi kosong → pemutar terbuka tanpa isi.
//
// Hitungannya diambil dari view `lms_lesson_stats` (agregat, tanpa isi materi).
// Sengaja BUKAN dihitung dari `lms_blocks` langsung: tabel itu dilindungi RLS
// entitlement, jadi siswa yang belum beli selalu dapat 0 dan semua sesi bakal
// terlihat kosong.

import { supabase } from "@/lib/supabase-client";

export type LessonStat = {
  lesson_id: string;
  module_id: string;
  block_count: number;
  quiz_count: number;
  audio_count: number;
  materi_count: number;
  has_content: boolean;
};

// Cache satu kali per tab: isi katalog jarang berubah dalam satu sesi browsing,
// dan hook ini dipanggil dari 4 tempat (beranda, katalog, perpustakaan, silabus).
let _cache: Promise<Map<string, LessonStat> | null> | null = null;

/**
 * Peta lesson_id → statistik konten. `null` = view belum ada / query gagal;
 * pemanggil WAJIB memperlakukan null sebagai "jangan saring apa-apa" supaya
 * dashboard tetap jalan seperti sebelumnya, bukan malah kosong semua.
 */
export function fetchLessonStats(): Promise<Map<string, LessonStat> | null> {
  if (_cache) return _cache;
  _cache = (async () => {
    try {
      // Cuma sesi yang ADA isinya yang ditarik — sekarang 16 baris, bukan 304.
      // Konsekuensinya: lesson_id yang tidak ada di peta = belum ada materinya.
      const { data, error } = await supabase
        .from("lms_lesson_stats")
        .select("lesson_id,module_id,block_count,quiz_count,audio_count,materi_count,has_content")
        .eq("has_content", true);
      if (error || !data) return null;
      const map = new Map<string, LessonStat>();
      (data as LessonStat[]).forEach((r) => map.set(r.lesson_id, r));
      return map;
    } catch {
      return null;
    }
  })();
  return _cache;
}

/** Buang cache (dipakai kalau perlu refresh setelah materi baru ditulis). */
export function resetLessonStats() {
  _cache = null;
}

/**
 * Saring daftar sesi ke yang sudah ada isinya. Kalau statistik tidak tersedia
 * (view belum dipasang / query gagal) daftarnya dikembalikan apa adanya —
 * fail-open, biar dashboard tetap sama seperti sebelum fitur ini ada.
 *
 * Hasil KOSONG itu jawaban yang sah: artinya materi bahasa/modul itu memang
 * belum ditulis, dan pemanggil harus bilang "sedang disiapkan" — bukan
 * menyodorkan sesi kosong yang cuma bikin siswa bingung.
 */
export function keepReady<T extends { id: string }>(
  lessons: T[],
  stats: Map<string, LessonStat> | null
): T[] {
  if (!stats) return lessons;
  return lessons.filter((l) => stats.get(l.id)?.has_content);
}
