// [lingbook-unit1] Unit 1 buku Jepang — "はじめまして" (Perkenalan).
// Materi N5 paling awal: salam kenalan, 〜は〜です, partikel か, 〜人 & pekerjaan.
import type { Chapter, Token, Word } from "./types";

const glossary: Record<string, Word> = {
  hajimemashite: { surface: "はじめまして", romaji: "hajimemashite", meaning: "salam kenal; perkenalkan", pos: "ungkapan", grammar: { Konteks: "diucapkan saat pertama kali bertemu", "Arti harfiah": '"untuk pertama kalinya"' } },
  watashi: { surface: "私", reading: "わたし", romaji: "watashi", meaning: "saya", pos: "pronomina", grammar: { Register: "netral, bisa formal", Peran: "topik" } },
  ha: { surface: "は", romaji: "wa", meaning: "penanda topik", pos: "partikel", grammar: { Fungsi: "menandai topik kalimat", Catatan: 'ditulis は, dibaca "wa"', "Kalimat ini": "menandai siapa yang diperkenalkan" } },
  desu: { surface: "です", romaji: "desu", meaning: 'kopula sopan ("adalah")', pos: "kopula", grammar: { Fungsi: "mengakhiri kalimat dengan sopan", Bentuk: "non-lampau · positif" }, forms: [{ form: "でした", note: "lampau" }, { form: "じゃありません", note: "negatif sopan" }] },
  anna: { surface: "アンナ", romaji: "Anna", meaning: "Anna (nama orang)", pos: "nomina", grammar: { Jenis: "nama diri (katakana)" } },
  amerikajin: { surface: "アメリカ人", reading: "アメリカじん", romaji: "Amerika-jin", meaning: "orang Amerika", pos: "nomina", grammar: { Pola: "[negara] + 人 = warga negara", "Kata dasar": "アメリカ = Amerika" } },
  tanaka: { surface: "田中", reading: "たなか", romaji: "Tanaka", meaning: "Tanaka (nama keluarga)", pos: "nomina", grammar: { Jenis: "nama keluarga (umum di Jepang)" } },
  kaishain: { surface: "会社員", reading: "かいしゃいん", romaji: "kaishain", meaning: "karyawan; pegawai kantor", pos: "nomina", grammar: { "Kata dasar": "会社 = perusahaan", Peran: "predikat (pekerjaan)" } },
  douzo: { surface: "どうぞ", romaji: "dōzo", meaning: "silakan; mohon", pos: "adverbia", grammar: { Fungsi: "memperhalus permintaan / persilaan" } },
  yoroshiku: { surface: "よろしく", romaji: "yoroshiku", meaning: "mohon bantuannya", pos: "ungkapan", grammar: { Konteks: "harapan hubungan baik ke depan" } },
  onegaishimasu: { surface: "お願いします", reading: "おねがいします", romaji: "onegaishimasu", meaning: "mohon; tolong", pos: "ungkapan", grammar: { Pola: "どうぞよろしくお願いします = salam kenalan lengkap", "Tingkat sopan": "sopan-hormat" } },
  san: { surface: "さん", romaji: "-san", meaning: "sufiks hormat untuk nama", pos: "sufiks", grammar: { Fungsi: "panggilan sopan, netral gender", Catatan: "jangan dipakai untuk diri sendiri" } },
  nihonjin: { surface: "日本人", reading: "にほんじん", romaji: "Nihon-jin", meaning: "orang Jepang", pos: "nomina", grammar: { "Kata dasar": "日本 = Jepang", Pola: "[negara] + 人" } },
  ka: { surface: "か", romaji: "ka", meaning: "partikel tanya", pos: "partikel", grammar: { Fungsi: "mengubah kalimat menjadi pertanyaan", Catatan: "menggantikan tanda tanya" } },
  hai: { surface: "はい", romaji: "hai", meaning: "ya", pos: "ungkapan", grammar: { Fungsi: "jawaban afirmatif" } },
  iie: { surface: "いいえ", romaji: "iie", meaning: "tidak", pos: "ungkapan", grammar: { Fungsi: "jawaban negatif" } },
  gakusei: { surface: "学生", reading: "がくせい", romaji: "gakusei", meaning: "pelajar; mahasiswa", pos: "nomina", grammar: { Peran: "predikat (status)" } },
  namae: { surface: "名前", reading: "なまえ", romaji: "namae", meaning: "nama", pos: "nomina" },
  o: { surface: "お", romaji: "o", meaning: "awalan hormat", pos: "prefiks", grammar: { Fungsi: "memperhalus kata benda milik lawan bicara", Contoh: "お名前 = nama Anda" } },
  no: { surface: "の", romaji: "no", meaning: 'partikel "milik / punya"', pos: "partikel", grammar: { Fungsi: "menghubungkan dua nomina (kepemilikan)", "Frasa ini": "私の名前 = namaku" } },
  nan: { surface: "何", reading: "なん", romaji: "nan", meaning: "apa", pos: "pronomina", grammar: { Jenis: "kata tanya" } },
  konnichiwa: { surface: "こんにちは", romaji: "konnichiwa", meaning: "selamat siang; halo", pos: "ungkapan", grammar: { Konteks: "sapaan siang hari" } },
  indoneshiajin: { surface: "インドネシア人", reading: "インドネシアじん", romaji: "Indoneshia-jin", meaning: "orang Indonesia", pos: "nomina", grammar: { Pola: "[negara] + 人" } },
  sensei: { surface: "先生", reading: "せんせい", romaji: "sensei", meaning: "guru; pengajar", pos: "nomina", grammar: { Catatan: "juga panggilan hormat untuk dokter/ahli" } },
  isha: { surface: "医者", reading: "いしゃ", romaji: "isha", meaning: "dokter", pos: "nomina" },
  dewa: { surface: "じゃありません", romaji: "ja arimasen", meaning: "bukan (negatif sopan)", pos: "kopula", grammar: { Fungsi: "negatif dari です", Bentuk: "非-lampau · negatif" } },
};

