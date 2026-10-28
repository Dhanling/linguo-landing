"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronRight, ChartNoAxesColumnIncreasing, Clock3, Users, Target } from "lucide-react";
import type { LanguageCurriculum, SessionPreview } from "@/data/curriculum";
import { displayLangTitle } from "@/data/curriculum/languages";
import { daftarSlugFromLanguageSlug } from "@/lib/funnelRouting";
import { SILABUS_SCENES, sceneForSession } from "@/lib/silabusScene";
import PadananUjianBadge from "@/components/PadananUjianBadge";
import { LangSlugFlag } from "@/components/RectFlag";
import LanguageSwitcher from "./LanguageSwitcher";

const labels = { A1: "Pemula", A2: "Pra-Menengah", B1: "Menengah", B2: "Menengah Atas" };

// Satu set adegan per bahasa, bukan potret yang diulang di semua kartu.
function SessionArt({ session, slug, hero = false, firstChapter = false, index = 0 }: {
  session?: SessionPreview; slug: string; hero?: boolean; firstChapter?: boolean; index?: number;
}) {
  const scene = hero || !session ? "hero" : sceneForSession(session);
  const specific = firstChapter && !hero;
  const cell = specific ? index : SILABUS_SCENES.indexOf(scene);
  const columns = specific ? 4 : 5;
  const folder = specific ? "first-chapter-v1" : "scenes-v1";
  return <span data-scene={specific ? `session-${index + 1}` : scene} className={`relative block aspect-[3/2] overflow-hidden bg-[#FFF9F0] ${hero ? "rounded-[28px]" : ""}`}>
    <span className="absolute -inset-[3%]">
      <img src={`/images/silabus/${folder}/${slug}.webp`} alt="" width={specific ? 1536 : 1717} height={specific ? 1024 : 916}
        loading={hero ? "eager" : "lazy"} fetchPriority={hero ? "high" : "auto"} className="absolute max-w-none"
        style={{ width: `${columns * 100}%`, height: "400%", left: `${-(cell % columns) * 100}%`, top: `${-Math.floor(cell / columns) * 100}%` }} />
    </span>
  </span>;
}

