#!/usr/bin/env node
// [harga-new-edition-langganan-v2] Tier harga langganan untuk SATU produk e-book
// yang dicari lewat slug — generalisasi harga-ielts-prep-langganan.mjs supaya
// modul persiapan tes berikutnya (TOEFL ITP Prep, dst.) tak perlu skrip baru.
// Pola yang sama dengan seluruh modul "101 new edition":
// 6 bulan Rp79rb · 12 bulan Rp149rb · Selamanya Rp249rb (lihat ebook-harga-3-tier-baku).
//
// Dijalankan SESUDAH `node scripts/ebook-publish.mjs terbit <slug-folder>` —
// id produknya baru lahir di situ. Tier lawas (kalau ada) TIDAK dihapus, cuma
// dibiarkan; skrip ini berhenti kalau tier 180 hari yang aktif sudah ada.
//
// Pakai: node scripts/harga-ebook-langganan.mjs <slug-produk>
//        node scripts/harga-ebook-langganan.mjs modul-toefl-itp-prep-id

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const SLUG = process.argv[2];
if (!SLUG) { console.error("pakai: node scripts/harga-ebook-langganan.mjs <slug-produk>"); process.exit(1); }
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
