#!/usr/bin/env node
// BIG script: Placement Test + Language Switcher
// - /silabus/[lang]/coba = placement test (15 soal English, adaptive weight)
// - Language Switcher button + modal di hero silabus
// - API save-lead patch untuk placement_level + source
// - SQL migration
// Run from ~/linguo-landing

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
if (!fs.existsSync(path.join(ROOT, 'src/app/silabus'))) {
  console.error('❌ Run dari ~/linguo-landing');
  process.exit(1);
}

const write = (rel, content) => {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.trimStart(), 'utf8');
  console.log(`  ✅ ${rel}`);
};

console.log('📝 Building placement test + language switcher...\n');

// ============================================================
// 1. PLACEMENT TEST DATA (English, 15 questions mixed A1→B2)
// ============================================================
write('src/data/placement/english.ts', `
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
`);

// ============================================================
// 2. Placement test page
// ============================================================
write('src/app/silabus/[lang]/coba/page.tsx', `
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurriculum, languages } from "@/data/curriculum";
import PlacementTest from "./PlacementTest";
import { englishPlacementTest } from "@/data/placement/english";

type Props = { params: Promise<{ lang: string }> };

export async function generateStaticParams() {
  // Only english has test data for now
  return [{ lang: "english" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const c = getCurriculum(lang);
  const name = c?.meta.name || "Bahasa";
  return {
    title: \`Placement Test Bahasa \${name} Gratis — Linguo.id\`,
    description: \`Tes level Bahasa \${name} kamu secara GRATIS. 15 soal, 2 menit. Dapatkan hasil personal + rekomendasi chapter.\`,
  };
}

export default async function Page({ params }: Props) {
  const { lang } = await params;
  const curriculum = getCurriculum(lang);
  if (!curriculum || lang !== "english") {
    notFound();
  }
  return <PlacementTest curriculum={curriculum} questions={englishPlacementTest} />;
}
`);

