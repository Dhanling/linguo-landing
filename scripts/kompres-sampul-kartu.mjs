// [kompres-sampul-kartu-v1] Kompres ulang gambar kartu produk yang sudah
// terpasang di `digital_products.cover_url` (bucket publik `lms-media`).
//
// Kartu dirender ~300 px, tapi banyak sampul terunggah utuh (PNG ±3 MB atau
// JPEG 1051 px ±800 KB). Skrip ini mengunduh objek yang terpasang, menyusutkan
// ke lebar 800 px JPEG mozjpeg q82, mengunggahnya sebagai `<folder>/<slug>.jpg`,
// lalu memperbarui `cover_url` (+ `?v=` agar cache lepas).
//
// Pakai:
//   node scripts/kompres-sampul-kartu.mjs                # uji kering, cuma daftar
//   node scripts/kompres-sampul-kartu.mjs --jalan        # kompres + pasang
//   node scripts/kompres-sampul-kartu.mjs --hapus-yatim  # hapus objek di
//       ebook-covers/ & elearning-covers/ yang tak dirujuk cover_url mana pun
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const JALAN = process.argv.includes("--jalan");
const HAPUS = process.argv.includes("--hapus-yatim");
const FOLDER = ["ebook-covers", "elearning-covers"];
const BATAS = 200 * 1024; // di bawah ini dianggap sudah ringan

const { data: produk, error } = await sb.from("digital_products").select("slug,cover_url");
if (error) { console.error(error.message); process.exit(1); }
const objekDari = (u) => u?.match(/\/lms-media\/([^?]+)/)?.[1];

if (HAPUS) {
  const dipakai = new Set(produk.map((p) => objekDari(p.cover_url)).filter(Boolean));
  let n = 0, byte = 0;
  for (const f of FOLDER) {
    const { data: isi } = await sb.storage.from("lms-media").list(f, { limit: 1000 });
    const yatim = isi.filter((o) => o.id && !dipakai.has(`${f}/${o.name}`));
    for (const o of yatim) byte += o.metadata?.size || 0;
    for (let i = 0; i < yatim.length; i += 100) {
      const { error: e } = await sb.storage.from("lms-media")
        .remove(yatim.slice(i, i + 100).map((o) => `${f}/${o.name}`));
      if (e) { console.error(`gagal hapus ${f}:`, e.message); process.exit(1); }
    }
    n += yatim.length;
  }
  console.log(`dihapus ${n} objek yatim (${(byte / 1e6).toFixed(1)} MB)`);
  process.exit(0);
}

let hemat = 0, gagal = 0;
for (const p of produk) {
  const objek = objekDari(p.cover_url);
  if (!objek || !FOLDER.includes(objek.split("/")[0])) continue;
  try {
    const { data: blob, error: e1 } = await sb.storage.from("lms-media").download(objek);
    if (e1) throw new Error(`unduh: ${e1.message}`);
    const asal = Buffer.from(await blob.arrayBuffer());
    if (asal.length <= BATAS && objek.endsWith(".jpg")) continue;
    const baru = await sharp(asal).rotate()
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true, progressive: true }).toBuffer();
    hemat += asal.length - baru.length;
    console.log(`${p.slug}: ${objek} ${Math.round(asal.length / 1024)} KB -> ${Math.round(baru.length / 1024)} KB`);
    if (!JALAN) continue;
    const tujuan = objek.replace(/\.[a-z]+$/i, ".jpg");
    const { error: e2 } = await sb.storage.from("lms-media")
      .upload(tujuan, baru, { contentType: "image/jpeg", upsert: true, cacheControl: "3600" });
    if (e2) throw new Error(`unggah: ${e2.message}`);
    const url = sb.storage.from("lms-media").getPublicUrl(tujuan).data.publicUrl;
    const { error: e3 } = await sb.from("digital_products")
      .update({ cover_url: `${url}?v=${Date.now()}` }).eq("slug", p.slug);
    if (e3) throw new Error(`cover_url: ${e3.message}`);
  } catch (err) {
    gagal++;
    console.log(`GAGAL ${p.slug}: ${err.message}`);
  }
}
console.log(`${JALAN ? "selesai" : "uji kering"} — hemat ${(hemat / 1e6).toFixed(1)} MB, gagal=${gagal}`);
