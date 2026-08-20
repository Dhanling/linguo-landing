// ── perpustakaan-akses-email-v1 ─────────────────────────────────────────────
// Filter "pembelian digital milik saya" yang dipakai bareng oleh Perpustakaan,
// riwayat tagihan, dan gerbang skip-onboarding.
//
// Kenapa tidak cukup `auth_user_id = user.id`: kolom itu diisi trigger DB
// `trg_link_digital_purchase_auth_user` HANYA saat baris pembeliannya
// dibuat/diubah. Pembeli funnel yang baru bikin akun SESUDAH bayar tetap
// ber-auth_user_id NULL selamanya → perpustakaannya kosong padahal lunas
// (20 Agu 2026: 37 dari 59 pembelian Lunas kena). Backfill sekali jalan
// (sql/20260820_perpustakaan_akses_email.sql) menambal yang lama; pencocokan
// email di sini yang menjaga kasus berikutnya tidak terulang.
//
// Emailnya diambil dari SESI (bukan input), dan policy RLS digital_purchases
// tetap membatasi barisnya ke email/uid pemilik — jadi ini melonggarkan
// tampilan, bukan gerbang keamanannya.

import type { SupabaseClient } from "@supabase/supabase-js";

/** Karakter yang bikin ekspresi `or=(...)` PostgREST salah tafsir. */
const EMAIL_AMAN = /^[^\s,()"'\\%*]+@[^\s,()"'\\%*]+$/;

/**
 * Ekspresi untuk `.or(...)` — cocok lewat auth_user_id ATAU email pemilik sesi.
 * Balik null kalau email sesi tak ada/tak aman dipakai; pemanggil jatuh balik
 * ke `.eq("auth_user_id", userId)` seperti perilaku lama.
 */
export async function orMilikSaya(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  if (!userId) return null;
  let email: string | null = null;
  try {
    const { data } = await supabase.auth.getSession();
    email = data.session?.user?.email?.trim() || null;
  } catch {
    email = null;
  }
  if (!email || !EMAIL_AMAN.test(email)) return null;
  return `auth_user_id.eq.${userId},buyer_email.ilike.${email}`;
}
