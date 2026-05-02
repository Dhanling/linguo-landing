"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type Q = {
  id: number;
  text: string;
  options: string[];
  answer: number; // index of correct option
  skill: "grammar" | "vocabulary" | "reading" | "structure";
};

type TestType = "ielts" | "toefl-itp";

// ─────────────────────────────────────────────────────────────────────────────
// QUESTIONS — IELTS (20 soal: grammar, vocab, reading)
// ─────────────────────────────────────────────────────────────────────────────
const IELTS_QUESTIONS: Q[] = [
  // Grammar (7 soal)
  { id:1,  skill:"grammar",    text:"She ______ to London three times this year.", options:["went","has gone","goes","had gone"], answer:1 },
  { id:2,  skill:"grammar",    text:"The report ______ by the team before the deadline.", options:["completed","was completed","has completed","completing"], answer:1 },
  { id:3,  skill:"grammar",    text:"If I ______ more time, I would study abroad.", options:["have","had","will have","would have"], answer:1 },
  { id:4,  skill:"grammar",    text:"Despite ______ hard, she didn't pass the exam.", options:["study","to study","studied","studying"], answer:3 },
  { id:5,  skill:"grammar",    text:"The number of students ______ increased significantly.", options:["have","has","are","were"], answer:1 },
  { id:6,  skill:"grammar",    text:"Not only ______ he arrive late, but he also forgot his passport.", options:["did","does","was","had"], answer:0 },
  { id:7,  skill:"grammar",    text:"By the time the results are announced, the candidates ______ waiting for two weeks.", options:["will wait","have waited","will have been waiting","waited"], answer:2 },
  // Vocabulary (7 soal)
  { id:8,  skill:"vocabulary", text:"The government implemented policies to ______ unemployment.", options:["escalate","alleviate","aggravate","duplicate"], answer:1 },
  { id:9,  skill:"vocabulary", text:"The scientist's findings were ______, overturning decades of research.", options:["redundant","ambiguous","groundbreaking","negligible"], answer:2 },
  { id:10, skill:"vocabulary", text:"The new regulation will ______ small businesses more than large corporations.", options:["affect","effect","infect","reflect"], answer:0 },
  { id:11, skill:"vocabulary", text:"Climate change poses a ______ threat to coastal communities.", options:["substantial","lenient","casual","trivial"], answer:0 },
  { id:12, skill:"vocabulary", text:"The company's profits ______ sharply in the third quarter.", options:["deteriorated","fluctuated","plummeted","accelerated"], answer:2 },
  { id:13, skill:"vocabulary", text:"Researchers must ______ their findings through multiple experiments.", options:["verify","modify","nullify","simplify"], answer:0 },
  { id:14, skill:"vocabulary", text:"The treaty was signed to ______ diplomatic relations between the two nations.", options:["sever","restore","diminish","undermine"], answer:1 },
  // Reading — short passage (6 soal)
  { id:15, skill:"reading",    text:"PASSAGE: 'Urban farming is gaining traction as cities struggle with food security. By growing produce locally, cities can reduce transportation costs and carbon emissions while providing fresher food to residents.'\n\nWhat is the PRIMARY benefit of urban farming mentioned?", options:["Reducing city populations","Lowering food transport costs and emissions","Increasing city revenue","Providing employment for farmers"], answer:1 },
  { id:16, skill:"reading",    text:"Based on the same passage, the word 'traction' most closely means:", options:["decline","resistance","momentum","controversy"], answer:2 },
  { id:17, skill:"reading",    text:"PASSAGE: 'The digital divide refers to the gap between those who have reliable access to modern technology and those who do not. This disparity often correlates with socioeconomic status, geography, and education level.'\n\nAccording to the passage, the digital divide is MOST associated with:", options:["Age differences only","Cultural background","Socioeconomic and geographic factors","Language barriers"], answer:2 },
  { id:18, skill:"reading",    text:"Based on the same passage, which statement is TRUE?", options:["Everyone has equal access to technology","Education level is unrelated to the digital divide","The gap exists between technology haves and have-nots","Geography has no impact on technology access"], answer:2 },
  { id:19, skill:"reading",    text:"PASSAGE: 'Renewable energy sources such as solar and wind power have seen dramatic cost reductions over the past decade, making them increasingly competitive with fossil fuels. However, challenges related to energy storage and grid integration remain.'\n\nThe author's main point is that renewable energy is:", options:["More expensive than fossil fuels","Becoming cost-competitive but faces technical challenges","Already replacing fossil fuels entirely","Not yet viable for widespread use"], answer:1 },
  { id:20, skill:"reading",    text:"Based on the same passage, what challenge does renewable energy STILL face?", options:["High production costs","Lack of government support","Energy storage and grid integration","Public opposition"], answer:2 },
];

