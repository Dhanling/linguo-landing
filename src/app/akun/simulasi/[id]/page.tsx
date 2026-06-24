"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  fetchSimulation, getStudentInfo, createAttempt, uploadRecording,
  gradeObjective, gradeWithAI, saveAnswers, finalizeAttempt,
  AUTO_GRADED, SKILL_LABEL, TEST_TYPE_LABEL,
  type Simulation, type Section, type Question, type AnswerPayload, type StudentInfo,
} from "@/lib/simulations";
import {
  ArrowLeft, ArrowRight, BookOpen, Headphones, PenLine, Mic, Square,
  Loader2, CheckCircle2, Trophy, Sparkles, ListChecks, AlertCircle, ClipboardCheck,
  Clock,
} from "lucide-react";

const TEAL = "#1A9E9E";
const TEAL_DEEP = "#0F6E56";
const YELLOW = "#FFC93C";

const SKILL_ICON: Record<string, any> = { reading: BookOpen, listening: Headphones, writing: PenLine, speaking: Mic };

type AnswerState = { selected_index: number | null; text: string; audioBlob: Blob | null; audioUrl: string | null };
type Phase = "loading" | "intro" | "running" | "grading" | "result" | "noauth" | "notfound";
type ResultItem = { question: Question; skill: string; correct: boolean | null; points: number; ai_score: number | null; ai_feedback: string | null };

