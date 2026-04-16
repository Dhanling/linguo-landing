"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";
import { languages, regionLabels } from "@/data/curriculum/languages";

const RECENT_KEY = "silabus_recent_langs";

export default function LanguageSwitcher({ currentSlug, currentName, currentFlag }: {
  currentSlug: string; currentName: string; currentFlag: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeRegion, setActiveRegion] = useState<string>("all");
  const [recent, setRecent] = useState<string[]>([]);

  // Load recent from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) setRecent(JSON.parse(stored));
    } catch {}
  }, []);

  // Save current to recent when modal opens
  useEffect(() => {
    if (!open) return;
    try {
      const existing = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as string[];
      const updated = [currentSlug, ...existing.filter((s) => s !== currentSlug)].slice(0, 4);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      setRecent(updated);
    } catch {}
  }, [open, currentSlug]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return languages.filter((l) => {
      if (l.slug === currentSlug) return false;
      const mq = !q || l.name.toLowerCase().includes(q) || l.nativeName.toLowerCase().includes(q);
      const mr = activeRegion === "all" || l.region === activeRegion;
      return mq && mr;
    });
  }, [query, activeRegion, currentSlug]);

  const recentLangs = recent
    .map((s) => languages.find((l) => l.slug === s))
    .filter((l): l is NonNullable<typeof l> => !!l && l.slug !== currentSlug);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 text-sm text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
      >
        <span className="text-base">{currentFlag}</span>
        <span className="font-medium">{currentName}</span>
        <Icons.ArrowLeftRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs text-gray-500">Ganti</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-4 top-[5vh] bottom-[5vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[640px] md:top-[8vh] md:bottom-[8vh] bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <h2 className="text-xl font-bold">Pilih Bahasa</h2>
                <button onClick={() => setOpen(false)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center">
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              {/* Search + filter */}
              <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0 space-y-3">
                <div className="relative">
                  <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari bahasa..."
                    className="w-full pl-11 pr-4 py-3 rounded-full border border-gray-200 focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20 outline-none text-sm"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6">
                  {[["all", "Semua"], ...Object.entries(regionLabels)].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setActiveRegion(key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                        activeRegion === key
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {recentLangs.length > 0 && !query && activeRegion === "all" && (
                  <div className="mb-6">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-semibold">Baru dilihat</p>
                    <div className="grid grid-cols-2 gap-2">
                      {recentLangs.map((l) => <LangCard key={l.slug} lang={l} compact />)}
                    </div>
                  </div>
                )}

                {filtered.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {filtered.map((l) => <LangCard key={l.slug} lang={l} />)}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="text-gray-500">Bahasa ga ketemu</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function LangCard({ lang, compact = false }: { lang: { slug: string; name: string; nativeName: string; flag: string; available: boolean; featured?: boolean }; compact?: boolean }) {
  const available = lang.available;
  const content = (
    <div className={`group p-3 md:p-4 rounded-2xl border transition-all ${
      available ? "border-gray-100 hover:border-[#1A9E9E] hover:bg-[#1A9E9E]/5" : "border-gray-100 bg-gray-50/50 hover:border-gray-200"
    } cursor-pointer`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{lang.flag}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-sm text-gray-900 truncate">{lang.name}</p>
            {lang.featured && !compact && <span className="text-[9px] uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">★</span>}
          </div>
          <p className="text-xs text-gray-500 truncate">{lang.nativeName}</p>
          {!available && <p className="text-[10px] text-amber-600 mt-1 font-semibold uppercase tracking-wider">Segera hadir</p>}
        </div>
      </div>
    </div>
  );

  if (available) {
    return <Link href={`/silabus/${lang.slug}`}>{content}</Link>;
  }
  return (
    <a
      href={`https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20tertarik%20Bahasa%20${encodeURIComponent(lang.name)}`}
      target="_blank"
      rel="noopener"
    >{content}</a>
  );
}
