#!/usr/bin/env node
// [judul-ebook-inggris-v1] Menyeragamkan judul modul "101 new edition" ke nama
// bahasa dalam bahasa Inggris supaya gampang dicari di katalog/Pustaka.
// Contoh: "Magyar 101 new edition" → "Hungarian 101 new edition".
//
// Slug TIDAK diubah (link lama & pembeli lama tetap aman), begitu juga sampul.
//
// Pakai: node scripts/judul-ebook-inggris.mjs

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// judul lama → judul baru (hanya yang belum berbahasa Inggris)
const GANTI = {
  "Dansk 101 new edition": "Danish 101 new edition",
  "Français 101 new edition": "French 101 new edition",
  "Íslenska 101 new edition": "Icelandic 101 new edition",
  "Italiano 101 new edition": "Italian 101 new edition",
  "Magyar 101 new edition": "Hungarian 101 new edition",
  "Norsk 101 new edition": "Norwegian 101 new edition",
  "Polski 101 new edition": "Polish 101 new edition",
  "Português 101 new edition": "Portuguese 101 new edition",
  "Português do Brasil 101 new edition": "Brazilian Portuguese 101 new edition",
  "Suomi 101 new edition": "Finnish 101 new edition",
  "Tiếng Việt 101 new edition": "Vietnamese 101 new edition",
  "ภาษาไทย 101 new edition": "Thai 101 new edition",
};

const { data, error } = await sb
  .from("digital_products")
  .select("id,title,slug")
  .ilike("title", "%101 new edition%")
  .order("title");
if (error) { console.error("gagal baca:", error.message); process.exit(1); }

let diubah = 0;
for (const p of data) {
  const baru = GANTI[p.title];
  if (!baru) continue;
  const { error: eTulis } = await sb
    .from("digital_products")
    .update({ title: baru })
    .eq("id", p.id)
    .select("id");
  if (eTulis) { console.error(`gagal ubah ${p.slug}:`, eTulis.message); process.exit(1); }
  console.log(`${p.title}  →  ${baru}   (${p.slug})`);
  diubah++;
}

console.log(diubah ? `\n${diubah} judul diperbarui.` : "\nTak ada yang perlu diubah.");
