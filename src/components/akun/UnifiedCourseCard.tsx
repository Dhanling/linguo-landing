"use client";

import { motion } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────────
export type CourseReg = {
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

type ScheduleItem = {
  id: string;
  registration_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
};

// ── Product badge config ──────────────────────────────────────────
const PRODUCT_BADGE: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  "Kelas Private":            { label: "Private",  icon: "👤", color: "text-teal-700",   bg: "bg-teal-50" },
  "Kelas Reguler":            { label: "Reguler",  icon: "👥", color: "text-blue-700",   bg: "bg-blue-50" },
  "Kelas Kids":               { label: "Kids",     icon: "🧒", color: "text-purple-700", bg: "bg-purple-50" },
  "English Test Preparation": { label: "Test Prep", icon: "📝", color: "text-amber-700",  bg: "bg-amber-50" },
};

// ── Helpers ────────────────────────────────────────────────────────
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

// ── Props ──────────────────────────────────────────────────────────
type Props = {
  reg: CourseReg;
  index: number;
  /** Upcoming schedule for this registration (first one only) */
  nextSchedule?: ScheduleItem | null;
  /** User id (needed for PaymentCard) */
  userId?: string;
  /** Callbacks */
  onDetail?: (reg: CourseReg) => void;
  onBooking?: (reg: CourseReg) => void;
  /** Render prop for the payment section — receives reg + userId */
  renderPayment?: (reg: CourseReg, userId: string) => React.ReactNode;
  /** Card variant — "pending" renders the sidebar-style compact card */
  variant?: "active" | "pending";
};

