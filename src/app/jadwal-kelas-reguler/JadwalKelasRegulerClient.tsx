// src/app/jadwal-kelas-reguler/JadwalKelasRegulerClient.tsx
// Client component: tab Kelas Reguler + ETP (TOEFL/IELTS)
"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Calendar, Clock, Users, MessageCircle,
  ChevronRight, BookOpen, Award,
} from "lucide-react";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Batch {
  id: string;
  batch_code: string;
  batch_month: string;
  language: string;
  level: string;
  session_day: string | null;
  session_start_time: string | null;
  session_end_time: string | null;
  session_duration_min: number;
  total_sessions: number;
  start_date: string;
  end_date: string | null;
  price_small_group: number;
  price_regular: number;
  min_capacity: number;
  max_capacity: number;
  actual_enrolled: number;
  current_tier: string;
  current_price_per_student: number | null;
  status_display: string;
  capacity_hint: string;
}

interface EtpProgram {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
  days: string;
  time: string;
  startDate: string;
  duration: string;
  sessions: number;
  sessionMin: number;
  price: number;
  highlights: string[];
  color: string; // teal | blue
}

// ─────────────────────────────────────────────────────────────────────────────
// Static ETP data (TOEFL & IELTS Juni 2026)
// ─────────────────────────────────────────────────────────────────────────────

