import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// BENGALI (BANGLA) PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// ─────────────────────────────────────────────────────────────────────────────
export const bengaliPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari 'ধন্যবাদ (dhonnobad)' adalah:",
    options: ["Halo / Salam", "Terima kasih", "Maaf", "Selamat tinggal"],
    correct: 1,
    explanation: "'ধন্যবাদ (dhonnobad)' = terima kasih. 'নমস্কার (nomoshkar)' = salam/halo, 'দুঃখিত (dukkhito)' = maaf, 'বিদায় (biday)' = selamat tinggal.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Bangla dengan artinya:",
    pairs: [
      { left: "এক (ek)", right: "1" },
      { left: "তিন (tin)", right: "3" },
      { left: "পাঁচ (pach)", right: "5" },
      { left: "দশ (dosh)", right: "10" },
    ],
    explanation: "Angka dasar এক (ek) sampai দশ (dosh) wajib dikuasai untuk harga dan tawar-menawar sehari-hari.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: '___ ছাত্র। (___ chhatro.)' (Saya seorang pelajar.)",
    context: "Pilih kata ganti yang tepat.",
    options: ["আমি (ami)", "তুমি (tumi)", "সে (she)", "আমরা (amra)"],
    correct: "আমি (ami)",
    explanation: "'আমি (ami)' = saya. Uniknya, kalimat identitas Bangla di masa kini TANPA kopula 'adalah': 'আমি ছাত্র' harfiah 'saya pelajar'. 'তুমি (tumi)' = kamu, 'সে (she)' = dia, 'আমরা (amra)' = kami/kita.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya makan nasi.",
    tokens: ["খাই (khai)", "আমি (ami)", "ভাত (bhat)"],
    correct: ["আমি (ami)", "ভাত (bhat)", "খাই (khai)"],
    explanation: "Bangla berpola SOV: Subjek আমি (ami) + Objek ভাত (bhat) + Kata kerja খাই (khai). Kata kerja selalu di AKHIR — beda dari bahasa Indonesia yang SVO.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Untuk menyatakan 'saya sudah makan nasi' (aksi selesai), kalimat yang tepat:",
    options: [
      "আমি ভাত খাই (ami bhat khai)",
      "আমি ভাত খেয়েছি (ami bhat kheyechhi)",
      "আমি ভাত খাব (ami bhat khabo)",
      "আমি ভাত খাচ্ছি (ami bhat khachchhi)",
    ],
    correct: 1,
    explanation: "'খেয়েছি (kheyechhi)' = bentuk perfek 'sudah makan'. 'খাই (khai)' = makan (kebiasaan), 'খাব (khabo)' = akan makan (futur), 'খাচ্ছি (khachchhi)' = sedang makan (progresif).",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan keterangan tempat:",
    translation: "Saya belajar bahasa Bangla di sekolah.",
    tokens: ["বাংলা (bangla)", "শিখি (shikhi)", "আমি (ami)", "স্কুলে (skule)"],
    correct: ["আমি (ami)", "স্কুলে (skule)", "বাংলা (bangla)", "শিখি (shikhi)"],
    explanation: "Pola SOV: keterangan tempat 'স্কুলে (skule)' = di sekolah (akhiran lokatif -এ) diletakkan sebelum objek, dan kata kerja 'শিখি (shikhi)' = belajar tetap di akhir.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan kata yang tepat:",
    template: "দোকান ___ ৭টায় ___। (dokan … shat-tay … — Toko buka pukul 7 pagi.)",
    blanks: ["সকাল (shokal)", "খোলে (khole)"],
    options: ["সকাল (shokal)", "রাত (rat)", "খোলে (khole)", "বন্ধ হয় (bondho hoy)", "যায় (jay)", "খায় (khay)"],
    explanation: "'সকাল (shokal)' = pagi, 'খোলে (khole)' = buka. Pengecoh: 'রাত (rat)' = malam, 'বন্ধ হয় (bondho hoy)' = tutup, 'যায় (jay)' = pergi, 'খায় (khay)' = makan.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'টেবিলের ___ বই আছে। (tebiler ___ boi achhe.)' (Ada buku di atas meja.)",
    context: "Kata penunjuk posisi (postposisi).",
    options: ["উপরে (upore)", "নিচে (niche)", "পাশে (pashe)", "ভিতরে (bhitore)"],
    correct: "উপরে (upore)",
    explanation: "'উপরে (upore)' = di atas, dipakai SETELAH kata benda bergenitif (টেবিলের = meja-nya) — kebalikan preposisi Indonesia. 'নিচে (niche)' = di bawah, 'পাশে (pashe)' = di samping, 'ভিতরে (bhitore)' = di dalam.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'বৃষ্টি হলেও আমি যাব। (brishti holeo ami jabo.)':",
    options: [
      "Karena hujan, saya akan pergi",
      "Meskipun hujan, saya akan tetap pergi",
      "Kalau hujan, saya tidak pergi",
      "Setelah hujan, saya akan pergi",
    ],
    correct: 1,
    explanation: "Akhiran '-লেও (-leo)' pada kata kerja = meskipun/walaupun. 'বৃষ্টি হলেও (brishti holeo)' = meskipun terjadi hujan. Bandingkan '-লে (-le)' saja = kalau.",
  },
  {
    id: "q10", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung Bangla dengan artinya:",
    pairs: [
      { left: "কারণ (karon)", right: "karena" },
      { left: "যদি (jodi)", right: "kalau" },
      { left: "কিন্তু (kintu)", right: "tetapi" },
      { left: "তাই (tai)", right: "oleh karena itu" },
    ],
    explanation: "Konjungsi sebab-akibat dan syarat ini fondasi kalimat kompleks level menengah: কারণ (sebab), যদি (syarat), কিন্তু (pertentangan), তাই (kesimpulan).",
  },
  {
    id: "q11", difficulty: "B1", type: "fillChoice",
    question: "Lengkapi: '___ সময় থাকে, আমি যাব। (___ shomoy thake, ami jabo.)' (Kalau ada waktu, saya akan pergi.)",
    context: "Kata pengandaian.",
    options: ["যদি (jodi)", "কারণ (karon)", "কিন্তু (kintu)", "যখন (jokhon)"],
    correct: "যদি (jodi)",
    explanation: "'যদি (jodi)' = kalau/jika, sering berpasangan dengan 'তাহলে (tahole)' = maka. 'কারণ (karon)' = karena, 'কিন্তু (kintu)' = tetapi, 'যখন (jokhon)' = ketika.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat dengan kata bandingan:",
    template: "আজ গতকালের ___ গরম। এটা সপ্তাহের ___ গরম দিন। (aj gotokaler … gorom. eta shoptaher … gorom din — Hari ini lebih panas dari kemarin. Ini hari terpanas minggu ini.)",
    blanks: ["চেয়ে (cheye)", "সবচেয়ে (shobcheye)"],
    options: ["চেয়ে (cheye)", "সবচেয়ে (shobcheye)", "মতো (moto)", "সমান (shoman)", "খুব (khub)", "অনেক (onek)"],
    explanation: "'X-এর চেয়ে (cheye)' = lebih … daripada X (komparatif), 'সবচেয়ে (shobcheye)' = paling (superlatif, harfiah 'daripada semua'). Pengecoh: 'মতো (moto)' = seperti, 'সমান (shoman)' = sama, 'খুব (khub)' = sangat.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat pasif 'চিঠিটা লেখা হয়েছে। (chithita lekha hoyechhe.)' berarti:",
    options: [
      "Dia sedang menulis surat",
      "Surat itu telah ditulis",
      "Surat itu akan ditulis",
      "Saya kehilangan surat itu",
    ],
    correct: 1,
    explanation: "Pasif Bangla dibentuk dengan kata benda verbal + হওয়া (howa = menjadi/terjadi): 'লেখা হয়েছে (lekha hoyechhe)' = telah ditulis. Akhiran '-টা (-ta)' = penentu 'itu/si'.",
  },
  {
    id: "q14", difficulty: "B2", type: "multiple",
    question: "Kalimat 'সে বাঙালির মতো বাংলা বলে। (she bangalir moto bangla bole.)' berarti:",
    options: [
      "Dia berbahasa Bangla seperti orang Bengali asli",
      "Dia berbahasa Bangla lebih baik dari orang Bengali",
      "Dia belajar bahasa Bangla dari orang Bengali",
      "Dia mengajar bahasa Bangla kepada orang Bengali",
    ],
    correct: 0,
    explanation: "'X-এর মতো (moto)' = seperti X (penyerupaan): 'বাঙালির মতো (bangalir moto)' = seperti orang Bengali. Bandingkan 'চেয়ে (cheye)' = lebih dari, 'থেকে (theke)' = dari (asal).",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa Bangla 'নাচতে না জানলে উঠান বাঁকা (nachte na janle uthan baka)' — 'tak bisa menari, halaman yang disalahkan bengkok' — paling dekat maknanya dengan:",
    options: [
      "Tong kosong nyaring bunyinya",
      "Buruk muka cermin dibelah",
      "Air beriak tanda tak dalam",
      "Sekali dayung dua pulau terlampaui",
    ],
    correct: 1,
    explanation: "Maknanya: menyalahkan hal lain atas kekurangan diri sendiri — persis 'Buruk muka cermin dibelah'. Pengecoh: tong kosong = banyak bicara tanpa isi, air beriak = orang dangkal, sekali dayung = efisiensi.",
  },
];
