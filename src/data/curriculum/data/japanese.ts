import type { LanguageCurriculum, SessionPreview } from "../types";
import { getLanguageBySlug } from "../languages";

// Compact format: [number, title] or [number, title, topics[]]
type Raw = [number, string, string[]?];

const toSessions = (raw: Raw[]): SessionPreview[] =>
  raw.map(([number, title, topics]) => ({ number, title, ...(topics ? { topics } : {}) }));

const titleOnly = (titles: string[]): SessionPreview[] =>
  titles.map((title, i) => ({ number: i + 1, title }));

// ============ A1 (JLPT N5) — 3 sublevels, FULLY PREVIEWED ============
const a1_1 = toSessions([
  [1, "Hiragana Dasar: あ-そ", ["10 huruf pertama", "pelafalan", "stroke order"]],
  [2, "Hiragana Lanjutan: た-ん", ["sisa 36 huruf", "dakuten (゛)", "handakuten (゜)"]],
  [3, "Salam & Perkenalan", ["こんにちは", "はじめまして", "よろしく"]],
  [4, "Angka 1–100", ["いち～じゅう", "ratusan", "nomor telepon"]],
  [5, "Hari & Bulan", ["7 hari", "12 bulan", "tanggal"]],
  [6, "Katakana Dasar", ["untuk kata serapan", "nama negara", "makanan Barat"]],
  [7, "Keluarga & Anggota", ["ちち / はは", "uchi vs soto", "keigo keluarga"]],
  [8, "Partikel は (topic)", ["わたしは学生です", "struktur AはBです", "は dibaca 'wa'"]],
  [9, "Partikel の (possessive)", ["わたしの本", "kepemilikan", "modifier"]],
  [10, "Kata Tunjuk: これ・それ・あれ", ["jarak dekat-jauh", "kono / sono / ano"]],
  [11, "Kata Kerja Bentuk -ます", ["たべます", "のみます", "polite form"]],
  [12, "Bentuk Negatif -ません", ["たべません", "のみません", "spoken register"]],
  [13, "Partikel を (objek)", ["ごはんをたべます", "transitive verbs"]],
  [14, "Makanan & Minuman", ["ごはん・パン", "おちゃ・コーヒー", "itadakimasu"]],
  [15, "Di Kelas", ["ほん・えんぴつ", "classroom objects", "kore wa nan desu ka"]],
  [16, "Review & Percakapan Pertama", ["self-intro 30 detik", "tanya jawab dasar"]],
]);

const a1_2 = toSessions([
  [1, "Bentuk Lampau -ました", ["たべました", "のみました", "past affirmative"]],
  [2, "Bentuk Lampau Negatif -ませんでした", ["kemarin tidak...", "past negative"]],
  [3, "Waktu & Hari", ["なんじ？", "jam", "kinou / kyou / ashita"]],
  [4, "Rumah Saya", ["ruangan", "kagu (furniture)", "に・で position"]],
  [5, "Rutinitas Harian", ["bangun", "kerja", "urutan waktu"]],
  [6, "Kata Tanya: なに・どこ・だれ", ["what / where / who", "question intonation"]],
  [7, "Partikel Tempat: に vs で", ["に = destination/exist", "で = activity location"]],
  [8, "Pakaian & Busana", ["fuku", "describing outfits", "warna"]],
  [9, "Cuaca & Musim", ["はれ・あめ・ゆき", "4 musim Jepang", "atsui / samui"]],
  [10, "Di Pasar", ["kudamono / yasai", "いくらですか", "thousand yen"]],
  [11, "Di Restoran", ["menu membaca", "~をください", "oaiso onegaishimasu"]],
  [12, "できる - Kemampuan", ["~ができます", "bahasa", "olahraga"]],
  [13, "Adverbia Frekuensi", ["いつも・よく・たまに・ぜんぜん", "sama di kalimat negatif"]],
  [14, "Hobi & Waktu Luang", ["しゅみは～です", "~をするのがすきです"]],
  [15, "Suka & Tidak Suka", ["すき・きらい", "daisuki / daikirai intensif"]],
  [16, "Review & Role Play", ["skenario restoran", "belanja di konbini"]],
]);

