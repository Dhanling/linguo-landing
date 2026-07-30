"use client";

// linguo-patch:akun-jadwal-tab-v1
// Kalender Jadwal LMS siswa — dipakai di tab "jadwal" /akun (src/app/akun/page.tsx).
// Port dari Claude Design frame (Jadwal.html) -> React, disambung ke data real
// `upcomingSchedules` (kolom `scheduled_at` + resolve bahasa/level/teacher dari registrasi).
// Warna config-independent (hex inline). Palet match shell: teal #16796E.
// + jadwal-compact-v1: tinggi sel diatur biar proporsional (ga strech/ceper).
// + jadwal-views-v1: toggle tampilan Hari / Minggu / Bulan (ala Google Calendar).
// + jadwal-real-only-v1: fallback dummy DIHAPUS — akun kosong tampil empty state.

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Video, GraduationCap, CalendarDays, Clock, BookOpen, FileText, ExternalLink, PlayCircle } from "lucide-react";
import { classRoomUrl, isJoinable, studentRecordingHref, isInternalRecordingHref } from "@/lib/classRoom"; // [kelas-video-siswa-v1] + jadwal-riwayat-v1
import { fmtDuration } from "@/lib/studentInsights"; // jadwal-week-timeline-v1: label beban minggu

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
};

/** jadwal-riwayat-v1: ringkasan progres per kelas (dari registrations). */
export type JadwalClass = {
  id: string;
  language: string;
  level?: string;
  sessionsTotal?: number | null;
  /**
   * `registrations.sessions_used` — SUMBER RESMI jumlah sesi terpakai. Jangan
   * diganti hitungan baris `schedules` yang berstatus completed: presensi
   * sebagian besar kelas dicatat di registrasi, dan baris schedules-nya nyaris
   * selalu kosong — menghitung dari sana bikin kelas yang sudah 10 sesi tampil
   * "Sesi 0 dari 16".
   */
  sessionsUsed?: number | null;
};

export type RegularBatch = {
  id: string;
  language: string;
  batchCode?: string;
  scheduleDay?: string;
  scheduleTime?: string;
  zoomLink?: string | null;
};

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const DOWS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const DOWS_FULL = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

