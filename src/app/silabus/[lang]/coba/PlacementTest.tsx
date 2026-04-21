"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";
import type { LanguageCurriculum } from "@/data/curriculum";
import { type Question, type DragDropQuestion, type MissingQuestion, type MatchingQuestion, type FillChoiceQuestion, DIFFICULTY_POINTS, determineLevel } from "@/data/placement/english";

interface Props {
  curriculum: LanguageCurriculum;
  questions: Question[];
}

type Screen = "intro" | "quiz" | "result";

function renderRich(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i} className="font-bold text-gray-900">{p.slice(2, -2)}</strong>;
    }
    return <span key={i}>{p}</span>;
  });
}

export default function PlacementTest({ curriculum, questions }: Props) {
  const { meta } = curriculum;
  const [screen, setScreen] = useState<Screen>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<string | number | boolean | null>(null);
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

  // Auto-submit on click (multiple) or explicit submit (fill/dragDrop/missing/matching)
  // For complex types (dragDrop, missing, matching) the renderer computes correctness
  // and passes a boolean flag as `isCorrectOverride`
  const submitAnswer = (value: string | number | boolean, isCorrectOverride?: boolean) => {
    if (showFeedback) return;
    setSelected(value);
    const correct = isCorrectOverride !== undefined
      ? isCorrectOverride
      : (question.type === "multiple" || question.type === "fill" || question.type === "fillChoice") && value === (question as any).correct;
    if (correct) setScore((s) => s + DIFFICULTY_POINTS[question.difficulty]);
    setShowFeedback(true);
  };

  // Pass / skip — mark wrong, show explanation, no score
  const passAnswer = () => {
    if (showFeedback) return;
    setSelected("__PASSED__");
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
            onSubmit={submitAnswer}
            onPass={passAnswer}
            onNext={nextQuestion}
            langSlug={meta.slug}
          />
        )}
        {screen === "result" && (
          <ResultScreen
            key="result"
            score={score}
            questions={questions}
            meta={meta}
            timeElapsedSec={Math.floor((Date.now() - startTimeRef.current) / 1000)}
            onRetake={startTest}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

// ================================================
// INTRO
// ================================================
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
                <li>Klik opsi = jawaban langsung tersubmit (tanpa tombol)</li>
                <li>Baca penjelasan setelah jawab — itu pembelajaran intinya</li>
                <li>Jawab jujur, tebak kalau ragu</li>
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

// ================================================
// QUIZ (AUTO-SUBMIT on click)
// ================================================
function QuizScreen(props: {
  question: Question; currentQ: number; total: number; progress: number;
  selected: string | number | boolean | null; showFeedback: boolean;
  onSubmit: (v: string | number | boolean, isCorrectOverride?: boolean) => void;
  onPass: () => void;
  onNext: () => void; langSlug: string;
}) {
  const { question, currentQ, total, progress, selected, showFeedback, onSubmit, onPass, onNext, langSlug } = props;
  const [fillValue, setFillValue] = useState("");
  useEffect(() => { setFillValue(""); }, [question.id]);
  const isPassed = selected === "__PASSED__";
  // isCorrect differs per type
  const isCorrect = isPassed
    ? false
    : question.type === "multiple" || question.type === "fill" || question.type === "fillChoice"
      ? selected === (question as any).correct
      : selected === true;

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
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug mb-3">
            {question.type === "dragDrop" || question.type === "matching"
              ? (question as any).prompt
              : (question as any).question}
          </h2>
          {question.type === "dragDrop" && (
            <p className="text-sm md:text-base text-gray-600 italic mb-5 bg-[#1A9E9E]/5 border-l-4 border-[#1A9E9E] px-4 py-3 rounded-r-xl">
              <span className="font-semibold text-[#1A9E9E] not-italic">Terjemahan: </span>
              {(question as any).translation}
            </p>
          )}
          {question.type === "fill" && (question as any).context && (
            <p className="text-sm md:text-base text-gray-600 italic mb-5 font-mono bg-gray-50 px-4 py-3 rounded-xl">{(question as any).context}</p>
          )}

          <div className="space-y-2 mt-6">
            {question.type === "multiple" && question.options.map((opt, i) => {
              const isSelected = selected === i;
              const isAnswerCorrect = question.correct === i;
              let cls = "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 cursor-pointer";
              if (showFeedback && isAnswerCorrect) cls = "border-emerald-500 bg-emerald-50";
              else if (showFeedback && isSelected && !isAnswerCorrect) cls = "border-rose-500 bg-rose-50";
              else if (showFeedback) cls = "border-gray-200 bg-white opacity-50";
              else if (isSelected) cls = "border-[#1A9E9E] bg-[#1A9E9E]/5";
              return (
                <button key={i} onClick={() => onSubmit(i)} disabled={showFeedback}
                  className={"w-full text-left px-5 py-4 rounded-2xl border-2 transition-all " + cls}>
                  <div className="flex items-center gap-3">
                    <span className={"flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold flex-shrink-0 " + ((showFeedback && isAnswerCorrect) ? "bg-emerald-500 text-white" : (showFeedback && isSelected && !isAnswerCorrect) ? "bg-rose-500 text-white" : isSelected ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600")}>
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
              <div className="flex gap-2">
                <input type="text" value={fillValue}
                  onChange={(e) => setFillValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && fillValue.trim() && !showFeedback) onSubmit(fillValue.toLowerCase().trim()); }}
                  disabled={showFeedback} placeholder="Ketik jawaban lalu Enter..."
                  className={"flex-1 px-5 py-4 rounded-2xl border-2 focus:outline-none transition-colors " + (showFeedback ? (selected === question.correct ? "border-emerald-500 bg-emerald-50" : "border-rose-500 bg-rose-50") : "border-gray-200 focus:border-[#1A9E9E]")}
                />
                {!showFeedback && (
                  <button onClick={() => fillValue.trim() && onSubmit(fillValue.toLowerCase().trim())} disabled={!fillValue.trim()}
                    className="px-6 py-4 bg-[#1A9E9E] text-white rounded-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed">
                    OK
                  </button>
                )}
              </div>
            )}

            {question.type === "fillChoice" && (
              <div className="grid grid-cols-2 gap-2">
                {question.options.map((opt, i) => {
                  const isSelected = selected === opt;
                  const isAnswerCorrect = question.correct === opt;
                  let cls = "border-gray-200 bg-white hover:border-[#1A9E9E] hover:bg-[#1A9E9E]/5 cursor-pointer";
                  if (showFeedback && isAnswerCorrect) cls = "border-emerald-500 bg-emerald-50";
                  else if (showFeedback && isSelected && !isAnswerCorrect) cls = "border-rose-500 bg-rose-50";
                  else if (showFeedback) cls = "border-gray-200 bg-white opacity-50";
                  else if (isSelected) cls = "border-[#1A9E9E] bg-[#1A9E9E]/10";
                  return (
                    <button key={i} onClick={() => onSubmit(opt)} disabled={showFeedback}
                      className={"w-full px-5 py-4 rounded-2xl border-2 text-center transition-all text-lg font-semibold " + cls}>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-gray-900">{opt}</span>
                        {showFeedback && isAnswerCorrect && <Icons.Check className="w-5 h-5 text-emerald-600" />}
                        {showFeedback && isSelected && !isAnswerCorrect && <Icons.X className="w-5 h-5 text-rose-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {question.type === "dragDrop" && (
              <DragDropRenderer question={question} showFeedback={showFeedback} onSubmit={onSubmit} />
            )}

            {question.type === "missing" && (
              <MissingRenderer question={question} showFeedback={showFeedback} onSubmit={onSubmit} />
            )}

            {question.type === "matching" && (
              <MatchingRenderer question={question} showFeedback={showFeedback} onSubmit={onSubmit} />
            )}
          </div>

          <AnimatePresence>
            {showFeedback && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className={"mt-5 p-5 rounded-2xl " + (isCorrect ? "bg-emerald-50" : isPassed ? "bg-amber-50" : "bg-rose-50")}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className={"w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 " + (isCorrect ? "bg-emerald-500" : isPassed ? "bg-amber-500" : "bg-rose-500")}>
                      {isCorrect ? <Icons.Check className="w-4 h-4 text-white" strokeWidth={3} /> : isPassed ? <Icons.SkipForward className="w-4 h-4 text-white" strokeWidth={3} /> : <Icons.X className="w-4 h-4 text-white" strokeWidth={3} />}
                    </div>
                    <div className="flex-1">
                      <p className={"font-bold text-lg mb-0 " + (isCorrect ? "text-emerald-900" : isPassed ? "text-amber-900" : "text-rose-900")}>
                        {isCorrect ? "Benar!" : isPassed ? "Dilewati" : "Kurang tepat"}
                      </p>
                    </div>
                  </div>
                  <div className={"text-sm leading-relaxed pl-9 " + (isCorrect ? "text-emerald-900" : isPassed ? "text-amber-900" : "text-rose-900")}>
                    <p className="mb-2">{renderRich(question.explanation)}</p>
                    {!isCorrect && !isPassed && question.type === "fill" && (
                      <p className="mt-2 text-xs italic">Jawabanmu: “{String(selected)}” — Jawaban benar: “{(question as any).correct}”</p>
                    )}
                    {isPassed && (question.type === "fill" || question.type === "fillChoice") && (
                      <p className="mt-2 text-xs italic">Jawaban benar: “{(question as any).correct}”</p>
                    )}
                    {question.tip && (
                      <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-white/50 border border-gray-200/50">
                        <span className="text-base">💡</span>
                        <p className="text-xs text-gray-700"><strong className="font-bold text-gray-900">Tips: </strong>{question.tip}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!showFeedback && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
            <button onClick={onPass}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-all">
              <Icons.SkipForward className="w-4 h-4" />
              Tidak tahu, lewati soal
            </button>
          </motion.div>
        )}

        {showFeedback && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
            <button onClick={onNext}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-full font-bold hover:bg-gray-700 shadow-lg transition-all">
              {currentQ + 1 < total ? "Soal berikutnya" : "Lihat hasil"}
              <Icons.ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}

// ================================================
// RESULT (with Soft-gate WA)
// ================================================
function ResultScreen({ score, questions, meta, timeElapsedSec, onRetake }: {
  score: number; questions: Question[]; meta: any; timeElapsedSec: number; onRetake: () => void;
}) {
  const result = determineLevel(score);
  // Compute max score dynamically: sum of DIFFICULTY_POINTS per question
  const maxScore = questions.reduce((sum, q) => sum + DIFFICULTY_POINTS[q.difficulty], 0);
  const scorePercent = (score / maxScore) * 100;
  const [unlocked, setUnlocked] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [waValue, setWaValue] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [gateError, setGateError] = useState("");

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
    // Get prefill data from localStorage (set by soft-gate submit)
    let prefillName = "";
    let prefillWa = "";
    try {
      const stored = localStorage.getItem("linguo_prefill");
      if (stored) {
        const data = JSON.parse(stored);
        prefillName = data.name || "";
        prefillWa = data.whatsapp || "";
      }
    } catch {}
    if (typeof w.__openFunnel === "function") {
      try {
        w.__openFunnel({
          language: langFull, level: result.sublevel,
          preferredProgram: "Kelas Private", source: sourceTag,
          prefillName, prefillWa,
        });
      } catch { w.__openFunnel(langFull); }
    } else {
      window.location.href = "/?lang=" + encodeURIComponent(langFull) + "&from=" + sourceTag + "&level=" + result.sublevel;
    }
  };

  // Auto-log result (anonymous) ke placement_results table
  useEffect(() => {
    fetch("/api/placement-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: meta.name, level: result.sublevel, score, timeElapsedSec,
        source: "placement-test-" + meta.slug,
      }),
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitGate = async () => {
    setGateError("");
    // Validate WA: min 10 digit, Indonesia prefix
    const wa = waValue.replace(/\D/g, "");
    if (wa.length < 10) { setGateError("Nomor WhatsApp minimal 10 digit"); return; }
    if (!nameValue.trim()) { setGateError("Masukkan nama dulu ya"); return; }
    setSubmitting(true);
    try {
      await fetch("/api/placement-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: meta.name, level: result.sublevel, score, timeElapsedSec,
          source: "placement-test-" + meta.slug + "-unlocked",
          name: nameValue.trim(), whatsapp: wa,
        }),
      });
      // Simpan ke localStorage untuk prefill FunnelModal nanti
      try {
        localStorage.setItem("linguo_prefill", JSON.stringify({
          name: nameValue.trim(),
          whatsapp: wa,
        }));
      } catch {}
      setUnlocked(true);
      setShowGate(false);
    } catch (e) {
      setGateError("Gagal simpan. Coba lagi ya.");
    } finally {
      setSubmitting(false);
    }
  };

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

        {/* Score card */}
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

        {/* SOFT GATE: Basic recommendation always visible, detail unlocks with WA */}
        {!unlocked ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
            className={"rounded-3xl p-6 md:p-8 mb-6 border " + lc.soft + " " + lc.border}>
            <div className="flex items-start gap-3 mb-4">
              <Icons.Target className={"w-6 h-6 flex-shrink-0 mt-0.5 " + lc.text} />
              <div className="flex-1">
                <p className={"text-xs uppercase tracking-widest font-semibold mb-1 " + lc.text}>Rekomendasi Singkat</p>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Kamu siap mulai dari level {result.sublevel}</h3>
                <p className="text-gray-700 text-sm md:text-base mb-4">
                  Kami punya <strong>learning plan personal</strong> untuk kamu: chapter spesifik, estimasi durasi, dan saran program terbaik.
                </p>
              </div>
            </div>

            {!showGate ? (
              <button onClick={() => setShowGate(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-700 transition-colors">
                <Icons.Unlock className="w-4 h-4" />
                Dapatkan Learning Plan Gratis
              </button>
            ) : (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="bg-white rounded-2xl p-5 border border-gray-200 overflow-hidden">
                <p className="text-sm font-semibold text-gray-900 mb-1">Simpan hasil test kamu</p>
                <p className="text-xs text-gray-500 mb-4">Pengajar Linguo akan kirim learning plan personal via WhatsApp.</p>
                <div className="space-y-3">
                  <input type="text" value={nameValue} onChange={(e) => setNameValue(e.target.value)}
                    placeholder="Nama kamu"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20 outline-none text-sm" />
                  <div className="flex">
                    <span className="px-3 py-3 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-sm text-gray-600 font-mono">+62</span>
                    <input type="tel" value={waValue} onChange={(e) => setWaValue(e.target.value)}
                      placeholder="812 xxxx xxxx" inputMode="numeric"
                      className="flex-1 px-4 py-3 rounded-r-xl border border-gray-200 focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20 outline-none text-sm" />
                  </div>
                  {gateError && <p className="text-xs text-rose-600">{gateError}</p>}
                  <button onClick={submitGate} disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1A9E9E] text-white rounded-xl font-semibold hover:bg-[#147a7a] disabled:opacity-50 transition-colors">
                    {submitting ? "Menyimpan..." : "Simpan & Tampilkan Detail"}
                    {!submitting && <Icons.ArrowRight className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setShowGate(false)}
                    className="w-full text-xs text-gray-500 hover:text-gray-700 py-1">
                    Batal
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-3 text-center">Data aman. Tidak spam.</p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className={"rounded-3xl p-6 md:p-8 mb-6 border " + lc.soft + " " + lc.border}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                <Icons.Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
              <p className="text-sm font-semibold text-emerald-700">Learning plan tersimpan!</p>
            </div>
            <div className="flex items-start gap-3">
              <Icons.Target className={"w-6 h-6 flex-shrink-0 mt-0.5 " + lc.text} />
              <div className="flex-1">
                <p className={"text-xs uppercase tracking-widest font-semibold mb-1 " + lc.text}>Rekomendasi Detail</p>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Mulai dari {result.startChapter}</h3>
                <p className="text-gray-700 text-sm md:text-base mb-3">
                  Estimasi selesai ke B2: <strong>{result.estimationMonths} bulan</strong> dengan kelas private intensif (3x/minggu).
                </p>
                <p className="text-xs text-gray-500">Pengajar Linguo akan hubungi kamu via WhatsApp dalam 1x24 jam untuk diskusi personal.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ACTION BUTTONS */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
          className="flex flex-col gap-3">
          <button onClick={handleStartLearning}
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#1A9E9E] text-white rounded-full font-bold text-lg hover:bg-[#147a7a] shadow-xl shadow-[#1A9E9E]/20 transition-all group">
            Langsung Daftar Kelas
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
      </div>
    </motion.section>
  );
}
// ════════════════════════════════════════════════════════════════════════════
// DragDrop Renderer — tap-to-select pattern (mobile-friendly)
// ════════════════════════════════════════════════════════════════════════════
function DragDropRenderer({ question, showFeedback, onSubmit }: {
  question: DragDropQuestion;
  showFeedback: boolean;
  onSubmit: (v: string | number | boolean, isCorrect?: boolean) => void;
}) {
  // Shuffle tokens once per question (stable within one question)
  const [shuffled] = useState(() =>
    [...question.tokens]
      .map((t) => ({ t, k: Math.random() }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.t)
  );
  // User's current answer order (array of indices into shuffled)
  const [answerIdx, setAnswerIdx] = useState<number[]>([]);
  const answerTokens = answerIdx.map((i) => shuffled[i]);

  // Reset when question changes
  useEffect(() => {
    setAnswerIdx([]);
  }, [question.id]);

  const pickToken = (i: number) => {
    if (showFeedback) return;
    if (answerIdx.includes(i)) return;
    setAnswerIdx([...answerIdx, i]);
  };
  const unpickToken = (positionInAnswer: number) => {
    if (showFeedback) return;
    setAnswerIdx(answerIdx.filter((_, idx) => idx !== positionInAnswer));
  };

  const allPicked = answerIdx.length === shuffled.length;
  const handleCheck = () => {
    if (!allPicked || showFeedback) return;
    const isCorrect = answerTokens.join(" ") === question.correct.join(" ");
    onSubmit(answerTokens.join(" "), isCorrect);
  };

  return (
    <div className="space-y-4">
      {/* Answer slot — tokens yang sudah dipilih */}
      <div className="min-h-[80px] p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
        {answerTokens.length === 0 ? (
          <p className="text-center text-sm text-slate-400 italic py-4">Tap kata di bawah untuk menyusun kalimat</p>
        ) : (
          <div className="flex flex-wrap gap-2 items-center">
            {answerTokens.map((tok, i) => {
              const correctToken = question.correct[i];
              let cls = "bg-white border-slate-300 text-slate-900";
              if (showFeedback) {
                cls = tok === correctToken
                  ? "bg-emerald-50 border-emerald-400 text-emerald-900"
                  : "bg-rose-50 border-rose-400 text-rose-900";
              }
              return (
                <button
                  key={i}
                  onClick={() => unpickToken(i)}
                  disabled={showFeedback}
                  className={"px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all " + cls + (!showFeedback ? " hover:border-slate-500 active:scale-95" : "")}
                >
                  {tok}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Token bank — sumber kata */}
      <div className="flex flex-wrap gap-2">
        {shuffled.map((tok, i) => {
          const used = answerIdx.includes(i);
          return (
            <button
              key={i}
              onClick={() => pickToken(i)}
              disabled={used || showFeedback}
              className={"px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all " +
                (used
                  ? "bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed"
                  : "bg-white border-slate-300 text-slate-900 hover:border-[#1A9E9E] active:scale-95 cursor-pointer")}
            >
              {tok}
            </button>
          );
        })}
      </div>

      {/* Check button — muncul saat semua token sudah dipilih */}
      {!showFeedback && (
        <button
          onClick={handleCheck}
          disabled={!allPicked}
          className="w-full px-6 py-3.5 bg-[#1A9E9E] text-white rounded-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#147a7a] transition"
        >
          Periksa Jawaban
        </button>
      )}

      {/* Show correct answer when feedback + wrong */}
      {showFeedback && answerTokens.join(" ") !== question.correct.join(" ") && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <p className="text-xs font-bold text-emerald-900 mb-1">Jawaban benar:</p>
          <p className="text-sm text-emerald-900">{question.correct.join(" ")}</p>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Missing Renderer — fill blanks by tapping from word bank
// ════════════════════════════════════════════════════════════════════════════
function MissingRenderer({ question, showFeedback, onSubmit }: {
  question: MissingQuestion;
  showFeedback: boolean;
  onSubmit: (v: string | number | boolean, isCorrect?: boolean) => void;
}) {
  // Parse template: split by "___" to get parts; blanks are between parts
  const parts = question.template.split("___");
  // parts[i] is text, blanks[i] is between parts[i] and parts[i+1]
  const numBlanks = question.blanks.length;

  const [filled, setFilled] = useState<(string | null)[]>(() => Array(numBlanks).fill(null));
  const [usedOptions, setUsedOptions] = useState<number[]>([]);

  useEffect(() => {
    setFilled(Array(numBlanks).fill(null));
    setUsedOptions([]);
  }, [question.id]);

  const pickOption = (optIdx: number) => {
    if (showFeedback) return;
    // Find next empty blank
    const nextEmpty = filled.findIndex((v) => v === null);
    if (nextEmpty === -1) return;
    const newFilled = [...filled];
    newFilled[nextEmpty] = question.options[optIdx];
    setFilled(newFilled);
    setUsedOptions([...usedOptions, optIdx]);
  };

  const clearBlank = (blankIdx: number) => {
    if (showFeedback) return;
    const val = filled[blankIdx];
    if (!val) return;
    // Find which option matches this value (first unused-for-clearing occurrence)
    const optIdx = question.options.findIndex((opt, i) => opt === val && usedOptions.includes(i));
    const newFilled = [...filled];
    newFilled[blankIdx] = null;
    setFilled(newFilled);
    if (optIdx !== -1) setUsedOptions(usedOptions.filter((i) => i !== optIdx));
  };

  const allFilled = filled.every((v) => v !== null);
  const handleCheck = () => {
    if (!allFilled || showFeedback) return;
    const isCorrect = filled.every((v, i) => v === question.blanks[i]);
    onSubmit(filled.join(","), isCorrect);
  };

  return (
    <div className="space-y-4">
      {/* Template dengan inline blanks */}
      <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-200">
        <p className="text-base md:text-lg text-slate-900 leading-loose">
          {parts.map((part, i) => (
            <span key={i}>
              {part}
              {i < numBlanks && (
                <button
                  onClick={() => clearBlank(i)}
                  disabled={showFeedback || !filled[i]}
                  className={"inline-block mx-1 px-3 py-1 rounded-lg border-2 text-sm font-bold align-middle min-w-[80px] " +
                    (filled[i]
                      ? (showFeedback
                          ? (filled[i] === question.blanks[i] ? "bg-emerald-50 border-emerald-400 text-emerald-900" : "bg-rose-50 border-rose-400 text-rose-900")
                          : "bg-white border-[#1A9E9E] text-[#1A9E9E] hover:bg-[#1A9E9E]/5 cursor-pointer")
                      : "bg-white border-dashed border-slate-400 text-slate-300")}
                >
                  {filled[i] || "___"}
                </button>
              )}
            </span>
          ))}
        </p>
      </div>

      {/* Word bank */}
      <div className="flex flex-wrap gap-2">
        {question.options.map((opt, i) => {
          const used = usedOptions.includes(i);
          return (
            <button
              key={i}
              onClick={() => pickOption(i)}
              disabled={used || showFeedback || allFilled}
              className={"px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all " +
                (used
                  ? "bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed"
                  : allFilled
                    ? "bg-white border-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-white border-slate-300 text-slate-900 hover:border-[#1A9E9E] active:scale-95")}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {!showFeedback && (
        <button
          onClick={handleCheck}
          disabled={!allFilled}
          className="w-full px-6 py-3.5 bg-[#1A9E9E] text-white rounded-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#147a7a] transition"
        >
          Periksa Jawaban
        </button>
      )}

      {showFeedback && filled.some((v, i) => v !== question.blanks[i]) && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <p className="text-xs font-bold text-emerald-900 mb-1">Jawaban benar:</p>
          <p className="text-sm text-emerald-900">{question.blanks.join(" / ")}</p>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Matching Renderer — tap left card then right card to pair
// ════════════════════════════════════════════════════════════════════════════
function MatchingRenderer({ question, showFeedback, onSubmit }: {
  question: MatchingQuestion;
  showFeedback: boolean;
  onSubmit: (v: string | number | boolean, isCorrect?: boolean) => void;
}) {
  // Stable shuffle of right-side items (so they don't align 1:1 visually)
  const [rightOrder] = useState(() =>
    question.pairs
      .map((p, i) => ({ i, k: Math.random() }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.i)
  );

  // pairing: left index (original) → right index (original) or null
  const [pairing, setPairing] = useState<(number | null)[]>(() => Array(question.pairs.length).fill(null));
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);

  useEffect(() => {
    setPairing(Array(question.pairs.length).fill(null));
    setSelectedLeft(null);
  }, [question.id]);

  const pickLeft = (leftIdx: number) => {
    if (showFeedback) return;
    if (pairing[leftIdx] !== null) {
      // Unpair
      const newPairing = [...pairing];
      newPairing[leftIdx] = null;
      setPairing(newPairing);
      setSelectedLeft(null);
      return;
    }
    setSelectedLeft(leftIdx);
  };

  const pickRight = (rightIdx: number) => {
    if (showFeedback) return;
    if (selectedLeft === null) return;
    // Check: is this right already paired to another left? If yes, unpair that first
    const newPairing = [...pairing];
    const existingLeft = pairing.findIndex((r) => r === rightIdx);
    if (existingLeft !== -1) newPairing[existingLeft] = null;
    newPairing[selectedLeft] = rightIdx;
    setPairing(newPairing);
    setSelectedLeft(null);
  };

  const allPaired = pairing.every((p) => p !== null);
  const handleCheck = () => {
    if (!allPaired || showFeedback) return;
    // Correct if every left i is paired to right i (since original pairs[i].left ↔ pairs[i].right)
    const isCorrect = pairing.every((rightIdx, leftIdx) => rightIdx === leftIdx);
    onSubmit(pairing.join(","), isCorrect);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* LEFT column */}
        <div className="space-y-2">
          {question.pairs.map((pair, leftIdx) => {
            const isSelected = selectedLeft === leftIdx;
            const isPaired = pairing[leftIdx] !== null;
            const pairedCorrect = showFeedback && pairing[leftIdx] === leftIdx;
            const pairedWrong = showFeedback && isPaired && pairing[leftIdx] !== leftIdx;
            let cls = "bg-white border-slate-300 text-slate-900";
            if (pairedCorrect) cls = "bg-emerald-50 border-emerald-400 text-emerald-900";
            else if (pairedWrong) cls = "bg-rose-50 border-rose-400 text-rose-900";
            else if (isSelected) cls = "bg-[#1A9E9E]/10 border-[#1A9E9E] text-[#1A9E9E]";
            else if (isPaired) cls = "bg-slate-100 border-slate-400 text-slate-700";
            return (
              <button
                key={leftIdx}
                onClick={() => pickLeft(leftIdx)}
                disabled={showFeedback}
                className={"w-full px-3 py-3 rounded-xl border-2 text-sm font-medium text-left transition-all " + cls + (!showFeedback ? " hover:border-[#1A9E9E] active:scale-95 cursor-pointer" : "")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{pair.left}</span>
                  {isPaired && <span className="text-xs text-slate-500">{String.fromCharCode(65 + rightOrder.indexOf(pairing[leftIdx]!))}</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* RIGHT column (shuffled) */}
        <div className="space-y-2">
          {rightOrder.map((origRightIdx, displayIdx) => {
            const isPairedTo = pairing.findIndex((r) => r === origRightIdx);
            const isPaired = isPairedTo !== -1;
            const pairedCorrect = showFeedback && isPaired && pairing[isPairedTo] === isPairedTo;
            const pairedWrong = showFeedback && isPaired && pairing[isPairedTo] !== isPairedTo;
            const canClick = selectedLeft !== null && !showFeedback;
            let cls = "bg-white border-slate-300 text-slate-900";
            if (pairedCorrect) cls = "bg-emerald-50 border-emerald-400 text-emerald-900";
            else if (pairedWrong) cls = "bg-rose-50 border-rose-400 text-rose-900";
            else if (isPaired) cls = "bg-slate-100 border-slate-400 text-slate-700";
            return (
              <button
                key={displayIdx}
                onClick={() => pickRight(origRightIdx)}
                disabled={showFeedback || !canClick}
                className={"w-full px-3 py-3 rounded-xl border-2 text-sm font-medium text-left transition-all " + cls + (canClick && !isPaired ? " hover:border-[#1A9E9E] active:scale-95 cursor-pointer" : "")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-500">{String.fromCharCode(65 + displayIdx)}</span>
                  <span className="flex-1 text-right">{question.pairs[origRightIdx].right}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {!showFeedback && (
        <button
          onClick={handleCheck}
          disabled={!allPaired}
          className="w-full px-6 py-3.5 bg-[#1A9E9E] text-white rounded-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#147a7a] transition"
        >
          Periksa Jawaban
        </button>
      )}

      {showFeedback && pairing.some((r, l) => r !== l) && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <p className="text-xs font-bold text-emerald-900 mb-2">Pasangan yang benar:</p>
          <ul className="text-sm text-emerald-900 space-y-1">
            {question.pairs.map((p, i) => (
              <li key={i}>• {p.left} → {p.right}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
