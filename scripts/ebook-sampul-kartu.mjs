// [ebook-sampul-kartu-v1] Pasang sampul KARTU produk — versi ringan.
//
// `ebook-ganti-sampul.mjs` mengurus PDF-nya; yang ini khusus gambar yang tampil
// di grid Perpustakaan, /toko, dan keranjang.
//
// ⚠️ Jangan unggah `cover.png` mentah ke sini. Sampul rancangan desainer ±3 MB
// per berkas, dan satu layar Perpustakaan memuat belasan kartu sekaligus —
// grid-nya jadi puluhan MB sekali buka. Kartu dirender ~300 px, jadi 800 px
// JPEG q86 (±290 KB) sudah lebih dari cukup untuk layar retina.
//
// Pakai: node scripts/ebook-sampul-kartu.mjs <manifes.tsv>
//   manifes = baris "<slug-modul>\t<slug-produk>[\t...]"; sumbernya selalu
//   `content/ebook/<slug-modul>/cover.png`.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const rows = readFileSync(process.argv[2], "utf8").trim().split("\n").map((l) => l.split("\t"));
let gagal = 0;
for (const [mod, prod] of rows) {
  try {
    const buf = await sharp(`content/ebook/${mod}/cover.png`)
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({ quality: 86, mozjpeg: true })
      .toBuffer();
    const objek = `ebook-covers/${prod}.jpg`;
    const { error } = await sb.storage.from("lms-media")
      .upload(objek, buf, { contentType: "image/jpeg", upsert: true, cacheControl: "3600" });
    if (error) throw new Error(error.message);
    const url = sb.storage.from("lms-media").getPublicUrl(objek).data.publicUrl;
    // ?v= memaksa kartu lama melewati cache CDN & <img> browser
    const { error: e2 } = await sb.from("digital_products")
      .update({ cover_url: `${url}?v=${Date.now()}` }).eq("slug", prod);
    if (e2) throw new Error(e2.message);
    console.log(`OK ${prod} (${Math.round(buf.length / 1024)} KB)`);
  } catch (e) { gagal++; console.log(`GAGAL ${prod}: ${e.message}`); }
}
console.log(`selesai. gagal=${gagal}`);
