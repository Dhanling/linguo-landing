// [ebook-ganti-sampul-v1] Pasang sampul rancangan desainer ke SATU modul yang
// sudah terbit: unggah ulang PDF-nya (halaman 1 sudah ditukar sampul baru) dan
// pasang gambar kartu produknya sekalian.
//
// Bedanya dengan `ebook-sampul-produk.mjs`: yang itu hanya menyentuh
// `cover_url` (kartu di /toko & Perpustakaan), yang ini juga mendorong PDF
// rakitan ke bucket supaya halaman pertama modul yang diunduh ikut berganti.
//
// Nama berkas di bucket diambil dari `digital_products.file_url` — untuk produk
// warisan (`modul-*`) namanya TIDAK sama dengan slug produk.
//
// Pakai: node scripts/ebook-ganti-sampul.mjs <manifes.tsv>
//   manifes = baris "<slug-modul>	<slug-produk>	<berkas sumber>"; kolom
//   ketiga hanya catatan asal berkas, yang diunggah selalu
//   `content/ebook/<slug-modul>/cover.png` + `dist/ebook/<slug-modul>.pdf`.
//   Contoh manifes: scripts/sampul-ebook-2026-09.tsv
//
// Sesudah ini rakit ulang potongan pratinjaunya:
//   node scripts/build-ebook-pratinjau.mjs --paksa <slug-produk>
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const rows = readFileSync(process.argv[2], "utf8").trim().split("\n").map((l) => l.split("\t"));
const { data: produk, error: eSel } = await sb.from("digital_products")
  .select("slug,file_url,title").in("slug", rows.map((r) => r[1]));
if (eSel) { console.error("gagal baca produk:", eSel.message); process.exit(1); }
const byslug = Object.fromEntries(produk.map((p) => [p.slug, p]));

let gagal = 0;
for (const [mod, prod] of rows) {
  const p = byslug[prod];
  try {
    const berkas = p.file_url.replace(/^.*\//, "");
    const pdf = readFileSync(`dist/ebook/${mod}.pdf`);
    const { error } = await sb.storage.from("ebook-files")
      .upload(berkas, pdf, { contentType: "application/pdf", upsert: true });
    if (error) throw new Error(`PDF: ${error.message}`);

    const png = readFileSync(`content/ebook/${mod}/cover.png`);
    const objek = `ebook-covers/${prod}.png`;
    const { error: e2 } = await sb.storage.from("lms-media")
      .upload(objek, png, { contentType: "image/png", upsert: true, cacheControl: "3600" });
    if (e2) throw new Error(`sampul: ${e2.message}`);
    const url = sb.storage.from("lms-media").getPublicUrl(objek).data.publicUrl;
    // ?v= memaksa kartu lama melewati cache CDN & <img> browser
    const { error: e3 } = await sb.from("digital_products")
      .update({ cover_url: `${url}?v=${Date.now()}` }).eq("slug", prod);
    if (e3) throw new Error(`cover_url: ${e3.message}`);

    console.log(`OK ${mod} -> ${berkas} (${Math.round(pdf.length / 1024)} KB) · ${p.title}`);
  } catch (err) {
    gagal++;
    console.log(`GAGAL ${mod} -> ${prod}: ${err.message}`);
  }
}
console.log(`selesai. gagal=${gagal}`);
