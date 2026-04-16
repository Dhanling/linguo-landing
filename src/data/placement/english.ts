export type QuestionType = "multiple" | "fill";
export type Difficulty = "A1" | "A2" | "B1" | "B2";

export interface Question {
  id: string;
  difficulty: Difficulty;
  type: QuestionType;
  question: string;
  context?: string;
  options?: string[];
  correct: string | number;
  explanation: string;
}

export const englishPlacementTest: Question[] = [
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
    explanation: "Subject 'she' uses 'is' in present tense of 'to be'.",
  },
  {
    id: "q3", difficulty: "A1", type: "fill",
    question: "Complete: 'I have ___ apple.'",
    context: "Use 'a' or 'an'.",
    correct: "an",
    explanation: "'Apple' starts with a vowel sound, so use 'an'.",
  },
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
    question: "Choose the comparative: 'My house is ___ than yours.'",
    options: ["big", "bigger", "biggest", "more big"],
    correct: 1,
    explanation: "Short adjectives take -er: big → bigger.",
  },
  {
    id: "q6", difficulty: "A2", type: "multiple",
    question: "'You ___ see a doctor if you feel sick.'",
    options: ["must", "can", "should", "will"],
    correct: 2,
    explanation: "'Should' is used for advice.",
  },
  {
    id: "q7", difficulty: "A2", type: "fill",
    question: "'I have lived here ___ five years.'",
    context: "Use 'for' or 'since'.",
    correct: "for",
    explanation: "Use 'for' with a duration, 'since' with a point in time.",
  },
  {
    id: "q8", difficulty: "B1", type: "multiple",
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
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Passive: 'The letter ___ yesterday.'",
    options: ["wrote", "was written", "has written", "is writing"],
    correct: 1,
    explanation: "Passive past: was/were + past participle.",
  },
  {
    id: "q10", difficulty: "B1", type: "multiple",
    question: "Second conditional: 'If I ___ rich, I would travel.'",
    options: ["am", "was", "were", "will be"],
    correct: 2,
    explanation: "Second conditional uses 'were' for all subjects in formal English.",
  },
  {
    id: "q11", difficulty: "B1", type: "fill",
    question: "Reported: She said, 'I am tired.' = She said she ___ tired.",
    context: "Shift tense.",
    correct: "was",
    explanation: "Present simple 'am' shifts to past simple 'was'.",
  },
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
    explanation: "Third conditional: If + past perfect, would have + past participle.",
  },
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Correct inversion for emphasis:",
    options: [
      "Never I have seen such a view.",
      "Never have I seen such a view.",
      "I have never seen such a view.",
      "I never have seen such a view.",
    ],
    correct: 1,
    explanation: "After negative adverbs like 'never', invert subject and auxiliary.",
  },
  {
    id: "q14", difficulty: "B2", type: "multiple",
    question: "Which word means 'to make less intense'?",
    options: ["intensify", "amplify", "mitigate", "exacerbate"],
    correct: 2,
    explanation: "'Mitigate' means to make less severe. 'Exacerbate' is opposite.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Which demonstrates nominalization?",
    options: [
      "She decided quickly.",
      "Her decision was quick.",
      "She quickly made a choice.",
      "Quickly, she decided.",
    ],
    correct: 1,
    explanation: "Nominalization: 'decided' (verb) to 'decision' (noun).",
  },
];

export const DIFFICULTY_POINTS: Record<Difficulty, number> = {
  A1: 1, A2: 2, B1: 3, B2: 4,
};

export function determineLevel(score: number): {
  level: string; sublevel: string; label: string;
  description: string; startChapter: string; estimationMonths: number;
} {
  if (score <= 4)  return { level: "A1", sublevel: "A1.1", label: "Pemula Awal", description: "Kamu masih di tahap fondasi. Mulai dari dasar akan bangun trust-mu dengan Bahasa Inggris.", startChapter: "Chapter 1: First Steps", estimationMonths: 10 };
  if (score <= 8)  return { level: "A1", sublevel: "A1.2", label: "Pemula Berkembang", description: "Kamu sudah tau dasar. Siap lanjut ke daily life vocabulary.", startChapter: "Chapter 2: Daily Life", estimationMonths: 9 };
  if (score <= 12) return { level: "A1", sublevel: "A1.3", label: "Pemula Lanjutan", description: "Fondasi A1 sudah baik. Tinggal polish ke percakapan sosial.", startChapter: "Chapter 3: Social Basics", estimationMonths: 8 };
  if (score <= 16) return { level: "A2", sublevel: "A2.1", label: "Pra-Menengah Awal", description: "Kamu punya dasar kuat. Saatnya naik ke past tense.", startChapter: "A2 Chapter 1: Beyond Basics", estimationMonths: 7 };
  if (score <= 20) return { level: "A2", sublevel: "A2.2", label: "Pra-Menengah Berkembang", description: "Past tense sudah lumayan. Fokus: travel, work, ekspresi diri.", startChapter: "A2 Chapter 2: Travel & Work", estimationMonths: 6 };
  if (score <= 24) return { level: "B1", sublevel: "B1.1", label: "Menengah Awal", description: "Impressive! Kamu di ambang fluency.", startChapter: "B1 Chapter 1: Fluency Foundations", estimationMonths: 5 };
  if (score <= 28) return { level: "B1", sublevel: "B1.2", label: "Menengah Berkembang", description: "Level B1 menengah. Tinggal polish akurasi.", startChapter: "B1 Chapter 2: Cultural Fluency", estimationMonths: 4 };
  if (score <= 32) return { level: "B1", sublevel: "B1.5", label: "Menengah Mahir", description: "Nyaris upper intermediate.", startChapter: "B1 Chapter 5: Professional Bridge", estimationMonths: 3 };
  if (score <= 36) return { level: "B2", sublevel: "B2.1", label: "Menengah Atas", description: "Upper intermediate. Fokus ke ekspresi advanced, academic, business.", startChapter: "B2 Chapter 1: Advanced Expression", estimationMonths: 3 };
  return             { level: "B2", sublevel: "B2.7", label: "Menengah Atas Mahir", description: "Level mendekati C1! Langsung target score tinggi IELTS/TOEFL.", startChapter: "B2 Chapter 7: Test Prep (IELTS/TOEFL)", estimationMonths: 2 };
}
