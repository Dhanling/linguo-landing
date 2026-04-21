import type { LanguageCurriculum } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
type SessionTuple = [number, string, string[]];
type TitleTuple = string;

function toSessions(arr: SessionTuple[]) {
  return arr.map(([session, title, topics]) => ({ session, title, topics }));
}

function titleOnly(arr: TitleTuple[]) {
  return arr.map((title, i) => ({ session: i + 1, title, topics: [] }));
}

// ─────────────────────────────────────────────────────────────────────────────
// A1 — 3 sublevels, 16 sesi each = 48 sesi
// ─────────────────────────────────────────────────────────────────────────────

const a1_1 = toSessions([
  [1,  "Hiragana: あ～こ",          ["a i u e o", "ka ki ku ke ko", "menulis & membaca"]],
  [2,  "Hiragana: さ～と",          ["sa si su se so", "ta chi tsu te to"]],
  [3,  "Hiragana: な～ほ",          ["na ni nu ne no", "ha hi fu he ho"]],
  [4,  "Hiragana: ま～ん",          ["ma mi mu me mo", "ya yu yo", "ra ri ru re ro", "wa wo n"]],
  [5,  "Salam & Perkenalan",        ["おはようございます", "はじめまして", "よろしく"]],
  [6,  "Angka 1–100",               ["いち に さん", "jumlah sederhana"]],
  [7,  "Kata Benda: Benda Sehari-hari", ["hon, tsukue, isu", "kore / sore / are"]],
  [8,  "Partikel は と が",         ["X は Y です", "subjek kalimat"]],
  [9,  "Kata Sifat い",             ["おおきい / ちいさい", "あかい / あおい"]],
  [10, "Kata Sifat な",             ["きれいな / しずかな", "X は Y な です"]],
  [11, "Katakana: ア～コ",          ["a i u e o", "ka ki ku ke ko", "loan words"]],
  [12, "Katakana: サ～ト",          ["sa shi su se so", "ta chi tsu te to"]],
  [13, "Katakana: ナ～ン",          ["na-row sampai n", "common katakana words"]],
  [14, "Lokasi & Preposisi",        ["うえ / した / なか", "どこ ですか"]],
  [15, "Waktu: Jam & Hari",         ["いちじ / にじ", "げつようび～にちようび"]],
  [16, "Review & Percakapan Pertama", ["self-intro", "tanya-jawab sederhana"]],
]);

const a1_2 = toSessions([
  [1,  "Kata Kerja: Grup 1 (う-verb)", ["かく, のむ, よむ", "bentuk ます"]],
  [2,  "Kata Kerja: Grup 2 (る-verb)", ["たべる, みる, おきる", "bentuk ます"]],
  [3,  "Kata Kerja Tidak Beraturan",   ["する / くる", "します / きます"]],
  [4,  "Kalimat Negatif",             ["〜ません", "じゃ ありません"]],
  [5,  "Kalimat Tanya",               ["〜ますか", "はい / いいえ"]],
  [6,  "Di Restoran",                 ["〜を ください", "いくら ですか"]],
  [7,  "Belanja & Harga",             ["えん", "たかい / やすい", "これ を ください"]],
  [8,  "Transportasi",                ["でんしゃ / バス / タクシー", "〜で いきます"]],
  [9,  "Keluarga",                    ["ちち / はは / あに / あね", "かぞく の しょうかい"]],
  [10, "Hobi & Kegiatan",             ["〜が すきです", "〜を します"]],
  [11, "Bentuk て (Te-form)",         ["たべて, のんで", "〜て ください"]],
  [12, "Kalimat Gabung dengan て",    ["〜て, 〜て, 〜ます", "urutan kegiatan"]],
  [13, "Kata Keterangan Waktu",       ["まいにち / よく / ときどき", "frequency"]],
  [14, "Cuaca & Musim",               ["はれ / くもり / あめ", "はる なつ あき ふゆ"]],
  [15, "Ulang Tahun & Tanggal",       ["〜がつ 〜にち", "たんじょうび は いつ"]],
  [16, "Review & Percakapan Harian",  ["daily routine", "3-minute conversation"]],
]);