const a1_3 = toSessions([
  [1, "Te-Form: Verb Group 1", ["iku → itte", "kaku → kaite", "conjugation chart"]],
  [2, "Te-Form: Verb Group 2 & 3", ["taberu → tabete", "suru → shite", "kuru → kite"]],
  [3, "Menghubungkan Aksi: ~て~", ["asa okite gohan wo tabemasu", "sequence"]],
  [4, "Meminta: ~てください", ["kudasai form", "polite request", "help phrases"]],
  [5, "Sekarang: ~ています", ["present progressive", "state verbs", "matte imasu"]],
  [6, "Deskripsi Kota", ["eki / gakkou / koen", "~のそば", "directions basic"]],
  [7, "Transportasi", ["でんしゃ・バス・タクシー", "~でいきます", "train culture"]],
  [8, "Belanja Pakaian", ["ukuran", "kiru vs haku", "試着 (try on)"]],
  [9, "Membuat Janji", ["~しましょう", "~しませんか", "accepting politely"]],
  [10, "Telepon", ["moshi moshi", "~さんいらっしゃいますか", "wait momentarily"]],
  [11, "Mengisi Formulir", ["namae・juusho・bangou", "Japanese form format"]],
  [12, "Kata Sifat -い vs -な", ["takai / shizuka na", "different conjugations"]],
  [13, "Perbandingan", ["~より~のほうが~", "dochira ga suki desu ka"]],
  [14, "Membeli di Toko", ["~をかいます", "counter words intro", "nedan (harga)"]],
  [15, "Akhir Pekan Saya", ["shuumatsu", "storytelling basic", "saigo ni"]],
  [16, "Review & Percakapan Panjang", ["3-menit cerita pribadi"]],
]);

// ============ A2 (JLPT N4) — 4 sublevels, preview-locked ============
const a2_1 = titleOnly([
  "Bentuk Biasa (Plain Form)", "Te-form Permission: ~てもいいです",
  "Te-form Prohibition: ~てはいけません", "Keharusan: ~なければなりません",
  "Potensial: ~られる / ~える", "Modal: ~たほうがいい (sebaiknya)",
  "Kata Sifat Lanjutan", "Deskripsi Orang",
  "Kampung Halaman", "Kosakata Perjalanan",
  "Di Bandara Narita", "Check-in Hotel",
  "Restoran Tingkat Lanjut", "Meminta Bantuan",
  "Budaya Jepang Dasar", "Review: Role Play Travel",
]);

const a2_2 = titleOnly([
  "Conditional: ~たら", "Conditional: ~ば / ~と",
  "Alasan: ~から / ~ので", "Maksud: ~ために",
  "Ingin: ~たい", "Ingin Orang Lain: ~てほしい",
  "Pekerjaan & Profesi", "Wawancara Kerja Dasar",
  "Kosakata Kantor", "Menulis Email Jepang",
  "Deskripsi Pekerjaan", "Small Talk Japanese Style",
  "Berbagi Pengalaman", "Berita & Current Events",
  "Lingkungan & Alam", "Review",
]);

const a2_3 = titleOnly([
  "Pasif ~られる / ~れる", "Kausatif ~させる",
  "Pasif Kausatif: Dipaksa", "Klausa Relatif (Adj Clause)",
  "Kata Keterangan Cara", "だから / でも / しかし",
  "Menyatakan Opini: ~とおもう", "Setuju / Tidak Setuju",
  "Struktur Cerita Jepang", "Mendeskripsikan Buku / Film",
  "Kesehatan & Sakit", "Di Dokter & Apotek",
  "Olahraga & Kebugaran", "Musik & Seni Jepang",
  "Teknologi Kosakata", "Review & Opinion Debate",
]);

const a2_4 = titleOnly([
  "Dulu: ~ていた (past continuous)", "Kebiasaan Masa Lalu: よく~した",
  "Refleksif: 自分", "Sama/Sebanding: どちらも",
  "Terlalu~: ~すぎる", "Kuantifier",
  "Seseorang/Sesuatu: だれか・なにか", "Menyatakan Preferensi",
  "Menawarkan Saran", "Menawarkan Bantuan",
  "Memberi Instruksi", "Mendeskripsikan Proses",
  "Matsuri (Festival)", "Budaya Kuliner Jepang",
  "Indonesia vs Jepang", "Review & Cultural Exchange",
]);

// ============ B1 (JLPT N3) — 5 sublevels, preview-locked ============
const b1_1 = titleOnly([
  "Present Perfect: ~ている (state)", "Past Perfect: ~ていた",
  "Reported Speech: ~と言いました", "Reported Questions: ~かききました",
  "Keigo Intro: Sonkeigo", "Keigo Intro: Kenjougo",
  "Modal Review: べき / はず / かもしれない", "Phrasal Patterns: ~ておく",
  "Phrasal Patterns: ~てしまう", "Idioms Dasar Jepang",
  "Formal vs Informal Register", "Menulis Ulasan",
  "Deskripsi Advance", "Perbedaan Budaya",
  "Diskusi Film Jepang", "Review",
]);

