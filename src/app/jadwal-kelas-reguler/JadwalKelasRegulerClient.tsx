// src/app/jadwal-kelas-reguler/JadwalKelasRegulerClient.tsx
// Client component: tab Kelas Reguler + ETP (TOEFL/IELTS)
"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Calendar, Clock, Users, MessageCircle,
  ChevronRight, ChevronLeft, BookOpen, Award, Home,
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

// Raw row dari tabel etp_batches di Supabase
export interface EtpBatchRow {
  id: string;
  title: string;
  badge: string;
  icon: string;
  color: string;
  days: string;
  time: string;
  start_date: string; // ISO date string
  duration_min: number;
  total_sessions: number;
  price: number;
  max_capacity: number;
  current_enrolled: number;
  syllabus: { week: string; topics: string[] }[];
  highlights: string[];
  is_active: boolean;
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
  startDateISO: string; // untuk countdown
  duration: string;
  sessions: number;
  sessionMin: number;
  price: number;
  highlights: string[];
  syllabus: { week: string; topics: string[] }[];
  maxCapacity: number;
  currentEnrolled: number;
  color: string;
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
    startDateISO: "2026-06-01",
    duration: "90 menit/sesi",
    sessions: 16,
    sessionMin: 90,
    price: 300000,
    maxCapacity: 15,
    currentEnrolled: 4,
    highlights: [
      "Latihan Listening, Structure, Reading intensif",
      "Bank soal TOEFL ITP & PBT terlengkap",
      "Simulasi ujian sebelum test hari H",
      "Target skor 500+ dalam 1 batch",
    ],
    syllabus: [
      { week: "Sesi 1–2", topics: ["Orientasi format TOEFL ITP & strategi umum", "Listening Section: short conversations, surprise questions"] },
      { week: "Sesi 3–4", topics: ["Listening Section: longer conversations & mini talks", "Teknik note-taking & prediksi jawaban"] },
      { week: "Sesi 5–6", topics: ["Structure: subject-verb agreement & verb forms", "Written Expression: error recognition dasar"] },
      { week: "Sesi 7–8", topics: ["Structure lanjutan: parallel structure, relative clauses", "Written Expression: preposisi, artikel, word form"] },
      { week: "Sesi 9–10", topics: ["Reading: main idea, topic sentence, inference", "Vocabulary in context & reference questions"] },
      { week: "Sesi 11–12", topics: ["Reading: scanning & skimming cepat", "Unstated detail & negative fact questions"] },
      { week: "Sesi 13–14", topics: ["Full mock test #1 (Listening + Structure + Reading)", "Review mendalam: analisis kesalahan per section"] },
      { week: "Sesi 15–16", topics: ["Full mock test #2 + simulasi kondisi ujian nyata", "Target skor 500+: strategi akhir & manajemen waktu"] },
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
    startDateISO: "2026-06-02",
    duration: "90 menit/sesi",
    sessions: 16,
    sessionMin: 90,
    price: 300000,
    maxCapacity: 15,
    currentEnrolled: 7,
    highlights: [
      "4 skill: Listening, Reading, Writing, Speaking",
      "Latihan Task 1 & Task 2 Writing dengan feedback",
      "Mock speaking session 1-on-1",
      "Target band 6.5+ dalam 1 batch",
    ],
    syllabus: [
      { week: "Sesi 1–2", topics: ["Orientasi format IELTS Academic & strategi umum", "Listening Section 1–2: form filling & multiple choice"] },
      { week: "Sesi 3–4", topics: ["Listening Section 3–4: lectures & seminars", "Map labelling, diagram completion, sentence completion"] },
      { week: "Sesi 5–6", topics: ["Reading: True/False/Not Given & Yes/No/Not Given", "Matching headings & matching information"] },
      { week: "Sesi 7–8", topics: ["Reading: summary completion & short answer questions", "Teknik skimming & scanning untuk waktu terbatas"] },
      { week: "Sesi 9–10", topics: ["Writing Task 1: describe grafik, tabel, diagram, peta", "Struktur paragraf & academic vocabulary Task 1"] },
      { week: "Sesi 11–12", topics: ["Writing Task 2: opinion, discussion, problem-solution essay", "Coherence & cohesion, lexical resource, grammatical range"] },
      { week: "Sesi 13–14", topics: ["Speaking Part 1: personal questions & fluency drills", "Speaking Part 2: long turn (cue card) & Part 3: discussion"] },
      { week: "Sesi 15–16", topics: ["Full Academic mock test + mock speaking 1-on-1", "Feedback individual & strategi raih band 6.5+"] },
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

function getCountdown(dateStr: string): { label: string; color: string } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return { label: "Sudah dimulai", color: "text-slate-400" };
  if (diff === 0) return { label: "Mulai hari ini!", color: "text-red-600 font-semibold" };
  if (diff <= 3)  return { label: `⚠️ ${diff} hari lagi`, color: "text-red-500 font-semibold" };
  if (diff <= 7)  return { label: `${diff} hari lagi`, color: "text-amber-500 font-medium" };
  return { label: `${diff} hari lagi`, color: "text-slate-400" };
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

export default function JadwalKelasRegulerClient({
  batches,
  etpBatches,
}: {
  batches: Batch[];
  etpBatches: EtpBatchRow[];
}) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(
    searchParams.get("tab") === "etp" ? "etp" : "reguler"
  );
  const [search, setSearch] = useState("");
  const [selectedLang, setSelectedLang] = useState<string>("all");
  const [countdown, setCountdown] = useState("");
  const [etpCountdown, setEtpCountdown] = useState("");
  const [openSyllabus, setOpenSyllabus] = useState<Record<string, boolean>>({});

  const etpPrograms: EtpProgram[] = ETP_PROGRAMS;

  // Cari batch yang paling dekat mulainya (masih upcoming)
  const nearestBatch = useMemo(() => {
    const now = new Date();
    return batches
      .filter((b) => new Date(b.start_date) > now)
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0] ?? null;
  }, [batches]);

  // Live countdown tick
  useEffect(() => {
    if (!nearestBatch) return;
    const tick = () => {
      const now = new Date().getTime();
      const target = new Date(nearestBatch.start_date);
      target.setHours(23, 59, 59, 0); // tutup akhir hari H
      const diff = target.getTime() - now;
      if (diff <= 0) { setCountdown("Pendaftaran ditutup"); return; }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      const parts = [];
      if (d > 0) parts.push(`${d} hari`);
      parts.push(`${String(h).padStart(2,"0")} jam`);
      parts.push(`${String(m).padStart(2,"0")} menit`);
      parts.push(`${String(s).padStart(2,"0")} detik`);
      setCountdown(parts.join(" "));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nearestBatch]);

  // ETP countdown — batch TOEFL/IELTS terdekat
  useEffect(() => {
    if (etpPrograms.length === 0) return;
    const nearestEtp = etpPrograms
      .slice()
      .sort((a, b) => new Date(a.startDateISO).getTime() - new Date(b.startDateISO).getTime())[0];
    const tick = () => {
      const now = new Date().getTime();
      const target = new Date(nearestEtp.startDateISO);
      target.setHours(23, 59, 59, 0);
      const diff = target.getTime() - now;
      if (diff <= 0) { setEtpCountdown("Pendaftaran ditutup"); return; }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      const parts = [];
      if (d > 0) parts.push(`${d} hari`);
      parts.push(`${String(h).padStart(2,"0")} jam`);
      parts.push(`${String(m).padStart(2,"0")} menit`);
      parts.push(`${String(s).padStart(2,"0")} detik`);
      setEtpCountdown(parts.join(" "));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [etpPrograms]);

  const uniqueLanguages = useMemo(
    () => Array.from(new Set(batches.map((b) => b.language))).sort(),
    [batches]
  );

  const filteredBatches = useMemo(() => {
    return batches
      .filter((b) => {
        const matchesSearch =
          search === "" ||
          b.language.toLowerCase().includes(search.toLowerCase()) ||
          b.batch_code.toLowerCase().includes(search.toLowerCase()) ||
          b.level.toLowerCase().includes(search.toLowerCase());
        const matchesLang = selectedLang === "all" || b.language === selectedLang;
        return matchesSearch && matchesLang;
      })
      .sort((a, b) => {
        const slotsA = a.max_capacity - a.actual_enrolled;
        const slotsB = b.max_capacity - b.actual_enrolled;
        if (slotsB !== slotsA) return slotsB - slotsA; // slot terbanyak dulu
        return a.language.localeCompare(b.language, "id"); // alphabetical
      });
  }, [batches, search, selectedLang]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-teal-50/20 to-white">

      {/* ── BACK TO HOME ── */}
      <div className="px-4 pt-4 max-w-6xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>
      </div>

      {/* ── HERO ── */}
      <section className="relative px-4 pt-6 pb-8 md:pt-10 md:pb-12 max-w-6xl mx-auto">
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

      {/* ── COUNTDOWN BANNER ── */}
      {nearestBatch && (
        <section className="px-4 pb-4 max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-white shadow-md">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏳</span>
              <div>
                <div className="text-xs font-medium text-teal-100 uppercase tracking-wide">Pendaftaran Batch Terdekat Ditutup Dalam</div>
                <div className="text-xl md:text-2xl font-bold tabular-nums leading-tight">
                  {countdown || "Menghitung..."}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:text-right">
              <div className="text-sm">
                <div className="font-semibold">
                  {LANGUAGE_FLAGS[nearestBatch.language] || "🌐"} {nearestBatch.language} {nearestBatch.level}
                </div>
                <div className="text-teal-100 text-xs">Mulai {formatDate(nearestBatch.start_date)}</div>
              </div>
              <a
                href={`https://wa.me/${WA_NUMBER}?text=${buildWAMessage(nearestBatch)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-white text-teal-700 text-sm font-bold hover:bg-teal-50 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Daftar
              </a>
            </div>
          </div>
        </section>
      )}

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
              {etpPrograms.length}
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
              <div className="flex flex-col gap-3">
                {/* Search bar — full width */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari bahasa atau kode batch..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                {/* Language chips — always wrap */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedLang("all")}
                    className={`h-9 px-4 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
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
                      className={`h-9 px-4 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
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
                              <td className="py-4 px-4 text-slate-600 text-xs">
                                <div>{formatDate(batch.start_date)}</div>
                                <div className={`text-[11px] mt-0.5 ${getCountdown(batch.start_date).color}`}>
                                  {getCountdown(batch.start_date).label}
                                </div>
                              </td>
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
                              <div>
                                <span>Mulai {formatDate(batch.start_date)}</span>
                                <span className={`ml-2 text-[11px] ${getCountdown(batch.start_date).color}`}>
                                  · {getCountdown(batch.start_date).label}
                                </span>
                              </div>
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
            <section className="px-4 pb-4 max-w-6xl mx-auto">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-8 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-3">
                      🎯 English Test Preparation
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold mb-1">Persiapan TOEFL & IELTS</h2>
                    <p className="text-blue-100 text-sm max-w-md">
                      Batch Juni 2026 — Kelas intensif 2× seminggu dengan tutor berpengalaman.
                    </p>
                  </div>
                  {/* ETP Countdown */}
                  <div className="bg-white/10 rounded-xl px-5 py-4 text-center shrink-0">
                    <div className="text-[11px] font-semibold text-blue-100 uppercase tracking-wide mb-1">⏳ Pendaftaran ditutup dalam</div>
                    <div className="text-lg md:text-xl font-bold tabular-nums leading-tight">
                      {etpCountdown || "Menghitung..."}
                    </div>
                    <div className="text-[11px] text-blue-200 mt-1">Batch TOEFL mulai 1 Juni 2026</div>
                  </div>
                </div>
              </div>
            </section>

            {/* ETP Cards */}
            <section className="px-4 pb-12 max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6">
                {etpPrograms.map((program) => {
                  const waLink = `https://wa.me/${WA_NUMBER}?text=${buildEtpWAMessage(program)}`;
                  const isTeal = program.color === "teal";
                  const slotsLeft = program.maxCapacity - program.currentEnrolled;
                  const slotPct = Math.round((program.currentEnrolled / program.maxCapacity) * 100);
                  const slotColor = slotsLeft <= 3 ? "bg-red-500" : slotsLeft <= 6 ? "bg-amber-400" : isTeal ? "bg-teal-500" : "bg-blue-500";
                  const slotTextColor = slotsLeft <= 3 ? "text-red-600" : slotsLeft <= 6 ? "text-amber-600" : isTeal ? "text-teal-700" : "text-blue-700";
                  const isSylOpen = !!openSyllabus[program.id];
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

                        {/* Kuota bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-slate-500">Kuota terisi</span>
                            <span className={`font-semibold ${slotTextColor}`}>
                              {slotsLeft <= 3 ? "⚠️ " : ""}{slotsLeft} slot tersisa dari {program.maxCapacity}
                            </span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${slotColor}`}
                              style={{ width: `${slotPct}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">{program.currentEnrolled} dari {program.maxCapacity} siswa sudah mendaftar</div>
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

                        {/* Silabus accordion */}
                        <div className={`rounded-xl border ${isTeal ? "border-teal-100" : "border-blue-100"}`}>
                          <button
                            onClick={() => setOpenSyllabus((prev) => ({ ...prev, [program.id]: !prev[program.id] }))}
                            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors rounded-xl ${
                              isTeal ? "text-teal-700 hover:bg-teal-50" : "text-blue-700 hover:bg-blue-50"
                            }`}
                          >
                            <span>📋 Lihat Silabus Lengkap</span>
                            <ChevronRight className={`h-4 w-4 transition-transform ${isSylOpen ? "rotate-90" : ""}`} />
                          </button>
                          {isSylOpen && (
                            <div className={`px-4 pb-4 space-y-3 border-t ${isTeal ? "border-teal-100" : "border-blue-100"}`}>
                              {program.syllabus.map((s, i) => (
                                <div key={i} className="pt-3">
                                  <div className={`text-xs font-bold mb-1.5 ${isTeal ? "text-teal-700" : "text-blue-700"}`}>{s.week}</div>
                                  <ul className="space-y-1">
                                    {s.topics.map((t, j) => (
                                      <li key={j} className="text-xs text-slate-600 flex items-start gap-1.5">
                                        <span className="mt-0.5 text-slate-300">•</span>{t}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          )}
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
