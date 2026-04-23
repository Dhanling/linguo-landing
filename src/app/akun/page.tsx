"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";

import ClassDetailModal from '@/components/ClassDetailModal';
import PaymentCard from '@/components/PaymentCard';
import OneSignalProvider from '@/components/OneSignalProvider';
import NotificationBell from '@/components/NotificationBell';
import UnifiedCourseCard from '@/components/akun/UnifiedCourseCard';
import PaymentInstructionSheet from '@/components/akun/PaymentInstructionSheet';
import TopBarMinimal from '@/components/akun/TopBarMinimal';
import CompactHeroBanner from '@/components/akun/CompactHeroBanner';
import MobileBottomNav from '@/components/akun/MobileBottomNav';
import AttentionAlert from '@/components/akun/AttentionAlert';
// ── Supabase Client ──────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
const PRODUCT_BADGE: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
  "Kelas Private":              { label: "Private",      icon: "👤", color: "text-teal-700",  bg: "bg-teal-50",   border: "border-teal-200" },
  "Kelas Reguler":              { label: "Reguler",      icon: "👥", color: "text-blue-700",  bg: "bg-blue-50",   border: "border-blue-200" },
  "Kelas Kids":                 { label: "Kids",         icon: "🧒", color: "text-purple-700",bg: "bg-purple-50", border: "border-purple-200" },
  "English Test Preparation":   { label: "Test Prep",    icon: "📝", color: "text-amber-700", bg: "bg-amber-50",  border: "border-amber-200" },
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
};
const getFlagUrl = (lang: string) => `https://flagcdn.com/w40/${LANG_FLAGS[lang] || "un"}.png`;

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
const LANGS_BY_PROGRAM: Record<string, string[]> = {
  "Kelas Private": ["English","Japanese","Korean","Mandarin","French","Spanish","German","Arabic","Italian","Turkish","Russian","Thai","Portuguese","Dutch","Hindi","Vietnamese","Danish","Swedish","Finnish","Georgian","Persian","Hebrew","Polish","Czech","Greek","Norwegian","Javanese","Sundanese","BIPA"],
  "Kelas Reguler": ["English","Japanese","Korean","Mandarin","French","Spanish","German","Arabic"],
  "Kelas Kids": ["English","Japanese","Korean","Mandarin","French","Spanish"],
  "English Test Preparation": [],
};
const TEST_TYPES = [
  { key: "IELTS", label: "IELTS", desc: "International English Language Testing System", icon: "🎓" },
  { key: "TOEFL", label: "TOEFL", desc: "Test of English as a Foreign Language", icon: "📋" },
];

