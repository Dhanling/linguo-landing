import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// URDU PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// Catatan: Urdu ditulis kanan-ke-kiri (RTL). Romanisasi disertakan.
// ─────────────────────────────────────────────────────────────────────────────
export const urduPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Sapaan Islami yang umum dalam bahasa Urdu adalah:",
    options: [
      "خدا حافظ (khudā hāfiz)",
      "السلام علیکم (assalāmu ʿalaikum)",
      "شکریہ (shukriyā)",
      "معاف کیجیے (muʿāf kījiye)",
    ],
    correct: 1,
    explanation: "'السلام علیکم' = salam (halo). 'خدا حافظ' = selamat tinggal, 'شکریہ' = terima kasih.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Urdu dengan artinya:",
    pairs: [
      { left: "ایک (ek)", right: "1" },
      { left: "تین (tīn)", right: "3" },
      { left: "پانچ (pānc)", right: "5" },
      { left: "دس (das)", right: "10" },
    ],
    explanation: "Angka dasar ایک~دس penting untuk harga dan transaksi. Mirip Hindi secara lisan.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'میں طالب علم ___ ۔' (Saya seorang murid.)",
    context: "Kata kerja 'adalah' (untuk 'saya').",
    options: ["ہوں", "ہے", "ہیں", "تھے"],
    correct: "ہوں",
    explanation: "'ہوں' dipakai khusus untuk 'میں' (saya). 'ہے' untuk orang ketiga tunggal, 'ہیں' untuk jamak/hormat.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar (SOV, dibaca kanan→kiri):",
    translation: "Saya makan nasi.",
    tokens: ["چاول", "میں", "کھاتا ہوں"],
    correct: ["میں", "چاول", "کھاتا ہوں"],
    explanation: "Struktur SOV Urdu: Subjek (میں) + Objek (چاول) + Kata kerja (کھاتا ہوں).",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Bentuk lampau 'saya makan' (laki-laki) yang tepat:",
    options: [
      "میں کھاتا ہوں",
      "میں نے کھایا",
      "میں کھاؤں گا",
      "میں کھا رہا ہوں",
    ],
    correct: 1,
    explanation: "'میں نے کھایا' = saya (sudah) makan — memakai penanda ergatif 'نے' pada kerja transitif lampau. 'کھاؤں گا' = akan makan.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan keterangan tempat:",
    translation: "Saya belajar bahasa Urdu di sekolah.",
    tokens: ["اردو", "اسکول میں", "میں", "پڑھتا ہوں"],
    correct: ["میں", "اسکول میں", "اردو", "پڑھتا ہوں"],
    explanation: "'میں' (postposisi) = di/dalam. Keterangan tempat (اسکول میں) diletakkan sebelum objek dan kata kerja.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan postposisi yang tepat:",
    template: "یہ کتاب بچے ___ ہے اور میز ___ ہے۔ (Buku ini milik anak itu dan ada di atas meja.)",
    blanks: ["کی", "پر"],
    options: ["کی", "پر", "میں", "سے", "کو", "کا"],
    explanation: "'کی' = milik (untuk kata benda feminin کتاب). 'پر' = di atas/pada.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'کیا آپ اردو بول ___ ہیں؟' (Apakah Anda bisa berbahasa Urdu?)",
    context: "Modalitas 'bisa' (kemampuan).",
    options: ["سکتے", "چاہتے", "رہے", "گئے"],
    correct: "سکتے",
    explanation: "'بول سکتے ہیں' = bisa berbicara. Pola: akar kerja + سکنا (bisa).",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'بارش کے باوجود میں باہر گیا۔' :",
    options: [
      "Karena hujan, saya keluar",
      "Meskipun hujan, saya tetap keluar",
      "Kalau hujan, saya keluar",
      "Setelah hujan, saya keluar",
    ],
    correct: 1,
    explanation: "'کے باوجود' = meskipun/walaupun. 'بارش کے باوجود' = meskipun hujan.",
  },
  {
    id: "q10", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat berandai:",
    translation: "Kalau ada waktu, saya ingin pergi ke Pakistan.",
    tokens: ["پاکستان جانا", "وقت ہو", "اگر", "تو میں چاہتا ہوں"],
    correct: ["اگر", "وقت ہو", "تو میں چاہتا ہوں", "پاکستان جانا"],
    explanation: "Pasangan 'اگر … تو …' = kalau … maka …. 'چاہتا ہوں' = ingin.",
  },
  {
    id: "q11", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung dengan artinya:",
    pairs: [
      { left: "کیونکہ", right: "karena" },
      { left: "اگر … تو …", right: "kalau … maka …" },
      { left: "تاکہ", right: "supaya / agar" },
      { left: "لیکن", right: "tetapi" },
    ],
    explanation: "Kata penghubung ini adalah inti tata bahasa menengah.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat perbandingan:",
    template: "آج کل ___ زیادہ گرم ہے۔ یہ ہفتے کا ___ گرم دن ہے۔ (Hari ini lebih panas dari kemarin. Ini hari terpanas minggu ini.)",
    blanks: ["سے", "سب سے"],
    options: ["سے", "سب سے", "جیسا", "تک", "بہت", "اور"],
    explanation: "'X سے زیادہ' = lebih … dari X (komparatif). 'سب سے' = paling (superlatif).",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat 'میرا فون چوری ہو گیا۔' berarti:",
    options: [
      "Saya mencuri telepon",
      "Telepon saya dicuri / kecurian",
      "Saya menjual telepon",
      "Telepon saya rusak",
    ],
    correct: 1,
    explanation: "'چوری ہو گیا' = tercuri/dicuri (konstruksi 'ہو جانا' menyatakan kejadian yang menimpa).",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi: 'وہ اردو ایسے بولتا ہے ___ وہ مقامی ہو۔' (Dia berbahasa Urdu seolah penutur asli.)",
    context: "Ungkapan 'seolah-olah'.",
    options: ["جیسے", "کیونکہ", "لیکن", "تاکہ"],
    correct: "جیسے",
    explanation: "'ایسے … جیسے …' = seolah-olah/seperti. 'جیسے وہ مقامی ہو' = seakan dia penutur asli.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa 'جیسا دیس ویسا بھیس' paling dekat maknanya dengan:",
    options: [
      "Air beriak tanda tak dalam",
      "Di mana bumi dipijak, di situ langit dijunjung",
      "Sedia payung sebelum hujan",
      "Berat sama dipikul, ringan sama dijinjing",
    ],
    correct: 1,
    explanation: "'جیسا دیس ویسا بھیس' (sebagaimana negeri, begitulah busana) = menyesuaikan diri dengan adat setempat.",
  },
];