function SessionCard({ session, index, chapterCode, slug, language, firstChapter }: { session: SessionPreview; index: number; chapterCode: string; slug: string; language: string; firstChapter: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const topics = session.topics ?? [];
  const id = `${slug}-${chapterCode}-session-${session.number}-${index}`;
  return <li className="group relative hover:z-10 focus-within:z-10">
    <div className="overflow-hidden rounded-[22px] border border-white bg-white shadow-[0_4px_20px_#164e6310] transition-transform duration-300 ease-out motion-safe:group-hover:scale-[1.025] motion-safe:group-focus-within:scale-[1.025]">
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      aria-expanded={expanded}
      aria-controls={id}
      className="grid w-full grid-cols-[28px_minmax(0,1fr)_80px] items-center gap-x-2 gap-y-3 p-3 text-left focus-visible:outline-2 focus-visible:outline-[#1A9E9E] min-[400px]:grid-cols-[32px_minmax(0,1fr)_104px] sm:grid-cols-[44px_minmax(0,1fr)_31%] sm:gap-x-4"
    >
      <span className="col-start-1 row-start-1 self-start rounded-full bg-[#E6F7F4] py-2 text-center text-xs font-bold text-[#1A9E9E] sm:row-span-2 sm:py-3 sm:text-sm">{String(session.number).padStart(2, "0")}</span>
      <span className="col-start-2 row-start-1 min-w-0 break-words text-sm font-bold leading-snug text-slate-900 sm:text-base">{session.title}</span>
      <span className="col-start-3 row-start-1 block overflow-hidden rounded-xl sm:row-span-2 sm:rounded-2xl"><SessionArt session={session} slug={slug} index={index} firstChapter={firstChapter}/></span>
      <span className="col-span-3 row-start-2 min-w-0 sm:col-span-1 sm:col-start-2">
        <span className="block text-xs leading-relaxed text-slate-500">{topics.length ? topics.slice(0, 2).join(" · ") : `Latihan dan praktik ${language} bersama pengajar.`}</span>
        <span className="mt-2 flex flex-wrap gap-1">{topics.slice(0, 2).map(topic => <span key={topic} className="rounded-full bg-[#F0F6F8] px-2 py-1 text-[10px] text-slate-500">{topic}</span>)}</span>
      </span>
    </button>
    <div id={id} hidden={!expanded} className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-600">{topics.length ? <ul className="list-disc space-y-1 pl-5">{topics.map(topic => <li key={topic}>{topic}</li>)}</ul> : "Materi, latihan, dan praktik sesi ini dibahas langsung bersama pengajar di kelas."}</div>
    </div>
  </li>;
}

export default function IllustratedCurriculum({ curriculum }: { curriculum: LanguageCurriculum }) {
  const { meta } = curriculum;
  const title = displayLangTitle(meta);
  const registrationSlug = daftarSlugFromLanguageSlug(meta.slug);
  const registrationUrl = meta.slug === "ielts" || meta.slug === "toefl-itp"
    ? "/daftar/inggris/ielts-toefl" : registrationSlug ? `/daftar/${registrationSlug}` : "/daftar";
  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const longOverview = curriculum.overview.length > 500;
  const [levelIndex, setLevelIndex] = useState(0);
  const [chapterIndex, setChapterIndex] = useState(0);
  const level = curriculum.levels[levelIndex];
  const chapter = level.sublevels[chapterIndex];
  const total = curriculum.levels.reduce((sum, l) => sum + l.sublevels.reduce((n, c) => n + c.sessions.length, 0), 0);
  return <main className="min-h-screen bg-[#F1F9F9] px-3 pb-12 pt-4 text-slate-900 sm:px-4 md:px-8 md:pb-20 md:pt-28">
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-white p-4 shadow-[0_12px_60px_#1a9e9e08] sm:p-6 md:p-10">
        <LanguageSwitcher currentSlug={meta.slug} />
        <div className="grid items-center gap-5 md:gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div><div className="mb-4 flex items-center gap-3 md:mb-5 md:gap-5"><LangSlugFlag slug={meta.slug} h={58} className="max-sm:!h-10 max-sm:!w-auto"/><div><p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Silabus</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl md:text-5xl">{title}</h1><p className="mt-1 text-lg italic text-slate-500">{meta.nativeName}</p></div></div>
            <p id={`${meta.slug}-overview`} className={`max-w-2xl text-sm leading-7 text-slate-500 md:text-base ${longOverview && !overviewExpanded ? "line-clamp-4" : ""}`}>{curriculum.overview}</p>
            {longOverview && <button type="button" aria-expanded={overviewExpanded} aria-controls={`${meta.slug}-overview`} onClick={() => setOverviewExpanded(open => !open)} className="mt-2 text-sm font-semibold text-[#1A9E9E] hover:underline">{overviewExpanded ? "Tutup" : "Baca selengkapnya"}</button>}
            <div className="mt-6 flex flex-wrap gap-3"><Link href={registrationUrl} className="inline-flex items-center gap-3 rounded-full bg-[#1A9E9E] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-teal-600/15 hover:bg-[#147a7a]">Mulai Belajar {title}<ArrowRight size={20}/></Link><Link href={`/silabus/${meta.slug}/coba`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"><Target size={19}/>Placement Test</Link></div>
          </div><div className="mx-auto w-full max-w-sm lg:max-w-none"><SessionArt slug={meta.slug} hero/></div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-4">{[{ Icon: ChartNoAxesColumnIncreasing, title: "Struktur lengkap", detail: `A1–B2 (${total} sesi)` }, { Icon: BookOpen, title: "Standar internasional", detail: "Kurikulum berbasis CEFR" }, { Icon: Users, title: "Mulai dari levelmu", detail: "Pemula hingga menengah atas" }, { Icon: Clock3, title: "Belajar fleksibel", detail: "Pilihan program sesuai kebutuhan" }].map(({ Icon, title, detail }) => <div key={title} className="flex items-center gap-3"><span className="rounded-2xl bg-[#ECF9F7] p-3 text-[#1A9E9E]"><Icon size={21}/></span><p className="text-xs leading-5 text-slate-500">{title}<span className="block">{detail}</span></p></div>)}</div>
      </section>
      <section className="rounded-[28px] bg-white p-4 shadow-[0_12px_60px_#1a9e9e08] md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex flex-wrap items-center gap-3"><span className="h-2 w-2 rounded-full bg-[#1A9E9E]"/><h2 className="text-xl font-bold md:text-2xl">{labels[level.code]} {level.code}</h2>{meta.slug !== "english" && <PadananUjianBadge bahasa={meta.slug} level={level.code} />}</div><label className="flex items-center gap-2 text-sm text-slate-500">Pilih level<select value={levelIndex} onChange={e => { setLevelIndex(Number(e.target.value)); setChapterIndex(0); }} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-800">{curriculum.levels.map((l, i) => <option key={l.code} value={i}>{labels[l.code]} {l.code}</option>)}</select></label></div>
        <p className="mt-2 text-sm leading-6 text-slate-500">{level.description}</p>
        <div className="my-5 flex flex-wrap gap-2" aria-label="Pilih chapter">{level.sublevels.map((c, i) => <button key={c.code} type="button" aria-pressed={chapterIndex === i} onClick={() => setChapterIndex(i)} className={`rounded-full border px-6 py-2.5 text-sm font-semibold transition-colors ${chapterIndex === i ? "border-[#1A9E9E] bg-[#1A9E9E] text-white" : "border-slate-200 text-slate-500 hover:border-[#1A9E9E]"}`}>{c.code}</button>)}</div>
        <div className="rounded-[22px] border border-slate-100 bg-[#F3F8F9] p-3 md:p-4">
          <div className="flex flex-wrap items-center justify-between gap-4 px-2 pb-5 pt-2"><div><p className="text-xs font-bold uppercase tracking-wider text-[#1A9E9E]">Chapter {chapterIndex + 1}</p><h3 className="mt-1 text-2xl font-bold">{chapter.name}</h3><p className="mt-2 text-xs text-slate-500">{chapter.sessions.length} sesi · {chapter.code} · Pilih kartu untuk lihat topik sesi</p></div></div>
          <ol key={chapter.code} className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">{chapter.sessions.map((session, i) => <SessionCard key={session.number} session={session} index={i} chapterCode={chapter.code} slug={meta.slug} language={title} firstChapter={levelIndex === 0 && chapterIndex === 0}/>)}</ol>
        </div>
        <div className="mt-6 flex justify-end"><Link href={registrationUrl} className="inline-flex items-center gap-2 rounded-full bg-[#1A9E9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#147a7a]">Belajar bareng pengajar<ChevronRight size={17}/></Link></div>
      </section>
    </div>
  </main>;
}
