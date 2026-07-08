import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// MANDARIN PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// Level selaras HSK: A1 ≈ HSK 1, A2 ≈ HSK 2, B1 ≈ HSK 3, B2 ≈ HSK 4
// ─────────────────────────────────────────────────────────────────────────────
export const mandarinPlacementTest: Question[] = [
  // ═══════════════════════ A1 (HSK 1) ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Sapaan paling umum dalam bahasa Mandarin adalah:",
    options: [
      "再见 (zàijiàn)",
      "你好 (nǐ hǎo)",
      "谢谢 (xièxie)",
      "对不起 (duìbuqǐ)",
    ],
    correct: 1,
    explanation: "'你好' = halo. '再见' = sampai jumpa, '谢谢' = terima kasih, '对不起' = maaf.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Mandarin dengan artinya:",
    pairs: [
      { left: "一 (yī)", right: "1" },
      { left: "三 (sān)", right: "3" },
      { left: "五 (wǔ)", right: "5" },
      { left: "十 (shí)", right: "10" },
    ],
    explanation: "Angka dasar 一~十 adalah fondasi untuk harga, tanggal, dan usia.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: '我 ___ 学生。' (Saya adalah murid.)",
    context: "Kata kerja 'adalah'.",
    options: ["是", "在", "有", "会"],
    correct: "是",
    explanation: "'是' (shì) = adalah, menghubungkan dua kata benda. '在' = berada, '有' = punya, '会' = bisa.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya makan nasi.",
    tokens: ["米饭", "我", "吃"],
    correct: ["我", "吃", "米饭"],
    explanation: "Struktur dasar SVO Mandarin: Subjek (我) + Kata kerja (吃) + Objek (米饭).",
  },

  // ═══════════════════════ A2 (HSK 2) ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Untuk menyatakan 'sudah makan', partikel yang tepat adalah:",
    options: [
      "我吃饭 (wǒ chī fàn)",
      "我吃了饭 (wǒ chī le fàn)",
      "我要吃饭 (wǒ yào chī fàn)",
      "我在吃饭 (wǒ zài chī fàn)",
    ],
    correct: 1,
    explanation: "'了' (le) menandai aksi selesai/lampau. '要' = akan/mau, '在' = sedang.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan keterangan waktu:",
    translation: "Saya belajar bahasa Mandarin di sekolah.",
    tokens: ["中文", "在学校", "我", "学"],
    correct: ["我", "在学校", "学", "中文"],
    explanation: "Keterangan tempat '在学校' diletakkan SEBELUM kata kerja. Struktur: Subjek + tempat + kerja + objek.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat perbandingan dan kepemilikan:",
    template: "这 ___ 书是我 ___ 。 (Buku ini milik saya.)",
    blanks: ["本", "的"],
    options: ["本", "个", "的", "了", "在", "很"],
    explanation: "'本' = kata bantu bilangan (量词) untuk buku. '的' menandai kepemilikan (我的 = milikku).",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: '你 ___ 说中文？' (Apakah kamu bisa berbahasa Mandarin?)",
    context: "Modalitas 'bisa (kemampuan yang dipelajari)'.",
    options: ["会", "能", "可以", "要"],
    correct: "会",
    explanation: "'会' = bisa karena sudah belajar (skill). '能' = mampu (kondisi), '可以' = boleh (izin).",
  },

  // ═══════════════════════ B1 (HSK 3) ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti kalimat '虽然下雨，但是我还是去了。' :",
    options: [
      "Karena hujan, saya pergi",
      "Meskipun hujan, saya tetap pergi",
      "Kalau hujan, saya pergi",
      "Setelah hujan, saya pergi",
    ],
    correct: 1,
    explanation: "Pasangan '虽然…但是…' = meskipun…tetapi…. '还是' = tetap/masih. Konjungsi berpasangan khas HSK 3.",
  },
  {
    id: "q10", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat dengan komplemen hasil '得':",
    translation: "Dia berbicara bahasa Mandarin dengan sangat baik.",
    tokens: ["很好", "说", "他", "得", "中文"],
    correct: ["他", "中文", "说", "得", "很好"],
    explanation: "Struktur komplemen derajat: (objek) + 说 + 得 + 很好. '得' menghubungkan kerja dengan penilaiannya.",
  },
  {
    id: "q11", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung dengan artinya:",
    pairs: [
      { left: "因为…所以…", right: "karena … maka …" },
      { left: "如果…就…", right: "kalau … maka …" },
      { left: "一边…一边…", right: "sambil … sambil …" },
      { left: "越来越…", right: "semakin lama semakin …" },
    ],
    explanation: "Struktur berpasangan ini adalah inti tata bahasa menengah (HSK 3).",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat dengan aspek dan arah:",
    template: "他 ___ 从北京回 ___ 了。 (Dia baru saja pulang dari Beijing.)",
    blanks: ["刚", "来"],
    options: ["刚", "来", "去", "就", "在", "过"],
    explanation: "'刚' = baru saja. '回来' = pulang (kembali ke sini) — 来 menunjukkan arah menuju pembicara.",
  },

  // ═══════════════════════ B2 (HSK 4) ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat pasif '我的手机被偷了。' berarti:",
    options: [
      "Saya mencuri HP",
      "HP saya dicuri (orang)",
      "Saya kehilangan HP",
      "HP saya rusak",
    ],
    correct: 1,
    explanation: "'被' menandai kalimat pasif: subjek dikenai tindakan. '被偷了' = dicuri. Struktur 被字句 khas HSK 4.",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi kalimat '把': '请你 ___ 门关上。' (Tolong tutup pintunya.)",
    context: "Struktur 把字句 (memindah objek ke depan kerja).",
    options: ["把", "被", "让", "给"],
    correct: "把",
    explanation: "'把' memindahkan objek (门) ke depan kata kerja untuk menekankan penanganan objek: 把门关上 = menutup pintu.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa '入乡随俗' paling dekat maknanya dengan:",
    options: [
      "Sekali dayung dua pulau terlampaui",
      "Di mana bumi dipijak, di situ langit dijunjung",
      "Air tenang menghanyutkan",
      "Besar pasak daripada tiang",
    ],
    correct: 1,
    explanation: "'入乡随俗' (harfiah 'masuk desa ikuti adatnya') = menyesuaikan diri dengan adat setempat. Chengyu penting di level lanjutan.",
  },
];