// ============================================================
// 3. Placement Test component
// ============================================================
write('src/app/silabus/[lang]/coba/PlacementTest.tsx', `
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";
import type { LanguageCurriculum } from "@/data/curriculum";
import { type Question, DIFFICULTY_POINTS, determineLevel } from "@/data/placement/english";

interface Props {
  curriculum: LanguageCurriculum;
  questions: Question[];
}

type Screen = "intro" | "quiz" | "result";

export default function PlacementTest({ curriculum, questions }: Props) {
  const { meta } = curriculum;
  const [screen, setScreen] = useState<Screen>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [selected, setSelected] = useState<string | number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const startTimeRef = useRef<number>(0);

  const question = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;

  useEffect(() => {
    if (screen === "quiz" && currentQ === 0) {
      startTimeRef.current = Date.now();
    }
  }, [screen, currentQ]);

  const startTest = () => {
    setScreen("quiz");
    setCurrentQ(0);
    setAnswers({});
    setScore(0);
    setSelected(null);
    setShowFeedback(false);
  };

  const submitAnswer = () => {
    if (selected === null) return;
    const isCorrect = selected === question.correct;
    if (isCorrect) {
      setScore((s) => s + DIFFICULTY_POINTS[question.difficulty]);
    }
    setAnswers((a) => ({ ...a, [question.id]: selected }));
    setShowFeedback(true);
  };

  const nextQuestion = () => {
    setShowFeedback(false);
    setSelected(null);
    if (currentQ + 1 < questions.length) {
      setCurrentQ((i) => i + 1);
    } else {
      setScreen("result");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      <AnimatePresence mode="wait">
        {screen === "intro" && (
          <IntroScreen
            key="intro"
            langName={meta.name}
            langFlag={meta.flag}
            langSlug={meta.slug}
            totalQuestions={questions.length}
            onStart={startTest}
          />
        )}
        {screen === "quiz" && question && (
          <QuizScreen
            key="quiz"
            question={question}
            currentQ={currentQ}
            total={questions.length}
            progress={progress}
            selected={selected}
            showFeedback={showFeedback}
            onSelect={setSelected}
            onSubmit={submitAnswer}
            onNext={nextQuestion}
            langSlug={meta.slug}
          />
        )}
        {screen === "result" && (
          <ResultScreen
            key="result"
            score={score}
            langName={meta.name}
            langFlag={meta.flag}
            langSlug={meta.slug}
            timeElapsedSec={Math.floor((Date.now() - startTimeRef.current) / 1000)}
            onRetake={startTest}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

// ========================================
// INTRO SCREEN
// ========================================
function IntroScreen({ langName, langFlag, langSlug, totalQuestions, onStart }: {
  langName: string; langFlag: string; langSlug: string; totalQuestions: number; onStart: () => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center px-6 py-20"
    >
      <div className="max-w-2xl w-full">
        <Link href={\`/silabus/\${langSlug}\`} className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1 mb-8 group">
          <Icons.ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Kembali ke silabus
        </Link>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="text-8xl mb-6"
        >{langFlag}</motion.div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Placement Test<br />
          <span className="text-[#1A9E9E]">Bahasa {langName}</span>
        </h1>

        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          Gratis, 2 menit. Dapatkan level CEFR kamu + rekomendasi chapter yang pas untuk mulai.
        </p>

        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
          <InfoCard icon="List" value={\`\${totalQuestions}\`} label="Soal" />
          <InfoCard icon="Clock" value="~2 mnt" label="Durasi" />
          <InfoCard icon="Award" value="CEFR" label="Standard" />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 md:p-5 mb-8">
          <div className="flex items-start gap-3">
            <Icons.Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900 leading-relaxed">
              <p className="font-semibold mb-1">Tips supaya hasilnya akurat:</p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                <li>Jawab yang kamu tau, tebak yang ragu</li>
                <li>Ga perlu sempurna — test ini buat tentuin level, bukan nilai</li>
                <li>Hasil disimpan supaya pengajar tau level kamu</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={onStart}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#1A9E9E] text-white rounded-full font-bold text-lg hover:bg-[#147a7a] shadow-xl shadow-[#1A9E9E]/20 transition-all group"
        >
          Mulai Test
          <Icons.ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.section>
  );
}

function InfoCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  const Icon = (Icons as any)[icon] as React.FC<{ className?: string; strokeWidth?: number }>;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
      <Icon className="w-5 h-5 text-gray-400 mx-auto mb-2" strokeWidth={2} />
      <div className="text-xl md:text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

// ========================================
// QUIZ SCREEN
// ========================================
function QuizScreen({
  question, currentQ, total, progress, selected, showFeedback,
  onSelect, onSubmit, onNext, langSlug,
}: {
  question: Question; currentQ: number; total: number; progress: number;
  selected: string | number | null; showFeedback: boolean;
  onSelect: (v: string | number) => void; onSubmit: () => void; onNext: () => void; langSlug: string;
}) {
  const [fillValue, setFillValue] = useState("");
  useEffect(() => {
    setFillValue("");
  }, [question.id]);

  const isCorrect = selected === question.correct;

  return (
    <motion.section
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="min-h-screen flex items-center justify-center px-6 py-10 md:py-16"
    >
      <div className="max-w-2xl w-full">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2 text-sm">
            <div className="flex items-center gap-2">
              <Link href={\`/silabus/\${langSlug}\`} className="text-gray-400 hover:text-gray-600">
                <Icons.X className="w-4 h-4" />
              </Link>
              <span className="text-gray-500">
                Soal <span className="font-bold text-gray-900">{currentQ + 1}</span> dari {total}
              </span>
            </div>
            <span className={\`text-xs font-bold px-2 py-0.5 rounded-full \${
              question.difficulty === "A1" ? "bg-emerald-100 text-emerald-700" :
              question.difficulty === "A2" ? "bg-sky-100 text-sky-700" :
              question.difficulty === "B1" ? "bg-violet-100 text-violet-700" :
              "bg-rose-100 text-rose-700"
            }\`}>{question.difficulty}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#1A9E9E] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: \`\${progress}%\` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug mb-3">
            {question.question}
          </h2>
          {question.context && (
            <p className="text-sm md:text-base text-gray-600 italic mb-5 font-mono bg-gray-50 px-4 py-3 rounded-xl">
              {question.context}
            </p>
          )}

          {/* Answer input */}
          <div className="space-y-2 mt-6">
            {question.type === "multiple" && question.options && question.options.map((opt, i) => {
              const isSelected = selected === i;
              const isAnswerCorrect = question.correct === i;
              const showState = showFeedback;
              let cls = "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50";
              if (showState && isAnswerCorrect) cls = "border-emerald-500 bg-emerald-50";
              else if (showState && isSelected && !isAnswerCorrect) cls = "border-rose-500 bg-rose-50";
              else if (isSelected) cls = "border-[#1A9E9E] bg-[#1A9E9E]/5";
              return (
                <button
                  key={i}
                  onClick={() => !showFeedback && onSelect(i)}
                  disabled={showFeedback}
                  className={\`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all \${cls}\`}
                >
                  <div className="flex items-center gap-3">
                    <span className={\`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold flex-shrink-0 \${
                      isSelected ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
                    }\`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-gray-900">{opt}</span>
                    {showState && isAnswerCorrect && <Icons.Check className="w-5 h-5 text-emerald-600 ml-auto" />}
                    {showState && isSelected && !isAnswerCorrect && <Icons.X className="w-5 h-5 text-rose-600 ml-auto" />}
                  </div>
                </button>
              );
            })}

            {question.type === "fill" && (
              <div>
                <input
                  type="text"
                  value={fillValue}
                  onChange={(e) => { setFillValue(e.target.value); onSelect(e.target.value.toLowerCase().trim()); }}
                  disabled={showFeedback}
                  placeholder="Ketik jawaban..."
                  className={\`w-full px-5 py-4 rounded-2xl border-2 focus:outline-none transition-colors \${
                    showFeedback
                      ? (selected === question.correct ? "border-emerald-500 bg-emerald-50" : "border-rose-500 bg-rose-50")
                      : "border-gray-200 focus:border-[#1A9E9E]"
                  }\`}
                />
              </div>
            )}
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className={\`mt-5 p-4 rounded-2xl flex items-start gap-3 \${
                  isCorrect ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"
                }\`}>
                  <div className={\`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 \${
                    isCorrect ? "bg-emerald-500" : "bg-rose-500"
                  }\`}>
                    {isCorrect ? <Icons.Check className="w-4 h-4 text-white" strokeWidth={3} /> : <Icons.X className="w-4 h-4 text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold mb-1">{isCorrect ? "Benar!" : "Kurang tepat."}</p>
                    <p className="text-sm">{question.explanation}</p>
                    {!isCorrect && question.type === "multiple" && question.options && (
                      <p className="text-sm mt-2">
                        <span className="font-semibold">Jawaban benar:</span> {question.options[question.correct as number]}
                      </p>
                    )}
                    {!isCorrect && question.type === "fill" && (
                      <p className="text-sm mt-2">
                        <span className="font-semibold">Jawaban benar:</span> {String(question.correct)}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action button */}
        <div className="flex justify-end">
          {!showFeedback ? (
            <button
              onClick={onSubmit}
              disabled={selected === null || (typeof selected === "string" && !selected)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#1A9E9E] text-white rounded-full font-bold hover:bg-[#147a7a] disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#1A9E9E]/20 transition-all"
            >
              Jawab
              <Icons.ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onNext}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-full font-bold hover:bg-gray-700 shadow-lg transition-all"
            >
              {currentQ + 1 < total ? "Soal berikutnya" : "Lihat hasil"}
              <Icons.ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </motion.section>
  );
}

// ========================================
// RESULT SCREEN
// ========================================
function ResultScreen({ score, langName, langFlag, langSlug, timeElapsedSec, onRetake }: {
  score: number; langName: string; langFlag: string; langSlug: string; timeElapsedSec: number; onRetake: () => void;
}) {
  const result = determineLevel(score);
  const maxScore = 39;
  const scorePercent = (score / maxScore) * 100;

  const levelColor = result.level === "A1" ? "emerald" :
                      result.level === "A2" ? "sky" :
                      result.level === "B1" ? "violet" : "rose";

  const handleStartLearning = () => {
    const w = window as any;
    if (typeof w.__openFunnel === "function") {
      try {
        w.__openFunnel({
          language: \`Bahasa \${langName}\`,
          source: \`placement-test-\${langSlug}\`,
        });
      } catch {
        w.__openFunnel(\`Bahasa \${langName}\`);
      }
    } else {
      window.location.href = \`/?lang=\${encodeURIComponent("Bahasa " + langName)}&from=placement-test-\${langSlug}&level=\${result.sublevel}\`;
    }
  };

  // Log result to leads (fire & forget)
  useEffect(() => {
    fetch("/api/placement-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: langName,
        level: result.sublevel,
        score,
        timeElapsedSec,
        source: \`placement-test-\${langSlug}\`,
      }),
    }).catch(() => { /* silent fail */ });
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="min-h-screen py-16 px-6"
    >
      <div className="max-w-2xl mx-auto">
        {/* Celebration header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.2 }}
            className={\`inline-flex items-center justify-center w-24 h-24 rounded-full bg-\${levelColor}-100 mb-5\`}
          >
            <Icons.Award className={\`w-12 h-12 text-\${levelColor}-600\`} strokeWidth={2} />
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-sm text-gray-500 uppercase tracking-widest mb-2">
            Hasil Placement Test
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="text-5xl md:text-6xl font-bold tracking-tight mb-2">
            Level kamu <span className={\`text-\${levelColor}-600\`}>{result.sublevel}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className={\`text-xl font-semibold text-\${levelColor}-700 mb-4\`}>
            {result.label}
          </motion.p>
        </div>

        {/* Score card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm mb-6"
        >
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center border-r border-gray-100">
              <div className="text-3xl font-bold text-gray-900">{score}<span className="text-gray-400 text-lg">/{maxScore}</span></div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Skor</div>
            </div>
            <div className="text-center border-r border-gray-100">
              <div className="text-3xl font-bold text-gray-900">{Math.round(scorePercent)}%</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Akurasi</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{Math.floor(timeElapsedSec / 60)}:{String(timeElapsedSec % 60).padStart(2, "0")}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Waktu</div>
            </div>
          </div>

          <p className="text-gray-700 text-base leading-relaxed">{result.description}</p>
        </motion.div>

        {/* Recommendation card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
          className={\`rounded-3xl p-6 md:p-8 mb-6 border bg-\${levelColor}-50 border-\${levelColor}-200\`}
        >
          <div className="flex items-start gap-3 mb-4">
            <Icons.Target className={\`w-6 h-6 text-\${levelColor}-600 flex-shrink-0 mt-0.5\`} />
            <div className="flex-1">
              <p className={\`text-xs uppercase tracking-widest text-\${levelColor}-700 font-semibold mb-1\`}>Rekomendasi Kami</p>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                Mulai dari {result.startChapter}
              </h3>
              <p className="text-gray-700 text-sm md:text-base">
                Estimasi selesai ke level B2: <span className="font-bold">{result.estimationMonths} bulan</span> kalau ikut kelas reguler.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
          className="flex flex-col gap-3">
          <button
            onClick={handleStartLearning}
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#1A9E9E] text-white rounded-full font-bold text-lg hover:bg-[#147a7a] shadow-xl shadow-[#1A9E9E]/20 transition-all group"
          >
            Mulai Belajar dari {result.sublevel}
            <Icons.ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <div className="flex gap-3">
            <Link href={\`/silabus/\${langSlug}\`} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors">
              <Icons.BookOpen className="w-4 h-4" />
              Lihat Silabus
            </Link>
            <button onClick={onRetake} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors">
              <Icons.RotateCw className="w-4 h-4" />
              Ulangi Test
            </button>
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="text-center text-xs text-gray-400 mt-8">
          Hasil ini tersimpan dan akan membantu pengajar Linguo merekomendasikan kelas yang paling pas untuk kamu.
        </motion.p>
      </div>
    </motion.section>
  );
}
`);

