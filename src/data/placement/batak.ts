import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// BATAK TOBA PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// ─────────────────────────────────────────────────────────────────────────────
export const batakPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "'Horas!' dalam bahasa Batak Toba adalah:",
    options: [
      "Ucapan terima kasih",
      "Salam khas Batak (sekaligus doa keselamatan)",
      "Kata untuk minta maaf",
      "Ucapan selamat tinggal saja",
    ],
    correct: 1,
    explanation: "'Horas' = salam serbaguna orang Batak, sekaligus doa agar sehat dan selamat. Terima kasih = 'mauliate'.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Batak Toba dengan artinya:",
    pairs: [
      { left: "sada", right: "1" },
      { left: "tolu", right: "3" },
      { left: "lima", right: "5" },
      { left: "sampulu", right: "10" },
    ],
    explanation: "Angka dasar: sada, dua, tolu, opat, lima … sampulu. Dipakai untuk harga, jam, dan hitungan sehari-hari.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Mauliate ___.' (Terima kasih banyak.)",
    context: "Kata untuk 'banyak/besar'.",
    options: ["godang", "metmet", "otik", "uli"],
    correct: "godang",
    explanation: "'Mauliate godang' = terima kasih banyak; 'godang' = banyak/besar. Pengecoh: 'metmet' = kecil, 'otik' = sedikit, 'uli' = bagus/indah.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat ajakan yang benar:",
    translation: "Mari kita makan!",
    tokens: ["hita", "Mangan", "ma"],
    correct: ["Mangan", "ma", "hita"],
    explanation: "Ciri khas Batak Toba: predikat di DEPAN kalimat. 'mangan' = makan, 'ma' = partikel ajakan/penegas, 'hita' = kita.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Untuk menyatakan 'saya SUDAH makan', kalimat yang tepat:",
    options: [
      "Naeng mangan ahu",
      "Nunga mangan ahu",
      "Ndang mangan ahu",
      "Mangan dope ahu",
    ],
    correct: 1,
    explanation: "'nunga' = sudah (perfektif). Pengecoh: 'naeng' = akan/ingin, 'ndang' = tidak, 'dope' = masih. 'ahu' = saya.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan keterangan tempat (ingat: predikat di depan):",
    translation: "Saya pergi ke pasar.",
    tokens: ["tu onan", "ahu", "Laho", "ma"],
    correct: ["Laho", "ma", "ahu", "tu onan"],
    explanation: "'laho' = pergi, 'tu' = ke, 'onan' = pasar. Urutan Batak: Predikat (+ma) + Subjek + Keterangan tempat.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan kata yang tepat:",
    template: "Manuhor ___ ahu ___ onan. (Saya membeli beras di pasar.)",
    blanks: ["boras", "di"],
    options: ["boras", "indahan", "di", "tu", "aek", "sian"],
    explanation: "'manuhor' = membeli, 'boras' = beras (mentah; 'indahan' = nasi yang sudah dimasak), 'di' = di (lokasi). Pengecoh: 'tu' = ke (arah), 'sian' = dari, 'aek' = air.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: '___ do ho marhata Batak?' (Bisakah kamu berbahasa Batak?)",
    context: "Kata untuk kemampuan 'bisa'.",
    options: ["Boi", "Ingkon", "Olo", "Naeng"],
    correct: "Boi",
    explanation: "'boi' = bisa/boleh, 'marhata Batak' = berbahasa Batak, 'ho' = kamu. Pengecoh: 'ingkon' = harus, 'olo' = ya/mau, 'naeng' = ingin/akan.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'Age pe udan, laho do ahu tu onan.' :",
    options: [
      "Karena hujan, saya tidak ke pasar",
      "Meskipun hujan, saya tetap pergi ke pasar",
      "Kalau hujan, saya pergi ke pasar",
      "Setelah hujan, saya pergi ke pasar",
    ],
    correct: 1,
    explanation: "'age pe' = meskipun (konsesif), 'udan' = hujan, 'do' = partikel penegas. Bandingkan: 'ala' = karena, 'molo' = kalau.",
  },
  {
    id: "q10", difficulty: "B1", type: "multiple",
    question: "Arti 'Molo adong hepeng, naeng manuhor motor ahu.' :",
    options: [
      "Karena punya uang, saya membeli motor",
      "Kalau ada uang, saya ingin membeli motor",
      "Meskipun ada uang, saya tidak membeli motor",
      "Uang saya habis membeli motor",
    ],
    correct: 1,
    explanation: "'molo' = kalau, 'adong' = ada, 'hepeng' = uang, 'naeng' = ingin/akan, 'manuhor' = membeli.",
  },
  {
    id: "q11", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung Batak Toba dengan artinya:",
    pairs: [
      { left: "ala", right: "karena" },
      { left: "molo", right: "kalau" },
      { left: "asa", right: "supaya" },
      { left: "alai", right: "tetapi" },
    ],
    explanation: "Konjungsi ini pondasi kalimat majemuk level menengah. Tambahan: 'jala' = dan (antar klausa), 'dohot' = dan/dengan.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi dengan akhiran kepunyaan yang tepat:",
    template: "Goar___ si Butet, jala goar___ si Ucok. (Namaku Butet, dan namamu Ucok.)",
    blanks: ["hu", "mu"],
    options: ["hu", "mu", "na", "ta", "ni", "muna"],
    explanation: "'goar' = nama; akhiran kepunyaan: '-hu' = -ku, '-mu' = -mu, '-na' = -nya, '-ta' = kita (inklusif), '-muna' = kalian. 'ni' = partikel milik ('punya').",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Arti kalimat pasif 'Ditangko halak hepenghu.' :",
    options: [
      "Saya mencuri uang orang",
      "Uangku dicuri orang",
      "Saya meminjam uang orang",
      "Uang orang itu hilang sendiri",
    ],
    correct: 1,
    explanation: "Awalan 'di-' menandai pasif: 'ditangko' = dicuri (dari 'manangko' = mencuri). 'halak' = orang (pelaku), 'hepeng-hu' = uang-ku.",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi: 'Marhata Batak ibana ___ halak Toba na asli.' (Dia berbahasa Batak seperti orang Toba asli.)",
    context: "Kata perbandingan 'seperti'.",
    options: ["songon", "sian", "dohot", "ala"],
    correct: "songon",
    explanation: "'songon' = seperti/bagaikan, 'ibana' = dia, 'na' = penanda sifat/relatif. Pengecoh: 'sian' = dari, 'dohot' = dengan/dan, 'ala' = karena.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Ungkapan Batak 'Anakkonhi do hamoraon di au' paling dekat maknanya dengan:",
    options: [
      "Anak adalah kekayaan/harta paling berharga bagi orang tua",
      "Kekayaan menentukan masa depan anak",
      "Anak wajib mencari kekayaan untuk orang tua",
      "Orang kaya biasanya banyak anak",
    ],
    correct: 0,
    explanation: "'anakkon-hi' = anakku, 'hamoraon' = kekayaan, 'di au' = bagiku. Filosofi Batak: pendidikan dan masa depan anak di atas segalanya — orang tua rela berkorban apa pun.",
  },
];
