// [reguler-jan27-harga-v1] SUMBER TUNGGAL harga Kelas Reguler.
//
// Keputusan owner 22 Nov 2026 untuk gelombang Januari 2027 (8 sesi × 90 menit,
// 1x/minggu, ±2 bulan):
//   - EARLY BIRD Rp250.000 sampai 20 Des 2026 23:59 WIB
//   - NORMAL     Rp300.000 mulai 21 Des 2026 00:00 WIB
//   - Kelas dibuka minimal 4 peserta (dulu 8), maksimal 15.
//   - Tidak ada gelombang Desember. Harga lama Rp150.000 hanya untuk pendaftar
//     batch lama (mereka tetap membayar harga yang sudah dibayar).
//
// Peralihan EB → normal OTOMATIS berdasar tanggal (tanpa deploy ulang). Zona
// waktu WIB ditulis eksplisit (+07:00) karena server Vercel jalan di UTC.
// Nominal yang DITAGIH selalu dihitung di server lewat getRegulerPrice() —
// angka dari klien tidak pernah dipakai.
//
// File ini sengaja tanpa dependensi supaya aman diimpor dari route handler
// maupun komponen klien.

export const REGULER_EB_PRICE = 250000;
export const REGULER_NORMAL_PRICE = 300000;
export const REGULER_EB_END = new Date("2026-12-20T23:59:59+07:00");
export const REGULER_MIN_PESERTA = 4;
export const REGULER_MAX_PESERTA = 15;
export const REGULER_TOTAL_SESI = 8;
/** Batch dengan batch_month >= ini memakai harga baru (EB/normal). */
export const REGULER_NEW_PRICING_FROM_MONTH = "2027-01-01";

/** Tanggal akhir early bird untuk copy, mis. "20 Des 2026" / pendek "20 Des". [jadwal-eb-label-v1] */
export const REGULER_EB_END_LABEL = "20 Des 2026";
export const REGULER_EB_END_LABEL_SHORT = "20 Des";

const rp = (n: number) => `Rp${n.toLocaleString("id-ID")}`;

export function isRegulerEarlyBird(now: Date = new Date()): boolean {
  return now.getTime() <= REGULER_EB_END.getTime();
}

/** Harga Kelas Reguler yang berlaku saat `now` (Rp). */
export function getRegulerPrice(now: Date = new Date()): number {
  return isRegulerEarlyBird(now) ? REGULER_EB_PRICE : REGULER_NORMAL_PRICE;
}

/**
 * Label harga untuk copy, mis.
 *   "Rp250.000 (early bird s.d. 20 Des, normal Rp300.000)"  — sebelum 21 Des
 *   "Rp300.000"                                              — sesudahnya
 */
export function getRegulerPriceLabel(now: Date = new Date()): string {
  return isRegulerEarlyBird(now)
    ? `${rp(REGULER_EB_PRICE)} (early bird s.d. 20 Des, normal ${rp(REGULER_NORMAL_PRICE)})`
    : rp(REGULER_NORMAL_PRICE);
}

/** Label pendek: "Rp250.000" / "Rp300.000". */
export function getRegulerPriceShort(now: Date = new Date()): string {
  return rp(getRegulerPrice(now));
}

/**
 * Harga yang ditampilkan/ditagih untuk SATU baris batch reguler. Batch
 * gelombang Januari 2027 ke atas ikut harga EB/normal berdasar tanggal (kolom
 * price_regular di DB berisi angka EB dan tidak berubah sendiri tanggal 21 Des).
 * Batch lama tetap memakai angka di DB.
 */
export function regulerBatchPrice(
  batch: { batch_month?: string | null; price_regular?: number | null; current_price_per_student?: number | null },
  now: Date = new Date(),
): number {
  const month = String(batch.batch_month || "").slice(0, 10);
  if (month && month >= REGULER_NEW_PRICING_FROM_MONTH) return getRegulerPrice(now);
  return Number(batch.current_price_per_student || batch.price_regular) || getRegulerPrice(now);
}

/**
 * Bahasa yang punya batch Reguler gelombang Januari 2027 (nama kanonik Inggris,
 * sama dengan REGULER_LANGS). Bahasa lain → Private / Semi-Private. Gerbang
 * bayar yang mengikat tetap membaca tabel regular_batches (lib/regulerOpen);
 * daftar ini hanya untuk copy/tampilan statis.
 */
export const REGULER_JAN27_LANGS = ["English", "Mandarin", "Japanese", "German", "French", "Spanish"];
