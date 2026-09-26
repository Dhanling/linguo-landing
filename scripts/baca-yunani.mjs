#!/usr/bin/env node
// Cara baca bahasa Yunani — konvensi modul Ελληνικά 101 (el-a1 … el-b2).
//
//   node scripts/baca-yunani.mjs --kata "Καλημέρα, τι κάνεις;"   → Ka-li-MÉ-ra, ti KA-nis;
//   node scripts/baca-yunani.mjs --uji el-a1                      → bandingkan dengan ruby yang sudah ada
//   node scripts/baca-yunani.mjs --pasang <slug> [--tulis]        → sematkan ruby ke baris dialog yang masih
//                                                                   polos + isi kolom `baca` kosakata yang kosong
//   node scripts/baca-yunani.mjs --periksa <slug>                 → kata bersuku banyak tanpa tanda tekanan (salah ketik)
//
// Konvensi (bab "Gabungan huruf, tekanan…" el-a1): suku bertekanan HURUF BESAR,
// kata bersuku satu kecil semua; é untuk ε/αι (e Yunani tak pernah pepet);
// dh=δ, th=θ, gh=γ, kh=χ, y=γ di depan bunyi é/i; αυ/ευ → av/ev, af/ef di depan
// huruf keras; μπ/ντ/γκ → b/d/g di awal kata, mb/nd/ng di tengah; huruf mati
// ganda dibaca tunggal. Kata Yunani berhuruf kapital → cara bacanya juga.
//
// Sinizesis (ι + vokal jadi satu suku: παιδιά → pé-DHIA) sebagian leksikal —
// aturan umumnya di bawah, pengecualian di LEKSIKON.
import fs from "node:fs";
import path from "node:path";

