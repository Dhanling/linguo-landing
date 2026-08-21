#!/usr/bin/env node
// [ebook-link-tertukar-v1] Pemeriksa link produk digital.
//
// Kejadian yang melahirkannya: satu link Google Drive berisi modul Serbia
// tertempel di tiga baris produk (Serbia, Spanyol, Español 101). Dari sisi
// admin semuanya tampak beres — kolomnya terisi — dan barunya ketahuan waktu
// siswa membuka e-book Spanyol dan yang keluar tata bahasa Serbia.
//
// Link kembar antar-produk hampir selalu salah tempel: satu berkas Drive =
// satu modul = satu produk. Skrip ini menyebutnya di muka, bukan menunggu
// laporan siswa.
//
// Pakai: node scripts/audit-ebook-links.mjs

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await sb
  .from("digital_products")
  .select("id,slug,title,type,language,file_url,video_playlist_url,is_active")
  .eq("is_active", true)
  .order("slug");
if (error) { console.error(error.message); process.exit(1); }

const isUrl = (s) => /^https?:\/\//i.test((s ?? "").trim());
// Dua bentuk link Drive ke berkas yang sama ("/view?usp=sharing" vs
// "?usp=share_link") tetap berkas yang sama — yang dibandingkan id-nya.
const kunci = (s) => {
  const v = (s ?? "").trim();
  const drive = /drive\.google\.com\/file\/d\/([^/?#]+)/i.exec(v);
  if (drive) return `drive:${drive[1]}`;
  const list = /[?&]list=([^&]+)/i.exec(v);
  if (list) return `yt:${list[1]}`;
  return v.toLowerCase().replace(/\/+$/, "");
};

let temuan = 0;
const peta = new Map();
for (const p of data) {
  for (const kolom of ["file_url", "video_playlist_url"]) {
    const v = p[kolom];
    if (!v || !isUrl(v)) continue;
    const k = kunci(v);
    (peta.get(k) ?? peta.set(k, []).get(k)).push(`${p.slug} [${p.language ?? "-"}] .${kolom}`);
  }
}
for (const [k, baris] of peta) {
  if (baris.length < 2) continue;
  temuan++;
  console.log(`⚠️  LINK KEMBAR ${k}`);
  for (const b of baris) console.log(`      ${b}`);
}

// Berkas storage yang barisnya menunjuk ke sana tapi objeknya tak ada di
// bucket = e-book yang dibeli lalu tak bisa dibuka.
const { data: isiBucket } = await sb.storage.from("ebook-files").list("", { limit: 1000 });
const adaBerkas = new Set((isiBucket ?? []).map((f) => f.name));
for (const p of data) {
  const v = (p.file_url ?? "").trim();
  if (p.type !== "ebook" || !v || isUrl(v)) continue;
  if (/placeholder/i.test(v)) { console.log(`·   belum diisi: ${p.slug} → ${v}`); continue; }
  if (!adaBerkas.has(v)) { temuan++; console.log(`⚠️  BERKAS HILANG di bucket: ${p.slug} → ${v}`); }
}

console.log(temuan === 0 ? "\n✓ tidak ada link kembar / berkas hilang" : `\n${temuan} temuan perlu dibereskan`);
