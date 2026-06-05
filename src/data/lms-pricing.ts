// lms-pricing.ts — harga akses LMS per bahasa (LOCKED, lihat HANDOFF #47)
// Access-pass SEKALI BAYAR (bukan auto-renew). expires_at = started_at + durasi; lifetime = NULL.
// Display coret pakai anchor bulanan REAL (59.000 × jumlah bulan). NO fake anchor.

export type LmsPlanId = '1m' | '6m' | '12m' | 'lifetime';

export interface LmsPlan {
  plan: LmsPlanId;
  label: string;
  months: number | null;        // null = lifetime
  harga: number;                // harga jual (rupiah)
  harga_normal: number | null;  // anchor coret = 59.000 × months; null = lifetime (ga ada anchor bulanan)
  harga_promo: number | null;   // diisi pas promo; default null
  hematLabel: string | null;    // mis. "Hemat 44%"
  efektifPerBulan: number | null;
  badge: string | null;
  highlight: boolean;           // kartu yang ditonjolin (12m)
}

const ANCHOR_PER_BULAN = 59000;

export const LMS_PLANS: LmsPlan[] = [
  {
    plan: '1m',
    label: '1 Bulan',
    months: 1,
    harga: 59000,
    harga_normal: ANCHOR_PER_BULAN * 1, // 59.000 (anchor, ga dicoret)
    harga_promo: null,
    hematLabel: null,
    efektifPerBulan: 59000,
    badge: null,
    highlight: false,
  },
  {
    plan: '6m',
    label: '6 Bulan',
    months: 6,
    harga: 249000,
    harga_normal: ANCHOR_PER_BULAN * 6, // 354.000
    harga_promo: null,
    hematLabel: 'Hemat 30%',
    efektifPerBulan: 41500,
    badge: null,
    highlight: false,
  },
  {
    plan: '12m',
    label: '12 Bulan',
    months: 12,
    harga: 399000,
    harga_normal: ANCHOR_PER_BULAN * 12, // 708.000
    harga_promo: null,
    hematLabel: 'Hemat 44%',
    efektifPerBulan: 33250,
    badge: 'TERPOPULER',
    highlight: true,
  },
  {
    plan: 'lifetime',
    label: 'Lifetime',
    months: null,
    harga: 699000,
    harga_normal: null,         // lifetime: ga ada anchor bulanan, jangan dicoret
    harga_promo: null,
    hematLabel: null,
    efektifPerBulan: null,
    badge: 'Akses selamanya',
    highlight: false,
  },
];

// Harga yang benar-benar dibayar user (promo kalau ada, else harga jual).
export function hargaFinal(p: LmsPlan): number {
  return p.harga_promo ?? p.harga;
}

// Apakah harga normal (anchor) ditampilkan dicoret.
// True hanya kalau ada anchor DAN harga final < anchor (biar ga nyoret harga sama).
export function showCoret(p: LmsPlan): boolean {
  return p.harga_normal != null && hargaFinal(p) < p.harga_normal;
}

// Format rupiah: 399000 → "Rp 399.000"
export function formatRupiah(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}

export function getPlan(plan: LmsPlanId): LmsPlan | undefined {
  return LMS_PLANS.find((p) => p.plan === plan);
}
