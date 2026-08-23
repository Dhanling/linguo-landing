/* [ebook-translit-tata-v1] Menyematkan cara baca (ruby) ke bagian TATA BAHASA
   modul beraksara asing — judul kotak dan paragraf penjelasannya, bukan cuma
   contoh kalimatnya.

   Sebelum ini, aksara yang muncul di tengah penjelasan ("は menandai topik",
   "です berarti adalah") tampil telanjang: siswa yang belum hafal kana berhenti
   di situ, padahal kalimat contoh di bawahnya sudah beruby rapi.

   Cara bacanya TIDAK dikarang: leksikonnya diperas dari pasangan [aksara|baca]
   yang sudah tertulis di modul itu sendiri (dialog, tabel, kosakata), sisanya
   dieja dengan tabel Hepburn. Penggalan yang masih tak terbaca (kanji di luar
   leksikon) dilaporkan dan dibiarkan telanjang — tak ada tebakan diam-diam.

   Pakai:  node scripts/ebook-ruby-tata.mjs ja-a1 [--tulis]
   Tanpa --tulis, isinya cuma diperiksa (uji kering). DUMP=1 menampilkan seluruh
   pasangan aksara → cara baca yang akan disematkan, untuk diperiksa mata. */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const slug = process.argv[2];
const tulis = process.argv.includes("--tulis");
if (!slug) {
  console.error("pakai: node scripts/ebook-ruby-tata.mjs <slug-modul> [--tulis]");
  process.exit(1);
}
const dir = `content/ebook/${slug}`;

const RUBY = /\[([^[\]|]+)\|([^[\]|]+)\]/g;
/** Aksara Jepang: hiragana, katakana, kanji, pengulang 々, panjang ー. */
const AKSARA = /[぀-ヿ㐀-䶿一-鿿ｦ-ﾟ々]+/gu;
/** Setidaknya satu aksara SUNGGUHAN — bukan cuma tanda baca 。、「」. */
const ADA_AKSARA = /[ぁ-ゖァ-ヺ㐀-䶿一-鿿]/u;

/* Cara baca yang tak pernah muncul sendirian di modul — kanji yang selalu
   menempel pada kata lain, misalnya. Ditulis tangan HANYA untuk yang benar-benar
   tak ada di modul; sisanya diperas dari modulnya sendiri. */
const PAKSA = new Map(Object.entries({
  "時": "ji",                     // 4時 / 7時 / 9時 — penghitung jam
  "語": "go",                     // ～ご (語) — nama bahasa
  "個": "ko",                     // ～こ (個) — penghitung benda kecil
  "曜日": "yōbi",                 // 曜日 — nama hari
  "地下": "chika",                // 地下 — lantai bawah tanah
  "歳": "sai",                    // ～さい (歳/才) — umur
  "才": "sai",
  "たかかった": "takakatta",       // bentuk lampau kata sifat い di penjelasan
  "たかくなかった": "takaku nakatta",
  "いきたがっています": "ikitagatte imasu",
  "でした": "deshita",            // たかいでした — contoh kesalahan di penjelasan
  "できます": "dekimasu",
  "くるま": "kuruma",
  "くるまが": "kuruma ga",
  "をください": "o kudasai",       // pelekatan kana otomatis memepet keduanya
  "ています": "te imasu",
  "てもいいですか": "te mo ii desu ka",
  "たいです": "tai desu",
  "いくないです": "ikunai desu",
  "にまんごせん": "niman gosen",
  "さんひゃく": "sanhyaku",
}));

/** Leksikon [aksara → cara baca] dari seluruh berkas modul. */
function leksikon() {
  const hit = new Map();
  const walk = (o) => {
    if (typeof o === "string") {
      let m;
      RUBY.lastIndex = 0;
      while ((m = RUBY.exec(o))) {
        const k = m[1];
        const v = m[2].trim();
        if (!hit.has(k)) hit.set(k, new Map());
        const c = hit.get(k);
        c.set(v, (c.get(v) || 0) + 1);
      }
    } else if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === "object") Object.values(o).forEach(walk);
  };
  for (const f of readdirSync(dir)) if (/\.json$/.test(f)) walk(JSON.parse(readFileSync(`${dir}/${f}`, "utf8")));
  const lex = new Map();
  for (const [k, v] of hit) {
    // Huruf kecil didahulukan: bentuk berhuruf besar biasanya cuma warisan awal
    // kalimat dialog, sementara di tengah penjelasan yang wajar huruf kecil.
    const urut = [...v.entries()].sort((a, b) => {
      const ka = /^\p{Ll}/u.test(a[0]) ? 0 : 1;
      const kb = /^\p{Ll}/u.test(b[0]) ? 0 : 1;
      return ka - kb || b[1] - a[1];
    });
    lex.set(k, urut[0][0]);
  }
  for (const [k, v] of PAKSA) lex.set(k, v);
  return lex;
}

const LEX = leksikon();
const PANJANG_MAKS = Math.max(...[...LEX.keys()].map((k) => k.length));

