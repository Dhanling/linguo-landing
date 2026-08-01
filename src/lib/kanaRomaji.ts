// [watch-ruby-jepang-v1] Penjajaran bacaan Latin (romaji) ke KATA Jepang.
//
// Masalahnya: baris romaji dari AI cuma satu string ("pan to kōhī o tabemasu"),
// sedangkan subtitle Jepang dipecah jadi kata oleh Intl.Segmenter
// (パン|と|コーヒー|を|食|べ|ます). Jumlahnya hampir tak pernah sama, dan jalur
// "hitung suku kata" yang dipakai Mandarin gagal total di Jepang: 1 kanji ≠ 1 suku
// kata, tanda panjang「ー」bukan suku kata, dan「っ」cuma menggandakan konsonan.
// Akibatnya bacaan romaji jatuh ke baris utuh di atas kalimat, tidak menumpuk rapi
// per kata seperti pinyin.
//
// Cara kerja modul ini: kana bisa dibaca DETERMINISTIK (か=ka, ヒ=hi, …), jadi kana
// dipakai sebagai JANGKAR. Kita jalan dari kiri ke kanan menyusuri aksara Jepang
// sambil "memakan" huruf romaji-nya:
//   • kana  → cocokkan romajinya di posisi sekarang (beserta varian umum:
//             shi/si, tsu/tu, ji/zi, は→ha|wa, を→o|wo …)
//   • kanji/angka → panjangnya tak diketahui → cari jangkar kana BERIKUTNYA di
//             sisa string romaji; semua huruf sebelum jangkar itu milik si kanji.
// Hasil akhirnya: tiap AKSARA target punya rentang huruf romaji sendiri → bacaan
// tiap KATA = gabungan rentang aksaranya (dipotong dari string romaji ASLI supaya
// makron "kōhī" tetap utuh).
//
// Kalau ada satu saja langkah yang tak cocok (jangkar tak ketemu, kana meleset),
// seluruh penjajaran DIBATALKAN (null) → pemanggil balik ke baris romaji utuh.
// Lebih baik tak menumpuk daripada menumpuk di atas kata yang salah.

/** Romaji dasar tiap kana (kunci hiragana; katakana dinormalkan dulu). */
const KANA_ROMAJI: Record<string, string[]> = {
  あ: ["a"], い: ["i"], う: ["u"], え: ["e"], お: ["o"],
  か: ["ka"], き: ["ki"], く: ["ku"], け: ["ke"], こ: ["ko"],
  が: ["ga"], ぎ: ["gi"], ぐ: ["gu"], げ: ["ge"], ご: ["go"],
  さ: ["sa"], し: ["shi", "si"], す: ["su"], せ: ["se"], そ: ["so"],
  ざ: ["za"], じ: ["ji", "zi"], ず: ["zu"], ぜ: ["ze"], ぞ: ["zo"],
  た: ["ta"], ち: ["chi", "ti"], つ: ["tsu", "tu"], て: ["te"], と: ["to"],
  だ: ["da"], ぢ: ["ji", "di"], づ: ["zu", "du"], で: ["de"], ど: ["do"],
  な: ["na"], に: ["ni"], ぬ: ["nu"], ね: ["ne"], の: ["no"],
  // は & へ jadi "wa"/"e" kalau dipakai sebagai partikel — dua-duanya diterima.
  は: ["ha", "wa"], ひ: ["hi"], ふ: ["fu", "hu"], へ: ["he", "e"], ほ: ["ho"],
  ば: ["ba"], び: ["bi"], ぶ: ["bu"], べ: ["be"], ぼ: ["bo"],
  ぱ: ["pa"], ぴ: ["pi"], ぷ: ["pu"], ぺ: ["pe"], ぽ: ["po"],
  ま: ["ma"], み: ["mi"], む: ["mu"], め: ["me"], も: ["mo"],
  や: ["ya"], ゆ: ["yu"], よ: ["yo"],
  ら: ["ra", "la"], り: ["ri", "li"], る: ["ru", "lu"], れ: ["re", "le"], ろ: ["ro", "lo"],
  わ: ["wa"], ゐ: ["i", "wi"], ゑ: ["e", "we"], を: ["o", "wo"],
  // ん sering ditulis "m" di depan b/p/m ("shimbun"), dan "n'" (apostrof dibuang
  // saat normalisasi) di depan vokal.
  ん: ["n", "m"],
  ゔ: ["vu", "bu"],
};

/** Kana kecil ya/yu/yo → digraf (きゃ = kya, しゃ = sha). */
const SMALL_Y: Record<string, string> = { ゃ: "a", ゅ: "u", ょ: "o" };
/** Kana kecil vokal → bunyi serapan (ファ = fa, ティ = ti). */
const SMALL_V: Record<string, string> = { ぁ: "a", ぃ: "i", ぅ: "u", ぇ: "e", ぉ: "o", ゎ: "a" };