function OnboardingWizard({ user, studentId, onDone }: {
  user: any; studentId?: string; onDone: (data: {program: string; lang: string; testType: string; exp: string}) => void;
}) {
  const [step, setStep] = useState(0);
  const [program, setProgram] = useState("");
  const [testType, setTestType] = useState("");
  const [lang, setLang] = useState("");
  const [exp, setExp] = useState<"beginner"|"some"|"">("");
  const [search, setSearch] = useState("");

  const firstName = (user?.user_metadata?.full_name || user?.email || "Kamu").split(" ")[0];
  const isTestPrep = program === "English Test Preparation";
  const availLangs = (LANGS_BY_PROGRAM[program] || []).filter(l => !search || l.toLowerCase().includes(search.toLowerCase()));
  const stepCount = 5;

  const finish = () => {
    const key = `linguo_onboarded_${studentId || user?.id || user?.email}`;
    try { localStorage.setItem(key, "1"); } catch {}
    onDone({ program, lang, testType, exp });
  };

  const go = (n: number, delay = 220) => setTimeout(() => setStep(n), delay);

  const waMsg = encodeURIComponent(
    `Halo admin Linguo! Saya ${firstName}, mau daftar ${isTestPrep ? (testType ? testType + " Prep" : "IELTS/TOEFL Prep") : program + (lang ? " bahasa " + lang : "")}` +
    (exp === "beginner" ? " (pemula)" : exp === "some" ? " (sudah ada dasar)" : "") +
    `. Mohon info jadwal dan biayanya ya. Terima kasih! 🙏`
  );

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute top-0 left-0 right-0 h-1 bg-teal-100">
        <div className="h-full bg-teal-500 transition-all duration-500" style={{ width: `${((step + 1) / stepCount) * 100}%` }} />
      </div>

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
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pb-1">
                {availLangs.map(l => (
                  <button key={l} onClick={() => { setLang(l); go(3, 200); }}
                    className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all active:scale-95 ${lang === l ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-100 hover:border-teal-200 text-gray-600 bg-white"}`}>
                    {LANG_FLAGS[l] ? <img src={`https://flagcdn.com/w40/${LANG_FLAGS[l]}.png`} alt={l} className="w-7 h-5 object-cover rounded-sm" /> : <span className="text-xl">🌐</span>}
                    {l}
                  </button>
                ))}
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
                  <button key={opt.key} onClick={() => { setExp(opt.key as any); go(4); }}
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
              <button onClick={() => setStep(2)} className="mt-4 text-sm text-gray-400 hover:text-gray-600">← Kembali</button>
            </div>
          )}

          {/* Step 4: Summary + CTA */}
          {step === 4 && (
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
                  ["📚 Level", exp === "beginner" ? "Pemula (A1)" : "Akan dites dulu"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-semibold text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
              <a href={`https://wa.me/6282116859493?text=${waMsg}`} target="_blank" rel="noopener noreferrer" onClick={finish}
                className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-md shadow-green-100 active:scale-[0.98] mb-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.104 1.523 5.824L0 24l6.349-1.499A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.793 9.793 0 01-5.001-1.372l-.36-.214-3.726.879.896-3.628-.235-.374A9.78 9.78 0 012.182 12C2.182 6.545 6.545 2.182 12 2.182c5.455 0 9.818 4.363 9.818 9.818 0 5.454-4.363 9.818-9.818 9.818z"/></svg>
                Daftar via WhatsApp
              </a>
              {exp === "some" && !isTestPrep && (
                <a href="/silabus/english/coba" onClick={finish} className="w-full flex items-center justify-center gap-2 border-2 border-teal-500 text-teal-600 font-bold py-3.5 rounded-2xl text-sm hover:bg-teal-50 transition-all mb-3">
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

      {step > 0 && step < 4 && (
        <button onClick={finish} className="absolute top-4 right-4 text-xs text-gray-400 hover:text-gray-600 transition-colors">Lewati</button>
      )}
      <div className="absolute bottom-6 flex items-center gap-1.5">
        {Array.from({ length: stepCount }).map((_, i) => (
          <div key={i} className={`rounded-full transition-all ${i === step ? "w-5 h-1.5 bg-teal-500" : i < step ? "w-1.5 h-1.5 bg-teal-300" : "w-1.5 h-1.5 bg-gray-200"}`} />
        ))}
      </div>
    </div>
  );
}

// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// AKUN TAB — Profile, Avatar Upload, Edit Info
// ═══════════════════════════════════════════════════════════════════════════
function AkunTab({ user, student, avatarUrl, displayName, firstName, xp, badges, signOut, supabase, onAvatarUpdate }: {
  user: any; student: any; avatarUrl?: string; displayName: string; firstName: string;
  xp: any; badges: any[]; signOut: () => void; supabase: any; onAvatarUpdate: (url: string) => void;
}) {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(student?.name || displayName);
  const [editWa, setEditWa] = useState(student?.whatsapp || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !student?.id) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${student.id}/avatar.${ext}`;
      const { error } = await supabase.storage.from("student-avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("student-avatars").getPublicUrl(path);
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

  const handleSave = async () => {
    if (!student?.id) return;
    setSaving(true);
    try {
      await supabase.from("students").update({ name: editName, whatsapp: editWa }).eq("id", student.id);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        {/* Cover gradient */}
        <div className="h-24 bg-gradient-to-r from-teal-500 to-teal-400" />
        <div className="px-5 pb-5">
          {/* Avatar */}
          <div className="relative -mt-10 mb-3 inline-block">
            <div className="relative">
              {avatarUrl
                ? <img src={avatarUrl} alt="" className="h-20 w-20 rounded-full ring-4 ring-white object-cover" referrerPolicy="no-referrer" />
                : <div className="h-20 w-20 rounded-full ring-4 ring-white bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-2xl">{firstName[0]?.toUpperCase()}</div>
              }
              <button onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-teal-600 flex items-center justify-center text-white shadow-lg hover:bg-teal-700 transition-colors">
                {uploadingAvatar
                  ? <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <span className="text-xs">📷</span>
                }
              </button>
            </div>
            <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Name & rank */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-xl">{student?.name || displayName}</h3>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-base">{xp.emoji}</span>
                <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{xp.rank} · {xp.xp} XP</span>
              </div>
            </div>
            <button onClick={() => setEditing(!editing)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${editing ? "bg-gray-100 text-gray-600" : "bg-teal-50 text-teal-600 hover:bg-teal-100"}`}>
              {editing ? "Batal" : "✏️ Edit"}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white border border-teal-100 shadow-sm p-5 space-y-4">
          <h4 className="text-sm font-semibold text-gray-700">Edit Profil</h4>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Nama Lengkap</label>
            <input value={editName} onChange={e => setEditName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Nomor WhatsApp</label>
            <input value={editWa} onChange={e => setEditWa(e.target.value)} placeholder="628xxx"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full h-11 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 disabled:opacity-50 transition-colors">
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </motion.div>
      )}

      {saved && (
        <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700 font-medium text-center">
          ✅ Profil berhasil disimpan!
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total XP", value: xp.xp, icon: "⭐" },
          { label: "Badges", value: badges.length, icon: "🏆" },
          { label: "Kursus Aktif", value: student?.registrations?.filter((r: any) => r.status === "Aktif").length || 0, icon: "📚" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-bold text-gray-900">{s.value}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">🏆 Badges</h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {badges.map(b => (
              <div key={b.id} className="flex flex-col items-center gap-1 rounded-xl bg-amber-50 border border-amber-100 p-3">
                <span className="text-2xl">{b.badge_icon}</span>
                <span className="text-[10px] font-medium text-amber-700 text-center leading-tight">{b.badge_label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm divide-y divide-gray-50">
        {[
          { icon: "🎯", label: "Placement Test", href: "/silabus/english/coba" },
          { icon: "🌍", label: "Lihat Silabus", href: "/silabus" },
          { icon: "💬", label: "Hubungi Admin", href: "https://wa.me/6282116859493" },
          { icon: "📖", label: "Blog & Tips Belajar", href: "/blog" },
        ].map(item => (
          <a key={item.label} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
            className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
            <span className="text-lg w-7 text-center">{item.icon}</span>
            <span className="text-sm font-medium text-gray-700 flex-1">{item.label}</span>
            <span className="text-gray-300 text-xs">›</span>
          </a>
        ))}
      </div>

      {/* Sign out */}
      <button onClick={signOut}
        className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border-2 border-red-100 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors">
        🚪 Keluar dari Akun
      </button>

      <p className="text-center text-[10px] text-gray-300">Linguo.id · v2.0 · {new Date().getFullYear()}</p>
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

  const price = pricePerSession[enrollProgram]?.[enrollDuration] || 0;

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
      await supabase.from("leads").upsert({
        name: displayName,
        email: user?.email || "",
        program: PROGRAMS.find(p => p.key === enrollProgram)?.label || enrollProgram,
        language: enrollLang || null,
        source: "Tambah Kelas",
        notes: `${enrollProgram}${enrollLang ? " · " + enrollLang : ""} · ${enrollDuration}mnt · ${Object.entries(enrollSchedule).map(([d,ts]) => d + " " + ts.join("+")).join(", ")}`,
        status: "Baru",
        created_at: new Date().toISOString(),
      }, { onConflict: "email" });
    } catch (e) { console.warn("Lead save:", e); }

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
              avatar_url: user?.user_metadata?.avatar_url,
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
                      <p className="font-bold text-teal-600 text-sm">Rp{(pricePerSession[enrollProgram]?.[d.val] || 0).toLocaleString("id-ID")}</p>
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

                {/* WA Button */}
                <a href={`https://wa.me/6282116859493?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
                  onClick={handleConfirm}
                  className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-colors shadow-lg shadow-green-100">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.104 1.523 5.824L0 24l6.349-1.499A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.793 9.793 0 01-5.001-1.372l-.36-.214-3.726.879.896-3.628-.235-.374A9.78 9.78 0 012.182 12C2.182 6.545 6.545 2.182 12 2.182c5.455 0 9.818 4.363 9.818 9.818 0 5.454-4.363 9.818-9.818 9.818z"/></svg>
                  Konfirmasi & Hubungi Admin WA
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

export default function AkunPage() {

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState<Schedule[]>([]);
  const [streak, setStreak] = useState(0);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"beranda"|"jadwal"|"materi"|"akun">("beranda");
  // Booking Modal
  const [bookingReg, setBookingReg] = useState<StudentReg | null>(null);
  const [availSlots, setAvailSlots] = useState<Set<string>>(new Set()); // "day_of_week-HH:MM"
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set()); // ISO strings
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [detailReg, setDetailReg] = useState<any>(null); // ISO string
  const [bookingSubmit, setBookingSubmit] = useState(false);
  // Email/password login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showEmailLogin, setShowEmailLogin] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
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

  // ── Data Loading (fixed column names) ────────────────────────────
  useEffect(() => {
    if (!user?.email) return;
    loadStudentData(user.email);
  }, [user?.email]);

  async function loadStudentData(email: string) {
    setDataLoading(true);
    try {
      const { data: studentData } = await supabase
        .from("students")
        .select("id, name, email, whatsapp, avatar_url")
        .eq("email", email)
        .maybeSingle();

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
    r.status === "Aktif" ||
    r.status === "Pending"
  ) || [], [student]);
  // "Menunggu Pembayaran" = user belum upload bukti transfer
  const pendingPaymentRegs = useMemo(() => student?.registrations.filter(r =>
    r.status === "Menunggu Pembayaran" &&
    (r.payment_status === "Belum Bayar" || !r.payment_status)
  ) || [], [student]);
  const completedRegs = useMemo(() => student?.registrations.filter(r => ["Selesai","Batal","Non Aktif"].includes(r.status)) || [], [student]);
  const totalUsedSessions = useMemo(() => activeRegs.reduce((s, r) => s + (r.sessions_used || 0), 0), [activeRegs]);
  const xp = useMemo(() => calculateXP(totalUsedSessions, streak, badges.length), [totalUsedSessions, streak, badges]);

  const displayName = student?.name || user?.user_metadata?.full_name || "Siswa";
  const firstName = displayName.split(" ")[0];
  const avatarUrl = student?.avatar_url || user?.user_metadata?.avatar_url;

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
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center">
            <img src="/images/logo-white.png" alt="Linguo" className="h-6 w-6 object-contain" />
          </div>
          <div className="h-4 w-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
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
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center">
            <img src="/images/logo-white.png" alt="Linguo" className="h-6 w-6 object-contain" />
          </div>
          <div className="h-4 w-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Memuat data belajarmu...</p>
        </div>
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
                name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Siswa",
                email: user?.email,
                avatar_url: user?.user_metadata?.avatar_url || null,
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
                studentRow = existing;
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

              // 2. Insert registration with safe defaults (admin will fill in price/sessions later)
              const isTestPrep = data.program === "English Test Preparation";
              const { data: regRow, error: regError } = await supabase
                .from("registrations")
                .insert({
                  student_id: studentRow.id,
                  product: data.program,
                  language: data.testType || data.lang || null,
                  level: data.exp === "beginner" ? "A1" : "TBD",
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
                const notes = `Program: ${data.program}${subject ? ` · ${subject}` : ""}${data.exp === "beginner" ? " · Pemula" : data.exp === "some" ? " · Sudah ada dasar" : ""}`;
                await supabase.from("leads").upsert({
                  name: studentPayload.name,
                  email: user?.email || "",
                  program: data.program,
                  language: subject || null,
                  source: "Onboarding Wizard",
                  notes,
                  status: "Baru",
                  created_at: new Date().toISOString(),
                }, { onConflict: "email" });
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
        level: wizardData.exp === "beginner" ? "A1" : "TBD",
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
        avatar_url: user?.user_metadata?.avatar_url,
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
    <div className="min-h-screen bg-gradient-to-b from-teal-50/80 to-white pb-20 lg:pb-8">

      {/* ── Onboarding Wizard (first-time users) ──────────────────── */}
      {showOnboarding && (
        <OnboardingWizard
          user={user}
          studentId={student?.id}
          onDone={() => setShowOnboarding(false)}
        />
      )}

      {/* ── Header ── */}
      <TopBarMinimal
        studentId={student?.id || ""}
        avatarUrl={avatarUrl}
        firstName={firstName}
        onAvatarClick={() => setActiveTab("akun")}
        onEnrollClick={openEnrollWizard}
      />

      {/* ── Content ─────────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-5 space-y-6">
        <AnimatePresence mode="wait">
          {activeTab === "beranda" && (
            <motion.div key="beranda" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Desktop: 2 column layout */}
              <div className="lg:grid lg:grid-cols-[2fr_1fr] lg:gap-6 space-y-5 lg:space-y-0">

                {/* Left Column — Main Content */}
                <div className="space-y-5">
                  {/* Welcome + XP Banner */}
                  <CompactHeroBanner
                    firstName={firstName}
                    greeting={getGreeting()}
                    rankEmoji={xp.emoji}
                    rankLabel={xp.rank}
                    streak={streak}
                    activeCount={activeRegs.length}
                    onEnrollClick={openEnrollWizard}
                  />

                  {/* Attention Alert */}
                  <AttentionAlert count={pendingPaymentRegs.length} />

                  {/* Active Classes */}
                  {activeRegs.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-semibold text-gray-800">📚 Kursus Saya</h3>
                        <button onClick={openEnrollWizard} className="text-xs font-medium text-teal-600 hover:underline sm:hidden">+ Tambah</button>
                      </div>
                      <div className="space-y-4">
                        {activeRegs.map((reg, i) => (
                          <UnifiedCourseCard
                            key={reg.id}
                            reg={reg as any}
                            index={i}
                            nextSchedule={upcomingSchedules.find(s => s.registration_id === reg.id)}
                            userId={user?.id}
                            onDetail={(r) => setDetailReg(r)}
                            onBooking={(r) => openBooking(r as any)}
                            renderPayment={(r, uid) => (
                              <PaymentCard
                                registration={r as any}
                                userId={uid}
                                onUploadSuccess={() => window.location.reload()}
                              />
                            )}
                            variant="active"
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
                      <p className="text-3xl mb-2">📖</p>
                      <h3 className="font-semibold text-gray-700 mb-1">Belum ada kelas aktif</h3>
                      <p className="text-sm text-gray-500 mb-4">Mulai belajar bahasa baru sekarang!</p>
                      <button onClick={openEnrollWizard} className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors">✨ Daftar Kelas</button>
                    </div>
                  )}

                  {/* Completed */}
                  {completedRegs.length > 0 && (
                    <div>
                      <h3 className="text-base font-semibold text-gray-800 mb-3">🏆 Riwayat</h3>
                      <div className="space-y-2">
                        {completedRegs.map(reg => {
                          const badge = PRODUCT_BADGE[reg.product] || PRODUCT_BADGE["Kelas Private"];
                          return (
                            <div key={reg.id} className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 px-4 py-3">
                              <img src={getFlagUrl(reg.language)} alt="" className="h-5 w-5 object-contain" />
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm font-medium text-gray-700">{reg.language} — {reg.level}</p>
                                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${badge.bg} ${badge.color}`}>{badge.icon}</span>
                                </div>
                                <p className="text-xs text-gray-400">{reg.sessions_used}/{reg.sessions_total} sesi</p>
                              </div>
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${reg.status === "Selesai" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>{reg.status}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column — Sidebar (desktop only, mobile inline) */}
                <div className="space-y-5 overflow-hidden">
                  {/* Pending Payment — sidebar version (compact) */}
                  {pendingPaymentRegs.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-sm font-semibold text-gray-800">⏳ Menunggu Pembayaran</h3>
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                          {pendingPaymentRegs.length}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {pendingPaymentRegs.map((reg: any, i: number) => (
                          <UnifiedCourseCard
                            key={reg.id}
                            reg={reg}
                            index={i}
                            userId={user?.id}
                            variant="pending"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upcoming Schedules */}

        {upcomingSchedules.length > 0 && (
                    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">📅 Jadwal Mendatang</h3>
                      <div className="space-y-2">
                        {upcomingSchedules.slice(0, 5).map(s => {
                          const d = new Date(s.scheduled_at);
                          const reg = student.registrations.find(r => r.id === s.registration_id);
                          return (
                            <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                                <img src={getFlagUrl(reg?.language || "")} alt="" className="h-4 w-4 object-contain" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{reg?.language}</p>
                                <p className="text-[10px] text-gray-500">
                                  {d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })} · {d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Badges */}
                  {badges.length > 0 && (
                    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">🏅 Badges ({badges.length})</h3>
                      <div className="flex flex-wrap gap-2">
                        {badges.map(b => (
                          <div key={b.id} className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5">
                            <span className="text-base">{b.badge_icon}</span>
                            <span className="text-xs font-medium text-gray-700">{b.badge_label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">⚡ Aksi Cepat</h3>
                    <div className="space-y-2">
                      <a href="/silabus/english/coba" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                        <span className="text-lg">🎯</span><span className="text-sm font-medium text-gray-700">Placement Test</span>
                      </a>
                      <a href={`https://wa.me/6282116859493?text=${encodeURIComponent(`Halo admin Linguo, saya ${student.name}. `)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                        <span className="text-lg">💬</span><span className="text-sm font-medium text-gray-700">Hubungi Admin</span>
                      </a>
                      <a href="/silabus" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                        <span className="text-lg">🌍</span><span className="text-sm font-medium text-gray-700">Lihat Silabus</span>
                      </a>
                      <button onClick={openEnrollWizard} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors w-full text-left">
                        <span className="text-lg">➕</span><span className="text-sm font-medium text-gray-700">Tambah Kelas Baru</span>
                      </button>
                      <button onClick={signOut} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-red-50 transition-colors w-full text-left">
                        <span className="text-lg">🚪</span><span className="text-sm font-medium text-red-600">Keluar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "jadwal" && (
            <motion.div key="jadwal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Jadwal Kelas</h2>

              {/* Next class highlight */}
              {upcomingSchedules.length > 0 && (() => {
                const next = upcomingSchedules[0];
                const d = new Date(next.scheduled_at);
                const now = new Date();
                const diffMs = d.getTime() - now.getTime();
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffDays = Math.floor(diffHours / 24);
                const remainHours = diffHours % 24;
                const reg = student.registrations.find(r => r.id === next.registration_id);
                const badge = PRODUCT_BADGE[reg?.product || ""] || PRODUCT_BADGE["Kelas Private"];
                return (
                  <div className="rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 p-5 text-white shadow-lg shadow-teal-200/50">
                    <p className="text-teal-200 text-xs font-medium mb-1">KELAS BERIKUTNYA</p>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center">
                        <img src={getFlagUrl(reg?.language || "")} alt="" className="h-7 w-7 object-contain" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold">{reg?.language}</h3>
                        <p className="text-teal-200 text-xs">{reg?.teachers?.name || "Pengajar"} · {badge.icon} {badge.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm bg-white/10 rounded-xl px-4 py-3">
                      <div className="flex-1">
                        <p className="text-teal-200 text-[10px] uppercase tracking-wide">Tanggal</p>
                        <p className="font-bold">{d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-teal-200 text-[10px] uppercase tracking-wide">Jam</p>
                        <p className="font-bold">{d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB</p>
                      </div>
                    </div>
                    {diffMs > 0 && (
                      <p className="text-center text-xs text-teal-200 mt-2">
                        ⏳ {diffDays > 0 ? `${diffDays} hari ` : ""}{remainHours > 0 ? `${remainHours} jam` : "kurang dari 1 jam"} lagi
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Fixed schedules for Reguler classes */}
              {activeRegs.filter(r => r.product === "Kelas Reguler" && r.batch).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">📋 Jadwal Tetap (Kelas Reguler)</h3>
                  <div className="space-y-2">
                    {activeRegs.filter(r => r.product === "Kelas Reguler" && r.batch).map(reg => (
                      <div key={reg.id} className="rounded-xl bg-blue-50 border border-blue-100 p-3 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center">
                          <img src={getFlagUrl(reg.language)} alt="" className="h-5 w-5 object-contain" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{reg.language} · {reg.batch!.batch_code}</p>
                          <p className="text-xs text-blue-600">Setiap {reg.batch!.schedule_day}, {reg.batch!.schedule_time} WIB</p>
                        </div>
                        {reg.batch?.zoom_link && (
                          <a href={reg.batch.zoom_link} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-600 hover:text-blue-700">🔗 Zoom</a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming schedule list */}
              {upcomingSchedules.length === 0 ? (
                <div className="rounded-2xl bg-white border border-gray-100 p-8 text-center">
                  <p className="text-3xl mb-2">📅</p>
                  <p className="text-sm text-gray-500">Belum ada jadwal mendatang</p>
                  <p className="text-xs text-gray-400 mt-1">Hubungi admin untuk atur jadwal kelasmu</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">📅 Semua Jadwal Mendatang</h3>
                  <div className="space-y-2">
                    {upcomingSchedules.map(s => {
                      const d = new Date(s.scheduled_at);
                      const reg = student.registrations.find(r => r.id === s.registration_id);
                      const badge = PRODUCT_BADGE[reg?.product || ""] || PRODUCT_BADGE["Kelas Private"];
                      return (
                        <div key={s.id} className="rounded-xl bg-white border border-gray-100 shadow-sm p-3.5 flex items-center gap-3">
                          <div className="flex flex-col items-center justify-center bg-teal-50 rounded-xl w-14 h-14 shrink-0">
                            <span className="text-xs font-bold text-teal-700">{d.toLocaleDateString("id-ID", { day: "numeric" })}</span>
                            <span className="text-[10px] text-teal-500 uppercase">{d.toLocaleDateString("id-ID", { month: "short" })}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-sm text-gray-900">{reg?.language}</p>
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${badge.bg} ${badge.color}`}>{badge.icon} {badge.label}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {d.toLocaleDateString("id-ID", { weekday: "long" })} · {d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB · {s.duration_minutes} mnt
                            </p>
                            {reg?.teachers?.name && <p className="text-[10px] text-gray-400 mt-0.5">👩‍🏫 {reg.teachers.name}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "materi" && (
            <motion.div key="materi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Materi Belajar</h2>

              {/* Per-course silabus links */}
              {activeRegs.filter(r => r.status === "Aktif").length > 0 ? (
                <div className="space-y-3">
                  {activeRegs.filter(r => r.status === "Aktif").map(reg => {
                    const badge = PRODUCT_BADGE[reg.product] || PRODUCT_BADGE["Kelas Private"];
                    const langSlug = reg.language?.toLowerCase().replace(/\s+/g, "-") || "english";
                    return (
                      <div key={reg.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 p-4 border-b border-gray-50">
                          <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center">
                            <img src={getFlagUrl(reg.language)} alt="" className="h-5 w-5 object-contain" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{reg.language}</h4>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badge.bg} ${badge.color}`}>{badge.icon} {badge.label} · Level {reg.level}</span>
                          </div>
                        </div>
                        <div className="divide-y divide-gray-50">
                          <a href={`/silabus/${langSlug}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                            <span className="text-lg w-7 text-center">📖</span>
                            <span className="text-sm font-medium text-gray-700 flex-1">Lihat Silabus {reg.language}</span>
                            <span className="text-gray-300 text-xs">›</span>
                          </a>
                          {reg.product !== "English Test Preparation" && (
                            <a href={`/silabus/${langSlug}/coba`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                              <span className="text-lg w-7 text-center">🎯</span>
                              <span className="text-sm font-medium text-gray-700 flex-1">Placement Test {reg.language}</span>
                              <span className="text-gray-300 text-xs">›</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl bg-white border border-gray-100 p-8 text-center">
                  <p className="text-3xl mb-2">📖</p>
                  <p className="text-sm text-gray-500">Belum ada kelas aktif</p>
                  <p className="text-xs text-gray-400 mt-1">Daftar kelas dulu untuk akses materi</p>
                </div>
              )}

              {/* General resources */}
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">🌐 Jelajahi Materi</h3>
                <div className="space-y-1">
                  <a href="/silabus" className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    <span className="text-lg">🌍</span><span className="text-sm font-medium text-gray-700 flex-1">Semua Silabus (60+ Bahasa)</span><span className="text-gray-300 text-xs">›</span>
                  </a>
                  <a href="/blog" className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    <span className="text-lg">📝</span><span className="text-sm font-medium text-gray-700 flex-1">Blog & Tips Belajar</span><span className="text-gray-300 text-xs">›</span>
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "akun" && (
            <motion.div key="akun" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto space-y-4 pb-4">
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
        </AnimatePresence>
      </main>

      {/* ── Bottom Tab Nav (mobile only) ── */}
      <MobileBottomNav activeTab={activeTab} onChange={setActiveTab} />

      {/* Booking Modal */}
      <OneSignalProvider />
      {detailReg && <ClassDetailModal reg={detailReg} onClose={() => setDetailReg(null)} />}
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
    </div>
  );
}