const AKSEN = { ά: "α", έ: "ε", ή: "η", ί: "ι", ό: "ο", ύ: "υ", ώ: "ω", ΐ: "ϊ", ΰ: "ϋ" };
const VOKAL = new Set("αεηιουωϊϋ");
const KERAS = new Set("θκξπστφχψ");
const DEPAN = new Set(["é", "i"]); // bunyi depan: γ → y
const MATI = { β: "v", γ: "gh", δ: "dh", ζ: "z", θ: "th", κ: "k", λ: "l", μ: "m", ν: "n", ξ: "ks", π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", φ: "f", χ: "kh", ψ: "ps" };
// Gugus yang boleh membuka suku kata (dalam ejaan cara baca).
// Di tengah kata, gugus hambat+hambat (pt, ft, kht, thm) dibelah seperti el-a1:
// lép-TO, éf-TA, okh-TO, stath-MOS; hambat+cair/sengau dan s+huruf mati tetap utuh.
const AWALAN = new Set([
  "vl", "vr", "ghl", "ghn", "ghr", "dhr", "thl", "thn", "thr", "kl", "kn", "kr", "ks",
  "mn", "pl", "pn", "pr", "ps", "sv", "sth", "sk", "sl", "sm", "sn", "sp", "st", "sf", "skh", "sdh", "tm", "tr", "ts", "dz",
  "fl", "fr", "khl", "khn", "khr", "gl", "gr", "bl", "br", "dr", "zv", "zm",
  "skl", "skr", "spl", "spr", "str", "sfr", "skhr", "skhn",
]);

// Kata yang cara bacanya tak mengikuti aturan (nama diri, pinjaman, sinizesis leksikal).
const LEKSIKON = {
  μπούντι: "BU-di", συγγνώμη: "si-GHNO-mi", πιείτε: "PI-té", πιει: "pi", διάσημη: "dhi-A-si-mi", διάσημος: "dhi-A-si-mos",
  διάθεση: "dhi-A-thé-si", μπαμπάνγκ: "ba-BANG", εντάξει: "é-DA-ksi", σάντουιτς: "SAN-du-its",
  οικογένεια: "i-ko-YÉ-ni-a", φοιτήτρια: "fi-TI-tri-a", αύριο: "AV-ri-o", κύριος: "KI-ri-os", κύριε: "KI-ri-é",
  κυρία: "ki-RI-a", κυριακή: "ki-ria-KI", ράδιο: "RA-dhi-o",
  στάδιο: "STA-dhi-o", μάιος: "MA-i-os", βιβλίο: "vi-VLI-o", ιστορία: "i-sto-RI-a",
  ωραία: "o-RÉ-a", βέβαια: "VÉ-vé-a", τσάι: "TSA-i",
};

const tanpaAksen = (s) => [...s].map((c) => AKSEN[c] ?? c).join("");

/** Pecah satu kata Yunani (huruf kecil) jadi satuan bunyi: {v, t, a} vokal / {c, t} mati. */
function satuan(w) {
  const h = [...w];
  const out = [];
  for (let i = 0; i < h.length; i++) {
    const c = h[i], n = h[i + 1], nb = n && (AKSEN[n] ?? n), cb = AKSEN[c] ?? c;
    const aksenC = c in AKSEN, aksenN = n in AKSEN && !"ϊϋΐΰ".includes(n);
    if (VOKAL.has(cb)) {
      // Diftong/gabungan: huruf kedua ι/υ tanpa dieresis, huruf pertama tanpa aksen.
      if (!aksenC && n && (nb === "ι" || nb === "υ") && n !== "ϊ" && n !== "ϋ" && n !== "ΐ" && n !== "ΰ") {
        const pas = cb + nb;
        if (pas === "ου") { out.push({ v: "u", a: aksenN }); i++; continue; }
        if (pas === "αι") { out.push({ v: "é", a: aksenN }); i++; continue; }
        if (pas === "ει" || pas === "οι" || pas === "υι") { out.push({ v: "i", a: aksenN, gab: pas }); i++; continue; }
        if (pas === "αυ" || pas === "ευ" || pas === "ηυ") {
          const sesudah = h[i + 2] && (AKSEN[h[i + 2]] ?? h[i + 2]);
          const f = !sesudah || KERAS.has(sesudah);
          out.push({ v: { α: "a", ε: "é", η: "i" }[cb], a: aksenN });
          out.push({ c: f ? "f" : "v", koda: true });
          i++; continue;
        }
      }
      const v = { α: "a", ε: "é", η: "i", ι: "i", ο: "o", υ: "i", ω: "o", ϊ: "i", ϋ: "i" }[cb];
      out.push({ v, a: aksenC || c === "ΐ" || c === "ΰ", i: cb === "ι" });
      continue;
    }
    // Gabungan huruf mati
    const dua = c + (n ?? "");
    const awal = out.length === 0;
    if (dua === "μπ") { out.push(awal ? { c: "b" } : { c: "m" }, ...(awal ? [] : [{ c: "b" }])); i++; continue; }
    if (dua === "ντ") { out.push(awal ? { c: "d" } : { c: "n" }, ...(awal ? [] : [{ c: "d" }])); i++; continue; }
    if (dua === "γκ" || dua === "γγ") { out.push(awal ? { c: "g" } : { c: "n" }, ...(awal ? [] : [{ c: "g" }])); i++; continue; }
    if (dua === "τσ") { out.push({ c: "ts", satu: true }); i++; continue; }
    if (dua === "τζ") { out.push({ c: "dz", satu: true }); i++; continue; }
    if (c === n && c !== "γ") continue; // huruf mati ganda dibaca tunggal
    if (c === "γ" && (n === "χ" || n === "ξ")) { out.push({ c: "n" }); continue; } // συγχαρητήρια
    if (MATI[c]) out.push({ c: MATI[c], g: c === "γ", x: c === "χ" });
    else out.push({ c }); // bukan huruf Yunani — biarkan
  }
  // γ di depan bunyi depan → y; γι/γει + vokal → y + vokal (γεια, γιατρός)
  for (let i = 0; i < out.length; i++) {
    const u = out[i];
    if (!u.g) continue;
    const s = out[i + 1];
    if (s && s.v && DEPAN.has(s.v)) {
      u.c = "y";
      const s2 = out[i + 2];
      if ((s.i || s.gab === "ει") && !s.a && s2 && s2.v) out.splice(i + 1, 1);
    }
  }
  return out;
}

/** Sinizesis: ι tanpa aksen + vokal → satu suku (παιδιά, χωριό, μια, πιο, χάπια). */
function lebur(u) {
  for (let i = 0; i < u.length - 1; i++) {
    const a = u[i], b = u[i + 1];
    if (!a.v || !b.v || a.a) continue;
    // ποιος; τελειώνω (ει + vokal bertekanan)
    const bunyiI = a.i || (a.gab === "οι" && i === 1 && u[0].c === "p") || (a.gab === "ει" && b.a && !u.slice(0, i).some((x) => x.a));
    if (!bunyiI) continue;
    const sebelum = u.slice(0, i).reverse();
    const matiSebelum = [];
    for (const s of sebelum) { if (s.v) break; matiSebelum.push(s); }
    if (!b.a) {
      // ι tanpa tekanan di depan vokal tanpa tekanan: lebur kalau didahului satu huruf mati selain r
      if (matiSebelum.length !== 1 || matiSebelum[0].c === "r") continue;
    } else if (matiSebelum.length === 0) continue;
    u.splice(i, 2, { v: "i" + b.v, a: b.a });
  }
  return u;
}

function suku(u) {
  const inti = u.map((x, i) => (x.v ? i : -1)).filter((i) => i >= 0);
  if (!inti.length) return [u.map((x) => x.c).join("")];
  const hasil = [];
  let mulai = 0;
  for (let k = 0; k < inti.length; k++) {
    const iv = inti[k];
    const berikut = inti[k + 1];
    if (berikut === undefined) { hasil.push(u.slice(mulai)); break; }
    const gugus = u.slice(iv + 1, berikut);
    // Cari akhiran gugus terpanjang yang boleh membuka suku.
    let pisah = gugus.length; // semua ke suku berikut? mulai dari 0 huruf
    for (let j = gugus[0]?.koda && gugus.length > 1 ? 1 : 0; j <= gugus.length; j++) {
      const ekor = gugus.slice(j).map((x) => x.c).join("");
      if (gugus.length - j <= 1 || AWALAN.has(ekor)) { pisah = j; break; }
    }
    hasil.push(u.slice(mulai, iv + 1 + pisah));
    mulai = iv + 1 + pisah;
  }
  return hasil.map((s) => ({ teks: s.map((x) => x.v ?? x.c).join(""), a: s.some((x) => x.v && x.a) }));
}

/** Cara baca satu kata Yunani. */
export function bacaKata(asli) {
  const w = asli.toLowerCase().normalize("NFC");
  const kapital = asli[0] !== asli[0].toLowerCase();
  let baca;
  if (LEKSIKON[w]) baca = LEKSIKON[w];
  else {
    const ss = suku(lebur(satuan(w)));
    if (typeof ss[0] === "string") baca = ss[0];
    else baca = ss.map((s) => (s.a && ss.length > 1 ? s.teks.toUpperCase() : s.teks)).join("-");
  }
  if (kapital) baca = baca[0].toUpperCase() + baca.slice(1);
  return baca;
}

const KATA = /[Ͱ-Ͽἀ-῿]+/gu;

/** Sematkan [kata|baca] ke teks polos. Bagian yang sudah berkurung dibiarkan. */
export function pasangRuby(teks) {
  return teks.split(/(\[[^\]]*\])/).map((bag) => (bag.startsWith("[") ? bag : bag.replace(KATA, (k) => `[${k}|${bacaKata(k)}]`))).join("");
}

