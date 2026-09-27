#!/usr/bin/env node
// Cara baca bahasa Ukraina — konvensi modul Українська 101 (uk-a1 … uk-b2).
//
//   node scripts/baca-ukraina.mjs --kata "Добри́день, як спра́ви?"   → Do-bry-DEN', yak SPRA-vy?
//   node scripts/baca-ukraina.mjs --uji uk-a1                       → bandingkan dengan ruby tulisan tangan A1
//   node scripts/baca-ukraina.mjs --pasang <slug> [--tulis]         → sematkan ruby ke baris dialog polos
//                                                                     (meta.ruby) + isi kolom `baca` kosakata
//   node scripts/baca-ukraina.mjs --periksa <slug>                  → kata bersuku banyak yang tekanannya tak diketahui
//
// Ukraina ditulis nyaris seperti dibaca — yang tak bisa ditebak cuma TEKANAN.
// Penulis menandainya dengan akut U+0301 di vokal bertekanan (праці́ю… → працю́ю);
// kata tanpa akut dicari di leksikon A1 (ruby uk-a1) lalu di LEKSIKON di bawah.
// Kata bersuku banyak yang tak ketemu di mana pun dilaporkan oleh --periksa.
//
// Konvensi (uk-a1): suku bertekanan HURUF BESAR, kata bersuku satu kecil semua;
// г=h, ґ=g, и=y, і=i, ї=yi, й=y, є/ю/я=ye/yu/ya (juga sesudah huruf mati: lyu-DY-na),
// х=kh, ж=zh, ш=sh, щ=shch, ц=ts, ч=ch, дж=dzh, ь=', apostrof tak dibaca.
// Pemenggalan: satu huruf mati ikut suku berikut; gugus dibelah sesudah huruf
// mati pertama (shchas-LY-va, nay-KRA-shcha, u-kra-YIN-s'ko-yu).
import fs from "node:fs";
import path from "node:path";

const AKUT = "́";
const VOKAL = { а: "a", е: "e", и: "y", і: "i", о: "o", у: "u", я: "ya", ю: "yu", є: "ye", ї: "yi" };
const MATI = {
  б: "b", в: "v", г: "h", ґ: "g", д: "d", ж: "zh", з: "z", й: "y", к: "k", л: "l", м: "m", н: "n",
  п: "p", р: "r", с: "s", т: "t", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
};

// Kata yang tekanannya tetap walau penulis lupa menandai (fungsi & kata sangat umum).
// Nilainya = indeks vokal bertekanan (0 = vokal pertama).
const LEKSIKON = {
  але: 1, або: 1, тому: 1, тобто: 0, також: 0, теж: 0, дуже: 0, тільки: 0, якщо: 1, коли: 1, котра: 1,
  чому: 1, навіщо: 1, куди: 1, звідки: 0, завжди: 1, ніколи: 1, іноді: 0, сьогодні: 1, завтра: 0, вчора: 1,
  потім: 0, тепер: 1, зараз: 0, вже: 0, ще: 0, дякую: 0, будь: 0, ласка: 0, добре: 0, погано: 0, треба: 0,
  можна: 0, мене: 1, тебе: 1, його: 1, її: 1, нас: 0, вас: 0, їх: 0, мені: 1, тобі: 1, йому: 1, їй: 0,
  нам: 0, вам: 0, ним: 0, нею: 0, нами: 0, вами: 0, ними: 0, мною: 1, тобою: 1, собою: 1, себе: 1,
  цей: 0, ця: 0, це: 0, ці: 0, цього: 1, цієї: 1, цьому: 1, цих: 0, той: 0, та: 0, те: 0, ті: 0,
  мій: 0, моя: 1, моє: 1, мої: 1, твій: 0, твоя: 1, твоє: 1, твої: 1, наш: 0, наша: 0, наше: 0, наші: 0,
  ваш: 0, ваша: 0, ваше: 0, ваші: 0, свій: 0, своя: 1, своє: 1, свої: 1, який: 1, яка: 1, яке: 1, які: 1,
  хто: 0, що: 0, де: 0, як: 0, так: 0, ні: 0, не: 0, ну: 0, от: 0, ось: 0, вона: 1, воно: 1, вони: 1,
  він: 0, ми: 0, ви: 0, ти: 0, я: 0, щоб: 0, бо: 0, хоча: 1, адже: 1, отже: 0, навіть: 0, ніби: 0,
  разом: 0, дуже_: 0, вибачте: 0, пане: 0, пані: 0, добрий: 0, день: 0, привіт: 1, бувай: 1,
};