const b1_2 = titleOnly([
  "Conditional Review: たら/ば/と/なら", "Mixed Conditionals",
  "Klausa Relatif Kompleks", "Participle Clauses",
  "Linker: ~にもかかわらず", "Berita Kosakata N3",
  "Diskusi Politik Ringan", "Isu Global",
  "Debat Lingkungan", "Dampak Teknologi",
  "SNS & Sosial Media Jepang", "Diskusi Karier",
  "Keterampilan Wawancara", "Dasar Negosiasi",
  "Mempresentasikan Ide", "Review",
]);

const b1_3 = titleOnly([
  "Modal Perfect: ~するべきだった", "Pasif Lanjutan",
  "Nominalisasi: こと / の", "Penekanan: ~こそ",
  "Linker Advanced", "Kepastian & Keraguan",
  "Dasar Academic Writing Jepang", "Struktur Essay",
  "Diskusi Sastra Jepang", "Seni & Budaya",
  "Topik Sejarah Jepang", "Sains & Penemuan",
  "Filsafat Ringan", "Business Japanese Basics",
  "Meeting & Keputusan", "Review",
]);

const b1_4 = titleOnly([
  "Gerund & Infinitive Setara", "Phrasal Lanjutan",
  "Kata Majemuk", "Kanji Compound 熟語",
  "Penekanan dengan こそ/こそあど", "Cleft Sentence: ~のは~です",
  "Travel Writing", "Blog & SNS Writing",
  "Dasar Public Speaking", "Etiket Debat",
  "Personal Essay", "Deskripsi Kreatif",
  "Analisis Film & TV", "Musik & Puisi",
  "Etiket Global Japanese Perspective", "Review",
]);

const b1_5 = titleOnly([
  "Reported Speech Lanjutan", "Wish & If Only: ~ばよかった",
  "Situasi Hipotesis", "Mixed Tenses",
  "Pasif Lanjutan", "Kausatif ~てもらう",
  "Menyatakan Penyesalan", "Menyatakan Harapan",
  "Problem-Solving Kosakata", "Pengambilan Keputusan",
  "Crisis Management Jepang Style", "Dasar Kepemimpinan",
  "Komunikasi Tim", "Feedback & Kritik",
  "Time Management", "Review & Business Simulation",
]);

// ============ B2 (JLPT N2) — 7 sublevels, preview-locked ============
const b2_1 = titleOnly([
  "Struktur Kalimat Kompleks N2", "Subjunctive-like: もし~ば",
  "Struktur Emfatik", "Cleft Sentences Jepang",
  "Kolokasi N2", "Ekspresi Idiomatik",
  "Metafora & Perumpamaan", "Register Formal Mastery",
  "Teknik Debat", "Penulisan Persuasif",
  "Korespondensi Formal", "Presentasi Akademik",
  "Analisis Kritis", "Meringkas & Parafrase",
  "Creative Writing Jepang", "Review",
]);

const b2_2 = titleOnly([
  "Business Komunikasi", "Report Writing",
  "Kosakata Project Management", "Bahasa Kepemimpinan",
  "Financial Japanese", "Kosakata Marketing",
  "HR & Rekrutmen", "Dasar Legal",
  "IT & Industri Tech Jepang", "Client Relations",
  "Etiket Bisnis Internasional", "Komunikasi Lintas Budaya",
  "Memberikan Presentasi", "Memimpin Meeting",
  "Proposal Tertulis", "Review",
]);

const b2_3 = titleOnly([
  "Kefasihan Idiomatik", "Nuansa Budaya Jepang",
  "Humor & Sarkasme Jepang", "Slang & Wakamono Kotoba",
  "Varian Daerah: Kansai vs Kanto", "Strategi Listening Lanjutan",
  "Comprehension Fast Speech", "Aksen & Pelafalan",
  "Academic Discourse", "Analisis Media Jepang",
  "Sastra & Puisi Jepang", "Public Speaking",
  "Storytelling Mastery", "Debate & Argumentasi",
  "Personal Brand in Japanese", "Review",
]);

const b2_4 = titleOnly([
  "Strategi Academic Reading", "Kosakata Penelitian",
  "Dasar Thesis Writing", "Sitasi & Referensi",
  "Presentasi Data", "Deskripsi Grafik & Chart",
  "Metode Ilmiah", "Laporan Eksperimen",
  "Bahasa Peer Review", "Presentasi Konferensi",
  "Proposal Penelitian", "Literature Review",
  "Penulisan Abstrak", "Formulasi Hipotesis",
  "Academic Debate", "Review",
]);

const b2_5 = titleOnly([
  "Legal Japanese Introduction", "Kosakata Kontrak",
  "Negosiasi Mastery", "Arbitrase & Mediasi",
  "Bahasa Diplomatik", "Penyelesaian Sengketa Lintas Budaya",
  "Penulisan Policy", "Urusan Pemerintahan",
  "Public Speaking untuk Pemimpin", "TED Talk Style",
  "Motivational Speaking", "Executive Presence",
  "Crisis Communication", "Wawancara Media",
  "Konferensi Pers", "Review",
]);

