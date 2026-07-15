// Sumber tunggal kode promo langganan Watch & Learn. Dipakai bersama oleh:
//   - /api/validate-wl-promo   → feedback instan di modal (preview diskon)
//   - /api/create-wl-invoice   → hitung ulang harga saat checkout (anti-tamper)
// JANGAN pernah percaya diskon dari client — server selalu evaluasi ulang di sini.

import { WATCH_PLANS, type WatchPlan } from "@/lib/immersionLearn";

export interface WatchPromo {
  code: string; // huruf besar, tanpa spasi
  discountPct: number; // 1–100
  enabled: boolean; // matikan tanpa hapus (audit trail)
  expiresAt?: string; // ISO; lewat tanggal ini → tak berlaku
  label?: string; // teks tampil di modal, mis. "Promo Peluncuran"
  plans?: WatchPlan["id"][]; // batasi ke paket tertentu; kosong = semua paket
}

// ⚠️ Contoh DINONAKTIFKAN (enabled:false) supaya tak ada diskon hidup ke produksi
// tanpa keputusan bisnis. Untuk mengaktifkan: set enabled:true, sesuaikan
// discountPct/expiresAt, lalu deploy.
export const PROMO_CODES: Record<string, WatchPromo> = {
  LINGUO2026: {
    code: "LINGUO2026",
    discountPct: 50,
    enabled: false,
    label: "Promo Peluncuran",
    // expiresAt: "2026-08-31T23:59:59+07:00",
  },
  HEMAT30: {
    code: "HEMAT30",
    discountPct: 30,
    enabled: false,
    label: "Diskon 30%",
  },
};

export interface PromoResult {
  ok: boolean;
  code?: string;
  discountPct?: number;
  discountedAmount?: number; // total setelah diskon (IDR)
  label?: string;
  reason?: string; // alasan gagal (untuk ditampilkan)
}

/**
 * Evaluasi sebuah kode promo untuk (plan). Sumber kebenaran harga: `WATCH_PLANS`.
 * Selalu dipanggil server-side; client hanya menampilkan hasilnya.
 */
export function evaluatePromo(rawCode: string, planId: string): PromoResult {
  const code = (rawCode || "").trim().toUpperCase();
  if (!code) return { ok: false, reason: "Masukkan kode promo." };

  const plan = WATCH_PLANS.find((p) => p.id === planId);
  if (!plan) return { ok: false, reason: "Paket tidak valid." };

  const promo = PROMO_CODES[code];
  if (!promo || !promo.enabled) {
    return { ok: false, reason: "Kode promo tidak ditemukan." };
  }
  if (promo.expiresAt && Date.now() > new Date(promo.expiresAt).getTime()) {
    return { ok: false, reason: "Kode promo sudah kedaluwarsa." };
  }
  if (promo.plans && promo.plans.length > 0 && !promo.plans.includes(plan.id)) {
    return { ok: false, reason: "Kode promo tidak berlaku untuk paket ini." };
  }

  const pct = Math.max(1, Math.min(100, promo.discountPct));
  const discountedAmount = Math.max(0, Math.round((plan.price * (100 - pct)) / 100));
  return {
    ok: true,
    code: promo.code,
    discountPct: pct,
    discountedAmount,
    label: promo.label,
  };
}
