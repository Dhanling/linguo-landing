"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, ChevronRight, ChartNoAxesColumnIncreasing, Clock3, Users, Target, Plus, Minus } from "lucide-react";
import type { LanguageCurriculum, SessionPreview } from "@/data/curriculum";
import { LangSlugFlag } from "@/components/RectFlag";

const labels = { A1: "Pemula", A2: "Pra-Menengah", B1: "Menengah", B2: "Menengah Atas" };

// Ilustrasi SVG ringan: objek mengikuti topik, dengan karakter dan palet yang konsisten.
function SessionArt({ title, index = 0, hero = false }: { title: string; index?: number; hero?: boolean }) {
  const t = title.toLowerCase();
  const word = hero ? "Hello!" : /number|count|time|date/.test(t) ? "123" : /alphabet|pronunciation|spell/.test(t) ? "ABC" : /greet|hello|introduc/.test(t) ? "Hello!" : /food|cook|eat|restaurant/.test(t) ? "Menu" : /travel|transport|direction/.test(t) ? "Let's go!" : /work|job|career|business/.test(t) ? "Ideas!" : /family|friend|people/.test(t) ? "Together" : /review|test|exam/.test(t) ? "You did it!" : /past|future|tense|grammar/.test(t) ? "Yesterday" : /read|write|story/.test(t) ? "Stories" : "Let's talk!";
  const warm = index % 3 === 0;
  const numbers = /number|count|price/.test(t);
  const clock = /time|day|month|routine/.test(t);
  const food = /food|drink|restaurant|market/.test(t);
  const alphabet = /alphabet|pronunciation/.test(t);
  return <svg viewBox="0 0 260 180" fill="none" aria-hidden="true" className="h-full w-full">
    <rect width="260" height="180" rx="20" fill={warm ? "#FFF4E4" : "#E6F5F5"} />
    <circle cx="176" cy="91" r="76" fill={warm ? "#FFE8C5" : "#D0ECEB"} />
    {hero && <g fill="#AACFD5"><path d="M209 139V48h25v91zM215 48V29h13v19zM219 29l3-17 3 17"/><circle cx="222" cy="65" r="8" fill="white"/><path d="M30 143V85h28v58M35 85V70h5v15M48 85V64h5v21"/></g>}
    <path d="M17 177q-1-39 10-62 21 29 6 62M29 168q7-43 26-47 0 34-26 47" fill="#70B8A5"/><path d="M224 178q-8-33 8-57 10 35-1 57M232 166q3-30 22-38-1 34-22 38" fill="#94C9AF"/>
    <rect x="23" y="22" width="118" height="48" rx="19" fill={warm ? "#1A9E9E" : "#348CBA"}/><path d="M105 66l16 16-2-19" fill={warm ? "#1A9E9E" : "#348CBA"}/>
    <text x="82" y="53" textAnchor="middle" fill="white" fontSize={word.length > 9 ? 15 : 22} fontWeight="800" fontFamily="sans-serif">{word}</text>
    <path d="M123 152q-24-37-8-69 1-33 37-34 40-4 44 40 18 32-2 65" fill="#19354E"/>
    <path d="M101 180q-2-52 47-53 48-2 53 53" fill={index % 2 ? "#F3B842" : "#1A9E9E"}/>
    <rect x="144" y="114" width="18" height="25" rx="8" fill="#EEAA82"/>
    <ellipse cx="153" cy="94" rx="28" ry="34" fill="#FFC9A1"/>
    <path d="M124 92q-8-37 26-36 25-6 32 29-24-3-31-20-7 21-27 27" fill="#19354E"/>
    <ellipse cx="142" cy="97" rx="2.5" ry="4" fill="#19354E"/><ellipse cx="165" cy="97" rx="2.5" ry="4" fill="#19354E"/>
    <path d="M146 111q8 8 16-1" stroke="#B35F4A" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="134" cy="107" r="5" fill="#F4AC90"/><circle cx="173" cy="107" r="5" fill="#F4AC90"/>
    {hero || /work|write|read|study|review/.test(t) ? <g><path d="M69 139h78l14 38H80z" fill="#8DA8B6"/><path d="M74 143h69l11 30H83z" fill="#B3C8D0"/><rect x="71" y="175" width="113" height="5" rx="2" fill="#627F90"/></g> : <g><path d="M111 166l-21-25" stroke="#FFC9A1" strokeWidth="12" strokeLinecap="round"/><path d="M90 143l-5-18m6 13 1-16m-2 17-12-11" stroke="#FFC9A1" strokeWidth="5" strokeLinecap="round"/><path d="M185 166l19-24" stroke="#FFC9A1" strokeWidth="12" strokeLinecap="round"/></g>}
    {!hero && <g>
      {(numbers || alphabet) && <g fontFamily="sans-serif" fontWeight="900" fontSize="32"><text x="26" y="115" fill="#EC796C" transform="rotate(-10 26 115)">{numbers ? "1" : "A"}</text><text x="52" y="100" fill="#EAB34D">{numbers ? "2" : "B"}</text><text x="78" y="119" fill="#1A9E9E" transform="rotate(12 78 119)">{numbers ? "3" : "C"}</text></g>}
      {clock && <g><circle cx="63" cy="111" r="25" fill="white" stroke="#1A9E9E" strokeWidth="4"/><path d="M63 95v17l12 8" stroke="#19354E" strokeWidth="3" strokeLinecap="round"/><circle cx="63" cy="111" r="3" fill="#EAB34D"/></g>}
      {food && <g><ellipse cx="62" cy="119" rx="31" ry="12" fill="white"/><path d="M38 115a24 24 0 0148 0" fill="#EAB34D"/><path d="M54 79q-8 9 0 16m15-20q-8 9 0 16" stroke="#1A9E9E" strokeWidth="3" strokeLinecap="round"/></g>}
      {!numbers && !alphabet && !clock && !food && <g><path d="M31 91q18-6 33 5 16-11 33-5v38q-18-5-33 5-17-10-33-5z" fill="white" stroke="#8DC3BF" strokeWidth="2"/><path d="M64 96v38M39 103l16 3m-16 6 16 3m17-12 16-3m-16 12 16-3" stroke="#8DC3BF" strokeWidth="2"/></g>}
    </g>}
    <path d="M216 22v12m-6-6h12M19 91v10m-5-5h10" stroke="#EDB84C" strokeWidth="3" strokeLinecap="round"/>
  </svg>;
}

