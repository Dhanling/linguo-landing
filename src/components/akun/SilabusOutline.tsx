"use client";

import { useEffect, useState } from "react";
import { BookOpen, ChevronDown, Target, Loader2, ArrowRight } from "lucide-react";

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
};

export default function SilabusOutline({
  slug,
  languageLabel = "",
  currentLevel,
  showPlacementTest = true,
}: Props) {
  const [data, setData] = useState<Curriculum | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [openLevel, setOpenLevel] = useState<string | null>(null);
  const [openSub, setOpenSub] = useState<string | null>(null);

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
        const base = currentLevel ? currentLevel.toUpperCase().replace(/\..*$/, "") : "";
        const lvl =
          cur.levels.find((l) => l.code.toUpperCase() === base) || cur.levels[0];
        setOpenLevel(lvl?.code ?? null);
        setOpenSub(lvl?.sublevels?.[0]?.code ?? null);
        setData(cur);
        setState("ready");
      })
      .catch(() => {
        if (alive) setState("error");
      });
    return () => {
      alive = false;
    };
  }, [slug, currentLevel]);

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

  return (
    <div className="flex flex-col gap-4">
      {data.overview ? (
        <p className="rounded-2xl bg-[#16796E]/5 px-4 py-3 text-[12.5px] font-medium leading-relaxed text-gray-600 line-clamp-3">
          {data.overview}
        </p>
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
                        <ol className="border-t border-slate-100 bg-[#F5F6F8]/50 px-3.5 py-1.5">
                          {(sub.sessions || []).map((s) => (
                            <li key={s.number} className="flex gap-3 py-2">
                              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-extrabold text-[#16796E] ring-1 ring-[#16796E]/15">
                                {s.number}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-[13px] font-bold leading-snug text-[#12172B]">{s.title}</span>
                                {s.topics && s.topics.length ? (
                                  <span className="mt-0.5 block text-[11.5px] font-medium leading-snug text-gray-500 line-clamp-2">
                                    {s.topics.join(" · ")}
                                  </span>
                                ) : null}
                              </span>
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
    </div>
  );
}