// ============================================================
// 4. Language Switcher Modal component
// ============================================================
write('src/app/silabus/[lang]/LanguageSwitcher.tsx', `
"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";
import { languages, regionLabels } from "@/data/curriculum/languages";

const RECENT_KEY = "silabus_recent_langs";

export default function LanguageSwitcher({ currentSlug, currentName, currentFlag }: {
  currentSlug: string; currentName: string; currentFlag: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeRegion, setActiveRegion] = useState<string>("all");
  const [recent, setRecent] = useState<string[]>([]);

  // Load recent from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) setRecent(JSON.parse(stored));
    } catch {}
  }, []);

  // Save current to recent when modal opens
  useEffect(() => {
    if (!open) return;
    try {
      const existing = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as string[];
      const updated = [currentSlug, ...existing.filter((s) => s !== currentSlug)].slice(0, 4);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      setRecent(updated);
    } catch {}
  }, [open, currentSlug]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return languages.filter((l) => {
      if (l.slug === currentSlug) return false;
      const mq = !q || l.name.toLowerCase().includes(q) || l.nativeName.toLowerCase().includes(q);
      const mr = activeRegion === "all" || l.region === activeRegion;
      return mq && mr;
    });
  }, [query, activeRegion, currentSlug]);

  const recentLangs = recent
    .map((s) => languages.find((l) => l.slug === s))
    .filter((l): l is NonNullable<typeof l> => !!l && l.slug !== currentSlug);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 text-sm text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
      >
        <span className="text-base">{currentFlag}</span>
        <span className="font-medium">{currentName}</span>
        <Icons.ArrowLeftRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs text-gray-500">Ganti</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-4 top-[5vh] bottom-[5vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[640px] md:top-[8vh] md:bottom-[8vh] bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <h2 className="text-xl font-bold">Pilih Bahasa</h2>
                <button onClick={() => setOpen(false)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center">
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              {/* Search + filter */}
              <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0 space-y-3">
                <div className="relative">
                  <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari bahasa..."
                    className="w-full pl-11 pr-4 py-3 rounded-full border border-gray-200 focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20 outline-none text-sm"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6">
                  {[["all", "Semua"], ...Object.entries(regionLabels)].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setActiveRegion(key)}
                      className={\`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors \${
                        activeRegion === key
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }\`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {recentLangs.length > 0 && !query && activeRegion === "all" && (
                  <div className="mb-6">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-semibold">Baru dilihat</p>
                    <div className="grid grid-cols-2 gap-2">
                      {recentLangs.map((l) => <LangCard key={l.slug} lang={l} compact />)}
                    </div>
                  </div>
                )}

                {filtered.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {filtered.map((l) => <LangCard key={l.slug} lang={l} />)}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="text-gray-500">Bahasa ga ketemu</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function LangCard({ lang, compact = false }: { lang: { slug: string; name: string; nativeName: string; flag: string; available: boolean; featured?: boolean }; compact?: boolean }) {
  const available = lang.available;
  const content = (
    <div className={\`group p-3 md:p-4 rounded-2xl border transition-all \${
      available ? "border-gray-100 hover:border-[#1A9E9E] hover:bg-[#1A9E9E]/5" : "border-gray-100 bg-gray-50/50 hover:border-gray-200"
    } cursor-pointer\`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{lang.flag}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-sm text-gray-900 truncate">{lang.name}</p>
            {lang.featured && !compact && <span className="text-[9px] uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">★</span>}
          </div>
          <p className="text-xs text-gray-500 truncate">{lang.nativeName}</p>
          {!available && <p className="text-[10px] text-amber-600 mt-1 font-semibold uppercase tracking-wider">Segera hadir</p>}
        </div>
      </div>
    </div>
  );

  if (available) {
    return <Link href={\`/silabus/\${lang.slug}\`}>{content}</Link>;
  }
  return (
    <a
      href={\`https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20tertarik%20Bahasa%20\${encodeURIComponent(lang.name)}\`}
      target="_blank"
      rel="noopener"
    >{content}</a>
  );
}
`);