const ETP_PROGRAMS: EtpProgram[] = [
  {
    id: "toefl-jun26",
    title: "TOEFL Preparation",
    subtitle: "Batch Juni 2026",
    icon: "📝",
    badge: "TOEFL",
    days: "Senin & Rabu",
    time: "19.30 – 21.00 WIB",
    startDate: "1 Juni 2026",
    duration: "90 menit/sesi",
    sessions: 12,
    sessionMin: 90,
    price: 750000,
    highlights: [
      "Latihan Listening, Structure, Reading intensif",
      "Bank soal TOEFL ITP & PBT terlengkap",
      "Simulasi ujian sebelum test hari H",
      "Target skor 500+ dalam 1 batch",
    ],
    color: "teal",
  },
  {
    id: "ielts-jun26",
    title: "IELTS Preparation",
    subtitle: "Batch Juni 2026",
    icon: "🎓",
    badge: "IELTS",
    days: "Selasa & Kamis",
    time: "19.30 – 21.00 WIB",
    startDate: "2 Juni 2026",
    duration: "90 menit/sesi",
    sessions: 12,
    sessionMin: 90,
    price: 850000,
    highlights: [
      "4 skill: Listening, Reading, Writing, Speaking",
      "Latihan Task 1 & Task 2 Writing dengan feedback",
      "Mock speaking session 1-on-1",
      "Target band 6.5+ dalam 1 batch",
    ],
    color: "blue",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const LANGUAGE_FLAGS: Record<string, string> = {
  "English Conversation": "🇬🇧",
  "Spanyol": "🇪🇸",
  "Jerman": "🇩🇪",
  "Bahasa Isyarat": "🤟",
  "Belanda": "🇳🇱",
  "Italia": "🇮🇹",
  "Jepang": "🇯🇵",
  "Korea": "🇰🇷",
  "Prancis": "🇫🇷",
  "Mandarin": "🇨🇳",
  "Arab": "🇸🇦",
  "Tagalog": "🇵🇭",
};

const WA_NUMBER = "6282116859493";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatIDR(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function buildWAMessage(batch: Batch): string {
  const text = [
    `Halo Linguo! Saya tertarik mendaftar Kelas Reguler:`,
    ``,
    `📚 Bahasa: ${batch.language} ${batch.level}`,
    `🏷️ Batch: ${batch.batch_code}`,
    `📅 Jadwal: ${batch.session_day}, ${batch.session_start_time?.slice(0, 5)} - ${batch.session_end_time?.slice(0, 5)}`,
    `🗓️ Mulai: ${formatDate(batch.start_date)}`,
    `📖 Total: ${batch.total_sessions} sesi × ${batch.session_duration_min} menit`,
    ``,
    `Mohon info lebih lanjut & cara pendaftarannya. Terima kasih!`,
  ].join("\n");
  return encodeURIComponent(text);
}

function buildEtpWAMessage(program: EtpProgram): string {
  const text = [
    `Halo Linguo! Saya tertarik mendaftar program ETP:`,
    ``,
    `🎯 Program: ${program.title}`,
    `📅 Batch: ${program.subtitle}`,
    `⏰ Jadwal: ${program.days}, ${program.time}`,
    `🗓️ Mulai: ${program.startDate}`,
    ``,
    `Mohon info lebih lanjut & cara pendaftarannya. Terima kasih!`,
  ].join("\n");
  return encodeURIComponent(text);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "reguler" | "etp";

export default function JadwalKelasRegulerClient({ batches }: { batches: Batch[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("reguler");
  const [search, setSearch] = useState("");
  const [selectedLang, setSelectedLang] = useState<string>("all");

  const uniqueLanguages = useMemo(
    () => Array.from(new Set(batches.map((b) => b.language))).sort(),
    [batches]
  );

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const matchesSearch =
        search === "" ||
        b.language.toLowerCase().includes(search.toLowerCase()) ||
        b.batch_code.toLowerCase().includes(search.toLowerCase()) ||
        b.level.toLowerCase().includes(search.toLowerCase());
      const matchesLang = selectedLang === "all" || b.language === selectedLang;
      return matchesSearch && matchesLang;
    });
  }, [batches, search, selectedLang]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-teal-50/20 to-white">

      {/* ── HERO ── */}
      <section className="relative px-4 pt-12 pb-8 md:pt-20 md:pb-12 max-w-6xl mx-auto">
        <div className="text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-block px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold mb-4">
              📅 Jadwal Kelas Linguo
            </span>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
              Jadwal <span className="text-teal-600">Kelas & Program</span>
            </h1>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
              Pilih program yang sesuai: Kelas Reguler untuk belajar bahasa baru, atau ETP untuk persiapan sertifikasi TOEFL & IELTS.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── TAB SWITCHER ── */}
      <section className="px-4 pb-6 max-w-6xl mx-auto">
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit mx-auto">
          <button
            onClick={() => setActiveTab("reguler")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "reguler"
                ? "bg-white text-teal-700 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Kelas Reguler
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
              activeTab === "reguler" ? "bg-teal-100 text-teal-700" : "bg-slate-200 text-slate-600"
            }`}>
              {batches.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("etp")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "etp"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <Award className="h-4 w-4" />
            ETP — TOEFL & IELTS
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
              activeTab === "etp" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600"
            }`}>
              {ETP_PROGRAMS.length}
            </span>
          </button>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {activeTab === "reguler" ? (
          <motion.div
            key="reguler"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* ── REGULER: Filter bar ── */}
            <section className="px-4 pb-6 max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari bahasa atau kode batch..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2 flex-wrap md:flex-nowrap">
                  <button
                    onClick={() => setSelectedLang("all")}
                    className={`h-11 px-4 rounded-xl text-sm font-medium transition-all ${
                      selectedLang === "all"
                        ? "bg-teal-600 text-white shadow-sm"
                        : "bg-white border border-slate-200 text-slate-700 hover:border-teal-300"
                    }`}
                  >
                    Semua
                  </button>
                  {uniqueLanguages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLang(lang)}
                      className={`h-11 px-4 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                        selectedLang === lang
                          ? "bg-teal-600 text-white shadow-sm"
                          : "bg-white border border-slate-200 text-slate-700 hover:border-teal-300"
                      }`}
                    >
                      {LANGUAGE_FLAGS[lang] || "🌐"} {lang}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* ── REGULER: Table/Cards ── */}
            <section className="px-4 pb-16 max-w-6xl mx-auto">
              {filteredBatches.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                  <p className="text-slate-500 mb-2">Tidak ada batch yang cocok</p>
                  <p className="text-xs text-slate-400">
                    {batches.length === 0
                      ? "Batch baru akan segera dibuka. Follow Instagram @linguo.id untuk info terbaru!"
                      : "Coba ubah filter pencarian"}
                  </p>
                </div>
              ) : (
                <>
                  {/* DESKTOP */}
                  <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Bahasa</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Level</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Jadwal</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Mulai</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Total Sesi</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700">Harga</th>
                          <th className="text-center py-3 px-4 font-semibold text-slate-700">Slot</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBatches.map((batch) => {
                          const slotsLeft = batch.max_capacity - batch.actual_enrolled;
                          const slotBgClass =
                            slotsLeft <= 3
                              ? "bg-red-100 text-red-700"
                              : slotsLeft <= 5
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700";
                          const waLink = `https://wa.me/${WA_NUMBER}?text=${buildWAMessage(batch)}`;
                          return (
                            <tr
                              key={batch.id}
                              id={batch.batch_code}
                              className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors scroll-mt-20"
                            >
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{LANGUAGE_FLAGS[batch.language] || "🌐"}</span>
                                  <span className="font-semibold text-slate-900">{batch.language}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-slate-600">{batch.level}</td>
                              <td className="py-4 px-4">
                                <div className="text-slate-900 font-medium">{batch.session_day}</div>
                                <div className="text-xs text-slate-500 tabular-nums">
                                  {batch.session_start_time?.slice(0, 5)} -{" "}
                                  {batch.session_end_time?.slice(0, 5)} WIB
                                </div>
                              </td>
                              <td className="py-4 px-4 text-slate-600 text-xs">{formatDate(batch.start_date)}</td>
                              <td className="py-4 px-4 text-slate-600 text-xs">
                                {batch.total_sessions} × {batch.session_duration_min} mnt
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="font-bold text-slate-900 tabular-nums">
                                  {formatIDR(batch.current_price_per_student || batch.price_regular)}
                                </div>
                                <div className="text-[10px] text-slate-500">/siswa/batch</div>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${slotBgClass}`}>
                                  {slotsLeft} slot
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  Daftar
                                </a>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE */}
                  <div className="md:hidden space-y-3">
                    {filteredBatches.map((batch) => {
                      const slotsLeft = batch.max_capacity - batch.actual_enrolled;
                      const waLink = `https://wa.me/${WA_NUMBER}?text=${buildWAMessage(batch)}`;
                      return (
                        <div
                          key={batch.id}
                          id={batch.batch_code}
                          className="bg-white rounded-2xl border border-slate-200 p-4 scroll-mt-20"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{LANGUAGE_FLAGS[batch.language] || "🌐"}</span>
                              <div>
                                <div className="font-bold text-slate-900">{batch.language}</div>
                                <div className="text-xs text-slate-500">Level {batch.level}</div>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                slotsLeft <= 3
                                  ? "bg-red-100 text-red-700"
                                  : slotsLeft <= 5
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {slotsLeft} slot tersisa
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                            <div className="flex items-start gap-1.5 text-slate-600">
                              <Calendar className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                              <span>
                                {batch.session_day}, {batch.session_start_time?.slice(0, 5)}
                              </span>
                            </div>
                            <div className="flex items-start gap-1.5 text-slate-600">
                              <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                              <span>
                                {batch.total_sessions} sesi × {batch.session_duration_min}mnt
                              </span>
                            </div>
                            <div className="flex items-start gap-1.5 text-slate-600 col-span-2">
                              <span className="text-[10px]">📆</span>
                              <span>Mulai {formatDate(batch.start_date)}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <div>
                              <div className="text-lg font-bold text-slate-900 tabular-nums">
                                {formatIDR(batch.current_price_per_student || batch.price_regular)}
                              </div>
                              <div className="text-[10px] text-slate-500">/siswa/batch</div>
                            </div>
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors"
                            >
                              <MessageCircle className="h-4 w-4" />
                              Daftar via WA
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </section>

            {/* ── REGULER: Info footer ── */}
            <section className="px-4 pb-16 max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-6 md:p-8 border border-teal-200">
                <h2 className="text-xl font-bold text-slate-900 mb-3">💡 Kenapa Kelas Reguler?</h2>
                <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-700">
                  <div>
                    <div className="font-semibold mb-1">💰 Lebih Hemat</div>
                    <p className="text-xs text-slate-600">Harga sampai 50% lebih murah dari kelas Private. Cocok untuk yang baru mulai belajar.</p>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">👥 Belajar Bareng</div>
                    <p className="text-xs text-slate-600">Motivasi lebih tinggi dengan teman kelas. Diskusi & praktik langsung jadi seru!</p>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">📅 Jadwal Pasti</div>
                    <p className="text-xs text-slate-600">Jadwal rutin tiap minggu. Ga bingung ngatur waktu, tinggal masuk Zoom sesuai jam.</p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-teal-200/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <p className="text-sm text-slate-600">Butuh sertifikasi internasional?</p>
                  <button
                    onClick={() => setActiveTab("etp")}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
                  >
                    Lihat Program ETP (TOEFL & IELTS) <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>
          </motion.div>
        ) : (
          /* ── ETP TAB ── */
          <motion.div
            key="etp"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* ETP Hero banner */}
            <section className="px-4 pb-8 max-w-6xl mx-auto">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-8 text-white text-center">
                <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-3">
                  🎯 English Test Preparation
                </span>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  Persiapan TOEFL & IELTS
                </h2>
                <p className="text-blue-100 text-sm md:text-base max-w-xl mx-auto">
                  Batch Juni 2026 — Kelas intensif 2× seminggu dengan tutor berpengalaman. Raih skor target untuk studi & karir.
                </p>
              </div>
            </section>

            {/* ETP Cards */}
            <section className="px-4 pb-12 max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6">
                {ETP_PROGRAMS.map((program) => {
                  const waLink = `https://wa.me/${WA_NUMBER}?text=${buildEtpWAMessage(program)}`;
                  const isTeal = program.color === "teal";
                  return (
                    <div
                      key={program.id}
                      className={`bg-white rounded-2xl border-2 overflow-hidden ${
                        isTeal ? "border-teal-200" : "border-blue-200"
                      }`}
                    >
                      {/* Card header */}
                      <div className={`px-6 py-5 ${isTeal ? "bg-teal-50" : "bg-blue-50"}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{program.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-slate-900">{program.title}</h3>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isTeal ? "bg-teal-600 text-white" : "bg-blue-600 text-white"
                                }`}>
                                  {program.badge}
                                </span>
                              </div>
                              <p className={`text-xs font-medium mt-0.5 ${isTeal ? "text-teal-700" : "text-blue-700"}`}>
                                {program.subtitle}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-slate-900 tabular-nums">
                              {formatIDR(program.price)}
                            </div>
                            <div className="text-[10px] text-slate-500">/siswa/batch</div>
                          </div>
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="px-6 py-5 space-y-4">
                        {/* Schedule info */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-start gap-2 text-slate-600">
                            <Calendar className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
                            <div>
                              <div className="font-medium text-slate-800">{program.days}</div>
                              <div className="text-xs">{program.time}</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 text-slate-600">
                            <Clock className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
                            <div>
                              <div className="font-medium text-slate-800">{program.sessions} sesi</div>
                              <div className="text-xs">{program.duration}</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 text-slate-600 col-span-2">
                            <span className="text-base">📆</span>
                            <div>
                              <span className="font-medium text-slate-800">Mulai: </span>
                              {program.startDate}
                            </div>
                          </div>
                        </div>

                        {/* Highlights */}
                        <div className="space-y-1.5">
                          {program.highlights.map((h, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <span className={`mt-0.5 text-xs font-bold ${isTeal ? "text-teal-500" : "text-blue-500"}`}>✓</span>
                              {h}
                            </div>
                          ))}
                        </div>

                        {/* CTA */}
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full flex items-center justify-center gap-2 h-11 rounded-xl text-white font-semibold text-sm transition-colors ${
                            isTeal
                              ? "bg-teal-600 hover:bg-teal-700"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          <MessageCircle className="h-4 w-4" />
                          Daftar Sekarang via WhatsApp
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ETP FAQ/Info */}
            <section className="px-4 pb-16 max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 md:p-8 border border-blue-200">
                <h2 className="text-xl font-bold text-slate-900 mb-3">🎓 Kenapa Pilih ETP Linguo?</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <div className="font-semibold mb-1 text-sm">🏆 Tutor Bersertifikat</div>
                    <p className="text-xs text-slate-600">Diajar langsung oleh pengajar dengan skor TOEFL 600+ dan IELTS 8.0+.</p>
                  </div>
                  <div>
                    <div className="font-semibold mb-1 text-sm">📊 Materi Terstruktur</div>
                    <p className="text-xs text-slate-600">Silabus dari materi dasar hingga trik menjawab soal dalam waktu terbatas.</p>
                  </div>
                  <div>
                    <div className="font-semibold mb-1 text-sm">📝 Simulasi Ujian</div>
                    <p className="text-xs text-slate-600">Mock test sebelum hari H agar siswa tahu kondisi nyata ujian.</p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-blue-200/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <p className="text-sm text-slate-600">Atau mau belajar bahasa baru dulu?</p>
                  <button
                    onClick={() => setActiveTab("reguler")}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800"
                  >
                    Lihat Kelas Reguler <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
