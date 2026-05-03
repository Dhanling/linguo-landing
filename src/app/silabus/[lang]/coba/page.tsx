"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Award, BookOpen, CheckCircle2, ChevronRight,
  Clock, FileText, GraduationCap, Loader2, Sparkles, Target, X
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & DATA
// ─────────────────────────────────────────────────────────────────────────────

type TestType = "ielts" | "toefl-itp";
type Phase = "intro" | "lead" | "test" | "result";

type Question = {
  id: string;
  category: "reading" | "listening" | "grammar" | "vocabulary";
  question: string;
  passage?: string;
  options: string[];
  answer: number;
  explanation: string;
};

type ResultBand = {
  level: string;
  range: string;
  description: string;
  recommendation: string;
};

// ── IELTS Questions (10 mixed difficulty) ──
const IELTS_QUESTIONS: Question[] = [
  {
    id: "i1",
    category: "vocabulary",
    question: "Choose the word closest in meaning to 'meticulous':",
    options: ["Careless", "Thorough", "Quick", "Loud"],
    answer: 1,
    explanation: "'Meticulous' means showing great attention to detail; very careful and precise. 'Thorough' is the closest synonym.",
  },
  {
    id: "i2",
    category: "grammar",
    question: "If I _____ more time, I would have finished the project.",
    options: ["have", "had", "would have", "have had"],
    answer: 1,
    explanation: "This is a third conditional sentence (past unreal). The structure is: If + past perfect, would have + past participle. So 'had' is correct.",
  },
  {
    id: "i3",
    category: "reading",
    passage: "Despite the recent advances in renewable energy technology, fossil fuels continue to dominate global energy production. Critics argue that government subsidies for traditional energy sources hinder the transition to cleaner alternatives.",
    question: "According to the passage, what is the MAIN obstacle to renewable energy adoption?",
    options: [
      "Lack of technology",
      "Government subsidies for fossil fuels",
      "High costs of renewable energy",
      "Public resistance",
    ],
    answer: 1,
    explanation: "The passage explicitly states that critics blame 'government subsidies for traditional energy sources' as the obstacle.",
  },
  {
    id: "i4",
    category: "vocabulary",
    question: "The 'ramifications' of the decision were unforeseen. 'Ramifications' means:",
    options: ["Benefits", "Consequences", "Origins", "Costs"],
    answer: 1,
    explanation: "'Ramifications' refers to the complex consequences or results of an action or decision.",
  },
  {
    id: "i5",
    category: "grammar",
    question: "The book, _____ I borrowed from the library, was fascinating.",
    options: ["who", "whose", "which", "that's"],
    answer: 2,
    explanation: "'Which' introduces a non-defining relative clause for things (set off by commas). 'That' would be used without commas.",
  },
  {
    id: "i6",
    category: "reading",
    passage: "Climate scientists have observed that Arctic sea ice is declining at an unprecedented rate. While natural variability plays a role, the overwhelming consensus attributes the trend primarily to anthropogenic factors.",
    question: "The word 'anthropogenic' most likely means:",
    options: ["Natural", "Human-caused", "Seasonal", "Temporary"],
    answer: 1,
    explanation: "'Anthropogenic' means originating from human activity. Context clues: it contrasts with 'natural variability'.",
  },
  {
    id: "i7",
    category: "vocabulary",
    question: "Choose the word that best completes: 'Her _____ to detail made her an excellent editor.'",
    options: ["attention", "intention", "tension", "extension"],
    answer: 0,
    explanation: "'Attention to detail' is a fixed collocation meaning careful focus on small things.",
  },
  {
    id: "i8",
    category: "grammar",
    question: "By the time we arrived, the meeting _____.",
    options: ["already started", "has already started", "had already started", "was already starting"],
    answer: 2,
    explanation: "Past perfect ('had started') describes an action completed before another past action ('arrived').",
  },
  {
    id: "i9",
    category: "vocabulary",
    question: "The argument was 'cogent'. This means it was:",
    options: ["Confusing", "Convincing", "Long", "Aggressive"],
    answer: 1,
    explanation: "'Cogent' means clear, logical, and convincing.",
  },
  {
    id: "i10",
    category: "reading",
    passage: "The proliferation of digital media has fundamentally altered how news is consumed. Whereas previous generations relied on a handful of authoritative sources, today's audiences navigate a fragmented landscape of countless outlets, each with varying degrees of credibility.",
    question: "What is the author's main point?",
    options: [
      "Digital media is better than traditional media",
      "News consumption has become more complex",
      "Old media sources were always reliable",
      "People should avoid digital news",
    ],
    answer: 1,
    explanation: "The author describes the shift from 'a handful of authoritative sources' to 'a fragmented landscape', emphasizing increased complexity.",
  },
];

