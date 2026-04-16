#!/usr/bin/env node
// Busuu-style /silabus/[lang] refactor
// - Lucide icon circles per sesi (theme-matched)
// - Horizontal progress per level with social proof
// - Dropdown level selector
// - Chapter cards with descriptive titles
// Drop ke ~/linguo-landing, run: node silabus-busuu-v2.mjs

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
if (!fs.existsSync(path.join(ROOT, 'src/app/silabus'))) {
  console.error('❌ Run dari ~/linguo-landing');
  process.exit(1);
}

const write = (rel, content) => {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.trimStart(), 'utf8');
  console.log(`  ✅ ${rel}`);
};

console.log('📝 Refactor ke Busuu-style v2...\n');

// ============================================================
// 1. Icon mapper: title keyword → Lucide icon name
// ============================================================
write('src/data/curriculum/sessionIcons.ts', `
// Maps session title keywords → Lucide icon names
// Returns icon name string, consumer imports from lucide-react

export function getIconForSession(title: string): string {
  const t = title.toLowerCase();

  // Foundations
  if (/alphabet|pronunciation|spelling|phonetic|letter/.test(t)) return "Type";
  if (/greeting|hello|goodbye|introduce/.test(t)) return "Hand";
  if (/number|counting|price|age/.test(t)) return "Hash";
  if (/day|month|date|time|clock/.test(t)) return "Clock";
  if (/color|colour/.test(t)) return "Palette";

  // People & relationships
  if (/family|mother|father|sibling|relative/.test(t)) return "Users";
  if (/friend|social|relationship/.test(t)) return "UserPlus";
  if (/pronoun|subject|object/.test(t)) return "User";

  // Places & directions
  if (/home|house|room|bedroom|kitchen/.test(t)) return "Home";
  if (/direction|map|location|town|city/.test(t)) return "MapPin";
  if (/transport|bus|train|car|airport/.test(t)) return "Plane";
  if (/travel|trip|journey|holiday|vacation/.test(t)) return "Compass";
  if (/hotel|accommodation|check/.test(t)) return "BedDouble";

  // Food & shopping
  if (/food|drink|meal|breakfast|restaurant/.test(t)) return "Utensils";
  if (/market|supermarket|grocery/.test(t)) return "ShoppingBasket";
  if (/shop|clothing|clothes|fashion/.test(t)) return "ShoppingBag";

  // Weather & nature
  if (/weather|season|rain|sun|cloud/.test(t)) return "Cloud";
  if (/environment|nature|plant/.test(t)) return "Leaf";

  // Grammar core
  if (/verb|tense|present|past|future|continuous|perfect/.test(t)) return "Zap";
  if (/article|noun|grammar|syntax/.test(t)) return "BookOpen";
  if (/adjective|adverb|describ/.test(t)) return "Sparkles";
  if (/preposition|position/.test(t)) return "Move";
  if (/conditional|subjunctive|passive/.test(t)) return "GitBranch";
  if (/question|ask|quest/.test(t)) return "HelpCircle";
  if (/modal|should|must|could|can|might/.test(t)) return "Lightbulb";
  if (/reported speech|indirect/.test(t)) return "MessageSquareQuote";
  if (/phrasal|idiom|collocation/.test(t)) return "Puzzle";

  // Communication & work
  if (/phone|call|telephone/.test(t)) return "Phone";
  if (/email|letter|mail|correspond/.test(t)) return "Mail";
  if (/writ|essay|review|report/.test(t)) return "PenLine";
  if (/read|literature|poem|novel/.test(t)) return "BookMarked";
  if (/form|fill|application/.test(t)) return "FileText";
  if (/job|work|career|interview|workplace|profession/.test(t)) return "Briefcase";
  if (/business|meet|negotiat|present/.test(t)) return "Building2";
  if (/financial|money|bank|legal/.test(t)) return "Banknote";
  if (/market|advertis|brand/.test(t)) return "Megaphone";

  // Skills & abilities
  if (/hobby|free time|leisure/.test(t)) return "Music";
  if (/sport|fitness|exercise/.test(t)) return "Activity";
  if (/music|song|instrument/.test(t)) return "Music";
  if (/art|paint|draw|design/.test(t)) return "Palette";
  if (/technology|tech|computer|digital/.test(t)) return "Laptop";
  if (/media|journalism|news/.test(t)) return "Newspaper";
  if (/health|doctor|medicine|illness/.test(t)) return "Heart";

  // Culture & abstract
  if (/cultur|tradition|society/.test(t)) return "Globe";
  if (/opinion|agree|disagree|debate|argument|persuad/.test(t)) return "Scale";
  if (/story|tell|narrat|plot/.test(t)) return "BookMarked";
  if (/history|historical/.test(t)) return "Landmark";
  if (/science|discovery/.test(t)) return "FlaskConical";
  if (/philosophy|abstract/.test(t)) return "Brain";

  // Review & assessment
  if (/review|summary|assessment|final|role play|practice/.test(t)) return "Target";

  // Register & tone
  if (/formal|informal|register|tone|politeness/.test(t)) return "Mic";
  if (/accent|listen|comprehension/.test(t)) return "Ear";
  if (/speak|speech|public speak|speaking/.test(t)) return "MessageCircle";
  if (/humor|slang|colloquial/.test(t)) return "Laugh";

  // Fallback
  return "BookOpen";
}
`);

