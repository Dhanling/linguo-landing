// src/app/jadwal-kelas-reguler/JadwalKelasRegulerClient.tsx
// Client component: tab Kelas Reguler + ETP (TOEFL/IELTS)
"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Calendar, Clock, Users, MessageCircle,
  ChevronRight, ChevronLeft, BookOpen, Award, Home,
  Hourglass, CalendarDays, CalendarCheck, Lightbulb, Wallet,
  Target, AlertTriangle, Check, ClipboardList, GraduationCap,
  Trophy, BarChart3, FileText, Globe,
  ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import { resolveFlag } from "@blade-flags/core";
import { defaultFlags } from "@blade-flags/core/flags/default";
import Link from "next/link";
import RegisterRegulerModal from "@/components/RegisterRegulerModal";
import {
  type EtpBatchRow,
  resolveEtpBatches,
  todayWIBISO,
} from "@/lib/etpBatches";

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
  // Batas pendaftaran. Beda dengan start_date: batch September buka 21 Agustus,
  // tutup 10 September, kelasnya sendiri baru mulai pekan 14 September.
  closes_at: string | null;
}

// Bentuk baris tabel etp_batches ada di @/lib/etpBatches — dipakai bareng
// knowledge AI supaya jadwal ETP di chat selalu sama dengan halaman ini.

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
// Constants
// ─────────────────────────────────────────────────────────────────────────────

// Kode bendera (ISO 3166-1 alpha-2) per bahasa. Keyed by nama Inggris (canonical
// di DB regular_batches.language) + alias Indonesia. Lookup via getFlagCode() yang
// dinormalisasi (lowercase, buang non-huruf) supaya "English Conversation" /
// "english-conversation" sama-sama match. Bendera dirender pakai SVG blade-flags
// (komponen RectFlag) — konsisten dgn landing, bukan emoji lagi.
const LANGUAGE_CODES: Record<string, string> = {
  // English (DB canonical)
  "english conversation": "gb",
  "english": "gb",
  "spanish": "es",
  "german": "de",
  "sign language": "", // bahasa isyarat: ga ada bendera negara → fallback Globe
  "dutch": "nl",
  "italian": "it",
  "japanese": "jp",
  "korean": "kr",
  "french": "fr",
  "mandarin": "cn",
  "arabic": "sa",
  "tagalog": "ph",
  // Alias Indonesia (jaga-jaga kalau ada batch pake nama ID)
  "spanyol": "es",
  "jerman": "de",
  "bahasa isyarat": "",
  "belanda": "nl",
  "italia": "it",
  "jepang": "jp",
  "korea": "kr",
  "prancis": "fr",
  "arab": "sa",
};

// Normalisasi: lowercase + buang semua selain a-z (handle spasi/strip/case).
const _normLang = (s: string): string => (s || "").toLowerCase().replace(/[^a-z]/g, "");
const _CODE_BY_NORM: Record<string, string> = Object.fromEntries(
  Object.entries(LANGUAGE_CODES).map(([k, v]) => [_normLang(k), v])
);
function getFlagCode(lang: string): string {
  return _CODE_BY_NORM[_normLang(lang)] ?? "";
}

// Bendera rounded-rectangle (blade-flags). SVG inline tanpa width/height bawaan →
// hitung dimensi eksplisit dari viewBox (aspect ratio dijaga). Tinggi lewat prop `h`.
// Kalau kode kosong / bendera ga ketemu → fallback ikon Globe (bukan emoji).
function RectFlag({ code, h = 20, className = "" }: { code: string; h?: number; className?: string }) {
  const svg = code ? resolveFlag(defaultFlags, code, "country") : null;
  if (!svg) return <Globe aria-hidden style={{ height: h, width: h }} className={`text-slate-400 shrink-0 ${className}`} />;
  const m = svg.match(/viewBox="([\d.\s-]+)"/);
  let w = Math.round((h * 36) / 26);
  if (m) { const p = m[1].trim().split(/\s+/).map(Number); if (p.length === 4 && p[3]) w = Math.round((h * p[2]) / p[3]); }
  const sized = svg.replace(/<svg /, `<svg width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" style="display:block" `);
  return <span aria-hidden style={{ height: h, width: w }} className={`inline-flex overflow-hidden rounded-[4px] shrink-0 ${className}`} dangerouslySetInnerHTML={{ __html: sized }} />;
}