// Buang tanda tekanan saja — breve/dieresis (й, ї) wajib utuh.
const bersih = (s) => s.normalize("NFC").replace(/[\u0300\u0301]/g, "");

/** Pecah satu kata (huruf kecil, NFD-akut dipertahankan) jadi satuan bunyi. */
function satuan(w) {
  const h = [...w.normalize("NFC")].flatMap((c) => (c === "й" || c === "ї" ? [c] : [...c.normalize("NFD")]))
    .map((c) => (c === "й" ? "й" : c));
  // NFD memecah й/ї jadi huruf + tanda; satukan balik.
  const t = [];
  for (let i = 0; i < h.length; i++) {
    const c = h[i];
    if (c === "̆" && t.length && t[t.length - 1] === "и") { t[t.length - 1] = "й"; continue; }
    if (c === "̈" && t.length && t[t.length - 1] === "і") { t[t.length - 1] = "ї"; continue; }
    t.push(c);
  }
  const out = [];
  for (let i = 0; i < t.length; i++) {
    const c = t[i], n = t[i + 1];
    if (c === AKUT) { const v = [...out].reverse().find((x) => x.v); if (v) v.a = true; continue; }
    if (c in VOKAL) {
      // є/ю/я/ї sesudah huruf mati: y-nya jadi luncuran (lyu, tsya); di awal/sesudah vokal jadi suku sendiri.
      out.push({ v: VOKAL[c] });
      continue;
    }
    // ьо dibaca seperti ё: lunak + yo (TSYO-ho, dos-TAT-nyo), bukan ts'o.
    if (c === "ь" && n === "о") { out.push({ v: "yo" }); i++; continue; }
    if (c === "ь") { const p = out[out.length - 1]; if (p && p.c) p.c += "'"; continue; }
    // Apostrof tak dibaca; huruf mati di depannya ikut suku berikut seperti A1 (ka-VYAR-ni, de-VYA-tiy).
    if (c === "'" || c === "’" || c === "ʼ") continue;
    if (c === "д" && (n === "ж" || n === "з")) { out.push({ c: n === "ж" ? "dzh" : "dz" }); i++; continue; }
    // -ться/-тьс- dibaca satu bunyi ц: po-DO-ba-ye-tsya.
    if (c === "т" && n === "ь" && t[i + 2] === "с") { out.push({ c: "ts" }); i += 2; continue; }
    if (MATI[c]) out.push({ c: MATI[c], j: c === "й" });
    else out.push({ c });
  }
  return out;
}

// Hambat/desis + r/l membuka suku bersama (o-KRE-mo, ne-PRAV-da, ki-lo-HRAM) — s/z + l tidak (shchas-LY-va).
const CAIR_OK = new Set(["p", "b", "t", "d", "k", "g", "h", "kh", "f", "v"]);
const cair = (a, b) => a && b && CAIR_OK.has(a.c) && (b.c === "r" || b.c === "l");

/** Berapa huruf mati gugus yang tinggal di suku kiri. */
function belah(g) {
  if (g.length === 0) return 0;
  if (g.length === 1) return 0;
  const n = g.length;
  if (cair(g[n - 2], g[n - 1])) return n - 2;                 // nay-KRA, pe-re-KHRES-tya
  if (n === 2) return 1;                                       // DVAD-tsyat', shchas-LY-va
  // Tiga ke atas: й/р/л/м/н + s/z… → belah sesudah huruf pertama (u-kra-YIN-s'ko-yu, So-FIY-s'ko-mu);
  // selain itu cuma huruf terakhir yang membuka (stu-DENT-ka, KART-ko-yu).
  if (/^[sz]/.test(g[1].c)) return 1;
  return n - 1;
}