// Ubah daftar key jadi token: kata bila ada di glosarium, selain itu tanda baca literal.
const t = (...keys: string[]): Token[] => keys.map((k) => (glossary[k] ? { ref: k } : { text: k }));

export const hajimemashiteChapter: Chapter = {
  slug: "hajimemashite",
  label: "Unit 1 — はじめまして",
  title: "はじめまして",
  subtitle: "Perkenalan",
  meta: "± 12 menit · dialog + 4 grammar points + latihan",
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
    { text: "Memperkenalkan diri: はじめまして・よろしく", section: "dialog" },
    { text: "Pola 〜は〜です (X adalah Y)", section: "grammar" },
    { text: "Bertanya dengan か dan menjawab はい/いいえ", section: "grammar" },
    { text: "Menyebut kebangsaan (〜人) & pekerjaan", section: "vocab" },
  ],
  vocabRefs: ["hajimemashite", "watashi", "desu", "amerikajin", "nihonjin", "kaishain", "gakusei", "onegaishimasu"],

  // Step "Dialog" — bacaan interaktif.
  blocks: [
    { type: "heading", text: "会話の前に", sub: "Sebelum Percakapan" },
    {
      type: "paragraph",
      tokens: t("anna", "san", "ha", "amerikajin", "no", "gakusei", "desu", "。", "tanaka", "san", "ha", "nihonjin", "no", "kaishain", "desu", "。"),
      translation: "Anna adalah mahasiswa dari Amerika. Tanaka adalah pegawai kantor orang Jepang.",
    },
    { type: "heading", text: "会話", sub: "Percakapan" },
    {
      type: "dialog",
      audioSrc: "/audio/lingbook/ja/hajimemashite/dialog.mp3",
      lines: [
        { speaker: "アンナ", role: "Anna", color: "#1A9E9E", tokens: t("hajimemashite", "。", "watashi", "ha", "anna", "desu", "。"), translation: "Salam kenal. Saya Anna.", audioSrc: "/audio/lingbook/ja/hajimemashite/l1.mp3" },
        { speaker: "田中", role: "Tanaka", color: "#11313A", tokens: t("hajimemashite", "。", "tanaka", "desu", "。", "douzo", "yoroshiku", "onegaishimasu", "。"), translation: "Salam kenal. Saya Tanaka. Mohon bantuannya.", audioSrc: "/audio/lingbook/ja/hajimemashite/l2.mp3" },
        { speaker: "アンナ", role: "Anna", color: "#1A9E9E", tokens: t("tanaka", "san", "ha", "kaishain", "desu", "ka", "。"), translation: "Apakah Tanaka-san pegawai kantor?", audioSrc: "/audio/lingbook/ja/hajimemashite/l3.mp3" },
        { speaker: "田中", role: "Tanaka", color: "#11313A", tokens: t("hai", "、", "kaishain", "desu", "。", "anna", "san", "ha", "gakusei", "desu", "ka", "。"), translation: "Ya, saya pegawai kantor. Kalau Anna, mahasiswa?", audioSrc: "/audio/lingbook/ja/hajimemashite/l4.mp3" },
        { speaker: "アンナ", role: "Anna", color: "#1A9E9E", tokens: t("hai", "、", "amerikajin", "no", "gakusei", "desu", "。"), translation: "Ya, saya mahasiswa dari Amerika.", audioSrc: "/audio/lingbook/ja/hajimemashite/l5.mp3" },
      ],
    },
    {
      type: "audio",
      title: "Percakapan lengkap — kecepatan natural",
      src: "/audio/lingbook/ja/hajimemashite/full.mp3",
      durationSec: 28,
      transcript: [
        { name: "Anna", tokens: t("hajimemashite", "。", "watashi", "ha", "anna", "desu", "。") },
        { name: "Tanaka", tokens: t("hajimemashite", "。", "tanaka", "desu", "。", "douzo", "yoroshiku", "onegaishimasu", "。") },
        { name: "Anna", tokens: t("tanaka", "san", "ha", "kaishain", "desu", "ka", "。") },
        { name: "Tanaka", tokens: t("hai", "、", "kaishain", "desu", "。") },
      ],
    },
    {
      type: "culture_note",
      title: "Budaya: 名刺 (meishi) & membungkuk",
      body: "Saat berkenalan formal di Jepang, orang saling menukar kartu nama (名刺) sambil sedikit membungkuk (お辞儀), bukan berjabat tangan. Terima kartu dengan dua tangan dan jangan langsung dimasukkan ke saku.",
    },
  ],

  // Step "Grammar".
  grammarPoints: [
    {
      type: "grammar_point",
      title: "〜は〜です — X adalah Y",
      body: "Pola kalimat paling dasar bahasa Jepang. Topik ditandai partikel は, lalu diakhiri です yang berfungsi seperti \"adalah\". Urutannya selalu [topik] は [keterangan] です.",
      pattern: "[topik] は [keterangan] です",
      example: { tokens: t("watashi", "ha", "gakusei", "desu", "。"), translation: "Saya (adalah) mahasiswa." },
    },
    {
      type: "grammar_point",
      title: "Partikel か — membuat pertanyaan",
      body: "Tambahkan か di akhir kalimat untuk menjadikannya pertanyaan — tidak perlu membalik urutan kata. Jawab dengan はい (ya) atau いいえ (tidak).",
      pattern: "[kalimat] です か。",
      example: { tokens: t("tanaka", "san", "ha", "kaishain", "desu", "ka", "。"), translation: "Apakah Tanaka pegawai kantor?" },
    },
    {
      type: "grammar_point",
      title: "〜人 — kebangsaan",
      body: "Gabungkan nama negara dengan 人 (jin) untuk menyebut kewarganegaraan. Pola ini sangat teratur dan langsung dipakai sebagai predikat dengan です.",
      table: {
        columns: ["Negara", "Orang", "Arti"],
        rows: [
          [{ text: "日本" }, { tokens: t("nihonjin") }, { text: "orang Jepang" }],
          [{ text: "アメリカ" }, { tokens: t("amerikajin") }, { text: "orang Amerika" }],
          [{ text: "インドネシア" }, { tokens: t("indoneshiajin") }, { text: "orang Indonesia" }],
        ],
      },
    },
    {
      type: "grammar_point",
      title: "Partikel の — kepemilikan & keterangan",
      body: "の menyambung dua nomina: yang di depan menerangkan yang di belakang. Bisa berarti \"milik\" (私の名前 = namaku) atau menerangkan asal/jenis (アメリカ人の学生 = mahasiswa dari Amerika).",
      pattern: "[nomina A] の [nomina B]",
      example: { tokens: t("amerikajin", "no", "gakusei"), translation: "mahasiswa dari Amerika" },
    },
  ],

  // Step "Latihan" — feedback instan per soal, skor lokal.
  exercises: [
    { type: "mc", q: "アンナさんはどこの国の人ですか。", qTrans: "Anna berasal dari negara mana?", opts: ["アメリカ", "日本", "インドネシア"], ans: 0, expl: "「アメリカ人の学生です」 — Anna orang Amerika." },
    { type: "mc", q: "田中さんの仕事は何ですか。", qTrans: "Apa pekerjaan Tanaka?", opts: ["学生", "会社員", "先生"], ans: 1, expl: "「会社員です」 — Tanaka pegawai kantor." },
    { type: "fill", q: "私 ___ 学生です。", qTrans: "Pilih partikel yang tepat", opts: ["は", "を", "か"], ans: 0, expl: "は menandai topik kalimat: 私は = \"saya (topik)\"." },
    { type: "fill", q: "田中さんは会社員です ___ 。", qTrans: "Jadikan pertanyaan", opts: ["か", "は", "の"], ans: 0, expl: "か di akhir kalimat menjadikannya pertanyaan." },
    { type: "match", qTrans: "Jodohkan kata dengan artinya", pairs: [["会社員", "pegawai kantor"], ["学生", "mahasiswa"], ["日本人", "orang Jepang"], ["名前", "nama"]] },
    { type: "order", qTrans: 'Susun jadi kalimat: "Saya orang Amerika."', words: ["私", "は", "アメリカ人", "です", "。"], expl: "私 (topik) + は + アメリカ人 (predikat) + です." },
    { type: "order", qTrans: 'Susun jadi kalimat: "Apakah Anda mahasiswa?"', words: ["あなた", "は", "学生", "です", "か", "。"], expl: "Kalimat pernyataan + か di akhir = pertanyaan." },
  ],

  // Step "Test Yourself" — mini-quiz gabungan.
  test: [
    { q: "「はじめまして」 diucapkan saat…", opts: ["Pertama kali bertemu", "Berpisah", "Makan malam"], ans: 0, topic: "Salam kenalan" },
    { q: "Partikel penanda topik adalah…", opts: ["を", "は", "か"], ans: 1, topic: "Partikel は" },
    { q: "Untuk membuat pertanyaan, tambahkan…", opts: ["か", "の", "です"], ans: 0, topic: "Partikel か" },
    { q: "「アメリカ人」 artinya…", opts: ["Orang Jepang", "Orang Amerika", "Orang Indonesia"], ans: 1, topic: "Kebangsaan 〜人" },
    { q: "「私 ___ 名前」 — partikel milik yang tepat…", opts: ["の", "は", "を"], ans: 0, topic: "Partikel の" },
  ],

  // Roleplay akhir unit — scripted (mock). // TODO: wire ke AI (Lingcore pattern) di phase berikutnya.
  roleplay: [
    { ai: "こんにちは。はじめまして。お名前は？", trans: "Halo. Salam kenal. Siapa nama Anda?", choices: [{ t: "はじめまして。私は…です。", tr: "Salam kenal. Saya … ." }, { t: "こんにちは。よろしくお願いします。", tr: "Halo. Mohon bantuannya." }] },
    { ai: "そうですか。学生ですか。", trans: "Oh begitu. Anda mahasiswa?", choices: [{ t: "はい、学生です。", tr: "Ya, saya mahasiswa." }, { t: "いいえ、会社員です。", tr: "Bukan, saya pegawai kantor." }] },
    { ai: "どうぞよろしくお願いします。", trans: "Mohon bantuannya, ya.", choices: null },
  ],
};