export default function SimulasiRunnerPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [phase, setPhase] = useState<Phase>("loading");
  const [sim, setSim] = useState<Simulation | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [info, setInfo] = useState<StudentInfo | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [secIdx, setSecIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [results, setResults] = useState<ResultItem[]>([]);
  const [totals, setTotals] = useState({ score: 0, max_score: 0, auto_score: 0, ai_score: 0 });
  const [gradingMsg, setGradingMsg] = useState("");
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    (async () => {
      const studentInfo = await getStudentInfo();
      if (!studentInfo) { setPhase("noauth"); return; }
      setInfo(studentInfo);
      const { simulation, sections: secs, questions: qs } = await fetchSimulation(id);
      if (!simulation) { setPhase("notfound"); return; }
      setSim(simulation); setSections(secs); setQuestions(qs);
      const init: Record<string, AnswerState> = {};
      qs.forEach((q) => { init[q.id] = { selected_index: null, text: "", audioBlob: null, audioUrl: null }; });
      setAnswers(init);
      setPhase("intro");
    })();
  }, [id]);

  const setAns = (qid: string, patch: Partial<AnswerState>) =>
    setAnswers((p) => ({ ...p, [qid]: { ...p[qid], ...patch } }));

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
    const aid = await createAttempt(sim.id, info);
    if (!aid) { alert("Gagal memulai simulasi. Coba lagi."); return; }
    setAttemptId(aid);
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
      if (secs <= 0) submit();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, deadline]);

  async function submit() {
    if (!sim || !attemptId) return;
    if (submittingRef.current) return;
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
      } else {
        // Writing / Speaking → AI
        aiDone++;
        setGradingMsg(`Menilai jawaban ${q.type === "speaking_task" ? "speaking" : "writing"} (${aiDone}/${aiCount}) dengan AI…`);
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

    await saveAnswers(attemptId, payloads);
    const score = autoScore + aiScore;
    const t = { score, max_score: maxScore, auto_score: autoScore, ai_score: aiScore };
    await finalizeAttempt(attemptId, t);
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
        <p className="mt-2 text-sm text-slate-600">Simulasi tidak ditemukan atau belum dipublikasikan.</p>
        <Link href="/akun/simulasi" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700">
          <ArrowLeft className="h-4 w-4" />Kembali ke daftar
        </Link>
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

  // intro
  if (phase === "intro") return (
    <Shell sim={sim}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">{sim.title}</h2>
        {sim.description && <p className="mt-1 text-sm text-slate-600">{sim.description}</p>}
        <div className="mt-4 grid gap-2 text-sm text-slate-600">
          <div className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-teal-600" />{questions.length} soal dalam {sections.length} bagian</div>
          {sim.duration_minutes > 0 && <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-teal-600" />Batas waktu {sim.duration_minutes} menit — otomatis dikumpulkan saat habis</div>}
          <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-600" />Writing &amp; Speaking dinilai otomatis oleh AI</div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {sections.map((s) => {
            const Icon = SKILL_ICON[s.skill];
            return (
              <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                <Icon className="h-3.5 w-3.5" />{s.title}
              </span>
            );
          })}
        </div>
        <button onClick={start} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white sm:w-auto sm:px-8" style={{ background: TEAL }}>
          Mulai Simulasi <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </Shell>
  );

  // running
  const section = sections[secIdx];
  const secQs = questions.filter((q) => q.section_id === section.id);
  const isLast = secIdx === sections.length - 1;
  const SkillIcon = SKILL_ICON[section.skill];

  return (
    <Shell sim={sim} headerRight={remaining != null ? <TimerPill seconds={remaining} /> : undefined}>
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
        onJump={goToQuestion}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal-700">
          <SkillIcon className="h-4 w-4" />{SKILL_LABEL[section.skill]} · Bagian {secIdx + 1}/{sections.length}
        </div>
        <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
        {section.instructions && <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{section.instructions}</p>}

        {section.audio_url && (
          <audio controls src={section.audio_url} className="mt-3 w-full" />
        )}
        {section.passage && (
          <div className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
            {section.passage}
          </div>
        )}

        <div className="mt-5 space-y-5">
          {secQs.map((q, i) => (
            <QuestionBlock key={q.id} index={i + 1} q={q} state={answers[q.id]} onChange={(p) => setAns(q.id, p)} />
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
            <button onClick={submit} className="inline-flex items-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-bold text-white" style={{ background: TEAL_DEEP }}>
              <CheckCircle2 className="h-4 w-4" />Selesai &amp; Kirim
            </button>
          ) : (
            <button onClick={() => setSecIdx((i) => i + 1)} className="inline-flex items-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-bold text-white" style={{ background: TEAL }}>
              Lanjut <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </Shell>
  );
}

// ── Layout helpers ────────────────────────────────────────────────────────────
function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">{children}</div>;
}

function Shell({ sim, children, headerRight }: { sim: Simulation; children: React.ReactNode; headerRight?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3.5 sm:px-6">
          <Link href="/akun/simulasi" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: TEAL_DEEP }}>
            <ClipboardCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">{sim.title}</p>
            <p className="text-xs text-slate-500">{TEST_TYPE_LABEL[sim.test_type]}</p>
          </div>
          {headerRight}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">{children}</main>
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

// ── Navigasi soal: blok nomor + status terjawab/belum ───────────────────────
function QuestionNavigator({ sections, questions, answers, currentSecIdx, onJump }: {
  sections: Section[]; questions: Question[]; answers: Record<string, AnswerState>;
  currentSecIdx: number; onJump: (secIdx: number, qid: string) => void;
}) {
  const answeredCount = questions.filter((q) => isAnswered(q, answers[q.id])).length;
  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <ListChecks className="h-4 w-4 text-teal-600" />Navigasi Soal
        </p>
        <span className="text-xs font-medium text-slate-500">{answeredCount}/{questions.length} terjawab</span>
      </div>

      <div className="space-y-3">
        {sections.map((s, si) => {
          const secQs = questions.filter((q) => q.section_id === s.id);
          if (secQs.length === 0) return null;
          const Icon = SKILL_ICON[s.skill];
          return (
            <div key={s.id}>
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Icon className="h-3.5 w-3.5" />{SKILL_LABEL[s.skill]}
                {si === currentSecIdx && (
                  <span className="rounded-full bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700">sedang dikerjakan</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {secQs.map((q, qi) => {
                  const answered = isAnswered(q, answers[q.id]);
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => onJump(si, q.id)}
                      title={`Soal ${qi + 1} · ${answered ? "sudah dijawab" : "belum dijawab"}`}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold tabular-nums transition ${
                        answered
                          ? "text-white"
                          : "border border-slate-300 bg-white text-slate-600 hover:border-teal-400 hover:text-teal-700"
                      }`}
                      style={answered ? { background: TEAL } : undefined}
                    >
                      {qi + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded" style={{ background: TEAL }} />Terjawab
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded border border-slate-300 bg-white" />Belum
        </span>
      </div>
    </div>
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
      <p className="text-sm font-medium text-slate-900"><span className="mr-1 text-slate-400">{index}.</span>{q.prompt}</p>

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
          placeholder="Tulis esai kamu di sini… (akan dinilai AI)"
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
      <p className="mb-3 text-xs text-slate-500">🎤 Rekam jawabanmu. Hasil rekaman ditranskrip &amp; dinilai AI.</p>
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
          <p className="text-sm font-medium text-slate-600">{pct}% · objektif {Math.round(totals.auto_score)} + AI {Math.round(totals.ai_score)}</p>
        </div>

        <h2 className="mt-6 mb-3 text-sm font-bold text-slate-700">Rincian jawaban</h2>
        <ol className="space-y-3">
          {results.map((r, i) => (
            <li key={r.question.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-900"><span className="mr-1 text-slate-400">{i + 1}.</span>{r.question.prompt}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">{SKILL_LABEL[r.skill as keyof typeof SKILL_LABEL] ?? r.skill}</span>
                {r.correct === true && <span className="inline-flex items-center gap-1 font-semibold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />Benar</span>}
                {r.correct === false && <span className="font-semibold text-red-500">Kurang tepat</span>}
                {r.ai_score != null && <span className="inline-flex items-center gap-1 font-semibold text-violet-600"><Sparkles className="h-3.5 w-3.5" />Skor AI {r.ai_score}/100</span>}
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