const VOWELS = "aiueo";

/** Katakana → hiragana (biar tabelnya cukup satu). Sisanya dibiarkan apa adanya. */
function toHira(ch: string): string {
  const c = ch.codePointAt(0)!;
  // ァ..ヶ (0x30A1..0x30F6) sejajar dengan ぁ..ゖ di 0x3041..0x3096.
  if (c >= 0x30a1 && c <= 0x30f6) return String.fromCodePoint(c - 0x60);
  return ch;
}

function isKanaChar(ch: string): boolean {
  const h = toHira(ch);
  return !!KANA_ROMAJI[h] || !!SMALL_Y[h] || !!SMALL_V[h] || h === "っ" || ch === "ー" || ch === "ｰ";
}

/** Buang vokal di ujung: ki→k, shi→sh, chi→ch, ji→j, u→"" */
function stem(r: string): string {
  return r.replace(/[aiueo]+$/, "");
}

function digraphY(base: string[], v: string, kana: string): string[] {
  const out: string[] = [];
  for (const b of base) {
    const s = stem(b);
    if (s === "sh" || s === "ch" || s === "j") {
      out.push(s + v);        // sha, chu, jo
      out.push(s + "y" + v);  // shya, jya (varian yang kadang dipakai)
    } else {
      out.push((s || (kana === "い" ? "" : s)) + "y" + v); // kya, nyu, ryo
    }
  }
  return out;
}

function smallVowelCombo(base: string[], v: string): string[] {
  return base.map((b) => {
    const s = stem(b);
    if (!s) return "w" + v; // ウィ = wi
    return s + v;           // ファ = fa, ティ = ti, ヴォ = vo
  });
}

/**
 * Cocokkan SATU aksara kana (beserta kana kecil yang menempel) pada posisi `pos`
 * di string romaji ternormalisasi. `null` kalau tak cocok.
 * `chars` = aksara target, `i` = indeks aksara yang dicocokkan.
 */
function matchKana(
  chars: string[],
  i: number,
  r: string,
  pos: number
): { chars: number; len: number } | null {
  const raw = chars[i];
  const ch = toHira(raw);

  // 「ー」/「っ」 tak punya bunyi sendiri.
  if (raw === "ー" || raw === "ｰ") {
    // Vokal panjang: "koohii" → makan 1 huruf; "kōhī" (makron dibuang saat
    // normalisasi) → tak makan apa-apa.
    const prev = pos > 0 ? r[pos - 1] : "";
    if (r[pos] && VOWELS.includes(r[pos]) && (r[pos] === prev || prev === "")) {
      return { chars: 1, len: 1 };
    }
    // "ou"/"oh" untuk ō juga sering muncul.
    if (r[pos] === "u" && prev === "o") return { chars: 1, len: 1 };
    return { chars: 1, len: 0 };
  }
  if (ch === "っ") {
    // Konsonan ganda: まって → "matte" (makan 1 't'). Kalau romaji-nya tak
    // menggandakan, tak makan apa-apa.
    const c = r[pos];
    if (c && !VOWELS.includes(c) && /[a-z]/.test(c)) return { chars: 1, len: 1 };
    return { chars: 1, len: 0 };
  }

  const base = KANA_ROMAJI[ch];
  if (!base) return null;

  // Kana kecil yang menempel → digraf.
  let cands = base;
  let take = 1;
  const nxt = chars[i + 1] ? toHira(chars[i + 1]) : "";
  if (nxt && SMALL_Y[nxt]) {
    cands = digraphY(base, SMALL_Y[nxt], ch);
    take = 2;
  } else if (nxt && SMALL_V[nxt]) {
    cands = smallVowelCombo(base, SMALL_V[nxt]);
    take = 2;
  }

  // Coba kandidat terpanjang dulu supaya "shi" menang atas "si".
  const sorted = [...cands].sort((a, b) => b.length - a.length);
  for (const c of sorted) {
    if (r.startsWith(c, pos)) return { chars: take, len: c.length };
  }

  // Vokal panjang yang ditulis makron: とう→"tō" (jadi "to"), えい→"ē".
  // Huruf う/い-nya tak punya wakil di romaji → boleh dilewati tanpa makan huruf.
  if ((ch === "う" || ch === "い") && pos > 0 && VOWELS.includes(r[pos - 1])) {
    return { chars: 1, len: 0 };
  }
  return null;
}

/**
 * Coba cocokkan deret kana mulai aksara `i` di posisi `pos` — dipakai buat
 * memastikan sebuah jangkar benar-benar pas (minimal 2 huruf romaji cocok).
 */
