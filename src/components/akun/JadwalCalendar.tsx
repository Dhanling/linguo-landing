"use client";

// linguo-patch:akun-jadwal-tab-v1
// Kalender Jadwal LMS siswa — dipakai di tab "jadwal" /akun (src/app/akun/page.tsx).
// Warna config-independent (hex inline). Palet match shell: teal #16796E.
// + jadwal-views-v1: toggle tampilan Hari / Minggu / Bulan (ala Google Calendar).
// + jadwal-real-only-v1: fallback dummy DIHAPUS — akun kosong tampil empty state.
//
// + jadwal-gcal-v1: dirapikan biar SATU bahasa visual dengan kalender dashboard
//   pengajar (time-grid ala Google Calendar):
//   - kolom kiri "Sesi Mendatang" DIBUANG dari sini → pindah ke Beranda
//     (SesiMendatangCard). Kalender akhirnya dapat lebar penuh.
//   - kartu rekap per kelas (progress bar "Sesi 14 dari 16") DIBUANG — angka yang
//     sama sudah ada di kartu kelas Beranda; di sini cuma bikin kalender
//     kedorong ke bawah lipatan.
//   - view Hari & Minggu sekarang pakai time-grid yang sama persis polanya dengan
//     pengajar: gutter jam, garis jam, kolom bergaris, penanda "sekarang" merah.

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Video, CalendarDays, Clock, BookOpen, FileText, ExternalLink, PlayCircle, Maximize2, Minimize2 } from "lucide-react";
import { classRoomUrl, isJoinable, studentRecordingHref, isInternalRecordingHref } from "@/lib/classRoom"; // [kelas-video-siswa-v1] + jadwal-riwayat-v1
import { fmtDuration } from "@/lib/studentInsights"; // jadwal-week-timeline-v1: label beban minggu
import {
  ATT_META, DOWS, DOWS_FULL, LangFlag, MONTHS, MONTHS_SHORT, TeacherAvatar, addDays, countdownLabel,
  fmtTime, isDead, isoOf, langColor, langFlagCode, pad, startOfWeek, statusMeta, ymd,
  type JadwalSession, type LangColor, type NormSession,
} from "./jadwalShared";

export type { JadwalMaterialLink, JadwalSession } from "./jadwalShared";

export type RegularBatch = {
  id: string;
  language: string;
  batchCode?: string;
  scheduleDay?: string;
  scheduleTime?: string;
  zoomLink?: string | null;
};

type ViewMode = "day" | "week" | "month";

/** Tinggi 1 jam di time-grid (px) — sama dengan kalender dashboard pengajar. */
const HOUR_PX = 56;
/** Tinggi maksimal wadah scroll grid di mode biasa (px) — sisanya digulir di dalam. */
const GRID_MAX_H = 560;
/** Lebar gutter label jam — sama dengan pengajar (GUTTER_PX). */
const GUTTER_PX = 48;

