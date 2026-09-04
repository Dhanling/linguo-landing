/* linguo-patch:akun-onboarding-gate-v1 — Lewati gating + WaGate profile completion */
"use client";

import { useState, useEffect, useMemo, useRef, Fragment, type ReactNode } from "react";
import { useRouter } from "next/navigation"; // [perf:sidebar-nav-v1]
import Link from "next/link"; // [kelas-detail-page-v1] card kelas → halaman /akun/kelas/[id]
import { classRoomUrl, isJoinable } from "@/lib/classRoom"; // [kelas-video-siswa-v1]
import { LANG_FLAGS, getFlagUrl, getLangPhoto, langGlyph } from "@/lib/lang-visuals"; // [kelas-detail-page-v1]
import { baseLanguage, displayLanguage, regulerLangName } from "@/lib/classLanguage"; // [reguler-english-conversation-v1]
import { REGULER_LANGS } from "@/lib/programLanguages"; // [reguler-lang-gate-server-v1] bahasa yang punya batch reguler — satu sumber dengan funnel landing
import { languageSlug } from "@/lib/languageSlug"; // [materi-bahasa-siswa-v1] nama bahasa (EN/ID/nama kelas) → slug kanonik
import { batchOccurrences } from "@/lib/batchCalendar"; // [jadwal-batch-kalender-v1] pola batch kelas grup → pertemuan
import { simpanDaftarLevel } from "@/lib/kelasCache"; // [kelas-level-switcher-v3] titip daftar level buat strip di halaman detail
import { petaNomorSesi } from "@/lib/nomorSesi"; // [sesi-nomor-sinkron-v1] nomor sesi nyambung dengan sessions_used
import { tanpaSesiSintetis } from "@/lib/sesiSintetis"; // [jadwal-hantu-hidden-v1] baris presensi pembukuan disembunyikan
import { LangSlugFlag } from "@/components/RectFlag"; // [materi-flag-pie-v1] bendera rounded-rect (data bendera-nya lazy)
import { sapaan, initial as callInitial } from "@/lib/teacherName"; // [teacher-sapaan-v1] "Kak Dhani", bukan nama lengkap
import { supabase, initialAuthError, peekSessionUser, adoptImplicitSessionFromUrl, resolveSessionForGate } from "@/lib/supabase-client"; // [akun-oauth-error-surface-v2] [perf:session-cookie-peek-v1] [auth-implicit-hash-adopt-v1] [auth-gate-resilient-v1]
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import successAnim from "../payment/success/success-anim.json";
import { Zap, Target, MessageCircle, Globe, Plus, LogOut, Clock, Calendar, Bug, Pencil, Star, Trophy, BookOpen, Newspaper, BookMarked, User, Users, Baby, ClipboardList, GraduationCap, Video, Camera, Mail, Languages, ChevronRight, Search, ArrowRight, Shield, Bell, SlidersHorizontal, Wallet, Upload, BadgeCheck, CreditCard, Check, XCircle, Hand, X, Eye, EyeOff, MessagesSquare, PartyPopper, Rocket, Sprout, HelpCircle, AlertCircle, Sparkles, FileText, Layers, Lightbulb, Loader2, AlertTriangle, Minus, Play, ExternalLink, ClipboardCheck, BarChart2, type LucideIcon } from "lucide-react";
// [no-emoji-lucide-v1] bendera rounded-rect buat prefix nomor WA & pilihan tes (bukan emoji 🇮🇩)
import { RectFlag } from "@/components/RectFlag";

import PaymentCard from '@/components/PaymentCard';
import NotificationBell from '@/components/NotificationBell';
// [ui-lang-switcher-v1] pemilih bahasa antarmuka dashboard (ID ⇄ EN)
import BugReportDialog from '@/components/akun/BugReportDialog'; // [bug-report-topbar-siswa-v1]
import UiLangSwitcher from '@/components/akun/UiLangSwitcher';
import { useT, useUiLang, setUiLang } from '@/lib/uiLang';
// [perf:akun-lazy-tabs-v1] modal & provider non-kritis → lazy (baru dimuat saat dibutuhkan)
const PlacementPicker = dynamic(() => import('@/components/PlacementPicker'), { ssr: false });
// [remove-onesignal-prompt] provider dimatikan — hilangkan popup auto-prompt notifikasi
// const OneSignalProvider = dynamic(() => import('@/components/OneSignalProvider'), { ssr: false });
import PaymentDetailModal from '@/components/akun/PaymentDetailModal';
import PaymentInstructionSheet from '@/components/akun/PaymentInstructionSheet';
import CompactHeroBanner from '@/components/akun/CompactHeroBanner';
// [lanjutkan-belajar-v1] pintasan lintas-menu di paling atas Beranda
import LanjutkanBelajar from '@/components/akun/LanjutkanBelajar';
// [shell-mobile-drawer-v1] TopBarMinimal & MobileBottomNav sekarang dirender StudentShell.
import StudentShell from '@/components/akun/StudentShell';
import { canAccessMateri as canAccessMateriGate } from '@/lib/materiGate';
// [lms-content-readiness-v1] sesi Belajar Mandiri yang materinya belum ditulis jangan ikut dihitung
import { fetchLessonStats, keepReady } from '@/lib/lmsContent';
import { externalLinkFor, isPlaceholderLink } from "@/lib/digitalAccess"; // [elearning-kartu-langsung-youtube-v1]
import { orMilikSaya } from "@/lib/digitalOwnership"; // [perpustakaan-akses-email-v1] kepemilikan = auth_user_id ATAU email sesi
const SimulasiKatalog = dynamic(() => import('@/components/akun/SimulasiKatalog'), { ssr: false, loading: () => <div className="flex w-full items-center justify-center py-24"><div className="h-7 w-7 animate-spin rounded-full border-2 border-[#16796E] border-t-transparent" /></div> }); // [simulasi-inshell-v1] lazy

// [linguo-patch:onboarding-success-lottie-v1] Lottie ceklis sukses (reuse success-anim.json).
// File ini "use client" → dynamic ssr:false aman dipasang langsung (hindari SSR lottie-web).
const OnbSuccessLottie = dynamic(() => import("lottie-react"), { ssr: false });

// [akun-login-redesign-v1] Efek typewriter untuk sapaan multi-bahasa di panel kiri login.
const LOGIN_GREETINGS = ["Halo!", "Bonjour!", "안녕!", "¡Hola!", "Ciao!", "こんにちは!", "你好!", "Hallo!", "Olá!", "안녕하세요!"];
function GreetingTypewriter() {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const full = LOGIN_GREETINGS[idx];
    if (!deleting && text === full) {
      const t = setTimeout(() => setDeleting(true), 1400);
      return () => clearTimeout(t);
    }
    if (deleting && text === "") {
      setDeleting(false);
      setIdx((i) => (i + 1) % LOGIN_GREETINGS.length);
      return;
    }
    const t = setTimeout(() => {
      setText((prev) => deleting ? full.slice(0, prev.length - 1) : full.slice(0, prev.length + 1));
    }, deleting ? 55 : 110);
    return () => clearTimeout(t);
  }, [text, deleting, idx]);
  return (
    <span className="inline-flex items-baseline">
      <span>{text}</span>
      <span className="ml-1 inline-block w-[3px] self-stretch animate-pulse bg-white/90" aria-hidden style={{ minHeight: "1em" }} />
    </span>
  );
}

function OnboardingSuccess({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2400);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 via-white to-teal-50 px-6 text-center">
      <div className="h-40 w-40">
        <OnbSuccessLottie animationData={successAnim} loop={false} />
      </div>
      <h1 className="mt-2 flex items-center justify-center gap-2 text-2xl font-extrabold text-gray-900">
        Selamat datang di Linguo!
        <PartyPopper className="h-6 w-6 shrink-0 text-teal-600" strokeWidth={2} />
      </h1>
      <p className="mt-1 text-sm text-gray-500">Akun kamu udah siap — lagi nyiapin dashboard kamu…</p>
    </div>
  );
}
// [perf:akun-lazy-tabs-v1] Komponen berat per-tab/modal di-lazy-load (chunk terpisah,
// baru diunduh saat tab/modal-nya dibuka) — bukan dibundel ke JS awal /akun.
// ssr:false aman karena page ini "use client" & semua dirender kondisional.
import type { Cert } from '@/components/akun/SertifikatTab';
// [chunk-reload-v1] fallback loading utk tab lazy — tanpa ini, klik menu terasa
// "mati" selama chunk diunduh (atau saat chunk basi gagal dimuat sehabis deploy).
const TabLoading = () => (
  <div className="flex w-full items-center justify-center py-24">
    <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#16796E] border-t-transparent" />
  </div>
);
const SertifikatTab = dynamic(() => import('@/components/akun/SertifikatTab'), { ssr: false, loading: TabLoading });
const SilabusOutline = dynamic(() => import('@/components/akun/SilabusOutline'), { ssr: false });
// [materi-sesi-timeline-v1] linimasa sesi (jadwal, rekaman & materi per sesi) di tab Kelas & Materi
const SesiTimeline = dynamic(() => import('@/components/akun/SesiTimeline'), { ssr: false });
/* [materi-tab-kuis-rapor-v1] Kuis & Rapor dulu cuma ada di halaman detail kelas
   (/akun/kelas/[id]). Kartu kelas di Beranda melempar ke sana, jadi siswa punya DUA
   tempat berbeda buat satu kelas yang sama: menu "Kelas & Materi" (sesi+materi) dan
   halaman detail (materi+progress+kuis+rapor). Sekarang keempat tab itu menyatu di
   menu "Kelas & Materi" — komponennya persis yang dipakai halaman detail, bukan
   salinan baru, biar tak ada dua versi tampilan yang harus dijaga sinkron. */
const ClassKuisTab = dynamic(() => import('@/components/akun/ClassKuisTab'), { ssr: false, loading: TabLoading });
const ClassRaporTab = dynamic(() => import('@/components/akun/ClassRaporTab'), { ssr: false, loading: TabLoading });
const JadwalCalendar = dynamic(() => import('@/components/akun/JadwalCalendar'), { ssr: false, loading: TabLoading }); // linguo-patch:akun-jadwal-tab-v1
// jadwal-gcal-v1: daftar "Sesi Mendatang" — pindahan dari kolom kiri kalender ke Beranda.
const SesiMendatangCard = dynamic(() => import('@/components/akun/SesiMendatangCard'), { ssr: false });
const LessonPlayer = dynamic(() => import('@/components/akun/LessonPlayer'), { ssr: false, loading: TabLoading }); // [linguo-patch:akun-inplace-lessonplayer-v1] immersive player tunggal
// [beranda-insights-v1] kartu ringkasan belajar (skill+delta, PR, materi, beban minggu, peringkat).
// ssr:false — semua isinya butuh sesi Supabase klien, tak ada gunanya dirender di server.
const BerandaInsights = dynamic(() => import('@/components/akun/BerandaInsights'), { ssr: false });
/* [nav-tab-grup-pustaka-v1] Grup Kelas & Perpustakaan Saya sekarang tab di halaman ini.
   Komponennya sama persis dengan yang dipakai route /akun/grup & /akun/perpustakaan,
   jadi tak ada dua versi tampilan yang harus dijaga sinkron. */
const StudentGroupChat = dynamic(() => import('@/components/akun/StudentGroupChat'), { ssr: false, loading: TabLoading });
const LibraryView = dynamic(() => import('@/components/akun/LibraryView'), { ssr: false, loading: TabLoading });
import AttentionAlert from '@/components/akun/AttentionAlert';
import { Spinner } from "@/components/Spinner";
// ── Supabase Client ──────────────────────────────────────────────────────
// [akun-batalkan-hard-delete-v1] pakai client anon kanonik dari @/lib/supabase-client
// (bukan service-role) — session-aware (persistSession) biar RLS jalan benar.

// [linguo-patch:akun-affiliate-capture-v1]
// Baca cookie linguo_ref (di-set middleware dari ?ref=KODE, httpOnly:false).
// Cukup return KODE referral; affiliate_id diisi DB trigger resolve_affiliate_id.
function getRefCodeFromCookie(): string | null {
  try {
    if (typeof document === "undefined") return null;
    const m = document.cookie.match(/(?:^|;\s*)linguo_ref=([^;]+)/);
    if (!m) return null;
    const code = decodeURIComponent(m[1]).trim();
    return code || null;
  } catch {
    return null;
  }
}

// ── Types ────────────────────────────────────────────────────────────────
type StudentReg = {
  id: string;
  product: string;
  language: string;
  level: string;
  status: string;
  sessions_total: number;
  sessions_used: number;
  duration: string;
  total_amount: number;
  payment_status: string;
  registration_date: string;
  // [linguo-patch:akun-tagihan-real-v1] kolom billing buat tab Tagihan & Paket
  installment_paid?: number | null;   // rupiah yang sudah dibayar (cicilan)
  payment_due_date?: string | null;   // jatuh tempo cicilan berikutnya
  payment_date?: string | null;       // tanggal pelunasan
  created_at?: string | null;
  teacher_id?: string;
  teachers?: { name: string; whatsapp?: string; avatar_url?: string | null } | null;
  payment_proof_url?: string | null;
  payment_proof_uploaded_at?: string | null;
  payment_verified_at?: string | null;
  payment_rejection_reason?: string | null;
  // [linguo-patch:akun-hide-cancelled-typefix-v1] kolom lifecycle dari cron/admin
  pipeline_status?: string | null;
  archived_at?: string | null;
  // Batch data for Kelas Reguler
  // [jadwal-batch-kalender-v1] nama kolom mengikuti tabel `regular_batches` yang asli
  // (dulu memakai nama karangan schedule_day/schedule_time dari tabel yang tak ada).
  batch_id?: string | null;
  batch?: {
    id: string;
    batch_code: string;
    language?: string | null;
    level?: string | null;
    session_day: string;
    session_start_time: string;
    session_duration_min?: number | null;
    start_date: string;
    end_date: string;
    status?: string | null;
    zoom_link?: string;
    total_sessions?: number | null;
  } | null;
  // [jadwal-batch-kalender-v1] batch English Test Preparation (`test_prep_batches`)
  test_prep_batch_id?: string | null;
  testPrepBatch?: {
    id: string;
    name: string;
    test_type: string;
    level?: string | null;
    schedule_days: string[] | null;
    schedule_time: string | null;
    duration_minutes?: number | null;
    start_date: string | null;
    end_date: string | null;
    sessions_total?: number | null;
    cancelled_at?: string | null;
  } | null;
};

// ── Product Badges ──────────────────────────────────────────────────
// [beranda-kelas-seksi-v1] KUNCI HARUS PERSIS nilai `registrations.product` di DB.
// Dua yang lama meleset: "English Test Preparation" (di DB pakai akhiran
// "(IELTS/TOEFL)") dan Semi Private yang belum terdaftar sama sekali — dua-duanya
// jatuh ke badge Private. Nilai yang benar-benar ada di DB per Agustus 2026:
// Kelas Private, Kelas Reguler, Kelas Semi Private, Kelas Kids,
// English Test Preparation (IELTS/TOEFL), E-Learning, E-Book.
const PRODUCT_BADGE: Record<string, { label: string; icon: LucideIcon; color: string; bg: string; border: string }> = {
  "Kelas Private":                            { label: "Private",      icon: User,          color: "text-teal-700",  bg: "bg-teal-50",   border: "border-teal-200" },
  "Kelas Reguler":                            { label: "Reguler",      icon: Users,         color: "text-blue-700",  bg: "bg-blue-50",   border: "border-blue-200" },
  "Kelas Semi Private":                       { label: "Semi-Private", icon: Users,         color: "text-cyan-700",  bg: "bg-cyan-50",   border: "border-cyan-200" },
  "Kelas Kids":                               { label: "Kids",         icon: Baby,          color: "text-purple-700",bg: "bg-purple-50", border: "border-purple-200" },
  "Kelas Semi Private Kids":                  { label: "Semi-Private Kids", icon: Baby,     color: "text-purple-700",bg: "bg-purple-50", border: "border-purple-200" },
  "English Test Preparation (IELTS/TOEFL)":   { label: "Test Prep",    icon: ClipboardList, color: "text-amber-700", bg: "bg-amber-50",  border: "border-amber-200" },
  // Alias ejaan lama — beberapa baris lawas & funnel masih memakai ini.
  "English Test Preparation":                 { label: "Test Prep",    icon: ClipboardList, color: "text-amber-700", bg: "bg-amber-50",  border: "border-amber-200" },
  "E-Learning":                               { label: "E-Learning",   icon: GraduationCap, color: "text-indigo-700",bg: "bg-indigo-50", border: "border-indigo-200" },
  "E-Book":                                   { label: "E-Book",       icon: BookMarked,    color: "text-rose-700",  bg: "bg-rose-50",   border: "border-rose-200" },
};

// [beranda-kelas-seksi-v1] Urutan seksi di tab "Kelas Live". Produk di luar daftar
// ini tetap tampil — dikelompokkan pakai namanya sendiri di paling bawah, jadi tak
// ada kelas yang hilang cuma karena enum-nya baru.
const LIVE_SECTION_ORDER = [
  "Kelas Private",
  "Kelas Semi Private",
  "Kelas Reguler",
  "Kelas Kids",
  "Kelas Semi Private Kids",
  "English Test Preparation (IELTS/TOEFL)",
];

/** Samakan ejaan lama ke enum yang dipakai DB — kalau tidak, Test Prep pecah jadi dua seksi. */
const normalizeProduct = (p?: string | null): string => {
  const v = (p || "").trim();
  if (!v) return "Kelas Private";
  if (v === "English Test Preparation") return "English Test Preparation (IELTS/TOEFL)";
  return v;
};

/* [produk-digital-bukan-kelas-v1] E-Book & E-Learning BUKAN kelas live.
   Pembelian produk digital melahirkan baris `registrations` (lewat trigger),
   jadi selama ini ikut nongol di daftar "Kelas Live" — lengkap dengan kerangka
   kelas yang semua kolomnya kosong: "Belum ada pengajar", "0/0 sesi", "Belum
   ada sesi dijadwalkan". Buat siswa yang cuma beli e-book, seluruh dashboard-nya
   terbaca seperti kelas yang rusak.
   Rumahnya sudah ada dan lebih benar: E-Book di Perpustakaan, E-Learning di
   Belajar Mandiri. Jadi di sini mereka disaring keluar — barisnya TIDAK dihapus
   (tagihan, sertifikat, dan entitlement bahasa tetap membacanya dari activeRegs). */
const PRODUK_DIGITAL = new Set(["E-Book", "E-Learning"]);
const isProdukDigital = (product?: string | null): boolean =>
  PRODUK_DIGITAL.has(normalizeProduct(product));

/** Penjelasan singkat tiap seksi — siswa yang punya dua format kelas sekaligus
 *  sering tak sadar bedanya (kenapa yang satu ada teman sekelas, yang lain tidak). */
const LIVE_SECTION_NOTE: Record<string, string> = {
  "Kelas Private": "Satu pengajar khusus buat kamu, jadwal fleksibel.",
  "Kelas Semi Private": "Grup kecil, jadwal disepakati bareng anggota grup.",
  "Kelas Reguler": "Kelas berkelompok per batch dengan jadwal tetap.",
  "Kelas Kids": "Kelas anak dengan materi & pendekatan khusus.",
  "Kelas Semi Private Kids": "Grup kecil khusus anak.",
  "English Test Preparation (IELTS/TOEFL)": "Persiapan tes IELTS/TOEFL bareng pengajar spesialis.",
};

type StudentData = {
  id: string;
  name: string;
  email?: string;
  whatsapp?: string;
  avatar_url?: string;
  registrations: StudentReg[];
};

type Badge = { id: string; badge_key: string; badge_icon: string; badge_label: string; earned_at: string };
// jadwal-recurring-materi-v1: pengajar sekarang mengisi nomor pertemuan + materi
// (topik, rincian, berkas/link rujukan) waktu bikin jadwal — ikut tampil di kalender siswa.
type ScheduleMaterialLink = { name: string; url: string; kind: "file" | "link" };
type Schedule = {
  id: string; registration_id: string; scheduled_at: string; duration_minutes: number; status: string;
  session_number?: number | null;
  session_title?: string | null;
  material_notes?: string | null;
  material_links?: ScheduleMaterialLink[] | null;
  // jadwal-riwayat-v1: sesi lampau ikut ditarik, jadi presensi & rekamannya perlu
  attendance_status?: string | null;
  recording_url?: string | null;
  // [jadwal-hantu-hidden-v1] penanda baris presensi sintetis (lib/sesiSintetis)
  notes?: string | null;
  // [materi-tab-kuis-rapor-v1] nilai kuis & PR per sesi — dipakai tab "Kuis"
  quiz_score?: number | null;
  quiz_max?: number | null;
  quiz_source?: string | null;
  quiz_submission_id?: string | null;
  homework?: any;
};

// ── Constants ────────────────────────────────────────────────────────────
// [kelas-detail-page-v1] LANG_FLAGS/getFlagUrl/getLangPhoto/langGlyph pindah ke
// @/lib/lang-visuals — dipakai juga oleh halaman detail kelas /akun/kelas/[id].

const LEVEL_SEQUENCE = ["A1.1","A1.2","A1.3","A2.1","A2.2","A2.3","A2.4","B1.1","B1.2","B1.3","B1.4","B1.5","B2.1","B2.2","B2.3","B2.4","B2.5","B2.6","B2.7"];
const LEVEL_MILESTONES = ["A1","A2","B1","B2"];

function getLevelProgress(level: string) {
  const idx = LEVEL_SEQUENCE.indexOf(level);
  return idx >= 0 ? ((idx + 1) / LEVEL_SEQUENCE.length) * 100 : 5;
}

