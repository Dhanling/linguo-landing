// ─────────────────────────────────────────────────────────────────────────────
// PORTUGUESE (Brasil) PLACEMENT TEST — 18 soal, mixed types
// Distribusi: A1×4 · A2×5 · B1×5 · B2×4 (max 45)
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const portugueseBrPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "ptbr1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara mengatakan 'selamat pagi' dalam bahasa Portugis (Brasil)?",
    options: ["Boa noite", "Bom dia", "Boa tarde", "Tchau"],
    correct: 1,
    explanation: "'Bom dia' = selamat pagi. 'Boa tarde' = selamat sore, 'Boa noite' = selamat malam.",
  },
  {
    id: "ptbr2", difficulty: "A1", type: "matching",
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
    id: "ptbr3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Eu ___ estudante.' (Saya seorang mahasiswa.)",
    context: "Konjugasi verba 'ser' untuk 'eu'.",
    options: ["sou", "é", "és", "ser"],
    correct: "sou",
    explanation: "Verba 'ser': eu sou, você é, ele/ela é. Untuk 'eu' → 'sou'.",
  },
  {
    id: "ptbr4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya gosto kopi. (Saya suka kopi.)",
    tokens: ["gosto", "de", "Eu", "café"],
    correct: ["Eu", "gosto", "de", "café"],
    explanation: "Verba 'gostar' selalu diikuti 'de': 'Eu gosto de café'.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "ptbr5", difficulty: "A2", type: "multiple",
    question: "'Ontem eu ___ no restaurante.' (comer, pretérito untuk 'eu')",
    options: ["como", "comi", "comia", "comerei"],
    correct: 1,
    explanation: "Pretérito perfeito 'comer' untuk 'eu' → 'comi' (aksi selesai di masa lampau).",
  },
  {
    id: "ptbr6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat pretérito:",
    translation: "Kemarin saya pergi ke sekolah.",
    tokens: ["fui", "Ontem", "à", "eu", "escola"],
    correct: ["Ontem", "eu", "fui", "à", "escola"],
    explanation: "'ir' di pretérito untuk 'eu' → 'fui'. 'à' = a + a (ke sekolah/escola feminin).",
  },
  {
    id: "ptbr7", difficulty: "A2", type: "missing",
    question: "Ser vs Estar — lengkapi:",
    template: "Minha irmã ___ médica e agora ___ no hospital.",
    blanks: ["é", "está"],
    options: ["é", "está", "são", "estão", "ser", "estar"],
    explanation: "'ser' untuk profesi ('é médica'), 'estar' untuk lokasi/keadaan sementara ('está no hospital').",
  },
  {
    id: "ptbr8", difficulty: "A2", type: "fillChoice",
    question: "'Eu vou ___ São Paulo amanhã.' (Saya pergi ke São Paulo besok.)",
    context: "Pilih preposisi untuk tujuan.",
    options: ["a", "em", "para", "de"],
    correct: "para",
    explanation: "Di Portugis Brasil, 'para' umum untuk tujuan: 'vou para São Paulo'.",
  },
  {
    id: "ptbr9", difficulty: "A2", type: "multiple",
    question: "'Você ___ ir ao médico.' (kamu sebaiknya — saran)",
    options: ["vai", "deveria", "quer", "pode"],
    correct: 1,
    explanation: "'deveria' (condicional dari dever) menyatakan saran, mirip 'should'.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "ptbr10", difficulty: "B1", type: "multiple",
    question: "'Se eu tivesse dinheiro, ___ pelo mundo.' (condicional)",
    options: ["viajo", "viajarei", "viajaria", "viajava"],
    correct: 2,
    explanation: "Pengandaian: 'Se + imperfeito do subjuntivo (tivesse), + futuro do pretérito' → 'viajaria'.",
  },
  {
    id: "ptbr11", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat pretérito perfeito composto:",
    translation: "Saya belum pernah melihat esse filme.",
    tokens: ["tenho", "Nunca", "visto", "esse", "filme"],
    correct: ["Nunca", "tenho", "visto", "esse", "filme"],
    explanation: "Pretérito perfeito composto: 'ter' (tenho) + particípio (visto). Menekankan pengalaman.",
  },
  {
    id: "ptbr12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan konektor dengan artinya:",
    pairs: [
      { left: "embora", right: "meskipun" },
      { left: "portanto", right: "oleh karena itu" },
      { left: "no entanto", right: "namun" },
      { left: "por isso", right: "karena itu" },
    ],
    explanation: "Konektor wacana penting di B1. 'embora' menuntut subjuntivo.",
  },
  {
    id: "ptbr13", difficulty: "B1", type: "missing",
    question: "Subjuntivo — lengkapi:",
    template: "Espero que você ___ bem e que ___ logo.",
    blanks: ["esteja", "venha"],
    options: ["esteja", "venha", "está", "vem", "estar", "vir"],
    explanation: "Setelah 'espero que' pakai presente do subjuntivo: 'esteja', 'venha'.",
  },
  {
    id: "ptbr14", difficulty: "B1", type: "fillChoice",
    question: "'É a pessoa ___ me ajudou ontem.' (relativo)",
    context: "Pilih kata ganti relatif.",
    options: ["que", "quem", "qual", "cujo"],
    correct: "que",
    explanation: "'que' adalah relatif paling umum untuk orang & benda. 'a pessoa que me ajudou'.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "ptbr15", difficulty: "B2", type: "multiple",
    question: "'Se eu tivesse sabido, ___.' (condicional composto)",
    options: [
      "agiria diferente",
      "teria agido diferente",
      "agi diferente",
      "agia diferente",
    ],
    correct: 1,
    explanation: "Pengandaian lampau: 'Se + pretérito-mais-que-perfeito do subjuntivo, + futuro do pretérito composto' → 'teria agido'.",
  },
  {
    id: "ptbr16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat dengan mesóclise/pronome (BR informal):",
    translation: "Saya já te disse isso. (Saya sudah bilang itu ke kamu.)",
    tokens: ["te", "Eu", "isso", "disse", "já"],
    correct: ["Eu", "já", "te", "disse", "isso"],
    explanation: "Di Brasil, pronome objek 'te' lazim diletakkan sebelum verba: 'Eu já te disse isso'.",
  },
  {
    id: "ptbr17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi:",
    template: "A nova política vai ___ as consequências, enquanto a antiga apenas as ___.",
    blanks: ["mitigar", "agravaria"],
    options: ["mitigar", "agravaria", "gerar", "reforçar", "estabilizar", "impedir"],
    explanation: "'mitigar' = meredakan, 'agravar' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "ptbr18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menggunakan nominalização (gaya formal)?",
    options: [
      "Ela decidiu rapidamente.",
      "A decisão dela foi rápida.",
      "Ela decide rápido.",
      "Rapidamente, ela decidiu.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'decidir' → nomina 'decisão'. Ciri gaya tulisan formal/akademis.",
  },
];
