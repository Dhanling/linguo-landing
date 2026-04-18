"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";

import ClassDetailModal from '@/components/ClassDetailModal';
import OneSignalProvider from '@/components/OneSignalProvider';
import NotificationBell from '@/components/NotificationBell';
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
  { key: "Kelas Private", label: "Kelas Private", desc: "1-on-1 dengan pengajar", icon: "👤", price: "Mulai Rp150k/sesi" },
  { key: "Kelas Reguler", label: "Kelas Reguler", desc: "Belajar bersama 3-5 siswa", icon: "👥", price: "Mulai Rp75k/sesi" },
  { key: "Kelas Kids", label: "Kelas Kids", desc: "Untuk anak usia 5-12 tahun", icon: "🧒", price: "Mulai Rp75k/sesi" },
  { key: "English Test Preparation", label: "IELTS/TOEFL Prep", desc: "Persiapan tes bahasa Inggris", icon: "📝", price: "Mulai Rp175k/sesi" },
];

const POPULAR_LANGUAGES = [
  "English","Japanese","Korean","Mandarin","French","Spanish","German","Arabic","Italian","Turkish",
  "Russian","Thai","Portuguese","Dutch","Hindi","Vietnamese","Danish","Swedish","Finnish","Georgian",
  "Persian","Hebrew","Polish","Czech","Greek","Norwegian","Javanese","Sundanese","BIPA"
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [detailReg, setDetailReg] = useState<any>(null); // ISO string
  const [bookingSubmit, setBookingSubmit] = useState(false);
  // Email/password login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  // Enrollment wizard
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollStep, setEnrollStep] = useState(0);
  const [enrollProgram, setEnrollProgram] = useState("");
  const [enrollLang, setEnrollLang] = useState("");
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

      if (!studentData) { setDataLoading(false); return; }

      // Only use columns that actually exist in the DB
      const { data: regsData } = await supabase
        .from("registrations")
        .select(`
          id, product, language, level, status,
          sessions_total, sessions_used,
          duration, total_amount, payment_status,
          registration_date, teacher_id,
          teachers(name, whatsapp)
        `)
        .eq("student_id", studentData.id)
        .order("registration_date", { ascending: false });

      setStudent({ ...studentData, registrations: (regsData as any) || [] });

      const regIds = (regsData || []).map((r: any) => r.id);

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
    if (!bookingReg || selectedSlots.size === 0) return;
    setIsSubmitting(true);
    try {
      const rows = Array.from(selectedSlots).map((slot) => ({
        registration_id: bookingReg.id,
        teacher_id: bookingReg.teacher_id,
        student_id: student?.id,
        scheduled_at: slot,
        duration_minutes: bookingReg.duration || 60,
        status: 'pending',
        student_confirmed: true,
        student_confirmed_at: new Date().toISOString(),
        notes: 'Menunggu konfirmasi pengajar',
      }));
      const { error } = await supabase.from('schedules').insert(rows);
      if (error) throw error;
      setBookingReg(null);
      setSelectedSlots(new Set());
      alert(`✅ ${rows.length} sesi berhasil di-booking! Menunggu konfirmasi pengajar.`);
    } catch (e: any) {
      alert('Gagal booking: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  }

    const activeRegs = useMemo(() => student?.registrations.filter(r => r.status === "Aktif") || [], [student]);
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
    setShowEnroll(true);
  };

  // ═══════════════════════════════════════════════════════════════════
  // ENROLLMENT WIZARD MODAL
  // ═══════════════════════════════════════════════════════════════════
  const EnrollWizard = () => {
    if (!showEnroll) return null;
    const filteredLangs = POPULAR_LANGUAGES.filter(l => l.toLowerCase().includes(langSearch.toLowerCase()));

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowEnroll(false)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Daftar Kelas Baru</h2>
              <p className="text-xs text-gray-500">Step {enrollStep + 1} dari 3</p>
            </div>
            <button
                        key={s.iso}
                        onClick={() => {
                          if (s.past || s.booked) return;
                          setSelectedSlots((prev) => {
                            const next = new Set(prev);
                            if (next.has(s.iso)) next.delete(s.iso);
                            else next.add(s.iso);
                            return next;
                          });
                        }}
                        disabled={s.past || s.booked}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                          selectedSlots.has(s.iso)
                            ? 'bg-green-600 text-white border-green-600 ring-2 ring-green-300'
                            : s.past || s.booked
                            ? 'bg-gray-100 text-gray-400 line-through cursor-not-allowed border-gray-200'
                            : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
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
                {selectedSlot
                  ? `📌 ${new Date(selectedSlot).toLocaleString("id-ID", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} WIB`
                  : "Pilih slot dulu"}
              </div>
              <button
                onClick={submitBooking}
                disabled={!selectedSlot || bookingSubmit}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {bookingSubmit ? "Menyimpan..." : "Booking →"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Enrollment Wizard */}
      <EnrollWizard />

      {/* Footer (desktop) */}
      <div className="hidden lg:block text-center py-8 text-xs text-gray-400">© 2026 Linguo.id — Everyone Can Be a Polyglot</div>
    </div>
  );
}
