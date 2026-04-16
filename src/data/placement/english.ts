// English placement test — 15 questions progressing A1 → B2
// Each question has a difficulty level that contributes to scoring

export type QuestionType = "multiple" | "fill" | "order";
export type Difficulty = "A1" | "A2" | "B1" | "B2";

export interface Question {
  id: string;
  difficulty: Difficulty;
  type: QuestionType;
  question: string;
  context?: string;
  options?: string[];
  correct: string | number;      // index for multiple, string for fill
  explanation: string;
}

export const englishPlacementTest: Question[] = [
  // ===== A1 (3 questions) =====
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "What is the correct greeting for the morning?",
    options: ["Good night", "Good morning", "Good evening", "Goodbye"],
    correct: 1,
    explanation: "'Good morning' is used until about noon.",
  },
  {
    id: "q2", difficulty: "A1", type: "multiple",
    question: "She ___ a student.",
    options: ["am", "is", "are", "be"],
    correct: 1,
    explanation: "Subject 'she' uses 'is' in the present tense of 'to be'.",
  },
  {
    id: "q3", difficulty: "A1", type: "fill",
    question: "Complete: 'I have ___ apple and ___ orange.'",
    context: "Use the correct articles (a / an).",
    correct: "an/an",
    explanation: "Both 'apple' and 'orange' start with vowel sounds, so use 'an'.",
  },

  // ===== A2 (4 questions) =====
  {
    id: "q4", difficulty: "A2", type: "multiple",
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
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Choose the comparative form: 'My house is ___ than yours.'",
    options: ["big", "bigger", "biggest", "more big"],
    correct: 1,
    explanation: "Short adjectives take -er: big → bigger.",
  },
  {
    id: "q6", difficulty: "A2", type: "multiple",
    question: "Which modal verb is correct for giving advice?",
    context: "'You ___ see a doctor if you feel sick.'",
    options: ["must", "can", "should", "will"],
    correct: 2,
    explanation: "'Should' is used for advice or recommendations.",
  },
  {
    id: "q7", difficulty: "A2", type: "fill",
    question: "Complete: 'I have lived here ___ five years.'",
    context: "Use 'for' or 'since'.",
    correct: "for",
    explanation: "Use 'for' with a duration (5 years), 'since' with a point in time (2020).",
  },

  // ===== B1 (4 questions) =====
  {
    id: "q8", difficulty: "B1", type: "multiple",
    question: "Which sentence uses the Present Perfect correctly?",
    options: [
      "I have seen that movie last week.",
      "I saw that movie already.",
      "I have already seen that movie.",
      "I am seeing that movie already.",
    ],
    correct: 2,
    explanation: "Present Perfect with 'already' for recent past connected to now. Don't mix with specific past time markers.",
  },
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Choose the correct passive form: 'The letter ___ yesterday.'",
    options: ["wrote", "was written", "has written", "is writing"],
    correct: 1,
    explanation: "Passive past simple: was/were + past participle. 'Write' → 'written'.",
  },
  {
    id: "q10", difficulty: "B1", type: "multiple",
    question: "Second conditional: 'If I ___ rich, I would travel the world.'",
    options: ["am", "was", "were", "will be"],
    correct: 2,
    explanation: "In the second conditional, 'were' is used for all subjects (I/he/she/it) in formal English.",
  },
  {
    id: "q11", difficulty: "B1", type: "fill",
    question: "Reported speech: She said, 'I am tired.' → She said that she ___ tired.",
    context: "Shift the tense appropriately.",
    correct: "was",
    explanation: "In reported speech, present simple 'am' shifts to past simple 'was'.",
  },

  // ===== B2 (4 questions) =====
  {
    id: "q12", difficulty: "B2", type: "multiple",
    question: "Which is the correct third conditional?",
    options: [
      "If I knew, I would have told you.",
      "If I had known, I would have told you.",
      "If I have known, I would tell you.",
      "If I would know, I had told you.",
    ],
    correct: 1,
    explanation: "Third conditional: If + past perfect, would have + past participle — for unreal past situations.",
  },
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Choose the sentence with correct inversion for emphasis:",
    options: [
      "Never I have seen such a view.",
      "Never have I seen such a view.",
      "I have never seen such a view.",
      "I never have seen such a view.",
    ],
    correct: 1,
    explanation: "After negative adverbs like 'never', we invert the subject and auxiliary verb for emphasis.",
  },
  {
    id: "q14", difficulty: "B2", type: "multiple",
    question: "Which word means 'to make something less intense'?",
    options: ["intensify", "amplify", "mitigate", "exacerbate"],
    correct: 2,
    explanation: "'Mitigate' means to make less severe. 'Exacerbate' is the opposite — to make worse.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Which sentence demonstrates nominalization (converting verbs/adjectives to nouns)?",
    options: [
      "She decided quickly.",
      "Her decision was quick.",
      "She quickly made a choice.",
      "Quickly, she decided.",
    ],
    correct: 1,
    explanation: "Nominalization: 'decided' (verb) → 'decision' (noun). Common in formal/academic writing.",
  },
];

