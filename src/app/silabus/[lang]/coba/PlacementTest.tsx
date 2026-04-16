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
  const [selected, setSelected] = useState<string | number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const startTimeRef = useRef<number>(0);

  const question = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;

  useEffect(() => {
    if (screen === "quiz" && currentQ === 0) startTimeRef.current = Date.now();
  }, [screen, currentQ]);

  const startTest = () => {
    setScreen("quiz"); setCurrentQ(0); setScore(0); setSelected(null); setShowFeedback(false);
  };

  const submitAnswer = () => {
    if (selected === null) return;
    if (selected === question.correct) setScore((s) => s + DIFFICULTY_POINTS[question.difficulty]);
    setShowFeedback(true);
  };

  const nextQuestion = () => {
    setShowFeedback(false);
    setSelected(null);
    if (currentQ + 1 < questions.length) setCurrentQ((i) => i + 1);
    else setScreen("result");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      <AnimatePresence mode="wait">
        {screen === "intro" && (
          <IntroScreen key="intro" meta={meta} total={questions.length} onStart={startTest} />
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
            meta={meta}
            timeElapsedSec={Math.floor((Date.now() - startTimeRef.current) / 1000)}
            onRetake={startTest}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function IntroScreen({ meta, total, onStart }: { meta: any; total: number; onStart: () => void }) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="max-w-2xl w-full">
        <Link href={"/silabus/" + meta.slug} className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1 mb-8 group">
          <Icons.ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Kembali ke silabus
        </Link>

        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="text-8xl mb-6">{meta.flag}</motion.div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Placement Test<br />
          <span className="text-[#1A9E9E]">Bahasa {meta.name}</span>
        </h1>

        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          Gratis, 2 menit. Dapatkan level CEFR kamu + rekomendasi chapter yang pas untuk mulai.
        </p>

        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
          <InfoCard icon="List" value={String(total)} label="Soal" />
          <InfoCard icon="Clock" value="~2 mnt" label="Durasi" />
          <InfoCard icon="Award" value="CEFR" label="Standard" />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 md:p-5 mb-8">
          <div className="flex items-start gap-3">
            <Icons.Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900 leading-relaxed">
              <p className="font-semibold mb-1">Tips supaya akurat:</p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                <li>Jawab yang kamu tau, tebak yang ragu</li>
                <li>Ga perlu sempurna — test ini buat tentuin level</li>
                <li>Hasil disimpan supaya pengajar tau level kamu</li>
              </ul>
            </div>
          </div>
        </div>

        <button onClick={onStart}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#1A9E9E] text-white rounded-full font-bold text-lg hover:bg-[#147a7a] shadow-xl shadow-[#1A9E9E]/20 transition-all group">
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

function QuizScreen(props: {
  question: Question; currentQ: number; total: number; progress: number;
  selected: string | number | null; showFeedback: boolean;
  onSelect: (v: string | number) => void; onSubmit: () => void; onNext: () => void; langSlug: string;
}) {
  const { question, currentQ, total, progress, selected, showFeedback, onSelect, onSubmit, onNext, langSlug } = props;
  const [fillValue, setFillValue] = useState("");
  useEffect(() => { setFillValue(""); }, [question.id]);
  const isCorrect = selected === question.correct;

  const diffCls = question.difficulty === "A1" ? "bg-emerald-100 text-emerald-700" :
                   question.difficulty === "A2" ? "bg-sky-100 text-sky-700" :
                   question.difficulty === "B1" ? "bg-violet-100 text-violet-700" :
                                                   "bg-rose-100 text-rose-700";

  return (
    <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="min-h-screen flex items-center justify-center px-6 py-10 md:py-16">
      <div className="max-w-2xl w-full">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2 text-sm">
            <div className="flex items-center gap-2">
              <Link href={"/silabus/" + langSlug} className="text-gray-400 hover:text-gray-600">
                <Icons.X className="w-4 h-4" />
              </Link>
              <span className="text-gray-500">Soal <span className="font-bold text-gray-900">{currentQ + 1}</span> dari {total}</span>
            </div>
            <span className={"text-xs font-bold px-2 py-0.5 rounded-full " + diffCls}>{question.difficulty}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div className="h-full bg-[#1A9E9E] rounded-full"
              initial={{ width: 0 }} animate={{ width: progress + "%" }} transition={{ duration: 0.4 }} />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug mb-3">{question.question}</h2>
          {question.context && (
            <p className="text-sm md:text-base text-gray-600 italic mb-5 font-mono bg-gray-50 px-4 py-3 rounded-xl">{question.context}</p>
          )}

          <div className="space-y-2 mt-6">
            {question.type === "multiple" && question.options && question.options.map((opt, i) => {
              const isSelected = selected === i;
              const isAnswerCorrect = question.correct === i;
              let cls = "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50";
              if (showFeedback && isAnswerCorrect) cls = "border-emerald-500 bg-emerald-50";
              else if (showFeedback && isSelected && !isAnswerCorrect) cls = "border-rose-500 bg-rose-50";
              else if (isSelected) cls = "border-[#1A9E9E] bg-[#1A9E9E]/5";
              return (
                <button key={i} onClick={() => !showFeedback && onSelect(i)} disabled={showFeedback}
                  className={"w-full text-left px-5 py-4 rounded-2xl border-2 transition-all " + cls}>
                  <div className="flex items-center gap-3">
                    <span className={"flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold flex-shrink-0 " + (isSelected ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600")}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-gray-900">{opt}</span>
                    {showFeedback && isAnswerCorrect && <Icons.Check className="w-5 h-5 text-emerald-600 ml-auto" />}
                    {showFeedback && isSelected && !isAnswerCorrect && <Icons.X className="w-5 h-5 text-rose-600 ml-auto" />}
                  </div>
                </button>
              );
            })}

            {question.type === "fill" && (
              <input type="text" value={fillValue}
                onChange={(e) => { setFillValue(e.target.value); onSelect(e.target.value.toLowerCase().trim()); }}
                disabled={showFeedback} placeholder="Ketik jawaban..."
                className={"w-full px-5 py-4 rounded-2xl border-2 focus:outline-none transition-colors " + (showFeedback ? (selected === question.correct ? "border-emerald-500 bg-emerald-50" : "border-rose-500 bg-rose-50") : "border-gray-200 focus:border-[#1A9E9E]")}
              />
            )}
          </div>

          <AnimatePresence>
            {showFeedback && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className={"mt-5 p-4 rounded-2xl flex items-start gap-3 " + (isCorrect ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900")}>
                  <div className={"w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 " + (isCorrect ? "bg-emerald-500" : "bg-rose-500")}>
                    {isCorrect ? <Icons.Check className="w-4 h-4 text-white" strokeWidth={3} /> : <Icons.X className="w-4 h-4 text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold mb-1">{isCorrect ? "Benar!" : "Kurang tepat."}</p>
                    <p className="text-sm">{question.explanation}</p>
                    {!isCorrect && question.type === "multiple" && question.options && (
                      <p className="text-sm mt-2"><span className="font-semibold">Jawaban benar:</span> {question.options[question.correct as number]}</p>
                    )}
                    {!isCorrect && question.type === "fill" && (
                      <p className="text-sm mt-2"><span className="font-semibold">Jawaban benar:</span> {String(question.correct)}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-end">
          {!showFeedback ? (
            <button onClick={onSubmit} disabled={selected === null || (typeof selected === "string" && !selected)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#1A9E9E] text-white rounded-full font-bold hover:bg-[#147a7a] disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#1A9E9E]/20 transition-all">
              Jawab <Icons.ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={onNext}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-full font-bold hover:bg-gray-700 shadow-lg transition-all">
              {currentQ + 1 < total ? "Soal berikutnya" : "Lihat hasil"}
              <Icons.ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </motion.section>
  );
}

function ResultScreen({ score, meta, timeElapsedSec, onRetake }: {
  score: number; meta: any; timeElapsedSec: number; onRetake: () => void;
}) {
  const result = determineLevel(score);
  const maxScore = 39;
  const scorePercent = (score / maxScore) * 100;

  const levelColorMap: Record<string, { bg: string; text: string; soft: string; border: string }> = {
    A1: { bg: "bg-emerald-100", text: "text-emerald-600", soft: "bg-emerald-50", border: "border-emerald-200" },
    A2: { bg: "bg-sky-100", text: "text-sky-600", soft: "bg-sky-50", border: "border-sky-200" },
    B1: { bg: "bg-violet-100", text: "text-violet-600", soft: "bg-violet-50", border: "border-violet-200" },
    B2: { bg: "bg-rose-100", text: "text-rose-600", soft: "bg-rose-50", border: "border-rose-200" },
  };
  const lc = levelColorMap[result.level];

  const handleStartLearning = () => {
    const w = window as any;
    const langFull = "Bahasa " + meta.name;
    const sourceTag = "placement-test-" + meta.slug;
    if (typeof w.__openFunnel === "function") {
      try {
        w.__openFunnel({
          language: langFull,
          level: result.sublevel,
          preferredProgram: "Kelas Private",
          source: sourceTag,
        });
      } catch {
        w.__openFunnel(langFull);
      }
    } else {
      window.location.href = "/?lang=" + encodeURIComponent(langFull) + "&from=" + sourceTag + "&level=" + result.sublevel + "&program=Kelas+Private";
    }
  };

  useEffect(() => {
    fetch("/api/placement-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: meta.name,
        level: result.sublevel,
        score,
        timeElapsedSec,
        source: "placement-test-" + meta.slug,
      }),
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="min-h-screen py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.2 }}
            className={"inline-flex items-center justify-center w-24 h-24 rounded-full mb-5 " + lc.bg}>
            <Icons.Award className={"w-12 h-12 " + lc.text} strokeWidth={2} />
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-sm text-gray-500 uppercase tracking-widest mb-2">Hasil Placement Test</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="text-5xl md:text-6xl font-bold tracking-tight mb-2">
            Level kamu <span className={lc.text}>{result.sublevel}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className={"text-xl font-semibold mb-4 " + lc.text}>{result.label}</motion.p>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm mb-6">
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

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
          className={"rounded-3xl p-6 md:p-8 mb-6 border " + lc.soft + " " + lc.border}>
          <div className="flex items-start gap-3 mb-4">
            <Icons.Target className={"w-6 h-6 flex-shrink-0 mt-0.5 " + lc.text} />
            <div className="flex-1">
              <p className={"text-xs uppercase tracking-widest font-semibold mb-1 " + lc.text}>Rekomendasi Kami</p>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Mulai dari {result.startChapter}</h3>
              <p className="text-gray-700 text-sm md:text-base">
                Estimasi selesai ke B2: <span className="font-bold">{result.estimationMonths} bulan</span> dengan kelas private intensif (3x/minggu).
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
          className="flex flex-col gap-3">
          <button onClick={handleStartLearning}
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#1A9E9E] text-white rounded-full font-bold text-lg hover:bg-[#147a7a] shadow-xl shadow-[#1A9E9E]/20 transition-all group">
            Mulai Belajar dari {result.sublevel}
            <Icons.ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <div className="flex gap-3">
            <Link href={"/silabus/" + meta.slug} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors">
              <Icons.BookOpen className="w-4 h-4" /> Lihat Silabus
            </Link>
            <button onClick={onRetake} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors">
              <Icons.RotateCw className="w-4 h-4" /> Ulangi Test
            </button>
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="text-center text-xs text-gray-400 mt-8">
          Hasil tersimpan untuk membantu pengajar Linguo merekomendasikan kelas yang pas.
        </motion.p>
      </div>
    </motion.section>
  );
}