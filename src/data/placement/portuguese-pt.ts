// ─────────────────────────────────────────────────────────────────────────────
// PORTUGUESE (Portugal) PLACEMENT TEST — 18 soal, mixed types
// Distribusi: A1×4 · A2×5 · B1×5 · B2×4 (max 45)
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const portuguesePtPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "ptpt1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara mengatakan 'selamat pagi' dalam bahasa Portugis (Portugal)?",
    options: ["Boa noite", "Bom dia", "Boa tarde", "Adeus"],
    correct: 1,
    explanation: "'Bom dia' = selamat pagi. 'Boa tarde' = selamat sore, 'Boa noite' = selamat malam.",
  },
  {
    id: "ptpt2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "a casa", right: "rumah" },
      { left: "a água", right: "air" },
      { left: "o pão", right: "roti" },
      { left: "o gato", right: "kucing" },
    ],
    explanation: "Kosakata benda dasar A1. Nomina bergender: o (maskulin) / a (feminin).",
  },
  {
    id: "ptpt3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Eu ___ estudante.' (Saya seorang mahasiswa.)",
    context: "Konjugasi verba 'ser' untuk 'eu'.",
    options: ["sou", "é", "és", "ser"],
    correct: "sou",
    explanation: "Verba 'ser': eu sou, tu és, ele/ela é. Untuk 'eu' → 'sou'.",
  },
  {
    id: "ptpt4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya suka kopi.",
    tokens: ["gosto", "de", "Eu", "café"],
    correct: ["Eu", "gosto", "de", "café"],
    explanation: "Verba 'gostar' selalu diikuti 'de': 'Eu gosto de café'.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "ptpt5", difficulty: "A2", type: "multiple",
    question: "'Ontem eu ___ no restaurante.' (comer, pretérito untuk 'eu')",
    options: ["como", "comi", "comia", "comerei"],
    correct: 1,
    explanation: "Pretérito perfeito 'comer' untuk 'eu' → 'comi'.",
  },
  {
    id: "ptpt6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat present continuous (PT: estar a + infinitivo):",
    translation: "Saya sedang makan.",
    tokens: ["a", "Estou", "comer"],
    correct: ["Estou", "a", "comer"],
    explanation: "Di Portugal, aksi berlangsung pakai 'estar a + infinitivo': 'estou a comer' (BR: 'estou comendo').",
  },
  {
    id: "ptpt7", difficulty: "A2", type: "missing",
    question: "Ser vs Estar — lengkapi:",
    template: "A minha irmã ___ médica e agora ___ no hospital.",
    blanks: ["é", "está"],
    options: ["é", "está", "são", "estão", "ser", "estar"],
    explanation: "'ser' untuk profesi ('é médica'), 'estar' untuk lokasi/keadaan ('está no hospital').",
  },
  {
    id: "ptpt8", difficulty: "A2", type: "fillChoice",
    question: "'Vou ___ Lisboa amanhã.' (Saya pergi ke Lisboa besok.)",
    context: "Pilih preposisi untuk tujuan (PT lebih pilih 'a').",
    options: ["a", "em", "para", "de"],
    correct: "a",
    explanation: "Di Portugal, 'a' lazim untuk tujuan jangka pendek: 'vou a Lisboa'.",
  },
  {
    id: "ptpt9", difficulty: "A2", type: "multiple",
    question: "'Devias ___ ao médico.' (kamu sebaiknya — saran)",
    options: ["vais", "ir", "irás", "foste"],
    correct: 1,
    explanation: "Setelah modal 'devias' pakai infinitivo → 'ir'. 'Devias ir ao médico'.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "ptpt10", difficulty: "B1", type: "multiple",
    question: "'Se eu tivesse dinheiro, ___ pelo mundo.' (condicional)",
    options: ["viajo", "viajarei", "viajaria", "viajava"],
    correct: 2,
    explanation: "Pengandaian: 'Se + imperfeito do conjuntivo (tivesse), + condicional' → 'viajaria'.",
  },
  {
    id: "ptpt11", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat pretérito perfeito composto:",
    translation: "Akhir-akhir ini saya sudah bekerja banyak.",
    tokens: ["tenho", "Ultimamente", "muito", "trabalhado"],
    correct: ["Ultimamente", "tenho", "trabalhado", "muito"],
    explanation: "Di PT, 'ter + particípio' menyatakan aksi berulang sampai sekarang, bukan sekali di masa lalu.",
  },
  {
    id: "ptpt12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan konektor dengan artinya:",
    pairs: [
      { left: "embora", right: "meskipun" },
      { left: "portanto", right: "oleh karena itu" },
      { left: "contudo", right: "namun" },
      { left: "por isso", right: "karena itu" },
    ],
    explanation: "Konektor wacana penting di B1. 'embora' menuntut conjuntivo.",
  },
  {
    id: "ptpt13", difficulty: "B1", type: "missing",
    question: "Conjuntivo — lengkapi:",
    template: "Espero que ___ bem e que ___ em breve.",
    blanks: ["estejas", "venhas"],
    options: ["estejas", "venhas", "estás", "vens", "estar", "vir"],
    explanation: "Setelah 'espero que' pakai presente do conjuntivo (untuk 'tu'): 'estejas', 'venhas'.",
  },
  {
    id: "ptpt14", difficulty: "B1", type: "fillChoice",
    question: "'É a pessoa ___ me ajudou ontem.' (relativo)",
    context: "Pilih kata ganti relatif.",
    options: ["que", "quem", "qual", "cujo"],
    correct: "que",
    explanation: "'que' adalah relatif paling umum untuk orang & benda. 'a pessoa que me ajudou'.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "ptpt15", difficulty: "B2", type: "multiple",
    question: "'Se eu tivesse sabido, ___.' (condicional composto)",
    options: [
      "agiria de outra forma",
      "teria agido de outra forma",
      "agi de outra forma",
      "agia de outra forma",
    ],
    correct: 1,
    explanation: "Pengandaian lampau: 'Se + pretérito-mais-que-perfeito do conjuntivo, + condicional composto' → 'teria agido'.",
  },
  {
    id: "ptpt16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat dengan ênclise (pronome sesudah verba — khas PT):",
    translation: "Berikan buku itu kepada saya.",
    tokens: ["-me", "Dá", "livro", "o"],
    correct: ["Dá", "-me", "o", "livro"],
    explanation: "Di Portugal, pronome objek lazim melekat di belakang verba (ênclise): 'Dá-me o livro'.",
  },
  {
    id: "ptpt17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi:",
    template: "A nova política vai ___ as consequências, enquanto a antiga apenas as ___.",
    blanks: ["mitigar", "agravaria"],
    options: ["mitigar", "agravaria", "gerar", "reforçar", "estabilizar", "impedir"],
    explanation: "'mitigar' = meredakan, 'agravar' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "ptpt18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menggunakan nominalização (gaya formal)?",
    options: [
      "Ela decidiu rapidamente.",
      "A sua decisão foi rápida.",
      "Ela decide depressa.",
      "Rapidamente, ela decidiu.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'decidir' → nomina 'decisão'. Ciri gaya tulisan formal/akademis.",
  },
];
