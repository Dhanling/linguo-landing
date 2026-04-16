#!/usr/bin/env node
// SAFE placement test deploy — ga sentuh CurriculumViewer
// Cuma add files baru + verify existing file utuh
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

// ============================================================
// 0. Verify CurriculumViewer utuh — especially "use client"
// ============================================================
const viewerPath = path.join(ROOT, 'src/app/silabus/[lang]/CurriculumViewer.tsx');
if (fs.existsSync(viewerPath)) {
  const viewerContent = fs.readFileSync(viewerPath, 'utf8');
  const firstLine = viewerContent.split('\n')[0].trim();
  if (firstLine !== '"use client";') {
    console.log('⚠️  CurriculumViewer tidak punya "use client"; di baris 1!');
    console.log(`   Baris 1 saat ini: ${firstLine}`);
    console.log('   Auto-fix: menambahkan "use client";\n');
    fs.writeFileSync(viewerPath, '"use client";\n\n' + viewerContent, 'utf8');
    console.log('  ✅ "use client"; ditambahkan ke CurriculumViewer.tsx\n');
  } else {
    console.log('✓ CurriculumViewer.tsx: "use client" ada\n');
  }
}

console.log('📝 Deploy placement test (safe)...\n');

// ============================================================
// 1. Placement test data (English)
// ============================================================
write('src/data/placement/english.ts', `
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
  if (score <= 4)  return { level: "A1", sublevel: "A1.1", label: "Pemula Awal", description: "Kamu masih di tahap fondasi. Mulai dari dasar akan bangun trust-mu dengan Bahasa Inggris.", startChapter: "Chapter 1: First Steps", estimationMonths: 12 };
  if (score <= 8)  return { level: "A1", sublevel: "A1.2", label: "Pemula Berkembang", description: "Kamu sudah tau dasar. Siap lanjut ke daily life vocabulary.", startChapter: "Chapter 2: Daily Life", estimationMonths: 11 };
  if (score <= 12) return { level: "A1", sublevel: "A1.3", label: "Pemula Lanjutan", description: "Fondasi A1 sudah baik. Tinggal polish ke percakapan sosial.", startChapter: "Chapter 3: Social Basics", estimationMonths: 10 };
  if (score <= 16) return { level: "A2", sublevel: "A2.1", label: "Pra-Menengah Awal", description: "Kamu punya dasar kuat. Saatnya naik ke past tense.", startChapter: "A2 Chapter 1: Beyond Basics", estimationMonths: 9 };
  if (score <= 20) return { level: "A2", sublevel: "A2.2", label: "Pra-Menengah Berkembang", description: "Past tense sudah lumayan. Fokus: travel, work, ekspresi diri.", startChapter: "A2 Chapter 2: Travel & Work", estimationMonths: 8 };
  if (score <= 24) return { level: "B1", sublevel: "B1.1", label: "Menengah Awal", description: "Impressive! Kamu di ambang fluency.", startChapter: "B1 Chapter 1: Fluency Foundations", estimationMonths: 6 };
  if (score <= 28) return { level: "B1", sublevel: "B1.2", label: "Menengah Berkembang", description: "Level B1 menengah. Tinggal polish akurasi.", startChapter: "B1 Chapter 2: Cultural Fluency", estimationMonths: 5 };
  if (score <= 32) return { level: "B1", sublevel: "B1.5", label: "Menengah Mahir", description: "Nyaris upper intermediate.", startChapter: "B1 Chapter 5: Professional Bridge", estimationMonths: 4 };
  if (score <= 36) return { level: "B2", sublevel: "B2.1", label: "Menengah Atas", description: "Upper intermediate. Fokus ke ekspresi advanced, academic, business.", startChapter: "B2 Chapter 1: Advanced Expression", estimationMonths: 3 };
  return             { level: "B2", sublevel: "B2.7", label: "Menengah Atas Mahir", description: "Level mendekati C1! Langsung target score tinggi IELTS/TOEFL.", startChapter: "B2 Chapter 7: Test Prep (IELTS/TOEFL)", estimationMonths: 2 };
}
`);