// Ikon program ETP berdasarkan badge (TOEFL/IELTS) — ganti emoji icon dari DB.
function EtpIcon({ program, className = "" }: { program: EtpProgram; className?: string }) {
  const badge = (program.badge || "").toUpperCase();
  if (badge.includes("IELTS")) return <GraduationCap className={className} />;
  return <FileText className={className} />; // TOEFL & default
}

const WA_NUMBER = "6282116859493";

// Cadangan buat siklus yang baris batch-nya belum dibuat di `regular_batches`.
// Banner ini cuma muncul kalau tak ada satu pun batch yang pendaftarannya masih
// buka, jadi jangan patok tanggal di sini — tanggal yang benar hidup di kolom
// `opens_at`/`closes_at` tiap batch.
const NEXT_BATCH = {
  label: "Batch Berikutnya",
  startNote: "Jadwal & tanggal pendaftaran siklus berikutnya via WhatsApp",
};

// Kolom tabel Reguler yang bisa diurutkan. Arah default per kolom dipilih dari
// pertanyaan yang paling sering muncul ("yang mulai paling awal mana?", "yang
// slotnya masih banyak mana?") supaya sekali klik langsung memberi jawabannya —
// klik kedua di kolom yang sama membalik arahnya.
type SortKey = "language" | "start" | "sessions" | "price" | "slots";
type SortDir = "asc" | "desc";
type SortState = { key: SortKey; dir: SortDir };

const SORT_LABELS: Record<SortKey, string> = {
  language: "bahasa",
  start: "tanggal mulai",
  sessions: "total sesi",
  price: "harga",
  slots: "slot tersisa",
};

const SORT_DEFAULT_DIR: Record<SortKey, SortDir> = {
  language: "asc",
  start: "asc",   // paling awal mulai
  sessions: "desc",
  price: "asc",   // termurah
  slots: "desc",  // slot tersisa terbanyak
};

