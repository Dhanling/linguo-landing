#!/usr/bin/env node
// [ebook-baca-viet-v1] Pengisi kolom "cara baca" modul Tiếng Việt 101 (vi-a1).
//
// Bahasa Vietnam ditulis dengan huruf Latin dan ejaannya SETIA pada bunyinya —
// masalahnya nilai hurufnya bukan nilai huruf Indonesia: d berbunyi z, x
// berbunyi s, ch dan tr berbunyi c, nh di awal berbunyi ny tapi di akhir
// berbunyi ng. Karena itu kolom "cara baca" modul ini cuma mengerjakan SATU
// hal: mengganti huruf matinya ke ejaan Indonesia, dan membiarkan huruf vokal
// beserta seluruh tanda nadanya apa adanya — nada dan vokal khas justru harus
// dilihat pembaca, bukan disembunyikan.
//
// Karena aturannya mekanis, kolomnya diisi skrip, bukan tangan: 20 unit x
// ~11 baris dialog x ~22 kosakata terlalu banyak untuk dikerjakan konsisten
// dengan tangan, dan satu kata yang dieja lain dari saudaranya langsung
// merusak kepercayaan pembaca pada seluruh kolom.
//
// Pakai:
//   node scripts/baca-viet.mjs vi-a1            # isi semua unit-NN.json
//   node scripts/baca-viet.mjs vi-a1 --cek      # cuma laporkan yang beda
//   node scripts/baca-viet.mjs --kata "xin chào"
//   node scripts/baca-viet.mjs vi-b1 --tanpa-dialog   # B1/B2: baris dialog TAK diberi cara baca

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";

/* Huruf mati di AWAL suku kata. Urutannya penting: yang panjang lebih dulu,
   supaya "cho" tidak terbaca c+ho lalu keluar sebagai "kho". */
const AWAL = [
  ["ngh", "ng"], ["ng", "ng"], ["nh", "ny"], ["gh", "g"], ["gi", "z"],
  ["qu", "kw"], ["ch", "c"], ["tr", "c"], ["th", "th"], ["ph", "f"],
  ["kh", "kh"], ["đ", "d"], ["d", "z"], ["r", "z"], ["x", "s"],
  ["c", "k"], ["k", "k"], ["q", "k"], ["g", "g"], ["s", "s"],
];

/* Huruf mati di AKHIR suku kata. Yang tak disebut dibiarkan apa adanya
   (-t, -p, -m, -n, -ng dibaca sama seperti bahasa Indonesia). */
const AKHIR = [["ch", "k"], ["nh", "ng"], ["c", "k"]];

const HURUF = "a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ";
const TOKEN = new RegExp(`[${HURUF}]+`, "g");

const samakanBesar = (asli, ganti) =>
  asli[0] === asli[0].toUpperCase() && asli[0] !== asli[0].toLowerCase()
    ? ganti[0].toUpperCase() + ganti.slice(1)
    : ganti;

/** Satu suku kata (satu token huruf) → cara bacanya. */
/* [ebook-baca-viet-asing-v1] Kata asing (nama orang/kota Indonesia, merek,
   "Sen Travel") dibiarkan apa adanya. Satu suku Vietnam cuma punya SATU gugus
   vokal, tak memakai f/j/w/z, dan hanya boleh berakhir -c -ch -m -n -ng -nh
   -p -t atau vokal. Tanpa saringan ini "Travel" keluar "Cavel", "Dewi" "Zewi". */
const VOKAL = "aeiouyàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ";
const GUGUS_VOKAL = new RegExp(`[${VOKAL}]+`, "g");
const AKHIR_SAH = new RegExp(`(?:[${VOKAL}]|ch|nh|ng|[cmnpt])$`);
export function bukanSukuViet(kata) {
  const k = kata.toLowerCase();
  if (/[fjwz]/.test(k)) return true;
  if ((k.match(GUGUS_VOKAL) ?? []).length > 1) return true;
  return !AKHIR_SAH.test(k);
}