function suku(u) {
  const inti = u.map((x, i) => (x.v ? i : -1)).filter((i) => i >= 0);
  if (inti.length <= 1) return [{ teks: u.map((x) => x.v ?? x.c).join(""), a: false }];
  const hasil = [];
  let mulai = 0;
  for (let k = 0; k < inti.length; k++) {
    const iv = inti[k], berikut = inti[k + 1];
    if (berikut === undefined) { hasil.push(u.slice(mulai)); break; }
    const gugus = u.slice(iv + 1, berikut);
    const pisah = belah(gugus);
    hasil.push(u.slice(mulai, iv + 1 + pisah));
    mulai = iv + 1 + pisah;
  }
  return hasil.map((s) => ({ teks: s.map((x) => x.v ?? x.c).join(""), a: s.some((x) => x.v && x.a) }));
}

/** Indeks suku bertekanan dari cara baca bergaya A1 ("pra-TSYU-yu" → 1), −1 kalau tak ada. */
function iStres(baca) {
  const ss = baca.split("-");
  if (ss.length < 2) return -1;
  const huruf = ss.map((s) => s.replace(/[^A-Za-z]/g, ""));
  const i = huruf.findIndex((h, k) => h && h === h.toUpperCase() && (h.length > 1 || k > 0));
  if (i >= 0) return i;
  // suku pertama satu huruf besar ("A-le"): bertekanan kalau tak ada suku besar lain
  return huruf[0] && huruf[0] === huruf[0].toUpperCase() ? 0 : -1;
}

// ---- leksikon A1: stres dibaca balik dari ruby tulisan tangan uk-a1
let LEKS_A1 = null;
function leksA1() {
  if (LEKS_A1) return LEKS_A1;
  LEKS_A1 = new Map();
  const dir = "content/ebook/uk-a1";
  if (!fs.existsSync(dir)) return LEKS_A1;
  const R = /\[([^[\]|]+)\|([^[\]|]+)\]/g;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    for (const m of fs.readFileSync(path.join(dir, f), "utf8").matchAll(R)) {
      const iBesar = iStres(m[2]);
      if (iBesar < 0) continue;
      // indeks suku = indeks vokal, karena tiap suku satu vokal
      LEKS_A1.set(bersih(m[1].toLowerCase()), iBesar);
    }
  }
  return LEKS_A1;
}

/** Indeks vokal bertekanan: akut penulis > LEKSIKON > leksikon A1 > null. */
function tekanan(u, w) {
  const i = u.filter((x) => x.v).findIndex((x) => x.a);
  if (i >= 0) return i;
  const k = bersih(w);
  if (k in LEKSIKON) return LEKSIKON[k];
  if (leksA1().has(k)) return leksA1().get(k);
  return null;
}

/** Cara baca satu kata Ukraina. `hilang` diisi kalau tekanannya tak diketahui. */
export function bacaKata(asli, hilang) {
  const w = asli.toLowerCase();
  const kapital = asli[0] !== asli[0].toLowerCase();
  const u = satuan(w);
  const nv = u.filter((x) => x.v).length;
  let baca;
  if (nv <= 1) baca = u.map((x) => x.v ?? x.c).join("");
  else {
    const ti = tekanan(u, w);
    if (ti === null && hilang) hilang.add(bersih(asli));
    let vi = -1;
    for (const x of u) if (x.v) { vi++; x.a = vi === ti; }
    baca = suku(u).map((s) => (s.a ? s.teks.toUpperCase() : s.teks)).join("-");
  }
  if (kapital) baca = baca[0].toUpperCase() + baca.slice(1);
  if (asli === asli.toUpperCase() && asli.length > 1 && [...asli].filter((c) => c.toLowerCase() !== c).length > 1) baca = baca.toUpperCase();
  return baca;
}

