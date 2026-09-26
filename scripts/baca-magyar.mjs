#!/usr/bin/env node
// Cara baca bahasa Hungaria — konvensi modul Magyar 101 (hu-a1 … hu-b2).
//
//   node scripts/baca-magyar.mjs --kata "a jövő héten"     → å YÖ-vö HÉ-tèn
//   node scripts/baca-magyar.mjs <slug> [--unit NN]        → laporkan `baca` yang menyimpang
//
// Pemeriksa folder hanya MELAPOR (tak menulis): nama diri & kata pinjaman
// sering sengaja dieja lain. Perbandingan mengabaikan letak tanda hubung —
// pemenggalan suku kata boleh ikut batas kata majemuk (MIND-yart) — tetapi
// memeriksa huruf dan huruf besar suku pertama.
//
// Konvensi (bab "Pelafalan" hu-a1): a→å á→a e→è é→é s→sy sz→s zs→zh cs→c
// c→ts gy→dy j/ly→y dzs→j ch→h; vokal panjang lain ditulis pendek (í→i ó→o
// ő→ö ú→u ű→ü); huruf mati ganda tetap ganda; tekanan = suku pertama ditulis
// BESAR pada kata bersuku dua atau lebih, kata bersuku satu kecil semua.
import fs from "node:fs";
import path from "node:path";

const VOKAL = { a: "å", á: "a", e: "è", é: "é", i: "i", í: "i", o: "o", ó: "o", ö: "ö", ő: "ö", u: "u", ú: "u", ü: "ü", ű: "ü" };
// Urutan penting: yang terpanjang dicoba lebih dulu.
const MATI = [
  ["ddzs", "jj"], ["dzs", "j"], ["dz", "dz"],
  ["ccs", "cc"], ["ssz", "ss"], ["zzs", "zzh"], ["ggy", "ddy"], ["tty", "tty"], ["nny", "nny"], ["lly", "yy"],
  ["ss", "ssy"], ["cs", "c"], ["sz", "s"], ["zs", "zh"], ["gy", "dy"], ["ty", "ty"], ["ny", "ny"], ["ly", "y"], ["ch", "h"],
  ["s", "sy"], ["c", "ts"], ["j", "y"], ["x", "ks"], ["w", "v"], ["q", "k"],
];

function besar(s) {
  return s.toLocaleUpperCase("hu");
}

// Pecah satu kata menjadi satuan bunyi: {t: teks cara baca, v: vokal?}
function satuan(kata) {
  const out = [];
  let i = 0;
  const k = kata.toLocaleLowerCase("hu");
  while (i < k.length) {
    const ch = k[i];
    if (VOKAL[ch]) { out.push({ t: VOKAL[ch], v: true }); i++; continue; }
    let cocok = null;
    for (const [src, dst] of MATI) if (k.startsWith(src, i)) { cocok = [src, dst]; break; }
    // ss di antara vokal dipecah sy-sy (TÈSY-syék, LÅSY-syu); di ujung kata ssy (frissy).
    if (k.startsWith("ss", i) && !k.startsWith("ssz", i) && VOKAL[k[i + 2]]) {
      out.push({ t: "sy", v: false }, { t: "sy", v: false });
      i += 2;
      continue;
    }
    if (cocok) {
      // Huruf ganda (ssz, ggy, …) dipecah dua satuan supaya pemenggalan jatuh di tengahnya.
      const dobel = cocok[0].length >= 3 && cocok[0][0] === cocok[0][1] && cocok[0] !== "dzs";
      if (dobel) {
        const tunggal = MATI.find(([s]) => s === cocok[0].slice(1))[1];
        out.push({ t: tunggal, v: false }, { t: tunggal, v: false });
      } else out.push({ t: cocok[1], v: false });
      i += cocok[0].length;
      continue;
    }
    if (/\p{L}/u.test(ch)) { out.push({ t: ch, v: false }); i++; continue; }
    out.push({ t: ch, v: false, lain: true }); i++;
  }
  return out;
}

export function bacaKata(kata) {
  const s = satuan(kata);
  const posV = s.map((x, i) => (x.v ? i : -1)).filter((i) => i >= 0);
  if (posV.length < 2) return s.map((x) => x.t).join("");
  // Batas suku: di antara dua vokal, satu huruf mati → ikut suku berikut;
  // dua atau lebih → yang terakhir ikut suku berikut.
  const potong = new Set();
  for (let n = 0; n < posV.length - 1; n++) {
    const a = posV[n], b = posV[n + 1];
    const jarak = b - a - 1;
    potong.add(jarak <= 1 ? a + 1 : b - 1);
  }
  const suku = [];
  let cur = "";
  s.forEach((x, i) => {
    if (potong.has(i)) { suku.push(cur); cur = ""; }
    cur += x.t;
  });
  suku.push(cur);
  suku[0] = besar(suku[0]);
  return suku.join("-");
}

export function baca(teks) {
  return teks
    .replace(/[*_]/g, "")
    .split(/(\s+|[.,!?;:…()"„”«»–—/]+)/)
    .map((w) => (/\p{L}/u.test(w) ? w.split("-").map(bacaKata).join(" ") : w))
    .join("")
    .replace(/[.,!?;:…()"„”«»–—]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Bentuk pembanding: huruf saja, tanpa tanda hubung/spasi/huruf besar. Tanda
// tekanan diperiksa terpisah: kata bersuku dua+ harus diawali huruf besar.
function kunci(b) {
  return b.replace(/[-\s.,!?;:…()"„”«»–—/]+/g, "").toLocaleLowerCase("hu");
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
    // Sel akhiran (*-ban / -ben*), angka di depan, dan catatan dalam kurung bukan kata utuh.
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
    for (const v of d.vocab || []) cek(f, v.hu, v.baca);
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
  console.log('pakai: node scripts/baca-magyar.mjs --kata "…"  |  node scripts/baca-magyar.mjs <slug> [--unit NN]');
}
