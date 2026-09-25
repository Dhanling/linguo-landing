// [elearning-sampul-v1] Pasang sampul kartu E-Learning rancangan desainer.
//
// Sumber: folder berisi "<NAMA BAHASA> A1.png" (mis. ~/Downloads/COVER E-LEARNING).
// Slug produk = "elearning-" + nama bahasa huruf kecil (THAILAND → elearning-thailand).
// Sama seperti ebook-sampul-kartu.mjs: dikecilkan ke 800 px JPEG q86 dulu — PNG
// mentah ±2 MB per kartu bikin grid Perpustakaan puluhan MB.
//
// Pakai: node scripts/elearning-sampul-kartu.mjs "<folder>"
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const dir = process.argv[2];
let gagal = 0;
for (const f of readdirSync(dir).filter((x) => /\.png$/i.test(x)).sort()) {
  const nama = f.replace(/\s*A1\.png$/i, "").trim().toLowerCase();
  const prod = `elearning-${nama}`;
  try {
    const buf = await sharp(join(dir, f))
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({ quality: 86, mozjpeg: true })
      .toBuffer();
    const objek = `elearning-covers/${prod}.jpg`;
    const { error } = await sb.storage.from("lms-media")
      .upload(objek, buf, { contentType: "image/jpeg", upsert: true, cacheControl: "3600" });
    if (error) throw new Error(error.message);
    const url = sb.storage.from("lms-media").getPublicUrl(objek).data.publicUrl;
    const { data, error: e2 } = await sb.from("digital_products")
      .update({ cover_url: `${url}?v=${Date.now()}` }).eq("slug", prod).select("slug");
    if (e2) throw new Error(e2.message);
    if (!data?.length) throw new Error("produk tidak ditemukan");
    console.log(`OK ${prod} (${Math.round(buf.length / 1024)} KB)`);
  } catch (e) { gagal++; console.log(`GAGAL ${prod}: ${e.message}`); }
}
console.log(`selesai. gagal=${gagal}`);
