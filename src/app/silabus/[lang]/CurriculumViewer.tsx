"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";
import type { LanguageCurriculum, Level, Sublevel } from "@/data/curriculum";
import { getIconForSession } from "@/data/curriculum/sessionIcons";
import FunnelModal from "@/components/FunnelModal";

const MOCK_STATS = {
  totalLearners: 1247,
  completionRate: 87,
  rating: 4.8,
  alumni: 620,
};

interface LevelTheme {
  primary: string;
  primaryCls: string;
  ring: string;
  bgSoft: string;
  text: string;
  label: string;
}

const LEVEL_THEMES: Record<string, LevelTheme> = {
  A1: { primary: "#10b981", primaryCls: "bg-emerald-500", ring: "ring-emerald-500", bgSoft: "bg-emerald-50", text: "text-emerald-700", label: "Pemula" },
  A2: { primary: "#0ea5e9", primaryCls: "bg-sky-500",     ring: "ring-sky-500",     bgSoft: "bg-sky-50",     text: "text-sky-700",     label: "Pra-Menengah" },
  B1: { primary: "#8b5cf6", primaryCls: "bg-violet-500",  ring: "ring-violet-500",  bgSoft: "bg-violet-50",  text: "text-violet-700",  label: "Menengah" },
  B2: { primary: "#f43f5e", primaryCls: "bg-rose-500",    ring: "ring-rose-500",    bgSoft: "bg-rose-50",    text: "text-rose-700",    label: "Menengah Atas" },
};

// ============================================================
// FunnelModal sekarang di-render in-place di halaman silabus.
// Klik tombol CTA → buka modal langsung tanpa pindah page.
// ============================================================

