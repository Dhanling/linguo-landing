"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { LanguageMeta } from "@/data/curriculum";
import { regionLabels } from "@/data/curriculum/languages";

export default function SilabusHub({ languages }: { languages: LanguageMeta[] }) {
  const [query, setQuery] = useState("");
  const [activeRegion, setActiveRegion] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return languages.filter((l) => {
      const matchQuery =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.slug.includes(q);
      const matchRegion = activeRegion === "all" || l.region === activeRegion;
      return matchQuery && matchRegion;
    });
  }, [query, activeRegion, languages]);

  const featured = filtered.filter((l) => l.featured);
  const rest = filtered.filter((l) => !l.featured);
  const grouped = useMemo(() => {
    const g: Record<string, LanguageMeta[]> = {};
    rest.forEach((l) => { (g[l.region] ||= []).push(l); });
    return g;
  }, [rest]);

  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative pt-24 md:pt-36 pb-20 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#1A9E9E]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-200/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1A9E9E]/10 text-[#1A9E9E] text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-[#1A9E9E] animate-pulse" />
              Kurikulum Transparan · CEFR-aligned
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-8">
              Lihat apa yang akan
              <br />
              kamu{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-[#1A9E9E]">pelajari.</span>
                <span className="absolute bottom-1 md:bottom-2 left-0 right-0 h-3 md:h-5 bg-amber-300/60 -z-0" />
              </span>
            </h1>

            <p className="text-lg md:text-2xl text-gray-600 max-w-2xl leading-relaxed">
              304 sesi per bahasa. 4 level dari A1 sampai B2. Pilih bahasa — lihat silabus lengkap sebelum kamu daftar.
            </p>

            <div className="mt-10 flex flex-wrap gap-8 text-sm text-gray-500">
              <div><span className="block text-3xl font-bold text-gray-900">60+</span>Bahasa</div>
              <div><span className="block text-3xl font-bold text-gray-900">304</span>Sesi per Bahasa</div>
              <div><span className="block text-3xl font-bold text-gray-900">4</span>Level CEFR</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SEARCH + FILTER */}
      <section className="sticky top-16 md:top-20 z-20 bg-white/90 backdrop-blur-md border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row gap-4 md:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari bahasa... (contoh: Jepang, English, Sunda)"
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20 outline-none text-base"
            />
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
            {[["all", "Semua"], ...Object.entries(regionLabels)].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveRegion(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeRegion === key
                    ? "bg-[#1A9E9E] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-baseline justify-between mb-10">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Bahasa Unggulan</h2>
              <p className="text-sm text-gray-500 hidden md:block">Paling diminati di Linguo.id</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {featured.map((lang, i) => (
                <LanguageCard key={lang.slug} lang={lang} index={i} large />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BY REGION */}
      {Object.keys(grouped).length > 0 && (
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6 space-y-16">
            {Object.entries(grouped).map(([region, items]) => (
              <div key={region}>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">
                  {regionLabels[region]}
                  <span className="ml-3 text-sm font-normal text-gray-400">{items.length} bahasa</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {items.map((lang, i) => (
                    <LanguageCard key={lang.slug} lang={lang} index={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* EMPTY */}
      <AnimatePresence>
        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-32 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl text-gray-500">Tidak ada bahasa yang cocok dengan pencarian kamu.</p>
            <button onClick={() => { setQuery(""); setActiveRegion("all"); }} className="mt-6 text-[#1A9E9E] font-medium hover:underline">Reset filter</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA STRIP */}
      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative rounded-3xl bg-gradient-to-br from-[#1A9E9E] to-[#0E6B6B] p-10 md:p-16 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-300/30 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 max-w-2xl">
                Bahasa kamu belum ada di sini?
              </h2>
              <p className="text-white/90 text-lg mb-8 max-w-xl">
                Kami terus menambah bahasa baru. Hubungi kami untuk request kurikulum kustom atau kelas perusahaan.
              </p>
              <a
                href="https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20ingin%20tanya%20soal%20kurikulum%20bahasa"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-amber-400 text-gray-900 rounded-full font-semibold hover:bg-amber-300 transition-colors"
              >
                Tanya via WhatsApp
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function LanguageCard({ lang, index, large = false }: { lang: LanguageMeta; index: number; large?: boolean }) {
  const isLocked = !lang.available;
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.4) }}
      whileHover={{ y: -4 }}
      className={`group relative bg-white rounded-2xl border border-gray-100 hover:border-[#1A9E9E]/40 hover:shadow-lg transition-all cursor-pointer ${
        large ? "p-6 md:p-7" : "p-4 md:p-5"
      } ${isLocked ? "opacity-90" : ""}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`${large ? "text-4xl" : "text-3xl"}`}>{lang.flag}</div>
        {isLocked ? (
          <span className="text-[10px] uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Segera</span>
        ) : (
          <span className="text-[10px] uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Tersedia</span>
        )}
      </div>
      <h3 className={`font-bold text-gray-900 mb-1 ${large ? "text-xl md:text-2xl" : "text-base"}`}>
        Bahasa {lang.name}
      </h3>
      <p className="text-sm text-gray-500 mb-2">{lang.nativeName}</p>
      {large && lang.description && (
        <p className="text-sm text-gray-600 leading-relaxed mt-3">{lang.description}</p>
      )}
      <div className="mt-4 text-sm font-medium text-[#1A9E9E] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
        {isLocked ? "Waitlist" : "Lihat silabus"}
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </motion.div>
  );

  if (isLocked) {
    return (
      <a
        href={`https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20tertarik%20dengan%20kelas%20Bahasa%20${encodeURIComponent(lang.name)}`}
        target="_blank"
        rel="noopener"
      >
        {content}
      </a>
    );
  }
  return <Link href={`/silabus/${lang.slug}`}>{content}</Link>;
}