export default function UnifiedCourseCard({
  reg,
  index,
  nextSchedule,
  userId,
  onDetail,
  onBooking,
  renderPayment,
  variant = "active",
}: Props) {
  const badge = PRODUCT_BADGE[reg.product] || PRODUCT_BADGE["Kelas Private"];
  const isReguler = reg.product === "Kelas Reguler";
  const isKids = reg.product === "Kelas Kids";
  const isTestPrep = reg.product === "English Test Preparation";
  const isPrivate = reg.product === "Kelas Private";
  const progress = reg.sessions_total > 0 ? Math.round((reg.sessions_used / reg.sessions_total) * 100) : 0;
  const levelProgress = getLevelProgress(reg.level || "A1.1");
  const currentMilestone = LEVEL_MILESTONES.indexOf((reg.level || "A1").split(".")[0]);
  const nextClassDate = nextSchedule ? new Date(nextSchedule.scheduled_at) : null;
  const isPendingPayment = reg.status === "Menunggu Pembayaran";
  const isActive = reg.status === "Aktif";

  // ── Pending / sidebar variant ────────────────────────────────────
  if (variant === "pending") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08 }}
        className="rounded-2xl border shadow-sm p-4 bg-amber-50 border-amber-200 overflow-hidden"
      >
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-amber-800">
          <span>🟡</span><span>Belum Bayar</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-white border flex items-center justify-center shrink-0">
            <img src={getFlagUrl(reg.language || "")} alt="" className="h-6 w-6 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm truncate" title={reg.language || reg.product}>{reg.language || reg.product}</h4>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badge.bg} ${badge.color} whitespace-nowrap`}>{badge.icon} {badge.label}</span>
              <span className="inline-flex items-center rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-700">{reg.level}</span>
            </div>
          </div>
        </div>
        {userId && (
          <a
            href={"https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20mau%20konfirmasi%20pembayaran%20untuk%20kelas%20" + encodeURIComponent(reg.language || reg.product || "")}
            target="_blank"
            rel="noopener"
            className="mt-2 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors"
          >
            💳 Konfirmasi Pembayaran via WA
          </a>
        )}
      </motion.div>
    );
  }

  // ── Active / main variant ────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`rounded-2xl border shadow-sm p-4 hover:shadow-md transition-shadow ${
        isPendingPayment ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100"
      }`}
    >
      {/* Payment status banner */}
      {isPendingPayment && (
        <div className="flex items-center gap-2 mb-3 text-amber-700 bg-amber-100 rounded-xl px-3 py-1.5">
          <span className="text-sm">🟡</span>
          <span className="text-xs font-semibold">Menunggu Pembayaran</span>
        </div>
      )}

      {/* Header: Flag + Language + Product Badge */}
      <div className="flex items-center gap-3 mb-3">
        <div className="h-11 w-11 rounded-xl bg-teal-50 flex items-center justify-center shadow-sm">
          <img src={getFlagUrl(reg.language)} alt="" className="h-6 w-6 object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900">{reg.language}</h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badge.bg} ${badge.color}`}>
              {badge.icon} {badge.label}
            </span>
            {reg.duration && <span className="text-[10px] text-gray-400">{reg.duration} mnt/sesi</span>}
          </div>
        </div>
        <span className="inline-flex items-center rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">{reg.level}</span>
      </div>

      {/* Teacher */}
      {reg.teachers && (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-500">
          <span>👩‍🏫</span><span>{reg.teachers.name}</span>
        </div>
      )}

      {/* ── PRODUCT-SPECIFIC CONTENT ── */}

      {/* REGULER: Batch info */}
      {isReguler && reg.batch && (
        <div className="mb-3 rounded-xl bg-blue-50/70 border border-blue-100 p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Jadwal Tetap</span>
            <span className="text-[10px] text-blue-500 font-medium">{reg.batch.batch_code}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-blue-800">
            <span>📅</span>
            <span className="font-semibold">{reg.batch.schedule_day}, {reg.batch.schedule_time} WIB</span>
          </div>
          {reg.batch.start_date && reg.batch.end_date && (
            <p className="text-[10px] text-blue-500">
              Periode: {new Date(reg.batch.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} — {new Date(reg.batch.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
          {reg.batch.zoom_link && (
            <a href={reg.batch.zoom_link} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700 mt-1">
              🔗 Buka Zoom
            </a>
          )}
        </div>
      )}

      {/* REGULER without batch: fallback */}
      {isReguler && !reg.batch && isActive && (
        <div className="mb-3 rounded-xl bg-blue-50/50 border border-blue-100 px-3 py-2 text-xs text-blue-600">
          📋 Jadwal batch akan segera diinfokan admin via WhatsApp
        </div>
      )}

      {/* KIDS: Parent-friendly note */}
      {isKids && isActive && (
        <div className="mb-3 rounded-xl bg-purple-50/70 border border-purple-100 px-3 py-2 text-xs text-purple-700">
          👨‍👩‍👧 Kelas disesuaikan untuk anak usia 5–12 tahun · {reg.duration === "30" ? "30 menit" : "45 menit"}/sesi
        </div>
      )}

      {/* TEST PREP: Target info */}
      {isTestPrep && isActive && (
        <div className="mb-3 rounded-xl bg-amber-50/70 border border-amber-100 px-3 py-2 text-xs text-amber-700">
          🎯 Target: {reg.language} · {reg.sessions_total > 0 ? `${reg.sessions_total} sesi persiapan` : "Sesi diatur admin"}
        </div>
      )}

      {/* Next class countdown (all products) */}
      {nextClassDate && isActive && (
        <div className="mb-3 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-600 font-semibold">🟢 Kelas berikutnya:</span>
            <span className="text-emerald-700 font-bold">
              {nextClassDate.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })} · {nextClassDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
            </span>
          </div>
        </div>
      )}

      {/* Session progress */}
      <div className="mb-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">{isReguler ? "Pertemuan" : "Sesi"}</span>
          <span className="font-semibold text-gray-700">{reg.sessions_used}/{reg.sessions_total} ({progress}%)</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
          />
        </div>
      </div>

      {/* Payment card (for pending payment active cards) */}
      {isPendingPayment && userId && renderPayment && renderPayment(reg, userId)}

      {/* Booking button — only for active PRIVATE classes with teacher */}
      {isActive && reg.teacher_id && isPrivate && (
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); onDetail?.(reg); }}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            📋 Detail
          </button>
          <button
            onClick={() => onBooking?.(reg)}
            className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm"
          >
            📅 Booking Sesi
          </button>
        </div>
      )}

      {/* Detail button for Reguler/Kids/TestPrep active classes */}
      {isActive && !isPrivate && (
        <button
          onClick={(e) => { e.stopPropagation(); onDetail?.(reg); }}
          className="w-full mt-3 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          📋 Lihat Detail Kelas
        </button>
      )}

      {/* Level progress */}
      <div className="mt-3 pt-3 border-t border-gray-50">
        <div className="flex justify-between mb-1.5">
          <span className="text-[10px] font-medium text-gray-400">Level Progress</span>
          <span className="text-xs font-bold text-teal-600">{reg.level}</span>
        </div>
        <div className="relative">
          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-700" style={{ width: levelProgress + "%" }} />
          </div>
          <div className="flex justify-between mt-1">
            {LEVEL_MILESTONES.map((m, mi) => (
              <div key={m} className="flex flex-col items-center" style={{ width: "25%" }}>
                <div className={`h-1.5 w-1.5 rounded-full -mt-[6px] ${mi <= currentMilestone ? "bg-teal-600" : "bg-gray-300"}`} />
                <span className={`text-[8px] mt-0.5 ${mi <= currentMilestone ? "text-teal-600 font-bold" : "text-gray-400"}`}>{m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
