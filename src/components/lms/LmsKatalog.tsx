"use client";

// [linguo-patch:lms-katalog-masterdetail-v2]
// Belajar Mandiri jadi 2-partisi (master-detail) nyamain frame "Kelas Live":
// KIRI = daftar bahasa self-study yg ke-seed di lms_modules (chip Semua/Berjalan/Selesai)
// KANAN = detail bahasa kepilih (hero foto + progress + resume) + SilabusOutline (selfpaced)

import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2, PlayCircle, GraduationCap } from "lucide-react";
import SilabusOutline from "@/components/akun/SilabusOutline";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TEAL = "#16796E";
const TEAL_DEEP = "#0F5A52";
const YELLOW = "#F2CB05";

// native name + label ID + glyph per bahasa (fallback ke generic kalau ga ada)
const META: Record<string, { native: string; id: string; glyph: string }> = {
  vietnamese: { native: "Tiếng Việt", id: "Bahasa Vietnam", glyph: "Vi" },
  english:    { native: "English",     id: "Bahasa Inggris", glyph: "EN" },
  japanese:   { native: "日本語",       id: "Bahasa Jepang",  glyph: "あ" },
  korean:     { native: "한국어",       id: "Bahasa Korea",   glyph: "한" },
  mandarin:   { native: "中文",         id: "Bahasa Mandarin", glyph: "中" },
  arabic:     { native: "العربية",      id: "Bahasa Arab",    glyph: "ع" },
  russian:    { native: "Русский",      id: "Bahasa Rusia",   glyph: "Я" },
  german:     { native: "Deutsch",      id: "Bahasa Jerman",  glyph: "DE" },
  french:     { native: "Français",     id: "Bahasa Prancis", glyph: "FR" },
  spanish:    { native: "Español",      id: "Bahasa Spanyol", glyph: "ES" },
};

function meta(language: string) {
  const slug = language.toLowerCase().replace(/\s+/g, "-");
  const m = META[slug];
  return {
    slug,
    native: m?.native || language,
    id: m?.id || `Bahasa ${language}`,
    glyph: m?.glyph || language.slice(0, 2).toUpperCase(),
  };
}

type Course = {
  language: string;
  slug: string;
  native: string;
  idLabel: string;
  glyph: string;
  total: number;
  done: number;
  pct: number;
  resume: { id: string; title: string } | null;
};

