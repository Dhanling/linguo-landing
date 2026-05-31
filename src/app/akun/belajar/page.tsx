"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  CircleDot,
  Loader2,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TEAL = "#1A9E9E";

const LEVELS = ["A1", "A2", "B1", "B2"];
const LEVEL_NAME: Record<string, string> = {
  A1: "Pemula",
  A2: "Pra-Menengah",
  B1: "Menengah",
  B2: "Menengah Atas",
};
function levelOf(cefr: string) {
  return (cefr || "").split(".")[0];
}

export default function BelajarCatalogPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, any[]>>(
    {}
  );
  const [progress, setProgress] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: mods } = await supabase
        .from("lms_modules")
        .select("id,cefr_label,title,sort_order")
        .eq("language", "Vietnamese")
        .order("sort_order");
      const mlist = mods || [];
      setModules(mlist);
      if (mlist.length) setOpen({ [mlist[0].id]: true });

      const ids = mlist.map((m: any) => m.id);
      const byMod: Record<string, any[]> = {};
      if (ids.length) {
        const { data: les } = await supabase
          .from("lms_lessons")
          .select("id,module_id,title,sort_order,is_preview")
          .in("module_id", ids)
          .order("sort_order");
        (les || []).forEach((l: any) => {
          (byMod[l.module_id] = byMod[l.module_id] || []).push(l);
        });
      }
      setLessonsByModule(byMod);

      const { data: prog } = await supabase
        .from("lms_progress")
        .select("lesson_id,status")
        .eq("user_id", user.id);
      const pmap: Record<string, string> = {};
      (prog || []).forEach((p: any) => {
        pmap[p.lesson_id] = p.status;
      });
      setProgress(pmap);

      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-slate-700">
          Kamu perlu masuk dulu untuk mulai belajar.
        </p>
        <a
          href="/akun"
          className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          style={{ background: TEAL }}
        >
          Masuk ke akun
        </a>
      </div>
    );
  }

  const allLessons = Object.values(lessonsByModule).flat();
  const totalDone = allLessons.filter(
    (l: any) => progress[l.id] === "completed"
  ).length;
  const totalPct = allLessons.length
    ? Math.round((totalDone / allLessons.length) * 100)
    : 0;

  const groups: Record<string, any[]> = {};
  modules.forEach((m: any) => {
    const lv = levelOf(m.cefr_label);
    (groups[lv] = groups[lv] || []).push(m);
  });
  const levelKeys = [
    ...LEVELS.filter((l) => groups[l]),
    ...Object.keys(groups).filter((l) => !LEVELS.includes(l)),
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <a
        href="/akun"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Akun
      </a>

      <h1 className="text-2xl font-bold text-slate-900">Bahasa Vietnam</h1>
      <p className="mt-1 text-sm text-slate-500">
        Tiếng Việt · 19 sublevel · A1.1–B2.7
      </p>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Progres kamu</span>
          <span className="text-slate-500">
            {totalDone}/{allLessons.length} sesi · {totalPct}%
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full"
            style={{ width: `${totalPct}%`, background: TEAL }}
          />
        </div>
      </div>

      {levelKeys.map((lv) => (
        <section key={lv} className="mt-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">
            {lv}
            {LEVEL_NAME[lv] ? ` · ${LEVEL_NAME[lv]}` : ""}
          </h2>

          <div className="space-y-3">
            {groups[lv].map((m: any) => {
              const lessons = lessonsByModule[m.id] || [];
              const doneCount = lessons.filter(
                (l: any) => progress[l.id] === "completed"
              ).length;
              const pct = lessons.length
                ? Math.round((doneCount / lessons.length) * 100)
                : 0;
              const isOpen = !!open[m.id];
              const preview =
                lessons.length > 0 && lessons.every((l: any) => l.is_preview);

              return (
                <div
                  key={m.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <button
                    onClick={() =>
                      setOpen((p) => ({ ...p, [m.id]: !p[m.id] }))
                    }
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <span
                      className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold"
                      style={{
                        background: "rgba(26,158,158,0.12)",
                        color: TEAL,
                      }}
                    >
                      {m.cefr_label}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {m.title}
                      </span>
                      <span className="text-xs text-slate-400">
                        {doneCount}/{lessons.length} sesi selesai
                      </span>
                    </span>
                    {preview ? (
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: "rgba(26,158,158,0.12)",
                          color: TEAL,
                        }}
                      >
                        Preview
                      </span>
                    ) : null}
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                    )}
                  </button>

                  <div className="h-1 w-full bg-slate-100">
                    <div
                      className="h-full"
                      style={{ width: `${pct}%`, background: TEAL }}
                    />
                  </div>

                  {isOpen ? (
                    <ul className="divide-y divide-slate-100">
                      {lessons.map((l: any) => {
                        const st = progress[l.id];
                        const Icon =
                          st === "completed"
                            ? CheckCircle2
                            : st === "in_progress"
                            ? CircleDot
                            : Circle;
                        const iconColor =
                          st === "completed"
                            ? "#10b981"
                            : st === "in_progress"
                            ? TEAL
                            : "#cbd5e1";
                        return (
                          <li key={l.id}>
                            <a
                              href={`/akun/belajar/${l.id}`}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50"
                            >
                              <Icon
                                className="h-4 w-4 shrink-0"
                                style={{ color: iconColor }}
                              />
                              <span className="text-sm text-slate-700">
                                <span className="text-slate-400">
                                  {l.sort_order}.
                                </span>{" "}
                                {l.title}
                              </span>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
