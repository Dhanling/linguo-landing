import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// TAMIL PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// ─────────────────────────────────────────────────────────────────────────────
export const tamilPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari 'வணக்கம் (vanakkam)' adalah:",
    options: ["Selamat tinggal", "Halo / Salam", "Terima kasih", "Maaf"],
    correct: 1,
    explanation: "'வணக்கம் (vanakkam)' = salam/halo, sapaan universal Tamil (pagi-siang-malam). 'நன்றி (nandri)' = terima kasih, 'மன்னிக்கவும் (mannikkavum)' = maaf.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Tamil dengan artinya:",
    pairs: [
      { left: "ஒன்று (ondru)", right: "1" },
      { left: "மூன்று (moondru)", right: "3" },
      { left: "ஐந்து (aindhu)", right: "5" },
      { left: "பத்து (patthu)", right: "10" },
    ],
    explanation: "Angka dasar ஒன்று (ondru) sampai பத்து (patthu) adalah bekal pertama untuk transaksi dan menyebut harga.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: '___ மாணவன். (___ maanavan.)' (Saya seorang pelajar.)",
    context: "Pilih kata ganti yang tepat.",
    options: ["நான் (naan)", "நீ (nee)", "அவன் (avan)", "நாங்கள் (naangal)"],
    correct: "நான் (naan)",
    explanation: "'நான் (naan)' = saya. Kalimat identitas Tamil di masa kini tanpa kopula: 'நான் மாணவன்' harfiah 'saya pelajar'. 'நீ (nee)' = kamu, 'அவன் (avan)' = dia (laki-laki), 'நாங்கள் (naangal)' = kami.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya makan nasi.",
    tokens: ["சாப்பிடுகிறேன் (saappidugiren)", "நான் (naan)", "சோறு (soru)"],
    correct: ["நான் (naan)", "சோறு (soru)", "சாப்பிடுகிறேன் (saappidugiren)"],
    explanation: "Tamil berpola SOV: Subjek நான் (naan) + Objek சோறு (soru) + Kata kerja சாப்பிடுகிறேன் (saappidugiren). Kata kerja selalu di akhir dan berkonjugasi sesuai subjek (-ஏன் = saya).",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Untuk menyatakan 'kemarin saya makan nasi' (lampau), kalimat yang tepat:",
    options: [
      "நான் சோறு சாப்பிடுகிறேன் (naan soru saappidugiren)",
      "நான் நேற்று சோறு சாப்பிட்டேன் (naan netru soru saappitten)",
      "நான் சோறு சாப்பிடுவேன் (naan soru saappiduven)",
      "நான் சோறு சாப்பிட்டுக்கொண்டிருக்கிறேன் (naan soru saappittukkondirukkiren)",
    ],
    correct: 1,
    explanation: "'சாப்பிட்டேன் (saappitten)' = bentuk lampau orang pertama (penanda -ட்ட்- + -ஏன்). 'சாப்பிடுகிறேன்' = masa kini, 'சாப்பிடுவேன்' = akan makan (futur), 'சாப்பிட்டுக்கொண்டிருக்கிறேன்' = sedang makan. 'நேற்று (netru)' = kemarin.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan keterangan tempat:",
    translation: "Saya belajar bahasa Tamil di sekolah.",
    tokens: ["தமிழ் (tamil)", "நான் (naan)", "படிக்கிறேன் (padikkiren)", "பள்ளியில் (palliyil)"],
    correct: ["நான் (naan)", "பள்ளியில் (palliyil)", "தமிழ் (tamil)", "படிக்கிறேன் (padikkiren)"],
    explanation: "Keterangan tempat 'பள்ளியில் (palliyil)' = di sekolah memakai akhiran lokatif -இல் (-il) dan diletakkan sebelum objek; kata kerja 'படிக்கிறேன் (padikkiren)' tetap di akhir (SOV).",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan kata yang tepat:",
    template: "கடை ___ 7 மணிக்கு ___. (kadai … 7 manikku … — Toko buka pukul 7 pagi.)",
    blanks: ["காலை (kaalai)", "திறக்கிறது (thirakkiradhu)"],
    options: ["காலை (kaalai)", "மாலை (maalai)", "திறக்கிறது (thirakkiradhu)", "மூடுகிறது (moodugiradhu)", "போகிறது (pogiradhu)", "இரவு (iravu)"],
    explanation: "'காலை (kaalai)' = pagi, 'திறக்கிறது (thirakkiradhu)' = buka. Pengecoh: 'மாலை (maalai)' = sore, 'இரவு (iravu)' = malam, 'மூடுகிறது (moodugiradhu)' = tutup, 'போகிறது (pogiradhu)' = pergi.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'மேசையின் ___ புத்தகம் இருக்கிறது. (mesaiyin ___ puthagam irukkiradhu.)' (Ada buku di atas meja.)",
    context: "Kata penunjuk posisi (postposisi).",
    options: ["மேலே (mele)", "கீழே (keezhe)", "பக்கத்தில் (pakkathil)", "உள்ளே (ulle)"],
    correct: "மேலே (mele)",
    explanation: "'மேலே (mele)' = di atas, diletakkan SETELAH kata benda bergenitif (மேசையின் = meja-nya) — kebalikan preposisi Indonesia. 'கீழே (keezhe)' = di bawah, 'பக்கத்தில் (pakkathil)' = di samping, 'உள்ளே (ulle)' = di dalam.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'மழை பெய்தாலும் நான் போவேன். (mazhai peydhaalum naan poven.)':",
    options: [
      "Karena hujan, saya akan pergi",
      "Meskipun hujan, saya akan tetap pergi",
      "Kalau hujan, saya tidak pergi",
      "Setelah hujan, saya akan pergi",
    ],
    correct: 1,
    explanation: "Akhiran '-ஆலும் (-aalum)' = meskipun/walaupun: 'பெய்தாலும் (peydhaalum)' = meskipun turun (hujan). Bandingkan '-ஆல் (-aal)' saja = kalau. 'போவேன் (poven)' = saya akan pergi.",
  },
  {
    id: "q10", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung Tamil dengan artinya:",
    pairs: [
      { left: "ஏனென்றால் (enendraal)", right: "karena" },
      { left: "ஆனால் (aanaal)", right: "tetapi" },
      { left: "அதனால் (adhanaal)", right: "oleh karena itu" },
      { left: "ஆனாலும் (aanaalum)", right: "meskipun begitu" },
    ],
    explanation: "Empat penghubung wacana ini kunci bercerita runtut: ஏனென்றால் (sebab), ஆனால் (pertentangan), அதனால் (akibat), ஆனாலும் (konsesif).",
  },
  {
    id: "q11", difficulty: "B1", type: "fillChoice",
    question: "Lengkapi: 'நேரம் ___ நான் வருவேன். (neram ___ naan varuven.)' (Kalau ada waktu, saya akan datang.)",
    context: "Bentuk pengandaian dari 'ada'.",
    options: ["இருந்தால் (irundhaal)", "இருந்தது (irundhadhu)", "இருக்கும் (irukkum)", "இருந்தும் (irundhum)"],
    correct: "இருந்தால் (irundhaal)",
    explanation: "Pengandaian Tamil dibentuk dengan akhiran '-ஆல் (-aal)' pada kata kerja: 'இருந்தால் (irundhaal)' = kalau ada. 'இருந்தது' = ada (lampau), 'இருக்கும்' = akan ada, 'இருந்தும்' = meskipun ada.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat dengan kata bandingan:",
    template: "இன்று நேற்றை ___ சூடாக இருக்கிறது. இது வாரத்தின் ___ சூடான நாள். (indru netrai … soodaga irukkiradhu. idhu vaarathin … soodana naal — Hari ini lebih panas dari kemarin. Ini hari terpanas minggu ini.)",
    blanks: ["விட (vida)", "மிகவும் (migavum)"],
    options: ["விட (vida)", "மிகவும் (migavum)", "போல (pola)", "மட்டும் (mattum)", "கூட (kooda)", "வேண்டும் (vendum)"],
    explanation: "'X-ஐ விட (vida)' = lebih … daripada X (komparatif), 'மிகவும் (migavum)' = paling/sangat (superlatif). Pengecoh: 'போல (pola)' = seperti, 'மட்டும் (mattum)' = hanya, 'கூட (kooda)' = juga/bahkan, 'வேண்டும் (vendum)' = harus.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat pasif 'என் தொலைபேசி திருடப்பட்டது. (en tholaipesi thirudappattadhu.)' berarti:",
    options: [
      "Saya mencuri telepon",
      "Telepon saya dicuri",
      "Saya menjual telepon",
      "Telepon saya rusak",
    ],
    correct: 1,
    explanation: "Pasif Tamil dibentuk dengan '-படு (-padu)': 'திருடப்பட்டது (thirudappattadhu)' = dicuri (lampau). 'என் (en)' = milik saya, 'தொலைபேசி (tholaipesi)' = telepon.",
  },
  {
    id: "q14", difficulty: "B2", type: "multiple",
    question: "Kalimat 'அவர் தமிழர் போல தமிழ் பேசுகிறார். (avar tamizhar pola tamil pesugiraar.)' berarti:",
    options: [
      "Dia berbahasa Tamil seperti orang Tamil asli",
      "Dia berbahasa Tamil lebih baik dari orang Tamil",
      "Dia belajar bahasa Tamil dari orang Tamil",
      "Dia hanya berbahasa Tamil dengan orang Tamil",
    ],
    correct: 0,
    explanation: "'போல (pola)' = seperti (penyerupaan): 'தமிழர் போல (tamizhar pola)' = seperti orang Tamil. 'அவர் (avar)' = dia (bentuk hormat). Bandingkan 'விட (vida)' = lebih dari, 'மட்டும் (mattum)' = hanya.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa Tamil 'யானைக்கும் அடி சறுக்கும் (yaanaikkum adi sarukkum)' — 'kaki gajah pun bisa tergelincir' — paling dekat maknanya dengan:",
    options: [
      "Tong kosong nyaring bunyinya",
      "Sepandai-pandai tupai melompat, akhirnya jatuh juga",
      "Besar pasak daripada tiang",
      "Air tenang menghanyutkan",
    ],
    correct: 1,
    explanation: "Maknanya: sehebat apa pun seseorang, ia tetap bisa berbuat salah — persis 'Sepandai-pandai tupai melompat, akhirnya jatuh juga'. Pengecoh: tong kosong = omong besar, besar pasak = boros, air tenang = orang pendiam yang berilmu.",
  },
];