const a1_3 = toSessions([
  [1,  "Bentuk た (Past Tense)",      ["たべた / のんだ", "〜ました / 〜ませんでした"]],
  [2,  "Menceritakan Kemarin",        ["きのう 〜しました", "sequence: まず, つぎに, それから"]],
  [3,  "Partikel に へ で を",       ["arah, tujuan, tempat, objek"]],
  [4,  "Kalimat Penyebab: から",      ["〜から 〜です", "alasan sederhana"]],
  [5,  "Kalimat Kondisi: と",         ["〜と 〜ます", "kondisi alami"]],
  [6,  "Kata Tunjuk: こ・そ・あ・ど", ["kono / sono / ano / dono"]],
  [7,  "Warna",                       ["あか / あお / きいろ / しろ / くろ", "X は 〜い ろ です"]],
  [8,  "Pakaian & Fashion",           ["シャツ / ズボン / くつ", "きている"]],
  [9,  "Di Rumah Sakit",             ["いたい / かぜ / ねつ", "〜が いたいです"]],
  [10, "Telepon & Pesan",             ["もしもし", "〜は いますか", "メッセージ を おねがいします"]],
  [11, "Memberi & Menerima",          ["あげる / もらう / くれる", "basic giving-receiving"]],
  [12, "Ekspresi Perasaan",           ["うれしい / かなしい / びっくりした", "感情表現"]],
  [13, "Review Hiragana & Katakana",  ["speed reading", "dictation practice"]],
  [14, "Kanji Dasar 1",               ["日 月 火 水 木 金 土", "hari dalam kanji"]],
  [15, "Kanji Dasar 2",               ["山 川 田 人 口 目 手 足"]],
  [16, "Review & Role Play A1",       ["shopping, restaurant, self-intro role play"]],
]);

// ─────────────────────────────────────────────────────────────────────────────
// A2 — 4 sublevels, preview-locked
// ─────────────────────────────────────────────────────────────────────────────
const a2_1 = titleOnly([
  "Review Bentuk て & た",
  "Bentuk ている (Progressive)",
  "Perbandingan: 〜より 〜のほう が",
  "Superlatif: いちばん 〜",
  "Kata Kerja Potensial (できる)",
  "Keinginan: 〜たいです",
  "Pengalaman: 〜たことが あります",
  "Izin: 〜ても いいですか",
  "Larangan: 〜ては いけません",
  "Kewajiban: 〜なければ なりません",
  "Di Kantor Post & Bank",
  "Pemesanan Hotel",
  "Rencana Liburan",
  "Cuaca & Prakiraan",
  "Berbicara tentang Pekerjaan",
  "Review & Percakapan A2.1",
]);

const a2_2 = titleOnly([
  "Klausa Relatif (修飾節)",
  "Kata Sambung: のに / から / ので",
  "Bentuk Pasif (受身形)",
  "Bentuk Kausatif (使役形)",
  "Bentuk Kausatif-Pasif",
  "Keputusan & Rencana: 〜ことにした",
  "Perubahan: 〜ように なった",
  "Harapan: 〜といいな / 〜ばよかった",
  "Kutipan & Laporan: 〜と いった",
  "Di Perjalanan: Shinkansen & Bandara",
  "Memesan Makanan Kompleks",
  "Berbelanja di Pasar Tradisional",
  "Menonton Pertunjukan & Reservasi",
  "Budaya Jepang: Onsen & Ryokan",
  "Berbicara tentang Keluarga (Formal)",
  "Review & Percakapan A2.2",
]);

const a2_3 = titleOnly([
  "Keigo: Bahasa Sopan Dasar",
  "Keigo: 丁寧語 (Teineigo)",
  "Bentuk Kondisional: 〜ば / 〜たら / 〜なら",
  "Mengungkapkan Pendapat: 〜と おもいます",
  "Mengungkapkan Dugaan: 〜でしょう / 〜かもしれません",
  "Kata Penghubung: しかし / それでも / だから",
  "Menjelaskan Cara: 〜やすい / 〜にくい",
  "Ekspresi Formal Tertulis",
  "Email Formal dalam Bahasa Jepang",
  "Berita & Media Sosial",
  "Membaca Kanji: Level N4",
  "Mendengarkan: Drama & Anime (basic)",
  "Percakapan Bisnis Dasar",
  "Negosiasi Harga & Tawar-menawar",
  "Review Keigo & Formal",
  "Review & Percakapan A2.3",
]);

const a2_4 = titleOnly([
  "Persiapan JLPT N4: Tata Bahasa",
  "Persiapan JLPT N4: Kosakata",
  "Persiapan JLPT N4: Kanji",
  "Persiapan JLPT N4: Membaca",
  "Persiapan JLPT N4: Mendengarkan",
  "Simulasi JLPT N4 (1)",
  "Simulasi JLPT N4 (2)",
  "Analisis Kesalahan Umum N4",
  "Strategi Ujian",
  "Percakapan Spontan: Topic Cards",
  "Presentasi Singkat (3 menit)",
  "Debat Sederhana: Pro & Kontra",
  "Budaya Pop: Anime & Manga",
  "Budaya Jepang: Matsuri & Tradisi",
  "Review Komprehensif A2",
  "Evaluasi & Transisi ke B1",
]);

