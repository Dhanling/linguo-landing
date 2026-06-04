"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  ArrowRight,
  X,
  ChevronRight,
  Check,
  Loader2,
  Lock,
  BookOpen,
  Headphones,
  HelpCircle,
  PartyPopper,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ListChecks,
  RotateCcw,
  Volume2,
  type LucideIcon,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// [linguo-patch:lms-lesson-frame-v1] immersive step-flow player (inner frame, no yellow outer)
const TEAL = "#16796E";
const YELLOW = "#F2CB05";

// [linguo-patch:lms-vocab-audio-v1] tombol play per-kata di kartu Kosakata (baca item.audio)
let _lpAudio: HTMLAudioElement | null = null;
function playWordAudio(url?: string | null) {
  if (!url || typeof window === "undefined") return;
  try {
    if (_lpAudio) {
      _lpAudio.pause();
      _lpAudio.currentTime = 0;
    }
    _lpAudio = new Audio(url);
    _lpAudio.play().catch(() => {});
  } catch {}
}

function stripBold(s: string) {
  return s.replace(/\*\*/g, "");
}
function renderMarkdown(md: string) {
  return md.split("\n").map((line: string, i: number) => {
    if (line.startsWith("## "))
      return (
        <h3 key={i} className="mt-4 text-lg font-extrabold text-slate-900">
          {line.slice(3)}
        </h3>
      );
    if (line.startsWith("- "))
      return (
        <li key={i} className="ml-5 list-disc text-[15px] leading-relaxed text-slate-700">
          {stripBold(line.slice(2))}
        </li>
      );
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return (
      <p key={i} className="text-[15px] leading-relaxed text-slate-700">
        {stripBold(line)}
      </p>
    );
  });
}

type Quiz = {
  id: string;
  type: string;
  prompt: string;
  options: string[];
  answer: string;
  sort_order: number;
};
type Block = {
  id: string;
  type: string;
  content: any;
  media_url: string | null;
  sort_order: number;
  lms_quiz_questions?: Quiz[];
};
type Step =
  | { kind: "audio" | "logic" | "vocab"; block: Block; label: string }
  | { kind: "quiz"; block: Block; q: Quiz; qIdx: number; qTotal: number; label: string }
  | { kind: "done"; label: string };

function Pill({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <span
      className="inline-flex h-8 items-center gap-2 rounded-full px-3 text-[12px] font-bold"
      style={{ background: "rgba(22,121,110,0.10)", color: TEAL }}
    >
      <Icon className="h-4 w-4" />
      {text}
    </span>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center px-6 text-center">
      {children}
    </div>
  );
}

