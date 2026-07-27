import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// YORUBA PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// ─────────────────────────────────────────────────────────────────────────────
export const yorubaPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti sapaan 'Ẹ káàárọ̀' adalah:",
    options: ["Selamat malam", "Selamat pagi", "Selamat tinggal", "Selamat makan"],
    correct: 1,
    explanation: "'Ẹ káàárọ̀' = selamat pagi ('Ẹ' = bentuk hormat/jamak, wajib untuk orang yang lebih tua). Tanda aksen adalah NADA: á = nada tinggi, à = nada rendah, tanpa tanda = nada tengah. Bandingkan 'Ẹ káàsán' = selamat siang, 'Ẹ káalẹ́' = selamat malam.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Yorùbá dengan artinya:",
    pairs: [
      { left: "ọ̀kan", right: "1" },
      { left: "méjì", right: "2" },
      { left: "mẹ́ta", right: "3" },
      { left: "mẹ́wàá", right: "10" },
    ],
    explanation: "Angka dasar ọ̀kan~mẹ́wàá penting untuk transaksi. Perhatikan tanda nada dan titik bawah: ọ dibaca seperti 'o' pada 'tolong' (terbuka), ẹ seperti 'e' pada 'nenek'.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Orúkọ mi ___ Adé.' (Nama saya Ade.)",
    context: "Kata penghubung 'adalah'.",
    options: ["ni", "kò", "sì", "fún"],
    correct: "ni",
    explanation: "'ni' = adalah (kopula): 'Orúkọ mi ni Adé' = nama saya (adalah) Ade. 'kò' = tidak (negasi), 'sì' = dan/lalu, 'fún' = untuk.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya makan nasi.",
    tokens: ["iresi", "Mo", "jẹ"],
    correct: ["Mo", "jẹ", "iresi"],
    explanation: "Struktur SVO: Mo (saya) + jẹ (makan) + iresi (nasi). Kata kerja Yorùbá tidak berubah bentuk — waktu ditunjukkan oleh partikel terpisah.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Untuk menyatakan 'Saya SUDAH makan', kalimat yang tepat:",
    options: ["Mo ń jẹun", "Mo ti jẹun", "Mo máa jẹun", "Mo jẹun"],
    correct: 1,
    explanation: "'ti' = penanda perfektif (sudah): Mo TI jẹun = saya sudah makan. 'ń' = sedang (progresif), 'máa' = akan (futur), tanpa partikel = pernyataan netral/lampau sederhana.",
  },
  {
    id: "q6", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'Mo ___ lọ sí ọjà.' (Saya sedang pergi ke pasar.)",
    context: "Penanda aspek 'sedang'.",
    options: ["ń", "ti", "máa", "kò"],
    correct: "ń",
    explanation: "'ń' menandai aksi yang sedang berlangsung: Mo ń lọ = saya sedang pergi. 'ti' = sudah, 'máa' = akan, 'kò' = tidak. 'sí' = ke (arah), 'ọjà' = pasar.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan penanda waktu yang tepat:",
    template: "Mo ___ jẹun ní àárọ̀ yìí. Mo ___ lọ sí ọjà ní ọ̀sán. (Saya sudah makan pagi ini. Saya akan pergi ke pasar siang nanti.)",
    blanks: ["ti", "máa"],
    options: ["ti", "máa", "ń", "kò", "sì", "ni"],
    explanation: "'ti' = sudah (perfektif) untuk aksi pagi yang selesai; 'máa' = akan (futur) untuk rencana siang. 'ń' = sedang, 'kò' = tidak, 'ni' = adalah — semuanya tidak cocok dengan konteks waktu di kalimat.",
  },
  {
    id: "q8", difficulty: "A2", type: "matching",
    prompt: "Jodohkan kosakata sehari-hari dengan artinya:",
    pairs: [
      { left: "omi", right: "air" },
      { left: "oúnjẹ", right: "makanan" },
      { left: "ilé", right: "rumah" },
      { left: "ọjà", right: "pasar" },
    ],
    explanation: "Kosakata inti kehidupan sehari-hari. Ingat nadanya: ilé (rumah, nada tinggi di é) berbeda dengan ilẹ̀ (tanah, nada rendah) — salah nada bisa salah arti.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'Tí òjò bá rọ̀, èmi kò ní lọ sí ọjà.' :",
    options: [
      "Karena hujan, saya tidak pergi ke pasar",
      "Kalau hujan turun, saya tidak akan pergi ke pasar",
      "Meskipun hujan, saya tetap pergi ke pasar",
      "Setelah hujan, saya pergi ke pasar",
    ],
    correct: 1,
    explanation: "Pola 'Tí … bá …' = kalau/jika: Tí òjò bá rọ̀ = kalau hujan turun. 'kò ní lọ' = tidak akan pergi (kò = tidak + ní = penanda futur dalam kalimat negatif). 'nítorí' = karena, 'bí ó tilẹ̀ jẹ́ pé' = meskipun.",
  },
  {
    id: "q10", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat perbandingan:",
    translation: "Ade lebih tinggi daripada Tayo.",
    tokens: ["ju", "Adé", "lọ", "ga", "Táyò"],
    correct: ["Adé", "ga", "ju", "Táyò", "lọ"],
    explanation: "Komparatif Yorùbá memakai pola mengapit 'ju … lọ': Adé ga (Ade tinggi) + ju Táyò lọ (melebihi Tayo) = Ade lebih tinggi daripada Tayo. Superlatif: 'jù lọ' tanpa pembanding (ga jù lọ = paling tinggi).",
  },
  {
    id: "q11", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung Yorùbá dengan artinya:",
    pairs: [
      { left: "ṣùgbọ́n", right: "tetapi" },
      { left: "nítorí pé", right: "karena" },
      { left: "àti", right: "dan" },
      { left: "tàbí", right: "atau" },
    ],
    explanation: "Empat konjungsi inti kalimat majemuk, mis. 'Mo fẹ́ wá ṣùgbọ́n kò sí àkókò' = saya ingin datang tetapi tidak ada waktu.",
  },
  {
    id: "q12", difficulty: "B1", type: "fillChoice",
    question: "Lengkapi: 'Mo lọ sí ọjà ___ ra oúnjẹ.' (Saya pergi ke pasar untuk membeli makanan.)",
    context: "Kata penanda tujuan 'untuk'.",
    options: ["láti", "sí", "ni", "pé"],
    correct: "láti",
    explanation: "'láti' + kata kerja = untuk/guna (menandai tujuan): láti ra = untuk membeli. 'sí' = ke (arah, sudah dipakai sebelum ọjà), 'ni' = adalah, 'pé' = bahwa (pengantar kalimat tak langsung).",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Nada mengubah makna: 'ọkọ̀' (nada rendah) = perahu/kendaraan, 'ọkọ́' (nada tinggi) = cangkul. Lalu 'ọkọ' (nada tengah, tanpa tanda) berarti:",
    options: ["suami", "pasar", "uang", "jalan"],
    correct: 0,
    explanation: "Trio klasik pelajaran nada Yorùbá: ọkọ (tengah) = suami, ọkọ́ (tinggi) = cangkul, ọkọ̀ (rendah) = perahu/kendaraan. Huruf-hurufnya sama persis — hanya nada yang membedakan, karena itu tanda nada wajib ditulis.",
  },
  {
    id: "q14", difficulty: "B2", type: "missing",
    question: "Lengkapi kalimat pengandaian tak nyata:",
    template: "Bí mo ___ ní owó púpọ̀, mo ___ ra ilé ńlá. (Seandainya saya punya banyak uang, saya akan membeli rumah besar.)",
    blanks: ["bá", "ìbá"],
    options: ["bá", "ìbá", "ti", "máa", "ń", "kò"],
    explanation: "Pengandaian tak nyata memakai pasangan 'Bí … bá …' (seandainya) di klausa syarat dan 'ìbá' (akan/niscaya — kontrafaktual) di klausa hasil. 'máa' = futur biasa (rencana nyata), 'ti' = sudah, 'ń' = sedang — tidak menyampaikan makna andai-andai.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa 'Ọwọ́ kan kò gbé ẹrù dé orí' paling dekat maknanya dengan:",
    options: [
      "Besar pasak daripada tiang",
      "Berat sama dipikul, ringan sama dijinjing",
      "Air beriak tanda tak dalam",
      "Nasi sudah menjadi bubur",
    ],
    correct: 1,
    explanation: "Harfiah: 'satu tangan tidak bisa mengangkat beban sampai ke atas kepala' (ọwọ́ kan = satu tangan, ẹrù = beban, orí = kepala) — pekerjaan berat butuh kerja sama, senapas dengan gotong royong 'berat sama dipikul, ringan sama dijinjing'.",
  },
];
