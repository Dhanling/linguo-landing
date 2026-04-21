// ─────────────────────────────────────────────────────────────────────────────
// Extended placement test data types + English questions
// v2: added dragDrop, missing, matching question types for gamification
// ─────────────────────────────────────────────────────────────────────────────

export type QuestionType = "multiple" | "fill" | "fillChoice" | "dragDrop" | "missing" | "matching";
export type Difficulty = "A1" | "A2" | "B1" | "B2";

// ── Base interface (common fields) ──────────────────────────────────────────
interface BaseQuestion {
  id: string;
  difficulty: Difficulty;
  explanation: string;
  tip?: string;
}

// ── Multiple choice (existing) ──────────────────────────────────────────────
export interface MultipleQuestion extends BaseQuestion {
  type: "multiple";
  question: string;
  options: string[];
  correct: number;
}

// ── Fill in the blank via typing (existing) ─────────────────────────────────
export interface FillQuestion extends BaseQuestion {
  type: "fill";
  question: string;
  context?: string;
  correct: string;
}

// ── Fill in the blank via button options (NEW — like fill but click instead of type) ──
export interface FillChoiceQuestion extends BaseQuestion {
  type: "fillChoice";
  question: string;
  context?: string;
  options: string[];   // the button options (includes correct + distractors)
  correct: string;     // must match one of options
}

// ── Drag-drop: susun token jadi kalimat benar (Duolingo-style) ──────────────
export interface DragDropQuestion extends BaseQuestion {
  type: "dragDrop";
  prompt: string;               // instruksi untuk siswa
  translation: string;          // kalimat dalam bahasa asal (misal Indonesia)
  tokens: string[];             // token acak yang harus disusun (sudah di-shuffle di component)
  correct: string[];            // urutan benar
}

// ── Missing: kalimat dengan multiple blanks, pilih dari word bank ───────────
export interface MissingQuestion extends BaseQuestion {
  type: "missing";
  question: string;             // instruksi
  template: string;             // kalimat dengan ___ sebagai placeholder tiap blank
  blanks: string[];             // jawaban benar per blank, in order
  options: string[];            // word bank (berisi blanks + distractors)
}

// ── Matching: jodohkan kata dengan artinya ──────────────────────────────────
export interface MatchingPair {
  left: string;
  right: string;
}
export interface MatchingQuestion extends BaseQuestion {
  type: "matching";
  prompt: string;
  pairs: MatchingPair[];
}

// ── Discriminated union ─────────────────────────────────────────────────────
export type Question =
  | MultipleQuestion
  | FillQuestion
  | FillChoiceQuestion
  | DragDropQuestion
  | MissingQuestion
  | MatchingQuestion;


