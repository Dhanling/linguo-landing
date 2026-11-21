// [elearning-promo-afiliator-v1] E-Learning akses 6 bulan: harga normal di web
// tetap Rp79.000, tapi pembeli yang memakai KODE AFILIATOR / LINGFLUENCER
// (affiliates.referral_code yang aktif — lewat kolom "Punya kode referral?" atau
// cookie linguo_ref dari link ?ref=) cukup bayar Rp29.000 per bahasa.
// Diminta Intan (Sosmed) & disetujui owner 11 Nov 2026: brief ke lingfluencer yang
// sudah jalan menyebut "29rb", padahal paket 1 bulan sudah tidak dijual.
// Berlaku sampai akhir 2026 — sesudah itu harga kembali normal TANPA deploy.
//
// Harga tetap diputuskan SERVER (/api/create-cart-invoice); klien cuma
// menampilkannya. Tier 12 bulan tidak ikut promo.

import type { SupabaseClient } from "@supabase/supabase-js";

export const HARGA_PROMO_AFILIATOR_ELEARNING = 29000;
/** Batas akhir promo: 1 Jan 2027 00.00 WIB. */
export const PROMO_AFILIATOR_ELEARNING_SAMPAI = Date.parse("2027-01-01T00:00:00+07:00");

export function promoAfiliatorElearningAktif(now = Date.now()): boolean {
  return now < PROMO_AFILIATOR_ELEARNING_SAMPAI;
}

/** Tier e-learning "6 bulan" (≈180 hari) yang berhak harga promo. */
export function tierPromoAfiliator(type: string | null | undefined, durationDays: number | null | undefined): boolean {
  return type === "elearning" && typeof durationDays === "number" && durationDays >= 150 && durationDays <= 200;
}

/** Harga promo untuk satu baris, atau null kalau tak berlaku. */
export function hargaPromoAfiliator(
  type: string | null | undefined,
  durationDays: number | null | undefined,
  kodeSah: boolean,
  hargaNormal: number,
): number | null {
  if (!kodeSah || !promoAfiliatorElearningAktif() || !tierPromoAfiliator(type, durationDays)) return null;
  return hargaNormal > HARGA_PROMO_AFILIATOR_ELEARNING ? HARGA_PROMO_AFILIATOR_ELEARNING : null;
}

// [ebook-diskon-afiliator-v1] (#fa816ac8, Intan) E-Book yang dibeli pakai kode
// afiliator/Lingfluencer aktif → potongan Rp10.000 per e-book (per baris, tidak
// untuk modul yang masuk Paket Lengkap — paket sudah berharga khusus). Tanpa
// batas tanggal & tanpa batas sekali-per-pembeli. Harga tetap diputus SERVER.
export const DISKON_AFILIATOR_EBOOK = 10000;

/** Harga e-book setelah potongan kode afiliator, atau null kalau tak berlaku. */
export function hargaDiskonEbookAfiliator(
  type: string | null | undefined,
  kodeSah: boolean,
  hargaNormal: number,
): number | null {
  if (!kodeSah || type !== "ebook") return null;
  return hargaNormal > DISKON_AFILIATOR_EBOOK * 2 ? hargaNormal - DISKON_AFILIATOR_EBOOK : null;
}

export function rapikanKode(kode: string | null | undefined): string {
  let k = String(kode ?? "");
  try { k = decodeURIComponent(k); } catch { /* % rusak — pakai apa adanya */ }
  return k.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
}

/** Kode afiliator aktif? (dipakai server dengan service role). */
export async function kodeAfiliatorSah(admin: SupabaseClient, kode: string | null | undefined): Promise<boolean> {
  return (await idAfiliatorDariKode(admin, kode)) !== null;
}

/** id afiliator aktif untuk kode ini, atau null. */
export async function idAfiliatorDariKode(admin: SupabaseClient, kode: string | null | undefined): Promise<string | null> {
  const k = rapikanKode(kode);
  if (k.length < 3 || k.length > 40) return null;
  const { data } = await admin
    .from("affiliates")
    .select("id")
    .eq("referral_code", k)
    .eq("status", "active")
    .is("archived_at", null)
    .limit(1);
  return (data?.[0] as { id: string } | undefined)?.id ?? null;
}
