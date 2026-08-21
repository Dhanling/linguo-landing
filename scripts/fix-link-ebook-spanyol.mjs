#!/usr/bin/env node
// [ebook-link-tertukar-v1] Perbaikan sekali jalan: link Drive modul SERBIA
// ke-paste juga ke dua baris produk Spanyol (21 Agu 2026, 03:2x). Akibatnya
// siswa yang membuka "Español 101" mendarat di "Introduction to Serbian
// Grammar.pdf" — dan modul interaktifnya (PDF + latihan di bucket) ikut
// terkubur karena link eksternal selalu menang atas berkas storage.
//
// Dikembalikan ke berkas milik sendiri: espanol-101-a1-id.pdf di bucket
// ebook-files, yang punya berkas latihan pendamping juga.
//
// Pakai: node scripts/fix-link-ebook-spanyol.mjs

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const BERKAS = "espanol-101-a1-id.pdf";
const SLUG = ["espanol-101-a1-id", "modul-spanyol-101-id"];

for (const slug of SLUG) {
  const { data, error } = await sb
    .from("digital_products")
    .update({ file_url: BERKAS, pages: 42, file_size_mb: 1.54 })
    .eq("slug", slug)
    .select("slug,title,file_url")
    .single();
  console.log(error ? `✗ ${slug}: ${error.message}` : `✓ ${data.slug} → ${data.file_url}`);
}

const { data: cek } = await sb
  .from("digital_products")
  .select("slug,language,file_url")
  .in("slug", [...SLUG, "modul-serbia-101-id"]);
console.log(JSON.stringify(cek, null, 1));
