/* linguo-patch:akun-onboarding-gate-v1 — Lewati gating + WaGate profile completion */
"use client";

import { useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import successAnim from "../payment/success/success-anim.json";
import { Zap, Target, MessageCircle, Globe, Plus, LogOut, Clock, Calendar, Award, Pencil, Star, Trophy, BookOpen, Newspaper, BookMarked, User, Users, Baby, ClipboardList, GraduationCap, Video, Camera, Mail, Languages, ChevronRight, Search, ArrowRight, Shield, Bell, SlidersHorizontal, Wallet, Upload, BadgeCheck, CreditCard, Check, Download, type LucideIcon } from "lucide-react";

import ClassDetailModal from '@/components/ClassDetailModal';
import PaymentCard from '@/components/PaymentCard';
import PlacementPicker from '@/components/PlacementPicker';
import OneSignalProvider from '@/components/OneSignalProvider';
import NotificationBell from '@/components/NotificationBell';
import PaymentDetailModal from '@/components/akun/PaymentDetailModal';
import AvatarUploader from '@/components/akun/AvatarUploader';
import PaymentInstructionSheet from '@/components/akun/PaymentInstructionSheet';
import TopBarMinimal from '@/components/akun/TopBarMinimal';
import CompactHeroBanner from '@/components/akun/CompactHeroBanner';
import MobileBottomNav from '@/components/akun/MobileBottomNav';
import StudentShell from '@/components/akun/StudentShell';

// [linguo-patch:onboarding-success-lottie-v1] Lottie ceklis sukses (reuse success-anim.json).
// File ini "use client" → dynamic ssr:false aman dipasang langsung (hindari SSR lottie-web).
const OnbSuccessLottie = dynamic(() => import("lottie-react"), { ssr: false });
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
      <h1 className="mt-2 text-2xl font-extrabold text-gray-900">Selamat datang di Linguo! 🎉</h1>
      <p className="mt-1 text-sm text-gray-500">Akun kamu udah siap — lagi nyiapin dashboard kamu…</p>
    </div>
  );
}
import SertifikatTab from '@/components/akun/SertifikatTab';
import type { Cert } from '@/components/akun/SertifikatTab';
import SilabusOutline from '@/components/akun/SilabusOutline';
import JadwalCalendar from '@/components/akun/JadwalCalendar'; // linguo-patch:akun-jadwal-tab-v1
import LmsKatalog from '@/components/lms/LmsKatalog';
import LessonPlayer from '@/components/akun/LessonPlayer'; // [linguo-patch:akun-inplace-lessonplayer-v1] ganti LmsLesson (master-detail superseded) → immersive player tunggal
import AttentionAlert from '@/components/akun/AttentionAlert';
import PerpustakaanSaya from '@/components/PerpustakaanSaya';
import { Spinner } from "@/components/Spinner";
// ── Supabase Client ──────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  teacher_id?: string;
  teachers?: { name: string; whatsapp?: string } | null;
  payment_proof_url?: string | null;
  payment_proof_uploaded_at?: string | null;
  payment_verified_at?: string | null;
  payment_rejection_reason?: string | null;
  // [linguo-patch:akun-hide-cancelled-typefix-v1] kolom lifecycle dari cron/admin
  pipeline_status?: string | null;
  archived_at?: string | null;
  // Batch data for Kelas Reguler
  batch_id?: string | null;
  batch?: {
    id: string;
    batch_code: string;
    schedule_day: string;
    schedule_time: string;
    start_date: string;
    end_date: string;
    zoom_link?: string;
    sessions_total: number;
  } | null;
};