function pad(n: number) { return String(n).padStart(2, "0"); }
function ymd(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function isoOf(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function fmtTime(d: Date) { return `${pad(d.getHours())}.${pad(d.getMinutes())}`; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function startOfWeek(d: Date) { const x = new Date(d); const off = (x.getDay() + 6) % 7; x.setDate(x.getDate() - off); x.setHours(0, 0, 0, 0); return x; }

// [kelas-video-siswa-v1] `classRoomUrl` + `isJoinable` sekarang di @/lib/classRoom
// (dulu disalin di sini DAN di akun/page.tsx — gampang lepas sinkron).

type LangColor = { dot: string; bg: string; text: string };
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
function langColor(language: string): LangColor {
  if (language in LANG_OVERRIDE) return PALETTE[LANG_OVERRIDE[language]];
  let h = 0;
  for (let i = 0; i < language.length; i++) h = (h * 31 + language.charCodeAt(i)) >>> 0;
  return PALETTE[3 + (h % (PALETTE.length - 3))];
}

// ── jadwal-riwayat-v1: status sesi ───────────────────────────────────────────
// Sesi lampau bukan lagi lubang kosong di kalender. Warna bahasa tetap jadi
// identitas kelas; status ditumpuk sebagai penanda kecil + peredupan, biar
// kalender tetap kebaca sebagai "kelas apa" dulu, "hasilnya apa" kedua.
const ATT_META: Record<string, { label: string; color: string }> = {
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
const DEAD_STATUS: Record<string, { label: string; color: string }> = {
  cancelled: { label: "Dibatalkan", color: "#9CA3AF" },
  hangus:    { label: "Hangus",     color: "#DC2626" },
};
const isDead = (status?: string) => !!status && status in DEAD_STATUS;

/** Warna penanda status sebuah sesi lampau/batal — null kalau sesi mendatang biasa. */
function statusMeta(s: { status?: string; attendanceStatus?: string | null; _past?: boolean }) {
  if (isDead(s.status)) return DEAD_STATUS[s.status!];
  if (s.attendanceStatus && ATT_META[s.attendanceStatus]) return ATT_META[s.attendanceStatus];
  if (s._past) return { label: s.status === "completed" ? "Selesai" : "Sudah lewat", color: "#9CA3AF" };
  return null;
}

/** "2 jam lagi" / "45 menit lagi" — hitung mundur ringkas ke jam mulai. */
function countdownLabel(start: Date, now: number) {
  const diff = start.getTime() - now;
  if (diff <= 0) return "sedang berlangsung";
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins} menit lagi`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} jam lagi`;
  const days = Math.round(hours / 24);
  return `${days} hari lagi`;
}

type NormSession = JadwalSession & {
  _d: Date; _iso: string; _time: string; _end: string | null; _weekday: string;
  _past: boolean; _joinable: boolean;
};
type ViewMode = "day" | "week" | "month";

export default function JadwalCalendar({
  sessions,
  regularBatches = [],
  studentName,
  classes = [],
}: {
  sessions: JadwalSession[];
  regularBatches?: RegularBatch[];
  /** Nama siswa — ikut dikirim ke room biar dia tak perlu mengetiknya lagi. */
  studentName?: string;
  /** jadwal-riwayat-v1: kelas aktif — dasar ringkasan "Sesi 5 dari 16". */
  classes?: JadwalClass[];
}) {
  const today = useMemo(() => new Date(), []);
  const todayIso = ymd(today);

  // jadwal-riwayat-v1: satu patokan "sekarang" per render, dipakai buat menandai
  // sesi lampau, hitung mundur, dan jendela tombol Masuk Kelas.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const items = useMemo<NormSession[]>(
    () =>
      sessions
        .filter((s) => s.scheduledAt)
        .map((s) => {
          const d = new Date(s.scheduledAt);
          const end = s.durationMinutes ? new Date(d.getTime() + s.durationMinutes * 60000) : null;
          return {
            ...s,
            _d: d,
            _iso: ymd(d),
            _time: fmtTime(d),
            _end: end ? fmtTime(end) : null,
            _weekday: d.toLocaleDateString("id-ID", { weekday: "long" }),
            _past: d.getTime() + (s.durationMinutes || 60) * 60000 < now,
            _joinable: !isDead(s.status) && isJoinable(d),
          };
        }),
    [sessions, now]
  );

  /** Sesi mendatang saja — dasar daftar samping & hitungan di kepala kalender. */
  const upcoming = useMemo(
    () => items.filter((i) => !i._past && !isDead(i.status)).sort((a, b) => a._d.getTime() - b._d.getTime()),
    [items]
  );

  const [mode, setMode] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [selected, setSelected] = useState<string | null>(null);

  const eventsOn = (iso: string) => items.filter((i) => i._iso === iso).sort((a, b) => a._d.getTime() - b._d.getTime());

  const legend = useMemo(() => {
    const seen = new Map<string, LangColor>();
    for (const i of items) if (!seen.has(i.language)) seen.set(i.language, langColor(i.language));
    return Array.from(seen.entries()).slice(0, 6);
  }, [items]);

  /** jadwal-riwayat-v1: status presensi yang benar-benar muncul di data siswa ini. */
  const attLegend = useMemo(() => {
    const seen = new Set<string>();
    for (const i of items) if (i.attendanceStatus && ATT_META[i.attendanceStatus]) seen.add(i.attendanceStatus);
    return (["hadir", "izin", "sakit", "alpa"] as const).filter((k) => seen.has(k));
  }, [items]);

  // jadwal-riwayat-v1: tanpa saringan ini daftar samping akan dibuka oleh sesi
  // dari 12 bulan lalu — mendatang dulu, riwayat lewat tombol khusus.
  const [showPast, setShowPast] = useState(false);
  const sideList = useMemo(() => {
    if (selected) return eventsOn(selected);
    if (showPast) {
      return items.filter((i) => i._past || isDead(i.status)).sort((a, b) => b._d.getTime() - a._d.getTime());
    }
    return upcoming;
  }, [items, upcoming, selected, showPast]);

  const pastCount = useMemo(() => items.filter((i) => i._past || isDead(i.status)).length, [items]);

  // jadwal-compact-v2: daftar samping dulu memuat SEMUA sesi mendatang (13 kartu
  // = kolom sepanjang 3x kalender + laut kosong di sebelahnya). Tampil 4 dulu,
  // sisanya lewat "Lihat semua" dan digulir di dalam kolomnya sendiri.
  const SIDE_LIMIT = 4;
  const [sideExpanded, setSideExpanded] = useState(false);
  useEffect(() => { setSideExpanded(false); }, [selected, showPast]);
  const sideVisible = sideExpanded ? sideList : sideList.slice(0, SIDE_LIMIT);
  const sideHidden = Math.max(0, sideList.length - sideVisible.length);

  /** jadwal-riwayat-v1: rekap per kelas — "Sesi 5 dari 16" + hitungan presensi. */
  const classSummary = useMemo(() => {
    if (!classes.length) return [];
    return classes.map((c) => {
      const mine = items.filter((i) => i.registrationId === c.id);
      // `sessions_used` yang dipakai; hitungan baris schedules cuma cadangan
      // buat registrasi yang belum punya angka itu (lihat catatan di JadwalClass).
      const fromRows = mine.filter((i) => i.status === "completed" || (i._past && !isDead(i.status))).length;
      const done = typeof c.sessionsUsed === "number" ? c.sessionsUsed : fromRows;
      const att: Record<string, number> = {};
      mine.forEach((i) => { if (i.attendanceStatus) att[i.attendanceStatus] = (att[i.attendanceStatus] || 0) + 1; });
      const next = mine.filter((i) => !i._past && !isDead(i.status)).sort((a, b) => a._d.getTime() - b._d.getTime())[0];
      return { ...c, done, att, next, color: langColor(c.language) };
    }).filter((c) => c.done > 0 || c.next);
  }, [classes, items]);

  const cells = useMemo(() => {
    const y = cursor.getFullYear(), m = cursor.getMonth();
    const lead = (new Date(y, m, 1).getDay() + 6) % 7;
    const days = new Date(y, m + 1, 0).getDate();
    const out: ({ d: number; iso: string } | null)[] = [];
    for (let i = 0; i < lead; i++) out.push(null);
    for (let d = 1; d <= days; d++) out.push({ d, iso: isoOf(y, m, d) });
    return out;
  }, [cursor]);

  const weekDays = useMemo(() => {
    const s = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => addDays(s, i));
  }, [cursor]);

  // + jadwal-week-timeline-v1: tampilan Minggu jadi kisi JAM (ala Google Calendar),
  //   bukan 7 kotak hari. Rentang jamnya ikut isi minggu itu — kalau semua sesi
  //   sore, kisi pagi kosong tidak usah ikut memakan layar.
  const weekRange = useMemo(() => {
    const isos = new Set(weekDays.map(ymd));
    const evs = items.filter((i) => isos.has(i._iso));
    let start = 7, end = 21;
    evs.forEach((e) => {
      const h = e._d.getHours();
      const endH = Math.ceil((h * 60 + e._d.getMinutes() + (e.durationMinutes || 60)) / 60);
      if (h < start) start = h;
      if (endH > end) end = endH;
    });
    return { start: Math.max(0, start), end: Math.min(24, Math.max(end, start + 4)) };
  }, [items, weekDays]);

  /** Total menit sesi terjadwal di minggu yang lagi dilihat. */
  const weekMinutes = useMemo(() => {
    const isos = new Set(weekDays.map(ymd));
    return items.filter((i) => isos.has(i._iso)).reduce((a, e) => a + (e.durationMinutes || 60), 0);
  }, [items, weekDays]);

  /**
   * Susun sesi satu hari jadi jalur (lane) supaya sesi yang jamnya tabrakan
   * tampil bersebelahan, bukan tumpuk-tumpukan.
   */
  const layoutDay = (evs: NormSession[]) => {
    const sorted = [...evs].sort((a, b) => a._d.getTime() - b._d.getTime());
    const laneEnd: number[] = [];
    const placed = sorted.map((e) => {
      const s = e._d.getTime();
      const t = s + (e.durationMinutes || 60) * 60000;
      let lane = laneEnd.findIndex((end) => end <= s);
      if (lane === -1) { lane = laneEnd.length; laneEnd.push(t); }
      else laneEnd[lane] = t;
      return { e, lane };
    });
    return { placed, lanes: Math.max(1, laneEnd.length) };
  };

  const dayEvents = useMemo(() => eventsOn(ymd(cursor)), [items, cursor]);

  /**
   * jadwal-compact-v2: hari yang isinya dibedah di bawah kisi bulanan. Tanpa
   * pilihan manual: hari ini kalau ada sesinya, kalau tidak lompat ke sesi
   * terdekat — kotak "tidak ada sesi" tiap kali tab dibuka itu ruang terbuang.
   */
  const agendaIso = useMemo(() => {
    if (selected) return selected;
    if (items.some((i) => i._iso === todayIso)) return todayIso;
    return upcoming[0]?._iso ?? todayIso;
  }, [selected, items, upcoming, todayIso]);
  const agendaEvents = useMemo(() => eventsOn(agendaIso), [items, agendaIso]);
  const agendaTitle = useMemo(() => {
    const [yy, mm, dd] = agendaIso.split("-").map(Number);
    const d = new Date(yy, mm - 1, dd);
    return `${DOWS_FULL[(d.getDay() + 6) % 7]}, ${dd} ${MONTHS[mm - 1]} ${yy}`;
  }, [agendaIso]);

  const goPrev = () => { setSelected(null); setCursor((c) => mode === "month" ? new Date(c.getFullYear(), c.getMonth() - 1, 1) : addDays(c, mode === "week" ? -7 : -1)); };
  const goNext = () => { setSelected(null); setCursor((c) => mode === "month" ? new Date(c.getFullYear(), c.getMonth() + 1, 1) : addDays(c, mode === "week" ? 7 : 1)); };
  const goToday = () => { setSelected(null); setCursor(new Date()); };

  const periodTitle = (() => {
    if (mode === "month") return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
    if (mode === "day") return `${DOWS_FULL[(cursor.getDay() + 6) % 7]}, ${cursor.getDate()} ${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
    const s = startOfWeek(cursor), e = addDays(s, 6);
    if (s.getMonth() === e.getMonth()) return `${s.getDate()}–${e.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`;
    if (s.getFullYear() === e.getFullYear()) return `${s.getDate()} ${MONTHS_SHORT[s.getMonth()]} – ${e.getDate()} ${MONTHS_SHORT[e.getMonth()]} ${s.getFullYear()}`;
    return `${s.getDate()} ${MONTHS_SHORT[s.getMonth()]} ${s.getFullYear()} – ${e.getDate()} ${MONTHS_SHORT[e.getMonth()]} ${e.getFullYear()}`;
  })();

  const navBtn = "w-9 h-9 rounded-xl bg-white shadow-[0_10px_30px_-22px_rgba(18,23,43,0.6)] flex items-center justify-center hover:bg-slate-50 transition text-[#12172B]";

  return (
    <div className="w-full space-y-4">
      {/* Jadwal Tetap (Kelas Reguler) — recurring batch + Zoom */}
      {regularBatches.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-[0_10px_30px_-24px_rgba(18,23,43,.5)]">
          <h3 className="text-[13px] font-bold text-[#12172B] mb-2.5 inline-flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-[#16796E]" strokeWidth={2.5} /> Jadwal Tetap (Kelas Reguler)
          </h3>
          <div className="space-y-2">
            {regularBatches.map((b) => {
              const c = langColor(b.language);
              return (
                <div key={b.id} className="flex items-center gap-3 rounded-xl bg-[#F5F6F8] p-3">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.dot }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-[#12172B] truncate">
                      {b.language}{b.batchCode ? ` · ${b.batchCode}` : ""}
                    </p>
                    {(b.scheduleDay || b.scheduleTime) && (
                      <p className="text-[12px] text-[#6B7280] font-medium">
                        Setiap {b.scheduleDay}{b.scheduleTime ? `, ${b.scheduleTime} WIB` : ""}
                      </p>
                    )}
                  </div>
                  {b.zoomLink && (
                    <a href={b.zoomLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] font-bold text-[#16796E] hover:text-[#0F5A52]">
                      <Video className="w-3.5 h-3.5" strokeWidth={2.5} /> Zoom
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* jadwal-riwayat-v1: rekap progres per kelas — "Sesi 5 dari 16" + presensi.
          Ini yang bikin kalender kebaca sebagai catatan perjalanan, bukan cuma
          daftar janji temu. */}
      {/* jadwal-compact-v2: kelas aktif bisa 4+; 2 kolom bikin blok ini setinggi
          kalender sendiri. Di layar lebar dirapatkan jadi 4 kolom. */}
      {classSummary.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {classSummary.map((c) => {
            const total = c.sessionsTotal || 0;
            const pct = total > 0 ? Math.min(100, Math.round((c.done / total) * 100)) : 0;
            return (
              <div key={c.id} className="rounded-2xl bg-white p-4 shadow-[0_10px_30px_-24px_rgba(18,23,43,.5)]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color.dot }} />
                  <p className="min-w-0 flex-1 truncate text-[13.5px] font-extrabold text-[#12172B]">
                    {c.language}{c.level ? ` — ${c.level}` : ""}
                  </p>
                  <span className="shrink-0 text-[12px] font-bold text-[#6B7280]">
                    {total > 0 ? `Sesi ${c.done} dari ${total}` : `${c.done} sesi selesai`}
                  </span>
                </div>
                {total > 0 && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#F0F1F4]">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: c.color.dot }} />
                  </div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] font-semibold">
                  {(["hadir", "izin", "sakit", "alpa"] as const).map((k) =>
                    c.att[k] ? (
                      <span key={k} className="inline-flex items-center gap-1" style={{ color: ATT_META[k].color }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: ATT_META[k].color }} />
                        {ATT_META[k].label} {c.att[k]}
                      </span>
                    ) : null
                  )}
                  {c.next && (
                    <span className="text-[#6B7280]">
                      Berikutnya {c.next._d.getDate()} {MONTHS_SHORT[c.next._d.getMonth()]} · {c.next._time}
                    </span>
                  )}
                  {!c.next && <span className="text-[#9CA3AF]">Belum ada sesi terjadwal</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Kalender panel */}
      <div className="bg-white rounded-[26px] overflow-hidden flex flex-col-reverse lg:flex-row min-w-0 shadow-[0_24px_60px_-40px_rgba(18,23,43,0.45)]">
        {/* LEFT: sesi mendatang + legend */}
        <section className="w-full lg:w-[268px] shrink-0 border-t lg:border-t-0 lg:border-r border-slate-100 flex flex-col bg-white">
          <div className="px-5 pt-6 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-[17px] font-extrabold text-[#12172B]">
                {selected ? selTitle(selected) : showPast ? "Riwayat Sesi" : "Sesi Mendatang"}
              </h2>
              <p className="text-[12px] text-[#6B7280] font-medium mt-0.5">
                {selected ? `${sideList.length} sesi terjadwal` : showPast ? `${pastCount} sesi sudah lewat` : "Semua kelas aktif"}
              </p>
            </div>
            {selected && (
              <button onClick={() => setSelected(null)} className="text-[12px] font-bold text-[#16796E] hover:text-[#0F5A52] whitespace-nowrap">Semua</button>
            )}
          </div>

          {/* jadwal-riwayat-v1: tukar daftar mendatang ↔ riwayat */}
          {!selected && pastCount > 0 && (
            <div className="px-4 pb-2">
              <div className="inline-flex w-full rounded-xl bg-[#F5F6F8] p-1">
                {([[false, `Mendatang (${upcoming.length})`], [true, `Riwayat (${pastCount})`]] as [boolean, string][]).map(([v, label]) => (
                  <button
                    key={String(v)}
                    onClick={() => setShowPast(v)}
                    className="flex-1 rounded-lg px-2 py-1.5 text-[11.5px] font-bold transition"
                    style={showPast === v ? { background: "#fff", color: "#12172B", boxShadow: "0 6px 18px -14px rgba(18,23,43,.7)" } : { color: "#6B7280" }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className={`px-4 pb-2 flex flex-col gap-2.5 overflow-y-auto ${sideExpanded ? "max-h-[420px]" : "max-h-[320px] lg:max-h-none"}`}>
            {sideList.length ? (
              sideVisible.map((s) => (
                <SideItem key={s.id} s={s} now={now} studentName={studentName} onClick={() => setSelected(s._iso)} />
              ))
            ) : (
              <div className="text-center text-[13px] text-[#6B7280] font-medium py-10">
                {showPast ? "Belum ada sesi yang sudah lewat." : "Belum ada sesi mendatang."}
                <span className="block text-[12px] text-[#9CA3AF] mt-1">
                  {showPast ? "Riwayat akan muncul setelah kelas pertamamu jalan." : "Hubungi admin untuk atur jadwal kelasmu."}
                </span>
              </div>
            )}
          </div>
          {sideHidden > 0 || sideExpanded ? (
            <div className="px-4 pb-4 pt-1">
              <button
                onClick={() => setSideExpanded((v) => !v)}
                className="w-full rounded-xl bg-[#F5F6F8] py-2 text-[12px] font-bold text-[#16796E] transition hover:bg-[#EAF3F2]"
              >
                {sideExpanded ? "Ringkas" : `Lihat semua (${sideList.length})`}
              </button>
            </div>
          ) : (
            <div className="pb-2" />
          )}
          {legend.length > 0 && (
            <div className="mt-auto px-5 py-4 border-t border-slate-100">
              <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide mb-2">Bahasa</p>
              {/* jadwal-compact-v2: mendatar — 6 bahasa menumpuk bikin kolom makin jangkung */}
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[12.5px] font-semibold text-[#12172B]">
                {legend.map(([lang, c]) => (
                  <span key={lang} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.dot }} />{lang}
                  </span>
                ))}
              </div>
              {/* jadwal-riwayat-v1: sesi lampau sekarang punya penanda presensi —
                  tanpa keterangan ini titik warnanya cuma jadi teka-teki. */}
              {attLegend.length > 0 && (
                <>
                  <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide mb-2.5 mt-4">Presensi</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[12.5px] font-semibold text-[#12172B]">
                    {attLegend.map((k) => (
                      <span key={k} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: ATT_META[k].color }} />{ATT_META[k].label}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        {/* RIGHT: calendar */}
        <main className="flex-1 bg-[#F5F6F8] min-w-0 flex flex-col">
          <div className="px-5 lg:px-7 pt-6 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-[22px] font-extrabold leading-tight text-[#12172B]">Jadwal Kelas</h1>
              {/* jadwal-riwayat-v1: `items` sekarang termasuk riwayat — hitungannya
                  wajib dari `upcoming`, kalau tidak angkanya bohong. */}
              <p className="text-[12px] font-medium text-[#6B7280] mt-0.5">
                {upcoming.length} sesi mendatang{pastCount > 0 ? ` · ${pastCount} sudah lewat` : ""}
              </p>
            </div>
            <button onClick={goToday} className="text-[13px] font-bold px-4 h-10 rounded-2xl bg-white shadow-[0_10px_30px_-22px_rgba(18,23,43,0.6)] hover:bg-slate-50 transition text-[#12172B]">Hari ini</button>
          </div>

          <div className="px-5 lg:px-7 mt-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-[18px] font-extrabold text-[#12172B]">{periodTitle}</h2>
              {/* jadwal-week-timeline-v1: beban minggu yang lagi dilihat.
                  jadwal-riwayat-v1: `sessions` sekarang memuat riwayat juga, jadi
                  labelnya "total" — bukan lagi klaim jam yang belum dijalani. */}
              {mode === "week" && weekMinutes > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#16796E]/10 px-3 py-1 text-[12px] font-bold text-[#16796E]">
                  <Clock className="w-3.5 h-3.5" strokeWidth={2.6} />
                  Total minggu ini: {fmtDuration(weekMinutes)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* toggle Hari / Minggu / Bulan */}
              <div className="inline-flex rounded-xl bg-white p-1 shadow-[0_10px_30px_-22px_rgba(18,23,43,0.6)]">
                {([["day", "Hari"], ["week", "Minggu"], ["month", "Bulan"]] as [ViewMode, string][]).map(([m, label]) => (
                  <button
                    key={m}
                    onClick={() => { setSelected(null); setMode(m); }}
                    className="text-[12px] font-bold px-3 h-8 rounded-lg transition"
                    style={mode === m ? { background: "#16796E", color: "#fff" } : { color: "#6B7280" }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button onClick={goPrev} aria-label="Sebelumnya" className={navBtn}><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={goNext} aria-label="Berikutnya" className={navBtn}><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="px-5 lg:px-7 pb-7 pt-4 flex-1">
            {/* ===== BULAN ===== */}
            {mode === "month" && (
              <div className="bg-white rounded-[2rem] p-3 sm:p-4 shadow-[0_24px_50px_-34px_rgba(18,23,43,.5)]">
                <div className="grid grid-cols-7 text-center text-[12px] font-bold text-[#6B7280] pb-2">
                  {DOWS.map((d, i) => <div key={d} className={i >= 5 ? "text-slate-300" : ""}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {cells.map((cell, i) => {
                    if (!cell) return <div key={`lead-${i}`} />;
                    const evs = eventsOn(cell.iso);
                    const isToday = cell.iso === todayIso;
                    const isSel = selected === cell.iso;
                    const dow = (new Date(cursor.getFullYear(), cursor.getMonth(), cell.d).getDay() + 6) % 7;
                    return (
                      <button
                        key={cell.iso}
                        onClick={() => evs.length && setSelected(cell.iso)}
                        tabIndex={evs.length ? 0 : -1}
                        aria-label={`${cell.d} ${MONTHS[cursor.getMonth()]}${evs.length ? `, ${evs.length} sesi` : ""}`}
                        className={[
                          "text-left rounded-xl p-1.5 sm:p-2 min-h-[44px] sm:min-h-[78px] flex flex-col gap-1 transition",
                          evs.length ? "cursor-pointer hover:bg-white" : "cursor-default",
                          dow >= 5 ? "bg-[#F5F6F8]/60" : "bg-[#F5F6F8]",
                        ].join(" ")}
                        style={isSel ? { background: "#fff", outline: "2px solid #16796E" } : undefined}
                      >
                        <span className="flex items-center justify-between">
                          {isToday ? (
                            <span className="inline-flex w-6 h-6 rounded-full items-center justify-center text-[12px] sm:text-[13px] font-extrabold" style={{ background: "#16796E", color: "#fff" }}>{cell.d}</span>
                          ) : (
                            <span className="text-[12px] sm:text-[13px] font-extrabold text-[#12172B]">{cell.d}</span>
                          )}
                        </span>
                        <span className="flex flex-col gap-1 overflow-hidden">
                          {evs.slice(0, 2).map((e) => {
                            const c = langColor(e.language);
                            // jadwal-riwayat-v1: sesi lampau diredupkan; titiknya pakai
                            // warna presensi kalau pengajar sudah mengisi.
                            const st = statusMeta(e);
                            return (
                              <span
                                key={e.id}
                                title={`${e._time} · ${e.language}${e.level ? ` ${e.level}` : ""}${st ? ` · ${st.label}` : ""}`}
                                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-tight truncate"
                                style={{ background: c.bg, color: c.text, opacity: e._past || isDead(e.status) ? 0.55 : 1 }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: st ? st.color : c.dot }} />
                                <span className={`truncate ${isDead(e.status) ? "line-through" : ""}`}>{e._time} {e.language}</span>
                              </span>
                            );
                          })}
                          {evs.length > 2 && <span className="text-[10px] font-bold text-[#6B7280] pl-1">+{evs.length - 2} lagi</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* jadwal-compact-v2: agenda hari terpilih persis di bawah kisi bulanan —
                pola yang sama dengan kalender dashboard pengajar. Tanpa ini sel bulan
                cuma titik warna, dan seluruh detail sesi terdorong ke kolom samping
                (yang lalu jadi jangkung sendirian di sebelah kanvas kosong). */}
            {mode === "month" && (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-[14px] font-extrabold text-[#12172B]">{agendaTitle}</h3>
                  {agendaEvents.length > 0 && (
                    <span className="text-[12px] font-semibold text-[#6B7280]">{agendaEvents.length} sesi</span>
                  )}
                </div>
                <div className="bg-white rounded-[2rem] p-3 sm:p-4 shadow-[0_24px_50px_-34px_rgba(18,23,43,.5)]">
                  {agendaEvents.length ? (
                    <div className="flex flex-col gap-3">
                      {agendaEvents.map((e) => (
                        <SessionCard key={e.id} e={e} now={now} studentName={studentName} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <CalendarDays className="mb-2 h-8 w-8 text-slate-300" strokeWidth={1.6} />
                      <p className="text-[13.5px] font-bold text-[#12172B]">Tidak ada sesi di tanggal ini</p>
                      <p className="mt-1 text-[12.5px] font-medium text-[#6B7280]">Klik tanggal lain yang bertanda warna buat lihat detailnya.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== MINGGU — kisi jam (jadwal-week-timeline-v1) ===== */}
            {mode === "week" && (() => {
              const HOUR_H = 56; // tinggi 1 jam (px)
              const hours = Array.from({ length: weekRange.end - weekRange.start }, (_, i) => weekRange.start + i);
              const gridH = hours.length * HOUR_H;
              const topOf = (d: Date) => ((d.getHours() * 60 + d.getMinutes()) - weekRange.start * 60) / 60 * HOUR_H;
              // Minggu kosong: kisi 14 jam melompong itu cuma bikin halaman panjang
              // tanpa informasi — tampilkan pesan singkat saja.
              if (weekMinutes === 0) {
                return (
                  <div className="bg-white rounded-[2rem] p-8 text-center shadow-[0_24px_50px_-34px_rgba(18,23,43,.5)]">
                    <CalendarDays className="mx-auto mb-2 w-8 h-8 text-slate-300" strokeWidth={1.6} />
                    <p className="text-[14px] font-bold text-[#12172B]">Tidak ada sesi minggu ini</p>
                    <p className="mt-1 text-[12.5px] font-medium text-[#6B7280]">Pakai panah di atas buat lihat minggu lain.</p>
                  </div>
                );
              }
              return (
              <div className="bg-white rounded-[2rem] p-3 sm:p-4 shadow-[0_24px_50px_-34px_rgba(18,23,43,.5)]">
                {/* Di HP 7 kolom jam mustahil kebaca — biarkan digulir menyamping. */}
                <div className="overflow-x-auto">
                  <div className="min-w-[680px]">
                    {/* Kepala hari */}
                    <div className="grid grid-cols-[48px_repeat(7,minmax(0,1fr))] gap-1">
                      <div />
                      {weekDays.map((d) => {
                        const iso = ymd(d);
                        const isToday = iso === todayIso;
                        const dow = (d.getDay() + 6) % 7;
                        return (
                          <div key={iso} className="flex flex-col items-center pb-2">
                            <span className={`text-[11px] font-bold ${dow >= 5 ? "text-slate-300" : "text-[#6B7280]"}`}>{DOWS[dow]}</span>
                            {isToday ? (
                              <span className="mt-1 inline-flex w-7 h-7 rounded-full items-center justify-center text-[13px] font-extrabold" style={{ background: "#16796E", color: "#fff" }}>{d.getDate()}</span>
                            ) : (
                              <span className="mt-1 text-[15px] font-extrabold text-[#12172B]">{d.getDate()}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Badan: kolom jam + 7 kolom hari */}
                    <div className="grid grid-cols-[48px_repeat(7,minmax(0,1fr))] gap-1 border-t border-slate-100 pt-1">
                      {/* label jam */}
                      <div className="relative" style={{ height: gridH }}>
                        {hours.map((h, i) => (
                          <span key={h} className="absolute right-1 -translate-y-1/2 text-[10.5px] font-bold text-[#9AA1AE]" style={{ top: i * HOUR_H }}>
                            {pad(h)}.00
                          </span>
                        ))}
                      </div>

                      {weekDays.map((d) => {
                        const iso = ymd(d);
                        const { placed, lanes } = layoutDay(eventsOn(iso));
                        const dow = (d.getDay() + 6) % 7;
                        const isToday = iso === todayIso;
                        return (
                          <div
                            key={iso}
                            className={`relative rounded-xl ${dow >= 5 ? "bg-[#F5F6F8]/60" : "bg-[#F5F6F8]"}`}
                            style={{ height: gridH, outline: isToday ? "2px solid #16796E33" : undefined }}
                          >
                            {/* garis jam */}
                            {hours.map((h, i) => (
                              <span key={h} className="pointer-events-none absolute left-0 right-0 border-t border-white" style={{ top: i * HOUR_H }} />
                            ))}
                            {placed.map(({ e, lane }) => {
                              const c = langColor(e.language);
                              const mins = e.durationMinutes || 60;
                              const h = Math.max(30, (mins / 60) * HOUR_H - 3);
                              const w = 100 / lanes;
                              const st = statusMeta(e); // jadwal-riwayat-v1
                              return (
                                <button
                                  key={e.id}
                                  onClick={() => setSelected(iso)}
                                  title={`${e._time}${e._end ? `–${e._end}` : ""} · ${e.language}${e.level ? ` ${e.level}` : ""}${st ? ` · ${st.label}` : ""}`}
                                  className="absolute overflow-hidden rounded-lg px-1.5 py-1 text-left transition hover:opacity-90"
                                  style={{
                                    top: topOf(e._d) + 2,
                                    height: h,
                                    left: `calc(${lane * w}% + 2px)`,
                                    width: `calc(${w}% - 4px)`,
                                    background: c.bg,
                                    color: c.text,
                                    borderLeft: `3px solid ${st ? st.color : c.dot}`,
                                    opacity: e._past || isDead(e.status) ? 0.6 : 1,
                                  }}
                                >
                                  <span className="flex items-center justify-between gap-1 text-[10px] font-extrabold leading-tight">
                                    {e._time}
                                    {/* jadwal-recurring-materi-v1 */}
                                    {e.sessionNumber ? <span className="shrink-0 opacity-70">#{e.sessionNumber}</span> : null}
                                  </span>
                                  <span className="block truncate text-[11px] font-bold leading-tight">{e.language}{e.level ? ` ${e.level}` : ""}</span>
                                  {h > 52 && e.materialTitle && (
                                    <span className="block truncate text-[10px] font-semibold leading-tight opacity-75">{e.materialTitle}</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              );
            })()}

            {/* ===== HARI ===== */}
            {mode === "day" && (
              <div className="bg-white rounded-[2rem] p-4 sm:p-6 shadow-[0_24px_50px_-34px_rgba(18,23,43,.5)] min-h-[420px]">
                {dayEvents.length ? (
                  <div className="flex flex-col gap-3">
                    {dayEvents.map((e) => (
                      <SessionCard key={e.id} e={e} now={now} studentName={studentName} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-20">
                    <Clock className="w-9 h-9 text-[#C7CCD6] mb-3" strokeWidth={1.8} />
                    <p className="text-[15px] font-extrabold text-[#12172B]">Ga ada sesi di hari ini</p>
                    <p className="text-[13px] text-[#6B7280] mt-1">Pakai panah buat ganti hari, atau pindah ke tampilan Minggu/Bulan.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );

  function selTitle(iso: string) {
    const [yy, mm, dd] = iso.split("-").map(Number);
    return `${dd} ${MONTHS[mm - 1]} ${yy}`;
  }
}

/**
 * jadwal-compact-v2: kartu sesi lengkap (jam, kelas, pengajar, aksi, materi).
 * Dipakai view Hari DAN agenda di bawah kisi bulanan — dulu markup ini cuma
 * hidup di view Hari, jadi mode Bulan (default) tak pernah menampilkan detail.
 */
function SessionCard({ e, now, studentName }: { e: NormSession; now: number; studentName?: string }) {
  const c = langColor(e.language);
  const st = statusMeta(e); // jadwal-riwayat-v1
  const rec = e.recordingUrl ? studentRecordingHref(e.recordingUrl) : null;
  return (
    <div
      className="rounded-2xl bg-slate-50 p-3 shadow-[0_10px_30px_-24px_rgba(18,23,43,.5)]"
      style={isDead(e.status) ? { opacity: 0.65 } : undefined}
    >
      <div className="flex items-stretch gap-3">
        <span className="flex flex-col items-center justify-center w-20 shrink-0 rounded-xl py-2" style={{ background: c.bg }}>
          <span className="text-[16px] font-extrabold" style={{ color: c.text }}>{e._time}</span>
          {e._end && <span className="text-[11px] font-semibold mt-0.5" style={{ color: c.text }}>{e._end}</span>}
        </span>
        <span className="min-w-0 flex-1 flex flex-col justify-center">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.dot }} />
            <span className={`text-[15px] font-extrabold text-[#12172B] truncate ${isDead(e.status) ? "line-through" : ""}`}>
              {e.language}{e.level ? ` — ${e.level}` : ""}
            </span>
            {/* jadwal-recurring-materi-v1: pertemuan ke berapa */}
            {e.sessionNumber ? (
              <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold" style={{ background: c.bg, color: c.text }}>Sesi {e.sessionNumber}</span>
            ) : null}
            {/* jadwal-riwayat-v1: hasil sesi (presensi / dibatalkan) */}
            {st && (
              <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold" style={{ background: `${st.color}1A`, color: st.color }}>
                {st.label}
              </span>
            )}
          </span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[12px] text-[#6B7280] font-medium">
            {e.teacher && <span className="inline-flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" strokeWidth={2} /> {e.teacher}</span>}
            {e.durationMinutes ? <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" strokeWidth={2} /> {e.durationMinutes} menit</span> : null}
            {e.product && <span className="text-[#9CA3AF]">{e.product}</span>}
            {/* jadwal-riwayat-v1: hitung mundur sesi mendatang */}
            {!e._past && !isDead(e.status) && (
              <span className="font-bold text-[#16796E]">{countdownLabel(e._d, now)}</span>
            )}
          </span>
        </span>
        <span className="flex shrink-0 flex-col justify-center gap-1.5">
          {e._joinable && (
            <a
              href={classRoomUrl(e.id, { title: `Kelas ${e.language}`, name: studentName })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#16796E] px-3.5 py-2 text-[12.5px] font-extrabold text-white hover:bg-[#0F5A52]"
            >
              <Video className="w-3.5 h-3.5" strokeWidth={2.2} /> Masuk Kelas
            </a>
          )}
          {/* jadwal-riwayat-v1: rekaman sesi lampau */}
          {rec && (
            <a
              href={rec}
              {...(isInternalRecordingHref(rec) ? {} : { target: "_blank", rel: "noopener noreferrer" })}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-[12.5px] font-extrabold text-[#16796E] hover:bg-[#EAF3F2]"
            >
              <PlayCircle className="w-3.5 h-3.5" strokeWidth={2.2} /> Rekaman
            </a>
          )}
        </span>
      </div>
      <MaterialBlock s={e} />
    </div>
  );
}

/**
 * Kartu di daftar samping — tampil di SEMUA view, jadi di sinilah aksi sesi
 * berumah: hitung mundur + Masuk Kelas buat yang mendatang (jadwal-riwayat-v1;
 * dulu tombolnya cuma ada di view Hari padahal default-nya Bulan), dan tautan
 * rekaman buat yang sudah lewat.
 */
function SideItem({ s, now, studentName, onClick }: {
  s: NormSession; now: number; studentName?: string; onClick: () => void;
}) {
  const c = langColor(s.language);
  const st = statusMeta(s);
  const rec = s.recordingUrl ? studentRecordingHref(s.recordingUrl) : null;
  const dim = s._past || isDead(s.status);
  return (
    <div
      className="w-full bg-white rounded-2xl shadow-[0_10px_30px_-24px_rgba(18,23,43,.5)] p-3 transition hover:-translate-y-0.5"
      style={dim ? { opacity: 0.85 } : undefined}
    >
      <button onClick={onClick} className="flex w-full items-center gap-3 text-left">
        <span className="w-12 h-12 shrink-0 rounded-xl bg-[#F5F6F8] flex flex-col items-center justify-center leading-none">
          <span className="text-[15px] font-extrabold text-[#12172B]">{s._d.getDate()}</span>
          <span className="text-[10px] font-bold text-[#6B7280] mt-0.5">{MONTHS_SHORT[s._d.getMonth()]}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: st ? st.color : c.dot }} />
            <span className={`text-[14px] font-extrabold truncate text-[#12172B] ${isDead(s.status) ? "line-through" : ""}`}>
              {s.language}{s.level ? ` — ${s.level}` : ""}
            </span>
            {/* jadwal-recurring-materi-v1 */}
            {s.sessionNumber ? (
              <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold" style={{ background: c.bg, color: c.text }}>#{s.sessionNumber}</span>
            ) : null}
          </span>
          <span className="block text-[12px] text-[#6B7280] font-medium mt-0.5 truncate">
            {s._weekday} · {s._time}{s._end ? `–${s._end}` : ""}{s.durationMinutes ? ` · ${s.durationMinutes} mnt` : ""}
          </span>
          {/* jadwal-riwayat-v1: hasil sesi / hitung mundur */}
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {st && (
              <span className="rounded-full px-1.5 py-0.5 text-[10px] font-extrabold" style={{ background: `${st.color}1A`, color: st.color }}>
                {st.label}
              </span>
            )}
            {!dim && <span className="text-[11px] font-bold text-[#16796E]">{countdownLabel(s._d, now)}</span>}
          </span>
          {s.materialTitle && (
            <span className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-[#16796E] truncate">
              <BookOpen className="w-3 h-3 shrink-0" strokeWidth={2.4} /> <span className="truncate">{s.materialTitle}</span>
            </span>
          )}
          {s.teacher && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#9CA3AF] font-medium mt-0.5">
              <GraduationCap className="w-3 h-3" strokeWidth={2} /> {s.teacher}
            </span>
          )}
        </span>
      </button>

      {(s._joinable || rec) && (
        <div className="mt-2.5 flex gap-2">
          {s._joinable && (
            <a
              href={classRoomUrl(s.id, { title: `Kelas ${s.language}`, name: studentName })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#16796E] px-3 py-2 text-[12px] font-extrabold text-white hover:bg-[#0F5A52]"
            >
              <Video className="w-3.5 h-3.5" strokeWidth={2.2} /> Masuk Kelas
            </a>
          )}
          {rec && (
            <a
              href={rec}
              {...(isInternalRecordingHref(rec) ? {} : { target: "_blank", rel: "noopener noreferrer" })}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#F5F6F8] px-3 py-2 text-[12px] font-extrabold text-[#16796E] hover:bg-[#EAF3F2]"
            >
              <PlayCircle className="w-3.5 h-3.5" strokeWidth={2.2} /> Rekaman
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * jadwal-recurring-materi-v1: blok "Materi" pada kartu sesi — topik + rincian +
 * berkas/link rujukan yang dilampirkan pengajar. Tak dirender kalau kosong.
 */
function MaterialBlock({ s }: { s: NormSession }) {
  const links = s.materialLinks ?? [];
  if (!s.materialTitle && !s.materialNotes && links.length === 0) return null;
  return (
    <div className="mt-2.5 rounded-xl bg-white p-3">
      <p className="flex items-center gap-1.5 text-[12px] font-extrabold text-[#16796E]">
        <BookOpen className="w-3.5 h-3.5 shrink-0" strokeWidth={2.4} />
        {s.materialTitle || "Materi sesi"}
      </p>
      {s.materialNotes && <p className="mt-1 text-[12px] font-medium leading-snug text-[#6B7280] whitespace-pre-line">{s.materialNotes}</p>}
      {links.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {links.map((m, i) => (
            <a key={`${m.url}-${i}`} href={m.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-[#F5F6F8] px-2.5 py-1.5 text-[11.5px] font-bold text-[#12172B] hover:bg-[#EAECEF]">
              {m.kind === "file"
                ? <FileText className="w-3.5 h-3.5 shrink-0 text-[#16796E]" strokeWidth={2.2} />
                : <ExternalLink className="w-3.5 h-3.5 shrink-0 text-[#16796E]" strokeWidth={2.2} />}
              <span className="truncate">{m.name}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