const b2_6 = titleOnly([
  "Analisis Sastra", "Interpretasi Haiku & Tanka",
  "Bahasa Klasik Bungo Basics", "Sastra Modern Jepang",
  "Short Story Crafting", "Struktur Novel",
  "Pengembangan Karakter", "Penulisan Dialog",
  "Dasar Screenplay", "Penulisan Lirik Lagu",
  "Keterampilan Penerjemahan", "Dasar Subtitling",
  "Creative Non-fiction", "Memoir Writing",
  "Travel Writing Mastery", "Review",
]);

const b2_7 = titleOnly([
  "JLPT N2 Vocabulary Mastery", "JLPT N2 Grammar Deep Dive",
  "JLPT N2 Reading Strategies", "JLPT N2 Listening",
  "JLPT N2 Mock Test 1", "JLPT N2 Mock Test 2",
  "Strategi Waktu JLPT", "Common Pitfalls",
  "JLPT N1 Preview: Vocabulary", "JLPT N1 Preview: Grammar",
  "Academic Japanese for Graduate Studies", "Business Japanese Certification",
  "Interview Persiapan Kerja di Jepang", "Visa & Work Culture",
  "Life Skills in Japan", "Final Mock Test & Review",
]);

const curriculum: LanguageCurriculum = {
  meta: getLanguageBySlug("japanese")!,
  overview: "Program 304 sesi yang mengantar kamu dari benar-benar nol sampai kefasihan setara JLPT N2. Struktur Linguo: A1 ≈ N5 (3 chapter), A2 ≈ N4 (4 chapter), B1 ≈ N3 (5 chapter), B2 ≈ N2 (7 chapter). Mulai dari hiragana/katakana, lalu kanji bertahap hingga ~1000 kanji di level B2. Cocok untuk persiapan studi ke Jepang, kerja, atau karier internasional.",
  levels: [
    {
      code: "A1", name: "Elementary (JLPT N5)",
      description: "Fondasi: hiragana, katakana, 100 kanji dasar, tata bahasa sederhana, percakapan sehari-hari.",
      sublevels: [
        { code: "A1.1", name: "First Steps",   sessions: a1_1, preview: true },
        { code: "A1.2", name: "Daily Life",    sessions: a1_2, preview: true },
        { code: "A1.3", name: "Social Basics", sessions: a1_3, preview: true },
      ],
    },
    {
      code: "A2", name: "Pre-Intermediate (JLPT N4)",
      description: "Beyond basics: conditional, kausatif, pasif, 300 kanji, percakapan panjang.",
      sublevels: [
        { code: "A2.1", name: "Beyond Basics",        sessions: a2_1, preview: false },
        { code: "A2.2", name: "Travel & Work",        sessions: a2_2, preview: false },
        { code: "A2.3", name: "Self-Expression",      sessions: a2_3, preview: false },
        { code: "A2.4", name: "Cultural Foundations", sessions: a2_4, preview: false },
      ],
    },
    {
      code: "B1", name: "Intermediate (JLPT N3)",
      description: "Fluency: keigo dasar, tenses kompleks, 650 kanji, diskusi topik abstrak.",
      sublevels: [
        { code: "B1.1", name: "Fluency Foundations", sessions: b1_1, preview: false },
        { code: "B1.2", name: "Cultural Fluency",    sessions: b1_2, preview: false },
        { code: "B1.3", name: "Complex Topics",      sessions: b1_3, preview: false },
        { code: "B1.4", name: "Creative Expression", sessions: b1_4, preview: false },
        { code: "B1.5", name: "Professional Bridge", sessions: b1_5, preview: false },
      ],
    },
    {
      code: "B2", name: "Upper Intermediate (JLPT N2)",
      description: "Advanced: keigo mastery, ~1000 kanji, business & academic Japanese. JLPT N2 ready.",
      sublevels: [
        { code: "B2.1", name: "Advanced Expression",       sessions: b2_1, preview: false },
        { code: "B2.2", name: "Professional Japanese",     sessions: b2_2, preview: false },
        { code: "B2.3", name: "Near-Native Communication", sessions: b2_3, preview: false },
        { code: "B2.4", name: "Academic Mastery",          sessions: b2_4, preview: false },
        { code: "B2.5", name: "Leadership & Diplomacy",    sessions: b2_5, preview: false },
        { code: "B2.6", name: "Creative & Literary",       sessions: b2_6, preview: false },
        { code: "B2.7", name: "JLPT N2 Test Prep",         sessions: b2_7, preview: false },
      ],
    },
  ],
};

export default curriculum;
