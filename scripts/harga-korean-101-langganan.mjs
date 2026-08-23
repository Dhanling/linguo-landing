#!/usr/bin/env node
// [harga-new-edition-langganan-v1] Menjadikan harga "Korean 101 new edition"
// berformat langganan, sama seperti Japanese 101, Spanish 101, English 101, Deutsch, Mandarin & Italiano new edition.
//
// Baris "Lifetime Rp99.000" adalah warisan baris katalog modul Korea lama
// (slug modul-korea-101-id dipakai ulang oleh edisi baru). Baris itu
// DINONAKTIFKAN, bukan dihapus: pembelian lama bisa menunjuk ke id-nya lewat
// digital_purchases.pricing_id, dan akses mereka menempel di expires_at.
//
// Pakai: node scripts/harga-korean-101-langganan.mjs
// Kembarannya dalam SQL: sql/20260823-harga-korean-101-langganan.sql

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const PID = "d6be5c16-49fb-472f-9095-a709ee57d0bc"; // modul-korea-101-id
const TIER_LAMA = "5b001b61-9f6d-415d-868b-679d257ff4d4"; // Lifetime Rp99.000

const TIER_BARU = [
  { price: 79000, duration_days: 180, display_label: "6 Bulan", sort_order: 1 },
  { price: 149000, duration_days: 365, display_label: "12 Bulan", sort_order: 2 },
  { price: 249000, duration_days: null, display_label: "Selamanya", sort_order: 3 },
];

const { data: sebelum, error: eBaca } = await sb
  .from("digital_product_pricing")
  .select("id,price,duration_days,display_label,is_active")
  .eq("product_id", PID);
if (eBaca) { console.error("gagal baca:", eBaca.message); process.exit(1); }

// Aman dijalankan dua kali: kalau tier langganannya sudah ada, berhenti.
const sudah = sebelum.filter((t) => t.is_active !== false && t.duration_days === 180);
if (sudah.length) {
  console.log("Sudah berformat langganan, tak ada yang diubah.");
  process.exit(0);
}

const { error: eArsip } = await sb
  .from("digital_product_pricing")
  .update({ is_active: false })
  .eq("id", TIER_LAMA);
if (eArsip) { console.error("gagal arsipkan tier lama:", eArsip.message); process.exit(1); }

const { error: eIsi } = await sb
  .from("digital_product_pricing")
  .insert(TIER_BARU.map((t) => ({ ...t, product_id: PID, is_active: true })));
if (eIsi) { console.error("gagal pasang tier baru:", eIsi.message); process.exit(1); }

const { data: sesudah } = await sb
  .from("digital_product_pricing")
  .select("price,duration_days,display_label,sort_order,is_active")
  .eq("product_id", PID)
  .order("sort_order");
for (const t of sesudah ?? []) {
  console.log(`${t.is_active ? "aktif " : "arsip "} Rp${t.price} | ${t.duration_days ?? "selamanya"} | ${t.display_label}`);
}
