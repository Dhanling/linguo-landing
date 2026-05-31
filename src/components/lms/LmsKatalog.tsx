"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2, Lock, CheckCircle2, ChevronDown, PlayCircle } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TEAL = "#1A9E9E";
const TEAL_DEEP = "#0F6E56";
const YELLOW = "#FFC93C";
const LANGUAGE = "Vietnamese";

type Module = { id: string; title: string; cefr_label: string; sort_order: number; course_id: string | null };
type Lesson = { id: string; module_id: string; title: string; sort_order: number; est_minutes: number | null; is_preview: boolean };

function band(cefr: string) {
  return (cefr || "").slice(0, 2).toUpperCase();
}
const BANDS = ["A1", "A2", "B1", "B2"];
const BAND_LABEL: Record<string, string> = {
  A1: "A1 · Pemula",
  A2: "A2 · Dasar",
  B1: "B1 · Menengah",
  B2: "B2 · Mahir",
};

export default function LmsKatalog({ onOpen }: { onOpen: (lessonId: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, Lesson[]>>({});
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [entitled, setEntitled] = useState(false);
  const [openModule, setOpenModule] = useState<string | null>(null);
  const [resume, setResume] = useState<Lesson | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: mods } = await supabase
        .from("lms_modules")
        .select("id,title,cefr_label,sort_order,course_id")
        .eq("language", LANGUAGE)
        .order("sort_order");
      const moduleList = (mods || []) as Module[];
      setModules(moduleList);
      if (moduleList.length === 0) {
        setLoading(false);
        return;
      }

      const ids = moduleList.map((m) => m.id);
      const { data: less } = await supabase
        .from("lms_lessons")
        .select("id,module_id,title,sort_order,est_minutes,is_preview")
        .in("module_id", ids)
        .order("sort_order");
      const grouped: Record<string, Lesson[]> = {};
      (less || []).forEach((l: any) => {
        if (!grouped[l.module_id]) grouped[l.module_id] = [];
        grouped[l.module_id].push(l);
      });
      setLessonsByModule(grouped);

      const { data: prog } = await supabase
        .from("lms_progress")
        .select("lesson_id,status")
        .eq("user_id", user.id);
      const done = new Set<string>(
        (prog || []).filter((p: any) => p.status === "completed").map((p: any) => p.lesson_id)
      );
      setCompleted(done);

      let ent = false;
      const courseId = moduleList.find((m) => m.course_id)?.course_id;
      if (courseId) {
        try {
          const { data: e } = await supabase.rpc("lms_is_entitled", { p_course_id: courseId });
          ent = !!e;
        } catch {}
      }
      setEntitled(ent);

      const flat = moduleList.flatMap((m) => grouped[m.id] || []);
      const next = flat.find((l) => !done.has(l.id) && (l.is_preview || ent));
      setResume(next || null);
      const firstMod = moduleList.find((m) => (grouped[m.id] || []).some((l) => l.id === next?.id));
      setOpenModule(firstMod?.id || moduleList[0].id);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-10">
        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
      </div>
    );
  }

  const totalLessons = Object.values(lessonsByModule).reduce((n, arr) => n + arr.length, 0);
  const totalDone = completed.size;
  const overallPct = totalLessons ? Math.round((totalDone / totalLessons) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A9E9E] to-[#0F6E56] p-5 text-white sm:p-6">
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rotate-12 rounded-3xl" style={{ background: YELLOW, opacity: 0.9 }} />
        <div className="pointer-events-none absolute right-20 top-12 h-16 w-16 rotate-12 rounded-2xl" style={{ background: YELLOW, opacity: 0.35 }} />
        <div className="relative">
          <p className="text-[12px] text-teal-100">Belajar Mandiri · Bahasa Vietnam · CEFR A1–B2</p>
          <h3 className="mt-1 text-xl font-bold sm:text-2xl">Tiếng Việt</h3>
          <p className="mt-1 text-sm text-teal-50">{totalDone} dari {totalLessons} sesi selesai</p>
          <div className="mt-3 h-2 w-full max-w-md overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full transition-all" style={{ width: `${overallPct}%`, background: YELLOW }} />
          </div>
          {resume && (
            <button
              onClick={() => onOpen(resume.id)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
              style={{ background: YELLOW, color: TEAL_DEEP }}
            >
              <PlayCircle className="h-4 w-4" />
              {totalDone === 0 ? "Mulai belajar" : "Lanjutkan"} — {resume.title}
            </button>
          )}
        </div>
      </div>

      {modules.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Materi belum tersedia. (Pastikan SQL seed sudah dijalankan di Supabase.)
        </div>
      ) : (
        <div className="space-y-6">
          {BANDS.map((bnd) => {
            const mods = modules.filter((m) => band(m.cefr_label) === bnd);
            if (mods.length === 0) return null;
            return (
              <div key={bnd}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{BAND_LABEL[bnd] || bnd}</p>
                <div className="space-y-2">
                  {mods.map((m) => {
                    const lessons = lessonsByModule[m.id] || [];
                    const doneCount = lessons.filter((l) => completed.has(l.id)).length;
                    const pct = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0;
                    const isOpen = openModule === m.id;
                    return (
                      <div key={m.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <button onClick={() => setOpenModule(isOpen ? null : m.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold" style={{ background: "rgba(26,158,158,0.12)", color: TEAL }}>
                            {m.cefr_label}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-900">{m.title}</span>
                            <span className="text-xs text-slate-400">{doneCount}/{lessons.length} sesi · {pct}%</span>
                          </span>
                          <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                        {isOpen && (
                          <ul className="border-t border-slate-100">
                            {lessons.map((l) => {
                              const isDone = completed.has(l.id);
                              const locked = !l.is_preview && !entitled;
                              return (
                                <li key={l.id} className={`border-t border-slate-50 first:border-0 ${locked ? "" : "hover:bg-slate-50"}`}>
                                  <button
                                    disabled={locked}
                                    onClick={() => !locked && onOpen(l.id)}
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left disabled:cursor-default"
                                  >
                                    {isDone ? (
                                      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: TEAL }} />
                                    ) : locked ? (
                                      <Lock className="h-4 w-4 shrink-0 text-slate-300" />
                                    ) : (
                                      <PlayCircle className="h-4 w-4 shrink-0 text-slate-400" />
                                    )}
                                    <span className={`flex-1 text-sm ${locked ? "text-slate-400" : "text-slate-700"}`}>{l.title}</span>
                                    {l.est_minutes ? <span className="text-xs text-slate-300">{l.est_minutes}m</span> : null}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
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
  );
}
