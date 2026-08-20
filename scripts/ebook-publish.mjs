#!/usr/bin/env node
// [ebook-konten-v1] Penerbit modul: PDF rakitan → bucket → baris `digital_products`
// → hak baca satu siswa.
//
// Pelengkap `build-ebook-pdf.mjs` (merakit PDF) dan `ebook-pdf.mjs` (mencocokkan
// 46 produk lama ke berkasnya). Yang ini menerbitkan SATU modul buatan sendiri
// dari nol: unggah berkas, buat/segarkan produknya, lalu memberi akses.
//
// Pakai:
//   node scripts/ebook-publish.mjs status <slug>
//   node scripts/ebook-publish.mjs cari <kata> [nama-siswa]
//   node scripts/ebook-publish.mjs terbit <slug>            # unggah PDF + upsert produk
//   node scripts/ebook-publish.mjs beri-akses <slug> <email|student_id>
//
// ⚠️ Pemberian akses SENGAJA dua langkah: baris `digital_purchases` disisipkan
// "Belum Bayar" dulu, baru di-UPDATE jadi "Lunas". Trigger
// `sync_digital_purchase_to_registration` berjalan BEFORE INSERT dan menulis
// `registrations.source_digital_purchase_id` menunjuk baris yang belum ada →
// INSERT langsung berstatus Lunas pasti gagal FK (23503).
//
// Env dibaca dari .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { readFileSync, existsSync, statSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "ebook-files";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum ada di .env.local");
  process.exit(1);
}
const sb = createClient(url, key);

const [perintah, slug, target] = process.argv.slice(2);
if (!perintah || !slug) {
  console.error("pakai: node scripts/ebook-publish.mjs <status|terbit|beri-akses> <slug> [email]");
  process.exit(1);
}

const DIR = `content/ebook/${slug}`;
const PDF = `dist/ebook/${slug}.pdf`;
const meta = existsSync(`${DIR}/meta.json`) ? JSON.parse(readFileSync(`${DIR}/meta.json`, "utf8")) : null;
if (!meta && perintah !== "cari") { console.error(`${DIR}/meta.json tidak ada`); process.exit(1); }

// Nama berkas & slug produk diturunkan dari meta.product, bukan dari judul —
// judul modul buatan sendiri tidak mengikuti pola "Bahasa X Linguo".
const berkas = meta?.product?.file ?? `${slug}.pdf`;
const slugProduk = meta?.product?.slug ?? slug;

async function status() {
  const { data: files, error: e1 } = await sb.storage.from(BUCKET).list("", { limit: 200 });
  if (e1) throw new Error(e1.message);
  const ada = files?.find((f) => f.name === berkas);
  console.log(`Berkas   ${berkas}: ${ada ? `ADA (${Math.round((ada.metadata?.size ?? 0) / 1024)} KB)` : "belum diunggah"}`);
  console.log(`Rakitan  ${PDF}: ${existsSync(PDF) ? `ada (${Math.round(statSync(PDF).size / 1024)} KB)` : "belum dirakit"}`);

  const { data: prod } = await sb.from("digital_products")
    .select("id,title,slug,type,language,level,file_url,is_active,pages,file_size_mb")
    .eq("slug", slugProduk).maybeSingle();
  console.log("Produk  ", prod ? JSON.stringify(prod, null, 1) : "belum ada");

  if (prod) {
    const { data: beli } = await sb.from("digital_purchases")
      .select("id,buyer_name,buyer_email,student_id,payment_status,access_granted,expires_at")
      .eq("product_id", prod.id);
    console.log("Pembeli ", JSON.stringify(beli ?? [], null, 1));
  }
}

async function terbit() {
  if (!existsSync(PDF)) { console.error(`${PDF} belum ada — jalankan build-ebook-pdf.mjs dulu`); process.exit(1); }
  const bytes = readFileSync(PDF);
  const { error: eUp } = await sb.storage.from(BUCKET)
    .upload(berkas, bytes, { contentType: "application/pdf", upsert: true });
  if (eUp) throw new Error(`unggah gagal: ${eUp.message}`);
  console.log(`✓ unggah ${berkas} (${Math.round(bytes.length / 1024)} KB)`);

  const baris = {
    slug: slugProduk,
    title: meta.product?.title ?? meta.title,
    type: meta.product?.type ?? "ebook",
    language: meta.product?.language ?? null,
    level: meta.product?.level ?? null,
    pages: meta.product?.pages ?? null,
    description: meta.product?.description ?? null,
    file_size_mb: Math.round((bytes.length / 1024 / 1024) * 100) / 100,
    file_url: berkas,
    is_active: true,
  };
  const { data: lama } = await sb.from("digital_products").select("id").eq("slug", slugProduk).maybeSingle();
  const { data, error } = lama
    ? await sb.from("digital_products").update(baris).eq("id", lama.id).select("id,title,file_url").single()
    : await sb.from("digital_products").insert(baris).select("id,title,file_url").single();
  if (error) throw new Error(`produk gagal: ${error.message}`);
  console.log(`✓ produk ${lama ? "diperbarui" : "dibuat"}: ${data.id} · ${data.title} → ${data.file_url}`);
}

