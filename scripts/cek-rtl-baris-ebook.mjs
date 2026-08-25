#!/usr/bin/env node
// [ebook-rtl-baris-plaintext-v1] Pemeriksa modul RTL yang memakai
// `meta.rtl_baris_plaintext`.
//
// Perakit membungkus SELURUH baris dalam pagar kanan-ke-kiri begitu baris itu
// DIBUKA kata bahasa target — pagar itu memang yang menyelamatkan soal isian
// "میں بودی ____۔" dari tercetak terbalik. Tapi ia juga menangkap catatan dan
// butir kotak yang kebetulan dibuka kata Urdu lalu disambung satu paragraf
// panjang bahasa Indonesia: paragrafnya ikut rata kanan dan nomor daftarnya
// pindah ke sisi yang salah.
//
// Jadi aturannya: baris PENJELASAN (catatan, butir kotak, paragraf, body/after
// tata bahasa) wajib dibuka huruf Latin. Baris LATIHAN dan KUNCI JAWABAN justru
// boleh — memang harus — dibuka kata bahasa target.
//
// Pakai: node scripts/cek-rtl-baris-ebook.mjs ur-a1

import { readFileSync, readdirSync } from "node:fs";

const slug = process.argv[2];
if (!slug) { console.error("pakai: node scripts/cek-rtl-baris-ebook.mjs <slug>"); process.exit(1); }
const DIR = `content/ebook/${slug}`;

const AKSARA = "֐-׿؀-ۿݐ-ݿࢠ-ࣿיִ-﷿ﹰ-﻿";
const DIBUKA_ASING = new RegExp(`^[^A-Za-z\\u00C0-\\u024F${AKSARA}]*[${AKSARA}]`);

const salah = [];
const LATIN = /[A-Za-z]/;
const GABUNG = new RegExp(`[${AKSARA}][ \u00A0]*[,:][ \u00A0]*[${AKSARA}]`);
/* Sel tabel TIDAK perlu diperiksa: pagar `.rtl` di dalamnya `unicode-bidi:
   isolate`, dan isi pagar isolate tak terlihat oleh `unicode-bidi: plaintext`
   milik sel — jadi sel campur selalu jatuh ke kiri-ke-kanan dan urutannya benar.
   Sudah dibuktikan dengan render, bukan dikira-kira. */
const salahSel = [];
/* [ebook-rtl-untaian-gabung-v1] Perangkap kedua, dan yang ini tak kelihatan sama
   sekali di JSON. Pemagar `pagariRtl` menyapu untaian bahasa target BESERTA
   tanda netral di tengahnya — spasi, koma, titik dua, garis miring. Jadi daftar
   pasangan seperti "میں jadi میں نے, تم jadi تم نے" membuat "میں نے, تم" jatuh ke
   DALAM satu pagar, lalu tercetak kanan-ke-kiri: pasangannya tertukar dan
   panahnya menunjuk arah yang salah.
   Yang dicari: dua gugus bahasa target yang cuma dipisah tanda baca ASCII
   ASCII — koma atau titik dua — di dalam baris yang juga memuat huruf Latin.
   Garis miring TIDAK ikut terjaring: daftar seperti کا / کے / کی memang
   disengaja tersusun kanan-ke-kiri, begitu pula daftar Urdu yang memakai tanda
   bacanya sendiri (، ؛ ؟). */
const salahGabung = [];
const periksa = (berkas, jalur, teks) => {
  if (typeof teks !== "string") return;
  if (DIBUKA_ASING.test(teks)) salah.push({ berkas, jalur, cuplik: teks.slice(0, 64) });
  if (LATIN.test(teks) && GABUNG.test(teks)) {
    const m = teks.match(GABUNG);
    salahGabung.push({ berkas, jalur, cuplik: teks.slice(Math.max(0, teks.indexOf(m[0]) - 24), teks.indexOf(m[0]) + 40) });
  }
};

/** Baris penjelasan saja — latihan & kunci jawaban sengaja dilewati. */
function telusur(berkas, simpul, jalur) {
  if (Array.isArray(simpul)) return simpul.forEach((v, i) => telusur(berkas, v, `${jalur}[${i}]`));
  if (simpul && typeof simpul === "object") {
    for (const [k, v] of Object.entries(simpul)) {
      if (["exercises", "answers", "vocab", "lines", "table", "rows", "head",
           "labels", "cover_design", "product", "vocab_columns"].includes(k)) continue;
      if (["text", "title", "intro", "goal", "wave"].includes(k) && k === "title") continue; // judul boleh
      telusur(berkas, v, `${jalur}.${k}`);
    }
    return;
  }
  if (typeof simpul === "string" && !/\.(title|title_target|head)$/.test(jalur)) periksa(berkas, jalur, simpul);
}

const berkas = readdirSync(DIR).filter((f) => /^(meta|unit-\d+)\.json$/.test(f)).sort();
for (const f of berkas) telusur(f, JSON.parse(readFileSync(`${DIR}/${f}`, "utf8")), "");

if (!salah.length && !salahSel.length && !salahGabung.length) {
  console.log(`${slug}: semua baris penjelasan aman (dibuka huruf Latin, tanpa gugus tergabung) ✔`);
  process.exit(0);
}
if (salah.length) {
  console.log(`${salah.length} baris dibuka kata bahasa target — akan tercetak rata kanan:\n`);
  for (const s of salah) console.log(`  ${s.berkas}${s.jalur}\n    ${s.cuplik}`);
}
if (salahSel.length) {
  console.log(`\n${salahSel.length} sel tabel CAMPUR dibuka kata bahasa target — urutan potongannya terbalik:\n`);
  for (const s of salahSel) console.log(`  ${s.berkas}${s.jalur}\n    ${s.cuplik}`);
}
if (salahGabung.length) {
  console.log(`\n${salahGabung.length} baris memuat dua gugus bahasa target yang cuma dipisah koma/titik dua — akan tergabung jadi satu pagar lalu tertukar:\n`);
  for (const s of salahGabung) console.log(`  ${s.berkas}${s.jalur}\n    …${s.cuplik}…`);
}
process.exit(1);