// ─────────────────────────────────────────────────────────────────────────────
// B1 — 5 sublevels, preview-locked
// ─────────────────────────────────────────────────────────────────────────────
const b1_1 = titleOnly([
  "Keigo Lanjutan: 尊敬語 (Sonkeigo)",
  "Keigo Lanjutan: 謙譲語 (Kenjoogo)",
  "Ungkapan Kompleks: 〜わけ / 〜はず",
  "Ungkapan Kompleks: 〜ものの / 〜くせに",
  "Membaca Artikel Berita",
  "Menulis Paragraf Formal",
  "JLPT N3: Tata Bahasa Target",
  "JLPT N3: Kanji 300–400",
  "Percakapan Formal: Rapat Kerja",
  "Presentasi Bisnis",
  "Menjelaskan Data & Grafik",
  "Email & Surat Resmi Lanjutan",
  "Budaya Kerja Jepang (Nemawashi, dll)",
  "Percakapan Budaya & Seni",
  "Menonton Film Jepang Tanpa Subtitle",
  "Review & Evaluasi B1.1",
]);

const b1_2 = titleOnly([
  "Tata Bahasa N3: Ungkapan Lanjutan",
  "Idiom Jepang (慣用句) Populer",
  "Yojijukugo (四字熟語) Dasar",
  "Membaca Manga Tanpa Furigana",
  "Mendengarkan Podcast Jepang",
  "Perdebatan & Diskusi Formal",
  "Menulis Esai Pendek",
  "Kanji N3: 400–500",
  "Percakapan: Keluhan & Resolusi",
  "Negosiasi Kontrak Sederhana",
  "Perjalanan Bisnis ke Jepang",
  "Kebiasaan Sosial: Nomenkan & Omiyage",
  "Humor & Sarkasme dalam Bahasa Jepang",
  "Dialek: Kansai-ben Dasar",
  "Percakapan Spontan Lanjutan",
  "Review & Evaluasi B1.2",
]);

const b1_3 = titleOnly([
  "Persiapan JLPT N3: Full Review Tata Bahasa",
  "Persiapan JLPT N3: Full Review Kanji",
  "Simulasi JLPT N3 (1)",
  "Simulasi JLPT N3 (2)",
  "Analisis & Koreksi Kesalahan N3",
  "Membaca Teks Otentik: Iklan & Brosur",
  "Membaca Teks Otentik: Manual Produk",
  "Menulis Laporan Kerja",
  "Presentasi 5 Menit",
  "Diskusi Panel: Isu Sosial Jepang",
  "Wawancara Kerja dalam Bahasa Jepang",
  "CV & Rirekisho",
  "Percakapan Medis",
  "Percakapan di Instansi Pemerintah",
  "Review Komprehensif B1.3",
  "Evaluasi & Transisi ke B1.4",
]);

const b1_4 = titleOnly([
  "Tata Bahasa N2: Pengantar",
  "Ungkapan Formal Tingkat Tinggi",
  "Membaca Dokumen Hukum Sederhana",
  "Membaca Berita NHK",
  "Mendengarkan Siaran Radio",
  "Kanji N2: 500–700",
  "Menulis Surat Keluhan Formal",
  "Presentasi Data & Riset",
  "Percakapan: Lingkungan & Isu Global",
  "Percakapan: Politik & Ekonomi (dasar)",
  "Humor & Wordplay Jepang",
  "Sastra Jepang: Pengantar",
  "Film & Sinema Jepang",
  "Musik Jepang: J-Pop & Enka",
  "Review B1.4",
  "Evaluasi Komprehensif B1",
]);

const b1_5 = titleOnly([
  "Bridge ke B2: Gap Analysis",
  "Ungkapan Nuansa: 〜にすぎない / 〜にほかならない",
  "Membaca Esai Opini",
  "Menulis Esai Argumentatif",
  "Debat Formal",
  "Simulasi Wawancara Kerja (Advanced)",
  "Percakapan Telepon Bisnis",
  "Presentasi Produk & Pitch",
  "Kanji N2: 700–900",
  "JLPT N2: Strategi Menjawab",
  "Simulasi JLPT N2 (Parsial)",
  "Analisis Kesalahan Lanjutan",
  "Peer Teaching: Ajarkan Konsep",
  "Proyek Akhir: Presentasi Topik Bebas",
  "Review Final B1.5",
  "Evaluasi & Sertifikasi B1",
]);