function SessionCard({ session, index }: { session: SessionPreview; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const topics = session.topics ?? [];
  const id = `english-session-${session.number}-${index}`;
  return <li className="overflow-hidden rounded-[22px] border border-white bg-white shadow-[0_4px_20px_#164e6310]">
    <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-controls={id} className="group flex w-full items-center gap-3 p-3 text-left focus-visible:outline-2 focus-visible:outline-[#1A9E9E] sm:gap-4">
      <span className="self-start rounded-full bg-[#E6F7F4] px-3 py-3 text-sm font-bold text-[#1A9E9E]">{String(index + 1).padStart(2, "0")}</span>
      <span className="min-w-0 flex-1 py-2"><span className="block text-sm font-bold leading-snug text-slate-900 sm:text-base">{session.title}</span><span className="mt-2 block text-xs leading-relaxed text-slate-500">{topics.length ? topics.slice(0, 2).join(" · ") : "Latihan dan praktik bahasa Inggris bersama pengajar."}</span><span className="mt-3 flex flex-wrap gap-1">{topics.slice(0, 2).map(topic => <span key={topic} className="rounded-full bg-[#F0F6F8] px-2 py-1 text-[10px] text-slate-500">{topic}</span>)}</span></span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1A9E9E] text-white group-hover:bg-[#147a7a]">{expanded ? <Minus size={15}/> : <Plus size={15}/>}</span>
      <span className="hidden w-[31%] shrink-0 overflow-hidden rounded-2xl min-[400px]:block"><SessionArt title={session.title} index={index}/></span>
    </button>
    <div id={id} hidden={!expanded} className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-600">{topics.length ? <ul className="list-disc space-y-1 pl-5">{topics.map(topic => <li key={topic}>{topic}</li>)}</ul> : "Materi, latihan, dan praktik sesi ini dibahas langsung bersama pengajar di kelas."}</div>
  </li>;
}

export default function EnglishCurriculum({ curriculum }: { curriculum: LanguageCurriculum }) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [chapterIndex, setChapterIndex] = useState(0);
  const level = curriculum.levels[levelIndex];
  const chapter = level.sublevels[chapterIndex];
  const total = curriculum.levels.reduce((sum, l) => sum + l.sublevels.reduce((n, c) => n + c.sessions.length, 0), 0);
  return <main className="min-h-screen bg-[#F1F9F9] px-4 pb-20 pt-24 text-slate-900 md:px-8 md:pt-28">
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-white p-6 shadow-[0_12px_60px_#1a9e9e08] md:p-10">
        <Link href="/silabus" className="mb-7 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#1A9E9E]"><ArrowLeft size={16}/>Semua silabus</Link>
        <div className="grid items-center gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div><div className="mb-5 flex items-center gap-5"><LangSlugFlag slug="english" h={58}/><div><p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Silabus</p><h1 className="mt-1 text-3xl font-bold tracking-tight md:text-5xl">Bahasa Inggris</h1><p className="mt-1 text-lg italic text-slate-500">English</p></div></div>
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
          <div className="flex flex-wrap items-center justify-between gap-4 px-2 pb-5 pt-2"><div><p className="text-xs font-bold uppercase tracking-wider text-[#1A9E9E]">Chapter {chapterIndex + 1}</p><h3 className="mt-1 text-2xl font-bold">{chapter.name}</h3><p className="mt-2 text-xs text-slate-500">{chapter.sessions.length} sesi · {chapter.code} · Pilih kartu untuk lihat topik sesi</p></div><span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500"><BookOpen size={15}/>Silabus per sesi<ChevronDown size={14}/></span></div>
          <ol key={chapter.code} className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">{chapter.sessions.map((session, i) => <SessionCard key={session.number} session={session} index={i}/>)}</ol>
        </div>
        <div className="mt-6 flex justify-end"><Link href="/daftar/inggris" className="inline-flex items-center gap-2 rounded-full bg-[#1A9E9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#147a7a]">Belajar bareng pengajar<ChevronRight size={17}/></Link></div>
      </section>
    </div>
  </main>;
}
