// [lingbook-unit2] Unit 2 buku Jepang — "買い物" (Berbelanja).
// Materi N5: kata tunjuk これ・それ・あれ, menanyakan harga (いくらですか),
// angka & 円 (yen), dan adjektiva-i 高い・安い. Melanjutkan tokoh アンナ dari Unit 1.
import type { Chapter, Token, Word } from "./types";

const glossary: Record<string, Word> = {
  sumimasen: { surface: "すみません", romaji: "sumimasen", meaning: "permisi; maaf", pos: "ungkapan", grammar: { Fungsi: "menyapa staf / meminta perhatian sopan" } },
  kore: { surface: "これ", romaji: "kore", meaning: "ini (benda dekat pembicara)", pos: "pronomina", grammar: { Jenis: "kata tunjuk (ko-so-a-do)", Jarak: "dekat pembicara", Peran: "topik" } },
  sore: { surface: "それ", romaji: "sore", meaning: "itu (benda dekat lawan bicara)", pos: "pronomina", grammar: { Jenis: "kata tunjuk", Jarak: "dekat lawan bicara" } },
  are: { surface: "あれ", romaji: "are", meaning: "itu (benda jauh dari keduanya)", pos: "pronomina", grammar: { Jenis: "kata tunjuk", Jarak: "jauh dari pembicara & lawan bicara" } },
  ha: { surface: "は", romaji: "wa", meaning: "penanda topik", pos: "partikel", grammar: { Fungsi: "menandai topik kalimat", Catatan: 'ditulis は, dibaca "wa"', "Kalimat ini": "menandai benda yang ditanyakan" } },
  ikura: { surface: "いくら", romaji: "ikura", meaning: "berapa (harga)", pos: "pronomina", grammar: { Jenis: "kata tanya harga", Pola: "〜はいくらですか", Peran: "predikat tanya" } },
  desu: { surface: "です", romaji: "desu", meaning: 'kopula sopan ("adalah")', pos: "kopula", grammar: { Fungsi: "mengakhiri kalimat dengan sopan", Bentuk: "non-lampau · positif" }, forms: [{ form: "でした", note: "lampau" }, { form: "じゃありません", note: "negatif sopan" }] },
  ka: { surface: "か", romaji: "ka", meaning: "partikel tanya", pos: "partikel", grammar: { Fungsi: "mengubah kalimat menjadi pertanyaan", Catatan: "menggantikan tanda tanya" } },
  tshatsu: { surface: "Tシャツ", romaji: "T-shatsu", meaning: "kaus; T-shirt", pos: "nomina", grammar: { Jenis: "kata serapan (katakana)", Peran: "objek / predikat" } },
  happyaku: { surface: "八百", reading: "はっぴゃく", romaji: "happyaku", meaning: "delapan ratus (800)", pos: "numeralia", grammar: { Catatan: "baca tak beraturan: 八 + 百 → はっぴゃく" } },
  en: { surface: "円", reading: "えん", romaji: "en", meaning: "yen (mata uang Jepang)", pos: "nomina", grammar: { Pola: "[angka] + 円", Peran: "satuan harga" } },
  jaa: { surface: "じゃあ", romaji: "jā", meaning: "kalau begitu; baiklah", pos: "konjungsi", grammar: { Fungsi: "peralihan topik / mengambil keputusan" } },
  kaban: { surface: "かばん", romaji: "kaban", meaning: "tas", pos: "nomina", grammar: { Peran: "objek / predikat" } },
  sengohyaku: { surface: "千五百", reading: "せんごひゃく", romaji: "sen-gohyaku", meaning: "seribu lima ratus (1.500)", pos: "numeralia", grammar: { "Susunan": "千 (1000) + 五百 (500)" } },
  chotto: { surface: "ちょっと", romaji: "chotto", meaning: "sedikit; agak", pos: "adverbia", grammar: { Fungsi: "memperhalus / meredam pernyataan", Nuansa: "「ちょっと高い」 = agak mahal (halus)" } },
  takai: { surface: "高い", reading: "たかい", romaji: "takai", meaning: "mahal; tinggi", pos: "adjektiva", grammar: { Jenis: "adjektiva-i", Lawan: "安い (murah)", Peran: "predikat" }, forms: [{ form: "高くない", note: "negatif" }, { form: "高かった", note: "lampau" }] },
  yasui: { surface: "安い", reading: "やすい", romaji: "yasui", meaning: "murah", pos: "adjektiva", grammar: { Jenis: "adjektiva-i", Lawan: "高い (mahal)", Peran: "predikat" }, forms: [{ form: "安くない", note: "negatif" }, { form: "安かった", note: "lampau" }] },
  ne: { surface: "ね", romaji: "ne", meaning: "ya kan; ya (mencari persetujuan)", pos: "partikel", grammar: { Fungsi: "partikel akhir — mengajak setuju / berbagi perasaan" } },
  wo: { surface: "を", romaji: "o", meaning: "penanda objek langsung", pos: "partikel", grammar: { Fungsi: "menandai objek dari verba", Catatan: 'ditulis を, dibaca "o"', "Kalimat ini": "menandai benda yang diminta" } },
  kudasai: { surface: "ください", romaji: "kudasai", meaning: "tolong (berikan)", pos: "ungkapan", grammar: { Pola: '[nomina] をください = "minta ~"', "Tingkat sopan": "netral-sopan" } },
  arigatougozaimasu: { surface: "ありがとうございます", romaji: "arigatō gozaimasu", meaning: "terima kasih (sopan)", pos: "ungkapan", grammar: { "Tingkat sopan": "sopan", Konteks: "diucapkan staf kepada pelanggan" } },
  irasshaimase: { surface: "いらっしゃいませ", romaji: "irasshaimase", meaning: '"Selamat datang" (di toko)', pos: "ungkapan", grammar: { Konteks: "diucapkan staf kepada pelanggan" } },
  nan: { surface: "何", reading: "なん", romaji: "nan", meaning: "apa", pos: "pronomina", grammar: { Jenis: "kata tanya", Peran: "predikat tanya" } },
  // angka pendukung untuk tabel
  hyaku: { surface: "百", reading: "ひゃく", romaji: "hyaku", meaning: "seratus (100)", pos: "numeralia" },
  sanbyaku: { surface: "三百", reading: "さんびゃく", romaji: "sanbyaku", meaning: "tiga ratus (300)", pos: "numeralia", grammar: { Catatan: "baca tak beraturan: 三 + 百 → さんびゃく" } },
  roppyaku: { surface: "六百", reading: "ろっぴゃく", romaji: "roppyaku", meaning: "enam ratus (600)", pos: "numeralia", grammar: { Catatan: "baca tak beraturan: 六 + 百 → ろっぴゃく" } },
  sen: { surface: "千", reading: "せん", romaji: "sen", meaning: "seribu (1.000)", pos: "numeralia" },
  kimono: { surface: "着物", reading: "きもの", romaji: "kimono", meaning: "kimono (busana tradisional)", pos: "nomina", grammar: { Jenis: "nama benda budaya" } },
  // tokoh & kata bantu paragraf pembuka
  anna: { surface: "アンナ", romaji: "Anna", meaning: "Anna (nama orang)", pos: "nomina", grammar: { Jenis: "nama diri (katakana)" } },
  san: { surface: "さん", romaji: "-san", meaning: "sufiks hormat untuk nama", pos: "sufiks", grammar: { Fungsi: "panggilan sopan, netral gender" } },
  to: { surface: "と", romaji: "to", meaning: "dan (menghubungkan nomina)", pos: "partikel", grammar: { Fungsi: "menghubungkan dua nomina", "Kalimat ini": "menghubungkan かばん dan Tシャツ" } },
  mimasu: { surface: "見ます", reading: "みます", romaji: "mimasu", meaning: "melihat", pos: "verba", grammar: { "Bentuk kamus": "見る (miru)", Golongan: "Ichidan · Gol. II", Konjugasi: "non-lampau · positif · sopan (〜ます)" }, forms: [{ form: "見ない", note: "negatif kasual" }, { form: "見ました", note: "lampau" }, { form: "見て", note: "bentuk-te" }] },
};

