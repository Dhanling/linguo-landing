"use client";

// jadwal-gcal-v1: potongan yang dipakai bareng kalender Jadwal (JadwalCalendar) DAN
// kartu "Sesi Mendatang" di Beranda (SesiMendatangCard). Dulu semuanya hidup di
// JadwalCalendar.tsx — begitu kartunya pindah ke Beranda, meng-import dari sana
// berarti menyeret seluruh kalender (grid + agenda) ke bundel Beranda.

import { useState } from "react";
import { RectFlag } from "@/components/RectFlag";
import { LANG_FLAGS } from "@/lib/lang-visuals";
import { baseLanguage } from "@/lib/classLanguage";
import { initial } from "@/lib/teacherName";
import { tr, useT } from "@/lib/uiLang"; // [ui-lang-switcher-v1]

// + jadwal-recurring-materi-v1: pertemuan ke berapa + materi yang bakal dibahas
//   (topik, rincian, berkas/link rujukan) — diisi pengajar waktu bikin jadwal.
export type JadwalMaterialLink = { name: string; url: string; kind: "file" | "link" };

export type JadwalSession = {
  id: string;
  scheduledAt: string; // ISO (dari schedules.scheduled_at)
  durationMinutes?: number | null;
  language: string;
  level?: string;
  product?: string;
  teacher?: string;
  /** jadwal-teacher-avatar-v1: foto pengajar (teachers.avatar_url) — fallback inisial. */
  teacherAvatarUrl?: string | null;
  sessionNumber?: number | null;
  materialTitle?: string;
  materialNotes?: string;
  materialLinks?: JadwalMaterialLink[];
  // jadwal-riwayat-v1: sesi lampau ikut masuk kalender
  registrationId?: string;
  /** schedules.status — scheduled | pending | completed | cancelled */
  status?: string;
  /** schedules.attendance_status — hadir | izin | sakit | alpa */
  attendanceStatus?: string | null;
  /** schedules.recording_url — mentah; ditautkan lewat studentRecordingHref */
  recordingUrl?: string | null;
  /** schedules.notes — dipakai mengenali baris presensi sintetis (lihat lib/sesiSintetis). */
  notes?: string | null;
  /* [jadwal-batch-kalender-v1] Pertemuan kelas grup (Reguler/ETP) yang DIHITUNG dari
     pola batch — tak ada baris `schedules`-nya. Karena itu tak punya ruang kelas,
     materi, presensi, maupun rekaman; kalender merendernya sebagai jadwal tetap.
     `joinUrl` = tautan rapat batch (mis. regular_batches.zoom_link) kalau ada. */
  isBatch?: boolean;
  joinUrl?: string | null;
};

/** Sesi yang sudah dinormalkan — dipakai kalender & kartu Beranda. */
export type NormSession = JadwalSession & {
  _d: Date; _iso: string; _time: string; _end: string | null; _weekday: string;
  _past: boolean; _joinable: boolean;
  /** jadwal-live-now-v1: jam sesinya sedang berjalan detik ini. */
  _live: boolean;
};

