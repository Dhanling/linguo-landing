#!/usr/bin/env node
// [harga-new-edition-langganan-v1] Memasang harga langganan untuk seri lanjutan
// "Greek 101 new edition" A2 · B1 · B2 — pola sama dengan A1
// (lihat scripts/harga-polski-102-104-langganan.mjs): 6 bln 79rb / 12 bln 149rb / selamanya 249rb.
//
// Slug baru semua (Yunani belum pernah punya baris A2/B1/B2 — A1 "modul-yunani-101-id" dan edisi lama "modul-yunani-101-en" A1-B1 tetap sendiri), jadi tak ada tier
// warisan yang perlu diarsipkan. Produk dicari lewat slug, aman dijalankan ulang.
//
// Pakai: node scripts/harga-greek-102-104-langganan.mjs [slug …]
// Kembarannya dalam SQL: sql/20260926-harga-greek-102-104-langganan.sql

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const SLUG = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["greek-102-a2-id", "greek-103-b1-id", "greek-104-b2-id"];

const TIER = [
  { price: 79000, duration_days: 180, display_label: "6 Bulan", sort_order: 1 },
  { price: 149000, duration_days: 365, display_label: "12 Bulan", sort_order: 2 },
  { price: 249000, duration_days: null, display_label: "Selamanya", sort_order: 3 },
];

for (const slug of SLUG) {
  const { data: p } = await sb.from("digital_products").select("id,title").eq("slug", slug).maybeSingle();
  if (!p) { console.log(`· ${slug}: produk belum terbit, dilewati`); continue; }

  const { data: sebelum, error: eBaca } = await sb
    .from("digital_product_pricing")
    .select("id,duration_days,is_active")
    .eq("product_id", p.id);
  if (eBaca) { console.error(`${slug}: gagal baca:`, eBaca.message); process.exit(1); }
  if (sebelum.some((t) => t.is_active !== false && t.duration_days === 180)) {
    console.log(`· ${slug}: sudah berformat langganan`);
    continue;
  }

  const { error: eIsi } = await sb
    .from("digital_product_pricing")
    .insert(TIER.map((t) => ({ ...t, product_id: p.id, is_active: true })));
  if (eIsi) { console.error(`${slug}: gagal pasang tier:`, eIsi.message); process.exit(1); }
  console.log(`✓ ${slug} (${p.title}): 3 tier terpasang`);
}
