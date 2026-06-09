// ============================================================================
// Affiliate commission calculator — shared config (display-only)
// ----------------------------------------------------------------------------
// Source of truth for the "Kalkulator Komisi" used on the public /afiliator
// page and the /akun/afiliator dashboard. The per-tier rates mirror the live
// commission engine (Supabase Edge Function `xendit-webhook`); reference
// prices are the published per-product prices used purely for simulation.
//
// This module computes NOTHING server-side and touches NO database — it only
// feeds the calculator UI so an affiliator can estimate potential earnings.
// ============================================================================

export type TierKey = "standard" | "bronze" | "silver" | "gold";

// 4 tiers, ordered standard → gold. The array index is the rate index used by
// each product below.
export const TIERS: { key: TierKey; label: string }[] = [
  { key: "standard", label: "Standard" },
  { key: "bronze", label: "Bronze" },
  { key: "silver", label: "Silver" },
  { key: "gold", label: "Gold" },
];

const TIER_ORDER: TierKey[] = ["standard", "bronze", "silver", "gold"];
const TIER_INDEX: Record<TierKey, number> = {
  standard: 0,
  bronze: 1,
  silver: 2,
  gold: 3,
};

export type PriceOption = { label: string; amount: number };

export type ProductDef = {
  key: string;
  label: string;
  // Commission rate per tier — [standard, bronze, silver, gold] as decimals.
  rates: [number, number, number, number];
  // Reference price options. More than one entry → the UI shows a sub-select.
  prices: PriceOption[];
};

// Rates (decimal) + reference prices per product. Rates match the live engine.
export const PRODUCTS: ProductDef[] = [
  {
    key: "private",
    label: "Kelas Private",
    rates: [0.08, 0.1, 0.12, 0.15],
    prices: [{ label: "16 sesi", amount: 1600000 }],
  },
  {
    key: "reguler",
    label: "Kelas Reguler",
    rates: [0.1, 0.12, 0.15, 0.18],
    prices: [{ label: "per bulan", amount: 150000 }],
  },
  {
    key: "kids",
    label: "Kelas Kids",
    rates: [0.08, 0.1, 0.12, 0.15],
    prices: [{ label: "per sesi", amount: 75000 }],
  },
  {
    key: "elearning",
    label: "E-Learning",
    rates: [0.15, 0.2, 0.25, 0.3],
    prices: [
      { label: "1 Bulan — Rp29.000", amount: 29000 },
      { label: "6 Bulan — Rp99.000", amount: 99000 },
      { label: "12 Bulan — Rp179.000", amount: 179000 },
    ],
  },
  {
    key: "ebook",
    label: "E-Book",
    rates: [0.15, 0.2, 0.25, 0.3],
    prices: [{ label: "E-Book Digital", amount: 29000 }],
  },
  {
    key: "ielts",
    label: "IELTS/TOEFL",
    rates: [0.1, 0.12, 0.15, 0.18],
    prices: [{ label: "16 sesi", amount: 300000 }],
  },
];

// Rate (decimal) for a product at a given tier.
export function rateFor(product: ProductDef, tier: TierKey): number {
  return product.rates[TIER_INDEX[tier]];
}

// Map a DB tier string (standard / lingfluencer_bronze / …) to a TierKey.
// Unknown values fall back to "standard", matching the live engine.
export function tierKeyFromDb(dbTier: string | null | undefined): TierKey {
  switch (dbTier) {
    case "lingfluencer_bronze":
      return "bronze";
    case "lingfluencer_silver":
      return "silver";
    case "lingfluencer_gold":
      return "gold";
    default:
      return "standard";
  }
}

// The next tier up, or null if already at the top (gold).
export function nextTier(tier: TierKey): TierKey | null {
  const i = TIER_ORDER.indexOf(tier);
  return i >= 0 && i < TIER_ORDER.length - 1 ? TIER_ORDER[i + 1] : null;
}

export const tierLabel = (tier: TierKey): string =>
  TIERS.find((t) => t.key === tier)?.label ?? tier;

export const rupiah = (n: number): string =>
  "Rp " + Math.round(n || 0).toLocaleString("id-ID");