// Pilihan urutan versi ponsel (tak ada judul kolom buat diklik di tampilan kartu).
const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "default", label: "Rekomendasi" },
  { value: "start:asc", label: "Mulai paling awal" },
  { value: "start:desc", label: "Mulai paling akhir" },
  { value: "slots:desc", label: "Slot tersisa terbanyak" },
  { value: "slots:asc", label: "Slot tersisa paling sedikit" },
  { value: "price:asc", label: "Harga termurah" },
  { value: "price:desc", label: "Harga termahal" },
  { value: "language:asc", label: "Bahasa A–Z" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatIDR(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

// Harga normal yang dicoret di samping harga promo. Cuma tampil kalau harga
// yang dibayar siswa memang lebih murah dari angka ini.
const PRICE_STRIKE = 500000;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// "2026-09-01" → "Batch September". Dipakai di banner countdown supaya siswa tahu
// siklus mana yang lagi dibuka tanpa harus dipatok manual di kode.
function batchMonthLabel(batchMonth: string | null): string {
  if (!batchMonth) return "Batch Terdekat";
  const d = new Date(`${String(batchMonth).slice(0, 10)}T00:00:00`);
  if (isNaN(d.getTime())) return "Batch Terdekat";
  return `Batch ${d.toLocaleDateString("id-ID", { month: "long" })}`;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function getCountdown(dateStr: string): { label: string; color: string } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return { label: "Sudah dimulai", color: "text-slate-400" };
  if (diff === 0) return { label: "Mulai hari ini!", color: "text-red-600 font-semibold" };
  if (diff <= 3)  return { label: `${diff} hari lagi`, color: "text-red-500 font-semibold" };
  if (diff <= 7)  return { label: `${diff} hari lagi`, color: "text-amber-500 font-medium" };
  return { label: `${diff} hari lagi`, color: "text-slate-400" };
}

// Batas pendaftaran sebuah batch: `closes_at` kalau diisi, kalau tidak jatuh
// balik ke tanggal mulai kelas (perilaku lama, batch lawas tak punya closes_at).
function regDeadline(batch: Batch): Date {
  if (batch.closes_at) return new Date(batch.closes_at);
  const d = new Date(batch.start_date);
  d.setHours(23, 59, 59, 0);
  return d;
}

// Pendaftaran ditutup kalau batas tadi sudah lewat, ATAU kelasnya terlanjur mulai.
// Tanggal mulai dibandingkan per hari (bukan per jam) supaya batch yang mulai
// hari ini masih bisa didaftar.
function isBatchClosed(batch: Batch): boolean {
  const now = new Date();
  if (regDeadline(batch).getTime() < now.getTime()) return true;
  const start = new Date(batch.start_date);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return start.getTime() < today.getTime();
}

function sortValue(batch: Batch, key: SortKey): number | string {
  switch (key) {
    case "language": return batch.language || "";
    case "start": return new Date(batch.start_date).getTime();
    case "sessions": return Number(batch.total_sessions) || 0;
    case "price": return Number(batch.current_price_per_student || batch.price_regular) || 0;
    case "slots": return (batch.max_capacity || 0) - (batch.actual_enrolled || 0);
  }
}

// Judul kolom yang bisa diklik buat mengurutkan. Panah abu = kolom ini belum
// dipakai; panah teal = kolom yang sedang menentukan urutan + arahnya.
function SortableTh({
  label, sortKey, align = "left", sort, onSort,
}: {
  label: string;
  sortKey: SortKey;
  align?: "left" | "right" | "center";
  sort: SortState | null;
  onSort: (key: SortKey) => void;
}) {
  const active = sort?.key === sortKey;
  const Icon = !active ? ArrowUpDown : sort!.dir === "asc" ? ArrowUp : ArrowDown;
  const alignCls = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return (
    <th
      aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : "none"}
      className={`${alignCls} py-3 px-4 font-semibold text-slate-700 shadow-[inset_0_-1px_0_#e2e8f0]`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        title={`Urutkan menurut ${label.toLowerCase()}`}
        className={`group inline-flex items-center gap-1.5 transition-colors ${
          active ? "text-teal-700" : "hover:text-teal-700"
        }`}
      >
        {label}
        <Icon
          className={`h-3.5 w-3.5 ${
            active ? "text-teal-600" : "text-slate-400 group-hover:text-teal-500"
          }`}
        />
      </button>
    </th>
  );
}

function buildNextBatchWALink(): string {
  const text = [
    `Halo Linguo! Saya mau ikut ${NEXT_BATCH.label} Kelas Reguler.`,
    ``,
    `Tolong info bahasa & jadwal yang dibuka, plus cara daftarnya. Terima kasih!`,
  ].join("\n");
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
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

// Map baris DB (etp_batches) → bentuk yang dirender kartu ETP.
// Dipakai supaya perubahan jadwal dari admin dashboard langsung tampil.
function mapEtpRow(row: EtpBatchRow): EtpProgram {
  const startISO = row.start_date;
  const monthYear = new Date(startISO).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
  return {
    id: row.id,
    title: row.title,
    subtitle: `Batch ${monthYear}`,
    icon: row.icon,
    badge: row.badge,
    days: row.days,
    time: row.time,
    startDate: formatDate(startISO),
    startDateISO: startISO,
    duration: `${row.duration_min} menit/sesi`,
    sessions: row.total_sessions,
    sessionMin: row.duration_min,
    price: row.price,
    highlights: row.highlights ?? [],
    syllabus: row.syllabus ?? [],
    maxCapacity: row.max_capacity,
    currentEnrolled: row.current_enrolled,
    color: row.color,
  };
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
  // null = urutan bawaan (rekomendasi): slot terbanyak dulu, lalu A–Z.
  const [sort, setSort] = useState<SortState | null>(null);
  const [countdown, setCountdown] = useState("");
  const [etpCountdown, setEtpCountdown] = useState("");
  const [openSyllabus, setOpenSyllabus] = useState<Record<string, boolean>>({});
  const [registerBatch, setRegisterBatch] = useState<Batch | null>(null);

  // Sumber data ETP: baris DB (etp_batches) yang masih jalan, kalau kosong
  // fallback ke data statik di @/lib/etpBatches. Resolver-nya sama persis dengan
  // yang dipakai knowledge AI, jadi jadwal di chat gak pernah beda dari kartu ini.
  const etpPrograms: EtpProgram[] = useMemo(
    () => resolveEtpBatches(etpBatches, todayWIBISO()).map(mapEtpRow),
    [etpBatches]
  );

  // Batch ETP terdekat (buat label hero + countdown)
  const nearestEtp = useMemo(
    () =>
      etpPrograms.length > 0
        ? etpPrograms
            .slice()
            .sort(
              (a, b) =>
                new Date(a.startDateISO).getTime() -
                new Date(b.startDateISO).getTime()
            )[0]
        : null,
    [etpPrograms]
  );

  // Batch yang pendaftarannya masih buka dan paling dekat ditutup
  const nearestBatch = useMemo(() => {
    return batches
      .filter((b) => !isBatchClosed(b))
      .sort((a, b) => regDeadline(a).getTime() - regDeadline(b).getTime())[0] ?? null;
  }, [batches]);

  // Live countdown tick
  useEffect(() => {
    if (!nearestBatch) return;
    const tick = () => {
      const now = new Date().getTime();
      const diff = regDeadline(nearestBatch).getTime() - now;
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
    if (!nearestEtp) return;
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
  }, [nearestEtp]);

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
        // Batch yang pendaftarannya ditutup selalu turun ke bawah daftar,
        // apa pun kolom yang dipakai mengurutkan — yang tak bisa didaftar
        // jangan sampai menduduki baris teratas.
        const closedA = isBatchClosed(a) ? 1 : 0;
        const closedB = isBatchClosed(b) ? 1 : 0;
        if (closedA !== closedB) return closedA - closedB;

        if (sort) {
          const va = sortValue(a, sort.key);
          const vb = sortValue(b, sort.key);
          let cmp =
            typeof va === "string" || typeof vb === "string"
              ? String(va).localeCompare(String(vb), "id")
              : (va as number) - (vb as number);
          if (sort.dir === "desc") cmp = -cmp;
          // Nilai kembar (mis. harga sama semua) dirapikan alfabetis biar
          // urutannya tidak acak tiap render.
          if (cmp !== 0) return cmp;
          return a.language.localeCompare(b.language, "id");
        }

        const slotsA = a.max_capacity - a.actual_enrolled;
        const slotsB = b.max_capacity - b.actual_enrolled;
        if (slotsB !== slotsA) return slotsB - slotsA; // slot terbanyak dulu
        return a.language.localeCompare(b.language, "id"); // alphabetical
      });
  }, [batches, search, selectedLang, sort]);

  // Klik judul kolom: kolom baru → pakai arah default kolom itu, kolom yang
  // sedang aktif → balik arah.
  const toggleSort = (key: SortKey) =>
    setSort((cur) =>
      cur?.key === key
        ? { key, dir: cur.dir === "asc" ? "desc" : "asc" }
        : { key, dir: SORT_DEFAULT_DIR[key] }
    );

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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold mb-4">
              <Calendar className="h-3.5 w-3.5" />
              Jadwal Kelas Linguo
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
      {activeTab === "reguler" && nearestBatch && (
        <section className="px-4 pb-4 max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-white shadow-md">
            <div className="flex items-center gap-3">
              <Hourglass className="h-6 w-6 shrink-0" />
              <div>
                <div className="text-xs font-medium text-teal-100 uppercase tracking-wide">
                  Pendaftaran {batchMonthLabel(nearestBatch.batch_month)} Ditutup Dalam
                </div>
                <div className="text-xl md:text-2xl font-bold tabular-nums leading-tight">
                  {countdown || "Menghitung..."}
                </div>
                {nearestBatch.closes_at && (
                  <div className="text-xs text-teal-100 mt-0.5">
                    Terakhir daftar {formatDate(nearestBatch.closes_at)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 sm:text-right">
              <div className="text-sm">
                <div className="font-semibold inline-flex items-center gap-1.5">
                  <RectFlag code={getFlagCode(nearestBatch.language)} h={16} />
                  {nearestBatch.language} {nearestBatch.level}
                </div>
                <div className="text-teal-100 text-xs">Mulai {formatDate(nearestBatch.start_date)}</div>
              </div>
              <button
                type="button"
                onClick={() => setRegisterBatch(nearestBatch)}
                className="shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-white text-teal-700 text-sm font-bold hover:bg-teal-50 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Daftar
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── BANNER PENDAFTARAN DITUTUP + BATCH BERIKUTNYA ── */}
      {activeTab === "reguler" && !nearestBatch && batches.length > 0 && (
        <section className="px-4 pb-4 max-w-6xl mx-auto">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 md:p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" />
              <div>
                <div className="text-base md:text-lg font-bold text-amber-900">
                  Pendaftaran batch berjalan sudah ditutup
                </div>
                <p className="text-sm text-amber-800 mt-1">
                  Semua kelas di daftar bawah sudah mulai, jadi pendaftarannya ditutup.
                  Kamu bisa ikut batch berikutnya.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-teal-200 bg-white p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold uppercase tracking-wide">
                  <CalendarCheck className="h-3.5 w-3.5" />
                  Batch berikutnya
                </span>
                <div className="text-lg md:text-xl font-bold text-slate-900 mt-2">
                  {NEXT_BATCH.label}
                </div>
                <div className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {NEXT_BATCH.startNote}
                </div>
              </div>
              <a
                href={buildNextBatchWALink()}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Amankan Slot {NEXT_BATCH.label}
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
                      className={`h-9 px-4 rounded-full text-sm font-medium transition-all whitespace-nowrap inline-flex items-center gap-1.5 ${
                        selectedLang === lang
                          ? "bg-teal-600 text-white shadow-sm"
                          : "bg-white border border-slate-200 text-slate-700 hover:border-teal-300"
                      }`}
                    >
                      <RectFlag code={getFlagCode(lang)} h={14} />
                      {lang}
                    </button>
                  ))}
                </div>

                {/* Pengurut. Di layar lebar judul kolom tabel sudah bisa diklik,
                    jadi di sini cukup penunjuk + tombol balik ke urutan bawaan.
                    Di ponsel tabelnya berubah jadi kartu (tak ada judul kolom),
                    makanya disediakan dropdown berisi urutan yang sama. */}
                <div className="flex items-center justify-between gap-3">
                  <label className="md:hidden flex items-center gap-2 text-sm text-slate-600 w-full">
                    <ArrowUpDown className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="shrink-0">Urutkan</span>
                    <select
                      value={sort ? `${sort.key}:${sort.dir}` : "default"}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "default") return setSort(null);
                        const [key, dir] = v.split(":");
                        setSort({ key: key as SortKey, dir: dir as SortDir });
                      }}
                      className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                      {/* Kombinasi yang cuma bisa lahir dari klik judul kolom di
                          layar lebar (mis. total sesi) — tanpa ini, dropdownnya
                          kosong melompong waktu jendela dikecilkan. */}
                      {sort && !SORT_OPTIONS.some((o) => o.value === `${sort.key}:${sort.dir}`) && (
                        <option value={`${sort.key}:${sort.dir}`}>
                          {SORT_LABELS[sort.key]} {sort.dir === "asc" ? "↑" : "↓"}
                        </option>
                      )}
                    </select>
                  </label>

                  <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    {sort ? (
                      <>
                        <span>
                          Diurutkan menurut{" "}
                          <span className="font-semibold text-teal-700">
                            {SORT_LABELS[sort.key]} {sort.dir === "asc" ? "↑" : "↓"}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setSort(null)}
                          className="underline underline-offset-2 hover:text-teal-700"
                        >
                          urutan bawaan
                        </button>
                      </>
                    ) : (
                      <span>Klik judul kolom (Mulai, Slot, Harga) untuk mengurutkan</span>
                    )}
                  </div>
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
                  {/* jadwal-tabel-sticky-v2 — tabel TANPA scroller vertikal sendiri:
                      semua baris batch kelihatan sekaligus, gulirnya ikut halaman.
                      Yang tersisa cuma guliran mendatar buat layar sempit.
                      Garis bawah header pakai box-shadow: border pada <th> sticky
                      ikut tergulung di Safari, shadow tidak. */}
                  <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-slate-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700 shadow-[inset_0_-1px_0_#e2e8f0] w-12">No</th>
                          <SortableTh label="Bahasa" sortKey="language" sort={sort} onSort={toggleSort} />
                          <th className="text-left py-3 px-4 font-semibold text-slate-700 shadow-[inset_0_-1px_0_#e2e8f0]">Level</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700 shadow-[inset_0_-1px_0_#e2e8f0]">Jadwal</th>
                          <SortableTh label="Mulai" sortKey="start" sort={sort} onSort={toggleSort} />
                          <SortableTh label="Total Sesi" sortKey="sessions" sort={sort} onSort={toggleSort} />
                          <SortableTh label="Harga" sortKey="price" align="right" sort={sort} onSort={toggleSort} />
                          <SortableTh label="Slot" sortKey="slots" align="center" sort={sort} onSort={toggleSort} />
                          <th className="text-right py-3 px-4 font-semibold text-slate-700 shadow-[inset_0_-1px_0_#e2e8f0]">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBatches.map((batch, idx) => {
                          const slotsLeft = batch.max_capacity - batch.actual_enrolled;
                          const closed = isBatchClosed(batch);
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
                              className={`border-b border-slate-100 transition-colors scroll-mt-20 ${
                                closed ? "bg-slate-50/70 opacity-70" : "hover:bg-slate-50/50"
                              }`}
                            >
                              <td className="py-4 px-4 text-slate-500 tabular-nums font-medium">{idx + 1}</td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <RectFlag code={getFlagCode(batch.language)} h={20} />
                                  <span className="font-semibold text-slate-900">{batch.language}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-slate-600">{batch.level}</td>
                              <td className="py-4 px-4">
                                <div className="text-black font-bold">{batch.session_day}</div>
                                <div className="text-xs text-black font-semibold tabular-nums">
                                  {batch.session_start_time?.slice(0, 5)} -{" "}
                                  {batch.session_end_time?.slice(0, 5)} WIB
                                </div>
                              </td>
                              <td className="py-4 px-4 text-slate-600 text-xs">
                                <div className="text-black font-bold text-sm">{formatDate(batch.start_date)}</div>
                                <div className={`text-[11px] mt-0.5 ${getCountdown(batch.start_date).color}`}>
                                  {getCountdown(batch.start_date).label}
                                </div>
                                {!closed && batch.closes_at && (
                                  <div className="text-[11px] mt-0.5 text-teal-700 font-medium">
                                    Daftar s/d {formatDateShort(batch.closes_at)}
                                  </div>
                                )}
                              </td>
                              <td className="py-4 px-4 text-black text-sm font-bold">
                                {batch.total_sessions} × {batch.session_duration_min} mnt
                              </td>
                              <td className="py-4 px-4 text-right">
                                {(batch.current_price_per_student || batch.price_regular) < PRICE_STRIKE && (
                                  <div className="text-[11px] text-slate-400 line-through tabular-nums">
                                    {formatIDR(PRICE_STRIKE)}
                                  </div>
                                )}
                                <div className="font-bold text-slate-900 tabular-nums">
                                  {formatIDR(batch.current_price_per_student || batch.price_regular)}
                                </div>
                                <div className="text-[10px] text-slate-500">/siswa/batch</div>
                              </td>
                              <td className="py-4 px-4 text-center">
                                {closed ? (
                                  <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-600">
                                    Ditutup
                                  </span>
                                ) : (
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${slotBgClass}`}>
                                    {slotsLeft} slot
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-4 text-right">
                                {closed ? (
                                  <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed">
                                    Pendaftaran ditutup
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setRegisterBatch(batch)}
                                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-teal-600 text-white text-xs font-semibold transition-all duration-200 hover:bg-teal-700 hover:scale-110 hover:shadow-md active:scale-95"
                                  >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                    Daftar
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                  </div>

                  {/* MOBILE */}
                  <div className="md:hidden space-y-3">
                    {filteredBatches.map((batch) => {
                      const slotsLeft = batch.max_capacity - batch.actual_enrolled;
                      const closed = isBatchClosed(batch);
                      const waLink = `https://wa.me/${WA_NUMBER}?text=${buildWAMessage(batch)}`;
                      return (
                        <div
                          key={batch.id}
                          id={batch.batch_code}
                          className={`rounded-2xl border p-4 scroll-mt-20 ${
                            closed
                              ? "bg-slate-50 border-slate-200 opacity-75"
                              : "bg-white border-slate-200"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <RectFlag code={getFlagCode(batch.language)} h={24} />
                              <div>
                                <div className="font-bold text-slate-900">{batch.language}</div>
                                <div className="text-xs text-slate-500">Level {batch.level}</div>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                closed
                                  ? "bg-slate-200 text-slate-600"
                                  : slotsLeft <= 3
                                  ? "bg-red-100 text-red-700"
                                  : slotsLeft <= 5
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {closed ? "Pendaftaran ditutup" : `${slotsLeft} slot tersisa`}
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
                              <CalendarDays className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                              <div>
                                <span>Mulai {formatDate(batch.start_date)}</span>
                                <span className={`ml-2 text-[11px] ${getCountdown(batch.start_date).color}`}>
                                  · {getCountdown(batch.start_date).label}
                                </span>
                                {!closed && batch.closes_at && (
                                  <div className="text-[11px] text-teal-700 font-medium mt-0.5">
                                    Daftar s/d {formatDate(batch.closes_at)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <div>
                              {(batch.current_price_per_student || batch.price_regular) < PRICE_STRIKE && (
                                <div className="text-xs text-slate-400 line-through tabular-nums">
                                  {formatIDR(PRICE_STRIKE)}
                                </div>
                              )}
                              <div className="text-lg font-bold text-slate-900 tabular-nums">
                                {formatIDR(batch.current_price_per_student || batch.price_regular)}
                              </div>
                              <div className="text-[10px] text-slate-500">/siswa/batch</div>
                            </div>
                            {closed ? (
                              <span className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-slate-100 text-slate-400 text-sm font-semibold cursor-not-allowed">
                                Ditutup
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setRegisterBatch(batch)}
                                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-teal-600 text-white text-sm font-semibold transition-all duration-200 hover:bg-teal-700 hover:scale-110 hover:shadow-md active:scale-95"
                              >
                                <MessageCircle className="h-4 w-4" />
                                Daftar
                              </button>
                            )}
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
                <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-teal-600" />
                  Kenapa Kelas Reguler?
                </h2>
                <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-700">
                  <div>
                    <div className="font-semibold mb-1 flex items-center gap-1.5">
                      <Wallet className="h-4 w-4 text-teal-600" />
                      Lebih Hemat
                    </div>
                    <p className="text-xs text-slate-600">Harga sampai 50% lebih murah dari kelas Private. Cocok untuk yang baru mulai belajar.</p>
                  </div>
                  <div>
                    <div className="font-semibold mb-1 flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-teal-600" />
                      Belajar Bareng
                    </div>
                    <p className="text-xs text-slate-600">Motivasi lebih tinggi dengan teman kelas. Diskusi & praktik langsung jadi seru!</p>
                  </div>
                  <div>
                    <div className="font-semibold mb-1 flex items-center gap-1.5">
                      <CalendarCheck className="h-4 w-4 text-teal-600" />
                      Jadwal Pasti
                    </div>
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
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-3">
                      <Target className="h-3.5 w-3.5" />
                      English Test Preparation
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold mb-1">Persiapan TOEFL & IELTS</h2>
                    <p className="text-blue-100 text-sm max-w-md">
                      {nearestEtp ? `${nearestEtp.subtitle} — ` : ""}Kelas intensif 2× seminggu dengan tutor berpengalaman.
                    </p>
                  </div>
                  {/* ETP Countdown */}
                  <div className="bg-white/10 rounded-xl px-5 py-4 text-center shrink-0">
                    <div className="text-[11px] font-semibold text-blue-100 uppercase tracking-wide mb-1 flex items-center justify-center gap-1"><Hourglass className="h-3 w-3" /> Pendaftaran ditutup dalam</div>
                    <div className="text-lg md:text-xl font-bold tabular-nums leading-tight">
                      {etpCountdown || "Menghitung..."}
                    </div>
                    <div className="text-[11px] text-blue-200 mt-1">
                      {nearestEtp ? `Batch ${nearestEtp.title} mulai ${nearestEtp.startDate}` : "Batch terdekat"}
                    </div>
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
                            <EtpIcon program={program} className={`h-8 w-8 shrink-0 ${isTeal ? "text-teal-600" : "text-blue-600"}`} />
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
                            <span className={`font-semibold inline-flex items-center gap-1 ${slotTextColor}`}>
                              {slotsLeft <= 3 && <AlertTriangle className="h-3.5 w-3.5" />}
                              {slotsLeft} slot tersisa dari {program.maxCapacity}
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
                            <CalendarDays className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
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
                              <Check className={`h-4 w-4 mt-0.5 shrink-0 ${isTeal ? "text-teal-500" : "text-blue-500"}`} />
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
                            <span className="inline-flex items-center gap-1.5"><ClipboardList className="h-4 w-4" /> Lihat Silabus Lengkap</span>
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
                <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  Kenapa Pilih ETP Linguo?
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <div className="font-semibold mb-1 text-sm flex items-center gap-1.5">
                      <Trophy className="h-4 w-4 text-blue-600" />
                      Tutor Bersertifikat
                    </div>
                    <p className="text-xs text-slate-600">Diajar langsung oleh pengajar dengan skor TOEFL 600+ dan IELTS 8.0+.</p>
                  </div>
                  <div>
                    <div className="font-semibold mb-1 text-sm flex items-center gap-1.5">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      Materi Terstruktur
                    </div>
                    <p className="text-xs text-slate-600">Silabus dari materi dasar hingga trik menjawab soal dalam waktu terbatas.</p>
                  </div>
                  <div>
                    <div className="font-semibold mb-1 text-sm flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Simulasi Ujian
                    </div>
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

      <RegisterRegulerModal
        batch={registerBatch}
        onClose={() => setRegisterBatch(null)}
      />
    </div>
  );
}
