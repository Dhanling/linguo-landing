#!/usr/bin/env node
// [judul-ebook-inggris-v2] Menyeragamkan judul modul "101 new edition" jadi
// "<Nama bahasa Inggris> <nomor> - <level CEFR>".
// Contoh: "Magyar 101 new edition" → "Hungarian 101 - A1",
//         "English 102 new edition" → "English 102 - A2".
//
// Slug TIDAK diubah (link lama & pembeli lama tetap aman), begitu juga sampul
// dan judul sampul PDF (meta.title) yang memang sengaja pakai aksara asli.
//
// Diubah: content/ebook/<kode>/meta.json → product.title, lalu kolom
// digital_products.title di Supabase (dicocokkan lewat slug).
//
// Pakai: node scripts/judul-ebook-inggris.mjs [--tulis]
//        tanpa --tulis = pratinjau saja.

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
}

const TULIS = process.argv.includes("--tulis");
const AKAR = "content/ebook";

// kode folder → nama bahasa baku dalam bahasa Inggris
const NAMA = {
  apc: "Levantine Arabic",
  ar: "Arabic",
  "ar-eg": "Egyptian Arabic",
  bg: "Bulgarian",
  bn: "Bengali",
  cs: "Czech",
  da: "Danish",
  de: "German",
  el: "Greek",
  en: "English",
  es: "Spanish",
  et: "Estonian",
  eu: "Basque",
  fa: "Persian",
  fi: "Finnish",
  fr: "French",
  he: "Hebrew",
  hi: "Hindi",
  hu: "Hungarian",
  id: "Indonesian",
  is: "Icelandic",
  it: "Italian",
  ja: "Japanese",
  jv: "Javanese",
  ka: "Georgian",
  km: "Khmer",
  ko: "Korean",
  lo: "Lao",
  mn: "Mongolian",
  ms: "Malay",
  my: "Burmese",
  nl: "Dutch",
  no: "Norwegian",
  pl: "Polish",
  ps: "Pashto",
  pt: "Portuguese",
  "pt-br": "Brazilian Portuguese",
  ru: "Russian",
  sk: "Slovak",
  sl: "Slovenian",
  su: "Sundanese",
  sv: "Swedish",
  sw: "Swahili",
  th: "Thai",
  tl: "Tagalog",
  tr: "Turkish",
  uk: "Ukrainian",
  ur: "Urdu",
  uz: "Uzbek",
  vi: "Vietnamese",
  yue: "Cantonese",
  zh: "Mandarin",
  "zh-tw": "Taiwanese Mandarin",
};

const perubahan = [];

for (const folder of readdirSync(AKAR).sort()) {
  const berkas = path.join(AKAR, folder, "meta.json");
  if (!existsSync(berkas)) continue;
  const mentah = readFileSync(berkas, "utf8");
  const meta = JSON.parse(mentah);
  const p = meta.product;
  if (!p?.title || !p?.slug) continue;
  if (!/\b10\d\b/.test(p.title)) continue; // cuma seri 101/102/…

  // kode bahasa = folder tanpa ekor level (mis. "pt-br-a1" → "pt-br")
  const kode = folder.replace(/-(a1|a2|b1|b2|c1|c2)$/i, "");
  const nama = NAMA[kode];
  if (!nama) {
    console.error(`⚠️  belum ada nama Inggris untuk folder ${folder} — dilewati`);
    continue;
  }
  const nomor = p.title.match(/\b(10\d)\b/)?.[1];
  const level = (p.level || "").toUpperCase();
  if (!nomor || !level) {
    console.error(`⚠️  ${folder}: nomor/level tak lengkap — dilewati`);
    continue;
  }
  const baru = `${nama} ${nomor} - ${level}`;
  if (baru === p.title) continue;

  perubahan.push({ folder, slug: p.slug, lama: p.title, baru });
  if (TULIS) {
    // ganti hanya baris title di dalam blok product supaya format berkas utuh
    const ubah = mentah.replace(
      new RegExp(`("title"\\s*:\\s*)${JSON.stringify(p.title).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
      (_, awal) => awal + JSON.stringify(baru),
    );
    if (ubah === mentah) {
      console.error(`⚠️  ${folder}: gagal menulis judul baru ke meta.json`);
      continue;
    }
    writeFileSync(berkas, ubah);
  }
}

for (const c of perubahan) console.log(`${c.lama}  →  ${c.baru}   (${c.slug})`);
console.log(`\n${perubahan.length} judul${TULIS ? " diperbarui di meta.json" : " akan diubah (pratinjau)"}.`);

if (!TULIS) {
  console.log("Jalankan ulang dengan --tulis untuk menyimpan + sinkron ke Supabase.");
  process.exit(0);
}

// ── sinkron ke Supabase ─────────────────────────────────────────────────────
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
let sinkron = 0;
for (const c of perubahan) {
  const { data, error } = await sb
    .from("digital_products")
    .update({ title: c.baru })
    .eq("slug", c.slug)
    .select("id");
  if (error) { console.error(`gagal ubah ${c.slug}:`, error.message); process.exit(1); }
  if (!data?.length) { console.error(`⚠️  slug ${c.slug} tak ditemukan di digital_products`); continue; }
  sinkron++;
}
console.log(`${sinkron} judul disinkronkan ke Supabase.`);
