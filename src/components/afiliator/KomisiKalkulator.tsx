"use client";

// ============================================================================
// KomisiKalkulator — interactive affiliate commission calculator
// ----------------------------------------------------------------------------
// Two modes, one component:
//   • Public (/afiliator)      → tier is selectable.
//   • Dashboard (/akun/afiliator) → pass `lockedTier` to lock it to the logged
//     in affiliator's tier and surface a "naik ke tier berikutnya" upsell.
//
// Pure-frontend: rates & reference prices come from @/lib/affiliate-komisi.
// No API, no DB.
// ============================================================================

import { useMemo, useState } from "react";
import { Calculator, TrendingUp } from "lucide-react";
import {
  PRODUCTS,
  TIERS,
  rateFor,
  rupiah,
  nextTier,
  tierLabel,
  type TierKey,
} from "@/lib/affiliate-komisi";

const selectCls =
  "h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-800 outline-none transition focus:border-[#1A9E9E] focus:bg-white focus:ring-2 focus:ring-[#1A9E9E]/20";

export default function KomisiKalkulator({
  lockedTier,
}: {
  // When set, the tier picker is hidden and locked to this tier (dashboard).
  lockedTier?: TierKey;
}) {
  const isLocked = !!lockedTier;
  const [tier, setTier] = useState<TierKey>(lockedTier ?? "standard");
  const [productKey, setProductKey] = useState<string>("elearning");
  const [priceIdx, setPriceIdx] = useState<number>(0);
  const [qty, setQty] = useState<string>("10");

  const effectiveTier = lockedTier ?? tier;
  const product = useMemo(
    () => PRODUCTS.find((p) => p.key === productKey) ?? PRODUCTS[0],
    [productKey]
  );

  // Guard the price index against a product switch (e.g. elearning → ebook).
  const safePriceIdx = priceIdx < product.prices.length ? priceIdx : 0;
  const price = product.prices[safePriceIdx];
  const hasPriceOptions = product.prices.length > 1;

  const count = Math.max(0, Math.floor(Number(qty) || 0));
  const rate = rateFor(product, effectiveTier);
  const perTx = Math.round(price.amount * rate);
  const monthly = perTx * count;

  // Dashboard upsell: what the same monthly volume would earn one tier up.
  const up = nextTier(effectiveTier);
  const upMonthly =
    up !== null ? Math.round(price.amount * rateFor(product, up)) * count : 0;

  function changeProduct(key: string) {
    setProductKey(key);
    setPriceIdx(0);
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A9E9E]/12 text-[#1A9E9E]">
          <Calculator className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-800 sm:text-base">
            {isLocked ? "Simulasi Potensi" : "Kalkulator Komisi"}
          </h3>
          <p className="truncate text-xs text-slate-500">
            {isLocked
              ? `Tier kamu: ${tierLabel(effectiveTier)} — hitung potensi komisimu.`
              : "Perkirakan komisi yang bisa kamu dapat."}
          </p>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        {/* Controls */}
        <div className="grid gap-3.5 sm:grid-cols-2">
          {/* Tier — only when not locked */}
          {!isLocked && (
            <Field label="Tier">
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as TierKey)}
                className={selectCls}
              >
                {TIERS.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {/* Produk */}
          <Field label="Produk">
            <select
              value={productKey}
              onChange={(e) => changeProduct(e.target.value)}
              className={selectCls}
            >
              {PRODUCTS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>

          {/* Sub-pilihan harga (mis. E-Learning) */}
          {hasPriceOptions && (
            <Field label="Pilihan harga">
              <select
                value={safePriceIdx}
                onChange={(e) => setPriceIdx(Number(e.target.value))}
                className={selectCls}
              >
                {product.prices.map((opt, i) => (
                  <option key={i} value={i}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {/* Jumlah penjualan / bulan */}
          <Field label="Penjualan per bulan">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="Contoh: 10"
              className={selectCls}
            />
          </Field>
        </div>

        {/* Output */}
        <div className="rounded-2xl bg-[#1A9E9E]/5 p-4 ring-1 ring-[#1A9E9E]/15">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-slate-500">
              Komisi per transaksi
              <span className="ml-1 text-[#147878]">
                ({Math.round(rate * 100)}%)
              </span>
            </span>
            <span className="text-sm font-bold tabular-nums text-slate-800">
              {rupiah(perTx)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#1A9E9E]/15 pt-3">
            <span className="text-xs font-semibold text-slate-600">
              Total komisi / bulan
              <span className="ml-1 font-normal text-slate-400">
                × {count}
              </span>
            </span>
            <span className="text-xl font-extrabold tabular-nums text-[#147878]">
              {rupiah(monthly)}
            </span>
          </div>
        </div>

        {/* Dashboard-only: naik tier upsell */}
        {isLocked && up !== null && count > 0 && (
          <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
            <TrendingUp className="h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs leading-relaxed text-amber-800">
              Naik ke tier <b>{tierLabel(up)}</b> → komisi jadi{" "}
              <b className="tabular-nums">{rupiah(upMonthly)}</b>/bulan.
            </p>
          </div>
        )}

        <p className="text-[11px] leading-relaxed text-slate-400">
          Estimasi berdasarkan harga referensi produk. Komisi aktual dihitung
          dari nilai transaksi yang benar-benar masuk lewat link referral kamu.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}