// ============================================================
// 5. Inject LanguageSwitcher into CurriculumViewer hero
// ============================================================
console.log('\n🔧 Injecting LanguageSwitcher into CurriculumViewer...\n');

const viewerPath = path.join(ROOT, 'src/app/silabus/[lang]/CurriculumViewer.tsx');
if (fs.existsSync(viewerPath)) {
  let content = fs.readFileSync(viewerPath, 'utf8');
  const before = content;

  // Add import
  if (!content.includes('LanguageSwitcher')) {
    content = content.replace(
      /import \* as Icons from "lucide-react";/,
      `import * as Icons from "lucide-react";\nimport LanguageSwitcher from "./LanguageSwitcher";`
    );

    // Inject button after hero flag+title block — look for the overview paragraph
    // Pattern: the <p> with overview comes right after the flag+title div
    const injectPat = /(<p className="text-base md:text-lg text-gray-700 leading-relaxed mb-7">\{overview\}<\/p>)/;
    content = content.replace(
      injectPat,
      `$1\n\n          <div className="mb-5">\n            <LanguageSwitcher currentSlug={meta.slug} currentName={\\\`Bahasa \\\${meta.name}\\\`} currentFlag={meta.flag} />\n          </div>`
    );

    if (content !== before) {
      fs.writeFileSync(viewerPath, content, 'utf8');
      console.log('  ✅ CurriculumViewer: LanguageSwitcher injected');
    } else {
      console.log('  ⚠️  Overview paragraph pattern tidak match — switcher belum ke-inject');
    }
  } else {
    console.log('  ✓ LanguageSwitcher sudah ada');
  }
}

