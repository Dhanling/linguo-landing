#!/usr/bin/env node
// [harga-new-edition-langganan-v1] Memasang harga langganan untuk
// "Tiếng Việt 101 new edition" — pola yang sama dengan Norsk, Korean & Russian
// 101 new edition, yaitu modul yang memakai SLUG LAMA.
//
// Katalog sudah punya `modul-vietnam-101-id` dengan satu tier warisan
// "Lifetime Rp99.000" yang SUDAH PUNYA PEMBELI. Tier itu TIDAK DIHAPUS —
// `digital_purchases.pricing_id` menunjuknya — melainkan di-set is_active=false
// supaya berhenti dijual tanpa memutus riwayat pembelian.
//
// Pakai: node scripts/harga-tieng-viet-101-langganan.mjs
// Kembarannya dalam SQL: sql/20260824-harga-tieng-viet-101-langganan.sql

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const PID = "67b9d3c8-e61d-4cde-a7df-f850a2a27411"; // modul-vietnam-101-id
const WARISAN = "71a63bcf-3b68-40e6-92a6-1ab5882060ca"; // Lifetime Rp99.000

const TIER = [
  { price: 79000, duration_days: 180, display_label: "6 Bulan", sort_order: 1 },
  { price: 149000, duration_days: 365, display_label: "12 Bulan", sort_order: 2 },
  { price: 249000, duration_days: null, display_label: "Selamanya", sort_order: 3 },
];

const { data: sebelum, error: eBaca } = await sb
  .from("digital_product_pricing")
  .select("id,price,duration_days,display_label,is_active")
  .eq("product_id", PID);
if (eBaca) { console.error("gagal baca:", eBaca.message); process.exit(1); }

// Aman dijalankan dua kali.
if (sebelum.some((t) => t.is_active !== false && t.duration_days === 180)) {
  console.log("Sudah berformat langganan, tak ada yang diubah.");
  process.exit(0);
}

const { error: eArsip } = await sb
  .from("digital_product_pricing")
  .update({ is_active: false })
  .eq("id", WARISAN);
if (eArsip) { console.error("gagal arsipkan tier warisan:", eArsip.message); process.exit(1); }

const { error: eIsi } = await sb
  .from("digital_product_pricing")
  .insert(TIER.map((t) => ({ ...t, product_id: PID, is_active: true })));
if (eIsi) { console.error("gagal pasang tier:", eIsi.message); process.exit(1); }

const { data: sesudah } = await sb
  .from("digital_product_pricing")
  .select("price,duration_days,display_label,sort_order,is_active")
  .eq("product_id", PID)
  .order("sort_order");
console.table(sesudah);