async function beriAkses() {
  if (!target) { console.error("pakai: beri-akses <slug> <email|student_id>"); process.exit(1); }
  const { data: prod } = await sb.from("digital_products").select("id,title").eq("slug", slugProduk).maybeSingle();
  if (!prod) { console.error("produknya belum ada — jalankan `terbit` dulu"); process.exit(1); }

  const uuid = /^[0-9a-f-]{36}$/i.test(target);
  const { data: siswa } = await sb.from("students")
    .select("id,name,email")
    .or(uuid ? `id.eq.${target}` : `email.ilike.${target}`)
    .limit(2);
  if (!siswa?.length) { console.error(`siswa ${target} tidak ketemu`); process.exit(1); }
  if (siswa.length > 1) { console.error("cocok >1 siswa — pakai student_id"); process.exit(1); }
  const s = siswa[0];

  const { data: sudah } = await sb.from("digital_purchases")
    .select("id,payment_status,access_granted").eq("product_id", prod.id).eq("student_id", s.id).maybeSingle();
  if (sudah?.payment_status === "Lunas" && sudah.access_granted) {
    console.log(`· ${s.name} sudah punya akses (${sudah.id}) — tidak ada perubahan`);
    return;
  }

  let id = sudah?.id;
  if (!id) {
    // Langkah 1: "Belum Bayar" — trigger auto-convert tidak menyalin baris ini.
    const dasar = {
      product_id: prod.id,
      student_id: s.id,
      buyer_name: s.name,
      buyer_email: s.email,
      payment_status: "Belum Bayar",
      access_granted: false,
      amount: 0,
    };
    let { data, error } = await sb.from("digital_purchases")
      .insert({ ...dasar, source: "linguo_grant" }).select("id").single();
    // `source` kemungkinan dipagari check constraint yang cuma mengenal nilai
    // jalur resmi (toko, landing, …). Nilainya cuma penanda asal, jadi lebih
    // baik barisnya tetap lahir tanpa itu daripada pemberian akses gagal total.
    if (error && /source|constraint/i.test(error.message)) {
      ({ data, error } = await sb.from("digital_purchases").insert(dasar).select("id").single());
      if (!error) console.log("· kolom source ditolak DB — baris dibuat tanpa penanda asal");
    }
    if (error) throw new Error(`insert gagal: ${error.message}`);
    id = data.id;
    console.log(`✓ baris pembelian dibuat (Belum Bayar): ${id}`);
  }

  // Langkah 2: baru dinaikkan ke Lunas, saat barisnya sudah ada → FK aman.
  const { error: eUp } = await sb.from("digital_purchases")
    .update({ payment_status: "Lunas", access_granted: true, expires_at: null })
    .eq("id", id);
  if (eUp) throw new Error(`update Lunas gagal: ${eUp.message}`);
  console.log(`✓ akses "${prod.title}" diberikan ke ${s.name} <${s.email}>`);
}


// `cari` menolong menghindari produk kembar: judul modul buatan sendiri tidak
// mengikuti pola katalog lama, jadi gampang bikin baris dobel tanpa sadar.
async function cari() {
  const kata = slug;
  const { data } = await sb.from("digital_products")
    .select("id,slug,title,type,language,level,file_url,is_active,created_at")
    .or(`title.ilike.%${kata}%,slug.ilike.%${kata}%`);
  console.log("PRODUK:", JSON.stringify(data ?? [], null, 1));
  if (target) {
    // ⚠️ students TIDAK punya auth_user_id — ikut memilihnya bikin select gagal
    // dan hasilnya pulang kosong tanpa pesan error sama sekali.
    const { data: sis, error: eSis } = await sb.from("students")
      .select("id,name,nickname,email")
      .or(`name.ilike.*${target}*,nickname.ilike.*${target}*,email.ilike.*${target}*`).limit(5);
    if (eSis) console.log("SISWA gagal:", eSis.message);
    console.log("SISWA:", JSON.stringify(sis ?? [], null, 1));
  }
}

const jalan = { status, cari, terbit, "beri-akses": beriAkses }[perintah];
if (!jalan) { console.error(`perintah tak dikenal: ${perintah}`); process.exit(1); }
await jalan();
