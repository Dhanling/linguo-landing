import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// VIETNAMESE PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// ─────────────────────────────────────────────────────────────────────────────
export const vietnamesePlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari 'Xin chào' adalah:",
    options: ["Selamat tinggal", "Halo / Selamat datang", "Terima kasih", "Maaf"],
    correct: 1,
    explanation: "'Xin chào' = halo (sapaan umum). 'Tạm biệt' = selamat tinggal, 'Cảm ơn' = terima kasih.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Vietnam dengan artinya:",
    pairs: [
      { left: "một", right: "1" },
      { left: "ba", right: "3" },
      { left: "năm", right: "5" },
      { left: "mười", right: "10" },
    ],
    explanation: "Angka dasar một~mười penting untuk harga dan transaksi sehari-hari.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Tôi ___ sinh viên.' (Saya seorang mahasiswa.)",
    context: "Kata kerja 'adalah'.",
    options: ["là", "có", "ở", "được"],
    correct: "là",
    explanation: "'là' = adalah, menghubungkan dua kata benda. 'có' = punya, 'ở' = berada di.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya makan nasi.",
    tokens: ["cơm", "Tôi", "ăn"],
    correct: ["Tôi", "ăn", "cơm"],
    explanation: "Struktur SVO Vietnam: Subjek (Tôi) + Kata kerja (ăn) + Objek (cơm).",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Untuk menyatakan aksi lampau 'sudah makan', penanda yang tepat:",
    options: [
      "Tôi ăn cơm",
      "Tôi đã ăn cơm",
      "Tôi sẽ ăn cơm",
      "Tôi đang ăn cơm",
    ],
    correct: 1,
    explanation: "'đã' = penanda lampau (sudah). 'sẽ' = akan (futur), 'đang' = sedang (progresif).",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan keterangan tempat:",
    translation: "Saya belajar bahasa Vietnam di sekolah.",
    tokens: ["tiếng Việt", "ở trường", "Tôi", "học"],
    correct: ["Tôi", "học", "tiếng Việt", "ở trường"],
    explanation: "Keterangan tempat 'ở trường' umumnya diletakkan di akhir kalimat, setelah objek.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan kata yang tepat:",
    template: "Cửa hàng ___ cửa ___ 7 giờ sáng. (Toko buka pukul 7 pagi.)",
    blanks: ["mở", "lúc"],
    options: ["mở", "đóng", "lúc", "ở", "có", "rất"],
    explanation: "'mở cửa' = buka (pintu/toko), 'lúc' = pada (waktu). 'đóng cửa' = tutup.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'Bạn ___ nói tiếng Việt không?' (Apakah kamu bisa berbahasa Vietnam?)",
    context: "Modalitas 'bisa'.",
    options: ["có thể", "phải", "nên", "đã"],
    correct: "có thể",
    explanation: "'có thể … không?' = apakah bisa …? 'phải' = harus, 'nên' = sebaiknya.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'Tuy trời mưa nhưng tôi vẫn đi.' :",
    options: [
      "Karena hujan, saya pergi",
      "Meskipun hujan, saya tetap pergi",
      "Kalau hujan, saya pergi",
      "Setelah hujan, saya pergi",
    ],
    correct: 1,
    explanation: "Pasangan 'Tuy … nhưng …' = meskipun … tetapi …. 'vẫn' = tetap/masih.",
  },
  {
    id: "q10", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat berandai:",
    translation: "Kalau ada waktu, saya ingin pergi ke Vietnam.",
    tokens: ["đi Việt Nam", "có thời gian", "Nếu", "tôi muốn"],
    correct: ["Nếu", "có thời gian", "tôi muốn", "đi Việt Nam"],
    explanation: "'Nếu …' = kalau …. 'muốn' = ingin. Klausa syarat mendahului klausa utama.",
  },
  {
    id: "q11", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung dengan artinya:",
    pairs: [
      { left: "vì … nên …", right: "karena … maka …" },
      { left: "nếu … thì …", right: "kalau … maka …" },
      { left: "để", right: "supaya / untuk" },
      { left: "vẫn", right: "tetap / masih" },
    ],
    explanation: "Konjungsi berpasangan ini adalah inti tata bahasa menengah.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat dengan kata bandingan:",
    template: "Hôm nay trời nóng ___ hôm qua. Đây là ngày nóng ___ trong tuần. (Hari ini lebih panas dari kemarin. Ini hari terpanas minggu ini.)",
    blanks: ["hơn", "nhất"],
    options: ["hơn", "nhất", "bằng", "như", "rất", "quá"],
    explanation: "'… hơn' = lebih … (komparatif). '… nhất' = paling … (superlatif).",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat pasif 'Điện thoại của tôi bị lấy cắp.' berarti:",
    options: [
      "Saya mencuri HP",
      "HP saya dicuri",
      "Saya menjual HP",
      "HP saya hilang sendiri",
    ],
    correct: 1,
    explanation: "'bị' menandai pasif untuk hal negatif (dikenai sesuatu yang buruk). 'bị lấy cắp' = dicuri. Bandingkan 'được' untuk hal positif.",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi: 'Anh ấy nói tiếng Việt ___ người bản xứ.' (Dia berbahasa Vietnam seolah penutur asli.)",
    context: "Ungkapan perbandingan 'seolah/seperti'.",
    options: ["như", "hơn", "bằng", "của"],
    correct: "như",
    explanation: "'như' = seperti/seolah. 'nói … như người bản xứ' = berbicara seperti penutur asli.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa 'Nhập gia tùy tục' paling dekat maknanya dengan:",
    options: [
      "Sekali dayung dua pulau terlampaui",
      "Di mana bumi dipijak, di situ langit dijunjung",
      "Air beriak tanda tak dalam",
      "Tong kosong nyaring bunyinya",
    ],
    correct: 1,
    explanation: "'Nhập gia tùy tục' = masuk rumah orang ikuti adatnya — menyesuaikan diri dengan kebiasaan setempat.",
  },
];
