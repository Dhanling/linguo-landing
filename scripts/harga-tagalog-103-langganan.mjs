#!/usr/bin/env node
// [harga-new-edition-langganan-v1] Harga "Tagalog 103 new edition" (tingkat B1),
// berformat langganan sama seperti seluruh seri new edition yang lain.
//
// Level baru = baris katalog BARU (slug tagalog-103-b1-id). Baris A1
// (tagalog-101-a1-id) dan baris warisan berbahasa Inggris (modul-tagalog-101-en)
// TIDAK disentuh, jadi tak ada tier warisan yang perlu diarsipkan di sini.
//
// Pakai: node scripts/harga-tagalog-103-langganan.mjs
// Kembarannya dalam SQL: sql/20260830-harga-tagalog-103-langganan.sql

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const PID = "f23944c1-f601-4df9-b478-cc6d421e5639"; // tagalog-103-b1-id

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
