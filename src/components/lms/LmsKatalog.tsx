"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2, PlayCircle } from "lucide-react";
import SilabusOutline from "@/components/akun/SilabusOutline";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TEAL_DEEP = "#0F5A52";
const YELLOW = "#F2CB05";
const LANGUAGE = "Vietnamese";
const SLUG = "vietnamese";

type ResumeTarget = { id: string; title: string };

export default function LmsKatalog({ onOpen }: { onOpen?: (lessonId: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [totalSessions, setTotalSessions] = useState(0); // roadmap penuh dari kurikulum statis
  const [completedCount, setCompletedCount] = useState(0);
  const [resume, setResume] = useState<ResumeTarget | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      // 1) total sesi dari kurikulum statis — roadmap penuh, ga nunggu seed LMS
      try {
        const mod: any = await import(`../../data/curriculum/data/${SLUG}`);
        const cur = mod?.default || mod?.curriculum || mod;
        const total = (cur?.levels || []).reduce(
          (a: number, l: any) =>
            a +
            (l.sublevels || []).reduce(
              (b: number, s: any) => b + (s.sessions?.length || 0),
              0
            ),
          0
        );
        if (alive && total) setTotalSessions(total);
      } catch {
        /* file kurikulum ga ada → biar 0, hero fallback ke copy generic */
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (alive) setLoading(false);
        return;
      }

      // 2) lesson LMS yg udah ke-seed (buat resume target + completed) — boleh kosong
      const { data: mods } = await supabase
        .from("lms_modules")
        .select("id,sort_order")
        .eq("language", LANGUAGE)
        .order("sort_order");
      const moduleIds = (mods || []).map((m: any) => m.id);

      let lessons: { id: string; module_id: string; title: string; sort_order: number }[] = [];
      if (moduleIds.length) {
        const { data: less } = await supabase
          .from("lms_lessons")
          .select("id,module_id,title,sort_order")
          .in("module_id", moduleIds)
          .order("sort_order");
        lessons = (less || []) as any[];
      }

      const { data: prog } = await supabase
        .from("lms_progress")
        .select("lesson_id,status")
        .eq("user_id", user.id);
      const done = new Set<string>(
        (prog || [])
          .filter((p: any) => p.status === "completed")
          .map((p: any) => p.lesson_id)
      );

      // urutan kurikulum: module sort_order -> lesson sort_order; resume = sesi pertama yg belum selesai
      const flat = moduleIds.flatMap((mid) =>
        lessons
          .filter((l) => l.module_id === mid)
          .sort((a, b) => a.sort_order - b.sort_order)
      );
      const next = flat.find((l) => !done.has(l.id));

      if (!alive) return;
      setCompletedCount(done.size);
      setResume(next ? { id: next.id, title: next.title } : null);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-10">
        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
      </div>
    );
  }

  const denom = totalSessions;
  const doneShown = Math.min(completedCount, denom || completedCount);
  const pct = denom ? Math.round((doneShown / denom) * 100) : 0;
  const startLabel = completedCount === 0 ? "Mulai belajar" : "Lanjutkan";

  return (
    <div className="space-y-6">
      {/* Hero — resume + progress (pembeda self-paced: ada % + tombol Lanjut, tanpa guru/jadwal) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#16796E] to-[#0F5A52] p-5 text-white sm:p-6">
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rotate-12 rounded-3xl"
          style={{ background: YELLOW, opacity: 0.9 }}
        />
        <div
          className="pointer-events-none absolute right-20 top-12 h-16 w-16 rotate-12 rounded-2xl"
          style={{ background: YELLOW, opacity: 0.35 }}
        />
        <div className="relative">
          <p className="text-[12px] text-teal-100">Belajar Mandiri · Bahasa Vietnam · CEFR A1–B2</p>
          <h3 className="mt-1 text-xl font-bold sm:text-2xl">Tiếng Việt</h3>
          <p className="mt-1 text-sm text-teal-50">
            {denom ? `${doneShown} dari ${denom} sesi selesai` : "Self-paced · belajar kapan aja"}
          </p>
          {denom ? (
            <div className="mt-3 h-2 w-full max-w-md overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: YELLOW }}
              />
            </div>
          ) : null}
          {resume ? (
            onOpen ? (
              <button
                onClick={() => onOpen(resume.id)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
                style={{ background: YELLOW, color: TEAL_DEEP }}
              >
                <PlayCircle className="h-4 w-4" />
                {startLabel} — {resume.title}
              </button>
            ) : (
              <a
                href={`/akun/belajar/${resume.id}`}
                className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
                style={{ background: YELLOW, color: TEAL_DEEP }}
              >
                <PlayCircle className="h-4 w-4" />
                {startLabel} — {resume.title}
              </a>
            )
          ) : null}
        </div>
      </div>

      {/* Roadmap penuh — renderer yg sama persis kayak Kelas Live (DRY) */}
      <SilabusOutline
        slug={SLUG}
        languageLabel="Vietnamese"
        currentLevel="A1"
        mode="selfpaced"
      />
    </div>
  );
}
