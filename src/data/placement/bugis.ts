import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// BUGIS (BASA UGI) PLACEMENT TEST (15 soal, tipe campuran)
// Dialek acuan: Bone–Wajo. A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// ─────────────────────────────────────────────────────────────────────────────
export const bugisPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari 'Aga kareba?' adalah:",
    options: ["Siapa namamu?", "Apa kabar?", "Mau ke mana?", "Dari mana?"],
    correct: 1,
    explanation: "'aga' = apa, 'kareba' = kabar. Jawaban umumnya 'Kareba madeceng' (kabar baik). 'Niga aseng' = siapa nama.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Bugis dengan artinya:",
    pairs: [
      { left: "seddi", right: "1" },
      { left: "tellu", right: "3" },
      { left: "lima", right: "5" },
      { left: "seppulo", right: "10" },
    ],
    explanation: "Angka dasar: seddi, dua, tellu, eppa, lima … seppulo. Wajib hafal untuk transaksi di pasa' (pasar).",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: '___, melo'ka' makkutana.' (Permisi, saya mau bertanya.)",
    context: "Kata sopan khas Bugis sebelum lewat/berbicara.",
    options: ["Tabe'", "Iye'", "De'", "Pura"],
    correct: "Tabe'",
    explanation: "'tabe'' = permisi (adab khas Bugis-Makassar, diucapkan sambil menunduk). Pengecoh: 'iye'' = ya (halus), 'de'' = tidak, 'pura' = sudah.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya mau pergi ke rumah.",
    tokens: ["lokka", "Melo'ka'", "ri bola"],
    correct: ["Melo'ka'", "lokka", "ri bola"],
    explanation: "Klitik '-ka'' (= saya) menempel pada kata pertama: 'melo'-ka'' = saya mau. 'lokka' = pergi, 'ri' = di/ke, 'bola' = rumah.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Untuk menyatakan 'saya SUDAH makan', kalimat yang tepat:",
    options: [
      "Melo'ka' manre",
      "Purana' manre",
      "Mattengngangka' manre",
      "De'pa' manre",
    ],
    correct: 1,
    explanation: "'pura' = sudah → 'purana' manre' = saya sudah makan. Pengecoh: 'melo'' = mau, 'mattengngang' = sedang, 'de'pa' = belum.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan keterangan tempat:",
    translation: "Saya belajar bahasa Bugis di rumah.",
    tokens: ["basa Ugi", "Magguruka'", "ri bola"],
    correct: ["Magguruka'", "basa Ugi", "ri bola"],
    explanation: "'magguru' = belajar (+ klitik -ka' = saya), 'basa Ugi' = bahasa Bugis. Keterangan tempat 'ri bola' di akhir kalimat.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan kata yang tepat:",
    template: "Lokkaka' ri pasa'é ___ balé. Balé-é ___ ladde'. (Saya pergi ke pasar membeli ikan. Ikannya murah sekali.)",
    blanks: ["melli", "masempo"],
    options: ["melli", "mabbalu'", "masempo", "masuli'", "manre", "maloppo"],
    explanation: "'melli' = membeli, 'masempo' = murah, 'ladde'' = sangat, akhiran '-é' = -nya/si (penentu). Pengecoh: 'mabbalu'' = menjual, 'masuli'' = mahal, 'maloppo' = besar.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: '___ka' mellau tulung?' (Bolehkah saya minta tolong?)",
    context: "Kata untuk 'boleh/bisa'.",
    options: ["Wedding", "Melo'", "Pura", "De'"],
    correct: "Wedding",
    explanation: "'wedding' = boleh/bisa, 'mellau' = meminta, 'tulung' = tolong. Pengecoh: 'melo'' = mau, 'pura' = sudah, 'de'' = tidak.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'Namuni bosi, lokkaka' ri pasa'é.' :",
    options: [
      "Karena hujan, saya tidak ke pasar",
      "Meskipun hujan, saya tetap pergi ke pasar",
      "Kalau hujan, saya pergi ke pasar",
      "Setelah hujan, saya pergi ke pasar",
    ],
    correct: 1,
    explanation: "'namuni' = meskipun (konsesif), 'bosi' = hujan. Bandingkan: 'nasaba'' = karena, 'narékko' = kalau.",
  },
  {
    id: "q10", difficulty: "B1", type: "multiple",
    question: "Arti 'Narékko engka dui', melo'ka' melli motoro'.' :",
    options: [
      "Karena punya uang, saya membeli motor",
      "Kalau ada uang, saya mau membeli motor",
      "Meskipun ada uang, saya tidak membeli motor",
      "Uang saya habis membeli motor",
    ],
    correct: 1,
    explanation: "'narékko' = kalau, 'engka' = ada, 'dui'' = uang, 'melo'' = mau/ingin, 'melli' = membeli.",
  },
  {
    id: "q11", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung Bugis dengan artinya:",
    pairs: [
      { left: "nasaba'", right: "karena" },
      { left: "narékko", right: "kalau" },
      { left: "kuwammengngi", right: "supaya" },
      { left: "iyakiya", right: "tetapi" },
    ],
    explanation: "Konjungsi ini kunci kalimat majemuk level menengah dalam basa Ugi.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi dengan akhiran kepunyaan yang tepat:",
    template: "Bola___ maloppo, bola___ baiccu'. (Rumahku besar, rumahmu kecil.)",
    blanks: ["ku", "mu"],
    options: ["ku", "mu", "na", "ta", "é", "i"],
    explanation: "Akhiran kepunyaan: '-ku' = -ku, '-mu' = -mu (akrab), '-na' = -nya, '-ta' = milik Anda/kita (bentuk HORMAT — dipakai untuk menghargai lawan bicara). '-é' = penentu (si/nya).",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Konsep 'siri'' dalam budaya dan bahasa Bugis paling dekat maknanya dengan:",
    options: [
      "Rasa malu sekaligus harga diri / martabat",
      "Kekayaan dan jabatan",
      "Ilmu pengetahuan",
      "Keberanian di medan perang",
    ],
    correct: 0,
    explanation: "'siri'' = konsep sentral Bugis-Makassar: malu dan martabat yang harus dijaga. Banyak ungkapan dibangun dari kata ini, misalnya 'tau dé' siri'na' = orang yang tak punya harga diri.",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi: 'Mabbicara basa Ugi-i ___ tau Ugi tulen.' (Dia berbahasa Bugis seperti orang Bugis asli.)",
    context: "Kata perbandingan 'sama seperti'.",
    options: ["pada", "sibawa", "nasaba'", "ri"],
    correct: "pada",
    explanation: "'pada' = sama/seperti ('pada-pada' = sama-sama), klitik '-i' = dia, 'tau' = orang. Pengecoh: 'sibawa' = dengan/dan, 'nasaba'' = karena, 'ri' = di/ke.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Pepatah Bugis 'Resopa temmangingngi namalomo naletei pammase Dewata' paling dekat maknanya dengan:",
    options: [
      "Berakit-rakit ke hulu, berenang-renang ke tepian",
      "Air beriak tanda tak dalam",
      "Besar pasak daripada tiang",
      "Tong kosong nyaring bunyinya",
    ],
    correct: 0,
    explanation: "Artinya: hanya kerja keras tanpa kenal lelah ('reso' = kerja, 'temmangingngi' = tak jemu) yang mudah dititi rahmat Tuhan — bersusah dahulu, hasil kemudian.",
  },
];