function calculateXP(sessions: number, streak: number, badges: number) {
  const xp = sessions * 100 + streak * 50 + badges * 200;
  if (xp >= 5000) return { xp, rank: "Master", next: "", nextXP: 0 };
  if (xp >= 3000) return { xp, rank: "Expert", next: "Master", nextXP: 5000 };
  if (xp >= 1500) return { xp, rank: "Jagoan", next: "Expert", nextXP: 3000 };
  if (xp >= 500) return { xp, rank: "Pejuang", next: "Jagoan", nextXP: 1500 };
  return { xp, rank: "Pemula", next: "Pejuang", nextXP: 500 };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Selamat pagi";
  if (h < 17) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

// [kelas-video-siswa-v1] `classRoomUrl` + `isJoinable` pindah ke @/lib/classRoom
// (dipakai bareng JadwalCalendar — dulu disalin di dua tempat).

// ── Programs & Languages for Enrollment Wizard ───────────────────────────
const PROGRAMS: { key: string; label: string; desc: string; icon: LucideIcon; tint: string; price: string }[] = [
  { key: "Kelas Private", label: "Kelas Private", desc: "1-on-1 dengan pengajar, jadwal fleksibel", icon: User, tint: "bg-teal-50 text-teal-600", price: "Mulai Rp45k/sesi (30 mnt)" },
  { key: "Kelas Reguler", label: "Kelas Reguler", desc: "Belajar bersama 8–15 siswa, jadwal tetap", icon: Users, tint: "bg-blue-50 text-blue-600", price: "Rp150k / 2 bulan (8 sesi)" },
  { key: "Kelas Kids", label: "Kelas Kids", desc: "Untuk anak usia 5-12 tahun", icon: Baby, tint: "bg-purple-50 text-purple-600", price: "Mulai Rp75k/sesi" },
  { key: "English Test Preparation", label: "IELTS/TOEFL Prep", desc: "Persiapan tes bahasa Inggris", icon: ClipboardList, tint: "bg-amber-50 text-amber-600", price: "Rp300k / 2 bulan (16 sesi)" },
];

const POPULAR_LANGUAGES = [
  "English","Japanese","Korean","Mandarin","French","Spanish","German","Arabic","Italian","Turkish",
  "Russian","Thai","Portuguese","Dutch","Hindi","Vietnamese","Danish","Swedish","Finnish","Georgian",
  "Persian","Hebrew","Polish","Czech","Greek","Norwegian","Javanese","Sundanese","BIPA"
];

// [linguo-patch:beranda-jelajahi-v1] daftar bahasa utk seksi "Jelajahi Bahasa" (dipindah dari tab Materi ke Beranda)
// [linguo-patch:jelajahi-rectflag-v1] glyph huruf diganti bendera rounded rectangle (flag = ISO-2 negara)
const JELAJAHI_LANGS = [
  { name: "English", slug: "english", flag: "gb" },
  { name: "German", slug: "german", flag: "de" },
  { name: "Spanish", slug: "spanish", flag: "es" },
  { name: "French", slug: "french", flag: "fr" },
  { name: "Japanese", slug: "japanese", flag: "jp" },
  { name: "Korean", slug: "korean", flag: "kr" },
  { name: "Mandarin", slug: "mandarin", flag: "cn" },
  { name: "Arabic", slug: "arabic", flag: "sa" },
  { name: "Russian", slug: "russian", flag: "ru" },
  { name: "Dutch", slug: "dutch", flag: "nl" },
  { name: "Italian", slug: "italian", flag: "it" },
  { name: "Turkish", slug: "turkish", flag: "tr" },
  { name: "Portuguese", slug: "portuguese", flag: "pt" },
  { name: "Thai", slug: "thai", flag: "th" },
  { name: "Hindi", slug: "hindi", flag: "in" },
  { name: "Polish", slug: "polish", flag: "pl" },
  { name: "Vietnamese", slug: "vietnamese", flag: "vn" },
  { name: "Greek", slug: "greek", flag: "gr" },
];
// [linguo-patch:jelajahi-flag-no-tile-v1] palet kotak latar bendera dilepas — bendera tampil polos

// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// ONBOARDING WIZARD — Typeform-style, program-first
// ═══════════════════════════════════════════════════════════════════════════
const WIZARD_PROGRAMS: { key: string; label: string; icon: LucideIcon; iconTint: string; desc: string; price: string; badge?: string }[] = [
  { key: "Kelas Private", label: "Kelas Private 1-on-1", icon: User, iconTint: "bg-teal-50 text-teal-600", desc: "Belajar langsung dengan pengajar, jadwal fleksibel", price: "Mulai Rp45k/sesi (30 menit)", badge: "Paling Populer" },
  { key: "Kelas Reguler", label: "Kelas Reguler", icon: Users, iconTint: "bg-blue-50 text-blue-600", desc: "Belajar bersama 8–15 siswa, lebih hemat", price: "Rp18.750/sesi (8 sesi @90 mnt / 2 bulan)" },
  { key: "Kelas Kids", label: "Kelas Kids", icon: Baby, iconTint: "bg-purple-50 text-purple-600", desc: "Untuk anak usia 5–12 tahun", price: "Mulai Rp75k/sesi" },
  { key: "English Test Preparation", label: "IELTS / TOEFL Prep", icon: ClipboardList, iconTint: "bg-amber-50 text-amber-600", desc: "Persiapan tes bahasa Inggris bersertifikat", price: "Rp300k/2 bulan (16 sesi @90 mnt)" },
];
// [linguo-patch:onboarding-lang-catalog-v1] katalog bahasa Kelas Private — lengkap, dikelompokkan per region
const PRIVATE_LANG_GROUPS: { region: string; langs: string[] }[] = [
  { region: "Eropa", langs: ["English","French","German","Spanish","Italian","Portuguese","Dutch","Russian","Polish","Czech","Hungarian","Romanian","Bulgarian","Ukrainian","Greek","Turkish","Danish","Swedish","Norwegian","Finnish","Icelandic"] },
  { region: "Asia", langs: ["Japanese","Korean","Mandarin","Cantonese","Thai","Vietnamese","Filipino","Khmer","Lao","Burmese","Hindi","Urdu"] },
  { region: "Timur Tengah", langs: ["Arabic","Hebrew","Persian"] },
  { region: "Nusantara", langs: ["Javanese","Sundanese","Balinese","Batak","Bugis","Madurese","BIPA"] },
  { region: "Lainnya", langs: ["Georgian"] },
];
const LANGS_BY_PROGRAM: Record<string, string[]> = {
  "Kelas Private": PRIVATE_LANG_GROUPS.flatMap(g => g.langs), // [linguo-patch:onboarding-lang-catalog-v1]
  // [reguler-lang-gate-server-v1] JANGAN ditulis ulang di sini — daftarnya ikut
  // REGULER_LANGS (satu sumber dengan funnel landing & /jadwal-kelas-reguler).
  // Salinan lama ketinggalan 3 bahasa yang batchnya sudah jalan (Italia,
  // Belanda, Tagalog) sekaligus berisiko kebalikannya: bahasa tanpa batch ikut
  // kejual.
  "Kelas Reguler": REGULER_LANGS,
  "Kelas Kids": ["English","Japanese","Korean","Mandarin","French","Spanish"],
  "English Test Preparation": [],
};
// [no-emoji-lucide-v1] ikon emoji diganti bendera negara penyelenggara tes
// (IELTS = British Council/IDP → GB, TOEFL = ETS → US), selaras FLAG_CODE_BY_SLUG.
const TEST_TYPES: { key: string; label: string; desc: string; flag: string }[] = [
  { key: "IELTS", label: "IELTS", desc: "International English Language Testing System", flag: "gb" },
  { key: "TOEFL", label: "TOEFL", desc: "Test of English as a Foreign Language", flag: "us" },
];

// [linguo-patch:onboarding-level-placement-v1] Bahasa yang PUNYA placement test (/silabus/{slug}/coba).
// Diselaraskan dgn katalog placement existing. Nambah/ngurang bahasa? Edit map ini aja.
const PLACEMENT_TEST_LANGS: Record<string, string> = {
  English: "english", German: "german", Spanish: "spanish", French: "french",
  Japanese: "japanese", Korean: "korean", Mandarin: "mandarin", Arabic: "arabic",
  Russian: "russian", Dutch: "dutch", Italian: "italian", Turkish: "turkish",
  Portuguese: "portuguese", Thai: "thai", Hindi: "hindi", Polish: "polish",
  Vietnamese: "vietnamese", Greek: "greek",
};
const placementSlug = (lang: string): string | null => PLACEMENT_TEST_LANGS[lang] || null;

// ═══════════════════════════════════════════════════════════════════════════
// [linguo-patch:onboarding-fix-v1] Data domisili (38 provinsi + kota) & negara
// ═══════════════════════════════════════════════════════════════════════════
const ID_PROVINCES: string[] = [
  "Aceh","Sumatera Utara","Sumatera Barat","Riau","Kepulauan Riau","Jambi","Bengkulu",
  "Sumatera Selatan","Kepulauan Bangka Belitung","Lampung","Banten","DKI Jakarta","Jawa Barat",
  "Jawa Tengah","DI Yogyakarta","Jawa Timur","Bali","Nusa Tenggara Barat","Nusa Tenggara Timur",
  "Kalimantan Barat","Kalimantan Tengah","Kalimantan Selatan","Kalimantan Timur","Kalimantan Utara",
  "Sulawesi Utara","Gorontalo","Sulawesi Tengah","Sulawesi Barat","Sulawesi Selatan","Sulawesi Tenggara",
  "Maluku","Maluku Utara","Papua","Papua Barat","Papua Selatan","Papua Tengah","Papua Pegunungan","Papua Barat Daya",
];

const ID_CITIES: Record<string, string[]> = {
  "Aceh": ["Banda Aceh","Lhokseumawe","Langsa","Sabang","Meulaboh","Bireuen","Takengon","Sigli"],
  "Sumatera Utara": ["Medan","Binjai","Pematangsiantar","Tebing Tinggi","Tanjungbalai","Sibolga","Padang Sidempuan","Gunungsitoli","Deli Serdang","Kabanjahe"],
  "Sumatera Barat": ["Padang","Bukittinggi","Padang Panjang","Payakumbuh","Pariaman","Sawahlunto","Solok","Batusangkar"],
  "Riau": ["Pekanbaru","Dumai","Bengkalis","Bagansiapiapi","Rengat","Bangkinang","Siak"],
  "Kepulauan Riau": ["Batam","Tanjungpinang","Tanjung Balai Karimun","Ranai","Daik Lingga"],
  "Jambi": ["Jambi","Sungai Penuh","Muara Bulian","Bangko","Kuala Tungkal","Sarolangun"],
  "Bengkulu": ["Bengkulu","Curup","Manna","Arga Makmur","Mukomuko"],
  "Sumatera Selatan": ["Palembang","Prabumulih","Lubuklinggau","Pagar Alam","Baturaja","Lahat","Sekayu"],
  "Kepulauan Bangka Belitung": ["Pangkalpinang","Tanjung Pandan","Sungailiat","Manggar","Mentok","Koba"],
  "Lampung": ["Bandar Lampung","Metro","Kotabumi","Liwa","Kalianda","Pringsewu","Gunung Sugih"],
  "Banten": ["Serang","Tangerang","Tangerang Selatan","Cilegon","Pandeglang","Rangkasbitung"],
  "DKI Jakarta": ["Jakarta Pusat","Jakarta Utara","Jakarta Barat","Jakarta Selatan","Jakarta Timur","Kepulauan Seribu"],
  "Jawa Barat": ["Bandung","Bekasi","Bogor","Depok","Cimahi","Sukabumi","Cirebon","Tasikmalaya","Garut","Karawang","Cianjur","Purwakarta","Subang","Indramayu","Kuningan","Majalengka","Sumedang","Banjar"],
  "Jawa Tengah": ["Semarang","Surakarta (Solo)","Salatiga","Magelang","Pekalongan","Tegal","Purwokerto","Kudus","Cilacap","Klaten","Boyolali","Sukoharjo","Jepara","Demak","Kebumen","Wonosobo","Brebes"],
  "DI Yogyakarta": ["Yogyakarta","Sleman","Bantul","Kulon Progo","Gunungkidul","Wates","Wonosari"],
  "Jawa Timur": ["Surabaya","Malang","Sidoarjo","Gresik","Mojokerto","Kediri","Madiun","Blitar","Pasuruan","Probolinggo","Jember","Banyuwangi","Tulungagung","Lamongan","Bojonegoro","Tuban","Batu","Ponorogo"],
  "Bali": ["Denpasar","Badung","Gianyar","Tabanan","Singaraja","Klungkung","Bangli","Karangasem","Negara","Ubud"],
  "Nusa Tenggara Barat": ["Mataram","Bima","Sumbawa Besar","Dompu","Praya","Selong","Tanjung","Gerung"],
  "Nusa Tenggara Timur": ["Kupang","Ende","Maumere","Ruteng","Waingapu","Atambua","Labuan Bajo","Bajawa","Larantuka"],
  "Kalimantan Barat": ["Pontianak","Singkawang","Sambas","Ketapang","Sintang","Sanggau","Mempawah"],
  "Kalimantan Tengah": ["Palangka Raya","Sampit","Pangkalan Bun","Kuala Kapuas","Buntok","Muara Teweh"],
  "Kalimantan Selatan": ["Banjarmasin","Banjarbaru","Martapura","Kandangan","Barabai","Amuntai","Pelaihari","Kotabaru"],
  "Kalimantan Timur": ["Samarinda","Balikpapan","Bontang","Tenggarong","Sangatta","Tanjung Redeb","Penajam"],
  "Kalimantan Utara": ["Tarakan","Tanjung Selor","Nunukan","Malinau","Tideng Pale"],
  "Sulawesi Utara": ["Manado","Bitung","Tomohon","Kotamobagu","Tondano","Airmadidi","Amurang"],
  "Gorontalo": ["Gorontalo","Limboto","Marisa","Tilamuta","Kwandang","Suwawa"],
  "Sulawesi Tengah": ["Palu","Poso","Luwuk","Toli-Toli","Donggala","Parigi","Ampana","Banggai"],
  "Sulawesi Barat": ["Mamuju","Majene","Polewali","Pasangkayu","Mamasa"],
  "Sulawesi Selatan": ["Makassar","Parepare","Palopo","Watampone (Bone)","Sungguminasa","Maros","Sengkang","Bulukumba","Pangkajene","Sidrap","Pinrang","Bantaeng"],
  "Sulawesi Tenggara": ["Kendari","Baubau","Unaaha","Raha","Kolaka","Wangi-Wangi","Lasusua","Andoolo"],
  "Maluku": ["Ambon","Tual","Masohi","Namlea","Saumlaki","Dobo","Piru"],
  "Maluku Utara": ["Ternate","Tidore","Sofifi","Tobelo","Labuha","Sanana","Jailolo"],
  "Papua": ["Jayapura","Sentani","Sarmi","Wamena (lama)","Genyem"],
  "Papua Barat": ["Manokwari","Sorong (lama)","Bintuni","Fakfak","Kaimana"],
  "Papua Selatan": ["Merauke","Tanah Merah","Kepi","Bade"],
  "Papua Tengah": ["Nabire","Timika","Enarotali","Sugapa","Ilaga"],
  "Papua Pegunungan": ["Wamena","Dekai","Oksibil","Tiom","Kenyam"],
  "Papua Barat Daya": ["Sorong","Aimas","Teminabuan","Waisai","Ayamaru"],
};

const WORLD_COUNTRIES: string[] = [
  "Malaysia","Singapura","Australia","Jepang","Korea Selatan","Tiongkok","Hong Kong","Taiwan","Thailand",
  "Vietnam","Filipina","Brunei","Kamboja","Laos","Myanmar","India","Pakistan","Bangladesh","Sri Lanka","Nepal",
  "Amerika Serikat","Kanada","Inggris","Irlandia","Belanda","Jerman","Prancis","Belgia","Swiss","Austria",
  "Italia","Spanyol","Portugal","Yunani","Swedia","Norwegia","Denmark","Finlandia","Polandia","Ceko","Hungaria",
  "Rumania","Bulgaria","Ukraina","Rusia","Turki","Yordania","Arab Saudi","Uni Emirat Arab","Qatar","Kuwait",
  "Bahrain","Oman","Mesir","Maroko","Tunisia","Afrika Selatan","Nigeria","Kenya","Selandia Baru","Brasil",
  "Argentina","Meksiko","Chili","Kolombia","Peru","Lainnya",
];

// ═══════════════════════════════════════════════════════════════════════════
// [linguo-patch:onboarding-fix7-v1] Progress milestone (ganti progress bar tipis)
// ═══════════════════════════════════════════════════════════════════════════
const ONB_MILESTONES = ["Program", "Bahasa", "Level", "Data Diri", "Selesai"];
function OnbMilestoneBar({ step }: { step: number }) {
  const active = step - 1; // step 1..5 → milestone 0..4
  const total = ONB_MILESTONES.length;
  return (
    <div className="mx-auto w-full max-w-lg px-5 pt-5 pb-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold text-teal-700">{ONB_MILESTONES[active] || ""}</span>
        <span className="text-[11px] font-medium text-gray-400">Langkah {active + 1} dari {total}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {ONB_MILESTONES.map((label, i) => (
          <div key={label} className={`flex items-center gap-1.5 ${i < total - 1 ? "flex-1" : "flex-none"}`}>
            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all ${i < active ? "bg-teal-500 text-white" : i === active ? "bg-teal-600 text-white ring-4 ring-gray-100" : "bg-gray-100 text-gray-400"}`}>
              {i < active ? <Check className="h-3.5 w-3.5" strokeWidth={3.5} /> : i + 1}
            </div>
            {i < total - 1 && <div className={`h-1 flex-1 rounded-full transition-all ${i < active ? "bg-teal-400" : "bg-gray-100"}`} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// [linguo-patch:reguler-terms-v1] Ketentuan Kelas Reguler — reusable, tampil sebelum bayar.
function RegulerTermsBox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-left">
      <p className="flex items-center gap-1.5 text-sm font-bold text-amber-800 mb-2">
        <ClipboardList className="h-4 w-4 shrink-0" strokeWidth={2} />
        Ketentuan Kelas Reguler
      </p>
      <ul className="space-y-2 text-[12px] leading-relaxed text-amber-900/90">
        <li>1. Kelas Reguler dibuka jika peserta memenuhi <b>minimal 8 siswa</b>.</li>
        <li>2. Jika kuota minimum belum terpenuhi, kelas <b>tidak dibuka</b> pada periode tersebut. Kamu bisa memilih: menunggu periode berikutnya, memindahkan pembayaran ke program/bahasa lain, atau beralih ke kelas <b>Private / Semi-Private</b> (dengan penyesuaian biaya).</li>
        <li>3. Jika kelas tidak dibuka, kamu berhak atas <b>pengembalian dana penuh</b>. Selain refund, tersedia opsi: simpan sebagai <b>deposit / saldo</b> untuk batch berikutnya, alihkan ke kelas <b>Private</b> (penyesuaian biaya), atau tukar dengan <b>produk digital (e-learning)</b>.</li>
      </ul>
      <label className="mt-3 flex items-start gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-amber-400 accent-teal-600 focus:ring-gray-300"
        />
        <span className="text-[12px] font-semibold text-amber-900">Saya sudah membaca &amp; menyetujui ketentuan Kelas Reguler di atas.</span>
      </label>
    </div>
  );
}

function OnboardingWizard({ user, studentId, onDone }: {
  user: any; studentId?: string; onDone: (data: {program: string; lang: string; testType: string; exp: string; wa: string; name: string; birthdate: string; domicile: string; level: string; avatarFile?: File | null}) => void;
}) {
  const [step, setStep] = useState(0);
  const [program, setProgram] = useState("");
  const [testType, setTestType] = useState("");
  const [lang, setLang] = useState("");
  const [exp, setExp] = useState<"beginner"|"some"|"">("");
  const [level, setLevel] = useState(""); // [linguo-patch:onboarding-level-placement-v1]
  const [search, setSearch] = useState("");
  // [linguo-patch:onboarding-wa-step-v1] nomor WA wajib
  const [wa, setWa] = useState("");
  const [name, setName] = useState(user?.user_metadata?.full_name || "");
  const [birthdate, setBirthdate] = useState("");
  // [linguo-patch:onboarding-fix-v1] domisili terstruktur + avatar + date popover + hint
  const [isLN, setIsLN] = useState(false);
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [manualCity, setManualCity] = useState("");
  const [country, setCountry] = useState("");
  const [lnCity, setLnCity] = useState("");
  const cityOptions = province ? (ID_CITIES[province] || []) : [];
  const idCityName = city === "__manual__" ? manualCity.trim() : city;
  const domicileStr = isLN
    ? (country ? (lnCity.trim() ? `${lnCity.trim()}, ${country} (LN)` : `${country} (LN)`) : "")
    : (province && idCityName ? `${idCityName}, ${province}` : "");
  const domicileValid = isLN ? !!country : (!!province && !!idCityName);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const googleAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";
  const today = new Date();
  const [calY, setCalY] = useState(today.getFullYear() - 20);
  const [calM, setCalM] = useState(0);
  const [dateOpen, setDateOpen] = useState(false);
  const [triedNext, setTriedNext] = useState(false);
  // [linguo-patch:reguler-terms-v1] persetujuan ketentuan Kelas Reguler (gate tombol daftar)
  const [agreeReguler, setAgreeReguler] = useState(false);
  const waDigits = wa.replace(/\D/g, "");
  const waNorm = waDigits.startsWith("0") ? "62" + waDigits.slice(1) : waDigits.startsWith("8") ? "62" + waDigits : waDigits;
  const waValid = waNorm.startsWith("62") && waNorm.length >= 10 && waNorm.length <= 15;
  const profileValid = name.trim().length >= 2 && waValid && !!birthdate && domicileValid;
  const missing: string[] = [];
  if (name.trim().length < 2) missing.push("Nama lengkap");
  if (!waValid) missing.push("Nomor WhatsApp");
  if (!birthdate) missing.push("Tanggal lahir");
  if (!domicileValid) missing.push("Domisili");

  const firstName = (user?.user_metadata?.full_name || user?.email || "Kamu").split(" ")[0];
  const isTestPrep = program === "English Test Preparation";
  const isReguler = program === "Kelas Reguler";
  const availLangs = (LANGS_BY_PROGRAM[program] || []).filter(l => !search || l.toLowerCase().includes(search.toLowerCase()));
  // [linguo-patch:onboarding-lang-catalog-v1] tampilan bahasa dikelompokkan per region (khusus Kelas Private)
  const langGroups = program === "Kelas Private"
    ? PRIVATE_LANG_GROUPS
        .map(g => ({ region: g.region, langs: g.langs.filter(l => !search || l.toLowerCase().includes(search.toLowerCase())) }))
        .filter(g => g.langs.length > 0)
    : [{ region: "", langs: availLangs }];
  const langNoResults = langGroups.every(g => g.langs.length === 0);
  const stepCount = 6;

  // [onboarding-sekali-kirim-v1] Tiga tombol di langkah terakhir ("Daftar", "Coba
  // placement", "Lihat dashboard dulu") memanggil finish() yang sama, dan onDone
  // menembak /api/enroll. Tanpa palang ini, klik dobel (atau pindah tombol sebelum
  // request kelar) melahirkan DUA baris students untuk satu email — persis asal
  // usul kembaran yang bikin dashboard mental ke onboarding — dan panggilan kedua
  // ditolak trigger `tolak_registrasi_kembar` (23505) dengan toast merah.
  const sudahKirim = useRef(false);
  const finish = () => {
    if (sudahKirim.current) return;
    sudahKirim.current = true;
    const key = `linguo_onboarded_${studentId || user?.id || user?.email}`;
    try { localStorage.setItem(key, "1"); } catch {}
    onDone({ program, lang, testType, exp, wa: waNorm, name: name.trim(), birthdate, domicile: domicileStr, level, avatarFile });
  };

  const go = (n: number, delay = 220) => setTimeout(() => setStep(n), delay);
  // [linguo-patch:reguler-terms-v1] reset checkbox tiap ganti program/bahasa
  useEffect(() => { setAgreeReguler(false); }, [program, lang]);

  const waMsg = encodeURIComponent(
    `Halo admin Linguo! Saya ${firstName}, mau daftar ${isTestPrep ? (testType ? testType + " Prep" : "IELTS/TOEFL Prep") : program + (lang ? " bahasa " + lang : "")}` +
    (exp === "beginner" ? " (pemula)" : exp === "some" ? " (sudah ada dasar)" : "") +
    `. Mohon info jadwal dan biayanya ya. Terima kasih!`
  );

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center p-4 overflow-y-auto">
      {step >= 1 && (
        <div className="absolute top-0 left-0 right-0">
          <OnbMilestoneBar step={step} />
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }} className="w-full max-w-lg py-8">

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="mb-4 flex justify-center"><span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-50 text-teal-600"><PartyPopper className="h-8 w-8" /></span></div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Halo, {firstName}!</h1>
              <p className="text-gray-500 mb-2">Selamat datang di <strong>Linguo.id</strong> — platform belajar 60+ bahasa asing.</p>
              <p className="text-gray-400 text-sm mb-8">Yuk setup akun kamu dalam 1 menit. Kami bantu temukan kelas yang paling cocok!</p>
              <div className="grid grid-cols-3 gap-3 mb-8 text-center">
                {[["60+","Bahasa"],["200+","Siswa Aktif"],["1-on-1","Kelas Private"]].map(([v,l]) => (
                  <div key={l} className="bg-white rounded-2xl p-3 shadow-sm">
                    <div className="text-xl font-extrabold text-teal-600">{v}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-2xl text-base transition-all shadow-md shadow-teal-200 active:scale-[0.98]">
                Mulai Setup →
              </button>
            </div>
          )}

          {/* Step 1: Program (auto-advance) */}
          {step === 1 && (
            <div>
              <div className="text-center mb-6">
                <div className="mb-3 flex justify-center"><span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-50 text-teal-600"><Target className="w-6 h-6" /></span></div>
                <h2 className="text-xl font-extrabold text-gray-900">Program apa yang kamu inginkan?</h2>
                <p className="text-gray-400 text-sm mt-1">Pilih satu — langsung lanjut otomatis</p>
              </div>
              <div className="space-y-3">
                {WIZARD_PROGRAMS.map(p => {
                  const Icon = p.icon;
                  return (
                  <button key={p.key} onClick={() => { setProgram(p.key); setLang(""); setTestType(""); setExp(""); go(2); }}
                    className={`w-full flex items-start gap-4 p-4 rounded-2xl transition-all text-left active:scale-[0.98] ${program === p.key ? "bg-gray-100" : "bg-gray-50 hover:bg-gray-100"}`}>
                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl shrink-0 mt-0.5 ${p.iconTint}`}><Icon className="w-5 h-5" /></span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-gray-800">{p.label}</span>
                        {p.badge && <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-semibold">{p.badge}</span>}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{p.desc}</div>
                      <div className="text-xs text-teal-600 font-semibold mt-1">{p.price}</div>
                    </div>
                    {program === p.key && <span className="text-teal-500 font-bold shrink-0 mt-0.5"><Check className="w-4 h-4" /></span>}
                  </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2a: Test type for IELTS/TOEFL */}
          {step === 2 && isTestPrep && (
            <div>
              <div className="text-center mb-6">
                <div className="mb-3 flex justify-center"><span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600"><FileText className="h-6 w-6" /></span></div>
                <h2 className="text-xl font-extrabold text-gray-900">Mau persiapan tes apa?</h2>
              </div>
              <div className="space-y-3 mb-5">
                {TEST_TYPES.map(t => (
                  <button key={t.key} onClick={() => { setTestType(t.key); go(3); }}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl transition-all text-left active:scale-[0.98] ${testType === t.key ? "bg-gray-100" : "bg-gray-50 hover:bg-gray-100"}`}>
                    <RectFlag code={t.flag} h={26} />
                    <div>
                      <div className="font-bold text-gray-800">{t.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{t.desc}</div>
                    </div>
                    {testType === t.key && <Check className="ml-auto h-4 w-4 shrink-0 text-teal-500" />}
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-gray-600">← Ganti program</button>
            </div>
          )}

          {/* Step 2b: Language (auto-advance on click) */}
          {step === 2 && !isTestPrep && (
            <div>
              <div className="text-center mb-4">
                <div className="mb-3 flex justify-center"><span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600"><Globe className="h-6 w-6" /></span></div>
                <h2 className="text-xl font-extrabold text-gray-900">Bahasa apa yang ingin kamu pelajari?</h2>
                <p className="text-gray-400 text-sm mt-1">Klik → langsung lanjut</p>
              </div>
              <div className="relative mb-3">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari bahasa..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-300 pl-9" />
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              {/* [linguo-patch:onboarding-lang-catalog-v1] grid bahasa dikelompokkan per region */}
              <div className="max-h-72 overflow-y-auto pb-1 space-y-3">
                {langGroups.map(g => (
                  <div key={g.region || "all"}>
                    {g.region && <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 px-0.5">{g.region}</div>}
                    <div className="grid grid-cols-3 gap-2">
                      {g.langs.map(l => (
                        <button key={l} onClick={() => { setLang(l); go(3, 200); }}
                          className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${lang === l ? "bg-gray-100 text-teal-700" : "bg-gray-50 hover:bg-gray-100 text-gray-600"}`}>
                          {LANG_FLAGS[l] ? <img src={`https://flagcdn.com/w40/${LANG_FLAGS[l]}.png`} alt={l} className="w-7 h-5 object-cover rounded-sm" /> : <Globe className="h-5 w-5 text-gray-400" />}
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {langNoResults && <div className="text-center text-sm text-gray-400 py-6">Nggak ada bahasa yang cocok</div>}
              </div>
              <button onClick={() => setStep(1)} className="mt-4 text-sm text-gray-400 hover:text-gray-600">← Ganti program</button>
            </div>
          )}

          {/* Step 3: Experience (auto-advance) */}
          {step === 3 && (
            <div>
              <div className="text-center mb-6">
                <div className="mb-3 flex justify-center">{!isTestPrep && lang && LANG_FLAGS[lang]
                  ? <img src={`https://flagcdn.com/w80/${LANG_FLAGS[lang]}.png`} alt={lang} className="w-14 h-10 object-cover rounded-md" />
                  : <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600"><BookOpen className="h-6 w-6" /></span>}</div>
                <h2 className="text-xl font-extrabold text-gray-900">{isTestPrep ? `Seberapa siap kamu untuk ${testType}?` : `Pengalaman kamu dengan ${lang}?`}</h2>
                <p className="text-gray-400 text-sm mt-1">Ini bantu kami rekomendasikan level yang tepat</p>
              </div>
              <div className="space-y-3">
                {[
                  { key: "beginner", Icon: Sprout, tint: "bg-emerald-50 text-emerald-600", title: isTestPrep ? "Baru mau mulai persiapan" : "Pemula total", desc: isTestPrep ? "Belum tahu harus mulai dari mana" : "Belum pernah belajar sama sekali" },
                  { key: "some", Icon: BookOpen, tint: "bg-indigo-50 text-indigo-600", title: isTestPrep ? "Sudah pernah belajar" : "Sudah ada dasar", desc: isTestPrep ? "Pernah ikut kelas atau belajar mandiri" : "Pernah belajar sedikit, mau lanjutkan" },
                ].map(opt => (
                  <button key={opt.key} onClick={() => {
                      if (opt.key === "beginner") { setExp("beginner"); setLevel(isTestPrep ? "" : "A1.1"); go(4); }
                      else { setExp("some"); if (isTestPrep) { go(4); } else { setLevel(""); } }
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left active:scale-[0.98] ${exp === opt.key ? "bg-gray-100" : "bg-gray-50 hover:bg-gray-100"}`}>
                    <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${opt.tint}`}><opt.Icon className="h-5 w-5" /></span>
                    <div>
                      <div className={`font-bold text-sm ${exp === opt.key ? "text-teal-700" : "text-gray-800"}`}>{opt.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
                    </div>
                    {exp === opt.key && <Check className="ml-auto h-4 w-4 shrink-0 text-teal-500" />}
                  </button>
                ))}
              </div>

              {/* Level sub-picker — [linguo-patch:onboarding-level-placement-v1] muncul kalau "Sudah ada dasar" & bukan test prep */}
              {exp === "some" && !isTestPrep && (
                <div className="mt-5 rounded-2xl bg-teal-50/40 p-4">
                  <p className="text-sm font-bold text-gray-800">Kamu tau level kamu sekarang?</p>
                  <p className="text-xs text-gray-400 mb-3">Pilih kalau yakin, atau ikut placement test kalau ragu.</p>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {["A1","A2","B1","B2"].map(lv => (
                      <button key={lv} onClick={() => { setLevel(lv); go(4); }}
                        className={`rounded-xl py-2.5 text-sm font-bold transition-all active:scale-95 ${level === lv ? "bg-teal-500 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}>
                        {lv}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { setLevel("TBD"); go(4); }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-50 transition-all">
                    {placementSlug(lang)
                      ? <><Target className="h-4 w-4" /> Belum yakin — ikut Placement Test</>
                      : <><HelpCircle className="h-4 w-4" /> Belum yakin (pengajar bantu cek)</>}
                  </button>
                </div>
              )}

              <button onClick={() => setStep(2)} className="mt-4 text-sm text-gray-400 hover:text-gray-600">← Kembali</button>
            </div>
          )}

          {/* Step 4: Lengkapi data — [linguo-patch:onboarding-fix-v1] avatar + email + WA prefix + datepicker + domisili cascading + hint */}
          {step === 4 && (
            <div>
              <div className="text-center mb-4">
                {/* Avatar — upload on-hover (file ditahan, di-upload di save handler setelah student.id ada) */}
                <div className="relative mx-auto mb-3 h-20 w-20">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="group relative h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-teal-100 shadow-md ring-1 ring-slate-200"
                  >
                    {(avatarPreview || googleAvatar) ? (
                      <img src={avatarPreview || googleAvatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-teal-600">
                        {firstName.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <Camera className="h-5 w-5" />
                      <span className="text-[10px] font-semibold">Ganti</span>
                    </span>
                  </button>
                </div>
                <h2 className="text-xl font-extrabold text-gray-900">Lengkapi data kamu</h2>
                <p className="text-gray-400 text-sm mt-1">Biar tim Linguo bisa siapin kelas yang pas buat kamu</p>
              </div>

              <div className="bg-white rounded-2xl p-4 mb-3 space-y-3">
                {/* Email — otomatis dari Google, read-only */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Email</label>
                  <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2.5">
                    <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                    <span className="truncate text-sm text-gray-500">{user?.email || "—"}</span>
                    <span className="ml-auto shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-500">Google</span>
                  </div>
                </div>

                {/* Nama lengkap */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nama lengkap</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nama lengkap kamu"
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-gray-300 ${triedNext && name.trim().length < 2 ? "border-red-300" : "border-gray-200"}`}
                  />
                </div>

                {/* Nomor WhatsApp — prefix bendera + +62 (inline sebaris) */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nomor WhatsApp aktif</label>
                  <div className={`flex items-stretch overflow-hidden rounded-xl border bg-white focus-within:border-gray-300 ${triedNext && !waValid ? "border-red-300" : "border-gray-200"}`}>
                    <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-r border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-600">
                      <RectFlag code="id" h={14} /> +62
                    </span>
                    <input
                      value={wa}
                      onChange={e => setWa(e.target.value)}
                      inputMode="numeric"
                      placeholder="812 3456 7890"
                      className="w-full bg-white px-4 py-2.5 text-sm outline-none"
                    />
                  </div>
                  {wa.length > 0 && !waValid && (
                    <p className="text-[11px] text-red-500 mt-1.5">Masukkan nomor WhatsApp yang valid (tanpa 0 di depan)</p>
                  )}
                </div>

                {/* Tanggal lahir — date picker popover custom */}
                <div className="relative">
                  <label className="text-xs text-gray-500 mb-1 block">Tanggal lahir</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (birthdate) { const d = new Date(birthdate); setCalY(d.getFullYear()); setCalM(d.getMonth()); }
                      setDateOpen(o => !o);
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl border px-4 py-2.5 text-left text-sm outline-none focus:border-gray-300 ${triedNext && !birthdate ? "border-red-300" : "border-gray-200"} ${birthdate ? "text-gray-800" : "text-gray-400"}`}
                  >
                    <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
                    {birthdate
                      ? (() => { const d = new Date(birthdate); const mm = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]; return `${d.getDate()} ${mm[d.getMonth()]} ${d.getFullYear()}`; })()
                      : "Pilih tanggal lahir"}
                  </button>
                  {dateOpen && (() => {
                    const mLabels = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
                    const dows = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
                    const firstDow = new Date(calY, calM, 1).getDay();
                    const daysInMonth = new Date(calY, calM + 1, 0).getDate();
                    const cells: (number | null)[] = [];
                    for (let i = 0; i < firstDow; i++) cells.push(null);
                    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                    const pad = (n: number) => String(n).padStart(2, "0");
                    const isoOf = (d: number) => `${calY}-${pad(calM + 1)}-${pad(d)}`;
                    const maxIso = today.toISOString().split("T")[0];
                    const years: number[] = [];
                    for (let y = today.getFullYear(); y >= today.getFullYear() - 100; y--) years.push(y);
                    return (
                      <div className="absolute left-0 right-0 z-30 mt-2 rounded-2xl bg-white p-3 shadow-xl">
                        <div className="mb-2 flex items-center gap-2">
                          <select value={calM} onChange={e => setCalM(Number(e.target.value))} className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-gray-300">
                            {mLabels.map((m, i) => <option key={m} value={i}>{m}</option>)}
                          </select>
                          <select value={calY} onChange={e => setCalY(Number(e.target.value))} className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-gray-300">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-gray-400">
                          {dows.map((d, i) => <div key={i}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {cells.map((d, i) => {
                            if (d === null) return <div key={i} />;
                            const val = isoOf(d);
                            const disabled = val > maxIso;
                            const selected = birthdate === val;
                            return (
                              <button key={i} type="button" disabled={disabled}
                                onClick={() => { setBirthdate(val); setDateOpen(false); }}
                                className={`h-8 rounded-lg text-xs font-medium transition-colors ${selected ? "bg-teal-600 text-white" : disabled ? "text-gray-200" : "text-gray-700 hover:bg-teal-50"}`}>
                                {d}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Domisili — cascading: Indonesia (provinsi→kota) / luar negeri (negara) */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-xs text-gray-500">Domisili</label>
                    <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-gray-500">
                      <input type="checkbox" checked={isLN} onChange={e => setIsLN(e.target.checked)} className="h-3.5 w-3.5 accent-teal-600" />
                      Tinggal di luar negeri
                    </label>
                  </div>
                  {!isLN ? (
                    <div className="space-y-2">
                      <select value={province} onChange={e => { setProvince(e.target.value); setCity(""); setManualCity(""); }}
                        className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-300 ${triedNext && !province ? "border-red-300" : "border-gray-200"} ${province ? "text-gray-800" : "text-gray-400"}`}>
                        <option value="">Pilih provinsi…</option>
                        {ID_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      {province && (
                        <select value={city} onChange={e => setCity(e.target.value)}
                          className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-300 ${triedNext && !idCityName ? "border-red-300" : "border-gray-200"} ${city ? "text-gray-800" : "text-gray-400"}`}>
                          <option value="">Pilih kota/kabupaten…</option>
                          {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
                          <option value="__manual__">Lainnya (ketik manual)…</option>
                        </select>
                      )}
                      {city === "__manual__" && (
                        <input value={manualCity} onChange={e => setManualCity(e.target.value)} placeholder="Ketik nama kota/kabupaten"
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-300" />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <select value={country} onChange={e => setCountry(e.target.value)}
                        className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-300 ${triedNext && !country ? "border-red-300" : "border-gray-200"} ${country ? "text-gray-800" : "text-gray-400"}`}>
                        <option value="">Pilih negara…</option>
                        {WORLD_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input value={lnCity} onChange={e => setLnCity(e.target.value)} placeholder="Kota (opsional), mis. Tokyo"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-300" />
                    </div>
                  )}
                </div>
              </div>

              {/* Indikasi field yang masih kurang — muncul setelah klik Lanjut (#6) */}
              {triedNext && !profileValid && missing.length > 0 && (
                <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Masih perlu diisi: <strong>{missing.join(", ")}</strong></span>
                </div>
              )}

              <button
                onClick={() => { if (profileValid) { setStep(5); } else { setTriedNext(true); } }}
                aria-disabled={!profileValid}
                className={`w-full rounded-2xl py-4 text-base font-bold transition-all active:scale-[0.98] ${profileValid ? "bg-teal-600 text-white shadow-md shadow-teal-200 hover:bg-teal-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
              >
                Lanjut
              </button>
              <button onClick={() => setStep(3)} className="mt-4 w-full text-sm text-gray-400 hover:text-gray-600 transition-colors">← Kembali</button>
            </div>
          )}

          {/* Step 5: Summary + CTA */}
          {step === 5 && (
            <div>
              <div className="text-center mb-5">
                <div className="mb-3 flex justify-center"><span className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-teal-50 text-teal-600"><Rocket className="h-7 w-7" /></span></div>
                <h2 className="text-xl font-extrabold text-gray-900">Siap mulai belajar!</h2>
                <p className="text-gray-400 text-sm mt-1">Ini rangkuman pilihanmu</p>
              </div>
              <div className="bg-white rounded-2xl p-4 mb-5 space-y-3">
                {([
                  { Icon: Target, label: "Program", value: WIZARD_PROGRAMS.find(p => p.key === program)?.label || program },
                  ...(isTestPrep
                    ? [{ Icon: FileText, label: "Tes", value: testType }]
                    : [{ Icon: Globe, label: "Bahasa", value: lang }]),
                  { Icon: Layers, label: "Level", value: level === "A1.1" ? "Pemula (A1.1)" : level === "TBD" ? "Akan dites dulu" : level ? `Level ${level}` : "Akan dites dulu" },
                ]).map(({ Icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-400"><Icon className="h-4 w-4" /> {label}</span>
                    <span className="font-semibold text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
              {isReguler && (
                <div className="mb-4"><RegulerTermsBox checked={agreeReguler} onChange={setAgreeReguler} /></div>
              )}
              <a href={`https://wa.me/6282116859493?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
                onClick={(e) => { if (isReguler && !agreeReguler) { e.preventDefault(); return; } finish(); }}
                className={`w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-md shadow-green-100 active:scale-[0.98] mb-3 ${isReguler && !agreeReguler ? "opacity-40 pointer-events-none" : ""}`}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.104 1.523 5.824L0 24l6.349-1.499A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.793 9.793 0 01-5.001-1.372l-.36-.214-3.726.879.896-3.628-.235-.374A9.78 9.78 0 012.182 12C2.182 6.545 6.545 2.182 12 2.182c5.455 0 9.818 4.363 9.818 9.818 0 5.454-4.363 9.818-9.818 9.818z"/></svg>
                Daftar via WhatsApp
              </a>
              {level === "TBD" && !isTestPrep && placementSlug(lang) && (
                <a href={`/silabus/${placementSlug(lang)}/coba`} onClick={finish} className="w-full flex items-center justify-center gap-2 border-2 border-slate-200 text-teal-600 font-bold py-3.5 rounded-2xl text-sm hover:bg-teal-50 transition-all mb-3">
                  <Target className="h-4 w-4" /> Ambil Placement Test dulu
                </a>
              )}
              <button onClick={finish} className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors">
                Lihat dashboard dulu →
              </button>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* linguo-patch:onboarding-required-fields-v1 — "Lewati" hanya boleh
          setelah program & bahasa/tes dipilih (step 3). Step 1 & 2 wajib diisi. */}
      {step === 3 && program && (isTestPrep ? testType : lang) && (
        <button onClick={() => setStep(4)} className="absolute top-4 right-4 text-xs text-gray-400 hover:text-gray-600 transition-colors">Lewati</button>
      )}
    </div>
  );
}

// [linguo-patch:akun-wa-gate-existing-v1] WA-gate untuk user lama tanpa nomor WA
// linguo-patch:akun-profile-gate-v1 — gate kelengkapan profil dasar (nama + WhatsApp)
// untuk siswa lama yang datanya belum lengkap. Bahasa & program TIDAK termasuk
// karena keduanya attribute per-registrasi, bukan profil siswa.
function isPlaceholderName(name: any): boolean {
  const n = String(name || "").trim();
  return n.length < 2 || n.toLowerCase() === "siswa";
}
function gateNeedsProfile(student: any): boolean {
  return !student?.whatsapp || isPlaceholderName(student?.name);
}

function WaGate({ user, student, supabase, onSaved }: {
  user: any; student: any; supabase: any; onSaved: (wa: string, avatar: string | null, name: string) => void;
}) {
  const needName = isPlaceholderName(student?.name);
  const needWa = !student?.whatsapp;
  const [name, setName] = useState(needName ? "" : (student?.name || ""));
  const [wa, setWa] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const waDigits = wa.replace(/\D/g, "");
  const waNorm = waDigits.startsWith("0") ? "62" + waDigits.slice(1) : waDigits.startsWith("8") ? "62" + waDigits : waDigits;
  const waValid = waNorm.startsWith("62") && waNorm.length >= 10 && waNorm.length <= 15;
  const nameValid = name.trim().length >= 2;
  const formValid = (!needWa || waValid) && (!needName || nameValid);
  const firstName = (student?.name && !isPlaceholderName(student.name) ? student.name : user?.user_metadata?.full_name || user?.email || "Kamu").split(" ")[0];
  const googleAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

  const save = async () => {
    if (!formValid || saving) return;
    setSaving(true); setErr("");
    const patch: any = {};
    if (needWa) patch.whatsapp = waNorm;
    if (needName) patch.name = name.trim();
    if (!student?.avatar_url && googleAvatar) patch.avatar_url = googleAvatar;
    const { error } = await supabase.from("students").update(patch).eq("id", student.id);
    setSaving(false);
    if (error) { setErr("Gagal menyimpan. Coba lagi ya."); return; }
    onSaved(
      patch.whatsapp ?? student?.whatsapp ?? "",
      patch.avatar_url ?? student?.avatar_url ?? null,
      patch.name ?? student?.name ?? ""
    );
  };

  return (
    <div className="fixed inset-0 z-[120] bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md">
        <div className="text-center mb-5">
          {googleAvatar
            ? <img src={googleAvatar} alt={firstName} referrerPolicy="no-referrer" className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-white shadow-md" />
            : <div className="w-20 h-20 rounded-full mx-auto bg-teal-100 flex items-center justify-center text-2xl font-extrabold text-teal-600 border-4 border-white shadow-md">{firstName.charAt(0).toUpperCase()}</div>}
          <h2 className="mt-4 flex items-center justify-center gap-2 text-xl font-extrabold text-gray-900">
            Hai, {firstName}!
            <Hand className="h-5 w-5 shrink-0 text-amber-500" strokeWidth={2} />
          </h2>
          <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">Sebelum lanjut, lengkapi data profil kamu dulu ya. Tim Linguo butuh ini buat menghubungimu soal jadwal &amp; kelas.</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          {needName && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nama lengkap</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nama lengkap kamu"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-300" />
              {name.length > 0 && !nameValid && (
                <p className="text-[11px] text-red-500 mt-1.5">Masukkan nama lengkap kamu</p>
              )}
            </div>
          )}
          {needWa && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nomor WhatsApp aktif</label>
              <input value={wa} onChange={e => setWa(e.target.value)} inputMode="numeric" placeholder="08xxxxxxxxxx"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-300" />
              {wa.length > 0 && !waValid && (
                <p className="text-[11px] text-red-500 mt-1.5">Masukkan nomor WhatsApp yang valid (contoh: 08123456789)</p>
              )}
            </div>
          )}
          {err && <p className="text-[11px] text-red-500">{err}</p>}
          <button onClick={save} disabled={!formValid || saving}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-md shadow-teal-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed">
            {saving ? "Menyimpan..." : "Simpan & Lanjutkan"}
          </button>
        </div>
        <p className="text-center text-[11px] text-gray-400 mt-3">Data kamu aman & cuma dipakai tim Linguo.</p>
      </div>
    </div>
  );
}

// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// AKUN TAB — Profile, Avatar Upload, Edit Info
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// SETTINGS / PENGATURAN — frame Claude Design [linguo-patch:akun-settings-design-v2]
// Real: avatar, nama, whatsapp, email, status Google, ganti sandi, logout.
// Lokal/visual (belum ada backend): bio/kota/zona, toggle notif & preferensi.
// [linguo-patch:akun-tagihan-real-v1] Tagihan & Paket = DATA REAL dari
// registrations (total_amount, payment_status, installment_paid, payment_due_date)
// + digital_purchases (riwayat e-book/e-learning). Tidak ada lagi dummy.
// ═══════════════════════════════════════════════════════════════════
type SetPane = "profil" | "akun" | "notif" | "preferensi" | "tagihan";

const SETTINGS_NAV: Array<{ id: SetPane; icon: LucideIcon; label: string; sub: string }> = [
  { id: "profil",     icon: User,              label: "Profil",             sub: "Nama, foto, bio" },
  { id: "akun",       icon: Shield,            label: "Akun & Keamanan",    sub: "Email, kata sandi" },
  { id: "notif",      icon: Bell,              label: "Notifikasi",         sub: "Email, WhatsApp, push" },
  { id: "preferensi", icon: SlidersHorizontal, label: "Preferensi Belajar", sub: "Bahasa, pengingat" },
  { id: "tagihan",    icon: Wallet,            label: "Tagihan & Paket",    sub: "Langganan, cicilan" },
];

function SetToggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className="relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors"
      style={{ background: on ? "#16796E" : "#D7DAE0" }}>
      <span className="absolute top-[3px] h-5 w-5 rounded-full bg-white shadow transition-all"
        style={{ left: on ? "21px" : "3px" }} />
    </button>
  );
}

function SetCard({ title, children, footer }: { title?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-3xl bg-white">
      {title ? <div className="px-6 pb-3 pt-5"><h3 className="text-[16px] font-extrabold text-[#12172B]">{title}</h3></div> : null}
      <div className="px-6 pb-5">{children}</div>
      {footer ? <div className="flex justify-end gap-3 border-t border-slate-100 bg-[#F5F6F8] px-6 py-4">{footer}</div> : null}
    </section>
  );
}

function SetFieldBox({ children }: { children: ReactNode }) {
  return (
    <div className="mt-1.5 flex h-12 items-center rounded-xl border border-slate-200 px-4 transition focus-within:border-slate-300">
      {children}
    </div>
  );
}

function SetToggleRow({ label, desc, on, onClick }: { label: string; desc: string; on: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3.5 last:border-0">
      <div className="min-w-0">
        <p className="text-[14px] font-bold text-[#12172B]">{label}</p>
        <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">{desc}</p>
      </div>
      <SetToggle on={on} onClick={onClick} />
    </div>
  );
}

function AkunTab({ user, student, avatarUrl, displayName, firstName, xp, badges, signOut, supabase, onAvatarUpdate, openEnrollWizard }: {
  user: any; student: any; avatarUrl?: string; displayName: string; firstName: string;
  xp: any; badges: any[]; signOut: () => void; supabase: any; onAvatarUpdate: (url: string) => void;
  openEnrollWizard: () => void;
}) {
  const [pane, setPane] = useState<SetPane>("profil");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Profil — Nama & WhatsApp REAL (students.name / students.whatsapp); sisanya lokal (belum ada kolom)
  const [editName, setEditName] = useState(student?.name || displayName);
  const [editWa, setEditWa] = useState(student?.whatsapp || "");
  const [nick, setNick] = useState("");
  const [kota, setKota] = useState("");
  const [tz, setTz] = useState("WIB (GMT+7)");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  // Akun & Keamanan
  const [newPass, setNewPass] = useState("");
  const [confPass, setConfPass] = useState("");

  // Notif & Preferensi — lokal/visual (belum ada tabel)
  const [notif, setNotif] = useState({ email_jadwal: true, email_materi: true, wa_pengingat: true, wa_promo: false, push_sesi: true, push_promo: false });
  const [pref, setPref] = useState({ reminder: true, autoplay: false, subtitle: true, weekly_report: true, twofa: false });
  /* [ui-lang-switcher-v1] Bahasa antarmuka pakai store global — satu sumber dengan
     pemilih di top bar. Dulu state lokal: tombolnya menyala, tapi tak satu pun teks
     di dashboard ikut berganti dan pilihannya hilang begitu halaman ditutup. */
  const uiLang = useUiLang();
  const ts = useT(); // [ui-lang-switcher-v1]

  // ── [linguo-patch:akun-tagihan-real-v1] Tagihan & Paket — DATA REAL ──────
  const fmtRp = (n: number) => "Rp " + Math.max(0, Math.round(n || 0)).toLocaleString("id-ID");
  const fmtTgl = (d?: string | null) => d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";
  const progLabel = (r: StudentReg) => `${PROGRAMS.find(p => p.key === r.product)?.label || r.product}${r.language ? ` — ${displayLanguage(r.language)}` : ""}`;

  const regs: StudentReg[] = student?.registrations || [];
  // Guard sama dengan activeRegs/pendingRegs di dashboard: buang yang dibatalkan/diarsip.
  const liveRegs = regs.filter((r) => r.pipeline_status !== "Batal" && !r.archived_at);
  const paidRegs = liveRegs.filter((r) => r.payment_status === "Lunas" || r.payment_status === "Cicilan");
  const cicilanRegs = paidRegs.filter((r) => r.payment_status === "Cicilan");
  const unpaidRegs = liveRegs.filter((r) => r.status === "Menunggu Pembayaran" && (r.payment_status === "Belum Bayar" || !r.payment_status));

  // Riwayat pembelian digital (e-book / e-learning) — pelengkap riwayat tagihan.
  const [digitalBuys, setDigitalBuys] = useState<any[]>([]);
  useEffect(() => {
    if (!user?.id) return;
    const uid = user.id;
    let batal = false;
    (async () => {
      // [perpustakaan-akses-email-v1] pembelian lama sering ber-auth_user_id NULL.
      const milikSaya = await orMilikSaya(supabase, uid);
      const base = supabase
        .from("digital_purchases")
        .select("id, amount, payment_status, created_at, digital_products(title, type)");
      const { data } = await (milikSaya ? base.or(milikSaya) : base.eq("auth_user_id", uid))
        .eq("payment_status", "Lunas")
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      if (!batal) setDigitalBuys(data || []);
    })();
    return () => { batal = true; };
  }, [user?.id, supabase]);

  // Gabung registrations + digital purchases jadi satu riwayat, terbaru duluan.
  const riwayat = useMemo(() => {
    const items: Array<{ key: string; label: string; sub: string; ts: number; amount: number; state: "lunas" | "cicilan" | "pending" }> = [];
    for (const r of regs) {
      if (r.pipeline_status === "Batal" || r.archived_at) continue;
      if (r.payment_status === "Lunas") {
        const d = r.payment_date || r.payment_verified_at || r.registration_date;
        items.push({ key: `reg-${r.id}`, label: progLabel(r), sub: `Lunas · ${fmtTgl(d)}`, ts: new Date(d || 0).getTime(), amount: r.total_amount || 0, state: "lunas" });
      } else if (r.payment_status === "Cicilan") {
        const d = r.payment_date || r.registration_date;
        items.push({ key: `reg-${r.id}`, label: `${progLabel(r)} (cicilan)`, sub: `Terbayar ${fmtRp(r.installment_paid || 0)} dari ${fmtRp(r.total_amount || 0)}`, ts: new Date(d || 0).getTime(), amount: r.installment_paid || 0, state: "cicilan" });
      } else if (r.status === "Menunggu Pembayaran") {
        const d = r.created_at || r.registration_date;
        items.push({ key: `reg-${r.id}`, label: progLabel(r), sub: `Menunggu pembayaran · ${fmtTgl(d)}`, ts: new Date(d || 0).getTime(), amount: r.total_amount || 0, state: "pending" });
      }
    }
    for (const p of digitalBuys) {
      const prod = p.digital_products;
      const jenis = prod?.type === "ebook" ? "E-Book" : "E-Learning";
      items.push({ key: `dig-${p.id}`, label: prod?.title || jenis, sub: `${jenis} · Lunas · ${fmtTgl(p.created_at)}`, ts: new Date(p.created_at || 0).getTime(), amount: p.amount || 0, state: "lunas" });
    }
    return items.sort((a, b) => b.ts - a.ts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student, digitalBuys]);

  // Bayar registrasi yang belum dibayar — buat invoice Xendit lalu redirect
  // (pola sama dengan onRegenerateXendit di PaymentDetailModal).
  const [payingId, setPayingId] = useState<string | null>(null);
  const bayarSekarang = async (r: StudentReg) => {
    setPayingId(r.id);
    try {
      const res = await fetch("https://jbtgciepdmqxxcjflrxz.supabase.co/functions/v1/xendit-create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          registration_id: r.id,
          amount: r.total_amount || 0,
          description: progLabel(r),
          payer_name: displayName,
          payer_email: user?.email || "",
          success_redirect_url: "https://linguo.id/akun/success",
          failure_redirect_url: "https://linguo.id/akun?xendit_failed=1",
        }),
      });
      const data = await res.json();
      if (data?.success && data?.invoice_url) { window.location.href = data.invoice_url; return; }
      alert("Gagal membuat invoice. Coba lagi atau hubungi admin ya.");
    } catch {
      alert("Gagal membuat invoice. Coba lagi atau hubungi admin ya.");
    } finally {
      setPayingId(null);
    }
  };

  const flash = (msg: string) => { setNotice(msg); setTimeout(() => setNotice(""), 3000); };

  const isGoogle = (() => {
    const am = user?.app_metadata || {};
    const provs = am.providers || (am.provider ? [am.provider] : []);
    return Array.isArray(provs) ? provs.includes("google") : false;
  })();
  const emailVerified = !!(user?.email_confirmed_at || user?.confirmed_at);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !student?.id) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = student.id + "/avatar." + ext;
      const { error } = await supabase.storage.from("student-avatars").upload(filePath, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("student-avatars").getPublicUrl(filePath);
      const url = data.publicUrl + "?t=" + Date.now();
      await supabase.from("students").update({ avatar_url: url }).eq("id", student.id);
      onAvatarUpdate(url);
    } catch (err) {
      console.error("Avatar upload failed:", err);
      alert("Upload gagal. Pastikan file JPG/PNG < 2MB.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!student?.id || !avatarUrl) return;
    try {
      await supabase.from("students").update({ avatar_url: null }).eq("id", student.id);
      onAvatarUpdate("");
      flash("Foto profil dihapus.");
    } catch { alert("Gagal menghapus foto."); }
  };

  const handleSaveProfil = async () => {
    if (!student?.id) return;
    setSaving(true);
    try {
      await supabase.from("students").update({ name: editName, whatsapp: editWa }).eq("id", student.id);
      flash("Profil berhasil disimpan.");
    } catch { alert("Gagal menyimpan."); }
    finally { setSaving(false); }
  };

  const handleUpdatePassword = async () => {
    if (newPass.length < 8) { alert("Kata sandi minimal 8 karakter."); return; }
    if (newPass !== confPass) { alert("Konfirmasi sandi tidak cocok."); return; }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      setNewPass(""); setConfPass("");
      flash("Kata sandi berhasil diperbarui.");
    } catch (e: any) { alert("Gagal memperbarui sandi: " + (e?.message || "")); }
  };

  const title = ts(SETTINGS_NAV.find((n) => n.id === pane)?.label || "Pengaturan");

  return (
    <div className="overflow-hidden rounded-[26px] bg-white lg:flex">
      {/* linguo-patch:akun-settings-design-v2 — frame Claude Design (sub-nav + panel) */}

      {/* LEFT: settings sub-nav */}
      <aside className="shrink-0 border-b border-slate-100 lg:flex lg:w-[260px] lg:flex-col lg:border-b-0 lg:border-r">
        <div className="px-6 pb-3 pt-6">
          <h2 className="text-[18px] font-extrabold text-[#12172B]">{ts("Pengaturan")}</h2>
          <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">{ts("Kelola akun & preferensimu")}</p>
        </div>
        <nav className="flex gap-1.5 overflow-x-auto px-4 pb-4 lg:flex-1 lg:flex-col lg:overflow-visible">
          {SETTINGS_NAV.map((n) => {
            const Icon = n.icon;
            const on = n.id === pane;
            return (
              <button key={n.id} onClick={() => setPane(n.id)}
                className={`flex shrink-0 items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${on ? "bg-white" : "hover:bg-[#F5F6F8]"}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition"
                  style={on ? { background: "#16796E", color: "#fff" } : { background: "#F5F6F8", color: "#6B7280" }}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-bold leading-tight" style={{ color: on ? "#16796E" : "#12172B" }}>{ts(n.label)}</span>
                  <span className="hidden truncate text-[12px] font-medium text-[#6B7280] lg:block">{ts(n.sub)}</span>
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* RIGHT: panel */}
      <main className="min-w-0 flex-1 bg-[#F5F6F8]">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-6 lg:px-8">
          <div>
            <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#6B7280]">
              {ts("Dashboard")} <ChevronRight className="h-3.5 w-3.5" /> <span className="text-[#16796E]">{ts("Pengaturan")}</span>
            </p>
            <h1 className="mt-1 text-[24px] font-extrabold leading-tight text-[#12172B]">{title}</h1>
          </div>
        </div>

        {notice && (
          <div className="mx-6 mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700 lg:mx-8">
            {notice}
          </div>
        )}

        <div className="space-y-5 p-6 pt-6 lg:p-8">
          {pane === "profil" && (
            <>
              <SetCard title={ts("Foto Profil")}>
                <div className="flex items-center gap-5">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="h-24 w-24 rounded-2xl object-cover shadow ring-4 ring-white" />
                    : <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-100 text-3xl font-extrabold text-[#16796E] ring-4 ring-white">{firstName[0]?.toUpperCase()}</div>}
                  <div className="flex flex-col gap-2.5">
                    <div className="flex gap-2.5">
                      <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
                        className="flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-bold text-[#16796E] transition hover:brightness-95 disabled:opacity-50"
                        style={{ background: "rgba(22,121,110,0.1)" }}>
                        {uploadingAvatar ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#16796E] border-t-transparent" /> : <Upload className="h-4 w-4" />}
                        {ts("Ganti foto")}
                      </button>
                      <button onClick={handleRemoveAvatar} className="h-10 rounded-xl px-4 text-[13px] font-bold text-[#6B7280] transition hover:text-rose-500">{ts("Hapus")}</button>
                    </div>
                    <span className="text-[12px] font-medium text-[#6B7280]">{ts("JPG atau PNG, maksimal 2MB.")}</span>
                  </div>
                </div>
              </SetCard>

              <SetCard title={ts("Informasi Pribadi")} footer={
                <>
                  <button onClick={() => { setEditName(student?.name || displayName); setEditWa(student?.whatsapp || ""); }} className="h-11 rounded-xl px-5 text-[14px] font-bold text-[#6B7280] transition hover:text-[#12172B]">{ts("Batal")}</button>
                  <button onClick={handleSaveProfil} disabled={saving} className="h-11 rounded-xl px-6 text-[14px] font-extrabold text-white transition hover:bg-[#0F5A52] disabled:opacity-50" style={{ background: "#16796E" }}>{saving ? ts("Menyimpan...") : ts("Simpan Perubahan")}</button>
                </>
              }>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[13px] font-bold text-[#12172B]">{ts("Nama Lengkap")}</label>
                    <SetFieldBox><input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-transparent text-[14px] font-medium outline-none placeholder:text-slate-400" /></SetFieldBox>
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-[#12172B]">{ts("Nomor WhatsApp")}</label>
                    <SetFieldBox><input value={editWa} onChange={(e) => setEditWa(e.target.value)} placeholder="628xxx" className="w-full bg-transparent text-[14px] font-medium outline-none placeholder:text-slate-400" /></SetFieldBox>
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-[#12172B]">{ts("Nama Panggilan")}</label>
                    <SetFieldBox><input value={nick} onChange={(e) => setNick(e.target.value)} placeholder={ts("Panggilan")} className="w-full bg-transparent text-[14px] font-medium outline-none placeholder:text-slate-400" /></SetFieldBox>
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-[#12172B]">{ts("Kota")}</label>
                    <SetFieldBox><input value={kota} onChange={(e) => setKota(e.target.value)} placeholder={ts("Kota")} className="w-full bg-transparent text-[14px] font-medium outline-none placeholder:text-slate-400" /></SetFieldBox>
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-[#12172B]">{ts("Zona Waktu")}</label>
                    <SetFieldBox><select value={tz} onChange={(e) => setTz(e.target.value)} className="w-full bg-transparent text-[14px] font-medium outline-none"><option>WIB (GMT+7)</option><option>WITA (GMT+8)</option><option>WIT (GMT+9)</option></select></SetFieldBox>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[13px] font-bold text-[#12172B]">{ts("Bio singkat")}</label>
                    <div className="mt-1.5 rounded-xl border border-slate-200 px-4 py-3 transition focus-within:border-slate-300">
                      <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder={ts("Ceritakan sedikit tentang dirimu & tujuan belajarmu...")} className="w-full resize-none bg-transparent text-[14px] font-medium outline-none placeholder:text-slate-400" />
                    </div>
                  </div>
                </div>
              </SetCard>
            </>
          )}

          {pane === "akun" && (
            <>
              <SetCard title={ts("Email & Login")}>
                <div className="flex items-center justify-between gap-4 py-2">
                  <div><p className="text-[14px] font-bold text-[#12172B]">{ts("Email")}</p><p className="mt-0.5 text-[13px] font-medium text-[#6B7280]">{user?.email || "-"}</p></div>
                  {emailVerified
                    ? <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-bold text-emerald-600"><BadgeCheck className="h-3.5 w-3.5" />{ts("Terverifikasi")}</span>
                    : <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[12px] font-bold text-amber-600">{ts("Belum verifikasi")}</span>}
                </div>
                {isGoogle && (
                  <div className="mt-1 flex items-center gap-3 border-t border-slate-100 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[15px] font-extrabold" style={{ color: "#4285F4" }}>G</span>
                    <div><p className="text-[14px] font-bold text-[#12172B]">Google</p><p className="text-[12px] font-medium text-[#6B7280]">{ts("Terhubung")}{user?.email ? " · " + user.email : ""}</p></div>
                  </div>
                )}
              </SetCard>

              <SetCard title={ts("Ubah Kata Sandi")} footer={
                <button onClick={handleUpdatePassword} className="h-11 rounded-xl px-6 text-[14px] font-extrabold text-white transition hover:bg-[#0F5A52]" style={{ background: "#16796E" }}>{ts("Perbarui Sandi")}</button>
              }>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-[13px] font-bold text-[#12172B]">{ts("Kata sandi baru")}</label>
                    <SetFieldBox><input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder={ts("Minimal 8 karakter")} className="w-full bg-transparent text-[14px] font-medium outline-none placeholder:text-slate-400" /></SetFieldBox>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[13px] font-bold text-[#12172B]">{ts("Konfirmasi sandi baru")}</label>
                    <SetFieldBox><input type="password" value={confPass} onChange={(e) => setConfPass(e.target.value)} placeholder={ts("Ulangi sandi baru")} className="w-full bg-transparent text-[14px] font-medium outline-none placeholder:text-slate-400" /></SetFieldBox>
                  </div>
                </div>
              </SetCard>

              <SetCard title={ts("Keamanan")}>
                <SetToggleRow label={ts("Verifikasi 2 langkah (2FA)")} desc={ts("Tambahkan lapisan keamanan ekstra saat login.")} on={pref.twofa} onClick={() => setPref((p) => ({ ...p, twofa: !p.twofa }))} />
                <div className="flex items-center justify-between gap-4 py-3.5">
                  <div><p className="text-[14px] font-bold text-[#12172B]">{ts("Perangkat aktif")}</p><p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">{ts("Sesi login kamu saat ini.")}</p></div>
                  <span className="text-[13px] font-bold text-[#16796E]">{ts("Aktif sekarang")}</span>
                </div>
              </SetCard>

              <SetCard>
                <div className="flex items-center justify-between gap-4">
                  <div><p className="text-[14px] font-extrabold text-rose-500">{ts("Hapus Akun")}</p><p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">{ts("Tindakan permanen. Hubungi admin untuk memproses penghapusan.")}</p></div>
                  <a href="https://wa.me/6282116859493?text=Halo%20admin%2C%20saya%20ingin%20menghapus%20akun%20Linguo%20saya." target="_blank" rel="noopener noreferrer" className="h-10 whitespace-nowrap rounded-xl border border-rose-200 px-4 text-[13px] font-bold leading-10 text-rose-500 transition hover:bg-rose-50">{ts("Hubungi Admin")}</a>
                </div>
              </SetCard>
            </>
          )}

          {pane === "notif" && (
            <>
              <SetCard title={ts("Email")}>
                <SetToggleRow label={ts("Pengingat jadwal sesi")} desc={ts("Email H-1 sebelum sesi live dimulai.")} on={notif.email_jadwal} onClick={() => setNotif((s) => ({ ...s, email_jadwal: !s.email_jadwal }))} />
                <SetToggleRow label={ts("Materi & rekaman baru")} desc={ts("Saat pengajar mengunggah materi atau rekaman.")} on={notif.email_materi} onClick={() => setNotif((s) => ({ ...s, email_materi: !s.email_materi }))} />
              </SetCard>
              <SetCard title={ts("WhatsApp")}>
                <SetToggleRow label={ts("Pengingat sesi via WA")} desc={ts("Notifikasi ke nomor WhatsApp kamu.")} on={notif.wa_pengingat} onClick={() => setNotif((s) => ({ ...s, wa_pengingat: !s.wa_pengingat }))} />
                <SetToggleRow label={ts("Promo & info kelas baru")} desc={ts("Penawaran paket dan bahasa baru.")} on={notif.wa_promo} onClick={() => setNotif((s) => ({ ...s, wa_promo: !s.wa_promo }))} />
              </SetCard>
              <SetCard title={ts("Push (Aplikasi)")} footer={
                <button onClick={() => flash("Preferensi notifikasi disimpan.")} className="h-11 rounded-xl px-6 text-[14px] font-extrabold text-white transition hover:bg-[#0F5A52]" style={{ background: "#16796E" }}>{ts("Simpan Perubahan")}</button>
              }>
                <SetToggleRow label={ts("Sesi akan dimulai")} desc={ts("Push 15 menit sebelum sesi.")} on={notif.push_sesi} onClick={() => setNotif((s) => ({ ...s, push_sesi: !s.push_sesi }))} />
                <SetToggleRow label={ts("Tips & tantangan harian")} desc={ts("Dorongan belajar setiap hari.")} on={notif.push_promo} onClick={() => setNotif((s) => ({ ...s, push_promo: !s.push_promo }))} />
              </SetCard>
            </>
          )}

          {pane === "preferensi" && (
            <>
              <SetCard title={ts("Bahasa Antarmuka")}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {/* [no-emoji-lucide-v1] bendera emoji diganti RectFlag — di Windows
                      emoji bendera tidak punya glif dan cuma tampil sebagai "ID"/"GB". */}
                  {([["id", "id", "Indonesia"], ["en", "gb", "English"]] as Array<[("id" | "en"), string, string]>).map(([code, flag, label]) => (
                    <button key={code} onClick={() => setUiLang(code)}
                      className="flex items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-left transition"
                      style={uiLang === code ? { borderColor: "#16796E", background: "rgba(22,121,110,0.06)" } : { borderColor: "#E2E8F0" }}>
                      <RectFlag code={flag} h={18} /><span className="text-[14px] font-bold text-[#12172B]">{label}</span>
                    </button>
                  ))}
                </div>
              </SetCard>
              <SetCard title={ts("Pengingat Belajar")}>
                <SetToggleRow label={ts("Pengingat harian")} desc={ts("Ingatkan aku untuk belajar setiap hari.")} on={pref.reminder} onClick={() => setPref((p) => ({ ...p, reminder: !p.reminder }))} />
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3.5">
                  <div><p className="text-[14px] font-bold text-[#12172B]">{ts("Waktu pengingat sesi")}</p><p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">{ts("Seberapa awal sebelum sesi live.")}</p></div>
                  <div className="flex h-11 items-center rounded-xl border border-slate-200 px-3"><select className="bg-transparent text-[14px] font-semibold text-[#12172B] outline-none"><option>{ts("15 menit")}</option><option>{ts("1 jam")}</option><option>{ts("3 jam")}</option><option>{ts("1 hari")}</option></select></div>
                </div>
                <SetToggleRow label={ts("Laporan mingguan")} desc={ts("Ringkasan progres belajar tiap Minggu.")} on={pref.weekly_report} onClick={() => setPref((p) => ({ ...p, weekly_report: !p.weekly_report }))} />
              </SetCard>
              <SetCard title={ts("Pemutaran Rekaman")} footer={
                <button onClick={() => flash("Preferensi disimpan.")} className="h-11 rounded-xl px-6 text-[14px] font-extrabold text-white transition hover:bg-[#0F5A52]" style={{ background: "#16796E" }}>{ts("Simpan Perubahan")}</button>
              }>
                <SetToggleRow label={ts("Putar otomatis")} desc={ts("Lanjut ke rekaman berikutnya secara otomatis.")} on={pref.autoplay} onClick={() => setPref((p) => ({ ...p, autoplay: !p.autoplay }))} />
                <SetToggleRow label={ts("Tampilkan subtitle")} desc={ts("Aktifkan subtitle bawaan saat memutar rekaman.")} on={pref.subtitle} onClick={() => setPref((p) => ({ ...p, subtitle: !p.subtitle }))} />
              </SetCard>
            </>
          )}

          {pane === "tagihan" && (
            <>
              {/* [linguo-patch:akun-tagihan-real-v1] Seluruh data di bawah REAL dari registrations + digital_purchases. */}
              <SetCard>
                {paidRegs.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {paidRegs.map((r) => (
                      <div key={r.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5 text-white" style={{ background: "#16796E" }}>
                        <div>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold">{r.payment_status === "Cicilan" ? ts("Paket Aktif · Cicilan") : ts("Paket Aktif")}</span>
                          <p className="mt-2 text-[20px] font-extrabold">{progLabel(r)}</p>
                          <p className="mt-0.5 text-[13px] font-medium text-white/80">
                            {r.level ? `${ts("Level")} ${r.level} · ` : ""}{r.sessions_used || 0}/{r.sessions_total || 0} {ts("sesi terpakai")}{r.duration ? ` · ${r.duration} ${ts("menit/sesi")}` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[24px] font-extrabold leading-none">{fmtRp(r.total_amount || 0)}</p>
                          <p className="mt-1.5 text-[12px] font-medium text-white/80">{ts("Terdaftar")} {fmtTgl(r.registration_date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-center">
                    <p className="text-[14px] font-bold text-[#12172B]">{ts("Belum ada paket aktif")}</p>
                    <p className="mt-1 text-[12px] font-medium text-[#6B7280]">{ts("Daftar kelas dulu yuk — paket yang sudah dibayar bakal muncul di sini.")}</p>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button onClick={openEnrollWizard} className="h-11 rounded-xl px-5 text-[14px] font-extrabold text-white transition hover:bg-[#0F5A52]" style={{ background: "#16796E" }}>{paidRegs.length > 0 ? ts("Tambah Kelas Baru") : ts("Daftar Kelas")}</button>
                  <a href={`https://wa.me/6282116859493?text=${encodeURIComponent(`Halo admin Linguo, saya ${displayName}. Saya mau tanya soal paket/tagihan saya.`)}`} target="_blank" rel="noopener noreferrer"
                    className="flex h-11 items-center rounded-xl px-5 text-[14px] font-bold text-[#12172B] transition hover:bg-slate-50">{ts("Hubungi Admin")}</a>
                </div>
              </SetCard>

              {unpaidRegs.length > 0 && (
                <SetCard title={ts("Menunggu Pembayaran")}>
                  {unpaidRegs.map((r) => (
                    <div key={r.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 py-3.5 last:border-0">
                      <div>
                        <p className="text-[14px] font-bold text-[#12172B]">{progLabel(r)}</p>
                        <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">{fmtRp(r.total_amount || 0)} · {ts("didaftarkan")} {fmtTgl(r.created_at || r.registration_date)} · {ts("selesaikan dalam 24 jam")}</p>
                      </div>
                      <button onClick={() => bayarSekarang(r)} disabled={payingId === r.id}
                        className="h-11 rounded-xl px-5 text-[14px] font-extrabold text-[#12172B] transition hover:brightness-95 disabled:opacity-50" style={{ background: "#F2CB05" }}>
                        {payingId === r.id ? ts("Membuat invoice…") : ts("Bayar Sekarang")}
                      </button>
                    </div>
                  ))}
                </SetCard>
              )}

              {cicilanRegs.length > 0 && (
                <SetCard title={ts("Cicilan Berjalan")}>
                  {cicilanRegs.map((r) => {
                    const total = r.total_amount || 0;
                    const paid = r.installment_paid || 0;
                    const sisa = Math.max(0, total - paid);
                    const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
                    return (
                      <div key={r.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 py-3.5 last:border-0">
                        <div>
                          <p className="text-[14px] font-bold text-[#12172B]">{progLabel(r)}</p>
                          <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">
                            {ts("Terbayar")} {fmtRp(paid)} {ts("dari")} {fmtRp(total)} · {ts("sisa")} {fmtRp(sisa)}{r.payment_due_date ? ` · ${ts("jatuh tempo")} ${fmtTgl(r.payment_due_date)}` : ""}
                          </p>
                          <div className="mt-2 h-2 w-48 overflow-hidden rounded-full" style={{ background: "#E8EAEE" }}><div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#16796E" }} /></div>
                        </div>
                        <a href={`https://wa.me/6282116859493?text=${encodeURIComponent(`Halo admin Linguo, saya ${displayName}. Saya mau melanjutkan pembayaran cicilan ${progLabel(r)} (sisa ${fmtRp(sisa)}).`)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex h-11 items-center rounded-xl px-5 text-[14px] font-extrabold text-[#12172B] transition hover:brightness-95" style={{ background: "#F2CB05" }}>{ts("Bayar Sekarang")}</a>
                      </div>
                    );
                  })}
                </SetCard>
              )}

              <SetCard title={ts("Metode Pembayaran")}>
                <div className="flex items-center gap-3 py-2">
                  <span className="flex h-9 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-50" style={{ background: "#F5F6F8" }}><CreditCard className="h-5 w-5 text-[#16796E]" /></span>
                  <div>
                    <p className="text-[14px] font-bold text-[#12172B]">{ts("Pembayaran online via Xendit")}</p>
                    <p className="text-[12px] font-medium text-[#6B7280]">{ts("QRIS, transfer bank (VA), e-wallet, & kartu. Linguo tidak menyimpan data kartumu.")}</p>
                  </div>
                </div>
              </SetCard>

              <SetCard title={ts("Riwayat Tagihan")}>
                {riwayat.length === 0 ? (
                  <p className="py-4 text-center text-[13px] font-medium text-[#6B7280]">{ts("Belum ada transaksi. Riwayat pembayaran kelas & produk digital kamu bakal muncul di sini.")}</p>
                ) : (
                  <div className="flex flex-col">
                    {riwayat.map((it) => (
                      <div key={it.key} className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-0">
                        <div className="flex items-center gap-3">
                          {it.state === "pending"
                            ? <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500"><Clock className="h-4 w-4" /></span>
                            : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Check className="h-4 w-4" /></span>}
                          <div><p className="text-[14px] font-bold text-[#12172B]">{it.label}</p><p className="text-[12px] font-medium text-[#6B7280]">{it.sub}</p></div>
                        </div>
                        <span className="text-[14px] font-extrabold text-[#12172B]">{fmtRp(it.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </SetCard>
            </>
          )}
        </div>

        {/* mobile signout — [shell-tablet-rail-v1] mulai md tombol Keluar sudah di rail */}
        <div className="px-6 pb-6 md:hidden">
          <button onClick={signOut} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 py-3 text-[14px] font-bold text-rose-500 transition hover:bg-rose-50">
            <LogOut className="h-4 w-4" /> {ts("Keluar dari Akun")}
          </button>
        </div>
      </main>

      <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ENROLLMENT WIZARD — Top-level component (prevents flash on state change)
// ═══════════════════════════════════════════════════════════════════

// [enroll-jumlah-sesi-v1] Satu sub-level (A1.1, A1.2, …) = 16 sesi. Ini paket
// standar Kelas Private & Kids, jadi jadi nilai awal. Pilihan cepat di bawahnya
// menutup kasus lain: 1 sesi trial, 8 sesi setengah sub-level, 32 sesi dua level.
const DEFAULT_SESSIONS = 16;
const MAX_SESSIONS = 96;
const SESSION_PRESETS = [
  { val: 1, label: "1", note: "Trial" },
  { val: 8, label: "8", note: "½ level" },
  { val: 16, label: "16", note: "1 sub-level" },
  { val: 32, label: "32", note: "2 sub-level" },
];
function EnrollWizard({ showEnroll, setShowEnroll, enrollStep, setEnrollStep, enrollProgram, setEnrollProgram, enrollLang, setEnrollLang, langSearch, setLangSearch, enrollDuration, setEnrollDuration, enrollSchedule, setEnrollSchedule, student, displayName, user, supabase, setStudent, openEnrollWizard }: {
  showEnroll: boolean; setShowEnroll: (v: boolean) => void;
  enrollStep: number; setEnrollStep: (fn: any) => void;
  enrollProgram: string; setEnrollProgram: (v: string) => void;
  enrollLang: string; setEnrollLang: (v: string) => void;
  langSearch: string; setLangSearch: (v: string) => void;
  enrollDuration: string; setEnrollDuration: (v: string) => void;
  enrollSchedule: Record<string,string[]>; setEnrollSchedule: (fn: any) => void;
  student: any; displayName: string; user: any; supabase: any;
  setStudent: (fn: any) => void; openEnrollWizard: () => void;
}) {
  // Available batches for Reguler (fetched when language selected)
  const [availBatches, setAvailBatches] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  // [linguo-patch:reguler-terms-v1] persetujuan ketentuan Kelas Reguler (gate tombol bayar)
  const [agreeReguler, setAgreeReguler] = useState(false);
  // [enroll-exit-confirm-v1] konfirmasi sebelum keluar (click backdrop / tombol ✕)
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  // [enroll-jumlah-sesi-v1] Jumlah sesi yang dibeli. Default 16 = satu sub-level
  // (A1.1, A1.2, …) untuk Kelas Private & Kids — itu paket standarnya. Siswa
  // tetap bisa menurunkannya, misal 1 sesi buat trial. Dulu nilainya dipatok
  // 8 di kode ("Estimasi/bulan") dan `sessions_total` selalu masuk 0 ke DB.
  const [enrollSessions, setEnrollSessions] = useState(DEFAULT_SESSIONS);

  // Fetch open batches when Reguler program + language selected
  useEffect(() => {
    if (enrollProgram !== "Kelas Reguler" || !enrollLang || !showEnroll) {
      setAvailBatches([]);
      return;
    }
    setLoadingBatches(true);
    // [reguler-english-conversation-v1] dulu query ke tabel `regular_class_batches`
    // (TIDAK ADA di DB) + status "open" huruf kecil → hasilnya selalu kosong, jadi
    // step ini selalu bilang "belum ada batch". Sumber yg benar: `regular_batches`,
    // status "Open", dan bahasa reguler English tersimpan "English - Conversation".
    const langAliases: Record<string, string[]> = {
      "English": ["English - Conversation", "English", "Inggris"],
      "Japanese": ["Japanese", "Jepang"],
      "Korean": ["Korean", "Korea"],
      "Mandarin": ["Mandarin", "Chinese"],
      "French": ["French", "Prancis", "Perancis"],
      "Spanish": ["Spanish", "Spanyol"],
      "German": ["German", "Jerman"],
      "Arabic": ["Arabic", "Arab"],
    };
    const searchLangs = langAliases[enrollLang] || [enrollLang];
    supabase
      .from("regular_batches")
      .select("id, batch_code, language, session_day, session_start_time, start_date, end_date, total_sessions, current_enrolled, max_capacity, status")
      .in("language", searchLangs)
      .eq("status", "Open")
      .order("start_date", { ascending: true })
      .then(({ data }: any) => {
        setAvailBatches(data || []);
        setLoadingBatches(false);
      });
  }, [enrollProgram, enrollLang, showEnroll, supabase]);
  // [linguo-patch:reguler-terms-v1] reset checkbox tiap ganti pilihan / buka-tutup modal
  useEffect(() => { setAgreeReguler(false); }, [enrollProgram, enrollLang, showEnroll]);
  // [enroll-exit-confirm-v1] reset dialog konfirmasi tiap buka-tutup modal
  useEffect(() => { setShowExitConfirm(false); }, [showEnroll]);
  // [enroll-jumlah-sesi-v1] balik ke paket standar tiap ganti program / buka modal
  useEffect(() => { setEnrollSessions(DEFAULT_SESSIONS); }, [enrollProgram, showEnroll]);

  if (!showEnroll) return null;

  const isTestPrep = enrollProgram === "English Test Preparation";
  const enrollDays = Object.keys(enrollSchedule);

  const DAYS = ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"];
  const TIMES = ["07:00","08:00","09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"];

  const DURATION_OPTIONS = enrollProgram === "Kelas Private"
    ? [{ val:"30", label:"30 menit", note:"Trial / perkenalan" }, { val:"45", label:"45 menit", note:"Standar anak" }, { val:"60", label:"60 menit", note:"Standar" }, { val:"75", label:"75 menit", note:"Extended" }, { val:"90", label:"90 menit", note:"Intensif" }]
    : enrollProgram === "Kelas Kids"
    ? [{ val:"30", label:"30 menit", note:"Little Learner (5–8 thn)" }, { val:"45", label:"45 menit", note:"Young Explorer (9–12 thn)" }]
    : [{ val:"90", label:"90 menit", note:"Standar kelas grup" }];

  // ── akun-private-price-v1: harga Kelas Private by kategori bahasa ──────────
  // Mirror src/app/harga/page.tsx PRICE_TABLE (source of truth). Wizard /akun
  // ga nangkep level, jadi harga Private default ke tier A1 (idx 0) — konsisten
  // sama framing "Mulai Rp..." di homepage.
  const PRIVATE_PRICE_TABLE: Record<string, number[]> = {
    A: [120000, 130000, 140000, 150000],
    B: [110000, 120000, 130000, 140000],
    C: [100000, 110000, 120000, 130000],
    D: [90000, 95000, 100000, 110000],
    E: [150000, 160000, 170000, 180000],
  };
  const PRIVATE_LANG_CAT: Record<string, "A" | "B" | "C" | "D" | "E"> = {
    Swahili: "A", Greek: "A", Hindi: "A", Turkish: "A", Norwegian: "A", Tagalog: "A",
    Vietnamese: "A", Swedish: "A", Urdu: "A", Kurdish: "A", Hebrew: "A", Polish: "A",
    Portuguese: "A", Finnish: "A", Czech: "A", "Traditional Chinese": "A", Hungarian: "A",
    Esperanto: "A", Farsi: "A", "English British": "A", Romanian: "A", Khmer: "A",
    Danish: "A", Uzbek: "A", Serbian: "A", Estonian: "A", Latin: "A",
    "Ancient Egyptian": "A", Georgian: "A", Irish: "A", Malay: "A",
    Russian: "B", Dutch: "B", Italian: "B", Spanish: "B", Thai: "B", "Sign Language": "B",
    Arabic: "C", English: "C", Japanese: "C", German: "C", Korean: "C", Mandarin: "C", French: "C",
    Javanese: "D", Sundanese: "D", Madurese: "D", Batak: "D", Banjar: "D",
    // Melayu = bahasa asing (Malaysia/Brunei/Singapura), bukan bahasa daerah → kategori A.
    Balinese: "D", Bugis: "D",
    BIPA: "E",
  };
  // Resolve nama bahasa ke kategori harga. Ga ketemu → "C" (median).
  const privateCatOf = (lang: string): "A" | "B" | "C" | "D" | "E" => {
    if (!lang) return "C";
    if (PRIVATE_LANG_CAT[lang]) return PRIVATE_LANG_CAT[lang];
    const hit = Object.keys(PRIVATE_LANG_CAT).find(
      (k) =>
        lang.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(lang.toLowerCase())
    );
    return hit ? PRIVATE_LANG_CAT[hit] : "C";
  };
  // Harga per sesi Kelas Private = base(60mnt, A1) × (durasi / 60).
  const privatePerSession = (lang: string, durationMin: string | number): number => {
    const base60 = PRIVATE_PRICE_TABLE[privateCatOf(lang)][0];
    const dur = parseInt(String(durationMin), 10) || 60;
    return Math.round((base60 * dur) / 60);
  };

  const pricePerSession: Record<string,Record<string,number>> = {
    "Kelas Private": { "30":45000, "45":65000, "60":85000, "75":105000, "90":125000 },
    "Kelas Reguler": { "90":18750 },
    "Kelas Kids": { "30":75000, "45":85000 },
    "English Test Preparation": { "90":18750 },
  };

  // Reguler & Test Prep: flat price per 2 bulan, bukan per sesi
  const isFixedPrice = enrollProgram === "Kelas Reguler" || enrollProgram === "English Test Preparation";
  const flatPrice: Record<string, number> = {
    "Kelas Reguler": 150000,
    "English Test Preparation": 300000,
  };

  const price = enrollProgram === "Kelas Private" /* akun-private-price-v1 */
    ? privatePerSession(enrollLang, enrollDuration)
    : (pricePerSession[enrollProgram]?.[enrollDuration] || 0);

  // Unpaid amount from existing regs
  const unpaidTotal = student?.registrations
    .filter((r: any) => r.status === "Menunggu Pembayaran" || r.payment_status === "Belum Bayar")
    .reduce((s: number, r: any) => s + (r.total_amount || 0), 0) || 0;

  // Use LANGS_BY_PROGRAM for enrollment (not all languages)
  const enrollAvailLangs = (LANGS_BY_PROGRAM[enrollProgram] || POPULAR_LANGUAGES).filter(l => l.toLowerCase().includes(langSearch.toLowerCase()));
  const isRegulerEnroll = enrollProgram === "Kelas Reguler";
  // Reguler & Test Prep skip jadwal step (jadwal fix per batch)
  const TOTAL_STEPS = isTestPrep ? 4 : isRegulerEnroll ? 4 : 5;

  const waMsg = encodeURIComponent(
    `Halo admin Linguo! Saya ${displayName} (${user?.email}), mau daftar:\n` +
    `• Program: ${PROGRAMS.find(p => p.key === enrollProgram)?.label}\n` +
    (isTestPrep ? "" : `• Bahasa: ${isRegulerEnroll ? regulerLangName(enrollLang) : enrollLang}\n`) +
    `• Durasi: ${enrollDuration} menit/sesi\n` +
    (isFixedPrice ? "" : `• Jumlah sesi: ${enrollSessions} sesi\n`) +
    `• Preferensi hari: ${Object.keys(enrollSchedule).join(", ") || "-"}\n` +
    `• Preferensi jam: ${Object.entries(enrollSchedule).map(([d,ts]) => d + ": " + ts.join(", ")).join(" | ") || "-"}\n` +
    `Mohon info jadwal dan pembayarannya. Terima kasih!`
  );

  // [enrollment-server-flow-v1] insert student+registration dipindah ke /api/enroll
  // (service role → bypass RLS yang sebelumnya nolak insert authenticated client).
  const buildEnrollPayload = (withInvoice: boolean) => ({
    email: user?.email || "",
    name: displayName,
    wa_number: student?.whatsapp || null,
    avatar_url: user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null,
    product: enrollProgram,
    // [reguler-english-conversation-v1] pendaftaran reguler disimpan dgn nama kelas
    // resmi ("English - Conversation"), samain dgn regular_batches.language.
    language: isTestPrep ? "IELTS/TOEFL" : (isRegulerEnroll ? regulerLangName(enrollLang) : enrollLang),
    level: "A1.1",
    duration: enrollDuration,
    amount: isFixedPrice ? (flatPrice[enrollProgram] || 0) : price * enrollSessions,
    // [enroll-jumlah-sesi-v1] dulu `sessions_total` di /api/enroll dipatok 0 —
    // kelas baru selalu lahir tanpa kuota sesi & harus ditambal manual admin.
    sessions: isFixedPrice ? 0 : enrollSessions,
    ref_code: getRefCodeFromCookie(), // [linguo-patch:akun-affiliate-capture-v1]
    with_invoice: withInvoice,
  });

  const handleConfirm = async () => {
    try {
      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildEnrollPayload(false)),
      });
      const data = await res.json();
      if (!res.ok || !data?.registration?.id) {
        console.error("Enroll failed:", data);
        alert("Maaf, gagal menyimpan pendaftaran. Silakan hubungi admin via WhatsApp untuk bantuan.");
        setShowEnroll(false);
        setEnrollStep(0);
        return;
      }
      const newReg = data.registration;

      // Kalau student state-nya mock/belum ada, reload biar fetch fresh
      if (!student || student.id === "pending" || !student.id) {
        try { localStorage.removeItem(`linguo_wizard_${user?.id || user?.email}`); } catch {}
        window.location.reload();
        return;
      }

      setStudent((s: any) => (s ? { ...s, registrations: [...s.registrations, newReg] } : s));
      setShowEnroll(false);
      setEnrollStep(0);
      return newReg;
    } catch (e) {
      console.error("Enroll threw:", e);
      alert("Terjadi kesalahan koneksi. Silakan coba lagi atau hubungi admin via WA.");
      return;
    }
  };

  // [enroll-async-invoice-v1] "Bayar Otomatis (Xendit)" — TIDAK lagi nunggu invoice
  // Xendit (yang lambat ±1-3 dtk) sebelum redirect. /api/enroll balikin sukses
  // seketika setelah INSERT registrations; invoice dibuat di background & url-nya
  // di-PATCH ke baris reg async. Di sini cukup tampilin kartu pending di Kelas Live
  // & tutup modal — user lanjut bayar lewat tombol "Lanjutkan Pembayaran" di kartu.
  const handleXenditCheckout = async () => {
    try {
      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildEnrollPayload(true)),
      });
      const data = await res.json();
      if (!res.ok || !data?.registration?.id) {
        console.error("Enroll/Xendit error:", data);
        alert(data?.error ? `Gagal: ${data.error}` : "Gagal menyimpan pendaftaran. Silakan coba lagi atau hubungi admin via WA.");
        return;
      }
      const newReg = data.registration;

      // Student state mock/belum ada → reload biar fetch fresh.
      if (!student || student.id === "pending" || !student.id) {
        try { localStorage.removeItem(`linguo_wizard_${user?.id || user?.email}`); } catch {}
        window.location.reload();
        return;
      }

      // Tampilin kartu pending di Kelas Live seketika (invoice_url menyusul async).
      setStudent((s: any) => (s ? { ...s, registrations: [...s.registrations, newReg] } : s));
      setShowEnroll(false);
      setEnrollStep(0);
    } catch (e) {
      console.error("Xendit checkout error:", e);
      alert("Terjadi kesalahan koneksi. Silakan coba lagi atau hubungi admin via WA.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={() => setShowExitConfirm(true)}>
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Daftar Kelas Baru</h2>
            <p className="text-xs text-gray-400">Step {enrollStep + 1} dari {TOTAL_STEPS}</p>
          </div>
          <button onClick={() => setShowExitConfirm(true)} aria-label="Tutup" className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1 px-5 pt-3 shrink-0">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= enrollStep ? "bg-teal-500" : "bg-gray-100"}`} />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <AnimatePresence mode="wait">

            {/* Step 0: Program */}
            {enrollStep === 0 && (
              <motion.div key="s0" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }} className="space-y-3">
                <p className="text-sm font-semibold text-gray-700 mb-3">Pilih jenis kelas:</p>
                {PROGRAMS.map(p => (
                  <button key={p.key} onClick={() => { setEnrollProgram(p.key); setEnrollStep(1); }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98] ${enrollProgram === p.key ? "bg-gray-100" : "bg-gray-50 hover:bg-gray-100"}`}>
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${p.tint}`}>
                      <p.icon className="h-[22px] w-[22px]" strokeWidth={2} />
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{p.label}</p>
                      <p className="text-xs text-gray-400">{p.desc}</p>
                      <p className="text-xs font-semibold text-teal-600 mt-0.5">{p.price}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                  </button>
                ))}
              </motion.div>
            )}

            {/* Step 1: Bahasa (skip for test prep) */}
            {enrollStep === 1 && !isTestPrep && (
              <motion.div key="s1" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }} className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Pilih bahasa:</p>
                <input type="text" placeholder="Cari bahasa..." value={langSearch} onChange={e => setLangSearch(e.target.value)} autoFocus
                  onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}
                  className="w-full h-10 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:border-gray-300" />
                {/* [linguo-patch:enroll-lang-rows-v1] pilih bahasa jadi daftar baris (bukan grid 3 kolom) + outline netral */}
                <div className="space-y-2">
                  {enrollAvailLangs.map(lang => (
                    <button key={lang} onClick={() => { setEnrollLang(lang); setEnrollStep(2); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all active:scale-[0.99] ${enrollLang === lang ? "bg-gray-100" : "bg-gray-50 hover:bg-gray-100"}`}>
                      <img src={getFlagUrl(lang)} alt="" className="h-6 w-6 shrink-0 object-contain rounded-sm" />
                      {/* [reguler-english-conversation-v1] di Kelas Reguler, English cuma dibuka
                          sebagai kelas Conversation — tampilkan nama kelas yang sebenarnya. */}
                      <span className="flex-1 truncate text-sm font-medium text-gray-700">{isRegulerEnroll ? regulerLangName(lang) : lang}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 1 test prep: langsung ke durasi */}
            {enrollStep === 1 && isTestPrep && (
              <motion.div key="s1tp" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }}>
                {(() => { setTimeout(() => setEnrollStep(2), 0); return null; })()}
              </motion.div>
            )}

            {/* Step 2: Durasi */}
            {enrollStep === 2 && !isRegulerEnroll && (
              <motion.div key="s2" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }} className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Pilih durasi per sesi:</p>
                {DURATION_OPTIONS.map(d => (
                  <button key={d.val} onClick={() => { setEnrollDuration(d.val); setEnrollStep(3); }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all ${enrollDuration === d.val ? "bg-gray-100" : "bg-gray-50 hover:bg-gray-100"}`}>
                    <div>
                      <p className="font-semibold text-gray-900">{d.label}</p>
                      <p className="text-xs text-gray-400">{d.note}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-teal-600 text-sm">Rp{(enrollProgram === "Kelas Private" ? privatePerSession(enrollLang, d.val) : (pricePerSession[enrollProgram]?.[d.val] || 0)).toLocaleString("id-ID")}{/* akun-private-price-v1 */}</p>
                      <p className="text-[10px] text-gray-400">/sesi</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}

            {/* Step 2 Reguler: auto-skip to summary (jadwal fix per batch) */}
            {enrollStep === 2 && isRegulerEnroll && (
              <motion.div key="s2r" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }}>
                {(() => { setTimeout(() => { setEnrollDuration("90"); setEnrollStep(3); }, 0); return null; })()}
              </motion.div>
            )}

            {/* Step 3: Preferensi Jadwal (only for Private & Kids) */}
            {enrollStep === 3 && !isRegulerEnroll && !isTestPrep && (
              <motion.div key="s3" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }} className="space-y-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Pilih hari & jam per sesi:</p>
                {/* Per-day schedule builder */}
                <div className="space-y-2">
                  {DAYS.map(d => {
                    const selected = d in enrollSchedule;
                    const dayTimes = enrollSchedule[d] || [];
                    return (
                      <div key={d} className={`rounded-xl transition-all ${selected ? "bg-gray-100" : "bg-gray-50"}`}>
                        <button className="w-full flex items-center justify-between px-4 py-2.5"
                          onClick={() => {
                            if (selected) {
                              setEnrollSchedule((prev: Record<string,string[]>) => { const n = {...prev}; delete n[d]; return n; });
                            } else {
                              setEnrollSchedule((prev: Record<string,string[]>) => ({ ...prev, [d]: [] }));
                            }
                          }}>
                          <span className={`text-sm font-semibold ${selected ? "text-teal-700" : "text-gray-600"}`}>{d}</span>
                          {selected
                            ? <span className="text-teal-500 text-xs">{dayTimes.length > 0 ? dayTimes.join(", ") : "pilih jam ↓"}</span>
                            : <span className="text-gray-300 text-xs">+ Tambah</span>}
                        </button>
                        {selected && (
                          <div className="px-4 pb-3 grid grid-cols-4 gap-1.5">
                            {TIMES.map(t => {
                              const active = dayTimes.includes(t);
                              return (
                                <button key={t} onClick={() => {
                                  setEnrollSchedule((prev: Record<string,string[]>) => ({
                                    ...prev,
                                    [d]: active ? dayTimes.filter(x => x !== t) : [...dayTimes, t]
                                  }));
                                }}
                                  className={`py-1.5 rounded-lg text-xs font-medium transition-all ${active ? "bg-teal-500 text-white" : "bg-white text-gray-600 hover:bg-gray-200"}`}>
                                  {t}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
                  <Lightbulb className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  <span>Admin akan mencocokkan preferensimu dengan jadwal pengajar yang tersedia. Jadwal final dikonfirmasi via WhatsApp.</span>
                </p>
                <button onClick={() => setEnrollStep(4)} disabled={Object.keys(enrollSchedule).length === 0}
                  className="w-full h-11 rounded-xl bg-teal-600 text-white font-semibold text-sm disabled:opacity-40 hover:bg-teal-700 transition-colors">
                  Lanjut ke Ringkasan →
                </button>
              </motion.div>
            )}

            {/* Step 3 for Reguler/TestPrep, Step 4 for Private/Kids: Summary + Konfirmasi */}
            {((enrollStep === 4 && !isRegulerEnroll) || (enrollStep === 3 && (isRegulerEnroll || isTestPrep))) && (
              <motion.div key="s4" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }} className="space-y-4">
                <p className="text-sm font-semibold text-gray-700">Ringkasan pendaftaran:</p>

                {/* Kelas baru */}
                <div className="rounded-2xl bg-teal-50/50 p-4 space-y-2">
                  <div className="flex items-center gap-3 mb-2">
                    {!isTestPrep && <img src={getFlagUrl(enrollLang)} alt="" className="h-8 w-8 object-contain rounded" />}
                    <div>
                      <p className="font-bold text-gray-900">{isTestPrep ? "IELTS/TOEFL Prep" : (isRegulerEnroll ? regulerLangName(enrollLang) : enrollLang)}</p>
                      <p className="text-xs text-gray-500">{PROGRAMS.find(p => p.key === enrollProgram)?.label}{!isFixedPrice ? ` · ${enrollDuration} mnt/sesi` : ""}</p>
                    </div>
                  </div>
                  {isFixedPrice ? (
                    <>
                      {[
                        ["Durasi", "2 bulan"],
                        ["Total Harga", `Rp${(flatPrice[enrollProgram] || 0).toLocaleString("id-ID")}`],
                        ...(isRegulerEnroll ? [["Jadwal", "Ditentukan per batch (dikonfirmasi admin)"]] : []),
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between text-sm">
                          <span className="text-gray-500">{k}</span>
                          <span className="font-semibold text-gray-800">{v}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      {[
                        ["Jadwal", Object.entries(enrollSchedule).map(([d,ts]) => d + ": " + (ts.join(", ") || "-")).join(" | ") || "Belum dipilih"],
                        ["Harga/sesi", `Rp${price.toLocaleString("id-ID")}`],
                        ["Jumlah sesi", `${enrollSessions} sesi`],
                        ["Total", `Rp${(price * enrollSessions).toLocaleString("id-ID")}`],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between text-sm">
                          <span className="text-gray-500">{k}</span>
                          <span className="font-semibold text-gray-800">{v}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* [enroll-jumlah-sesi-v1] Pemilih jumlah sesi — hanya untuk program
                    yang ditagih per sesi (Private & Kids). Reguler/Test Prep harganya
                    flat per periode, jadi tidak punya kuota sesi yang bisa dipilih. */}
                {!isFixedPrice && (
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Jumlah sesi</p>
                        <p className="text-xs text-gray-400">1 sub-level = 16 sesi</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label="Kurangi sesi"
                          onClick={() => setEnrollSessions((n: number) => Math.max(1, n - 1))}
                          disabled={enrollSessions <= 1}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:pointer-events-none"
                        >
                          <Minus className="h-4 w-4" strokeWidth={2.5} />
                        </button>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={MAX_SESSIONS}
                          value={enrollSessions}
                          onChange={(e) => {
                            // Kosong dibiarkan lewat sebagai 1 supaya harga tak pernah NaN.
                            const n = parseInt(e.target.value, 10);
                            setEnrollSessions(Number.isNaN(n) ? 1 : Math.min(MAX_SESSIONS, Math.max(1, n)));
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-9 w-14 rounded-xl border border-gray-200 bg-transparent text-center text-sm font-bold text-gray-900 focus:outline-none focus:border-teal-500"
                        />
                        <button
                          type="button"
                          aria-label="Tambah sesi"
                          onClick={() => setEnrollSessions((n: number) => Math.min(MAX_SESSIONS, n + 1))}
                          disabled={enrollSessions >= MAX_SESSIONS}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:pointer-events-none"
                        >
                          <Plus className="h-4 w-4" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-1.5">
                      {SESSION_PRESETS.map((o) => (
                        <button
                          key={o.val}
                          type="button"
                          onClick={() => setEnrollSessions(o.val)}
                          className={`rounded-xl py-1.5 text-center transition-colors ${enrollSessions === o.val ? "bg-teal-600 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
                        >
                          <span className="block text-sm font-bold leading-none">{o.label}</span>
                          <span className={`block text-[10px] leading-tight ${enrollSessions === o.val ? "text-white/80" : "text-gray-400"}`}>{o.note}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Info batch for Reguler — show available batches from DB */}
                {isRegulerEnroll && (
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                    {loadingBatches ? (
                      <p className="flex items-center gap-2 text-xs text-blue-600">
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" strokeWidth={2} />
                        Memuat batch yang tersedia...
                      </p>
                    ) : availBatches.length > 0 ? (
                      <>
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 mb-2">
                          <Calendar className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                          Batch {regulerLangName(enrollLang)} yang tersedia:
                        </p>
                        <div className="space-y-1.5">
                          {availBatches.slice(0, 3).map((b: any) => {
                            const seatsLeft = (b.max_capacity || 15) - (b.current_enrolled || 0);
                            const startDate = b.start_date ? new Date(b.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "-";
                            return (
                              <div key={b.id} className="bg-white rounded-lg px-3 py-2 text-xs border border-blue-100">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="font-bold text-blue-800">{b.batch_code}</span>
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${seatsLeft > 3 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                                    {seatsLeft > 0 ? `${seatsLeft} kursi tersisa` : "Penuh"}
                                  </span>
                                </div>
                                <p className="text-gray-600">
                                  {b.session_day}{b.session_start_time ? `, ${String(b.session_start_time).slice(0, 5)}` : ""} WIB · Mulai {startDate}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                        {availBatches.length > 3 && (
                          <a href="/jadwal-kelas-reguler" target="_blank" className="block mt-2 text-[11px] text-blue-600 hover:underline font-medium">
                            + {availBatches.length - 3} batch lainnya — lihat semua →
                          </a>
                        )}
                        <p className="mt-2 flex items-start gap-1.5 text-[10px] text-blue-600">
                          <Lightbulb className="mt-px h-3 w-3 shrink-0" strokeWidth={2} />
                          <span>Admin akan mencocokkan kamu ke batch yang paling cocok via WhatsApp.</span>
                        </p>
                      </>
                    ) : (
                      <p className="flex items-start gap-1.5 text-xs text-blue-700">
                        <ClipboardList className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                        <span>Belum ada batch {regulerLangName(enrollLang)} yang dibuka. Admin akan menghubungi kamu via WhatsApp begitu batch baru tersedia, atau kamu bisa{" "}
                        <a href="/jadwal-kelas-reguler" target="_blank" className="underline font-semibold">cek jadwal lengkap</a>.</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Tagihan total (termasuk kelas lain yang belum bayar) */}
                {unpaidTotal > 0 && (
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-sm">
                    <p className="flex items-center gap-1.5 font-semibold text-amber-700 mb-1">
                      <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
                      Tagihan belum lunas
                    </p>
                    <div className="flex justify-between text-amber-600">
                      <span>Kelas sebelumnya</span>
                      <span className="font-bold">Rp{unpaidTotal.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="border-t border-amber-200 mt-2 pt-2 flex justify-between font-bold text-amber-800">
                      <span>Total yang perlu dibayar</span>
                      <span>Rp{(unpaidTotal + (isFixedPrice ? (flatPrice[enrollProgram] || 0) : price * enrollSessions)).toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                )}

                {isRegulerEnroll && (
                  <div className="mb-1"><RegulerTermsBox checked={agreeReguler} onChange={setAgreeReguler} /></div>
                )}
                {/* Xendit Checkout Button — primary CTA */}
                <button
                  onClick={handleXenditCheckout}
                  disabled={isRegulerEnroll && !agreeReguler}
                  className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-colors shadow-lg shadow-teal-100 mb-2 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <CreditCard className="h-4 w-4 shrink-0" strokeWidth={2} />
                  Bayar Otomatis (Xendit)
                </button>
                <p className="text-[10px] text-center text-gray-500 -mt-1 mb-3">
                  VA, QRIS, e-wallet · Konfirmasi otomatis &lt;1 menit
                </p>
                {/* WA Button */}
                <a href={`https://wa.me/6282116859493?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
                  onClick={(e) => { if (isRegulerEnroll && !agreeReguler) { e.preventDefault(); return; } handleConfirm(); }}
                  className={`flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-colors shadow-lg shadow-green-100 ${isRegulerEnroll && !agreeReguler ? "opacity-40 pointer-events-none" : ""}`}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.104 1.523 5.824L0 24l6.349-1.499A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.793 9.793 0 01-5.001-1.372l-.36-.214-3.726.879.896-3.628-.235-.374A9.78 9.78 0 012.182 12C2.182 6.545 6.545 2.182 12 2.182c5.455 0 9.818 4.363 9.818 9.818 0 5.454-4.363 9.818-9.818 9.818z"/></svg>
                  Bayar via Transfer (Hubungi Admin WA)
                </a>
                <button onClick={() => { handleConfirm(); setTimeout(openEnrollWizard, 300); }}
                  className="flex w-full items-center justify-center gap-2 h-10 rounded-xl border-2 border-slate-200 text-teal-600 font-semibold text-sm hover:bg-teal-50 transition-colors">
                  <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                  Selesai &amp; Tambah Kelas Lain
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Back button */}
        {enrollStep > 0 && (
          <div className="px-5 py-3 border-t shrink-0">
            <button onClick={() => setEnrollStep((s: number) => {
              if (isTestPrep && s === 2) return 0;
              if (isRegulerEnroll && s === 3) return 1; // summary → back to language
              return s - 1;
            })} className="text-sm text-gray-400 hover:text-gray-600 font-medium">
              ← Kembali
            </button>
          </div>
        )}
      </motion.div>

      {/* [enroll-exit-confirm-v1] Konfirmasi keluar — backdrop & tombol ✕ ga langsung nutup */}
      {showExitConfirm && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { e.stopPropagation(); setShowExitConfirm(false); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-900">Batalkan pendaftaran?</h3>
            <p className="mt-1.5 text-sm text-gray-500">Progres kamu akan hilang jika keluar sekarang.</p>
            <div className="mt-5 space-y-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-colors"
              >
                Lanjutkan Daftar
              </button>
              <button
                onClick={() => { setShowExitConfirm(false); setShowEnroll(false); }}
                className="w-full h-11 rounded-xl border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// [linguo-patch:beranda-mandiri-resume-v2] Native/label per bahasa self-study buat kartu di "Kelas Kamu".
// (v1 dulu komponen fetch-sendiri → kena race getSession & ilang pas remount. Sekarang dihitung di parent
//  effect keyed ke user?.id, simpen di state → persist antar-tab, ga ilang.)
const MANDIRI_NATIVE: Record<string, { native: string; label: string }> = {
  vietnamese: { native: "Tiếng Việt", label: "Bahasa Vietnam" },
  english: { native: "English", label: "Bahasa Inggris" },
  japanese: { native: "日本語", label: "Bahasa Jepang" },
  korean: { native: "한국어", label: "Bahasa Korea" },
  mandarin: { native: "中文", label: "Bahasa Mandarin" },
};

/* [perf:akun-snapshot-mount-v1] Snapshot dashboard di level MODUL (hidup selama tab
   browser belum di-reload). Balik ke /akun dari halaman LMS lain dulu SELALU mulai
   dari nol: `authLoading` true → spinner layar penuh → baru cache localStorage
   dipasang di effect. Hasilnya kedipan putih-spinner-konten tiap klik menu. Dengan
   snapshot ini render PERTAMA sudah membawa user + data siswa, jadi pindah menu
   terasa seperti ganti tab, bukan buka halaman baru.
   Sengaja variabel modul (bukan localStorage) supaya tak ada beda hidrasi: waktu
   halaman dimuat keras (server render) nilainya pasti kosong di dua sisi. */
type AkunSnapshot = { user: any; student: any; schedules: any[]; badges: any[]; streak: number };
let akunSnapshot: AkunSnapshot | null = null;

export default function AkunPage() {

  const [user, setUser] = useState<any>(() => akunSnapshot?.user ?? null);

  // [linguo-patch:beranda-mandiri-resume-v2] Resume self-study (Belajar Mandiri) buat kartu di "Kelas Kamu".
  // Dihitung pakai `user` STATE yang reliable (bukan getSession lokal di child) + keyed ke user?.id →
  // auto-jalan begitu user siap, persist antar-tab, ga ilang pas balik ke Beranda.
  const [mandiri, setMandiri] = useState<null | {
    native: string; label: string; photo: string | null; slug: string;
    total: number; done: number; pct: number; resumeId: string; resumeTitle: string; fresh: boolean;
    // [lanjutkan-belajar-v1] kapan sesi terakhir diselesaikan (epoch ms, 0 = tak tahu)
    ts: number;
  }>(null);

  // [linguo-patch:beranda-mandiri-refresh-v1] bump tiap balik ke Beranda → recompute progress (fix: kartu resume basi pas balik dari player)
  const [resumeNonce, setResumeNonce] = useState(0);

  useEffect(() => {
    const uid = user?.id;
    if (!uid) { setMandiri(null); return; }
    let alive = true;
    (async () => {
      try {
        const { data: mods } = await supabase
          .from("lms_modules")
          .select("id,language,sort_order,cefr_label,course_id")
          .order("sort_order");
        const modList = (mods || []) as { id: string; language: string; sort_order: number; cefr_label: string | null; course_id: string | null }[];
        if (!modList.length) { if (alive) setMandiri(null); return; }
        const moduleIds = modList.map((m) => m.id);
        const [lessRes, progRes, lessonStats] = await Promise.all([
          supabase.from("lms_lessons").select("id,module_id,title,sort_order").in("module_id", moduleIds).order("sort_order"),
          // [lanjutkan-belajar-v1] `completed_at` ikut ditarik → blok "Lanjutkan
          // Belajar" bisa mengurutkan sumber belajar berdasar aktivitas nyata.
          supabase.from("lms_progress").select("lesson_id,status,completed_at").eq("user_id", uid),
          fetchLessonStats(), // [lms-content-readiness-v1]
        ]);
        // [lms-content-readiness-v1] sesi cangkang (judul ke-seed, materi belum ditulis)
        // dibuang di sini: dulu ikut jadi penyebut persen & bisa kepilih jadi target "Lanjut".
        const lessons = keepReady(
          (lessRes.data || []) as { id: string; module_id: string; title: string; sort_order: number }[],
          lessonStats
        );
        const rampung = ((progRes.data as any[]) || []).filter((p) => p?.status === "completed");
        const done = new Set<string>(rampung.map((p) => p.lesson_id));
        const selesaiPada: Record<string, number> = {};
        rampung.forEach((p) => {
          const t = p?.completed_at ? new Date(p.completed_at).getTime() : 0;
          if (Number.isFinite(t) && t > 0) selesaiPada[p.lesson_id] = t;
        });

        // [linguo-patch:beranda-mandiri-owned-only-v1] cuma bahasa yang SUDAH dibeli/dientitle yang boleh
        // munculin kartu resume — konsisten sama katalog Belajar Mandiri (siswa ga daftar = ga akses).
        // [lms-entitlement-per-language-v1] dinilai per pasangan course+bahasa — satu
        // paket bisa memuat banyak bahasa, jadi entitlement level course tidak cukup.
        const pairs = Array.from(new Set(
          modList.filter((m) => m.course_id).map((m) => `${m.course_id}|${m.language}`)
        ));
        const ownedPairs = new Set<string>();
        if (pairs.length) {
          const ents = await Promise.all(
            pairs.map(async (key): Promise<{ key: string; ok: boolean }> => {
              const [cid, lang] = key.split("|");
              try {
                const { data, error } = await supabase.rpc("lms_is_entitled_lang", { p_course_id: cid, p_language: lang });
                if (!error) return { key, ok: !!data };
                const { data: legacy } = await supabase.rpc("lms_is_entitled", { p_course_id: cid });
                return { key, ok: !!legacy };
              } catch { return { key, ok: false }; }
            })
          );
          ents.forEach(({ key, ok }) => { if (ok) ownedPairs.add(key); });
        }
        const ownedByLang: Record<string, boolean> = {};
        modList.forEach((m) => { if (m.course_id && ownedPairs.has(`${m.course_id}|${m.language}`)) ownedByLang[m.language] = true; });

        const langByModule: Record<string, string> = {};
        const cefrByModule: Record<string, string> = {}; // [linguo-patch:beranda-mandiri-resume-v3] urut modul by CEFR (A1.1<A1.2<...), bukan sort_order (yg di DB A1.1 malah paling akhir)
        modList.forEach((m, i) => { langByModule[m.id] = m.language; cefrByModule[m.id] = m.cefr_label || `Z${i}`; });
        const byLang: Record<string, typeof lessons> = {};
        lessons.forEach((l) => { const lg = langByModule[l.module_id]; if (lg) (byLang[lg] = byLang[lg] || []).push(l); });

        // pilih bahasa dengan sesi-selesai terbanyak (= yang "lagi jalan")
        let bestLang = ""; let bestArr: typeof lessons = []; let bestDone = -1;
        Object.keys(byLang).forEach((language) => {
          if (!ownedByLang[language]) return; // skip bahasa yang belum dibeli
          const arr = byLang[language].slice().sort((a, b) => (cefrByModule[a.module_id] || "").localeCompare(cefrByModule[b.module_id] || "") || (a.sort_order - b.sort_order));
          const dc = arr.filter((l) => done.has(l.id)).length;
          if (dc > 0 && dc > bestDone) { bestLang = language; bestArr = arr; bestDone = dc; }
        });
        if (!alive) return;
        if (!bestLang) { setMandiri(null); return; }

        const total = bestArr.length;
        const next = bestArr.find((l) => !done.has(l.id)) || bestArr[bestArr.length - 1];
        const slug = bestLang.toLowerCase().replace(/\s+/g, "-");
        const m = MANDIRI_NATIVE[slug];
        setMandiri({
          native: m?.native || bestLang,
          label: m?.label || `Bahasa ${bestLang}`,
          photo: getLangPhoto(bestLang),
          slug,
          total,
          done: bestDone,
          pct: total ? Math.round((bestDone / total) * 100) : 0,
          resumeId: next.id,
          resumeTitle: next.title,
          fresh: !done.has(next.id),
          ts: bestArr.reduce((m, l) => Math.max(m, selesaiPada[l.id] || 0), 0),
        });
      } catch {
        /* best-effort — kartu opsional */
      }
    })();
    return () => { alive = false; };
  }, [user?.id, resumeNonce]);

  const [showPlacementPicker, setShowPlacementPicker] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  // [perf:akun-snapshot-mount-v1] sudah pegang identitas dari kunjungan sebelumnya
  // di tab ini → tak perlu spinner layar penuh lagi.
  const [authLoading, setAuthLoading] = useState(() => !akunSnapshot?.user);
  const [isSigningIn, setIsSigningIn] = useState(false);
  // [akun-oauth-error-surface-v1] Simpan pesan error yang dikirim balik provider OAuth
  // (mis. `#error=server_error&error_description=…`). Tanpa ini, kegagalan login Google
  // di Safari (ITP blokir state cookie lintas-situs) cuma "mantul" ke gate login tanpa
  // alasan apa pun — bikin user & kita nebak-nebak.
  const [authError, setAuthError] = useState<string>("");
  // [preview-student-v1] mode "POV siswa" tanpa login: /akun?preview=<student_id>
  // Data real di-fetch dari /api/preview-student (service role, bypass RLS).
  const router = useRouter(); // [perf:sidebar-nav-v1] navigasi client-side antar route
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewMode = !!previewId;
  // [bug-report-topbar-siswa-v1] dialog Lapor Bug dari top bar beranda
  const [bugOpen, setBugOpen] = useState(false);
  /* [preview-idle-session-v1] Sesi pratinjau yang sudah habis dulu TIDAK kelihatan:
     data siswa tetap terpampang dari cache sessionStorage, sementara semua hal yang
     minta server diam-diam mati (menu "Grup Kelas" hilang dari sidebar, chat grup
     kosong). Sekarang keadaannya diumumkan lewat banner supaya staf tahu yang
     dilihatnya salinan lama, bukan tampilan siswa yang sebenarnya. */
  const [previewExpired, setPreviewExpired] = useState(false);
  const [student, setStudent] = useState<StudentData | null>(() => (akunSnapshot?.student as StudentData | null) ?? null);
  const [badges, setBadges] = useState<Badge[]>(() => (akunSnapshot?.badges as Badge[]) ?? []);
  // jadwal-riwayat-v1: dulu state ini cuma diisi sesi MENDATANG, jadi kalender di
  // tab Jadwal selalu tampak kosong buat siswa yang sudah les berbulan-bulan.
  // Sekarang yang disimpan SELURUH sesi (12 bulan ke belakang s/d mendatang);
  // `upcomingSchedules` jadi turunan supaya semua pemakai lama tak ikut berubah.
  const [allSchedules, setAllSchedules] = useState<Schedule[]>(() => (akunSnapshot?.schedules as Schedule[]) ?? []);
  // [jadwal-live-now-v1] Patokannya jam SELESAI, bukan jam mulai. Dulu `> now`
  // dipakai ke `scheduled_at`, jadi kelas yang lagi berlangsung langsung raib dari
  // Beranda begitu menit pertama lewat — persis menit siswa paling butuh tombol
  // "Masuk Kelas"-nya. Sesi hitung sebagai lewat hanya setelah durasinya habis.
  const upcomingSchedules = useMemo(() => {
    const now = Date.now();
    return allSchedules
      .filter((s) =>
        (s.status === "scheduled" || s.status === "pending") &&
        new Date(s.scheduled_at).getTime() + (Number(s.duration_minutes) || 60) * 60000 > now
      )
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }, [allSchedules]);
  /* [jadwal-hantu-hidden-v1] Baris presensi sintetis ("Dicatat otomatis dari blok
     sesi") lahir waktu pengajar menaikkan angka sesi lewat blok presensi — tanggal
     aslinya tak diketahui, jadi ditaruh jam 12.00 di hari pencatatan. Buat siswa itu
     pertemuan hantu: muncul di kalender & linimasa pada jam yang tak pernah ada
     kelasnya, dan ikut menggeser penomoran sesi. Barisnya tetap dibiarkan hidup di
     database (fee pengajar dihitung dari situ) — cukup disembunyikan dari tampilan.
     Sesi itu tidak hilang dari hitungan: `petaNomorSesi` tetap menghitungnya lewat
     `registrations.sessions_used` sebagai slot tanpa baris jadwal. */
  const jadwalNyata = useMemo(() => tanpaSesiSintetis(allSchedules), [allSchedules]);
  // [sesi-nomor-sinkron-v1] Nomor sesi dihitung sekali untuk SEMUA baris jadwal
  // (bukan dibaca mentah dari `schedules.session_number`) supaya kartu kelas
  // "Sesi 14/16" dan label "#15/#16" di jadwal berikutnya bercerita hal yang sama.
  const nomorSesiMap = useMemo(
    () => petaNomorSesi(jadwalNyata as any, (student?.registrations || []) as any),
    [jadwalNyata, student?.registrations]
  );
  const [streak, setStreak] = useState(() => akunSnapshot?.streak ?? 0);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"beranda"|"jadwal"|"materi"|"akun"|"sertifikat"|"pustaka"|"simulasi"|"grup">("beranda"); // [linguo-patch:akun-pustaka-tab-v1] [simulasi-inshell-v1]
  /* [lanjutkan-ebook-buka-langsung-v1] Modul yang readernya harus dibuka begitu
     tab Perpustakaan tampil — dititipkan kartu "Lanjutkan Belajar" di beranda. */
  const [bukaEbook, setBukaEbook] = useState<string | null>(null);
  // [perf:akun-snapshot-mount-v1] simpan keadaan terakhir ke snapshot modul. Mode
  // pratinjau dilewati: datanya punya cache sendiri per siswa & bukan milik yang login.
  useEffect(() => {
    if (previewId || !user) return;
    akunSnapshot = { user, student, schedules: allSchedules, badges, streak };
  }, [previewId, user, student, allSchedules, badges, streak]);

  /* [perf:akun-tab-keepalive-v1] Tab yang SUDAH pernah dibuka tidak di-unmount lagi —
     cuma disembunyikan (display:none). Dulu tiap klik menu seluruh isi tab dibongkar
     dan dipasang ulang: komponennya mengambil datanya lagi dari nol (spinner), state
     lokal (pilihan kelas di "Kelas & Materi", posisi kalender, filter) hilang, dan
     panelnya sempat kosong → itu kedipan yang terasa tiap pindah menu. Sekarang
     kunjungan KEDUA ke sebuah menu tampil seketika dari yang sudah tergambar. */
  const tt = useT(); // [ui-lang-switcher-v1] penerjemah teks antarmuka dashboard
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(() => new Set<string>(["beranda"]));
  const tabShown = (k: string) => mountedTabs.has(k);
  const tabHidden = (k: string) => (activeTab === k ? undefined : ({ display: "none" } as const));

  // [profil-sidebar-collapse-v1] sidebar profil default collapsed; dibuka via avatar di topbar
  // [beranda-riwayat-kelas-v1] Kelas Live cuma tampilin yang aktif; yang selesai pindah ke view "Riwayat"
  const [liveView, setLiveView] = useState<"aktif" | "riwayat">("aktif");
  const [lmsSesi, setLmsSesi] = useState<string | null>(null);
  // Kelas & Materi master-detail UI state
  const [materiSel, setMateriSel] = useState<string | null>(null);
  const [materiTab, setMateriTab] = useState<"sesi" | "materi" | "kuis" | "rapor">("sesi"); // [materi-tab-kuis-rapor-v1]
  const [materiFilter, setMateriFilter] = useState<"all" | "run" | "done">("all");
  const [materiSearch, setMateriSearch] = useState("");
  // [beranda-ringkas-v2] state seksi "Jelajahi Bahasa" (jelajahiQ, jelajahiAll,
  // materiLang) ikut dibuang bersama blok katalognya.
  // [beranda-search-live-v1] kolom cari di header Beranda DULU cuma hiasan: input tanpa
  // state/handler, diketik ga terjadi apa-apa. Sekarang nyata — nyari kelas, pengajar,
  // bahasa, & menu, lalu langsung navigasi.
  const [homeQ, setHomeQ] = useState("");
  const [homeQOpen, setHomeQOpen] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const menu = sp.get("menu");
    const sesi = sp.get("sesi");
    const view = sp.get("view");
    /* [ebook-pratinjau-unit1-v1] ?ebook=<purchaseId> → mendarat di Perpustakaan
       DENGAN readernya sudah terbuka. Dipakai tombol "Baca Gratis Unit 1" di
       halaman produk: sesudah barisnya terbit, orangnya tak boleh disuruh
       mencari sendiri modul yang barusan dia klik. */
    const ebookId = sp.get("ebook");
    /* [materi-tab-kuis-rapor-v1] ?reg=<id>&ktab=<sesi|materi|kuis|rapor> — dipakai kartu
       kelas Beranda waktu dibuka di tab baru (klik biasa ditangani in-shell). */
    const regParam = sp.get("reg");
    const ktab = sp.get("ktab");
    let resolved: "beranda" | "jadwal" | "materi" | "akun" | "sertifikat" | "pustaka" | "simulasi" | "grup" | null = null;
    if (regParam) { setMateriSel(regParam); resolved = "materi"; }
    if (ktab === "sesi" || ktab === "materi" || ktab === "kuis" || ktab === "rapor") { setMateriTab(ktab); resolved = "materi"; }
    if (sesi) { setLmsSesi(sesi); resolved = "materi"; } // [linguo-patch:akun-inplace-lessonplayer-v1] deep-link sesi → overlay player
    if (view === "live" || view === "mandiri") { resolved = "materi"; } // [beranda-tanpa-tab-mandiri-v1] view lama tetap mendarat di Kelas & Materi
    if (view === "jelajahi") { resolved = "beranda"; } // [linguo-patch:beranda-jelajahi-v1] tab lama dipindah ke Beranda
    if (ebookId) { setBukaEbook(ebookId); resolved = "pustaka"; } // [ebook-pratinjau-unit1-v1]
    if (!resolved && (menu === "beranda" || menu === "jadwal" || menu === "materi" || menu === "akun" || menu === "sertifikat" || menu === "pustaka" || menu === "simulasi" || menu === "grup")) resolved = menu;
    // [akun-open-beranda-v1] Buka dashboard = SELALU mendarat di Beranda. Dulu tab
    // terakhir disimpan di localStorage, jadi buka /akun besok-besoknya bisa nyangkut
    // di Simulasi Tes / Sertifikat. Sekarang cuma sessionStorage: refresh di tab
    // browser yang sama tetap balik ke menu yang lagi dibuka (biar F5 ga bikin
    // kehilangan tempat), tapi kunjungan baru selalu mulai dari Beranda.
    if (!resolved) {
      try {
        const saved = sessionStorage.getItem("linguo_akun_tab");
        if (saved === "beranda" || saved === "jadwal" || saved === "materi" || saved === "akun" || saved === "sertifikat" || saved === "pustaka" || saved === "simulasi" || saved === "grup") resolved = saved;
      } catch {}
    }
    if (resolved) setActiveTab(resolved);
    // bersihin deep-link param sekali pakai, biar refresh berikutnya andelin tab tersimpan (bukan param nyangkut)
    if (menu || sesi || view || ebookId || regParam || ktab) {
      try {
        const u = new URL(window.location.href);
        ["menu", "sesi", "view", "ebook", "reg", "ktab"].forEach((k) => u.searchParams.delete(k));
        window.history.replaceState(null, "", u.toString());
      } catch {}
    }
  }, []);
  // [perf:akun-tab-keepalive-v1] catat tab yang pernah dibuka + mulai dari atas tiap
  // ganti menu (isi tab lama tetap hidup di belakang, jadi posisi gulirnya tak ikut).
  useEffect(() => {
    setMountedTabs((prev) => (prev.has(activeTab) ? prev : new Set(prev).add(activeTab)));
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, [activeTab]);

  // persist tab aktif -> refresh (tab browser yang sama) balik ke menu terakhir
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem("linguo_akun_tab", activeTab);
      localStorage.removeItem("linguo_akun_tab"); // [akun-open-beranda-v1] buang sisa key lama
    } catch {}
  }, [activeTab]);

  // [perf:tab-prefetch-v1] Semua tab berat dimuat lazy (dynamic import). Chunk-nya
  // baru diunduh SAAT menu diklik → tiap pindah menu selalu kena spinner beberapa
  // detik, padahal datanya sudah ada di memori. Di sini chunk-nya ditarik duluan
  // saat browser senggang, jadi pindah menu berikutnya langsung render.
  const warmUid = user?.id ?? "";
  useEffect(() => {
    if (typeof window === "undefined") return;
    const warm = () => {
      // [perf:simulasi-prewarm-v1] chunk-nya ditarik SEKALIGUS datanya dipanaskan:
      // klik "Simulasi Tes" jadi render dari cache, bukan mulai 4 query dari nol.
      import("@/components/akun/SimulasiKatalog").then((m) => {
        if (!previewMode) m.prewarmSimulasiCatalog?.();
      });
      import("@/components/akun/JadwalCalendar");
      import("@/components/akun/SertifikatTab");
      /* [nav-tab-grup-pustaka-v1] dua menu yang paling sering diklik siswa.
         [perf:grup-prewarm-v1] [perf:pustaka-prewarm-v1] chunk-nya ditarik SEKALIGUS
         datanya dipanaskan — dulu chunk-nya saja yang duluan, jadi klik menunya tetap
         berujung spinner sambil menunggu RPC/query berangkat dari nol. */
      import("@/components/akun/StudentGroupChat").then((m) => {
        if (!previewMode) void m.prewarmStudentGroups?.();
      });
      import("@/components/akun/LibraryView").then((m) => {
        if (!previewMode && warmUid) m.prewarmLibrary?.(supabase, warmUid);
      });
    };
    const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void, o?: any) => number);
    if (ric) { const id = ric(warm, { timeout: 4000 }); return () => (window as any).cancelIdleCallback?.(id); }
    const t = setTimeout(warm, 1500);
    return () => clearTimeout(t);
    // previewMode ikut dep: mode pratinjau baru ketahuan setelah efek auth jalan,
    // dan pemanasan data (butuh sesi login) tak boleh ikut jalan di mode itu.
    // warmUid ikut dep: pustaka dikunci per user, jadi pemanasannya baru bisa
    // berangkat setelah sesi ketahuan (cache modulnya yang jaga agar tak dobel).
  }, [previewMode, warmUid]);
  // [materi-bahasa-siswa-v1] menu "Kelas & Materi" sudah dibuka untuk semua siswa —
  // gate per-email (materi-gate-v1) dicabut, termasuk lemparan balik ke Beranda buat
  // deep-link ?menu=materi. Pembatasannya sekarang di DATA: kelas live = registrasi
  // milik siswa, Belajar Mandiri = bahasa yang dia ambil/beli.
  const canSeeMateri = canAccessMateriGate(user?.email);
  /* [nav-tab-grup-pustaka-v1] Redirect "pustaka" → /akun/perpustakaan DICABUT: menu
     itu kembali jadi tab di halaman ini (isinya komponen LibraryView yang sama),
     jadi klik menu tak lagi berarti ganti halaman. Route-nya tetap hidup buat
     tautan langsung / bookmark lama. */
  // [linguo-patch:beranda-mandiri-refresh-v1] tiap masuk Beranda → recompute kartu resume (progress fresh setelah selesai sesi)
  useEffect(() => {
    if (activeTab === "beranda") setResumeNonce((n) => n + 1);
  }, [activeTab]);

  // [enrollment-24h-autoexpire-v1] saat dashboard load: registrasi "Menunggu Pembayaran"
  // yang umurnya > 24 jam → server capture jadi lead follow-up lalu hapus barisnya.
  useEffect(() => {
    const regs = student?.registrations;
    if (!regs || !regs.length) return;
    const DAY = 24 * 60 * 60 * 1000;
    const stale = regs.filter((r: any) => {
      if (r.status !== "Menunggu Pembayaran") return false;
      const created = new Date(r.created_at || r.registration_date || Date.now()).getTime();
      return Date.now() - created >= DAY;
    });
    if (!stale.length) return;
    let alive = true;
    (async () => {
      const expiredIds: string[] = [];
      for (const r of stale) {
        try {
          const res = await fetch("/api/expire-enrollment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ registration_id: r.id }),
          });
          const data = await res.json().catch(() => ({}));
          if (data?.expired) expiredIds.push(r.id);
        } catch (e) {
          console.warn("auto-expire enrollment failed (non-fatal):", e);
        }
      }
      if (alive && expiredIds.length) {
        setStudent((s: any) =>
          s ? { ...s, registrations: s.registrations.filter((x: any) => !expiredIds.includes(x.id)) } : s
        );
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id]);
  // Booking Modal
  const [bookingReg, setBookingReg] = useState<StudentReg | null>(null);
  const [availSlots, setAvailSlots] = useState<Set<string>>(new Set()); // "day_of_week-HH:MM"
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set()); // ISO strings
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [pendingModalReg, setPendingModalReg] = useState<any>(null); // pending-payment popup
  // [akun-cancel-enrollment-v1] target kartu yang lagi dikonfirmasi pembatalannya + flag in-flight
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);
  // [akun-cancel-enrollment-v1] batalkan lewat /api/cancel-enrollment (service role:
  // catat lead + delete row), baru buang dari state. Ganti hard-delete client lama
  // yang ketolak RLS & ga nyatet lead.
  const confirmCancelEnrollment = async () => {
    if (!cancelTarget) return;
    const reg = cancelTarget;
    setCancelling(true);
    try {
      const res = await fetch("/api/cancel-enrollment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: reg.id }),
      });
      if (!res.ok) {
        toast.error("Gagal membatalkan pendaftaran");
        return;
      }
      toast.success("Pendaftaran berhasil dibatalkan");
      setStudent((prev: any) => prev ? { ...prev, registrations: (prev.registrations || []).filter((x: any) => x.id !== reg.id) } : prev);
      setPendingModalReg((cur: any) => (cur && cur.id === reg.id ? null : cur));
      setCancelTarget(null);
    } catch {
      toast.error("Gagal membatalkan pendaftaran");
    } finally {
      setCancelling(false);
    }
  };
  const [bookingSubmit, setBookingSubmit] = useState(false);
  // Email/password login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // [akun-login-redesign-v1] toggle mata password
  const [otpSent, setOtpSent] = useState(false); // linguo-patch:akun-otp-login-v1
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false); // [linguo-patch:onboarding-success-lottie-v1]
  const [wizardCompleted, setWizardCompleted] = useState(false);
  const [wizardData, setWizardData] = useState<{program:string;lang:string;testType:string;exp:string}|null>(null);
  const [onboardStep, setOnboardStep] = useState(0);
  const [onboardLang, setOnboardLang] = useState("");
  const [onboardProgram, setOnboardProgram] = useState("");
  const [onboardExp, setOnboardExp] = useState<"beginner"|"intermediate"|"">("");
  const [onboardLangSearch, setOnboardLangSearch] = useState("");
  // Enrollment wizard
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollStep, setEnrollStep] = useState(0);
  const [enrollProgram, setEnrollProgram] = useState("");
  const [enrollLang, setEnrollLang] = useState("");
  const [enrollDuration, setEnrollDuration] = useState("60");
  const [enrollSchedule, setEnrollSchedule] = useState<Record<string,string[]>>({}); // { "Senin": ["09:00","11:00"] }
  const [langSearch, setLangSearch] = useState("");

  // ── Auth ──────────────────────────────────────────────────────────
  useEffect(() => {
    // [preview-student-v1] deteksi ?preview=<id> → mode POV siswa tanpa login
    if (typeof window !== "undefined") {
      const pid = new URLSearchParams(window.location.search).get("preview");
      if (pid) { setPreviewId(pid); setAuthLoading(false); return; }
    }
    // [akun-oauth-error-surface-v1] Kalau provider OAuth balik dengan error, Supabase
    // mengarahkan ke redirectTo dgn `#error=…&error_description=…` (kadang di query).
    // Baca & tampilkan alih-alih diam-diam balik ke gate login. Lalu bersihkan URL
    // biar hash error tak "nyangkut" saat refresh.
    if (typeof window !== "undefined") {
      const hp = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const qp = new URLSearchParams(window.location.search);
      // [akun-oauth-error-surface-v2] fallback ke snapshot module-load — SDK bisa
      // keburu nyapu hash sebelum effect ini jalan, bikin error tak pernah tampil
      const errCode = hp.get("error") || qp.get("error") || initialAuthError?.code || "";
      const errDesc = hp.get("error_description") || qp.get("error_description") || initialAuthError?.description || "";
      if (errCode) {
        const pretty = decodeURIComponent(errDesc.replace(/\+/g, " ")) || errCode;
        setAuthError(pretty);
        // buang param error dari URL (biar tak muncul lagi saat reload / share link)
        try { window.history.replaceState(null, "", window.location.pathname + window.location.search.replace(/([?&])error[^&]*/g, "").replace(/([?&])error_description[^&]*/g, "").replace(/[?&]$/, "")); } catch {}
      }
    }
    // [gate-watch-learn-v1] ?next=/path → setelah sesi ada (login sukses / sudah
    // login), langsung dialihkan ke tujuan itu. Hanya path internal (diawali "/")
    // yang diterima, cegah open-redirect.
    const nextRaw = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
    const nextPath = nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : null;
    // [perf:session-cookie-peek-v1] Mulai render duluan dari identitas di cookie.
    // getSession() di bawah tetap yang menentukan (kalau sesinya ternyata mati,
    // halaman jatuh ke gate login sendiri) — ini semata menghapus spinner layar
    // penuh selama SDK antre Web Locks / refresh token, yang bikin balik dari
    // Watch & Learn ke dashboard terasa lama padahal datanya sudah di cache.
    if (!nextPath) {
      const peek = peekSessionUser();
      if (peek) { setUser(peek); setAuthLoading(false); }
    }
    // [akun-gate-resilient-v1] Gate login itu vonis berat: sekali muncul, user
    // merasa "ke-logout". Jadi jawaban `session: null` TIDAK langsung dipercaya —
    // kalau cookie sesi masih memegang token hidup, itu tanda SDK-nya yang lagi
    // sial (antre Web Locks, refresh token barusan dirotasi middleware), bukan
    // sesinya yang mati. Coba sekali lagi sebelum menjatuhkan gate.
    let alive = true;
    const settle = (session: any) => {
      if (!alive) return;
      if (session && nextPath) { window.location.replace(nextPath); return; }
      setUser(session?.user ?? null);
      setAuthLoading(false);
    };
    (async () => {
      // [auth-implicit-hash-adopt-v1] Link login email mendarat di sini dengan
      // token di hash. Tebus DULU, sebelum tanya sesi — kalau tidak, jawabannya
      // pasti null dan gate login nongol padahal linknya barusan sah.
      await adoptImplicitSessionFromUrl();
      if (!alive) return;
      // [auth-gate-resilient-v1] logika "coba lagi sebelum menjatuhkan gate" pindah
      // ke helper bersama supaya Watch & Learn dan menu LMS lain memakai aturan yang
      // sama persis. Bonus: helper ini juga menangani kasus access token di cookie
      // sudah kedaluwarsa (refresh halaman setelah sejam) — dulu peekSessionUser()
      // menjawab null di situ, jadi percobaan ulangnya malah tak pernah jalan.
      const verdict = await resolveSessionForGate();
      if (!alive) return;
      if (verdict.session) { settle(verdict.session); return; }
      // SDK tak memberi sesi TAPI juga tak ada vonis "token tak sah" → perlakukan
      // sebagai masih login (identitas dari cookie); onAuthStateChange yang
      // membetulkan begitu SDK pulih.
      if (verdict.uncertain && verdict.user) {
        if (nextPath) { window.location.replace(nextPath); return; }
        setUser(verdict.user);
        setAuthLoading(false);
        return;
      }
      settle(null);
    })();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) { settle(session); return; }
      // Event tanpa sesi: cuma SIGNED_OUT yang benar-benar berarti user keluar.
      // Event lain (INITIAL_SESSION yang balapan, TOKEN_REFRESHED gagal sesaat)
      // dulu ikut mengosongkan `user` → gate login nongol padahal masih login.
      if (event === "SIGNED_OUT") { akunSnapshot = null; setUser(null); setAuthLoading(false); }
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  // [preview-student-v1] load data siswa real (server, service role) buat preview
  // [perf:preview-cache-v1] cache-first ala jalur login: snapshot kunjungan
  // sebelumnya dipasang instan (tanpa spinner layar penuh), lalu direvalidasi
  // diam-diam. Tanpa ini tiap balik dari Watch & Learn / Perpustakaan ke
  // dashboard selalu menunggu satu panggilan server dari nol.
  useEffect(() => {
    if (!previewId) return;
    let hadCache = false;
    try {
      const raw = sessionStorage.getItem(`linguo_preview_cache_${previewId}`);
      if (raw) {
        const c = JSON.parse(raw);
        if (c?.student) {
          setStudent(c.student);
          setAllSchedules(c.schedules || []);
          simpanDaftarLevel(previewId, c.student?.registrations); // [kelas-level-switcher-v3]
          hadCache = true;
        }
      }
    } catch {}
    if (!hadCache) setDataLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/preview-student?id=${encodeURIComponent(previewId)}`, { cache: "no-store" });
        // 403 = cookie pratinjau habis/dicabut, bukan gangguan jaringan sesaat.
        if (res.status === 403) {
          setPreviewExpired(true);
          /* [preview-stale-jadwal-v1] Begitu sesinya habis, layar ini berhenti bisa
             menyegarkan diri — yang tergambar cuma snapshot sessionStorage dari
             kunjungan sebelumnya, dan snapshot itu bertahan melewati reload. Untuk
             data lain salinan lama masih bisa dimaklumi, tapi JADWAL jadi menyesatkan:
             sesi yang sudah dihapus/dirapikan di database tetap tampil sebagai kelas
             nyata (kasus 3 Sep 2026 — Jumat menampilkan 4 blok padahal `schedules`
             tinggal 2). Snapshotnya dibuang dan kalendernya dikosongkan; bannernya
             yang menjelaskan kenapa, jadi tak ada angka bohong di layar. */
          try { sessionStorage.removeItem(`linguo_preview_cache_${previewId}`); } catch {}
          setAllSchedules([]);
        }
        if (!res.ok) throw new Error("preview fetch failed");
        setPreviewExpired(false);
        const json = await res.json();
        try {
          sessionStorage.setItem(`linguo_preview_cache_${previewId}`, JSON.stringify({
            student: json.student,
            schedules: json.schedules || json.upcomingSchedules || [],
          }));
        } catch {}
        setStudent(json.student);
        simpanDaftarLevel(previewId, json.student?.registrations); // [kelas-level-switcher-v3]
        // jadwal-riwayat-v1: endpoint sekarang mengirim `schedules` (riwayat + mendatang).
        // `upcomingSchedules` dipertahankan sebagai fallback buat respons lama.
        setAllSchedules(json.schedules || json.upcomingSchedules || []);
      } catch (e) {
        console.error("[preview-student]", e);
      } finally {
        setDataLoading(false);
      }
    })();
  }, [previewId]);

  const signInWithGoogle = async () => {
    setIsSigningIn(true);
    // [gate-watch-learn-v1] pertahankan ?next lewat OAuth round-trip → balik ke /akun?next=…
    const nextRaw = new URLSearchParams(window.location.search).get("next");
    const nextQs = nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? `?next=${encodeURIComponent(nextRaw)}` : "";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/akun${nextQs}` },
    });
    if (error) setIsSigningIn(false);
  };

  const signOut = async () => {
    akunSnapshot = null; // [perf:akun-snapshot-mount-v1] jangan wariskan data ke pemilik sesi berikutnya
    try { if (user?.email) localStorage.removeItem(`linguo_akun_cache_${user.email}`); } catch {}
    await supabase.auth.signOut();
    setUser(null);
    setStudent(null);
    // Redirect ke page logout khusus (bukan langsung ke landing)
    window.location.href = "/akun/logout";
  };

  const signInWithEmail = async () => {
    if (!loginEmail || !loginPassword) return;
    setIsSigningIn(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    if (error) {
      alert(error.message === "Invalid login credentials" ? "Email atau password salah." : error.message);
    }
    setIsSigningIn(false);
  };

  // linguo-patch:akun-otp-login-v1 — passwordless magic-link login (any email, incl. affiliates w/ no password)
  const signInWithMagicLink = async () => {
    if (!loginEmail) return;
    setIsSigningIn(true);
    // [gate-watch-learn-v1] bawa ?next lewat magic-link (selesai di page load baru)
    const nextRaw = new URLSearchParams(window.location.search).get("next");
    const nextQs = nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? `?next=${encodeURIComponent(nextRaw)}` : "";
    const { error } = await supabase.auth.signInWithOtp({
      email: loginEmail,
      options: {
        emailRedirectTo: window.location.origin + "/akun" + nextQs,
        shouldCreateUser: true,
      },
    });
    setIsSigningIn(false);
    if (error) {
      alert(error.message);
      return;
    }
    setOtpSent(true);
  };

  // ── Data Loading (fixed column names) ────────────────────────────
  // linguo-patch:akun-fast-refresh-v1 — cache-first: render instan dari snapshot
  // localStorage (tanpa spinner), lalu revalidasi diam-diam di belakang.
  useEffect(() => {
    if (!user?.email) return;
    let hadCache = false;
    try {
      const raw = localStorage.getItem(`linguo_akun_cache_${user.email}`);
      if (raw) {
        const c = JSON.parse(raw);
        if (c?.student) {
          setStudent(c.student);
          setAllSchedules(c.schedules || c.upcomingSchedules || []); // jadwal-riwayat-v1
          setBadges(c.badges || []);
          if (typeof c.streak === "number") setStreak(c.streak);
          setDataLoading(false);
          hadCache = true;
        }
      }
    } catch {}
    // [perf:akun-snapshot-mount-v1] snapshot modul juga dihitung sebagai "sudah ada
    // isinya" → revalidasinya diam-diam, tanpa spinner layar penuh yang menimpa
    // dashboard yang sudah tergambar.
    loadStudentData(user.email, hadCache || !!akunSnapshot?.student);
  }, [user?.email]);

  // [teacher-avatar-sync-v1] Direktori foto pengajar — fetch langsung dari tabel
  // `teachers` (sumber yang SAMA dengan dashboard admin & pengajar) berdasarkan
  // teacher_id di registrations. Menambal reg dari cache/snapshot lama yang belum
  // membawa avatar_url, jadi foto pengajar selalu sinkron tanpa nunggu refresh penuh.
  const [teacherDir, setTeacherDir] = useState<Record<string, { id: string; name?: string; title?: string; avatar_url?: string | null }>>({});
  useEffect(() => {
    const regs = student?.registrations || [];
    const ids = Array.from(new Set(regs.map((r: any) => r.teacher_id).filter(Boolean))).filter(
      (id: any) => !(id in teacherDir)
    );
    if (ids.length === 0) return;
    (async () => {
      const { data } = await supabase.from("teachers").select("id, name, title, avatar_url").in("id", ids);
      if (!data || data.length === 0) return;
      setTeacherDir((prev) => {
        const next = { ...prev };
        (data as any[]).forEach((t) => { next[t.id] = t; });
        return next;
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.registrations]);

  /* [lingbook-lebur-pustaka-v1] Lingbook masih development — gerbangnya email
     allowlist yang sama dengan tab "Interaktif" di Perpustakaan. Dipakai blok
     "Lanjutkan Belajar" biar tak menawarkan bab ke siswa yang tak bisa membukanya. */

  // ── [elearning-kartu-langsung-youtube-v1] ────────────────────────────────
  // Kelas E-Learning itu rekaman, bukan kelas live: tak ada pengajar, tak ada
  // jadwal, tak ada sesi. Kartunya dulu tetap mendarat di halaman detail kelas
  // dan yang kebaca cuma "Belum ada pengajar / Belum ada sesi" — padahal yang
  // dibeli siswa cuma satu hal: playlist videonya. Jadi kartunya sekarang
  // langsung membuka link yang sudah diisi admin di /produk-digital.
  //
  // Sumber link: digital_purchases → digital_products (video_playlist_url →
  // file_url). Dicocokkan lewat `registration_id` (baris registrasi memang
  // dilahirkan trigger dari pembelian itu), dengan cadangan cocok-per-BAHASA
  // buat baris lama yang belum tertaut. Kalau linknya belum ada / masih
  // placeholder, perilakunya kembali seperti dulu (masuk halaman detail).
  const [elearnLink, setElearnLink] = useState<Record<string, string>>({});
  /* [produk-digital-bukan-kelas-v1] Daftar produk digital yang benar-benar dimiliki
     siswa. Sejak kartunya keluar dari "Kelas Live", tab "Belajar Mandiri" di Beranda
     yang jadi rumahnya — dan kepemilikan ini juga yang menentukan siswa disebut
     "belum punya apa pun" atau tidak. */
  const [produkDigital, setProdukDigital] = useState<
    { id: string; purchaseId: string; type: "ebook" | "elearning"; title: string; language: string | null; cover: string | null; link: string | null }[]
  >([]);
  useEffect(() => {
    if (!user?.id) return;
    let batal = false;
    (async () => {
      // [perpustakaan-akses-email-v1] pembelian lama sering ber-auth_user_id NULL.
      const milikSaya = await orMilikSaya(supabase, user.id);
      const base = supabase
        .from("digital_purchases")
        .select("id, registration_id, digital_products(id, type, title, language, cover_url, file_url, video_playlist_url)");
      /* [lanjutkan-ebook-arsip-v1] `archived_at` SENGAJA tidak disaring di sini —
         Perpustakaan (LibraryView) juga tidak menyaringnya, jadi baris pembelian
         yang diarsipkan admin tetap bisa dibaca siswa. Waktu Beranda lebih ketat
         daripada Perpustakaan, modul yang barusan dibaca tak punya pasangan di
         daftar ini dan kartunya di "Lanjutkan Belajar" hilang diam-diam. */
      const { data } = await (milikSaya ? base.or(milikSaya) : base.eq("auth_user_id", user.id))
        .eq("payment_status", "Lunas");
      if (batal || !data) return;
      const map: Record<string, string> = {};
      const punya: { id: string; purchaseId: string; type: "ebook" | "elearning"; title: string; language: string | null; cover: string | null; link: string | null }[] = [];
      const sudah = new Set<string>();
      for (const row of data as any[]) {
        const prod = row?.digital_products;
        if (!prod) continue;
        const link = externalLinkFor(prod);
        const linkSiap = link && !isPlaceholderLink(link) ? link : null;
        // Satu produk bisa dibeli dua kali (perpanjangan) — cukup satu kartu.
        if (prod.id && !sudah.has(prod.id)) {
          sudah.add(prod.id);
          punya.push({
            id: String(prod.id),
            // [lanjutkan-belajar-v1] posisi baca e-book disimpan per PEMBELIAN
            // (kunci `ebook-hal:<purchaseId>` di EbookReader), bukan per produk.
            purchaseId: String(row.id),
            type: prod.type === "ebook" ? "ebook" : "elearning",
            title: prod.title || "Produk digital",
            language: prod.language || null,
            /* [lingbook-sampul-kartu-v1] Sampul asli produk buat kartu "Lanjutkan
               Belajar" — ikon buku generik tak memberi tahu BUKU YANG MANA yang
               terakhir dibaca. Kosong → jatuh ke foto stok bahasa. */
            cover: prod.cover_url || null,
            // E-Book dibaca di dalam Perpustakaan (EbookReader), bukan lewat tautan luar.
            link: prod.type === "ebook" ? null : linkSiap,
          });
        }
        if (prod.type === "ebook") continue;
        if (!linkSiap) continue;
        if (row.registration_id) map[row.registration_id] = linkSiap;
        const lang = (prod.language || "").trim().toLowerCase();
        if (lang) map[`lang:${lang}`] = linkSiap;
      }
      setElearnLink(map);
      setProdukDigital(punya);
    })();
    return () => { batal = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  /** Link playlist buat satu registrasi E-Learning; null = buka halaman detail seperti biasa. */
  const linkElearning = (reg: any): string | null => {
    if (normalizeProduct(reg?.product) !== "E-Learning") return null;
    const lang = (reg?.language || "").trim().toLowerCase();
    return elearnLink[reg?.id] || (lang ? elearnLink[`lang:${lang}`] : null) || null;
  };

  async function loadStudentData(email: string, silent = false) {
    if (!silent) setDataLoading(true);
    try {
      // [akun-student-kembar-v1] JANGAN pakai .maybeSingle() di sini. Tabel
      // `students` tidak punya unique constraint di `email`, dan kenyataannya ada
      // 24 email yang punya dua baris (lahir dari dua insert yang balapan). Untuk
      // email seperti itu maybeSingle() balik `data: null` (PGRST116 "multiple rows
      // returned") — dashboard menyimpulkan "siswa belum ada" lalu melempar orang
      // yang registrasinya sudah tersimpan balik ke onboarding, tiap kali refresh.
      //
      // Barisnya diambil semua, lalu dipilih yang benar-benar memegang data:
      // kembaran yang kosong sering justru yang paling tua, jadi "ambil yang
      // pertama" saja tidak cukup. Aturan pilih ini SAMA dengan /api/enroll biar
      // pendaftaran baru nempel di baris yang sama dengan yang dibaca dashboard.
      const { data: studentRows } = await supabase
        .from("students")
        .select("id, name, email, whatsapp, avatar_url, created_at")
        .eq("email", email)
        .order("created_at", { ascending: true });
      let studentData: any = null;
      const kandidat = (studentRows as any[]) || [];
      if (kandidat.length === 1) {
        studentData = kandidat[0];
      } else if (kandidat.length > 1) {
        const { data: regOwners } = await supabase
          .from("registrations")
          .select("student_id")
          .in("student_id", kandidat.map((r) => r.id))
          .is("archived_at", null);
        const punyaKelas = new Set(((regOwners as any[]) || []).map((r) => r.student_id));
        studentData = kandidat.find((r) => punyaKelas.has(r.id)) || kandidat[0];
      }

      // ─────────────────────────────────────────────────────────────────
      // SKIP-ONBOARDING FOR DIGITAL CUSTOMERS
      // Kalau user belum ada di `students` tapi udah punya digital_purchases
      // (e-learning / e-book / IELTS sim) yang Lunas, auto-create student row
      // dan skip onboarding. Mereka udah commit ke produk — gak perlu nudge lagi.
      // ─────────────────────────────────────────────────────────────────
      if (!studentData && user?.id) {
        // [perpustakaan-akses-email-v1] termasuk pembelian yang auth_user_id-nya
        // masih NULL (akun dibuat sesudah bayar) — mereka juga pelanggan digital.
        const milikSaya = await orMilikSaya(supabase, user.id);
        const dpBase = supabase.from("digital_purchases").select("id");
        const { data: digitalPurchases } = await (milikSaya ? dpBase.or(milikSaya) : dpBase.eq("auth_user_id", user.id))
          .eq("payment_status", "Lunas")
          .limit(1);

        if (digitalPurchases && digitalPurchases.length > 0) {
          // Auto-create student row using same pattern as OnboardingWizard.onDone
          const studentPayload = {
            name:
              user?.user_metadata?.full_name ||
              user?.email?.split("@")[0] ||
              "Siswa",
            email: user?.email,
            avatar_url: user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null,
          };
          const { data: inserted } = await supabase
            .from("students")
            .insert(studentPayload)
            .select("id, name, email, whatsapp, avatar_url")
            .single();
          if (inserted) {
            studentData = inserted;
            // Set onboarded flag so we don't accidentally show wizard later
            try {
              localStorage.setItem(
                `linguo_onboarded_${user?.id || email}`,
                "true"
              );
            } catch {}
          }
        }
      }

      // Auto-sync avatar dari OAuth metadata kalo student udah ada tapi avatar_url null
      // (cover existing user yang dibuat sebelum patch fallback chain)
      if (studentData && !studentData.avatar_url) {
        const oauthAvatar =
          user?.user_metadata?.avatar_url ??
          user?.user_metadata?.picture ??
          null;
        if (oauthAvatar) {
          const { data: synced } = await supabase
            .from("students")
            .update({ avatar_url: oauthAvatar })
            .eq("id", studentData.id)
            .select("id, name, email, whatsapp, avatar_url")
            .single();
          if (synced) studentData = synced;
        }
      }

      if (!studentData) {
        // Student tak ada di DB → snapshot lama tak valid lagi.
        try { localStorage.removeItem(`linguo_akun_cache_${email}`); } catch {}
        setStudent(null);
        // Check if wizard was previously completed (survives refresh)
        try {
          const savedWizard = localStorage.getItem(`linguo_wizard_${user?.id || email}`);
          if (savedWizard) {
            const parsed = JSON.parse(savedWizard);
            setWizardData(parsed);
            setWizardCompleted(true);
            setDataLoading(false);
            return;
          }
        } catch {}
        // No wizard data — show onboarding
        const onboardKey = `linguo_onboarded_${user?.id || email}`;
        if (!localStorage.getItem(onboardKey)) {
          setShowOnboarding(true);
        }
        setDataLoading(false);
        return;
      }

      // Only use columns that actually exist in the DB
      const { data: regsData } = await supabase
        .from("registrations")
        .select(`
          id, product, language, level, status,
          sessions_total, sessions_used,
          duration, total_amount, payment_status,
          installment_paid, payment_due_date, payment_date, created_at,
          registration_date, teacher_id, batch_id, test_prep_batch_id,
          payment_proof_url, payment_proof_uploaded_at,
          payment_verified_at, payment_rejection_reason,
          pipeline_status, archived_at,
          teachers(name, whatsapp, avatar_url)
        `)
        .eq("student_id", studentData.id)
        .order("registration_date", { ascending: false });

      /* Batch kelas grup — Reguler (`regular_batches`) & English Test Preparation
         (`test_prep_batches`).

         [jadwal-batch-kalender-v1] Dulu di sini query ke `regular_class_batches`, tabel
         yang TIDAK ADA di DB (gotcha yang sama sudah dicatat di modal enroll di atas),
         dan errornya ditelan `try/catch` — jadi `reg.batch` selalu null dan jadwal tetap
         kelas grup tak pernah muncul di /akun. Sumber yang benar: `regular_batches`
         dengan kolom session_day / session_start_time. */
      const regsWithBatch = (regsData as any) || [];
      const batchIds = regsWithBatch.filter((r: any) => r.batch_id).map((r: any) => r.batch_id);
      const tpBatchIds = regsWithBatch.filter((r: any) => r.test_prep_batch_id).map((r: any) => r.test_prep_batch_id);
      const batchMap: Record<string, any> = {};
      const tpBatchMap: Record<string, any> = {};
      const [regBatchRes, tpBatchRes] = await Promise.all([
        batchIds.length > 0
          ? supabase
              .from("regular_batches")
              .select("id, batch_code, language, level, session_day, session_start_time, session_duration_min, start_date, end_date, total_sessions, status, zoom_link")
              .in("id", batchIds)
              .then((r: any) => r, () => ({ data: null } as any))
          : Promise.resolve({ data: null } as any),
        tpBatchIds.length > 0
          ? supabase
              .from("test_prep_batches")
              .select("id, name, test_type, level, schedule_days, schedule_time, duration_minutes, start_date, end_date, sessions_total, cancelled_at")
              .in("id", tpBatchIds)
              .then((r: any) => r, () => ({ data: null } as any))
          : Promise.resolve({ data: null } as any),
      ]);
      (regBatchRes.data || []).forEach((b: any) => { batchMap[b.id] = b; });
      (tpBatchRes.data || []).forEach((b: any) => { tpBatchMap[b.id] = b; });
      const enrichedRegs = regsWithBatch.map((r: any) => ({
        ...r,
        batch: r.batch_id ? batchMap[r.batch_id] || null : null,
        testPrepBatch: r.test_prep_batch_id ? tpBatchMap[r.test_prep_batch_id] || null : null,
      }));

      // Student is now active — clear wizard cache
      try { localStorage.removeItem(`linguo_wizard_${user?.id || email}`); } catch {}
      setStudent({ ...studentData, registrations: enrichedRegs });
      // [kelas-level-switcher-v3] Daftar ini sudah lengkap (termasuk level lama yang
      // diarsipkan) — titipkan buat strip pindah level, biar halaman detail tak
      // bergantung pada rantai query-nya sendiri yang gampang putus.
      simpanDaftarLevel(studentData.id, enrichedRegs);

      // ── Onboarding: show for new users with no registrations ──
      const regs = enrichedRegs;
      // [onboarding-sekali-kirim-v1] Wizard menandai "sudah onboarding" dengan kunci
      // ber-id AUTH (baris students-nya belum tentu ada waktu itu), sementara di sini
      // dulu cuma kunci ber-id student yang dicek. Beda kunci = siswa yang wizard-nya
      // sudah kelar tapi registrasinya belum jadi (mis. lagi nunggu verifikasi)
      // dilempar balik ke onboarding. Sekarang dua-duanya dianggap sah.
      const sudahOnboarding =
        !!localStorage.getItem(`linguo_onboarded_${studentData.id}`) ||
        !!localStorage.getItem(`linguo_onboarded_${user?.id || email}`);
      if (regs.length === 0 && !sudahOnboarding) {
        setShowOnboarding(true);
      }

      const regIds = enrichedRegs.map((r: any) => r.id);

      // Data inti (student + registrations) sudah tampil — lepas spinner sekarang,
      // sisanya (schedules/badges/streak) menyusul di belakang tanpa menahan UI.
      setDataLoading(false);

      // Schedules + badges + streak — PARALEL (dulu berurutan = 3x round-trip).
      const [schedRes, badgeRes, streakRes] = await Promise.all([
        regIds.length > 0
          ? supabase
              .from("schedules")
              // jadwal-recurring-materi-v1: nomor pertemuan + materi ikut ditarik
              // jadwal-riwayat-v1: + presensi & rekaman, dan TANPA saringan
              //   status/`gt(now)` — kalender butuh sesi lampau juga.
              // [materi-sesi-semua-kelas-v1] batas riwayat 12 bulan DICABUT: linimasa
              //   sesi di "Kelas & Materi" berlaku buat semua kelas termasuk level
              //   terdahulu, dan potongan 12 bulan diam-diam mengosongkan level lama
              //   siswa yang sudah les >1 tahun. Payloadnya tetap kecil — jumlah baris
              //   dibatasi jumlah sesi paket yang pernah dibeli siswa itu sendiri.
              // [materi-tab-kuis-rapor-v1] + kolom kuis & PR: tab "Kuis" di Kelas & Materi
              //   membaca baris jadwal yang SAMA. Tanpa empat kolom quiz_* + homework
              //   di sini tabnya bakal selalu tampil kosong (halaman detail kelas lolos
              //   cuma karena dia query `select('*')` sendiri).
              .select("id, registration_id, scheduled_at, duration_minutes, status, session_number, session_title, material_notes, material_links, attendance_status, recording_url, notes, quiz_score, quiz_max, quiz_source, quiz_submission_id, homework")
              .in("registration_id", regIds)
              .order("scheduled_at", { ascending: true })
          : Promise.resolve({ data: null } as any),
        supabase
          .from("student_badges")
          .select("*")
          .eq("student_id", studentData.id)
          .order("earned_at", { ascending: false }),
        regIds.length > 0
          ? supabase
              .from("schedules")
              .select("scheduled_at")
              .in("registration_id", regIds)
              .eq("status", "completed")
              .order("scheduled_at", { ascending: false })
          : Promise.resolve({ data: null } as any),
      ]);

      const schedData = schedRes.data || [];
      const badgeData = badgeRes.data || [];
      setAllSchedules(schedData); // jadwal-riwayat-v1
      setBadges(badgeData);

      let weekStreak = 0;
      const streakData = streakRes.data;
      if (streakData && streakData.length > 0) {
        const getWeekNum = (d: Date) => {
          const start = new Date(d.getFullYear(), 0, 1);
          return Math.floor(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
        };
        const weeks = new Set(streakData.map((s: any) => {
          const d = new Date(s.scheduled_at);
          return `${d.getFullYear()}-${getWeekNum(d)}`;
        }));
        const now = new Date();
        for (let i = 0; i <= 52; i++) {
          const checkDate = new Date(now);
          checkDate.setDate(checkDate.getDate() - i * 7);
          const key = `${checkDate.getFullYear()}-${getWeekNum(checkDate)}`;
          if (weeks.has(key)) weekStreak++;
          else break;
        }
        setStreak(weekStreak);
      }

      // Simpan snapshot buat refresh berikutnya (cache-first, tanpa spinner).
      try {
        localStorage.setItem(`linguo_akun_cache_${email}`, JSON.stringify({
          student: { ...studentData, registrations: enrichedRegs },
          schedules: schedData, // jadwal-riwayat-v1 (dulu `upcomingSchedules`)
          badges: badgeData,
          streak: weekStreak,
        }));
      } catch {}
    } catch (err) {
      console.error("Failed to load student data:", err);
    }
    setDataLoading(false);
  }

  // ── Derived Data ─────────────────────────────────────────────────
  // Booking helpers
  async function openBooking(reg: StudentReg) {
    if (!reg.teacher_id) {
      alert("Kelas ini belum punya pengajar ditugaskan. Hubungi admin.");
      return;
    }
    setBookingReg(reg);
    setSelectedSlots(new Set());
    setLoadingSlots(true);
    // Fetch teacher_availability
    const { data: avail } = await supabase
      .from("teacher_availability")
      .select("day_of_week, time_slot")
      .eq("teacher_id", reg.teacher_id);
    setAvailSlots(new Set((avail || []).map((a: any) => `${a.day_of_week}-${a.time_slot}`)));
    // Fetch already-booked schedules in next 14 days (to avoid conflicts)
    const until = new Date(); until.setDate(until.getDate() + 14);
    const { data: booked } = await supabase
      .from("schedules")
      .select("scheduled_at")
      .eq("teacher_id", reg.teacher_id)
      .gte("scheduled_at", new Date().toISOString())
      .lte("scheduled_at", until.toISOString())
      .neq("status", "cancelled");
    setBookedSlots(new Set((booked || []).map((b: any) => new Date(b.scheduled_at).toISOString())));
    setLoadingSlots(false);
  }

  async function submitBooking() {
    if (!bookingReg || selectedSlots.size === 0 || !student) return;
    setBookingSubmit(true);
    try {
      const rows = Array.from(selectedSlots).map((slot) => ({
        registration_id: bookingReg.id,
        teacher_id: bookingReg.teacher_id,
        student_id: student.id,
        scheduled_at: slot,
        duration_minutes: Number(bookingReg.duration) || 60,
        status: "pending",
        student_confirmed: true,
        student_confirmed_at: new Date().toISOString(),
        notes: "Menunggu konfirmasi pengajar",
      }));
      const { data: created, error } = await supabase.from("schedules").insert(rows).select("id, scheduled_at");
      if (error) throw error;
      // [notif-v2] kabari pengajar ada booking baru (bell dashboard pengajar).
      // Lewat RPC notify_user (SECURITY DEFINER) karena RLS notifications menolak
      // insert lintas-user. Gagal kirim tidak boleh membatalkan booking-nya.
      try {
        await Promise.all((created || []).map((row: any) =>
          supabase.rpc("notify_user", {
            p_recipient_id: bookingReg.teacher_id,
            p_user_type: "teacher",
            p_title: "Booking baru menunggu konfirmasi",
            p_body: `${student.name || "Siswa"} booking kelas ${displayLanguage(bookingReg.language)} pada ${new Date(row.scheduled_at).toLocaleString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })} WIB.`,
            p_url: null,
            p_schedule_id: row.id,
          })
        ));
      } catch (e) { console.error("[notif-v2] gagal kirim notif booking ke pengajar:", e); }
      setBookingReg(null);
      setSelectedSlots(new Set());
      alert(`${rows.length} sesi berhasil di-booking! Menunggu konfirmasi pengajar.`);
    } catch (e: any) {
      alert("Gagal: " + e.message);
    }
    setBookingSubmit(false);
  }

  // [akun-split-pending-active-v1] activeRegs = HANYA yang sudah dibayar
  // (payment_status 'Lunas' atau 'Cicilan'). Ini yang masuk "Kelas Live" /
  // UnifiedCourseCard. Yang belum bayar TIDAK pernah masuk sini — mereka ada di
  // pendingRegs (Perlu Perhatian). NB: webhook Xendit cuma set payment_status
  // (bukan status, krn CHECK constraint), makanya filter pakai payment_status.
  const activeRegs = useMemo(() => student?.registrations.filter(r =>
    // [linguo-patch:akun-hide-cancelled-v1] buang reg yang di-Batal-in admin/cron & yang udah diarsip
    r.pipeline_status !== "Batal" && !r.archived_at &&
    (r.payment_status === "Lunas" || r.payment_status === "Cicilan")
  ) || [], [student]);


  // [materi-bahasa-siswa-v1] Bahasa yang BENAR-BENAR diambil siswa (slug kanonik) —
  // dipakai menyaring isi menu "Kelas & Materi" biar tak ada bahasa lain yang nongol.
  // Nilai yang bukan bahasa tunggal ("All Languages", "TBD") jatuh ke null & dibuang.
  const myLanguageSlugs = useMemo(
    () => Array.from(new Set(activeRegs.map((r: any) => languageSlug(r.language)).filter(Boolean) as string[])),
    [activeRegs]
  );

  // Sertifikat diturunkan dari registrasi aktif: 'progress' (used/total) atau 'issued' (used>=total).
  const certs = useMemo<Cert[]>(() => {
    const CEFR_TITLE: Record<string, string> = { A1: "Pemula", A2: "Dasar", B1: "Menengah", B2: "Menengah Atas", C1: "Mahir", C2: "Penutur Ahli" };
    return (activeRegs as any[]).map((r: any) => {
      const total = r.sessions_total || 0;
      const used = r.sessions_used || 0;
      const pct = total > 0 ? Math.min(100, Math.max(0, Math.round((used / total) * 100))) : 0;
      const issued = total > 0 && used >= total;
      const lvl = String(r.level || "A1");
      const base = lvl.split(".")[0].toUpperCase();
      return {
        id: String(r.id),
        language: r.language,
        level: lvl,
        title: CEFR_TITLE[base] || "Program",
        teacher: r?.teachers?.name || "Pengajar Linguo",
        product: r.product || undefined, // [pustaka/sertifikat-filter-v1] dipakai filter Kelas Live vs Belajar Mandiri
        status: issued ? "issued" : "progress",
        pct, used, total,
        date: issued ? new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : undefined,
        hours: issued ? total : undefined,
        idNo: issued ? `LING-${String(r.language || "XX").slice(0, 2).toUpperCase()}-${base}-${String(r.id).replace(/\D/g, "").slice(0, 6).padStart(6, "0")}` : undefined,
      };
    });
  }, [activeRegs]);
  // [akun-split-pending-active-v1] pendingRegs = belum bayar & masih dalam window
  // 24 jam sejak enroll. INI yang dirender di "Perlu Perhatian" (badge Belum Bayar
  // + tombol Bayar + Batalkan). Lewat 24 jam → di-expire effect/cron, hilang dari
  // sini. Tidak pernah bocor ke activeRegs/Kelas Live.
  const pendingRegs = useMemo(() => student?.registrations.filter(r =>
    // [linguo-patch:akun-hide-cancelled-v1] guard sama — jangan tampilin yang dibatalkan/diarsip
    r.pipeline_status !== "Batal" && !r.archived_at &&
    r.status === "Menunggu Pembayaran" &&
    (r.payment_status === "Belum Bayar" || !r.payment_status) &&
    (Date.now() - new Date((r as any).created_at || r.registration_date || Date.now()).getTime()) < 24 * 60 * 60 * 1000
  ) || [], [student]);

  // Group activeRegs by product, priority order: Private -> Reguler -> Kids -> Test Prep -> Other
  const groupedActiveRegs = useMemo(() => {
    const priority = ["Kelas Private", "Kelas Reguler", "Kelas Kids", "English Test Preparation"];
    const groups: { product: string; regs: any[] }[] = [];
    priority.forEach(p => {
      const regs = activeRegs.filter((r: any) => r.product === p);
      if (regs.length > 0) groups.push({ product: p, regs });
    });
    // Add any product not in priority list at the end
    const otherRegs = activeRegs.filter((r: any) => !priority.includes(r.product));
    if (otherRegs.length > 0) groups.push({ product: "Lainnya", regs: otherRegs });
    return groups;
  }, [activeRegs]);
  const showProductGrouping = groupedActiveRegs.length >= 2;

  const totalUsedSessions = useMemo(() => activeRegs.reduce((s, r) => s + (r.sessions_used || 0), 0), [activeRegs]);
  const xp = useMemo(() => calculateXP(totalUsedSessions, streak, badges.length), [totalUsedSessions, streak, badges]);

  const displayName = student?.name || user?.user_metadata?.full_name || "Siswa";
  const firstName = displayName.split(" ")[0];
  const avatarUrl = student?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const openEnrollWizard = () => {
    setEnrollStep(0);
    setEnrollProgram("");
    setEnrollLang("");
    setLangSearch("");
    setEnrollDuration("60");
    setEnrollSchedule({});
    setShowEnroll(true);
  };

  // ═══════════════════════════════════════════════════════════════════
  // ENROLLMENT WIZARD MODAL — 5 Steps
  // ═══════════════════════════════════════════════════════════════════
  // EnrollWizard extracted to top-level component above

  // ═══════════════════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ═══════════════════════════════════════════════════════════════════
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center">
        <Spinner size={160} />
      </div>
    );
  }

  if (!user && !previewMode) {
    return (
      /* [akun-login-redesign-v1] Layout dua panel: sapaan typewriter (kiri) + form login (kanan) */
      <div className="min-h-screen grid lg:grid-cols-2 bg-[#F3F7F5]">
        {/* ── Panel kiri: brand + sapaan multi-bahasa ── */}
        <div className="relative hidden lg:flex flex-col justify-center overflow-hidden bg-gradient-to-br from-[#1A9E9E] via-[#178C8C] to-[#0F6E6E] px-14 py-16 text-white">
          {/* wordmark raksasa di latar */}
          <span className="pointer-events-none select-none absolute -bottom-10 -left-4 text-[13rem] font-black leading-none tracking-tighter text-white/[0.06]">linguo</span>
          {/* aksen cahaya */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10">
            <motion.div whileHover={{ scale: 1.08, rotate: -4 }} transition={{ type: "spring", stiffness: 300 }} className="mb-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/25">
              <MessagesSquare className="h-8 w-8" strokeWidth={2.2} />
            </motion.div>
            <h1 className="text-6xl font-black leading-[1.05] tracking-tight min-h-[1.15em]">
              <GreetingTypewriter />
            </h1>
            <p className="mt-6 max-w-sm text-lg leading-relaxed text-white/80">
              Satu langkah lagi menuju kelasmu. Masuk dan lanjutkan progresmu.
            </p>
          </motion.div>
        </div>

        {/* ── Panel kanan: form login ── */}
        <div className="flex flex-col items-center justify-center px-5 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
            {/* header mini (mobile lebih kentara) */}
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1A9E9E] shadow-lg shadow-teal-200">
                <img src="/images/logo-white.png" alt="Linguo" className="h-6 w-6 object-contain" />
              </div>
              <GreetingTypewriter />
            </div>

            <div className="rounded-3xl bg-white p-7 shadow-xl shadow-teal-900/5 sm:p-8">
              <h2 className="mb-6 text-2xl font-extrabold text-gray-900">Masuk ke Linguo.id</h2>

              {/* [akun-oauth-error-surface-v1] Tampilkan alasan gagal login (bukan diam-diam mantul) */}
              {authError && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] leading-relaxed text-red-700">
                  <p className="font-bold">Login belum berhasil</p>
                  <p className="mt-0.5 text-red-600/90">{authError}</p>
                  <p className="mt-1.5 text-[12px] text-red-500/80">
                    Kalau kamu pakai Safari, coba matikan <b>Cegah pelacakan lintas situs</b> (Setelan → Privasi) atau pakai Chrome, lalu coba lagi. Bisa juga login pakai <b>link email</b> di bawah.
                  </p>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={signInWithGoogle}
                disabled={isSigningIn}
                className="flex h-13 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#1A9E9E] to-[#149090] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-500/25 transition-shadow hover:shadow-xl hover:shadow-teal-500/35 disabled:opacity-50"
              >
                {isSigningIn ? (
                  <div className="h-5 w-5 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                ) : (
                  <>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    </span>
                    Masuk dengan Google
                  </>
                )}
              </motion.button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center text-[11px] font-semibold uppercase tracking-widest"><span className="bg-white px-3 text-gray-400">atau</span></div>
              </div>

              {otpSent ? (
                <div className="space-y-3 text-center"> {/* linguo-patch:akun-otp-login-v1 */}
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-[#1A9E9E]">
                    <Mail className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">Link login terkirim!</p>
                  <p className="text-xs leading-relaxed text-gray-500">
                    Kami kirim link masuk ke <span className="font-medium text-gray-700">{loginEmail}</span>. Buka email, klik link-nya, kamu langsung masuk. Cek juga folder spam ya.
                  </p>
                  <button onClick={() => setOtpSent(false)} className="text-xs font-semibold text-[#1A9E9E] hover:underline">
                    Ganti email / kirim ulang
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && signInWithEmail()}
                    className="h-13 w-full rounded-2xl border border-gray-200 bg-white px-5 py-3.5 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1A9E9E]"
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && signInWithEmail()}
                      className="h-13 w-full rounded-2xl border border-gray-200 bg-white px-5 py-3.5 pr-12 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1A9E9E]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-[#1A9E9E]"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <motion.button
                    whileHover={{ scale: (isSigningIn || !loginEmail || !loginPassword) ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={signInWithEmail}
                    disabled={isSigningIn || !loginEmail || !loginPassword}
                    className="flex h-13 w-full items-center justify-center rounded-2xl border-2 border-[#1A9E9E] bg-white py-3.5 text-sm font-bold text-[#1A9E9E] transition-colors hover:bg-[#1A9E9E] hover:text-white disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300 disabled:hover:bg-white"
                  >
                    {isSigningIn ? <div className="h-4 w-4 rounded-full border-2 border-[#1A9E9E] border-t-transparent animate-spin" /> : "Masuk"}
                  </motion.button>

                  <div className="pt-1 text-center text-[12px] leading-relaxed text-gray-500">
                    Nggak punya / lupa password?{" "}
                    <button onClick={signInWithMagicLink} disabled={isSigningIn || !loginEmail} className="inline-flex items-center gap-1 font-semibold text-[#1A9E9E] hover:underline disabled:text-gray-300 disabled:no-underline">
                      <Mail className="h-3.5 w-3.5" /> Kirim link login
                    </button>
                  </div>
                </div>
              )}

              <p className="mt-5 text-center text-[11px] text-gray-400">Gunakan email yang sama dengan saat mendaftar kelas</p>
            </div>

            <p className="mt-6 text-center text-[13px] text-gray-500">Belum punya akun? <a href="/" className="font-bold text-[#1A9E9E] hover:underline">Daftar kelas dulu</a></p>
            <p className="mt-3 text-center"><a href="/" className="text-[12px] text-gray-400 transition-colors hover:text-gray-600">← Kembali ke Beranda</a></p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Loading
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center">
        <Spinner size={160} />
      </div>
    );
  }

  // [preview-student-v1] preview gagal / id tidak ketemu → pesan sederhana (bukan onboarding)
  if (!student && previewMode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex flex-col items-center justify-center px-4 text-center">
        <p className="text-lg font-bold text-gray-800">Preview siswa tidak ditemukan</p>
        <p className="mt-1 text-sm text-gray-500">Cek kembali link preview-nya.</p>
      </div>
    );
  }

  // No student record
  if (!student) {
    // Show onboarding wizard
    if (showOnboarding) {
      return (
        <OnboardingWizard
          user={user}
          studentId={undefined}
          onDone={async (data) => {
            const isTestPrep = data.program === "English Test Preparation";
            const onbLevel = data.level || (data.exp === "beginner" ? "A1.1" : "TBD");
            const onbName = data.name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Siswa";
            const onbAvatar = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
            try {
              // 1. [onboarding-server-insert-v1] Simpan siswa + registrasi lewat
              //    /api/enroll (service role). SEBELUMNYA di-insert langsung dari
              //    browser dan SELALU ditolak RLS tabel `registrations` ("new row
              //    violates row-level security policy"). Efeknya wizard mentok di
              //    langkah 5 — termasuk tombol "Lihat dashboard dulu", karena dia
              //    memakai handler yang sama.
              const res = await fetch("/api/enroll", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: user?.email,
                  name: onbName,
                  wa_number: data.wa || null, // [linguo-patch:onboarding-wa-step-v1]
                  avatar_url: onbAvatar,
                  product: data.program,
                  language: data.testType || data.lang || null,
                  level: onbLevel,
                  duration: isTestPrep ? "90" : "60",
                  amount: 0,
                  ref_code: getRefCodeFromCookie(), // [linguo-patch:akun-affiliate-capture-v1]
                  birth_date: data.birthdate || null, // [linguo-patch:onboarding-profile-fields-v1]
                  domicile: data.domicile || null,     // [linguo-patch:onboarding-profile-fields-v1]
                  experience: data.exp || null,
                  lead_source: "Onboarding Wizard", // lead CRM dibikin server-side juga
                  pipeline_status: "Aktif",
                }),
              });
              const json = await res.json().catch(() => ({} as any));
              if (!res.ok || !json?.registration?.id) {
                throw new Error(json?.error || `Gagal menyimpan pendaftaran (HTTP ${res.status})`);
              }
              const regRow = { ...json.registration, teachers: null };

              // Baris siswa buat state dashboard — baca ulang (SELECT lolos RLS);
              // kalau gagal, pakai bentuk minimal dari respons API.
              const { data: freshStudent } = await supabase
                .from("students").select("*").eq("id", regRow.student_id).maybeSingle();
              let studentRow: any = freshStudent || {
                id: regRow.student_id,
                name: onbName,
                email: user?.email,
                whatsapp: data.wa || null,
                birth_date: data.birthdate || null,
                domicile: data.domicile || null,
                avatar_url: onbAvatar,
              };

              // [linguo-patch:onboarding-avatar-upload-v1] upload foto custom kalau ada (butuh student.id)
              if (data.avatarFile && studentRow?.id) {
                try {
                  const ext = (data.avatarFile.name.split(".").pop() || "jpg").toLowerCase();
                  const path = `${studentRow.id}/avatar.${ext}`;
                  const { error: upErr } = await supabase.storage
                    .from("student-avatars")
                    .upload(path, data.avatarFile, { upsert: true, cacheControl: "3600", contentType: data.avatarFile.type || "image/jpeg" });
                  if (!upErr) {
                    const { data: pub } = supabase.storage.from("student-avatars").getPublicUrl(path);
                    const publicUrl = pub?.publicUrl ? `${pub.publicUrl}?t=${Date.now()}` : null;
                    if (publicUrl) {
                      await supabase.from("students").update({ avatar_url: publicUrl }).eq("id", studentRow.id);
                      studentRow = { ...studentRow, avatar_url: publicUrl };
                    }
                  }
                } catch (e) { console.warn("Avatar upload non-fatal:", e); }
              }

              // 2. Bersihkan cache wizard, pasang state siswa asli (lewati jalur kartu mock)
              try {
                localStorage.setItem(`linguo_onboarded_${user?.id || user?.email}`, "1");
                localStorage.removeItem(`linguo_wizard_${user?.id || user?.email}`);
              } catch {}

              setStudent({ ...studentRow, registrations: [regRow as any] } as any);
              setShowOnboarding(false);
              setWizardCompleted(false);
              setShowSuccessAnim(true); // [linguo-patch:onboarding-success-lottie-v1]
            } catch (err: any) {
              // [onboarding-fallback-dashboard-v1] Gagal simpan JANGAN mengunci user di
              // wizard: dulu cuma `alert()` lalu balik ke langkah 5 tanpa jalan keluar,
              // jadi "Lihat dashboard dulu" pun tak pernah membuka dashboard. Sekarang
              // pilihannya tetap dibuka lewat kartu pending (mock) + toast penjelasan.
              console.error("Onboarding save failed:", err);
              toast.error("Registrasi belum tersimpan — tim Linguo akan bantu lewat WhatsApp.", {
                description: String(err?.message || "Kesalahan tidak diketahui"),
              });
              setWizardData({ program: data.program, lang: data.lang, testType: data.testType, exp: data.exp });
              setWizardCompleted(true);
              setShowOnboarding(false);
            }
          }}
        />
      );
    }

    // After wizard — inject mock student so full dashboard renders with pending card
    if (wizardCompleted && wizardData) {
      const isTestPrep = wizardData.program === "English Test Preparation";
      const mockReg: StudentReg = {
        id: "pending",
        product: wizardData.program,
        language: wizardData.testType || wizardData.lang || "—",
        level: wizardData.exp === "beginner" ? "A1.1" : "TBD",
        status: "Menunggu Pembayaran",
        sessions_total: 0,
        sessions_used: 0,
        duration: isTestPrep ? "90" : "60",
        total_amount: 0,
        payment_status: "Belum Bayar",
        registration_date: new Date().toISOString(),
        teachers: null,
      };
      const mockStudent: StudentData = {
        id: user?.id || "pending",
        name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Siswa",
        email: user?.email,
        avatar_url: user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture,
        registrations: [mockReg],
      };
      // Inject into state so the full dashboard renders
      if (!student) {
        setStudent(mockStudent);
        return null; // triggers re-render with student set
      }
    }

    // First time / default — show wizard trigger
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex flex-col items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm text-center">
          <div className="mb-4 flex justify-center"><span className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-teal-50 text-teal-600"><Hand className="h-7 w-7" /></span></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Halo, {firstName}!</h2>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">Akunmu sudah siap. Yuk temukan kelas yang paling cocok untukmu!</p>
          <button onClick={() => setShowOnboarding(true)}
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-teal-600 px-6 text-sm font-semibold text-white hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200 w-full justify-center">
            <Sparkles className="h-4 w-4" /> Mulai Onboarding
          </button>
          <button onClick={signOut} className="block mx-auto mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors">Keluar</button>
        </motion.div>
        <EnrollWizard
        showEnroll={showEnroll} setShowEnroll={setShowEnroll}
        enrollStep={enrollStep} setEnrollStep={setEnrollStep}
        enrollProgram={enrollProgram} setEnrollProgram={setEnrollProgram}
        enrollLang={enrollLang} setEnrollLang={setEnrollLang}
        langSearch={langSearch} setLangSearch={setLangSearch}
        enrollDuration={enrollDuration} setEnrollDuration={setEnrollDuration}
        enrollSchedule={enrollSchedule} setEnrollSchedule={setEnrollSchedule}
        student={student} displayName={displayName} user={user} supabase={supabase}
        setStudent={setStudent} openEnrollWizard={openEnrollWizard}
      />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // DASHBOARD — Responsive Desktop + Mobile
  // ═══════════════════════════════════════════════════════════════════
  return (
    <StudentShell active={activeTab} onTabChange={(t) => setActiveTab(t)} firstName={firstName} avatarUrl={avatarUrl} studentId={student?.id} canAccessMateri={canSeeMateri} previewStudentId={previewId}>

      {/* [bug-report-topbar-siswa-v1] dialognya dipasang sekali di akar dashboard */}
      <BugReportDialog open={bugOpen} onClose={() => setBugOpen(false)} />

      {/* [preview-student-v1] banner mode preview POV siswa (read-only) */}
      {previewMode && (
        <div
          className={`sticky top-0 z-[60] flex items-center justify-center gap-2 px-4 py-2 text-center text-[12px] font-semibold text-white ${
            previewExpired ? "bg-[#7F1D1D]" : "bg-[#12172B]"
          }`}
        >
          <span
            className={`inline-flex h-2 w-2 rounded-full ${previewExpired ? "bg-white" : "bg-[#F2CB05]"}`}
          />
          {previewExpired
            ? "Sesi pratinjau sudah habis — layar ini salinan lama & sebagian menu (mis. Grup Kelas) tak muncul. Buka ulang \u201cLihat sebagai siswa\u201d dari dashboard admin."
            : `Preview POV Siswa \u00b7 ${displayName} \u2014 data real, read-only (tanpa login)`}
        </div>
      )}

      {/* ── WA Gate: user lama tanpa nomor WA — [linguo-patch:akun-wa-gate-existing-v1] ── */}
      {!previewMode && student && student.id && student.id !== "pending" && student.id !== user?.id && gateNeedsProfile(student) && (
        <WaGate user={user} student={student} supabase={supabase}
          onSaved={(wa, avatar, name) => setStudent({ ...student, whatsapp: wa || student.whatsapp, name: name || student.name, avatar_url: avatar ?? student.avatar_url } as any)} />
      )}

      {/* ── Onboarding Wizard (first-time users) ──────────────────── */}
      {showOnboarding && (
        <OnboardingWizard
          user={user}
          studentId={student?.id}
          onDone={() => setShowOnboarding(false)}
        />
      )}

      {/* ── Sukses onboarding: Lottie ceklis sebelum dashboard — [linguo-patch:onboarding-success-lottie-v1] ── */}
      {showSuccessAnim && <OnboardingSuccess onClose={() => setShowSuccessAnim(false)} />}

      {/* [shell-mobile-drawer-v1] Header mobile (hamburger + logo + lonceng) sekarang
          dirender oleh StudentShell, jadi SEMUA halaman ber-shell kebagian — dulu cuma
          halaman ini yang punya, sisanya nol navigasi di HP. */}

      {/* ── Content ─────────────────────────────────────────────── */}
      <main className={activeTab === "materi" ? "w-full lg:flex lg:min-h-0 lg:flex-1 lg:flex-col" : activeTab === "beranda" ? "w-full" : activeTab === "sertifikat" ? "w-full px-3 pt-4 sm:px-5" : activeTab === "akun" ? "w-full px-3 pt-4 sm:px-5" : activeTab === "simulasi" ? "mx-auto w-full max-w-[1320px] px-4 sm:px-6 pt-5" : activeTab === "grup" ? "w-full pt-5" : (activeTab === "jadwal" || activeTab === "pustaka") ? "mx-auto w-full max-w-[1320px] px-4 sm:px-6 pt-5 space-y-6" : "mx-auto max-w-6xl px-4 sm:px-6 pt-5 space-y-6"}>
        {/* [akun-tab-swap-nofade-v1] Pindah menu dulu pakai mode="wait": tab lama
            fade-out DULU sampai habis, baru tab baru fade-in dari opacity 0 →
            ada jeda panel kosong ±0.6 detik = kedipan tiap balik ke Beranda.
            Sekarang swap-nya instan (tanpa exit, tanpa initial), jadi menu terasa
            langsung ganti isi. */}
        <AnimatePresence>
          {tabShown("beranda") && (
            <motion.div key="beranda" initial={false} animate={{ opacity: 1 }} style={tabHidden("beranda")}>
              {(() => {
                // ── derived khusus port frame ── (langGlyph dari @/lib/lang-visuals)
                // [linguo-patch:beranda-live-hide-empty-lang-v1] sembunyiin kartu live yang language-nya null/kosong/placeholder
                // (registrasi Private incomplete) — cuma dipakai di seksi "Kelas Live" Beranda, ga ngubah activeRegs global.
                const isValidLiveLang = (lang?: string | null): boolean => {
                  const v = (lang || "").trim().toLowerCase();
                  return v !== "" && v !== "all languages" && v !== "tbd";
                };
                // [akun-split-pending-active-v1] Kelas Live = activeRegs (Lunas/Cicilan) saja.
                // Reg pending (belum bayar) sudah tidak masuk activeRegs, jadi tak perlu lagi
                // filter/countdown pending di sini — cukup buang bahasa yang invalid/placeholder.
                // [beranda-status-badge-v1] kelas selesai/tidak aktif tetap tampil tapi grayscale +
                // badge "Selesai"; yang jalan badge "Aktif". Aktif ditaruh duluan.
                // [beranda-kelas-masih-jalan-v1] `sessions_used` bisa mentok di plafon paket
                // (trigger clamp `sessions_used <= sessions_total`) padahal kelasnya MASIH
                // jalan — akibatnya kartu kelas yang masih punya jadwal ikut terlempar ke
                // Riwayat dan tab "Kelas Live" tampak kosong. Jadwal mendatang = bukti kelas
                // belum selesai, jadi itu yang menang atas hitungan sesi.
                const regPunyaSesiMendatang = new Set(upcomingSchedules.map((s) => s.registration_id));
                const isKelasSelesai = (r: any) => {
                  if (r.archived_at) return true;
                  if (regPunyaSesiMendatang.has(r.id)) return false;
                  const total = r.sessions_total || 0;
                  return total > 0 && (r.sessions_used || 0) >= total;
                };
                // [beranda-riwayat-kelas-v1] pisah kelas aktif vs selesai (riwayat)
                // [produk-digital-bukan-kelas-v1] E-Book & E-Learning tidak ikut ke sini —
                // mereka punya tab sendiri ("Belajar Mandiri") tepat di sebelahnya.
                const liveRegsAll = activeRegs.filter(
                  (r: any) => isValidLiveLang(r.language) && !isProdukDigital(r.product)
                );
                const liveRegs = liveRegsAll.filter((r: any) => !isKelasSelesai(r));
                const riwayatRegs = liveRegsAll.filter((r: any) => isKelasSelesai(r));
                const CARD_BG = ["bg-[#16796E]", "bg-rose-500", "bg-indigo-500", "bg-amber-500", "bg-cyan-600", "bg-violet-500"];
                const teacherMap = new Map<string, { name: string; count: number; langs: Set<string>; avatar_url: string | null }>();
                activeRegs.forEach((r: any) => {
                  // [teacher-avatar-sync-v1] nama + foto dari direktori teachers (fallback embed)
                  const d = r.teacher_id ? teacherDir[r.teacher_id] : undefined;
                  const tn = d?.name || r?.teachers?.name;
                  if (!tn) return;
                  // [teacher-sapaan-v1] kunci map tetap nama lengkap (biar tak ada
                  // dua pengajar beda yang lebur cuma karena panggilannya sama),
                  // yang ditampilkan sapaannya: "Kak Dhani".
                  if (!teacherMap.has(tn)) teacherMap.set(tn, { name: sapaan(tn, d?.title), count: 0, langs: new Set(), avatar_url: null });
                  const t = teacherMap.get(tn)!;
                  t.count += 1;
                  t.langs.add(r.language);
                  if (!t.avatar_url) t.avatar_url = d?.avatar_url || r?.teachers?.avatar_url || null;
                });
                const teacherList = Array.from(teacherMap.values());
                // Inisial avatar diambil dari nama panggilan, bukan sapaannya —
                // "Kak Dhani" jangan jadi "KD".
                const initials = (n: string) => callInitial(n);

                // [beranda-search-live-v1] hasil pencarian header. Cakupannya sengaja
                // dibatasi ke hal yang bisa langsung ditindak dari dashboard: kelas
                // yang dimiliki, pengajar, bahasa di katalog, dan menu.
                const hq = homeQ.trim().toLowerCase();
                type HomeHit = { id: string; kind: string; label: string; sub: string; run: () => void };
                const homeHits: HomeHit[] = [];
                if (hq.length >= 2) {
                  liveRegsAll.forEach((r: any) => {
                    const nm = `${displayLanguage(r.language)} ${r.level || ""}`.toLowerCase();
                    if (nm.includes(hq)) homeHits.push({
                      id: `kelas-${r.id}`, kind: "Kelas",
                      label: `${displayLanguage(r.language)}${r.level ? ` — ${r.level}` : ""}`,
                      sub: PRODUCT_BADGE[r.product]?.label || r.product || "Kelas live",
                      // [materi-tab-kuis-rapor-v1] hasil cari kelas mendarat di tempat yang
                      // sama dengan kartu Beranda: menu "Kelas & Materi", kelas terpilih.
                      run: () => { setMateriSel(r.id); setMateriTab("sesi"); setMateriFilter("all"); setMateriSearch(""); setActiveTab("materi"); },
                    });
                  });
                  teacherList.forEach((t) => {
                    if (t.name.toLowerCase().includes(hq)) homeHits.push({
                      id: `guru-${t.name}`, kind: "Pengajar", label: t.name,
                      sub: `${t.count} kelas · ${Array.from(t.langs).map((l) => displayLanguage(l)).join(", ")}`,
                      run: () => setActiveTab("jadwal"),
                    });
                  });
                  JELAJAHI_LANGS.filter((l) => l.name.toLowerCase().includes(hq)).slice(0, 4).forEach((l) => {
                    homeHits.push({
                      id: `bahasa-${l.slug}`, kind: "Bahasa", label: l.name, sub: "Lihat silabus & daftar kelas",
                      // [beranda-ringkas-v2] blok "Jelajahi Bahasa" sudah tak ada di
                      // beranda → hasil pencarian bahasa langsung buka halaman silabusnya,
                      // bukan menggulir ke elemen yang tidak pernah ke-render.
                      run: () => router.push(`/silabus/${l.slug}`),
                    });
                  });
                  ([
                    { key: "materi", label: "Kelas & Materi" },
                    { key: "jadwal", label: "Jadwal" },
                    { key: "simulasi", label: "Simulasi Tes" },
                    { key: "sertifikat", label: "Sertifikat" },
                    { key: "akun", label: "Pengaturan" },
                  ] as const).filter((m) => m.label.toLowerCase().includes(hq)).forEach((m) => {
                    homeHits.push({
                      id: `menu-${m.key}`, kind: "Menu", label: m.label, sub: "Buka menu",
                      run: () => setActiveTab(m.key as any),
                    });
                  });
                }
                const homeHitsTop = homeHits.slice(0, 8);
                const runHit = (h: HomeHit) => { setHomeQOpen(false); setHomeQ(""); h.run(); };

                // [beranda-onboarding-cta-v1] siswa yang belum punya apa pun dulu disambut
                // banner promo + kotak kosong + 3 tombol yang semuanya "daftar". Sekarang
                // satu langkah berikutnya yang jelas; banner promo turun ke bawah.
                // [produk-digital-bukan-kelas-v1] pembeli e-book/e-learning JELAS sudah
                // punya sesuatu — jangan disambut layar "mulai dari sini" cuma karena
                // kartunya tak lagi menyamar jadi kelas live.
                const belumPunyaApaPun =
                  liveRegsAll.length === 0 && !mandiri && pendingRegs.length === 0 && produkDigital.length === 0;

                // [beranda-layout-v3] Kartu "Sesi berikutnya" dihapus — isinya sudah
                // ada persis di baris pertama "Sesi Mendatang" (jam, pengajar, tombol
                // Masuk Kelas), jadi dulu satu sesi tampil dua kali di layar pertama.
                const sesiMendatangCards = upcomingSchedules.map((s) => {
                  const reg = student?.registrations?.find((r) => r.id === s.registration_id);
                  const tDir = reg?.teacher_id ? teacherDir[reg.teacher_id] : undefined;
                  // [sesi-nomor-sinkron-v1] nomor sesi dari peta terpusat: melanjutkan
                  // hitungan `sessions_used` (kelas lawas sering tak punya baris jadwal
                  // untuk sesi awalnya), dan nomor > plafon paket tetap disembunyikan —
                  // itu sisa presensi kotor (baris sintetis dobel bikin nomor lompat).
                  const nomorSesi = nomorSesiMap.get(s.id) ?? null;
                  return {
                    id: s.id,
                    registrationId: s.registration_id,
                    scheduledAt: s.scheduled_at,
                    // [durasi-paket-v1] durasi paket menang atas baris jadwal (bisa 45 di kelas 60)
                    durationMinutes: Number(reg?.duration) || s.duration_minutes,
                    language: reg?.language ? displayLanguage(reg.language) : "—",
                    level: reg?.level || "",
                    product: reg?.product || "",
                    teacher: sapaan(tDir?.name || (reg as any)?.teachers?.name, tDir?.title || (reg as any)?.teachers?.title),
                    teacherAvatarUrl: tDir?.avatar_url || (reg as any)?.teachers?.avatar_url || null,
                    sessionNumber: nomorSesi,
                    materialTitle: s.session_title || "",
                    status: s.status,
                  };
                });

                return (
                  <div className="flex min-h-[calc(100vh-2rem)] flex-col bg-white lg:block">

                    {/* ════ KOLOM UTAMA (kanan di desktop) ════ */}
                    {/* [beranda-compact-v1] Ritme vertikal dirapatkan (gap-7→gap-5,
                        p-6/lg:p-8 → p-5/lg:p-6): isi beranda banyak, dan jarak antar
                        blok yang lega bikin kartu di bawah "Ringkasan Belajar" nyaris
                        selalu kelewat di layar pertama. */}
                    <section className="order-1 flex min-w-0 flex-col gap-5 bg-[#F5F6F8] p-5 lg:order-2 lg:p-6">

                      {/* top bar: greeting + search (search = stub, lihat catatan) */}
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <h1 className="flex items-center gap-2 text-[24px] font-extrabold leading-tight text-[#12172B] sm:text-[26px]">Halo, {firstName} <motion.span style={{ display: "inline-block", transformOrigin: "75% 75%" }} animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}><Hand className="h-6 w-6 text-[#F2CB05]" strokeWidth={2.2} /></motion.span></h1>
                          <p className="mt-0.5 text-[14px] font-medium text-gray-500">{tt(getGreeting())} — {tt("yuk belajar bahasa hari ini!")}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* [beranda-search-live-v1] cari kelas / pengajar / bahasa / menu */}
                          <div className="relative w-full max-w-[320px] sm:w-[300px]">
                            <label className="flex h-12 items-center gap-2.5 rounded-2xl bg-white px-4 transition focus-within:ring-2 focus-within:ring-[#16796E]/40">
                              <Search className="h-[18px] w-[18px] shrink-0 text-gray-500" />
                              <input
                                type="text"
                                value={homeQ}
                                onChange={(e) => { setHomeQ(e.target.value); setHomeQOpen(true); }}
                                onFocus={() => setHomeQOpen(true)}
                                onBlur={() => window.setTimeout(() => setHomeQOpen(false), 150)}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") { setHomeQOpen(false); (e.target as HTMLInputElement).blur(); }
                                  if (e.key === "Enter" && homeHitsTop[0]) runHit(homeHitsTop[0]);
                                }}
                                placeholder={tt("Cari kelas, pengajar, atau bahasa…")}
                                aria-label={tt("Cari di dashboard")}
                                className="w-full bg-transparent text-[14px] font-medium outline-none placeholder:text-slate-400"
                              />
                              {homeQ && (
                                <button type="button" onClick={() => { setHomeQ(""); setHomeQOpen(false); }} aria-label={tt("Kosongkan pencarian")} className="shrink-0 text-gray-400 transition hover:text-gray-600">
                                  <X className="h-4 w-4" strokeWidth={2.4} />
                                </button>
                              )}
                            </label>
                            {homeQOpen && hq.length >= 2 && (
                              <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-[340px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_24px_60px_-30px_rgba(18,23,43,0.45)]">
                                {homeHitsTop.length > 0 ? homeHitsTop.map((h) => (
                                  <button
                                    key={h.id}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => runHit(h)}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50"
                                  >
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-[13.5px] font-bold text-[#12172B]">{h.label}</span>
                                      <span className="block truncate text-[12px] font-medium text-gray-500">{h.sub}</span>
                                    </span>
                                    <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-gray-500">{h.kind}</span>
                                  </button>
                                )) : (
                                  <p className="px-3 py-6 text-center text-[13px] font-medium text-gray-500">{tt("Ga ada yang cocok sama")} &ldquo;{homeQ}&rdquo;</p>
                                )}
                              </div>
                            )}
                          </div>
                          {/* [ui-lang-switcher-v1] pemilih bahasa antarmuka — kanan atas,
                              persis di kiri lonceng & avatar. */}
                          <UiLangSwitcher />
                          {/* [bug-report-topbar-siswa-v1] Lapor Bug naik ke top bar, sebelah
                              lonceng — persis seperti dashboard pengajar. Sebelumnya tombolnya
                              cuma nangkring di dasar sidebar (desktop) & top bar HP, jadi
                              masukan siswa nyaris tak pernah masuk Bug Tracker.
                              [bug-report-topbar-pratinjau-v1] TETAP hidup di mode pratinjau
                              ("Lihat sebagai siswa"): justru dari POV itulah admin & pengajar
                              menemukan tampilan yang rusak. Pelapornya aman — RPC
                              submit_bug_report meresolve identitas dari akun yang login,
                              bukan dari siswa yang sedang dilihat. */}
                          <div className="hidden md:block">
                            <button
                              onClick={() => setBugOpen(true)}
                              aria-label={tt("Lapor Bug")}
                              title={tt("Lapor Bug")}
                              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#12172B] shadow-[0_10px_30px_-22px_rgba(18,23,43,0.6)] transition hover:text-[#16796E]"
                            >
                              <Bug className="h-[20px] w-[20px]" strokeWidth={2.2} />
                            </button>
                          </div>
                          {student?.id && (
                            <div className="hidden md:block">
                              <NotificationBell variant="topbar" userId={student.id} userType="student" />
                            </div>
                          )}
                          {/* [profil-panel-dicabut-v1] Dulu avatar membuka panel profil kiri
                              (avatar + Bahasa Aktif + Sertifikat CEFR + Jadwal Mendatang).
                              Isinya duplikat: jadwal sudah ada di kolom "Sesi Mendatang" dan
                              sertifikat punya menunya sendiri — panelnya cuma menyempitkan
                              beranda. Sekarang avatar langsung ke menu Pengaturan. */}
                          <button
                            onClick={() => setActiveTab("akun")}
                            aria-label={tt("Buka Pengaturan")}
                            title={tt("Pengaturan")}
                            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_-22px_rgba(18,23,43,0.6)] transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16796E]/40"
                          >
                            {avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={avatarUrl} alt={firstName} className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center bg-white text-[15px] font-extrabold text-[#16796E]">
                                {(firstName || "?").slice(0, 1).toUpperCase()}
                              </span>
                            )}
                          </button>
                        </div>
                      </div>


                      {/* [lanjutkan-belajar-v1] Pintasan ke hal terakhir yang dikerjakan —
                          lintas menu (Belajar Mandiri, E-Book, Lingbook, Watch & Learn).
                          Ditaruh DI ATAS "Kelas Kamu" karena inilah yang menghapus
                          pertanyaan "tadi aku buka dari menu mana ya". Menyembunyikan
                          diri sendiri kalau belum ada riwayat apa pun. */}
                      <LanjutkanBelajar
                        produkDigital={produkDigital}
                        /* [lanjutkan-ebook-buka-langsung-v1] Pindah ke Perpustakaan SAMBIL
                           menitipkan modul mana yang readernya harus terbuka. */
                        onOpenEbook={(purchaseId) => { setBukaEbook(purchaseId); setActiveTab("pustaka"); }}
                      />

                      {/* [beranda-layout-v3] Baris pertama beranda: "Kelas Kamu" (kiri)
                          + "Sesi Mendatang" (kanan). Sebelumnya kartu kelas berdiri
                          sendiri selebar kolom — punya 1 kelas bikin sisa gridnya kosong
                          melompong, sementara daftar sesi terdorong jauh ke bawah lipatan. */}
                      <div className={`grid gap-5 lg:items-start ${sesiMendatangCards.length ? "lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]" : ""}`}>
                        <div className="min-w-0">
                        {/* [beranda-tanpa-tab-mandiri-v1] Tab "Kelas Live" vs "Belajar Mandiri"
                            dicabut — beranda cuma menampilkan kelas live. Materi mandiri
                            (e-learning/LMS) tak lagi punya pintu masuk di dashboard siswa. */}
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-[18px] font-extrabold text-[#12172B]">{tt("Kelas Kamu")}</h2>
                            <div className="flex items-center gap-3">
                              {/* [beranda-riwayat-kelas-v1] toggle Aktif / Riwayat — hanya muncul kalau ada kelas selesai */}
                              {riwayatRegs.length > 0 && (
                                <div className="inline-flex items-center gap-1 rounded-xl bg-white p-1">
                                  {([["aktif", tt("Aktif")], ["riwayat", `${tt("Riwayat")} (${riwayatRegs.length})`]] as const).map(([k, label]) => (
                                    <button
                                      key={k}
                                      onClick={() => setLiveView(k)}
                                      className={`rounded-lg px-3 py-1.5 text-[12px] font-bold transition ${liveView === k ? "bg-[#16796E] text-white" : "text-gray-500 hover:text-[#16796E]"}`}
                                    >
                                      {label}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {liveView === "aktif" && liveRegs.length > 0 && (
                                <button onClick={openEnrollWizard} className="text-[13px] font-bold text-[#16796E] hover:text-[#0F5A52]">+ {tt("Tambah")}</button>
                              )}
                            </div>
                          </div>

                          {/* ── Tab: Kelas Live — dikelompokkan per JENIS KELAS ──
                              [beranda-kelas-seksi-v1] Dulu semua kelas dilempar ke satu
                              grid rata: siswa yang ambil Private + Reguler + Test Prep
                              sekaligus tak bisa membedakan mana yang mana kecuali menebak
                              dari nama pengajar. Sekarang tiap format kelas punya seksi
                              sendiri (judul + jumlah + satu baris penjelasan). Produk yang
                              belum terdaftar di LIVE_SECTION_ORDER tetap tampil — masuk
                              seksi bernama produknya sendiri, di paling bawah. */}
                          {(liveView === "riwayat" ? riwayatRegs.length > 0 : liveRegs.length > 0) ? (
                            (() => {
                              const list = (liveView === "riwayat" ? riwayatRegs : liveRegs) as any[];
                              const groups = new Map<string, any[]>();
                              list.forEach((reg: any) => {
                                const k = normalizeProduct(reg.product);
                                if (!groups.has(k)) groups.set(k, []);
                                groups.get(k)!.push(reg);
                              });
                              const rank = (k: string) => {
                                const i = LIVE_SECTION_ORDER.indexOf(k);
                                return i < 0 ? LIVE_SECTION_ORDER.length : i;
                              };
                              const keys = Array.from(groups.keys()).sort(
                                (a, b) => rank(a) - rank(b) || a.localeCompare(b)
                              );
                              // Warna sampul berputar LINTAS seksi biar dua kartu bersebelahan
                              // (beda seksi) tak kebetulan kembar warnanya.
                              let cardIdx = 0;
                              const renderKelasCard = (reg: any, idx: number) => {
                                const badge = PRODUCT_BADGE[normalizeProduct(reg.product)] || PRODUCT_BADGE["Kelas Private"];
                                const total = reg.sessions_total || 0;
                                // [sesi-nomor-plafon-v1] tampilan sesi di-clamp ke plafon paket —
                                // presensi kotor (baris completed melebihi jatah) jangan bikin
                                // kartu tampil "18/16".
                                const used = total > 0 ? Math.min(reg.sessions_used || 0, total) : (reg.sessions_used || 0);
                                const pct = total > 0 ? Math.min(100, Math.max(0, Math.round((used / total) * 100))) : 0;
                                const bg = CARD_BG[idx % CARD_BG.length];
                                const photo = getLangPhoto(reg.language);
                                const selesai = isKelasSelesai(reg); // [beranda-status-badge-v1]
                                // [teacher-avatar-sync-v1] direktori teachers menang atas embed
                                // (embed bisa berasal dari snapshot lama tanpa avatar_url)
                                const tDir = reg.teacher_id ? teacherDir[reg.teacher_id] : undefined;
                                const tAva = tDir?.avatar_url || reg?.teachers?.avatar_url || null;
                                // [teacher-sapaan-v1] kartu kelas sempit — sapaan + panggilan saja
                                const tName = sapaan(tDir?.name || reg?.teachers?.name, tDir?.title || reg?.teachers?.title) || null;
                                // [elearning-kartu-langsung-youtube-v1] E-Learning yang playlistnya
                                // sudah diisi admin: kartunya jadi tautan LUAR ke playlist itu,
                                // bukan ke halaman detail kelas (di sana tak ada apa-apa buat
                                // produk rekaman — tanpa pengajar & tanpa sesi).
                                const ytLink = linkElearning(reg);
                                const Wrap: any = ytLink ? "a" : Link;
                                const wrapProps: any = ytLink
                                  ? { href: ytLink, target: "_blank", rel: "noopener noreferrer" }
                                  : {
                                      /* [materi-tab-kuis-rapor-v1] Kartu kelas dulu melempar ke halaman
                                         terpisah /akun/kelas/[id] — satu kelas jadi punya dua rumah yang
                                         isinya beda-beda tipis. Sekarang mendarat di menu "Kelas & Materi"
                                         dengan kelas itu TERPILIH, jadi sidebar & daftar kelas tak hilang.
                                         Href-nya tetap URL asli (bukan <button>) supaya Cmd/klik-tengah
                                         "buka di tab baru" tetap jalan — itu sebabnya klik biasa yang
                                         di-preventDefault, bukan tautannya yang dibuang.
                                         [preview-keep-param-v1] `?preview=` WAJIB ikut di mode POV staf:
                                         tanpa itu halaman tujuan kehilangan identitas pratinjau dan
                                         mendarat di gate login (terasa "keluar akun"). */
                                      href: previewId ? `/akun?menu=materi&reg=${reg.id}&preview=${encodeURIComponent(previewId)}` : `/akun?menu=materi&reg=${reg.id}`,
                                      prefetch: true,
                                      onClick: (e: any) => {
                                        // [kelas-detail-resilient-v1] titipan reg dipertahankan — halaman
                                        // detail /akun/kelas/[id] masih hidup (dibuka dari tab baru).
                                        try { sessionStorage.setItem(`linguo_reg_${reg.id}`, JSON.stringify({ ...reg, teachers: { ...(reg.teachers || {}), ...(tDir || {}) } })); } catch {}
                                        if (e?.metaKey || e?.ctrlKey || e?.shiftKey || e?.altKey || e?.button === 1) return;
                                        e?.preventDefault?.();
                                        // filter & pencarian di panel Kelas & Materi ikut direset:
                                        // kalau tidak, kelas yang barusan diklik bisa tersaring keluar
                                        // dari daftar dan panelnya nyangkut di kelas lain.
                                        setMateriSel(reg.id);
                                        setMateriTab("sesi");
                                        setMateriFilter("all");
                                        setMateriSearch("");
                                        setActiveTab("materi");
                                      },
                                    };
                                return (
                                  <Wrap
                                    key={reg.id}
                                    {...wrapProps}
                                    className={`group block rounded-[20px] bg-white p-2.5 text-left transition-transform hover:-translate-y-1 ${selesai ? "opacity-80" : ""}`}
                                  >
                                    {/* [beranda-kartu-foto-poster-v1] Foto dipanjangkan ke bawah dan
                                        identitas kelas (bendera + bahasa/level + pengajar) pindah KE DALAM
                                        foto. Dulu foto cuma strip 96px lalu judul & pengajar numpuk di
                                        bawahnya — kartunya jadi tinggi tapi fotonya nyaris tak kelihatan.
                                        Gradient hitam di bawah wajib: tanpa itu teks putih hilang di atas
                                        sampul yang terang (mis. langit siang). */}
                                    {/* [kartu-hover-artefak-v1] Dulu sampul warna (CARD_BG) ikut kepasang di
                                        belakang foto. Waktu zoom hover balik ke ukuran semula,
                                        pembulatan subpiksel menyisakan garis warna (merah/oranye)
                                        di tepi gambar. Sekarang: warna cuma dipakai kalau tak ada
                                        foto, wadahnya dilapis sendiri (isolate + transform-gpu)
                                        supaya repaint bersih. */}
                                    <div className={`relative isolate flex h-44 items-end overflow-hidden rounded-2xl transform-gpu [backface-visibility:hidden] sm:h-48 xl:h-44 ${photo ? "bg-[#0E1526]" : bg} ${selesai ? "grayscale" : ""}`}>
                                      {photo ? (
                                        <img src={photo} alt={reg.language} className="absolute inset-0 h-full w-full object-cover transform-gpu scale-[1.02] transition-transform duration-300 ease-out [backface-visibility:hidden] group-hover:scale-[1.07]" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                                      ) : (
                                        <>
                                          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[70%] text-[52px] font-extrabold tracking-tight text-white/95 transform-gpu scale-[1.02] transition-transform duration-300 ease-out [backface-visibility:hidden] group-hover:scale-[1.07]">{langGlyph(reg.language)}</span>
                                          <div className="absolute -bottom-5 -right-3 h-20 w-20 rounded-full bg-white/10" />
                                        </>
                                      )}
                                      <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
                                      {/* [beranda-status-badge-v1] badge status di pojok kanan atas */}
                                      {selesai ? (
                                        <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10.5px] font-bold text-gray-500">
                                          <Check className="h-2.5 w-2.5" strokeWidth={3} /> {tt("Selesai")}
                                        </span>
                                      ) : (
                                        <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10.5px] font-bold text-[#16796E]">
                                          <span className="h-1.5 w-1.5 rounded-full bg-[#16796E]" /> {tt("Aktif")}
                                        </span>
                                      )}
                                      <div className="relative w-full p-3">
                                        <div className="flex items-center gap-1.5">
                                          <img src={getFlagUrl(reg.language)} alt="" className="h-3.5 w-3.5 shrink-0 rounded-sm object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                                          <h3 className="truncate text-[15px] font-extrabold leading-tight text-white drop-shadow">{displayLanguage(reg.language)} — {reg.level || "TBD"}</h3>
                                        </div>
                                        {/* [beranda-teacher-avatar-v1] avatar pengajar di card kelas.
                                            [beranda-teacher-avatar-v3] ikut pindah ke dalam foto */}
                                        <div className="mt-1.5 flex items-center gap-1.5">
                                          {tAva ? (
                                            <img src={tAva} alt={tName || ""} className="h-6 w-6 shrink-0 rounded-full bg-white object-cover ring-1 ring-white/50" onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display = "none"; el.nextElementSibling?.classList.remove("hidden"); }} />
                                          ) : null}
                                          <span className={`${tAva ? "hidden" : ""} flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-extrabold text-white`}>{tName ? initials(tName) : "L"}</span>
                                          <p className="truncate text-[12px] font-medium text-white/90 drop-shadow">{tName || badge.label}</p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="px-1.5 pb-1 pt-2.5">
                                      {ytLink ? (
                                        // Bilah progres & hitungan sesi tak ada artinya buat rekaman
                                        // (selalu 0% dan 0/0) — diganti ajakan yang jujur soal
                                        // apa yang terjadi kalau kartunya diketuk.
                                        <div className="flex items-center justify-between text-[11.5px] font-semibold">
                                          <span className="inline-flex items-center gap-1.5 text-[#16796E]">
                                            <Play className="h-3.5 w-3.5" strokeWidth={2.4} /> {tt("Tonton videonya")}
                                          </span>
                                          <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                                        </div>
                                      ) : (
                                        <>
                                          <div className="h-1.5 overflow-hidden rounded-full bg-[#E8EAEE]">
                                            <div className="h-full rounded-full bg-[#16796E]" style={{ width: `${pct}%` }} />
                                          </div>
                                          <div className="mt-2 flex items-center justify-between text-[11.5px] font-semibold">
                                            <span className="text-gray-500">{tt("Selesai")}: <span className="text-[#12172B]">{pct}%</span></span>
                                            <span className="text-gray-500">{tt("Sesi")}: <span className="text-[#12172B]">{used}/{total}</span></span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </Wrap>
                                );
                              };
                              return (
                                <div className="mt-3 flex flex-col gap-6">
                                  {keys.map((key, si) => {
                                    const badge = PRODUCT_BADGE[key];
                                    const SectionIcon = badge?.icon || BookOpen;
                                    const items = groups.get(key)!;
                                    const note = LIVE_SECTION_NOTE[key];
                                    const isLast = si === keys.length - 1;
                                    return (
                                      <section key={key}>
                                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                          <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${badge?.bg || "bg-slate-100"} ${badge?.color || "text-gray-500"}`}>
                                            <SectionIcon className="h-4 w-4" strokeWidth={2.4} />
                                          </span>
                                          <h3 className="text-[15px] font-extrabold text-[#12172B]">{tt(badge?.label || key)}</h3>
                                          <span className="rounded-full bg-[#F5F6F8] px-2 py-0.5 text-[11.5px] font-bold text-gray-500">
                                            {items.length} {tt("kelas")}
                                          </span>
                                          {note && <p className="text-[12px] font-medium text-gray-500">{tt(note)}</p>}
                                        </div>
                                        {/* [beranda-kartu-kompak-v1] 3 kartu per baris mulai lg —
                                            dulu baru 3 kolom di 2xl, jadi di layar laptop kartunya
                                            melebar & tinggi banget (cuma 4 kelas keliatan sekali layar).
                                            [beranda-kartu-kompak-v2] Di layar lebar jadi 4 per baris:
                                            siswa dengan 5+ kelas dulu harus scroll dua baris penuh
                                            padahal separuh lebar layar cuma jadi ruang kosong. */}
                                        <div className={`mt-3 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 ${sesiMendatangCards.length ? "2xl:grid-cols-4" : "xl:grid-cols-4"}`}>
                                          {items.map((reg: any) => renderKelasCard(reg, cardIdx++))}
                                          {/* [beranda-riwayat-kelas-v1] kartu "Tambah Kelas" cuma di
                                              view Aktif — ditaruh di seksi terakhir supaya cuma muncul
                                              sekali, bukan berulang di tiap jenis kelas. */}
                                          {liveView === "aktif" && isLast && (
                                            <button
                                              onClick={openEnrollWizard}
                                              className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-[20px] bg-gray-50 p-4 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#16796E]"
                                            >
                                              <Plus className="h-6 w-6" strokeWidth={2} />
                                              <span className="text-[12.5px] font-semibold">{tt("Tambah Kelas")}</span>
                                            </button>
                                          )}
                                        </div>
                                      </section>
                                    );
                                  })}
                                </div>
                              );
                            })()
                          ) : liveView === "riwayat" ? (
                            <div className="mt-3 rounded-3xl bg-white p-8 text-center">
                              <BookOpen className="mx-auto mb-2 h-12 w-12 text-slate-300" strokeWidth={1.5} />
                              <h3 className="mb-1 font-bold text-[#12172B]">{tt("Belum ada riwayat kelas")}</h3>
                              <p className="text-sm text-gray-500">{tt("Kelas yang sudah selesai akan muncul di sini.")}</p>
                            </div>
                          ) : (
                            <div className="mt-3 rounded-3xl bg-white p-8 text-center">
                              <BookOpen className="mx-auto mb-2 h-12 w-12 text-slate-300" strokeWidth={1.5} />
                              <h3 className="mb-1 font-bold text-[#12172B]">{tt("Belum ada kelas live aktif")}</h3>
                              <p className="mb-4 text-sm text-gray-500">{tt("Mulai belajar bahasa baru sekarang!")}</p>
                              {/* [beranda-onboarding-cta-v1] kalau kartu "Mulai dari sini" udah tampil di
                                  atas, tombol di sini diturunkan jadi sekunder — biar ga 2 CTA primer
                                  dgn tujuan sama saling rebutan di satu layar. */}
                              <button onClick={openEnrollWizard} className={`inline-flex h-11 items-center gap-2 rounded-2xl px-6 text-sm font-bold transition-colors ${belumPunyaApaPun ? "border border-slate-200 bg-white text-[#12172B] hover:border-[#16796E] hover:text-[#16796E]" : "bg-[#16796E] text-white hover:bg-[#0F5A52]"}`}><Plus className="h-4 w-4" strokeWidth={2.5} /> {tt("Daftar Kelas")}</button>
                            </div>
                          )}
                        </div>
                        </div>

                        {/* jadwal-gcal-v1: SESI MENDATANG — pindahan dari kolom kiri kalender
                            di tab Jadwal. Di sana daftar ini memaksa kalender berbagi lebar;
                            di sini dia jadi ringkasan harian, dan kalendernya dapat layar penuh. */}
                        {sesiMendatangCards.length > 0 && (
                          <SesiMendatangCard
                            sessions={sesiMendatangCards}
                            studentName={student?.name || undefined}
                            onOpenJadwal={() => setActiveTab("jadwal")}
                            layout="column"
                            limit={5}
                          />
                        )}
                      </div>

                      {/* [beranda-insights-v1] Ringkasan belajar — progres 4 skill + selisih
                          dari rapor terakhir, PR yang belum disetor, materi terbaru, beban
                          minggu ini, dan peringkat kelas grup. Semuanya dulu terkubur di
                          detail kelas (2–3 klik); sekarang naik ke layar pertama.
                          Komponennya menyembunyikan diri sendiri kalau datanya kosong. */}
                      {/* [beranda-kosakata-dihapus-v1] Kartu "Kosakata Saya" dicabut dari
                          Beranda (dulu aside kolom kanan + versi berdiri sendiri saat
                          belum ada kelas). Halaman /kosakata & menu sidebarnya tetap. */}
                      {liveRegsAll.length > 0 && (
                        <BerandaInsights
                          regs={liveRegsAll}
                          studentName={student?.name || firstName || "Siswa"}
                          displayLanguage={displayLanguage}
                          previewStudentId={previewId}
                        />
                      )}

                      {/* [beranda-onboarding-cta-v1] satu langkah berikutnya buat siswa baru,
                          gantinya banner promo + 3 CTA rebutan yang dulu jadi layar pertama. */}
                      {belumPunyaApaPun && (
                        <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200 sm:p-7">
                          <h2 className="text-[18px] font-extrabold text-[#12172B]">Mulai dari sini</h2>
                          <p className="mt-1 text-[13.5px] font-medium text-gray-500">Tiga langkah, sepuluh menit — habis itu kamu udah punya kelas.</p>
                          <ol className="mt-5 grid gap-3 sm:grid-cols-3">
                            {([
                              { n: 1, t: "Tes penempatan gratis", d: "Biar level kamu pas, ga ketinggian atau kerendahan.", cta: "Mulai tes", run: () => setShowPlacementPicker(true) },
                              // [beranda-ringkas-v2] katalog bahasa pindah sepenuhnya ke /silabus.
                              { n: 2, t: "Pilih bahasa & lihat silabus", d: "60+ bahasa, CEFR A1–B2, materi per sublevel.", cta: "Jelajahi bahasa", run: () => router.push("/silabus") },
                              { n: 3, t: "Daftar kelas", d: "Private, Semi-Private, Reguler, atau belajar mandiri.", cta: "Daftar sekarang", run: openEnrollWizard },
                            ] as const).map((s) => (
                              <li key={s.n} className="flex flex-col rounded-2xl bg-slate-50 p-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16796E] text-[13px] font-extrabold text-white">{s.n}</span>
                                <span className="mt-3 text-[14.5px] font-extrabold leading-snug text-[#12172B]">{s.t}</span>
                                <span className="mt-1 flex-1 text-[12.5px] font-medium leading-relaxed text-gray-500">{s.d}</span>
                                <button onClick={s.run} className="mt-3 inline-flex items-center gap-1 self-start text-[12.5px] font-bold text-[#16796E] transition hover:text-[#0F5A52]">
                                  {s.cta} <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Perlu Perhatian — kartu poster (foto bahasa penuh, sama dgn kartu
                          kelas aktif), klik -> PaymentDetailModal */}
                      {pendingRegs.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="inline-flex items-center gap-2 text-[18px] font-extrabold text-[#12172B]">
                              <Clock className="h-5 w-5 text-amber-500" strokeWidth={2.5} />
                              {tt("Perlu Perhatian")}
                            </h2>
                            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-100 px-1.5 text-[11px] font-bold text-amber-700">
                              {pendingRegs.length}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                            {pendingRegs.map((reg: any) => {
                              const photo = getLangPhoto(reg.language);
                              return (
                              <div
                                key={reg.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setPendingModalReg(reg)}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPendingModalReg(reg); } }}
                                className="group cursor-pointer rounded-[20px] bg-white p-2.5 text-left ring-1 ring-amber-200 transition-transform hover:-translate-y-1"
                              >
                                {/* [beranda-kartu-pending-poster-v1] Sampul disamakan dgn kartu kelas
                                    aktif: foto poster tinggi (h-44/48) + identitas kelas MASUK ke dalam
                                    foto. Dulu strip 128px + judul di bawahnya bikin foto bahasanya
                                    nyaris tak kelihatan, dan dua kartu di beranda kelihatan beda produk
                                    padahal isinya sama-sama kelas. */}
                                <div className={`relative isolate flex h-44 items-end overflow-hidden rounded-2xl transform-gpu [backface-visibility:hidden] sm:h-48 ${photo ? "bg-[#0E1526]" : "bg-amber-400"}`}>
                                  {photo ? (
                                    <img src={photo} alt={reg.language} className="absolute inset-0 h-full w-full object-cover transform-gpu scale-[1.02] transition-transform duration-300 ease-out [backface-visibility:hidden] group-hover:scale-[1.07]" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                                  ) : (
                                    <>
                                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[70%] text-[52px] font-extrabold tracking-tight text-white/95 transform-gpu scale-[1.02] transition-transform duration-300 ease-out [backface-visibility:hidden] group-hover:scale-[1.07]">{langGlyph(reg.language)}</span>
                                      <div className="absolute -bottom-5 -right-3 h-20 w-20 rounded-full bg-white/10" />
                                    </>
                                  )}
                                  <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
                                  <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10.5px] font-bold text-amber-700">
                                    <Clock className="h-2.5 w-2.5" strokeWidth={3} /> {tt("Belum Bayar")}
                                  </span>
                                  <div className="relative w-full p-3">
                                    <div className="flex items-center gap-1.5">
                                      <img src={getFlagUrl(reg.language)} alt="" className="h-3.5 w-3.5 shrink-0 rounded-sm object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                                      <h3 className="truncate text-[15px] font-extrabold leading-tight text-white drop-shadow">{displayLanguage(reg.language)} — {reg.level || "TBD"}</h3>
                                    </div>
                                    <p className="mt-1.5 truncate text-[12px] font-medium text-white/90 drop-shadow">{tt(PRODUCT_BADGE[normalizeProduct(reg.product)]?.label || reg.product)}</p>
                                  </div>
                                </div>
                                <div className="px-1.5 pb-1 pt-2.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[13px] font-extrabold text-amber-700">{reg.total_amount > 0 ? `Rp ${Number(reg.total_amount).toLocaleString("id-ID")}` : tt("Lihat detail")}</span>
                                    <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#16796E]">{tt("Bayar")} <ChevronRight className="h-3.5 w-3.5" /></span>
                                  </div>
                                  {/* [akun-cancel-enrollment-v1] siswa batalin sendiri — CUMA yang belum bayar.
                                      Buka overlay konfirmasi → /api/cancel-enrollment (lead + delete via service role). */}
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setCancelTarget(reg); }}
                                    className="mt-2.5 w-full rounded-xl bg-slate-50 py-2 text-[12px] font-bold text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                                  >
                                    {tt("Batalkan pendaftaran")}
                                  </button>
                                </div>
                              </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* [beranda-ringkas-v1] Kartu "Pengajar Kamu" & banner "Pilihan Tepat
                          untuk Naik Level" DIHAPUS atas permintaan: nama pengajar sudah
                          nempel di kartu kelas & jadwal, dan banner upsell bikin beranda
                          panjang tanpa menjawab pertanyaan siswa. Pendaftaran kelas baru
                          tetap bisa lewat "Jelajahi Bahasa" di bawah. */}

                      {/* [beranda-ringkas-v2] Blok "Jelajahi Bahasa" (grid katalog +
                          kartu detail sublevel CEFR) DIHAPUS dari beranda atas permintaan.
                          Katalog lengkapnya tetap hidup di /silabus — tautannya di bawah. */}
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-[13px] font-medium text-gray-500">
                        <a href="/silabus" className="inline-flex items-center gap-1.5 transition-colors hover:text-[#16796E]"><Globe className="h-4 w-4" strokeWidth={2} />{tt("Semua Silabus (60+ Bahasa)")}</a>
                        <a href="/blog" className="inline-flex items-center gap-1.5 transition-colors hover:text-[#16796E]"><Newspaper className="h-4 w-4" strokeWidth={2} />{tt("Blog & Tips Belajar")}</a>
                      </div>


                    </section>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {tabShown("jadwal") && (
            <motion.div key="jadwal" initial={false} animate={{ opacity: 1 }} className="w-full" style={tabHidden("jadwal")}>
              {/* linguo-patch:akun-jadwal-tab-v1 — kalender LMS, data real dari upcomingSchedules */}
              {(() => {
                // jadwal-riwayat-v1: kalender pakai `allSchedules` (riwayat + mendatang),
                // bukan `upcomingSchedules` — itu sebabnya bulan berjalan dulu tampak kosong.
                const jadwalSessions = allSchedules.map((s: any) => {
                  const reg = student?.registrations.find((r: any) => r.id === s.registration_id);
                  // [jadwal-teacher-avatar-v1] direktori `teachers` menang atas embed
                  // registrasi (embed bisa dari cache lama yang belum punya foto).
                  const tDir = reg?.teacher_id ? teacherDir[reg.teacher_id] : undefined;
                  return {
                    id: s.id,
                    registrationId: s.registration_id,
                    scheduledAt: s.scheduled_at,
                    // [durasi-paket-v1] durasi paket menang atas baris jadwal (bisa 45 di kelas 60)
                    durationMinutes: Number(reg?.duration) || s.duration_minutes,
                    language: reg?.language || "—",
                    level: reg?.level || "",
                    product: reg?.product || "",
                    teacher: sapaan(tDir?.name || reg?.teachers?.name, tDir?.title || (reg?.teachers as any)?.title),
                    teacherAvatarUrl: tDir?.avatar_url || reg?.teachers?.avatar_url || null,
                    // jadwal-recurring-materi-v1
                    // [sesi-nomor-sinkron-v1] satu sumber nomor dengan kartu Beranda &
                    // linimasa detail kelas; nomor > plafon paket tetap disembunyikan.
                    sessionNumber: nomorSesiMap.get(s.id) ?? null,
                    materialTitle: s.session_title || "",
                    materialNotes: s.material_notes || "",
                    materialLinks: Array.isArray(s.material_links) ? s.material_links : [],
                    // jadwal-riwayat-v1
                    status: s.status,
                    attendanceStatus: s.attendance_status ?? null,
                    recordingUrl: s.recording_url ?? null,
                    // [jadwal-hantu-hidden-v1] kalender yang memutuskan baris presensi
                    // sintetis tak usah digambar (tapi tetap dihitung "sudah lewat").
                    notes: s.notes ?? null,
                  };
                });
                // jadwal-gcal-v1: kartu rekap per kelas ("Sesi 5 dari 16" + progress bar)
                // DIBUANG dari tab Jadwal — angkanya sudah ada di kartu kelas Beranda,
                // di sini cuma mendorong kalender ke bawah lipatan.
                /* [jadwal-batch-kalender-v1] Kelas grup (Reguler & English Test Preparation)
                   tak punya baris `schedules`, jadi kalender siswa selalu kosong di jam
                   kelasnya. Pola batch-nya dijabarkan jadi pertemuan semu — hanya untuk
                   kelas yang siswa ini memang terdaftar di dalamnya. */
                const jadwalBatchSessions = activeRegs.flatMap((r: any) => {
                  const b = r.batch, tp = r.testPrepBatch;
                  const src = b
                    ? {
                        kind: "reguler" as const,
                        id: b.id,
                        label: [b.batch_code || "Kelas Reguler", b.level].filter(Boolean).join(" · "),
                        days: b.session_day, time: b.session_start_time,
                        startDate: b.start_date, endDate: b.end_date,
                        totalSessions: b.total_sessions, duration: b.session_duration_min,
                        language: b.language || r.language, level: b.level || r.level,
                        ended: ["Ended", "Cancelled"].includes(String(b.status || "")),
                      }
                    : tp
                    ? {
                        kind: "etp" as const,
                        id: tp.id,
                        label: tp.name || `Kelas ${tp.test_type || "ETP"}`,
                        days: tp.schedule_days, time: tp.schedule_time,
                        startDate: tp.start_date, endDate: tp.end_date,
                        totalSessions: tp.sessions_total, duration: tp.duration_minutes,
                        language: `Test Prep - ${tp.test_type || "IELTS"}`, level: tp.level || r.level,
                        ended: !!tp.cancelled_at,
                      }
                    : null;
                  if (!src || src.ended) return [];
                  const tDir = r.teacher_id ? teacherDir[r.teacher_id] : undefined;
                  return batchOccurrences({
                    days: src.days, time: src.time,
                    startDate: src.startDate, endDate: src.endDate, totalSessions: src.totalSessions,
                  }).map((d, i) => ({
                    id: `batch:${src.kind}:${src.id}:${i}`,
                    scheduledAt: d.toISOString(),
                    durationMinutes: Number(src.duration) || 90,
                    language: src.language || "—",
                    level: src.level || "",
                    product: r.product || "",
                    teacher: sapaan(tDir?.name || r?.teachers?.name, tDir?.title || (r?.teachers as any)?.title),
                    teacherAvatarUrl: tDir?.avatar_url || r?.teachers?.avatar_url || null,
                    sessionNumber: i + 1,
                    status: "scheduled",
                    // [jadwal-batch-kalender-v1] penanda: pertemuan turunan pola batch,
                    // bukan baris `schedules` — tombol Masuk Kelas dimatikan (room-nya
                    // dibuat per baris sesi, id semu ini tak punya ruang).
                    isBatch: true,
                    joinUrl: (b?.zoom_link as string | undefined) || null,
                  }));
                });
                const jadwalRegulerBatches = activeRegs
                  .filter((r: any) => r.batch || r.testPrepBatch)
                  .map((r: any) => (r.batch
                    ? {
                        id: r.id,
                        language: r.batch.language || r.language,
                        batchCode: r.batch.batch_code,
                        scheduleDay: r.batch.session_day,
                        scheduleTime: String(r.batch.session_start_time || "").slice(0, 5),
                        zoomLink: r.batch.zoom_link || null,
                      }
                    : {
                        id: r.id,
                        language: `Test Prep - ${r.testPrepBatch.test_type || "IELTS"}`,
                        batchCode: r.testPrepBatch.name,
                        scheduleDay: (r.testPrepBatch.schedule_days || []).join(" & "),
                        scheduleTime: String(r.testPrepBatch.schedule_time || "").slice(0, 5),
                        zoomLink: null,
                      }));
                return <JadwalCalendar sessions={[...jadwalSessions, ...jadwalBatchSessions]} regularBatches={jadwalRegulerBatches} studentName={student?.name || undefined} />;
              })()}
            </motion.div>
          )}

          {tabShown("materi") && canSeeMateri && (
            <motion.div key="materi" initial={false} animate={{ opacity: 1 }} className="w-full lg:flex lg:min-h-0 lg:flex-1 lg:flex-col" style={tabHidden("materi")}>
              {(() => {
                /* [materi-flag-pie-v1] Ubin huruf ("Я", "あ", "Aa") diganti bendera
                   rounded-rectangle: satu siluet dengan bendera di silabus & placement,
                   dan huruf "Aa" untuk bahasa Latin sama sekali tak menandakan bahasa apa. */
                const langFlagSlug = (lang: string) =>
                  languageSlug(lang) || baseLanguage(lang).toLowerCase().replace(/\s+/g, "-");
                /* [materi-sapaan-v1] di layar siswa pengajar dipanggil "Kak Dhani",
                   bukan nama lengkap seperti di database. Gelar/nama panjang bikin
                   baris kartu kepotong. */
                const teacherLabel = (r: any) => {
                  const d = r?.teacher_id ? teacherDir[r.teacher_id] : undefined;
                  const nm = d?.name || r?.teachers?.name;
                  return nm ? sapaan(nm, d?.title) : "";
                };
                /* [materi-flag-pie-v1] Progress jadi donat ber-angka di tengah supaya
                   kartu kelas cukup 2 baris (nama + pengajar) — bilah progres dulu
                   memaksa baris ketiga di tiap kartu. */
                const ProgressPie = ({ pct, size = 42, stroke = 5 }: { pct: number; size?: number; stroke?: number }) => {
                  const rr = (size - stroke) / 2;
                  const keliling = 2 * Math.PI * rr;
                  return (
                    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ height: size, width: size }}>
                      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                        <circle className="materi-pie-track" cx={size / 2} cy={size / 2} r={rr} fill="none" stroke="#DDE1E7" strokeWidth={stroke} />
                        <circle
                          cx={size / 2} cy={size / 2} r={rr} fill="none" stroke="#16796E" strokeWidth={stroke} strokeLinecap="round"
                          strokeDasharray={keliling} strokeDashoffset={keliling * (1 - Math.min(100, Math.max(0, pct)) / 100)}
                        />
                      </svg>
                      <span className="absolute text-[10px] font-extrabold tabular-nums text-[#12172B]">{pct}%</span>
                    </span>
                  );
                };
                const PAL = [
                  { color: "#16796E", tintBg: "bg-[#16796E]/10", tintText: "text-[#16796E]" },
                  { color: "#E11D48", tintBg: "bg-rose-50", tintText: "text-rose-500" },
                  { color: "#4F46E5", tintBg: "bg-indigo-50", tintText: "text-indigo-500" },
                  { color: "#D97706", tintBg: "bg-amber-50", tintText: "text-amber-600" },
                  { color: "#0891B2", tintBg: "bg-cyan-50", tintText: "text-cyan-600" },
                  { color: "#7C3AED", tintBg: "bg-violet-50", tintText: "text-violet-500" },
                ];
                /* [materi-bahasa-siswa-v1] Daftar kelas di menu materi = SEMUA kelas
                   berbayar milik siswa.
                   - Baris placeholder ("All Languages", "TBD", bahasa kosong) dibuang —
                     itu paket, bukan bahasa. Nama bahasa yang belum punya silabus
                     (mis. "Sign Language") TETAP tampil: itu kelas miliknya, cuma
                     panel silabusnya yang bilang "belum tersedia".
                   - Kelas yang paketnya habis (status "Non Aktif") ikut ditampilkan,
                     diurutkan setelah yang masih berjalan. Materinya tetap punya siswa,
                     dan tanpa ini chip filter "Selesai" mustahil punya isi. */
                const isPlaceholderLang = (lang?: string | null) => {
                  const v = (lang || "").trim().toLowerCase();
                  return v === "" || v === "all languages" || v === "tbd";
                };
                const liveClassesRaw = activeRegs
                  /* [produk-digital-bukan-kelas-v1] E-Book & E-Learning disaring keluar:
                     sub-tab ini khusus kelas yang punya pengajar & jadwal. Isinya tetap
                     terjangkau — E-Learning di sub-tab "Belajar Mandiri" (sumber datanya
                     myLanguageSlugs, bukan daftar ini), E-Book di menu Perpustakaan. */
                  .filter((r: any) => !isPlaceholderLang(r.language) && !isProdukDigital(r.product));
                const pctOf = (r: any) => {
                  const t = r.sessions_total || 0; const u = r.sessions_used || 0;
                  return t > 0 ? Math.min(100, Math.max(0, Math.round((u / t) * 100))) : 0;
                };
                /* [materi-filter-selesai-v1] Chip "Berjalan"/"Selesai" dulu cuma melihat
                   persentase sesi, jadi kelas yang paketnya SUDAH habis (status "Non Aktif" —
                   dibatalkan, kedaluwarsa, atau ditutup manual dengan sisa sesi hangus)
                   selamanya nyangkut di "Berjalan" walau tak akan pernah dilanjutkan.
                   Akibatnya angka "· N berjalan" di bawah judul (yang memang memakai status)
                   tak pernah cocok dengan isi chip "Berjalan".
                   Sekarang satu definisi dipakai bertiga — chip, angka, dan urutan daftar:
                   selesai = sesi penuh 100% ATAU registrasinya sudah tidak aktif. */
                const isSelesai = (r: any) => {
                  const st = String(r.status || "").trim().toLowerCase();
                  /* "Dorman" = kelas dijeda, BUKAN tamat — dia masih berjalan (kasus nyata:
                     Cantonese A1.1 baru 1/16 sesi). Hanya paket yang benar-benar ditutup
                     yang dihitung selesai. */
                  return pctOf(r) >= 100 || st === "non aktif" || st === "selesai";
                };
                const liveClasses = liveClassesRaw
                  .slice()
                  .sort((a: any, b: any) => (isSelesai(a) ? 1 : 0) - (isSelesai(b) ? 1 : 0));
                // [materi-search-live-v1] chip filter + kotak cari dipakai bareng
                const mq = materiSearch.trim().toLowerCase();
                const matchQ = (r: any) =>
                  !mq ||
                  [displayLanguage(r.language), r.level, r?.teachers?.name, PRODUCT_BADGE[r.product]?.label, r.product]
                    .filter(Boolean)
                    .some((v: string) => String(v).toLowerCase().includes(mq));
                const shown = liveClasses.filter((r: any) => {
                  if (!matchQ(r)) return false;
                  if (materiFilter === "run") return !isSelesai(r);
                  if (materiFilter === "done") return isSelesai(r);
                  return true;
                });
                /* [materi-filter-selesai-v1] Angka di tiap chip. Tanpa ini pindahnya kelas
                   yang tamat ke "Selesai" tak kelihatan sama sekali dari tab "Semua" —
                   kartunya cuma ikut turun ke bawah, persis seperti sebelum ada filter. */
                const chipCount = {
                  all: liveClasses.filter(matchQ).length,
                  run: liveClasses.filter((r: any) => matchQ(r) && !isSelesai(r)).length,
                  done: liveClasses.filter((r: any) => matchQ(r) && isSelesai(r)).length,
                };
                const selected = shown.find((r: any) => r.id === materiSel) || shown[0] || liveClasses[0];
                const palOf = (r: any) => PAL[Math.max(0, liveClasses.findIndex((x: any) => x.id === r.id)) % PAL.length];

                const ClassItem = ({ r, mobile }: { r: any; mobile?: boolean }) => {
                  const pct = pctOf(r); const isSel = selected && r.id === selected.id;
                  /* [materi-paket-detail-v1] Kartu kelas dulu tak menyebut ISI paket sama
                     sekali — donat 88% tak memberi tahu 88% dari berapa sesi, dan durasi
                     per sesi (60/90/120 menit) cuma ada di tab Tagihan. Dua angka itu yang
                     paling sering ditanya siswa, jadi ditaruh langsung di kartunya. */
                  const durasiMenit = String(r.duration ?? "").match(/\d+/)?.[0] || "";
                  const dipakai = r.sessions_used || 0; const totalSesi = r.sessions_total || 0;
                  const detailPaket = [
                    totalSesi > 0 ? `${dipakai}/${totalSesi} sesi` : null,
                    durasiMenit ? `${durasiMenit} menit/sesi` : null,
                  ].filter(Boolean).join(" · ");
                  return (
                    <button
                      onClick={() => { setMateriSel(r.id); setMateriTab("sesi"); }}
                      className={`group flex items-center gap-3 rounded-2xl p-3 text-left transition ${isSel ? "materi-item-sel bg-[#E8EAEE]" : "materi-item bg-white hover:bg-[#F5F6F8]"} ${mobile ? "w-[240px] shrink-0 bg-white" : "w-full"}`}
                    >
                      <LangSlugFlag slug={langFlagSlug(r.language)} h={30} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-extrabold text-[#12172B]">{displayLanguage(r.language)} — {r.level || "TBD"}</span>
                        <span className="block truncate text-[12px] font-medium text-gray-500">{teacherLabel(r) || PRODUCT_BADGE[r.product]?.label || r.product}</span>
                        {detailPaket ? (
                          <span className="mt-0.5 block truncate text-[11px] font-semibold text-gray-400">{detailPaket}</span>
                        ) : null}
                      </span>
                      <ProgressPie pct={pct} />
                    </button>
                  );
                };

                /* linguo-patch:materi-frame-design-v1 */
                const MateriTopBar = (
                  <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-6 lg:px-8">
                    <div>
                      <p className="flex items-center gap-1.5 text-[12px] font-bold text-gray-500"><span>{tt("Dashboard")}</span><ChevronRight className="h-3.5 w-3.5" /><span className="text-[#16796E]">{tt("Kelas & Materi")}</span></p>
                      <h1 className="mt-1 text-[24px] font-extrabold leading-tight text-[#12172B]">{tt("Kelas & Materi")}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* [materi-search-live-v1] kotak cari ini dulu nol fungsi: nilainya disimpan
                          ke state tapi tidak dipakai menyaring apa pun. Sekarang benar-benar
                          menyaring daftar kelas (view Live) / daftar bahasa (view Mandiri). */}
                      <label className="materi-panel flex h-11 w-[240px] max-w-[40vw] items-center gap-2.5 rounded-2xl bg-white px-4 transition">
                        <Search className="h-[18px] w-[18px] shrink-0 text-gray-400" strokeWidth={2} />
                        <input
                          value={materiSearch}
                          onChange={(e) => setMateriSearch(e.target.value)}
                          placeholder={tt("Cari kelas, pengajar, atau bahasa…")}
                          className="w-full bg-transparent text-[13px] font-medium outline-none placeholder:text-slate-400"
                        />
                        {materiSearch ? (
                          <button onClick={() => setMateriSearch("")} aria-label={tt("Hapus pencarian")} className="shrink-0 text-gray-400 transition hover:text-[#12172B]">
                            <X className="h-4 w-4" strokeWidth={2.4} />
                          </button>
                        ) : null}
                      </label>
                      {/* [materi-bell-real-v1] dulu lonceng hiasan dengan titik merah permanen —
                          selalu "ada notifikasi baru", padahal tidak nyambung ke mana-mana. */}
                      {student?.id ? <NotificationBell userId={student.id} userType="student" /> : null}
                    </div>
                  </div>
                );

                return (
                  <div className="flex flex-col gap-5 p-4 lg:min-h-0 lg:flex-1 lg:gap-0 lg:p-0">
                    {/* [linguo-patch:materi-frame-ref-v1] wrapper isi penuh canvas (no padding di lg) */}
                    {/* ════ VIEW: KELAS LIVE ════ */}
                    {liveClasses.length > 0 && selected ? (
                      <div className="materi-flat overflow-hidden rounded-3xl bg-white lg:grid lg:grid-rows-1 lg:grid-cols-[276px_minmax(0,1fr)] lg:min-h-0 xl:grid-cols-[320px_minmax(0,1fr)] lg:flex-1 lg:rounded-none lg:border-0 lg:shadow-none">

                        {/* LEFT list — desktop */}
                        <aside className="materi-flat hidden min-h-0 flex-col border-r border-slate-100 bg-white lg:flex">
                          <div className="shrink-0 px-6 pb-4 pt-7">
                            <h2 className="text-[18px] font-extrabold text-[#12172B]">{tt("Kelas Kamu")}</h2>
                            {/* [materi-bahasa-siswa-v1] daftar ini kini memuat kelas selesai juga,
                                jadi jangan lagi menyebut semuanya "aktif". */}
                            <p className="mt-0.5 text-[12px] font-medium text-gray-500">
                              {liveClasses.length} kelas
                              {(() => {
                                const jalan = liveClasses.filter((r: any) => !isSelesai(r)).length;
                                return jalan < liveClasses.length ? ` · ${jalan} berjalan` : "";
                              })()}
                            </p>
                            <div className="mt-4 flex gap-2">
                              {([["all", tt("Semua")], ["run", tt("Berjalan")], ["done", tt("Selesai")]] as const).map(([k, label]) => (
                                <button key={k} onClick={() => setMateriFilter(k)} className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-bold transition ${materiFilter === k ? "bg-[#16796E] text-white" : "bg-[#F5F6F8] text-gray-500 hover:text-[#12172B]"}`}>
                                  {label}
                                  <span className={`tabular-nums ${materiFilter === k ? "text-white/70" : "text-gray-400"}`}>{chipCount[k]}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2.5 overflow-y-auto px-4 pb-6">
                            {shown.length > 0 ? shown.map((r: any, i: number) => (
                              <Fragment key={r.id}>
                                {/* [materi-filter-selesai-v1] Di tab "Semua", kelas yang tamat
                                    dipisah pakai judul kecil — supaya jelas dia sudah pindah
                                    kelompok, bukan sekadar kebetulan ada di urutan bawah. */}
                                {materiFilter === "all" && isSelesai(r) && (i === 0 || !isSelesai(shown[i - 1])) ? (
                                  <p className="mt-1.5 px-2 pb-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">{tt("Selesai")}</p>
                                ) : null}
                                <ClassItem r={r} />
                              </Fragment>
                            )) : (
                              <p className="px-2 py-6 text-center text-[13px] font-medium text-gray-400">{tt("Tidak ada kelas di filter ini")}</p>
                            )}
                          </div>
                        </aside>

                        {/* RIGHT detail (+ mobile pills) */}
                        <main className="materi-flat flex min-w-0 flex-col bg-[#F5F6F8] lg:min-h-0 lg:overflow-y-auto">
                          {MateriTopBar}
                          <div className="flex gap-2.5 overflow-x-auto px-5 pt-3 lg:hidden">
                            {shown.map((r: any) => <ClassItem key={r.id} r={r} mobile />)}
                          </div>

                          <div className="flex flex-col gap-6 px-5 pb-5 pt-4 lg:px-7 lg:pb-7">
                            {/* hero */}
                            {(() => {
                              const pal = palOf(selected); const pct = pctOf(selected);
                              const badge = PRODUCT_BADGE[selected.product] || PRODUCT_BADGE["Kelas Private"];
                              const langPhoto = getLangPhoto(selected.language);
                              const nextSched = upcomingSchedules.find((s) => s.registration_id === selected.id);
                              const nextLabel = nextSched
                                ? new Date(nextSched.scheduled_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) + " · " + new Date(nextSched.scheduled_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                                : tt("Belum terjadwal");
                              return (
                                <div className="materi-panel overflow-hidden rounded-3xl bg-white">
                                  <div className="relative flex items-center gap-5 overflow-hidden px-6 py-6 sm:px-7" style={{ background: pal.color }}>
                                    {langPhoto && (
                                      <>
                                        <img src={langPhoto} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                                        <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(105deg, rgba(15,71,65,0.88) 0%, rgba(22,121,110,0.66) 46%, rgba(22,121,110,0.28) 100%)" }} />
                                      </>
                                    )}
                                    {/* [materi-flag-pie-v1] ubin huruf diganti bendera, sama seperti daftar kelas di kiri */}
                                    <span className="relative z-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                                      <LangSlugFlag slug={langFlagSlug(selected.language)} h={40} />
                                    </span>
                                    <div className="relative z-10 min-w-0 flex-1 text-white">
                                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold">{tt(badge.label)}</span>
                                      <h2 className="mt-2 text-[22px] font-extrabold leading-tight">{displayLanguage(selected.language)} — {selected.level || "TBD"}</h2>
                                      <p className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-white/85"><User className="h-4 w-4" strokeWidth={2.5} />{tt("Pengajar")}: {teacherLabel(selected) || tt("Belum ditentukan")}</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-4 px-6 py-5 sm:px-7">
                                    <div>
                                      <p className="text-[12px] font-semibold text-gray-500">{tt("Progress")}</p>
                                      {/* [materi-flag-pie-v1] bilah progres → donat, sebentuk dengan kartu kelas */}
                                      <div className="mt-1.5 flex items-center gap-2.5">
                                        <ProgressPie pct={pct} size={44} stroke={6} />
                                        <span className="text-[12px] font-medium text-gray-500">{pct >= 100 ? tt("Kelas selesai") : tt("Sedang berjalan")}</span>
                                      </div>
                                    </div>
                                    <div className="border-l border-slate-100 pl-4">
                                      <p className="text-[12px] font-semibold text-gray-500">{tt("Sesi Selesai")}</p>
                                      <p className="mt-1 text-[18px] font-extrabold text-[#12172B]">{selected.sessions_used || 0}<span className="text-[14px] font-bold text-gray-400">/{selected.sessions_total || 0}</span></p>
                                      {/* [materi-paket-detail-v1] durasi per sesi tadinya cuma ada di tab Tagihan */}
                                      {(() => {
                                        const m = String(selected.duration ?? "").match(/\d+/)?.[0];
                                        return m ? <p className="mt-0.5 text-[11px] font-semibold text-gray-400">{m} {tt("menit/sesi")}</p> : null;
                                      })()}
                                    </div>
                                    <div className="border-l border-slate-100 pl-4">
                                      <p className="text-[12px] font-semibold text-gray-500">{tt("Sesi Berikutnya")}</p>
                                      <p className="mt-1.5 text-[13px] font-bold leading-tight text-[#12172B]">{nextLabel}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* tabs */}
                            {/* [materi-tab-kuis-rapor-v1] Kuis & Rapor ikut ke sini — dulu cuma
                                bisa dilihat dari halaman detail kelas, sekarang satu kelas =
                                satu tempat. Bisa digulir di layar sempit (4 tab tak muat di HP). */}
                            <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
                              {([
                                ["sesi", tt("Sesi & Rekaman"), Video],
                                ["materi", tt("Materi"), BookOpen],
                                ["kuis", tt("Kuis"), ClipboardCheck],
                                ["rapor", tt("Rapor"), BarChart2],
                              ] as const).map(([k, label, Icon]) => (
                                <button
                                  key={k}
                                  onClick={() => setMateriTab(k)}
                                  className={`flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-[13px] font-bold transition ${materiTab === k ? "bg-[#16796E] text-white" : "materi-panel bg-white text-gray-500 hover:text-[#12172B]"}`}
                                >
                                  <Icon className="h-4 w-4" strokeWidth={2.5} />{label}
                                </button>
                              ))}
                            </div>

                            {/* body */}
                            {/* [materi-sesi-timeline-v1] Dua tab ini dulu buta riwayat: "Sesi & Rekaman"
                                cuma memuat sesi MENDATANG (kelas 16/16 tampil kosong padahal semua
                                rekamannya ada), dan "Materi" cuma silabus level tanpa jalan ke materi
                                sesi tertentu. Sekarang dua-duanya linimasa sesi bernomor, terbaru di atas. */}
                            {materiTab === "sesi" ? (
                              <SesiTimeline reg={selected} schedules={jadwalNyata.filter((s) => s.registration_id === selected.id)} variant="sesi" />
                            ) : materiTab === "kuis" ? (
                              /* [materi-tab-kuis-rapor-v1] komponen yang sama dgn halaman detail kelas */
                              <ClassKuisTab reg={selected} schedules={allSchedules.filter((s) => s.registration_id === selected.id)} />
                            ) : materiTab === "rapor" ? (
                              <ClassRaporTab reg={selected} teacherName={teacherLabel(selected) || undefined} teacherFullName={selected?.teachers?.name || undefined} />
                            ) : (
                              <div className="flex flex-col gap-6">
                              <SesiTimeline reg={selected} schedules={jadwalNyata.filter((s) => s.registration_id === selected.id)} variant="materi" />
                              {/* silabus level tetap ada di bawah linimasa — itu peta levelnya,
                                  bukan materi sesi yang sudah/akan dibahas pengajar */}
                              <div>
                              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">{tt("Silabus Level")}</p>
                              <SilabusOutline
                                /* [reguler-english-conversation-v1] slug HARUS dari bahasa dasar —
                                   "English - Conversation A1.1 (ENG-A11-AUG26)" dulu jadi slug ngawur.
                                   [materi-bahasa-siswa-v1] pakai peta kanonik (nama Indonesia "Rusia"
                                   pun ketemu) & TANPA fallback "english": kalau bahasanya tak dikenal,
                                   lebih baik "silabus belum tersedia" daripada memutar materi bahasa
                                   yang bukan diambil siswa. */
                                slug={languageSlug(selected.language) || baseLanguage(selected.language).toLowerCase().replace(/\s+/g, "-")}
                                languageLabel={displayLanguage(selected.language) || ""}
                                currentLevel={selected.level}
                                showPlacementTest={selected.product !== "English Test Preparation"}
                              />
                              </div>
                              </div>
                            )}
                          </div>
                        </main>
                      </div>
                    ) : (
                      /* [beranda-tanpa-tab-mandiri-v1] empty Kelas Live wajib tetep render MateriTopBar — biar judul & kotak cari ga ikut ilang */
                      <div className="flex flex-col lg:min-h-0 lg:flex-1">
                        {MateriTopBar}
                        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-8 lg:pt-0">
                          <div className="materi-flat w-full max-w-md rounded-3xl bg-white p-10 text-center lg:border-0 lg:bg-transparent lg:shadow-none">
                            <BookOpen className="mx-auto mb-2 h-12 w-12 text-slate-300" strokeWidth={1.5} />
                            <p className="text-[14px] font-semibold text-gray-600">{tt("Belum ada kelas live aktif")}</p>
                            {/* [beranda-tanpa-tab-mandiri-v1] e-book ikut disebut — sejak kartunya keluar
                                dari sini, siswa perlu diberi tahu ke mana perginya. */}
                            <p className="mt-1 text-[12px] font-medium text-gray-400">{tt("Lingbook kamu ada di menu Perpustakaan. Atau daftar kelas live di bawah.")}</p>
                            <button onClick={openEnrollWizard} className="mt-4 inline-flex h-10 items-center gap-2 rounded-2xl bg-[#16796E] px-5 text-[13px] font-bold text-white transition hover:bg-[#0F5A52]"><Plus className="h-4 w-4" strokeWidth={2.5} />{tt("Daftar Kelas")}</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* [linguo-patch:beranda-jelajahi-v1] tab "Jelajahi Bahasa" dipindah ke menu Beranda */}
                  </div>
                );
              })()}
            </motion.div>
          )}

          {tabShown("sertifikat") && (
            <motion.div key="sertifikat" initial={false} animate={{ opacity: 1 }} className="w-full" style={tabHidden("sertifikat")}>
              <SertifikatTab
                studentName={displayName}
                certs={certs}
                onContinue={() => setActiveTab("materi")}
                onSchedule={() => setActiveTab("jadwal")}
              />
            </motion.div>
          )}

          {/* [simulasi-inshell-v1] Simulasi Tes sebagai tab in-shell (sidebar tetap tampil) */}
          {tabShown("simulasi") && (
            <motion.div key="simulasi" initial={false} animate={{ opacity: 1 }} className="w-full pb-6" style={tabHidden("simulasi")}>
              <SimulasiKatalog previewStudentId={previewId} />
            </motion.div>
          )}

          {tabShown("akun") && (
            <motion.div key="akun" initial={false} animate={{ opacity: 1 }} className="mx-auto w-full max-w-5xl pb-4" style={tabHidden("akun")}>
              <AkunTab
                user={user}
                student={student}
                avatarUrl={avatarUrl}
                displayName={displayName}
                firstName={firstName}
                xp={xp}
                badges={badges}
                signOut={signOut}
                supabase={supabase}
                onAvatarUpdate={(url) => setStudent(s => s ? { ...s, avatar_url: url } : s)}
                openEnrollWizard={openEnrollWizard}
              />
            </motion.div>
          )}

          {/* [nav-tab-grup-pustaka-v1] TAB GRUP KELAS — chat grup WhatsApp kelas,
              komponen yang sama dengan route /akun/grup */}
          {tabShown("grup") && (
            <motion.div key="grup" initial={false} animate={{ opacity: 1 }} className="w-full" style={tabHidden("grup")}>
              {/* [grup-kanvas-penuh-siswa-v1] Judul tetap punya padding sendiri; panel
                  chat di bawahnya sengaja full-bleed sampai tepi kanvas shell. */}
              <div className="mb-4 px-4 sm:px-6">
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{tt("Grup Kelas")}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {tt("Ngobrol dengan pengajarmu di grup WhatsApp kelas — tanpa keluar dari dashboard.")}
                </p>
              </div>
              <StudentGroupChat previewStudentId={previewId} paused={activeTab !== "grup"} />
            </motion.div>
          )}

          {/* [linguo-patch:akun-pustaka-tab-v1] TAB PERPUSTAKAAN — E-Book & E-Learning
              [nav-tab-grup-pustaka-v1] isinya LibraryView (sama dgn /akun/perpustakaan),
              bukan lagi PerpustakaanSaya: dua tampilan berbeda utk menu yang sama cuma
              bikin siswa lihat isi yang tak sama tergantung pintu masuknya. */}
          {tabShown("pustaka") && (
            <motion.div key="pustaka" initial={false} animate={{ opacity: 1 }} className="w-full" style={tabHidden("pustaka")}>
              {(user?.id || previewId) && (
                <LibraryView
                  userId={user?.id ?? ""}
                  supabase={supabase}
                  previewStudentId={previewId}
                  autoOpenEbookId={bukaEbook}
                  onAutoOpened={() => setBukaEbook(null)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      {/* Placement Test Language Picker */}
      <PlacementPicker open={showPlacementPicker} onClose={() => setShowPlacementPicker(false)} studentId={student?.id} />
      </main>

      {/* [shell-mobile-drawer-v1] Bottom nav juga pindah ke StudentShell (satu sumber
          untuk semua halaman) — pemetaan tab-nya ikut pindah ke sana. */}

      {/* Floating Quick Actions FAB */}
      {student && (
        <>
          <button
            onClick={() => setShowQuickActions(true)}
            className="fixed md:hidden bottom-24 right-4 sm:right-6 z-[45] h-14 w-14 rounded-full bg-gradient-to-br from-teal-600 to-teal-500 text-white shadow-xl shadow-teal-500/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            aria-label="Aksi Cepat"
          >
            <motion.span
              animate={{ scale: [1, 1.6, 1.6], opacity: [0.5, 0, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-full bg-teal-400 pointer-events-none"
            />
            <Zap className="w-6 h-6 relative" strokeWidth={2.5} fill="currentColor" />
          </button>
          <AnimatePresence>
            {showQuickActions && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowQuickActions(false)}
                  className="fixed inset-0 bg-black/30 z-[55]"
                />
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                  className="fixed bottom-44 right-4 sm:right-6 z-[60] w-[calc(100vw-2rem)] max-w-xs rounded-2xl bg-white shadow-2xl p-4"
                >
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-teal-600" strokeWidth={2.5} fill="currentColor" />
                    Aksi Cepat
                  </h3>
                  <div className="space-y-1">
                    <button onClick={() => { setShowQuickActions(false); setShowPlacementPicker(true); }} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors w-full text-left">
                      <Target className="w-4 h-4 text-teal-600 shrink-0" strokeWidth={2} />
                      <span className="text-sm font-medium text-gray-700">Placement Test</span>
                    </button>
                    <a href={`https://wa.me/6282116859493?text=${encodeURIComponent(`Halo admin Linguo, saya ${student.name}. `)}`} target="_blank" rel="noopener noreferrer" onClick={() => setShowQuickActions(false)} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                      <MessageCircle className="w-4 h-4 text-teal-600 shrink-0" strokeWidth={2} />
                      <span className="text-sm font-medium text-gray-700">Hubungi Admin</span>
                    </a>
                    <a href="/silabus" onClick={() => setShowQuickActions(false)} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                      <Globe className="w-4 h-4 text-teal-600 shrink-0" strokeWidth={2} />
                      <span className="text-sm font-medium text-gray-700">Lihat Silabus</span>
                    </a>
                    <button onClick={() => { setShowQuickActions(false); openEnrollWizard(); }} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors w-full text-left">
                      <Plus className="w-4 h-4 text-teal-600 shrink-0" strokeWidth={2} />
                      <span className="text-sm font-medium text-gray-700">Tambah Kelas Baru</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}

      {/* [kelas-detail-page-v1] detail kelas pindah ke halaman /akun/kelas/[id] (dulu ClassDetailModal) */}
      {/* [remove-onesignal-prompt] popup "Subscribe to our notifications" (auto-prompt bawaan OneSignal)
          mengganggu di halaman belajar — provider dimatikan agar tidak ada popup lagi. */}
      {/* <OneSignalProvider /> */}

      {/* Popup detail pembayaran (card kecil "Perlu Perhatian" -> klik) */}
      {pendingModalReg && (
        <PaymentDetailModal
          reg={pendingModalReg}
          userId={user?.id || ""}
          onClose={() => setPendingModalReg(null)}
          renderPayment={(r: any, uid: string) => (
            <PaymentCard
              registration={r as any}
              userId={uid}
              onUploadSuccess={() => window.location.reload()}
              onRegenerateXendit={async () => {
                try {
                  const programLabel = PROGRAMS.find(p => p.key === r.product)?.label || r.product;
                  const langLabel = r.product === "IELTS/TOEFL Prep" ? "IELTS/TOEFL" : displayLanguage(r.language);
                  const desc = `${programLabel} — ${langLabel}`;
                  const res = await fetch(
                    "https://jbtgciepdmqxxcjflrxz.supabase.co/functions/v1/xendit-create-invoice",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                      },
                      body: JSON.stringify({
                        registration_id: r.id,
                        amount: r.total_amount || 0,
                        description: desc,
                        payer_name: displayName,
                        payer_email: user?.email || "",
                        success_redirect_url: "https://linguo.id/akun/success",
                        failure_redirect_url: "https://linguo.id/akun?xendit_failed=1",
                      }),
                    }
                  );
                  const data = await res.json();
                  if (data?.success && data?.invoice_url) {
                    // [akun-cancel-enrollment-v1] JANGAN update registrations dari client (RLS 403).
                    // Edge function xendit-create-invoice sudah punya registration_id + service role,
                    // jadi persist xendit_invoice_url dikerjain di server. Client cukup pakai URL-nya buat redirect.
                    return data.invoice_url as string;
                  }
                  return null;
                } catch (e) {
                  console.error("Regenerate Xendit error:", e);
                  return null;
                }
              }}
            />
          )}
        />
      )}

      {/* [akun-cancel-enrollment-v1] overlay konfirmasi pembatalan pendaftaran */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4"
          onClick={() => !cancelling && setCancelTarget(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <XCircle className="h-6 w-6 text-red-500" strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900">Batalkan pendaftaran?</h3>
            <p className="mt-1.5 text-sm text-gray-500">
              Yakin ingin membatalkan pendaftaran{" "}
              <strong className="text-gray-700">{displayLanguage(cancelTarget.language)} {cancelTarget.level || "TBD"}</strong>?
              Pendaftaran yang belum dibayar akan hilang dari daftar kamu.
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Tidak
              </button>
              <button
                type="button"
                onClick={confirmCancelEnrollment}
                disabled={cancelling}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {cancelling ? "Membatalkan…" : "Ya, batalkan"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {bookingReg && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={() => !bookingSubmit && setBookingReg(null)}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Booking Sesi</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {displayLanguage(bookingReg.language)} · {bookingReg.level}
                  {bookingReg.teachers?.name && <span className="inline-flex items-center gap-1"> · <GraduationCap className="h-3.5 w-3.5" strokeWidth={2.2} />{bookingReg.teachers.name}</span>}
                </p>
              </div>
              <button
                onClick={() => !bookingSubmit && setBookingReg(null)}
                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              ><XCircle className="h-5 w-5" strokeWidth={2} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loadingSlots ? (
                <div className="py-16 text-center text-sm text-gray-500">Memuat jadwal pengajar...</div>
              ) : availSlots.size === 0 ? (
                <div className="py-12 text-center">
                  <Calendar className="mx-auto mb-2 h-8 w-8 text-slate-300" strokeWidth={1.8} />
                  <p className="text-sm text-gray-700 font-medium">Pengajar belum set jadwal tersedia</p>
                  <p className="text-xs text-gray-500 mt-1">Hubungi admin untuk booking manual</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mb-3">
                    Pilih slot yang kosong (hijau) dalam 14 hari ke depan. Jam yang sudah dibook akan abu-abu.
                  </p>
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: 14 }, (_, di) => {
                      const date = new Date();
                      date.setDate(date.getDate() + di);
                      const dow = date.getDay();
                      const daySlots: { time: string; iso: string; isBooked: boolean; isPast: boolean }[] = [];
                      for (let h = 6; h < 22; h++) {
                        const time = `${String(h).padStart(2, "0")}:00`;
                        const slotDate = new Date(date);
                        slotDate.setHours(h, 0, 0, 0);
                        const iso = slotDate.toISOString();
                        const isAvail = availSlots.has(`${dow}-${time}`) || availSlots.has(`${dow}-${time}:00`);
                        const isBooked = bookedSlots.has(iso);
                        const isPast = slotDate.getTime() <= Date.now() + 60 * 60 * 1000;
                        if (isAvail) daySlots.push({ time, iso, isBooked, isPast });
                      }
                      if (daySlots.length === 0) return null;
                      const dayLabel = date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" });
                      return (
                        <div key={di} className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs font-semibold text-gray-700 mb-2">{dayLabel}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {daySlots.map(s => {
                              const disabled = s.isBooked || s.isPast;
                              const isSelected = selectedSlots.has(s.iso);
                              return (
                                <button
                                  key={s.time}
                                  disabled={disabled}
                                  onClick={() => {
                                  setSelectedSlots((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(s.iso)) next.delete(s.iso);
                                    else next.add(s.iso);
                                    return next;
                                  });
                                }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                    isSelected
                                      ? "bg-teal-600 text-white"
                                      : disabled
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed line-through"
                                      : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                                  }`}
                                >
                                  {s.time}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-gray-100 px-5 py-4 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 min-w-0 truncate">
                {selectedSlots.size > 0 ? (
                  <><Check className="h-3.5 w-3.5 shrink-0 text-teal-600" strokeWidth={2.5} />{selectedSlots.size} sesi dipilih</>
                ) : "Pilih slot dulu"}
              </div>
              <button
                onClick={submitBooking}
                disabled={selectedSlots.size === 0 || bookingSubmit}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {bookingSubmit ? "Menyimpan..." : selectedSlots.size > 0 ? `Booking ${selectedSlots.size} Sesi →` : "Pilih slot dulu"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Enrollment Wizard */}
      <EnrollWizard
        showEnroll={showEnroll} setShowEnroll={setShowEnroll}
        enrollStep={enrollStep} setEnrollStep={setEnrollStep}
        enrollProgram={enrollProgram} setEnrollProgram={setEnrollProgram}
        enrollLang={enrollLang} setEnrollLang={setEnrollLang}
        langSearch={langSearch} setLangSearch={setLangSearch}
        enrollDuration={enrollDuration} setEnrollDuration={setEnrollDuration}
        enrollSchedule={enrollSchedule} setEnrollSchedule={setEnrollSchedule}
        student={student} displayName={displayName} user={user} supabase={supabase}
        setStudent={setStudent} openEnrollWizard={openEnrollWizard}
      />

      {/* Footer (desktop) */}
      <div className="hidden md:block text-center py-8 text-xs text-gray-400">© 2026 Linguo.id — Everyone Can Be a Polyglot</div>

      {/* [linguo-patch:akun-inplace-lessonplayer-v1] overlay immersive: satu LessonPlayer dipake route & in-place (LmsLesson lama dibuang) */}
      {lmsSesi && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#F5F6F8]">
          <LessonPlayer
            lessonId={lmsSesi}
            onBack={() => { setLmsSesi(null); setActiveTab("materi"); if (typeof window !== "undefined") window.history.replaceState(null, "", "/akun?menu=materi"); }}
            onOpenLesson={(id) => setLmsSesi(id)}
          />
        </div>
      )}
    </StudentShell>
  );
}
