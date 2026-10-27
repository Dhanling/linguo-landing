"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, ChartNoAxesColumnIncreasing, Clock3, Users, Target } from "lucide-react";
import type { LanguageCurriculum, SessionPreview } from "@/data/curriculum";
import { LangSlugFlag } from "@/components/RectFlag";

const labels = { A1: "Pemula", A2: "Pra-Menengah", B1: "Menengah", B2: "Menengah Atas" };

// Aset imagegen dipilih berdasarkan topik; A1.1 memiliki ilustrasi khusus setiap sesi.
const firstChapterArt = ["alphabet", "greetings", "introducing", "numbers", "calendar", "colors", "family", "articles", "pronouns", "tobe-positive", "tobe-questions", "prices", "time", "food", "classroom", "review"];
function artForTitle(title: string) {
  const t = title.toLowerCase();
  const themes: [RegExp, string][] = [
    [/number|count|price|money|shop|market/, "prices"],
    [/alphabet|pronunciation|spell/, "alphabet"],
    [/greet|hello|goodbye/, "greetings"], [/introduc|personal|identity/, "introducing"],
    [/time|routine|frequency/, "time"], [/day|month|calendar|plan|future/, "calendar"],
    [/color|adjective|compar|superlat|clothes|fashion/, "colors"],
    [/family|friend|relationship|people/, "family"], [/article|noun|object/, "articles"],
    [/pronoun|possessive/, "pronouns"], [/question|negative|modal|advice/, "tobe-questions"],
    [/verb|tense|past|present|conditional|passive|grammar/, "tobe-positive"],
    [/food|drink|cook|restaurant|meal/, "food"], [/class|school|study|education|learn/, "classroom"],
  ];
  return themes.find(([pattern]) => pattern.test(t))?.[1] ?? "review";
}
function SessionArt({ title, index = 0, hero = false, chapterCode }: { title: string; index?: number; hero?: boolean; chapterCode?: string }) {
  const key = hero ? "hero" : chapterCode === "A1.1" ? firstChapterArt[index] : artForTitle(title);
  return <img src={`/images/silabus/english-round-eyes/${key}.webp`} alt="" width={hero ? 960 : 480} height={hero ? 640 : 320} loading={hero ? "eager" : "lazy"} fetchPriority={hero ? "high" : "auto"} className="h-full w-full object-cover" />;
}

function SessionCard({ session, index, chapterCode }: { session: SessionPreview; index: number; chapterCode: string }) {
  const [expanded, setExpanded] = useState(false);
  const topics = session.topics ?? [];
  const id = `english-session-${session.number}-${index}`;
  return <li className="group relative hover:z-10 focus-within:z-10">
    <div className="overflow-hidden rounded-[22px] border border-white bg-white shadow-[0_4px_20px_#164e6310] transition-transform duration-300 ease-out motion-safe:group-hover:scale-[1.025] motion-safe:group-focus-within:scale-[1.025]">
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      aria-expanded={expanded}
      aria-controls={id}
      className="grid w-full grid-cols-[28px_minmax(0,1fr)_80px] items-center gap-x-2 gap-y-3 p-3 text-left focus-visible:outline-2 focus-visible:outline-[#1A9E9E] min-[400px]:grid-cols-[32px_minmax(0,1fr)_104px] sm:grid-cols-[44px_minmax(0,1fr)_31%] sm:gap-x-4"
    >
      <span className="col-start-1 row-start-1 self-start rounded-full bg-[#E6F7F4] py-2 text-center text-xs font-bold text-[#1A9E9E] sm:row-span-2 sm:py-3 sm:text-sm">{String(index + 1).padStart(2, "0")}</span>
      <span className="col-start-2 row-start-1 min-w-0 break-words text-sm font-bold leading-snug text-slate-900 sm:text-base">{session.title}</span>
      <span className="col-start-3 row-start-1 block overflow-hidden rounded-xl sm:row-span-2 sm:rounded-2xl"><SessionArt title={session.title} index={index} chapterCode={chapterCode}/></span>
      <span className="col-span-3 row-start-2 min-w-0 sm:col-span-1 sm:col-start-2">
        <span className="block text-xs leading-relaxed text-slate-500">{topics.length ? topics.slice(0, 2).join(" · ") : "Latihan dan praktik bahasa Inggris bersama pengajar."}</span>
        <span className="mt-2 flex flex-wrap gap-1">{topics.slice(0, 2).map(topic => <span key={topic} className="rounded-full bg-[#F0F6F8] px-2 py-1 text-[10px] text-slate-500">{topic}</span>)}</span>
      </span>
    </button>
    <div id={id} hidden={!expanded} className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-600">{topics.length ? <ul className="list-disc space-y-1 pl-5">{topics.map(topic => <li key={topic}>{topic}</li>)}</ul> : "Materi, latihan, dan praktik sesi ini dibahas langsung bersama pengajar di kelas."}</div>
    </div>
  </li>;
}

