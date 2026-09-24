#!/usr/bin/env node
// [ebook-cek-baca-arab-v1] Pemeriksa cara baca modul Arab berharakat penuh.
//
// Menurunkan transliterasi dari harakat (konvensi ar-a1: vokal panjang dobel,
// ts/dz/sy/sh/dh/th/zh/kh/gh, ' untuk ع & hamzah, ال melebur, waqaf di ujung
// kalimat & sebelum koma) lalu membandingkannya dengan kolom `baca`. Yang
// dibandingkan hanya untaian hurufnya — spasi, tanda hubung, huruf besar, dan
// tanda baca dibuang — jadi beda gaya penulisan tak dilaporkan, tapi harakat
// yang tak cocok dengan cara bacanya (atau sebaliknya) ketahuan.
//
// Tidak semua laporan pasti salah (nama asing, الله, kata serapan), jadi hasilnya
// dibaca manusia/penyunting, bukan disapu otomatis.
//
// Pakai: node scripts/cek-baca-arab.mjs <slug> [--unit NN] [--kata "نَصّ"]

import { readFileSync, readdirSync, existsSync } from "node:fs";

const KONS = {
  "ب": "b", "ت": "t", "ث": "ts", "ج": "j", "ح": "h", "خ": "kh", "د": "d", "ذ": "dz",
  "ر": "r", "ز": "z", "س": "s", "ش": "sy", "ص": "sh", "ض": "dh", "ط": "th", "ظ": "zh",
  "ع": "'", "غ": "gh", "ف": "f", "ق": "q", "ك": "k", "ل": "l", "م": "m", "ن": "n",
  "ه": "h", "و": "w", "ي": "y", "ء": "'", "أ": "'", "إ": "'", "ؤ": "'", "ئ": "'",
  "ة": "t", "ا": "", "ى": "", "آ": "'",
};
const FATHAH = "َ", KASRAH = "ِ", DAMMAH = "ُ", SUKUN = "ْ", SYADDAH = "ّ";
const TAN_F = "ً", TAN_D = "ٌ", TAN_K = "ٍ", ALIF_KECIL = "ٰ";
const HARAKAT = new Set([FATHAH, KASRAH, DAMMAH, SUKUN, SYADDAH, TAN_F, TAN_D, TAN_K, ALIF_KECIL, "ٓ", "ٔ", "ٕ"]);
const VOKAL = { [FATHAH]: "a", [KASRAH]: "i", [DAMMAH]: "u" };
const TAN = { [TAN_F]: "an", [TAN_D]: "un", [TAN_K]: "in" };

/* Satu kata → daftar gugus {h: huruf, v: [harakat…]}. */
const gugus = (kata) => {
  const out = [];
  for (const ch of kata.normalize("NFC")) {
    if (HARAKAT.has(ch)) { if (out.length) out.at(-1).v.push(ch); }
    else if (ch === "ـ") continue; // tatwil
    else out.push({ h: ch, v: [] });
  }
  return out;
};

/* Translit satu kata. `waqaf`: kata terakhir sebelum jeda. `sambung`: ada kata
   sebelumnya (alif washal lebur). */
