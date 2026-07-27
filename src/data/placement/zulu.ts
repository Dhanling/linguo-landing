import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// ZULU PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// ─────────────────────────────────────────────────────────────────────────────
export const zuluPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari sapaan 'Sawubona' adalah:",
    options: ["Selamat tinggal", "Halo (kepada satu orang)", "Terima kasih", "Maaf"],
    correct: 1,
    explanation: "'Sawubona' (harfiah: 'kami melihatmu') = halo untuk SATU orang; kepada banyak orang dipakai 'Sanibonani'. 'Hamba kahle' = selamat jalan, 'Ngiyabonga' = terima kasih, 'Uxolo' = maaf.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dasar isiZulu dengan artinya:",
    pairs: [
      { left: "Yebo", right: "Ya" },
      { left: "Cha", right: "Tidak" },
      { left: "Ngiyabonga", right: "Terima kasih" },
      { left: "Hamba kahle", right: "Selamat jalan" },
    ],
    explanation: "Perhatikan 'Cha' (tidak): huruf c di isiZulu adalah konsonan KLIK dental — bunyi 'decak' seperti 'cek-cek' dengan ujung lidah di belakang gigi, ciri khas rumpun bahasa Nguni.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Igama ___ nguSipho.' (Nama saya Sipho.)",
    context: "Kata ganti kepunyaan 'saya'.",
    options: ["lami", "lakho", "lakhe", "lethu"],
    correct: "lami",
    explanation: "'Igama lami' = nama saya. Kepunyaan menyesuaikan kelas kata benda: lami = -ku (saya), lakho = -mu (kamu), lakhe = -nya (dia), lethu = kami/kita.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya belajar bahasa Zulu.",
    tokens: ["isiZulu", "Mina", "ngifunda"],
    correct: ["Mina", "ngifunda", "isiZulu"],
    explanation: "Struktur SVO: Mina (saya) + ngifunda (ngi- = penanda subjek 'saya' + -funda = belajar) + isiZulu. Awalan subjek ngi- wajib menempel di kata kerja walau 'Mina' sudah disebut.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Untuk menyatakan 'Saya AKAN makan', bentuk yang tepat:",
    options: ["Ngiyadla", "Ngidlile", "Ngizodla", "Ukudla"],
    correct: 2,
    explanation: "Sisipan -zo- menandai masa depan: ngi-ZO-dla = saya akan makan. 'Ngiyadla' = saya (sedang) makan, 'Ngidlile' = saya sudah makan (akhiran -ile = lampau), 'ukudla' = makan (infinitif) / makanan.",
  },
  {
    id: "q6", difficulty: "A2", type: "matching",
    prompt: "Jodohkan bentuk tunggal dengan bentuk jamaknya:",
    pairs: [
      { left: "umfundi (murid)", right: "abafundi" },
      { left: "incwadi (buku)", right: "izincwadi" },
      { left: "isikole (sekolah)", right: "izikole" },
      { left: "umuntu (orang)", right: "abantu" },
    ],
    explanation: "Kelas kata benda isiZulu berpasangan: um-/aba- untuk manusia (umuntu → abantu), in-/izin- (incwadi → izincwadi), isi-/izi- (isikole → izikole). Ngomong-ngomong, c pada 'incwadi' juga konsonan klik dental.",
  },
  {
    id: "q7", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'Ngiya ___.' (Saya pergi ke sekolah.)",
    context: "Bentuk lokatif dari 'isikole' (sekolah).",
    options: ["esikoleni", "isikole", "izikole", "sikole"],
    correct: "esikoleni",
    explanation: "Lokatif (di/ke suatu tempat) dibentuk dengan pola e-...-ini: isikole → ESIKOLENI = di/ke sekolah. 'isikole' bentuk dasar (sekolah), 'izikole' jamak (sekolah-sekolah).",
  },
  {
    id: "q8", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan bentuk kata kerja yang tepat:",
    template: "Izolo ___ incwadi. Kusasa ___ incwadi entsha. (Kemarin saya membaca buku. Besok saya akan membaca buku baru.)",
    blanks: ["ngifundile", "ngizofunda"],
    options: ["ngifundile", "ngizofunda", "ngiyafunda", "ngifuna", "sifunda", "ufundile"],
    explanation: "'Izolo' (kemarin) → lampau berakhiran -ile (ngifundile). 'Kusasa' (besok) → futur bersisipan -zo- (ngizofunda). 'ngiyafunda' = sedang membaca, 'ngifuna' = saya mau, 'ufundile' = KAMU sudah membaca (u- = kamu).",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'Uma lina, ngizohlala ekhaya.' :",
    options: [
      "Karena hujan, saya tinggal di rumah",
      "Kalau hujan, saya akan tinggal di rumah",
      "Meskipun hujan, saya keluar rumah",
      "Setelah hujan, saya pulang ke rumah",
    ],
    correct: 1,
    explanation: "'Uma' = kalau/jika (membuka klausa syarat), 'lina' = hujan turun, 'ngizohlala' = saya akan tinggal (-zo- futur), 'ekhaya' = di rumah. 'Ngoba' = karena, 'noma' = meskipun/atau.",
  },
  {
    id: "q10", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat dengan kata penghubung:",
    translation: "Saya bekerja, tetapi saya lelah.",
    tokens: ["ngikhathele", "Ngiyasebenza", "kodwa"],
    correct: ["Ngiyasebenza", "kodwa", "ngikhathele"],
    explanation: "'kodwa' = tetapi, menghubungkan dua klausa. 'Ngiyasebenza' = saya bekerja, 'ngikhathele' = saya lelah (bentuk statif -ile yang bermakna keadaan sekarang).",
  },
  {
    id: "q11", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung isiZulu dengan artinya:",
    pairs: [
      { left: "kodwa", right: "tetapi" },
      { left: "ngoba", right: "karena" },
      { left: "uma", right: "kalau / jika" },
      { left: "futhi", right: "dan / juga" },
    ],
    explanation: "Empat konjungsi inti kalimat majemuk level menengah, mis. 'Ngifunda isiZulu ngoba ngithanda iNingizimu Afrika' = saya belajar isiZulu karena saya suka Afrika Selatan.",
  },
  {
    id: "q12", difficulty: "B1", type: "multiple",
    question: "Arti 'UThemba mude kunoSipho.' :",
    options: [
      "Themba setinggi Sipho",
      "Themba lebih tinggi daripada Sipho",
      "Sipho lebih tinggi daripada Themba",
      "Themba dan Sipho sama-sama pendek",
    ],
    correct: 1,
    explanation: "Perbandingan memakai kuna-: mude (tinggi) + kunoSipho (daripada Sipho; kuna- + uSipho melebur jadi kuno-) = lebih tinggi daripada Sipho. Tidak ada perubahan bentuk pada kata sifatnya sendiri.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi kalimat pasif: 'Incwadi ___ nguthisha.' (Buku itu dibaca oleh guru.)",
    context: "Bentuk pasif dari -funda (membaca).",
    options: ["ifundwa", "ifunda", "yafunda", "ukufunda"],
    correct: "ifundwa",
    explanation: "Sisipan -w- membentuk pasif: -funda (membaca) → -fundwa (dibaca); i- menyesuaikan kelas 'incwadi', pelaku ditandai ngu- (nguthisha = oleh guru). 'ifunda' = aktif, 'ukufunda' = infinitif.",
  },
  {
    id: "q14", difficulty: "B2", type: "missing",
    question: "Lengkapi kalimat dengan bentuk yang tepat:",
    template: "Angikwazi ___ isiZulu kahle, ___ ngiyazama nsuku zonke. (Saya belum bisa berbicara isiZulu dengan baik, tetapi saya berusaha setiap hari.)",
    blanks: ["ukukhuluma", "kodwa"],
    options: ["ukukhuluma", "ngikhuluma", "kodwa", "ngoba", "futhi", "uma"],
    explanation: "Setelah -kwazi (bisa/mampu) kata kerja memakai infinitif uku-: ukukhuluma = berbicara. 'kodwa' = tetapi (kontras). 'ngikhuluma' = saya berbicara (bukan infinitif), 'ngoba' = karena, 'uma' = kalau.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa 'Izandla ziyagezana' paling dekat maknanya dengan:",
    options: [
      "Tong kosong nyaring bunyinya",
      "Berat sama dipikul, ringan sama dijinjing",
      "Air beriak tanda tak dalam",
      "Besar pasak daripada tiang",
    ],
    correct: 1,
    explanation: "Harfiah: 'tangan-tangan saling membasuh' (izandla = tangan-tangan, ziyagezana = saling mencuci; akhiran -ana = saling) — tolong-menolong itu timbal balik, senapas dengan gotong royong. Nilai ini terkait falsafah ubuntu: 'umuntu ngumuntu ngabantu' (manusia menjadi manusia lewat sesamanya).",
  },
];
