#!/usr/bin/env node
// [ebook-modul-rakitan-menang-v1] Kembalikan `file_url` modul rakitan sendiri ke
// BERKAS STORAGE-nya, supaya yang terbuka di Perpustakaan adalah e-book
// interaktif (reader di dashboard: ketuk kata, TTS, latihan), bukan PDF lama di
// Google Drive.
//
// Kenapa perlu: `externalLinkFor()` selalu memenangkan URL http di `file_url`
// atas berkas di bucket `ebook-files` — satu link Drive yang tertempel (atau
// tersisa dari katalog lama) mematikan reader tanpa gejala apa pun dari sisi
// admin, kolomnya kelihatan terisi wajar. 2 Sep 2026 empat modul kena:
// French 101, Persian 101, Portuguese 101, Levantine Arabic 101 — semuanya
// sudah punya PDF + latihan rakitan sendiri di bucket.
//
// Sumber kebenarannya `content/ebook/<slug>/meta.json` (`product.slug` +
// `product.file`) — persis yang dipakai `ebook-publish.mjs terbit`. Jadi skrip
// ini aman diulang: baris yang sudah menunjuk berkasnya sendiri dilewati.
//
// Pakai:
//   node scripts/fix-link-ebook-storage.mjs              # periksa saja
//   node scripts/fix-link-ebook-storage.mjs --terapkan   # perbaiki

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = "ebook-files";
const TERAPKAN = process.argv.includes("--terapkan");

const isUrl = (s) => /^https?:\/\//i.test((s ?? "").trim());

// --- isi bucket (nama → ukuran) --------------------------------------------
const objek = new Map();
for (let off = 0; ; off += 1000) {
  const { data, error } = await sb.storage.from(BUCKET).list("", { limit: 1000, offset: off });
  if (error) { console.error("baca bucket gagal:", error.message); process.exit(1); }
  for (const o of data) objek.set(o.name, o.metadata?.size ?? 0);
  if (data.length < 1000) break;
}

// --- baris produk -----------------------------------------------------------
const { data: produk, error } = await sb
  .from("digital_products")
  .select("id,slug,title,file_url,pages,level,file_size_mb");
if (error) { console.error("baca produk gagal:", error.message); process.exit(1); }
const bySlug = new Map(produk.map((p) => [p.slug, p]));

let beres = 0, gagal = 0, cocok = 0;
for (const dir of readdirSync("content/ebook").sort()) {
  const jalurMeta = `content/ebook/${dir}/meta.json`;
  if (!existsSync(jalurMeta)) continue;
  const meta = JSON.parse(readFileSync(jalurMeta, "utf8"));
  const slugProduk = meta?.product?.slug ?? dir;
  const berkas = meta?.product?.file ?? `${dir}.pdf`;

  const row = bySlug.get(slugProduk);
  if (!row) { console.log(`? ${dir}: produk "${slugProduk}" tidak ada di DB — belum diterbitkan`); continue; }
  if ((row.file_url ?? "").trim() === berkas) { cocok++; continue; }

  // Jangan pernah menunjuk berkas yang tidak ada: itu menukar "modul lama"
  // dengan "modul hilang" — lebih buruk dari keadaan sekarang.
  if (!objek.has(berkas)) {
    console.log(`✗ ${dir} → ${slugProduk}: ${berkas} BELUM ada di bucket, dilewati`);
    gagal++;
    continue;
  }

  const patch = {
    file_url: berkas,
    file_size_mb: Math.round((objek.get(berkas) / 1024 / 1024) * 100) / 100,
  };
  // Katalog lama menyimpan jumlah halaman & level edisi Drive-nya; ikutkan
  // angka rakitan supaya kartu produknya tidak lagi berbohong.
  if (meta?.product?.pages) patch.pages = meta.product.pages;
  if (meta?.product?.level) patch.level = meta.product.level;

  const label = `${dir} → ${slugProduk} · "${row.title}"`;
  if (!TERAPKAN) {
    console.log(`• ${label}\n    ${isUrl(row.file_url) ? "LINK DRIVE (reader mati)" : "beda berkas"}: ${row.file_url}\n    → ${berkas} (${patch.file_size_mb} MB)`);
    beres++;
    continue;
  }
  const { error: eU } = await sb.from("digital_products").update(patch).eq("id", row.id);
  if (eU) { console.error(`✗ ${label}: ${eU.message}`); gagal++; continue; }
  console.log(`✓ ${label} → ${berkas} (${patch.file_size_mb} MB)`);
  beres++;
}

console.log(`\nsudah benar: ${cocok} · ${TERAPKAN ? "diperbaiki" : "perlu diperbaiki"}: ${beres} · gagal: ${gagal}`);
if (!TERAPKAN && beres > 0) console.log("jalankan ulang dengan --terapkan untuk memperbaiki.");
