import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// ARMENIAN PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// Fokus: Eastern Armenian (Armenia Timur, standar Republik Armenia)
// ─────────────────────────────────────────────────────────────────────────────
export const armenianPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari 'Բարև (barev)' adalah:",
    options: ["Selamat tinggal", "Halo", "Terima kasih", "Maaf"],
    correct: 1,
    explanation: "'Բարև (barev)' = halo. 'Ցտեսություն (tstesutyun)' = sampai jumpa, 'Շնորհակալություն (shnorhakalutyun)' = terima kasih, 'Ներողություն (neroghutyun)' = maaf.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Armenia dengan artinya:",
    pairs: [
      { left: "մեկ (mek)", right: "1" },
      { left: "երեք (yerek)", right: "3" },
      { left: "հինգ (hing)", right: "5" },
      { left: "տասը (tasə)", right: "10" },
    ],
    explanation: "Angka dasar mek~tasə penting untuk harga, jam, dan transaksi sehari-hari.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Ես ուսանող ___: (Yes usanogh ___.)' (Saya seorang mahasiswa.)",
    context: "Kopula 'adalah' menyesuaikan subjek.",
    options: ["եմ (em)", "ես (es)", "է (e)", "են (en)"],
    correct: "եմ (em)",
    explanation: "Kopula Armenia berubah per subjek: yes…em (saya), du…es (kamu), na…e (dia), nrank…en (mereka).",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar (objek sebelum verba):",
    translation: "Saya minum air.",
    tokens: ["եմ խմում (em khmum)", "Ես (yes)", "ջուր (jur)"],
    correct: ["Ես (yes)", "ջուր (jur)", "եմ խմում (em khmum)"],
    explanation: "Kala kini Armenia Timur: partisip -ում (-um) + kopula: 'եմ խմում (em khmum)' = saya minum. Objek (ջուր/jur = air) lazim diletakkan sebelum verba.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Kalimat mana yang bermakna lampau selesai 'Saya (sudah) menulis'?",
    options: [
      "Ես գրում եմ (yes grum em)",
      "Ես գրեցի (yes gretsi)",
      "Ես կգրեմ (yes kgrem)",
      "Ես գրում էի (yes grum ei)",
    ],
    correct: 1,
    explanation: "'Գրեցի (gretsi)' = lampau selesai (aorist). 'Գրում եմ (grum em)' = kala kini, 'կգրեմ (kgrem)' = akan menulis (awalan կ-/k- = futur), 'գրում էի (grum ei)' = dulu sedang/biasa menulis (imperfek).",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat lampau dengan keterangan waktu:",
    translation: "Kemarin saya pergi ke pasar.",
    tokens: ["գնացի (gnatsi)", "Երեկ (yerek)", "շուկա (shuka)", "ես (yes)"],
    correct: ["Երեկ (yerek)", "ես (yes)", "գնացի (gnatsi)", "շուկա (shuka)"],
    explanation: "'Երեկ (yerek)' = kemarin, 'գնացի (gnatsi)' = saya pergi (aorist dari գնալ/gnal). Tujuan gerak (շուկա/shuka = pasar) diletakkan setelah verba.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat kepemilikan dengan bentuk yang tepat:",
    template: "Ես գիրք ___, բայց ժամանակ ___: (Saya punya buku, tapi tidak punya waktu.)",
    blanks: ["ունեմ (unem)", "չունեմ (chunem)"],
    options: ["ունեմ (unem)", "չունեմ (chunem)", "ունես (unes)", "կա (ka)", "չկա (chka)", "եմ (em)"],
    explanation: "'Ունեմ (unem)' = saya punya; negasi dengan awalan չ- (ch-): 'չունեմ (chunem)' = tidak punya. Pengecoh: 'ունես (unes)' = kamu punya, 'կա (ka)' = ada, 'չկա (chka)' = tidak ada, 'եմ (em)' = kopula 'adalah'.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: '___ հայերեն խոսել: (___ hayeren khosel?)' (Apakah kamu bisa berbahasa Armenia?)",
    context: "Modalitas 'bisa'.",
    options: ["կարող ես (karogh es)", "պետք է (petk e)", "ուզում ես (uzum es)", "սիրում ես (sirum es)"],
    correct: "կարող ես (karogh es)",
    explanation: "'Կարող ես (karogh es)' = kamu bisa, diikuti infinitif 'խոսել (khosel)' = berbicara. 'Պետք է (petk e)' = harus/perlu, 'ուզում ես (uzum es)' = kamu ingin, 'սիրում ես (sirum es)' = kamu suka.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'Չնայած անձրև էր գալիս, ես դուրս եկա: (Chnayats andzrev er galis, yes durs yeka.)' :",
    options: [
      "Karena hujan, saya keluar",
      "Meskipun hujan, saya tetap keluar",
      "Kalau hujan, saya keluar",
      "Setelah hujan, saya keluar",
    ],
    correct: 1,
    explanation: "'Չնայած (chnayats)' = meskipun. Bandingkan: 'որովհետև (vorovhetev)' = karena, 'եթե (yete)' = kalau, 'հետո (heto)' = setelah/kemudian.",
  },
  {
    id: "q10", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung dengan artinya:",
    pairs: [
      { left: "որովհետև (vorovhetev)", right: "karena" },
      { left: "բայց (bayts)", right: "tetapi" },
      { left: "եթե (yete)", right: "jika / kalau" },
      { left: "որպեսզի (vorpeszi)", right: "supaya / agar" },
    ],
    explanation: "Konjungsi ini inti tata bahasa menengah — kunci merangkai kalimat kompleks dalam bahasa Armenia.",
  },
  {
    id: "q11", difficulty: "B1", type: "fillChoice",
    question: "Lengkapi: 'Երևանը Գյումրիից ___ է: (Yerevanə Gyumriits ___ e.)' (Yerevan lebih besar dari Gyumri.)",
    context: "Bentuk perbandingan.",
    options: ["ավելի մեծ (aveli mets)", "մեծ (mets)", "ամենամեծ (amenamets)", "շատ (shat)"],
    correct: "ավելի մեծ (aveli mets)",
    explanation: "Komparatif Armenia: 'ավելի (aveli)' = lebih + adjektiva; pembanding memakai kasus ablatif -ից (-its) = 'dari'. 'Մեծ (mets)' = besar (positif), 'ամենամեծ (amenamets)' = terbesar (superlatif), 'շատ (shat)' = sangat/banyak.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Kalimat pengandaian — lengkapi dengan bentuk yang tepat:",
    template: "Եթե ժամանակ ___, ես ___ ծով: (Kalau saya punya waktu, saya akan pergi ke laut.)",
    blanks: ["ունենամ (unenam)", "կգնամ (kgnam)"],
    options: ["ունենամ (unenam)", "կգնամ (kgnam)", "ունեմ (unem)", "գնացի (gnatsi)", "գնում եմ (gnum em)", "ունեի (unei)"],
    explanation: "Setelah 'եթե (yete)' untuk pengandaian dipakai subjunctive futur 'ունենամ (unenam)'; klausa hasil pakai kondisional/futur berawalan կ- (k-): 'կգնամ (kgnam)' = saya akan pergi. Pengecoh: 'ունեմ (unem)' = punya (indikatif kini), 'գնացի (gnatsi)' = pergi (lampau), 'ունեի (unei)' = punya (lampau).",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat pasif 'Նամակը գրվել է երեկ: (Namakə grvel e yerek.)' berarti:",
    options: [
      "Saya menulis surat kemarin",
      "Surat itu ditulis kemarin",
      "Surat itu akan ditulis besok",
      "Dia sedang menulis surat",
    ],
    correct: 1,
    explanation: "Sufiks -վ- (-v-) membentuk pasif: գրել (grel = menulis) → գրվել (grvel = ditulis). Artikel takrif -ը (-ə) pada 'նամակը (namakə)' = surat ITU.",
  },
  {
    id: "q14", difficulty: "B2", type: "matching",
    prompt: "Jodohkan idiom Armenia dengan maknanya:",
    pairs: [
      { left: "աչքիս վրա (achkis vra)", right: "dengan senang hati" },
      { left: "ցավդ տանեմ (tsavd tanem)", right: "ungkapan sayang khas Armenia" },
      { left: "աչքի ընկնել (achki ənknel)", right: "menonjol / menarik perhatian" },
      { left: "ձեռքից ամեն ինչ գալիս է (dzerkits amen inch galis e)", right: "orang yang serba bisa" },
    ],
    explanation: "Harfiahnya unik: 'achkis vra' = 'di atas mataku' = siap dengan senang hati; 'tsavd tanem' = 'biar kutanggung deritamu' — panggilan sayang; 'achki ənknel' = 'jatuh ke mata'; 'dzerkits amen inch galis e' = 'segalanya datang dari tangannya'.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa 'Քարը իր տեղում ծանր է: (Karə ir teghum tsanr e.)' paling dekat maknanya dengan:",
    options: [
      "Hujan emas di negeri orang, hujan batu di negeri sendiri — baik jua di negeri sendiri",
      "Tong kosong nyaring bunyinya",
      "Sekali dayung dua pulau terlampaui",
      "Air beriak tanda tak dalam",
    ],
    correct: 0,
    explanation: "Harfiah: 'batu itu berat di tempatnya sendiri' — seseorang paling bernilai dan dihormati di lingkungannya sendiri. Pengecoh: banyak bicara tanpa isi, dua hasil sekali usaha, orang dangkal yang ribut.",
  },
];
