import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// MADURESE (BHÂSA MADHURÂ) PLACEMENT TEST (15 soal, tipe campuran)
// Mencakup tingkat tutur: enja'-iya (akrab) vs èngghi-bhunten (halus)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// ─────────────────────────────────────────────────────────────────────────────
export const maduresePlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari 'Sakalangkong' adalah:",
    options: ["Selamat pagi", "Terima kasih", "Sampai jumpa", "Maaf"],
    correct: 1,
    explanation: "'sakalangkong' = terima kasih — salah satu kata Madura paling terkenal. Minta maaf = 'nyo'on sapora'.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Madura dengan artinya:",
    pairs: [
      { left: "settong", right: "1" },
      { left: "tello'", right: "3" },
      { left: "lèma'", right: "5" },
      { left: "sapolo", right: "10" },
    ],
    explanation: "Angka dasar: settong, dhuwâ', tello', empa', lèma' … sapolo. Wajib untuk harga dan hitungan sehari-hari.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Sengko' ___ nase'.' (Saya makan nasi.)",
    context: "Kata kerja 'makan' (ragam akrab/enja'-iya).",
    options: ["ngakan", "ngènom", "tedhung", "entar"],
    correct: "ngakan",
    explanation: "'ngakan' = makan (ragam akrab; bentuk halusnya 'neddhâ'), 'nase'' = nasi, 'sengko'' = saya (akrab). Pengecoh: 'ngènom' = minum, 'tedhung' = tidur, 'entar' = pergi.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya pergi ke pasar.",
    tokens: ["ka pasar", "Sengko'", "entar"],
    correct: ["Sengko'", "entar", "ka pasar"],
    explanation: "Struktur SVO: 'sengko'' = saya, 'entar' = pergi, 'ka' = ke.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Untuk menyatakan 'saya SUDAH makan' (ragam akrab), kalimat yang tepat:",
    options: [
      "Sengko' ngakana",
      "Sengko' la ngakan",
      "Sengko' gi' ngakan",
      "Sengko' ta' ngakan",
    ],
    correct: 1,
    explanation: "'la' = sudah. Pengecoh: 'ngakan-a' (akhiran -a) = AKAN makan, 'gi'' = masih, 'ta'' = tidak.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan keterangan tempat:",
    translation: "Saya belajar bahasa Madura di rumah.",
    tokens: ["bhâsa Madhurâ", "Sengko'", "ajhâr", "è bengko"],
    correct: ["Sengko'", "ajhâr", "bhâsa Madhurâ", "è bengko"],
    explanation: "'ajhâr' = belajar, 'è' = di, 'bengko' = rumah. Keterangan tempat diletakkan di akhir kalimat.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan kata yang tepat:",
    template: "Bâri' sengko' ___ jhuko' ___ pasar. (Kemarin saya membeli ikan di pasar.)",
    blanks: ["mellè", "è"],
    options: ["mellè", "ngèba", "è", "ka", "ngakan", "tedhung"],
    explanation: "'bâri'' = kemarin, 'mellè' = membeli, 'jhuko'' = ikan, 'è' = di (lokasi). Pengecoh: 'ngèba' = membawa, 'ka' = ke (arah), 'tedhung' = tidur.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'Sengko' ___ entar ka sakola sateya.' (Saya tidak pergi ke sekolah sekarang.)",
    context: "Kata ingkar untuk kata kerja.",
    options: ["ta'", "banne", "bhunten", "enja'"],
    correct: "ta'",
    explanation: "'ta'' = tidak (mengingkari kata kerja/sifat), 'banne' = bukan (untuk kata benda). 'enja'' dan 'bhunten' = jawaban 'tidak' berdiri sendiri (akrab vs halus). 'sateya' = sekarang.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Kalimat PALING HALUS (èngghi-bhunten) untuk 'Saya sudah makan' ketika berbicara dengan orang yang dihormati:",
    options: [
      "Sengko' la ngakan",
      "Kaulâ ampon neddhâ",
      "Sengko' ampon ngakan",
      "Kaulâ la ngakan",
    ],
    correct: 1,
    explanation: "Ragam halus harus KONSISTEN: 'kaulâ' = saya (halus), 'ampon' = sudah (halus), 'neddhâ' = makan (halus). Mencampur kasar-halus ('sengko' ampon', 'kaulâ la ngakan') dianggap janggal.",
  },
  {
    id: "q10", difficulty: "B1", type: "multiple",
    question: "Arti 'Mon bâdâ pèssè, sengko' terro mellèya sapèdha.' :",
    options: [
      "Karena punya uang, saya membeli sepeda",
      "Kalau ada uang, saya ingin membeli sepeda",
      "Meskipun ada uang, saya tidak membeli sepeda",
      "Uang saya habis membeli sepeda",
    ],
    correct: 1,
    explanation: "'mon' = kalau, 'bâdâ' = ada, 'pèssè' = uang, 'terro' = ingin, 'mellè-ya' (akhiran -a) = akan membeli. Bandingkan: 'polana' = karena, 'maskè' = meskipun.",
  },
  {
    id: "q11", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata ragam akrab (enja'-iya) dengan padanan halusnya (èngghi-bhunten):",
    pairs: [
      { left: "sengko' (saya)", right: "kaulâ" },
      { left: "iyâ (ya)", right: "èngghi" },
      { left: "enja' (tidak)", right: "bhunten" },
      { left: "ngakan (makan)", right: "neddhâ" },
    ],
    explanation: "Tingkat tutur adalah jantung bahasa Madura: enja'-iya untuk teman sebaya, èngghi-bhunten untuk orang tua/yang dihormati. Nama tingkatnya diambil dari kata 'tidak-ya' masing-masing ragam.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi dengan bentuk kata kerja yang tepat (perhatikan akhiran -a penanda 'akan'):",
    template: "Lagghu' sengko' ___ ka Songennep, bâri' sengko' ___ dâri Bângkalan. (Besok saya akan pergi ke Sumenep, kemarin saya pulang dari Bangkalan.)",
    blanks: ["entara", "molè"],
    options: ["entara", "entar", "molè", "molèya", "ngakan", "tedhung"],
    explanation: "'lagghu'' = besok → butuh futur 'entar-a' = akan pergi. 'bâri'' = kemarin → cukup 'molè' = pulang (tanpa -a). 'molèya' = akan pulang (salah konteks untuk kemarin).",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Bentuk jamak bahasa Madura memakai pengulangan suku kata AKHIR. 'Anak-anak' (dari 'kana'' = anak) yang benar:",
    options: ["kana'-kana'", "na'-kana'", "kana'-na'", "anak-anak"],
    correct: 1,
    explanation: "Reduplikasi khas Madura: suku akhir diulang di DEPAN kata — kana' → na'-kana'. Contoh lain: buku → ku-buku (buku-buku). Berbeda dari pola Indonesia yang mengulang kata penuh.",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi: 'Orèng rowa acaca bhâsa Madhurâ ___ orèng Madhurâ asli.' (Orang itu berbicara bahasa Madura seperti orang Madura asli.)",
    context: "Kata perbandingan 'seperti'.",
    options: ["akantha", "polana", "sopajâ", "maskè"],
    correct: "akantha",
    explanation: "'akantha' = seperti/bagaikan, 'orèng' = orang, 'rowa' = itu, 'acaca' = berbicara. Pengecoh: 'polana' = karena, 'sopajâ' = supaya, 'maskè' = meskipun.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa Madura 'Ango'an potèya tolang è tembhâng potèya mata' paling dekat maknanya dengan:",
    options: [
      "Lebih baik mati daripada hidup menanggung malu",
      "Lebih baik sakit daripada miskin",
      "Tulang yang kuat tanda badan sehat",
      "Orang tua harus dihormati sampai mati",
    ],
    correct: 0,
    explanation: "Harfiah: 'lebih baik putih tulang (mati) daripada putih mata (menanggung malu)'. Ungkapan paling terkenal tentang harga diri (tandhâ' âsta) orang Madura. 'ango'an … è tembhâng …' = lebih baik … daripada ….",
  },
];