export default function LmsKatalog({ onOpen, topBar }: { onOpen?: (lessonId: string) => void; topBar?: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sel, setSel] = useState<string>(""); // selected slug
  const [filter, setFilter] = useState<"all" | "run" | "done">("all");

  useEffect(() => {
    let alive = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // module (id -> language) + urutan
      const { data: mods } = await supabase
        .from("lms_modules")
        .select("id,language,sort_order")
        .order("sort_order");
      const modList = (mods || []) as { id: string; language: string; sort_order: number }[];
      if (modList.length === 0) {
        if (alive) { setCourses([]); setLoading(false); }
        return;
      }

      const langByModule: Record<string, string> = {};
      modList.forEach((m) => { langByModule[m.id] = m.language; });
      const moduleIds = modList.map((m) => m.id);

      const { data: less } = await supabase
        .from("lms_lessons")
        .select("id,module_id,title,sort_order")
        .in("module_id", moduleIds)
        .order("sort_order");
      const lessons = (less || []) as { id: string; module_id: string; title: string; sort_order: number }[];

      let done = new Set<string>();
      if (user) {
        const { data: prog } = await supabase
          .from("lms_progress")
          .select("lesson_id,status")
          .eq("user_id", user.id);
        done = new Set<string>(
          (prog || []).filter((p: any) => p.status === "completed").map((p: any) => p.lesson_id)
        );
      }

      // urutan module utk resume: pakai sort_order module lalu lesson
      const moduleOrder: Record<string, number> = {};
      modList.forEach((m, i) => { moduleOrder[m.id] = m.sort_order ?? i; });

      // group lessons per language
      const byLang: Record<string, { id: string; module_id: string; sort_order: number; title: string }[]> = {};
      lessons.forEach((l) => {
        const lang = langByModule[l.module_id];
        if (!lang) return;
        (byLang[lang] = byLang[lang] || []).push(l);
      });

      // urutan bahasa = urutan kemunculan pertama di modList
      const langOrder: string[] = [];
      modList.forEach((m) => { if (!langOrder.includes(m.language)) langOrder.push(m.language); });

      const built: Course[] = langOrder.map((language) => {
        const mt = meta(language);
        const ls = (byLang[language] || []).slice().sort((a, b) => {
          const mo = (moduleOrder[a.module_id] ?? 0) - (moduleOrder[b.module_id] ?? 0);
          return mo !== 0 ? mo : a.sort_order - b.sort_order;
        });
        const total = ls.length;
        const dcount = ls.filter((l) => done.has(l.id)).length;
        const next = ls.find((l) => !done.has(l.id));
        return {
          language,
          slug: mt.slug,
          native: mt.native,
          idLabel: mt.id,
          glyph: mt.glyph,
          total,
          done: dcount,
          pct: total ? Math.round((dcount / total) * 100) : 0,
          resume: next ? { id: next.id, title: next.title } : null,
        };
      });

      if (!alive) return;
      setCourses(built);
      setSel(built[0]?.slug || "");
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-slate-100 bg-white py-16">
        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-[0_24px_50px_-34px_rgba(18,23,43,0.5)]">
        <GraduationCap className="mx-auto mb-2 h-12 w-12 text-slate-300" strokeWidth={1.5} />
        <p className="text-[14px] font-semibold text-gray-600">Materi mandiri belum tersedia</p>
        <p className="mt-1 text-[12px] font-medium text-gray-400">Konten Belajar Mandiri lagi disiapin. Cek tab Jelajahi Bahasa dulu ya.</p>
      </div>
    );
  }

  const shown = courses.filter((c) => {
    if (filter === "run") return c.pct < 100;
    if (filter === "done") return c.pct >= 100;
    return true;
  });
  const selected = shown.find((c) => c.slug === sel) || shown[0] || courses[0];

  const CourseItem = ({ c, mobile }: { c: Course; mobile?: boolean }) => {
    const isSel = selected && c.slug === selected.slug;
    return (
      <button
        onClick={() => setSel(c.slug)}
        className={`group flex items-center gap-3 rounded-2xl p-3 text-left transition ${isSel ? "bg-white shadow-[0_16px_36px_-22px_rgba(18,23,43,0.55)] ring-2 ring-[#16796E]" : "hover:bg-[#F5F6F8]"} ${mobile ? "w-[240px] shrink-0 border border-slate-100 bg-white" : "w-full"}`}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#16796E]/10 text-xl font-extrabold text-[#16796E]">{c.glyph}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-extrabold text-[#12172B]">{c.native}</span>
          <span className="block truncate text-[12px] font-medium text-gray-500">{c.idLabel} · self-paced</span>
          <span className="mt-2 flex items-center gap-2">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8EAEE]"><span className="block h-full rounded-full bg-[#16796E]" style={{ width: `${c.pct}%` }} /></span>
            <span className="text-[11px] font-bold text-gray-500">{c.pct}%</span>
          </span>
        </span>
      </button>
    );
  };

  const startLabel = selected.done === 0 ? "Mulai belajar" : "Lanjutkan";
  const photo = `/lang/${selected.slug}.jpg`;

  const ResumeBtn = ({ block }: { block?: boolean }) =>
    selected.resume ? (
      onOpen ? (
        <button
          onClick={() => onOpen(selected.resume!.id)}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold ${block ? "w-full" : ""}`}
          style={{ background: YELLOW, color: TEAL_DEEP }}
        >
          <PlayCircle className="h-4 w-4" />
          {startLabel}
        </button>
      ) : (
        <a
          href={`/akun/belajar/${selected.resume.id}`}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold ${block ? "w-full" : ""}`}
          style={{ background: YELLOW, color: TEAL_DEEP }}
        >
          <PlayCircle className="h-4 w-4" />
          {startLabel}
        </a>
      )
    ) : null;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_24px_50px_-34px_rgba(18,23,43,0.5)] lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:h-[560px]">

      {/* LEFT list — desktop */}
      <aside className="hidden min-h-0 flex-col border-r border-slate-100 bg-white lg:flex">
        <div className="shrink-0 px-6 pb-4 pt-7">
          <h2 className="text-[18px] font-extrabold text-[#12172B]">Bahasa Kamu</h2>
          <p className="mt-0.5 text-[12px] font-medium text-gray-500">{courses.length} bahasa · belajar mandiri</p>
          <div className="mt-4 flex gap-2">
            {([["all", "Semua"], ["run", "Berjalan"], ["done", "Selesai"]] as const).map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k)} className={`h-8 rounded-full px-3 text-[12px] font-bold transition ${filter === k ? "bg-[#16796E] text-white" : "bg-[#F5F6F8] text-gray-500 hover:text-[#12172B]"}`}>{label}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2.5 overflow-y-auto px-4 pb-6">
          {shown.length > 0 ? shown.map((c) => <CourseItem key={c.slug} c={c} />) : (
            <p className="px-2 py-6 text-center text-[13px] font-medium text-gray-400">Tidak ada bahasa di filter ini</p>
          )}
        </div>
      </aside>

      {/* RIGHT detail (+ mobile pills) */}
      <main className="flex min-w-0 flex-col bg-[#F5F6F8] lg:overflow-y-auto">
        {topBar}
        <div className="flex gap-2.5 overflow-x-auto px-5 pt-3 lg:hidden">
          {shown.map((c) => <CourseItem key={c.slug} c={c} mobile />)}
        </div>

        <div className="flex flex-col gap-6 px-5 pb-5 pt-4 lg:px-7 lg:pb-7">
          {/* hero */}
          <div className="overflow-hidden rounded-3xl bg-white shadow-[0_24px_50px_-34px_rgba(18,23,43,0.5)]">
            <div className="relative flex items-center gap-5 overflow-hidden px-6 py-6 sm:px-7" style={{ background: TEAL }}>
              <img src={photo} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(105deg, rgba(15,71,65,0.88) 0%, rgba(22,121,110,0.66) 46%, rgba(22,121,110,0.28) 100%)" }} />
              <span className="relative z-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-[40px] font-extrabold leading-none text-white">{selected.glyph}</span>
              <div className="relative z-10 min-w-0 flex-1 text-white">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold">Belajar Mandiri</span>
                <h2 className="mt-2 text-[22px] font-extrabold leading-tight">{selected.native}</h2>
                <p className="mt-1 text-[13px] font-medium text-white/85">{selected.idLabel} · CEFR A1–B2</p>
              </div>
              <div className="relative z-10 ml-2 hidden shrink-0 sm:block">
                <ResumeBtn />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 px-6 py-5 sm:px-7">
              <div>
                <p className="text-[12px] font-semibold text-gray-500">Progress</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#E8EAEE]"><span className="block h-full rounded-full bg-[#16796E]" style={{ width: `${selected.pct}%` }} /></span>
                  <span className="text-[13px] font-extrabold text-[#12172B]">{selected.pct}%</span>
                </div>
              </div>
              <div className="border-l border-slate-100 pl-4">
                <p className="text-[12px] font-semibold text-gray-500">Sesi Selesai</p>
                <p className="mt-1 text-[18px] font-extrabold text-[#12172B]">{selected.done}<span className="text-[14px] font-bold text-gray-400">/{selected.total}</span></p>
              </div>
              <div className="border-l border-slate-100 pl-4">
                <p className="text-[12px] font-semibold text-gray-500">Akses</p>
                <p className="mt-1.5 text-[13px] font-bold leading-tight text-[#12172B]">Selamanya · kapan aja</p>
              </div>
            </div>
            {/* resume — mobile (banner btn ke-hide di < sm) */}
            <div className="px-6 pb-5 sm:hidden">
              <ResumeBtn block />
            </div>
          </div>

          {/* roadmap penuh — renderer sama persis kayak Kelas Live (DRY) */}
          <SilabusOutline
            slug={selected.slug}
            languageLabel={selected.language}
            currentLevel="A1"
            mode="selfpaced"
          />
        </div>
      </main>
    </div>
  );
}