// ── TOEFL ITP Questions (10 mixed) ──
const TOEFL_QUESTIONS: Question[] = [
  {
    id: "t1",
    category: "grammar",
    question: "The committee _____ its decision next week.",
    options: ["announce", "announces", "will announce", "announcing"],
    answer: 2,
    explanation: "Future tense 'will announce' is correct because of 'next week'.",
  },
  {
    id: "t2",
    category: "vocabulary",
    question: "'The data was inconclusive.' 'Inconclusive' means:",
    options: ["Clear", "Not definitive", "Wrong", "Important"],
    answer: 1,
    explanation: "'Inconclusive' means not leading to a definite result or conclusion.",
  },
  {
    id: "t3",
    category: "grammar",
    question: "Neither the manager nor the employees _____ satisfied with the new policy.",
    options: ["is", "are", "was", "has been"],
    answer: 1,
    explanation: "With 'neither...nor', the verb agrees with the subject closer to it. 'Employees' is plural, so 'are' is correct.",
  },
  {
    id: "t4",
    category: "reading",
    passage: "Photosynthesis is the process by which green plants and certain other organisms transform light energy into chemical energy. During photosynthesis, plants absorb carbon dioxide and water, producing glucose and oxygen as byproducts.",
    question: "What are the byproducts of photosynthesis according to the passage?",
    options: ["Carbon dioxide and water", "Glucose and oxygen", "Light and chemical energy", "Plants and organisms"],
    answer: 1,
    explanation: "The passage clearly states 'producing glucose and oxygen as byproducts'.",
  },
  {
    id: "t5",
    category: "grammar",
    question: "She suggested that he _____ more carefully.",
    options: ["drives", "drove", "drive", "would drive"],
    answer: 2,
    explanation: "After verbs of suggestion (suggest, recommend, insist), the subjunctive form (base form 'drive') is used.",
  },
  {
    id: "t6",
    category: "vocabulary",
    question: "Choose the synonym for 'abundant':",
    options: ["Scarce", "Plentiful", "Hidden", "Useless"],
    answer: 1,
    explanation: "'Abundant' means existing in large quantities; plentiful.",
  },
  {
    id: "t7",
    category: "grammar",
    question: "The book _____ on the table belongs to Sarah.",
    options: ["lying", "lays", "laid", "is lying"],
    answer: 0,
    explanation: "'Lying' is the present participle of 'lie' (to be in a horizontal position). It functions as a reduced relative clause: 'the book [which is] lying'.",
  },
  {
    id: "t8",
    category: "reading",
    passage: "The Industrial Revolution, beginning in Britain in the late 18th century, marked a major turning point in history. Almost every aspect of daily life was influenced in some way. Average income and population began to exhibit unprecedented sustained growth.",
    question: "What does the passage suggest about the Industrial Revolution?",
    options: [
      "It only affected Britain",
      "It had widespread, lasting impact",
      "It caused population decline",
      "It was insignificant",
    ],
    answer: 1,
    explanation: "The passage emphasizes 'major turning point' and 'unprecedented sustained growth' indicating widespread, lasting impact.",
  },
  {
    id: "t9",
    category: "vocabulary",
    question: "'The professor was renowned for her research.' 'Renowned' means:",
    options: ["Unknown", "Famous", "Tired", "Wealthy"],
    answer: 1,
    explanation: "'Renowned' means known or talked about by many people; famous.",
  },
  {
    id: "t10",
    category: "grammar",
    question: "If I _____ you, I would accept the job offer.",
    options: ["am", "was", "were", "be"],
    answer: 2,
    explanation: "In the second conditional (hypothetical present), 'were' is the correct subjunctive form for all subjects.",
  },
];

