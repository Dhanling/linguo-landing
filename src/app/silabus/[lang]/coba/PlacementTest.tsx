"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import AuthModal from "@/components/AuthModal";
import { supabase } from "@/lib/supabase-client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";
import type { LanguageCurriculum } from "@/data/curriculum";
import { type Question, type DragDropQuestion, type MissingQuestion, type MatchingQuestion, type FillChoiceQuestion, DIFFICULTY_POINTS, determineLevel } from "@/data/placement/english";
import { RectFlag, FLAG_CODE_BY_SLUG } from "@/components/RectFlag";

// Teks jawaban benar per tipe soal — dipakai di rekap akhir (bukan saat menjawab)
function correctAnswerText(q: Question): string {
  switch (q.type) {
    case "multiple": return q.options[q.correct];
    case "fill":
    case "fillChoice": return q.correct;
    case "dragDrop": return q.correct.join(" ");
    case "missing": return q.blanks.join(" / ");
    case "matching": return q.pairs.map((p) => `${p.left} → ${p.right}`).join(", ");
    default: return "";
  }
}
function questionPrompt(q: Question): string {
  return q.type === "dragDrop" || q.type === "matching" ? q.prompt : (q as any).question;
}

interface Props {
  curriculum: LanguageCurriculum;
  questions: Question[];
}

import { trackEvent } from "@/lib/tracking";

type Screen = "intro" | "quiz" | "result";

// linguo-patch:placement-leadform-polish-v1 — normalisasi nomor WA (digit-only, buang prefix 62/0, cap 13 digit)
function cleanWa(raw: string): string {
  let d = (raw || "").replace(/\D/g, "");
  if (d.startsWith("62")) d = d.slice(2);
  d = d.replace(/^0+/, "");
  return d.slice(0, 13);
}

// linguo-patch:placement-daftar-funnel-v1 — nama bahasa untuk funnel pendaftaran.
// meta.name = Indonesia ("Italia"), tapi funnel + pricelist pakai nama Inggris
// ("Italian") buat lookup bendera & kategori harga. Turunkan dari slug kurikulum.
const FUNNEL_LANG_OVERRIDE: Record<string, string> = {
  filipino: "Tagalog",
  "portuguese-br": "Portuguese",
  "portuguese-pt": "Portuguese",
};
function funnelLangName(slug: string): string {
  return FUNNEL_LANG_OVERRIDE[slug] || (slug.charAt(0).toUpperCase() + slug.slice(1));
}

function renderRich(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i} className="font-bold text-gray-900">{p.slice(2, -2)}</strong>;
    }
    return <span key={i}>{p}</span>;
  });
}

type AnswerEntry = { value: string | number | boolean; correct: boolean; skipped: boolean };

// Varian animasi geser antar soal — arah mengikuti maju (+1) / mundur (-1)
const slideVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir >= 0 ? -48 : 48, opacity: 0 }),
};