function matchRun(chars: string[], i: number, r: string, pos: number, maxKana: number) {
  let len = 0;
  let n = 0;
  let ci = i;
  let p = pos;
  while (ci < chars.length && n < maxKana && isKanaChar(chars[ci])) {
    const m = matchKana(chars, ci, r, p);
    if (!m) break;
    ci += m.chars;
    p += m.len;
    len += m.len;
    n++;
  }
  return { len, kana: n, endChar: ci };
}

/** 「っ」(konsonan ganda) &「ー」(vokal panjang) — tak punya bunyi sendiri. */
function isFillerKana(ch: string): boolean {
  const h = toHira(ch);
  return h === "っ" || ch === "ー" || ch === "ｰ";
}

/** Banyak kata romaji di rentang [from, to). */
function countTokens(startsTok: boolean[], from: number, to: number): number {
  let n = 0;
  for (let q = from; q < to; q++) if (q === from || startsTok[q]) n++;
  return n;
}

export type TranslitToken = { text: string; k: number };

/**
 * Susun token bacaan Latin per KATA untuk kalimat Jepang.
 * `words` = keluaran splitWords (kata + pemisah), `translit` = baris romaji utuh.
 * Balikan: token yang, kalau digabung, sama persis dengan `translit`; token kata
 * bawa `k` = ordinal kata target (dipakai buat ruby & sorotan sinkron).
 */
