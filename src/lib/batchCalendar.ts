// [jadwal-batch-kalender-v1]
// Kelas grup — Kelas Reguler (`regular_batches`) dan English Test Preparation
// (`test_prep_batches`) — TIDAK punya baris `schedules` sama sekali. Jadwalnya cuma
// hidup sebagai POLA di baris batch: hari (Selasa & Kamis), jam mulai, tanggal mulai,
// jumlah sesi. Akibatnya kalender pengajar & kalender siswa selalu terlihat kosong di
// jam kelas grup, padahal kelasnya jalan (laporan bug "Kelas aktif belum terupdate").
//
// Modul ini menerjemahkan pola tersebut jadi deretan tanggal-jam, supaya kedua kalender
// bisa merender sesi semu yang HANYA UNTUK DILIHAT (tak bisa digeser/dihapus — sumbernya
// baris batch, bukan `schedules`).
//
// ⚠️ Berkas kembar: linguo-admin-dashboard/src/lib/batchCalendar.ts (dipakai kalender pengajar).
//    Ubah keduanya bersamaan.

export type BatchKind = "reguler" | "etp";

/** Pagar aman: satu batch tak boleh melahirkan ratusan entri kalender. */
export const MAX_BATCH_OCCURRENCES = 60;
/** Pagar aman: berhenti mencari kalau polanya tak pernah kena. */
const MAX_LOOKAHEAD_DAYS = 400;
/** Dipakai kalau batch tak menyebut jumlah sesi maupun tanggal selesai. */
const DEFAULT_SESSIONS = 16;

// 0 = Senin … 6 = Minggu (sama dengan dowIndex di kalender pengajar)
const DAY_INDEX: Record<string, number> = {
  senin: 0, sen: 0,
  selasa: 1, sel: 1,
  rabu: 2, rab: 2,
  kamis: 3, kam: 3,
  jumat: 4, jum: 4, jumaat: 4,
  sabtu: 5, sab: 5,
  minggu: 6, min: 6, ahad: 6,
};

export const dowIndexOf = (d: Date) => (d.getDay() + 6) % 7;

/**
 * Nama hari → indeks 0..6. Menerima array (`test_prep_batches.schedule_days`), satu
 * nama (`regular_batches.session_day`), maupun teks bebas ("Senin & Rabu", "Sel/Kam").
 */
export function parseBatchDays(raw: string | string[] | null | undefined): number[] {
  const words = (Array.isArray(raw) ? raw : [raw || ""])
    .flatMap((s) => String(s || "").toLowerCase().replace(/['’]/g, "").split(/[^a-z]+/))
    .filter(Boolean);
  const out: number[] = [];
  for (const w of words) {
    const i = DAY_INDEX[w];
    if (i !== undefined && !out.includes(i)) out.push(i);
  }
  return out.sort((a, b) => a - b);
}

/** "19:30:00" | "19:30" | "19.30" | "19.30 WIB" → [19, 30]; null kalau tak terbaca. */
export function parseBatchTime(raw?: string | null): [number, number] | null {
  const m = String(raw || "").match(/(\d{1,2})[:.](\d{2})/);
  if (!m) return null;
  const hh = Number(m[1]), mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh > 23 || mm > 59) return null;
  return [hh, mm];
}

export type BatchPattern = {
  days: string | string[] | null | undefined;
  time?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  totalSessions?: number | null;
};

/**
 * Deret tanggal-jam pertemuan sebuah batch.
 *
 * Batas akhirnya "yang mana pun duluan": `endDate` (kalau ada) atau `totalSessions`
 * pertemuan. Batch tanpa keduanya (mis. ETP `end_date` null) tetap berhenti di
 * DEFAULT_SESSIONS supaya kalender tak dibanjiri sampai tahun depan.
 */
export function batchOccurrences(p: BatchPattern): Date[] {
  const days = parseBatchDays(p.days);
  const time = parseBatchTime(p.time);
  if (!days.length || !time || !p.startDate) return [];
  const base = new Date(`${String(p.startDate).slice(0, 10)}T00:00:00`);
  if (isNaN(base.getTime())) return [];

  const limit = p.endDate ? new Date(`${String(p.endDate).slice(0, 10)}T23:59:59`) : null;
  const hasLimit = !!limit && !isNaN(limit.getTime());
  const wanted = Number(p.totalSessions);
  const maxCount = Math.min(
    Number.isFinite(wanted) && wanted > 0 ? wanted : DEFAULT_SESSIONS,
    MAX_BATCH_OCCURRENCES,
  );

  const out: Date[] = [];
  for (let i = 0; out.length < maxCount && i < MAX_LOOKAHEAD_DAYS; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    if (hasLimit && d.getTime() > limit!.getTime()) break;
    if (!days.includes(dowIndexOf(d))) continue;
    d.setHours(time[0], time[1], 0, 0);
    out.push(d);
  }
  return out;
}
