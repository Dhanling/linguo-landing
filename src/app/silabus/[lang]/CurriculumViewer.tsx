"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { LanguageCurriculum, Level, Sublevel } from "@/data/curriculum";

const levelColors: Record<string, { bg: string; text: string; accent: string }> = {
  A1: { bg: "bg-emerald-50",  text: "text-emerald-700",  accent: "bg-emerald-500" },
  A2: { bg: "bg-sky-50",      text: "text-sky-700",      accent: "bg-sky-500" },
  B1: { bg: "bg-violet-50",   text: "text-violet-700",   accent: "bg-violet-500" },
  B2: { bg: "bg-rose-50",     text: "text-rose-700",     accent: "bg-rose-500" },
};

export default function CurriculumViewer({ curriculum }: { curriculum: LanguageCurriculum }) {
  const { meta, overview, levels } = curriculum;

  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-br from-[#1A9E9E]/10 to-amber-200/30 rounded-full blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto px-6">
          <Link href="/silabus" className="text-sm text-gray-500 hover:text-[#1A9E9E] inline-flex items-center gap-1 mb-8">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Semua silabus
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-6xl md:text-7xl">{meta.flag}</span>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-widest">Silabus</p>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Bahasa {meta.name}</h1>
              <p className="text-lg md:text-xl text-gray-500 italic mt-1">{meta.nativeName}</p>
            </div>
          </div>

          <p className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-3xl">{overview}</p>

          <div className="mt-10 flex flex-wrap gap-6 text-sm">
            <Stat label="Total Sesi" value="192" />
            <Stat label="Level" value="A1 → B2" />
            <Stat label="Sublevel" value="12" />
            <Stat label="Standard" value="CEFR" />
          </div>
        </div>
      </section>

      {/* LEVELS */}
      <section className="pb-20 md:pb-32">
        <div className="max-w-5xl mx-auto px-6 space-y-20 md:space-y-28">
          {levels.map((level, i) => (
            <LevelSection key={level.code} level={level} index={i} langName={meta.name} />
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="pb-20 md:pb-32">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative rounded-3xl bg-gray-900 text-white p-10 md:p-16 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#1A9E9E]/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl" />
            <div className="relative">
              <p className="text-sm uppercase tracking-widest text-amber-300 mb-4">Siap mulai?</p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                Mulai perjalanan bahasa <span className="text-[#1A9E9E]">{meta.name}</span> kamu hari ini.
              </h2>
              <p className="text-gray-300 text-lg mb-8 max-w-xl">
                Konsultasi gratis via WhatsApp. Pengajar akan bantu tentukan level kamu dan rekomendasikan kelas yang pas.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20tertarik%20dengan%20kelas%20Bahasa%20${encodeURIComponent(meta.name)}`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#1A9E9E] text-white rounded-full font-semibold hover:bg-[#147a7a] transition-colors"
                >
                  Konsultasi Gratis
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </a>
                <Link href="/produk" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-colors">
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl md:text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-xs uppercase tracking-widest text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function LevelSection({ level, index, langName }: { level: Level; index: number; langName: string }) {
  const c = levelColors[level.code];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
    >
      <div className={`flex items-center gap-4 mb-8 ${c.bg} rounded-2xl p-5 md:p-6`}>
        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-xl ${c.accent} text-white font-bold text-xl md:text-2xl flex items-center justify-center`}>
          {level.code}
        </div>
        <div className="flex-1">
          <h2 className={`text-2xl md:text-3xl font-bold ${c.text}`}>{level.name}</h2>
          <p className="text-gray-700 text-sm md:text-base mt-1">{level.description}</p>
        </div>
      </div>

      <div className="space-y-4">
        {level.sublevels.map((sub) => (
          <SublevelCard key={sub.code} sublevel={sub} langName={langName} />
        ))}
      </div>
    </motion.div>
  );
}

function SublevelCard({ sublevel, langName }: { sublevel: Sublevel; langName: string }) {
  const [open, setOpen] = useState(sublevel.preview);

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left">
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-gray-400 tracking-widest">{sublevel.code}</span>
          <div>
            <div className="font-semibold text-lg">{sublevel.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {sublevel.sessions.length} sesi · {sublevel.preview ? "Preview lengkap" : "Judul sesi + daftarkan untuk detail"}
            </div>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-gray-100">
              <ol className="divide-y divide-gray-100">
                {sublevel.sessions.map((s) => (
                  <li key={s.number} className="py-4 flex gap-4">
                    <span className="font-mono text-xs text-gray-400 w-8 flex-shrink-0 pt-1">#{String(s.number).padStart(2, "0")}</span>
                    <div className="flex-1">
                      <div className={`font-medium ${sublevel.preview ? "text-gray-900" : "text-gray-500"}`}>
                        {s.title}
                      </div>
                      {s.topics && s.topics.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {s.topics.map((t) => (
                            <span key={t} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>

              {!sublevel.preview && (
                <div className="mt-6 p-5 bg-gradient-to-br from-[#1A9E9E]/5 to-amber-50 rounded-xl border border-[#1A9E9E]/10">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🔒</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Detail topik tersembunyi</p>
                      <p className="text-sm text-gray-600 mt-1">Daftar untuk akses materi lengkap tiap sesi: kosakata, pola kalimat, latihan, dan referensi budaya.</p>
                      <a
                        href={`https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20tertarik%20daftar%20kelas%20${encodeURIComponent(langName)}%20level%20${encodeURIComponent(sublevel.code)}`}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-[#1A9E9E] mt-3 hover:underline"
                      >
                        Daftar & buka detail →
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
