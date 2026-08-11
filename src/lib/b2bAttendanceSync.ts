// [linguo-patch:b2b-report-presensi-sync-v1]
// Tarik rekap presensi kelas B2B dari dashboard (tabel corporate_attendance) buat
// mengisi otomatis langkah "Presensi" di form Laporan Progress. Pengajar sudah
// mengeklik hadir/izin tiap sesi di dashboard — mengetiknya lagi di form itu kerja
// dobel sekaligus sumber selisih angka dengan rekap admin.
//
// Tabel corporate_* TIDAK dibuka ke anon; yang dipanggil RPC agregat
// `b2b_report_attendance(p_lead_id)` (SECURITY DEFINER, lihat migrasi
// 20260811150000_b2b_report_attendance_rpc.sql di repo admin dashboard).

import { supabase } from "@/lib/supabase-client";
import type { ParticipantRow } from "@/lib/b2bReport";

export type AttendanceSyncPerson = {
  name: string;
  sessions_recorded: number;
  hadir: number;
  izin: number;
  alfa: number;
};

export type AttendanceSync = {
  lead_id: string;
  /** Jumlah sesi yang PUNYA baris presensi (sesi hangus tidak dihitung). */
  sessions_recorded: number;
  /** Angka "sesi berjalan" yang dipatok pengajar di dashboard — bisa lebih besar
   *  dari sessions_recorded kalau ada sesi yang belum dipresensi. */
  sessions_completed: number;
  total_sessions: number;
  participants: AttendanceSyncPerson[];
};

export async function fetchAttendanceSync(leadId: string | null): Promise<AttendanceSync | null> {
  if (!leadId) return null;
  const { data, error } = await supabase.rpc("b2b_report_attendance", { p_lead_id: leadId });
  if (error || !data) return null;
  const d = data as AttendanceSync;
  return {
    lead_id: d.lead_id,
    sessions_recorded: Number(d.sessions_recorded || 0),
    sessions_completed: Number(d.sessions_completed || 0),
    total_sessions: Number(d.total_sessions || 0),
    participants: Array.isArray(d.participants) ? d.participants : [],
  };
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** Satu lead bisa memuat beberapa sub-kelas (GroundProbe kelas 1 & 2 berbagi lead),
 *  jadi hasil RPC di-key nama dan tiap form menyaring rosternya sendiri. */
export function matchPerson(sync: AttendanceSync | null, name: string): AttendanceSyncPerson | null {
  if (!sync) return null;
  return sync.participants.find((p) => norm(p.name) === norm(name)) || null;
}

/** Terapkan rekap ke baris peserta. `force` = pengajar menekan "Tarik ulang" —
 *  angka presensi ditimpa. Tanpa force, isian yang sudah ada dibiarkan. */
export function applyAttendanceSync(
  rows: ParticipantRow[],
  sync: AttendanceSync,
  force: boolean
): { rows: ParticipantRow[]; matched: number } {
  let matched = 0;
  const next = rows.map((r) => {
    const p = matchPerson(sync, r.name);
    if (!p) return r;
    matched += 1;
    if (!force && r.attended != null) return r; // sudah diisi manual/draft — jangan diganggu
    return {
      ...r,
      sessions_total: p.sessions_recorded || r.sessions_total,
      attended: p.hadir,
      excused_work: p.izin,
      // Dashboard cuma punya hadir/izin/alfa — "sakit" tetap milik pengajar.
      sick: r.sick ?? 0,
    };
  });
  return { rows: next, matched };
}
