// [lingbook-phase1-v1] Buku demo Jepang — bab penuh: Unit 1 ("はじめまして")
// dan Unit 3 ("カフェで" / Di Kafe).
import type { Book, Chapter, Token, Word } from "./types";
import { hajimemashiteChapter } from "./ja-hajimemashite";

const glossary: Record<string, Word> = {
  kyou: { surface: "今日", reading: "きょう", romaji: "kyō", meaning: "hari ini", pos: "nomina", grammar: { Jenis: "kata keterangan waktu", Peran: "keterangan waktu" } },
  yuki: { surface: "ゆき", romaji: "Yuki", meaning: "Yuki (nama orang)", pos: "nomina", grammar: { Jenis: "nama diri" } },
  rina: { surface: "リナ", romaji: "Rina", meaning: "Rina (nama orang)", pos: "nomina", grammar: { Jenis: "nama diri (katakana)" } },
  san: { surface: "さん", romaji: "-san", meaning: "sufiks hormat untuk nama", pos: "sufiks", grammar: { Fungsi: "panggilan sopan, netral gender" } },
  to: { surface: "と", romaji: "to", meaning: "dan; bersama", pos: "partikel", grammar: { Fungsi: "menghubungkan dua nomina", "Kalimat ini": "menghubungkan ゆきさん dan リナさん" } },
  ha: { surface: "は", romaji: "wa", meaning: "penanda topik", pos: "partikel", grammar: { Fungsi: "menandai topik kalimat", Catatan: 'ditulis は, dibaca "wa"', "Kalimat ini": "menandai topik pembicaraan" } },
  kafe: { surface: "カフェ", romaji: "kafe", meaning: "kafe", pos: "nomina", grammar: { Jenis: "kata serapan (katakana)", Peran: "tujuan gerakan" } },
  he: { surface: "へ", romaji: "e", meaning: 'penanda arah "ke"', pos: "partikel", grammar: { Fungsi: "arah / tujuan gerakan", Catatan: 'ditulis へ, dibaca "e"', "Kalimat ini": 'カフェへ = "ke kafe"' } },
  ikimasu: { surface: "行きます", reading: "いきます", romaji: "ikimasu", meaning: "pergi", pos: "verba", grammar: { "Bentuk kamus": "行く (iku)", Golongan: "Godan · Gol. I", Konjugasi: "non-lampau · positif · sopan (〜ます)", Peran: "predikat" }, forms: [{ form: "行かない", note: "negatif kasual" }, { form: "行きました", note: "lampau" }, { form: "行って", note: "bentuk-te" }] },
  futari: { surface: "二人", reading: "ふたり", romaji: "futari", meaning: "dua orang; mereka berdua", pos: "nomina", grammar: { Jenis: "kata bilangan orang", Peran: "topik" } },
  koohii: { surface: "コーヒー", romaji: "kōhī", meaning: "kopi", pos: "nomina", grammar: { Jenis: "kata serapan (katakana)", Peran: "objek langsung" } },
  ga: { surface: "が", romaji: "ga", meaning: "penanda subjek", pos: "partikel", grammar: { Fungsi: "menandai subjek", "Dengan 好き": "hal yang disukai ditandai が" } },
  daisuki: { surface: "大好き", reading: "だいすき", romaji: "daisuki", meaning: "sangat suka", pos: "adjektiva", grammar: { Jenis: "adjektiva-na", Pola: "〜が大好きです", Peran: "predikat" } },
  desu: { surface: "です", romaji: "desu", meaning: 'kopula sopan ("adalah")', pos: "kopula", grammar: { Fungsi: "mengakhiri kalimat dengan sopan", Bentuk: "non-lampau · positif" }, forms: [{ form: "でした", note: "lampau" }, { form: "じゃない", note: "negatif kasual" }] },
  irasshaimase: { surface: "いらっしゃいませ", romaji: "irasshaimase", meaning: '"Selamat datang" (di toko)', pos: "ungkapan", grammar: { Konteks: "diucapkan staf kepada pelanggan" } },
  gochuumon: { surface: "ご注文", reading: "ごちゅうもん", romaji: "go-chūmon", meaning: "pesanan (bentuk hormat)", pos: "nomina", grammar: { "Awalan ご": "penanda hormat (keigo)", "Kata dasar": "注文 = pesanan" } },
  nan: { surface: "何", reading: "なん", romaji: "nan", meaning: "apa", pos: "pronomina", grammar: { Jenis: "kata tanya", Peran: "predikat tanya" } },
  ka: { surface: "か", romaji: "ka", meaning: "partikel tanya", pos: "partikel", grammar: { Fungsi: "mengubah kalimat menjadi pertanyaan" } },
  wo: { surface: "を", romaji: "o", meaning: "penanda objek langsung", pos: "partikel", grammar: { Fungsi: "menandai objek dari verba", Catatan: 'ditulis を, dibaca "o"', "Kalimat ini": "menandai objek yang diminta / diminum" } },
  kudasai: { surface: "ください", romaji: "kudasai", meaning: "tolong (berikan)", pos: "ungkapan", grammar: { Pola: '[nomina] をください = "minta ~"', "Tingkat sopan": "netral-sopan" } },
  watashi: { surface: "私", reading: "わたし", romaji: "watashi", meaning: "saya", pos: "pronomina", grammar: { Register: "netral, bisa formal", Peran: "topik" } },
  koucha: { surface: "紅茶", reading: "こうちゃ", romaji: "kōcha", meaning: "teh (hitam)", pos: "nomina", grammar: { "Arti harfiah": '"teh merah"', Peran: "objek langsung" } },
  nomimasu: { surface: "飲みます", reading: "のみます", romaji: "nomimasu", meaning: "minum", pos: "verba", grammar: { "Bentuk kamus": "飲む (nomu)", Golongan: "Godan · Gol. I", Konjugasi: "non-lampau · positif · sopan (〜ます)", Peran: "predikat" }, forms: [{ form: "飲まない", note: "negatif kasual" }, { form: "飲みました", note: "lampau" }, { form: "飲んで", note: "bentuk-te" }] },
  kashikomarimashita: { surface: "かしこまりました", romaji: "kashikomarimashita", meaning: '"Baik, dimengerti" (sangat sopan)', pos: "ungkapan", grammar: { Konteks: "jawaban staf kepada pelanggan", Bentuk: "lampau sopan dari かしこまる" } },
  shoushou: { surface: "少々", reading: "しょうしょう", romaji: "shōshō", meaning: "sebentar; sedikit (formal)", pos: "nomina", grammar: { Register: "formal", Peran: "keterangan" } },
  omachikudasai: { surface: "お待ちください", reading: "おまちください", romaji: "o-machi-kudasai", meaning: "mohon menunggu", pos: "ungkapan", grammar: { Pola: "お + [verba]ます + ください", "Tingkat sopan": "hormat (keigo)" } },
  toukyou: { surface: "東京", reading: "とうきょう", romaji: "Tōkyō", meaning: "Tokyo", pos: "nomina", grammar: { Jenis: "nama tempat" } },
  no: { surface: "の", romaji: "no", meaning: 'partikel "milik / dari"', pos: "partikel", grammar: { Fungsi: "menghubungkan dua nomina", "Frasa ini": '東京の喫茶店 = "kissaten di Tokyo"' } },
  chiisana: { surface: "小さな", reading: "ちいさな", romaji: "chiisana", meaning: "kecil", pos: "adjektiva", grammar: { Jenis: "pre-nomina (連体詞)", Bandingkan: "小さい (adjektiva-i)" } },
  kissaten: { surface: "喫茶店", reading: "きっさてん", romaji: "kissaten", meaning: "kedai kopi (gaya lama)", pos: "nomina", grammar: { Nuansa: "kafe tradisional Jepang", Peran: "inti frasa" } },
  nomu: { surface: "飲む", reading: "のむ", romaji: "nomu", meaning: "minum (bentuk kamus)", pos: "verba", grammar: { Bentuk: "kamus / kasual", Golongan: "Godan · Gol. I" } },
  nomimasen: { surface: "飲みません", reading: "のみません", romaji: "nomimasen", meaning: "tidak minum", pos: "verba", grammar: { Bentuk: "negatif sopan", "Bentuk kamus": "飲む" } },
  nomimashita: { surface: "飲みました", reading: "のみました", romaji: "nomimashita", meaning: "sudah minum", pos: "verba", grammar: { Bentuk: "lampau sopan", "Bentuk kamus": "飲む" } },
  nonde: { surface: "飲んで", reading: "のんで", romaji: "nonde", meaning: "minum (bentuk-te)", pos: "verba", grammar: { Fungsi: "menyambung kalimat; permintaan (〜でください)", "Bentuk kamus": "飲む" } },
};

