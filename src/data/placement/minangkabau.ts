import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// MINANGKABAU PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// ─────────────────────────────────────────────────────────────────────────────
export const minangkabauPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari 'Apo kaba?' adalah:",
    options: ["Siapa namamu?", "Apa kabar?", "Mau ke mana?", "Sudah makan?"],
    correct: 1,
    explanation: "'Apo' = apa, 'kaba' = kabar. Jawaban umumnya 'Kaba baiak' (kabar baik). 'Sia namo' = siapa nama, 'Ka ma' = ke mana.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Minang dengan artinya:",
    pairs: [
      { left: "ciek", right: "1" },
      { left: "tigo", right: "3" },
      { left: "limo", right: "5" },
      { left: "sapuluah", right: "10" },
    ],
    explanation: "Angka dasar Minang: ciek, duo, tigo, ampek, limo … sapuluah. Penting untuk tawar-menawar di pasa (pasar).",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Ambo ___ ka sakolah.' (Saya pergi ke sekolah.)",
    context: "Kata kerja 'pergi'.",
    options: ["pai", "pulang", "makan", "lalok"],
    correct: "pai",
    explanation: "'pai' = pergi, 'ka' = ke. Pengecoh: 'pulang' = pulang, 'makan' = makan, 'lalok' = tidur.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya makan nasi.",
    tokens: ["nasi", "Ambo", "makan"],
    correct: ["Ambo", "makan", "nasi"],
    explanation: "Struktur SVO seperti bahasa Indonesia: Subjek (Ambo = saya) + Kata kerja (makan) + Objek (nasi).",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Untuk menyatakan 'saya SUDAH makan', kalimat yang tepat:",
    options: [
      "Ambo makan",
      "Ambo alah makan",
      "Ambo ka makan",
      "Ambo sadang makan",
    ],
    correct: 1,
    explanation: "'alah' = sudah (penanda perfektif). Pengecoh: 'ka' = akan (futur), 'sadang' = sedang (progresif), dan 'alun' = belum.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan keterangan tempat:",
    translation: "Saya belajar bahasa Minang di rumah.",
    tokens: ["bahaso Minang", "Ambo", "di rumah", "baraja"],
    correct: ["Ambo", "baraja", "bahaso Minang", "di rumah"],
    explanation: "'baraja' = belajar, 'bahaso' = bahasa. Keterangan tempat 'di rumah' diletakkan di akhir, setelah objek.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan kata yang tepat:",
    template: "Kapatang ambo ___ ka pasa mambali ___. (Kemarin saya pergi ke pasar membeli ikan.)",
    blanks: ["pai", "lauak"],
    options: ["pai", "pulang", "lauak", "ayia", "lalok", "kini"],
    explanation: "'kapatang' = kemarin, 'pai' = pergi, 'mambali' = membeli, 'lauak' = ikan. Pengecoh: 'ayia' = air, 'lalok' = tidur, 'kini' = sekarang.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'Inyo ___ mangecek bahaso Inggirih.' (Dia bisa berbicara bahasa Inggris.)",
    context: "Kata untuk kemampuan 'bisa'.",
    options: ["pandai", "namuah", "paralu", "alah"],
    correct: "pandai",
    explanation: "'pandai' = bisa/mampu (untuk kemampuan), 'mangecek' = berbicara. Pengecoh: 'namuah' = mau, 'paralu' = perlu, 'alah' = sudah.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'Bia hujan, ambo tatap pai.' :",
    options: [
      "Karena hujan, saya tidak pergi",
      "Meskipun hujan, saya tetap pergi",
      "Kalau hujan, saya pergi",
      "Setelah hujan, saya pergi",
    ],
    correct: 1,
    explanation: "'bia' = biar/meskipun (konsesif), 'tatap' = tetap. Bandingkan: 'dek karano' = karena, 'jikok/kok' = kalau.",
  },
  {
    id: "q10", difficulty: "B1", type: "multiple",
    question: "Arti 'Kok ado pitih, ambo nio mambali oto.' :",
    options: [
      "Karena punya uang, saya membeli mobil",
      "Kalau ada uang, saya ingin membeli mobil",
      "Meskipun ada uang, saya tidak membeli mobil",
      "Uang saya habis untuk membeli mobil",
    ],
    correct: 1,
    explanation: "'kok' = kalau (bentuk pendek 'jikok'), 'ado' = ada, 'pitih' = uang, 'nio' = ingin, 'oto' = mobil.",
  },
  {
    id: "q11", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung Minang dengan artinya:",
    pairs: [
      { left: "dek karano", right: "karena" },
      { left: "jikok", right: "jika / kalau" },
      { left: "supayo", right: "supaya" },
      { left: "sudah tu", right: "setelah itu" },
    ],
    explanation: "Konjungsi adalah kunci merangkai kalimat kompleks level menengah. 'dek' sendiri juga berarti 'karena/oleh'.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat perbandingan:",
    template: "Hari ko labiah paneh ___ kapatang. Iko hari nan ___ paneh dalam minggu ko. (Hari ini lebih panas daripada kemarin. Ini hari yang paling panas minggu ini.)",
    blanks: ["daripado", "paliang"],
    options: ["daripado", "paliang", "samo", "bana", "saketek", "labiah"],
    explanation: "Komparatif: 'labiah … daripado' = lebih … daripada. Superlatif: 'nan paliang' = yang paling. Pengecoh: 'samo' = sama, 'bana' = sangat/benar, 'saketek' = sedikit.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Arti 'Sipatu nan dibali ambo kapatang alah rusak.' :",
    options: [
      "Sepatu yang akan saya beli besok sudah rusak",
      "Sepatu yang saya beli kemarin sudah rusak",
      "Sepatu yang dibeli untuk saya kemarin masih bagus",
      "Sepatu saya dijual kemarin karena rusak",
    ],
    correct: 1,
    explanation: "'nan' = yang (kata penghubung relatif khas Minang), 'dibali' = dibeli, 'alah' = sudah. Klausa relatif 'nan …' adalah struktur inti level B2.",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi: 'Inyo mangecek bahaso Minang ___ urang Padang asli.' (Dia berbahasa Minang seperti orang Padang asli.)",
    context: "Kata perbandingan 'seperti/bagaikan'.",
    options: ["bak", "dek", "jo", "ka"],
    correct: "bak",
    explanation: "'bak' = seperti/bagaikan (sering muncul dalam pepatah: 'bak cando …'). Pengecoh: 'dek' = karena/oleh, 'jo' = dengan, 'ka' = ke/akan.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Pepatah Minang 'Alam takambang jadi guru' paling dekat maknanya dengan:",
    options: [
      "Alam sekitar adalah sumber belajar kehidupan",
      "Guru harus dihormati seperti alam",
      "Belajar harus dilakukan di alam terbuka",
      "Ilmu tanpa guru akan sia-sia",
    ],
    correct: 0,
    explanation: "'Alam takambang jadi guru' = alam terkembang menjadi guru — filosofi dasar orang Minang: segala fenomena alam dan kehidupan adalah pelajaran.",
  },
];