// Scoring weights — higher difficulty gives more points
export const DIFFICULTY_POINTS: Record<Difficulty, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
};

// Score thresholds to determine final level
// Max possible: 3*1 + 4*2 + 4*3 + 4*4 = 3 + 8 + 12 + 16 = 39
export function determineLevel(score: number): {
  level: string;
  sublevel: string;
  label: string;
  description: string;
  startChapter: string;
  estimationMonths: number;
} {
  if (score <= 4) return {
    level: "A1", sublevel: "A1.1", label: "Pemula Awal",
    description: "Kamu masih di tahap fondasi. Mulai dari dasar akan bangun trust-mu dengan Bahasa Inggris.",
    startChapter: "Chapter 1: First Steps", estimationMonths: 12,
  };
  if (score <= 8) return {
    level: "A1", sublevel: "A1.2", label: "Pemula Berkembang",
    description: "Kamu sudah tau dasar — greetings, kata kerja sederhana. Siap lanjut ke daily life vocabulary.",
    startChapter: "Chapter 2: Daily Life", estimationMonths: 11,
  };
  if (score <= 12) return {
    level: "A1", sublevel: "A1.3", label: "Pemula Lanjutan",
    description: "Foundasi A1 sudah baik. Tinggal polish ke percakapan sosial dan transisi ke past tense.",
    startChapter: "Chapter 3: Social Basics", estimationMonths: 10,
  };
  if (score <= 16) return {
    level: "A2", sublevel: "A2.1", label: "Pra-Menengah Awal",
    description: "Kamu sudah punya dasar kuat. Saatnya naik ke past tense dan vocabulary yang lebih luas.",
    startChapter: "A2 Chapter 1: Beyond Basics", estimationMonths: 9,
  };
  if (score <= 20) return {
    level: "A2", sublevel: "A2.2", label: "Pra-Menengah Berkembang",
    description: "Past tense sudah lumayan. Fokus selanjutnya: travel, work, ekspresi diri.",
    startChapter: "A2 Chapter 2: Travel & Work", estimationMonths: 8,
  };
  if (score <= 24) return {
    level: "B1", sublevel: "B1.1", label: "Menengah Awal",
    description: "Impressive! Kamu udah di ambang fluency. Present Perfect, passive voice — siap ditingkatkan.",
    startChapter: "B1 Chapter 1: Fluency Foundations", estimationMonths: 6,
  };
  if (score <= 28) return {
    level: "B1", sublevel: "B1.2", label: "Menengah Berkembang",
    description: "Level B1 menengah. Kamu sudah bisa diskusi topik kompleks — tinggal polish akurasi.",
    startChapter: "B1 Chapter 2: Cultural Fluency", estimationMonths: 5,
  };
  if (score <= 32) return {
    level: "B1", sublevel: "B1.5", label: "Menengah Mahir",
    description: "Kamu nyaris upper intermediate. Tinggal naik satu level lagi untuk kesiapan tes internasional.",
    startChapter: "B1 Chapter 5: Professional Bridge", estimationMonths: 4,
  };
  if (score <= 36) return {
    level: "B2", sublevel: "B2.1", label: "Menengah Atas",
    description: "Upper intermediate — kamu udah fluent. Fokus ke ekspresi advanced, academic, business.",
    startChapter: "B2 Chapter 1: Advanced Expression", estimationMonths: 3,
  };
  return {
    level: "B2", sublevel: "B2.7", label: "Menengah Atas Mahir",
    description: "Wah, level kamu mendekati C1! Kelas B2 terakhir kami fokus ke persiapan IELTS/TOEFL — langsung target score tinggi.",
    startChapter: "B2 Chapter 7: Test Prep (IELTS/TOEFL)", estimationMonths: 2,
  };
}