// Ubah daftar key jadi token: kata bila ada di glosarium, selain itu tanda baca literal.
const t = (...keys: string[]): Token[] => keys.map((k) => (glossary[k] ? { ref: k } : { text: k }));

const chapter: Chapter = {
  slug: "kafe-de",
  label: "Unit 3 — カフェで",
  title: "カフェで",
  subtitle: "Di Kafe",
  meta: "± 20 menit · dialog + 4 grammar points + latihan",
  glossary,

  // ── Struktur unit ala Teach Yourself (phase 2) ──
  steps: [
    { id: "tujuan", label: "Tujuan" },
    { id: "dialog", label: "Dialog" },
    { id: "vocab", label: "Kosakata" },
    { id: "grammar", label: "Grammar" },
    { id: "latihan", label: "Latihan" },
    { id: "test", label: "Test" },
  ],
  objectives: [
    { text: "Memesan minuman di kafe", section: "dialog" },
    { text: "Partikel を (objek) dan へ (arah)", section: "grammar" },
    { text: "Verba sopan bentuk 〜ます", section: "grammar" },
    { text: "Kosakata kunci: minuman & kafe", section: "vocab" },
  ],
  vocabRefs: ["koohii", "koucha", "kafe", "kissaten", "nomimasu", "ikimasu", "kudasai", "gochuumon"],

  // Step "Dialog" — bacaan interaktif.
  blocks: [
    { type: "heading", text: "会話の前に", sub: "Sebelum Percakapan" },
    {
      type: "paragraph",
      tokens: t("kyou", "、", "yuki", "san", "to", "rina", "san", "ha", "kafe", "he", "ikimasu", "。", "futari", "ha", "koohii", "ga", "daisuki", "desu", "。"),
      translation: "Hari ini, Yuki dan Rina pergi ke kafe. Mereka berdua sangat suka kopi.",
    },
    { type: "heading", text: "会話", sub: "Percakapan" },
    {
      type: "dialog",
      audioSrc: "/audio/lingbook/ja/kafe-de/dialog.mp3",
      lines: [
        { speaker: "店員", role: "Pelayan", color: "#11313A", tokens: t("irasshaimase", "。", "gochuumon", "ha", "nan", "desu", "ka", "。"), translation: "Selamat datang. Mau pesan apa?", audioSrc: "/audio/lingbook/ja/kafe-de/l1.mp3" },
        { speaker: "リナ", role: "Rina", color: "#1A9E9E", tokens: t("koohii", "wo", "kudasai", "。"), translation: "Minta kopi, ya.", audioSrc: "/audio/lingbook/ja/kafe-de/l2.mp3" },
        { speaker: "ゆき", role: "Yuki", color: "#7A5FC0", tokens: t("watashi", "ha", "koucha", "wo", "nomimasu", "。"), translation: "Kalau saya, minum teh.", audioSrc: "/audio/lingbook/ja/kafe-de/l3.mp3" },
        { speaker: "店員", role: "Pelayan", color: "#11313A", tokens: t("kashikomarimashita", "。", "shoushou", "omachikudasai", "。"), translation: "Baik. Mohon tunggu sebentar.", audioSrc: "/audio/lingbook/ja/kafe-de/l4.mp3" },
      ],
    },
    {
      type: "image",
      src: "/images/lingbook/ja/kissaten.jpg",
      alt: "Kedai kopi kecil di Tokyo",
      captionTokens: t("toukyou", "no", "chiisana", "kissaten"),
      captionTranslation: "Kedai kopi kecil di Tokyo.",
    },
    {
      type: "audio",
      title: "Percakapan lengkap — kecepatan natural",
      src: "/audio/lingbook/ja/kafe-de/full.mp3",
      durationSec: 32,
      transcript: [
        { name: "Pelayan", tokens: t("irasshaimase", "。", "gochuumon", "ha", "nan", "desu", "ka", "。") },
        { name: "Rina", tokens: t("koohii", "wo", "kudasai", "。") },
        { name: "Yuki", tokens: t("watashi", "ha", "koucha", "wo", "nomimasu", "。") },
        { name: "Pelayan", tokens: t("kashikomarimashita", "。", "shoushou", "omachikudasai", "。") },
      ],
    },
    {
      type: "culture_note",
      title: "Budaya: お冷 (ohiya)",
      body: "Di kafe dan restoran Jepang, segelas air dingin (お冷) dan handuk basah (おしぼり) disajikan gratis secara otomatis — tidak perlu dipesan.",
    },
  ],

  // Step "Grammar" — poin grammar tetap tap-to-learn.
  grammarPoints: [
    {
      type: "grammar_point",
      title: "Partikel を — penanda objek",
      body: 'を menandai objek langsung dari verba: benda yang dikenai tindakan. Ditulis を tapi dibaca "o". Bandingkan dengan は yang menandai topik kalimat — keduanya sering muncul bersamaan.',
      pattern: "[nomina] を [verba]",
      example: { tokens: t("koohii", "wo", "nomimasu", "。"), translation: "(Saya) minum kopi." },
    },
    {
      type: "grammar_point",
      title: "Verba sopan 〜ます",
      body: "Bentuk 〜ます adalah bentuk sopan standar — aman dipakai ke siapa pun. Konjugasinya sangat teratur: satu pola untuk positif, negatif, dan lampau.",
      table: {
        columns: ["Bentuk", "Jepang", "Arti"],
        rows: [
          [{ text: "Kamus" }, { tokens: t("nomu") }, { text: "minum" }],
          [{ text: "Sopan" }, { tokens: t("nomimasu") }, { text: "minum" }],
          [{ text: "Negatif sopan" }, { tokens: t("nomimasen") }, { text: "tidak minum" }],
          [{ text: "Lampau sopan" }, { tokens: t("nomimashita") }, { text: "sudah minum" }],
          [{ text: "Bentuk-te" }, { tokens: t("nonde") }, { text: "(menyambung)" }],
        ],
      },
    },
    {
      type: "grammar_point",
      title: "〜をください — meminta sesuatu",
      body: "Pola paling praktis untuk memesan: sebut benda + をください. Sopan dan langsung, dipakai di kafe, toko, dan restoran.",
      pattern: '[nomina] をください = "minta [nomina]"',
      example: { tokens: t("koohii", "wo", "kudasai", "。"), translation: "Minta kopi, ya." },
    },
    {
      type: "grammar_point",
      title: "Partikel へ — arah gerakan",
      body: 'へ menandai arah atau tujuan gerakan, selalu dibaca "e". Berpasangan dengan verba gerakan seperti 行きます (pergi) dan 来ます (datang).',
      pattern: "[tempat] へ [verba gerakan]",
      example: { tokens: t("kafe", "he", "ikimasu", "。"), translation: "Pergi ke kafe." },
    },
  ],

  // Step "Latihan" — feedback instan per soal, skor lokal.
  exercises: [
    { type: "mc", q: "リナさんは何を注文しましたか。", qTrans: "Apa yang dipesan Rina?", opts: ["コーヒー", "紅茶", "水"], ans: 0, expl: "リナ berkata 「コーヒーをください」 — dia meminta kopi." },
    { type: "mc", q: "ゆきさんは何を飲みますか。", qTrans: "Apa yang diminum Yuki?", opts: ["コーヒー", "紅茶", "水"], ans: 1, expl: "「私は紅茶を飲みます」 — Yuki minum teh." },
    { type: "fill", q: "コーヒー ___ ください。", qTrans: "Pilih partikel yang tepat", opts: ["を", "は", "へ"], ans: 0, expl: "を menandai objek yang diminta pada pola 〜をください." },
    { type: "fill", q: "カフェ ___ 行きます。", qTrans: "Pilih partikel yang tepat", opts: ["を", "が", "へ"], ans: 2, expl: "へ menandai arah gerakan bersama verba 行きます." },
    { type: "match", qTrans: "Jodohkan kata dengan artinya", pairs: [["飲みます", "minum"], ["紅茶", "teh hitam"], ["ください", "tolong berikan"], ["喫茶店", "kedai kopi"]] },
    { type: "order", qTrans: 'Susun jadi kalimat: "Saya minum teh."', words: ["私", "は", "紅茶", "を", "飲みます", "。"], expl: "私 (topik) + は + 紅茶 (objek) + を + 飲みます (predikat)." },
    { type: "order", qTrans: 'Susun jadi kalimat: "Minta kopi, ya."', words: ["コーヒー", "を", "ください", "。"], expl: "Pola 〜をください: objek dulu, lalu を, lalu ください." },
  ],

  // Step "Test Yourself" — mini-quiz gabungan.
  test: [
    { q: "「いらっしゃいませ」 artinya…", opts: ["Selamat datang", "Terima kasih", "Sampai jumpa"], ans: 0, topic: "Ungkapan pelayan" },
    { q: "Partikel penanda objek langsung adalah…", opts: ["は", "を", "へ"], ans: 1, topic: "Partikel を" },
    { q: "Bentuk lampau sopan dari 飲む…", opts: ["飲みました", "飲みます", "飲まない"], ans: 0, topic: "Konjugasi 〜ます" },
    { q: "カフェ ___ 行きます。", opts: ["へ", "を", "か"], ans: 0, topic: "Partikel へ" },
    { q: '"Mohon tunggu sebentar" =', opts: ["少々お待ちください", "かしこまりました", "ご注文は何ですか"], ans: 0, topic: "Ungkapan sopan (keigo)" },
  ],

  // Roleplay akhir unit — scripted (mock). // TODO: wire ke AI (Lingcore pattern) di phase berikutnya.
  roleplay: [
    { ai: "いらっしゃいませ。ご注文は何ですか。", trans: "Selamat datang. Mau pesan apa?", choices: [{ t: "コーヒーをください。", tr: "Minta kopi." }, { t: "紅茶をください。", tr: "Minta teh." }] },
    { ai: "かしこまりました。お砂糖はいりますか。", trans: "Baik. Perlu gula?", choices: [{ t: "はい、お願いします。", tr: "Ya, tolong." }, { t: "いいえ、大丈夫です。", tr: "Tidak, tidak apa-apa." }] },
    { ai: "かしこまりました。少々お待ちください。", trans: "Baik. Mohon tunggu sebentar.", choices: null },
  ],
};

