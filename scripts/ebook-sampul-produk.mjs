#!/usr/bin/env node
// [ebook-sampul-produk-v1] Memasang sampul rancangan ke KARTU produk digital.
//
// Bedakan dari sampul PDF: `content/ebook/<slug>/cover.(jpg|png)` jadi halaman 1
// modul cetak, sedangkan yang ini mengisi `digital_products.cover_url` — gambar
// yang tampil di kartu Perpustakaan, /toko, dan keranjang. Selama cover_url
// kosong, kartunya jatuh ke foto stok bahasa (lib/lang-visuals), jadi sampul
// buatan desainer tak pernah kelihatan.
//
// ⚠️ Bucket `ebook-files` PRIVAT — sampul tidak bisa dititip di sana, kartunya
// bakal kosong. Dipakai `lms-media` yang publik.
//
// Pakai: node scripts/ebook-sampul-produk.mjs <slug-modul> <slug-produk> [berkas]
//   contoh: node scripts/ebook-sampul-produk.mjs en-a1 modul-inggris-101-id

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "lms-media";
const FOLDER = "ebook-covers";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const [modul, slugProduk, berkasArg] = process.argv.slice(2);
if (!modul || !slugProduk) {
  console.error("pakai: node scripts/ebook-sampul-produk.mjs <slug-modul> <slug-produk> [berkas]");
  process.exit(1);
}

const kandidat = berkasArg
  ? [berkasArg]
  : ["cover.jpg", "cover.jpeg", "cover.png", "cover.webp"].map((f) => `content/ebook/${modul}/${f}`);
const berkas = kandidat.find((p) => existsSync(p));
if (!berkas) { console.error(`sampul tidak ketemu: ${kandidat.join(", ")}`); process.exit(1); }

const ext = berkas.split(".").pop().toLowerCase();
const mime = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" }[ext];
const objek = `${FOLDER}/${slugProduk}.${ext}`;

const bytes = readFileSync(berkas);
const { error: eUp } = await sb.storage.from(BUCKET)
  .upload(objek, bytes, { contentType: mime, upsert: true, cacheControl: "3600" });
if (eUp) { console.error("unggah gagal:", eUp.message); process.exit(1); }

const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(objek);
const url = pub.publicUrl;

const { data, error } = await sb.from("digital_products")
  .update({ cover_url: url })
  .eq("slug", slugProduk)
  .select("id,title,cover_url")
  .single();
if (error) { console.error("gagal pasang cover_url:", error.message); process.exit(1); }

console.log(`✓ unggah ${objek} (${Math.round(bytes.length / 1024)} KB)`);
console.log(`✓ ${data.title} → ${data.cover_url}`);
