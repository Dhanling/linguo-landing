// [life-dashboard-v1] Pemformat angka & tanggal yang dipakai bersama-sama
// oleh kartu, grafik, dan tabel. Ditaruh di satu berkas supaya "Rp 1,2 jt" di
// grafik tidak pernah beda gaya dengan "Rp 1.200.000" di tabel.

export const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
export const BULAN_SINGKAT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/** Rupiah penuh — dipakai di angka utama & tabel. */
export function rupiah(n: number) {
  const bulat = Math.round(n || 0);
  return `Rp ${bulat.toLocaleString("id-ID")}`;
}

/** Rupiah ringkas — dipakai di sumbu grafik & label rapat. */
export function rupiahRingkas(n: number) {
  const v = Math.round(n || 0);
  const abs = Math.abs(v);
  const tanda = v < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${tanda}Rp ${(abs / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 0 : 1).replace(".", ",")} M`;
  if (abs >= 1_000_000) return `${tanda}Rp ${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace(".", ",")} jt`;
  if (abs >= 1_000) return `${tanda}Rp ${Math.round(abs / 1_000)} rb`;
  return `${tanda}Rp ${abs}`;
}

/** Selisih persen a terhadap b. null kalau pembandingnya nol (bukan 0%, memang tak terdefinisi). */
export function deltaPersen(sekarang: number, sebelum: number): number | null {
  if (!sebelum) return null;
  return ((sekarang - sebelum) / Math.abs(sebelum)) * 100;
}

export function persen(n: number | null, digit = 0) {
  if (n === null || !isFinite(n)) return "—";
  const s = n.toFixed(digit).replace(".", ",");
  return `${n > 0 ? "+" : ""}${s}%`;
}

export function tanggalPendek(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${BULAN_SINGKAT[d.getMonth()]} ${d.getFullYear()}`;
}

export function jamMenit(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

/** "3 hari lalu" — dipakai badge status lini bisnis. */
export function selisihHari(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}
