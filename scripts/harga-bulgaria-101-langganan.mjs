#!/usr/bin/env node
// [harga-new-edition-langganan-v1] Memasang harga langganan untuk
// "Bulgarian 101 new edition" — pola yang sama dengan Japanese, Spanish, English,
// Dansk, German, Italiano, Norsk, Suomi, Georgian, Uzbek, Myanmar & Khmer 101.
//
// Memakai pola Khmer, bukan pola Français: katalog SAMA SEKALI belum punya baris
// bahasa Bulgaria — tak ada edisi Inggris, tak ada warisan "Lifetime Rp99.000"
// yang perlu diarsipkan. Skrip ini murni memasang tiga tier baru untuk produk
// yang baru lahir 27 Agu 2026.
//
// Pakai: node scripts/harga-bulgaria-101-langganan.mjs
// Kembarannya dalam SQL: sql/20260827-harga-bulgaria-101-langganan.sql

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const PID = "51d12821-e12f-4670-a776-8d92e22d7c48"; // modul-bulgaria-101-id

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
