"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { LanguageCurriculum, Level, Sublevel, SessionPreview } from "@/data/curriculum";

// Mock stats — later bisa pull dari DB
const MOCK_STATS = { learners: 1247, completionRate: 87, avgRating: 4.8 };

const LEVEL_COLORS: Record<string, { node: string; ring: string; text: string; bg: string; soft: string; glow: string }> = {
  A1: { node: "from-emerald-400 to-emerald-600", ring: "ring-emerald-200", text: "text-emerald-700", bg: "bg-emerald-50",  soft: "bg-emerald-100", glow: "shadow-emerald-200" },
  A2: { node: "from-sky-400 to-sky-600",         ring: "ring-sky-200",     text: "text-sky-700",     bg: "bg-sky-50",      soft: "bg-sky-100",     glow: "shadow-sky-200" },
  B1: { node: "from-violet-400 to-violet-600",   ring: "ring-violet-200",  text: "text-violet-700",  bg: "bg-violet-50",   soft: "bg-violet-100",  glow: "shadow-violet-200" },
  B2: { node: "from-rose-400 to-rose-600",       ring: "ring-rose-200",    text: "text-rose-700",    bg: "bg-rose-50",     soft: "bg-rose-100",    glow: "shadow-rose-200" },
};

interface PathNode {
  level: Level;
  sublevel: Sublevel;
  index: number;       // 0..11 global
  levelIdx: number;    // 0..3 within level
}