// ── Result Bands ──
const IELTS_BANDS: ResultBand[] = [
  { level: "Band 4-5", range: "0-3", description: "Modest user — basic command", recommendation: "Mulai dari Foundation IELTS untuk membangun fondasi yang kuat di semua skill." },
  { level: "Band 5-6", range: "4-6", description: "Competent user — generally effective", recommendation: "Program IELTS Intermediate untuk menargetkan Band 6.5+ dalam 2-3 bulan." },
  { level: "Band 6-7", range: "7-8", description: "Good user — operational command", recommendation: "Program IELTS Advanced untuk Band 7+ dengan fokus strategi & writing." },
  { level: "Band 7+", range: "9-10", description: "Very good user — fully operational", recommendation: "Program IELTS Mastery untuk Band 8+ dengan teknik & mock tests." },
];

const TOEFL_BANDS: ResultBand[] = [
  { level: "450-500", range: "0-3", description: "Beginner — basic understanding", recommendation: "Mulai dari TOEFL Foundation untuk meningkatkan grammar & vocabulary." },
  { level: "500-550", range: "4-6", description: "Intermediate — functional", recommendation: "TOEFL Intermediate untuk menargetkan score 550+ dalam 2-3 bulan." },
  { level: "550-600", range: "7-8", description: "Advanced — proficient", recommendation: "TOEFL Advanced untuk score 600+ dengan strategi & timed practice." },
  { level: "600+", range: "9-10", description: "Expert — near-native", recommendation: "TOEFL Mastery untuk score 630+ dengan teknik test-taking lanjutan." },
];

function getResult(score: number, total: number, type: TestType): ResultBand | null {
  const bands = type === "ielts" ? IELTS_BANDS : TOEFL_BANDS;
  if (score <= 3) return bands[0];
  if (score <= 6) return bands[1];
  if (score <= 8) return bands[2];
  return bands[3];
}

