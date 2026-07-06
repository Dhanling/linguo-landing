"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  fetchSimulation, getStudentInfo, createAttempt, uploadRecording,
  gradeObjective, gradeWithAI, saveAnswers, finalizeAttempt,
  AUTO_GRADED, SKILL_LABEL, testTypeLabel,
  TEST_OVERVIEW, SKILL_HOWTO, GENERAL_RULES,
  type Simulation, type Section, type Question, type AnswerPayload, type StudentInfo, type Skill,
} from "@/lib/simulations";
import {
  ArrowLeft, ArrowRight, BookOpen, Headphones, PenLine, Mic, Square,
  Loader2, CheckCircle2, Trophy, Sparkles, ListChecks, AlertCircle, ClipboardCheck,
  Clock, X, Info, ChevronDown, Check,
} from "lucide-react";

const TEAL = "#1A9E9E";
const TEAL_DEEP = "#0F6E56";
const YELLOW = "#FFC93C";

const SKILL_ICON: Record<string, any> = { reading: BookOpen, listening: Headphones, writing: PenLine, speaking: Mic };

// audio_url bisa berupa file mp3 (storage) atau link YouTube (disematkan admin).
function youtubeEmbedId(url: string): string | null {
  const m = (url || "").match(/(?:youtube\.com\/watch\?[^#]*\bv=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// Admin bisa memotong intro/akhir video → tersimpan sbg &start= / &end= (detik).
// Bentuk src embed yang menghormati trim supaya siswa langsung mulai setelah intro.
function youtubeEmbedSrc(url: string): string | null {
  const id = youtubeEmbedId(url);
  if (!id) return null;
  const num = (re: RegExp) => { const m = (url || "").match(re); return m ? Math.max(0, parseInt(m[1], 10) || 0) : 0; };
  const start = num(/[?&](?:start|t)=(\d+)/);
  const end = num(/[?&]end=(\d+)/);
  const p = new URLSearchParams();
  if (start > 0) p.set("start", String(start));
  if (end > 0) p.set("end", String(end));
  const qs = p.toString();
  return `https://www.youtube.com/embed/${id}${qs ? `?${qs}` : ""}`;
}

type AnswerState = { selected_index: number | null; text: string; audioBlob: Blob | null; audioUrl: string | null };
type Phase = "loading" | "intro" | "running" | "grading" | "result" | "noauth" | "notfound";
type ResultItem = { question: Question; skill: string; correct: boolean | null; points: number; ai_score: number | null; ai_feedback: string | null };

export default function SimulasiRunnerPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const searchParams = useSearchParams();
  const preview = searchParams?.get("preview") === "1"; // POV siswa untuk admin/curriculum

  const [phase, setPhase] = useState<Phase>("loading");
  const [sim, setSim] = useState<Simulation | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [info, setInfo] = useState<StudentInfo | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [secIdx, setSecIdx] = useState(0);
  const [maxSecIdx, setMaxSecIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [results, setResults] = useState<ResultItem[]>([]);
  const [totals, setTotals] = useState({ score: 0, max_score: 0, auto_score: 0, ai_score: 0 });
  const [gradingMsg, setGradingMsg] = useState("");
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    (async () => {
      let studentInfo = await getStudentInfo();
      if (!studentInfo) {
        if (!preview) { setPhase("noauth"); return; }
        studentInfo = { name: "Preview", email: "preview@linguo.id" } as StudentInfo; // dummy, tak disimpan
      }
      setInfo(studentInfo);
      const { simulation, sections: secs, questions: qs } = await fetchSimulation(id, preview);
      if (!simulation) { setPhase("notfound"); return; }
      setSim(simulation); setSections(secs); setQuestions(qs);
      const init: Record<string, AnswerState> = {};
      qs.forEach((q) => { init[q.id] = { selected_index: null, text: "", audioBlob: null, audioUrl: null }; });
      setAnswers(init);
      setPhase("intro");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, preview]);

  // Catat bagian terjauh yang pernah dibuka — soal di bagian yang sudah dilewati
  // namun belum dijawab dianggap "dilewati" (ditandai merah di navigasi).
  useEffect(() => { setMaxSecIdx((m) => Math.max(m, secIdx)); }, [secIdx]);

  const setAns = (qid: string, patch: Partial<AnswerState>) =>
    setAnswers((p) => ({ ...p, [qid]: { ...p[qid], ...patch } }));

  // Penomoran soal berlanjut lintas-bagian (1..N untuk seluruh tes), bukan reset
  // ke 1 tiap section. `questions` sudah terurut per section dari fetchSimulation.
  const qNumber = useMemo(() => {
    const m: Record<string, number> = {};
    questions.forEach((q, i) => { m[q.id] = i + 1; });
    return m;
  }, [questions]);

  // Loncat ke soal tertentu lewat navigasi: pindah bagian lalu scroll ke soalnya.
  function goToQuestion(targetSecIdx: number, qid: string) {
    setSecIdx(targetSecIdx);
    requestAnimationFrame(() => setTimeout(() => {
      const el = document.getElementById(`q-${qid}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.classList.add("ring-2", "ring-teal-400");
      setTimeout(() => el?.classList.remove("ring-2", "ring-teal-400"), 1200);
    }, 60));
  }

  async function start() {
    if (!sim || !info) return;
    if (preview) {
      setAttemptId("preview"); // tak menyimpan attempt sungguhan
    } else {
      const aid = await createAttempt(sim.id, info);
      if (!aid) { alert("Gagal memulai simulasi. Coba lagi."); return; }
      setAttemptId(aid);
    }
    if (sim.duration_minutes > 0) {
      const dl = Date.now() + sim.duration_minutes * 60_000;
      setDeadline(dl);
      setRemaining(sim.duration_minutes * 60);
    }
    setPhase("running");
  }

  // Countdown timer — auto-submit saat waktu habis.
  useEffect(() => {
    if (phase !== "running" || !deadline) return;
    const tick = () => {
      const secs = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0) submit(true); // waktu habis → kirim paksa walau belum lengkap
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, deadline]);

  async function submit(force = false) {
    if (!sim || !attemptId) return;
    if (submittingRef.current) return;

    // Blokir submit manual bila masih ada soal yang belum dijawab (kecuali waktu habis).
    if (!force) {
      const unanswered = questions.filter((q) => !isAnswered(q, answers[q.id]));
      if (unanswered.length > 0) {
        alert(`Masih ada ${unanswered.length} soal yang belum dijawab. Lengkapi semua soal dulu sebelum mengirim — cek panel Navigasi Soal (tanda merah = terlewati).`);
        return;
      }
    }

    submittingRef.current = true;
    setPhase("grading");

    const payloads: AnswerPayload[] = [];
    const resultItems: ResultItem[] = [];
    let autoScore = 0, aiScore = 0, maxScore = 0;
    const skillOf: Record<string, string> = {};
    sections.forEach((s) => questions.filter((q) => q.section_id === s.id).forEach((q) => { skillOf[q.id] = s.skill; }));

    let aiCount = 0;
    questions.forEach((q) => { if (!AUTO_GRADED.includes(q.type)) aiCount++; });
    let aiDone = 0;

    for (const q of questions) {
      const skill = (skillOf[q.id] as any) || "reading";
      const a = answers[q.id] ?? { selected_index: null, text: "", audioBlob: null, audioUrl: null };
      maxScore += q.points;

      if (AUTO_GRADED.includes(q.type)) {
        const { correct, points } = gradeObjective(q, a.selected_index, a.text);
        autoScore += points;
        payloads.push({
          question_id: q.id, section_skill: skill,
          response_text: a.text || null, audio_url: null, selected_index: a.selected_index,
          is_correct: correct, points_earned: points, ai_score: null, ai_feedback: null,
        });
        resultItems.push({ question: q, skill, correct, points, ai_score: null, ai_feedback: null });
      } else if (preview) {
        // Mode preview — tidak memanggil AI (hemat biaya), tampilkan placeholder.
        resultItems.push({ question: q, skill, correct: null, points: 0, ai_score: null, ai_feedback: "Mode preview — Writing/Speaking tidak dinilai." });
      } else {
        // Writing / Speaking → AI
        aiDone++;
        setGradingMsg(`Menilai jawaban ${q.type === "speaking_task" ? "speaking" : "writing"} (${aiDone}/${aiCount}) secara otomatis…`);
        let audioUrl: string | null = a.audioUrl;
        if (q.type === "speaking_task" && a.audioBlob && !audioUrl) {
          audioUrl = await uploadRecording(attemptId, q.id, a.audioBlob);
        }
        const graded = await gradeWithAI({
          test_type: sim.test_type,
          skill: q.type === "speaking_task" ? "speaking" : "writing",
          prompt: q.prompt,
          rubric: q.explanation || undefined,
          response_text: a.text || undefined,
          audio_url: audioUrl || undefined,
          image_url: q.image_url || undefined,
        });
        const ai = graded?.score ?? null;
        const earned = ai != null ? (q.points * ai) / 100 : 0;
        aiScore += earned;
        const respText = a.text || graded?.transcript || null;
        payloads.push({
          question_id: q.id, section_skill: skill,
          response_text: respText, audio_url: audioUrl,
          selected_index: null, is_correct: null, points_earned: earned,
          ai_score: ai, ai_feedback: graded?.feedback ?? null,
        });
        resultItems.push({ question: q, skill, correct: null, points: earned, ai_score: ai, ai_feedback: graded?.feedback ?? null });
      }
    }

    const score = autoScore + aiScore;
    const t = { score, max_score: maxScore, auto_score: autoScore, ai_score: aiScore };
    if (!preview) { // mode preview tidak menyimpan attempt/jawaban ke database
      await saveAnswers(attemptId, payloads);
      await finalizeAttempt(attemptId, t);
    }
    setTotals(t);
    setResults(resultItems);
    setPhase("result");
  }

  // ── Render states ──────────────────────────────────────────────────────────
  if (phase === "loading") return <Centered><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></Centered>;

  if (phase === "noauth") return (
    <Centered>
      <div className="text-center">
        <p className="text-sm text-slate-600">Masuk dulu untuk mengerjakan simulasi.</p>
        <Link href="/akun" className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white" style={{ background: TEAL }}>
          Masuk / Daftar <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Centered>
  );

  if (phase === "notfound") return (
    <Centered>
      <div className="text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-slate-400" />
        <p className="mt-2 text-sm text-slate-600">Simulasi tidak tersedia. Mungkin belum dipublikasikan, atau kamu belum punya akses paketnya.</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link href="/simulasi/paket" className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white" style={{ background: TEAL }}>
            Beli Paket <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/akun/simulasi" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700">
            <ArrowLeft className="h-4 w-4" />Kembali ke daftar
          </Link>
        </div>
      </div>
    </Centered>
  );

  if (!sim) return null;

  if (phase === "grading") return (
    <Centered>
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin" style={{ color: TEAL }} />
        <p className="mt-3 font-semibold text-slate-800">Menilai jawaban kamu…</p>
        <p className="mt-1 text-sm text-slate-500">{gradingMsg || "Mohon tunggu sebentar."}</p>
      </div>
    </Centered>
  );

  if (phase === "result") return (
    <ResultView sim={sim} totals={totals} results={results} />
  );

  // intro — onboarding wizard 3 langkah sebelum mulai mengerjakan
  if (phase === "intro") {
    return (
      <Shell sim={sim} preview={preview}>
        <IntroWizard sim={sim} sections={sections} questions={questions} onStart={start} />
      </Shell>
    );
  }

  // running
  const section = sections[secIdx];
  const secQs = questions.filter((q) => q.section_id === section.id);
  const isLast = secIdx === sections.length - 1;
  const SkillIcon = SKILL_ICON[section.skill];
  const hasMedia = !!(section.audio_url || section.passage);
  const sectionHeader = (
    <>
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal-700">
        <SkillIcon className="h-4 w-4" />{SKILL_LABEL[section.skill]} · Bagian {secIdx + 1}/{sections.length}
      </div>
      <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
      {section.instructions && <p className="mt-1 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{section.instructions}</p>}
    </>
  );

  return (
    <Shell sim={sim} preview={preview} wide={hasMedia} headerRight={remaining != null ? <TimerPill seconds={remaining} /> : undefined}>
      {/* progress */}
      <div className="mb-4 flex items-center gap-1.5">
        {sections.map((s, i) => (
          <div key={s.id} className="h-1.5 flex-1 rounded-full" style={{ background: i <= secIdx ? TEAL : "#e2e8f0" }} />
        ))}
      </div>

      <QuestionNavigator
        sections={sections}
        questions={questions}
        answers={answers}
        currentSecIdx={secIdx}
        maxVisitedSecIdx={maxSecIdx}
        onJump={goToQuestion}
        qNumber={qNumber}
      />

      {/* Split view ala ujian CBT asli: materi (passage/audio) sticky di kiri,
          soal discroll di kanan. Bagian tanpa materi tetap satu kolom. */}
      <div className={hasMedia ? "lg:grid lg:grid-cols-[2fr_3fr] lg:items-start lg:gap-5" : undefined}>
        {hasMedia && (
          <aside className="mb-4 lg:sticky lg:top-24 lg:mb-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:flex lg:max-h-[calc(100vh-8rem)] lg:min-h-0 lg:flex-col">
              {sectionHeader}
              {section.audio_url && (
                youtubeEmbedId(section.audio_url) ? (
                  <div className="mt-3 aspect-video w-full shrink-0 overflow-hidden rounded-lg border border-slate-200">
                    <iframe
                      className="h-full w-full"
                      src={youtubeEmbedSrc(section.audio_url)!}
                      title="Audio listening"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  // Mobile: player nempel di bawah header saat scroll soal; desktop udah sticky di pane kiri.
                  <div className="sticky top-[72px] z-20 mt-3 shrink-0 rounded-xl bg-white/95 py-1 backdrop-blur lg:static lg:py-0">
                    <audio controls src={section.audio_url} className="w-full" />
                  </div>
                )
              )}
              {section.passage && (
                <div className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700 lg:max-h-none lg:min-h-0 lg:flex-1">
                  {section.passage}
                </div>
              )}
            </div>
          </aside>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        {!hasMedia && sectionHeader}

        <div className="mt-5 space-y-5 first:mt-0">
          {secQs.map((q) => (
            <QuestionBlock key={q.id} index={qNumber[q.id]} q={q} state={answers[q.id]} onChange={(p) => setAns(q.id, p)} />
          ))}
          {secQs.length === 0 && <p className="text-sm text-slate-400">Tidak ada soal di bagian ini.</p>}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            disabled={secIdx === 0}
            onClick={() => setSecIdx((i) => Math.max(0, i - 1))}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />Sebelumnya
          </button>
          {isLast ? (
            <button onClick={() => submit()} className="inline-flex items-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-bold text-white" style={{ background: TEAL_DEEP }}>
              <CheckCircle2 className="h-4 w-4" />Selesai &amp; Kirim
            </button>
          ) : (
            <button onClick={() => setSecIdx((i) => i + 1)} className="inline-flex items-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-bold text-white" style={{ background: TEAL }}>
              Lanjut <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
        </div>
      </div>
    </Shell>
  );
}

// ── Layout helpers ────────────────────────────────────────────────────────────
function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
        <Icon className="h-3.5 w-3.5 text-teal-600" />{label}
      </div>
      <p className="mt-0.5 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">{children}</div>;
}

// ── Onboarding wizard: Ikhtisar → Petunjuk & cek mic → Rincian bagian ─────────
const INTRO_STEPS = ["Ikhtisar", "Petunjuk", "Rincian"] as const;

function IntroWizard({ sim, sections, questions, onStart }: {
  sim: Simulation; sections: Section[]; questions: Question[]; onStart: () => void;
}) {
  const [step, setStep] = useState(0);
  const hasSpeaking = useMemo(() => sections.some((s) => s.skill === "speaking"), [sections]);
  const rules = GENERAL_RULES.filter((r) => !r.timed || sim.duration_minutes > 0);

  // Kelompokkan bagian per skill → accordion biar daftar yang panjang (mis. 13
  // bagian) tidak membanjiri layar. Default skill pertama yang terbuka.
  const groups = useMemo(() => {
    const map: { skill: Skill; parts: { section: Section; idx: number; count: number }[] }[] = [];
    sections.forEach((s, i) => {
      const count = questions.filter((q) => q.section_id === s.id).length;
      let g = map.find((x) => x.skill === s.skill);
      if (!g) { g = { skill: s.skill, parts: [] }; map.push(g); }
      g.parts.push({ section: s, idx: i, count });
    });
    return map;
  }, [sections, questions]);
  const [openSkill, setOpenSkill] = useState<Skill | null>(sections[0]?.skill ?? null);

  const isLast = step === INTRO_STEPS.length - 1;

  return (
    <div>
      {/* Stepper */}
      <div className="mb-5 flex items-center">
        {INTRO_STEPS.map((label, i) => (
          <div key={label} className="flex items-center last:flex-none [&:not(:last-child)]:flex-1">
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i <= step ? "text-white" : "bg-slate-100 text-slate-400"}`}
                style={i <= step ? { background: TEAL } : undefined}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={`hidden text-xs font-semibold sm:inline ${i === step ? "text-slate-900" : "text-slate-400"}`}>{label}</span>
            </div>
            {i < INTRO_STEPS.length - 1 && (
              <div className="mx-2 h-0.5 flex-1 rounded" style={{ background: i < step ? TEAL : "#e2e8f0" }} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0 — Ikhtisar */}
      {step === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">{sim.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{sim.description || TEST_OVERVIEW[sim.test_type]}</p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat icon={ListChecks} label="Total Soal" value={`${questions.length} soal`} />
            <Stat icon={BookOpen} label="Jumlah Bagian" value={`${sections.length} bagian`} />
            <Stat icon={Clock} label="Durasi" value={sim.duration_minutes > 0 ? `${sim.duration_minutes} menit` : "Tanpa batas"} />
          </div>

        </div>
      )}

      {/* Step 1 — Petunjuk & cek perangkat */}
      {step === 1 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Info className="h-4 w-4 text-teal-600" />Petunjuk Pengerjaan
          </h3>
          <ul className="mt-3 space-y-2">
            {rules.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-600">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />{r.text}
              </li>
            ))}
          </ul>

          {hasSpeaking && (
            <div className="mt-5 border-t border-slate-100 pt-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Mic className="h-4 w-4 text-teal-600" />Cek Mikrofon
              </h3>
              <p className="mt-1 text-xs text-slate-500">Tes ini ada bagian Speaking. Pastikan mikrofon berfungsi sebelum mulai.</p>
              <MicCheck />
            </div>
          )}
        </div>
      )}

      {/* Step 2 — Rincian bagian (accordion per skill) */}
      {step === 2 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-bold text-slate-900">Rincian Bagian</h3>
          <p className="mt-1 text-xs text-slate-500">Kerjakan tiap bagian secara berurutan.</p>
          <div className="mt-3 space-y-2">
            {groups.map((g) => {
              const Icon = SKILL_ICON[g.skill];
              const isOpen = openSkill === g.skill;
              const totalQ = g.parts.reduce((n, p) => n + p.count, 0);
              return (
                <div key={g.skill} className="overflow-hidden rounded-xl border border-slate-100">
                  <button
                    type="button"
                    onClick={() => setOpenSkill(isOpen ? null : g.skill)}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-sm font-semibold text-slate-900">{SKILL_LABEL[g.skill]}</span>
                    <span className="text-xs font-medium text-slate-400 tabular-nums">{g.parts.length} bagian · {totalQ} soal</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isOpen && (
                    <ol className="space-y-2 border-t border-slate-100 px-3 py-2.5">
                      {g.parts.map((p) => (
                        <li key={p.section.id} className="text-sm">
                          <p className="font-semibold text-slate-900">
                            <span className="mr-1 text-slate-400">Bagian {p.idx + 1}.</span>{p.section.title}
                          </p>
                          <p className="mt-0.5 text-xs font-medium text-teal-700">
                            {p.count} soal{p.section.duration_minutes > 0 ? ` · ${p.section.duration_minutes} menit` : ""}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-500">{p.section.instructions || SKILL_HOWTO[g.skill]}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigasi wizard */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />Kembali
        </button>
        {isLast ? (
          <button onClick={onStart} className="inline-flex items-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-bold text-white" style={{ background: TEAL_DEEP }}>
            <CheckCircle2 className="h-4 w-4" />Saya Mengerti, Mulai Simulasi
          </button>
        ) : (
          <button onClick={() => setStep((s) => s + 1)} className="inline-flex items-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-bold text-white" style={{ background: TEAL }}>
            Lanjut <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Cek mikrofon — minta izin lalu tampilkan level meter sebagai bukti mic aktif.
function MicCheck() {
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const [level, setLevel] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  function stop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    ctxRef.current?.close().catch(() => {});
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }
  useEffect(() => stop, []);

  async function check() {
    setStatus("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      setStatus("ok");
      const loop = () => {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (let i = 0; i < data.length; i++) { const v = Math.abs(data[i] - 128); if (v > peak) peak = v; }
        setLevel(Math.min(100, Math.round((peak / 128) * 200)));
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      {status === "idle" && (
        <button onClick={check} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: TEAL }}>
          <Mic className="h-4 w-4" />Tes mikrofon
        </button>
      )}
      {status === "checking" && (
        <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Meminta izin mikrofon…</p>
      )}
      {status === "ok" && (
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600"><CheckCircle2 className="h-4 w-4" />Mikrofon aktif — coba bicara, bar akan bergerak.</p>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full transition-[width] duration-75" style={{ width: `${level}%`, background: TEAL }} />
          </div>
        </div>
      )}
      {status === "error" && (
        <div>
          <p className="flex items-center gap-1.5 text-sm font-medium text-red-500"><AlertCircle className="h-4 w-4" />Tidak bisa mengakses mikrofon. Izinkan akses di browser lalu coba lagi.</p>
          <button onClick={check} className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600">
            <Mic className="h-4 w-4" />Coba lagi
          </button>
        </div>
      )}
    </div>
  );
}

function Shell({ sim, children, headerRight, preview, wide }: { sim: Simulation; children: React.ReactNode; headerRight?: React.ReactNode; preview?: boolean; wide?: boolean }) {
  // wide = layout split materi|soal (butuh ruang 2 kolom di desktop)
  const maxW = wide ? "max-w-6xl" : "max-w-3xl";
  return (
    <div className="min-h-screen bg-slate-50">
      {preview && (
        <div className="bg-amber-400 px-4 py-1.5 text-center text-xs font-semibold text-amber-950">
          Mode Preview — tampilan POV siswa. Jawaban & nilai tidak disimpan.
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className={`mx-auto flex ${maxW} items-center gap-3 px-4 py-3.5 sm:px-6`}>
          <Link href="/akun/simulasi" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: TEAL_DEEP }}>
            <ClipboardCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">{sim.title}</p>
            <p className="text-xs text-slate-500">{testTypeLabel(sim.test_type, sim.test_variant)}</p>
          </div>
          {headerRight}
        </div>
      </header>
      <main className={`mx-auto ${maxW} px-4 py-6 sm:px-6`}>{children}</main>
    </div>
  );
}

// Timer pill — merah saat <= 60 detik tersisa.
function TimerPill({ seconds }: { seconds: number }) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const danger = seconds <= 60;
  return (
    <span
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums ${danger ? "animate-pulse bg-red-50 text-red-600" : "bg-slate-100 text-slate-700"}`}
      title="Sisa waktu — otomatis dikumpulkan saat habis"
    >
      <Clock className="h-4 w-4" />{mm}:{ss}
    </span>
  );
}

// Apakah sebuah soal sudah dijawab (sesuai tipenya)?
function isAnswered(q: Question, s?: AnswerState) {
  if (!s) return false;
  if (q.type === "multiple_choice" || q.type === "matching" || q.type === "true_false_ng")
    return s.selected_index != null;
  if (q.type === "speaking_task") return !!(s.audioBlob || s.audioUrl);
  return s.text.trim().length > 0;
}

// ── Navigasi soal mengambang: blok nomor + status terjawab/belum/dilewati ────
type NavStatus = "answered" | "skipped" | "todo";

function QuestionNavigator({ sections, questions, answers, currentSecIdx, maxVisitedSecIdx, onJump, qNumber }: {
  sections: Section[]; questions: Question[]; answers: Record<string, AnswerState>;
  currentSecIdx: number; maxVisitedSecIdx: number; onJump: (secIdx: number, qid: string) => void;
  qNumber: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);

  // Kelompokkan section menurut skill → maksimal 4 tab (Reading/Listening/Speaking/Writing).
  // Tiap skill berisi satu/lebih "part" (bagian). Accordion 2 tingkat: skill → part → soal.
  const groups = useMemo(() => {
    const map: { skill: Skill; parts: { section: Section; si: number; qs: Question[] }[] }[] = [];
    sections.forEach((s, si) => {
      const qs = questions.filter((q) => q.section_id === s.id);
      if (qs.length === 0) return;
      let g = map.find((x) => x.skill === s.skill);
      if (!g) { g = { skill: s.skill, parts: [] }; map.push(g); }
      g.parts.push({ section: s, si, qs });
    });
    return map;
  }, [sections, questions]);

  const currentSkill = sections[currentSecIdx]?.skill ?? null;
  // Accordion: hanya skill & part yang aktif yang terbuka, lainnya otomatis ter-collapse.
  const [openSkill, setOpenSkill] = useState<Skill | null>(currentSkill);
  const [openPart, setOpenPart] = useState(currentSecIdx);
  useEffect(() => {
    setOpenSkill(sections[currentSecIdx]?.skill ?? null);
    setOpenPart(currentSecIdx);
  }, [currentSecIdx, sections]);

  const statusOf = (q: Question, si: number): NavStatus => {
    if (isAnswered(q, answers[q.id])) return "answered";
    return si < maxVisitedSecIdx ? "skipped" : "todo"; // dilewati vs belum dibuka
  };

  let answeredCount = 0, skippedCount = 0;
  sections.forEach((s, si) => questions.filter((q) => q.section_id === s.id).forEach((q) => {
    const st = statusOf(q, si);
    if (st === "answered") answeredCount++;
    else if (st === "skipped") skippedCount++;
  }));

  const handleJump = (si: number, qid: string) => { onJump(si, qid); setOpen(false); };

  const body = (
    <>
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <ListChecks className="h-4 w-4 text-teal-600" />Navigasi Soal
        </p>
        <span className="text-xs font-medium text-slate-500">{answeredCount}/{questions.length} terjawab</span>
      </div>

      {skippedCount > 0 && (
        <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />{skippedCount} soal terlewati belum dijawab
        </p>
      )}

      <div className="space-y-2">
        {groups.map((g) => {
          const Icon = SKILL_ICON[g.skill];
          const isSkillOpen = openSkill === g.skill;
          const allQs = g.parts.flatMap((p) => p.qs);
          const ansInSkill = allQs.filter((q) => isAnswered(q, answers[q.id])).length;
          const skipInSkill = g.parts.reduce((n, p) => n + p.qs.filter((q) => statusOf(q, p.si) === "skipped").length, 0);
          const isActiveSkill = g.skill === currentSkill;
          const multiPart = g.parts.length > 1;

          // Grid nomor soal untuk satu part.
          const qGrid = (qs: Question[], si: number) => (
            <div className="flex flex-wrap gap-1.5">
              {qs.map((q) => {
                const st = statusOf(q, si);
                const num = qNumber[q.id];
                const cls =
                  st === "answered" ? "text-white"
                  : st === "skipped" ? "border border-red-300 bg-red-50 text-red-600 hover:border-red-400"
                  : "border border-slate-300 bg-white text-slate-600 hover:border-teal-400 hover:text-teal-700";
                const label = st === "answered" ? "sudah dijawab" : st === "skipped" ? "terlewati — belum dijawab" : "belum dijawab";
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleJump(si, q.id)}
                    title={`Soal ${num} · ${label}`}
                    className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-1.5 text-xs font-semibold tabular-nums transition ${cls}`}
                    style={st === "answered" ? { background: TEAL } : undefined}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          );

          return (
            <div key={g.skill} className="overflow-hidden rounded-xl border border-slate-100">
              <button
                type="button"
                onClick={() => setOpenSkill(isSkillOpen ? null : g.skill)}
                className={`flex w-full items-center gap-1.5 px-2.5 py-2 text-xs font-semibold ${isActiveSkill ? "bg-teal-50/60 text-teal-800" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="flex-1 truncate text-left">{SKILL_LABEL[g.skill]}</span>
                {isActiveSkill && <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700">aktif</span>}
                {skipInSkill > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">{skipInSkill}</span>}
                <span className="text-[10px] font-medium text-slate-400 tabular-nums">{ansInSkill}/{allQs.length}</span>
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${isSkillOpen ? "rotate-180" : ""}`} />
              </button>

              {isSkillOpen && (
                multiPart ? (
                  // >1 bagian → tampilkan accordion "Part 1 / Part 2 / …".
                  <div className="space-y-1.5 px-2 pb-2.5 pt-1">
                    {g.parts.map((p, pi) => {
                      const isPartOpen = openPart === p.si;
                      const ansInPart = p.qs.filter((q) => isAnswered(q, answers[q.id])).length;
                      const skipInPart = p.qs.filter((q) => statusOf(q, p.si) === "skipped").length;
                      const isActivePart = p.si === currentSecIdx;
                      return (
                        <div key={p.section.id} className="overflow-hidden rounded-lg border border-slate-100">
                          <button
                            type="button"
                            onClick={() => setOpenPart(isPartOpen ? -1 : p.si)}
                            className={`flex w-full items-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold ${isActivePart ? "bg-teal-50/60 text-teal-800" : "text-slate-500 hover:bg-slate-50"}`}
                          >
                            <span className="flex-1 truncate text-left">Part {pi + 1}</span>
                            {isActivePart && <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[9px] font-semibold text-teal-700">aktif</span>}
                            {skipInPart > 0 && <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] text-white">{skipInPart}</span>}
                            <span className="text-[10px] font-medium text-slate-400 tabular-nums">{ansInPart}/{p.qs.length}</span>
                            <ChevronDown className={`h-3 w-3 shrink-0 text-slate-400 transition-transform ${isPartOpen ? "rotate-180" : ""}`} />
                          </button>
                          {isPartOpen && <div className="px-2 pb-2 pt-1.5">{qGrid(p.qs, p.si)}</div>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // 1 bagian → langsung grid nomor, tanpa label "Part".
                  <div className="px-2.5 pb-2.5 pt-0.5">{qGrid(g.parts[0].qs, g.parts[0].si)}</div>
                )
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded" style={{ background: TEAL }} />Terjawab</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded border border-red-300 bg-red-50" />Dilewati</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded border border-slate-300 bg-white" />Belum</span>
      </div>
    </>
  );

  return (
    <>
      {/* Panel mengambang — layar lebar (xl+) */}
      <aside className="fixed right-4 top-24 z-30 hidden max-h-[calc(100vh-7rem)] w-56 flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-lg xl:flex">
        {body}
      </aside>

      {/* Tombol mengambang — layar kecil/sedang */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white shadow-lg xl:hidden"
        style={{ background: TEAL }}
      >
        <ListChecks className="h-5 w-5" />
        {answeredCount}/{questions.length}
        {skippedCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px]">{skippedCount}</span>}
      </button>

      {/* Slide-over — layar kecil/sedang */}
      {open && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30 xl:hidden" onClick={() => setOpen(false)}>
          <div className="h-full w-72 max-w-[85vw] overflow-y-auto bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex justify-end">
              <button type="button" onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            {body}
          </div>
        </div>
      )}
    </>
  );
}

// ── Per-question input ──────────────────────────────────────────────────────
const TFNG = ["True", "False", "Not Given"];

function QuestionBlock({ index, q, state, onChange }: {
  index: number; q: Question; state: AnswerState; onChange: (p: Partial<AnswerState>) => void;
}) {
  const opts = q.type === "true_false_ng" ? TFNG : (q.options ?? []);
  return (
    <div id={`q-${q.id}`} className="scroll-mt-24 rounded-xl border border-slate-100 p-4 transition">
      {/* pre-line: prompt listening multi-speaker pakai \n per giliran bicara */}
      <p className="whitespace-pre-line text-sm font-medium text-slate-900"><span className="mr-1 text-slate-400">{index}.</span>{q.prompt}</p>

      {q.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={q.image_url}
          alt="Visual soal"
          className="mt-3 max-h-96 w-full rounded-lg border border-slate-200 object-contain bg-slate-50"
        />
      )}

      {(q.type === "multiple_choice" || q.type === "matching" || q.type === "true_false_ng") && (
        <div className="mt-3 space-y-2">
          {opts.map((opt, i) => (
            <label key={i} className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition ${state.selected_index === i ? "border-teal-400 bg-teal-50" : "border-slate-200 hover:bg-slate-50"}`}>
              <input type="radio" name={q.id} checked={state.selected_index === i} onChange={() => onChange({ selected_index: i })} className="accent-teal-600" />
              <span className="text-slate-700">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {(q.type === "fill_blank" || q.type === "short_answer") && (
        <input
          value={state.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Ketik jawabanmu…"
          className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
        />
      )}

      {q.type === "essay" && (
        <textarea
          value={state.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Tulis esai kamu di sini…"
          className="mt-3 min-h-[160px] w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
        />
      )}

      {q.type === "speaking_task" && (
        <SpeakingRecorder state={state} onChange={onChange} />
      )}
    </div>
  );
}

// ── Mic recorder (MediaRecorder) ────────────────────────────────────────────
function SpeakingRecorder({ state, onChange }: { state: AnswerState; onChange: (p: Partial<AnswerState>) => void }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [err, setErr] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  async function startRec() {
    setErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        onChange({ audioBlob: blob });
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setErr("Tidak bisa mengakses mikrofon. Izinkan akses mikrofon di browser.");
    }
  }

  function stopRec() {
    mediaRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="mb-3 text-xs text-slate-500">🎤 Rekam jawabanmu.</p>
      <div className="flex items-center gap-3">
        {recording ? (
          <button onClick={stopRec} className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white">
            <Square className="h-4 w-4" />Stop
          </button>
        ) : (
          <button onClick={startRec} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: TEAL }}>
            <Mic className="h-4 w-4" />{state.audioBlob ? "Rekam ulang" : "Mulai rekam"}
          </button>
        )}
        {recording && <span className="flex items-center gap-1.5 text-sm font-medium text-red-500"><span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />{mm}:{ss}</span>}
      </div>
      {previewUrl && !recording && <audio controls src={previewUrl} className="mt-3 w-full" />}
      {state.audioBlob && !recording && <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />Rekaman tersimpan</p>}
      {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
    </div>
  );
}

// ── Result ──────────────────────────────────────────────────────────────────
function ResultView({ sim, totals, results }: { sim: Simulation; totals: { score: number; max_score: number; auto_score: number; ai_score: number }; results: ResultItem[] }) {
  const pct = totals.max_score > 0 ? Math.round((totals.score / totals.max_score) * 100) : 0;
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white" style={{ background: TEAL_DEEP }}>
            <Trophy className="h-7 w-7" />
          </span>
          <h1 className="mt-3 text-xl font-bold text-slate-900">Simulasi selesai!</h1>
          <p className="text-sm text-slate-500">{sim.title}</p>
          <div className="mt-4 inline-flex items-baseline gap-1">
            <span className="text-4xl font-extrabold" style={{ color: TEAL_DEEP }}>{Math.round(totals.score)}</span>
            <span className="text-lg font-semibold text-slate-400">/ {Math.round(totals.max_score)}</span>
          </div>
          <p className="text-sm font-medium text-slate-600">{pct}% · objektif {Math.round(totals.auto_score)} + penilaian {Math.round(totals.ai_score)}</p>
        </div>

        <h2 className="mt-6 mb-3 text-sm font-bold text-slate-700">Rincian jawaban</h2>
        <ol className="space-y-3">
          {results.map((r, i) => (
            <li key={r.question.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-900"><span className="mr-1 text-slate-400">{i + 1}.</span>{r.question.prompt}</p>
              {r.question.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.question.image_url} alt="Visual soal" className="mt-2 max-h-72 w-full rounded-lg border border-slate-200 object-contain bg-slate-50" />
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">{SKILL_LABEL[r.skill as keyof typeof SKILL_LABEL] ?? r.skill}</span>
                {r.correct === true && <span className="inline-flex items-center gap-1 font-semibold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />Benar</span>}
                {r.correct === false && <span className="font-semibold text-red-500">Kurang tepat</span>}
                {r.ai_score != null && <span className="inline-flex items-center gap-1 font-semibold text-violet-600"><Sparkles className="h-3.5 w-3.5" />Skor {r.ai_score}/100</span>}
              </div>
              {r.correct === false && r.question.explanation && (
                <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">💡 {r.question.explanation}</p>
              )}
              {r.ai_feedback && (
                <p className="mt-2 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-700"><Sparkles className="mr-1 inline h-3 w-3" />{r.ai_feedback}</p>
              )}
            </li>
          ))}
        </ol>

        <div className="mt-6 flex gap-3">
          <Link href="/akun/simulasi" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600">
            <ArrowLeft className="h-4 w-4" />Simulasi lain
          </Link>
          <Link href="/akun" className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white" style={{ background: TEAL }}>
            Ke Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