/** Cara baca frasa polos (kolom vocab `baca`). */
export function bacaFrasa(teks) {
  return teks.replace(KATA, (k) => bacaKata(k)).replace(/[;!?…'’]/g, "").replace(/\s+/g, " ").trim();
}

/** Yunani membuang aksen di huruf besar (ΕΛΛΗΝΙΚΑ, bukan ΕΛΛΗΝΙΚΆ) — dieresis tetap. */
export function kapital(teks) {
  return teks.replace(KATA, (k) => k.normalize("NFD").replace(/[\u0300-\u0307\u0309-\u036f]/g, "").normalize("NFC").toUpperCase());
}

/** Judul h3 & kepala tabel dicetak text-transform: uppercase oleh perakit → tulis Yunaninya sudah kapital. */
function rapikanKapital(obj) {
  const ubah = (s) => (typeof s === "string" ? kapital(s) : s);
  const jalan = (x, kunci) => {
    if (Array.isArray(x)) return x.forEach((v) => jalan(v, kunci));
    if (!x || typeof x !== "object") return;
    if (Array.isArray(x.head)) x.head = x.head.map(ubah);
    if (x.table && Array.isArray(x.table.head)) x.table.head = x.table.head.map(ubah);
    for (const [k, v] of Object.entries(x)) jalan(v, k);
  };
  jalan(obj);
  for (const d of obj.dialogs ?? []) d.title = ubah(d.title);
  for (const s of [...(obj.sections ?? []), ...(obj.front ?? []), ...(obj.back ?? [])]) if (s.title) s.title = ubah(s.title);
}

/** Kata bersuku banyak tanpa tanda tekanan = hampir pasti salah ketik. */
function tanpaTekanan(k) {
  if (k === k.toUpperCase()) return false; // huruf besar memang tanpa aksen
  const w = k.toLowerCase();
  if (/[άέήίόύώΐΰ]/.test(w)) return false;
  const u = lebur(satuan(w));
  return u.filter((x) => x.v).length > 1;
}

// ---------------------------------------------------------------- CLI
const langsung = import.meta.url === `file://${process.argv[1]}`;
const arg = langsung ? process.argv.slice(2) : [];
const bacaJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const berkas = (slug) => fs.readdirSync(`content/ebook/${slug}`).filter((f) => /^unit-\d+\.json$/.test(f)).sort().map((f) => path.join("content/ebook", slug, f));

if (arg[0] === "--kata") {
  console.log(pasangRuby(arg.slice(1).join(" ")).replace(/\[([^|\]]+)\|([^\]]+)\]/g, "$2"));
} else if (arg[0] === "--uji") {
  const R = /\[([^[\]|]+)\|([^[\]|]+)\]/g;
  const beda = new Map();
  let total = 0;
  for (const f of berkas(arg[1])) {
    for (const m of fs.readFileSync(f, "utf8").matchAll(R)) {
      total++;
      const g = bacaKata(m[1]);
      if (g.replace(/-/g, "") !== m[2].replace(/-/g, "")) beda.set(m[1], `${m[2]}  ≠  ${g}`);
    }
  }
  for (const [k, v] of beda) console.log(`${k}: ${v}`);
  console.log(`\n${beda.size} kata berbeda dari ${total} ruby`);
} else if (arg[0] === "--pasang" || arg[0] === "--periksa") {
  const slug = arg[1];
  const tulis = arg.includes("--tulis");
  const salah = new Set();
  let nRuby = 0, nBaca = 0;
  const meta = bacaJson(`content/ebook/${slug}/meta.json`);
  const kunci = (meta.vocab_columns ?? [])[0]?.key ?? "el";
  for (const f of berkas(slug)) {
    const u = bacaJson(f);
    // Markdown (**ός**) dibuang dulu; potongan ekor/batang bertanda hubung (-ουμε, μαθητ-) bukan kata utuh.
    const periksa = (s) => {
      for (const m of String(s).replace(/\*+/g, "").matchAll(KATA)) {
        if (/[-‑]/.test(m.input[m.index - 1] ?? "") || /[-‑]/.test(m.input[m.index + m[0].length] ?? "")) continue;
        if (tanpaTekanan(m[0])) salah.add(`${path.basename(f)}: ${m[0]}`);
      }
    };
    JSON.stringify(u, (k, v) => { if (typeof v === "string") periksa(v.replace(/\[[^|\]]+\|/g, "[")); return v; });
    if (arg[0] === "--pasang") {
      rapikanKapital(u);
      for (const d of u.dialogs ?? []) for (const l of d.lines ?? []) {
        if (meta.ruby && !l.text.includes("[")) { l.text = pasangRuby(l.text); nRuby++; }
      }
      for (const v of u.vocab ?? []) if (!v.baca && v[kunci]) { v.baca = bacaFrasa(v[kunci]); nBaca++; }
      if (tulis) fs.writeFileSync(f, JSON.stringify(u, null, 1) + "\n");
    }
  }
  if (arg[0] === "--pasang") {
    rapikanKapital(meta);
    if (tulis) fs.writeFileSync(`content/ebook/${slug}/meta.json`, JSON.stringify(meta, null, 1) + "\n");
  }
  for (const s of salah) console.log(`⚠️ tanpa tekanan: ${s}`);
  if (arg[0] === "--pasang") console.log(`${nRuby} baris dialog diberi ruby, ${nBaca} kosakata diberi cara baca${tulis ? "" : " (uji kering — tambah --tulis)"}`);
  if (salah.size) process.exitCode = 1;
} else if (langsung) {
  console.log("pakai: --kata <teks> | --uji <slug> | --pasang <slug> [--tulis] | --periksa <slug>");
}
