// [rekaman-batch-siswa-v1] 3 Nov 2026 — Bug Tracker 98325725: siswa Reguler/ETP tak
// punya baris jadwal per pertemuan batch, jadi rekaman ruang `batch-…-<no>` tak pernah
// tampil ("rekaman pertemuan 2 belum ada"). Pertemuan batch yang berekaman ditarik dari
// /api/batch-recordings: ditempel ke baris jadwal siswa di jam yang sama kalau ada,
// kalau tidak jadi baris semu `completed` di linimasa. Gagal = linimasa apa adanya.
// [rekaman-batch-akun-v1] Dipakai DUA layar: /akun/kelas/[id] (ClassDetailView) dan
// panel "Kelas & Materi" di /akun (SesiTimeline) — versi pertama cuma memasang yang
// pertama, padahal siswa membuka yang kedua, jadi laporannya "masih ga keluar".
import { tanpaSesiSintetis } from '@/lib/sesiSintetis';

export type PertemuanBatch = { roomId: string; meetingNo: number; recordedAt: string; durationSec: number; title: string | null };

export const regBatch = (reg: any): boolean =>
  !!reg?.id && !!(reg.batch_id || reg.test_prep_batch_id || /reguler|test ?prep|etp|batch/i.test(String(reg.product || '')));

export async function muatRekamanBatch(reg: any, accessToken?: string | null): Promise<PertemuanBatch[]> {
  if (!regBatch(reg)) return [];
  try {
    const res = await fetch('/api/batch-recordings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(accessToken ? { registrationId: reg.id, accessToken } : { registrationId: reg.id }),
    });
    if (!res.ok) return [];
    const { meetings } = await res.json();
    return Array.isArray(meetings) ? meetings : [];
  } catch {
    return [];
  }
}

const RUANG_DI_URL = (url: string | null | undefined, room: string) =>
  new RegExp(`[?&]room=${room}(?:&|$)`).test(String(url || ''));

export function tempelRekamanBatch<T extends Record<string, any>>(reg: any, rows: T[], meetings: PertemuanBatch[]): T[] {
  if (!meetings.length) return rows;
  const out = rows.map((r) => ({ ...r })) as any[];
  const terlihat = tanpaSesiSintetis(out);
  for (const m of meetings) {
    if (out.some((r) => RUANG_DI_URL(r.recording_url, m.roomId))) continue;
    const url = `https://dashboard.linguo.id/kelas?tab=riwayat&room=${m.roomId}`;
    const t = new Date(m.recordedAt).getTime();
    const sejam = terlihat.find((r: any) => r.status !== 'cancelled' && r.scheduled_at
      && Math.abs(new Date(r.scheduled_at).getTime() - t) <= 6 * 3_600_000);
    if (sejam) {
      if (!sejam.recording_url) {
        sejam.recording_url = url;
        if (sejam.status !== 'completed') sejam.status = 'completed';
      }
      continue;
    }
    out.push({
      id: `batch-${m.roomId}`,
      registration_id: reg.id,
      status: 'completed',
      scheduled_at: m.recordedAt,
      duration_minutes: Math.round((Number(m.durationSec) || 0) / 60) || null,
      recording_url: url,
      notes: null,
    });
  }
  return out.sort((a, b) => String(a.scheduled_at || '').localeCompare(String(b.scheduled_at || '')));
}

export async function gabungRekamanBatch(reg: any, rows: any[], accessToken?: string | null): Promise<any[]> {
  if (!regBatch(reg)) return rows;
  return tempelRekamanBatch(reg, rows, await muatRekamanBatch(reg, accessToken));
}