// ============================================================
// 2. Lesson title generator (descriptive, Busuu-style)
// ============================================================
// We also add a helper to make session titles feel like "Chapter 1: Essentials"

// ============================================================
// 3. NEW CurriculumViewer — Busuu layout
// ============================================================
write('src/app/silabus/[lang]/CurriculumViewer.tsx', `
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";
import type { LanguageCurriculum, Level, Sublevel } from "@/data/curriculum";
import { getIconForSession } from "@/data/curriculum/sessionIcons";

const MOCK_STATS = {
  totalLearners: 1247,
  completionRate: 87,
  rating: 4.8,
  alumni: 620,
};

interface LevelTheme {
  primary: string;     // hex color for progress bar
  primaryCls: string;  // tailwind utility
  ring: string;        // ring color for circle
  bgSoft: string;      // soft bg for circle
  text: string;
  label: string;
}

const LEVEL_THEMES: Record<string, LevelTheme> = {
  A1: { primary: "#10b981", primaryCls: "bg-emerald-500", ring: "ring-emerald-500", bgSoft: "bg-emerald-50", text: "text-emerald-700", label: "Pemula" },
  A2: { primary: "#0ea5e9", primaryCls: "bg-sky-500",     ring: "ring-sky-500",     bgSoft: "bg-sky-50",     text: "text-sky-700",     label: "Pra-Menengah" },
  B1: { primary: "#8b5cf6", primaryCls: "bg-violet-500",  ring: "ring-violet-500",  bgSoft: "bg-violet-50",  text: "text-violet-700",  label: "Menengah" },
  B2: { primary: "#f43f5e", primaryCls: "bg-rose-500",    ring: "ring-rose-500",    bgSoft: "bg-rose-50",    text: "text-rose-700",    label: "Menengah Atas" },
};

export default function CurriculumViewer({ curriculum }: { curriculum: LanguageCurriculum }) {
  const { meta, overview, levels } = curriculum;
  const [activeLevelIdx, setActiveLevelIdx] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const activeLevel = levels[activeLevelIdx];
  const theme = LEVEL_THEMES[activeLevel.code];

  // Social proof: fake completion % per level (represents cohort behind)
  const completionByLevel: Record<string, number> = { A1: 85, A2: 62, B1: 41, B2: 24 };

  return (
    <main className="min-h-screen bg-white">
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

          <p className="text-base md:text-lg text-gray-700 leading-relaxed">{overview}</p>
        </div>
      </section>

      {/* SOCIAL PROOF STRIP */}
      <section className="border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-3xl mx-auto px-6 py-4 md:py-5 flex flex-wrap gap-x-6 gap-y-3 justify-center md:justify-between items-center text-sm">
          <SocialStat icon="Users" value={MOCK_STATS.totalLearners.toLocaleString("id-ID")} label="sedang belajar" pulse />
          <SocialStat icon="GraduationCap" value={MOCK_STATS.alumni.toLocaleString("id-ID")} label="alumni" />
          <SocialStat icon="Star" value={MOCK_STATS.rating.toFixed(1)} label="rating Google" />
          <SocialStat icon="Trophy" value={\`\${MOCK_STATS.completionRate}%\`} label="tingkat selesai" />
        </div>
      </section>

      {/* DEMO CTA */}
      <section className="px-6 max-w-3xl mx-auto mt-8">
        <Link href={\`/silabus/\${meta.slug}/coba\`} className="block group">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1A9E9E] to-[#158585] p-5 md:p-6 text-white">
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icons.Target className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs uppercase tracking-widest text-amber-200 mb-0.5 font-semibold">Gratis · 2 menit</p>
                  <p className="text-base md:text-xl font-bold leading-tight">Coba Sample Lesson</p>
                  <p className="text-xs md:text-sm text-white/80 mt-0.5">Rasain gaya belajar Linguo tanpa daftar</p>
                </div>
              </div>
              <Icons.ChevronRight className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </section>

      {/* LEVEL SELECTOR DROPDOWN */}
      <section className="max-w-3xl mx-auto px-6 mt-10 md:mt-14">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-gray-900 hover:opacity-70 transition-opacity"
          >
            <span className={\`inline-block w-2 h-2 rounded-full \${theme.primaryCls}\`} />
            {theme.label} {activeLevel.code}
            <Icons.ChevronDown className={\`w-6 h-6 text-gray-400 transition-transform \${dropdownOpen ? "rotate-180" : ""}\`} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-10 min-w-[240px]"
              >
                {levels.map((lvl, i) => {
                  const t = LEVEL_THEMES[lvl.code];
                  return (
                    <button
                      key={lvl.code}
                      onClick={() => { setActiveLevelIdx(i); setDropdownOpen(false); }}
                      className={\`w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 \${i === activeLevelIdx ? "bg-gray-50" : ""}\`}
                    >
                      <span className={\`w-2 h-2 rounded-full \${t.primaryCls}\`} />
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-900">{t.label} {lvl.code}</div>
                        <div className="text-xs text-gray-500">{lvl.name}</div>
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
            cohort={Math.floor((completionByLevel[activeLevel.code] / 100) * MOCK_STATS.totalLearners)}
          />
          <p className="text-xs text-gray-500 mt-2">
            <span className="font-semibold text-gray-700">{Math.floor((completionByLevel[activeLevel.code] / 100) * MOCK_STATS.totalLearners).toLocaleString("id-ID")}</span> dari {MOCK_STATS.totalLearners.toLocaleString("id-ID")} orang sedang atau sudah lewat level ini
          </p>
        </div>
      </section>

      {/* CHAPTERS / SUBLEVELS */}
      <section className="max-w-3xl mx-auto px-6 pt-8 pb-20 md:pb-28">
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
            className={\`flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full \${theme.primaryCls} text-white hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed\`}
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
                Konsultasi gratis via WhatsApp. Pengajar akan bantu tentukan level kamu.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={\`https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20tertarik%20kelas%20Bahasa%20\${encodeURIComponent(meta.name)}\`}
                  target="_blank" rel="noopener"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A9E9E] text-white rounded-full font-semibold hover:bg-[#147a7a] transition-colors"
                >Konsultasi Gratis<Icons.ArrowRight className="w-4 h-4" />
                </a>
                <Link href="/produk" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-colors">
                  Lihat Harga
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
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

function LevelProgressBar({ completion, color, cohort }: { completion: number; color: string; cohort: number }) {
  return (
    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: \`\${completion}%\` }}
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
  sublevel, chapterNum, theme, langName,
}: { sublevel: Sublevel; chapterNum: number; theme: LevelTheme; langName: string }) {
  const isLocked = !sublevel.preview;

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <div>
          <p className={\`text-xs uppercase tracking-widest \${theme.text} font-semibold mb-1\`}>Chapter {chapterNum}</p>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{sublevel.name}</h2>
          <p className="text-sm text-gray-500 mt-1">{sublevel.sessions.length} sesi · {sublevel.code}</p>
        </div>
        {isLocked && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            <Icons.Lock className="w-3 h-3" />
            Preview terkunci
          </div>
        )}
      </div>

      <div className="relative">
        {/* vertical connector line behind circles */}
        <div className="absolute left-8 md:left-10 top-8 bottom-8 w-0.5 bg-gray-200" />

        <ol className="relative space-y-1">
          {sublevel.sessions.map((s, i) => (
            <LessonRow
              key={s.number}
              title={s.title}
              topics={s.topics}
              index={i}
              theme={theme}
              locked={isLocked}
            />
          ))}
        </ol>
      </div>

      {isLocked && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={\`mt-6 p-5 rounded-2xl \${theme.bgSoft} border border-gray-100\`}
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">🔓</div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">Buka semua detail sesi di chapter ini</p>
              <p className="text-sm text-gray-600 mt-1">Akses kosakata lengkap, pola kalimat, dan latihan interaktif.</p>
              <a
                href={\`https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20tertarik%20kelas%20\${encodeURIComponent(langName)}%20\${encodeURIComponent(sublevel.code)}\`}
                target="_blank" rel="noopener"
                className={\`mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 \${theme.primaryCls} text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity\`}
              >Daftar via WhatsApp<Icons.ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function LessonRow({
  title, topics, index, theme, locked,
}: { title: string; topics?: string[]; index: number; theme: LevelTheme; locked: boolean }) {
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
        {/* Circle with icon */}
        <div className="relative flex-shrink-0">
          <div className={\`relative w-16 h-16 md:w-20 md:h-20 rounded-full \${theme.bgSoft} ring-4 ring-white flex items-center justify-center transition-transform \${hasTopics ? "group-hover:scale-105" : ""}\`}>
            <Icon className={\`w-7 h-7 md:w-8 md:h-8 \${theme.text}\`} strokeWidth={1.8} />
          </div>
          {/* Status dot bottom-right */}
          <div className={\`absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-white flex items-center justify-center\`}>
            {locked ? (
              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                <Icons.Lock className="w-2.5 h-2.5 text-gray-500" strokeWidth={3} />
              </div>
            ) : (
              <div className={\`w-5 h-5 rounded-full \${theme.primaryCls} flex items-center justify-center\`}>
                <Icons.Check className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            )}
          </div>
        </div>

        {/* Lesson info */}
        <div className="flex-1 pt-2 md:pt-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className={\`font-bold text-sm md:text-base leading-tight \${locked ? "text-gray-500" : "text-gray-900"}\`}>
                {title}
              </h3>
              {!hasTopics && locked && (
                <p className="text-xs text-gray-400 mt-1 italic">Detail topik terbuka setelah daftar</p>
              )}
              {!hasTopics && !locked && (
                <p className="text-xs text-gray-500 mt-1">Preview lesson</p>
              )}
            </div>
            {hasTopics && (
              <Icons.ChevronDown className={\`w-4 h-4 text-gray-400 flex-shrink-0 mt-1 transition-transform \${expanded ? "rotate-180" : ""}\`} />
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
                    <span key={t} className={\`text-xs \${theme.bgSoft} \${theme.text} px-2.5 py-1 rounded-full font-medium\`}>
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
`);

// ============================================================
// Commit
// ============================================================
console.log('\n🚀 Git...\n');
try {
  execSync('git add -A', { stdio: 'inherit', cwd: ROOT });
  execSync('git commit -m "feat(silabus): Busuu-style learning path with Lucide icons & social proof"', { stdio: 'inherit', cwd: ROOT });
  execSync('git push', { stdio: 'inherit', cwd: ROOT });
  console.log('\n✅ Pushed. Vercel deploying...\n');
} catch (e) {
  console.log('\n⚠️  Git:', e.message);
}

try { fs.unlinkSync(fileURLToPath(import.meta.url)); } catch {}
