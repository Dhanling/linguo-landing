// [slide-batch-v1] Silabus + dek slide untuk SATU registrasi, termasuk kelas grup.
//
// loadSilabusLevel(reg.language, reg.level) cukup untuk Private, tapi kelas batch
// datanya tidak rapi (9 Nov 2026, Dara TOEFL-SEP26 tanya "semua materi diberikan?"):
//   • Test Prep: language "TOEFL prep" / "English" / "IELTS prep", level "" / "TOEFL"
//     → tak satu pun terpetakan ke dek toefl-itp / ielts → tab Materi tanpa slide.
//   • Reguler: kadang level "TBD" / "A1" padahal batch-nya A1.1.
//   • Sesi terpakai batch (sessions_used) sering 0–1 walau batch sudah jalan
//     berminggu-minggu → slide yang ada pun tetap terkunci.
// Modul ini menutup ketiganya: bahasa & sublevel diambil dari batch kalau perlu,
// dan jumlah pertemuan yang sudah lewat dihitung dari pola kalender batch.

import { supabase } from "@/lib/supabase-client";
import { loadSilabusLevel, type SilabusLevel } from "./silabusSesi";
import { languageSlug } from "./languageSlug";
import { batchOccurrences } from "./batchCalendar";

export interface SilabusKelas {
  /** slug dek/silabus, mis. "toefl-itp", "german" */
  slug: string;
  silabus: SilabusLevel;
  /** pertemuan batch yang sudah lewat menurut kalender (0 kalau bukan batch) */
  sesiBatch: number;
}

const KODE = /^[ABC][12](\.\d)?$/i;
/** Test prep tanpa sublevel tercatat → mulai dari sublevel pertama silabusnya. */
const SUBLEVEL_AWAL_TESTPREP = "B1.1";

function jenisTes(...vals: unknown[]): "toefl" | "ielts" | null {
  const s = vals.map((v) => String(v ?? "")).join(" ").toLowerCase();
  if (/toefl/.test(s)) return "toefl";
  if (/ielts/.test(s)) return "ielts";
  return null;
}

async function ambilBatch(tabel: "regular_batches" | "test_prep_batches", id: string, kolom: string) {
  try {
    const { data } = await supabase.from(tabel).select(kolom).eq("id", id).maybeSingle();
    return (data as any) || null;
  } catch {
    return null;
  }
}

function sesiLewat(b: any, etp: boolean): number {
  if (!b) return 0;
  try {
    const now = Date.now();
    return batchOccurrences(
      etp
        ? { days: b.schedule_days, time: b.schedule_time, startDate: b.start_date, endDate: b.end_date, totalSessions: b.sessions_total }
        : { days: b.session_day, time: b.session_start_time, startDate: b.start_date, endDate: b.end_date, totalSessions: b.total_sessions },
    ).filter((d) => d.getTime() <= now).length;
  } catch {
    return 0;
  }
}

const KOLOM_TP = "id, name, test_type, level, schedule_days, schedule_time, start_date, end_date, sessions_total";
const KOLOM_REG = "id, language, level, session_day, session_start_time, start_date, end_date, total_sessions";

export async function loadSilabusKelas(reg: any): Promise<SilabusKelas | null> {
  if (!reg) return null;

  // ── Test Prep (batch ETP atau registrasi berlabel TOEFL/IELTS) ──
  const tpId = reg.test_prep_batch_id || reg.testPrepBatch?.id || null;
  const tp = reg.testPrepBatch || (tpId ? await ambilBatch("test_prep_batches", tpId, KOLOM_TP) : null);
  const tes = jenisTes(tp?.test_type, tp?.name, reg.language, reg.level);
  if (tes) {
    const level = [reg.level, tp?.level].map((v) => String(v ?? "").trim()).find((v) => KODE.test(v)) || SUBLEVEL_AWAL_TESTPREP;
    const silabus = await loadSilabusLevel(tes, level).catch(() => null);
    if (silabus) return { slug: languageSlug(tes)!, silabus, sesiBatch: sesiLewat(tp, true) };
  }

  // ── Reguler (batch) ──
  const bId = reg.batch_id || reg.batch?.id || null;
  if (bId) {
    const b = reg.batch || (await ambilBatch("regular_batches", bId, KOLOM_REG));
    const slug = languageSlug(reg.language) || languageSlug(b?.language);
    const level = KODE.test(String(reg.level || "").trim()) ? reg.level : b?.level || reg.level;
    if (slug) {
      const silabus = await loadSilabusLevel(slug, level).catch(() => null);
      if (silabus) return { slug, silabus, sesiBatch: sesiLewat(b, false) };
    }
  }

  // ── Private / lainnya ──
  const slug = languageSlug(reg.language);
  if (!slug) return null;
  const silabus = await loadSilabusLevel(reg.language, reg.level).catch(() => null);
  return silabus ? { slug, silabus, sesiBatch: 0 } : null;
}

/** Registrasi ini boleh membuka dek `slug`? (gerbang link slide yang dibagikan) */
export function regCocokDek(r: any, slug: string): boolean {
  if (languageSlug(r?.language) === slug) return true;
  if (slug === "toefl-itp" || slug === "ielts") {
    // product "English Test Preparation (IELTS/TOEFL)" menyebut keduanya — jangan dipakai.
    const tes = jenisTes(r?.language, r?.level);
    if (tes) return (tes === "toefl" ? "toefl-itp" : "ielts") === slug;
    // Batch ETP tercatat "English" tanpa label tes → izinkan kedua dek tes.
    return !!r?.test_prep_batch_id || /test ?prep/i.test(String(r?.product || ""));
  }
  return false;
}