// ─────────────────────────────────────────────────────────────────────────────
// B2 — 7 sublevels, preview-locked
// ─────────────────────────────────────────────────────────────────────────────
const b2_1 = titleOnly([
  "Tata Bahasa N2: Komprehensif",
  "Kanji N2: 900–1000",
  "Membaca Novel Sederhana (Graded Reader N2)",
  "Mendengarkan Ceramah & Kuliah",
  "Menulis Laporan Akademik",
  "Presentasi Formal 10 Menit",
  "Debat: Isu Kontemporer Jepang",
  "Simulasi JLPT N2 Full (1)",
  "Simulasi JLPT N2 Full (2)",
  "Analisis & Koreksi N2",
  "Membaca Koran: Yomiuri / Asahi",
  "Menonton NHK World tanpa Subtitle",
  "Percakapan: Filsafat & Etika",
  "Percakapan: Sains & Teknologi",
  "Review B2.1",
  "Evaluasi & Target N1",
]);

const b2_2 = titleOnly([
  "Pengantar JLPT N1",
  "Tata Bahasa N1: Batch 1",
  "Kanji N1: 1000–1500",
  "Membaca Teks Klasik Modern",
  "Analisis Wacana Formal",
  "Menulis Esai Akademik",
  "Presentasi Riset",
  "Mendengarkan: Debat TV Jepang",
  "Humor Tingkat Tinggi & Plesetan",
  "Sastra: Natsume Soseki (pengantar)",
  "Budaya: Bushido & Filosofi Jepang",
  "Percakapan: Ekonomi Makro",
  "Percakapan: Isu Lingkungan Hidup",
  "Dialek Regional: Tohoku / Kyushu",
  "Review B2.2",
  "Evaluasi Komprehensif",
]);

const b2_3 = titleOnly([
  "Tata Bahasa N1: Batch 2",
  "Kanji N1: 1500–2000",
  "Membaca Dokumen Hukum & Kontrak",
  "Membaca Jurnal Ilmiah",
  "Menulis Proposal Bisnis",
  "Presentasi Tingkat Eksekutif",
  "Negosiasi Tingkat Lanjut",
  "Sastra: Kawabata Yasunari",
  "Film: Kurosawa & Sinema Klasik",
  "Budaya: Wabi-Sabi & Estetika Jepang",
  "Simulasi JLPT N1 (Parsial)",
  "Analisis Kesalahan N1",
  "Proyek: Menulis Artikel Opini",
  "Proyek: Wawancara Narasumber",
  "Review B2.3",
  "Evaluasi",
]);

const b2_4 = titleOnly([
  "Tata Bahasa N1: Batch 3 (Final)",
  "Kanji N1: Review & Drill",
  "Membaca Novel: Haruki Murakami",
  "Analisis Sastra",
  "Menulis Karya Ilmiah Pendek",
  "Pidato Formal",
  "MC & Moderator Event",
  "Bahasa Jepang di Media Sosial",
  "Simulasi JLPT N1 Full (1)",
  "Simulasi JLPT N1 Full (2)",
  "Analisis & Strategi Akhir N1",
  "Percakapan: Diplomasi & Hubungan Internasional",
  "Percakapan: Startup & Inovasi",
  "Percakapan: Kesehatan Mental & Wellbeing",
  "Review B2.4",
  "Evaluasi",
]);

const b2_5 = titleOnly([
  "Near-Native: Kelancaran Spontan",
  "Merespons Humor & Sarkasme",
  "Berargumen & Meyakinkan",
  "Menginterpretasi Makna Tersirat",
  "Membaca Puisi Haiku & Tanka",
  "Menulis Puisi dalam Bahasa Jepang",
  "Percakapan Filosofis",
  "Percakapan Akademik Multitopik",
  "Menonton Dorama tanpa Subtitle",
  "Analisis Iklan & Media",
  "Bahasa Jepang di Dunia Game",
  "Bahasa Jepang Slang & Gaul Muda",
  "Review B2.5",
  "Evaluasi",
  "Proyek Akhir: Karya Tulis",
  "Presentasi Akhir",
]);

