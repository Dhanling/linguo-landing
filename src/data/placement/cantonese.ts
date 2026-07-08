import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// CANTONESE PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// Aksara Tradisional + romanisasi Jyutping.
// ─────────────────────────────────────────────────────────────────────────────
export const cantonesePlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Sapaan umum dalam bahasa Kanton adalah:",
    options: [
      "拜拜 (baai1 baai3)",
      "你好 (nei5 hou2)",
      "唔該 (m4 goi1)",
      "對唔住 (deoi3 m4 zyu6)",
    ],
    correct: 1,
    explanation: "'你好' = halo. '拜拜' = sampai jumpa, '唔該' = terima kasih/permisi, '對唔住' = maaf.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Kanton dengan artinya:",
    pairs: [
      { left: "一 (jat1)", right: "1" },
      { left: "三 (saam1)", right: "3" },
      { left: "五 (ng5)", right: "5" },
      { left: "十 (sap6)", right: "10" },
    ],
    explanation: "Angka dasar 一~十 penting untuk harga dan transaksi sehari-hari.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: '我 ___ 學生。' (Saya seorang murid.)",
    context: "Kata kerja 'adalah'.",
    options: ["係", "喺", "有", "識"],
    correct: "係",
    explanation: "'係' (hai6) = adalah, menghubungkan dua kata benda. '喺' (hai2) = berada di, '有' = punya, '識' = bisa/kenal.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar (SVO):",
    translation: "Saya makan nasi.",
    tokens: ["飯", "我", "食"],
    correct: ["我", "食", "飯"],
    explanation: "Struktur SVO Kanton: Subjek (我) + Kata kerja (食) + Objek (飯). '食飯' = makan (nasi).",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Untuk menyatakan aksi selesai 'sudah makan', partikel yang tepat:",
    options: [
      "我食飯",
      "我食咗飯",
      "我會食飯",
      "我食緊飯",
    ],
    correct: 1,
    explanation: "'咗' (zo2) menandai aksi selesai (setara 了 Mandarin). '會' = akan, '緊' = sedang.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan keterangan tempat:",
    translation: "Saya belajar bahasa Kanton di sekolah.",
    tokens: ["廣東話", "喺學校", "我", "學"],
    correct: ["我", "喺學校", "學", "廣東話"],
    explanation: "'喺' (hai2) + tempat = di …. Keterangan tempat diletakkan SEBELUM kata kerja.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat kepemilikan dan kata bantu bilangan:",
    template: "呢 ___ 書係我 ___ 。 (Buku ini milik saya.)",
    blanks: ["本", "嘅"],
    options: ["本", "個", "嘅", "咗", "喺", "好"],
    explanation: "'本' = kata bantu bilangan (量詞) untuk buku. '嘅' (ge3) menandai kepemilikan (我嘅 = milikku).",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: '你 ___ 唔識講廣東話？' (Apakah kamu bisa berbahasa Kanton?)",
    context: "Pola tanya 'bisa … atau tidak'.",
    options: ["識", "要", "想", "去"],
    correct: "識",
    explanation: "'識…唔識…' = bisa … atau tidak? '識' (sik1) = bisa/tahu cara. Pola tanya A-not-A khas Kanton.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti '雖然落雨，但係我都去。' :",
    options: [
      "Karena hujan, saya pergi",
      "Meskipun hujan, saya tetap pergi",
      "Kalau hujan, saya pergi",
      "Setelah hujan, saya pergi",
    ],
    correct: 1,
    explanation: "Pasangan '雖然…但係…' = meskipun…tetapi…. '都' di sini = tetap/juga. '落雨' = hujan turun.",
  },
  {
    id: "q10", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat dengan komplemen '得':",
    translation: "Dia berbicara bahasa Kanton dengan sangat baik.",
    tokens: ["好好", "講", "佢", "得", "廣東話"],
    correct: ["佢", "廣東話", "講", "得", "好好"],
    explanation: "Struktur komplemen derajat: (objek) + 講 + 得 + 好好. '佢' (keoi5) = dia, '得' menghubungkan kerja dgn penilaian.",
  },
  {
    id: "q11", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung dengan artinya:",
    pairs: [
      { left: "因為…所以…", right: "karena … maka …" },
      { left: "如果…就…", right: "kalau … maka …" },
      { left: "雖然…但係…", right: "meskipun … tetapi …" },
      { left: "越嚟越…", right: "semakin lama semakin …" },
    ],
    explanation: "Struktur berpasangan ini adalah inti tata bahasa menengah.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat dengan aspek dan arah:",
    template: "佢 ___ 由香港返 ___ 喇。 (Dia baru saja pulang dari Hong Kong.)",
    blanks: ["啱啱", "嚟"],
    options: ["啱啱", "嚟", "去", "就", "喺", "過"],
    explanation: "'啱啱' (ngaam1 ngaam1) = baru saja. '返嚟' = pulang (kembali ke sini) — 嚟 menunjukkan arah menuju pembicara.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat pasif '我部電話俾人偷咗。' berarti:",
    options: [
      "Saya mencuri HP",
      "HP saya dicuri orang",
      "Saya kehilangan HP",
      "HP saya rusak",
    ],
    correct: 1,
    explanation: "'俾' (bei2) menandai pasif dalam Kanton (setara 被 Mandarin). '俾人偷咗' = dicuri orang.",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi: '佢講廣東話講到好似 ___ 咁。' (Dia berbahasa Kanton sampai seperti penutur asli.)",
    context: "Ungkapan perbandingan 'seperti'.",
    options: ["本地人", "多過", "最", "嘅"],
    correct: "本地人",
    explanation: "'好似 … 咁' = seperti/seolah …. '好似本地人咁' = seperti orang lokal/penutur asli.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa '入鄉隨俗' paling dekat maknanya dengan:",
    options: [
      "Air tenang menghanyutkan",
      "Di mana bumi dipijak, di situ langit dijunjung",
      "Sedia payung sebelum hujan",
      "Besar pasak daripada tiang",
    ],
    correct: 1,
    explanation: "'入鄉隨俗' (jap6 hoeng1 ceoi4 zuk6) = masuk desa ikuti adatnya — menyesuaikan diri dengan kebiasaan setempat.",
  },
];
