"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  Volume2,
  Languages,
  BookOpen,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Lock,
  PlayCircle,
} from "lucide-react";
import StudentShell, { type AkunTab } from "@/components/akun/StudentShell"; // [linguo-patch:lms-player-shell-v1]

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TEAL = "#16796E"; // [linguo-patch:lms-player-shell-v1] samain palet /akun

// [linguo-patch:lms-player-masterdetail-v1] tree silabus kiri + materi kanan
const BANDS = ["A1", "A2", "B1", "B2"];
const BAND_LABEL: Record<string, string> = {
  A1: "A1 · Pemula",
  A2: "A2 · Dasar",
  B1: "B1 · Menengah",
  B2: "B2 · Mahir",
};
function band(cefr: string) {
  return (cefr || "").slice(0, 2).toUpperCase(); // A1.1 -> A1
}

type Module = {
  id: string;
  title: string;
  cefr_label: string;
  sort_order: number;
  course_id: string | null;
  language?: string | null;
};
type LessonLite = {
  id: string;
  module_id: string;
  title: string;
  sort_order: number;
  est_minutes: number | null;
  is_preview: boolean;
};

const BLOCK_META: Record<string, { icon: any; label: string }> = {
  audio: { icon: Volume2, label: "Dengar & Ucapkan" },
  logic: { icon: Languages, label: "Logika Bahasa" },
  vocab: { icon: BookOpen, label: "Kosakata" },
  quiz: { icon: CheckCircle2, label: "Kuis" },
};