export default function CurriculumViewer({ curriculum }: { curriculum: LanguageCurriculum }) {
  const { meta, overview, levels } = curriculum;
  const [openNode, setOpenNode] = useState<PathNode | null>(null);

  // Flatten levels → path nodes
  const nodes: PathNode[] = useMemo(() => {
    const out: PathNode[] = [];
    let i = 0;
    for (const level of levels) {
      level.sublevels.forEach((sublevel, levelIdx) => {
        out.push({ level, sublevel, index: i++, levelIdx });
      });
    }
    return out;
  }, [levels]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      {/* HERO */}
      <section className="relative pt-24 md:pt-28 pb-8 md:pb-10 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-br from-[#1A9E9E]/10 to-amber-200/20 rounded-full blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto px-6">
          <Link href="/silabus" className="text-sm text-gray-500 hover:text-[#1A9E9E] inline-flex items-center gap-1 mb-6 group">
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Semua silabus
          </Link>

          <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-6">
            <motion.span
              initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="text-6xl md:text-7xl"
            >{meta.flag}</motion.span>
            <div>
              <p className="text-xs md:text-sm text-gray-500 uppercase tracking-[0.2em]">Jalur Belajar</p>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Bahasa {meta.name}</h1>
              <p className="text-base md:text-lg text-gray-500 italic">{meta.nativeName}</p>
            </div>
          </div>

          <p className="text-base md:text-lg text-gray-700 leading-relaxed max-w-3xl">{overview}</p>
        </div>
      </section>

      {/* LIVE STATS STRIP */}
      <section className="px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard label="Sedang belajar" value={MOCK_STATS.learners.toLocaleString("id-ID")} hint="learner aktif" pulse />
          <StatCard label="Tingkat selesai" value={`${MOCK_STATS.completionRate}%`} hint="lulus B2" />
          <StatCard label="Rating" value={MOCK_STATS.avgRating.toFixed(1)} hint="⭐ di Google" />
          <StatCard label="Total sesi" value="304" hint="A1 → B2" />
        </div>
      </section>

      {/* DEMO CTA */}
      <section className="px-6 max-w-5xl mx-auto mt-8 md:mt-10">
        <Link href={`/silabus/${meta.slug}/coba`} className="block group">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1A9E9E] via-[#158585] to-[#0E6B6B] p-6 md:p-8 text-white">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-300/30 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl">🎯</div>
                <div>
                  <p className="text-xs md:text-sm uppercase tracking-widest text-amber-200 mb-0.5">GRATIS · 2 MENIT</p>
                  <p className="text-xl md:text-2xl font-bold leading-tight">Coba sample lesson dulu</p>
                  <p className="text-sm text-white/80 mt-1">Rasain Linguo sebelum daftar — tanpa sign up</p>
                </div>
              </div>
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white text-[#1A9E9E] flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* LEARNING PATH */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-baseline justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Jalur Belajarmu</h2>
              <p className="text-gray-500 mt-1 text-sm md:text-base">Tap tiap titik untuk lihat isi sesi. Ikutin path A1 → B2 secara berurutan.</p>
            </div>
            <div className="hidden md:flex items-center gap-4 text-xs">
              {Object.entries(LEVEL_COLORS).map(([lvl, c]) => (
                <div key={lvl} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-full bg-gradient-to-br ${c.node}`} />
                  <span className="text-gray-600 font-medium">{lvl}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            {/* SVG Path */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              preserveAspectRatio="none"
              aria-hidden
            >
              <defs>
                <linearGradient id="pathGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="35%" stopColor="#0ea5e9" />
                  <stop offset="65%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
              </defs>
            </svg>

            <div className="relative grid grid-cols-[auto_1fr] md:grid-cols-[auto_1fr] gap-x-4 md:gap-x-8">
              {/* Vertical rail line */}
              <div className="relative">
                <div className="absolute left-1/2 -translate-x-1/2 top-6 bottom-6 w-1 rounded-full bg-gradient-to-b from-emerald-400 via-sky-400 via-violet-400 to-rose-400 opacity-30" />

                {nodes.map((node, i) => (
                  <PathNodeButton
                    key={node.sublevel.code}
                    node={node}
                    total={nodes.length}
                    onClick={() => setOpenNode(node)}
                  />
                ))}
              </div>

              {/* Content cards */}
              <div className="space-y-2">
                {nodes.map((node, i) => (
                  <NodeCard
                    key={node.sublevel.code}
                    node={node}
                    onClick={() => setOpenNode(node)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Level overview cards */}
      <section className="pb-20 md:pb-28">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">Ringkasan Level</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {levels.map((level) => (
              <LevelOverview key={level.code} level={level} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="pb-20 md:pb-32">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative rounded-3xl bg-gray-900 text-white p-10 md:p-16 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#1A9E9E]/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl" />
            <div className="relative">
              <p className="text-sm uppercase tracking-widest text-amber-300 mb-4">Siap mulai?</p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                Perjalanan <span className="text-[#1A9E9E]">{meta.name}</span> kamu menunggu.
              </h2>
              <p className="text-gray-300 text-lg mb-8 max-w-xl">
                Konsultasi gratis via WhatsApp. Pengajar akan bantu tentukan level kamu dan rekomendasikan kelas yang pas.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20tertarik%20dengan%20kelas%20Bahasa%20${encodeURIComponent(meta.name)}`}
                  target="_blank" rel="noopener"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#1A9E9E] text-white rounded-full font-semibold hover:bg-[#147a7a] transition-colors"
                >Konsultasi Gratis
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </a>
                <Link href="/produk" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-colors">Lihat Harga</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL / DRAWER */}
      <AnimatePresence>
        {openNode && (
          <NodeDrawer node={openNode} onClose={() => setOpenNode(null)} langName={meta.name} langSlug={meta.slug} />
        )}
      </AnimatePresence>
    </main>
  );
}

// ==================================================
// Sub-components
// ==================================================

function StatCard({ label, value, hint, pulse = false }: { label: string; value: string; hint: string; pulse?: boolean }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl md:text-3xl font-bold text-gray-900">{value}</span>
        {pulse && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
      </div>
      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{label}</div>
      <div className="text-[11px] text-gray-400 mt-0.5">{hint}</div>
    </div>
  );
}

function PathNodeButton({ node, total, onClick }: { node: PathNode; total: number; onClick: () => void }) {
  const c = LEVEL_COLORS[node.level.code];
  const locked = !node.sublevel.preview;
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ type: "spring", stiffness: 200, damping: 15, delay: node.index * 0.04 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={`relative z-10 flex items-center justify-center w-14 h-14 md:w-16 md:h-16 my-6 md:my-8 rounded-2xl bg-gradient-to-br ${c.node} shadow-lg ${c.glow} ring-4 ${c.ring} text-white font-bold text-sm md:text-base`}
      title={`${node.sublevel.code} — ${node.sublevel.name}`}
    >
      <span>{node.sublevel.code}</span>
      {locked && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-gray-600 flex items-center justify-center text-[10px] shadow">🔒</span>
      )}
    </motion.button>
  );
}

function NodeCard({ node, onClick }: { node: PathNode; onClick: () => void }) {
  const c = LEVEL_COLORS[node.level.code];
  const locked = !node.sublevel.preview;
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: node.index * 0.04 + 0.05 }}
      className="my-6 md:my-8"
    >
      <button
        onClick={onClick}
        className={`w-full text-left p-5 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all group bg-white`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-full ${c.soft} ${c.text}`}>{node.level.name}</span>
              {locked ? (
                <span className="text-[10px] uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Preview-lock</span>
              ) : (
                <span className="text-[10px] uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Full preview</span>
              )}
            </div>
            <h3 className="font-bold text-lg md:text-xl text-gray-900">{node.sublevel.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{node.sublevel.sessions.length} sesi</p>
          </div>
          <svg className={`w-5 h-5 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </div>
      </button>
    </motion.div>
  );
}