export const jaHajime: Book = {
  slug: "hajime-no-ippo",
  title: "Hajime no Ippo",
  language: { speechLang: "ja-JP", name: "Jepang", nativeName: "日本語", script: "cjk" },
  level: "N5",
  description: "Buku pemula bahasa Jepang — situasi sehari-hari dengan furigana & analisa tiap kata.",
  accent: "#E8535B",
  coverGlyph: "あ",
  chapterCount: 12,
  toc: [
    { slug: "hajimemashite", title: "はじめまして", subtitle: "Perkenalan", duration: "10 mnt", status: "done" },
    { slug: "kaimono", title: "買い物", subtitle: "Berbelanja", duration: "9 mnt", status: "done" },
    { slug: "kafe-de", title: "カフェで", subtitle: "Di kafe", duration: "8 mnt", status: "now" },
    { slug: "resutoran-de", title: "レストランで", subtitle: "Di restoran", duration: "9 mnt", status: "" },
    { slug: "eki-de", title: "駅で", subtitle: "Di stasiun", duration: "11 mnt", status: "" },
    { slug: "shuumatsu", title: "週末の予定", subtitle: "Rencana akhir pekan", duration: "10 mnt", status: "" },
    { slug: "tenki", title: "天気と季節", subtitle: "Cuaca & musim", duration: "9 mnt", status: "" },
    { slug: "kazoku", title: "家族の紹介", subtitle: "Keluarga", duration: "10 mnt", status: "" },
    { slug: "michi", title: "道を聞く", subtitle: "Bertanya arah", duration: "12 mnt", status: "" },
    { slug: "byouin", title: "病院で", subtitle: "Di rumah sakit", duration: "11 mnt", status: "" },
    { slug: "ryokou", title: "旅行の計画", subtitle: "Rencana liburan", duration: "12 mnt", status: "" },
    { slug: "omoide", title: "一年の思い出", subtitle: "Kenangan setahun", duration: "13 mnt", status: "" },
  ],
  chapters: [hajimemashiteChapter, chapter],
};
