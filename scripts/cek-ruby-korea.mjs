#!/usr/bin/env node
// [ebook-ruby-korea-v1] Pemeriksa ruby modul Korea.
//
// Modul Korea menjanjikan ROMANISASI di atas hangeul (kolom kosakata berbunyi
// "한국어 · Romanisasi · Bahasa Indonesia"). Menulis ratusan baris membuat
// refleks menaruh hangeul di kedua sisi `|`, atau memakai kurung siku untuk
// hal lain sama sekali ([golongan I]) — keduanya senyap: tak ada yang error,
// hasilnya cuma modul yang setengah beromanisasi.
//
// Pakai: node scripts/cek-ruby-korea.mjs ko-b2
import { readdirSync, readFileSync } from "node:fs";

const slug = process.argv[2] ?? "ko-b2";
const dir = `content/ebook/${slug}`;
const HANGEUL = /[가-힣ᄀ-ᇿ㄰-㆏]/;
// Judul berita Korea memakai aksara Han sebagai singkatan (中企, 檢, 與/野) dan
// modul ini memberinya cara baca lewat ruby — jadi dasar beraksara Han sah.
const HANJA = /[\u4E00-\u9FFF]/;
let salah = 0;
const lapor = (f, jalur, pesan) => { console.log(`${f} ${jalur}: ${pesan}`); salah++; };

function periksaTeks(f, jalur, s) {
  // kurung siku bersarang: `[` bertemu `[` sebelum `]`
  let buka = -1;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "[") { if (buka >= 0) lapor(f, jalur, `kurung siku bersarang → ${s.slice(buka, i + 12)}`); buka = i; }
    else if (s[i] === "]") {
      if (buka >= 0) {
        const isi = s.slice(buka + 1, i);
        const bagian = isi.split("|");
        if (bagian.length !== 2) lapor(f, jalur, `potongan tanpa tepat satu "|" → [${isi}]`);
        else {
          const [dasar, baca] = bagian;
          if (!dasar.trim() || !baca.trim()) lapor(f, jalur, `sisi kosong → [${isi}]`);
          else if (HANGEUL.test(baca)) lapor(f, jalur, `cara baca masih beraksara Korea → [${isi}]`);
          else if (!HANGEUL.test(dasar) && !HANJA.test(dasar)) lapor(f, jalur, `dasar tanpa hangeul → [${isi}]`);
        }
      }
      buka = -1;
    }
  }
  if (buka >= 0) lapor(f, jalur, `"[" tak pernah ditutup → ${s.slice(buka, buka + 24)}`);
}

function sisir(f, o, jalur = "") {
  if (typeof o === "string") periksaTeks(f, jalur || "(akar)", o);
  else if (Array.isArray(o)) o.forEach((v, i) => sisir(f, v, `${jalur}[${i}]`));
  else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) sisir(f, v, jalur ? `${jalur}.${k}` : k);
}

for (const f of readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
  sisir(f, JSON.parse(readFileSync(`${dir}/${f}`, "utf8")));
}
console.log(salah ? `${salah} masalah` : "ruby bersih");
