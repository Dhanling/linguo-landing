// src/lib/etpBatches.ts
// SATU sumber data batch ETP (TOEFL & IELTS Preparation) untuk landing DAN
// knowledge AI (Ling chat). Sebelumnya halaman jadwal punya salinan statik
// sendiri sementara AI baca tabel etp_batches — dua sumber terpisah, jadi AI
// pernah menyebut batch Juni padahal landing sudah pasang batch Agustus.
//
// Aturannya sekarang:
//   1. Baris tabel etp_batches (is_active) adalah sumber utama — dipakai landing
//      maupun AI lewat resolveEtpBatches().
//   2. Batch yang kelasnya sudah kelar (perkiraan dari tanggal mulai + jumlah
//      sesi) otomatis dibuang, biar batch basi tidak ikut ditawarkan.
//   3. Kalau tabelnya kosong/tidak terbaca, keduanya jatuh ke ETP_FALLBACK_BATCHES
//      di bawah — jadi landing & AI tetap menyebut batch yang sama.

// Bentuk baris tabel etp_batches di Supabase.
export interface EtpBatchRow {
  id: string;
  title: string;
  badge: string;
  icon: string;
  color: string;
  days: string;
  time: string;
  start_date: string; // ISO date string
  duration_min: number;
  total_sessions: number;
  price: number;
  max_capacity: number;
  current_enrolled: number;
  syllabus: { week: string; topics: string[] }[];
  highlights: string[];
  is_active: boolean;
}

// Cadangan statik — WAJIB sama persis dengan baris etp_batches yang aktif.
//
// [etp-batches-satu-sumber-v1, 21 Agu 2026] `etp_batches` bukan tabel lagi,
// melainkan VIEW turunan `test_prep_batches` — jadwal ETP di website sekarang
// ikut menu Test Prep di dashboard, tak perlu migrasi SQL tiap ganti batch.
// Cadangan ini cuma dipakai kalau DB tak terbaca; isinya tetap harus batch yang
// sedang dibuka, karena cadangan basi persis keluhan yang bikin aturan ini ada
// ("website masih memajang batch Agustus padahal September sudah dipublish").
// [etp-jan27-segera-v1] 22 Nov 2026: batch November (TOEFL 23 Nov, IELTS 24 Nov)
// DIBATALKAN (peserta kurang), tidak ada gelombang Desember. Gelombang berikutnya
// Januari 2027 — jadwal & harga belum rilis. Sengaja kosong: halaman jadwal
// menampilkan pesan "Januari 2027, segera diumumkan" + tawaran Private Test Prep.
// Isi lagi begitu batch Januari dipublish di menu Test Prep dashboard.
export const ETP_FALLBACK_BATCHES: EtpBatchRow[] = [];

// Perkiraan tanggal kelas terakhir: ETP jalan 2x seminggu, jadi 16 sesi ≈ 8
// minggu. Dipakai untuk membuang batch yang kelasnya sudah kelar tapi lupa
// dinonaktifkan di tabel — batch begitu yang bikin AI menawarkan jadwal basi.
export function etpBatchEndISO(row: Pick<EtpBatchRow, "start_date" | "total_sessions">): string {
  const start = new Date(String(row.start_date) + "T00:00:00Z");
  if (isNaN(start.getTime())) return "";
  const weeks = Math.ceil((Number(row.total_sessions) || 16) / 2);
  start.setUTCDate(start.getUTCDate() + weeks * 7);
  return start.toISOString().slice(0, 10);
}

// Batch yang masih relevan buat calon siswa: aktif & kelasnya belum kelar.
export function isEtpBatchLive(row: EtpBatchRow, todayISO: string): boolean {
  if (row.is_active === false) return false;
  const end = etpBatchEndISO(row);
  return !end || end >= todayISO;
}

// Dipakai landing & knowledge AI: baris DB kalau ada, kalau kosong pakai
// cadangan statik. Hasilnya identik di kedua tempat.
export function resolveEtpBatches(rows: EtpBatchRow[] | null | undefined, todayISO: string): EtpBatchRow[] {
  const live = (rows || []).filter((r) => isEtpBatchLive(r, todayISO));
  if (live.length) return gelombangTerbaru(live, todayISO);
  return gelombangTerbaru(ETP_FALLBACK_BATCHES.filter((r) => isEtpBatchLive(r, todayISO)), todayISO);
}

// [etp-gelombang-terbaru-v1] Batch yang SUDAH mulai tapi belum kelar ikut lolos
// isEtpBatchLive, jadi batch Oktober (26/27 Okt) tampil berdampingan dengan batch
// November di halaman jadwal (Bug Tracker 5036eecb). Per jenis (badge) yang
// ditampilkan cuma batch yang belum mulai; kalau belum ada gelombang berikutnya,
// cukup batch terbaru — aturan yang sama dengan jadwal Reguler.
function gelombangTerbaru(rows: EtpBatchRow[], todayISO: string): EtpBatchRow[] {
  const terbaru: Record<string, string> = {};
  for (const r of rows) {
    const k = r.badge || r.title;
    if (!terbaru[k] || String(r.start_date) > terbaru[k]) terbaru[k] = String(r.start_date);
  }
  return rows.filter((r) => String(r.start_date) >= todayISO || String(r.start_date) === terbaru[r.badge || r.title]);
}

// Tanggal kalender WIB (UTC+7) hari ini, 'YYYY-MM-DD'.
export function todayWIBISO(): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
