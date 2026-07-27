import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// SWAHILI PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// ─────────────────────────────────────────────────────────────────────────────
export const swahiliPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Sapaan 'Habari gani?' artinya:",
    options: ["Apa kabar?", "Siapa namamu?", "Dari mana asalmu?", "Mau ke mana?"],
    correct: 0,
    explanation: "'Habari' = kabar/berita, 'gani' = apa/yang mana — jadi 'Habari gani?' = apa kabar? Jawaban umumnya 'Nzuri' (baik). 'Jina lako nani?' = siapa namamu, 'Unatoka wapi?' = dari mana asalmu.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Swahili dengan artinya:",
    pairs: [
      { left: "moja", right: "1" },
      { left: "tatu", right: "3" },
      { left: "tano", right: "5" },
      { left: "kumi", right: "10" },
    ],
    explanation: "Angka dasar moja~kumi penting untuk harga dan tawar-menawar di pasar. Angka 11 ke atas dibentuk dari kumi + na + satuan (mis. kumi na moja = 11).",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Mimi ___ mwanafunzi.' (Saya seorang pelajar.)",
    context: "Kata kerja 'adalah'.",
    options: ["ni", "si", "na", "wa"],
    correct: "ni",
    explanation: "'ni' = adalah (kopula), menghubungkan subjek dengan kata benda. 'si' = bukan (bentuk negatifnya: 'Mimi si mwanafunzi' = saya bukan pelajar), 'na' = dan/dengan.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya belajar bahasa Swahili di sekolah.",
    tokens: ["Kiswahili", "Mimi", "shuleni", "ninasoma"],
    correct: ["Mimi", "ninasoma", "Kiswahili", "shuleni"],
    explanation: "Struktur SVO: Subjek (Mimi) + Kata kerja (ninasoma = saya belajar/membaca) + Objek (Kiswahili) + keterangan tempat (shuleni = di sekolah, dari 'shule' + akhiran lokatif -ni).",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Untuk menyatakan aksi lampau 'Saya (sudah) makan nasi', kalimat yang tepat:",
    options: [
      "Ninakula wali",
      "Nilikula wali",
      "Nitakula wali",
      "Ninapenda wali",
    ],
    correct: 1,
    explanation: "Penanda waktu disisipkan di tengah kata kerja: -li- = lampau (NI-LI-kula = saya sudah makan), -na- = sekarang (ninakula = saya sedang makan), -ta- = akan (nitakula = saya akan makan). 'Ninapenda' = saya suka.",
  },
  {
    id: "q6", difficulty: "A2", type: "multiple",
    question: "Bentuk jamak dari 'kitabu' (buku) adalah:",
    options: ["makitabu", "vitabu", "kitabuni", "watabu"],
    correct: 1,
    explanation: "'Kitabu' termasuk kelas kata benda ki-/vi-: awalan ki- (tunggal) berubah jadi vi- (jamak) → vitabu. Kelas lain punya pola sendiri, mis. m-/wa- untuk manusia (mtu → watu). 'kitabuni' = di dalam buku (lokatif).",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan bentuk kata kerja yang tepat:",
    template: "Kila asubuhi mimi ___ chai. Jana mimi ___ kahawa. (Setiap pagi saya minum teh. Kemarin saya minum kopi.)",
    blanks: ["ninakunywa", "nilikunywa"],
    options: ["ninakunywa", "nilikunywa", "nitakunywa", "ninakula", "anakunywa", "kunywa"],
    explanation: "'Kila asubuhi' (setiap pagi) → penanda kini -na- (ninakunywa). 'Jana' (kemarin) → penanda lampau -li- (nilikunywa). 'nitakunywa' = akan minum, 'anakunywa' = dia minum, 'ninakula' = saya makan.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'Je, unaweza ___ Kiswahili?' (Apakah kamu bisa berbicara bahasa Swahili?)",
    context: "Bentuk kata kerja setelah 'unaweza' (kamu bisa).",
    options: ["kusema", "sema", "anasema", "kusoma"],
    correct: "kusema",
    explanation: "Setelah kata kerja bantu seperti -weza (bisa), kata kerja berikutnya memakai bentuk infinitif dengan awalan ku-: kusema = berbicara. 'sema' = bentuk perintah, 'anasema' = dia berbicara, 'kusoma' = membaca/belajar.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'Ingawa mvua inanyesha, nitaenda shuleni.' :",
    options: [
      "Karena hujan, saya pergi ke sekolah",
      "Meskipun hujan turun, saya akan tetap pergi ke sekolah",
      "Kalau hujan, saya tidak pergi ke sekolah",
      "Setelah hujan, saya pergi ke sekolah",
    ],
    correct: 1,
    explanation: "'Ingawa' = meskipun. 'Mvua inanyesha' = hujan sedang turun, 'nitaenda' = saya akan pergi (-ta- futur). Bandingkan 'kwa sababu' = karena, 'kama' = kalau, 'baada ya' = setelah.",
  },
  {
    id: "q10", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat pengandaian:",
    translation: "Kalau saya punya uang, saya akan membeli buku.",
    tokens: ["nitanunua", "Kama", "kitabu", "nina pesa"],
    correct: ["Kama", "nina pesa", "nitanunua", "kitabu"],
    explanation: "'Kama' = kalau (membuka klausa syarat). 'nina pesa' = saya punya uang, 'nitanunua' = saya akan membeli (-ta- futur). Klausa syarat lazim mendahului klausa utama.",
  },
  {
    id: "q11", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung Swahili dengan artinya:",
    pairs: [
      { left: "lakini", right: "tetapi" },
      { left: "kwa sababu", right: "karena" },
      { left: "ili", right: "supaya / agar" },
      { left: "au", right: "atau" },
    ],
    explanation: "Konjungsi ini kunci untuk merangkai kalimat majemuk level menengah, mis. 'Ninasoma ili nifaulu' = saya belajar supaya lulus.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat perbandingan:",
    template: "Mlima Kilimanjaro ni mrefu ___ Mlima Kenya. Kilimanjaro ni mlima mrefu ___ barani Afrika. (Gunung Kilimanjaro lebih tinggi dari Gunung Kenya. Kilimanjaro adalah gunung tertinggi di benua Afrika.)",
    blanks: ["kuliko", "zaidi"],
    options: ["kuliko", "zaidi", "kama", "sana", "na", "bila"],
    explanation: "'kuliko' = daripada (komparatif: mrefu kuliko = lebih tinggi daripada). 'zaidi' = paling/lebih (mrefu zaidi = tertinggi). 'kama' = seperti/kalau, 'sana' = sangat, 'bila' = tanpa.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat pasif 'Chakula kilipikwa na mama.' berarti:",
    options: [
      "Ibu sedang memasak makanan",
      "Makanan itu dimasak oleh ibu",
      "Ibu akan memasak makanan",
      "Makanan itu dimakan ibu",
    ],
    correct: 1,
    explanation: "Sisipan -w- sebelum vokal akhir membentuk pasif: kupika (memasak) → kupikwa (dimasak). 'kilipikwa' = ki- (penanda kelas 'chakula') + -li- (lampau) + pik-w-a (dimasak); 'na' menandai pelaku (oleh).",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi: 'Anazungumza Kiswahili ___ mzaliwa wa Tanzania.' (Dia berbahasa Swahili seperti orang asli Tanzania.)",
    context: "Ungkapan perbandingan 'seperti/seolah'.",
    options: ["kama", "kuliko", "kwa", "hadi"],
    correct: "kama",
    explanation: "'kama' di sini = seperti/seolah (bukan 'kalau'). 'kuliko' = daripada, 'kwa' = dengan/untuk, 'hadi' = sampai/hingga. Konteks menentukan makna 'kama'.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa 'Haraka haraka haina baraka' paling dekat maknanya dengan:",
    options: [
      "Sekali dayung dua tiga pulau terlampaui",
      "Biar lambat asal selamat",
      "Tong kosong nyaring bunyinya",
      "Air beriak tanda tak dalam",
    ],
    correct: 1,
    explanation: "Harfiah: 'terburu-buru tidak membawa berkah' ('haraka' = cepat/buru-buru, 'haina' = tidak punya, 'baraka' = berkah) — nasihat untuk tidak tergesa-gesa, persis 'biar lambat asal selamat'. Pasangannya: 'Pole pole ndio mwendo' (pelan-pelan itulah jalannya).",
  },
];
