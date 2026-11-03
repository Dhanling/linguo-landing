// [rekaman-batch-siswa-v1] 3 Nov 2026 — Bug Tracker 98325725 (Raihani/HennyHani,
// GER-A11-OCT26 Kak Laily): "rekaman pertemuan 2 belum ada". Kelas batch Reguler/ETP
// direkam di ruang per PERTEMUAN `batch-<reguler|etp>-<batchId>-<no>` — ruang itu
// milik seluruh batch, bukan satu baris `schedules`. Siswa batch umumnya tak punya
// baris jadwal per pertemuan (paling banter baris penambal presensi yang disembunyikan
// [jadwal-hantu-hidden-v1]), jadi rekamannya tak pernah tampil di /akun dan
// /api/class-recording menolak karena "belum ditempel ke sesi kelasmu".
// Aturannya kini: anggota batch (registrasi dengan batch_id / test_prep_batch_id itu, bukan Batal/Transferred)
// sah melihat rekaman pertemuan batch-nya. Gerbang add-on Recording tetap berlaku.
import type { SupabaseClient } from "@supabase/supabase-js";

export const BATCH_ROOM_RE = /^batch-(reguler|etp)-([0-9a-f-]{36})-(\d{1,3})$/i;

export type BatchRoom = { kind: "reguler" | "etp"; batchId: string; meetingNo: number };

export function parseBatchRoom(roomId: string): BatchRoom | null {
  const m = BATCH_ROOM_RE.exec(roomId);
  return m ? { kind: m[1].toLowerCase() as BatchRoom["kind"], batchId: m[2], meetingNo: Number(m[3]) } : null;
}

/** Registrasi milik `studentIds` yang ikut batch ruang ini (tidak dibatalkan). */
export async function registrasiAnggotaBatch(
  admin: SupabaseClient,
  room: BatchRoom,
  studentIds: string[],
): Promise<{ id: string; student_id: string }[]> {
  if (!studentIds.length) return [];
  const kolom = room.kind === "reguler" ? "batch_id" : "test_prep_batch_id";
  const { data } = await admin
    .from("registrations")
    .select("id, student_id, status")
    .eq(kolom, room.batchId)
    .in("student_id", studentIds);
  return ((data || []) as { id: string; student_id: string; status?: string | null }[])
    .filter((r) => !/^(batal|transferred|cancel)/i.test(String(r.status || "")));
}