// ─────────────────────────────────────────────────────────────────────────────
// QUESTIONS — TOEFL ITP (20 soal: structure, grammar, reading)
// ─────────────────────────────────────────────────────────────────────────────
const TOEFL_QUESTIONS: Q[] = [
  // Structure & Written Expression (10 soal)
  { id:1,  skill:"structure",  text:"______ the Amazon River is the largest river in the world by discharge volume.", options:["It is known that","Known that","That is known","Is it known that"], answer:0 },
  { id:2,  skill:"structure",  text:"The committee has not yet reached ______ decision on the proposal.", options:["a","an","the","—"], answer:0 },
  { id:3,  skill:"structure",  text:"Rarely ______ such dedication in a first-year student.", options:["we see","do we see","we have seen","see we"], answer:1 },
  { id:4,  skill:"structure",  text:"The results of the experiment, ______ were published last month, surprised many scientists.", options:["that","which","who","what"], answer:1 },
  { id:5,  skill:"structure",  text:"Neither the manager nor the employees ______ aware of the new policy.", options:["was","were","is","has been"], answer:1 },
  { id:6,  skill:"structure",  text:"The data [A]shows [B]that global temperatures [C]have risen [D]significant over the past century.", options:["A","B","C","D — 'significant' should be 'significantly'"], answer:3 },
  { id:7,  skill:"structure",  text:"Scientists [A]discovered that the virus [B]mutates [C]rapid, making vaccines [D]difficult to develop.", options:["A","B","C — 'rapid' should be 'rapidly'","D"], answer:2 },
  { id:8,  skill:"structure",  text:"The government's [A]decision to [B]investing in renewable energy was [C]praised by [D]environmentalists.", options:["A","B — 'investing' should be 'invest'","C","D"], answer:1 },
  { id:9,  skill:"structure",  text:"Participating in community service [A]teaches students [B]responsible, [C]empathy, and [D]leadership skills.", options:["A","B — 'responsible' should be 'responsibility'","C","D"], answer:1 },
  { id:10, skill:"structure",  text:"The museum's [A]new exhibit [B]feature artifacts [C]dating back to [D]the Bronze Age.", options:["A","B — 'feature' should be 'features'","C","D"], answer:1 },
  // Grammar (4 soal)
  { id:11, skill:"grammar",    text:"By 1990, researchers ______ significant progress in genetic mapping.", options:["made","have made","had made","were making"], answer:2 },
  { id:12, skill:"grammar",    text:"The book ______ I borrowed from the library is overdue.", options:["who","what","which","where"], answer:2 },
  { id:13, skill:"grammar",    text:"It is essential that every student ______ the safety guidelines.", options:["follows","follow","followed","will follow"], answer:1 },
  { id:14, skill:"grammar",    text:"______ she studied medicine, she became interested in public health.", options:["During","While","Despite","Although"], answer:1 },
  // Reading (6 soal)
  { id:15, skill:"reading",    text:"PASSAGE: 'The Industrial Revolution, beginning in Britain in the late 18th century, transformed manufacturing processes through mechanization. This period saw a shift from agrarian economies to industrial ones, dramatically changing social structures and urban populations.'\n\nWhat was the PRIMARY effect of the Industrial Revolution?", options:["Decline of British agriculture","Transformation from farming to industrial economies","Reduction in urban populations","Decrease in manufacturing output"], answer:1 },
  { id:16, skill:"reading",    text:"Based on the passage, the word 'mechanization' refers to:", options:["manual labor practices","use of machines in production","agricultural techniques","social restructuring"], answer:1 },
  { id:17, skill:"reading",    text:"PASSAGE: 'Cognitive load theory suggests that working memory has a limited capacity. When learners are presented with too much information simultaneously, their ability to process and retain knowledge decreases significantly.'\n\nAccording to the passage, what happens when too much information is given at once?", options:["Learning improves through challenge","Memory capacity expands","Knowledge retention decreases","Working memory becomes unlimited"], answer:2 },
  { id:18, skill:"reading",    text:"The author's purpose in the cognitive load passage is to:", options:["Argue against modern education","Explain a theory about memory and learning","Promote a specific teaching method","Criticize traditional curricula"], answer:1 },
  { id:19, skill:"reading",    text:"PASSAGE: 'Biodiversity hotspots are regions with exceptionally high concentrations of endemic species that are simultaneously threatened by human activity. Conservation efforts in these areas are considered high-priority given their ecological significance.'\n\nWhat makes a region a 'biodiversity hotspot'?", options:["Large geographic area only","High pollution levels","High endemic species concentration under threat","Government protection status"], answer:2 },
  { id:20, skill:"reading",    text:"Based on the biodiversity passage, conservation in hotspots is prioritized because:", options:["They are the largest ecosystems","They have low human populations","They hold significant ecological value","They are easy to protect"], answer:2 },
];