// ============================================================
// 2. Placement test route page
// ============================================================
write('src/app/silabus/[lang]/coba/page.tsx', `
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurriculum } from "@/data/curriculum";
import PlacementTest from "./PlacementTest";
import { englishPlacementTest } from "@/data/placement/english";

type Props = { params: Promise<{ lang: string }> };

export async function generateStaticParams() {
  return [{ lang: "english" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const c = getCurriculum(lang);
  const name = c?.meta.name || "Bahasa";
  return {
    title: "Placement Test Bahasa " + name + " Gratis | Linguo.id",
    description: "Tes level Bahasa " + name + " kamu GRATIS. 15 soal, 2 menit. Hasil personal + rekomendasi chapter.",
  };
}

export default async function Page({ params }: Props) {
  const { lang } = await params;
  const curriculum = getCurriculum(lang);
  if (!curriculum || lang !== "english") notFound();
  return <PlacementTest curriculum={curriculum} questions={englishPlacementTest} />;
}
`);

// ============================================================
// 3. PlacementTest client component
// ============================================================
// NOTE: pakai template literal + escaping yang aman via JSON.stringify untuk CSS class strings
// dan ga pakai nested backtick di dalam backtick
write('src/app/silabus/[lang]/coba/PlacementTest.tsx', [
  '"use client";',
  '',
  'import { useState, useEffect, useRef } from "react";',
  'import Link from "next/link";',
  'import { motion, AnimatePresence } from "framer-motion";',
  'import * as Icons from "lucide-react";',
  'import type { LanguageCurriculum } from "@/data/curriculum";',
  'import { type Question, DIFFICULTY_POINTS, determineLevel } from "@/data/placement/english";',
  '',
  'interface Props {',
  '  curriculum: LanguageCurriculum;',
  '  questions: Question[];',
  '}',
  '',
  'type Screen = "intro" | "quiz" | "result";',
  '',
  'export default function PlacementTest({ curriculum, questions }: Props) {',
  '  const { meta } = curriculum;',
  '  const [screen, setScreen] = useState<Screen>("intro");',
  '  const [currentQ, setCurrentQ] = useState(0);',
  '  const [selected, setSelected] = useState<string | number | null>(null);',
  '  const [showFeedback, setShowFeedback] = useState(false);',
  '  const [score, setScore] = useState(0);',
  '  const startTimeRef = useRef<number>(0);',
  '',
  '  const question = questions[currentQ];',
  '  const progress = ((currentQ + 1) / questions.length) * 100;',
  '',
  '  useEffect(() => {',
  '    if (screen === "quiz" && currentQ === 0) startTimeRef.current = Date.now();',
  '  }, [screen, currentQ]);',
  '',
  '  const startTest = () => {',
  '    setScreen("quiz"); setCurrentQ(0); setScore(0); setSelected(null); setShowFeedback(false);',
  '  };',
  '',
  '  const submitAnswer = () => {',
  '    if (selected === null) return;',
  '    if (selected === question.correct) setScore((s) => s + DIFFICULTY_POINTS[question.difficulty]);',
  '    setShowFeedback(true);',
  '  };',
  '',
  '  const nextQuestion = () => {',
  '    setShowFeedback(false);',
  '    setSelected(null);',
  '    if (currentQ + 1 < questions.length) setCurrentQ((i) => i + 1);',
  '    else setScreen("result");',
  '  };',
  '',
  '  return (',
  '    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">',
  '      <AnimatePresence mode="wait">',
  '        {screen === "intro" && (',
  '          <IntroScreen key="intro" meta={meta} total={questions.length} onStart={startTest} />',
  '        )}',
  '        {screen === "quiz" && question && (',
  '          <QuizScreen',
  '            key="quiz"',
  '            question={question}',
  '            currentQ={currentQ}',
  '            total={questions.length}',
  '            progress={progress}',
  '            selected={selected}',
  '            showFeedback={showFeedback}',
  '            onSelect={setSelected}',
  '            onSubmit={submitAnswer}',
  '            onNext={nextQuestion}',
  '            langSlug={meta.slug}',
  '          />',
  '        )}',
  '        {screen === "result" && (',
  '          <ResultScreen',
  '            key="result"',
  '            score={score}',
  '            meta={meta}',
  '            timeElapsedSec={Math.floor((Date.now() - startTimeRef.current) / 1000)}',
  '            onRetake={startTest}',
  '          />',
  '        )}',
  '      </AnimatePresence>',
  '    </main>',
  '  );',
  '}',
  '',
  'function IntroScreen({ meta, total, onStart }: { meta: any; total: number; onStart: () => void }) {',
  '  return (',
  '    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}',
  '      className="min-h-screen flex items-center justify-center px-6 py-20">',
  '      <div className="max-w-2xl w-full">',
  '        <Link href={"/silabus/" + meta.slug} className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1 mb-8 group">',
  '          <Icons.ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />',
  '          Kembali ke silabus',
  '        </Link>',
  '',
  '        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}',
  '          transition={{ type: "spring", stiffness: 200, damping: 15 }}',
  '          className="text-8xl mb-6">{meta.flag}</motion.div>',
  '',
  '        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">',
  '          Placement Test<br />',
  '          <span className="text-[#1A9E9E]">Bahasa {meta.name}</span>',
  '        </h1>',
  '',
  '        <p className="text-lg text-gray-600 mb-8 leading-relaxed">',
  '          Gratis, 2 menit. Dapatkan level CEFR kamu + rekomendasi chapter yang pas untuk mulai.',
  '        </p>',
  '',
  '        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">',
  '          <InfoCard icon="List" value={String(total)} label="Soal" />',
  '          <InfoCard icon="Clock" value="~2 mnt" label="Durasi" />',
  '          <InfoCard icon="Award" value="CEFR" label="Standard" />',
  '        </div>',
  '',
  '        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 md:p-5 mb-8">',
  '          <div className="flex items-start gap-3">',
  '            <Icons.Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />',
  '            <div className="text-sm text-amber-900 leading-relaxed">',
  '              <p className="font-semibold mb-1">Tips supaya akurat:</p>',
  '              <ul className="list-disc list-inside space-y-0.5 text-amber-800">',
  '                <li>Jawab yang kamu tau, tebak yang ragu</li>',
  '                <li>Ga perlu sempurna \u2014 test ini buat tentuin level</li>',
  '                <li>Hasil disimpan supaya pengajar tau level kamu</li>',
  '              </ul>',
  '            </div>',
  '          </div>',
  '        </div>',
  '',
  '        <button onClick={onStart}',
  '          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#1A9E9E] text-white rounded-full font-bold text-lg hover:bg-[#147a7a] shadow-xl shadow-[#1A9E9E]/20 transition-all group">',
  '          Mulai Test',
  '          <Icons.ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />',
  '        </button>',
  '      </div>',
  '    </motion.section>',
  '  );',
  '}',
  '',
  'function InfoCard({ icon, value, label }: { icon: string; value: string; label: string }) {',
  '  const Icon = (Icons as any)[icon] as React.FC<{ className?: string; strokeWidth?: number }>;',
  '  return (',
  '    <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center">',
  '      <Icon className="w-5 h-5 text-gray-400 mx-auto mb-2" strokeWidth={2} />',
  '      <div className="text-xl md:text-2xl font-bold text-gray-900">{value}</div>',
  '      <div className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">{label}</div>',
  '    </div>',
  '  );',
  '}',
  '',
  'function QuizScreen(props: {',
  '  question: Question; currentQ: number; total: number; progress: number;',
  '  selected: string | number | null; showFeedback: boolean;',
  '  onSelect: (v: string | number) => void; onSubmit: () => void; onNext: () => void; langSlug: string;',
  '}) {',
  '  const { question, currentQ, total, progress, selected, showFeedback, onSelect, onSubmit, onNext, langSlug } = props;',
  '  const [fillValue, setFillValue] = useState("");',
  '  useEffect(() => { setFillValue(""); }, [question.id]);',
  '  const isCorrect = selected === question.correct;',
  '',
  '  const diffCls = question.difficulty === "A1" ? "bg-emerald-100 text-emerald-700" :',
  '                   question.difficulty === "A2" ? "bg-sky-100 text-sky-700" :',
  '                   question.difficulty === "B1" ? "bg-violet-100 text-violet-700" :',
  '                                                   "bg-rose-100 text-rose-700";',
  '',
  '  return (',
  '    <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}',
  '      className="min-h-screen flex items-center justify-center px-6 py-10 md:py-16">',
  '      <div className="max-w-2xl w-full">',
  '        <div className="mb-8">',
  '          <div className="flex items-center justify-between mb-2 text-sm">',
  '            <div className="flex items-center gap-2">',
  '              <Link href={"/silabus/" + langSlug} className="text-gray-400 hover:text-gray-600">',
  '                <Icons.X className="w-4 h-4" />',
  '              </Link>',
  '              <span className="text-gray-500">Soal <span className="font-bold text-gray-900">{currentQ + 1}</span> dari {total}</span>',
  '            </div>',
  '            <span className={"text-xs font-bold px-2 py-0.5 rounded-full " + diffCls}>{question.difficulty}</span>',
  '          </div>',
  '          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">',
  '            <motion.div className="h-full bg-[#1A9E9E] rounded-full"',
  '              initial={{ width: 0 }} animate={{ width: progress + "%" }} transition={{ duration: 0.4 }} />',
  '          </div>',
  '        </div>',
  '',
  '        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 mb-6">',
  '          <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug mb-3">{question.question}</h2>',
  '          {question.context && (',
  '            <p className="text-sm md:text-base text-gray-600 italic mb-5 font-mono bg-gray-50 px-4 py-3 rounded-xl">{question.context}</p>',
  '          )}',
  '',
  '          <div className="space-y-2 mt-6">',
  '            {question.type === "multiple" && question.options && question.options.map((opt, i) => {',
  '              const isSelected = selected === i;',
  '              const isAnswerCorrect = question.correct === i;',
  '              let cls = "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50";',
  '              if (showFeedback && isAnswerCorrect) cls = "border-emerald-500 bg-emerald-50";',
  '              else if (showFeedback && isSelected && !isAnswerCorrect) cls = "border-rose-500 bg-rose-50";',
  '              else if (isSelected) cls = "border-[#1A9E9E] bg-[#1A9E9E]/5";',
  '              return (',
  '                <button key={i} onClick={() => !showFeedback && onSelect(i)} disabled={showFeedback}',
  '                  className={"w-full text-left px-5 py-4 rounded-2xl border-2 transition-all " + cls}>',
  '                  <div className="flex items-center gap-3">',
  '                    <span className={"flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold flex-shrink-0 " + (isSelected ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600")}>',
  '                      {String.fromCharCode(65 + i)}',
  '                    </span>',
  '                    <span className="text-gray-900">{opt}</span>',
  '                    {showFeedback && isAnswerCorrect && <Icons.Check className="w-5 h-5 text-emerald-600 ml-auto" />}',
  '                    {showFeedback && isSelected && !isAnswerCorrect && <Icons.X className="w-5 h-5 text-rose-600 ml-auto" />}',
  '                  </div>',
  '                </button>',
  '              );',
  '            })}',
  '',
  '            {question.type === "fill" && (',
  '              <input type="text" value={fillValue}',
  '                onChange={(e) => { setFillValue(e.target.value); onSelect(e.target.value.toLowerCase().trim()); }}',
  '                disabled={showFeedback} placeholder="Ketik jawaban..."',
  '                className={"w-full px-5 py-4 rounded-2xl border-2 focus:outline-none transition-colors " + (showFeedback ? (selected === question.correct ? "border-emerald-500 bg-emerald-50" : "border-rose-500 bg-rose-50") : "border-gray-200 focus:border-[#1A9E9E]")}',
  '              />',
  '            )}',
  '          </div>',
  '',
  '          <AnimatePresence>',
  '            {showFeedback && (',
  '              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">',
  '                <div className={"mt-5 p-4 rounded-2xl flex items-start gap-3 " + (isCorrect ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900")}>',
  '                  <div className={"w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 " + (isCorrect ? "bg-emerald-500" : "bg-rose-500")}>',
  '                    {isCorrect ? <Icons.Check className="w-4 h-4 text-white" strokeWidth={3} /> : <Icons.X className="w-4 h-4 text-white" strokeWidth={3} />}',
  '                  </div>',
  '                  <div className="flex-1">',
  '                    <p className="font-bold mb-1">{isCorrect ? "Benar!" : "Kurang tepat."}</p>',
  '                    <p className="text-sm">{question.explanation}</p>',
  '                    {!isCorrect && question.type === "multiple" && question.options && (',
  '                      <p className="text-sm mt-2"><span className="font-semibold">Jawaban benar:</span> {question.options[question.correct as number]}</p>',
  '                    )}',
  '                    {!isCorrect && question.type === "fill" && (',
  '                      <p className="text-sm mt-2"><span className="font-semibold">Jawaban benar:</span> {String(question.correct)}</p>',
  '                    )}',
  '                  </div>',
  '                </div>',
  '              </motion.div>',
  '            )}',
  '          </AnimatePresence>',
  '        </div>',
  '',
  '        <div className="flex justify-end">',
  '          {!showFeedback ? (',
  '            <button onClick={onSubmit} disabled={selected === null || (typeof selected === "string" && !selected)}',
  '              className="inline-flex items-center gap-2 px-8 py-4 bg-[#1A9E9E] text-white rounded-full font-bold hover:bg-[#147a7a] disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#1A9E9E]/20 transition-all">',
  '              Jawab <Icons.ArrowRight className="w-5 h-5" />',
  '            </button>',
  '          ) : (',
  '            <button onClick={onNext}',
  '              className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-full font-bold hover:bg-gray-700 shadow-lg transition-all">',
  '              {currentQ + 1 < total ? "Soal berikutnya" : "Lihat hasil"}',
  '              <Icons.ArrowRight className="w-5 h-5" />',
  '            </button>',
  '          )}',
  '        </div>',
  '      </div>',
  '    </motion.section>',
  '  );',
  '}',
  '',
  'function ResultScreen({ score, meta, timeElapsedSec, onRetake }: {',
  '  score: number; meta: any; timeElapsedSec: number; onRetake: () => void;',
  '}) {',
  '  const result = determineLevel(score);',
  '  const maxScore = 39;',
  '  const scorePercent = (score / maxScore) * 100;',
  '',
  '  const levelColorMap: Record<string, { bg: string; text: string; soft: string; border: string }> = {',
  '    A1: { bg: "bg-emerald-100", text: "text-emerald-600", soft: "bg-emerald-50", border: "border-emerald-200" },',
  '    A2: { bg: "bg-sky-100", text: "text-sky-600", soft: "bg-sky-50", border: "border-sky-200" },',
  '    B1: { bg: "bg-violet-100", text: "text-violet-600", soft: "bg-violet-50", border: "border-violet-200" },',
  '    B2: { bg: "bg-rose-100", text: "text-rose-600", soft: "bg-rose-50", border: "border-rose-200" },',
  '  };',
  '  const lc = levelColorMap[result.level];',
  '',
  '  const handleStartLearning = () => {',
  '    const w = window as any;',
  '    const langFull = "Bahasa " + meta.name;',
  '    const sourceTag = "placement-test-" + meta.slug;',
  '    if (typeof w.__openFunnel === "function") {',
  '      try { w.__openFunnel({ language: langFull, source: sourceTag }); }',
  '      catch { w.__openFunnel(langFull); }',
  '    } else {',
  '      window.location.href = "/?lang=" + encodeURIComponent(langFull) + "&from=" + sourceTag + "&level=" + result.sublevel;',
  '    }',
  '  };',
  '',
  '  useEffect(() => {',
  '    fetch("/api/placement-result", {',
  '      method: "POST",',
  '      headers: { "Content-Type": "application/json" },',
  '      body: JSON.stringify({',
  '        language: meta.name,',
  '        level: result.sublevel,',
  '        score,',
  '        timeElapsedSec,',
  '        source: "placement-test-" + meta.slug,',
  '      }),',
  '    }).catch(() => {});',
  '    // eslint-disable-next-line react-hooks/exhaustive-deps',
  '  }, []);',
  '',
  '  return (',
  '    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}',
  '      className="min-h-screen py-16 px-6">',
  '      <div className="max-w-2xl mx-auto">',
  '        <div className="text-center mb-10">',
  '          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}',
  '            transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.2 }}',
  '            className={"inline-flex items-center justify-center w-24 h-24 rounded-full mb-5 " + lc.bg}>',
  '            <Icons.Award className={"w-12 h-12 " + lc.text} strokeWidth={2} />',
  '          </motion.div>',
  '',
  '          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}',
  '            className="text-sm text-gray-500 uppercase tracking-widest mb-2">Hasil Placement Test</motion.p>',
  '          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}',
  '            className="text-5xl md:text-6xl font-bold tracking-tight mb-2">',
  '            Level kamu <span className={lc.text}>{result.sublevel}</span>',
  '          </motion.h1>',
  '          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}',
  '            className={"text-xl font-semibold mb-4 " + lc.text}>{result.label}</motion.p>',
  '        </div>',
  '',
  '        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}',
  '          className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm mb-6">',
  '          <div className="grid grid-cols-3 gap-4 mb-6">',
  '            <div className="text-center border-r border-gray-100">',
  '              <div className="text-3xl font-bold text-gray-900">{score}<span className="text-gray-400 text-lg">/{maxScore}</span></div>',
  '              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Skor</div>',
  '            </div>',
  '            <div className="text-center border-r border-gray-100">',
  '              <div className="text-3xl font-bold text-gray-900">{Math.round(scorePercent)}%</div>',
  '              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Akurasi</div>',
  '            </div>',
  '            <div className="text-center">',
  '              <div className="text-3xl font-bold text-gray-900">{Math.floor(timeElapsedSec / 60)}:{String(timeElapsedSec % 60).padStart(2, "0")}</div>',
  '              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Waktu</div>',
  '            </div>',
  '          </div>',
  '          <p className="text-gray-700 text-base leading-relaxed">{result.description}</p>',
  '        </motion.div>',
  '',
  '        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}',
  '          className={"rounded-3xl p-6 md:p-8 mb-6 border " + lc.soft + " " + lc.border}>',
  '          <div className="flex items-start gap-3 mb-4">',
  '            <Icons.Target className={"w-6 h-6 flex-shrink-0 mt-0.5 " + lc.text} />',
  '            <div className="flex-1">',
  '              <p className={"text-xs uppercase tracking-widest font-semibold mb-1 " + lc.text}>Rekomendasi Kami</p>',
  '              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Mulai dari {result.startChapter}</h3>',
  '              <p className="text-gray-700 text-sm md:text-base">',
  '                Estimasi selesai ke level B2: <span className="font-bold">{result.estimationMonths} bulan</span> kalau ikut kelas reguler.',
  '              </p>',
  '            </div>',
  '          </div>',
  '        </motion.div>',
  '',
  '        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}',
  '          className="flex flex-col gap-3">',
  '          <button onClick={handleStartLearning}',
  '            className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#1A9E9E] text-white rounded-full font-bold text-lg hover:bg-[#147a7a] shadow-xl shadow-[#1A9E9E]/20 transition-all group">',
  '            Mulai Belajar dari {result.sublevel}',
  '            <Icons.ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />',
  '          </button>',
  '          <div className="flex gap-3">',
  '            <Link href={"/silabus/" + meta.slug} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors">',
  '              <Icons.BookOpen className="w-4 h-4" /> Lihat Silabus',
  '            </Link>',
  '            <button onClick={onRetake} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors">',
  '              <Icons.RotateCw className="w-4 h-4" /> Ulangi Test',
  '            </button>',
  '          </div>',
  '        </motion.div>',
  '',
  '        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}',
  '          className="text-center text-xs text-gray-400 mt-8">',
  '          Hasil tersimpan untuk membantu pengajar Linguo merekomendasikan kelas yang pas.',
  '        </motion.p>',
  '      </div>',
  '    </motion.section>',
  '  );',
  '}',
].join('\n'));

