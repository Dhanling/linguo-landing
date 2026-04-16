#!/usr/bin/env node
// Rebuild PlacementPicker: fix emoji, add search, categories
// Run: cd ~/linguo-landing && node fix-placement-picker.mjs

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const filePath = path.join(ROOT, 'src/components/PlacementPicker.tsx');

console.log('📝 Rebuild PlacementPicker...\n');

const code = `"use client";

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
  { slug: "english",   name: "Inggris",  native: "English",    flag: "\uD83C\uDDEC\uD83C\uDDE7", available: true,  category: ["populer", "eropa"] },
  { slug: "japanese",  name: "Jepang",   native: "\u65E5\u672C\u8A9E",     flag: "\uD83C\uDDEF\uD83C\uDDF5", available: false, category: ["populer", "asia"] },
  { slug: "korean",    name: "Korea",    native: "\uD55C\uAD6D\uC5B4",     flag: "\uD83C\uDDF0\uD83C\uDDF7", available: false, category: ["populer", "asia"] },
  { slug: "mandarin",  name: "Mandarin", native: "\u4E2D\u6587",           flag: "\uD83C\uDDE8\uD83C\uDDF3", available: false, category: ["populer", "asia"] },
  { slug: "spanish",   name: "Spanyol",  native: "Espa\u00F1ol",           flag: "\uD83C\uDDEA\uD83C\uDDF8", available: false, category: ["populer", "eropa"] },
  { slug: "french",    name: "Prancis",  native: "Fran\u00E7ais",          flag: "\uD83C\uDDEB\uD83C\uDDF7", available: false, category: ["populer", "eropa"] },
  { slug: "arabic",    name: "Arab",     native: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629", flag: "\uD83C\uDDF8\uD83C\uDDE6", available: false, category: ["populer", "timur-tengah"] },
  { slug: "german",    name: "Jerman",   native: "Deutsch",                flag: "\uD83C\uDDE9\uD83C\uDDEA", available: false, category: ["eropa"] },
  { slug: "italian",   name: "Italia",   native: "Italiano",               flag: "\uD83C\uDDEE\uD83C\uDDF9", available: false, category: ["eropa"] },
  { slug: "dutch",     name: "Belanda",  native: "Nederlands",             flag: "\uD83C\uDDF3\uD83C\uDDF1", available: false, category: ["eropa"] },
  { slug: "russian",   name: "Rusia",    native: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439", flag: "\uD83C\uDDF7\uD83C\uDDFA", available: false, category: ["eropa"] },
  { slug: "turkish",   name: "Turki",    native: "T\u00FCrk\u00E7e",      flag: "\uD83C\uDDF9\uD83C\uDDF7", available: false, category: ["eropa"] },
  { slug: "portuguese",name: "Portugis", native: "Portugu\u00EAs",         flag: "\uD83C\uDDF5\uD83C\uDDF9", available: false, category: ["eropa"] },
  { slug: "thai",      name: "Thailand", native: "\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22", flag: "\uD83C\uDDF9\uD83C\uDDED", available: false, category: ["asia"] },
  { slug: "vietnamese",name: "Vietnam",  native: "Ti\u1EBFng Vi\u1EC7t",   flag: "\uD83C\uDDFB\uD83C\uDDF3", available: false, category: ["asia"] },
  { slug: "hindi",     name: "Hindi",    native: "\u0939\u093F\u0928\u094D\u0926\u0940", flag: "\uD83C\uDDEE\uD83C\uDDF3", available: false, category: ["asia"] },
  { slug: "persian",   name: "Persia",   native: "\u0641\u0627\u0631\u0633\u06CC", flag: "\uD83C\uDDEE\uD83C\uDDF7", available: false, category: ["timur-tengah"] },
  { slug: "hebrew",    name: "Ibrani",   native: "\u05E2\u05D1\u05E8\u05D9\u05EA", flag: "\uD83C\uDDEE\uD83C\uDDF1", available: false, category: ["timur-tengah"] },
  { slug: "javanese",  name: "Jawa",     native: "Basa Jawa",              flag: "\uD83C\uDDEE\uD83C\uDDE9", available: false, category: ["nusantara"] },
  { slug: "sundanese", name: "Sunda",    native: "Basa Sunda",             flag: "\uD83C\uDDEE\uD83C\uDDE9", available: false, category: ["nusantara"] },
  { slug: "bipa",      name: "BIPA",     native: "Bahasa Indonesia",       flag: "\uD83C\uDDEE\uD83C\uDDE9", available: false, category: ["nusantara"] },
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
`;

fs.writeFileSync(filePath, code, 'utf8');
console.log('  \u2705 PlacementPicker.tsx rebuilt\n');

console.log('\uD83D\uDE80 Git commit + push...\n');
try {
  execSync('git add -A', { stdio: 'inherit', cwd: ROOT });
  execSync('git commit -m "fix(picker): rebuild with search, categories, fixed emoji"', { stdio: 'inherit', cwd: ROOT });
  execSync('git push', { stdio: 'inherit', cwd: ROOT });
  console.log('\n\u2705 Pushed\n');
} catch (e) {
  console.log('\n\u26A0\uFE0F  Git error:', e.message);
  console.log('Manual: cd ~/linguo-landing && git add -A && git commit -m "fix: picker" && git push');
}

try { fs.unlinkSync(fileURLToPath(import.meta.url)); } catch {}
