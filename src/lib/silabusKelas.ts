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
import { loadSilabusLevel, loadSilabusRangkaian, type SilabusLevel } from "./silabusSesi";
import { languageSlug } from "./languageSlug";
import { batchOccurrences } from "./batchCalendar";

export interface SilabusKelas {
  /** slug dek/silabus, mis. "toefl-itp", "german" */
  slug: string;
  silabus: SilabusLevel;
  /** pertemuan batch yang sudah lewat menurut kalender (0 kalau bukan batch) */
  sesiBatch: number;
  /** [silabus-lanjut-paket-v1] sesi paket ke-i (0-based) → sublevel & nomor sesi silabus aslinya.
   *  Hanya ada kalau paket ini melanjutkan paket lama; tanpa ini sesi paket = sesi silabus. */
  posisi?: { code: string; n: number }[];
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
  if (!silabus) return null;
  const lanjut = await silabusLanjutan(reg, slug, silabus).catch(() => null);
  return lanjut ? { slug, ...lanjut, sesiBatch: 0 } : { slug, silabus, sesiBatch: 0 };
}

/**
 * [silabus-lanjut-paket-v1] Paket baru yang MELANJUTKAN paket lama di sublevel yang sama.
 * 14 Nov 2026 — Devi (Swedish): A1.1 4 sesi selesai, lalu beli paket "A1" 8 sesi. "A1"
 * terpetakan ke A1.1 dan nomor sesi paket mulai dari 1 lagi → slide sesi 1 paket baru
 * = "Alphabet & Pronunciation" (materi sesi 1 yang sudah dia pelajari). Sesi yang sudah
 * dipakai registrasi Private bahasa & sublevel yang sama SEBELUM paket ini jadi titik
 * awal: sesi paket 1 = A1.1 sesi 5, dst., menyeberang ke sublevel berikutnya bila lewat.
 */
async function silabusLanjutan(
  reg: any,
  slug: string,
  dasar: SilabusLevel,
): Promise<{ silabus: SilabusLevel; posisi: { code: string; n: number }[] } | null> {
  if (!reg?.id) return null;
  let studentId = reg.student_id || null;
  let dibuat = reg.created_at || null;
  if (!studentId || !dibuat) {
    const { data } = await supabase.from("registrations").select("student_id, created_at").eq("id", reg.id).maybeSingle();
    studentId = studentId || (data as any)?.student_id || null;
    dibuat = dibuat || (data as any)?.created_at || null;
  }
  if (!studentId || !dibuat) return null;
  const { data: regs } = await supabase
    .from("registrations")
    .select("id, language, level, sessions_used, created_at, batch_id, test_prep_batch_id, is_trial, archived_at")
    .eq("student_id", studentId)
    .lt("created_at", dibuat);
  let awal = 0;
  for (const r of ((regs as any[]) || [])) {
    // [unlock-kumulatif-v1] Trial & registrasi yang diarsip tidak memajukan posisi silabus.
    if (r.id === reg.id || r.batch_id || r.test_prep_batch_id || r.is_trial || r.archived_at) continue;
    if (languageSlug(r.language) !== slug) continue;
    const s = await loadSilabusLevel(r.language, r.level).catch(() => null);
    if (s?.code === dasar.code) awal += Math.max(0, Number(r.sessions_used) || 0);
  }
  if (awal <= 0) return null;

  const rangkaian = await loadSilabusRangkaian(reg.language, dasar.code);
  const datar = rangkaian.flatMap((sub) => sub.sessions.map((sesi, i) => ({ sub, sesi, n: i + 1 })));
  const jumlah = Math.max(Number(reg.sessions_total) || 0, dasar.sessions.length);
  const potong = datar.slice(awal, awal + jumlah);
  if (!potong.length) return null;
  return {
    silabus: { code: potong[0].sub.code, name: potong[0].sub.name, sessions: potong.map((p) => p.sesi) },
    posisi: potong.map((p) => ({ code: p.sub.code, n: p.n })),
  };
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
