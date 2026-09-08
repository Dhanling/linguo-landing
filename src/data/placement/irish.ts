// ─────────────────────────────────────────────────────────────────────────────
// IRISH (Gaeilge) PLACEMENT TEST — 18 soal, mixed types
// Distribusi: A1×4 · A2×5 · B1×5 · B2×4 (max 45)
// linguo-patch:placement-irish-v1
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const irishPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "ga1", difficulty: "A1", type: "multiple",
    question: "Seseorang menyapamu dengan 'Dia duit'. Apa jawaban bakunya?",
    options: ["Slán agat", "Dia is Muire duit", "Go raibh maith agat", "Oíche mhaith"],
    correct: 1,
    explanation: "'Dia duit' = 'Tuhan kepadamu'. Balasannya MENAMBAH, bukan mengulang: 'Dia is Muire duit' (Tuhan dan Maria kepadamu).",
  },
  {
    id: "ga2", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Tá ocras ___.' (Saya lapar.)",
    context: "Rasa lapar diletakkan DI ATAS orang, memakai kata depan 'ar'.",
    options: ["agam", "orm", "liom", "dom"],
    correct: "orm",
    explanation: "'Tá ocras orm' harfiahnya 'ada lapar di atas saya'. 'agam' untuk kepemilikan, 'liom' untuk kesukaan.",
  },
  {
    id: "ga3", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "teach", right: "rumah" },
      { left: "uisce", right: "air" },
      { left: "leabhar", right: "buku" },
      { left: "bean", right: "perempuan" },
    ],
    explanation: "Empat kata benda paling dasar. Perhatikan 'bean' bergolongan perempuan → 'an bhean' dengan séimhiú.",
  },
  {
    id: "ga4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya sedang belajar bahasa Irlandia.",
    tokens: ["ag", "mé", "Tá", "Gaeilge", "foghlaim"],
    correct: ["Tá", "mé", "ag", "foghlaim", "Gaeilge"],
    explanation: "Susunan VSO: kata kerja 'Tá' selalu di depan, baru pelakunya. 'ag + foghlaim' = sedang belajar.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "ga5", difficulty: "A2", type: "multiple",
    question: "Mana bentuk yang benar untuk 'mobil kami'?",
    options: ["mo charr", "ár gcarr", "a charr", "do charr"],
    correct: 1,
    explanation: "'ár' (milik kami) membawa URÚ: carr → ár gcarr. 'mo' dan 'do' membawa séimhiú (mo charr = mobilku).",
  },
  {
    id: "ga6", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'Naoi ___ atá sa seomra.' (Ada sembilan kursi di ruangan itu.)",
    context: "Angka 7–10 membawa urú; kata bendanya tetap tunggal.",
    options: ["cathaoir", "gcathaoir", "chathaoir", "cathaoireacha"],
    correct: "gcathaoir",
    explanation: "Angka 2–6 membawa séimhiú (sé chathaoir), 7–10 membawa urú (naoi gcathaoir). Sesudah angka, kata benda TIDAK dijamakkan.",
  },
  {
    id: "ga7", difficulty: "A2", type: "multiple",
    question: "'An bhfuil tú go maith?' — mana jawaban yang benar untuk 'ya'?",
    options: ["Sea", "Tá", "Is ea", "Tá mé"],
    correct: 1,
    explanation: "Bahasa Irlandia tidak punya kata 'ya'. Jawabannya mengulang KATA KERJANYA: 'An bhfuil…?' → 'Tá'. 'Sea' hanya untuk pertanyaan dengan kata kerja 'is'.",
  },
  {
    id: "ga8", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat masa lampau:",
    translation: "Saya pergi ke Galway kemarin.",
    tokens: ["mé", "go", "Chuaigh", "inné", "Gaillimh"],
    correct: ["Chuaigh", "mé", "go", "Gaillimh", "inné"],
    explanation: "'téigh' (pergi) tidak beraturan: bentuk lampaunya 'chuaigh'. Kata kerja tetap di posisi pertama.",
  },
  {
    id: "ga9", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'Ní ___ mé caife.' (Saya tidak minum kopi — kebiasaan.)",
    context: "'ní' membawa séimhiú, tapi huruf hidup tidak bisa dilembutkan.",
    options: ["ólaim", "hólaim", "n-ólaim", "dólaim"],
    correct: "ólaim",
    explanation: "'ní' membawa séimhiú (ní thuigim, ní cheannaím), tetapi kata berawal huruf hidup tidak tersentuh: 'ní ólaim'.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "ga10", difficulty: "B1", type: "multiple",
    question: "Mana bentuk masa depan yang benar dari 'ceannaigh' (membeli) untuk 'saya'?",
    options: ["ceannaím", "cheannaigh mé", "ceannóidh mé", "ceannafaidh mé"],
    correct: 2,
    explanation: "Golongan kedua memakai akhiran -óidh/-eoidh: ceannóidh mé. Golongan pertama memakai -faidh/-fidh: ólfaidh mé.",
  },
  {
    id: "ga11", difficulty: "B1", type: "fillChoice",
    question: "Lengkapi: 'Tá mé i lár na ___.' (Saya di tengah kota.)",
    context: "Sesudah 'i lár' kata benda masuk bentuk kepunyaan (ginideach).",
    options: ["cathair", "chathair", "cathrach", "cathracha"],
    correct: "cathrach",
    explanation: "'cathair' (kota) genitif tunggalnya 'cathrach' — díochlaonadh ke-5. Kata sandangnya berubah dari 'an' menjadi 'na'.",
  },
  {
    id: "ga12", difficulty: "B1", type: "multiple",
    question: "Apa beda 'Tá sé fuar' dan 'Bíonn sé fuar'?",
    options: [
      "Tidak ada bedanya, hanya dialek",
      "'Tá' = sekarang; 'Bíonn' = biasanya/kebiasaan",
      "'Tá' = lampau; 'Bíonn' = sekarang",
      "'Bíonn' lebih sopan",
    ],
    correct: 1,
    explanation: "'Bíonn' adalah aimsir ghnáthláithreach (habitual). 'Tá sé fuar' = dingin SEKARANG; 'Bíonn sé fuar' = biasanya dingin. Inilah asal 'he does be working' dalam bahasa Inggris Irlandia.",
  },
  {
    id: "ga13", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat pengandaian:",
    translation: "Kalau saya punya uang, saya akan membeli rumah.",
    tokens: ["cheannóinn", "Dá", "agam", "airgead", "mbeadh", "teach"],
    correct: ["Dá", "mbeadh", "airgead", "agam", "cheannóinn", "teach"],
    explanation: "'Dá' (kalau, tidak nyata) membawa urú → 'mbeadh', dan induk kalimatnya memakai modh coinníollach 'cheannóinn'.",
  },
  {
    id: "ga14", difficulty: "B1", type: "matching",
    prompt: "Jodohkan bentuk lampau tak beraturan dengan kata dasarnya:",
    pairs: [
      { left: "chonaic", right: "feic (melihat)" },
      { left: "rinne", right: "déan (membuat)" },
      { left: "fuair", right: "faigh (mendapat)" },
      { left: "tháinig", right: "tar (datang)" },
    ],
    explanation: "Empat dari sebelas briathar neamhrialta. Bentuk lampaunya sering tidak menyisakan satu huruf pun dari kata dasarnya.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "ga15", difficulty: "B2", type: "multiple",
    question: "Dalam 'Go raibh maith agat', bentuk apa 'raibh' itu?",
    options: [
      "Aimsir chaite (masa lampau)",
      "Modh foshuiteach (bentuk harapan)",
      "Modh coinníollach (pengandaian)",
      "Aimsir ghnáthláithreach",
    ],
    correct: 1,
    explanation: "Meskipun 'raibh' juga muncul di masa lampau ('ní raibh mé'), di sini ia foshuiteach láithreach: 'semoga ADA kebaikan padamu'.",
  },
  {
    id: "ga16", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi kalimat penegas: '___ Seán a rinne é.' (Seán-lah yang melakukannya.)",
    context: "Susunan cleft memakai kata kerja penyambung 'is' plus kata ganti.",
    options: ["Tá", "Is é", "Bhí", "Atá"],
    correct: "Is é",
    explanation: "Cleft khas Irlandia: 'Is é X a rinne é'. Susunan inilah yang melahirkan 'It's tired I am' dalam bahasa Inggris Irlandia.",
  },
  {
    id: "ga17", difficulty: "B2", type: "multiple",
    question: "'Labhraítear Gaeilge anseo.' Bentuk 'labhraítear' itu apa?",
    options: [
      "Bentuk jamak orang ketiga",
      "Saorbhriathar — kalimat tanpa pelaku",
      "Modh ordaitheach (perintah)",
      "Aidiacht bhriathartha",
    ],
    correct: 1,
    explanation: "Saorbhriathar (autonomous verb) menyatakan perbuatan tanpa menyebut pelakunya: 'Bahasa Irlandia dipakai di sini'. Sangat sering di papan nama dan aturan.",
  },
  {
    id: "ga18", difficulty: "B2", type: "multiple",
    question: "Mana yang BENAR menurut An Caighdeán Oifigiúil?",
    options: ["ag an ndoras", "don bhord", "faoi an mbord", "ár carr"],
    correct: 1,
    explanation: "'don' dan 'den' membawa SÉIMHIÚ (don bhord, den fhocal). Sesudah kata depan + 'an', huruf d dan t tidak di-urú → 'ag an doras'; 'faoi an' luluh jadi 'faoin'; 'ár' membawa urú → 'ár gcarr'.",
  },
];
