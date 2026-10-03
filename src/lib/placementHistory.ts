// =============================================================================
// src/lib/placementHistory.ts
// [cek-level-berkala-v1]
//
// Riwayat Placement Test milik siswa, dipakai kartu "Cek Level" di Beranda /akun
// dan tab Progress detail kelas. Barisnya dibaca lewat RPC my_placement_history
// (sql/20261003-cek-level-berkala.sql): RLS placement_results cuma mengizinkan
// staf, dan hasil lama sering tercatat tanpa student_id (tes sebelum mendaftar)
// — RPC itu mencocokkannya juga lewat email / nomor WA siswa.
// =============================================================================

import { supabase } from "@/lib/supabase-client";
import { languages } from "@/data/curriculum/languages";

export type PlacementRow = {
  id: string;
  language: string;
  slug: string | null;
  level: string;
  score: number | null;
  maxScore: number | null;
  createdAt: string;
};

/** Jeda yang dianjurkan antar tes — sama dengan aturan "tiap 4 minggu". */
export const JEDA_CEK_LEVEL_HARI = 28;

// Bahasa yang PUNYA placement test CEFR — kunci CEFR_QUESTIONS di
// src/app/silabus/[lang]/coba/cefrQuestions.ts. Disalin (bukan diimpor) karena
// berkas itu membawa seluruh bank soal ke bundel /akun. Tambah bahasa di sana →
// tambah di sini dan di placement_lang_map() (SQL).
const SLUG_BERTES = new Set([
  "english", "japanese", "korean", "mandarin", "cantonese", "vietnamese", "thai",
  "filipino", "khmer", "burmese", "hindi", "urdu", "german", "french", "spanish",
  "italian", "dutch", "greek", "portuguese-br", "portuguese-pt", "swedish",
  "norwegian", "danish", "icelandic", "irish", "bosnian", "finnish", "hungarian",
  "turkish", "romanian", "russian", "ukrainian", "bulgarian", "polish", "czech",
  "arabic", "hebrew", "persian", "kurdish", "armenian", "javanese", "sundanese",
  "betawi", "bipa", "balinese", "minangkabau", "batak", "bugis", "acehnese",
  "banjar", "madurese", "lao", "bengali", "tamil", "punjabi", "nepali",
  "mongolian", "swahili", "zulu", "yoruba", "amharic", "georgian", "latin",
  "esperanto",
]);

const ALIAS: Record<string, string> = {
  tagalog: "filipino", chinese: "mandarin", indonesian: "bipa",
  "bahasa indonesia": "bipa", ukraine: "ukrainian", portuguese: "portuguese-br",
  "portuguese - brazilian": "portuguese-br", portugis: "portuguese-br",
  laos: "lao", farsi: "persian", myanmar: "burmese", minang: "minangkabau",
};

/** Nama bahasa registrasi ("English", "Inggris", "English - British") → slug
 *  placement test. null = bahasa itu belum punya tesnya. */
export function placementSlugFor(language: string | null | undefined): string | null {
  const l = String(language || "").replace(/^[^\p{L}\p{N}]+/u, "").trim().toLowerCase();
  if (!l) return null;
  if (SLUG_BERTES.has(l)) return l;
  const byName = languages.find((x) => x.name.toLowerCase() === l);
  if (byName && SLUG_BERTES.has(byName.slug)) return byName.slug;
  if (ALIAS[l]) return ALIAS[l];
  if (l.startsWith("english ") || l.startsWith("inggris ")) return "english";
  if (l.startsWith("german ")) return "german";
  return null;
}

/** Nama Indonesia bahasa dari slug ("english" → "Inggris"). */
export function namaBahasaSlug(slug: string): string {
  return languages.find((x) => x.slug === slug)?.name || slug;
}

const BAND = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** "A2.1" → 1.1, "B1.5" → 2.5 — angka urut untuk membandingkan & menggambar grafik.
 *  Sub-level dibagi 10 supaya tetap di dalam pitanya (B2.7 < C1). */
export function levelValue(level: string | null | undefined): number | null {
  const m = String(level || "").toUpperCase().match(/([ABC][12])(?:\.(\d+))?/);
  if (!m) return null;
  const band = BAND.indexOf(m[1]);
  if (band < 0) return null;
  const sub = m[2] ? Math.min(9, Math.max(0, parseInt(m[2], 10))) : 0;
  return band + sub / 10;
}

export function bandOf(level: string | null | undefined): string | null {
  const m = String(level || "").toUpperCase().match(/[ABC][12]/);
  return m ? m[0] : null;
}

export { BAND as CEFR_BANDS };

// Hasil terakhir ditahan di memori modul (pola insightsCache di BerandaInsights):
// Beranda di-unmount tiap pindah menu, jadi tanpa ini kartunya kedip tiap balik.
const cache = new Map<string, PlacementRow[]>();
const inflight = new Map<string, Promise<PlacementRow[]>>();

export function cachedPlacementHistory(previewStudentId?: string | null): PlacementRow[] | undefined {
  return cache.get(previewStudentId || "me");
}

export function fetchPlacementHistory(previewStudentId?: string | null): Promise<PlacementRow[]> {
  const key = previewStudentId || "me";
  const jalan = inflight.get(key);
  if (jalan) return jalan;
  const p = (async () => {
    try {
      const { data, error } = await supabase.rpc(
        "my_placement_history",
        previewStudentId ? { p_student_id: previewStudentId } : {},
      );
      if (error) {
        console.warn("[cek-level] riwayat placement tidak terbaca:", error.message);
        return cache.get(key) || [];
      }
      const rows: PlacementRow[] = (data || []).map((r: any) => ({
        id: r.id,
        language: r.language,
        slug: r.language_slug || placementSlugFor(r.language),
        level: r.level,
        score: r.score ?? null,
        maxScore: r.max_score ?? null,
        createdAt: r.created_at,
      }));
      cache.set(key, rows);
      return rows;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

/** Selisih hari penuh dari `iso` sampai sekarang. */
export function hariSejak(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}
