import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// FILIPINO (TAGALOG) PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// ─────────────────────────────────────────────────────────────────────────────
export const filipinoPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari 'Salamat' adalah:",
    options: ["Selamat tinggal", "Terima kasih", "Halo", "Maaf"],
    correct: 1,
    explanation: "'Salamat' = terima kasih. 'Kumusta' = halo/apa kabar, 'Paalam' = selamat tinggal.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Filipino dengan artinya:",
    pairs: [
      { left: "isa", right: "1" },
      { left: "tatlo", right: "3" },
      { left: "lima", right: "5" },
      { left: "sampu", right: "10" },
    ],
    explanation: "Angka dasar isa~sampu penting untuk harga dan transaksi sehari-hari.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Ako ___ estudyante.' (Saya seorang murid.)",
    context: "Penanda 'ay' / struktur identitas.",
    options: ["ay", "sa", "ng", "na"],
    correct: "ay",
    explanation: "'ay' menghubungkan subjek dengan predikat dalam susunan Subjek-ay-Predikat. Susunan umum lain: 'Estudyante ako.'",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar (VSO):",
    translation: "Saya makan nasi.",
    tokens: ["kanin", "Kumakain", "ako", "ng"],
    correct: ["Kumakain", "ako", "ng", "kanin"],
    explanation: "Tagalog cenderung VSO: Kata kerja (Kumakain) + Subjek (ako) + objek dengan penanda 'ng' (ng kanin).",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Bentuk lampau (past) dari 'kumakain' (sedang makan) adalah:",
    options: ["kumakain", "kumain", "kakain", "kain"],
    correct: 1,
    explanation: "Aspek Tagalog: 'kumain' = sudah makan (lampau/perfektif), 'kumakain' = sedang makan, 'kakain' = akan makan.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan keterangan tempat:",
    translation: "Saya belajar bahasa Filipino di sekolah.",
    tokens: ["Filipino", "sa paaralan", "Nag-aaral", "ako", "ng"],
    correct: ["Nag-aaral", "ako", "ng", "Filipino", "sa paaralan"],
    explanation: "'sa' menandai lokasi (sa paaralan = di sekolah), 'ng' menandai objek.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan penanda yang tepat:",
    template: "Ang libro ___ bata ay nasa ___ mesa. (Buku milik anak itu ada di atas meja.)",
    blanks: ["ng", "ibabaw ng"],
    options: ["ng", "ibabaw ng", "sa", "ang", "si", "na"],
    explanation: "'ng' menandai kepemilikan (libro ng bata = buku milik anak). 'nasa ibabaw ng' = ada di atas.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: '___ ka bang magsalita ng Filipino?' (Bisakah kamu berbahasa Filipino?)",
    context: "Modalitas 'bisa'.",
    options: ["Kaya", "Dapat", "Gusto", "Puwede"],
    correct: "Kaya",
    explanation: "'Kaya' = mampu/bisa (kemampuan). 'Dapat' = harus, 'Gusto' = ingin, 'Puwede' = boleh.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'Kahit umuulan, pupunta pa rin ako.' :",
    options: [
      "Karena hujan, saya pergi",
      "Meskipun hujan, saya tetap pergi",
      "Kalau hujan, saya pergi",
      "Setelah hujan, saya pergi",
    ],
    correct: 1,
    explanation: "'Kahit' = meskipun. 'pa rin' = tetap/masih. 'Kahit umuulan' = meskipun sedang hujan.",
  },
  {
    id: "q10", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat berandai:",
    translation: "Kalau ada waktu, gusto kong pumunta sa Pilipinas.",
    tokens: ["sa Pilipinas", "may oras", "Kung", "gusto kong pumunta"],
    correct: ["Kung", "may oras", "gusto kong pumunta", "sa Pilipinas"],
    explanation: "'Kung …' = kalau …. 'gusto kong pumunta' = saya ingin pergi. Klausa syarat mendahului klausa utama.",
  },
  {
    id: "q11", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung dengan artinya:",
    pairs: [
      { left: "dahil", right: "karena" },
      { left: "kung", right: "kalau / jika" },
      { left: "para", right: "supaya / untuk" },
      { left: "pero", right: "tetapi" },
    ],
    explanation: "Kata penghubung ini adalah inti tata bahasa menengah.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat perbandingan:",
    template: "Mas mainit ngayon ___ kahapon. Ito ang ___ mainit na araw ngayong linggo. (Hari ini lebih panas dari kemarin. Ini hari terpanas minggu ini.)",
    blanks: ["kaysa", "pinaka"],
    options: ["kaysa", "pinaka", "gaya", "tulad", "napaka", "masyado"],
    explanation: "'mas … kaysa' = lebih … daripada (komparatif). 'pinaka-' = paling (superlatif).",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat 'Ninakaw ang telepono ko.' berarti:",
    options: [
      "Saya mencuri telepon",
      "Telepon saya dicuri",
      "Saya menjual telepon",
      "Telepon saya hilang sendiri",
    ],
    correct: 1,
    explanation: "'Ninakaw' = dicuri (fokus objek, aspek perfektif dari 'nakawin'). Fokus verba pada objek 'ang telepono ko'.",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi: 'Nagsasalita siya ng Filipino na para ___ katutubo.' (Dia berbahasa Filipino seolah penutur asli.)",
    context: "Ungkapan perbandingan 'seolah/seperti'.",
    options: ["ng", "sa", "kaysa", "tungkol"],
    correct: "ng",
    explanation: "'para ng' / 'parang' = seperti/seolah. 'para ng katutubo' = seperti penutur asli.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa 'Kapag may tiyaga, may nilaga.' paling dekat maknanya dengan:",
    options: [
      "Sedikit demi sedikit lama-lama menjadi bukit",
      "Berakit-rakit ke hulu, berenang-renang ke tepian (bersakit dahulu, bersenang kemudian)",
      "Air beriak tanda tak dalam",
      "Besar pasak daripada tiang",
    ],
    correct: 1,
    explanation: "'Kapag may tiyaga, may nilaga' (kalau ada ketekunan, ada hasil masakannya) = usaha keras berbuah hasil.",
  },
];