function kataKeLatin(kata, { waqaf, sambung }) {
  // الله ditulis tanpa syaddah di teks; pasang syaddah + alif kecil supaya terbaca "allaah".
  const g = gugus(kata
    .replace(/^([وفب]?[َِ]?)ا[َ]?لل[َّ]*ه/, "$1اللّٰه")
    .replace(/لِل[َّ]*ه/, "لِلّٰه"));
  if (!g.length) return "";
  let s = "";
  for (let i = 0; i < g.length; i++) {
    const { h, v } = g[i];
    const nx = g[i + 1];
    const akhir = i === g.length - 1;
    // Alif: panjang sesudah fathah, washal di awal, atau bisu (sesudah tanwin/waw jamak).
    if (h === "ا") {
      if (i === 0) {
        const vk = v.find((x) => VOKAL[x]);
        if (sambung) { if (vk) s += `(?:${VOKAL[vk]})?`; continue; } // alif washal lebur
        if (vk) s += VOKAL[vk];
        else if (nx && nx.h === "ل") s += "a";
        continue;
      }
      const prev = g[i - 1];
      // Awalan + ال (بِالْ، وَالْ، فَالْ، كَالْ): alif washal bisu. ل-nya bersukun,
      // atau tanpa harakat di depan huruf bersyaddah (syamsiyah) — beda dengan وَالِد.
      if (i === 1 && !v.length && nx && "بوفكل".includes(prev.h) && !prev.v.includes(SUKUN) &&
          (nx.v.includes(SUKUN) || (nx.h === "ل" && !nx.v.length && g[i + 2]?.v.includes(SYADDAH)) ||
           (nx.h === "ل" && nx.v.includes(KASRAH) && g[i + 2]?.h === "ا"))) continue; // وَالِاثْنَيْنِ
      // Alif sesudah kasrah/dammah bukan vokal panjang — itu alif washal (الِامْتِحَان).
      if (!v.length && (prev.v.includes(KASRAH) || prev.v.includes(DAMMAH))) continue;
      if (prev.v.includes(TAN_F)) continue;
      if (akhir && prev.h === "و" && (prev.v.includes(SUKUN) || !prev.v.length)) continue;
      if (s.endsWith("a")) s += "a"; else s += "aa";
      continue;
    }
    if (h === "ى" && i > 0 && g[i - 1].v.includes(TAN_F)) continue; // مَقْهًى
    if (h === "ى") { s += s.endsWith("a") ? "a" : "aa"; continue; }
    if (h === "آ") { s += (i === 0 ? "" : "'") + "aa"; continue; }
    // Lam ال tanpa harakat di depan huruf bersyaddah = syamsiyah, lebur.
    if (h === "ل" && !v.length && nx && nx.v.includes(SYADDAH) && i > 0 &&
        (g[i - 1].h === "ا" || (i === 1 && g[0].h === "ل"))) continue; // اَلشَّمْس، لِلدِّرَاسَة
    // Waw / yaa sebagai vokal panjang.
    if ((h === "و" || h === "ي") && !v.some((x) => VOKAL[x] || x === SYADDAH || TAN[x])) {
      const prevV = i > 0 ? g[i - 1].v : [];
      const pv = prevV.find((x) => VOKAL[x]);
      if (h === "و" && pv === DAMMAH) { s += "u"; continue; }
      if (h === "ي" && pv === KASRAH) { s += "i"; continue; }
      if (pv === FATHAH && v.includes(SUKUN)) { s += h === "و" ? "u" : "i"; continue; }
      if (!v.length && pv === FATHAH) { s += h === "و" ? "u" : "i"; continue; }
    }
    let k = KONS[h];
    if (k === undefined) { s += h; continue; }
    if (i === 0 && "أإؤئء".includes(h)) k = "";
    const vk0 = v.find((x) => VOKAL[x]), tn0 = v.find((x) => TAN[x]);
    if (h === "ة" && waqaf && akhir) {
      s += `(?:h|t${vk0 ? VOKAL[vk0] : tn0 ? TAN[tn0] : ""})`;
      continue;
    }
    s += v.includes(SYADDAH) ? k + k : k;
    if (v.includes(ALIF_KECIL)) { s += "aa"; continue; }
    const vk = v.find((x) => VOKAL[x]);
    const tn = v.find((x) => TAN[x]);
    // Waqaf: harakat akhir boleh dibaca atau dibuang (A1 membuang i'raab kata
    // benda tapi sering mempertahankan vokal kata kerja) — dua-duanya diterima.
    if (akhir && waqaf) {
      if (vk) s += `(?:${VOKAL[vk]})?`;
      if (tn) s += `(?:${TAN[tn]})?`;
      continue;
    }
    if (vk) s += VOKAL[vk];
    if (tn) s += TAN[tn];
  }
  // Waqaf: ة → -ah (fathah sebelumnya sudah tertulis)
  return s;
}