// Huruf Kiril + akut gabung + apostrof di DALAM kata (кав'ярня).
const KATA = /[Ѐ-ӿ](?:[Ѐ-ӿ́̆̈]|['’ʼ](?=[Ѐ-ӿ]))*/gu;

/** Sematkan [kata|baca] ke teks polos; akut dibuang dari teks dasar. Bagian yang sudah berkurung dibiarkan. */
export function pasangRuby(teks, hilang) {
  return teks.split(/(\[[^\]]*\])/).map((bag) => (bag.startsWith("[") ? bag
    : bag.replace(KATA, (k) => `[${bersihAkut(k)}|${bacaKata(k, hilang)}]`))).join("");
}

/** Buang akut saja (й/ї tetap utuh). */
export function bersihAkut(s) {
  return s.normalize("NFC").replace(/́/g, "");
}

/** Cara baca frasa polos (kolom vocab `baca`). */
export function bacaFrasa(teks, hilang) {
  return teks.replace(/\([^)]*\)/g, "").replace(KATA, (k) => bacaKata(k, hilang))
    .replace(/[;!?…«»"]/g, "").replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------- CLI
const langsung = import.meta.url === `file://${process.argv[1]}`;
const arg = langsung ? process.argv.slice(2) : [];
const bacaJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const berkas = (slug) => fs.readdirSync(`content/ebook/${slug}`).filter((f) => /^unit-\d+\.json$/.test(f)).sort().map((f) => path.join("content/ebook", slug, f));

if (arg[0] === "--kata") {
  const hilang = new Set();
  console.log(pasangRuby(arg.slice(1).join(" "), hilang).replace(/\[([^|\]]+)\|([^\]]+)\]/g, "$2"));
  if (hilang.size) console.log(`⚠️ tanpa tekanan: ${[...hilang].join(", ")}`);
} else if (arg[0] === "--uji") {
  const R = /\[([^[\]|]+)\|([^[\]|]+)\]/g;
  const beda = new Map();
  let total = 0;
  LEKS_A1 = new Map(); // uji aturan murni: tekanan diambil dari ruby itu sendiri
  for (const f of berkas(arg[1])) {
    for (const m of fs.readFileSync(f, "utf8").matchAll(R)) {
      total++;
      // pasang akut di vokal suku yang ditulis besar
      const ib = iStres(m[2]);
      let w = m[1];
      if (ib >= 0) {
        let vi = -1;
        w = [...m[1]].map((c) => (c.toLowerCase() in VOKAL && ++vi === ib ? c + AKUT : c)).join("");
      }
      const g = bacaKata(w);
      const kecil = (x) => x[0].toLowerCase() + x.slice(1);
      if (kecil(g) !== kecil(m[2])) beda.set(m[1], `${m[2]}  ≠  ${g}`);
    }
  }
  for (const [k, v] of beda) console.log(`${k}: ${v}`);
  console.log(`\n${beda.size} kata berbeda dari ${total} ruby`);
} else if (arg[0] === "--pasang" || arg[0] === "--periksa") {
  const slug = arg[1];
  const tulis = arg.includes("--tulis");
  const hilang = new Map();
  let nRuby = 0, nBaca = 0;
  const meta = bacaJson(`content/ebook/${slug}/meta.json`);
  const kunci = (meta.vocab_columns ?? [])[0]?.key ?? "uk";
  for (const f of berkas(slug)) {
    const u = bacaJson(f);
    const h = new Set();
    for (const d of u.dialogs ?? []) for (const l of d.lines ?? []) {
      if (meta.ruby) {
        if (!l.text.includes("[")) { l.text = pasangRuby(l.text, h); nRuby++; }
      }
      // Modul tanpa ruby (B2): dialog sengaja Kiril polos — tak diperiksa tekanannya.
    }
    for (const v of u.vocab ?? []) {
      if (!v[kunci]) continue;
      if (!v.baca) { v.baca = bacaFrasa(v[kunci], h); nBaca++; }
    }
    if (h.size) hilang.set(path.basename(f), h);
    if (tulis && arg[0] === "--pasang") fs.writeFileSync(f, JSON.stringify(u, null, 1) + "\n");
  }
  for (const [f, h] of hilang) console.log(`⚠️ ${f} tanpa tekanan: ${[...h].join(", ")}`);
  if (arg[0] === "--pasang") console.log(`${nRuby} baris dialog diberi ruby, ${nBaca} kosakata diberi cara baca${tulis ? "" : " (uji kering — tambah --tulis)"}`);
  if (hilang.size) process.exitCode = 1;
} else if (langsung) {
  console.log("pakai: --kata <teks> | --uji <slug> | --pasang <slug> [--tulis] | --periksa <slug>");
}
