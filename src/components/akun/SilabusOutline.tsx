"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { BookOpen, ChevronDown, Target, Loader2, ArrowRight, X, Video, FileText, ClipboardList, ChevronRight } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Session = { number: number; title: string; topics?: string[] };
type Sublevel = { code: string; name: string; preview?: boolean; sessions: Session[] };
type Level = { code: string; name: string; description?: string; sublevels: Sublevel[] };
type Curriculum = { meta?: any; overview?: string; levels: Level[] };

type Props = {
  /** silabus slug, mis. "vietnamese" — disamain dgn link /silabus/{slug} */
  slug: string;
  /** label bahasa buat tombol footer (mis. "Vietnamese") */
  languageLabel?: string;
  /** level kelas siswa (mis. "A1" / "A1.1") — buat auto-expand + badge */
  currentLevel?: string;
  /** sembunyikan tombol Placement Test (mis. utk Test Prep) */
  showPlacementTest?: boolean;
  /** konteks render: "live" (kelas live, default) atau "selfpaced" (Belajar Mandiri) — ngubah copy empty-state modal */
  mode?: "live" | "selfpaced";
  /** kalau ada → "Mulai belajar" buka overlay player (instan) lewat callback; kalau ngga → fallback navigate ke /akun/belajar/{id} */
  onOpen?: (lessonId: string) => void;
};

type OpenSession = { s: Session; subCode: string; levelName: string };

type LessonState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "none" }
  | { status: "found"; lessonId: string; quizCount: number; hasAudio: boolean; hasMateri: boolean };