export default function LessonPlayer({
  lessonId,
  onBack,
  onOpenLesson,
}: {
  lessonId: string;
  onBack: () => void;
  onOpenLesson: (id: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [lesson, setLesson] = useState<any>(null);
  const [mod, setMod] = useState<any>(null);
  const [locked, setLocked] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showText, setShowText] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  // [linguo-patch:lms-lesson-sidenav-v1] index sesi di kiri
  const [navOpen, setNavOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [siblings, setSiblings] = useState<{ id: string; title: string; sort_order: number }[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, string>>({});
  // [linguo-patch:lms-lesson-switch-v1] bedain first-boot (full-screen spinner) vs switch sesi (spinner di stage doang)
  const bootedRef = useRef(false);

  useEffect(() => {
    // [linguo-patch:lms-lesson-switch-v1] cancellation guard: fetch sesi lama jangan nimpa state sesi baru kalau user klik cepet
    let cancelled = false;
    (async () => {
      setLoading(true);
      setStepIdx(0);
      setAnswers({});
      setShowText({});
      setDrawerOpen(false);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        setUser(user);
        if (!user || !lessonId) return;

        const { data: les } = await supabase
          .from("lms_lessons")
          .select("id,title,est_minutes,is_preview,module_id,sort_order")
          .eq("id", lessonId)
          .maybeSingle();
        if (cancelled) return;
        if (!les) {
          setLesson(null);
          return;
        }
        setLesson(les);

        const { data: m } = await supabase
          .from("lms_modules")
          .select("id,title,cefr_label,course_id,language")
          .eq("id", les.module_id)
          .maybeSingle();
        if (cancelled) return;
        setMod(m);

        let ent = false;
        if (m?.course_id) {
          try {
            const { data: e } = await supabase.rpc("lms_is_entitled", {
              p_course_id: m.course_id,
            });
            ent = !!e;
          } catch {}
        }
        if (cancelled) return;
        const isLocked = !les.is_preview && !ent;
        setLocked(isLocked);

        if (!isLocked) {
          const { data: blks } = await supabase
            .from("lms_blocks")
            .select(
              "id,type,content,media_url,sort_order, lms_quiz_questions(id,type,prompt,options,answer,sort_order)"
            )
            .eq("lesson_id", les.id)
            .order("sort_order");
          if (cancelled) return;
          const blocks = (blks || []) as Block[];

          // tiap block -> 1 step. quiz dipecah per-soal.
          const st: Step[] = [];
          blocks.forEach((b) => {
            if (b.type === "quiz") {
              const qs = (b.lms_quiz_questions || [])
                .slice()
                .sort((a, c) => a.sort_order - c.sort_order);
              qs.forEach((q, i) =>
                st.push({
                  kind: "quiz",
                  block: b,
                  q,
                  qIdx: i,
                  qTotal: qs.length,
                  label: `Kuis ${i + 1}`,
                })
              );
            } else if (b.type === "audio") st.push({ kind: "audio", block: b, label: "Audio" });
            else if (b.type === "logic") st.push({ kind: "logic", block: b, label: "Materi" });
            else if (b.type === "vocab") st.push({ kind: "vocab", block: b, label: "Kosakata" });
            else st.push({ kind: "logic", block: b, label: "Materi" });
          });
          // [linguo-patch:lms-lesson-frame-v2] sesi tanpa konten = jangan auto-selesai (cegah confetti palsu)
          if (st.length > 0) {
            st.push({ kind: "done", label: "Selesai" });
            setSteps(st);
          } else {
            setSteps([]);
          }
        } else {
          setSteps([]);
        }

        // [linguo-patch:lms-lesson-sidenav-v1] daftar sesi tetangga (1 modul) + progress batch
        const { data: sibs } = await supabase
          .from("lms_lessons")
          .select("id,title,sort_order")
          .eq("module_id", les.module_id)
          .order("sort_order");
        if (cancelled) return;
        const sibList = ((sibs as any[] | null) || []) as {
          id: string;
          title: string;
          sort_order: number;
        }[];
        setSiblings(sibList);

        const pm: Record<string, string> = {};
        const sibIds = sibList.map((s) => s.id);
        if (sibIds.length) {
          const { data: progs } = await supabase
            .from("lms_progress")
            .select("lesson_id,status")
            .eq("user_id", user.id)
            .in("lesson_id", sibIds);
          if (cancelled) return;
          (progs as any[] | null)?.forEach((p) => {
            if (p?.lesson_id) pm[p.lesson_id] = p.status;
          });
        }
        setProgressMap(pm);
        setCompleted(pm[les.id] === "completed");
      } finally {
        // [linguo-patch:lms-lesson-switch-v1] selalu matiin loading + tandai udah pernah boot (kecuali fetch ke-cancel)
        if (!cancelled) {
          setLoading(false);
          bootedRef.current = true;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  function answerQuiz(q: Quiz, choice: string) {
    if (answers[q.id]) return;
    setAnswers((p) => ({ ...p, [q.id]: choice }));
    if (user) {
      supabase.from("lms_quiz_attempts").insert({
        user_id: user.id,
        question_id: q.id,
        response: choice,
        is_correct: choice === q.answer,
      });
    }
  }

  async function markComplete() {
    if (!user || !lesson || completed || saving) return;
    setSaving(true);
    const { error } = await supabase.from("lms_progress").upsert(
      {
        user_id: user.id,
        lesson_id: lesson.id,
        status: "completed",
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" }
    );
    setSaving(false);
    if (!error) {
      setCompleted(true);
      // [linguo-patch:lms-lesson-sidenav-v1] tandai selesai di index sisi kiri
      setProgressMap((p) => ({ ...p, [lesson.id]: "completed" }));
    }
  }

  const cur = steps[stepIdx];
  const isQuizStep = cur?.kind === "quiz";
  const quizAnswered = isQuizStep ? !!answers[(cur as any).q.id] : true;
  const atDone = cur?.kind === "done";

  // [linguo-patch:lms-lesson-sidenav-v1] sesi berikutnya + toggle panel index
  const curIdx = siblings.findIndex((s) => s.id === lessonId);
  const nextLesson = curIdx >= 0 ? siblings[curIdx + 1] : undefined;
  const toggleNav = () => {
    if (typeof window !== "undefined" && window.matchMedia("(min-width:1024px)").matches) {
      setNavOpen((o) => !o);
    } else {
      setDrawerOpen((o) => !o);
    }
  };

  // auto-simpan progress pas masuk step Selesai
  useEffect(() => {
    if (atDone) markComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atDone]);

  const next = () => setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  const prev = () => setStepIdx((i) => Math.max(i - 1, 0));

  // ---------- guard states ----------
  // [linguo-patch:lms-lesson-switch-v1] full-screen spinner CUMA pas boot pertama; switch sesi pakai spinner di stage (sidebar tetap render)
  if (loading && !bootedRef.current) {
    return (
      <Centered>
        <Loader2 className="h-7 w-7 animate-spin text-slate-300" />
      </Centered>
    );
  }
  if (!user) {
    return (
      <Centered>
        <p className="text-slate-700">Kamu perlu masuk dulu untuk belajar.</p>
        <a
          href="/akun"
          className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          style={{ background: TEAL }}
        >
          Masuk ke akun
        </a>
      </Centered>
    );
  }
  if (!lesson) {
    return (
      <Centered>
        <p className="text-slate-500">Sesi tidak ditemukan.</p>
        <button onClick={onBack} className="mt-4 text-sm font-semibold" style={{ color: TEAL }}>
          ← Kembali
        </button>
      </Centered>
    );
  }
  if (locked) {
    return (
      <Centered>
        <Lock className="h-8 w-8 text-slate-300" />
        <h1 className="mt-3 text-lg font-bold text-slate-900">{lesson.title}</h1>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          Sesi ini terkunci. Aktifkan akses paket untuk membuka seluruh materi.
        </p>
        <a
          href="/akun"
          className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          style={{ background: TEAL }}
        >
          Lihat akses
        </a>
      </Centered>
    );
  }

  // [linguo-patch:lms-lesson-switch-v1] placeholder "belum ada konten" & spinner switch dipindah ke dalam STAGE (sidebar tetap render)
  const switching = loading; // booted=true di sini, jadi ini pasti switch (bukan first boot)
  const emptyContent = !switching && steps.length === 0;
  // judul instan dari siblings (ga nunggu fetch) — fallback ke lesson.title
  const curTitle = siblings.find((s) => s.id === lessonId)?.title || lesson.title;

  // ---------- main frame (inner) ----------
  return (
    <div className="flex min-h-full lg:h-full lg:min-h-0">
      <style>{`
        @keyframes lp-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
        @keyframes lp-fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes lp-fall{to{transform:translateY(560px) rotate(540deg);opacity:.9}}
        .lp-pop{animation:lp-pop .5s cubic-bezier(.2,.8,.2,1) both}
        .lp-fade{animation:lp-fade .35s ease both}
        .lp-confetti{position:absolute;width:9px;height:14px;border-radius:2px;top:-20px;animation:lp-fall linear forwards}
      `}</style>

      {/* [linguo-patch:lms-lesson-sidenav-v1] LEFT INDEX (desktop) */}
      <aside
        className={`hidden shrink-0 overflow-hidden border-r border-slate-100 transition-[width] duration-200 lg:flex lg:flex-col ${
          navOpen ? "lg:w-72" : "lg:w-0"
        }`}
      >
        <SessionIndex
          siblings={siblings}
          currentId={lessonId}
          progressMap={progressMap}
          modTitle={mod?.title || "Materi"}
          cefr={mod?.cefr_label || "A1"}
          onOpen={onOpenLesson}
          onCollapse={() => setNavOpen(false)}
        />
      </aside>

      {/* MAIN COLUMN */}
      <div className="flex min-h-full flex-1 flex-col lg:h-full lg:min-h-0 lg:overflow-hidden">
        {/* TOP BAR */}
        <header className="flex items-center gap-4 border-b border-slate-100 px-5 pb-4 pt-5 lg:px-8 lg:pt-6">
        <button
          onClick={toggleNav}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5F6F8] transition hover:bg-slate-100"
          title="Daftar sesi"
          aria-label="Tampilkan daftar sesi"
        >
          <ListChecks className="h-5 w-5 text-slate-700" />
        </button>
        <button
          onClick={onBack}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5F6F8] transition hover:bg-slate-100"
          title="Kembali"
        >
          <ArrowLeft className="h-5 w-5 text-slate-700" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-[11px] font-bold text-slate-400">
            <span className="inline-flex items-center gap-1.5" style={{ color: TEAL }}>
              <span
                className="inline-flex h-5 items-center justify-center rounded-md px-1 text-[10px] font-extrabold"
                style={{ background: "rgba(22,121,110,0.10)" }}
              >
                {mod?.cefr_label || "A1"}
              </span>
              {mod?.title || "Materi"}
            </span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-700">Sesi belajar</span>
          </p>
          <h1 className="mt-0.5 truncate text-[19px] font-extrabold leading-tight text-slate-900">
            {curTitle}
          </h1>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <span
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-bold"
            style={{ background: "rgba(242,203,5,0.16)", color: "#B9890A" }}
          >
            ★ +20 XP
          </span>
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-[#F5F6F8] hover:text-slate-700"
            title="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* STEPPER */}
      {!switching && !emptyContent && (
      <div className="bg-[#F5F6F8]/60 px-5 py-4 lg:px-8">
        <div className="mx-auto flex max-w-[760px] items-center gap-2">
          {steps.map((s, i) => {
            const done = i < stepIdx;
            const active = i === stepIdx;
            return (
              <div
                key={i}
                className={`flex items-center gap-2 ${i < steps.length - 1 ? "flex-1" : ""}`}
              >
                <button
                  onClick={() => {
                    if (i <= stepIdx) setStepIdx(i);
                  }}
                  disabled={i > stepIdx}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold transition"
                  style={
                    active
                      ? { background: TEAL, color: "#fff", boxShadow: "0 0 0 4px rgba(22,121,110,.15)" }
                      : done
                      ? { background: "rgba(22,121,110,.15)", color: TEAL }
                      : { background: "#F5F6F8", color: "#94a3b8" }
                  }
                  title={s.label}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </button>
                {i < steps.length - 1 && (
                  <span
                    className="h-1.5 flex-1 rounded-full"
                    style={{ background: i < stepIdx ? TEAL : "#E8EAEE" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* STAGE */}
      <main className="flex-1 px-5 py-7 lg:min-h-0 lg:overflow-y-auto lg:px-10">
        {switching ? (
          // [linguo-patch:lms-lesson-switch-v1] spinner di stage doang pas ganti sesi — sidebar & top bar tetap render
          <Centered>
            <Loader2 className="h-7 w-7 animate-spin text-slate-300" />
          </Centered>
        ) : emptyContent ? (
          // [linguo-patch:lms-lesson-frame-v2] sesi belum ada konten — placeholder di dalam frame (sidebar tetap kelihatan)
          <Centered>
            <BookOpen className="h-8 w-8 text-slate-300" />
            <h1 className="mt-3 text-lg font-bold text-slate-900">{curTitle}</h1>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Materi sesi ini belum tersedia — lagi disiapkan ya.
            </p>
            {nextLesson && (
              <button
                onClick={() => onOpenLesson(nextLesson.id)}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold text-white"
                style={{ background: TEAL }}
              >
                Sesi berikutnya <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </Centered>
        ) : (
          <StepView
            key={stepIdx}
            step={cur}
            lesson={lesson}
            steps={steps}
            answers={answers}
            showText={showText}
            onAnswer={answerQuiz}
            onToggleText={(id) => setShowText((p) => ({ ...p, [id]: true }))}
            onBack={onBack}
            onRestart={() => setStepIdx(0)}
            nextLesson={nextLesson}
            onOpenLesson={onOpenLesson}
          />
        )}
      </main>

      {/* FOOTER */}
      {!atDone && !switching && !emptyContent && (
        <footer className="flex items-center justify-between gap-4 border-t border-slate-100 px-5 py-4 lg:px-8">
          <button
            onClick={prev}
            disabled={stepIdx === 0}
            className="inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-[13px] font-bold text-slate-500 transition hover:bg-[#F5F6F8] hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" /> Sebelumnya
          </button>
          <div className="hidden text-[12px] font-semibold text-slate-400 sm:block">
            {isQuizStep && !quizAnswered
              ? "Pilih satu jawaban dulu"
              : `Langkah ${stepIdx + 1} dari ${steps.length}`}
          </div>
          <button
            onClick={next}
            disabled={isQuizStep && !quizAnswered}
            className="inline-flex h-11 items-center gap-2 rounded-2xl px-6 text-[14px] font-extrabold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: TEAL, boxShadow: "0 14px 30px -14px rgba(22,121,110,.9)" }}
          >
            {stepIdx === steps.length - 2 ? "Selesaikan" : "Lanjut"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </footer>
      )}
      </div>

      {/* [linguo-patch:lms-lesson-sidenav-v1] MOBILE DRAWER */}
      {drawerOpen ? (
        <div
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-[60] flex bg-[#12172B]/40 backdrop-blur-sm lg:hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="h-full max-w-[82%] bg-white shadow-[0_24px_60px_-20px_rgba(18,23,43,0.5)]"
          >
            <SessionIndex
              siblings={siblings}
              currentId={lessonId}
              progressMap={progressMap}
              modTitle={mod?.title || "Materi"}
              cefr={mod?.cefr_label || "A1"}
              onOpen={onOpenLesson}
              onCollapse={() => setDrawerOpen(false)}
              isDrawer
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ============== STEP CONTENT ============== */
function StepView({
  step,
  lesson,
  steps,
  answers,
  showText,
  onAnswer,
  onToggleText,
  onBack,
  onRestart,
  nextLesson,
  onOpenLesson,
}: {
  step: Step | undefined;
  lesson: any;
  steps: Step[];
  answers: Record<string, string>;
  showText: Record<string, boolean>;
  onAnswer: (q: Quiz, choice: string) => void;
  onToggleText: (id: string) => void;
  onBack: () => void;
  onRestart: () => void;
  nextLesson?: { id: string; title: string };
  onOpenLesson: (id: string) => void;
}) {
  if (!step) return null;

  if (step.kind === "audio") {
    const b = step.block;
    return (
      <div className="lp-fade mx-auto max-w-[860px]">
        <Pill icon={Headphones} text="Audio · Dengarkan" />
        <h2 className="mt-3 text-[24px] font-extrabold leading-tight text-slate-900">
          {lesson.title}
        </h2>
        {b.content?.instruction ? (
          <p className="mt-2 max-w-[680px] text-[14px] font-medium leading-relaxed text-slate-500">
            {b.content.instruction}
          </p>
        ) : null}
        <div className="mt-6 rounded-3xl border border-slate-100 bg-[#F5F6F8] p-5">
          {b.media_url ? (
            <audio controls src={b.media_url} className="w-full" />
          ) : (
            <p className="text-sm text-slate-400">Audio belum tersedia untuk sesi ini.</p>
          )}
          {!showText[b.id] ? (
            <button
              onClick={() => onToggleText(b.id)}
              className="mt-3 text-sm font-semibold underline"
              style={{ color: TEAL }}
            >
              Tampilkan teks
            </button>
          ) : (
            <div className="mt-3 rounded-2xl border border-slate-100 bg-white p-4">
              <div className="text-lg font-bold text-slate-900">{b.content?.transcript}</div>
              <div className="text-sm text-slate-500">{b.content?.gloss}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step.kind === "logic") {
    const b = step.block;
    return (
      <div className="lp-fade mx-auto max-w-[860px]">
        <Pill icon={BookOpen} text="Materi" />
        <div className="mt-4 space-y-1">{renderMarkdown(b.content?.markdown || "")}</div>
      </div>
    );
  }

  if (step.kind === "vocab") {
    const b = step.block;
    const items: any[] = b.content?.items || [];
    return (
      <div className="lp-fade mx-auto max-w-[860px]">
        <Pill icon={ListChecks} text="Kosakata" />
        <h2 className="mt-3 text-[24px] font-extrabold leading-tight text-slate-900">
          Kosakata baru
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {items.map((it: any, i: number) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4"
            >
              <div className="min-w-0">
                <div className="text-[18px] font-extrabold text-slate-900">{it.vi}</div>
                <div className="text-sm text-slate-500">{it.id}</div>
              </div>
              {it.audio ? (
                <button
                  onClick={() => playWordAudio(it.audio)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition hover:opacity-90 active:scale-95"
                  style={{ background: TEAL }}
                  title="Putar audio"
                  aria-label={`Putar audio ${it.vi}`}
                >
                  <Volume2 className="h-5 w-5" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step.kind === "quiz") {
    const q = step.q;
    const ans = answers[q.id];
    const answered = ans != null;
    const correct = ans === q.answer;
    return (
      <div className="lp-fade mx-auto max-w-[720px]">
        <Pill icon={HelpCircle} text={`Kuis · Soal ${step.qIdx + 1} dari ${step.qTotal}`} />
        <h2 className="mt-3 text-[22px] font-extrabold leading-tight text-slate-900">{q.prompt}</h2>
        {step.block.content?.instruction ? (
          <p className="mt-1.5 text-[13px] font-medium text-slate-500">
            {step.block.content.instruction}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3">
          {(q.options || []).map((opt: string, i: number) => {
            const isChosen = ans === opt;
            const isCorrect = opt === q.answer;
            let st: any = { borderColor: "#e2e8f0", background: "#fff" };
            let textCls = "text-slate-800";
            if (answered) {
              if (isCorrect) {
                st = { borderColor: "#16A34A", background: "#F0FDF4" };
                textCls = "text-emerald-700";
              } else if (isChosen) {
                st = { borderColor: "#E11D48", background: "#FFF1F3" };
                textCls = "text-rose-700";
              } else {
                textCls = "text-slate-400";
              }
            }
            return (
              <button
                key={opt}
                disabled={answered}
                onClick={() => onAnswer(q, opt)}
                className={`flex h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 text-left transition ${textCls} ${
                  answered ? "cursor-default" : "hover:border-[#16796E] hover:bg-[#F0FAF8]"
                }`}
                style={st}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F5F6F8] text-[12px] font-extrabold text-slate-500">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-[14px] font-bold">{opt}</span>
                {answered && isCorrect && (
                  <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-600" />
                )}
                {answered && isChosen && !isCorrect && (
                  <XCircle className="ml-auto h-5 w-5 text-rose-500" />
                )}
              </button>
            );
          })}
        </div>

        {answered && (
          <div
            className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 ${
              correct ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                correct ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-500"
              }`}
            >
              {correct ? <Check className="h-5 w-5" /> : <Lightbulb className="h-5 w-5" />}
            </span>
            <div>
              <p
                className={`text-[13px] font-extrabold ${
                  correct ? "text-emerald-700" : "text-rose-600"
                }`}
              >
                {correct ? "Benar!" : "Hampir!"}
              </p>
              <p className="mt-0.5 text-[13px] font-semibold leading-relaxed text-slate-600">
                {correct ? "Mantap, jawaban kamu tepat." : `Jawaban yang benar: ${q.answer}.`}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // done
  const quizSteps = steps.filter((s) => s.kind === "quiz") as Extract<Step, { kind: "quiz" }>[];
  const correctCount = quizSteps.reduce(
    (n, s) => n + (answers[s.q.id] === s.q.answer ? 1 : 0),
    0
  );
  const total = quizSteps.length;
  return (
    <div className="lp-fade relative mx-auto max-w-[640px] text-center">
      <div className="pointer-events-none absolute inset-x-0 top-0">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="lp-confetti"
            style={{
              left: `${(i * 5.5) % 100}%`,
              background: [TEAL, YELLOW, "#34d399", "#f472b6"][i % 4],
              animationDuration: `${1.6 + (i % 5) * 0.25}s`,
              animationDelay: `${(i % 6) * 0.08}s`,
            }}
          />
        ))}
      </div>
      <div
        className="lp-pop mx-auto flex h-24 w-24 items-center justify-center rounded-3xl text-white"
        style={{ background: TEAL, boxShadow: "0 24px 50px -20px rgba(22,121,110,.8)" }}
      >
        <PartyPopper className="h-12 w-12" />
      </div>
      <h2 className="mt-6 text-[26px] font-extrabold leading-tight text-slate-900">
        Sesi selesai! 🎉
      </h2>
      <p className="mx-auto mt-2 max-w-[440px] text-[14px] font-medium leading-relaxed text-slate-500">
        {lesson.title} kelar. Progress kamu udah kesimpan — lanjut ke sesi berikutnya kapan aja.
      </p>
      {total > 0 && (
        <div
          className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold"
          style={{ background: "rgba(22,121,110,.10)", color: TEAL }}
        >
          <CheckCircle2 className="h-4 w-4" /> Skor kuis: {correctCount}/{total}
        </div>
      )}
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {nextLesson ? (
          <button
            onClick={() => onOpenLesson(nextLesson.id)}
            className="inline-flex h-12 items-center gap-2 rounded-2xl px-6 text-[14px] font-extrabold text-white"
            style={{ background: TEAL, boxShadow: "0 14px 30px -14px rgba(22,121,110,.9)" }}
          >
            Sesi berikutnya <ArrowRight className="h-4 w-4" />
          </button>
        ) : null}
        <button
          onClick={onBack}
          className={
            nextLesson
              ? "inline-flex h-12 items-center gap-2 rounded-2xl px-6 text-[14px] font-bold text-slate-600 transition hover:bg-[#F5F6F8]"
              : "inline-flex h-12 items-center gap-2 rounded-2xl px-6 text-[14px] font-extrabold text-white"
          }
          style={nextLesson ? undefined : { background: TEAL }}
        >
          Kembali ke materi
        </button>
        <button
          onClick={onRestart}
          className="inline-flex h-12 items-center gap-2 rounded-2xl px-6 text-[14px] font-bold text-slate-600 transition hover:bg-[#F5F6F8]"
        >
          <RotateCcw className="h-4 w-4" /> Ulangi sesi
        </button>
      </div>
    </div>
  );
}
/* ============== SESSION INDEX (sidebar) ============== */
// [linguo-patch:lms-lesson-sidenav-v1] daftar sesi 1 modul, klik buat lompat tanpa back
function SessionIndex({
  siblings,
  currentId,
  progressMap,
  modTitle,
  cefr,
  onOpen,
  onCollapse,
  isDrawer = false,
}: {
  siblings: { id: string; title: string; sort_order: number }[];
  currentId: string;
  progressMap: Record<string, string>;
  modTitle: string;
  cefr: string;
  onOpen: (id: string) => void;
  onCollapse: () => void;
  isDrawer?: boolean;
}) {
  return (
    <div className="flex h-full w-72 flex-col bg-white">
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {cefr} · Daftar sesi
          </p>
          <p className="mt-0.5 truncate text-[13px] font-extrabold text-slate-900">{modTitle}</p>
        </div>
        <button
          onClick={onCollapse}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          title={isDrawer ? "Tutup" : "Sembunyikan"}
          aria-label={isDrawer ? "Tutup daftar sesi" : "Sembunyikan daftar sesi"}
        >
          {isDrawer ? <X className="h-5 w-5" /> : <ArrowLeft className="h-4 w-4" />}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {siblings.length === 0 ? (
          <p className="px-3 py-4 text-[12px] font-medium text-slate-400">Belum ada sesi.</p>
        ) : (
          siblings.map((s, i) => {
            const isCurrent = s.id === currentId;
            const done = progressMap[s.id] === "completed";
            return (
              <button
                key={s.id}
                onClick={() => onOpen(s.id)}
                className={`mb-1 flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
                  isCurrent ? "bg-[#16796E]/10" : "hover:bg-[#F5F6F8]"
                }`}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold"
                  style={
                    isCurrent
                      ? { background: TEAL, color: "#fff" }
                      : done
                      ? { background: "rgba(22,121,110,.15)", color: TEAL }
                      : { background: "#F5F6F8", color: "#94a3b8" }
                  }
                >
                  {done && !isCurrent ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span
                  className={`min-w-0 flex-1 truncate text-[12.5px] font-bold ${
                    isCurrent ? "text-[#0F5A52]" : "text-slate-700"
                  }`}
                >
                  {s.title}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