// ─────────────────────────────────────────────────────────────────────────────
// ENGLISH PLACEMENT TEST (v2 — 18 questions, mixed types)
// A1: 4 soal · A2: 5 soal · B1: 5 soal · B2: 4 soal
// ─────────────────────────────────────────────────────────────────────────────
export const englishPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "What is the correct greeting for the morning?",
    options: ["Good night", "Good morning", "Good evening", "Goodbye"],
    correct: 1,
    explanation: "'Good morning' is used until about noon.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Match the words with their Indonesian meanings:",
    pairs: [
      { left: "happy", right: "bahagia" },
      { left: "sad", right: "sedih" },
      { left: "angry", right: "marah" },
      { left: "tired", right: "lelah" },
    ],
    explanation: "Kosakata emosi dasar level A1 — paling penting untuk daily conversation.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Complete: 'I have ___ apple.'",
    context: "Pilih artikel yang tepat.",
    options: ["a", "an", "the", "some"],
    correct: "an",
    explanation: "'Apple' starts with a vowel sound, so use 'an'.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat lengkap:",
    translation: "Dia adalah seorang guru.",
    tokens: ["is", "She", "teacher", "a"],
    correct: ["She", "is", "a", "teacher"],
    explanation: "Struktur dasar: Subject + be (is/am/are) + a/an + noun.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Which sentence is in the past tense?",
    options: [
      "I go to school every day.",
      "I am going to school now.",
      "I went to school yesterday.",
      "I will go to school tomorrow.",
    ],
    correct: 2,
    explanation: "'Went' is the past simple form of 'go'.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun menjadi kalimat past simple:",
    translation: "Kemarin saya pergi ke pasar.",
    tokens: ["went", "market", "I", "yesterday", "the", "to"],
    correct: ["I", "went", "to", "the", "market", "yesterday"],
    explanation: "Past simple: Subject + verb-2 + object + time marker.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan kata yang tepat:",
    template: "She ___ coffee every morning, but today she ___ tea.",
    blanks: ["drinks", "is drinking"],
    options: ["drinks", "drink", "drinking", "is drinking", "drank", "has drunk"],
    explanation: "Present simple untuk rutinitas, present continuous untuk aktivitas sekarang.",
  },
  {
    id: "q8", difficulty: "A2", type: "multiple",
    question: "'You ___ see a doctor if you feel sick.'",
    options: ["must", "can", "should", "will"],
    correct: 2,
    explanation: "'Should' is used for advice.",
  },
  {
    id: "q9", difficulty: "A2", type: "fillChoice",
    question: "'I have lived here ___ five years.'",
    context: "Pilih preposisi yang tepat.",
    options: ["for", "since", "from", "during"],
    correct: "for",
    explanation: "Use 'for' with a duration, 'since' with a point in time.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q10", difficulty: "B1", type: "multiple",
    question: "Which sentence uses Present Perfect correctly?",
    options: [
      "I have seen that movie last week.",
      "I saw that movie already.",
      "I have already seen that movie.",
      "I am seeing that movie already.",
    ],
    correct: 2,
    explanation: "Present Perfect with 'already' for recent past. Don't mix with specific past time markers.",
  },
  {
    id: "q11", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat passive voice:",
    translation: "Surat itu ditulis kemarin.",
    tokens: ["written", "was", "The", "yesterday", "letter"],
    correct: ["The", "letter", "was", "written", "yesterday"],
    explanation: "Passive past: The + object + was/were + past participle + time.",
  },
  {
    id: "q12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan phrasal verb dengan artinya:",
    pairs: [
      { left: "give up", right: "menyerah" },
      { left: "look after", right: "menjaga" },
      { left: "run out of", right: "kehabisan" },
      { left: "put off", right: "menunda" },
    ],
    explanation: "Phrasal verbs adalah ciri khas level B1. Sering tidak bisa diterjemahkan kata-per-kata.",
  },
  {
    id: "q13", difficulty: "B1", type: "missing",
    question: "Second conditional — lengkapi dengan kata yang tepat:",
    template: "If I ___ rich, I ___ travel the world.",
    blanks: ["were", "would"],
    options: ["was", "were", "am", "would", "will", "had"],
    explanation: "Second conditional: If + past simple (were untuk semua subjek di formal English), would + verb.",
  },
  {
    id: "q14", difficulty: "B1", type: "fillChoice",
    question: "Reported: She said, 'I am tired.' = She said she ___ tired.",
    context: "Shift tense untuk reported speech.",
    options: ["am", "was", "is", "were"],
    correct: "was",
    explanation: "Present simple 'am' shifts to past simple 'was' in reported speech.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Which is the correct third conditional?",
    options: [
      "If I knew, I would have told you.",
      "If I had known, I would have told you.",
      "If I have known, I would tell you.",
      "If I would know, I had told you.",
    ],
    correct: 1,
    explanation: "Third conditional: If + past perfect, would have + past participle.",
  },
  {
    id: "q16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat dengan inversi formal (untuk penekanan):",
    translation: "Belum pernah saya melihat pemandangan seperti itu.",
    tokens: ["I", "seen", "a", "such", "Never", "have", "view"],
    correct: ["Never", "have", "I", "seen", "such", "a", "view"],
    explanation: "Setelah adverb negatif ('never') di awal kalimat, invert subject dan auxiliary verb.",
  },
  {
    id: "q17", difficulty: "B2", type: "missing",
    question: "Lengkapi kalimat dengan kata akademis yang tepat:",
    template: "The new policy will ___ the impact, while the old one would only ___ it.",
    blanks: ["mitigate", "exacerbate"],
    options: ["intensify", "amplify", "mitigate", "exacerbate", "generate", "stabilize"],
    explanation: "'Mitigate' = mengurangi. 'Exacerbate' = memperparah. Pair antonim penting di B2 academic English.",
  },
  {
    id: "q18", difficulty: "B2", type: "multiple",
    question: "Which demonstrates nominalization?",
    options: [
      "She decided quickly.",
      "Her decision was quick.",
      "She quickly made a choice.",
      "Quickly, she decided.",
    ],
    correct: 1,
    explanation: "Nominalization: verb 'decided' → noun 'decision'. Important for formal/academic writing.",
  },
];