export default function JadwalCalendar({
  sessions,
  regularBatches = [],
  studentName,
}: {
  sessions: JadwalSession[];
  regularBatches?: RegularBatch[];
  /** Nama siswa — ikut dikirim ke room biar dia tak perlu mengetiknya lagi. */
  studentName?: string;
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

  /** Sesi mendatang saja — dasar hitungan di kepala kalender. */
  const upcoming = useMemo(
    () => items.filter((i) => !i._past && !isDead(i.status)).sort((a, b) => a._d.getTime() - b._d.getTime()),
    [items]
  );
  const pastCount = useMemo(() => items.filter((i) => i._past || isDead(i.status)).length, [items]);

  // jadwal-gcal-v1: default Minggu — sama dengan kalender pengajar (calView="week").
  const [mode, setMode] = useState<ViewMode>("week");
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [selected, setSelected] = useState<string | null>(null);

  // ── jadwal-fullscreen-v1 (ikut pola dashboard pengajar) ────────────────────
  // Grid jam itu tinggi; sebelumnya dia manjangin halaman /akun sehingga kepala
  // hari (SEN 3, SEL 4, …) hilang begitu digulir ke jam siang. Sekarang grid
  // digulir DI DALAM wadahnya sendiri dengan kepala hari sticky, dan ada tombol
  // layar penuh (pintasan F, keluar Esc) buat lihat seharian sekali pandang.
  const [fullscreen, setFullscreen] = useState(false);
  const [viewportH, setViewportH] = useState(900);
  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Layar penuh: kunci scroll halaman di belakang biar cuma kalender yang gerak.
  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [fullscreen]);

  // Pintasan: Esc keluar, F masuk/keluar. Diabaikan saat siswa lagi mengetik.
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const el = ev.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (ev.key === "Escape" && fullscreen) { ev.preventDefault(); setFullscreen(false); }
      else if (ev.key === "f" || ev.key === "F") { ev.preventDefault(); setFullscreen((v) => !v); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

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

  /** Hari yang digambar di time-grid: 7 hari (Minggu) atau 1 hari (Hari). */
  const gridDays = useMemo(() => (mode === "day" ? [new Date(cursor)] : weekDays), [mode, cursor, weekDays]);

  // Rentang jam grid ikut isi hari yang lagi dilihat — rumus sama dengan pengajar:
  // dasar 07:00–21:00, melebar otomatis kalau ada sesi di luar itu.
  const gridHours = useMemo(() => {
    const isos = new Set(gridDays.map(ymd));
    let start = 7, end = 21;
    items.filter((i) => isos.has(i._iso)).forEach((e) => {
      const h = e._d.getHours();
      const endH = Math.ceil((h * 60 + e._d.getMinutes() + (e.durationMinutes || 60)) / 60);
      if (h < start) start = h;
      if (endH > end) end = endH;
    });
    return { start: Math.max(0, start), end: Math.min(24, Math.max(end, start + 4)) };
  }, [items, gridDays]);

  /**
   * Tinggi 1 jam. Di layar penuh grid dimuaikan supaya seluruh rentang jam muat
   * sekali layar (dibatasi 56–110px biar teksnya tetap kebaca) — rumus sama
   * dengan kalender pengajar.
   */
  const hourPx = useMemo(() => {
    if (!fullscreen) return HOUR_PX;
    const span = Math.max(1, gridHours.end - gridHours.start);
    return Math.min(110, Math.max(HOUR_PX, Math.floor((viewportH - 280) / span)));
  }, [fullscreen, viewportH, gridHours]);

  /** Tinggi wadah scroll grid — di layar penuh sisa tinggi viewport. */
  const gridMaxH = fullscreen ? Math.max(320, viewportH - 230) : GRID_MAX_H;

  /** Jam paling pagi yang berisi di rentang yang lagi dilihat — patokan auto-scroll. */
  const gridFocusHour = useMemo(() => {
    const isos = new Set(gridDays.map(ymd));
    let h = 24;
    items.filter((i) => isos.has(i._iso)).forEach((e) => { h = Math.min(h, e._d.getHours()); });
    return h === 24 ? gridHours.start : h;
  }, [items, gridDays, gridHours]);

  // Mendarat di jam yang berisi, bukan di jam paling pagi yang kosong.
  // Dependensinya sengaja nilai PRIMITIF (bukan objek gridHours): `items` dihitung
  // ulang tiap menit karena patokan "sekarang" bergeser, dan objek baru tiap menit
  // bakal melempar balik posisi scroll siswa ke atas.
  const gridScrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = gridScrollRef.current;
    if (!el) return;
    el.scrollTop = Math.max(0, (gridFocusHour - gridHours.start - 0.5) * hourPx);
  }, [gridFocusHour, gridHours.start, hourPx, mode, fullscreen]);

  /** Total menit sesi terjadwal di minggu yang lagi dilihat. */
  const weekMinutes = useMemo(() => {
    const isos = new Set(weekDays.map(ymd));
    return items.filter((i) => isos.has(i._iso)).reduce((a, e) => a + (e.durationMinutes || 60), 0);
  }, [items, weekDays]);

  /** Jumlah sesi di rentang hari yang lagi digambar grid — dasar empty state. */
  const gridCount = useMemo(() => {
    const isos = new Set(gridDays.map(ymd));
    return items.filter((i) => isos.has(i._iso)).length;
  }, [items, gridDays]);

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

  /**
   * Hari yang isinya dibedah di bawah kalender. Tanpa pilihan manual: hari ini
   * kalau ada sesinya, kalau tidak lompat ke sesi terdekat — kotak "tidak ada
   * sesi" tiap kali tab dibuka itu ruang terbuang.
   */
  const agendaIso = useMemo(() => {
    if (selected) return selected;
    if (mode === "day") return ymd(cursor);
    if (items.some((i) => i._iso === todayIso)) return todayIso;
    return upcoming[0]?._iso ?? todayIso;
  }, [selected, mode, cursor, items, upcoming, todayIso]);
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

  const navBtn = "w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition text-[#12172B]";
  const gridCols = { gridTemplateColumns: `${GUTTER_PX}px repeat(${gridDays.length}, minmax(0,1fr))` };

  return (
    <div className="w-full space-y-4">
      {/* Jadwal Tetap (Kelas Reguler) — recurring batch + Zoom */}
      {regularBatches.length > 0 && (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
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

      {/* Kalender — satu panel selebar layar (jadwal-gcal-v1).
          jadwal-fullscreen-v1: saat layar penuh panel jadi lapisan fixed setinggi
          viewport; halaman di belakangnya dikunci. */}
      <div className={fullscreen
        ? "fixed inset-0 z-50 overflow-y-auto bg-white p-3 sm:p-4"
        : "rounded-[26px] bg-white ring-1 ring-slate-200 overflow-hidden"}>
        {/* Kepala: judul + hitungan + tombol Hari ini */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 pt-5 pb-4 sm:px-6">
          <div>
            <h1 className="text-[20px] font-extrabold leading-tight text-[#12172B]">Jadwal Kelas</h1>
            {/* jadwal-riwayat-v1: `items` termasuk riwayat — hitungannya wajib dari
                `upcoming`, kalau tidak angkanya bohong. */}
            <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">
              {upcoming.length} sesi mendatang{pastCount > 0 ? ` · ${pastCount} sudah lewat` : ""}
            </p>
          </div>
          <button onClick={goToday} className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-bold text-[#12172B] transition hover:bg-slate-50">
            Hari ini
          </button>
        </div>

        {/* Toolbar: periode + toggle view + navigasi */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-[17px] font-extrabold text-[#12172B]">{periodTitle}</h2>
            {/* jadwal-week-timeline-v1: beban minggu yang lagi dilihat. */}
            {mode === "week" && weekMinutes > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#16796E]/10 px-3 py-1 text-[12px] font-bold text-[#16796E]">
                <Clock className="w-3.5 h-3.5" strokeWidth={2.6} />
                Total minggu ini: {fmtDuration(weekMinutes)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* toggle Hari / Minggu / Bulan — susunan sama dengan dashboard pengajar */}
            <div className="inline-flex rounded-xl bg-[#F5F6F8] p-1">
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
            {/* jadwal-fullscreen-v1: sejajar tombol layar penuh di dashboard pengajar */}
            <button
              onClick={() => setFullscreen((v) => !v)}
              aria-label={fullscreen ? "Keluar layar penuh" : "Layar penuh"}
              title={fullscreen ? "Keluar layar penuh (Esc)" : "Layar penuh (F)"}
              className={navBtn}
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="px-4 pb-5 sm:px-6">
          {/* ===== BULAN ===== */}
          {mode === "month" && (
            <div className="rounded-2xl border border-slate-100 p-2 sm:p-3">
              <div className="grid grid-cols-7 pb-2 text-center text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">
                {DOWS.map((d, i) => <div key={d} className={i >= 5 ? "text-slate-300" : ""}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {cells.map((cell, i) => {
                  if (!cell) return <div key={`lead-${i}`} />;
                  const evs = eventsOn(cell.iso);
                  const isToday = cell.iso === todayIso;
                  const isSel = agendaIso === cell.iso;
                  return (
                    <button
                      key={cell.iso}
                      onClick={() => evs.length && setSelected(cell.iso)}
                      tabIndex={evs.length ? 0 : -1}
                      aria-label={`${cell.d} ${MONTHS[cursor.getMonth()]}${evs.length ? `, ${evs.length} sesi` : ""}`}
                      className={[
                        "flex min-h-[44px] flex-col gap-1 rounded-xl border border-slate-100 p-1.5 text-left transition sm:min-h-[78px] sm:p-2",
                        evs.length ? "cursor-pointer hover:bg-slate-50" : "cursor-default",
                        // jadwal-weekend-netral-v1: Sabtu/Minggu tidak lagi diberi tint abu.
                        // Tint `#F5F6F8/60` tak tertangkap aturan dark mode di StudentShell
                        // (alias -/60 beda kelas), jadi di mode gelap kolom akhir pekan
                        // menyala putih. Sekarang seragam dengan hari kerja.
                        "bg-white",
                      ].join(" ")}
                      style={isSel ? { background: "#fff", outline: "2px solid #16796E" } : undefined}
                    >
                      <span className="flex items-center justify-between">
                        {isToday ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-extrabold sm:text-[13px]" style={{ background: "#16796E", color: "#fff" }}>{cell.d}</span>
                        ) : (
                          <span className="text-[12px] font-extrabold text-[#12172B] sm:text-[13px]">{cell.d}</span>
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
                              title={`${e._time} · ${e.language}${e.level ? ` ${e.level}` : ""}${e.teacher ? ` · ${e.teacher}` : ""}${st ? ` · ${st.label}` : ""}`}
                              className="flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-tight"
                              style={{ background: c.bg, color: c.text, opacity: e._past || isDead(e.status) ? 0.55 : 1 }}
                            >
                              {/* jadwal-flag-avatar-v1: bendera dulu, titik status tetap dipertahankan —
                                  bendera menjawab "kelas apa", titik menjawab "hasilnya apa". */}
                              <LangFlag language={e.language} h={8} className="hidden sm:inline-flex" />
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: st ? st.color : c.dot }} />
                              <span className={`truncate ${isDead(e.status) ? "line-through" : ""}`}>{e._time} {e.language}</span>
                            </span>
                          );
                        })}
                        {evs.length > 2 && <span className="pl-1 text-[10px] font-bold text-[#6B7280]">+{evs.length - 2} lagi</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== HARI & MINGGU — time-grid ala Google Calendar (jadwal-gcal-v1) =====
              Pola identik dengan renderTimeGrid di dashboard pengajar: gutter jam
              48px, kolom hari bergaris, garis jam melintang, penanda "sekarang". */}
          {mode !== "month" && (
            gridCount === 0 ? (
              <div className="rounded-2xl border border-slate-100 p-8 text-center">
                <CalendarDays className="mx-auto mb-2 h-8 w-8 text-slate-300" strokeWidth={1.6} />
                <p className="text-[14px] font-bold text-[#12172B]">
                  {mode === "day" ? "Tidak ada sesi di hari ini" : "Tidak ada sesi minggu ini"}
                </p>
                <p className="mt-1 text-[12.5px] font-medium text-[#6B7280]">Pakai panah di atas buat lihat {mode === "day" ? "hari" : "minggu"} lain.</p>
              </div>
            ) : (() => {
              const { start: h0, end: h1 } = gridHours;
              const hours = Array.from({ length: h1 - h0 }, (_, i) => h0 + i);
              const totalH = (h1 - h0) * hourPx;
              const nowD = new Date(now);
              const nowMin = nowD.getHours() * 60 + nowD.getMinutes();
              return (
                <div className="rounded-2xl border border-slate-100 p-2 sm:p-3">
                  {/* Di HP 7 kolom jam mustahil kebaca — biarkan digulir menyamping.
                      jadwal-scroll-sticky-v1: grid juga digulir TEGAK di dalam wadah
                      ini (bukan manjangin halaman). Kepala hari ikut di dalam wadah
                      yang sama supaya saat digeser menyamping dia tetap sejajar
                      kolomnya — kalau ditaruh di luar, lebarnya harus dikompensasi
                      selebar scrollbar dan gampang meleset. */}
                  <div
                    ref={gridScrollRef}
                    className="overflow-auto overscroll-contain"
                    style={{ maxHeight: gridMaxH }}
                  >
                    <div className={mode === "week" ? "min-w-[680px]" : "min-w-[320px]"}>
                      {/* Kepala hari — mengambang di atas saat digulir; kolomnya harus
                          segaris dengan grid di bawahnya. */}
                      <div className="sticky top-0 z-30 grid border-b border-slate-100 bg-white" style={gridCols}>
                        <div />
                        {gridDays.map((d) => {
                          const iso = ymd(d);
                          const isToday = iso === todayIso;
                          const dow = (d.getDay() + 6) % 7;
                          return (
                            <button
                              key={iso}
                              type="button"
                              onClick={() => setSelected(iso)}
                              className={`flex flex-col items-center gap-0.5 rounded-t-lg py-1.5 transition ${agendaIso === iso ? "bg-[#16796E]/5" : "hover:bg-slate-50"}`}
                            >
                              <span className={`text-[10px] font-bold uppercase tracking-wide ${dow >= 5 ? "text-slate-300" : "text-[#6B7280]"}`}>{DOWS[dow]}</span>
                              <span className={`text-[14px] font-extrabold tabular-nums ${isToday ? "flex h-6 w-6 items-center justify-center rounded-full bg-[#16796E] text-white" : "text-[#12172B]"}`}>
                                {d.getDate()}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Badan: gutter jam + kolom hari. Garis pemisahnya dipegang
                          kepala hari (border-b) — kalau di sini juga, saat digulir
                          garisnya jadi dobel. */}
                      <div className="relative grid" style={gridCols}>
                        {/* label jam — ditaruh di garis jamnya, bukan di tengah blok */}
                        <div className="relative" style={{ height: totalH }}>
                          {hours.slice(1).map((h, i) => (
                            <span
                              key={h}
                              className="absolute inset-x-0 -translate-y-1/2 pr-1.5 text-right text-[10px] font-bold tabular-nums text-[#9AA1AE]"
                              style={{ top: (i + 1) * hourPx }}
                            >
                              {pad(h)}.00
                            </span>
                          ))}
                        </div>

                        {gridDays.map((d) => {
                          const iso = ymd(d);
                          const { placed, lanes } = layoutDay(eventsOn(iso));
                          const isToday = iso === todayIso;
                          return (
                            <div
                              key={iso}
                              // jadwal-weekend-netral-v1: kolom Sabtu/Minggu ikut latar hari kerja.
                              className="relative border-l border-slate-100"
                              style={{ height: totalH }}
                            >
                              {/* garis jam */}
                              {hours.map((h, i) => (
                                <span key={h} className="pointer-events-none absolute inset-x-0 border-t border-slate-100" style={{ top: i * hourPx }} />
                              ))}
                              {/* garis "sekarang" di hari ini — sama seperti kalender pengajar */}
                              {isToday && nowMin >= h0 * 60 && nowMin <= h1 * 60 && (
                                <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: ((nowMin - h0 * 60) / 60) * hourPx }}>
                                  <div className="border-t-2 border-red-500" />
                                  <div className="absolute -left-1 -top-[5px] h-2.5 w-2.5 rounded-full bg-red-500" />
                                </div>
                              )}
                              {placed.map(({ e, lane }) => {
                                const c = langColor(e.language);
                                const mins = e.durationMinutes || 60;
                                const hPx = Math.max(((mins / 60) * hourPx) - 2, 22);
                                const w = 100 / lanes;
                                const st = statusMeta(e); // jadwal-riwayat-v1
                                return (
                                  <button
                                    key={e.id}
                                    onClick={() => setSelected(iso)}
                                    title={`${e._time}${e._end ? `–${e._end}` : ""} · ${e.language}${e.level ? ` ${e.level}` : ""}${e.teacher ? ` · ${e.teacher}` : ""}${st ? ` · ${st.label}` : ""}`}
                                    className="absolute z-10 overflow-hidden rounded-md px-1.5 py-0.5 text-left shadow-sm transition-transform hover:z-20 hover:scale-[1.02]"
                                    style={{
                                      top: ((e._d.getHours() * 60 + e._d.getMinutes() - h0 * 60) / 60) * hourPx + 1,
                                      height: hPx,
                                      left: `calc(${lane * w}% + 2px)`,
                                      width: `calc(${w}% - 4px)`,
                                      background: c.bg,
                                      color: c.text,
                                      borderLeft: `3px solid ${st ? st.color : c.dot}`,
                                      opacity: e._past || isDead(e.status) ? 0.6 : 1,
                                    }}
                                  >
                                    {/* Susunan ala Google Calendar: judul kelas dulu, jam di bawahnya.
                                        Blok pendek (< 32px) tak muat dua baris → jam digabung sebaris.
                                        jadwal-flag-avatar-v1: bendera bahasa memimpin baris judul, foto
                                        pengajar nempel di baris jam — dua pertanyaan pertama siswa
                                        ("kelas apa" & "sama siapa") kejawab tanpa buka agenda. */}
                                    <p className="flex items-center gap-1 truncate text-[10px] font-extrabold leading-tight">
                                      <LangFlag language={e.language} h={9} />
                                      <span className={`truncate ${isDead(e.status) ? "line-through" : ""}`}>{e.language}{e.level ? ` ${e.level}` : ""}</span>
                                      {hPx < 32 && <span className="shrink-0 font-bold opacity-70">{e._time}</span>}
                                      {e.sessionNumber ? (
                                        <span className="ml-auto shrink-0 rounded-full bg-black/10 px-1.5 text-[8px] font-bold leading-[14px]">#{e.sessionNumber}</span>
                                      ) : null}
                                    </p>
                                    {hPx >= 32 && (
                                      <p className="flex items-center gap-1 text-[10px] font-semibold leading-tight opacity-80">
                                        <span className="truncate">{e._time}{e._end ? `–${e._end}` : ""}</span>
                                        {e.teacher && (
                                          <span className="ml-auto flex shrink-0 items-center">
                                            <TeacherAvatar name={e.teacher} src={e.teacherAvatarUrl} size={14} />
                                          </span>
                                        )}
                                      </p>
                                    )}
                                    {hPx >= 52 && e.materialTitle && (
                                      <p className="truncate text-[9px] font-semibold leading-tight opacity-75">{e.materialTitle}</p>
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
            })()
          )}

          {/* Agenda hari terpilih — di sinilah aksi sesi berumah (Masuk Kelas,
              rekaman, materi). Blok di grid sengaja cuma ringkasan, persis
              seperti kalender pengajar yang detailnya dibuka terpisah.
              Hari kosong tak usah dibikinkan kotak "tidak ada sesi": kisi di
              atasnya sudah mengatakan itu, dua pesan kosong bertumpuk cuma
              memanjangkan halaman. */}
          {agendaEvents.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-[14px] font-extrabold text-[#12172B]">{agendaTitle}</h3>
                <span className="text-[12px] font-semibold text-[#6B7280]">{agendaEvents.length} sesi</span>
              </div>
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-3 sm:p-4">
                {agendaEvents.map((e) => (
                  <SessionCard key={e.id} e={e} now={now} studentName={studentName} />
                ))}
              </div>
            </div>
          )}

          {/* Keterangan warna — sederet di bawah kalender (dulu numpuk di kolom kiri) */}
          {legend.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-[12px] font-semibold text-[#12172B]">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">Bahasa</span>
              {legend.map(([lang, c]) => (
                <span key={lang} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.dot }} />{lang}
                </span>
              ))}
              {/* jadwal-riwayat-v1: sesi lampau punya penanda presensi — tanpa
                  keterangan ini titik warnanya cuma jadi teka-teki. */}
              {attLegend.length > 0 && (
                <>
                  <span className="ml-1 text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">Presensi</span>
                  {attLegend.map((k) => (
                    <span key={k} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: ATT_META[k].color }} />{ATT_META[k].label}
                    </span>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Kartu sesi lengkap (jam, kelas, pengajar, aksi, materi) — dipakai agenda di
 * bawah kalender pada SEMUA view.
 */
function SessionCard({ e, now, studentName }: { e: NormSession; now: number; studentName?: string }) {
  const c = langColor(e.language);
  const st = statusMeta(e); // jadwal-riwayat-v1
  const rec = e.recordingUrl ? studentRecordingHref(e.recordingUrl) : null;
  return (
    <div
      className="rounded-2xl bg-slate-50 p-3"
      style={isDead(e.status) ? { opacity: 0.65 } : undefined}
    >
      <div className="flex items-stretch gap-3">
        <span className="flex w-20 shrink-0 flex-col items-center justify-center rounded-xl py-2" style={{ background: c.bg }}>
          <span className="text-[16px] font-extrabold" style={{ color: c.text }}>{e._time}</span>
          {e._end && <span className="mt-0.5 text-[11px] font-semibold" style={{ color: c.text }}>{e._end}</span>}
        </span>
        <span className="flex min-w-0 flex-1 flex-col justify-center">
          <span className="flex items-center gap-2">
            {/* jadwal-flag-avatar-v1: bendera menggantikan titik warna kalau bahasanya
                punya bendera — titik cuma dipakai sebagai cadangan. */}
            {langFlagCode(e.language)
              ? <LangFlag language={e.language} h={14} />
              : <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.dot }} />}
            <span className={`truncate text-[15px] font-extrabold text-[#12172B] ${isDead(e.status) ? "line-through" : ""}`}>
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
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] font-medium text-[#6B7280]">
            {/* jadwal-teacher-avatar-v1 */}
            {e.teacher && (
              <span className="inline-flex items-center gap-1.5">
                <TeacherAvatar name={e.teacher} src={e.teacherAvatarUrl} size={20} />
                {e.teacher}
              </span>
            )}
            {e.durationMinutes ? <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" strokeWidth={2} /> {e.durationMinutes} menit</span> : null}
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
              <Video className="h-3.5 w-3.5" strokeWidth={2.2} /> Masuk Kelas
            </a>
          )}
          {/* jadwal-riwayat-v1: rekaman sesi lampau */}
          {rec && (
            <a
              href={rec}
              {...(isInternalRecordingHref(rec) ? {} : { target: "_blank", rel: "noopener noreferrer" })}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-[12.5px] font-extrabold text-[#16796E] hover:bg-[#EAF3F2]"
            >
              <PlayCircle className="h-3.5 w-3.5" strokeWidth={2.2} /> Rekaman
            </a>
          )}
        </span>
      </div>
      <MaterialBlock s={e} />
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
        <BookOpen className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
        {s.materialTitle || "Materi sesi"}
      </p>
      {s.materialNotes && <p className="mt-1 whitespace-pre-line text-[12px] font-medium leading-snug text-[#6B7280]">{s.materialNotes}</p>}
      {links.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {links.map((m, i) => (
            <a key={`${m.url}-${i}`} href={m.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-[#F5F6F8] px-2.5 py-1.5 text-[11.5px] font-bold text-[#12172B] hover:bg-[#EAECEF]">
              {m.kind === "file"
                ? <FileText className="h-3.5 w-3.5 shrink-0 text-[#16796E]" strokeWidth={2.2} />
                : <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#16796E]" strokeWidth={2.2} />}
              <span className="truncate">{m.name}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
