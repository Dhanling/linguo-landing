/**
 * Membangun indeks BALIK pinyin → hanzi untuk IME kuis: `public/ime/pinyin.json`.
 *
 * Kenapa dibangun terpisah, bukan dihitung saat halaman jalan:
 * `chinese-lexicon` itu 13 MB dan cuma masuk akal di mesin build. Yang dikirim ke
 * browser adalah hasil perasannya (ratusan KB), itu pun lewat fetch() dari
 * /public — bukan import — supaya tidak ikut ke bundel JS siswa yang bahasa
 * kuisnya bukan Mandarin.
 *
 * Jalankan: npm run ime:pinyin   (hasilnya DI-COMMIT, jadi build Vercel tak
 * perlu dependensi kamusnya)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import lexicon from "chinese-lexicon";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../public/ime/pinyin.json");

/** Kandidat per kunci. Bilah kandidat cuma memuat 6; sisanya buat halaman ke-2. */
const MAX_PER_KEY = 9;
/** Kata sepanjang 5 hanzi ke atas hampir tak pernah diketik utuh di kuis. */
const MAX_LEN = 4;

/* Peringkat pemakaian. `movieWordRank` mewakili bahasa lisan, `bookWordRank`
   bahasa tulis; kuis bahasa memakai keduanya, jadi diambil yang terkecil. */
function rank(e) {
  const s = e.statistics ?? {};
  const r = Math.min(s.movieWordRank || Infinity, s.bookWordRank || Infinity);
  return Number.isFinite(r) ? r : Infinity;
}

const byKey = new Map();
let dilewati = 0;

for (const e of lexicon.allEntries) {
  const key = String(e.searchablePinyin ?? "").replace(/[^a-z]/g, "");
  const word = String(e.simp ?? "");
  if (!key || !word) { dilewati++; continue; }
  // Angka, huruf Latin, dan tanda baca ikut nongol di CC-EDICT ("110", "%").
  // Tak ada gunanya di IME: siswa mengetiknya langsung.
  if (!/^[一-鿿]+$/.test(word) || word.length > MAX_LEN) { dilewati++; continue; }
  /* Kata majemuk yang tak pernah sekali pun muncul di korpus film maupun buku
     dibuang: itu nama tempat, istilah kimia, sisa CC-CEDICT yang cuma
     menggemukkan berkas (2,0 MB → 0,5 MB) tanpa pernah jadi kandidat teratas.
     HANZI TUNGGAL tetap disimpan semua — di sanalah IME jadi papan ketik
     darurat, dan aksara langka justru yang tak bisa diketik dengan cara lain. */
  const r = rank(e);
  if (word.length > 1 && !Number.isFinite(r)) { dilewati++; continue; }
  const list = byKey.get(key) ?? [];
  list.push({ word, r: Number.isFinite(r) ? r : 9_999_999 });
  byKey.set(key, list);
}

const out = {};
for (const [key, list] of byKey) {
  list.sort((a, b) => a.r - b.r || a.word.length - b.word.length);
  const uniq = [];
  for (const { word } of list) {
    if (!uniq.includes(word)) uniq.push(word);
    if (uniq.length >= MAX_PER_KEY) break;
  }
  out[key] = uniq;
}

/* Suku kata sah dipakai pemenggal buffer di klien. Diturunkan dari kunci
   sepanjang <= 6 huruf yang punya kandidat 1 hanzi — bukan daftar tempelan,
   supaya tak bisa melenceng dari kamusnya sendiri. */
const syllables = [];
for (const [key, words] of Object.entries(out)) {
  if (key.length <= 6 && words.some((w) => w.length === 1)) syllables.push(key);
}
syllables.sort();

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ v: 1, syllables, map: out }));

const kb = Math.round(Buffer.byteLength(JSON.stringify({ v: 1, syllables, map: out })) / 1024);
console.log(`pinyin.json — ${Object.keys(out).length} kunci, ${syllables.length} suku kata, ${kb} KB (dilewati ${dilewati})`);
