import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// KHMER PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// ─────────────────────────────────────────────────────────────────────────────
export const khmerPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Sapaan umum dalam bahasa Khmer adalah:",
    options: [
      "លាហើយ (lea haey)",
      "ជំរាបសួរ (chumreap suor)",
      "អរគុណ (arkoun)",
      "សុំទោស (som toh)",
    ],
    correct: 1,
    explanation: "'ជំរាបសួរ' = salam/halo (sopan). 'លាហើយ' = selamat tinggal, 'អរគុណ' = terima kasih.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Khmer dengan artinya:",
    pairs: [
      { left: "មួយ (muoy)", right: "1" },
      { left: "បី (bei)", right: "3" },
      { left: "ប្រាំ (pram)", right: "5" },
      { left: "ដប់ (dop)", right: "10" },
    ],
    explanation: "Angka dasar មួយ~ដប់ penting untuk harga dan transaksi.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'ខ្ញុំ ___ សិស្ស។' (Saya seorang murid.)",
    context: "Kata kerja 'adalah'.",
    options: ["ជា", "នៅ", "មាន", "អាច"],
    correct: "ជា",
    explanation: "'ជា' (chea) = adalah, menghubungkan dua kata benda. 'នៅ' = berada, 'មាន' = punya, 'អាច' = bisa.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar (SVO):",
    translation: "Saya makan nasi.",
    tokens: ["បាយ", "ខ្ញុំ", "ញ៉ាំ"],
    correct: ["ខ្ញុំ", "ញ៉ាំ", "បាយ"],
    explanation: "Struktur SVO Khmer: Subjek (ខ្ញុំ) + Kata kerja (ញ៉ាំ) + Objek (បាយ). 'ញ៉ាំបាយ' = makan (nasi).",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Untuk menyatakan aksi lampau 'sudah makan', penanda yang tepat:",
    options: [
      "ខ្ញុំញ៉ាំបាយ",
      "ខ្ញុំបានញ៉ាំបាយ",
      "ខ្ញុំនឹងញ៉ាំបាយ",
      "ខ្ញុំកំពុងញ៉ាំបាយ",
    ],
    correct: 1,
    explanation: "'បាន' (ban) di depan kata kerja menandai aksi lampau/sudah. 'នឹង' = akan, 'កំពុង' = sedang.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan keterangan tempat:",
    translation: "Saya belajar bahasa Khmer di sekolah.",
    tokens: ["ភាសាខ្មែរ", "នៅសាលា", "ខ្ញុំ", "រៀន"],
    correct: ["ខ្ញុំ", "រៀន", "ភាសាខ្មែរ", "នៅសាលា"],
    explanation: "'នៅ' + tempat = di …. Keterangan tempat (នៅសាលា) umumnya diletakkan di akhir kalimat.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan kata yang tepat:",
    template: "ហាង ___ នៅម៉ោង ៧ ព្រឹក ___ បិទនៅម៉ោង ៩ យប់។ (Toko buka pukul 7 pagi lalu tutup pukul 9 malam.)",
    blanks: ["បើក", "ហើយ"],
    options: ["បើក", "បិទ", "ហើយ", "នៅ", "មាន", "ជា"],
    explanation: "'បើក' = buka, 'បិទ' = tutup, 'ហើយ' = lalu/dan (penghubung urutan).",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'តើអ្នក ___ និយាយភាសាខ្មែរទេ?' (Apakah kamu bisa berbahasa Khmer?)",
    context: "Modalitas 'bisa'.",
    options: ["អាច", "ត្រូវ", "គួរ", "ធ្លាប់"],
    correct: "អាច",
    explanation: "'អាច … ទេ?' = apakah bisa …? 'អាច' = bisa/mampu. 'ត្រូវ' = harus, 'គួរ' = sebaiknya.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'ថ្វីត្បិតតែភ្លៀង ខ្ញុំនៅតែទៅ។' :",
    options: [
      "Karena hujan, saya pergi",
      "Meskipun hujan, saya tetap pergi",
      "Kalau hujan, saya pergi",
      "Setelah hujan, saya pergi",
    ],
    correct: 1,
    explanation: "'ថ្វីត្បិតតែ …' = meskipun …. 'នៅតែ' = tetap/masih. 'ភ្លៀង' = hujan.",
  },
  {
    id: "q10", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat berandai:",
    translation: "Kalau ada waktu, saya ingin pergi ke Kamboja.",
    tokens: ["ទៅកម្ពុជា", "មានពេល", "ប្រសិនបើ", "ខ្ញុំចង់"],
    correct: ["ប្រសិនបើ", "មានពេល", "ខ្ញុំចង់", "ទៅកម្ពុជា"],
    explanation: "'ប្រសិនបើ …' = kalau …. 'ចង់' = ingin. Klausa syarat mendahului klausa utama.",
  },
  {
    id: "q11", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung dengan artinya:",
    pairs: [
      { left: "ព្រោះ", right: "karena" },
      { left: "ប្រសិនបើ", right: "kalau / jika" },
      { left: "ដើម្បី", right: "supaya / untuk" },
      { left: "ប៉ុន្តែ", right: "tetapi" },
    ],
    explanation: "Kata penghubung ini adalah inti tata bahasa menengah.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat perbandingan:",
    template: "ថ្ងៃនេះក្តៅ ___ ម្សិលមិញ។ នេះជាថ្ងៃដែលក្តៅ ___ ក្នុងសប្តាហ៍នេះ។ (Hari ini lebih panas dari kemarin. Ini hari terpanas minggu ini.)",
    blanks: ["ជាង", "បំផុត"],
    options: ["ជាង", "បំផុត", "ដូច", "ណាស់", "នៅ", "និង"],
    explanation: "'… ជាង' = lebih … daripada (komparatif). '… បំផុត' = paling … (superlatif).",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat 'ទូរស័ព្ទរបស់ខ្ញុំត្រូវបានគេលួច។' berarti:",
    options: [
      "Saya mencuri telepon",
      "Telepon saya dicuri (orang)",
      "Saya menjual telepon",
      "Telepon saya rusak",
    ],
    correct: 1,
    explanation: "'ត្រូវបានគេ + kerja' menandai pasif. 'ត្រូវបានគេលួច' = dicuri orang.",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi: 'គាត់និយាយភាសាខ្មែរ ___ អ្នកនិយាយដើម។' (Dia berbahasa Khmer seperti penutur asli.)",
    context: "Ungkapan perbandingan 'seperti'.",
    options: ["ដូច", "ជាង", "បំផុត", "របស់"],
    correct: "ដូច",
    explanation: "'ដូច' = seperti/serupa. 'និយាយ … ដូចអ្នកនិយាយដើម' = berbicara seperti penutur asli.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa 'ចូលស្រុកគេ ត្រូវធ្វើតាមគេ' paling dekat maknanya dengan:",
    options: [
      "Air tenang menghanyutkan",
      "Di mana bumi dipijak, di situ langit dijunjung",
      "Sedia payung sebelum hujan",
      "Tak ada gading yang tak retak",
    ],
    correct: 1,
    explanation: "'ចូលស្រុកគេ ត្រូវធ្វើតាមគេ' (masuk negeri orang, ikutilah caranya) = menyesuaikan diri dengan adat setempat.",
  },
];
