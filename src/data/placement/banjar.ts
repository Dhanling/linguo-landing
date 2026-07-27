import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// BANJAR (BAHASA BANJAR KALSEL) PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// ─────────────────────────────────────────────────────────────────────────────
export const banjarPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari 'Apa habar?' adalah:",
    options: ["Siapa namamu?", "Apa kabar?", "Mau ke mana?", "Sudah makan?"],
    correct: 1,
    explanation: "'habar' = kabar. Jawaban umumnya 'Baik-baik haja' ('haja' = saja). Banjar dekat dengan Melayu, tapi banyak kosakata khasnya.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata Banjar dengan artinya:",
    pairs: [
      { left: "banyu", right: "air" },
      { left: "guring", right: "tidur" },
      { left: "bulik", right: "pulang" },
      { left: "ganal", right: "besar" },
    ],
    explanation: "Kosakata harian paling khas Banjar. Lawan 'ganal' adalah 'halus' — yang di Banjar berarti KECIL, bukan lembut!",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Ulun ___ ka pasar.' (Saya pergi ke pasar.)",
    context: "Kata kerja 'pergi/berangkat'.",
    options: ["tulak", "bulik", "guring", "bagawi"],
    correct: "tulak",
    explanation: "'tulak' = pergi/berangkat, 'ulun' = saya (halus). Pengecoh: 'bulik' = pulang, 'guring' = tidur, 'bagawi' = bekerja.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Dia tidur di rumah.",
    tokens: ["di rumah", "Inya", "guring"],
    correct: ["Inya", "guring", "di rumah"],
    explanation: "Struktur SVO: 'inya' = dia, 'guring' = tidur. Keterangan tempat di akhir kalimat.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Untuk menyatakan 'saya MAU makan', kalimat yang tepat:",
    options: [
      "Ulun sudah makan",
      "Ulun handak makan",
      "Ulun lagi makan",
      "Ulun kada makan",
    ],
    correct: 1,
    explanation: "'handak' = mau/akan (penanda niat/futur khas Banjar). Pengecoh: 'lagi' = sedang, 'kada' = tidak.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan keterangan waktu:",
    translation: "Kemarin saya pulang ke Banjarmasin.",
    tokens: ["bulik", "Samalam", "ka Banjarmasin", "ulun"],
    correct: ["Samalam", "ulun", "bulik", "ka Banjarmasin"],
    explanation: "'samalam' = KEMARIN (bukan 'tadi malam' seperti di bahasa Indonesia!), 'bulik' = pulang. Keterangan waktu bisa di depan kalimat.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan kata yang tepat:",
    template: "Wadai ini ___ banar, ulun handak ___ pulang. (Kue ini enak sekali, saya mau membeli lagi.)",
    blanks: ["nyaman", "manukar"],
    options: ["nyaman", "lawas", "manukar", "manjual", "guring", "uyuh"],
    explanation: "'nyaman' = ENAK (bukan 'nyaman' Indonesia), 'manukar' = MEMBELI (bukan menukar!), 'banar' = sangat, 'pulang' di sini = lagi. Pengecoh: 'lawas' = lama, 'uyuh' = capek.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'Pian ___ bapandir bahasa Banjar-lah?' (Anda bisa berbicara bahasa Banjar, kan?)",
    context: "Kata untuk 'bisa/dapat'.",
    options: ["kawa", "handak", "wani", "sudah"],
    correct: "kawa",
    explanation: "'kawa' = bisa/dapat, 'bapandir' = berbicara/mengobrol, 'pian' = Anda (halus). Pengecoh: 'handak' = mau, 'wani' = berani.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'Amun hujan, ulun kada tulak.' :",
    options: [
      "Karena hujan, saya tidak pergi",
      "Kalau hujan, saya tidak pergi",
      "Meskipun hujan, saya tetap pergi",
      "Setelah hujan, saya pergi",
    ],
    correct: 1,
    explanation: "'amun' = kalau/jika (konjungsi syarat khas Banjar), 'kada' = tidak. Bandingkan: 'imbah' = setelah, 'biar' = meskipun.",
  },
  {
    id: "q10", difficulty: "B1", type: "multiple",
    question: "Arti 'Rumah sidin halus banar.' :",
    options: [
      "Rumah beliau halus sekali",
      "Rumah beliau kecil sekali",
      "Rumah beliau bagus sekali",
      "Rumah beliau besar sekali",
    ],
    correct: 1,
    explanation: "Jebakan makna: 'halus' di Banjar = KECIL (lawan 'ganal' = besar). 'sidin' = beliau, 'banar' = sangat.",
  },
  {
    id: "q11", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata ganti Banjar dengan artinya (perhatikan tingkat kesopanan):",
    pairs: [
      { left: "pian", right: "Anda (halus)" },
      { left: "ikam", right: "kamu (akrab)" },
      { left: "sidin", right: "beliau" },
      { left: "buhannya", right: "mereka" },
    ],
    explanation: "Banjar punya tingkat tutur pada kata ganti: ulun/pian/sidin (halus) vs aku/ikam/inya (akrab). Salah pilih bisa terkesan tidak sopan.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi dengan partikel dan keterangan waktu yang tepat:",
    template: "Tulak ___ ikam badahulu, ulun manyusul ___. (Pergilah kamu duluan, saya menyusul nanti.)",
    blanks: ["pang", "kaina"],
    options: ["pang", "kah", "kaina", "samalam", "haja", "jua"],
    explanation: "'pang' = partikel penghalus perintah/permintaan, 'kaina' = nanti. Pengecoh: 'kah' = partikel tanya, 'samalam' = kemarin, 'haja' = saja, 'jua' = juga.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Arti 'Imbah bagawi, sidin bulik ka rumah mambawa iwak wan gangan.' :",
    options: [
      "Sebelum bekerja, beliau pergi membeli ikan dan sayur",
      "Setelah bekerja, beliau pulang ke rumah membawa ikan dan sayur",
      "Ketika bekerja, beliau makan ikan dan sayur di rumah",
      "Setelah bekerja, dia menjual ikan dan sayur di rumah",
    ],
    correct: 1,
    explanation: "'imbah' = setelah, 'bagawi' = bekerja, 'bulik' = pulang, 'iwak' = ikan/lauk, 'wan' = dan/dengan, 'gangan' = sayur (berkuah).",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi: 'Inya bapandir bahasa Banjar ___ urang Banjar asli.' (Dia berbicara bahasa Banjar seperti orang Banjar asli.)",
    context: "Kata perbandingan 'seperti'.",
    options: ["kaya", "lawan", "gasan", "imbah"],
    correct: "kaya",
    explanation: "'kaya' di Banjar = SEPERTI (bukan 'kaya raya'!). Pengecoh: 'lawan' = dengan/dan, 'gasan' = untuk, 'imbah' = setelah.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Semboyan Banjar 'Haram manyarah, waja sampai kaputing' paling dekat maknanya dengan:",
    options: [
      "Berjuang pantang menyerah, konsisten sampai akhir",
      "Besi harus ditempa selagi panas",
      "Bekerja harus dengan alat yang baik",
      "Perjalanan jauh dimulai dari satu langkah",
    ],
    correct: 0,
    explanation: "Semboyan Pangeran Antasari: 'haram manyarah' = pantang menyerah, 'waja sampai kaputing' = (seperti) baja sampai ke ujungnya — teguh dan tuntas sampai titik penghabisan.",
  },
];