// ─────────────────────────────────────────────────────────────────────────────
// SCORING → LEVEL RECOMMENDATION
// ─────────────────────────────────────────────────────────────────────────────
function getResult(score: number, total: number, type: TestType) {
  const pct = (score / total) * 100;
  if (type === "ielts") {
    if (pct >= 85) return { level: "B2.2 — Exam Mastery",      band: "Estimasi Band 7.0+",  color: "text-teal-600",   bg: "bg-teal-50",   desc: "Kemampuanmu sudah sangat baik. Langsung masuk level Exam Mastery untuk fine-tuning dan full mock tests." };
    if (pct >= 65) return { level: "B2.1 — Advanced Skills",   band: "Estimasi Band 6.5",   color: "text-blue-600",   bg: "bg-blue-50",   desc: "Kamu sudah punya fondasi kuat. Mulai dari Advanced Skills untuk memoles Writing dan Speaking ke standar Band 7." };
    if (pct >= 45) return { level: "B1.2 — Core Skills",       band: "Estimasi Band 5.5–6.0", color: "text-indigo-600", bg: "bg-indigo-50", desc: "Dasarmu cukup solid. Mulai dari Core Skills Drill untuk memperkuat semua 4 section IELTS." };
    return              { level: "B1.1 — Foundation",          band: "Estimasi Band 5.0–5.5", color: "text-amber-600",  bg: "bg-amber-50",  desc: "Kamu butuh fondasi IELTS yang kuat dulu. Foundation akan membangunnya dari bawah secara sistematis." };
  } else {
    if (pct >= 85) return { level: "B2.2 — Exam Mastery",      band: "Estimasi Skor 550+",  color: "text-teal-600",   bg: "bg-teal-50",   desc: "Kemampuanmu sangat baik. Langsung Exam Mastery untuk simulasi penuh dan maksimalkan skor." };
    if (pct >= 65) return { level: "B2.1 — Advanced Skills",   band: "Estimasi Skor 500–530", color: "text-blue-600",   bg: "bg-blue-50",   desc: "Fondasi kuat. Advanced Skills akan meningkatkan akurasi dan kecepatan menjawab soal TOEFL." };
    if (pct >= 45) return { level: "B1.2 — Core Skills",       band: "Estimasi Skor 450–480", color: "text-indigo-600", bg: "bg-indigo-50", desc: "Dasarmu cukup. Core Skills Drill akan memperkuat ketiga section TOEFL ITP secara sistematis." };
    return              { level: "B1.1 — Foundation",          band: "Estimasi Skor 400–450", color: "text-amber-600",  bg: "bg-amber-50",  desc: "Mulai dari Foundation untuk memahami format TOEFL ITP dan membangun strategi yang tepat." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function TestPrepCobaPage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as string) || "ielts";
  const isIELTS = lang === "ielts";
  const testType: TestType = isIELTS ? "ielts" : "toefl-itp";
  const questions = isIELTS ? IELTS_QUESTIONS : TOEFL_QUESTIONS;
  const testLabel = isIELTS ? "IELTS Academic" : "TOEFL ITP";
  const accentColor = isIELTS ? "teal" : "blue";

  // ── State ──
  type Phase = "lead" | "test" | "result";
  const [phase, setPhase] = useState<Phase>("lead");

  // Lead form
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [wa, setWa]         = useState("");
  const [saving, setSaving] = useState(false);
  const [leadErr, setLeadErr] = useState("");

  // Test
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Result
  const [score, setScore] = useState(0);

  // ── Save Lead ──
  async function saveLead() {
    if (!name.trim() || !email.trim() || !wa.trim()) {
      setLeadErr("Semua field wajib diisi ya!");
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) { setLeadErr("Format email tidak valid."); return; }

    setSaving(true);
    setLeadErr("");
    const { error } = await supabase.from("leads").upsert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      whatsapp: wa.trim(),
      source: `placement-${testType}`,
      interest: testType,
      created_at: new Date().toISOString(),
    }, { onConflict: "email" });

    setSaving(false);
    if (error) { setLeadErr("Gagal menyimpan data. Coba lagi ya."); return; }
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
        <div className={`px-7 pt-8 pb-6 bg-gradient-to-br ${isIELTS ? "from-teal-500 to-teal-700" : "from-blue-500 to-blue-700"} text-white`}>
          <div className="text-3xl mb-2">{isIELTS ? "🎓" : "📝"}</div>
          <h1 className="text-xl font-bold leading-tight">Placement Test {testLabel}</h1>
          <p className="text-sm opacity-90 mt-1">20 soal · ~10 menit · Gratis</p>
          <p className="text-xs opacity-75 mt-2">Isi data dulu supaya hasil test bisa kami kirimkan ke WhatsApp kamu.</p>
        </div>

        {/* Form */}
        <div className="px-7 py-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Nama Lengkap *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Budi Santoso"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Email *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="budi@email.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Nomor WhatsApp *</label>
            <input
              type="tel"
              value={wa}
              onChange={e => setWa(e.target.value)}
              placeholder="08123456789"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
            />
          </div>

          {leadErr && <p className="text-xs text-red-500 font-medium">{leadErr}</p>}

          <button
            onClick={saveLead}
            disabled={saving}
            className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-all ${
              isIELTS ? "bg-teal-600 hover:bg-teal-700" : "bg-blue-600 hover:bg-blue-700"
            } disabled:opacity-50`}
          >
            {saving ? "Menyimpan..." : `Mulai Placement Test →`}
          </button>

          <p className="text-[10px] text-gray-400 text-center">
            Data kamu aman. Tidak akan disebarkan ke pihak ketiga.
          </p>
        </div>
      </motion.div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: TEST
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "test") return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 inset-x-0 z-50">
        <div className="h-1 bg-gray-200">
          <motion.div
            className={`h-full ${isIELTS ? "bg-teal-500" : "bg-blue-500"}`}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <div className={`flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{isIELTS ? "🎓" : "📝"}</span>
            <span className="text-sm font-semibold text-gray-700">{testLabel} Placement</span>
          </div>
          <span className="text-xs text-gray-500 font-medium">{current + 1} / {questions.length}</span>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-start justify-center pt-28 pb-10 px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-xl"
          >
            {/* Skill badge */}
            <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 ${
              q.skill === "grammar"    ? "bg-purple-100 text-purple-600" :
              q.skill === "vocabulary" ? "bg-amber-100 text-amber-600" :
              q.skill === "structure"  ? "bg-blue-100 text-blue-600" :
                                        "bg-green-100 text-green-600"
            }`}>
              {q.skill === "grammar" ? "Grammar" : q.skill === "vocabulary" ? "Vocabulary" : q.skill === "structure" ? "Structure" : "Reading"}
            </span>

            {/* Question text — handle passage */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
              {q.text.includes("PASSAGE:") ? (
                <>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 text-sm text-gray-700 leading-relaxed italic">
                    {q.text.split("\n\n")[0].replace("PASSAGE: ", "").replace(/'/g, "")}
                  </div>
                  <p className="text-base font-semibold text-gray-900 leading-snug">
                    {q.text.split("\n\n")[1]}
                  </p>
                </>
              ) : (
                <p className="text-base font-semibold text-gray-900 leading-snug">{q.text}</p>
              )}
            </div>

            {/* Options */}
            <div className="flex flex-col gap-2.5">
              {q.options.map((opt, idx) => {
                const isCorrect = idx === q.answer;
                const isSelected = idx === selected;
                let cls = "border border-gray-200 bg-white text-gray-800 hover:border-gray-400";
                if (showFeedback) {
                  if (isCorrect) cls = "border-2 border-teal-500 bg-teal-50 text-teal-800";
                  else if (isSelected && !isCorrect) cls = "border-2 border-red-400 bg-red-50 text-red-800";
                  else cls = "border border-gray-100 bg-gray-50 text-gray-400";
                }
                return (
                  <button
                    key={idx}
                    onClick={() => selectAnswer(idx)}
                    disabled={showFeedback}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${cls}`}
                  >
                    <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Feedback + Next */}
            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <button
                    onClick={nextQuestion}
                    className={`w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all ${
                      isIELTS ? "bg-teal-600 hover:bg-teal-700" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {current < questions.length - 1 ? "Soal Berikutnya →" : "Lihat Hasil Test →"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: RESULT
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Score card */}
        <div className={`rounded-3xl overflow-hidden shadow-xl border border-gray-100`}>
          <div className={`px-7 pt-8 pb-6 bg-gradient-to-br ${isIELTS ? "from-teal-500 to-teal-700" : "from-blue-500 to-blue-700"} text-white text-center`}>
            <p className="text-sm opacity-80 mb-1">Hasil Placement Test</p>
            <div className="text-6xl font-extrabold">{score}<span className="text-2xl font-normal opacity-75">/{questions.length}</span></div>
            <p className="text-sm opacity-90 mt-1">{Math.round((score / questions.length) * 100)}% benar</p>
          </div>

          <div className="bg-white px-7 py-6">
            {/* Recommendation */}
            <div className={`${result.bg} rounded-2xl p-4 mb-5`}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Rekomendasi Level</p>
              <p className={`text-lg font-extrabold ${result.color} mb-1`}>{result.level}</p>
              <p className={`text-sm font-semibold ${result.color} mb-2`}>{result.band}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{result.desc}</p>
            </div>

            {/* Score breakdown */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 mb-3">Breakdown per Skill</p>
              <div className="flex flex-col gap-2">
                {(["grammar","vocabulary","reading","structure"] as const).map(skill => {
                  const skillQs = questions.filter(q => q.skill === skill);
                  if (skillQs.length === 0) return null;
                  const skillScore = skillQs.filter(q => answers[q.id] === q.answer).length;
                  const skillPct = Math.round((skillScore / skillQs.length) * 100);
                  const skillLabel = skill === "grammar" ? "Grammar" : skill === "vocabulary" ? "Vocabulary" : skill === "structure" ? "Structure" : "Reading";
                  return (
                    <div key={skill}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium">{skillLabel}</span>
                        <span className="font-semibold text-gray-700">{skillScore}/{skillQs.length}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${isIELTS ? "bg-teal-500" : "bg-blue-500"}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${skillPct}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2.5">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-3 rounded-xl text-white font-semibold text-sm text-center transition-all ${
                  isIELTS ? "bg-teal-600 hover:bg-teal-700" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                💬 Konsultasi & Daftar Sekarang
              </a>
              <button
                onClick={() => router.push(`/silabus/${lang}`)}
                className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
              >
                Lihat Silabus {testLabel}
              </button>
            </div>

            <p className="text-[10px] text-gray-400 text-center mt-4">
              Tim Linguo akan menghubungi kamu di WhatsApp dalam 1×24 jam.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
