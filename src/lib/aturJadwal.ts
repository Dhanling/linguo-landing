// =============================================================================
// src/lib/aturJadwal.ts
// [atur-jadwal-sendiri-v1]
//
// Hitungan murni (tanpa I/O) untuk "Atur jadwal sendiri" di /akun: siswa Private
// memilih jam dari Availability pengajarnya, memindah, atau membatalkan sesi —
// semuanya divalidasi ulang di /api/atur-jadwal, modul ini cuma rumusnya.
//
// Semua jam dihitung sebagai jam dinding WIB, apa pun zona waktu servernya
// (Vercel = UTC): Availability pengajar memang disimpan dalam WIB.
//
// Format Availability (sama dengan tab Availability dashboard pengajar):
//   teacher_availability            day_of_week 0=Senin…6=Minggu, time_slot "HH:MM" per 30 menit
//   teacher_availability_overrides  override_date "YYYY-MM-DD", time_slot, type 'add' | 'block'
// =============================================================================

export const WIB_MS = 7 * 3600_000;
const MENIT = 60_000;
export const SLOT_MENIT = 30;

/** Siswa harus memesan / memindah / membatalkan paling lambat H-1 (24 jam sebelum). */
export const BATAS_UBAH_JAM = 24;
/** Jendela pilihan jam ke depan. */
export const JENDELA_HARI = 14;
/** Maksimal sesi sekali pesan. */
export const MAKS_SEKALI_PESAN = 8;
/** Availability yang tak disentuh lebih lama dari ini dianggap basi → booking sendiri ditutup. */
export const AVAIL_SEGAR_HARI = 30;

/** Produk yang jadwalnya boleh diatur siswa sendiri. Semi Private sengaja tidak:
 *  jam penggantinya wajib disepakati semua anggota grup (aturan reschedule H-1). */
export const PRODUK_ATUR_SENDIRI = new Set(["Kelas Private", "Kelas Kids"]);

export type Wib = { y: number; m: number; d: number; dow: number; hh: number; mi: number };

export function wibOf(ms: number): Wib {
  const t = new Date(ms + WIB_MS);
  return {
    y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate(),
    dow: (t.getUTCDay() + 6) % 7,
    hh: t.getUTCHours(), mi: t.getUTCMinutes(),
  };
}

export const wibInstant = (y: number, m: number, d: number, hh = 0, mi = 0) =>
  Date.UTC(y, m, d, hh, mi) - WIB_MS;

const pad = (n: number) => String(n).padStart(2, "0");
export const ymdWib = (w: Wib) => `${w.y}-${pad(w.m + 1)}-${pad(w.d)}`;
export const hhmm = (menitHari: number) => `${pad(Math.floor(menitHari / 60))}:${pad(menitHari % 60)}`;

/** "60", "60 menit", null → menit. */
export function durasiMenit(raw: unknown, cadangan = 60): number {
  const n = parseInt(String(raw ?? ""), 10);
  return Number.isFinite(n) && n >= 15 && n <= 240 ? n : cadangan;
}

export type Interval = { mulai: number; selesai: number };

export type BahanSlot = {
  /** "dow-HH:MM" dari teacher_availability. */
  mingguan: Set<string>;
  /** "YYYY-MM-DD-HH:MM" → 'add' | 'block'. */
  pengecualian: Map<string, string>;
  /** Jam sibuk pengajar & siswa (sesi lain, pertemuan batch). */
  sibuk: Interval[];
  durasi: number;
  sekarang: number;
  /** Batas akhir paket (expiry_date) — epoch ms, null = tanpa batas. */
  batasAkhir: number | null;
};

function selTersedia(b: BahanSlot, tgl: string, dow: number, jam: string) {
  const o = b.pengecualian.get(`${tgl}-${jam}`);
  if (o === "add") return true;
  if (o === "block") return false;
  return b.mingguan.has(`${dow}-${jam}`);
}

/** Alasan sebuah jam mulai TIDAK bisa dipakai; null = bisa. */
export function alasanSlotDitolak(b: BahanSlot, mulai: number): string | null {
  const w = wibOf(mulai);
  const menitHari = w.hh * 60 + w.mi;
  if (menitHari % SLOT_MENIT !== 0 || new Date(mulai).getUTCSeconds() !== 0) return "Jam harus kelipatan 30 menit";
  if (mulai < b.sekarang + BATAS_UBAH_JAM * 3600_000) return "Paling lambat 24 jam sebelum kelas";
  if (mulai > b.sekarang + (JENDELA_HARI + 1) * 86_400_000) return `Maksimal ${JENDELA_HARI} hari ke depan`;
  const selesai = mulai + b.durasi * MENIT;
  if (b.batasAkhir != null && selesai > b.batasAkhir) return "Melewati masa aktif paket";
  if (menitHari + b.durasi > 24 * 60) return "Melewati tengah malam";
  const tgl = ymdWib(w);
  // Satu sesi menutupi beberapa sel 30 menit — semuanya wajib tersedia.
  for (let m = menitHari; m < menitHari + b.durasi; m += SLOT_MENIT) {
    if (!selTersedia(b, tgl, w.dow, hhmm(m))) return "Di luar jam tersedia pengajar";
  }
  if (b.sibuk.some((s) => mulai < s.selesai && selesai > s.mulai)) return "Bentrok dengan jadwal lain";
  return null;
}

/** Semua jam mulai yang bisa dipesan dalam JENDELA_HARI ke depan, urut. */
export function daftarSlot(b: BahanSlot): number[] {
  const hariIni = wibOf(b.sekarang);
  const out: number[] = [];
  for (let i = 0; i <= JENDELA_HARI; i++) {
    const awalHari = wibInstant(hariIni.y, hariIni.m, hariIni.d + i);
    for (let m = 0; m + b.durasi <= 24 * 60; m += SLOT_MENIT) {
      const mulai = awalHari + m * MENIT;
      if (!alasanSlotDitolak(b, mulai)) out.push(mulai);
    }
  }
  return out;
}

/** Date hasil batchCalendar (jam dinding WIB di zona lokal proses) → epoch sebenarnya. */
export const wibDariLokal = (d: Date) =>
  wibInstant(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes());

const HARI_ID = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const BULAN_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** "Selasa, 21 Okt 2026 · 19.00–20.00 WIB" */
export function labelSesi(mulai: number, durasi: number): string {
  const w = wibOf(mulai);
  const a = w.hh * 60 + w.mi;
  const titik = (m: number) => hhmm(m % (24 * 60)).replace(":", ".");
  return `${HARI_ID[w.dow]}, ${w.d} ${BULAN_ID[w.m]} ${w.y} · ${titik(a)}–${titik(a + durasi)} WIB`;
}