function LevelOverview({ level }: { level: Level }) {
  const c = LEVEL_COLORS[level.code];
  const total = level.sublevels.reduce((s, sl) => s + sl.sessions.length, 0);
  return (
    <div className={`rounded-2xl p-5 md:p-6 ${c.bg}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.node} text-white font-bold flex items-center justify-center`}>{level.code}</div>
        <div>
          <h3 className={`font-bold text-lg ${c.text}`}>{level.name}</h3>
          <p className="text-xs text-gray-600">{total} sesi · {level.sublevels.length} sublevel</p>
        </div>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{level.description}</p>
    </div>
  );
}

function NodeDrawer({ node, onClose, langName, langSlug }: { node: PathNode; onClose: () => void; langName: string; langSlug: string }) {
  const c = LEVEL_COLORS[node.level.code];
  const { sublevel } = node;
  const isLocked = !sublevel.preview;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full md:w-[560px] bg-white z-50 overflow-y-auto shadow-2xl"
      >
        <div className={`sticky top-0 ${c.bg} border-b border-gray-100 px-6 py-5 flex items-center justify-between z-10`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.node} text-white font-bold flex items-center justify-center`}>{sublevel.code}</div>
            <div>
              <p className={`text-xs font-mono uppercase tracking-[0.15em] ${c.text}`}>{node.level.name}</p>
              <h3 className="font-bold text-lg">{sublevel.name}</h3>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/50 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-6">
          <p className="text-sm text-gray-600 mb-6">
            {sublevel.sessions.length} sesi · {isLocked ? "Preview terbatas — daftar untuk buka isi detail" : "Preview lengkap tersedia"}
          </p>

          <ol className="space-y-1">
            {sublevel.sessions.map((s, i) => (
              <SessionItem key={s.number} session={s} locked={isLocked} index={i} />
            ))}
          </ol>

          {isLocked && (
            <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50 border border-amber-200">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🔒</div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">Topik detail tersembunyi</p>
                  <p className="text-sm text-gray-600 mt-1">Daftar untuk akses kosakata, pola kalimat, latihan, dan referensi budaya tiap sesi.</p>
                  <a
                    href={`https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20tertarik%20daftar%20kelas%20${encodeURIComponent(langName)}%20level%20${encodeURIComponent(sublevel.code)}`}
                    target="_blank" rel="noopener"
                    className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-700 transition-colors"
                  >Daftar & buka detail
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </a>
                </div>
              </div>
            </div>
          )}

          {!isLocked && (
            <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-[#1A9E9E]/5 to-emerald-50 border border-[#1A9E9E]/20">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🎯</div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">Mau coba sampel sesi?</p>
                  <p className="text-sm text-gray-600 mt-1">Rasain gaya belajar Linguo — 2 menit, tanpa sign up.</p>
                  <Link
                    href={`/silabus/${langSlug}/coba`}
                    className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1A9E9E] text-white rounded-full text-sm font-semibold hover:bg-[#147a7a] transition-colors"
                  >Mulai sample lesson
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

function SessionItem({ session, locked, index }: { session: SessionPreview; locked: boolean; index: number }) {
  const [open, setOpen] = useState(false);
  const hasTopics = session.topics && session.topics.length > 0;
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      className="border-b border-gray-100 last:border-0"
    >
      <button
        onClick={() => hasTopics && setOpen((o) => !o)}
        disabled={!hasTopics}
        className="w-full py-3.5 flex items-start gap-3 text-left group"
      >
        <span className="font-mono text-xs text-gray-400 w-7 flex-shrink-0 pt-1">#{String(session.number).padStart(2, "0")}</span>
        <div className="flex-1 min-w-0">
          <div className={`font-medium text-sm md:text-base ${locked ? "text-gray-500" : "text-gray-900"}`}>{session.title}</div>
          {hasTopics && open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-1.5 mt-2 overflow-hidden"
            >
              {session.topics!.map((t) => (
                <span key={t} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </motion.div>
          )}
        </div>
        {hasTopics && (
          <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-1 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        )}
      </button>
    </motion.li>
  );
}