// ============================================================
// 6. Create placement-result API endpoint
// ============================================================
write('src/app/api/placement-result/route.ts', `
import { NextRequest, NextResponse } from "next/server";

// Log placement test results — fire & forget from client
// Writes to leads table (or creates lightweight record) with placement_level + source

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { language, level, score, timeElapsedSec, source } = body;

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json({ success: false, error: "Missing Supabase config" }, { status: 500 });
    }

    // Insert into placement_results table (lightweight log)
    const res = await fetch(\`\${SUPABASE_URL}/rest/v1/placement_results\`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": \`Bearer \${SUPABASE_KEY}\`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        language,
        level,
        score,
        time_elapsed_sec: timeElapsedSec,
        source,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("placement-result insert failed:", err);
      return NextResponse.json({ success: false, error: err }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("placement-result error:", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
`);

// ============================================================
// 7. SQL migration
// ============================================================
const sqlPath = '/tmp/placement-test-migration.sql';
fs.writeFileSync(sqlPath, `-- Placement test results table
-- Run di Supabase SQL Editor

CREATE TABLE IF NOT EXISTS placement_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language TEXT NOT NULL,
  level TEXT NOT NULL,
  score INTEGER NOT NULL,
  time_elapsed_sec INTEGER,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_placement_language ON placement_results(language);
CREATE INDEX IF NOT EXISTS idx_placement_level ON placement_results(level);
CREATE INDEX IF NOT EXISTS idx_placement_created ON placement_results(created_at DESC);

-- RLS: Allow insert from anon (anyone can submit placement result)
ALTER TABLE placement_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow anon insert placement" ON placement_results;
CREATE POLICY "allow anon insert placement" ON placement_results
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "allow authenticated read placement" ON placement_results;
CREATE POLICY "allow authenticated read placement" ON placement_results
  FOR SELECT TO authenticated USING (true);

-- Sample analytics:
-- SELECT level, COUNT(*) FROM placement_results WHERE language = 'Inggris' GROUP BY level ORDER BY level;
-- SELECT source, AVG(score) FROM placement_results GROUP BY source;
`, 'utf8');
console.log(`\n📄 SQL migration: ${sqlPath}`);

// ============================================================
// Git
// ============================================================
console.log('\n🚀 Git...\n');
try {
  execSync('git add -A', { stdio: 'inherit', cwd: ROOT });
  execSync(
    'git commit -m "feat(silabus): placement test (/coba) + language switcher modal"',
    { stdio: 'inherit', cwd: ROOT }
  );
  execSync('git push', { stdio: 'inherit', cwd: ROOT });
  console.log('\n✅ Pushed\n');
} catch (e) {
  console.log('\n⚠️  Git:', e.message);
}

try { fs.unlinkSync(fileURLToPath(import.meta.url)); } catch {}

console.log('═══════════════════════════════════════════════');
console.log('📋 NEXT STEPS:');
console.log(`   1. Jalanin SQL migration di Supabase: cat ${sqlPath}`);
console.log('   2. Copy-paste ke SQL Editor → Run');
console.log('   3. Tunggu Vercel deploy');
console.log('   4. Test:');
console.log('      • linguo.id/silabus/english → tombol "Ganti" bahasa muncul di hero');
console.log('      • klik "Coba Sample Gratis" → masuk ke placement test');
console.log('      • 15 soal, hasil + rekomendasi chapter');
console.log('═══════════════════════════════════════════════\n');