const JEDA = /^[.،,؟?!؛:;…]+$/;
const washal = (t) => gugus(t)[0]?.h === "ا";
export function arabKeLatin(teks) {
  const token = String(teks).split(/(\s+|[.،,؟?!؛:;…()«»"“”\-–—])/).filter((t) => t && !/^\s+$/.test(t));
  let out = [], adaSebelum = false;
  for (let i = 0; i < token.length; i++) {
    const t = token[i];
    if (JEDA.test(t) || !/[\u0621-\u064A]/.test(t)) { if (JEDA.test(t)) adaSebelum = false; out.push(t); continue; }
    const berikut = token[i + 1];
    const waqaf = berikut === undefined || JEDA.test(berikut) || /^[()«»"“”]$/.test(berikut);
    let lat = kataKeLatin(t, { waqaf, sambung: adaSebelum });
    if (adaSebelum && washal(t) && out.length) {
      const p = out.length - 1;
      // Vokal panjang di ujung kata memendek sebelum alif washal; tanwin & sukun
      // mendapat vokal penolong (ma'anil-, minal-) — boleh ditulis, boleh tidak.
      out[p] = out[p].replace(/(aa|ii|uu)$/, (m) => `${m[0]}(?:${m[0]})?`).replace(/(n|m)$/, "$1(?:i|a|u)?");
    }
    out.push(lat);
    adaSebelum = true;
  }
  return out.join(" ");
}

const ratakan = (s) => String(s).toLowerCase()
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z']/g, "");
/* Toleransi: hamzah/' di awal kata tak dihitung; 'aa' vs 'a' di ujung sebelum
   washal sering ditulis beda — dibiarkan ketat, penyunting menilai. */
/* Huruf rangkap dua-huruf boleh ditulis "azh-zhuhr" atau "az-zhuhr": pola
   zhzh menerima dua-duanya. (Dulu yang dinormalkan sisi `baca`, dan itu keliru
   untuk "baqiyat tsalaats" — t + ts bukan ts rangkap.) */
const rangkap = (pola) => pola.replace(/(ts|dz|sy|sh|dh|th|zh|kh|gh)\1/g, (_, d) => `(?:${d}${d}|${d[0]}${d})`);
const sama = (pola, baca) =>
  new RegExp(`^${pola.replace(/'/g, "").replace(/(?<!\?):/g, "").replace(/(?<!\))\?(?!:)/g, "").replace(/[^a-z()?:|]/g, "")}$`.replace(/^\^(.*)\$$/, (_, p) => `^${rangkap(p)}$`)).test(ratakan(baca).replace(/'/g, ""));

const args = process.argv.slice(2);
const iKata = args.indexOf("--kata");
if (iKata >= 0) { console.log(arabKeLatin(args[iKata + 1])); process.exit(0); }
const slug = args[0];
if (!slug) { console.error("pakai: node scripts/cek-baca-arab.mjs <slug> [--unit NN] [--kata \"…\"]"); process.exit(1); }
const iUnit = args.indexOf("--unit");
const hanya = iUnit >= 0 ? String(args[iUnit + 1]).padStart(2, "0") : null;
const DIR = `content/ebook/${slug}`;
let total = 0, beda = 0;
for (const f of readdirSync(DIR).filter((f) => /^unit-\d+\.json$/.test(f)).sort()) {
  if (hanya && !f.includes(hanya)) continue;
  const u = JSON.parse(readFileSync(`${DIR}/${f}`, "utf8"));
  const pasang = [];
  for (const d of u.dialogs ?? []) for (const l of d.lines ?? []) if (l.baca) pasang.push(["dialog", l.text, l.baca]);
  for (const v of u.vocab ?? []) if (v.baca && v.ar) {
    // "كِتَاب ج كُتُب" / "ذَهَبَ – يَذْهَبُ": bandingkan per bagian
    const ar = v.ar.split(/\s+(?:ج|–|-|\/)\s+/), la = v.baca.split(/\s+(?:j\.|–|-|\/)\s+/);
    if (ar.length === la.length) ar.forEach((a, i) => pasang.push(["kosakata", a, la[i]]));
    else pasang.push(["kosakata", v.ar, v.baca]);
  }
  for (const [asal, ar, baca] of pasang) {
    total++;
    const turunan = arabKeLatin(ar);
    if (!sama(turunan, baca)) {
      beda++;
      console.log(`${f} [${asal}] ${ar}\n    baca : ${baca}\n    harak: ${turunan}`);
    }
  }
}
console.log(`\n${slug}: ${beda} dari ${total} cara baca tak cocok dengan harakatnya`);
