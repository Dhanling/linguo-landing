// Kode AKSES Watch & Learn — beda dari kode PROMO (lihat watchPromo.ts).
//   - Kode promo  → memotong harga, pengguna tetap checkout & bayar.
//   - Kode akses  → membuka premium LANGSUNG untuk jangka waktu tertentu, tanpa
//                   invoice sama sekali (comp / uji coba internal).
//
// Modul ini sengaja berisi konstanta murni (tanpa env & tanpa service role) supaya
// aman diimpor dari komponen client — penukarannya memang terjadi di perangkat
// pengguna (entitlement Watch & Learn masih per-perangkat, lihat immersionLearn).
// Konsekuensinya kode ini SEMI-RAHASIA: siapa pun yang tahu kodenya bisa menukar.
// Karena itu selalu pasang `redeemUntil` dan matikan lewat `enabled: false` kalau
// sudah bocor — jangan hapus barisnya (biar jejaknya kebaca).

export interface WatchAccessCode {
  code: string; // huruf besar, tanpa spasi
  months: number; // lama akses sejak ditukar
  enabled: boolean; // matikan tanpa hapus (audit trail)
  redeemUntil?: string; // ISO — batas akhir kode boleh DITUKAR (bukan masa aktif)
  label: string; // teks tampil setelah berhasil ditukar
  note?: string; // catatan internal, tidak ditampilkan
}

export const WATCH_ACCESS_CODES: Record<string, WatchAccessCode> = {
  LINGUOHEMAT: {
    code: "LINGUOHEMAT",
    months: 12,
    enabled: true,
    redeemUntil: "2026-12-31T23:59:59+07:00",
    label: "Akses penuh Watch & Learn 1 tahun",
    note: "Kode coba-coba internal (tim & pengajar: Jia, Riny, dll).",
  },
};

/** Cari kode akses (case-insensitive, spasi diabaikan). Null kalau bukan kode akses. */
export function findWatchAccessCode(raw: string | null | undefined): WatchAccessCode | null {
  const code = (raw || "").trim().toUpperCase();
  if (!code) return null;
  return WATCH_ACCESS_CODES[code] ?? null;
}

/** Kode akses yang masih boleh ditukar hari ini (aktif & belum lewat redeemUntil). */
export function isWatchAccessCodeRedeemable(entry: WatchAccessCode, now = Date.now()): boolean {
  if (!entry.enabled) return false;
  if (entry.redeemUntil && now > Date.parse(entry.redeemUntil)) return false;
  return true;
}