export default function PlacementTest({ curriculum, questions }: Props) {
  const { meta } = curriculum;
  const [screen, setScreen] = useState<Screen>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  // Arah transisi: 1 = maju ke soal berikutnya, -1 = mundur ke soal sebelumnya
  const [direction, setDirection] = useState(1);
  // Jawaban per soal (null = belum dijawab). Bisa diubah lewat tombol "Soal sebelumnya".
  const [answers, setAnswers] = useState<(AnswerEntry | null)[]>([]);
  const startTimeRef = useRef<number>(0);

  const question = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;

  useEffect(() => {
    if (screen === "quiz" && currentQ === 0) startTimeRef.current = Date.now();
  }, [screen, currentQ]);

  const computeScore = (arr: (AnswerEntry | null)[]) =>
    arr.reduce((sum, a, i) => sum + (a?.correct ? DIFFICULTY_POINTS[questions[i].difficulty] : 0), 0);

  const startTest = () => {
    setScreen("quiz"); setCurrentQ(0); setDirection(1);
    setAnswers(Array(questions.length).fill(null));
    trackEvent("placement_test_quiz_started", { language: meta?.name ?? "" });
  };

  // Rekam jawaban lalu langsung geser ke soal berikutnya — tanpa jeda notifikasi.
  // Untuk tipe kompleks (dragDrop/missing/matching) renderer menghitung benar/salah
  // dan mengoper flag boolean lewat `isCorrectOverride`.
  const recordAndAdvance = (entry: AnswerEntry) => {
    const next = [...answers];
    next[currentQ] = entry;
    setAnswers(next);
    if (currentQ + 1 < questions.length) {
      setDirection(1);
      setCurrentQ((i) => i + 1);
    } else {
      setScreen("result");
      trackEvent("placement_test_completed", { language: meta?.name ?? "", score: computeScore(next) });
    }
  };

  const submitAnswer = (value: string | number | boolean, isCorrectOverride?: boolean) => {
    const correct = isCorrectOverride !== undefined
      ? isCorrectOverride
      : (question.type === "multiple" || question.type === "fill" || question.type === "fillChoice") && value === (question as any).correct;
    recordAndAdvance({ value, correct, skipped: false });
  };

  // Lewati soal — dicatat sebagai dilewati, tanpa skor.
  const passAnswer = () => recordAndAdvance({ value: "__PASSED__", correct: false, skipped: true });

  // Mundur ke soal sebelumnya (jawaban lama tetap tersimpan & bisa diubah).
  const goBack = () => {
    if (currentQ > 0) { setDirection(-1); setCurrentQ((i) => i - 1); }
  };

  const selected = answers[currentQ]?.value ?? null;

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
            direction={direction}
            selected={selected}
            onSubmit={submitAnswer}
            onPass={passAnswer}
            onBack={goBack}
            langSlug={meta.slug}
          />
        )}
        {screen === "result" && (
          <ResultScreen
            key="result"
            score={computeScore(answers)}
            questions={questions}
            log={answers.map((a) => ({ correct: !!a?.correct, skipped: !!a?.skipped }))}
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
          className="mb-6">
          <RectFlag code={FLAG_CODE_BY_SLUG[meta.slug]} h={72} className="shadow-md" />
        </motion.div>

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
                <li>Benar/salah tidak dibocorkan per soal — biar kamu fokus</li>
                <li>Rekap lengkap + pembahasan muncul di akhir test</li>
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
  question: Question; currentQ: number; total: number; progress: number; direction: number;
  selected: string | number | boolean | null;
  onSubmit: (v: string | number | boolean, isCorrectOverride?: boolean) => void;
  onPass: () => void;
  onBack: () => void; langSlug: string;
}) {
  const { question, currentQ, total, progress, direction, selected, onSubmit, onPass, onBack, langSlug } = props;
  const [fillValue, setFillValue] = useState("");
  // Saat pindah soal, isi ulang input teks dari jawaban tersimpan (kalau ada).
  useEffect(() => {
    setFillValue(typeof selected === "string" && selected !== "__PASSED__" ? selected : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  const diffCls = question.difficulty === "A1" ? "bg-emerald-100 text-emerald-700" :
                   question.difficulty === "A2" ? "bg-sky-100 text-sky-700" :
                   question.difficulty === "B1" ? "bg-violet-100 text-violet-700" :
                                                   "bg-rose-100 text-rose-700";

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center px-6 py-10 md:py-16">
      <div className="max-w-2xl w-full">
        {/* Header progres — di luar area geser, update instan */}
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
              initial={false} animate={{ width: progress + "%" }} transition={{ duration: 0.4 }} />
          </div>
        </div>

        {/* Kartu soal — geser (slide) saat ganti soal */}
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={currentQ}
            custom={direction}
            variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.26, ease: "easeInOut" }}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8"
          >
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
                // Tanpa reveal: hanya highlight pilihan yg dipilih (netral teal), tetap bisa diubah.
                const cls = isSelected
                  ? "border-[#1A9E9E] bg-[#1A9E9E]/5"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 cursor-pointer";
                return (
                  <button key={i} onClick={() => onSubmit(i)}
                    className={"w-full text-left px-5 py-4 rounded-2xl border-2 transition-all " + cls}>
                    <div className="flex items-center gap-3">
                      <span className={"flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold flex-shrink-0 " + (isSelected ? "bg-[#1A9E9E] text-white" : "bg-gray-100 text-gray-600")}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-gray-900">{opt}</span>
                    </div>
                  </button>
                );
              })}

              {question.type === "fill" && (
                <div className="flex gap-2">
                  <input type="text" value={fillValue}
                    onChange={(e) => setFillValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && fillValue.trim()) onSubmit(fillValue.toLowerCase().trim()); }}
                    placeholder="Ketik jawaban lalu Enter..."
                    className="flex-1 px-5 py-4 rounded-2xl border-2 border-gray-200 focus:border-[#1A9E9E] focus:outline-none transition-colors"
                  />
                  <button onClick={() => fillValue.trim() && onSubmit(fillValue.toLowerCase().trim())} disabled={!fillValue.trim()}
                    className="px-6 py-4 bg-[#1A9E9E] text-white rounded-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed">
                    OK
                  </button>
                </div>
              )}

              {question.type === "fillChoice" && (
                <div className="grid grid-cols-2 gap-2">
                  {question.options.map((opt, i) => {
                    const isSelected = selected === opt;
                    const cls = isSelected
                      ? "border-[#1A9E9E] bg-[#1A9E9E]/10"
                      : "border-gray-200 bg-white hover:border-[#1A9E9E] hover:bg-[#1A9E9E]/5 cursor-pointer";
                    return (
                      <button key={i} onClick={() => onSubmit(opt)}
                        className={"w-full px-5 py-4 rounded-2xl border-2 text-center transition-all text-lg font-semibold " + cls}>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-gray-900">{opt}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {question.type === "dragDrop" && (
                <DragDropRenderer question={question} initialValue={selected} onSubmit={onSubmit} />
              )}

              {question.type === "missing" && (
                <MissingRenderer question={question} initialValue={selected} onSubmit={onSubmit} />
              )}

              {question.type === "matching" && (
                <MatchingRenderer question={question} initialValue={selected} onSubmit={onSubmit} />
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer: kembali ke soal sebelumnya + lewati soal */}
        <div className="mt-6 flex items-center justify-between gap-3">
          {currentQ > 0 ? (
            <button onClick={onBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-all">
              <Icons.ArrowLeft className="w-4 h-4" />
              Soal sebelumnya
            </button>
          ) : <span />}
          <button onClick={onPass}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-all">
            <Icons.SkipForward className="w-4 h-4" />
            Tidak tahu, lewati soal
          </button>
        </div>
      </div>
    </motion.section>
  );
}

// ================================================
// RESULT (with Soft-gate WA)
// ================================================
function ResultScreen({ score, questions, log, meta, timeElapsedSec, onRetake }: {
  score: number; questions: Question[]; log: { correct: boolean; skipped: boolean }[]; meta: any; timeElapsedSec: number; onRetake: () => void;
}) {
  const result = determineLevel(score);
  // Compute max score dynamically: sum of DIFFICULTY_POINTS per question
  const maxScore = questions.reduce((sum, q) => sum + DIFFICULTY_POINTS[q.difficulty], 0);
  const scorePercent = (score / maxScore) * 100;
  const correctCount = log.filter((l) => l.correct).length;
  const wrongCount = log.filter((l) => !l.correct && !l.skipped).length;
  const skippedCount = log.filter((l) => l.skipped).length;
  const [showRecap, setShowRecap] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [waValue, setWaValue] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [gateError, setGateError] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [checkingSession, setCheckingSession] = useState(false);

  const levelColorMap: Record<string, { bg: string; text: string; soft: string; border: string }> = {
    A1: { bg: "bg-emerald-100", text: "text-emerald-600", soft: "bg-emerald-50", border: "border-emerald-200" },
    A2: { bg: "bg-sky-100", text: "text-sky-600", soft: "bg-sky-50", border: "border-sky-200" },
    B1: { bg: "bg-violet-100", text: "text-violet-600", soft: "bg-violet-50", border: "border-violet-200" },
    B2: { bg: "bg-rose-100", text: "text-rose-600", soft: "bg-rose-50", border: "border-rose-200" },
  };
  const lc = levelColorMap[result.level];

  // Simpan intent placement ke cookie supaya /auth/callback bisa redirect ke wizard
  const savePlacementIntent = () => {
    try {
      const intentData = JSON.stringify({
        lang: meta.slug,
        // langFull dipakai /auth/callback sbg query ?lang= ke funnel → WAJIB nama Inggris
        langFull: funnelLangName(meta.slug),
        level: result.sublevel,
        source: "placement-test-" + meta.slug,
      });
      document.cookie = "linguo_placement_intent=" + encodeURIComponent(intentData) + ";path=/;max-age=600";
    } catch {}
  };

  // Buka wizard dengan bahasa + level pre-filled
  const openWizardPrefilled = () => {
    const w = window as any;
    // Funnel & pricelist pakai nama Inggris ("Italian"), bukan "Bahasa Italia".
    const funnelLang = funnelLangName(meta.slug);
    const sourceTag = "placement-test-" + meta.slug;
    let prefillName = "";
    let prefillWa = "";
    let prefillEmail = "";
    try {
      const stored = localStorage.getItem("linguo_prefill");
      if (stored) {
        const data = JSON.parse(stored);
        prefillName = data.name || "";
        prefillWa = data.whatsapp || "";
        prefillEmail = data.email || "";
      }
    } catch {}
    if (typeof w.__openFunnel === "function") {
      try {
        w.__openFunnel({
          language: funnelLang, level: result.sublevel,
          source: sourceTag,
          prefillName, prefillWa, prefillEmail,
        });
      } catch { w.__openFunnel(funnelLang); }
    } else {
      // Halaman placement ≠ homepage → __openFunnel belum ada. Redirect ke homepage
      // dgn openFunnel=1 (WAJIB, tanpa ini funnel tak kebuka) + bahasa/level. Prefill
      // nama/email/WA diambil homepage dari localStorage linguo_prefill.
      window.location.href = "/?openFunnel=1&lang=" + encodeURIComponent(funnelLang) + "&level=" + encodeURIComponent(result.sublevel) + "&from=" + encodeURIComponent(sourceTag);
    }
  };

  const handleStartLearning = async () => {
    setCheckingSession(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Sudah login → langsung buka wizard
        openWizardPrefilled();
      } else {
        // Belum login → simpan intent + buka AuthModal
        savePlacementIntent();
        setShowAuthModal(true);
      }
    } catch {
      // Kalau gagal cek session, tetap buka wizard (graceful fallback)
      openWizardPrefilled();
    } finally {
      setCheckingSession(false);
    }
  };

  const handleAuthSuccess = (_userId: string) => {
    setShowAuthModal(false);
    // Setelah login berhasil → langsung buka wizard
    openWizardPrefilled();
  };

  // Auto-log result ke placement_results table
  // Kalau dari /akun (ref=akun + sid=studentId), link ke student
  const searchParams = useSearchParams();
  const resultRowIdRef = useRef<string | null>(null);
  useEffect(() => {
    const ref = searchParams?.get("ref");
    const sid = searchParams?.get("sid");
    const fromAkun = ref === "akun" && !!sid;

    // Hard gate: cuma siswa /akun (udah login) yang auto-unlock + auto-log.
    // Non-akun WAJIB isi WA dulu — baris placement_results dibuat pas submitGate.
    if (!fromAkun) {
      return;
    }
    setUnlocked(true);

    const payload: Record<string, unknown> = {
      language: meta.name,
      level: result.sublevel,
      score,
      timeElapsedSec,
      source: fromAkun ? "akun-dashboard" : ("placement-test-" + meta.slug),
    };
    if (fromAkun && sid) payload.student_id = sid;

    fetch("/api/placement-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((d) => { if (d?.id) resultRowIdRef.current = d.id; })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitGate = async () => {
    setGateError("");
    // Validate WA: min 10 digit, Indonesia prefix
    const wa = cleanWa(waValue);
    if (wa.length < 9) { setGateError("Nomor WhatsApp minimal 9 digit"); return; }
    if (!wa.startsWith("8")) { setGateError("Nomor HP harus diawali 8 (tanpa 0 / +62)"); return; }
    if (!nameValue.trim()) { setGateError("Masukkan nama dulu ya"); return; }
    if (!emailValue.trim() || !emailValue.includes("@")) { setGateError("Masukkan email yang valid"); return; }
    setSubmitting(true);
    try {
      const rowId = resultRowIdRef.current;
      await fetch("/api/placement-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          rowId
            ? {
                id: rowId,
                name: nameValue.trim(),
                email: emailValue.trim(),
                whatsapp: wa,
              }
            : {
                language: meta.name,
                level: result.sublevel,
                score,
                timeElapsedSec,
                source: "placement-test-" + meta.slug + "-unlocked",
                name: nameValue.trim(),
                email: emailValue.trim(),
                whatsapp: wa,
              }
        ),
      });
      // Simpan ke localStorage untuk prefill FunnelModal nanti
      try {
        localStorage.setItem("linguo_prefill", JSON.stringify({
          name: nameValue.trim(),
          email: emailValue.trim(),
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
    !unlocked ? (
      /* ─── HARD GATE: wajib isi WA sebelum liat hasil (non-akun) ─── */
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        className="min-h-screen py-16 px-6 flex items-center">
        <div className="max-w-md w-full mx-auto">
          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.1 }}
            className={"inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 " + lc.bg}>
            <Icons.Award className={"w-10 h-10 " + lc.text} strokeWidth={2} />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-gray-900">
            Test kamu selesai!
          </h1>
          <p className="text-gray-600 text-base mb-8">
            Hasil level &amp; <strong>learning plan personal</strong> kamu udah siap. Isi data di bawah buat lihat hasilnya.
          </p>
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-3">
            <input type="text" value={nameValue} onChange={(e) => setNameValue(e.target.value)}
              placeholder="Nama kamu"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20 outline-none text-sm" />
            <input type="email" value={emailValue} onChange={(e) => setEmailValue(e.target.value)}
              placeholder="Email kamu"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20 outline-none text-sm" />
            <div className="flex">
              <span className="px-3 py-3 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-sm text-gray-600 font-mono">+62</span>
              <input type="tel" value={waValue} onChange={(e) => setWaValue(cleanWa(e.target.value))}
                placeholder="812 xxxx xxxx" inputMode="numeric"
                className="flex-1 px-4 py-3 rounded-r-xl border border-gray-200 focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20 outline-none text-sm" />
            </div>
            {gateError && <p className="text-xs text-rose-600">{gateError}</p>}
            <button onClick={submitGate} disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1A9E9E] text-white rounded-xl font-bold hover:bg-[#147a7a] disabled:opacity-50 transition-colors">
              {submitting ? "Menyimpan..." : "Lihat Hasil Saya"}
              {!submitting && <Icons.ArrowRight className="w-4 h-4" />}
            </button>
            <p className="text-[10px] text-gray-400 text-center pt-1">Data aman. Pengajar Linguo bakal kirim learning plan via WhatsApp. Tidak spam.</p>
          </div>
        </div>
      </motion.section>
    ) : (
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

        {/* REKAP BENAR/SALAH — muncul di akhir (bukan per soal) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}
          className="bg-white border border-gray-100 rounded-3xl p-5 md:p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                <Icons.Check className="w-4 h-4" /> {correctCount} benar
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600">
                <Icons.X className="w-4 h-4" /> {wrongCount} salah
              </span>
              {skippedCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600">
                  <Icons.SkipForward className="w-4 h-4" /> {skippedCount} dilewati
                </span>
              )}
            </div>
            <button onClick={() => setShowRecap((v) => !v)}
              className="text-sm font-semibold text-[#1A9E9E] hover:text-[#147a7a] inline-flex items-center gap-1 flex-shrink-0">
              {showRecap ? "Sembunyikan" : "Lihat pembahasan"}
              <Icons.ChevronDown className={"w-4 h-4 transition-transform " + (showRecap ? "rotate-180" : "")} />
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showRecap && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="space-y-3 pt-1">
                  {questions.map((q, i) => {
                    const entry = log[i];
                    const status = entry?.skipped ? "skipped" : entry?.correct ? "correct" : "wrong";
                    const badge = status === "correct" ? "bg-emerald-100 text-emerald-700"
                      : status === "skipped" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700";
                    return (
                      <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-start gap-2 mb-1.5">
                          <span className={"text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 " + badge}>
                            {status === "correct" ? "Benar" : status === "skipped" ? "Dilewati" : "Salah"}
                          </span>
                          <p className="text-sm font-semibold text-gray-900 leading-snug">
                            <span className="text-gray-400">#{i + 1}</span> {questionPrompt(q)}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed pl-1">
                          <span className="font-semibold text-gray-800">Jawaban benar: </span>
                          {correctAnswerText(q)}
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed pl-1 mt-1">{renderRich(q.explanation)}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
                  <input type="email" value={emailValue} onChange={(e) => setEmailValue(e.target.value)}
                    placeholder="Email kamu"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20 outline-none text-sm" />
                  <div className="flex">
                    <span className="px-3 py-3 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-sm text-gray-600 font-mono">+62</span>
                    <input type="tel" value={waValue} onChange={(e) => setWaValue(cleanWa(e.target.value))}
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
          <button onClick={handleStartLearning} disabled={checkingSession}
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#1A9E9E] text-white rounded-full font-bold text-lg hover:bg-[#147a7a] shadow-xl shadow-[#1A9E9E]/20 transition-all group disabled:opacity-70 disabled:cursor-wait">
            {checkingSession ? (
              <>
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                Langsung Daftar Kelas
                <Icons.ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
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

      {/* Auth Gate Modal */}
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        intent={`Simpan hasil test ${meta.flag} & lanjut daftar kelas`}
      />
    </motion.section>
    )
  );
}
// ════════════════════════════════════════════════════════════════════════════
// DragDrop Renderer — tap-to-select pattern (mobile-friendly)
// ════════════════════════════════════════════════════════════════════════════
// Rekonstruksi urutan token dragDrop dari jawaban tersimpan (best-effort untuk token duplikat)
function reconstructDragIdx(val: string | number | boolean | null, shuffled: string[]): number[] {
  if (typeof val !== "string" || val === "__PASSED__" || val === "") return [];
  const used = new Set<number>();
  const idx: number[] = [];
  for (const w of val.split(" ")) {
    const found = shuffled.findIndex((t, i) => t === w && !used.has(i));
    if (found === -1) return [];
    used.add(found); idx.push(found);
  }
  return idx;
}

function DragDropRenderer({ question, initialValue, onSubmit }: {
  question: DragDropQuestion;
  initialValue: string | number | boolean | null;
  onSubmit: (v: string | number | boolean, isCorrect?: boolean) => void;
}) {
  // Shuffle tokens once per mount (kartu di-remount tiap ganti soal)
  const [shuffled] = useState(() =>
    [...question.tokens]
      .map((t) => ({ t, k: Math.random() }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.t)
  );
  // Urutan jawaban user (indeks ke shuffled) — dipulihkan dari jawaban tersimpan bila ada
  const [answerIdx, setAnswerIdx] = useState<number[]>(() => reconstructDragIdx(initialValue, shuffled));
  const answerTokens = answerIdx.map((i) => shuffled[i]);

  const pickToken = (i: number) => {
    if (answerIdx.includes(i)) return;
    setAnswerIdx([...answerIdx, i]);
  };
  const unpickToken = (positionInAnswer: number) => {
    setAnswerIdx(answerIdx.filter((_, idx) => idx !== positionInAnswer));
  };

  const allPicked = answerIdx.length === shuffled.length;
  const handleCheck = () => {
    if (!allPicked) return;
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
            {answerTokens.map((tok, i) => (
              <button
                key={i}
                onClick={() => unpickToken(i)}
                className="px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all bg-white border-slate-300 text-slate-900 hover:border-slate-500 active:scale-95"
              >
                {tok}
              </button>
            ))}
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
              disabled={used}
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

      {/* Submit — langsung simpan & lanjut ke soal berikutnya */}
      <button
        onClick={handleCheck}
        disabled={!allPicked}
        className="w-full px-6 py-3.5 bg-[#1A9E9E] text-white rounded-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#147a7a] transition"
      >
        Simpan Jawaban
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Missing Renderer — fill blanks by tapping from word bank
// ════════════════════════════════════════════════════════════════════════════
// Pulihkan isian "missing" (blanks + opsi terpakai) dari jawaban tersimpan
function reconstructMissing(val: string | number | boolean | null, options: string[], numBlanks: number): { filled: (string | null)[]; used: number[] } {
  const empty = { filled: Array(numBlanks).fill(null) as (string | null)[], used: [] as number[] };
  if (typeof val !== "string" || val === "__PASSED__" || val === "") return empty;
  const vals = val.split(",");
  if (vals.length !== numBlanks) return empty;
  const filled: (string | null)[] = [];
  const used: number[] = [];
  for (const v of vals) {
    if (v === "") { filled.push(null); continue; }
    const optIdx = options.findIndex((o, i) => o === v && !used.includes(i));
    filled.push(v);
    if (optIdx !== -1) used.push(optIdx);
  }
  return { filled, used };
}

function MissingRenderer({ question, initialValue, onSubmit }: {
  question: MissingQuestion;
  initialValue: string | number | boolean | null;
  onSubmit: (v: string | number | boolean, isCorrect?: boolean) => void;
}) {
  // Parse template: split by "___" to get parts; blanks are between parts
  const parts = question.template.split("___");
  // parts[i] is text, blanks[i] is between parts[i] and parts[i+1]
  const numBlanks = question.blanks.length;

  const [restored] = useState(() => reconstructMissing(initialValue, question.options, numBlanks));
  const [filled, setFilled] = useState<(string | null)[]>(restored.filled);
  const [usedOptions, setUsedOptions] = useState<number[]>(restored.used);

  const pickOption = (optIdx: number) => {
    // Find next empty blank
    const nextEmpty = filled.findIndex((v) => v === null);
    if (nextEmpty === -1) return;
    const newFilled = [...filled];
    newFilled[nextEmpty] = question.options[optIdx];
    setFilled(newFilled);
    setUsedOptions([...usedOptions, optIdx]);
  };

  const clearBlank = (blankIdx: number) => {
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
    if (!allFilled) return;
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
                  disabled={!filled[i]}
                  className={"inline-block mx-1 px-3 py-1 rounded-lg border-2 text-sm font-bold align-middle min-w-[80px] " +
                    (filled[i]
                      ? "bg-white border-[#1A9E9E] text-[#1A9E9E] hover:bg-[#1A9E9E]/5 cursor-pointer"
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
              disabled={used || allFilled}
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

      <button
        onClick={handleCheck}
        disabled={!allFilled}
        className="w-full px-6 py-3.5 bg-[#1A9E9E] text-white rounded-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#147a7a] transition"
      >
        Simpan Jawaban
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Matching Renderer — tap left card then right card to pair
// ════════════════════════════════════════════════════════════════════════════
// Pulihkan pasangan "matching" dari jawaban tersimpan
function reconstructMatching(val: string | number | boolean | null, n: number): (number | null)[] {
  const empty = Array(n).fill(null) as (number | null)[];
  if (typeof val !== "string" || val === "__PASSED__" || val === "") return empty;
  const parts = val.split(",");
  if (parts.length !== n) return empty;
  return parts.map((p) => { const num = parseInt(p, 10); return Number.isNaN(num) ? null : num; });
}

function MatchingRenderer({ question, initialValue, onSubmit }: {
  question: MatchingQuestion;
  initialValue: string | number | boolean | null;
  onSubmit: (v: string | number | boolean, isCorrect?: boolean) => void;
}) {
  // Stable shuffle of right-side items (so they don't align 1:1 visually)
  const [rightOrder] = useState(() =>
    question.pairs
      .map((p, i) => ({ i, k: Math.random() }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.i)
  );

  // pairing: left index (original) → right index (original) or null — dipulihkan bila ada jawaban
  const [pairing, setPairing] = useState<(number | null)[]>(() => reconstructMatching(initialValue, question.pairs.length));
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);

  const pickLeft = (leftIdx: number) => {
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
    if (!allPaired) return;
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
            // Tanpa reveal: pasangan yg dipilih tetap netral, tak ada hijau/merah.
            let cls = "bg-white border-slate-300 text-slate-900";
            if (isSelected) cls = "bg-[#1A9E9E]/10 border-[#1A9E9E] text-[#1A9E9E]";
            else if (isPaired) cls = "bg-slate-100 border-slate-400 text-slate-700";
            return (
              <button
                key={leftIdx}
                onClick={() => pickLeft(leftIdx)}
                className={"w-full px-3 py-3 rounded-xl border-2 text-sm font-medium text-left transition-all hover:border-[#1A9E9E] active:scale-95 cursor-pointer " + cls}
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
            const canClick = selectedLeft !== null;
            let cls = "bg-white border-slate-300 text-slate-900";
            if (isPaired) cls = "bg-slate-100 border-slate-400 text-slate-700";
            return (
              <button
                key={displayIdx}
                onClick={() => pickRight(origRightIdx)}
                disabled={!canClick}
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

      <button
        onClick={handleCheck}
        disabled={!allPaired}
        className="w-full px-6 py-3.5 bg-[#1A9E9E] text-white rounded-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#147a7a] transition"
      >
        Simpan Jawaban
      </button>
    </div>
  );
}
