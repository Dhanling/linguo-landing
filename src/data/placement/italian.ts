// ─────────────────────────────────────────────────────────────────────────────
// ITALIAN (Italiano) PLACEMENT TEST — 18 soal, mixed types
// Distribusi: A1×4 · A2×5 · B1×5 · B2×4 (max 45)
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const italianPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "it1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara mengatakan 'halo/selamat pagi' dalam bahasa Italia?",
    options: ["Buonanotte", "Buongiorno", "Arrivederci", "Grazie"],
    correct: 1,
    explanation: "'Buongiorno' = selamat pagi/halo. 'Arrivederci' = sampai jumpa, 'Grazie' = terima kasih.",
  },
  {
    id: "it2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "la casa", right: "rumah" },
      { left: "l'acqua", right: "air" },
      { left: "il pane", right: "roti" },
      { left: "il gatto", right: "kucing" },
    ],
    explanation: "Kosakata benda dasar A1. Nomina bergender: il/lo (maskulin) / la (feminin).",
  },
  {
    id: "it3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Io ___ studente.' (Saya seorang mahasiswa.)",
    context: "Konjugasi verba 'essere' untuk 'io'.",
    options: ["sono", "sei", "è", "essere"],
    correct: "sono",
    explanation: "Verba 'essere': io sono, tu sei, lui/lei è. Untuk 'io' → 'sono'.",
  },
  {
    id: "it4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya suka kopi.",
    tokens: ["piace", "il", "Mi", "caffè"],
    correct: ["Mi", "piace", "il", "caffè"],
    explanation: "'Mi piace il caffè'. Struktur 'piacere' mirip 'gustar': mi piace + benda tunggal.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "it5", difficulty: "A2", type: "multiple",
    question: "'Ieri ___ mangiato al ristorante.' (Passato prossimo untuk 'io')",
    options: ["ho", "sono", "hai", "è"],
    correct: 0,
    explanation: "Passato prossimo 'mangiare' pakai 'avere' → 'ho mangiato'. 'essere' untuk verba gerak.",
  },
  {
    id: "it6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat passato prossimo (dgn 'essere'):",
    translation: "Kemarin saya pergi ke sekolah.",
    tokens: ["sono", "Ieri", "a", "andato", "scuola"],
    correct: ["Ieri", "sono", "andato", "a", "scuola"],
    explanation: "Verba gerak 'andare' pakai 'essere': 'sono andato/a'. Partisip setuju gender/jumlah.",
  },
  {
    id: "it7", difficulty: "A2", type: "missing",
    question: "Essere vs Stare/Avere — lengkapi:",
    template: "Mia sorella ___ medico e in questo momento ___ in ospedale.",
    blanks: ["è", "è"],
    options: ["è", "sono", "sta", "ha", "essere", "stare"],
    explanation: "'è medico' (profesi) dan 'è in ospedale' (lokasi) — di Italia lokasi tetap pakai 'essere'.",
  },
  {
    id: "it8", difficulty: "A2", type: "fillChoice",
    question: "'Vado ___ Roma domani.' (Saya pergi ke Roma besok.)",
    context: "Pilih preposisi untuk nama kota.",
    options: ["a", "in", "da", "per"],
    correct: "a",
    explanation: "Untuk kota pakai 'a' → 'a Roma'. 'in' dipakai untuk negara ('in Italia').",
  },
  {
    id: "it9", difficulty: "A2", type: "multiple",
    question: "'Dovresti ___ dal medico.' (Kamu sebaiknya ke dokter.)",
    options: ["vai", "andare", "andrai", "andato"],
    correct: 1,
    explanation: "Setelah modal 'dovresti' pakai infinitif → 'andare'. 'Dovresti andare dal medico'.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "it10", difficulty: "B1", type: "multiple",
    question: "'Se avessi tempo, ___ di più.' (Periodo ipotetico 2)",
    options: ["viaggio", "viaggerò", "viaggerei", "viaggiavo"],
    correct: 2,
    explanation: "Pengandaian: 'Se + congiuntivo imperfetto (avessi), + condizionale' → 'viaggerei'.",
  },
  {
    id: "it11", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat pasif:",
    translation: "Surat itu ditulis kemarin.",
    tokens: ["stata", "La", "scritta", "è", "ieri", "lettera"],
    correct: ["La", "lettera", "è", "stata", "scritta", "ieri"],
    explanation: "Passivo: essere + participio. 'è stata scritta' — partisip setuju feminin dgn 'lettera'.",
  },
  {
    id: "it12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan konektor dengan artinya:",
    pairs: [
      { left: "benché", right: "meskipun" },
      { left: "quindi", right: "maka/jadi" },
      { left: "tuttavia", right: "namun" },
      { left: "perciò", right: "oleh karena itu" },
    ],
    explanation: "Konektor wacana B1. 'benché' menuntut congiuntivo di anak kalimat.",
  },
  {
    id: "it13", difficulty: "B1", type: "missing",
    question: "Congiuntivo — lengkapi:",
    template: "Spero che tu ___ bene e che ___ presto.",
    blanks: ["stia", "venga"],
    options: ["stia", "venga", "stai", "vieni", "stare", "venire"],
    explanation: "Setelah 'spero che' pakai congiuntivo: 'stia' (stare), 'venga' (venire).",
  },
  {
    id: "it14", difficulty: "B1", type: "fillChoice",
    question: "'È la persona ___ mi ha aiutato ieri.' (Relativo)",
    context: "Pilih kata ganti relatif subjek.",
    options: ["che", "cui", "quale", "chi"],
    correct: "che",
    explanation: "'che' relatif tak berubah untuk subjek/objek. 'la persona che mi ha aiutato'.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "it15", difficulty: "B2", type: "multiple",
    question: "'Se lo avessi saputo, ___.' (Periodo ipotetico 3)",
    options: [
      "agirei diversamente",
      "avrei agito diversamente",
      "ho agito diversamente",
      "agivo diversamente",
    ],
    correct: 1,
    explanation: "Tipe 3: 'Se + congiuntivo trapassato, + condizionale passato' → 'avrei agito'.",
  },
  {
    id: "it16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat dengan pronomi combinati:",
    translation: "Saya sudah memberikannya (buku) kepadanya.",
    tokens: ["Glielo", "dato", "ho"],
    correct: ["Glielo", "ho", "dato"],
    explanation: "Gabungan 'gli/le' + 'lo' → 'glielo'. 'Glielo ho dato' = saya sudah memberikannya kepadanya.",
  },
  {
    id: "it17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi:",
    template: "La nuova misura ___ le conseguenze, mentre quella vecchia le ___ soltanto.",
    blanks: ["attenuerà", "aggraverebbe"],
    options: ["attenuerà", "aggraverebbe", "genererà", "rafforzerà", "stabilizzerà", "impedirà"],
    explanation: "'attenuare' = meredakan, 'aggravare' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "it18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menggunakan nominalizzazione (gaya formal)?",
    options: [
      "Ha deciso rapidamente.",
      "La sua decisione è stata rapida.",
      "Lei decide in fretta.",
      "Rapidamente, ha deciso.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'decidere' → nomina 'decisione'. Ciri gaya tulisan formal/akademis.",
  },
];
