#!/usr/bin/env node
// [harga-new-edition-langganan-v1] Tier harga "IELTS Prep - Band 6.5+" (slug
// modul-ielts-prep-id) — pola langganan yang sama dengan seluruh modul "101 new
// edition": 6 bulan Rp79rb · 12 bulan Rp149rb · Selamanya Rp249rb, supaya blok
// knowledge e-book di bot/AI tak perlu diubah.
//
// Produk ini BARU (tak ada baris warisan), jadi tidak ada tier yang diarsipkan.
// Dicari lewat slug, bukan id yang ditulis mati: skrip ini dijalankan SESUDAH
// `node scripts/ebook-publish.mjs terbit ielts-prep`, dan id-nya baru lahir di situ.
//
// Pakai: node scripts/harga-ielts-prep-langganan.mjs
// Kembarannya dalam SQL: sql/20260910-harga-ielts-prep-langganan.sql

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const SLUG = "modul-ielts-prep-id";
const TIER = [
  { price: 79000, duration_days: 180, display_label: "6 Bulan", sort_order: 1 },
  { price: 149000, duration_days: 365, display_label: "12 Bulan", sort_order: 2 },
  { price: 249000, duration_days: null, display_label: "Selamanya", sort_order: 3 },
];

const { data: prod, error: eProd } = await sb.from("digital_products").select("id,title").eq("slug", SLUG).maybeSingle();
if (eProd) { console.error("gagal baca produk:", eProd.message); process.exit(1); }
if (!prod) { console.error(`produk ${SLUG} belum ada — terbitkan dulu`); process.exit(1); }

const { data: sebelum, error: eBaca } = await sb
  .from("digital_product_pricing").select("id,duration_days,is_active").eq("product_id", prod.id);
if (eBaca) { console.error("gagal baca tier:", eBaca.message); process.exit(1); }
if (sebelum.some((t) => t.is_active !== false && t.duration_days === 180)) {
  console.log("Sudah berformat langganan, tak ada yang diubah.");
  process.exit(0);
}

const { error: eIsi } = await sb.from("digital_product_pricing")
  .insert(TIER.map((t) => ({ ...t, product_id: prod.id, is_active: true })));
if (eIsi) { console.error("gagal pasang tier:", eIsi.message); process.exit(1); }

const { data: sesudah } = await sb.from("digital_product_pricing")
  .select("price,duration_days,display_label,sort_order,is_active").eq("product_id", prod.id).order("sort_order");
console.log(`${prod.title} (${prod.id})`);
for (const t of sesudah ?? []) console.log(`${t.is_active ? "aktif " : "arsip "} Rp${t.price} | ${t.duration_days ?? "selamanya"} | ${t.display_label}`);
