// Sumber tunggal kode langganan Watch & Learn. SATU kolom kode menerima DUA jenis:
//   1) Promo statis (PROMO_CODES di bawah, mis. HEMAT10 = 10%)
//   2) Kode afiliator (referral_code di tabel `affiliates`) → diskon tetap 5% +
//      atribusi ke afiliatornya.
// Dipakai bersama oleh:
//   - /api/validate-wl-promo   → feedback instan di modal (preview diskon)
//   - /api/create-wl-invoice   → hitung ulang harga saat checkout (anti-tamper)
// JANGAN pernah percaya diskon dari client — server selalu evaluasi ulang di sini.
//
// CATATAN: modul ini memakai SUPABASE_SERVICE_ROLE_KEY (server-side). Hanya
// diimpor oleh route API — jangan impor dari komponen client.

import { WATCH_PLANS, type WatchPlan } from "@/lib/immersionLearn";

export interface WatchPromo {
  code: string; // huruf besar, tanpa spasi
  discountPct: number; // 1–100
  enabled: boolean; // matikan tanpa hapus (audit trail)
  expiresAt?: string; // ISO; lewat tanggal ini → tak berlaku
  label?: string; // teks tampil di modal, mis. "Diskon 10%"
  plans?: WatchPlan["id"][]; // batasi ke paket tertentu; kosong = semua paket
}

// Kode promo statis. Aktifkan/nonaktifkan lewat `enabled` (tanpa hapus, audit).
export const PROMO_CODES: Record<string, WatchPromo> = {
  HEMAT10: {
    code: "HEMAT10",
    discountPct: 10,
    enabled: true,
  },
};

// Diskon untuk kode afiliator (referral_code valid di tabel affiliates).
export const AFFILIATE_DISCOUNT_PCT = 5;

export type CodeKind = "promo" | "affiliate";

export interface PromoResult {
  ok: boolean;
  code?: string;
  kind?: CodeKind;
  discountPct?: number;
  discountedAmount?: number; // total setelah diskon (IDR)
  label?: string;
  reason?: string; // alasan gagal (untuk ditampilkan)
  affiliateId?: string; // hanya server — JANGAN diteruskan ke client
}

function priceAfter(pct: number, base: number): number {
  const p = Math.max(1, Math.min(100, pct));
  return Math.max(0, Math.round((base * (100 - p)) / 100));
}

/**
 * Evaluasi kode PROMO STATIS saja (sinkron). Sumber kebenaran harga: WATCH_PLANS.
 */
export function evaluatePromo(rawCode: string, planId: string): PromoResult {
  const code = (rawCode || "").trim().toUpperCase();
  if (!code) return { ok: false, reason: "Masukkan kode." };

  const plan = WATCH_PLANS.find((p) => p.id === planId);
  if (!plan) return { ok: false, reason: "Paket tidak valid." };

  const promo = PROMO_CODES[code];
  if (!promo || !promo.enabled) {
    return { ok: false, reason: "Kode tidak ditemukan." };
  }
  if (promo.expiresAt && Date.now() > new Date(promo.expiresAt).getTime()) {
    return { ok: false, reason: "Kode sudah kedaluwarsa." };
  }
  if (promo.plans && promo.plans.length > 0 && !promo.plans.includes(plan.id)) {
    return { ok: false, reason: "Kode tidak berlaku untuk paket ini." };
  }

  return {
    ok: true,
    code: promo.code,
    kind: "promo",
    discountPct: promo.discountPct,
    discountedAmount: priceAfter(promo.discountPct, plan.price),
    label: promo.label,
  };
}

// Cari referral_code di tabel affiliates → { id } atau null. Best-effort:
// kegagalan jaringan/kredensial diperlakukan sebagai "tak ditemukan".
async function lookupAffiliate(code: string): Promise<{ id: string } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(
      `${url}/rest/v1/affiliates?referral_code=ilike.${encodeURIComponent(code)}&select=id&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) && rows[0]?.id ? { id: rows[0].id as string } : null;
  } catch {
    return null;
  }
}

/**
 * Resolver SATU-kolom-DUA-jenis: coba promo statis dulu; kalau kodenya bukan
 * promo terdaftar, coba sebagai kode afiliator (diskon AFFILIATE_DISCOUNT_PCT +
 * affiliateId untuk atribusi). Async karena afiliator butuh query DB.
 */
export async function resolveWatchCode(rawCode: string, planId: string): Promise<PromoResult> {
  const code = (rawCode || "").trim().toUpperCase();
  if (!code) return { ok: false, reason: "Masukkan kode." };

  const plan = WATCH_PLANS.find((p) => p.id === planId);
  if (!plan) return { ok: false, reason: "Paket tidak valid." };

  // 1) Kode terdaftar sebagai promo → hormati hasilnya (termasuk gagal: expired/
  //    nonaktif/paket) tanpa jatuh ke jalur afiliator.
  if (PROMO_CODES[code]) return evaluatePromo(code, planId);

  // 2) Coba sebagai kode afiliator.
  const aff = await lookupAffiliate(code);
  if (aff) {
    return {
      ok: true,
      code,
      kind: "affiliate",
      discountPct: AFFILIATE_DISCOUNT_PCT,
      discountedAmount: priceAfter(AFFILIATE_DISCOUNT_PCT, plan.price),
      label: "Kode afiliator",
      affiliateId: aff.id,
    };
  }

  return { ok: false, reason: "Kode tidak ditemukan." };
}