const CATEGORY_ICONS: Record<string, string> = {
  reading: "📖",
  listening: "🎧",
  grammar: "📝",
  vocabulary: "🔤",
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function PlacementTestPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params?.lang as string;

  const testType: TestType = lang === "ielts" ? "ielts" : "toefl-itp";
  const testLabel = testType === "ielts" ? "IELTS" : "TOEFL ITP";
  const questions = useMemo(
    () => (testType === "ielts" ? IELTS_QUESTIONS : TOEFL_QUESTIONS),
    [testType]
  );

  const [phase, setPhase] = useState<Phase>("intro");

  // Lead form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [wa, setWa] = useState("");
  const [saving, setSaving] = useState(false);
  const [leadErr, setLeadErr] = useState("");

  // Test state
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);

  // Validate route
  useEffect(() => {
    if (lang !== "ielts" && lang !== "toefl-itp") {
      router.push("/silabus");
    }
  }, [lang, router]);

  // ── Submit lead form ──
  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !wa.trim()) {
      setLeadErr("Mohon lengkapi semua field.");
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) { setLeadErr("Format email tidak valid."); return; }

    setSaving(true);
    setLeadErr("");
    const { error } = await supabase.from("leads").insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      whatsapp: wa.trim(),
      source: `placement-${testType}`,
      interest: testType,
      created_at: new Date().toISOString(),
    });

    setSaving(false);
    if (error) {
      console.error("[leads insert]", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      setLeadErr("Gagal menyimpan data. Coba lagi ya.");
      return;
    }
    setPhase("test");
  }

  // ── Answer a question ──
  function selectAnswer(idx: number) {
    if (showFeedback) return;
    setSelected(idx);
    setShowFeedback(true);
    setAnswers(prev => ({ ...prev, [questions[current].id]: idx }));
  }

  // ── Next question ──
  function nextQuestion() {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
      setSelected(null);
      setShowFeedback(false);
    } else {
      // Calculate score
      const s = questions.reduce((acc, q) => acc + (answers[q.id] === q.answer ? 1 : 0), 0);
      setScore(s);
      setPhase("result");
    }
  }

  const result = getResult(score, questions.length, testType);
  const progress = ((current + 1) / questions.length) * 100;
  const q = questions[current];

  const waLink = `https://wa.me/6281387797267?text=${encodeURIComponent(
    `Halo Linguo! Saya baru selesai placement test ${testLabel} dan dapat rekomendasi level ${result?.level}. Saya ingin tahu lebih lanjut tentang program persiapan ${testLabel} di Linguo.`
  )}`;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: INTRO
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "intro") return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
      >
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-8 text-white text-center">
          <Award className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-2xl font-bold mb-2">Placement Test {testLabel}</h1>
          <p className="text-teal-50 text-sm">10 soal · 15 menit · Gratis</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">Dapatkan estimasi level {testLabel} kamu</p>
            </div>
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">Soal mencakup Reading, Grammar, & Vocabulary</p>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">Rekomendasi program belajar yang sesuai</p>
            </div>
          </div>
          <button
            onClick={() => setPhase("lead")}
            className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
          >
            Mulai Test <ChevronRight className="w-5 h-5" />
          </button>
          <Link href="/silabus" className="block text-center text-sm text-gray-500 hover:text-gray-700">
            ← Kembali ke Silabus
          </Link>
        </div>
      </motion.div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: LEAD FORM
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "lead") return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-6 text-white">
          <button
            onClick={() => setPhase("intro")}
            className="text-teal-50 hover:text-white text-sm flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          <h2 className="text-xl font-bold mb-1">Hampir mulai!</h2>
          <p className="text-teal-50 text-sm">Isi data singkat untuk mulai placement test</p>
        </div>

        {/* Form */}
        <form onSubmit={submitLead} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Nama Lengkap *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nama kamu"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Email *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">WhatsApp *</label>
            <input
              type="tel"
              value={wa}
              onChange={e => setWa(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              required
            />
          </div>

          {leadErr && <p className="text-xs text-red-500">{leadErr}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...</>
            ) : (
              <>Lanjut ke Test <ChevronRight className="w-5 h-5" /></>
            )}
          </button>
          <p className="text-[10px] text-gray-400 text-center">
            Data kamu kami simpan untuk follow-up rekomendasi program belajar.
          </p>
        </form>
      </motion.div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: TEST
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "test") return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">
              {CATEGORY_ICONS[q.category]} {q.category.toUpperCase()} · Soal {current + 1}/{questions.length}
            </span>
            <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-600"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="p-6 md:p-8 space-y-5">
            {q.passage && (
              <div className="bg-slate-50 border-l-4 border-teal-500 p-4 rounded-r-lg text-sm text-gray-700 leading-relaxed">
                {q.passage}
              </div>
            )}
            <h3 className="text-base md:text-lg font-semibold text-gray-900 leading-relaxed">
              {q.question}
            </h3>

            <div className="space-y-2">
              {q.options.map((opt, idx) => {
                const isSelected = selected === idx;
                const isCorrect = idx === q.answer;
                const showCorrect = showFeedback && isCorrect;
                const showWrong = showFeedback && isSelected && !isCorrect;

                return (
                  <button
                    key={idx}
                    onClick={() => selectAnswer(idx)}
                    disabled={showFeedback}
                    className={`w-full p-3.5 text-left rounded-xl border-2 transition-all text-sm ${
                      showCorrect
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                        : showWrong
                          ? "border-red-500 bg-red-50 text-red-900"
                          : isSelected
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-200 hover:border-teal-300 hover:bg-slate-50"
                    } ${showFeedback ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900"
                >
                  <p className="font-semibold mb-1 flex items-center gap-2">
                    {selected === q.answer ? (
                      <><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Benar!</>
                    ) : (
                      <><X className="w-4 h-4 text-red-600" /> Belum tepat</>
                    )}
                  </p>
                  <p className="text-xs leading-relaxed">{q.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {showFeedback && (
              <button
                onClick={nextQuestion}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
              >
                {current < questions.length - 1 ? "Soal Berikutnya" : "Lihat Hasil"}
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: RESULT
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "result" && result) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
      >
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-8 text-white text-center">
          <GraduationCap className="w-16 h-16 mx-auto mb-3 opacity-90" />
          <p className="text-teal-50 text-xs uppercase tracking-wider mb-2">Estimasi Level {testLabel}</p>
          <h2 className="text-3xl font-bold mb-2">{result.level}</h2>
          <p className="text-teal-50 text-sm">{result.description}</p>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Skor kamu</p>
            <p className="text-2xl font-bold text-gray-900">{score} / {questions.length}</p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Rekomendasi Program
            </p>
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
              <p className="text-sm text-gray-800 leading-relaxed">{result.recommendation}</p>
            </div>
          </div>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
          >
            Konsultasi via WhatsApp <ChevronRight className="w-5 h-5" />
          </a>

          <Link href={`/silabus/${testType}`} className="block text-center text-sm text-gray-500 hover:text-gray-700">
            Lihat Silabus Lengkap →
          </Link>
        </div>
      </motion.div>
    </div>
  );

  // Fallback
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
    </div>
  );
}
