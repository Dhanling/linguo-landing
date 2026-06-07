"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  ArrowRight,
  X,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
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
  VolumeX,
  Sparkles,
  Target,
  Bird,
  LayoutGrid,
  CalendarDays,
  Star,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import UnlockFullAccess from "./UnlockFullAccess";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// [linguo-patch:lms-lesson-frame-v1] immersive step-flow player (inner frame, no yellow outer)
const TEAL = "#16796E";
const YELLOW = "#F2CB05";

// [linguo-patch:lms-rail-group-v1] pisah Materi vs Kuis di rail langkah (grouping otomatis per grup tipe)
const KUIS = "#C2410C"; // orange-700, beda jelas dari teal materi
function hexA(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
// step.kind -> grup rail: quiz=Kuis, done=Selesai, sisanya (logic/vocab/audio)=Materi
function railGroupKey(kind: string) {
  return kind === "quiz" ? "kuis" : kind === "done" ? "done" : "materi";
}
const RAIL_GROUP_META: Record<
  string,
  { label: string; color: string }
> = {
  materi: { label: "Materi", color: TEAL },
  kuis: { label: "Kuis", color: KUIS },
  done: { label: "Selesai", color: "#0F5A52" },
};

// [linguo-patch:lms-a1-free-v1] semua level A1 (A1.1, A1.2, dst) gratis; gembok cuma A2-B2
function isFreeLevel(cefrLabel?: string | null) {
  return (cefrLabel || "").toUpperCase().startsWith("A1");
}

// [linguo-patch:lms-level-tree-v1] major level dari cefr_label: "A1.2" -> "A1"
function majorOf(cefrLabel?: string | null) {
  return (cefrLabel || "").toUpperCase().split(".")[0];
}

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

// [linguo-patch:lms-stage-redesign-v1] inline **bold** → <strong> (frame pakai bold buat penekanan)
function inlineBold(text: string): ReactNode[] {
  return text.split("**").map((seg, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-extrabold text-slate-900">
        {seg}
      </strong>
    ) : (
      <span key={i}>{seg}</span>
    )
  );
}

// [linguo-patch:lms-stage-redesign-v1] markdown materi gaya frame:
//   "## "  → hero heading      "### " → sub-heading
//   "- "   → kartu bullet (check chip teal)   "> " → callout aksen kuning
//   sisanya → paragraf relaxed.  Bullet & callout berurutan dikelompokin.
function renderMarkdown(md: string): ReactNode {
  const lines = (md || "").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();

    if (t === "") {
      i++;
      continue;
    }

    // grup bullet → kartu-kartu
    if (t.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      out.push(
        <div key={key++} className="mt-4 flex flex-col gap-2.5">
          {items.map((it, j) => {
            return (
              <div
                key={j}
                className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3.5"
              >
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: hexA(TEAL, 0.1), color: TEAL }}
                >
                  <Check className="h-4 w-4" />
                </span>
                <p className="text-[14px] leading-relaxed text-slate-600">
                  {inlineBold(it)}
                </p>
              </div>
            );
          })}
        </div>
      );
      continue;
    }

    // grup callout (blockquote) → kotak aksen kuning
    if (t.startsWith("> ")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        buf.push(lines[i].trim().slice(2));
        i++;
      }
      out.push(
        <div
          key={key++}
          className="mt-5 flex items-start gap-3 rounded-2xl border p-4"
          style={{ background: hexA(YELLOW, 0.1), borderColor: hexA(YELLOW, 0.35) }}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: hexA(YELLOW, 0.3), color: "#9a7400" }}
          >
            <Lightbulb className="h-5 w-5" />
          </span>
          <p className="text-[13.5px] font-semibold leading-relaxed text-slate-700">
            {inlineBold(buf.join(" "))}
          </p>
        </div>
      );
      continue;
    }

    if (t.startsWith("### ")) {
      out.push(
        <h3 key={key++} className="mt-5 text-[17px] font-extrabold leading-tight text-slate-900">
          {inlineBold(t.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    if (t.startsWith("## ")) {
      out.push(
        <h2 key={key++} className="mt-5 text-[24px] font-extrabold leading-tight text-slate-900">
          {inlineBold(t.slice(3))}
        </h2>
      );
      i++;
      continue;
    }

    // paragraf
    out.push(
      <p key={key++} className="mt-3 text-[14.5px] font-medium leading-relaxed text-slate-600">
        {inlineBold(t)}
      </p>
    );
    i++;
  }
  return <div>{out}</div>;
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

function Pill({
  icon: Icon,
  text,
  color = TEAL,
}: {
  icon: LucideIcon;
  text: string;
  color?: string;
}) {
  return (
    <span
      className="inline-flex h-8 items-center gap-2 rounded-full px-3 text-[12px] font-bold"
      style={{ background: hexA(color, 0.1), color }}
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

// [linguo-patch:lms-switch-perf-v1] block → step (dipakai fetch utama & prefetch)
function buildSteps(blocks: Block[]): Step[] {
  const st: Step[] = [];
  blocks.forEach((b) => {
    if (b.type === "quiz") {
      const qs = (b.lms_quiz_questions || []).slice().sort((a, c) => a.sort_order - c.sort_order);
      qs.forEach((q, i) =>
        st.push({ kind: "quiz", block: b, q, qIdx: i, qTotal: qs.length, label: `Kuis ${i + 1}` })
      );
    } else if (b.type === "audio") st.push({ kind: "audio", block: b, label: "Audio" });
    else if (b.type === "logic") st.push({ kind: "logic", block: b, label: "Materi" });
    else if (b.type === "vocab") st.push({ kind: "vocab", block: b, label: "Kosakata" });
    else st.push({ kind: "logic", block: b, label: "Materi" });
  });
  // [linguo-patch:lms-lesson-frame-v2] sesi tanpa konten = jangan auto-selesai
  if (st.length > 0) st.push({ kind: "done", label: "Selesai" });
  return st;
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
  const [entitled, setEntitled] = useState(false); // [linguo-patch:lms-level-tree-v1] buat badge gembok di dropdown level
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
  // [linguo-patch:lms-stage-redesign-v1] konfirmasi sebelum keluar sesi
  const [confirmExit, setConfirmExit] = useState(false);
  // [linguo-patch:lms-lesson-switch-v1] bedain first-boot (full-screen spinner) vs switch sesi (spinner di stage doang)
  const bootedRef = useRef(false);
  // [linguo-patch:lms-switch-perf-v1] cache konten per-sesi → switch instan
  const contentCacheRef = useRef<Map<string, { les: any; steps: Step[]; locked: boolean }>>(new Map());
  const sibRef = useRef<{ id: string; title: string; sort_order: number }[]>([]);
  const entRef = useRef(false);
  // [linguo-patch:lms-quiz-sfx-v1] audio context buat chime benar/salah (synth, no file)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [sfxOn, setSfxOn] = useState(true);

  // [linguo-patch:ling-lesson-reposition-v3] tandai <body> selama player ke-mount → ChatWidget angkat launcher Ling (URL-agnostic, ga peduli pathname)
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.add("ling-on-lesson");
    return () => document.body.classList.remove("ling-on-lesson");
  }, []);
  // [linguo-patch:lms-switch-level-v1] modul lain dalam course yang sama (buat ganti level)
  const [modules, setModules] = useState<{ id: string; cefr_label: string; title: string }[]>([]);

  // [linguo-patch:lms-switch-warm-module-v1] warm SEMUA sesi 1 modul ke cache dalam 2 query (1 lessons + 1 blocks batched pakai .in) → race window kecil banget, switch instan. Idempotent: skip sesi yg udah ke-cache. Ganti prefetch per-lesson lama (~22 request) jadi 2 request.
  async function warmModule(
    moduleId: string | null | undefined,
    ent: boolean,
    cefrLabel?: string | null
  ) {
    if (!moduleId) return;
    try {
      const { data: lessons } = await supabase
        .from("lms_lessons")
        .select("id,title,est_minutes,is_preview,module_id,sort_order")
        .eq("module_id", moduleId)
        .order("sort_order");
      const ls = ((lessons as any[] | null) || []);
      const ids = ls.map((l) => l.id).filter((id: string) => !contentCacheRef.current.has(id));
      if (!ids.length) return;
      const { data: blks } = await supabase
        .from("lms_blocks")
        .select(
          "id,type,content,media_url,sort_order,lesson_id, lms_quiz_questions(id,type,prompt,options,answer,sort_order)"
        )
        .in("lesson_id", ids)
        .order("sort_order");
      const byLesson: Record<string, Block[]> = {};
      ((blks as any[] | null) || []).forEach((b) => {
        (byLesson[b.lesson_id] ||= []).push(b as Block);
      });
      ls.forEach((l) => {
        if (contentCacheRef.current.has(l.id)) return;
        const isLocked = !isFreeLevel(cefrLabel) && !l.is_preview && !ent;
        const steps = isLocked ? [] : buildSteps(byLesson[l.id] || []);
        contentCacheRef.current.set(l.id, { les: l, steps, locked: isLocked });
      });
    } catch {
      /* warm best-effort */
    }
  }

  useEffect(() => {
    // [linguo-patch:lms-lesson-switch-v1] cancellation guard: fetch sesi lama jangan nimpa state sesi baru kalau user klik cepet
    let cancelled = false;
    setStepIdx(0);
    setAnswers({});
    setShowText({});
    setDrawerOpen(false);
    // [linguo-patch:lms-switch-perf-v1] cache hit (sesi yg udah di-prefetch / dibuka) → tampil instan, tanpa spinner & tanpa re-fetch
    const cached = contentCacheRef.current.get(lessonId);
    if (cached && cached.les?.module_id === mod?.id) {
      setLesson(cached.les);
      setLocked(cached.locked);
      setSteps(cached.steps);
      setCompleted(progressMap[cached.les.id] === "completed");
      setLoading(false);
      bootedRef.current = true;
      warmModule(cached.les?.module_id, entRef.current, mod?.cefr_label);
      return;
    }
    (async () => {
      setLoading(true);
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

        // [linguo-patch:lms-switch-level-v1] ambil semua modul dalam course (buat ganti level di header sidebar)
        if (m?.course_id) {
          const { data: mods } = await supabase
            .from("lms_modules")
            .select("id,cefr_label,title")
            .eq("course_id", m.course_id)
            .order("cefr_label");
          if (cancelled) return;
          setModules(((mods as any[] | null) || []) as { id: string; cefr_label: string; title: string }[]);
        }

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
        const isLocked = !isFreeLevel(m?.cefr_label) && !les.is_preview && !ent;
        setLocked(isLocked);
        setEntitled(ent); // [linguo-patch:lms-level-tree-v1]
        entRef.current = ent; // [linguo-patch:lms-switch-perf-v1] dipakai prefetch untuk hitung lock tetangga

        let computedSteps: Step[] = [];
        if (!isLocked) {
          const { data: blks } = await supabase
            .from("lms_blocks")
            .select(
              "id,type,content,media_url,sort_order, lms_quiz_questions(id,type,prompt,options,answer,sort_order)"
            )
            .eq("lesson_id", les.id)
            .order("sort_order");
          if (cancelled) return;
          computedSteps = buildSteps((blks || []) as Block[]);
        }
        setSteps(computedSteps);
        // [linguo-patch:lms-switch-perf-v1] simpan konten ke cache → re-visit / balik sesi instan
        contentCacheRef.current.set(les.id, { les, steps: computedSteps, locked: isLocked });

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
        sibRef.current = sibList; // [linguo-patch:lms-switch-perf-v1]

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
        // [linguo-patch:lms-switch-perf-v1] warm-up sesi tetangga di background → klik "Lanjut"/sesi sebelah instan
        if (!cancelled) warmModule(les.module_id, ent, m?.cefr_label);
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

  // [linguo-patch:lms-quiz-sfx-v1] chime benar/salah pakai Web Audio (synth, no asset). Di-trigger dari klik opsi → lolos autoplay policy.
  function playSfx(correct: boolean) {
    if (!sfxOn || typeof window === "undefined") return;
    try {
      if (!audioCtxRef.current) {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        if (!AC) return;
        audioCtxRef.current = new AC();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();
      const t0 = ctx.currentTime;
      const tone = (freq: number, start: number, dur: number, type: OscillatorType, peak: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0 + start);
        gain.gain.setValueAtTime(0.0001, t0 + start);
        gain.gain.exponentialRampToValueAtTime(peak, t0 + start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t0 + start);
        osc.stop(t0 + start + dur + 0.03);
      };
      if (correct) {
        // arpeggio naik C5-E5-G5 (ceria, gaya Duolingo)
        tone(523.25, 0.0, 0.13, "triangle", 0.16);
        tone(659.25, 0.09, 0.13, "triangle", 0.16);
        tone(783.99, 0.18, 0.22, "triangle", 0.18);
      } else {
        // dua nada turun lembut (gak bikin kaget)
        tone(196.0, 0.0, 0.16, "sine", 0.13);
        tone(155.56, 0.12, 0.24, "sine", 0.13);
      }
    } catch {}
  }

  // [linguo-patch:lms-stage-redesign-v1] boleh ganti jawaban: cuma no-op kalau klik opsi yang sama. tiap ganti tetap di-log sebagai attempt baru.
  function answerQuiz(q: Quiz, choice: string) {
    if (answers[q.id] === choice) return;
    setAnswers((p) => ({ ...p, [q.id]: choice }));
    playSfx(choice === q.answer); // [linguo-patch:lms-quiz-sfx-v1]
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
  // [linguo-patch:lms-stage-redesign-v1] keluar sesi: minta konfirmasi kalau udah ada progress, kalau belum langsung keluar
  const requestExit = () => {
    if (locked || (stepIdx === 0 && Object.keys(answers).length === 0)) onBack();
    else setConfirmExit(true);
  };

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
  // [linguo-patch:lms-locked-in-frame-v1] layar lock DULU full-screen (sidebar ilang). Sekarang dirender di dalam STAGE (bareng switching/emptyContent) biar index sesi tetap nempel di kiri. Guard early-return dihapus.

  // [linguo-patch:lms-lesson-switch-v1] placeholder "belum ada konten" & spinner switch dipindah ke dalam STAGE (sidebar tetap render)
  const switching = loading; // booted=true di sini, jadi ini pasti switch (bukan first boot)
  // [linguo-patch:lms-locked-in-frame-v1] locked punya branch sendiri → jangan ke-treat sebagai "belum ada konten"
  const emptyContent = !switching && !locked && steps.length === 0;
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
        .lp-lift{transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease}
        .lp-lift:hover{transform:translateY(-3px);box-shadow:0 20px 40px -28px rgba(18,23,43,.55)}
      `}</style>

      {/* [linguo-patch:lms-icon-rail-v1][lms-icon-rail-route-v1] rail ikon ijo (Beranda dst) biar navigasi tetap ada pas buka materi/kuis — match frame. Desktop only; mobile pakai drawer. Link deep-link ke /akun?menu=<tab> (reader di akun/page.tsx). */}
      <aside className="hidden w-[72px] shrink-0 flex-col items-center bg-[#0F5A52] py-6 md:flex">
        <a
          href="/akun"
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white"
          title="Beranda"
        >
          <Bird className="h-6 w-6" style={{ color: TEAL }} />
        </a>
        <nav className="mt-10 flex flex-col items-center gap-2">
          <a
            href="/akun?menu=beranda"
            title="Beranda"
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <LayoutGrid className="h-[22px] w-[22px]" />
          </a>
          <span
            title="Kelas & Materi"
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
            style={{ background: "#16796E" }}
          >
            <BookOpen className="h-[22px] w-[22px]" />
          </span>
          <a
            href="/akun?menu=jadwal"
            title="Jadwal"
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <CalendarDays className="h-[22px] w-[22px]" />
          </a>
          <a
            href="/akun?menu=sertifikat"
            title="Sertifikat"
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <Star className="h-[22px] w-[22px]" />
          </a>
          <a
            href="/akun?menu=akun"
            title="Pengaturan"
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <Settings className="h-[22px] w-[22px]" />
          </a>
        </nav>
        <button
          onClick={async () => {
            try {
              await supabase.auth.signOut();
            } catch {}
            window.location.href = "/";
          }}
          title="Keluar"
          className="mt-auto flex h-11 w-11 items-center justify-center rounded-2xl text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-[22px] w-[22px]" />
        </button>
      </aside>

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
          modules={modules}
          currentModuleId={mod?.id}
          entitled={entitled}
          steps={steps}
          stepIdx={stepIdx}
          onJump={(gi: number) => setStepIdx(gi)}
          avatarText={(mod?.language || mod?.title || mod?.cefr_label || "Vi").slice(0, 2)}
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
          onClick={requestExit}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5F6F8] transition hover:bg-slate-100"
          title="Kembali"
        >
          <ArrowLeft className="h-5 w-5 text-slate-700" />
        </button>
        {/* [linguo-patch:lms-quiz-sfx-v1] toggle suara benar/salah */}
        <button
          onClick={() => setSfxOn((v) => !v)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5F6F8] transition hover:bg-slate-100"
          title={sfxOn ? "Suara: nyala" : "Suara: mati"}
          aria-label={sfxOn ? "Matikan suara" : "Nyalakan suara"}
        >
          {sfxOn ? (
            <Volume2 className="h-5 w-5 text-slate-700" />
          ) : (
            <VolumeX className="h-5 w-5 text-slate-400" />
          )}
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
        {/* [linguo-patch:lms-locked-hide-nav-v1] tombol close X disembunyiin saat layar locked (panah ← kiri-atas tetap ada sebagai jalan keluar) */}
        {!locked && (
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button
            onClick={requestExit}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-[#F5F6F8] hover:text-slate-700"
            title="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        )}
      </header>

      {/* PHASE BAR */}
      {/* [linguo-patch:lms-stage-redesign-v1] progress fase horizontal (Materi · Kuis · Selesai) gaya frame — ganti accordion, navigasi langkah pindah ke sidebar kiri */}
      {!switching && !locked && !emptyContent && (
      <div className="border-b border-slate-100 bg-white px-5 py-3.5 lg:px-8">
        <div className="mx-auto flex max-w-[760px] items-center gap-2">
          {([
            { key: "materi", label: "Materi", Icon: BookOpen, color: TEAL },
            { key: "kuis", label: "Kuis", Icon: HelpCircle, color: KUIS },
            { key: "selesai", label: "Selesai", Icon: PartyPopper, color: "#0F5A52" },
          ] as const).map((p, idx, defs) => {
            const items = steps
              .map((s, gi) => ({ s, gi }))
              .filter(({ s }) => railGroupKey(s.kind) === p.key);
            const total = p.key === "selesai" ? 1 : items.length;
            const done =
              p.key === "selesai" ? (atDone ? 1 : 0) : items.filter(({ gi }) => gi < stepIdx).length;
            const active = p.key === (cur ? railGroupKey(cur.kind) : "materi");
            const complete = total > 0 && done >= total;
            const lit = active || complete;
            const pct = total ? Math.round((done / total) * 100) : 0;
            const Icon = p.Icon;
            return (
              <div
                key={p.key}
                className={`flex items-center gap-2 ${idx < defs.length - 1 ? "flex-1" : ""}`}
              >
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={
                      complete
                        ? { background: p.color, color: "#fff" }
                        : active
                        ? { background: hexA(p.color, 0.15), color: p.color }
                        : { background: "#F1F3F5", color: "#94a3b8" }
                    }
                  >
                    {complete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span
                    className="text-[12.5px] font-extrabold"
                    style={{ color: lit ? "#12172B" : "#94a3b8" }}
                  >
                    {p.label}
                  </span>
                  {total > 1 && (
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: lit ? p.color : "#cbd5e1" }}
                    >
                      {done}/{total}
                    </span>
                  )}
                </div>
                {idx < defs.length - 1 && (
                  <span className="block h-1.5 min-w-[20px] flex-1 overflow-hidden rounded-full bg-[#E8EAEE]">
                    <span
                      className="block h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: p.color }}
                    />
                  </span>
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
        ) : locked ? (
          // [linguo-patch:lms-unlock-panel-v1] sesi terkunci → panel Unlock full access (kartu harga); index sesi kiri tetap kelihatan
          <UnlockFullAccess
            language={mod?.language || undefined}
            onSelectPlan={async (plan) => {
              // [linguo-patch:lms-checkout-v1] checkout Xendit subscription single_language (harga server-side, anti-tamper)
              try {
                const {
                  data: { user },
                } = await supabase.auth.getUser();
                if (!user) {
                  window.location.href = "/akun";
                  return;
                }
                const res = await fetch("/api/create-invoice", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    kind: "lms_subscription",
                    scope: "single_language",
                    language: mod?.language,
                    plan,
                    user_id: user.id,
                    email: user.email,
                  }),
                });
                const data = await res.json();
                if (res.ok && data?.invoice_url) {
                  window.location.href = data.invoice_url;
                } else {
                  alert(data?.error || "Gagal membuat invoice. Coba lagi ya.");
                }
              } catch (e) {
                console.error("LMS checkout error:", e);
                alert("Terjadi kesalahan saat membuat invoice. Coba lagi ya.");
              }
            }}
          />
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
      {/* [linguo-patch:lms-locked-hide-nav-v1] footer nav (Sebelumnya/Lanjut/"Langkah") disembunyiin saat locked — ga ada step di layar pricing */}
      {!locked && !atDone && !switching && !emptyContent && (
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
              modules={modules}
              currentModuleId={mod?.id}
              entitled={entitled}
              steps={steps}
              stepIdx={stepIdx}
              onJump={(gi: number) => {
                setStepIdx(gi);
                setDrawerOpen(false);
              }}
              avatarText={(mod?.language || mod?.title || mod?.cefr_label || "Vi").slice(0, 2)}
              onOpen={onOpenLesson}
              onCollapse={() => setDrawerOpen(false)}
              isDrawer
            />
          </div>
        </div>
      ) : null}

      {/* [linguo-patch:lms-stage-redesign-v1] modal konfirmasi keluar sesi */}
      {confirmExit ? (
        <div
          onClick={() => setConfirmExit(false)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#12172B]/40 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[400px] rounded-3xl bg-white p-6 shadow-[0_24px_60px_-20px_rgba(18,23,43,0.5)]"
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: hexA(YELLOW, 0.2), color: "#9a7400" }}
            >
              <ArrowLeft className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-[18px] font-extrabold text-slate-900">Keluar dari sesi ini?</h3>
            <p className="mt-1.5 text-[13.5px] font-medium leading-relaxed text-slate-500">
              Tenang, progres yang udah kamu kerjain tetap kesimpan. Kamu bisa lanjut lagi kapan aja
              dari daftar sesi.
            </p>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row-reverse">
              <button
                onClick={() => {
                  setConfirmExit(false);
                  onBack();
                }}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl px-5 text-[14px] font-extrabold text-white"
                style={{ background: TEAL }}
              >
                Ya, keluar
              </button>
              <button
                onClick={() => setConfirmExit(false)}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl px-5 text-[14px] font-bold text-slate-600 transition hover:bg-[#F5F6F8]"
              >
                Lanjut belajar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
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
        <Pill icon={Headphones} text="Materi · Dengarkan" />
        <h2 className="mt-3 text-[26px] font-extrabold leading-tight text-slate-900">
          {lesson.title}
        </h2>
        {b.content?.instruction ? (
          <p className="mt-2 max-w-[680px] text-[14px] font-medium leading-relaxed text-slate-500">
            {b.content.instruction}
          </p>
        ) : null}
        <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(18,23,43,.5)]">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: hexA(TEAL, 0.1), color: TEAL }}
            >
              <Volume2 className="h-5 w-5" />
            </span>
            {b.media_url ? (
              <audio controls src={b.media_url} className="w-full" />
            ) : (
              <p className="text-sm text-slate-400">Audio belum tersedia untuk sesi ini.</p>
            )}
          </div>
          {!showText[b.id] ? (
            <button
              onClick={() => onToggleText(b.id)}
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold transition hover:opacity-80"
              style={{ color: TEAL }}
            >
              <BookOpen className="h-4 w-4" /> Tampilkan teks
            </button>
          ) : (
            <div className="mt-4 rounded-2xl border border-slate-100 bg-[#F5F6F8] p-4">
              {b.content?.transcript ? (
                <div className="text-[18px] font-extrabold leading-snug text-slate-900">
                  {b.content.transcript}
                </div>
              ) : null}
              {b.content?.gloss ? (
                <div className="mt-1 text-[13.5px] font-semibold text-slate-500">
                  {b.content.gloss}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step.kind === "logic") {
    const b = step.block;
    return (
      <div className="lp-fade mx-auto max-w-[760px]">
        <Pill icon={BookOpen} text="Materi" />
        <div className="mt-3">{renderMarkdown(b.content?.markdown || "")}</div>
      </div>
    );
  }

  if (step.kind === "vocab") {
    const b = step.block;
    const items: any[] = b.content?.items || [];
    return (
      <div className="lp-fade mx-auto max-w-[860px]">
        <Pill icon={ListChecks} text="Materi · Kosakata" />
        <h2 className="mt-3 text-[26px] font-extrabold leading-tight text-slate-900">
          Kosakata baru
        </h2>
        <p className="mt-2 max-w-[640px] text-[14px] font-medium leading-relaxed text-slate-500">
          Ketuk tombol putar untuk mendengar pelafalannya, lalu ulangi dengan suara.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it: any, i: number) => (
            <div
              key={i}
              className="lp-lift rounded-2xl border-2 border-slate-100 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-extrabold"
                  style={{ background: hexA(TEAL, 0.1), color: TEAL }}
                >
                  {i + 1}
                </span>
                {it.audio ? (
                  <button
                    onClick={() => playWordAudio(it.audio)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition hover:opacity-90 active:scale-95"
                    style={{ background: TEAL }}
                    title="Putar audio"
                    aria-label={`Putar audio ${it.vi}`}
                  >
                    <Volume2 className="h-5 w-5" />
                  </button>
                ) : null}
              </div>
              <div className="mt-3 text-[24px] font-extrabold leading-none text-slate-900">
                {it.vi}
              </div>
              <div className="mt-1.5 text-[13px] font-semibold text-slate-500">{it.id}</div>
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
        <Pill icon={HelpCircle} text={`Kuis · Soal ${step.qIdx + 1} dari ${step.qTotal}`} color={KUIS} />
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
                onClick={() => onAnswer(q, opt)}
                className={`flex h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 text-left transition hover:border-[#16796E] hover:bg-[#F0FAF8] ${textCls}`}
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
          <p className="mt-2.5 text-[12px] font-semibold text-slate-400">
            Ketuk opsi lain kalau mau ganti jawaban.
          </p>
        )}

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
  const nLangkah = Math.max(0, steps.length - 1); // exclude "done"
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
      <h2 className="mt-6 text-[28px] font-extrabold leading-tight text-slate-900">
        Sesi selesai! 🎉
      </h2>
      <p className="mx-auto mt-2 max-w-[440px] text-[14px] font-medium leading-relaxed text-slate-500">
        {lesson.title} kelar. Progress kamu udah kesimpan — lanjut ke sesi berikutnya kapan aja.
      </p>

      {/* [linguo-patch:lms-stage-redesign-v1] kartu statistik (data asli, no XP palsu) */}
      <div className={`mt-7 grid gap-3 text-left ${total > 0 ? "grid-cols-2" : "grid-cols-1"}`}>
        {total > 0 && (
          <div className="rounded-2xl border border-slate-100 bg-white p-4">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: hexA(TEAL, 0.1), color: TEAL }}
            >
              <Target className="h-5 w-5" />
            </span>
            <p className="mt-2 text-[20px] font-extrabold leading-none text-slate-900">
              {correctCount}
              <span className="text-[14px] font-bold text-slate-400">/{total}</span>
            </p>
            <p className="mt-1 text-[12px] font-semibold text-slate-500">Skor kuis</p>
          </div>
        )}
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: hexA(YELLOW, 0.2), color: "#9a7400" }}
          >
            <Sparkles className="h-5 w-5" />
          </span>
          <p className="mt-2 text-[20px] font-extrabold leading-none text-slate-900">
            {nLangkah}
          </p>
          <p className="mt-1 text-[12px] font-semibold text-slate-500">Langkah selesai</p>
        </div>
      </div>

      {/* kartu sesi berikutnya */}
      {nextLesson ? (
        <button
          onClick={() => onOpenLesson(nextLesson.id)}
          className="lp-lift mt-4 flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left"
        >
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[13px] font-extrabold"
            style={{ background: "#F5F6F8", color: TEAL }}
          >
            <ArrowRight className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Sesi berikutnya
            </p>
            <p className="truncate text-[15px] font-extrabold text-slate-900">{nextLesson.title}</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
        </button>
      ) : null}

      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {nextLesson ? (
          <button
            onClick={() => onOpenLesson(nextLesson.id)}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-6 text-[14px] font-extrabold text-white sm:w-auto"
            style={{ background: TEAL, boxShadow: "0 14px 30px -14px rgba(22,121,110,.9)" }}
          >
            Lanjut sesi berikutnya <ArrowRight className="h-4 w-4" />
          </button>
        ) : null}
        <button
          onClick={onBack}
          className={
            nextLesson
              ? "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-6 text-[14px] font-bold text-slate-600 transition hover:bg-[#F5F6F8] sm:w-auto"
              : "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-6 text-[14px] font-extrabold text-white sm:w-auto"
          }
          style={nextLesson ? undefined : { background: TEAL }}
        >
          <ListChecks className="h-4 w-4" /> Kembali ke daftar sesi
        </button>
        <button
          onClick={onRestart}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-6 text-[14px] font-bold text-slate-600 transition hover:bg-[#F5F6F8] sm:w-auto"
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
  modules,
  currentModuleId,
  entitled = false,
  steps = [],
  stepIdx = 0,
  onJump,
  avatarText = "Vi",
  onOpen,
  onCollapse,
  isDrawer = false,
}: {
  siblings: { id: string; title: string; sort_order: number }[];
  currentId: string;
  progressMap: Record<string, string>;
  modTitle: string;
  cefr: string;
  modules?: { id: string; cefr_label: string; title: string }[];
  currentModuleId?: string | null;
  entitled?: boolean;
  steps?: Step[];
  stepIdx?: number;
  onJump?: (gi: number) => void;
  avatarText?: string;
  onOpen: (id: string) => void;
  onCollapse: () => void;
  isDrawer?: boolean;
}) {
  // [linguo-patch:lms-switch-level-v1] dropdown ganti level (modul lain dalam course yang sama)
  const [levelOpen, setLevelOpen] = useState(false);
  const [switchingMod, setSwitchingMod] = useState(false);
  // [linguo-patch:lms-stage-redesign-v1] grup substep (Materi/Kuis) bisa di-collapse; default kebuka
  const [closedSub, setClosedSub] = useState<Record<string, boolean>>({});
  const mods = modules || [];
  const canSwitch = mods.length > 0;

  // [linguo-patch:lms-level-tree-v1] dropdown 2 tingkat: major (A1/A2/B1/B2) -> sub-level (A1.1, A1.2, ...)
  const majors: string[] = [];
  mods.forEach((m) => {
    const mj = majorOf(m.cefr_label);
    if (mj && !majors.includes(mj)) majors.push(mj);
  });
  const [expandedMajor, setExpandedMajor] = useState<string | null>(majorOf(cefr));
  useEffect(() => {
    setExpandedMajor(majorOf(cefr));
  }, [cefr]);

  async function pickModule(mId: string) {
    if (mId === currentModuleId) {
      setLevelOpen(false);
      return;
    }
    setSwitchingMod(true);
    try {
      const { data: first } = await supabase
        .from("lms_lessons")
        .select("id")
        .eq("module_id", mId)
        .order("sort_order")
        .limit(1)
        .maybeSingle();
      if (first?.id) onOpen(first.id);
    } catch {
      /* noop */
    } finally {
      setSwitchingMod(false);
      setLevelOpen(false);
    }
  }

  // [linguo-patch:lms-stage-redesign-v1] progress bab = sesi selesai / total sesi
  const totalSess = siblings.length;
  const doneSess = siblings.filter((s) => progressMap[s.id] === "completed").length;
  const chapPct = totalSess ? Math.round((doneSess / totalSess) * 100) : 0;
  // substep grup buat sesi aktif (expand di list, gaya frame)
  const subGroups = (["materi", "kuis", "done"] as const)
    .map((k) => ({
      key: k,
      items: steps
        .map((s, gi) => ({ s, gi }))
        .filter(({ s }) => railGroupKey(s.kind) === k),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="flex h-full w-72 flex-col bg-white">
      <div className="relative border-b border-slate-100 px-4 pb-4 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {cefr} · Daftar sesi
          </p>
          <button
            onClick={onCollapse}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            title={isDrawer ? "Tutup" : "Sembunyikan"}
            aria-label={isDrawer ? "Tutup daftar sesi" : "Sembunyikan daftar sesi"}
          >
            {isDrawer ? <X className="h-5 w-5" /> : <ArrowLeft className="h-4 w-4" />}
          </button>
        </div>

        <button
          type="button"
          onClick={() => canSwitch && setLevelOpen((o) => !o)}
          className={`mt-2.5 flex w-full items-center gap-2.5 rounded-2xl bg-[#F5F6F8] px-3 py-2.5 text-left transition ${
            canSwitch ? "hover:bg-slate-100" : "cursor-default"
          }`}
          aria-label="Ganti level"
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[14px] font-extrabold"
            style={{ background: hexA(TEAL, 0.1), color: TEAL }}
          >
            {avatarText}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-extrabold leading-tight text-slate-900">
              {modTitle}
            </span>
            <span className="block truncate text-[11px] font-semibold text-slate-400">
              Level {cefr}
            </span>
          </span>
          {canSwitch && (
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
          )}
        </button>

        <div className="mt-3 flex items-center gap-2">
          <span className="block h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8EAEE]">
            <span
              className="block h-full rounded-full transition-all"
              style={{ width: `${chapPct}%`, background: TEAL }}
            />
          </span>
          <span className="text-[11px] font-bold text-slate-400">{chapPct}%</span>
        </div>

        {levelOpen && canSwitch && (
          <div className="absolute left-3 right-3 top-full z-30 mt-1 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_24px_50px_-18px_rgba(18,23,43,0.45)]">
            <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Pilih level
            </p>
            <div className="max-h-[50vh] overflow-y-auto pb-1">
              {majors.map((maj) => {
                const subs = mods.filter((m) => majorOf(m.cefr_label) === maj);
                const majLocked = !isFreeLevel(maj) && !entitled;
                const expanded = expandedMajor === maj;
                return (
                  <div key={maj}>
                    <button
                      type="button"
                      onClick={() => setExpandedMajor(expanded ? null : maj)}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-[#F5F6F8]"
                    >
                      <span
                        className="inline-flex h-6 shrink-0 items-center justify-center rounded-md px-1.5 text-[10px] font-extrabold"
                        style={
                          majLocked
                            ? { background: "#EEF0F3", color: "#9AA1AE" }
                            : { background: "rgba(22,121,110,0.10)", color: TEAL }
                        }
                      >
                        {maj}
                      </span>
                      <span
                        className={`min-w-0 flex-1 text-[12.5px] font-bold ${
                          majLocked ? "text-slate-400" : "text-slate-700"
                        }`}
                      >
                        {subs.length} sub-level
                      </span>
                      {majLocked && <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                          expanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {expanded &&
                      subs.map((m) => {
                        const active = m.id === currentModuleId;
                        const subLocked = !isFreeLevel(m.cefr_label) && !entitled;
                        return (
                          <button
                            key={m.id}
                            disabled={switchingMod}
                            onClick={() => pickModule(m.id)}
                            className={`flex w-full items-center gap-2 py-2.5 pl-7 pr-3 text-left transition disabled:opacity-60 ${
                              active ? "bg-[#16796E]/10" : "hover:bg-[#F5F6F8]"
                            }`}
                          >
                            <span
                              className={`inline-flex h-6 shrink-0 items-center justify-center rounded-md px-1.5 text-[10px] font-extrabold ${
                                subLocked ? "grayscale" : ""
                              }`}
                              style={
                                active
                                  ? { background: TEAL, color: "#fff" }
                                  : subLocked
                                    ? { background: "#EEF0F3", color: "#9AA1AE" }
                                    : { background: "rgba(22,121,110,0.10)", color: TEAL }
                              }
                            >
                              {m.cefr_label}
                            </span>
                            <span
                              className={`min-w-0 flex-1 truncate text-[12.5px] font-bold ${
                                active
                                  ? "text-[#0F5A52]"
                                  : subLocked
                                    ? "text-slate-400"
                                    : "text-slate-700"
                              }`}
                            >
                              {m.title}
                            </span>
                            {subLocked ? (
                              <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            ) : active ? (
                              <Check className="h-4 w-4 shrink-0" style={{ color: TEAL }} />
                            ) : null}
                          </button>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {siblings.length === 0 ? (
          <p className="px-3 py-4 text-[12px] font-medium text-slate-400">Belum ada sesi.</p>
        ) : (
          siblings.map((s, i) => {
            const isCurrent = s.id === currentId;
            const done = progressMap[s.id] === "completed";
            const expanded = isCurrent && subGroups.length > 0;
            return (
              <div
                key={s.id}
                className={`mb-1 rounded-2xl ${expanded ? "border border-[#16796E]/15" : ""}`}
              >
                <button
                  onClick={() => onOpen(s.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
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

                {/* [linguo-patch:lms-stage-redesign-v1] sesi aktif → expand substep (Materi/Kuis/Selesai) gaya frame */}
                {expanded && (
                  <div className="px-1.5 pb-2 pt-1">
                    {subGroups.map((g) => {
                      const meta = RAIL_GROUP_META[g.key];
                      const total = g.items.length;
                      const doneCount = g.items.filter(({ gi }) => gi < stepIdx).length;
                      if (g.key === "done") {
                        const { gi } = g.items[0];
                        const ac = gi === stepIdx;
                        const reachable = gi <= stepIdx;
                        return (
                          <button
                            key="done"
                            disabled={!reachable}
                            onClick={() => reachable && onJump?.(gi)}
                            className="mt-1.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition disabled:opacity-50"
                            style={ac ? { background: meta.color } : undefined}
                          >
                            <span
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                              style={
                                ac
                                  ? { background: "rgba(255,255,255,.2)", color: "#fff" }
                                  : { background: hexA(YELLOW, 0.2), color: "#9a7400" }
                              }
                            >
                              <PartyPopper className="h-3.5 w-3.5" />
                            </span>
                            <span
                              className="text-[12.5px] font-extrabold"
                              style={{ color: ac ? "#fff" : "#12172B" }}
                            >
                              Selesai &amp; Rangkuman
                            </span>
                          </button>
                        );
                      }
                      const groupOpen = !closedSub[g.key];
                      return (
                        <div key={g.key} className="mt-1">
                          <button
                            type="button"
                            onClick={() =>
                              setClosedSub((p) => ({ ...p, [g.key]: !p[g.key] }))
                            }
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 pb-1 pt-2 text-left transition hover:bg-[#F5F6F8]"
                          >
                            {g.key === "kuis" ? (
                              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                            ) : (
                              <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                            )}
                            <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                              {meta.label}
                            </span>
                            <span className="text-[11px] font-bold text-slate-300">
                              {doneCount}/{total}
                            </span>
                            <span className="flex-1" />
                            {groupOpen ? (
                              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </button>
                          {groupOpen && (
                          <div className="flex flex-col">
                            {g.items.map(({ s: st, gi }) => {
                              const ac = gi === stepIdx;
                              const dn = gi < stepIdx;
                              const reachable = gi <= stepIdx;
                              const StepIcon =
                                st.kind === "audio"
                                  ? Headphones
                                  : st.kind === "vocab"
                                  ? ListChecks
                                  : st.kind === "quiz"
                                  ? HelpCircle
                                  : BookOpen;
                              return (
                                <button
                                  key={gi}
                                  disabled={!reachable}
                                  onClick={() => reachable && onJump?.(gi)}
                                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition hover:bg-[#F5F6F8] disabled:cursor-not-allowed disabled:opacity-50"
                                  style={ac ? { background: meta.color } : undefined}
                                >
                                  <span
                                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                                    style={
                                      ac
                                        ? { background: "rgba(255,255,255,.2)", color: "#fff" }
                                        : dn
                                        ? { background: hexA(meta.color, 0.12), color: meta.color }
                                        : { background: "#F5F6F8", color: "#94a3b8" }
                                    }
                                  >
                                    {dn ? (
                                      <Check className="h-3.5 w-3.5" />
                                    ) : (
                                      <StepIcon className="h-3.5 w-3.5" />
                                    )}
                                  </span>
                                  <span
                                    className="min-w-0 flex-1 truncate text-[12.5px] font-semibold"
                                    style={{ color: ac ? "#fff" : "#475569" }}
                                  >
                                    {st.label}
                                  </span>
                                  {ac && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                                </button>
                              );
                            })}
                          </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
