// [sesi-batch-progres-v1] Progres sesi kelas grup (Reguler / English Test Prep) di /akun.
//
// Laporan 41d08167 (14 Nov 2026): siswa batch FRA-A11-OCT26 (Kak Yez) sudah 4 pertemuan,
// tapi "Kelas & Materi" menulis "13% · 1/8 sesi · Belum terjadwal". Penyebabnya:
//   • kartu & hero membaca `registrations.sessions_used` mentah. Trigger
//     `trg_sync_sessions_used_from_schedule` hanya menaikkan angka itu kalau
//     registrasinya punya `sessions_total` — padahal 6 dari 8 registrasi batch itu
//     `sessions_total` NULL (jatahnya tercatat di `regular_batches.total_sessions`),
//     jadi presensi 4 pertemuan dari pengajar tak pernah sampai ke angka siswa.
//   • kelas grup tak punya baris `schedules` mendatang — "Sesi Berikutnya" dan sesi
//     5–8 selalu "Belum terjadwal" walau pola batch-nya jelas (Minggu 10.30).
//
// Modul ini memberi /akun angka yang tak bergantung pada data per-registrasi:
//   sesi selesai = terbesar dari (sessions_used, baris schedules completed,
//                  pertemuan batch yang sudah lewat sejak siswa bergabung),
// dibatasi jatah paket; plus deret tanggal pertemuan batch (sudah memperhitungkan
// libur/pindah di `batch_schedule_overrides`) untuk sesi yang belum terjadwal.

import { batchOccurrencesWithOverrides, type BatchScheduleOverride } from "./batchCalendar";

type Sumber = {
  kind: "reguler" | "etp";
  id: string;
  durasi: number;
  pola: Parameters<typeof batchOccurrencesWithOverrides>[0];
};

function sumberBatch(reg: any): Sumber | null {
  const b = reg?.batch, tp = reg?.testPrepBatch;
  if (b?.id) {
    if (String(b.status || "") === "Cancelled") return null;
    return {
      kind: "reguler",
      id: String(b.id),
      durasi: Number(b.session_duration_min) || 90,
      pola: { days: b.session_day, time: b.session_start_time, startDate: b.start_date, endDate: b.end_date, totalSessions: b.total_sessions },
    };
  }
  if (tp?.id) {
    if (tp.cancelled_at) return null;
    return {
      kind: "etp",
      id: String(tp.id),
      durasi: Number(tp.duration_minutes) || 90,
      pola: { days: tp.schedule_days, time: tp.schedule_time, startDate: tp.start_date, endDate: tp.end_date, totalSessions: tp.sessions_total },
    };
  }
  return null;
}

/** Deret tanggal-jam pertemuan batch milik registrasi ini ([] kalau bukan kelas grup). */
export function tanggalBatchReg(reg: any, overrides: BatchScheduleOverride[] | null | undefined): Date[] {
  const src = sumberBatch(reg);
  if (!src) return [];
  try {
    return batchOccurrencesWithOverrides(
      src.pola,
      (overrides || []).filter((o) => o?.batch_kind === src.kind && String(o?.batch_id || "") === src.id),
    );
  } catch {
    return [];
  }
}

/** Awal keanggotaan siswa di batch (hari terdaftar/bayar paling awal) — pertemuan
 *  sebelum siswa bergabung (masuk batch berjalan) tidak ikut dihitung miliknya. */
function awalGabung(reg: any): number | null {
  const ts = [reg?.registration_date, reg?.payment_date, reg?.created_at]
    .map((v) => (v ? new Date(String(v).slice(0, 10) + "T00:00:00").getTime() : NaN))
    .filter((n) => Number.isFinite(n));
  return ts.length ? Math.min(...ts) : null;
}

/**
 * Registrasi dengan `sessions_used` efektif untuk kelas grup + `__tanggalBatch`
 * (ISO, deret pertemuan batch). Registrasi non-batch dikembalikan apa adanya.
 * `jadwalReg` = baris `schedules` registrasi ini (termasuk presensi sintetis —
 * itu tetap sesi yang benar-benar terpakai).
 */
export function denganSesiBatch<T extends object>(
  regAsli: T,
  jadwalReg: { status?: string | null }[],
  overrides: BatchScheduleOverride[] | null | undefined,
  now: number = Date.now(),
): T {
  const reg = regAsli as any;
  const src = sumberBatch(reg);
  if (!src) return regAsli;
  const tanggal = tanggalBatchReg(reg, overrides);
  const mulai = awalGabung(reg);
  const lewat = tanggal.filter(
    (d) => d.getTime() + src.durasi * 60000 <= now && (mulai === null || d.getTime() >= mulai),
  ).length;
  const selesaiJadwal = (jadwalReg || []).filter((s) => s?.status === "completed").length;
  const total = Number(reg.sessions_total) || 0;
  const n = Math.max(Number(reg.sessions_used) || 0, selesaiJadwal, lewat);
  const used = total > 0 ? Math.min(total, n) : n;
  return {
    ...reg,
    sessions_used: used,
    __sessionsUsedDb: reg.sessions_used ?? null,
    __tanggalBatch: tanggal.map((d) => d.toISOString()),
  } as T;
}
