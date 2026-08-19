#!/usr/bin/env node
// [ebook-reader-v1] Pencocok berkas PDF modul ↔ baris `digital_products`.
//
// Latar: 30 produk e-book aktif semuanya masih menunjuk `file_url =
// "placeholder.pdf"` sementara bucket `ebook-files` kosong, jadi tombol unduh
// di perpustakaan siswa pasti gagal ("Object not found"). Script ini dipakai
// untuk mengisi kekosongan itu tanpa mengedit 30 baris satu per satu.
//
// Nama berkas baku diturunkan dari judul produk:
//     Modul Belajar Bahasa Jepang Linguo — Japanese 101 (Edisi Bahasa Indonesia)
//   → jepang-101-id.pdf
//     … (English Edition) → jepang-101-en.pdf
// Judul dua edisi nyaris kembar, jadi edisi SELALU jadi bagian nama berkas.
//
// Pakai:
//   node scripts/ebook-pdf.mjs            # daftar nama berkas yang diharapkan + status
//   node scripts/ebook-pdf.mjs --cek      # bandingkan dengan isi bucket ebook-files
//   node scripts/ebook-pdf.mjs --apply    # isi file_url untuk berkas yang sudah terunggah
//
// IDEMPOTEN — --apply hanya menyentuh baris yang nama berkasnya benar-benar ada
// di bucket dan nilainya masih beda. Baris ber-file_url http (link Drive) tidak
// pernah ditimpa.
//
// Env (dibaca dari .env.local kalau ada):
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { readFileSync, existsSync } from "node:fs";
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

const mode = process.argv.includes("--apply") ? "apply"
  : process.argv.includes("--cek") ? "cek"
  : "daftar";

const slug = (s) => s.toLowerCase().trim()
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Judul produk → { lang, level, edisi } atau null kalau polanya tak dikenal. */
function bedah(title) {
  const lang = /Bahasa\s+(.+?)\s+Linguo/i.exec(title)?.[1];
  if (!lang) return null;
  const level = /\b(\d{2,3})\b/.exec(title)?.[1] ?? "101";
  // Edisi dibaca dari kurung di ekor judul; tanpa penanda dianggap edisi Indonesia.
  const ed = /english\s+edition/i.test(title) ? "en"
    : /edisi\s+bahasa\s+indonesia/i.test(title) ? "id"
    : null;
  return { lang: slug(lang), level, edisi: ed };
}

/** file_url yang tidak menunjuk berkas nyata di storage. */
const kosong = (v) => {
  const s = (v ?? "").trim();
  return s === "" || /^placeholder\b/i.test(s);
};

async function isiBucket() {
  const out = [];
  for (let page = 0; ; page++) {
    const { data, error } = await sb.storage.from(BUCKET)
      .list("", { limit: 100, offset: page * 100 });
    if (error) throw new Error(`gagal baca bucket ${BUCKET}: ${error.message}`);
    out.push(...data.map((f) => f.name));
    if (data.length < 100) break;
  }
  return out;
}

const { data: produk, error } = await sb
  .from("digital_products")
  .select("id,title,file_url,is_active")
  .eq("type", "ebook")
  .order("title");
if (error) { console.error("gagal baca digital_products:", error.message); process.exit(1); }

// ── Nama berkas baku per produk ───────────────────────────────────────────
const baris = produk.map((p) => {
  const b = bedah(p.title);
  return {
    ...p,
    ...(b ?? {}),
    berkas: b && b.edisi ? `${b.lang}-${b.level}-${b.edisi}.pdf` : null,
  };
});

// Dua produk yang menuntut nama berkas sama = judulnya tak cukup membedakan.
// Ini harus ketahuan SEBELUM unggah, bukan setelah siswa dapat modul salah edisi.
const tabrakan = new Map();
for (const r of baris) if (r.berkas) {
  tabrakan.set(r.berkas, [...(tabrakan.get(r.berkas) ?? []), r]);
}
const bentrok = [...tabrakan.entries()].filter(([, v]) => v.length > 1);
const takTerbaca = baris.filter((r) => !r.berkas);

if (mode === "daftar") {
  console.log(`\n${baris.length} produk e-book. Nama berkas yang diharapkan:\n`);
  for (const r of baris) {
    const tanda = !r.berkas ? "  ??  "
      : kosong(r.file_url) ? " BARU "
      : r.file_url === r.berkas ? "  OK  "
      : " BEDA ";
    console.log(`${tanda} ${(r.berkas ?? "—").padEnd(28)} ${r.title}`);
    if (tanda === " BEDA ") console.log(`        file_url sekarang: ${r.file_url}`);
  }
}

if (mode === "cek" || mode === "apply") {
  const berkas = await isiBucket();
  const ada = new Set(berkas);
  const terpakai = new Set();

  const siap = [], belum = [];
  for (const r of baris) {
    if (r.berkas && ada.has(r.berkas)) { siap.push(r); terpakai.add(r.berkas); }
    else belum.push(r);
  }
  const yatim = berkas.filter((f) => !terpakai.has(f));

  console.log(`\nBucket ${BUCKET}: ${berkas.length} berkas. Cocok: ${siap.length}/${baris.length}\n`);
  if (belum.length) {
    console.log("Belum ada berkasnya di bucket:");
    for (const r of belum) console.log(`  - ${(r.berkas ?? "?? nama tak terbaca").padEnd(28)} ${r.title}`);
  }
  if (yatim.length) {
    console.log("\nBerkas di bucket yang tak punya produk (salah nama?):");
    for (const f of yatim) console.log(`  - ${f}`);
  }

  if (mode === "apply") {
    const perlu = siap.filter((r) => r.file_url !== r.berkas && !/^https?:\/\//i.test(r.file_url ?? ""));
    console.log(`\nMemperbarui file_url: ${perlu.length} baris`);
    for (const r of perlu) {
      const { error: e } = await sb.from("digital_products")
        .update({ file_url: r.berkas }).eq("id", r.id).select();
      console.log(e ? `  GAGAL ${r.berkas}: ${e.message}` : `  ok    ${r.berkas}`);
    }
  }
}

if (bentrok.length) {
  console.log("\n⚠ Nama berkas bentrok (judul produk tak cukup membedakan):");
  for (const [f, v] of bentrok) {
    console.log(`  ${f}`);
    for (const r of v) console.log(`     ← ${r.title}`);
  }
}
if (takTerbaca.length) {
  console.log("\n⚠ Judul tak mengikuti pola (edisi/bahasa tak terbaca) — isi file_url-nya manual:");
  for (const r of takTerbaca) console.log(`  - ${r.title}`);
}
console.log();