export default function EnglishCurriculum({ curriculum }: { curriculum: LanguageCurriculum }) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [chapterIndex, setChapterIndex] = useState(0);
  const level = curriculum.levels[levelIndex];
  const chapter = level.sublevels[chapterIndex];
  const total = curriculum.levels.reduce((sum, l) => sum + l.sublevels.reduce((n, c) => n + c.sessions.length, 0), 0);
  return <main className="min-h-screen bg-[#F1F9F9] px-3 pb-12 pt-4 text-slate-900 sm:px-4 md:px-8 md:pb-20 md:pt-28">
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-white p-4 shadow-[0_12px_60px_#1a9e9e08] sm:p-6 md:p-10">
        <Link href="/silabus" className="mb-4 inline-flex md:mb-7 items-center gap-2 text-sm text-slate-500 hover:text-[#1A9E9E]"><ArrowLeft size={16}/>Semua silabus</Link>
        <div className="grid items-center gap-5 md:gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div><div className="mb-4 flex items-center gap-3 md:mb-5 md:gap-5"><LangSlugFlag slug="english" h={58} className="max-sm:!h-10 max-sm:!w-auto"/><div><p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Silabus</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl md:text-5xl">Bahasa Inggris</h1><p className="mt-1 text-lg italic text-slate-500">English</p></div></div>
            <p className="max-w-2xl text-sm leading-7 text-slate-500 md:text-base">{curriculum.overview}</p>
            <div className="mt-6 flex flex-wrap gap-3"><Link href="/daftar/inggris" className="inline-flex items-center gap-3 rounded-full bg-[#1A9E9E] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-teal-600/15 hover:bg-[#147a7a]">Mulai Belajar Bahasa Inggris<ArrowRight size={20}/></Link><Link href="/silabus/english/coba" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"><Target size={19}/>Placement Test</Link></div>
          </div><div className="mx-auto w-full max-w-sm lg:max-w-none"><SessionArt title="English" hero/></div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-4">{[{ Icon: ChartNoAxesColumnIncreasing, title: "Struktur lengkap", detail: `A1–B2 (${total} sesi)` }, { Icon: BookOpen, title: "Standar internasional", detail: "Kurikulum berbasis CEFR" }, { Icon: Users, title: "Mulai dari levelmu", detail: "Pemula hingga menengah atas" }, { Icon: Clock3, title: "Belajar fleksibel", detail: "Private atau kelas reguler" }].map(({ Icon, title, detail }) => <div key={title} className="flex items-center gap-3"><span className="rounded-2xl bg-[#ECF9F7] p-3 text-[#1A9E9E]"><Icon size={21}/></span><p className="text-xs leading-5 text-slate-500">{title}<span className="block">{detail}</span></p></div>)}</div>
      </section>
      <section className="rounded-[28px] bg-white p-4 shadow-[0_12px_60px_#1a9e9e08] md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[#1A9E9E]"/><h2 className="text-xl font-bold md:text-2xl">{labels[level.code]} {level.code}</h2></div><label className="flex items-center gap-2 text-sm text-slate-500">Pilih level<select value={levelIndex} onChange={e => { setLevelIndex(Number(e.target.value)); setChapterIndex(0); }} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-800">{curriculum.levels.map((l, i) => <option key={l.code} value={i}>{labels[l.code]} {l.code}</option>)}</select></label></div>
        <p className="mt-2 text-sm leading-6 text-slate-500">{level.description}</p>
        <div className="my-5 flex flex-wrap gap-2" aria-label="Pilih chapter">{level.sublevels.map((c, i) => <button key={c.code} type="button" aria-pressed={chapterIndex === i} onClick={() => setChapterIndex(i)} className={`rounded-full border px-6 py-2.5 text-sm font-semibold transition-colors ${chapterIndex === i ? "border-[#1A9E9E] bg-[#1A9E9E] text-white" : "border-slate-200 text-slate-500 hover:border-[#1A9E9E]"}`}>{c.code}</button>)}</div>
        <div className="rounded-[22px] border border-slate-100 bg-[#F3F8F9] p-3 md:p-4">
          <div className="flex flex-wrap items-center justify-between gap-4 px-2 pb-5 pt-2"><div><p className="text-xs font-bold uppercase tracking-wider text-[#1A9E9E]">Chapter {chapterIndex + 1}</p><h3 className="mt-1 text-2xl font-bold">{chapter.name}</h3><p className="mt-2 text-xs text-slate-500">{chapter.sessions.length} sesi · {chapter.code} · Pilih kartu untuk lihat topik sesi</p></div></div>
          <ol key={chapter.code} className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">{chapter.sessions.map((session, i) => <SessionCard key={session.number} session={session} index={i} chapterCode={chapter.code}/>)}</ol>
        </div>
        <div className="mt-6 flex justify-end"><Link href="/daftar/inggris" className="inline-flex items-center gap-2 rounded-full bg-[#1A9E9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#147a7a]">Belajar bareng pengajar<ChevronRight size={17}/></Link></div>
      </section>
    </div>
  </main>;
}