export const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
export const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const DOWS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
export const DOWS_FULL = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export function pad(n: number) { return String(n).padStart(2, "0"); }
export function ymd(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
export function isoOf(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
export function fmtTime(d: Date) { return `${pad(d.getHours())}.${pad(d.getMinutes())}`; }
export function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
export function startOfWeek(d: Date) { const x = new Date(d); const off = (x.getDay() + 6) % 7; x.setDate(x.getDate() - off); x.setHours(0, 0, 0, 0); return x; }

export type LangColor = { dot: string; bg: string; text: string };
const PALETTE: LangColor[] = [
  { dot: "#16796E", bg: "#16796E1A", text: "#0F5A52" },
  { dot: "#E11D48", bg: "#FFF1F2", text: "#BE123C" },
  { dot: "#6366F1", bg: "#EEF2FF", text: "#4F46E5" },
  { dot: "#D97706", bg: "#FFFBEB", text: "#B45309" },
  { dot: "#0EA5E9", bg: "#F0F9FF", text: "#0369A1" },
  { dot: "#7C3AED", bg: "#F5F3FF", text: "#6D28D9" },
  { dot: "#059669", bg: "#ECFDF5", text: "#047857" },
  { dot: "#EA580C", bg: "#FFF7ED", text: "#C2410C" },
  { dot: "#0891B2", bg: "#ECFEFF", text: "#0E7490" },
  { dot: "#DB2777", bg: "#FDF2F8", text: "#BE185D" },
];
const LANG_OVERRIDE: Record<string, number> = { Inggris: 0, English: 0, Jepang: 1, Japanese: 1, Korea: 2, Korean: 2 };
export function langColor(language: string): LangColor {
  if (language in LANG_OVERRIDE) return PALETTE[LANG_OVERRIDE[language]];
  let h = 0;
  for (let i = 0; i < language.length; i++) h = (h * 31 + language.charCodeAt(i)) >>> 0;
  return PALETTE[3 + (h % (PALETTE.length - 3))];
}

// ── jadwal-flag-avatar-v1: bendera bahasa di kartu jadwal ────────────────────
// Blok di kalender cuma punya warna bahasa (titik/garis kiri) yang artinya harus
// dihafal dari legenda. Bendera rounded-rectangle bikin "kelas apa" kebaca dalam
// sepersekian detik. Sumber kode negara = LANG_FLAGS (satu peta dengan kartu
// kelas Beranda), dinormalkan dulu lewat baseLanguage() supaya nama kelas reguler
// ("English - Conversation A1.1") tetap ketemu benderanya.
const LANG_FLAGS_LC: Record<string, string> = Object.fromEntries(
  Object.entries(LANG_FLAGS).map(([k, v]) => [k.toLowerCase(), v])
);

/** Kode negara ISO-2 untuk sebuah nama bahasa/kelas — undefined kalau tak dikenal. */
export function langFlagCode(language?: string | null): string | undefined {
  const base = baseLanguage(language).toLowerCase();
  return base ? LANG_FLAGS_LC[base] : undefined;
}

/**
 * Bendera bahasa untuk kartu jadwal. Bahasa yang tak punya bendera (mis. Latin)
 * TIDAK dikasih Globe abu-abu — di blok sekecil ini ikon fallback cuma jadi
 * noise; kartunya tetap punya warna bahasa sebagai identitas.
 */
export function LangFlag({ language, h = 10, className = "" }: { language?: string | null; h?: number; className?: string }) {
  const code = langFlagCode(language);
  if (!code) return null;
  return <RectFlag code={code} h={h} className={className} />;
}

// ── jadwal-teacher-avatar-v1: foto pengajar ──────────────────────────────────
// Nama pengajar sebelumnya cuma teks + ikon topi wisuda yang sama buat semua
// orang. Foto bikin kartu sesi langsung kebaca "kelas sama siapa". Sumber foto =
// `teachers.avatar_url` (sama dengan dashboard admin & pengajar); kalau kosong /
// gagal dimuat, jatuh ke inisial berwarna — jangan tampilkan kotak abu kosong.
function teacherInitials(name: string) {
  // [teacher-sapaan-v1] nama yang masuk sudah berbentuk sapaan ("Kak Dhani") —
  // ambil inisial panggilannya saja, jangan sampai jadi "KD".
  return initial(name);
}
function teacherTint(name: string): { bg: string; text: string } {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const p = PALETTE[h % PALETTE.length];
  return { bg: p.bg, text: p.text };
}

export function TeacherAvatar({ name, src, size = 18 }: { name: string; src?: string | null; size?: number }) {
  const [broken, setBroken] = useState(false);
  const tint = teacherTint(name);
  const box = { width: size, height: size };
  if (src && !broken) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        onError={() => setBroken(true)}
        className="shrink-0 rounded-full object-cover ring-1 ring-black/5"
        style={box}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-extrabold leading-none"
      style={{ ...box, background: tint.bg, color: tint.text, fontSize: Math.max(8, Math.round(size * 0.42)) }}
    >
      {teacherInitials(name) || "?"}
    </span>
  );
}

// ── jadwal-riwayat-v1: status sesi ───────────────────────────────────────────
// Sesi lampau bukan lagi lubang kosong di kalender. Warna bahasa tetap jadi
// identitas kelas; status ditumpuk sebagai penanda kecil + peredupan, biar
// kalender tetap kebaca sebagai "kelas apa" dulu, "hasilnya apa" kedua.
export const ATT_META: Record<string, { label: string; color: string }> = {
  hadir: { label: "Hadir", color: "#059669" },
  izin:  { label: "Izin",  color: "#D97706" },
  sakit: { label: "Sakit", color: "#0EA5E9" },
  alpa:  { label: "Alpa",  color: "#DC2626" },
};

/**
 * Sesi yang tidak akan pernah jalan. `hangus` itu nilai yang benar-benar dipakai
 * di data (sesi kedaluwarsa), bukan cuma `cancelled` — tanpa ini sesi hangus
 * bertanggal depan akan ikut dihitung sebagai "sesi mendatang".
 */
export const DEAD_STATUS: Record<string, { label: string; color: string }> = {
  cancelled: { label: "Dibatalkan", color: "#9CA3AF" },
  hangus:    { label: "Hangus",     color: "#DC2626" },
};
export const isDead = (status?: string) => !!status && status in DEAD_STATUS;

/** Warna penanda status sebuah sesi lampau/batal — null kalau sesi mendatang biasa. */
export function statusMeta(s: { status?: string; attendanceStatus?: string | null; _past?: boolean }) {
  if (isDead(s.status)) return DEAD_STATUS[s.status!];
  if (s.attendanceStatus && ATT_META[s.attendanceStatus]) return ATT_META[s.attendanceStatus];
  if (s._past) return { label: s.status === "completed" ? "Selesai" : "Sudah lewat", color: "#9CA3AF" };
  return null;
}

// ── jadwal-live-now-v1: sesi yang SEDANG berlangsung ─────────────────────────
// Sebelumnya kalender cuma punya dua keadaan: "mendatang" (hitung mundur) dan
// "sudah lewat" (redup). Persis waktu kelasnya jalan, kartunya kelihatan sama
// saja dengan sesi besok — padahal itulah menit paling penting buat siswa.
// Warna penanda = merah, satu bahasa dengan garis "sekarang" di time-grid.
export const LIVE_COLOR = "#DC2626";

/**
 * Jam sesinya sedang berjalan (mulai ≤ sekarang < selesai). Sesi batal/hangus
 * jelas tidak, dan sesi yang sudah ditandai `completed` pengajar juga tidak —
 * kelasnya sudah ditutup lebih awal, jangan diklaim masih jalan.
 */
export function isLiveNow(
  start: Date,
  durationMinutes: number | null | undefined,
  now: number,
  status?: string
) {
  if (isDead(status) || status === "completed") return false;
  const s = start.getTime();
  return now >= s && now < s + (durationMinutes || 60) * 60000;
}

/** Lencana "Sedang berlangsung" — titik berdenyut + label. */
export function LiveBadge({ compact = false }: { compact?: boolean }) {
  const t = useT(); // [ui-lang-switcher-v1]
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full font-extrabold leading-none ${
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[11px]"
      }`}
      style={{ background: `${LIVE_COLOR}1A`, color: LIVE_COLOR }}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: LIVE_COLOR }} />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: LIVE_COLOR }} />
      </span>
      {compact ? t("Live") : t("Sedang berlangsung")}
    </span>
  );
}

/** "2 jam lagi" / "45 menit lagi" — hitung mundur ringkas ke jam mulai. */
export function countdownLabel(start: Date, now: number) {
  const diff = start.getTime() - now;
  if (diff <= 0) return tr("sedang berlangsung");
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins} ${tr("menit lagi")}`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} ${tr("jam lagi")}`;
  const days = Math.round(hours / 24);
  return `${days} ${tr("hari lagi")}`;
}