export default function CurriculumViewer({ curriculum }: { curriculum: LanguageCurriculum }) {
  const { meta, overview, levels } = curriculum;
  const [activeLevelIdx, setActiveLevelIdx] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);
  // In-place funnel modal — buka langsung di halaman silabus tanpa redirect
  const [funnelOpen, setFunnelOpen] = useState(false);
  const [funnelSource, setFunnelSource] = useState("");

  // Wrapper: panggil dari onClick. langName otomatis dari meta, source bedakan posisi tombol.
  const openFunnel = (_langName: string, source: string) => {
    setFunnelSource(source);
    setFunnelOpen(true);
  };

  const activeLevel = levels[activeLevelIdx];
  const theme = LEVEL_THEMES[activeLevel.code];

  // Social proof fake completion per level
  const completionByLevel: Record<string, number> = { A1: 85, A2: 62, B1: 41, B2: 24 };

  // Show sticky CTA after scrolling past hero (~400px)
  useEffect(() => {
    const onScroll = () => setShowStickyCta(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleStartLearning = () => {
    openFunnel(`Bahasa ${meta.name}`, `silabus-${meta.slug}`);
  };

  return (
    <main className="min-h-screen bg-white pb-20 md:pb-0">
      {/* HERO */}
      <section className="pt-20 md:pt-24 pb-6 md:pb-8">
        <div className="max-w-3xl mx-auto px-6">
          <Link href="/silabus" className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1 mb-6 group">
            <Icons.ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Semua silabus
          </Link>

          <div className="flex items-center gap-4 mb-5">
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 180, damping: 14 }}
              className="text-5xl md:text-6xl"
            >{meta.flag}</motion.span>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">Silabus</p>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900">Bahasa {meta.name}</h1>
              <p className="text-sm md:text-base text-gray-500 italic">{meta.nativeName}</p>
            </div>
          </div>

          <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-7">{overview}</p>

          {/* PRIMARY HERO CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleStartLearning}
              className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-[#1A9E9E] text-white rounded-full font-bold text-base hover:bg-[#147a7a] shadow-lg shadow-[#1A9E9E]/20 hover:shadow-xl hover:shadow-[#1A9E9E]/30 transition-all group"
            >
              Mulai Belajar Bahasa {meta.name}
              <Icons.ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link
              href={`/silabus/${meta.slug}/coba`}
              className="inline-flex items-center justify-center gap-2 px-7 py-4 border-2 border-gray-200 text-gray-700 rounded-full font-semibold text-base hover:border-gray-900 hover:bg-gray-50 transition-colors"
            >
              <Icons.Target className="w-4 h-4" />
              Coba Sample Gratis
            </Link>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF STRIP */}
      <section className="border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-3xl mx-auto px-6 py-4 md:py-5 flex flex-wrap gap-x-6 gap-y-3 justify-center md:justify-between items-center text-sm">
          <SocialStat icon="Users" value={MOCK_STATS.totalLearners.toLocaleString("id-ID")} label="sedang belajar" pulse />
          <SocialStat icon="GraduationCap" value={MOCK_STATS.alumni.toLocaleString("id-ID")} label="alumni" />
          <SocialStat icon="Star" value={MOCK_STATS.rating.toFixed(1)} label="rating Google" />
          <SocialStat icon="Trophy" value={`${MOCK_STATS.completionRate}%`} label="tingkat selesai" />
        </div>
      </section>

      {/* LEVEL SELECTOR DROPDOWN */}
      <section className="max-w-3xl mx-auto px-6 mt-10 md:mt-14">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-gray-900 hover:opacity-70 transition-opacity"
          >
            <span className={`inline-block w-2 h-2 rounded-full ${theme.primaryCls}`} />
            {theme.label} {activeLevel.code}
            <Icons.ChevronDown className={`w-6 h-6 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-10 min-w-[280px]"
              >
                {levels.map((lvl, i) => {
                  const t = LEVEL_THEMES[lvl.code];
                  return (
                    <button
                      key={lvl.code}
                      onClick={() => { setActiveLevelIdx(i); setDropdownOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 ${i === activeLevelIdx ? "bg-gray-50" : ""}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${t.primaryCls}`} />
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-900">{t.label} {lvl.code}</div>
                        <div className="text-xs text-gray-500">{lvl.name} · {lvl.sublevels.length} chapter</div>
                      </div>
                      {i === activeLevelIdx && <Icons.Check className="w-4 h-4 text-gray-600" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* LEVEL PROGRESS BAR */}
        <div className="mt-5">
          <LevelProgressBar
            completion={completionByLevel[activeLevel.code]}
            color={theme.primary}
          />
          <p className="text-xs text-gray-500 mt-2">
            <span className="font-semibold text-gray-700">{Math.floor((completionByLevel[activeLevel.code] / 100) * MOCK_STATS.totalLearners).toLocaleString("id-ID")}</span> dari {MOCK_STATS.totalLearners.toLocaleString("id-ID")} learner sedang atau sudah lewat level ini
          </p>
        </div>
      </section>

      {/* CHAPTERS */}
      <section className="max-w-3xl mx-auto px-6 pt-8 pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeLevel.code}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-14 md:space-y-20"
          >
            {activeLevel.sublevels.map((sublevel, ci) => (
              <ChapterSection
                key={sublevel.code}
                sublevel={sublevel}
                chapterNum={ci + 1}
                theme={theme}
                langName={meta.name}
                onStartLearning={handleStartLearning}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Level navigation */}
        <div className="mt-16 flex items-center justify-between gap-3 border-t border-gray-100 pt-8">
          <button
            onClick={() => setActiveLevelIdx((i) => Math.max(0, i - 1))}
            disabled={activeLevelIdx === 0}
            className="flex-1 md:flex-none inline-flex items-center gap-2 px-5 py-3 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Icons.ChevronLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Level sebelumnya</span>
          </button>
          <button
            onClick={() => setActiveLevelIdx((i) => Math.min(levels.length - 1, i + 1))}
            disabled={activeLevelIdx === levels.length - 1}
            className={`flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 ${theme.primaryCls} text-white rounded-full hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            <span className="text-sm font-medium">Level selanjutnya</span>
            <Icons.ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="pb-20 md:pb-28">
        <div className="max-w-3xl mx-auto px-6">
          <div className="relative rounded-3xl bg-gray-900 text-white p-8 md:p-12 overflow-hidden">
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#1A9E9E]/30 rounded-full blur-3xl" />
            <div className="relative">
              <p className="text-xs uppercase tracking-widest text-amber-300 mb-3 font-semibold">Siap mulai?</p>
              <h2 className="text-2xl md:text-4xl font-bold mb-5 leading-tight">
                Perjalanan <span className="text-[#1A9E9E]">{meta.name}</span> kamu menunggu.
              </h2>
              <p className="text-gray-300 text-base mb-7 max-w-xl">
                Pilih kelas yang sesuai: private, reguler, IELTS/TOEFL prep, atau kelas anak. Pengajar berpengalaman siap bantu kamu.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleStartLearning}
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#1A9E9E] text-white rounded-full font-semibold hover:bg-[#147a7a] transition-colors"
                >
                  Mulai Belajar Sekarang
                  <Icons.ArrowRight className="w-4 h-4" />
                </button>
                <Link href="/produk" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-colors">
                  Lihat Harga Kelas
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STICKY MOBILE CTA */}
      <AnimatePresence>
        {showStickyCta && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-40 md:hidden p-4 bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-2xl"
          >
            <button
              onClick={handleStartLearning}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1A9E9E] text-white rounded-full font-bold text-base shadow-lg"
            >
              Mulai Belajar Bahasa {meta.name}
              <Icons.ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* In-place FunnelModal — kebuka langsung di halaman silabus, gak perlu pindah ke homepage */}
      <FunnelModal
        open={funnelOpen}
        onClose={() => setFunnelOpen(false)}
        initialLang={meta.slug.charAt(0).toUpperCase() + meta.slug.slice(1)}
        initialPreferredProg="Kelas Private"
        initialSource={funnelSource}
      />
    </main>
  );
}

// ==================================================
// Sub-components
// ==================================================

function SocialStat({ icon, value, label, pulse = false }: { icon: string; value: string; label: string; pulse?: boolean }) {
  const Icon = (Icons as any)[icon] as React.FC<{ className?: string; strokeWidth?: number }>;
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-gray-500" strokeWidth={2} />
      <div className="flex items-baseline gap-1.5">
        <span className="font-bold text-gray-900">{value}</span>
        {pulse && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
    </div>
  );
}

function LevelProgressBar({ completion, color }: { completion: number; color: string }) {
  return (
    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${completion}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute inset-y-0 left-0 rounded-full flex items-center justify-end pr-2"
        style={{ backgroundColor: color }}
      >
        <span className="text-[10px] font-bold text-white">{completion}%</span>
      </motion.div>
    </div>
  );
}

function ChapterSection({
  sublevel, chapterNum, theme, langName, onStartLearning,
}: { sublevel: Sublevel; chapterNum: number; theme: LevelTheme; langName: string; onStartLearning: () => void }) {
  // Semua chapter ditampilkan dengan framing informatif — bukan "locked"
  // Chapter yang detail-nya belum ter-preview = "Materi Mendalam"
  const hasDetailedTopics = sublevel.preview; // true untuk A1.1-A1.3, false untuk chapter lainnya
  const label = hasDetailedTopics ? "Chapter Pemula" : "Chapter Lanjutan";

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <p className={`text-xs uppercase tracking-widest ${theme.text} font-semibold mb-1`}>Chapter {chapterNum}</p>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{sublevel.name}</h2>
          <p className="text-sm text-gray-500 mt-1">{sublevel.sessions.length} sesi · {sublevel.code}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
          <Icons.BookOpen className="w-3 h-3" />
          {label}
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-8 md:left-10 top-8 bottom-8 w-0.5 bg-gray-200" />
        <ol className="relative space-y-1">
          {sublevel.sessions.map((s, i) => (
            <LessonRow
              key={s.number}
              title={s.title}
              topics={s.topics}
              index={i}
              theme={theme}
              hasDetail={hasDetailedTopics}
            />
          ))}
        </ol>
      </div>

      {/* Chapter CTA — tanpa framing gembok */}
      {!hasDetailedTopics && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`mt-6 p-5 rounded-2xl ${theme.bgSoft} border border-gray-100`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full ${theme.primaryCls} flex items-center justify-center flex-shrink-0`}>
              <Icons.Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">Pelajari Chapter {chapterNum} bareng pengajar</p>
              <p className="text-sm text-gray-600 mt-1">Detail topik, latihan, dan praktik langsung dibahas di kelas — private atau reguler.</p>
              <button
                onClick={onStartLearning}
                className={`mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 ${theme.primaryCls} text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity`}
              >
                Mulai Belajar Sekarang
                <Icons.ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function LessonRow({
  title, topics, index, theme, hasDetail,
}: { title: string; topics?: string[]; index: number; theme: LevelTheme; hasDetail: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const iconName = getIconForSession(title);
  const Icon = ((Icons as any)[iconName] || Icons.BookOpen) as React.FC<{ className?: string; strokeWidth?: number }>;
  const hasTopics = topics && topics.length > 0;

  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: Math.min(index * 0.04, 0.5), duration: 0.3 }}
      className="relative"
    >
      <button
        onClick={() => hasTopics && setExpanded((e) => !e)}
        disabled={!hasTopics}
        className="w-full flex items-start gap-4 md:gap-5 py-3 group text-left disabled:cursor-default"
      >
        {/* Icon circle */}
        <div className="relative flex-shrink-0">
          <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full ${theme.bgSoft} ring-4 ring-white flex items-center justify-center transition-transform ${hasTopics ? "group-hover:scale-105" : ""}`}>
            <Icon className={`w-7 h-7 md:w-8 md:h-8 ${theme.text}`} strokeWidth={1.8} />
          </div>
          {/* Number badge — replace old check/lock dot */}
          <div className="absolute -bottom-1 -right-1 min-w-[24px] h-6 px-1.5 rounded-full bg-white border border-gray-200 flex items-center justify-center">
            <span className="text-[10px] font-bold text-gray-700">{String(index + 1).padStart(2, "0")}</span>
          </div>
        </div>

        {/* Lesson info */}
        <div className="flex-1 pt-2 md:pt-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm md:text-base leading-tight text-gray-900">
                {title}
              </h3>
              {!hasTopics && !hasDetail && (
                <p className="text-xs text-gray-500 mt-1 italic">Detail topik dibahas di kelas</p>
              )}
              {!hasTopics && hasDetail && (
                <p className="text-xs text-gray-500 mt-1">Preview lesson</p>
              )}
            </div>
            {hasTopics && (
              <Icons.ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-1 transition-transform ${expanded ? "rotate-180" : ""}`} />
            )}
          </div>

          <AnimatePresence>
            {expanded && hasTopics && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-1.5 mt-3 pb-2">
                  {topics!.map((t) => (
                    <span key={t} className={`text-xs ${theme.bgSoft} ${theme.text} px-2.5 py-1 rounded-full font-medium`}>
                      {t}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </button>
    </motion.li>
  );
}
