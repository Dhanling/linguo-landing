import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// PUNJABI (GURMUKHI) PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// ─────────────────────────────────────────────────────────────────────────────
export const punjabiPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ (sat sri akal)' adalah:",
    options: ["Terima kasih", "Halo / Salam", "Maaf", "Sampai jumpa besok"],
    correct: 1,
    explanation: "'ਸਤ ਸ੍ਰੀ ਅਕਾਲ (sat sri akal)' = salam khas Punjabi (dipakai saat bertemu maupun berpisah). 'ਧੰਨਵਾਦ (dhannvaad)' = terima kasih, 'ਮਾਫ਼ ਕਰਨਾ (maaf karna)' = maaf.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Punjabi dengan artinya:",
    pairs: [
      { left: "ਇੱਕ (ikk)", right: "1" },
      { left: "ਤਿੰਨ (tinn)", right: "3" },
      { left: "ਪੰਜ (panj)", right: "5" },
      { left: "ਦਸ (das)", right: "10" },
    ],
    explanation: "Angka dasar ਇੱਕ (ikk) sampai ਦਸ (das) wajib untuk transaksi. Fakta menarik: nama 'Punjab' sendiri berasal dari 'panj' = lima (negeri lima sungai).",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'ਮੈਂ ਵਿਦਿਆਰਥੀ ___। (main vidiaarthi ___.)' (Saya seorang pelajar.)",
    context: "Kopula 'adalah' yang cocok dengan subjek 'saya'.",
    options: ["ਹਾਂ (haan)", "ਹੈ (hai)", "ਹੋ (ho)", "ਹਨ (han)"],
    correct: "ਹਾਂ (haan)",
    explanation: "Kopula Punjabi menyesuaikan subjek: ਮੈਂ (main) → ਹਾਂ (haan), ਉਹ (uh, dia) → ਹੈ (hai), ਤੁਸੀਂ (tusin, Anda) → ਹੋ (ho), jamak → ਹਨ (han).",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya makan nasi.",
    tokens: ["ਹਾਂ (haan)", "ਮੈਂ (main)", "ਖਾਂਦਾ (khaanda)", "ਚੌਲ (chaul)"],
    correct: ["ਮੈਂ (main)", "ਚੌਲ (chaul)", "ਖਾਂਦਾ (khaanda)", "ਹਾਂ (haan)"],
    explanation: "Punjabi berpola SOV: Subjek ਮੈਂ (main) + Objek ਚੌਲ (chaul) + Kata kerja ਖਾਂਦਾ ਹਾਂ (khaanda haan). Kata kerja selalu di akhir — beda dari bahasa Indonesia yang SVO.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Untuk menyatakan 'kemarin saya pergi ke sekolah' (lampau), kalimat yang tepat:",
    options: [
      "ਮੈਂ ਸਕੂਲ ਜਾਂਦਾ ਹਾਂ (main sakool jaanda haan)",
      "ਮੈਂ ਕੱਲ੍ਹ ਸਕੂਲ ਗਿਆ (main kallh sakool giya)",
      "ਮੈਂ ਸਕੂਲ ਜਾਵਾਂਗਾ (main sakool jaavaanga)",
      "ਮੈਂ ਸਕੂਲ ਜਾ ਰਿਹਾ ਹਾਂ (main sakool ja riha haan)",
    ],
    correct: 1,
    explanation: "'ਗਿਆ (giya)' = bentuk lampau 'pergi'. 'ਜਾਂਦਾ ਹਾਂ (jaanda haan)' = pergi (kebiasaan), 'ਜਾਵਾਂਗਾ (jaavaanga)' = akan pergi, 'ਜਾ ਰਿਹਾ ਹਾਂ (ja riha haan)' = sedang pergi. 'ਕੱਲ੍ਹ (kallh)' = kemarin/besok, ditentukan konteks.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan keterangan tempat:",
    translation: "Saya belajar bahasa Punjabi di sekolah.",
    tokens: ["ਪੰਜਾਬੀ (punjabi)", "ਸਿੱਖਦਾ ਹਾਂ (sikkhda haan)", "ਮੈਂ (main)", "ਸਕੂਲ ਵਿੱਚ (sakool vich)"],
    correct: ["ਮੈਂ (main)", "ਸਕੂਲ ਵਿੱਚ (sakool vich)", "ਪੰਜਾਬੀ (punjabi)", "ਸਿੱਖਦਾ ਹਾਂ (sikkhda haan)"],
    explanation: "Keterangan tempat 'ਸਕੂਲ ਵਿੱਚ (sakool vich)' = di sekolah memakai POSTposisi ਵਿੱਚ (vich) setelah kata benda, dan kata kerja 'ਸਿੱਖਦਾ ਹਾਂ (sikkhda haan)' tetap di akhir (SOV).",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan kata yang tepat:",
    template: "ਦੁਕਾਨ ___ 7 ਵਜੇ ___। (dukaan … 7 vaje … — Toko buka pukul 7 pagi.)",
    blanks: ["ਸਵੇਰੇ (savere)", "ਖੁੱਲ੍ਹਦੀ ਹੈ (khullhdi hai)"],
    options: ["ਸਵੇਰੇ (savere)", "ਰਾਤ ਨੂੰ (raat nu)", "ਖੁੱਲ੍ਹਦੀ ਹੈ (khullhdi hai)", "ਬੰਦ ਹੁੰਦੀ ਹੈ (band hundi hai)", "ਜਾਂਦੀ ਹੈ (jaandi hai)", "ਸ਼ਾਮ ਨੂੰ (shaam nu)"],
    explanation: "'ਸਵੇਰੇ (savere)' = di pagi hari, 'ਖੁੱਲ੍ਹਦੀ ਹੈ (khullhdi hai)' = buka (feminin, karena ਦੁਕਾਨ feminin). Pengecoh: 'ਰਾਤ ਨੂੰ (raat nu)' = malam, 'ਸ਼ਾਮ ਨੂੰ (shaam nu)' = sore, 'ਬੰਦ ਹੁੰਦੀ ਹੈ (band hundi hai)' = tutup.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'ਮੇਜ਼ ___ ਕਿਤਾਬ ਹੈ। (mez ___ kitaab hai.)' (Ada buku di atas meja.)",
    context: "Kata penunjuk posisi (postposisi).",
    options: ["ਉੱਤੇ (utte)", "ਹੇਠਾਂ (hethaan)", "ਵਿੱਚ (vich)", "ਕੋਲ (kol)"],
    correct: "ਉੱਤੇ (utte)",
    explanation: "'ਉੱਤੇ (utte)' = di atas, diletakkan SETELAH kata benda (postposisi) — kebalikan preposisi Indonesia. 'ਹੇਠਾਂ (hethaan)' = di bawah, 'ਵਿੱਚ (vich)' = di dalam, 'ਕੋਲ (kol)' = di dekat.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'ਭਾਵੇਂ ਮੀਂਹ ਪੈ ਰਿਹਾ ਹੈ, ਫਿਰ ਵੀ ਮੈਂ ਜਾਵਾਂਗਾ। (bhaaven meenh pai riha hai, phir vi main jaavaanga.)':",
    options: [
      "Karena hujan, saya akan pergi",
      "Meskipun sedang hujan, saya akan tetap pergi",
      "Kalau hujan, saya tidak pergi",
      "Setelah hujan, saya akan pergi",
    ],
    correct: 1,
    explanation: "'ਭਾਵੇਂ (bhaaven)' = meskipun, berpasangan dengan 'ਫਿਰ ਵੀ (phir vi)' = tetap saja/meski begitu. 'ਮੀਂਹ ਪੈ ਰਿਹਾ ਹੈ (meenh pai riha hai)' = sedang turun hujan.",
  },
  {
    id: "q10", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung Punjabi dengan artinya:",
    pairs: [
      { left: "ਕਿਉਂਕਿ (kiunki)", right: "karena" },
      { left: "ਜੇ (je)", right: "kalau" },
      { left: "ਪਰ (par)", right: "tetapi" },
      { left: "ਇਸ ਲਈ (is lai)", right: "oleh karena itu" },
    ],
    explanation: "Konjungsi inti kalimat kompleks: ਕਿਉਂਕਿ (sebab), ਜੇ (syarat), ਪਰ (pertentangan), ਇਸ ਲਈ (akibat/kesimpulan).",
  },
  {
    id: "q11", difficulty: "B1", type: "multiple",
    question: "Kalimat 'ਜੇ ਸਮਾਂ ਹੋਵੇ ਤਾਂ ਮੈਂ ਆਵਾਂਗਾ। (je samaan hove taan main aavaanga.)' berarti:",
    options: [
      "Karena ada waktu, saya datang",
      "Kalau ada waktu, saya akan datang",
      "Meskipun ada waktu, saya tidak datang",
      "Ketika saya datang, waktunya habis",
    ],
    correct: 1,
    explanation: "Pasangan 'ਜੇ … ਤਾਂ … (je … taan …)' = kalau … maka …. 'ਹੋਵੇ (hove)' = bentuk subjungtif 'ada' (khas klausa pengandaian), 'ਆਵਾਂਗਾ (aavaanga)' = saya akan datang.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat dengan kata bandingan:",
    template: "ਅੱਜ ਕੱਲ੍ਹ ___ ਗਰਮ ਹੈ। ਇਹ ਹਫ਼ਤੇ ਦਾ ___ ਗਰਮ ਦਿਨ ਹੈ। (ajj kallh … garam hai. ih hafte da … garam din hai — Hari ini lebih panas dari kemarin. Ini hari terpanas minggu ini.)",
    blanks: ["ਨਾਲੋਂ (naalon)", "ਸਭ ਤੋਂ (sabh ton)"],
    options: ["ਨਾਲੋਂ (naalon)", "ਸਭ ਤੋਂ (sabh ton)", "ਵਾਂਗ (vaang)", "ਬਹੁਤ (bahut)", "ਥੋੜ੍ਹਾ (thorha)", "ਵੀ (vi)"],
    explanation: "'X ਨਾਲੋਂ (naalon)' = lebih … daripada X (komparatif), 'ਸਭ ਤੋਂ (sabh ton)' = paling (superlatif, harfiah 'dari semua'). Pengecoh: 'ਵਾਂਗ (vaang)' = seperti, 'ਬਹੁਤ (bahut)' = sangat, 'ਥੋੜ੍ਹਾ (thorha)' = sedikit, 'ਵੀ (vi)' = juga.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat pasif 'ਚਿੱਠੀ ਲਿਖੀ ਗਈ। (chitthi likhi gai.)' berarti:",
    options: [
      "Dia sedang menulis surat",
      "Surat itu telah ditulis",
      "Surat itu akan ditulis",
      "Saya membalas surat itu",
    ],
    correct: 1,
    explanation: "Pasif Punjabi dibentuk dengan partisip + ਜਾਣਾ (jaana): 'ਲਿਖੀ ਗਈ (likhi gai)' = telah ditulis (feminin, mengikuti ਚਿੱਠੀ = surat yang feminin). Gender pada kata kerja adalah ciri khas Punjabi.",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi: 'ਉਹ ਪੰਜਾਬੀਆਂ ___ ਪੰਜਾਬੀ ਬੋਲਦਾ ਹੈ। (uh punjabiaan ___ punjabi bolda hai.)' (Dia berbahasa Punjabi seperti orang Punjabi asli.)",
    context: "Postposisi perbandingan 'seperti'.",
    options: ["ਵਾਂਗ (vaang)", "ਨਾਲੋਂ (naalon)", "ਲਈ (lai)", "ਤੋਂ (ton)"],
    correct: "ਵਾਂਗ (vaang)",
    explanation: "'X ਵਾਂਗ (vaang)' = seperti X (penyerupaan). 'ਨਾਲੋਂ (naalon)' = lebih daripada, 'ਲਈ (lai)' = untuk, 'ਤੋਂ (ton)' = dari (asal).",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa Punjabi 'ਜਿੱਥੇ ਚਾਹ ਉੱਥੇ ਰਾਹ (jitthe chaah utthe raah)' — 'di mana ada kemauan, di situ ada jalan' — paling dekat maknanya dengan:",
    options: [
      "Tong kosong nyaring bunyinya",
      "Di mana ada kemauan, di situ ada jalan",
      "Air beriak tanda tak dalam",
      "Besar pasak daripada tiang",
    ],
    correct: 1,
    explanation: "'ਚਾਹ (chaah)' = kemauan/keinginan, 'ਰਾਹ (raah)' = jalan — padanannya persis pepatah Indonesia 'Di mana ada kemauan, di situ ada jalan'. Pengecoh: tong kosong = omong besar, air beriak = orang dangkal, besar pasak = boros.",
  },
];