/* Kana → rōmaji Hepburn. Dipakai HANYA untuk penggalan yang tak ada di
   leksikon modul — "じん", "くない", "たか". Tanpa ini, penggalan begitu jatuh ke
   pencocokan satu-kana dan keluar terpenggal-penggal ("ji n", "ku na i"). */
const KANA = new Map(Object.entries({
  あ: "a", い: "i", う: "u", え: "e", お: "o",
  か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko",
  が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go",
  さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
  ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
  た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
  だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do",
  な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
  は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho",
  ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
  ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
  ま: "ma", み: "mi", む: "mu", め: "me", も: "mo",
  や: "ya", ゆ: "yu", よ: "yo",
  ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro",
  わ: "wa", ゐ: "i", ゑ: "e", を: "o", ん: "n",
}));
const KANA_KECIL = new Map(Object.entries({ ゃ: "ya", ゅ: "yu", ょ: "yo", ぁ: "a", ぃ: "i", ぅ: "u", ぇ: "e", ぉ: "o" }));
/** Suku kata beraksara ya/yu/yo: き+ゃ → kya, し+ゅ → shu, ち+ょ → cho. */
const GABUNG = new Map(Object.entries({ shiya: "sha", shiyu: "shu", shiyo: "sho", chiya: "cha", chiyu: "chu", chiyo: "cho", jiya: "ja", jiyu: "ju", jiyo: "jo" }));
/** Katakana → hiragana, supaya cukup satu tabel. */
const keHiragana = (s) => s.replace(/[ァ-ヶ]/gu, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
/** Vokal panjang: おう → ō, うう → ū. えい dibiarkan "ei" seperti di modul. */
const PANJANG = [[/ou/g, "ō"], [/uu/g, "ū"], [/oo/g, "ō"], [/aa/g, "ā"]];

function hepburn(kana) {
  const h = keHiragana(kana).replace(/[ー]/gu, "");
  let out = "";
  for (let i = 0; i < h.length; i++) {
    const c = h[i];
    if (c === "っ") {                      // konsonan rangkap: がっこう → gakkō
      const b = KANA.get(h[i + 1]) ?? "";
      out += b[0] === "c" ? "t" : (b[0] ?? "");
      continue;
    }
    const kecil = KANA_KECIL.get(h[i + 1]);
    const dasar = KANA.get(c);
    if (!dasar) return null;               // kanji / tanda yang tak terbaca
    if (kecil) {
      const gab = GABUNG.get(dasar + kecil);
      out += gab ?? (dasar.replace(/i$/, "") + kecil);
      i++;
      continue;
    }
    out += dasar;
  }
  for (const [pola, ganti] of PANJANG) out = out.replace(pola, ganti);
  return out;
}

/* Kana tunggal yang memang berdiri sebagai KATA: partikel. Sisanya (あ, こ, し,
   …) cuma sepotong bunyi — kalau ikut dicocokkan, "ちか" keluar jadi "chi ka". */
const PARTIKEL = new Set(["は", "が", "を", "に", "で", "と", "も", "の", "か", "へ"]);
const KANJI = /[㐀-䶿一-鿿]/u;

/* Aksara → cara baca. null = ada kanji yang tak dikenal.

   Penggalannya TIDAK dipilih dengan pencocokan terpanjang: leksikon modul juga
   memuat penggalan sambungan ("まえで" dari "えきのまえで あいましょう"), dan yang
   terpanjang justru memenggal di tempat yang salah — えきのまえです jadi
   "eki no mae de su". Yang dipakai penggalan dengan JUMLAH POTONGAN paling
   sedikit (program dinamis): potongan leksikon murah, kana yang tak dikenal
   mahal, jadi kata utuh selalu menang atas sambungan yang kebetulan cocok. */
function baca(run) {
  const n = run.length;
  const HARGA_KANA = 2;                     // kana tak dikenal: dua kali potongan leksikon
  const best = new Array(n + 1).fill(null);
  best[0] = { harga: 0, dari: -1, teks: "", lex: false };
  for (let i = 0; i < n; i++) {
    if (!best[i]) continue;
    for (let p = Math.min(PANJANG_MAKS, n - i); p >= 1; p--) {
      const potong = run.slice(i, i + p);
      // Kana tunggal cuma diakui kalau memang partikel, dan tak boleh membuka
      // penggalan (kecuali seluruh runnya memang cuma partikel itu: "は").
      if (p === 1 && !KANJI.test(potong) && !(PARTIKEL.has(potong) && (i > 0 || n === 1))) continue;
      const b = LEX.get(potong);
      if (!b) continue;
      const harga = best[i].harga + 1;
      if (!best[i + p] || harga < best[i + p].harga) best[i + p] = { harga, dari: i, teks: b, lex: true };
    }
    if (!KANJI.test(run[i])) {
      const harga = best[i].harga + HARGA_KANA;
      if (!best[i + 1] || harga < best[i + 1].harga) best[i + 1] = { harga, dari: i, teks: run[i], lex: false };
    }
  }
  if (!best[n]) return null;
  const potongan = [];
  for (let i = n; i > 0;) { const b = best[i]; potongan.unshift({ ...b, mentah: run.slice(b.dari, i) }); i = b.dari; }
  /* Kana yang tak dikenal disatukan dulu, lalu DILEKATKAN ke tetangganya:
     にじゅう+ご = "nijūgo", bukan "nijū go"; たか+くない = "takakunai". Dalam satu
     untai aksara tanpa spasi, potongan tak dikenal hampir selalu ekor atau
     kepala kata yang sama, bukan kata tersendiri. */
  const kata = [];
  let kana = "";
  const buangKana = () => {
    if (!kana) return true;
    const h = hepburn(kana);
    if (h === null) return false;
    if (kata.length) kata[kata.length - 1] += h;   // lekat ke potongan sebelumnya
    else kata.push({ awal: h });                    // tak ada sebelumnya → lekat ke sesudahnya
    kana = "";
    return true;
  };
  for (const g of potongan) {
    if (!g.lex) { kana += g.mentah; continue; }
    if (!buangKana()) return null;
    const awal = kata.length && typeof kata[kata.length - 1] === "object" ? kata.pop().awal : "";
    kata.push(awal + g.teks);
  }
  if (!buangKana()) return null;
  const sisa = kata.map((k) => (typeof k === "object" ? k.awal : k)).filter(Boolean);
  const hasil = sisa.join(" ").replace(/\s{2,}/g, " ").trim();
  /* Huruf besar di awal cuma warisan kalimat dialog tempat cara bacanya
     terpungut ("Oshigoto wa nan desu ka"). Di tengah paragraf penjelasan yang
     wajar huruf kecil — kecuali kalau aksaranya katakana, yang di modul ini
     hampir selalu nama diri atau kata serapan. */
  return /^[ぁ-ゖ]/u.test(run) ? hasil.charAt(0).toLowerCase() + hasil.slice(1) : hasil;
}

const gagal = new Map();
const pasangan = new Map();
let disemat = 0;

/** Satu untai teks → untai yang aksaranya sudah beruby. */
function rubykan(s) {
  if (typeof s !== "string" || !ADA_AKSARA.test(s)) return s;
  // Bagian yang SUDAH beruby disimpan dulu supaya tak diruby dua kali.
  const simpan = [];
  const tanpa = s.replace(RUBY, (m) => ` ${simpan.push(m) - 1} `);
  const hasil = tanpa.replace(AKSARA, (run) => {
    if (!ADA_AKSARA.test(run)) return run;
    const b = baca(run);
    if (!b) { gagal.set(run, (gagal.get(run) || 0) + 1); return run; }
    disemat++;
    if (process.env.DUMP) pasangan.set(run, b);
    return `[${run}|${b}]`;
  });
  return hasil.replace(/ (\d+) /g, (_, i) => simpan[Number(i)]);
}

/** Kotak tata bahasa: judul + paragraf penjelasan (body & after). */
function untaiTata(g) {
  if (!g || typeof g !== "object") return [];
  const untai = [];
  if (typeof g.title === "string") untai.push(g.title);
  for (const k of ["body", "after"]) if (Array.isArray(g[k])) untai.push(...g[k].filter((x) => typeof x === "string"));
  return untai;
}

let berubah = 0;
for (const f of readdirSync(dir).filter((n) => /^unit-\d+\.json$/.test(n))) {
  const jalur = `${dir}/${f}`;
  const asli = readFileSync(jalur, "utf8");
  const u = JSON.parse(asli);
  const kotak = [];
  const kumpul = (o) => { for (const g of (o.grammars ?? (o.grammar ? [o.grammar] : []))) kotak.push(g); };
  kumpul(u);
  for (const d of (u.dialogs ?? (u.dialog ? [u.dialog] : []))) kumpul(d);

  /* Yang ditulis balik BUKAN JSON.stringify seluruh berkasnya: berkas modul
     ditata tangan (satu baris dialog = satu baris berkas) dan penulisan ulang
     akan memuaikan semuanya sehingga selisihnya tak terbaca lagi. Jadi yang
     ditukar cuma untai yang memang berubah. */
  let isi = asli;
  let n = 0;
  for (const untai of kotak.flatMap(untaiTata)) {
    const jadi = rubykan(untai);
    if (jadi === untai) continue;
    const lama = JSON.stringify(untai);
    if (!isi.includes(lama)) { console.warn(`  ! tak ketemu di ${f}: ${untai.slice(0, 40)}…`); continue; }
    isi = isi.split(lama).join(JSON.stringify(jadi));
    n++;
  }
  if (isi !== asli) {
    berubah++;
    if (tulis) writeFileSync(jalur, isi);
  }
  console.log(`${f}: ${kotak.length} kotak tata bahasa, ${n} untai beruby`);
}

if (process.env.DUMP) for (const [k, v] of pasangan) console.log(`  ${k}  |  ${v}`);
if (gagal.size) {
  console.log("\nTak ada di leksikon (tambahkan ke PAKSA kalau memang perlu beruby):");
  for (const [k, n] of [...gagal.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${k}  x${n}`);
}
console.log(`\n${disemat} penggalan diruby, ${berubah} berkas ${tulis ? "ditulis" : "akan berubah (uji kering)"}.`);
