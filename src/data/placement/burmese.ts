import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// BURMESE (MYANMAR) PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// ─────────────────────────────────────────────────────────────────────────────
export const burmesePlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Sapaan umum dalam bahasa Myanmar adalah:",
    options: [
      "သွားတော့မယ် (thwáh daw mè)",
      "မင်္ဂလာပါ (mingalaba)",
      "ကျေးဇူးတင်ပါတယ် (kyeizù tin ba de)",
      "တောင်းပန်ပါတယ် (taùn ban ba de)",
    ],
    correct: 1,
    explanation: "'မင်္ဂလာပါ' = salam/halo. 'ကျေးဇူးတင်ပါတယ်' = terima kasih, 'တောင်းပန်ပါတယ်' = maaf.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Myanmar dengan artinya:",
    pairs: [
      { left: "တစ် (tit)", right: "1" },
      { left: "သုံး (thoùn)", right: "3" },
      { left: "ငါး (ngà)", right: "5" },
      { left: "ဆယ် (se)", right: "10" },
    ],
    explanation: "Angka dasar တစ်~ဆယ် penting untuk harga dan transaksi.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'ကျွန်တော် ကျောင်းသား ___ ။' (Saya seorang murid — laki-laki.)",
    context: "Partikel penutup kalimat pernyataan.",
    options: ["ပါ", "လား", "နဲ့", "ကို"],
    correct: "ပါ",
    explanation: "'ပါ' = partikel sopan penutup pernyataan. 'လား' = penanda tanya, 'ကို' = penanda objek. 'ကျွန်တော်' = 'saya' (laki-laki).",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar (SOV):",
    translation: "Saya makan nasi.",
    tokens: ["ထမင်း", "ကျွန်တော်", "စားတယ်"],
    correct: ["ကျွန်တော်", "ထမင်း", "စားတယ်"],
    explanation: "Struktur SOV Myanmar: Subjek (ကျွန်တော်) + Objek (ထမင်း) + Kata kerja (စားတယ်). 'ထမင်းစား' = makan nasi.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Untuk menyatakan aksi lampau 'sudah makan', bentuk yang tepat:",
    options: [
      "စားတယ်",
      "စားပြီးပြီ",
      "စားမယ်",
      "စားနေတယ်",
    ],
    correct: 1,
    explanation: "'ပြီးပြီ' menandai aksi sudah selesai. 'မယ်' = akan (futur), 'နေတယ်' = sedang.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan keterangan tempat:",
    translation: "Saya belajar bahasa Myanmar di sekolah.",
    tokens: ["မြန်မာစာ", "ကျောင်းမှာ", "ကျွန်တော်", "သင်တယ်"],
    correct: ["ကျွန်တော်", "ကျောင်းမှာ", "မြန်မာစာ", "သင်တယ်"],
    explanation: "'မှာ' = di/pada (postposisi). Keterangan tempat (ကျောင်းမှာ) diletakkan sebelum objek dan kata kerja.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan partikel yang tepat:",
    template: "ဒီစာအုပ် ___ ကျွန်တော် ___ ဖတ်တယ်။ (Buku ini saya baca.)",
    blanks: ["ကို", "က"],
    options: ["ကို", "က", "မှာ", "နဲ့", "ပါ", "လား"],
    explanation: "'ကို' = penanda objek (ဒီစာအုပ်ကို = buku ini sbg objek). 'က' = penanda subjek/pelaku.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'မြန်မာစကား ပြော ___ လား?' (Apakah kamu bisa berbahasa Myanmar?)",
    context: "Modalitas 'bisa'.",
    options: ["တတ်", "ရ", "ချင်", "ဖူး"],
    correct: "တတ်",
    explanation: "'ပြောတတ်' = bisa/pandai berbicara (skill yang dipelajari). 'ချင်' = ingin, 'ဖူး' = pernah.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'မိုးရွာပေမဲ့ ကျွန်တော် သွားတယ်။' :",
    options: [
      "Karena hujan, saya pergi",
      "Meskipun hujan, saya tetap pergi",
      "Kalau hujan, saya pergi",
      "Setelah hujan, saya pergi",
    ],
    correct: 1,
    explanation: "'ပေမဲ့' = meskipun/tetapi. 'မိုးရွာပေမဲ့' = meskipun hujan turun.",
  },
  {
    id: "q10", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat berandai:",
    translation: "Kalau ada waktu, saya ingin pergi ke Myanmar.",
    tokens: ["မြန်မာကို", "အချိန်ရှိရင်", "သွားချင်တယ်", "ကျွန်တော်"],
    correct: ["အချိန်ရှိရင်", "ကျွန်တော်", "မြန်မာကို", "သွားချင်တယ်"],
    explanation: "'…ရင်' = kalau/jika. 'သွားချင်တယ်' = ingin pergi. Klausa syarat mendahului klausa utama.",
  },
  {
    id: "q11", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung dengan artinya:",
    pairs: [
      { left: "လို့", right: "karena" },
      { left: "…ရင်", right: "kalau / jika" },
      { left: "ဖို့", right: "supaya / untuk" },
      { left: "ဒါပေမဲ့", right: "tetapi" },
    ],
    explanation: "Kata penghubung ini adalah inti tata bahasa menengah.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat perbandingan:",
    template: "ဒီနေ့ မနေ့က ___ ပိုပူတယ်။ ဒါ ဒီအပတ်ရဲ့ ___ ပူတဲ့နေ့ပါ။ (Hari ini lebih panas dari kemarin. Ini hari terpanas minggu ini.)",
    blanks: ["ထက်", "အပူဆုံး"],
    options: ["ထက်", "အပူဆုံး", "လို", "တယ်", "မှာ", "နဲ့"],
    explanation: "'X ထက် ပို…' = lebih … dari X (komparatif). 'အ…ဆုံး' = paling … (superlatif).",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat 'ကျွန်တော့်ဖုန်း အခိုးခံရတယ်။' berarti:",
    options: [
      "Saya mencuri telepon",
      "Telepon saya dicuri / kecurian",
      "Saya menjual telepon",
      "Telepon saya rusak",
    ],
    correct: 1,
    explanation: "'…ခံရတယ်' menandai kalimat pasif (mengalami sesuatu). 'အခိုးခံရတယ်' = kena curi/dicuri.",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi: 'သူ မြန်မာစကား ဌာနေတိုင်းရင်းသား ___ ပြောတယ်။' (Dia berbahasa Myanmar seperti penutur asli.)",
    context: "Ungkapan perbandingan 'seperti'.",
    options: ["လို", "ထက်", "ဆုံး", "ရဲ့"],
    correct: "လို",
    explanation: "'…လို' = seperti. 'တိုင်းရင်းသားလို ပြောတယ်' = berbicara seperti penutur asli.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa 'ရွာမှီးတရာ လိုက်ရ' (menyesuaikan diri di kampung orang) paling dekat maknanya dengan:",
    options: [
      "Air tenang menghanyutkan",
      "Di mana bumi dipijak, di situ langit dijunjung",
      "Sedia payung sebelum hujan",
      "Besar pasak daripada tiang",
    ],
    correct: 1,
    explanation: "Peribahasa ini menekankan pentingnya mengikuti dan menghormati adat kebiasaan tempat yang kita datangi.",
  },
];