function stripBold(s: string) {
  return s.replace(/\*\*/g, "");
}
function renderMarkdown(md: string) {
  return md.split("\n").map((line: string, i: number) => {
    if (line.startsWith("## "))
      return (
        <h3 key={i} className="mt-1 text-base font-semibold text-slate-900">
          {line.slice(3)}
        </h3>
      );
    if (line.startsWith("- "))
      return (
        <li key={i} className="ml-5 list-disc text-slate-700">
          {stripBold(line.slice(2))}
        </li>
      );
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return (
      <p key={i} className="text-slate-700">
        {stripBold(line)}
      </p>
    );
  });
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = Array.isArray(params?.lessonId)
    ? params.lessonId[0]
    : (params?.lessonId as string);

  // ===== konten sesi aktif (per-lesson) =====
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [lesson, setLesson] = useState<any>(null);
  const [locked, setLocked] = useState(false);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showText, setShowText] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prevId, setPrevId] = useState<string | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);

  // ===== silabus tree (persist antar navigasi client-side) =====
  const [modules, setModules] = useState<Module[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, LessonLite[]>>({});
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [entitled, setEntitled] = useState(false);
  const [openModule, setOpenModule] = useState<string | null>(null);
  const [loadedLang, setLoadedLang] = useState<string | null>(null);
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (!user || !lessonId) {
        setLoading(false);
        return;
      }

      const { data: les } = await supabase
        .from("lms_lessons")
        .select("id,title,est_minutes,is_preview,module_id,sort_order")
        .eq("id", lessonId)
        .maybeSingle();
      if (!les) {
        setLesson(null);
        setLoading(false);
        return;
      }
      setLesson(les);

      const { data: mod } = await supabase
        .from("lms_modules")
        .select("id,course_id,language")
        .eq("id", les.module_id)
        .maybeSingle();

      let ent = false;
      if (mod?.course_id) {
        try {
          const { data: e } = await supabase.rpc("lms_is_entitled", {
            p_course_id: mod.course_id,
          });
          ent = !!e;
        } catch {}
      }
      setEntitled(ent);
      const isLocked = !les.is_preview && !ent;
      setLocked(isLocked);

      // auto-open modul aktif di sidebar
      setOpenModule(les.module_id);

      const lang = mod?.language || null;

      // === TREE: fetch sekali per-bahasa, reuse pas pindah sesi ===
      let groupedRef: Record<string, LessonLite[]> = lessonsByModule;
      if (lang && lang !== loadedLang) {
        const { data: mods } = await supabase
          .from("lms_modules")
          .select("id,title,cefr_label,sort_order,course_id,language")
          .eq("language", lang)
          .order("sort_order");
        const moduleList = (mods || []) as Module[];
        setModules(moduleList);

        const ids = moduleList.map((m) => m.id);
        const { data: allLess } = await supabase
          .from("lms_lessons")
          .select("id,module_id,title,sort_order,est_minutes,is_preview")
          .in("module_id", ids.length ? ids : ["-"])
          .order("sort_order");
        const grouped: Record<string, LessonLite[]> = {};
        (allLess || []).forEach((l: any) => {
          if (!grouped[l.module_id]) grouped[l.module_id] = [];
          grouped[l.module_id].push(l);
        });
        setLessonsByModule(grouped);
        groupedRef = grouped;
        setLoadedLang(lang);
      }

      // progress (refresh tiap navigasi biar checkmark sidebar akurat)
      const { data: prog } = await supabase
        .from("lms_progress")
        .select("lesson_id,status")
        .eq("user_id", user.id);
      const doneSet = new Set<string>(
        (prog || [])
          .filter((p: any) => p.status === "completed")
          .map((p: any) => p.lesson_id)
      );
      setCompleted(doneSet);
      setDone(doneSet.has(les.id));

      // prev / next dalam modul yang sama
      const sibs = (groupedRef[les.module_id] || [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order);
      const idx = sibs.findIndex((s) => s.id === les.id);
      setPrevId(idx > 0 ? sibs[idx - 1].id : null);
      setNextId(idx >= 0 && idx < sibs.length - 1 ? sibs[idx + 1].id : null);

      // blocks (cuma kalau ke-unlock) — query identik, data-wiring ga diutak-atik
      if (!isLocked) {
        const { data: blks } = await supabase
          .from("lms_blocks")
          .select(
            "id,type,content,media_url,sort_order, lms_quiz_questions(id,type,prompt,options,answer,sort_order)"
          )
          .eq("lesson_id", les.id)
          .order("sort_order");
        setBlocks(blks || []);
      } else {
        setBlocks([]);
      }

      // reset interaksi pas pindah sesi
      setAnswers({});
      setShowText({});

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  // auto-scroll sesi aktif ke tengah viewport sidebar
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: "center" });
    }
  }, [lessonId, openModule, modules.length]);

  function answerQuiz(q: any, choice: string) {
    if (answers[q.id]) return;
    setAnswers((prev) => ({ ...prev, [q.id]: choice }));
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
    if (!user || !lesson) return;
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
      setDone(true);
      // update checkmark sidebar langsung tanpa refetch
      setCompleted((prev) => new Set(prev).add(lesson.id));
    }
  }

  const goTab = (t: AkunTab) => router.push(`/akun?menu=${t}`);
  const goLesson = (id: string) => router.push(`/akun/belajar/${id}`);

  // ====== SIDEBAR (silabus tree A1–B2) ======
  const totalLessons = Object.values(lessonsByModule).reduce((n, arr) => n + arr.length, 0);
  const totalDone = completed.size;
  const overallPct = totalLessons ? Math.round((totalDone / totalLessons) * 100) : 0;

  const sidebar = (
    <div className="flex h-full flex-col">
      {/* header sidebar */}
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
        <a
          href="/akun/belajar"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Semua materi
        </a>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-900">Silabus</span>
          <span className="text-xs font-semibold" style={{ color: TEAL }}>
            {totalDone}/{totalLessons}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${overallPct}%`, background: TEAL }}
          />
        </div>
      </div>

      {/* tree */}
      <div className="px-3 py-3">
        {modules.length === 0 ? (
          <div className="px-2 py-6 text-center text-xs text-slate-400">
            {loading ? "Memuat silabus…" : "Silabus belum tersedia."}
          </div>
        ) : (
          <div className="space-y-4">
            {BANDS.map((bnd) => {
              const mods = modules.filter((m) => band(m.cefr_label) === bnd);
              if (mods.length === 0) return null;
              return (
                <div key={bnd}>
                  <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {BAND_LABEL[bnd] || bnd}
                  </p>
                  <div className="space-y-1">
                    {mods.map((m) => {
                      const lessons = lessonsByModule[m.id] || [];
                      const doneCount = lessons.filter((l) => completed.has(l.id)).length;
                      const isOpen = openModule === m.id;
                      const hasActive = lessons.some((l) => l.id === lessonId);
                      return (
                        <div key={m.id}>
                          <button
                            onClick={() => setOpenModule(isOpen ? null : m.id)}
                            className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition hover:bg-slate-50 ${
                              hasActive ? "bg-slate-50" : ""
                            }`}
                          >
                            <span
                              className="flex h-6 shrink-0 items-center justify-center rounded-md px-1.5 text-[10px] font-bold"
                              style={{ background: "rgba(22,121,110,0.10)", color: TEAL }}
                            >
                              {m.cefr_label}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-semibold text-slate-800">
                                {m.title}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {doneCount}/{lessons.length} sesi
                              </span>
                            </span>
                            <ChevronDown
                              className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          {isOpen && (
                            <div className="mb-1 ml-3 mt-0.5 border-l border-slate-100 pl-2">
                              {lessons.map((l) => {
                                const isDone = completed.has(l.id);
                                const lLocked = !l.is_preview && !entitled;
                                const isActive = l.id === lessonId;
                                return (
                                  <button
                                    key={l.id}
                                    ref={isActive ? activeRef : undefined}
                                    disabled={lLocked}
                                    onClick={() => {
                                      if (!lLocked) goLesson(l.id);
                                    }}
                                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition ${
                                      isActive
                                        ? "font-semibold text-white"
                                        : lLocked
                                        ? "cursor-default text-slate-300"
                                        : "text-slate-600 hover:bg-slate-50"
                                    }`}
                                    style={isActive ? { background: TEAL } : undefined}
                                  >
                                    {isDone ? (
                                      <CheckCircle2
                                        className="h-3.5 w-3.5 shrink-0"
                                        style={{ color: isActive ? "#fff" : TEAL }}
                                      />
                                    ) : lLocked ? (
                                      <Lock className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                                    ) : (
                                      <PlayCircle
                                        className={`h-3.5 w-3.5 shrink-0 ${
                                          isActive ? "text-white/90" : "text-slate-300"
                                        }`}
                                      />
                                    )}
                                    <span className="min-w-0 flex-1 truncate">{l.title}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ====== MAIN CONTENT (materi sesi aktif) ======
  // Back cuma di mobile — di desktop navigasi udah lewat sidebar
  const Back = (
    <a
      href="/akun/belajar"
      className="mb-5 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 lg:hidden"
    >
      <ArrowLeft className="h-4 w-4" /> Semua materi
    </a>
  );

  let inner: ReactNode;

  if (loading) {
    inner = (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-slate-300" />
      </div>
    );
  } else if (!user) {
    inner = (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-slate-700">Kamu perlu masuk dulu untuk belajar.</p>
        <a
          href="/akun"
          className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          style={{ background: TEAL }}
        >
          Masuk ke akun
        </a>
      </div>
    );
  } else if (!lesson) {
    inner = (
      <>
        {Back}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Sesi tidak ditemukan.
        </div>
      </>
    );
  } else if (locked) {
    inner = (
      <>
        {Back}
        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
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
        </div>
      </>
    );
  } else {
    inner = (
      <>
        {Back}
        <h1 className="text-2xl font-bold text-slate-900">{lesson.title}</h1>
        {lesson.est_minutes ? (
          <p className="mt-1 text-sm text-slate-500">± {lesson.est_minutes} menit</p>
        ) : null}

        <div className="mt-6 space-y-4">
          {blocks.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              Konten sesi ini belum diisi.
            </div>
          )}
          {blocks.map((b: any) => {
            const meta = BLOCK_META[b.type] || { icon: BookOpen, label: b.type };
            const Icon = meta.icon;
            return (
              <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full"
                    style={{ background: "rgba(22,121,110,0.10)", color: TEAL }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-slate-700">{meta.label}</span>
                </div>

                {b.type === "audio" && (
                  <div>
                    <p className="mb-2 text-sm text-slate-500">{b.content?.instruction}</p>
                    <audio controls src={b.media_url} className="w-full" />
                    <p className="mt-1 text-xs text-slate-400">
                      (audio placeholder — aktif setelah R2 dipasang)
                    </p>
                    {!showText[b.id] ? (
                      <button
                        onClick={() => setShowText((p) => ({ ...p, [b.id]: true }))}
                        className="mt-3 text-sm font-medium underline"
                        style={{ color: TEAL }}
                      >
                        Tampilkan teks
                      </button>
                    ) : (
                      <div className="mt-3 rounded-lg bg-slate-50 p-3">
                        <div className="text-lg font-semibold text-slate-900">
                          {b.content?.transcript}
                        </div>
                        <div className="text-sm text-slate-500">{b.content?.gloss}</div>
                      </div>
                    )}
                  </div>
                )}

                {b.type === "logic" && (
                  <div className="space-y-1 text-[15px] leading-relaxed">
                    {renderMarkdown(b.content?.markdown || "")}
                  </div>
                )}

                {b.type === "vocab" && (
                  <ul className="divide-y divide-slate-100">
                    {(b.content?.items || []).map((it: any, i: number) => (
                      <li key={i} className="flex items-center justify-between py-2">
                        <span className="font-medium text-slate-900">{it.vi}</span>
                        <span className="text-sm text-slate-500">{it.id}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {b.type === "quiz" && (
                  <div>
                    {b.content?.instruction ? (
                      <p className="mb-3 text-sm text-slate-500">{b.content.instruction}</p>
                    ) : null}
                    {((b.lms_quiz_questions || []) as any[])
                      .sort((qa: any, qb: any) => qa.sort_order - qb.sort_order)
                      .map((q: any) => {
                        const chosen = answers[q.id];
                        return (
                          <div key={q.id} className="mb-4 last:mb-0">
                            <div className="mb-2 font-medium text-slate-900">{q.prompt}</div>
                            <div className="flex flex-col gap-2">
                              {(q.options || []).map((opt: string) => {
                                const isChosen = chosen === opt;
                                const isCorrect = opt === q.answer;
                                let cls = "border-slate-200 text-slate-700 hover:border-slate-300";
                                if (chosen) {
                                  if (isCorrect)
                                    cls = "border-emerald-400 bg-emerald-50 text-emerald-700";
                                  else if (isChosen)
                                    cls = "border-rose-400 bg-rose-50 text-rose-700";
                                  else cls = "border-slate-200 text-slate-400";
                                }
                                return (
                                  <button
                                    key={opt}
                                    disabled={!!chosen}
                                    onClick={() => answerQuiz(q, opt)}
                                    className={`rounded-lg border px-4 py-2 text-left text-sm transition ${cls}`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Complete */}
        <div className="mt-8">
          {done ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="h-5 w-5" /> Sesi selesai
            </div>
          ) : (
            <button
              onClick={markComplete}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: TEAL }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Tandai selesai
            </button>
          )}
        </div>

        {/* Prev / Next (client nav, dalam modul) */}
        <div className="mt-4 flex items-center justify-between gap-3">
          {prevId ? (
            <button
              onClick={() => goLesson(prevId)}
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              <ChevronLeft className="h-4 w-4" /> Sebelumnya
            </button>
          ) : (
            <span />
          )}
          {nextId ? (
            <button
              onClick={() => goLesson(nextId)}
              className="inline-flex items-center gap-1 text-sm font-medium"
              style={{ color: TEAL }}
            >
              Berikutnya <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <span />
          )}
        </div>
      </>
    );
  }

  return (
    <StudentShell active="materi" onTabChange={goTab}>
      {/* [linguo-patch:lms-player-masterdetail-v1] grid-rows-1 = minmax(0,1fr) biar tiap kolom scroll sendiri di dlm panel materi (overflow-hidden) */}
      {user ? (
        <div className="flex-1 min-h-0 lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:grid-rows-1">
          {/* KIRI — silabus tree (desktop only) */}
          <aside className="hidden border-r border-slate-200 bg-white lg:flex lg:min-h-0 lg:flex-col lg:overflow-y-auto">
            {sidebar}
          </aside>
          {/* KANAN — materi sesi aktif */}
          <div className="flex-1 min-h-0 lg:overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl px-5 py-6 lg:px-8 lg:py-8">{inner}</div>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 lg:overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-5 py-6 lg:px-8 lg:py-8">{inner}</div>
        </div>
      )}
    </StudentShell>
  );
}