const b2_6 = titleOnly([
  "Spesialisasi: Bahasa Jepang Bisnis",
  "Spesialisasi: Bahasa Jepang Medis",
  "Spesialisasi: Bahasa Jepang Hukum",
  "Spesialisasi: Bahasa Jepang IT",
  "Spesialisasi: Bahasa Jepang Pariwisata",
  "Simulasi: Rapat Direksi",
  "Simulasi: Konferensi Internasional",
  "Simulasi: Press Conference",
  "Penerjemahan & Interpretasi Dasar",
  "Localization: Budaya dalam Bahasa",
  "Bahasa Jepang & AI",
  "Masa Depan Bahasa Jepang",
  "Review B2.6",
  "Evaluasi",
  "Proyek Akhir: Presentasi Spesialisasi",
  "Sertifikasi & Penutup B2",
]);

const b2_7 = titleOnly([
  "JLPT N1: Final Drill Tata Bahasa",
  "JLPT N1: Final Drill Kanji",
  "JLPT N1: Final Drill Membaca",
  "JLPT N1: Final Drill Mendengarkan",
  "Simulasi JLPT N1 (Full Mock 1)",
  "Simulasi JLPT N1 (Full Mock 2)",
  "Simulasi JLPT N1 (Full Mock 3)",
  "Analisis Kesalahan & Koreksi Final",
  "Strategi Hari H Ujian",
  "Teknik Manajemen Waktu Ujian",
  "Review Celah Pengetahuan",
  "Sesi Q&A Komprehensif",
  "Percakapan Bebas: Simulasi Native",
  "Motivasi & Mental Preparation",
  "Ujian Simulasi Final",
  "Penutup & Selamat! (JLPT N1 Ready)",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Curriculum Object
// ─────────────────────────────────────────────────────────────────────────────
const curriculum: LanguageCurriculum = {
  meta: {
    slug: "japanese",
    name: "Jepang",
    nativeName: "日本語",
    flag: "🇯🇵",
    totalSessions: 304,
    description: "Dari Hiragana hingga JLPT N1 — kurikulum Bahasa Jepang Linguo.id mencakup 304 sesi sistematis yang membawa kamu dari nol hingga near-native fluency.",
  },
  levels: [
    {
      code: "A1",
      name: "Pemula",
      description: "Fondasi: Hiragana, Katakana, Kanji dasar, percakapan sehari-hari.",
      sublevels: [
        { code: "A1.1", name: "Hiragana & Katakana", sessions: a1_1, preview: true },
        { code: "A1.2", name: "Percakapan Dasar",    sessions: a1_2, preview: true },
        { code: "A1.3", name: "Kanji & Ekspresi",    sessions: a1_3, preview: true },
      ],
    },
    {
      code: "A2",
      name: "Pra-Menengah",
      description: "Tata bahasa menengah, Keigo dasar, dan persiapan JLPT N4.",
      sublevels: [
        { code: "A2.1", name: "Tata Bahasa Menengah", sessions: a2_1, preview: false },
        { code: "A2.2", name: "Kehidupan & Budaya",   sessions: a2_2, preview: false },
        { code: "A2.3", name: "Formal & Tertulis",    sessions: a2_3, preview: false },
        { code: "A2.4", name: "JLPT N4 Prep",         sessions: a2_4, preview: false },
      ],
    },
    {
      code: "B1",
      name: "Menengah",
      description: "Keigo lanjutan, JLPT N3–N2, dan percakapan bisnis profesional.",
      sublevels: [
        { code: "B1.1", name: "Fluency Foundations",  sessions: b1_1, preview: false },
        { code: "B1.2", name: "Cultural Fluency",     sessions: b1_2, preview: false },
        { code: "B1.3", name: "JLPT N3 Prep",         sessions: b1_3, preview: false },
        { code: "B1.4", name: "Advanced Expression",  sessions: b1_4, preview: false },
        { code: "B1.5", name: "Professional Bridge",  sessions: b1_5, preview: false },
      ],
    },
    {
      code: "B2",
      name: "Upper Intermediate",
      description: "Near-native fluency: JLPT N2–N1, sastra, bisnis, dan spesialisasi.",
      sublevels: [
        { code: "B2.1", name: "Advanced Expression",      sessions: b2_1, preview: false },
        { code: "B2.2", name: "JLPT N1 Foundation",       sessions: b2_2, preview: false },
        { code: "B2.3", name: "Near-Native Communication",sessions: b2_3, preview: false },
        { code: "B2.4", name: "Academic Mastery",         sessions: b2_4, preview: false },
        { code: "B2.5", name: "Leadership & Diplomacy",   sessions: b2_5, preview: false },
        { code: "B2.6", name: "Specialization",           sessions: b2_6, preview: false },
        { code: "B2.7", name: "JLPT N1 Test Prep",        sessions: b2_7, preview: false },
      ],
    },
  ],
};

export default curriculum;