// ── Product Badges ──────────────────────────────────────────────────
const PRODUCT_BADGE: Record<string, { label: string; icon: LucideIcon; color: string; bg: string; border: string }> = {
  "Kelas Private":              { label: "Private",      icon: User,          color: "text-teal-700",  bg: "bg-teal-50",   border: "border-teal-200" },
  "Kelas Reguler":              { label: "Reguler",      icon: Users,         color: "text-blue-700",  bg: "bg-blue-50",   border: "border-blue-200" },
  "Kelas Kids":                 { label: "Kids",         icon: Baby,          color: "text-purple-700",bg: "bg-purple-50", border: "border-purple-200" },
  "English Test Preparation":   { label: "Test Prep",    icon: ClipboardList, color: "text-amber-700", bg: "bg-amber-50",  border: "border-amber-200" },
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
type Schedule = { id: string; registration_id: string; scheduled_at: string; duration_minutes: number; status: string };

// ── Constants ────────────────────────────────────────────────────────────
const LANG_FLAGS: Record<string, string> = {
  Arabic:"sa",Arab:"sa",Dutch:"nl",Belanda:"nl",English:"gb",Inggris:"gb",
  Hebrew:"il",Ibrani:"il",Italian:"it",Italia:"it",Japanese:"jp",Jepang:"jp",
  German:"de",Jerman:"de",Korean:"kr",Korea:"kr",Mandarin:"cn",Chinese:"cn",
  French:"fr",Prancis:"fr",Russian:"ru",Rusia:"ru",Spanish:"es",Spanyol:"es",
  Turkish:"tr",Turki:"tr",Thai:"th",Vietnamese:"vn",Hindi:"in",
  Portuguese:"br",Danish:"dk",Swedish:"se",Finnish:"fi",Polish:"pl",Czech:"cz",
  Greek:"gr",Yunani:"gr",Persian:"ir",Persia:"ir",Georgian:"ge",Norwegian:"no",
  Javanese:"id",Jawa:"id",Sundanese:"id",Sunda:"id",BIPA:"id",
  // [linguo-patch:onboarding-lang-catalog-v1] flag bahasa tambahan (lengkapi katalog Kelas Private)
  Hungarian:"hu",Romanian:"ro",Bulgarian:"bg",Ukrainian:"ua",Icelandic:"is",
  Cantonese:"hk",Filipino:"ph",Khmer:"kh",Lao:"la",Burmese:"mm",Urdu:"pk",
  Balinese:"id",Batak:"id",Bugis:"id",Madurese:"id",
};
const getFlagUrl = (lang: string) => `https://flagcdn.com/w40/${LANG_FLAGS[lang] || "un"}.png`;

// Foto stok bahasa (drop file ke public/lang/<slug>.jpg). Alias ID & EN, case-insensitive.
// Kalau bahasa ga ke-map / file belum ada -> getLangPhoto balikin null -> kartu pakai fallback glyph.
const LANG_PHOTO_SLUG: Record<string, string> = {
  inggris: "english-convo", english: "english-convo", "english conversation": "english-convo",
  jepang: "japanese", japanese: "japanese",
  prancis: "french", perancis: "french", french: "french",
  spanyol: "spanish", spanish: "spanish",
  korea: "korean", korean: "korean",
  jerman: "german", german: "german",
  arab: "arabic", "bahasa arab": "arabic", arabic: "arabic",
  italia: "italian", italian: "italian",
  vietnam: "vietnamese", vietnamese: "vietnamese",
  swahili: "swahili",
  rusia: "russian", russian: "russian",
  portugis: "portuguese", portuguese: "portuguese",
  hungaria: "hungarian", hungarian: "hungarian",
  mandarin: "mandarin", "mandarin (china)": "mandarin", china: "mandarin", chinese: "mandarin",
  hindi: "hindi",
  indonesia: "indonesian", indonesian: "indonesian", "bahasa indonesia": "indonesian",
  sunda: "sundanese", sundanese: "sundanese", "bahasa sunda": "sundanese",
  ibrani: "hebrew", hebrew: "hebrew",
  "mesir kuno": "ancient-egypt", "ancient egypt": "ancient-egypt", hieroglif: "ancient-egypt",
};
const getLangPhoto = (lang?: string | null): string | null => {
  if (!lang) return null;
  const slug = LANG_PHOTO_SLUG[lang.trim().toLowerCase()];
  return slug ? `/lang/${slug}.jpg` : null;
};

const LEVEL_SEQUENCE = ["A1.1","A1.2","A1.3","A2.1","A2.2","A2.3","A2.4","B1.1","B1.2","B1.3","B1.4","B1.5","B2.1","B2.2","B2.3","B2.4","B2.5","B2.6","B2.7"];
const LEVEL_MILESTONES = ["A1","A2","B1","B2"];

function getLevelProgress(level: string) {
  const idx = LEVEL_SEQUENCE.indexOf(level);
  return idx >= 0 ? ((idx + 1) / LEVEL_SEQUENCE.length) * 100 : 5;
}

function calculateXP(sessions: number, streak: number, badges: number) {
  const xp = sessions * 100 + streak * 50 + badges * 200;
  if (xp >= 5000) return { xp, rank: "Master", emoji: "👑", next: "", nextXP: 0 };
  if (xp >= 3000) return { xp, rank: "Expert", emoji: "💎", next: "Master", nextXP: 5000 };
  if (xp >= 1500) return { xp, rank: "Jagoan", emoji: "⚔️", next: "Expert", nextXP: 3000 };
  if (xp >= 500) return { xp, rank: "Pejuang", emoji: "🛡️", next: "Jagoan", nextXP: 1500 };
  return { xp, rank: "Pemula", emoji: "🌱", next: "Pejuang", nextXP: 500 };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Selamat pagi";
  if (h < 17) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

// ── Programs & Languages for Enrollment Wizard ───────────────────────────
const PROGRAMS = [
  { key: "Kelas Private", label: "Kelas Private", desc: "1-on-1 dengan pengajar, jadwal fleksibel", icon: "👤", price: "Mulai Rp45k/sesi (30 mnt)" },
  { key: "Kelas Reguler", label: "Kelas Reguler", desc: "Belajar bersama 8–15 siswa, jadwal tetap", icon: "👥", price: "Rp150k / 2 bulan (8 sesi)" },
  { key: "Kelas Kids", label: "Kelas Kids", desc: "Untuk anak usia 5-12 tahun", icon: "🧒", price: "Mulai Rp75k/sesi" },
  { key: "English Test Preparation", label: "IELTS/TOEFL Prep", desc: "Persiapan tes bahasa Inggris", icon: "📝", price: "Rp300k / 2 bulan (16 sesi)" },
];

const POPULAR_LANGUAGES = [
  "English","Japanese","Korean","Mandarin","French","Spanish","German","Arabic","Italian","Turkish",
  "Russian","Thai","Portuguese","Dutch","Hindi","Vietnamese","Danish","Swedish","Finnish","Georgian",
  "Persian","Hebrew","Polish","Czech","Greek","Norwegian","Javanese","Sundanese","BIPA"
];

// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// ONBOARDING WIZARD — Typeform-style, program-first
// ═══════════════════════════════════════════════════════════════════════════
const WIZARD_PROGRAMS = [
  { key: "Kelas Private", label: "Kelas Private 1-on-1", icon: "👤", desc: "Belajar langsung dengan pengajar, jadwal fleksibel", price: "Mulai Rp45k/sesi (30 menit)", badge: "Paling Populer" },
  { key: "Kelas Reguler", label: "Kelas Reguler", icon: "👥", desc: "Belajar bersama 8–15 siswa, lebih hemat", price: "Rp18.750/sesi (8 sesi @90 mnt / 2 bulan)" },
  { key: "Kelas Kids", label: "Kelas Kids", icon: "🧒", desc: "Untuk anak usia 5–12 tahun", price: "Mulai Rp75k/sesi" },
  { key: "English Test Preparation", label: "IELTS / TOEFL Prep", icon: "📝", desc: "Persiapan tes bahasa Inggris bersertifikat", price: "Rp300k/2 bulan (16 sesi @90 mnt)" },
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
  "Kelas Reguler": ["English","Japanese","Korean","Mandarin","French","Spanish","German","Arabic"],
  "Kelas Kids": ["English","Japanese","Korean","Mandarin","French","Spanish"],
  "English Test Preparation": [],
};
const TEST_TYPES = [
  { key: "IELTS", label: "IELTS", desc: "International English Language Testing System", icon: "🎓" },
  { key: "TOEFL", label: "TOEFL", desc: "Test of English as a Foreign Language", icon: "📋" },
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
            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all ${i < active ? "bg-teal-500 text-white" : i === active ? "bg-teal-600 text-white ring-4 ring-teal-100" : "bg-gray-100 text-gray-400"}`}>
              {i < active ? "✓" : i + 1}
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
      <p className="text-sm font-bold text-amber-800 mb-2">📋 Ketentuan Kelas Reguler</p>
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
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-amber-400 accent-teal-600 focus:ring-teal-500"
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

  const finish = () => {
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
    `. Mohon info jadwal dan biayanya ya. Terima kasih! 🙏`
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
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Halo, {firstName}!</h1>
              <p className="text-gray-500 mb-2">Selamat datang di <strong>Linguo.id</strong> — platform belajar 60+ bahasa asing.</p>
              <p className="text-gray-400 text-sm mb-8">Yuk setup akun kamu dalam 1 menit. Kami bantu temukan kelas yang paling cocok! 🚀</p>
              <div className="grid grid-cols-3 gap-3 mb-8 text-center">
                {[["60+","Bahasa"],["200+","Siswa Aktif"],["1-on-1","Kelas Private"]].map(([v,l]) => (
                  <div key={l} className="bg-white rounded-2xl p-3 shadow-sm border border-teal-100">
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
                <div className="text-4xl mb-2">🎯</div>
                <h2 className="text-xl font-extrabold text-gray-900">Program apa yang kamu inginkan?</h2>
                <p className="text-gray-400 text-sm mt-1">Pilih satu — langsung lanjut otomatis</p>
              </div>
              <div className="space-y-3">
                {WIZARD_PROGRAMS.map(p => (
                  <button key={p.key} onClick={() => { setProgram(p.key); setLang(""); setTestType(""); setExp(""); go(2); }}
                    className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left active:scale-[0.98] ${program === p.key ? "border-teal-500 bg-teal-50" : "border-gray-100 hover:border-teal-300 bg-white hover:bg-teal-50/30"}`}>
                    <span className="text-2xl mt-0.5 shrink-0">{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-gray-800">{p.label}</span>
                        {p.badge && <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-semibold">{p.badge}</span>}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{p.desc}</div>
                      <div className="text-xs text-teal-600 font-semibold mt-1">{p.price}</div>
                    </div>
                    {program === p.key && <span className="text-teal-500 font-bold shrink-0 mt-0.5">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2a: Test type for IELTS/TOEFL */}
          {step === 2 && isTestPrep && (
            <div>
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">📝</div>
                <h2 className="text-xl font-extrabold text-gray-900">Mau persiapan tes apa?</h2>
              </div>
              <div className="space-y-3 mb-5">
                {TEST_TYPES.map(t => (
                  <button key={t.key} onClick={() => { setTestType(t.key); go(3); }}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left active:scale-[0.98] ${testType === t.key ? "border-teal-500 bg-teal-50" : "border-gray-100 hover:border-teal-300 bg-white"}`}>
                    <span className="text-3xl">{t.icon}</span>
                    <div>
                      <div className="font-bold text-gray-800">{t.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{t.desc}</div>
                    </div>
                    {testType === t.key && <span className="ml-auto text-teal-500 font-bold">✓</span>}
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
                <div className="text-4xl mb-2">🌍</div>
                <h2 className="text-xl font-extrabold text-gray-900">Bahasa apa yang ingin kamu pelajari?</h2>
                <p className="text-gray-400 text-sm mt-1">Klik → langsung lanjut</p>
              </div>
              <div className="relative mb-3">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari bahasa..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-500 pl-9" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              </div>
              {/* [linguo-patch:onboarding-lang-catalog-v1] grid bahasa dikelompokkan per region */}
              <div className="max-h-72 overflow-y-auto pb-1 space-y-3">
                {langGroups.map(g => (
                  <div key={g.region || "all"}>
                    {g.region && <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 px-0.5">{g.region}</div>}
                    <div className="grid grid-cols-3 gap-2">
                      {g.langs.map(l => (
                        <button key={l} onClick={() => { setLang(l); go(3, 200); }}
                          className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all active:scale-95 ${lang === l ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-100 hover:border-teal-200 text-gray-600 bg-white"}`}>
                          {LANG_FLAGS[l] ? <img src={`https://flagcdn.com/w40/${LANG_FLAGS[l]}.png`} alt={l} className="w-7 h-5 object-cover rounded-sm" /> : <span className="text-xl">🌐</span>}
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {langNoResults && <div className="text-center text-sm text-gray-400 py-6">Nggak ada bahasa yang cocok 😶</div>}
              </div>
              <button onClick={() => setStep(1)} className="mt-4 text-sm text-gray-400 hover:text-gray-600">← Ganti program</button>
            </div>
          )}

          {/* Step 3: Experience (auto-advance) */}
          {step === 3 && (
            <div>
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">{!isTestPrep && lang && LANG_FLAGS[lang] ? <img src={`https://flagcdn.com/w80/${LANG_FLAGS[lang]}.png`} alt={lang} className="w-14 h-10 object-cover rounded-md mx-auto" /> : "📚"}</div>
                <h2 className="text-xl font-extrabold text-gray-900">{isTestPrep ? `Seberapa siap kamu untuk ${testType}?` : `Pengalaman kamu dengan ${lang}?`}</h2>
                <p className="text-gray-400 text-sm mt-1">Ini bantu kami rekomendasikan level yang tepat</p>
              </div>
              <div className="space-y-3">
                {[
                  { key: "beginner", emoji: "🌱", title: isTestPrep ? "Baru mau mulai persiapan" : "Pemula total", desc: isTestPrep ? "Belum tahu harus mulai dari mana" : "Belum pernah belajar sama sekali" },
                  { key: "some", emoji: "📚", title: isTestPrep ? "Sudah pernah belajar" : "Sudah ada dasar", desc: isTestPrep ? "Pernah ikut kelas atau belajar mandiri" : "Pernah belajar sedikit, mau lanjutkan" },
                ].map(opt => (
                  <button key={opt.key} onClick={() => {
                      if (opt.key === "beginner") { setExp("beginner"); setLevel(isTestPrep ? "" : "A1.1"); go(4); }
                      else { setExp("some"); if (isTestPrep) { go(4); } else { setLevel(""); } }
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left active:scale-[0.98] ${exp === opt.key ? "border-teal-500 bg-teal-50" : "border-gray-100 hover:border-teal-300 bg-white"}`}>
                    <span className="text-3xl">{opt.emoji}</span>
                    <div>
                      <div className={`font-bold text-sm ${exp === opt.key ? "text-teal-700" : "text-gray-800"}`}>{opt.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
                    </div>
                    {exp === opt.key && <span className="ml-auto text-teal-500 font-bold">✓</span>}
                  </button>
                ))}
              </div>

              {/* Level sub-picker — [linguo-patch:onboarding-level-placement-v1] muncul kalau "Sudah ada dasar" & bukan test prep */}
              {exp === "some" && !isTestPrep && (
                <div className="mt-5 rounded-2xl border-2 border-teal-100 bg-teal-50/40 p-4">
                  <p className="text-sm font-bold text-gray-800">Kamu tau level kamu sekarang?</p>
                  <p className="text-xs text-gray-400 mb-3">Pilih kalau yakin, atau ikut placement test kalau ragu.</p>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {["A1","A2","B1","B2"].map(lv => (
                      <button key={lv} onClick={() => { setLevel(lv); go(4); }}
                        className={`rounded-xl border-2 py-2.5 text-sm font-bold transition-all active:scale-95 ${level === lv ? "border-teal-500 bg-teal-500 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-teal-300"}`}>
                        {lv}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { setLevel("TBD"); go(4); }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-teal-300 bg-white py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-50 transition-all">
                    {placementSlug(lang) ? "🎯 Belum yakin — ikut Placement Test" : "🤔 Belum yakin (pengajar bantu cek)"}
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
                    className="group relative h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-teal-100 shadow-md ring-1 ring-teal-200"
                  >
                    {(avatarPreview || googleAvatar) ? (
                      <img src={avatarPreview || googleAvatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-teal-600">
                        {firstName.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      <span className="text-[10px] font-semibold">Ganti</span>
                    </span>
                  </button>
                </div>
                <h2 className="text-xl font-extrabold text-gray-900">Lengkapi data kamu</h2>
                <p className="text-gray-400 text-sm mt-1">Biar tim Linguo bisa siapin kelas yang pas buat kamu</p>
              </div>

              <div className="bg-white rounded-2xl border border-teal-100 p-4 mb-3 space-y-3">
                {/* Email — otomatis dari Google, read-only */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Email</label>
                  <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
                    <svg className="h-4 w-4 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>
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
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${triedNext && name.trim().length < 2 ? "border-red-300" : "border-gray-200"}`}
                  />
                </div>

                {/* Nomor WhatsApp — prefix bendera + +62 (inline sebaris) */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nomor WhatsApp aktif</label>
                  <div className={`flex items-stretch overflow-hidden rounded-xl border bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 ${triedNext && !waValid ? "border-red-300" : "border-gray-200"}`}>
                    <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-r border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-600">
                      <span className="text-base leading-none">🇮🇩</span> +62
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
                    className={`flex w-full items-center gap-2 rounded-xl border px-4 py-2.5 text-left text-sm outline-none focus:border-teal-500 ${triedNext && !birthdate ? "border-red-300" : "border-gray-200"} ${birthdate ? "text-gray-800" : "text-gray-400"}`}
                  >
                    <svg className="h-4 w-4 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
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
                      <div className="absolute left-0 right-0 z-30 mt-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl">
                        <div className="mb-2 flex items-center gap-2">
                          <select value={calM} onChange={e => setCalM(Number(e.target.value))} className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500">
                            {mLabels.map((m, i) => <option key={m} value={i}>{m}</option>)}
                          </select>
                          <select value={calY} onChange={e => setCalY(Number(e.target.value))} className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500">
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
                        className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 ${triedNext && !province ? "border-red-300" : "border-gray-200"} ${province ? "text-gray-800" : "text-gray-400"}`}>
                        <option value="">Pilih provinsi…</option>
                        {ID_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      {province && (
                        <select value={city} onChange={e => setCity(e.target.value)}
                          className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 ${triedNext && !idCityName ? "border-red-300" : "border-gray-200"} ${city ? "text-gray-800" : "text-gray-400"}`}>
                          <option value="">Pilih kota/kabupaten…</option>
                          {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
                          <option value="__manual__">Lainnya (ketik manual)…</option>
                        </select>
                      )}
                      {city === "__manual__" && (
                        <input value={manualCity} onChange={e => setManualCity(e.target.value)} placeholder="Ketik nama kota/kabupaten"
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <select value={country} onChange={e => setCountry(e.target.value)}
                        className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 ${triedNext && !country ? "border-red-300" : "border-gray-200"} ${country ? "text-gray-800" : "text-gray-400"}`}>
                        <option value="">Pilih negara…</option>
                        {WORLD_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input value={lnCity} onChange={e => setLnCity(e.target.value)} placeholder="Kota (opsional), mis. Tokyo"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                    </div>
                  )}
                </div>
              </div>

              {/* Indikasi field yang masih kurang — muncul setelah klik Lanjut (#6) */}
              {triedNext && !profileValid && missing.length > 0 && (
                <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-700">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
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
                <div className="text-5xl mb-3">🚀</div>
                <h2 className="text-xl font-extrabold text-gray-900">Siap mulai belajar!</h2>
                <p className="text-gray-400 text-sm mt-1">Ini rangkuman pilihanmu</p>
              </div>
              <div className="bg-white rounded-2xl border border-teal-100 p-4 mb-5 space-y-3">
                {[
                  ["🎯 Program", WIZARD_PROGRAMS.find(p => p.key === program)?.label || program],
                  ...(isTestPrep ? [["📝 Tes", testType]] : [["🌍 Bahasa", lang]]),
                  ["📚 Level", level === "A1.1" ? "Pemula (A1.1)" : level === "TBD" ? "Akan dites dulu" : level ? `Level ${level}` : "Akan dites dulu"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{label}</span>
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
                <a href={`/silabus/${placementSlug(lang)}/coba`} onClick={finish} className="w-full flex items-center justify-center gap-2 border-2 border-teal-500 text-teal-600 font-bold py-3.5 rounded-2xl text-sm hover:bg-teal-50 transition-all mb-3">
                  🎯 Ambil Placement Test dulu
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
          <h2 className="text-xl font-extrabold text-gray-900 mt-4">Hai, {firstName}! 👋</h2>
          <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">Sebelum lanjut, lengkapi data profil kamu dulu ya. Tim Linguo butuh ini buat menghubungimu soal jadwal &amp; kelas.</p>
        </div>
        <div className="bg-white rounded-2xl border border-teal-100 p-4 shadow-sm space-y-3">
          {needName && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nama lengkap</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nama lengkap kamu"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
              {name.length > 0 && !nameValid && (
                <p className="text-[11px] text-red-500 mt-1.5">Masukkan nama lengkap kamu</p>
              )}
            </div>
          )}
          {needWa && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nomor WhatsApp aktif</label>
              <input value={wa} onChange={e => setWa(e.target.value)} inputMode="numeric" placeholder="08xxxxxxxxxx"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
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
// DUMMY (sesuai permintaan): seluruh tab Tagihan & Paket — belum ada backend billing.
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
    <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_24px_50px_-36px_rgba(18,23,43,0.5)]">
      {title ? <div className="px-6 pb-3 pt-5"><h3 className="text-[16px] font-extrabold text-[#12172B]">{title}</h3></div> : null}
      <div className="px-6 pb-5">{children}</div>
      {footer ? <div className="flex justify-end gap-3 border-t border-slate-100 bg-[#F5F6F8] px-6 py-4">{footer}</div> : null}
    </section>
  );
}

function SetFieldBox({ children }: { children: ReactNode }) {
  return (
    <div className="mt-1.5 flex h-12 items-center rounded-xl border border-slate-200 px-4 transition focus-within:border-[#16796E] focus-within:shadow-[0_0_0_4px_rgba(22,121,110,0.12)]">
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

function AkunTab({ user, student, avatarUrl, displayName, firstName, xp, badges, signOut, supabase, onAvatarUpdate }: {
  user: any; student: any; avatarUrl?: string; displayName: string; firstName: string;
  xp: any; badges: any[]; signOut: () => void; supabase: any; onAvatarUpdate: (url: string) => void;
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
  const [uiLang, setUiLang] = useState<"id" | "en">("id");

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

  const title = SETTINGS_NAV.find((n) => n.id === pane)?.label || "Pengaturan";

  return (
    <div className="overflow-hidden rounded-[26px] bg-white shadow-[0_28px_60px_-44px_rgba(18,23,43,0.45)] lg:flex">
      {/* linguo-patch:akun-settings-design-v2 — frame Claude Design (sub-nav + panel) */}

      {/* LEFT: settings sub-nav */}
      <aside className="shrink-0 border-b border-slate-100 lg:flex lg:w-[260px] lg:flex-col lg:border-b-0 lg:border-r">
        <div className="px-6 pb-3 pt-6">
          <h2 className="text-[18px] font-extrabold text-[#12172B]">Pengaturan</h2>
          <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">Kelola akun & preferensimu</p>
        </div>
        <nav className="flex gap-1.5 overflow-x-auto px-4 pb-4 lg:flex-1 lg:flex-col lg:overflow-visible">
          {SETTINGS_NAV.map((n) => {
            const Icon = n.icon;
            const on = n.id === pane;
            return (
              <button key={n.id} onClick={() => setPane(n.id)}
                className={`flex shrink-0 items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${on ? "bg-white shadow-[0_12px_30px_-22px_rgba(18,23,43,0.5)]" : "hover:bg-[#F5F6F8]"}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition"
                  style={on ? { background: "#16796E", color: "#fff" } : { background: "#F5F6F8", color: "#6B7280" }}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-bold leading-tight" style={{ color: on ? "#16796E" : "#12172B" }}>{n.label}</span>
                  <span className="hidden truncate text-[12px] font-medium text-[#6B7280] lg:block">{n.sub}</span>
                </span>
              </button>
            );
          })}
        </nav>
        <div className="hidden px-4 pb-5 lg:block">
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-[14px] font-bold text-rose-500 transition hover:bg-rose-50">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50"><LogOut className="h-[18px] w-[18px]" /></span>
            Keluar dari Akun
          </button>
        </div>
      </aside>

      {/* RIGHT: panel */}
      <main className="min-w-0 flex-1 bg-[#F5F6F8]">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-6 lg:px-8">
          <div>
            <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#6B7280]">
              Dashboard <ChevronRight className="h-3.5 w-3.5" /> <span className="text-[#16796E]">Pengaturan</span>
            </p>
            <h1 className="mt-1 text-[24px] font-extrabold leading-tight text-[#12172B]">{title}</h1>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-[0_10px_30px_-22px_rgba(18,23,43,0.6)]">
            <Bell className="h-[19px] w-[19px] text-[#12172B]" />
          </span>
        </div>

        {notice && (
          <div className="mx-6 mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700 lg:mx-8">
            {notice}
          </div>
        )}

        <div className="space-y-5 p-6 pt-6 lg:p-8">
          {pane === "profil" && (
            <>
              <SetCard title="Foto Profil">
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
                        Ganti foto
                      </button>
                      <button onClick={handleRemoveAvatar} className="h-10 rounded-xl px-4 text-[13px] font-bold text-[#6B7280] transition hover:text-rose-500">Hapus</button>
                    </div>
                    <span className="text-[12px] font-medium text-[#6B7280]">JPG atau PNG, maksimal 2MB.</span>
                  </div>
                </div>
              </SetCard>

              <SetCard title="Informasi Pribadi" footer={
                <>
                  <button onClick={() => { setEditName(student?.name || displayName); setEditWa(student?.whatsapp || ""); }} className="h-11 rounded-xl px-5 text-[14px] font-bold text-[#6B7280] transition hover:text-[#12172B]">Batal</button>
                  <button onClick={handleSaveProfil} disabled={saving} className="h-11 rounded-xl px-6 text-[14px] font-extrabold text-white transition hover:bg-[#0F5A52] disabled:opacity-50" style={{ background: "#16796E" }}>{saving ? "Menyimpan..." : "Simpan Perubahan"}</button>
                </>
              }>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[13px] font-bold text-[#12172B]">Nama Lengkap</label>
                    <SetFieldBox><input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-transparent text-[14px] font-medium outline-none placeholder:text-slate-400" /></SetFieldBox>
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-[#12172B]">Nomor WhatsApp</label>
                    <SetFieldBox><input value={editWa} onChange={(e) => setEditWa(e.target.value)} placeholder="628xxx" className="w-full bg-transparent text-[14px] font-medium outline-none placeholder:text-slate-400" /></SetFieldBox>
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-[#12172B]">Nama Panggilan</label>
                    <SetFieldBox><input value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Panggilan" className="w-full bg-transparent text-[14px] font-medium outline-none placeholder:text-slate-400" /></SetFieldBox>
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-[#12172B]">Kota</label>
                    <SetFieldBox><input value={kota} onChange={(e) => setKota(e.target.value)} placeholder="Kota" className="w-full bg-transparent text-[14px] font-medium outline-none placeholder:text-slate-400" /></SetFieldBox>
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-[#12172B]">Zona Waktu</label>
                    <SetFieldBox><select value={tz} onChange={(e) => setTz(e.target.value)} className="w-full bg-transparent text-[14px] font-medium outline-none"><option>WIB (GMT+7)</option><option>WITA (GMT+8)</option><option>WIT (GMT+9)</option></select></SetFieldBox>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[13px] font-bold text-[#12172B]">Bio singkat</label>
                    <div className="mt-1.5 rounded-xl border border-slate-200 px-4 py-3 transition focus-within:border-[#16796E] focus-within:shadow-[0_0_0_4px_rgba(22,121,110,0.12)]">
                      <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Ceritakan sedikit tentang dirimu & tujuan belajarmu..." className="w-full resize-none bg-transparent text-[14px] font-medium outline-none placeholder:text-slate-400" />
                    </div>
                  </div>
                </div>
              </SetCard>
            </>
          )}

          {pane === "akun" && (
            <>
              <SetCard title="Email & Login">
                <div className="flex items-center justify-between gap-4 py-2">
                  <div><p className="text-[14px] font-bold text-[#12172B]">Email</p><p className="mt-0.5 text-[13px] font-medium text-[#6B7280]">{user?.email || "-"}</p></div>
                  {emailVerified
                    ? <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-bold text-emerald-600"><BadgeCheck className="h-3.5 w-3.5" />Terverifikasi</span>
                    : <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[12px] font-bold text-amber-600">Belum verifikasi</span>}
                </div>
                {isGoogle && (
                  <div className="mt-1 flex items-center gap-3 border-t border-slate-100 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-[15px] font-extrabold" style={{ color: "#4285F4" }}>G</span>
                    <div><p className="text-[14px] font-bold text-[#12172B]">Google</p><p className="text-[12px] font-medium text-[#6B7280]">Terhubung{user?.email ? " · " + user.email : ""}</p></div>
                  </div>
                )}
              </SetCard>

              <SetCard title="Ubah Kata Sandi" footer={
                <button onClick={handleUpdatePassword} className="h-11 rounded-xl px-6 text-[14px] font-extrabold text-white transition hover:bg-[#0F5A52]" style={{ background: "#16796E" }}>Perbarui Sandi</button>
              }>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-[13px] font-bold text-[#12172B]">Kata sandi baru</label>
                    <SetFieldBox><input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Minimal 8 karakter" className="w-full bg-transparent text-[14px] font-medium outline-none placeholder:text-slate-400" /></SetFieldBox>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[13px] font-bold text-[#12172B]">Konfirmasi sandi baru</label>
                    <SetFieldBox><input type="password" value={confPass} onChange={(e) => setConfPass(e.target.value)} placeholder="Ulangi sandi baru" className="w-full bg-transparent text-[14px] font-medium outline-none placeholder:text-slate-400" /></SetFieldBox>
                  </div>
                </div>
              </SetCard>

              <SetCard title="Keamanan">
                <SetToggleRow label="Verifikasi 2 langkah (2FA)" desc="Tambahkan lapisan keamanan ekstra saat login." on={pref.twofa} onClick={() => setPref((p) => ({ ...p, twofa: !p.twofa }))} />
                <div className="flex items-center justify-between gap-4 py-3.5">
                  <div><p className="text-[14px] font-bold text-[#12172B]">Perangkat aktif</p><p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">Sesi login kamu saat ini.</p></div>
                  <span className="text-[13px] font-bold text-[#16796E]">Aktif sekarang</span>
                </div>
              </SetCard>

              <SetCard>
                <div className="flex items-center justify-between gap-4">
                  <div><p className="text-[14px] font-extrabold text-rose-500">Hapus Akun</p><p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">Tindakan permanen. Hubungi admin untuk memproses penghapusan.</p></div>
                  <a href="https://wa.me/6282116859493?text=Halo%20admin%2C%20saya%20ingin%20menghapus%20akun%20Linguo%20saya." target="_blank" rel="noopener noreferrer" className="h-10 whitespace-nowrap rounded-xl border border-rose-200 px-4 text-[13px] font-bold leading-10 text-rose-500 transition hover:bg-rose-50">Hubungi Admin</a>
                </div>
              </SetCard>
            </>
          )}

          {pane === "notif" && (
            <>
              <SetCard title="Email">
                <SetToggleRow label="Pengingat jadwal sesi" desc="Email H-1 sebelum sesi live dimulai." on={notif.email_jadwal} onClick={() => setNotif((s) => ({ ...s, email_jadwal: !s.email_jadwal }))} />
                <SetToggleRow label="Materi & rekaman baru" desc="Saat pengajar mengunggah materi atau rekaman." on={notif.email_materi} onClick={() => setNotif((s) => ({ ...s, email_materi: !s.email_materi }))} />
              </SetCard>
              <SetCard title="WhatsApp">
                <SetToggleRow label="Pengingat sesi via WA" desc="Notifikasi ke nomor WhatsApp kamu." on={notif.wa_pengingat} onClick={() => setNotif((s) => ({ ...s, wa_pengingat: !s.wa_pengingat }))} />
                <SetToggleRow label="Promo & info kelas baru" desc="Penawaran paket dan bahasa baru." on={notif.wa_promo} onClick={() => setNotif((s) => ({ ...s, wa_promo: !s.wa_promo }))} />
              </SetCard>
              <SetCard title="Push (Aplikasi)" footer={
                <button onClick={() => flash("Preferensi notifikasi disimpan.")} className="h-11 rounded-xl px-6 text-[14px] font-extrabold text-white transition hover:bg-[#0F5A52]" style={{ background: "#16796E" }}>Simpan Perubahan</button>
              }>
                <SetToggleRow label="Sesi akan dimulai" desc="Push 15 menit sebelum sesi." on={notif.push_sesi} onClick={() => setNotif((s) => ({ ...s, push_sesi: !s.push_sesi }))} />
                <SetToggleRow label="Tips & tantangan harian" desc="Dorongan belajar setiap hari." on={notif.push_promo} onClick={() => setNotif((s) => ({ ...s, push_promo: !s.push_promo }))} />
              </SetCard>
            </>
          )}

          {pane === "preferensi" && (
            <>
              <SetCard title="Bahasa Antarmuka">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {([["id", "🇮🇩", "Indonesia"], ["en", "🇬🇧", "English"]] as Array<[("id" | "en"), string, string]>).map(([code, flag, label]) => (
                    <button key={code} onClick={() => setUiLang(code)}
                      className="flex items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-left transition"
                      style={uiLang === code ? { borderColor: "#16796E", background: "rgba(22,121,110,0.06)" } : { borderColor: "#E2E8F0" }}>
                      <span className="text-xl">{flag}</span><span className="text-[14px] font-bold text-[#12172B]">{label}</span>
                    </button>
                  ))}
                </div>
              </SetCard>
              <SetCard title="Pengingat Belajar">
                <SetToggleRow label="Pengingat harian" desc="Ingatkan aku untuk belajar setiap hari." on={pref.reminder} onClick={() => setPref((p) => ({ ...p, reminder: !p.reminder }))} />
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3.5">
                  <div><p className="text-[14px] font-bold text-[#12172B]">Waktu pengingat sesi</p><p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">Seberapa awal sebelum sesi live.</p></div>
                  <div className="flex h-11 items-center rounded-xl border border-slate-200 px-3"><select className="bg-transparent text-[14px] font-semibold text-[#12172B] outline-none"><option>15 menit</option><option>1 jam</option><option>3 jam</option><option>1 hari</option></select></div>
                </div>
                <SetToggleRow label="Laporan mingguan" desc="Ringkasan progres belajar tiap Minggu." on={pref.weekly_report} onClick={() => setPref((p) => ({ ...p, weekly_report: !p.weekly_report }))} />
              </SetCard>
              <SetCard title="Pemutaran Rekaman" footer={
                <button onClick={() => flash("Preferensi disimpan.")} className="h-11 rounded-xl px-6 text-[14px] font-extrabold text-white transition hover:bg-[#0F5A52]" style={{ background: "#16796E" }}>Simpan Perubahan</button>
              }>
                <SetToggleRow label="Putar otomatis" desc="Lanjut ke rekaman berikutnya secara otomatis." on={pref.autoplay} onClick={() => setPref((p) => ({ ...p, autoplay: !p.autoplay }))} />
                <SetToggleRow label="Tampilkan subtitle" desc="Aktifkan subtitle bawaan saat memutar rekaman." on={pref.subtitle} onClick={() => setPref((p) => ({ ...p, subtitle: !p.subtitle }))} />
              </SetCard>
            </>
          )}

          {pane === "tagihan" && (
            <>
              {/* CATATAN: seluruh data Tagihan di bawah ini DUMMY/placeholder — belum ada backend subscription/billing. */}
              <SetCard>
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5 text-white" style={{ background: "#16796E" }}>
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold">Paket Aktif</span>
                    <p className="mt-2 text-[20px] font-extrabold">E-Learning 3 Bahasa</p>
                    <p className="mt-0.5 text-[13px] font-medium text-white/80">Inggris · Jepang · Korea · diperpanjang otomatis</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[24px] font-extrabold leading-none">Rp 1,2jt<span className="text-[13px] font-bold text-white/80">/bln</span></p>
                    <p className="mt-1.5 text-[12px] font-medium text-white/80">Perpanjang berikutnya 12 Jun 2026</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button className="h-11 rounded-xl px-5 text-[14px] font-extrabold text-white transition hover:bg-[#0F5A52]" style={{ background: "#16796E" }}>Upgrade Paket</button>
                  <button className="h-11 rounded-xl border border-slate-200 px-5 text-[14px] font-bold text-[#12172B] transition hover:bg-slate-50">Kelola Langganan</button>
                </div>
              </SetCard>

              <SetCard title="Cicilan Berjalan">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[14px] font-bold text-[#12172B]">Cicilan 2 dari 3</p>
                    <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">Jatuh tempo 12 Jun 2026 · Rp 400rb</p>
                    <div className="mt-2 h-2 w-48 overflow-hidden rounded-full" style={{ background: "#E8EAEE" }}><div className="h-full rounded-full" style={{ width: "66%", background: "#16796E" }} /></div>
                  </div>
                  <button className="h-11 rounded-xl px-5 text-[14px] font-extrabold text-[#12172B] transition hover:brightness-95" style={{ background: "#F2CB05" }}>Bayar Sekarang</button>
                </div>
              </SetCard>

              <SetCard title="Metode Pembayaran">
                <div className="flex items-center justify-between gap-4 py-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-11 items-center justify-center rounded-lg border border-slate-200" style={{ background: "#F5F6F8" }}><CreditCard className="h-5 w-5 text-[#16796E]" /></span>
                    <div><p className="text-[14px] font-bold text-[#12172B]">VISA •••• 4821</p><p className="text-[12px] font-medium text-[#6B7280]">Kedaluwarsa 08/27</p></div>
                  </div>
                  <button className="text-[13px] font-bold text-[#16796E]">Ubah</button>
                </div>
              </SetCard>

              <SetCard title="Riwayat Tagihan">
                <div className="flex flex-col">
                  {([["12 Mei 2026", "Langganan bulanan", "Rp 1,2jt"], ["12 Apr 2026", "Langganan bulanan", "Rp 1,2jt"], ["14 Feb 2026", "Cicilan 1 dari 3", "Rp 400rb"]] as Array<[string, string, string]>).map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Check className="h-4 w-4" /></span>
                        <div><p className="text-[14px] font-bold text-[#12172B]">{r[1]}</p><p className="text-[12px] font-medium text-[#6B7280]">{r[0]}</p></div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[14px] font-extrabold text-[#12172B]">{r[2]}</span>
                        <button className="text-[#6B7280] transition hover:text-[#16796E]"><Download className="h-[18px] w-[18px]" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </SetCard>
            </>
          )}
        </div>

        {/* mobile signout */}
        <div className="px-6 pb-6 lg:hidden">
          <button onClick={signOut} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 py-3 text-[14px] font-bold text-rose-500 transition hover:bg-rose-50">
            <LogOut className="h-4 w-4" /> Keluar dari Akun
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

  // Fetch open batches when Reguler program + language selected
  useEffect(() => {
    if (enrollProgram !== "Kelas Reguler" || !enrollLang || !showEnroll) {
      setAvailBatches([]);
      return;
    }
    setLoadingBatches(true);
    // Map English language name to possible Indonesian/alias
    const langAliases: Record<string, string[]> = {
      "English": ["English", "Inggris"],
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
      .from("regular_class_batches")
      .select("id, batch_code, language, schedule_day, schedule_time, start_date, end_date, sessions_total, current_enrolled, max_students, status")
      .in("language", searchLangs)
      .eq("status", "open")
      .order("start_date", { ascending: true })
      .then(({ data }: any) => {
        setAvailBatches(data || []);
        setLoadingBatches(false);
      });
  }, [enrollProgram, enrollLang, showEnroll, supabase]);
  // [linguo-patch:reguler-terms-v1] reset checkbox tiap ganti pilihan / buka-tutup modal
  useEffect(() => { setAgreeReguler(false); }, [enrollProgram, enrollLang, showEnroll]);

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
    C: [100000, 105000, 110000, 120000],
    D: [90000, 95000, 100000, 110000],
    E: [150000, 160000, 170000, 180000],
  };
  const PRIVATE_LANG_CAT: Record<string, "A" | "B" | "C" | "D" | "E"> = {
    Swahili: "A", Greek: "A", Hindi: "A", Turkish: "A", Norwegian: "A", Tagalog: "A",
    Vietnamese: "A", Swedish: "A", Urdu: "A", Kurdish: "A", Hebrew: "A", Polish: "A",
    Portuguese: "A", Finnish: "A", Czech: "A", "Traditional Chinese": "A", Hungarian: "A",
    Esperanto: "A", Farsi: "A", "English British": "A", Romanian: "A", Khmer: "A",
    Danish: "A", Uzbek: "A", Serbian: "A", Estonian: "A", Latin: "A",
    "Ancient Egyptian": "A", Georgian: "A", Irish: "A",
    Russian: "B", Dutch: "B", Italian: "B", Spanish: "B", Thai: "B", "Sign Language": "B",
    Arabic: "C", English: "C", Japanese: "C", German: "C", Korean: "C", Mandarin: "C", French: "C",
    Javanese: "D", Sundanese: "D", Madurese: "D", Batak: "D", Banjar: "D",
    Balinese: "D", Malay: "D", Bugis: "D",
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
    (isTestPrep ? "" : `• Bahasa: ${enrollLang}\n`) +
    `• Durasi: ${enrollDuration} menit/sesi\n` +
    `• Preferensi hari: ${Object.keys(enrollSchedule).join(", ") || "-"}\n` +
    `• Preferensi jam: ${Object.entries(enrollSchedule).map(([d,ts]) => d + ": " + ts.join(", ")).join(" | ") || "-"}\n` +
    `Mohon info jadwal dan pembayarannya. Terima kasih!`
  );

  const handleConfirm = async () => {
    try {
      // [linguo-patch:lead-insert-fix-v1] insert (bukan upsert) — tabel leads ga punya unique constraint di email
      const { error: __leadDbgErr } = await supabase.from("leads").insert({
        name: displayName,
        email: user?.email || "",
        wa_number: student?.whatsapp || null, // [linguo-patch:akun-onboarding-wa-required-v1]
        program: PROGRAMS.find(p => p.key === enrollProgram)?.label || enrollProgram,
        language: enrollLang || null,
        source: "Tambah Kelas",
        // [linguo-patch:lead-akun-schema-fix-v1] kolom valid leads only; jadwal chip-friendly
        schedule_preference: Object.entries(enrollSchedule).flatMap(([d, ts]) => ts.map((t) => `${d} ${t}`)).join(", ") || null,
      });
      // lead = CRM inquiry log; kalau gagal, registrasi siswa di bawah tetap jalan
      // — cukup log ke console, jangan ganggu siswa dgn popup.
      if (__leadDbgErr) console.warn("Lead save error:", __leadDbgErr);
    } catch (e: any) {
      console.warn("Lead save threw:", e);
    }

    // ── FIX: Save registrasi ke Supabase biar punya UUID valid ──
    let studentId: string | null =
      student?.id && student.id !== "pending" ? student.id : null;

    // 1. Pastikan student record ada (upsert by email)
    if (!studentId) {
      try {
        const { data: upserted, error: studentErr } = await supabase
          .from("students")
          .upsert(
            {
              email: user?.email || "",
              name: displayName,
              avatar_url: user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null,
            },
            { onConflict: "email" }
          )
          .select("id")
          .single();
        if (studentErr) throw studentErr;
        studentId = upserted?.id ?? null;
      } catch (e) {
        console.error("Upsert student gagal:", e);
      }
    }

    // 2. Insert registrasi ke DB + return row lengkap
    let newReg: any = null;
    if (studentId) {
      try {
        const { data: inserted, error: regErr } = await supabase
          .from("registrations")
          .insert({
            student_id: studentId,
            affiliate_ref_code: getRefCodeFromCookie(), // [linguo-patch:akun-affiliate-capture-v1]
            product: enrollProgram,
            language: isTestPrep ? "IELTS/TOEFL" : enrollLang,
            level: "A1.1",
            status: "Menunggu Pembayaran",
            sessions_total: 0,
            sessions_used: 0,
            duration: enrollDuration,
            total_amount: isFixedPrice ? (flatPrice[enrollProgram] || 0) : price * 8,
            payment_status: "Belum Bayar",
            enrollment_source: "self_service",
            registration_date: new Date().toISOString(),
          })
          .select(
            "id, product, language, level, status, sessions_total, sessions_used, duration, total_amount, payment_status, registration_date, teacher_id, payment_proof_url, payment_proof_uploaded_at, payment_verified_at, payment_rejection_reason, teachers(name, whatsapp)"
          )
          .single();
        if (regErr) throw regErr;
        newReg = inserted;
      } catch (e: any) {
        console.error("Insert registrasi gagal:", e);
        alert(
          "Maaf, gagal menyimpan pendaftaran. Silakan hubungi admin via WhatsApp untuk bantuan."
        );
        setShowEnroll(false);
        setEnrollStep(0);
        return;
      }
    }

    // 3. Update state — kalau DB save sukses pake row real, kalau gagal fallback mock
    const pendingReg = newReg || {
      id: `pending-${Date.now()}`,
      product: enrollProgram,
      language: isTestPrep ? "IELTS/TOEFL" : enrollLang,
      level: "A1.1",
      status: "Menunggu Pembayaran",
      sessions_total: 0,
      sessions_used: 0,
      duration: enrollDuration,
      total_amount: isFixedPrice ? (flatPrice[enrollProgram] || 0) : price * 8,
      payment_status: "Belum Bayar",
      registration_date: new Date().toISOString(),
      teachers: null,
    };

    // 4. Kalau student state-nya mock/belum ada, reload biar fetch fresh
    if (!student || student.id === "pending" || !student.id) {
      try {
        localStorage.removeItem(`linguo_wizard_${user?.id || user?.email}`);
      } catch {}
      window.location.reload();
      return;
    }

    setStudent((s: any) =>
      s ? { ...s, registrations: [...s.registrations, pendingReg] } : s
    );
    setShowEnroll(false);
    setEnrollStep(0);
    return pendingReg;
  };

  const handleXenditCheckout = async () => {
    try {
      const newReg = await handleConfirm();
      if (!newReg?.id) {
        alert("Gagal menyimpan pendaftaran. Silakan coba lagi atau hubungi admin via WA.");
        return;
      }
      const totalAmount = isFixedPrice ? (flatPrice[enrollProgram] || 0) : price * 8;
      const programLabel = PROGRAMS.find(p => p.key === enrollProgram)?.label || enrollProgram;
      const langLabel = isTestPrep ? "IELTS/TOEFL" : enrollLang;
      const desc = `${programLabel} — ${langLabel} (${enrollDuration} min/sesi)`;

      const res = await fetch(
        "https://jbtgciepdmqxxcjflrxz.supabase.co/functions/v1/xendit-create-invoice",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            registration_id: newReg.id,
            amount: totalAmount,
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
        // Save URL ke DB supaya user bisa lanjutin pembayaran kalau keluar tanpa bayar
        await supabase
          .from("registrations")
          .update({ xendit_invoice_url: data.invoice_url })
          .eq("id", newReg.id);
        window.location.href = data.invoice_url;
      } else {
        console.error("Xendit error:", data);
        alert("Gagal membuat invoice. Silakan coba lagi atau hubungi admin via WA.");
      }
    } catch (e) {
      console.error("Xendit checkout error:", e);
      alert("Terjadi kesalahan koneksi. Silakan coba lagi atau hubungi admin via WA.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={() => setShowEnroll(false)}>
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
          <button onClick={() => setShowEnroll(false)} className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">✕</button>
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
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${enrollProgram === p.key ? "border-teal-500 bg-teal-50" : "border-gray-100 hover:border-teal-300"}`}>
                    <span className="text-2xl">{p.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{p.label}</p>
                      <p className="text-xs text-gray-400">{p.desc}</p>
                      <p className="text-xs font-semibold text-teal-600 mt-0.5">{p.price}</p>
                    </div>
                    <span className="text-gray-300 text-sm">›</span>
                  </button>
                ))}
              </motion.div>
            )}

            {/* Step 1: Bahasa (skip for test prep) */}
            {enrollStep === 1 && !isTestPrep && (
              <motion.div key="s1" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }} className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Pilih bahasa:</p>
                <input type="text" placeholder="Cari bahasa..." value={langSearch} onChange={e => setLangSearch(e.target.value)} autoFocus
                  className="w-full h-10 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                <div className="grid grid-cols-3 gap-2">
                  {enrollAvailLangs.map(lang => (
                    <button key={lang} onClick={() => { setEnrollLang(lang); setEnrollStep(2); }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${enrollLang === lang ? "border-teal-500 bg-teal-50" : "border-gray-100 hover:border-teal-300"}`}>
                      <img src={getFlagUrl(lang)} alt="" className="h-6 w-6 object-contain rounded-sm" />
                      <span className="text-xs font-medium text-gray-700">{lang}</span>
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
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all ${enrollDuration === d.val ? "border-teal-500 bg-teal-50" : "border-gray-100 hover:border-teal-300"}`}>
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
                      <div key={d} className={`rounded-xl border-2 transition-all ${selected ? "border-teal-400 bg-teal-50/50" : "border-gray-100"}`}>
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
                                  className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${active ? "border-teal-500 bg-teal-500 text-white" : "border-gray-200 text-gray-600 hover:border-teal-300"}`}>
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
                <p className="text-xs text-gray-400 bg-amber-50 rounded-xl px-3 py-2">
                  💡 Admin akan mencocokkan preferensimu dengan jadwal pengajar yang tersedia. Jadwal final dikonfirmasi via WhatsApp.
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
                <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 space-y-2">
                  <div className="flex items-center gap-3 mb-2">
                    {!isTestPrep && <img src={getFlagUrl(enrollLang)} alt="" className="h-8 w-8 object-contain rounded" />}
                    <div>
                      <p className="font-bold text-gray-900">{isTestPrep ? "IELTS/TOEFL Prep" : enrollLang}</p>
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
                        ["Estimasi/bulan", `Rp${(price * 8).toLocaleString("id-ID")} (8 sesi)`],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between text-sm">
                          <span className="text-gray-500">{k}</span>
                          <span className="font-semibold text-gray-800">{v}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Info batch for Reguler — show available batches from DB */}
                {isRegulerEnroll && (
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                    {loadingBatches ? (
                      <p className="text-xs text-blue-600">⏳ Memuat batch yang tersedia...</p>
                    ) : availBatches.length > 0 ? (
                      <>
                        <p className="text-xs font-semibold text-blue-700 mb-2">📅 Batch {enrollLang} yang tersedia:</p>
                        <div className="space-y-1.5">
                          {availBatches.slice(0, 3).map((b: any) => {
                            const seatsLeft = (b.max_students || 15) - (b.current_enrolled || 0);
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
                                  {b.schedule_day}, {b.schedule_time} WIB · Mulai {startDate}
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
                        <p className="text-[10px] text-blue-600 mt-2">💡 Admin akan mencocokkan kamu ke batch yang paling cocok via WhatsApp.</p>
                      </>
                    ) : (
                      <p className="text-xs text-blue-700">
                        📋 Belum ada batch {enrollLang} yang dibuka. Admin akan menghubungi kamu via WhatsApp begitu batch baru tersedia, atau kamu bisa{" "}
                        <a href="/jadwal-kelas-reguler" target="_blank" className="underline font-semibold">cek jadwal lengkap</a>.
                      </p>
                    )}
                  </div>
                )}

                {/* Tagihan total (termasuk kelas lain yang belum bayar) */}
                {unpaidTotal > 0 && (
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-sm">
                    <p className="font-semibold text-amber-700 mb-1">⚠️ Tagihan belum lunas</p>
                    <div className="flex justify-between text-amber-600">
                      <span>Kelas sebelumnya</span>
                      <span className="font-bold">Rp{unpaidTotal.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="border-t border-amber-200 mt-2 pt-2 flex justify-between font-bold text-amber-800">
                      <span>Total yang perlu dibayar</span>
                      <span>Rp{(unpaidTotal + (isFixedPrice ? (flatPrice[enrollProgram] || 0) : price * 8)).toLocaleString("id-ID")}</span>
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
                  💳 Bayar Otomatis (Xendit)
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
                  className="w-full h-10 rounded-xl border-2 border-teal-200 text-teal-600 font-semibold text-sm hover:bg-teal-50 transition-colors">
                  ➕ Selesai & Tambah Kelas Lain
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

export default function AkunPage() {

  const [user, setUser] = useState<any>(null);

  // [linguo-patch:beranda-mandiri-resume-v2] Resume self-study (Belajar Mandiri) buat kartu di "Kelas Kamu".
  // Dihitung pakai `user` STATE yang reliable (bukan getSession lokal di child) + keyed ke user?.id →
  // auto-jalan begitu user siap, persist antar-tab, ga ilang pas balik ke Beranda.
  const [mandiri, setMandiri] = useState<null | {
    native: string; label: string; photo: string | null; slug: string;
    total: number; done: number; pct: number; resumeId: string; resumeTitle: string; fresh: boolean;
  }>(null);

  useEffect(() => {
    const uid = user?.id;
    if (!uid) { setMandiri(null); return; }
    let alive = true;
    (async () => {
      try {
        const { data: mods } = await supabase
          .from("lms_modules")
          .select("id,language,sort_order")
          .order("sort_order");
        const modList = (mods || []) as { id: string; language: string; sort_order: number }[];
        if (!modList.length) { if (alive) setMandiri(null); return; }
        const moduleIds = modList.map((m) => m.id);
        const [lessRes, progRes] = await Promise.all([
          supabase.from("lms_lessons").select("id,module_id,title,sort_order").in("module_id", moduleIds).order("sort_order"),
          supabase.from("lms_progress").select("lesson_id,status").eq("user_id", uid),
        ]);
        const lessons = (lessRes.data || []) as { id: string; module_id: string; title: string; sort_order: number }[];
        const done = new Set<string>(
          ((progRes.data as any[]) || []).filter((p) => p?.status === "completed").map((p) => p.lesson_id)
        );
        const langByModule: Record<string, string> = {};
        const modOrder: Record<string, number> = {};
        modList.forEach((m, i) => { langByModule[m.id] = m.language; modOrder[m.id] = m.sort_order ?? i; });
        const byLang: Record<string, typeof lessons> = {};
        lessons.forEach((l) => { const lg = langByModule[l.module_id]; if (lg) (byLang[lg] = byLang[lg] || []).push(l); });

        // pilih bahasa dengan sesi-selesai terbanyak (= yang "lagi jalan")
        let bestLang = ""; let bestArr: typeof lessons = []; let bestDone = -1;
        Object.keys(byLang).forEach((language) => {
          const arr = byLang[language].slice().sort((a, b) => (modOrder[a.module_id] - modOrder[b.module_id]) || (a.sort_order - b.sort_order));
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
        });
      } catch {
        /* best-effort — kartu opsional */
      }
    })();
    return () => { alive = false; };
  }, [user?.id]);

  const [showPlacementPicker, setShowPlacementPicker] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState<Schedule[]>([]);
  const [streak, setStreak] = useState(0);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"beranda"|"jadwal"|"materi"|"akun"|"sertifikat"|"pustaka">("beranda"); // [linguo-patch:akun-pustaka-tab-v1]
  const [lmsSesi, setLmsSesi] = useState<string | null>(null);
  // Kelas & Materi master-detail UI state
  const [materiSel, setMateriSel] = useState<string | null>(null);
  const [materiTab, setMateriTab] = useState<"sesi" | "materi">("sesi");
  const [materiFilter, setMateriFilter] = useState<"all" | "run" | "done">("all");
  const [materiView, setMateriView] = useState<"live" | "mandiri" | "jelajahi">("live");
  const [materiLang, setMateriLang] = useState<string | null>(null);
  const [materiSearch, setMateriSearch] = useState("");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const menu = sp.get("menu");
    const sesi = sp.get("sesi");
    const view = sp.get("view");
    let resolved: "beranda" | "jadwal" | "materi" | "akun" | "sertifikat" | "pustaka" | null = null;
    if (sesi) { setLmsSesi(sesi); setMateriView("mandiri"); resolved = "materi"; } // [linguo-patch:akun-inplace-lessonplayer-v1] deep-link sesi → balik ke sub-tab mandiri pas player ditutup
    if (view === "live" || view === "mandiri" || view === "jelajahi") { setMateriView(view); resolved = "materi"; }
    if (!resolved && (menu === "beranda" || menu === "jadwal" || menu === "materi" || menu === "akun" || menu === "sertifikat" || menu === "pustaka")) resolved = menu;
    if (!resolved) {
      try {
        const saved = localStorage.getItem("linguo_akun_tab");
        if (saved === "beranda" || saved === "jadwal" || saved === "materi" || saved === "akun" || saved === "sertifikat" || saved === "pustaka") resolved = saved;
      } catch {}
    }
    if (resolved) setActiveTab(resolved);
    // bersihin deep-link param sekali pakai, biar refresh berikutnya andelin tab tersimpan (bukan param nyangkut)
    if (menu || sesi || view) {
      try {
        const u = new URL(window.location.href);
        ["menu", "sesi", "view"].forEach((k) => u.searchParams.delete(k));
        window.history.replaceState(null, "", u.toString());
      } catch {}
    }
  }, []);
  // persist tab aktif -> refresh balik ke tab terakhir dibuka
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem("linguo_akun_tab", activeTab); } catch {}
  }, [activeTab]);
  // Booking Modal
  const [bookingReg, setBookingReg] = useState<StudentReg | null>(null);
  const [availSlots, setAvailSlots] = useState<Set<string>>(new Set()); // "day_of_week-HH:MM"
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set()); // ISO strings
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [detailReg, setDetailReg] = useState<any>(null); // ISO string
  const [pendingModalReg, setPendingModalReg] = useState<any>(null); // pending-payment popup
  const [bookingSubmit, setBookingSubmit] = useState(false);
  // Email/password login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showEmailLogin, setShowEmailLogin] = useState(true);
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setIsSigningIn(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/akun` },
    });
    if (error) setIsSigningIn(false);
  };

  const signOut = async () => {
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
    const { error } = await supabase.auth.signInWithOtp({
      email: loginEmail,
      options: {
        emailRedirectTo: window.location.origin + "/akun",
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
  useEffect(() => {
    if (!user?.email) return;
    loadStudentData(user.email);
  }, [user?.email]);

  async function loadStudentData(email: string) {
    setDataLoading(true);
    try {
      let { data: studentData } = await supabase
        .from("students")
        .select("id, name, email, whatsapp, avatar_url")
        .eq("email", email)
        .maybeSingle();

      // ─────────────────────────────────────────────────────────────────
      // SKIP-ONBOARDING FOR DIGITAL CUSTOMERS
      // Kalau user belum ada di `students` tapi udah punya digital_purchases
      // (e-learning / e-book / IELTS sim) yang Lunas, auto-create student row
      // dan skip onboarding. Mereka udah commit ke produk — gak perlu nudge lagi.
      // ─────────────────────────────────────────────────────────────────
      if (!studentData && user?.id) {
        const { data: digitalPurchases } = await supabase
          .from("digital_purchases")
          .select("id")
          .eq("auth_user_id", user.id)
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
          registration_date, teacher_id, batch_id,
          payment_proof_url, payment_proof_uploaded_at,
          payment_verified_at, payment_rejection_reason,
          pipeline_status, archived_at,
          teachers(name, whatsapp)
        `)
        .eq("student_id", studentData.id)
        .order("registration_date", { ascending: false });

      // Fetch batch data for reguler classes
      const regsWithBatch = (regsData as any) || [];
      const batchIds = regsWithBatch.filter((r: any) => r.batch_id).map((r: any) => r.batch_id);
      let batchMap: Record<string, any> = {};
      if (batchIds.length > 0) {
        try {
          const { data: batches } = await supabase
            .from("regular_class_batches")
            .select("id, batch_code, schedule_day, schedule_time, start_date, end_date, zoom_link, sessions_total")
            .in("id", batchIds);
          if (batches) {
            batches.forEach((b: any) => { batchMap[b.id] = b; });
          }
        } catch (e) { /* batch table might not exist yet */ }
      }
      const enrichedRegs = regsWithBatch.map((r: any) => ({
        ...r,
        batch: r.batch_id ? batchMap[r.batch_id] || null : null,
      }));

      // Student is now active — clear wizard cache
      try { localStorage.removeItem(`linguo_wizard_${user?.id || email}`); } catch {}
      setStudent({ ...studentData, registrations: enrichedRegs });

      // ── Onboarding: show for new users with no registrations ──
      const regs = enrichedRegs;
      const onboardKey = `linguo_onboarded_${studentData.id}`;
      if (regs.length === 0 && !localStorage.getItem(onboardKey)) {
        setShowOnboarding(true);
      }

      const regIds = enrichedRegs.map((r: any) => r.id);

      // Upcoming schedules
      if (regIds.length > 0) {
        try {
          const { data: schedData } = await supabase
            .from("schedules")
            .select("id, registration_id, scheduled_at, duration_minutes, status")
            .in("registration_id", regIds)
            .in("status", ["scheduled", "pending"])
            .gt("scheduled_at", new Date().toISOString())
            .order("scheduled_at", { ascending: true });
          setUpcomingSchedules(schedData || []);
        } catch (e) { /* schedules table might not exist */ }
      }

      // Badges
      try {
        const { data: badgeData } = await supabase
          .from("student_badges")
          .select("*")
          .eq("student_id", studentData.id)
          .order("earned_at", { ascending: false });
        setBadges(badgeData || []);
      } catch (e) { /* table might not exist */ }

      // Streak
      if (regIds.length > 0) {
        try {
          const { data: streakData } = await supabase
            .from("schedules")
            .select("scheduled_at")
            .in("registration_id", regIds)
            .eq("status", "completed")
            .order("scheduled_at", { ascending: false });
          if (streakData && streakData.length > 0) {
            const getWeekNum = (d: Date) => {
              const start = new Date(d.getFullYear(), 0, 1);
              return Math.floor(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
            };
            const weeks = new Set(streakData.map((s: any) => {
              const d = new Date(s.scheduled_at);
              return `${d.getFullYear()}-${getWeekNum(d)}`;
            }));
            let weekStreak = 0;
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
        } catch (e) { /* table might not exist */ }
      }
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
      const { error } = await supabase.from("schedules").insert(rows);
      if (error) throw error;
      setBookingReg(null);
      setSelectedSlots(new Set());
      alert(`✅ ${rows.length} sesi berhasil di-booking! Menunggu konfirmasi pengajar.`);
    } catch (e: any) {
      alert("Gagal: " + e.message);
    }
    setBookingSubmit(false);
  }

    // Design B: "Kursus Aktif" = user udah commit (bayar atau udah upload bukti)
  const activeRegs = useMemo(() => student?.registrations.filter(r =>
    // [linguo-patch:akun-hide-cancelled-v1] buang reg yang di-Batal-in admin/cron & yang udah diarsip
    r.pipeline_status !== "Batal" && !r.archived_at && (
      r.status === "Aktif" ||
      r.status === "Pending" ||
      (r.status === "Menunggu Pembayaran" && r.payment_status === "Menunggu Verifikasi")
    )
  ) || [], [student]);

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
        status: issued ? "issued" : "progress",
        pct, used, total,
        date: issued ? new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : undefined,
        hours: issued ? total : undefined,
        idNo: issued ? `LING-${String(r.language || "XX").slice(0, 2).toUpperCase()}-${base}-${String(r.id).replace(/\D/g, "").slice(0, 6).padStart(6, "0")}` : undefined,
      };
    });
  }, [activeRegs]);
  // "Menunggu Pembayaran" = user belum upload bukti transfer
  const pendingPaymentRegs = useMemo(() => student?.registrations.filter(r =>
    // [linguo-patch:akun-hide-cancelled-v1] guard sama — jangan tampilin yang dibatalkan/diarsip
    r.pipeline_status !== "Batal" && !r.archived_at &&
    r.status === "Menunggu Pembayaran" &&
    (r.payment_status === "Belum Bayar" || !r.payment_status)
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex flex-col items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-200">
              <img src="/images/logo-white.png" alt="Linguo" className="h-10 w-10 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Linguo.id</h1>
            <p className="text-gray-500 mt-1">Masuk ke akun belajarmu</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <button
              onClick={signInWithGoogle}
              disabled={isSigningIn}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all"
            >
              {isSigningIn ? (
                <div className="h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Masuk dengan Google
                </>
              )}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">atau</span></div>
            </div>

            {!showEmailLogin ? (
              <button onClick={() => setShowEmailLogin(true)} className="flex h-10 w-full items-center justify-center rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                Masuk dengan Email & Password
              </button>
            ) : otpSent ? (
              <div className="space-y-3 text-center"> {/* linguo-patch:akun-otp-login-v1 */}
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                  <Mail className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-gray-800">Link login terkirim!</p>
                <p className="text-xs leading-relaxed text-gray-500">
                  Kami kirim link masuk ke <span className="font-medium text-gray-700">{loginEmail}</span>. Buka email, klik link-nya, kamu langsung masuk. Cek juga folder spam ya.
                </p>
                <button onClick={() => setOtpSent(false)} className="text-xs font-medium text-teal-600 hover:underline">
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
                  className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  autoFocus
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && signInWithEmail()}
                  className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                />
                <button
                  onClick={signInWithEmail}
                  disabled={isSigningIn || !loginEmail || !loginPassword}
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-teal-600 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  {isSigningIn ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Masuk"}
                </button>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100" /></div>
                  <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white px-2 text-gray-300">atau</span></div>
                </div>

                <button
                  onClick={signInWithMagicLink}
                  disabled={isSigningIn || !loginEmail}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50/60 text-sm font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-50 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Kirim link login ke email
                </button>
                <p className="text-center text-[11px] leading-relaxed text-gray-400">Nggak punya / lupa password? Pakai link login, tanpa password.</p>
              </div>
            )}

            <p className="text-center text-xs text-gray-400 mt-4">Gunakan email yang sama dengan saat mendaftar kelas</p>
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">Belum punya akun? <a href="/" className="text-teal-600 font-medium hover:underline">Daftar kelas dulu</a></p>
          <p className="text-center mt-3"><a href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">← Kembali ke Beranda</a></p>
        </motion.div>
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

  // No student record
  if (!student) {
    // Show onboarding wizard
    if (showOnboarding) {
      return (
        <OnboardingWizard
          user={user}
          studentId={undefined}
          onDone={async (data) => {
            try {
              // 1. Find-or-create student record (manual because email is not UNIQUE)
              //    Legit use case: 1 parent email can have multiple children.
              //    For /akun self-service: first match wins.
              const studentPayload = {
                name: data.name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Siswa",
                email: user?.email,
                whatsapp: data.wa || null, // [linguo-patch:onboarding-wa-step-v1]
                birth_date: data.birthdate || null, // [linguo-patch:onboarding-profile-fields-v1]
                domicile: data.domicile || null,     // [linguo-patch:onboarding-profile-fields-v1]
                avatar_url: user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null,
              };
              let studentRow: any = null;
              const { data: existing, error: lookupError } = await supabase
                .from("students")
                .select("*")
                .eq("email", user?.email || "")
                .limit(1)
                .maybeSingle();
              if (lookupError) {
                throw new Error(lookupError.message || "Gagal mencari data siswa");
              }
              if (existing) {
                // [linguo-patch:onboarding-profile-fields-v1] isi field profil yg masih kosong
                const { data: updated } = await supabase
                  .from("students")
                  .update({
                    name: !isPlaceholderName(existing.name) ? existing.name : studentPayload.name,
                    whatsapp: existing.whatsapp || studentPayload.whatsapp,
                    birth_date: existing.birth_date || studentPayload.birth_date,
                    domicile: existing.domicile || studentPayload.domicile,
                  })
                  .eq("id", existing.id)
                  .select()
                  .single();
                studentRow = updated || existing;
              } else {
                const { data: inserted, error: insertError } = await supabase
                  .from("students")
                  .insert(studentPayload)
                  .select()
                  .single();
                if (insertError || !inserted) {
                  throw new Error(insertError?.message || "Gagal menyimpan data siswa");
                }
                studentRow = inserted;
              }
              if (!studentRow) {
                throw new Error("Gagal menyimpan data siswa");
              }

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

              // 2. Insert registration with safe defaults (admin will fill in price/sessions later)
              const isTestPrep = data.program === "English Test Preparation";
              const { data: regRow, error: regError } = await supabase
                .from("registrations")
                .insert({
                  student_id: studentRow.id,
                  affiliate_ref_code: getRefCodeFromCookie(), // [linguo-patch:akun-affiliate-capture-v1]
                  product: data.program,
                  language: data.testType || data.lang || null,
                  level: data.level || (data.exp === "beginner" ? "A1.1" : "TBD"),
                  status: "Menunggu Pembayaran",
                  payment_status: "Belum Bayar",
                  pipeline_status: "Aktif",
                  sessions_total: 0,
                  sessions_used: 0,
                  duration: isTestPrep ? "90" : "60",
                  total_amount: 0,
                  registration_date: new Date().toISOString(),
                })
                .select(`
                  id, product, language, level, status,
                  sessions_total, sessions_used,
                  duration, total_amount, payment_status,
                  registration_date, teacher_id,
                  payment_proof_url, payment_proof_uploaded_at,
                  payment_verified_at, payment_rejection_reason,
                  teachers(name, whatsapp)
                `)
                .single();
              if (regError || !regRow) {
                throw new Error(regError?.message || "Gagal membuat registrasi");
              }

              // 3. Auto-save to leads table for CRM tracking (non-blocking)
              try {
                const subject = data.testType || data.lang || "";
                // [linguo-patch:lead-insert-fix-v1] insert (bukan upsert) — leads.email ga unique
                await supabase.from("leads").insert({
                  name: studentPayload.name,
                  email: user?.email || "",
                  wa_number: data.wa || null, // [linguo-patch:onboarding-wa-step-v1]
                  program: data.program,
                  language: subject || null,
                  source: "Onboarding Wizard",
                  experience: data.exp || null,
                  birthdate: data.birthdate || null, // [linguo-patch:onboarding-profile-fields-v1]
                  domicile: data.domicile || null,   // [linguo-patch:onboarding-profile-fields-v1]
                });
              } catch (e) {
                console.warn("Lead save non-fatal:", e);
              }

              // 4. Clear wizard cache, set real student state (skip mock card path)
              try {
                localStorage.setItem(`linguo_onboarded_${user?.id || user?.email}`, "1");
                localStorage.removeItem(`linguo_wizard_${user?.id || user?.email}`);
              } catch {}

              setStudent({ ...studentRow, registrations: [regRow as any] } as any);
              setShowOnboarding(false);
              setWizardCompleted(false);
              setShowSuccessAnim(true); // [linguo-patch:onboarding-success-lottie-v1]
            } catch (err: any) {
              console.error("Onboarding save failed:", err);
              alert(
                "Gagal menyimpan registrasi: " + (err?.message || "unknown") +
                "\n\nSilakan coba lagi atau hubungi tim Linguo via WhatsApp."
              );
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
          <div className="text-5xl mb-4">👋</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Halo, {firstName}!</h2>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">Akunmu sudah siap. Yuk temukan kelas yang paling cocok untukmu!</p>
          <button onClick={() => setShowOnboarding(true)}
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-teal-600 px-6 text-sm font-semibold text-white hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200 w-full justify-center">
            ✨ Mulai Onboarding
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
    <StudentShell active={activeTab === "sertifikat" ? "akun" : activeTab} onTabChange={(t) => setActiveTab(t)} firstName={firstName} avatarUrl={avatarUrl}>

      {/* ── WA Gate: user lama tanpa nomor WA — [linguo-patch:akun-wa-gate-existing-v1] ── */}
      {student && student.id && student.id !== "pending" && student.id !== user?.id && gateNeedsProfile(student) && (
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

      {/* ── Header (mobile only — desktop pakai sidebar + bell di samping search) ── */}
      <div className="lg:hidden">
        <TopBarMinimal
          studentId={student?.id || ""}
          avatarUrl={avatarUrl}
          firstName={firstName}
          onAvatarClick={() => setActiveTab("akun")}
        />
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <main className={activeTab === "materi" ? "w-full lg:flex lg:min-h-0 lg:flex-1 lg:flex-col" : activeTab === "beranda" ? "w-full" : (activeTab === "jadwal" || activeTab === "sertifikat" || activeTab === "pustaka") ? "mx-auto w-full max-w-[1320px] px-4 sm:px-6 pt-5 space-y-6" : "mx-auto max-w-6xl px-4 sm:px-6 pt-5 space-y-6"}>
        <AnimatePresence mode="wait">
          {activeTab === "beranda" && (
            <motion.div key="beranda" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {(() => {
                // ── derived khusus port frame ──
                const langGlyph = (lang: string): string => {
                  const g: Record<string, string> = {
                    Jepang: "あ", Japanese: "あ", Korea: "한", Korean: "한",
                    Mandarin: "中", Chinese: "中", Arab: "ع", Arabic: "ع",
                    Rusia: "Я", Russian: "Я", Thai: "ก", Ibrani: "א", Hebrew: "א",
                    Yunani: "Ω", Greek: "Ω", Hindi: "ह", Persia: "ف", Persian: "ف",
                  };
                  return g[lang] || "Aa";
                };
                const CARD_BG = ["bg-[#16796E]", "bg-rose-500", "bg-indigo-500", "bg-amber-500", "bg-cyan-600", "bg-violet-500"];
                const ICON_TINT = ["bg-[#16796E]/10 text-[#16796E]", "bg-rose-50 text-rose-500", "bg-indigo-50 text-indigo-500", "bg-amber-50 text-amber-600", "bg-cyan-50 text-cyan-600", "bg-violet-50 text-violet-500"];
                const HEXA = "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)";
                const activeLangCount = new Set(activeRegs.map((r: any) => r.language)).size;
                const teacherMap = new Map<string, { name: string; count: number; langs: Set<string> }>();
                activeRegs.forEach((r: any) => {
                  const tn = r?.teachers?.name;
                  if (!tn) return;
                  if (!teacherMap.has(tn)) teacherMap.set(tn, { name: tn, count: 0, langs: new Set() });
                  const t = teacherMap.get(tn)!;
                  t.count += 1;
                  t.langs.add(r.language);
                });
                const teacherList = Array.from(teacherMap.values());
                const initials = (n: string) => n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

                return (
                  <div className="flex min-h-[calc(100vh-2rem)] flex-col bg-white lg:grid lg:grid-cols-[330px_minmax(0,1fr)]">

                    {/* ════ KOLOM PROFIL (kiri di desktop) ════ */}
                    <aside className="order-2 flex flex-col lg:order-1 lg:border-r lg:border-slate-100">
                      {/* header teal + ornamen kuning (overflow-hidden cuma di header ini) */}
                      <div className="relative h-[132px] shrink-0 overflow-hidden bg-[#16796E]">
                        <div className="absolute -top-6 left-6 h-16 w-16 rotate-12 rounded-[14px] bg-[#F2CB05]/90" />
                        <div className="absolute left-24 top-8 h-10 w-10 rounded-full bg-[#F2CB05] opacity-90" />
                        <div className="absolute -top-4 right-10 h-20 w-20 rotate-[18deg] rounded-[18px] border-[10px] border-[#F2CB05] opacity-80" />
                        <div className="absolute right-28 top-12 h-9 w-9 rotate-45 rounded-[6px] bg-[#F2CB05] opacity-80" />
                        <div className="absolute bottom-3 right-6 h-12 w-12 rounded-full border-[7px] border-[#F2CB05]/80" />
                      </div>

                      {/* body — relative z-10 biar avatar naik di atas header teal (full keliatan) */}
                      <div className="relative z-10 -mt-14 flex min-h-0 flex-1 flex-col px-6 pb-6">
                        <AvatarUploader
                          avatarUrl={avatarUrl}
                          firstName={firstName}
                          studentId={student?.id}
                          supabase={supabase}
                          onUploaded={(url) => setStudent((s: any) => (s ? { ...s, avatar_url: url } : s))}
                        />

                        <h2 className="mt-4 text-[22px] font-extrabold leading-tight text-[#12172B]">{firstName}</h2>

                        {/* stats: Bahasa Aktif + Sertifikat CEFR */}
                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl border border-slate-100 p-4 shadow-[0_8px_24px_-16px_rgba(18,23,43,0.35)]">
                            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#16796E]/10 text-[#16796E]">
                              <Languages className="h-[18px] w-[18px]" strokeWidth={2.2} />
                            </div>
                            <div className="text-2xl font-extrabold leading-none text-[#12172B]">{activeLangCount}</div>
                            <div className="mt-1.5 text-[12px] font-medium text-gray-500">Bahasa Aktif</div>
                          </div>
                          <button onClick={() => setActiveTab("sertifikat")} className="rounded-2xl border border-slate-100 p-4 text-left shadow-[0_8px_24px_-16px_rgba(18,23,43,0.35)] transition hover:-translate-y-0.5 hover:border-[#F2CB05]/60">
                            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#F2CB05]/20 text-[#B9890A]">
                              <Award className="h-[18px] w-[18px]" strokeWidth={2.2} />
                            </div>
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-[#F2CB05]/20 px-2 py-0.5 text-[11px] font-bold text-[#B9890A]">Lihat <ChevronRight className="h-3 w-3" /></span>
                            <div className="mt-1.5 text-[12px] font-medium text-gray-500">Sertifikat CEFR</div>
                          </button>
                        </div>

                        {/* jadwal mendatang */}
                        <div className="mt-7 flex items-center justify-between">
                          <h3 className="text-[16px] font-extrabold text-[#12172B]">Jadwal Mendatang</h3>
                          <button onClick={() => setActiveTab("jadwal")} className="text-[12px] font-bold text-[#16796E] hover:text-[#0F5A52]">Lihat Semua</button>
                        </div>

                        {upcomingSchedules.length > 0 ? (
                          <div className="mt-3 flex flex-col gap-3 overflow-y-auto pb-2 pr-1" style={{ maxHeight: 320 }}>
                            {upcomingSchedules.slice(0, 5).map((s) => {
                              const d = new Date(s.scheduled_at);
                              const reg = student?.registrations?.find((r) => r.id === s.registration_id);
                              const lang = reg?.language || "";
                              return (
                                <button
                                  key={s.id}
                                  onClick={() => setActiveTab("jadwal")}
                                  className="group flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-[0_10px_30px_-20px_rgba(18,23,43,0.5)] transition-shadow hover:shadow-[0_16px_36px_-18px_rgba(18,23,43,0.5)]"
                                >
                                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#16796E]/10 text-lg font-extrabold text-[#16796E]">{langGlyph(lang)}</span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[14px] font-bold text-[#12172B]">{lang || "Sesi"}{reg?.level ? ` — ${reg.level}` : ""}</span>
                                    <span className="block text-[12px] font-medium text-gray-500">
                                      {d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} · {d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  </span>
                                  <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:text-[#16796E]" />
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-center">
                            <Calendar className="mx-auto mb-2 h-7 w-7 text-slate-300" strokeWidth={1.8} />
                            <p className="text-[13px] font-semibold text-gray-500">Belum ada jadwal mendatang</p>
                            <p className="mt-0.5 text-[12px] font-medium text-gray-400">Jadwal kelas kamu bakal muncul di sini.</p>
                          </div>
                        )}
                      </div>
                    </aside>

                    {/* ════ KOLOM UTAMA (kanan di desktop) ════ */}
                    <section className="order-1 flex min-w-0 flex-col gap-7 bg-[#F5F6F8] p-6 lg:order-2 lg:p-8">

                      {/* top bar: greeting + search (search = stub, lihat catatan) */}
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <h1 className="flex items-center gap-2 text-[24px] font-extrabold leading-tight text-[#12172B] sm:text-[26px]">Halo, {firstName} <motion.span style={{ display: "inline-block", transformOrigin: "75% 75%" }} animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}>👋</motion.span></h1>
                          <p className="mt-0.5 text-[14px] font-medium text-gray-500">{getGreeting()} — yuk belajar bahasa hari ini!</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex h-12 w-full max-w-[320px] items-center gap-2.5 rounded-2xl bg-white px-4 shadow-[0_10px_30px_-22px_rgba(18,23,43,0.6)] transition focus-within:ring-2 focus-within:ring-[#16796E]/30 sm:w-[300px]">
                            <Search className="h-[18px] w-[18px] shrink-0 text-gray-400" />
                            <input type="text" placeholder="Cari kelas, materi, atau pengajar…" className="w-full bg-transparent text-[14px] font-medium outline-none placeholder:text-slate-400" />
                          </label>
                          {student?.id && (
                            <div className="hidden lg:block">
                              <NotificationBell variant="topbar" userId={student.id} userType="student" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* promo banner — lebih pendek */}
                      <div className="relative overflow-hidden rounded-[1.5rem] bg-[#16796E] px-7 py-5 text-white sm:px-9 sm:py-6">
                        <div className="relative z-10 max-w-[60%]">
                          <h2 className="text-[19px] font-extrabold leading-snug sm:text-[22px]">Pilihan Tepat untuk Naik Level</h2>
                          <p className="mt-1.5 max-w-[420px] text-[13px] font-medium leading-relaxed text-white/85">Lanjut ke level berikutnya atau tambah bahasa baru lewat paket E-Learning 12+ bahasa.</p>
                          <button onClick={openEnrollWizard} className="mt-4 inline-flex h-10 items-center gap-2 rounded-2xl bg-white px-5 text-[13px] font-extrabold text-[#16796E] transition hover:bg-[#F2CB05] hover:text-[#12172B]">
                            Lihat Kelas <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="pointer-events-none absolute -right-6 top-1/2 hidden -translate-y-1/2 items-center gap-3 opacity-95 sm:flex">
                          <div className="h-20 w-20 rotate-[8deg] bg-[#F2CB05]" style={{ clipPath: HEXA }} />
                          <div className="-ml-8 mt-6 h-28 w-28 -rotate-[10deg] bg-[#F2CB05]/70" style={{ clipPath: HEXA }} />
                          <div className="-ml-4 -mt-12 h-16 w-16 bg-[#F2CB05]" style={{ clipPath: HEXA }} />
                        </div>
                      </div>

                      {/* Perlu Perhatian — card kecil (glyph + status), klik -> PaymentDetailModal */}
                      {pendingPaymentRegs.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="inline-flex items-center gap-2 text-[20px] font-extrabold text-[#12172B]">
                              <Clock className="h-5 w-5 text-amber-500" strokeWidth={2.5} />
                              Perlu Perhatian
                            </h2>
                            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-100 px-1.5 text-[11px] font-bold text-amber-700">
                              {pendingPaymentRegs.length}
                            </span>
                          </div>
                          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {pendingPaymentRegs.map((reg: any) => {
                              const photo = getLangPhoto(reg.language);
                              return (
                              <div
                                key={reg.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setPendingModalReg(reg)}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPendingModalReg(reg); } }}
                                className="group cursor-pointer rounded-3xl bg-white p-3 text-left shadow-[0_24px_50px_-30px_rgba(18,23,43,0.5)] ring-1 ring-amber-200 transition-transform hover:-translate-y-1"
                              >
                                <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-amber-400">
                                  {photo ? (
                                    <>
                                      <img src={photo} alt={reg.language} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-[52px] font-extrabold tracking-tight text-white/95 transition-transform duration-300 group-hover:scale-105">{langGlyph(reg.language)}</span>
                                      <div className="absolute -bottom-6 -right-4 h-24 w-24 rounded-full bg-white/10" />
                                    </>
                                  )}
                                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-amber-700 shadow-sm">
                                    <Clock className="h-3 w-3" strokeWidth={2.5} /> Belum Bayar
                                  </span>
                                </div>
                                <div className="px-2 pb-2 pt-4">
                                  <div className="flex items-center gap-2">
                                    <img src={getFlagUrl(reg.language)} alt="" className="h-4 w-4 shrink-0 rounded-sm object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                                    <h3 className="truncate text-[16px] font-extrabold leading-tight text-[#12172B]">{reg.language} — {reg.level || "TBD"}</h3>
                                  </div>
                                  <p className="mt-0.5 truncate text-[13px] font-medium text-gray-500">{PRODUCT_BADGE[reg.product]?.label || reg.product}</p>
                                  <div className="mt-4 flex items-center justify-between">
                                    <span className="text-[13px] font-extrabold text-amber-700">{reg.total_amount > 0 ? `Rp ${Number(reg.total_amount).toLocaleString("id-ID")}` : "Lihat detail"}</span>
                                    <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#16796E]">Bayar <ChevronRight className="h-3.5 w-3.5" /></span>
                                  </div>
                                  {/* [linguo-patch:akun-self-cancel-v1] siswa batalin sendiri — CUMA yang belum bayar (soft-cancel, no hard-delete) */}
                                  <button
                                    type="button"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (!confirm("Batalkan pendaftaran ini? Pendaftaran yang belum dibayar akan hilang dari daftar kamu.")) return;
                                      const { error } = await supabase.from("registrations").update({ pipeline_status: "Batal" }).eq("id", reg.id);
                                      if (error) { alert("Gagal membatalkan. Coba lagi atau hubungi admin."); return; }
                                      setStudent((prev: any) => prev ? { ...prev, registrations: (prev.registrations || []).map((x: any) => x.id === reg.id ? { ...x, pipeline_status: "Batal" } : x) } : prev);
                                      setPendingModalReg((cur: any) => (cur && cur.id === reg.id ? null : cur));
                                    }}
                                    className="mt-3 w-full rounded-xl border border-gray-200 py-2 text-[12px] font-bold text-gray-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                  >
                                    Batalkan pendaftaran
                                  </button>
                                </div>
                              </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Kelas Kamu (cards + progress, klik -> ClassDetailModal) */}
                      <div>
                        <div className="flex items-center justify-between">
                          <h2 className="text-[20px] font-extrabold text-[#12172B]">Kelas Kamu</h2>
                          {(activeRegs.length > 0 || mandiri) && (
                            <button onClick={openEnrollWizard} className="text-[13px] font-bold text-[#16796E] hover:text-[#0F5A52]">+ Tambah</button>
                          )}
                        </div>

                        {(activeRegs.length > 0 || mandiri) ? (
                          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {/* [linguo-patch:beranda-mandiri-resume-v2] kartu self-study (Belajar Mandiri) — klik buka sesi via OVERLAY (instan) */}
                            {mandiri && (
                              <button
                                key="mandiri-resume"
                                onClick={() => {
                                  setLmsSesi(mandiri.resumeId);
                                  setMateriView("mandiri");
                                  if (typeof window !== "undefined") window.history.replaceState(null, "", `/akun?menu=materi&sesi=${mandiri.resumeId}`);
                                }}
                                className="group rounded-3xl bg-white p-3 text-left shadow-[0_24px_50px_-30px_rgba(18,23,43,0.5)] ring-1 ring-[#16796E]/15 transition-transform hover:-translate-y-1"
                              >
                                <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-[#16796E]">
                                  {mandiri.photo ? (
                                    <>
                                      <img src={mandiri.photo} alt={mandiri.label} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                                    </>
                                  ) : (
                                    <span className="text-[56px] font-extrabold tracking-tight text-white/95 transition-transform duration-300 group-hover:scale-105">{mandiri.native.slice(0, 2)}</span>
                                  )}
                                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[#16796E] shadow-sm">
                                    <GraduationCap className="h-3 w-3" strokeWidth={2.5} /> Belajar Mandiri
                                  </span>
                                </div>
                                <div className="px-2 pb-2 pt-4">
                                  <h3 className="truncate text-[16px] font-extrabold leading-tight text-[#12172B]">{mandiri.native} <span className="font-bold text-gray-400">· {mandiri.label}</span></h3>
                                  <p className="mt-0.5 truncate text-[13px] font-medium text-gray-500">{mandiri.fresh ? "Lanjut" : "Ulangi"}: {mandiri.resumeTitle}</p>
                                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E8EAEE]">
                                    <div className="h-full rounded-full bg-[#16796E]" style={{ width: `${mandiri.pct}%` }} />
                                  </div>
                                  <div className="mt-3 flex items-center justify-between text-[12px] font-semibold">
                                    <span className="text-gray-500">Selesai: <span className="text-[#12172B]">{mandiri.pct}%</span></span>
                                    <span className="text-gray-500">Sesi: <span className="text-[#12172B]">{mandiri.done}/{mandiri.total}</span></span>
                                  </div>
                                </div>
                              </button>
                            )}
                            {activeRegs.map((reg: any, idx: number) => {
                              const badge = PRODUCT_BADGE[reg.product] || PRODUCT_BADGE["Kelas Private"];
                              const total = reg.sessions_total || 0;
                              const used = reg.sessions_used || 0;
                              const pct = total > 0 ? Math.min(100, Math.max(0, Math.round((used / total) * 100))) : 0;
                              const bg = CARD_BG[idx % CARD_BG.length];
                              const photo = getLangPhoto(reg.language);
                              return (
                                <button
                                  key={reg.id}
                                  onClick={() => setDetailReg(reg)}
                                  className="group rounded-3xl bg-white p-3 text-left shadow-[0_24px_50px_-30px_rgba(18,23,43,0.5)] transition-transform hover:-translate-y-1"
                                >
                                  <div className={`relative flex h-40 items-center justify-center overflow-hidden rounded-2xl ${bg}`}>
                                    {photo ? (
                                      <>
                                        <img src={photo} alt={reg.language} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-[64px] font-extrabold tracking-tight text-white/95 transition-transform duration-300 group-hover:scale-105">{langGlyph(reg.language)}</span>
                                        <div className="absolute -bottom-6 -right-4 h-24 w-24 rounded-full bg-white/10" />
                                      </>
                                    )}
                                  </div>
                                  <div className="px-2 pb-2 pt-4">
                                    <div className="flex items-center gap-2">
                                      <img src={getFlagUrl(reg.language)} alt="" className="h-4 w-4 shrink-0 rounded-sm object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                                      <h3 className="truncate text-[16px] font-extrabold leading-tight text-[#12172B]">{reg.language} — {reg.level || "TBD"}</h3>
                                    </div>
                                    <p className="mt-0.5 truncate text-[13px] font-medium text-gray-500">{reg?.teachers?.name || badge.label}</p>
                                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E8EAEE]">
                                      <div className="h-full rounded-full bg-[#16796E]" style={{ width: `${pct}%` }} />
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-[12px] font-semibold">
                                      <span className="text-gray-500">Selesai: <span className="text-[#12172B]">{pct}%</span></span>
                                      <span className="text-gray-500">Sesi: <span className="text-[#12172B]">{used}/{total}</span></span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                            <button
                              onClick={openEnrollWizard}
                              className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-200 p-4 text-gray-400 transition-colors hover:border-[#16796E]/40 hover:text-[#16796E]"
                            >
                              <Plus className="h-7 w-7" strokeWidth={2} />
                              <span className="text-[13px] font-semibold">Tambah Kelas</span>
                            </button>
                          </div>
                        ) : (
                          <div className="mt-4 rounded-3xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
                            <BookOpen className="mx-auto mb-2 h-12 w-12 text-slate-300" strokeWidth={1.5} />
                            <h3 className="mb-1 font-bold text-[#12172B]">Belum ada kelas aktif</h3>
                            <p className="mb-4 text-sm text-gray-500">Mulai belajar bahasa baru sekarang!</p>
                            <button onClick={openEnrollWizard} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#16796E] px-6 text-sm font-bold text-white transition-colors hover:bg-[#0F5A52]">✨ Daftar Kelas</button>
                          </div>
                        )}
                      </div>

                      {/* Pengajar Kamu (distinct teacher dari activeRegs) */}
                      {teacherList.length > 0 && (
                        <div>
                          <h2 className="text-[20px] font-extrabold text-[#12172B]">Pengajar Kamu</h2>
                          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                            {teacherList.map((t, i) => (
                              <div key={t.name} className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-[0_24px_50px_-30px_rgba(18,23,43,0.5)]">
                                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold ${ICON_TINT[i % ICON_TINT.length]}`}>{initials(t.name)}</span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[16px] font-extrabold text-[#12172B]">{t.name}</span>
                                  <span className="block truncate text-[13px] font-medium text-gray-500">{t.count} Kelas · {Array.from(t.langs).join(", ")}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </section>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {activeTab === "jadwal" && (
            <motion.div key="jadwal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
              {/* linguo-patch:akun-jadwal-tab-v1 — kalender LMS, data real dari upcomingSchedules */}
              {(() => {
                const jadwalSessions = upcomingSchedules.map((s: any) => {
                  const reg = student?.registrations.find((r: any) => r.id === s.registration_id);
                  return {
                    id: s.id,
                    scheduledAt: s.scheduled_at,
                    durationMinutes: s.duration_minutes,
                    language: reg?.language || "—",
                    level: reg?.level || "",
                    product: reg?.product || "",
                    teacher: reg?.teachers?.name || "",
                  };
                });
                const jadwalRegulerBatches = activeRegs
                  .filter((r: any) => r.product === "Kelas Reguler" && r.batch)
                  .map((r: any) => ({
                    id: r.id,
                    language: r.language,
                    batchCode: r.batch.batch_code,
                    scheduleDay: r.batch.schedule_day,
                    scheduleTime: r.batch.schedule_time,
                    zoomLink: r.batch.zoom_link || null,
                  }));
                return <JadwalCalendar sessions={jadwalSessions} regularBatches={jadwalRegulerBatches} />;
              })()}
            </motion.div>
          )}

          {activeTab === "materi" && (
            <motion.div key="materi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
              {(() => {
                const mlangGlyph = (lang: string): string => {
                  const g: Record<string, string> = {
                    Jepang: "あ", Japanese: "あ", Korea: "한", Korean: "한",
                    Mandarin: "中", Chinese: "中", Arab: "ع", Arabic: "ع",
                    Rusia: "Я", Russian: "Я", Thai: "ก", Ibrani: "א", Hebrew: "א",
                    Yunani: "Ω", Greek: "Ω", Hindi: "ह", Persia: "ف", Persian: "ف",
                  };
                  return g[lang] || "Aa";
                };
                const PAL = [
                  { color: "#16796E", tintBg: "bg-[#16796E]/10", tintText: "text-[#16796E]" },
                  { color: "#E11D48", tintBg: "bg-rose-50", tintText: "text-rose-500" },
                  { color: "#4F46E5", tintBg: "bg-indigo-50", tintText: "text-indigo-500" },
                  { color: "#D97706", tintBg: "bg-amber-50", tintText: "text-amber-600" },
                  { color: "#0891B2", tintBg: "bg-cyan-50", tintText: "text-cyan-600" },
                  { color: "#7C3AED", tintBg: "bg-violet-50", tintText: "text-violet-500" },
                ];
                const HEXA = "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)";
                const LANGS = [
                  { name: "English", slug: "english", glyph: "EN" },
                  { name: "German", slug: "german", glyph: "DE" },
                  { name: "Spanish", slug: "spanish", glyph: "ES" },
                  { name: "French", slug: "french", glyph: "FR" },
                  { name: "Japanese", slug: "japanese", glyph: "あ" },
                  { name: "Korean", slug: "korean", glyph: "한" },
                  { name: "Mandarin", slug: "mandarin", glyph: "中" },
                  { name: "Arabic", slug: "arabic", glyph: "ع" },
                  { name: "Russian", slug: "russian", glyph: "Я" },
                  { name: "Dutch", slug: "dutch", glyph: "NL" },
                  { name: "Italian", slug: "italian", glyph: "IT" },
                  { name: "Turkish", slug: "turkish", glyph: "TR" },
                  { name: "Portuguese", slug: "portuguese", glyph: "PT" },
                  { name: "Thai", slug: "thai", glyph: "ก" },
                  { name: "Hindi", slug: "hindi", glyph: "ह" },
                  { name: "Polish", slug: "polish", glyph: "PL" },
                  { name: "Vietnamese", slug: "vietnamese", glyph: "Vi" },
                  { name: "Greek", slug: "greek", glyph: "Ω" },
                ];
                const LANGPAL = [
                  { bg: "#EEEDFE", tx: "#3C3489" }, { bg: "#FAECE7", tx: "#993C1D" },
                  { bg: "#E6F1FB", tx: "#0C447C" }, { bg: "#FBEAF0", tx: "#72243E" },
                  { bg: "#E1F5EE", tx: "#085041" }, { bg: "#FAEEDA", tx: "#633806" },
                  { bg: "#EAF3DE", tx: "#27500A" }, { bg: "#FCEBEB", tx: "#791F1F" },
                ];
                const liveClasses = activeRegs.filter((r: any) => r.status === "Aktif");
                const pctOf = (r: any) => {
                  const t = r.sessions_total || 0; const u = r.sessions_used || 0;
                  return t > 0 ? Math.min(100, Math.max(0, Math.round((u / t) * 100))) : 0;
                };
                const shown = liveClasses.filter((r: any) => {
                  if (materiFilter === "run") return pctOf(r) < 100;
                  if (materiFilter === "done") return pctOf(r) >= 100;
                  return true;
                });
                const selected = shown.find((r: any) => r.id === materiSel) || shown[0] || liveClasses[0];
                const palOf = (r: any) => PAL[Math.max(0, liveClasses.findIndex((x: any) => x.id === r.id)) % PAL.length];

                const ClassItem = ({ r, mobile }: { r: any; mobile?: boolean }) => {
                  const pal = palOf(r); const pct = pctOf(r); const isSel = selected && r.id === selected.id;
                  return (
                    <button
                      onClick={() => { setMateriSel(r.id); setMateriTab("sesi"); }}
                      className={`group flex items-center gap-3 rounded-2xl p-3 text-left transition ${isSel ? "bg-white shadow-[0_16px_36px_-22px_rgba(18,23,43,0.55)] ring-2 ring-[#16796E]" : "hover:bg-[#F5F6F8]"} ${mobile ? "w-[240px] shrink-0 border border-slate-100 bg-white" : "w-full"}`}
                    >
                      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-extrabold ${pal.tintBg} ${pal.tintText}`}>{mlangGlyph(r.language)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-extrabold text-[#12172B]">{r.language} — {r.level || "TBD"}</span>
                        <span className="block truncate text-[12px] font-medium text-gray-500">{r?.teachers?.name || (PRODUCT_BADGE[r.product]?.label || r.product)}</span>
                        <span className="mt-2 flex items-center gap-2">
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8EAEE]"><span className="block h-full rounded-full bg-[#16796E]" style={{ width: `${pct}%` }} /></span>
                          <span className="text-[11px] font-bold text-gray-500">{pct}%</span>
                        </span>
                      </span>
                    </button>
                  );
                };

                /* linguo-patch:materi-frame-design-v1 */
                const MateriTopBar = (
                  <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-6 lg:px-8">
                    <div>
                      <p className="flex items-center gap-1.5 text-[12px] font-bold text-gray-500"><span>Dashboard</span><ChevronRight className="h-3.5 w-3.5" /><span className="text-[#16796E]">Kelas &amp; Materi</span></p>
                      <h1 className="mt-1 text-[24px] font-extrabold leading-tight text-[#12172B]">Kelas &amp; Materi</h1>
                      <div className="mt-3 inline-flex gap-1 rounded-2xl bg-[#EEF1F4] p-1">
                        {([["live", "Kelas Live"], ["mandiri", "Belajar Mandiri"], ["jelajahi", "Jelajahi Bahasa"]] as const).map(([k, label]) => (
                          <button key={k} onClick={() => { setMateriView(k); if (typeof window !== "undefined") window.history.replaceState(null, "", `/akun?menu=materi&view=${k}`); }} className={`rounded-xl px-3.5 py-1.5 text-[12px] font-bold transition ${materiView === k ? "bg-[#16796E] text-white shadow-sm" : "text-gray-500 hover:text-[#12172B]"}`}>{label}</button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex h-11 w-[240px] max-w-[40vw] items-center gap-2.5 rounded-2xl bg-white px-4 shadow-[0_10px_30px_-22px_rgba(18,23,43,0.6)] transition focus-within:ring-2 focus-within:ring-[#16796E]/30">
                        <Search className="h-[18px] w-[18px] shrink-0 text-gray-400" strokeWidth={2} />
                        <input value={materiSearch} onChange={(e) => setMateriSearch(e.target.value)} placeholder="Cari sesi atau materi…" className="w-full bg-transparent text-[13px] font-medium outline-none placeholder:text-slate-400" />
                      </label>
                      <button className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-[0_10px_30px_-22px_rgba(18,23,43,0.6)] transition hover:bg-slate-50">
                        <Bell className="h-[19px] w-[19px] text-[#12172B]" />
                        <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                      </button>
                    </div>
                  </div>
                );

                return (
                  <div className="flex flex-col gap-5 p-4 lg:min-h-0 lg:flex-1 lg:gap-0 lg:p-0">
                    {/* [linguo-patch:materi-frame-ref-v1] wrapper isi penuh canvas (no padding di lg) */}
                    {/* ════ SUB-TAB ════ */}
                    {/* ════ VIEW: KELAS LIVE ════ */}
                    {materiView === "live" && (liveClasses.length > 0 && selected ? (
                      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_24px_50px_-34px_rgba(18,23,43,0.5)] lg:grid lg:grid-rows-1 lg:grid-cols-[320px_minmax(0,1fr)] lg:min-h-0 lg:flex-1 lg:rounded-none lg:border-0 lg:shadow-none">

                        {/* LEFT list — desktop */}
                        <aside className="hidden min-h-0 flex-col border-r border-slate-100 bg-white lg:flex">
                          <div className="shrink-0 px-6 pb-4 pt-7">
                            <h2 className="text-[18px] font-extrabold text-[#12172B]">Kelas Kamu</h2>
                            <p className="mt-0.5 text-[12px] font-medium text-gray-500">{liveClasses.length} kelas aktif</p>
                            <div className="mt-4 flex gap-2">
                              {([["all", "Semua"], ["run", "Berjalan"], ["done", "Selesai"]] as const).map(([k, label]) => (
                                <button key={k} onClick={() => setMateriFilter(k)} className={`h-8 rounded-full px-3 text-[12px] font-bold transition ${materiFilter === k ? "bg-[#16796E] text-white" : "bg-[#F5F6F8] text-gray-500 hover:text-[#12172B]"}`}>{label}</button>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2.5 overflow-y-auto px-4 pb-6">
                            {shown.length > 0 ? shown.map((r: any) => <ClassItem key={r.id} r={r} />) : (
                              <p className="px-2 py-6 text-center text-[13px] font-medium text-gray-400">Tidak ada kelas di filter ini</p>
                            )}
                          </div>
                        </aside>

                        {/* RIGHT detail (+ mobile pills) */}
                        <main className="flex min-w-0 flex-col bg-[#F5F6F8] lg:min-h-0 lg:overflow-y-auto">
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
                                : "Belum terjadwal";
                              return (
                                <div className="overflow-hidden rounded-3xl bg-white shadow-[0_24px_50px_-34px_rgba(18,23,43,0.5)]">
                                  <div className="relative flex items-center gap-5 overflow-hidden px-6 py-6 sm:px-7" style={{ background: pal.color }}>
                                    {langPhoto && (
                                      <>
                                        <img src={langPhoto} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                                        <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(105deg, rgba(15,71,65,0.88) 0%, rgba(22,121,110,0.66) 46%, rgba(22,121,110,0.28) 100%)" }} />
                                      </>
                                    )}
                                    <span className="relative z-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-[44px] font-extrabold leading-none text-white">{mlangGlyph(selected.language)}</span>
                                    <div className="relative z-10 min-w-0 flex-1 text-white">
                                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold">{badge.label}</span>
                                      <h2 className="mt-2 text-[22px] font-extrabold leading-tight">{selected.language} — {selected.level || "TBD"}</h2>
                                      <p className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-white/85"><User className="h-4 w-4" strokeWidth={2.5} />Pengajar: {selected?.teachers?.name || "Belum ditentukan"}</p>
                                    </div>
                                    <div className="pointer-events-none relative z-10 ml-2 hidden shrink-0 opacity-90 md:flex">
                                      <div className="h-16 w-16 rotate-6 bg-[#F2CB05]/80" style={{ clipPath: HEXA, borderRadius: 8 }} />
                                      <div className="-ml-6 mt-5 h-20 w-20 bg-[#F2CB05]/60" style={{ clipPath: HEXA, borderRadius: 8 }} />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-4 px-6 py-5 sm:px-7">
                                    <div>
                                      <p className="text-[12px] font-semibold text-gray-500">Progress</p>
                                      <div className="mt-2 flex items-center gap-2">
                                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#E8EAEE]"><span className="block h-full rounded-full bg-[#16796E]" style={{ width: `${pct}%` }} /></span>
                                        <span className="text-[13px] font-extrabold text-[#12172B]">{pct}%</span>
                                      </div>
                                    </div>
                                    <div className="border-l border-slate-100 pl-4">
                                      <p className="text-[12px] font-semibold text-gray-500">Sesi Selesai</p>
                                      <p className="mt-1 text-[18px] font-extrabold text-[#12172B]">{selected.sessions_used || 0}<span className="text-[14px] font-bold text-gray-400">/{selected.sessions_total || 0}</span></p>
                                    </div>
                                    <div className="border-l border-slate-100 pl-4">
                                      <p className="text-[12px] font-semibold text-gray-500">Sesi Berikutnya</p>
                                      <p className="mt-1.5 text-[13px] font-bold leading-tight text-[#12172B]">{nextLabel}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* tabs */}
                            <div className="flex items-center gap-2">
                              <button onClick={() => setMateriTab("sesi")} className={`flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-bold transition ${materiTab === "sesi" ? "bg-[#16796E] text-white" : "bg-white text-gray-500 hover:text-[#12172B]"}`}><Video className="h-4 w-4" strokeWidth={2.5} />Sesi &amp; Rekaman</button>
                              <button onClick={() => setMateriTab("materi")} className={`flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-bold transition ${materiTab === "materi" ? "bg-[#16796E] text-white" : "bg-white text-gray-500 hover:text-[#12172B]"}`}><BookOpen className="h-4 w-4" strokeWidth={2.5} />Materi</button>
                            </div>

                            {/* body */}
                            {materiTab === "sesi" ? (
                              (() => {
                                const sessions = upcomingSchedules.filter((s) => s.registration_id === selected.id);
                                if (sessions.length === 0) return (
                                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
                                    <Calendar className="mx-auto mb-2 h-8 w-8 text-slate-300" strokeWidth={1.6} />
                                    <p className="text-[13px] font-semibold text-gray-500">Belum ada sesi mendatang terjadwal</p>
                                    <p className="mt-1 text-[12px] font-medium text-gray-400">Riwayat sesi &amp; rekaman akan tampil di sini</p>
                                  </div>
                                );
                                return (
                                  <div className="flex flex-col gap-3">
                                    {sessions.map((s, i) => {
                                      const d = new Date(s.scheduled_at);
                                      const n = (selected.sessions_used || 0) + i + 1;
                                      return (
                                        <div key={s.id} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-[#16796E]/20 hover:shadow-[0_16px_36px_-26px_rgba(18,23,43,0.5)]">
                                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F5F6F8] text-[13px] font-extrabold text-[#12172B]">{String(n).padStart(2, "0")}</span>
                                          <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <p className="truncate text-[14px] font-extrabold text-[#12172B]">Sesi {n}</p>
                                              <span className="rounded-full bg-[#16796E]/10 px-2 py-0.5 text-[11px] font-bold text-[#16796E]">Mendatang</span>
                                            </div>
                                            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] font-medium text-gray-500"><Calendar className="h-3.5 w-3.5" />{d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} · {d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
                                          </div>
                                          <span className="inline-flex h-9 shrink-0 items-center gap-1.5 px-3 text-[12px] font-bold text-gray-500"><Clock className="h-3.5 w-3.5" />Belum mulai</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()
                            ) : (
                              <SilabusOutline
                                slug={selected.language?.toLowerCase().replace(/\s+/g, "-") || "english"}
                                languageLabel={selected.language || ""}
                                currentLevel={selected.level}
                                showPlacementTest={selected.product !== "English Test Preparation"}
                              />
                            )}
                          </div>
                        </main>
                      </div>
                    ) : (
                      /* [linguo-patch:materi-empty-subtabs-v1] empty Kelas Live wajib tetep render MateriTopBar — kalau ngga, sub-tab (Belajar Mandiri / Jelajahi Bahasa) ilang & user e-learning ke-trap di layar kosong */
                      <div className="flex flex-col lg:min-h-0 lg:flex-1">
                        {MateriTopBar}
                        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-8 lg:pt-0">
                          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-[0_24px_50px_-34px_rgba(18,23,43,0.5)] lg:border-0 lg:bg-transparent lg:shadow-none">
                            <BookOpen className="mx-auto mb-2 h-12 w-12 text-slate-300" strokeWidth={1.5} />
                            <p className="text-[14px] font-semibold text-gray-600">Belum ada kelas live aktif</p>
                            <p className="mt-1 text-[12px] font-medium text-gray-400">Punya paket e-learning? Buka tab <strong>Belajar Mandiri</strong> di atas. Atau daftar kelas live di bawah.</p>
                            <button onClick={openEnrollWizard} className="mt-4 inline-flex h-10 items-center gap-2 rounded-2xl bg-[#16796E] px-5 text-[13px] font-bold text-white transition hover:bg-[#0F5A52]"><Plus className="h-4 w-4" strokeWidth={2.5} />Daftar Kelas</button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* ════ VIEW: BELAJAR MANDIRI ════ */}
                    {/* [linguo-patch:akun-pustaka-tab-v1] Perpustakaan dipindah ke tab top-level "pustaka" → mandiri = kartu LmsKatalog aja (no trailing empty space) */}
                    {materiView === "mandiri" && (
                      <LmsKatalog
                        topBar={MateriTopBar}
                        onOpen={(id) => {
                          setLmsSesi(id);
                          if (typeof window !== "undefined") window.history.replaceState(null, "", `/akun?menu=materi&sesi=${id}`);
                        }}
                      />
                    )}

                    {/* ════ VIEW: JELAJAHI BAHASA ════ */}
                    {materiView === "jelajahi" && (() => {
                      const q = materiSearch.trim().toLowerCase();
                      const filtered = q ? LANGS.filter((l) => l.name.toLowerCase().includes(q)) : LANGS;
                      const selLang = LANGS.find((l) => l.slug === materiLang) || LANGS[0];
                      const selPal = LANGPAL[LANGS.indexOf(selLang) % LANGPAL.length];
                      const CEFR = ["A1.1", "A1.2", "A2.1", "A2.2", "B1.1", "B1.2", "B2.1", "B2.2"];
                      return (
                        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_24px_50px_-34px_rgba(18,23,43,0.5)] lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:rounded-none lg:border-0 lg:shadow-none">
                          {MateriTopBar}
                          <div className="flex flex-col gap-5 px-6 pb-6 pt-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-8 lg:pb-8">
                          <div>
                            <h2 className="text-[18px] font-extrabold text-[#12172B]">Jelajahi Bahasa</h2>
                            <p className="mt-0.5 text-[13px] font-medium text-gray-500">60+ bahasa · CEFR A1–B2 · pilih, lihat silabus, langsung daftar</p>
                          </div>
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" strokeWidth={2} />
                            <input value={materiSearch} onChange={(e) => setMateriSearch(e.target.value)} placeholder="Cari bahasa…" className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-[14px] font-medium text-[#12172B] outline-none transition focus:border-[#16796E] focus:ring-2 focus:ring-[#16796E]/20" />
                          </div>
                          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                            {filtered.map((l) => {
                              const pal = LANGPAL[LANGS.indexOf(l) % LANGPAL.length];
                              const isSel = l.slug === selLang.slug;
                              return (
                                <button key={l.slug} onClick={() => setMateriLang(l.slug)} className={`group flex items-center gap-3 rounded-2xl border bg-white p-3 text-left transition ${isSel ? "border-transparent shadow-[0_16px_36px_-26px_rgba(18,23,43,0.5)] ring-2 ring-[#16796E]" : "border-slate-100 hover:border-[#16796E]/30"}`}>
                                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[16px] font-extrabold" style={{ background: pal.bg, color: pal.tx }}>{l.glyph}</span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[14px] font-extrabold text-[#12172B]">{l.name}</span>
                                    <span className="block text-[12px] font-medium text-gray-500">CEFR A1–B2</span>
                                  </span>
                                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-[#16796E]" />
                                </button>
                              );
                            })}
                            {filtered.length === 0 && (
                              <p className="col-span-full rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-[13px] font-medium text-gray-400">Bahasa "{materiSearch}" ga ketemu · cek Semua Silabus di bawah</p>
                            )}
                          </div>

                          {/* detail bahasa kepilih */}
                          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_50px_-34px_rgba(18,23,43,0.5)]">
                            <div className="flex items-center gap-3">
                              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[18px] font-extrabold" style={{ background: selPal.bg, color: selPal.tx }}>{selLang.glyph}</span>
                              <div className="min-w-0">
                                <p className="text-[15px] font-extrabold text-[#12172B]">{selLang.name} — CEFR A1–B2</p>
                                <p className="text-[12px] font-medium text-gray-500">8 sublevel · A1.1 sampai B2.2</p>
                              </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-1.5">
                              {CEFR.map((c) => (
                                <span key={c} className="rounded-lg bg-[#F5F6F8] px-2.5 py-1 text-[12px] font-bold text-gray-500">{c}</span>
                              ))}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <a href={`/silabus/${selLang.slug}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-bold text-[#12172B] transition hover:border-[#16796E]/30 hover:text-[#16796E]"><BookOpen className="h-4 w-4" strokeWidth={2} />Lihat Silabus</a>
                              <a href={`/silabus/${selLang.slug}/coba`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-bold text-[#12172B] transition hover:border-[#16796E]/30 hover:text-[#16796E]"><Target className="h-4 w-4" strokeWidth={2} />Placement Test</a>
                              <button onClick={openEnrollWizard} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#16796E] px-4 text-[13px] font-bold text-white transition hover:bg-[#0F5A52]"><Plus className="h-4 w-4" strokeWidth={2.5} />Daftar Kelas</button>
                            </div>
                          </div>

                          {/* footer resources */}
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-[13px] font-medium text-gray-500">
                            <a href="/silabus" className="inline-flex items-center gap-1.5 transition-colors hover:text-[#16796E]"><Globe className="h-4 w-4" strokeWidth={2} />Semua Silabus (60+ Bahasa)</a>
                            <a href="/blog" className="inline-flex items-center gap-1.5 transition-colors hover:text-[#16796E]"><Newspaper className="h-4 w-4" strokeWidth={2} />Blog &amp; Tips Belajar</a>
                          </div>
                        </div>
                      </div>
                      );
                    })()}
                  </div>
                );
              })()}
            </motion.div>
          )}

          {activeTab === "sertifikat" && (
            <SertifikatTab
              studentName={displayName}
              certs={certs}
              onContinue={() => setActiveTab("materi")}
              onSchedule={() => setActiveTab("jadwal")}
            />
          )}

          {activeTab === "akun" && (
            <motion.div key="akun" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto w-full max-w-5xl pb-4">
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
              />
            </motion.div>
          )}

          {/* [linguo-patch:akun-pustaka-tab-v1] TAB PERPUSTAKAAN — E-Book & E-Learning (digital_purchases) */}
          {activeTab === "pustaka" && (
            <motion.div key="pustaka" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_24px_50px_-34px_rgba(18,23,43,0.5)]">
                <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-6 lg:px-8">
                  <div>
                    <p className="flex items-center gap-1.5 text-[12px] font-bold text-gray-500"><span>Dashboard</span><ChevronRight className="h-3.5 w-3.5" /><span className="text-[#16796E]">Perpustakaan Saya</span></p>
                    <h1 className="mt-1 text-[24px] font-extrabold leading-tight text-[#12172B]">Perpustakaan Saya</h1>
                    <p className="mt-1 text-[13px] font-medium text-gray-500">E-Book &amp; E-Learning yang udah kamu beli · akses selamanya</p>
                  </div>
                  <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#16796E]/10 text-[#16796E] sm:flex"><BookMarked className="h-6 w-6" strokeWidth={2} /></span>
                </div>
                <div className="px-6 pb-6 pt-5 lg:px-8 lg:pb-8">
                  {user?.id && <PerpustakaanSaya userId={user.id} supabase={supabase} />}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      {/* Placement Test Language Picker */}
      <PlacementPicker open={showPlacementPicker} onClose={() => setShowPlacementPicker(false)} studentId={student?.id} />
      </main>

      {/* ── Bottom Tab Nav (mobile only) ── */}
      <MobileBottomNav activeTab={activeTab === "sertifikat" ? "akun" : activeTab === "pustaka" ? "materi" : activeTab} onChange={(t) => setActiveTab(t)} />

      {/* Floating Quick Actions FAB */}
      {student && (
        <>
          <button
            onClick={() => setShowQuickActions(true)}
            className="fixed lg:hidden bottom-24 right-4 sm:right-6 z-[45] h-14 w-14 rounded-full bg-gradient-to-br from-teal-600 to-teal-500 text-white shadow-xl shadow-teal-500/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
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
                  className="fixed bottom-44 right-4 sm:right-6 z-[60] w-[calc(100vw-2rem)] max-w-xs rounded-2xl bg-white shadow-2xl border border-gray-100 p-4"
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

      {/* Booking Modal */}
      <OneSignalProvider />
      {detailReg && <ClassDetailModal reg={detailReg} onClose={() => setDetailReg(null)} />}

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
                  const langLabel = r.product === "IELTS/TOEFL Prep" ? "IELTS/TOEFL" : r.language;
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
                    await supabase.from("registrations").update({ xendit_invoice_url: data.invoice_url }).eq("id", r.id);
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
                  {bookingReg.language} · {bookingReg.level}
                  {bookingReg.teachers?.name && <> · 👩‍🏫 {bookingReg.teachers.name}</>}
                </p>
              </div>
              <button
                onClick={() => !bookingSubmit && setBookingReg(null)}
                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loadingSlots ? (
                <div className="py-16 text-center text-sm text-gray-500">Memuat jadwal pengajar...</div>
              ) : availSlots.size === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-3xl mb-2">🗓️</p>
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
                        <div key={di} className="border border-gray-100 rounded-xl p-3">
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
                                      ? "bg-teal-600 text-white ring-2 ring-teal-300"
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
              <div className="text-xs text-gray-500 min-w-0 truncate">
                {selectedSlots.size > 0
                  ? `📌 ${selectedSlots.size} sesi dipilih`
                  : "Pilih slot dulu"}
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
      <div className="hidden lg:block text-center py-8 text-xs text-gray-400">© 2026 Linguo.id — Everyone Can Be a Polyglot</div>

      {/* [linguo-patch:akun-inplace-lessonplayer-v1] overlay immersive: satu LessonPlayer dipake route & in-place (LmsLesson lama dibuang) */}
      {lmsSesi && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#F5F6F8]">
          <LessonPlayer
            lessonId={lmsSesi}
            onBack={() => { setLmsSesi(null); setActiveTab("materi"); setMateriView("mandiri"); if (typeof window !== "undefined") window.history.replaceState(null, "", "/akun?menu=materi&view=mandiri"); }}
            onOpenLesson={(id) => setLmsSesi(id)}
          />
        </div>
      )}
    </StudentShell>
  );
}
