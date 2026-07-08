import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// HINDI PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// ─────────────────────────────────────────────────────────────────────────────
export const hindiPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Sapaan umum yang netral dalam bahasa Hindi adalah:",
    options: [
      "अलविदा (alvidā)",
      "नमस्ते (namaste)",
      "धन्यवाद (dhanyavād)",
      "माफ़ कीजिए (māf kījiye)",
    ],
    correct: 1,
    explanation: "'नमस्ते' = salam/halo. 'अलविदा' = selamat tinggal, 'धन्यवाद' = terima kasih.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Hindi dengan artinya:",
    pairs: [
      { left: "एक (ek)", right: "1" },
      { left: "तीन (tīn)", right: "3" },
      { left: "पाँच (pāṅc)", right: "5" },
      { left: "दस (das)", right: "10" },
    ],
    explanation: "Angka dasar एक~दस penting untuk harga dan transaksi.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'मैं छात्र ___ ।' (Saya seorang murid.)",
    context: "Kata kerja 'adalah' (untuk 'saya').",
    options: ["हूँ", "है", "हैं", "थे"],
    correct: "हूँ",
    explanation: "'हूँ' dipakai khusus untuk 'मैं' (saya). 'है' untuk orang ketiga tunggal, 'हैं' untuk jamak/hormat.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar (SOV):",
    translation: "Saya makan nasi.",
    tokens: ["चावल", "मैं", "खाता हूँ"],
    correct: ["मैं", "चावल", "खाता हूँ"],
    explanation: "Struktur SOV Hindi: Subjek (मैं) + Objek (चावल) + Kata kerja (खाता हूँ).",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Bentuk lampau 'saya makan' (laki-laki) yang tepat:",
    options: [
      "मैं खाता हूँ",
      "मैंने खाया",
      "मैं खाऊँगा",
      "मैं खा रहा हूँ",
    ],
    correct: 1,
    explanation: "'मैंने खाया' = saya (sudah) makan — memakai penanda ergatif 'ने' pada kata kerja transitif lampau. 'खाऊँगा' = akan makan.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan keterangan tempat:",
    translation: "Saya belajar bahasa Hindi di sekolah.",
    tokens: ["हिंदी", "स्कूल में", "मैं", "पढ़ता हूँ"],
    correct: ["मैं", "स्कूल में", "हिंदी", "पढ़ता हूँ"],
    explanation: "'में' = di/dalam (postposisi). Keterangan tempat (स्कूल में) diletakkan sebelum objek dan kata kerja.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan postposisi yang tepat:",
    template: "यह किताब बच्चे ___ है और मेज़ ___ है। (Buku ini milik anak itu dan ada di atas meja.)",
    blanks: ["की", "पर"],
    options: ["की", "पर", "में", "से", "को", "का"],
    explanation: "'की' = milik (untuk kata benda feminin किताब). 'पर' = di atas/pada. Postposisi menyesuaikan gender & jumlah.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'क्या आप हिंदी बोल ___ हैं?' (Apakah Anda bisa berbahasa Hindi?)",
    context: "Modalitas 'bisa' (kemampuan).",
    options: ["सकते", "चाहते", "रहे", "गए"],
    correct: "सकते",
    explanation: "'बोल सकते हैं' = bisa berbicara. Pola: akar kerja + सकना (bisa). 'चाहते' = ingin.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'बारिश होने के बावजूद मैं बाहर गया।' :",
    options: [
      "Karena hujan, saya keluar",
      "Meskipun hujan, saya tetap keluar",
      "Kalau hujan, saya keluar",
      "Setelah hujan, saya keluar",
    ],
    correct: 1,
    explanation: "'के बावजूद' = meskipun/walaupun. 'बारिश होने के बावजूद' = meskipun hujan turun.",
  },
  {
    id: "q10", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat berandai:",
    translation: "Kalau ada waktu, saya ingin pergi ke India.",
    tokens: ["भारत जाना", "समय हो", "अगर", "तो मैं चाहता हूँ"],
    correct: ["अगर", "समय हो", "तो मैं चाहता हूँ", "भारत जाना"],
    explanation: "Pasangan 'अगर … तो …' = kalau … maka …. 'चाहता हूँ' = ingin.",
  },
  {
    id: "q11", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung dengan artinya:",
    pairs: [
      { left: "क्योंकि", right: "karena" },
      { left: "अगर … तो …", right: "kalau … maka …" },
      { left: "ताकि", right: "supaya / agar" },
      { left: "लेकिन", right: "tetapi" },
    ],
    explanation: "Kata penghubung ini adalah inti tata bahasa menengah.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat perbandingan:",
    template: "आज कल ___ ज़्यादा गरम है। यह हफ़्ते का ___ गरम दिन है। (Hari ini lebih panas dari kemarin. Ini hari terpanas minggu ini.)",
    blanks: ["से", "सबसे"],
    options: ["से", "सबसे", "जैसा", "तक", "बहुत", "और"],
    explanation: "'X से ज़्यादा' = lebih … dari X (komparatif). 'सबसे' = paling (superlatif).",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat pasif 'मेरा फ़ोन चोरी हो गया।' berarti:",
    options: [
      "Saya mencuri telepon",
      "Telepon saya dicuri / kecurian",
      "Saya menjual telepon",
      "Telepon saya rusak",
    ],
    correct: 1,
    explanation: "'चोरी हो गया' = tercuri/dicuri (konstruksi 'हो जाना' menyatakan kejadian yang menimpa). ",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi: 'वह हिंदी ऐसे बोलता है ___ वह देशी हो।' (Dia berbahasa Hindi seolah penutur asli.)",
    context: "Ungkapan 'seolah-olah'.",
    options: ["जैसे", "क्योंकि", "लेकिन", "ताकि"],
    correct: "जैसे",
    explanation: "'ऐसे … जैसे …' = seolah-olah/seperti. 'जैसे वह देशी हो' = seakan dia penutur asli.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa 'जैसा देश वैसा भेस' paling dekat maknanya dengan:",
    options: [
      "Air tenang menghanyutkan",
      "Di mana bumi dipijak, di situ langit dijunjung",
      "Sedia payung sebelum hujan",
      "Tak ada gading yang tak retak",
    ],
    correct: 1,
    explanation: "'जैसा देश वैसा भेस' (sebagaimana negeri, begitulah busana) = menyesuaikan diri dengan adat setempat.",
  },
];