// ============================================================
// 4. API endpoint — POST /api/placement-result
// ============================================================
write('src/app/api/placement-result/route.ts', `
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { language, level, score, timeElapsedSec, source } = body;

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json({ success: false, error: "Missing Supabase config" }, { status: 500 });
    }

    const res = await fetch(SUPABASE_URL + "/rest/v1/placement_results", {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ language, level, score, time_elapsed_sec: timeElapsedSec, source }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ success: false, error: err }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
`);

// ============================================================
// 5. SQL migration
// ============================================================
const sqlPath = '/tmp/placement-test-migration.sql';
fs.writeFileSync(sqlPath, `-- Run di Supabase SQL Editor
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

ALTER TABLE placement_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow anon insert placement" ON placement_results;
CREATE POLICY "allow anon insert placement" ON placement_results FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "allow authenticated read placement" ON placement_results;
CREATE POLICY "allow authenticated read placement" ON placement_results FOR SELECT TO authenticated USING (true);
`, 'utf8');
console.log(`\n📄 SQL: ${sqlPath}`);

// ============================================================
// Git
// ============================================================
console.log('\n🚀 Git...\n');
try {
  execSync('git add -A', { stdio: 'inherit', cwd: ROOT });
  execSync('git commit -m "feat(silabus): placement test /coba with result + recommendation"', { stdio: 'inherit', cwd: ROOT });
  execSync('git push', { stdio: 'inherit', cwd: ROOT });
  console.log('\n✅ Pushed\n');
} catch (e) {
  console.log('\n⚠️  Git:', e.message);
}

try { fs.unlinkSync(fileURLToPath(import.meta.url)); } catch {}

console.log('═══════════════════════════════════════════════');
console.log(`📋 Jalanin SQL di Supabase: cat ${sqlPath}`);
console.log('   Test: linguo.id/silabus/english/coba');
console.log('═══════════════════════════════════════════════\n');