export function alignJapaneseTranslit(
  words: { text: string; isWord: boolean }[],
  translit: string
): TranslitToken[] | null {
  if (!translit.trim()) return null;

  // Normalisasi romaji: huruf kecil, makron/diakritik dibuang, hanya a-z0-9 yang
  // disimpan. `map` menunjuk balik ke posisi di string ASLI supaya potongan yang
  // ditampilkan tetap bermakron ("kōhī").
  const normChars: string[] = [];
  const map: number[] = [];
  for (let i = 0; i < translit.length; i++) {
    const d = translit[i].normalize("NFD").toLowerCase();
    for (const c of d) {
      if (/[a-z0-9]/.test(c)) {
        normChars.push(c);
        map.push(i);
      }
    }
  }
  const r = normChars.join("");
  if (!r) return null;
  // Huruf ke-n memulai KATA romaji baru? (di antaranya ada spasi/tanda baca di
  // string asli — tanda gabung/makron tak dihitung). Dipakai buat memilih jangkar:
  // partikel seperti を = "o" cuma 1 huruf, terlalu pendek untuk dipercaya di
  // tengah kata, tapi sangat bisa dipercaya kalau dia berdiri sebagai kata sendiri.
  const startsTok = normChars.map((_, n) => {
    if (n === 0) return true;
    return /[^\p{M}]/u.test(translit.slice(map[n - 1] + 1, map[n]));
  });

  // Aksara target (hanya token kata) + ordinal kata tiap aksara.
  const chars: string[] = [];
  const charK: number[] = [];
  let k = -1;
  for (const w of words) {
    if (!w.isWord) continue;
    k++;
    for (const ch of Array.from(w.text)) {
      chars.push(ch);
      charK.push(k);
    }
  }
  if (!chars.length) return null;
  const wordCount = k + 1;

  // Rentang huruf romaji tiap aksara target.
  const spanStart = new Array<number>(chars.length).fill(-1);
  const spanEnd = new Array<number>(chars.length).fill(-1);

  let i = 0;
  let pos = 0;
  let anchors = 0; // banyak kana yang benar-benar tersambung ke huruf romaji
  while (i < chars.length) {
    if (isKanaChar(chars[i])) {
      const m = matchKana(chars, i, r, pos);
      if (!m) return null; // kana meleset → penjajaran tak bisa dipercaya
      for (let j = i; j < i + m.chars && j < chars.length; j++) {
        spanStart[j] = pos;
        spanEnd[j] = pos + m.len;
      }
      if (m.len > 0) anchors++;
      i += m.chars;
      pos += m.len;
      continue;
    }

    // Deret aksara yang bacaannya tak diketahui (kanji, angka, huruf asing).
    // 「っ」&「ー」ikut ditelan: keduanya tak punya bunyi sendiri, jadi tak bisa
    // dipakai sebagai jangkar (jangkar「っ」di "matte" nyangkut di huruf 'm').
    let j = i;
    while (j < chars.length && (!isKanaChar(chars[j]) || isFillerKana(chars[j]))) j++;
    const unknownCount = j - i;
    // Berapa KATA target yang tercakup deret ini — dua kata kanji bersebelahan sering
    // menyatu di sini karena tanda baca di antaranya bukan "kata" (昨日、友達).
    const runWords = new Set(charK.slice(i, j)).size;
    let end: number;
    if (j >= chars.length) {
      end = r.length; // sisa romaji milik kanji terakhir
    } else {
      // Cari posisi jangkar kana berikutnya. Tiap aksara tak dikenal minimal
      // 1 huruf romaji → mulai cari dari pos + unknownCount.
      // Dua babak, biar jangkar tak nyangkut di tengah bacaan kanji-nya sendiri
      // ("と" nyangkut di "tOmodachi" bikin 友達 kehilangan bacaannya):
      //   1. KUAT — jangkar jatuh pas di AWAL kata romaji ("… to …", "… o …") DAN
      //      menyisakan cukup kata romaji untuk semua kata kanji di deret ini.
      //   2. LEMAH — di tengah kata, tapi minimal 2 huruf cocok (mis. "i|ki|mashita").
      const from = pos + unknownCount;
      let found = -1;
      for (let p = from; p <= r.length; p++) {
        if (!startsTok[p]) continue;
        if (countTokens(startsTok, pos, p) < runWords) continue;
        const run = matchRun(chars, j, r, p, 3);
        if (run.kana > 0 && run.len >= 1) {
          found = p;
          break;
        }
      }
      if (found < 0) {
        for (let p = from; p <= r.length; p++) {
          const run = matchRun(chars, j, r, p, 3);
          if (run.kana > 0 && (run.len >= 2 || run.endChar >= chars.length)) {
            found = p;
            break;
          }
        }
      }
      if (found < 0) return null; // jangkar tak ketemu → batal
      end = found;
    }
    if (end < pos) return null;

    // Bagi rentang ini ke tiap aksara. Kalau jumlah KATA romaji di rentang sama
    // dengan jumlah kata target yang tercakup → petakan kata↔kata (昨日=kinō,
    // 友達=tomodachi). Kalau tidak → bagi rata per aksara (perkiraan: tiap kanji
    // kira-kira sama panjang).
    const bounds: number[] = [];
    for (let q = pos; q < end; q++) if (q === pos || startsTok[q]) bounds.push(q);
    if (runWords > 1 && bounds.length === runWords) {
      let x = i;
      for (let b = 0; b < bounds.length; b++) {
        const kk = charK[x];
        let x2 = x;
        while (x2 < j && charK[x2] === kk) x2++;
        const s0 = bounds[b];
        const e0 = b + 1 < bounds.length ? bounds[b + 1] : end;
        const n = x2 - x;
        for (let y = 0; y < n; y++) {
          spanStart[x + y] = s0 + Math.round(((e0 - s0) * y) / n);
          spanEnd[x + y] = s0 + Math.round(((e0 - s0) * (y + 1)) / n);
        }
        x = x2;
      }
    } else {
      const total = end - pos;
      for (let x = 0; x < unknownCount; x++) {
        spanStart[i + x] = pos + Math.round((total * x) / unknownCount);
        spanEnd[i + x] = pos + Math.round((total * (x + 1)) / unknownCount);
      }
    }
    i = j;
    pos = end;
  }

  // Sisa huruf romaji (mis. tanda baca tak terhitung) diberikan ke aksara terakhir.
  if (pos < r.length) {
    const last = chars.length - 1;
    if (spanEnd[last] >= 0) spanEnd[last] = r.length;
  }
  // Tanpa satu pun jangkar kana, penjajarannya cuma tebakan → batal.
  if (!anchors) return null;

  // Rentang per KATA = gabungan rentang aksaranya.
  const wStart = new Array<number>(wordCount).fill(Infinity);
  const wEnd = new Array<number>(wordCount).fill(-1);
  for (let c = 0; c < chars.length; c++) {
    if (spanEnd[c] <= spanStart[c]) continue; // aksara tanpa huruf romaji (ー, っ)
    const kk = charK[c];
    wStart[kk] = Math.min(wStart[kk], spanStart[c]);
    wEnd[kk] = Math.max(wEnd[kk], spanEnd[c]);
  }

  // Potong dari string ASLI, urut, tanpa tumpang tindih.
  const out: TranslitToken[] = [];
  let cursor = 0;
  let used = 0;
  for (let w = 0; w < wordCount; w++) {
    if (wEnd[w] < 0 || wStart[w] === Infinity) continue;
    const s = map[wStart[w]];
    const e = map[wEnd[w] - 1] + 1;
    if (s == null || e == null || s < cursor) continue;
    if (s > cursor) out.push({ text: translit.slice(cursor, s), k: -1 });
    out.push({ text: translit.slice(s, e), k: w });
    cursor = e;
    used++;
  }
  if (!used) return null;
  if (cursor < translit.length) out.push({ text: translit.slice(cursor), k: -1 });
  return out;
}

/** Ada aksara Jepang (kana) di teks ini? */
export function hasKana(text: string): boolean {
  return /[぀-ゟ゠-ヿ]/u.test(text);
}
