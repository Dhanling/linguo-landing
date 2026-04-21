"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Category = "populer" | "eropa" | "asia" | "timur-tengah" | "nusantara";

interface Lang {
  slug: string;
  name: string;
  native: string;
  flag: string;
  available: boolean;
  category: Category[];
}

const LANGUAGES: Lang[] = [
  { slug: "english",   name: "Inggris",  native: "English",    flag: "🇬🇧", available: true,  category: ["populer", "eropa"] },
  { slug: "japanese",  name: "Jepang",   native: "日本語",     flag: "🇯🇵", available: true,  category: ["populer", "asia"] },
  { slug: "korean",    name: "Korea",    native: "한국어",     flag: "🇰🇷", available: false, category: ["populer", "asia"] },
  { slug: "mandarin",  name: "Mandarin", native: "中文",           flag: "🇨🇳", available: false, category: ["populer", "asia"] },
  { slug: "spanish",   name: "Spanyol",  native: "Español",           flag: "🇪🇸", available: false, category: ["populer", "eropa"] },
  { slug: "french",    name: "Prancis",  native: "Français",          flag: "🇫🇷", available: false, category: ["populer", "eropa"] },
  { slug: "arabic",    name: "Arab",     native: "العربية", flag: "🇸🇦", available: false, category: ["populer", "timur-tengah"] },
  { slug: "german",    name: "Jerman",   native: "Deutsch",                flag: "🇩🇪", available: false, category: ["eropa"] },
  { slug: "italian",   name: "Italia",   native: "Italiano",               flag: "🇮🇹", available: false, category: ["eropa"] },
  { slug: "dutch",     name: "Belanda",  native: "Nederlands",             flag: "🇳🇱", available: false, category: ["eropa"] },
  { slug: "russian",   name: "Rusia",    native: "Русский", flag: "🇷🇺", available: false, category: ["eropa"] },
  { slug: "turkish",   name: "Turki",    native: "Türkçe",      flag: "🇹🇷", available: false, category: ["eropa"] },
  { slug: "portuguese",name: "Portugis", native: "Português",         flag: "🇵🇹", available: false, category: ["eropa"] },
  { slug: "thai",      name: "Thailand", native: "ภาษาไทย", flag: "🇹🇭", available: false, category: ["asia"] },
  { slug: "vietnamese",name: "Vietnam",  native: "Tiếng Việt",   flag: "🇻🇳", available: false, category: ["asia"] },
  { slug: "hindi",     name: "Hindi",    native: "हिन्दी", flag: "🇮🇳", available: false, category: ["asia"] },
  { slug: "persian",   name: "Persia",   native: "فارسی", flag: "🇮🇷", available: false, category: ["timur-tengah"] },
  { slug: "hebrew",    name: "Ibrani",   native: "עברית", flag: "🇮🇱", available: false, category: ["timur-tengah"] },
  { slug: "javanese",  name: "Jawa",     native: "Basa Jawa",              flag: "🇮🇩", available: false, category: ["nusantara"] },
  { slug: "sundanese", name: "Sunda",    native: "Basa Sunda",             flag: "🇮🇩", available: false, category: ["nusantara"] },
  { slug: "bipa",      name: "BIPA",     native: "Bahasa Indonesia",       flag: "🇮🇩", available: false, category: ["nusantara"] },
];

const CATEGORIES: { key: string; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "populer", label: "Populer" },
  { key: "eropa", label: "Eropa" },
  { key: "asia", label: "Asia" },
  { key: "timur-tengah", label: "Timur Tengah" },
  { key: "nusantara", label: "Nusantara" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function PlacementPicker({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LANGUAGES.filter((l) => {
      const matchQ = !q || l.name.toLowerCase().includes(q) || l.native.toLowerCase().includes(q);
      const matchCat = activeCat === "all" || l.category.includes(activeCat as Category);
      return matchQ && matchCat;
    });
  }, [query, activeCat]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed z-[60] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-3 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Placement Test</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Pilih bahasa untuk tes level kamu</p>
                </div>
                <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari bahasa..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20 outline-none text-sm"
                />
              </div>

              {/* Category chips */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCat(cat.key)}
                    className={"px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors " +
                      (activeCat === cat.key
                        ? "bg-[#1A9E9E] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )
                    }
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Language list */}
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              <div className="space-y-1.5 pt-2">
                {filtered.map((lang) => {
                  if (lang.available) {
                    return (
                      <a
                        key={lang.slug}
                        href={"/silabus/" + lang.slug + "/coba"}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-[#1A9E9E] bg-[#1A9E9E]/5 hover:bg-[#1A9E9E]/10 transition-colors group"
                      >
                        <span className="text-2xl">{lang.flag}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-gray-900">Bahasa {lang.name}</div>
                          <div className="text-xs text-gray-500">{lang.native}</div>
                        </div>
                        <span className="text-xs font-bold text-white bg-[#1A9E9E] px-3.5 py-1.5 rounded-full group-hover:bg-[#147a7a] transition-colors flex-shrink-0">
                          Mulai Test
                        </span>
                      </a>
                    );
                  }
                  return (
                    <a
                      key={lang.slug}
                      href={"https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20mau%20placement%20test%20Bahasa%20" + encodeURIComponent(lang.name)}
                      target="_blank"
                      rel="noopener"
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-2xl opacity-60">{lang.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-600">Bahasa {lang.name}</div>
                        <div className="text-xs text-gray-400">{lang.native}</div>
                      </div>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0">
                        Segera
                      </span>
                    </a>
                  );
                })}

                {filtered.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">Bahasa tidak ditemukan</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex-shrink-0">
              <p className="text-xs text-gray-500 text-center">
                Bahasa lain?{" "}
                <a href="https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20mau%20placement%20test" target="_blank" rel="noopener" className="text-[#1A9E9E] font-semibold hover:underline">
                  Hubungi kami
                </a>
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