// Ubah daftar key jadi token: kata bila ada di glosarium, selain itu tanda baca literal.
const t = (...keys: string[]): Token[] => keys.map((k) => (glossary[k] ? { ref: k } : { text: k }));

export const kaimonoChapter: Chapter = {
  slug: "kaimono",
  label: "Unit 2 — 買い物",
  title: "買い物",
  subtitle: "Berbelanja",
  meta: "± 9 menit · dialog + 4 grammar points + latihan",
  glossary,

  steps: [
    { id: "tujuan", label: "Tujuan" },
    { id: "dialog", label: "Dialog" },
    { id: "vocab", label: "Kosakata" },
    { id: "grammar", label: "Grammar" },
    { id: "latihan", label: "Latihan" },
    { id: "test", label: "Test" },
  ],
  objectives: [
    { text: "Menanyakan harga: 〜はいくらですか", section: "dialog" },
    { text: "Kata tunjuk これ・それ・あれ", section: "grammar" },
    { text: "Membaca angka & harga dalam 円 (yen)", section: "grammar" },
    { text: "Adjektiva-i 高い・安い (mahal/murah)", section: "vocab" },
  ],
  vocabRefs: ["kore", "sore", "are", "ikura", "en", "takai", "yasui", "kudasai"],

  // Step "Dialog" — bacaan interaktif.
  blocks: [
    { type: "heading", text: "会話の前に", sub: "Sebelum Percakapan" },
    {
      type: "paragraph",
      tokens: t("anna", "san", "ha", "kaban", "to", "tshatsu", "wo", "mimasu", "。", "kaban", "ha", "chotto", "takai", "desu", "。"),
      translation: "Anna melihat-lihat tas dan kaus. Tasnya agak mahal.",
    },
    { type: "heading", text: "会話", sub: "Percakapan" },
    {
      type: "dialog",
      audioSrc: "/audio/lingbook/ja/kaimono/dialog.mp3",
      lines: [
        { speaker: "アンナ", role: "Anna", color: "#1A9E9E", tokens: t("sumimasen", "。", "kore", "ha", "ikura", "desu", "ka", "。"), translation: "Permisi. Ini berapa harganya?", audioSrc: "/audio/lingbook/ja/kaimono/l1.mp3" },
        { speaker: "店員", role: "Pelayan", color: "#11313A", tokens: t("sore", "ha", "tshatsu", "desu", "。", "happyaku", "en", "desu", "。"), translation: "Itu kaus. Harganya 800 yen.", audioSrc: "/audio/lingbook/ja/kaimono/l2.mp3" },
        { speaker: "アンナ", role: "Anna", color: "#1A9E9E", tokens: t("jaa", "、", "are", "ha", "ikura", "desu", "ka", "。"), translation: "Kalau begitu, yang itu berapa?", audioSrc: "/audio/lingbook/ja/kaimono/l3.mp3" },
        { speaker: "店員", role: "Pelayan", color: "#11313A", tokens: t("are", "ha", "kaban", "desu", "。", "sengohyaku", "en", "desu", "。", "chotto", "takai", "desu", "ne", "。"), translation: "Yang itu tas. 1.500 yen. Agak mahal, ya.", audioSrc: "/audio/lingbook/ja/kaimono/l4.mp3" },
        { speaker: "アンナ", role: "Anna", color: "#1A9E9E", tokens: t("jaa", "、", "kore", "wo", "kudasai", "。"), translation: "Kalau begitu, minta yang ini, ya.", audioSrc: "/audio/lingbook/ja/kaimono/l5.mp3" },
        { speaker: "店員", role: "Pelayan", color: "#11313A", tokens: t("arigatougozaimasu", "。", "happyaku", "en", "desu", "。"), translation: "Terima kasih. 800 yen.", audioSrc: "/audio/lingbook/ja/kaimono/l6.mp3" },
      ],
    },
    {
      type: "audio",
      title: "Percakapan lengkap — kecepatan natural",
      src: "/audio/lingbook/ja/kaimono/full.mp3",
      durationSec: 30,
      transcript: [
        { name: "Anna", tokens: t("sumimasen", "。", "kore", "ha", "ikura", "desu", "ka", "。") },
        { name: "Pelayan", tokens: t("sore", "ha", "tshatsu", "desu", "。", "happyaku", "en", "desu", "。") },
        { name: "Anna", tokens: t("jaa", "、", "are", "ha", "ikura", "desu", "ka", "。") },
        { name: "Pelayan", tokens: t("are", "ha", "kaban", "desu", "。", "sengohyaku", "en", "desu", "。") },
      ],
    },
    {
      type: "culture_note",
      title: "Budaya: 税込 (harga sudah termasuk pajak) & トレー",
      body: "Di Jepang harga yang tertera biasanya sudah termasuk pajak (税込・zeikomi) dan tidak ada tawar-menawar di toko biasa. Saat membayar, letakkan uang di baki kecil (トレー) di kasir, bukan langsung ke tangan petugas.",
    },
  ],

  // Step "Grammar".
  grammarPoints: [
    {
      type: "grammar_point",
      title: "これ・それ・あれ — kata tunjuk benda",
      body: "Ketiganya menunjuk benda berdasarkan jarak: これ untuk benda dekat pembicara, それ dekat lawan bicara, dan あれ jauh dari keduanya. Dipakai sebagai topik dengan は.",
      pattern: "これ / それ / あれ + は … です",
      example: { tokens: t("kore", "ha", "tshatsu", "desu", "。"), translation: "Ini (adalah) kaus." },
    },
    {
      type: "grammar_point",
      title: "〜はいくらですか — menanyakan harga",
      body: "Untuk menanyakan harga, sebut bendanya + はいくらですか。 いくら khusus untuk menanyakan jumlah uang. Jawabannya berupa angka + 円 + です。",
      pattern: "[benda] は いくら です か。",
      example: { tokens: t("kore", "ha", "ikura", "desu", "ka", "。"), translation: "Ini berapa harganya?" },
    },
    {
      type: "grammar_point",
      title: "Angka & 円 — harga dalam yen",
      body: "Harga = angka + 円 (en). Ratusan memakai 百 (hyaku) dan ribuan memakai 千 (sen). Perhatikan tiga bacaan tak beraturan: 三百 (さんびゃく), 六百 (ろっぴゃく), dan 八百 (はっぴゃく).",
      table: {
        columns: ["Angka", "Jepang", "Baca"],
        rows: [
          [{ text: "100" }, { tokens: t("hyaku") }, { text: "hyaku" }],
          [{ text: "300" }, { tokens: t("sanbyaku") }, { text: "san-byaku ⚠" }],
          [{ text: "600" }, { tokens: t("roppyaku") }, { text: "rop-pyaku ⚠" }],
          [{ text: "800" }, { tokens: t("happyaku") }, { text: "hap-pyaku ⚠" }],
          [{ text: "1.000" }, { tokens: t("sen") }, { text: "sen" }],
          [{ text: "1.500" }, { tokens: t("sengohyaku") }, { text: "sen-gohyaku" }],
        ],
      },
    },
    {
      type: "grammar_point",
      title: "高い・安い — adjektiva-i untuk harga",
      body: "高い berarti \"mahal\" (juga \"tinggi\") dan 安い berarti \"murah\". Keduanya adjektiva-i: langsung diikuti です tanpa partikel. Tambahkan ちょっと di depan untuk memperhalus (\"agak mahal\").",
      pattern: "[benda] は (ちょっと) 高い / 安い です",
      example: { tokens: t("are", "ha", "chotto", "takai", "desu", "。"), translation: "Yang itu agak mahal." },
    },
  ],

  // Step "Latihan" — feedback instan per soal, skor lokal.
  exercises: [
    { type: "mc", q: "Tシャツはいくらですか。", qTrans: "Berapa harga kaus itu?", opts: ["八百円", "千五百円", "三百円"], ans: 0, expl: "「Tシャツです。八百円です」 — kaus 800 yen." },
    { type: "mc", q: "あれは何ですか。", qTrans: "Benda jauh itu apa?", opts: ["Tシャツ", "かばん", "着物"], ans: 1, expl: "「あれはかばんです」 — あれ menunjuk tas yang jauh." },
    { type: "fill", q: "これ ___ いくらですか。", qTrans: "Pilih partikel yang tepat", opts: ["は", "を", "の"], ans: 0, expl: "は menandai topik: これは = \"ini (topik)\"." },
    { type: "fill", q: "これ ___ ください。", qTrans: "Pilih partikel yang tepat", opts: ["を", "は", "か"], ans: 0, expl: "を menandai objek yang diminta pada pola 〜をください." },
    { type: "match", qTrans: "Jodohkan kata dengan artinya", pairs: [["これ", "ini"], ["いくら", "berapa (harga)"], ["高い", "mahal"], ["円", "yen"]] },
    { type: "order", qTrans: 'Susun jadi kalimat: "Ini berapa harganya?"', words: ["これ", "は", "いくら", "です", "か", "。"], expl: "これ (topik) + は + いくら + です + か → pertanyaan harga." },
    { type: "order", qTrans: 'Susun jadi kalimat: "Minta yang ini, ya."', words: ["これ", "を", "ください", "。"], expl: "Pola 〜をください: objek dulu, lalu を, lalu ください." },
  ],

  // Step "Test Yourself" — mini-quiz gabungan.
  test: [
    { q: "「いくら」 dipakai untuk menanyakan…", opts: ["Harga", "Waktu", "Tempat"], ans: 0, topic: "Menanyakan harga" },
    { q: "Kata tunjuk untuk benda dekat pembicara adalah…", opts: ["これ", "それ", "あれ"], ans: 0, topic: "これ・それ・あれ" },
    { q: "「高い」 artinya…", opts: ["Murah", "Mahal", "Baru"], ans: 1, topic: "Adjektiva 高い・安い" },
    { q: "八百円 dibaca…", opts: ["はっぴゃくえん", "はちひゃくえん", "はちえん"], ans: 0, topic: "Angka & 円" },
    { q: "これ ___ ください。 — partikel yang tepat…", opts: ["を", "は", "か"], ans: 0, topic: "Partikel を" },
  ],

  // Roleplay akhir unit — scripted (mock). // TODO: wire ke AI (Lingcore pattern) di phase berikutnya.
  roleplay: [
    { ai: "いらっしゃいませ。", trans: "Selamat datang.", choices: [{ t: "すみません、これはいくらですか。", tr: "Permisi, ini berapa?" }, { t: "あれはいくらですか。", tr: "Yang itu berapa?" }] },
    { ai: "それは八百円です。", trans: "Itu 800 yen.", choices: [{ t: "じゃあ、これをください。", tr: "Kalau begitu, minta ini." }, { t: "ちょっと高いですね。", tr: "Agak mahal, ya." }] },
    { ai: "ありがとうございます。", trans: "Terima kasih banyak.", choices: null },
  ],
};
