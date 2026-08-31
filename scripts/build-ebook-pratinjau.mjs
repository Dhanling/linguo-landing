// [ebook-pratinjau-publik-v1] Rakit berkas pratinjau (Unit 1) untuk SEMUA Lingbook
// yang berkasnya ada di storage, lalu simpan sebagai `<nama>.pratinjau.pdf`.
//
// Routenya (/api/ebook/pratinjau-publik) sebenarnya bisa merakit sendiri saat
// pertama diklik — tapi klik pertama itu jatuh ke calon pembeli sungguhan, dan
// dia harus menunggu 5 MB diunduh + diurai di fungsi serverless. Di-bake duluan
// dari sini, klik pertama pun langsung dapat berkas kecil yang tinggal disalurkan.
//
// Aman diulang: modul yang potongannya sudah ada dilewati (pakai --paksa untuk
// merakit ulang, mis. sesudah modulnya diterbitkan ulang).
//
// Pakai:
//   node scripts/build-ebook-pratinjau.mjs [--paksa] [potongan-slug]

import { createClient } from "@supabase/supabase-js";
import { PDFDocument } from "pdf-lib";
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "ebook-files";
const s = createClient(URL_, KEY, { auth: { persistSession: false } });

const args = process.argv.slice(2);
const PAKSA = args.includes("--paksa");
const CARI = args.find((a) => !a.startsWith("--")) || null;

const enc = (j) => j.split("/").map(encodeURIComponent).join("/");
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const tarik = (jalur) =>
  fetch(`${URL_}/storage/v1/object/${BUCKET}/${enc(jalur)}`, { headers: H }).catch(() => null);

/** Sama persis dengan batasPratinjau() di /api/ebook — satu aturan, tiga tempat. */
function batasUnitSatu(soal) {
  const unit = soal?.unit;
  if (!Array.isArray(unit) || unit.length === 0) return 14;
  const u1 = unit[0];
  const akhir =
    u1?.sampai ??
    (u1?.halLatihan ? u1.halLatihan + 1 : null) ??
    (unit[1]?.hal ? unit[1].hal - 1 : null) ??
    14;
  return Math.max(1, Number(akhir) || 14);
}

let q = s.from("digital_products").select("slug, title, file_url").eq("type", "ebook").eq("is_active", true).order("title");
if (CARI) q = q.or(`slug.ilike.%${CARI}%,title.ilike.%${CARI}%`);
const { data: prods, error } = await q;
if (error) { console.error("Ambil produk gagal:", error.message); process.exit(1); }

let jadi = 0, lewat = 0, gagal = 0;
for (const p of prods) {
  // Link luar (Drive) tak punya berkas di bucket kita — tak bisa dipotong.
  if (!p.file_url || /^https?:\/\//i.test(p.file_url)) { lewat++; continue; }
  const dasar = p.file_url.replace(/\.pdf$/i, "");
  const jalurCicip = `${dasar}.pratinjau.pdf`;

  if (!PAKSA) {
    const ada = await tarik(jalurCicip);
    if (ada?.ok) { console.log("· sudah ada:", p.slug); lewat++; continue; }
  }

  const [soalRes, penuh] = await Promise.all([tarik(`${dasar}.latihan.json`), tarik(p.file_url)]);
  if (!penuh?.ok) { console.error("✗ berkas modul tak terbaca:", p.slug); gagal++; continue; }
  const soal = soalRes?.ok ? await soalRes.json().catch(() => null) : null;
  const batas = batasUnitSatu(soal);

  try {
    const src = await PDFDocument.load(await penuh.arrayBuffer());
    const ambil = Math.min(batas, src.getPageCount());
    const out = await PDFDocument.create();
    const hal = await out.copyPages(src, Array.from({ length: ambil }, (_, i) => i));
    hal.forEach((h) => out.addPage(h));
    out.setTitle(`${p.title} — Pratinjau Unit 1`);
    const bytes = await out.save();
    const { error: eu } = await s.storage
      .from(BUCKET)
      .upload(jalurCicip, bytes, { contentType: "application/pdf", upsert: true });
    if (eu) { console.error("✗ unggah gagal:", p.slug, eu.message); gagal++; continue; }
    jadi++;
    console.log(`✓ ${p.slug} — ${ambil}/${src.getPageCount()} hal, ${(bytes.length / 1024).toFixed(0)} KB`);
  } catch (e) {
    console.error("✗ potong gagal:", p.slug, e.message);
    gagal++;
  }
}

console.log(`\nSelesai — dirakit: ${jadi}, dilewati: ${lewat}, gagal: ${gagal}`);
