#!/usr/bin/env node
// [quran-morfologi-v1] Bangun data morfologi Al-Qur'an per surat untuk pembaca /alquran.
//
// Sumber: Quranic Arabic Corpus v0.4 (corpus.quran.com, GNU GPL) versi rapi dari
// github.com/mustafa0x/quran-morphology (Buckwalter sudah jadi huruf Arab, akar &
// lema dibetulkan). Satu baris = satu SEGMEN kata (awalan / batang / akhiran):
//   2:6:3:1  كَفَرُ  V  PERF|VF:1|ROOT:كفر|LEM:كَفَرَ|3MP
//
// Keluaran: public/quran/morph/<surat>.json  →  { "<ayat>:<kata>": [[bentuk, pos, tag], ...] }
// Dipecah per surat supaya pembaca cukup mengambil 1–3 berkas kecil per halaman
// mushaf, dan dilayani CDN sebagai berkas statis (tanpa fungsi server).
//
// Jalankan ulang hanya kalau sumbernya diperbarui:  node scripts/build-quran-morph.mjs

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SUMBER =
  "https://raw.githubusercontent.com/mustafa0x/quran-morphology/master/quran-morphology.txt";
const KELUAR = path.join(process.cwd(), "public", "quran", "morph");

const res = await fetch(SUMBER);
if (!res.ok) throw new Error(`Gagal unduh morfologi: HTTP ${res.status}`);
const teks = await res.text();

/** surat → { "ayat:kata": segmen[] } */
const perSurat = new Map();
let baris = 0;
for (const line of teks.split("\n")) {
  if (!line.trim()) continue;
  const [loc, bentuk, pos, tag = ""] = line.split("\t");
  const [s, a, w] = loc.split(":");
  if (!perSurat.has(s)) perSurat.set(s, {});
  const surat = perSurat.get(s);
  const kunci = `${a}:${w}`;
  (surat[kunci] ||= []).push([bentuk, pos, tag.replace(/\|$/, "")]);
  baris++;
}

await mkdir(KELUAR, { recursive: true });
let total = 0;
for (const [s, isi] of perSurat) {
  const json = JSON.stringify(isi);
  total += json.length;
  await writeFile(path.join(KELUAR, `${s}.json`), json);
}
console.log(`${baris} segmen → ${perSurat.size} berkas, ${(total / 1024 / 1024).toFixed(2)} MB`);