function ContentSlot({ icon: Icon, label, hint }: { icon: any; label: string; hint: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-[#F5F6F8]/60 px-3.5 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 ring-1 ring-slate-100">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold text-[#12172B]">{label}</span>
        <span className="block text-[11.5px] font-medium text-gray-400">{hint}</span>
      </span>
      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-gray-400">Belum ditautkan</span>
    </div>
  );
}

export default function SilabusOutline({
  slug,
  languageLabel = "",
  currentLevel,
  showPlacementTest = true,
  mode = "live",
  onOpen,
}: Props) {
  const [data, setData] = useState<Curriculum | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [openLevel, setOpenLevel] = useState<string | null>(null);
  const [openSub, setOpenSub] = useState<string | null>(null);
  const [openSession, setOpenSession] = useState<OpenSession | null>(null);
  // [linguo-patch:silabus-prefetch-lessons-v1] map sublevel→sesi (lessonId + meta) di-prefetch SEKALI → klik sesi = instan, no spinner per-klik
  const [bySub, setBySub] = useState<
    Record<string, { lessonId: string; quizCount: number; hasAudio: boolean; hasMateri: boolean }[]> | null
  >(null);
  const [showOverview, setShowOverview] = useState(false); // [linguo-patch:silabus-overview-modal-v1]

  useEffect(() => {
    let alive = true;
    setState("loading");
    setData(null);
    import(`../../data/curriculum/data/${slug}`)
      .then((mod: any) => {
        if (!alive) return;
        const cur: Curriculum = mod?.default || mod?.curriculum || mod;
        if (!cur || !Array.isArray(cur.levels) || cur.levels.length === 0) {
          setState("error");
          return;
        }
        // [linguo-patch:silabus-collapse-default-v1] semua level collapsed by default — user expand manual (no auto-open dari currentLevel)
        setOpenLevel(null);
        setOpenSub(null);
        setData(cur);
        setState("ready");
      })
      .catch(() => {
        if (alive) setState("error");
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  // [linguo-patch:silabus-prefetch-lessons-v1] prefetch SEKALI per slug (3 query di-batch) → resolve sesi instan dari map, ilangin spinner tiap klik
  useEffect(() => {
    let alive = true;
    setBySub(null);
    (async () => {
      try {
        const { data: mods } = await supabase
          .from("lms_modules")
          .select("id, cefr_label, sort_order")
          .ilike("language", slug)
          .order("sort_order");
        if (!alive) return;
        const modList = (mods as any[]) || [];
        if (modList.length === 0) {
          setBySub({});
          return;
        }

        // modul pertama (sort_order terkecil) per cefr_label — samain perilaku query lama (.limit(1))
        const modBySub: Record<string, string> = {};
        modList.forEach((m: any) => {
          if (!(m.cefr_label in modBySub)) modBySub[m.cefr_label] = m.id;
        });
        const subByModule: Record<string, string> = {};
        Object.entries(modBySub).forEach(([sub, id]) => {
          subByModule[id] = sub;
        });
        const moduleIds = Object.values(modBySub);

        const { data: lessons } = await supabase
          .from("lms_lessons")
          .select("id, module_id, sort_order")
          .in("module_id", moduleIds)
          .order("sort_order");
        if (!alive) return;
        const lessList = ((lessons as any[]) || []).slice().sort((a: any, b: any) => a.sort_order - b.sort_order);

        // meta konten (quiz/audio/materi) di-batch SEKALI buat semua lesson
        const allIds = lessList.map((l: any) => l.id);
        const metaByLesson: Record<string, { quizCount: number; hasAudio: boolean; hasMateri: boolean }> = {};
        if (allIds.length) {
          const { data: blocks } = await supabase
            .from("lms_blocks")
            .select("lesson_id, type, lms_quiz_questions(id)")
            .in("lesson_id", allIds);
          if (!alive) return;
          ((blocks as any[]) || []).forEach((b: any) => {
            const e = (metaByLesson[b.lesson_id] =
              metaByLesson[b.lesson_id] || { quizCount: 0, hasAudio: false, hasMateri: false });
            e.quizCount += (b.lms_quiz_questions || []).length;
            if (b.type === "audio") e.hasAudio = true;
            if (b.type === "logic" || b.type === "vocab") e.hasMateri = true;
          });
        }

        const map: Record<string, { lessonId: string; quizCount: number; hasAudio: boolean; hasMateri: boolean }[]> = {};
        lessList.forEach((l: any) => {
          const sub = subByModule[l.module_id];
          if (!sub) return;
          const m = metaByLesson[l.id] || { quizCount: 0, hasAudio: false, hasMateri: false };
          (map[sub] = map[sub] || []).push({ lessonId: l.id, ...m });
        });
        if (alive) setBySub(map);
      } catch {
        if (alive) setBySub({});
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 p-10">
        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
      </div>
    );
  }

  if (state === "error" || !data) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
        <BookOpen className="mx-auto mb-2 h-8 w-8 text-slate-300" strokeWidth={1.6} />
        <p className="text-[13px] font-semibold text-gray-500">Silabus belum tersedia untuk bahasa ini</p>
        <a
          href={`/silabus/${slug}`}
          className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#16796E] hover:underline"
        >
          Lihat di halaman silabus <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
        </a>
      </div>
    );
  }

  // [linguo-patch:silabus-prefetch-lessons-v1] resolve sesi dari map (sinkron, instan); cuma "loading" pas prefetch awal belum kelar
  const lessonState: LessonState = !openSession
    ? { status: "idle" }
    : bySub == null
    ? { status: "loading" }
    : (() => {
        const e = bySub[openSession.subCode]?.[openSession.s.number - 1];
        return e
          ? { status: "found", lessonId: e.lessonId, quizCount: e.quizCount, hasAudio: e.hasAudio, hasMateri: e.hasMateri }
          : { status: "none" };
      })();

  return (
    <div className="flex flex-col gap-4">
      {data.overview ? (
        <div className="rounded-2xl bg-[#16796E]/5 px-4 py-3">{/* [linguo-patch:silabus-overview-modal-v1] */}
          <p className="text-[12.5px] font-medium leading-relaxed text-gray-600 line-clamp-3">
            {data.overview}
          </p>
          {data.overview.length > 170 ? (
            <button
              onClick={() => setShowOverview(true)}
              className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-bold text-[#16796E] transition hover:text-[#0F5A52] hover:underline"
            >
              Selengkapnya <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          ) : null}
        </div>
      ) : null}

      {data.levels.map((lvl) => {
        const levelOpen = openLevel === lvl.code;
        const totalSesi = lvl.sublevels.reduce((a, s) => a + (s.sessions?.length || 0), 0);
        const isCurrent =
          !!currentLevel && currentLevel.toUpperCase().startsWith(lvl.code.toUpperCase());
        return (
          <div key={lvl.code} className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <button
              onClick={() => setOpenLevel(levelOpen ? null : lvl.code)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#16796E]/10 text-[13px] font-extrabold text-[#16796E]">
                {lvl.code}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[14px] font-extrabold text-[#12172B]">{lvl.name}</span>
                  {isCurrent ? (
                    <span className="shrink-0 rounded-full bg-[#F2CB05]/25 px-2 py-0.5 text-[10px] font-bold text-[#9A7400]">
                      Level kamu
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-[12px] font-medium text-gray-400">
                  {lvl.sublevels.length} chapter · {totalSesi} sesi
                </span>
              </span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-slate-300 transition-transform ${levelOpen ? "rotate-180" : ""}`}
                strokeWidth={2}
              />
            </button>

            {levelOpen ? (
              <div className="border-t border-slate-100 px-3 pb-3 pt-1">
                {lvl.sublevels.map((sub, si) => {
                  const subOpen = openSub === sub.code;
                  return (
                    <div key={sub.code} className="mt-2 overflow-hidden rounded-xl border border-slate-100">
                      <button
                        onClick={() => setOpenSub(subOpen ? null : sub.code)}
                        className="flex w-full items-center gap-3 bg-white px-3.5 py-3 text-left transition hover:bg-slate-50"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-[10px] font-bold uppercase tracking-wide text-gray-400">
                            Chapter {si + 1} · {sub.code}
                          </span>
                          <span className="block truncate text-[13.5px] font-bold text-[#12172B]">{sub.name}</span>
                        </span>
                        <span className="shrink-0 text-[11px] font-semibold text-gray-400">
                          {sub.sessions?.length || 0} sesi
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-slate-300 transition-transform ${subOpen ? "rotate-180" : ""}`}
                          strokeWidth={2}
                        />
                      </button>
                      {subOpen ? (
                        <ol className="border-t border-slate-100 bg-[#F5F6F8]/50 px-2 py-1.5">
                          {(sub.sessions || []).map((s) => (
                            <li key={s.number}>
                              <button
                                onClick={() => setOpenSession({ s, subCode: sub.code, levelName: lvl.name })}
                                className="group flex w-full items-center gap-3 rounded-lg px-1.5 py-2 text-left transition hover:bg-white"
                              >
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-extrabold text-[#16796E] ring-1 ring-[#16796E]/15">
                                  {s.number}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-[#12172B]">{s.title}</span>
                                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-[#16796E]" strokeWidth={2} />
                              </button>
                            </li>
                          ))}
                        </ol>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <a
          href={`/silabus/${slug}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-[12px] font-bold text-[#12172B] transition hover:border-[#16796E]/30 hover:text-[#16796E]"
        >
          <BookOpen className="h-4 w-4" strokeWidth={2} />
          Silabus lengkap{languageLabel ? ` ${languageLabel}` : ""}
        </a>
        {showPlacementTest ? (
          <a
            href={`/silabus/${slug}/coba`}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-[12px] font-bold text-[#12172B] transition hover:border-[#16796E]/30 hover:text-[#16796E]"
          >
            <Target className="h-4 w-4" strokeWidth={2} />
            Placement Test
          </a>
        ) : null}
      </div>

      {openSession ? (
        <div
          onClick={() => setOpenSession(null)}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-[#12172B]/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-[0_24px_60px_-20px_rgba(18,23,43,0.5)] sm:rounded-3xl sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#16796E]/10 text-[13px] font-extrabold text-[#16796E]">
                {openSession.s.number}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                  {openSession.levelName} · Sesi {openSession.s.number} · {openSession.subCode}
                </p>
                <h3 className="mt-0.5 text-[16px] font-extrabold leading-snug text-[#12172B]">{openSession.s.title}</h3>
              </div>
              <button
                onClick={() => setOpenSession(null)}
                aria-label="Tutup"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-slate-100 hover:text-[#12172B]"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            {openSession.s.topics && openSession.s.topics.length ? (
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Yang dipelajari</p>
                <ul className="mt-2 space-y-1.5">
                  {openSession.s.topics.map((t, i) => (
                    <li key={i} className="flex gap-2.5 text-[13px] font-medium leading-snug text-gray-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#16796E]" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {lessonState.status === "loading" ? (
              <div className="mt-5 flex items-center justify-center rounded-xl border border-slate-100 bg-[#F5F6F8]/60 py-6">
                <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
              </div>
            ) : lessonState.status === "found" ? (
              <div className="mt-5 rounded-2xl border border-[#16796E]/20 bg-[#16796E]/5 p-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#16796E] text-white">
                    <BookOpen className="h-4 w-4" strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-extrabold text-[#0F5A52]">Pelajaran interaktif tersedia</p>
                    <p className="text-[11.5px] font-medium text-[#16796E]">
                      {[
                        lessonState.hasAudio ? "Audio" : null,
                        lessonState.hasMateri ? "Materi" : null,
                        lessonState.quizCount ? `${lessonState.quizCount} soal kuis` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Materi belajar"}
                    </p>
                  </div>
                </div>
                {onOpen ? (
                  <button
                    onClick={() => onOpen(lessonState.lessonId)}
                    className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#16796E] text-[13px] font-bold text-white transition hover:bg-[#0F5A52]"
                  >
                    Mulai belajar <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                ) : (
                  <a
                    href={`/akun/belajar/${lessonState.lessonId}`}
                    className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#16796E] text-[13px] font-bold text-white transition hover:bg-[#0F5A52]"
                  >
                    Mulai belajar <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                  </a>
                )}
              </div>
            ) : mode === "selfpaced" ? (
              <div className="mt-5 space-y-2">
                <ContentSlot icon={Video} label="Video pelajaran" hint="Materi interaktif sesi ini" />
                <ContentSlot icon={FileText} label="Materi &amp; kosakata" hint="Bacaan, gloss, contoh kalimat" />
                <ContentSlot icon={ClipboardList} label="Latihan &amp; kuis" hint="Pilihan ganda + isian rumpang" />
                <p className="px-1 pt-1 text-[11.5px] font-medium leading-snug text-gray-400">
                  Pelajaran interaktif buat sesi ini lagi disiapin — pantau terus, ya.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-2">
                <ContentSlot icon={Video} label="Rekaman / video sesi" hint="Link Google Drive / Zoom recording" />
                <ContentSlot icon={FileText} label="File materi" hint="PDF / slide — berupa link" />
                <ContentSlot icon={ClipboardList} label="Latihan & kuis" hint="Pilihan ganda + isian rumpang" />
                <p className="px-1 pt-1 text-[11.5px] font-medium leading-snug text-gray-400">
                  Buat kelas live, rekaman &amp; materi sesi nyata ada di tab <span className="font-bold text-gray-500">Sesi &amp; Rekaman</span>.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {showOverview && data.overview ? (
        <div
          onClick={() => setShowOverview(false)}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-[#12172B]/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-[0_24px_60px_-20px_rgba(18,23,43,0.5)] sm:rounded-3xl sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#16796E]/10 text-[#16796E]">
                <BookOpen className="h-4 w-4" strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Tentang bahasa ini</p>
                <h3 className="mt-0.5 text-[16px] font-extrabold leading-snug text-[#12172B]">
                  {languageLabel || "Deskripsi bahasa"}
                </h3>
              </div>
              <button
                onClick={() => setShowOverview(false)}
                aria-label="Tutup"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-slate-100 hover:text-[#12172B]"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <p className="mt-4 whitespace-pre-line text-[13.5px] font-medium leading-relaxed text-gray-700">
              {data.overview}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