export function bacaSuku(kata) {
  if (bukanSukuViet(kata)) return kata;
  const kecil = kata.toLowerCase();
  let awal = "", sisa = kecil;
  for (const [dari, ke] of AWAL) {
    if (kecil.startsWith(dari)) { awal = ke; sisa = kecil.slice(dari.length); break; }
  }
  // "gi" + i bernada (gì, gìn, gị): huruf i-nya ikut memikul nada, jadi prefiks
  // "gi" polos tak cocok dan kata ini dulu keluar "gì" — padahal bunyinya zì.
  if (awal === "g" && /^[ìíỉĩị]/.test(sisa)) awal = "z";
  // Suku kata Vietnam selalu punya vokal sesudah huruf mati awalnya. Kalau
  // sisanya kosong atau tak bervokal, tokennya bukan kata Vietnam (nama asing,
  // singkatan) — biarkan apa adanya.
  if (!sisa || !/[aeiouyàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/.test(sisa)) return kata;

  let akhir = "";
  for (const [dari, ke] of AKHIR) {
    if (sisa.endsWith(dari) && sisa.length > dari.length) { akhir = ke; sisa = sisa.slice(0, -dari.length); break; }
  }
  return samakanBesar(kata, awal + sisa + akhir);
}

/** Satu kalimat / frasa → cara bacanya, tanda baca dibiarkan di tempatnya. */
export function baca(teks) {
  return String(teks).replace(TOKEN, (t) => bacaSuku(t));
}


/* Tabel yang punya kolom bertajuk persis "Cara baca" ikut diisi otomatis:
   sumbernya kolom tepat di sebelah kirinya. Penanda tebal/miring ala markdown
   dibuang dari hasilnya — kolom cara baca selalu tercetak polos. */
const polos = (s) => String(s).replace(/\*+/g, "");
function perbaikiTabel(b, catat) {
  if (!b || typeof b !== "object") return;
  if (Array.isArray(b)) { for (const x of b) perbaikiTabel(x, catat); return; }
  if (Array.isArray(b.head) && Array.isArray(b.rows)) {
    const k = b.head.findIndex((h) => String(h).replace(/\*+/g, "").trim() === "Cara baca");
    if (k > 0) for (const r of b.rows) {
      const harus = polos(baca(polos(r[k - 1])));
      if (r[k] !== harus) catat(r, k, harus);
    }
  }
  for (const v of Object.values(b)) if (v && typeof v === "object") perbaikiTabel(v, catat);
}

/* ── jalankan ────────────────────────────────────────────────────────────── */

const arg = process.argv.slice(2);
if (arg[0] === "--kata") { console.log(baca(arg.slice(1).join(" "))); process.exit(0); }

const slug = arg[0];
if (!slug) { console.error("pakai: node scripts/baca-viet.mjs <slug> [--cek]"); process.exit(1); }
const CEK = arg.includes("--cek");
/* [ebook-baca-viet-tanpa-dialog-v1] Seri lanjutan (vi-b1, vi-b2) sengaja tak
   mencetak cara baca di bawah tiap baris dialog — pembacanya sudah lancar
   membaca quốc ngữ, dan barisnya cuma memakan halaman. Kosakata & tabel
   "Cara baca" tetap diisi; `baca` di baris dialog malah dibuang. */
const TANPA_DIALOG = arg.includes("--tanpa-dialog");
const DIR = `content/ebook/${slug}`;
if (!existsSync(DIR)) { console.error(`${DIR} tidak ada`); process.exit(1); }

let diisi = 0, beda = 0;
for (const berkas of readdirSync(DIR).filter((f) => /^unit-\d+\.json$/.test(f)).sort()) {
  const jalur = `${DIR}/${berkas}`;
  const u = JSON.parse(readFileSync(jalur, "utf8"));

  const pasang = (obj, kunciAsing, kunciBaca) => {
    const harus = baca(obj[kunciAsing]);
    if (obj[kunciBaca] !== harus) {
      beda++;
      if (!CEK) { obj[kunciBaca] = harus; diisi++; }
      else console.log(`${berkas}  ${obj[kunciAsing]}\n   ada : ${obj[kunciBaca] ?? "—"}\n   harus: ${harus}`);
    }
  };

  for (const d of u.dialogs ?? (u.dialog ? [u.dialog] : [])) {
    for (const l of d.lines ?? []) {
      if (!TANPA_DIALOG) pasang(l, "text", "baca");
      else if ("baca" in l) { beda++; if (!CEK) { delete l.baca; diisi++; } }
    }
  }
  for (const v of u.vocab ?? []) pasang(v, "vi", "baca");
  perbaikiTabel(u, (r, k, harus) => {
    beda++;
    if (!CEK) { r[k] = harus; diisi++; }
    else console.log(`${berkas}  tabel: ${r[k - 1]}\n   ada : ${r[k] ?? "—"}\n   harus: ${harus}`);
  });

  if (!CEK) writeFileSync(jalur, JSON.stringify(u, null, 1) + "\n");
}
// Halaman depan & belakang juga punya tabel bertajuk "Cara baca".
const jalurMeta = `${DIR}/meta.json`;
if (existsSync(jalurMeta)) {
  const meta = JSON.parse(readFileSync(jalurMeta, "utf8"));
  perbaikiTabel(meta, (r, k, harus) => {
    beda++;
    if (!CEK) { r[k] = harus; diisi++; }
    else console.log(`meta.json  tabel: ${r[k - 1]}\n   ada : ${r[k] ?? "—"}\n   harus: ${harus}`);
  });
  if (!CEK) writeFileSync(jalurMeta, JSON.stringify(meta, null, 2) + "\n");
}
console.log(CEK ? `${beda} kolom beda dari aturan.` : `${diisi} kolom cara baca diisi/dibetulkan.`);
