#!/usr/bin/env node
// Cara baca bahasa Finlandia — konvensi modul Suomi 101 (fi-a1 … fi-b2).
//
//   node scripts/baca-suomi.mjs --kata "hyvää päivää"     → HÜ-vèè PÈI-vèè
//   node scripts/baca-suomi.mjs <slug> [--unit NN]        → laporkan `baca` yang menyimpang
//
// Pemeriksa folder hanya MELAPOR (tak menulis): nama diri & kata pinjaman
// sering sengaja dieja lain. Perbandingan mengabaikan letak tanda hubung —
// pemenggalan suku boleh ikut batas kata majemuk (RUO-ka-kaup-pa) — tetapi
// memeriksa huruf dan huruf besar suku pertama.
//
// Konvensi (bab "Pelafalan bahasa Finlandia" fi-a1): ä→è ö→ö y→ü j→y, e tunggal
// tetap e tapi ee panjang → èè (AN-tèèk-si); vokal & huruf mati panjang ditulis
// ganda; tekanan = suku pertama ditulis BESAR pada kata bersuku dua atau lebih,
// kata bersuku satu kecil semua (hèn, yö, nüt).
import fs from "node:fs";
import path from "node:path";

const VOKAL = { a: "a", e: "e", i: "i", o: "o", u: "u", y: "ü", ä: "è", ö: "ö", å: "o", é: "e", ü: "ü" };
const MATI = { j: "y", w: "v", q: "k", x: "ks", z: "ts", c: "k", š: "sy", ž: "zh" };
// Diftong: berakhir -i/-u/-y di posisi mana pun; ie/uo/yö hanya di suku pertama.
const DIFTONG = new Set(["ai", "ei", "oi", "ui", "yi", "äi", "öi", "au", "ou", "eu", "iu", "äy", "öy", "ey", "iy"]);
const DIFTONG_AWAL = new Set(["ie", "uo", "yö"]);

const besar = (s) => s.toLocaleUpperCase("fi");

// Pecah satu kata jadi daftar suku kata (sudah dalam ejaan cara baca).
function sukuKata(kata) {
  const k = kata.toLocaleLowerCase("fi");
  // Satuan: inti vokal (1–2 huruf) atau satu huruf mati.
  const s = [];
  let i = 0;
  while (i < k.length) {
    const ch = k[i];
    if (VOKAL[ch]) {
      const dua = k.slice(i, i + 2);
      const awal = !s.some((x) => x.v);
      if (dua.length === 2 && VOKAL[dua[1]] && (dua[0] === dua[1] || DIFTONG.has(dua) || (awal && DIFTONG_AWAL.has(dua)))) {
        s.push({ t: dua === "ee" ? "èè" : VOKAL[dua[0]] + VOKAL[dua[1]], v: true });
        i += 2;
      } else { s.push({ t: VOKAL[ch], v: true }); i++; }
      continue;
    }
    s.push({ t: MATI[ch] ?? ch, v: false });
    i++;
  }
  const posV = s.map((x, n) => (x.v ? n : -1)).filter((n) => n >= 0);
  if (posV.length < 2) return [s.map((x) => x.t).join("")];
  const potong = new Set();
  for (let n = 0; n < posV.length - 1; n++) {
    const a = posV[n], b = posV[n + 1];
    potong.add(b - a - 1 === 0 ? b : b - 1);
  }
  const suku = [];
  let cur = "";
  s.forEach((x, n) => { if (potong.has(n)) { suku.push(cur); cur = ""; } cur += x.t; });
  suku.push(cur);
  return suku;
}

export function bacaKata(kata) {
  const suku = sukuKata(kata);
  if (suku.length > 1) suku[0] = besar(suku[0]);
  return suku.join("-");
}

export function baca(teks) {
  return teks
    .replace(/[*_]/g, "")
    .split(/(\s+|[.,!?;:…()"„”«»–—/]+)/)
    .map((w) => (/\p{L}/u.test(w) ? w.split("-").filter(Boolean).map(bacaKata).join(" ") : w))
    .join("")
    .replace(/[.,!?;:…()"„”«»–—]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function kunci(b) {
  return b.replace(/[-\s.,!?;:…()"„”«»–—/]+/g, "").toLocaleLowerCase("fi");
}
function polaBesar(b) {
  return b.split(/\s+/).map((w) => (/^\p{Lu}/u.test(w) ? "B" : "k")).join("");
}

function periksaFolder(slug, unitFilter) {
  const dir = path.join("content", "ebook", slug);
  const files = fs.readdirSync(dir).filter((f) => /^unit-\d+\.json$/.test(f)).sort()
    .filter((f) => !unitFilter || f === `unit-${unitFilter.padStart(2, "0")}.json`);
  let jumlah = 0, beda = 0;
  const cek = (f, asal, tertulis) => {
    if (!asal || tertulis == null) return;
    asal = asal.replace(/[*_]/g, "").replace(/\([^)]*\)/g, "").replace(/^[\d.\s]+/, "").trim();
    if (!asal || asal.startsWith("-")) return;
    jumlah++;
    const hitung = baca(asal);
    if (kunci(hitung) !== kunci(tertulis) || polaBesar(hitung) !== polaBesar(tertulis)) {
      beda++;
      console.log(`${f}  ${asal}  |  tertulis: ${tertulis}  |  mekanis: ${hitung}`);
    }
  };
  for (const f of files) {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    for (const v of d.vocab || []) cek(f, v.fi, v.baca);
    const tabel = [];
    for (const dl of d.dialogs || []) for (const g of dl.grammars || []) if (g.table) tabel.push(g.table);
    for (const s of d.sections || []) for (const b of s.blocks || []) if (b.type === "tabel") tabel.push(b);
    for (const t of tabel) {
      const ib = (t.head || []).findIndex((h) => /cara baca/i.test(h));
      if (ib < 1) continue;
      for (const r of t.rows || []) cek(f, r[ib - 1], r[ib]);
    }
  }
  console.log(`\n${beda} dari ${jumlah} cara baca menyimpang dari hitungan mekanis.`);
}

const args = process.argv.slice(2);
const iKata = args.indexOf("--kata");
if (iKata >= 0) {
  console.log(baca(args[iKata + 1] || ""));
} else if (args[0] && !args[0].startsWith("--")) {
  const iu = args.indexOf("--unit");
  periksaFolder(args[0], iu >= 0 ? args[iu + 1] : null);
} else {
  console.log('pakai: node scripts/baca-suomi.mjs --kata "…"  |  node scripts/baca-suomi.mjs <slug> [--unit NN]');
}