// ─────────────────────────────────────────────────────────────────────────────
// SCORING
// ─────────────────────────────────────────────────────────────────────────────
export const DIFFICULTY_POINTS: Record<Difficulty, number> = {
  A1: 1, A2: 2, B1: 3, B2: 4,
};

// Max score: 4×1 + 5×2 + 5×3 + 4×4 = 4 + 10 + 15 + 16 = 45

export function determineLevel(score: number): {
  level: string; sublevel: string; label: string;
  description: string; startChapter: string; estimationMonths: number;
} {
  if (score <= 5)  return { level: "A1", sublevel: "A1.1", label: "Pemula Awal", description: "Kamu masih di tahap fondasi. Mulai dari dasar akan bangun trust-mu dengan Bahasa Inggris.", startChapter: "Chapter 1: First Steps", estimationMonths: 10 };
  if (score <= 10) return { level: "A1", sublevel: "A1.2", label: "Pemula Berkembang", description: "Kamu sudah tau dasar. Siap lanjut ke daily life vocabulary.", startChapter: "Chapter 2: Daily Life", estimationMonths: 9 };
  if (score <= 14) return { level: "A1", sublevel: "A1.3", label: "Pemula Lanjutan", description: "Fondasi A1 sudah baik. Tinggal polish ke percakapan sosial.", startChapter: "Chapter 3: Social Basics", estimationMonths: 8 };
  if (score <= 19) return { level: "A2", sublevel: "A2.1", label: "Pra-Menengah Awal", description: "Kamu punya dasar kuat. Saatnya naik ke past tense.", startChapter: "A2 Chapter 1: Beyond Basics", estimationMonths: 7 };
  if (score <= 23) return { level: "A2", sublevel: "A2.2", label: "Pra-Menengah Berkembang", description: "Past tense sudah lumayan. Fokus: travel, work, ekspresi diri.", startChapter: "A2 Chapter 2: Travel & Work", estimationMonths: 6 };
  if (score <= 28) return { level: "B1", sublevel: "B1.1", label: "Menengah Awal", description: "Impressive! Kamu di ambang fluency.", startChapter: "B1 Chapter 1: Fluency Foundations", estimationMonths: 5 };
  if (score <= 33) return { level: "B1", sublevel: "B1.2", label: "Menengah Berkembang", description: "Level B1 menengah. Tinggal polish akurasi.", startChapter: "B1 Chapter 2: Cultural Fluency", estimationMonths: 4 };
  if (score <= 37) return { level: "B1", sublevel: "B1.5", label: "Menengah Mahir", description: "Nyaris upper intermediate.", startChapter: "B1 Chapter 5: Professional Bridge", estimationMonths: 3 };
  if (score <= 42) return { level: "B2", sublevel: "B2.1", label: "Menengah Atas", description: "Upper intermediate. Fokus ke ekspresi advanced, academic, business.", startChapter: "B2 Chapter 1: Advanced Expression", estimationMonths: 3 };
  return             { level: "B2", sublevel: "B2.7", label: "Menengah Atas Mahir", description: "Level mendekati C1! Langsung target score tinggi IELTS/TOEFL.", startChapter: "B2 Chapter 7: Test Prep (IELTS/TOEFL)", estimationMonths: 2 };
}
