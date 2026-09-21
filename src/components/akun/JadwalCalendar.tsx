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
import { ChevronLeft, ChevronRight, Video, CalendarDays, Clock, BookOpen, FileText, ExternalLink, PlayCircle, Maximize2, Minimize2, Lock } from "lucide-react";
import { classRoomUrl, isJoinable, studentRecordingHref, isInternalRecordingHref } from "@/lib/classRoom"; // [kelas-video-siswa-v1] + jadwal-riwayat-v1
import RecordingModal from "./RecordingModal";
// [addon-akses-rekaman-v1] rekaman sesi cuma buat kelas yang beli add-on Recording.
import { rekamanBolehTampil, rekamanTerkunci, PESAN_REKAMAN_TERKUNCI, type AksesAddon } from "@/lib/addonAccess";
import { fmtDuration } from "@/lib/studentInsights"; // jadwal-week-timeline-v1: label beban minggu
import { useT, useUiLang } from "@/lib/uiLang"; // [ui-lang-switcher-v1]
import { liburOn, liburLabel, liburTooltip } from "@/lib/hariLibur"; // [kalender-hari-libur-v1]
import { idSesiSintetis } from "@/lib/sesiSintetis"; // [jadwal-hantu-hidden-v1]
import {
  ATT_META, DOWS, DOWS_FULL, LIVE_COLOR, LangFlag, LiveBadge, MONTHS, MONTHS_SHORT, TeacherAvatar,
  addDays, akhirBlokMs, countdownLabel, fmtTime, gabungSesiBeruntun, isDead, isLiveNow, isoOf, langColor, langFlagCode,
  nomorSesiLabel, pad, startOfWeek, statusMeta, ymd,
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
  aksesRekaman,
}: {
  sessions: JadwalSession[];
  regularBatches?: RegularBatch[];
  /** Nama siswa — ikut dikirim ke room biar dia tak perlu mengetiknya lagi. */
  studentName?: string;
  /** [addon-akses-rekaman-v1] registration_id → hak rekaman. [rekaman-wajib-beli-v1]
   *  Hanya "punya" yang boleh menonton. Peta kosong = masih dimuat (tombol & gembok
   *  belum tampil); registrasi yang tak ada di peta yang sudah terisi = terkunci. */
  aksesRekaman?: Map<string, AksesAddon>;
}) {
  // [ui-lang-switcher-v1] `tt`, bukan `t` — `t` sudah dipakai buat handle interval di bawah.
  const tt = useT();
  const uiLang = useUiLang();
  const today = useMemo(() => new Date(), []);
  const todayIso = ymd(today);

  // jadwal-riwayat-v1: satu patokan "sekarang" per render, dipakai buat menandai
  // sesi lampau, hitung mundur, dan jendela tombol Masuk Kelas.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  /* [jadwal-hantu-hidden-v1] Baris presensi sintetis (notes = AUTO_PRESENSI_NOTE)
     itu catatan pembukuan fee, bukan kelas yang benar-benar dijadwalkan: jamnya
     ditebak 12.00 di hari pencatatan. Kalau ikut digambar, kalender siswa memunculkan
     tumpukan blok palsu jam 12.00 — dan karena lajur dulu dihitung se-HARI, blok
     asli pagi harinya ikut menyempit jadi sepertiga kolom. Dashboard pengajar sudah
     membuangnya sejak lama; ini menyamakan sisi siswa. Barisnya tetap DIHITUNG
     sebagai sesi yang sudah lewat supaya angka riwayat di kepala kalender tak
     berubah. */
  const sintetis = useMemo(() => idSesiSintetis(sessions), [sessions]);
  const sesiSintetisLewat = sintetis.size;

  const items = useMemo<NormSession[]>(
    () =>
      sessions
        .filter((s) => s.scheduledAt && !sintetis.has(s.id))
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
            // jadwal-live-now-v1: sesi yang jamnya lagi jalan detik ini.
            _live: isLiveNow(d, s.durationMinutes, now, s.status),
            // [jadwal-batch-kalender-v1] pertemuan kelas grup tak punya ruang kelas
            // sendiri — tombol Masuk Kelas cuma muncul kalau batch-nya menyertakan
            // tautan rapat, dan tautan itu yang dipakai (bukan classRoomUrl).
            _joinable: !isDead(s.status) && isJoinable(d) && (!s.isBatch || !!s.joinUrl),
          };
        }),
    [sessions, sintetis, now]
  );

  /** Sesi mendatang saja — dasar hitungan di kepala kalender. */
  const upcoming = useMemo(
    () => items.filter((i) => !i._past && !isDead(i.status)).sort((a, b) => a._d.getTime() - b._d.getTime()),
    [items]
  );
  const pastCount = useMemo(
    () => items.filter((i) => i._past || isDead(i.status)).length + sesiSintetisLewat,
    [items, sesiSintetisLewat]
  );

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

  /* [jadwal-blok-hover-zoom-v1] Blok di grid cuma muat judul + jam. Arahkan mouse →
     panel detail "zoom" keluar dari bloknya (pengajar, jam blok, status, rincian tiap
     sesi). Posisinya fixed dari getBoundingClientRect supaya tak terpotong wadah
     scroll grid; ditutup begitu apa pun digulir karena posisinya jadi basi. */
  /* [jadwal-blok-hover-halus-v2] `open` terpisah dari mount: panel lahir tak terlihat lalu
     ditransisikan masuk, dan saat ditutup memudar dulu baru dicabut. Pindah blok ke blok
     tak menutup panel — dia meluncur ke blok baru (transisi left/top). */
  const [hover, setHover] = useState<{ items: NormSession[]; rect: DOMRect; open: boolean } | null>(null);
  const hoverTimer = useRef<number | null>(null);
  const bukaHover = (items: NormSession[], rect: DOMRect) => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    setHover((h) => ({ items, rect, open: !!h }));
    hoverTimer.current = window.setTimeout(() => setHover((h) => (h ? { ...h, open: true } : h)), 60);
  };
  const tutupHover = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    setHover((h) => (h ? { ...h, open: false } : h));
    hoverTimer.current = window.setTimeout(() => setHover(null), 240);
  };
  useEffect(() => () => { if (hoverTimer.current) window.clearTimeout(hoverTimer.current); }, []);
  useEffect(() => { setHover(null); }, [mode, cursor, fullscreen]);
  useEffect(() => {
    if (!hover) return;
    const tutup = () => setHover(null);
    window.addEventListener("scroll", tutup, true);
    window.addEventListener("resize", tutup);
    return () => {
      window.removeEventListener("scroll", tutup, true);
      window.removeEventListener("resize", tutup);
    };
  }, [hover]);

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
   * Susun sesi satu hari jadi jalur (lane) supaya sesi yang jamnya tabrakan tampil
   * bersebelahan, bukan tumpuk-tumpukan.
   *
   * [jadwal-lajur-kelompok-v1] Lebar lajur dihitung per KELOMPOK BENTROK, bukan
   * se-hari — sama persis dengan kalender dashboard pengajar (layoutDayBlocks).
   * Dulu satu tabrakan di jam 12.00 bikin SELURUH blok hari itu menyusut jadi
   * sepertiga kolom, jadi kelas pagi yang tak bentrok apa-apa ikut kepotong dan
   * beda sendiri dari hari-hari tetangganya.
   */
  // [jadwal-blok-gabung-v1] satuannya BLOK (sesi beruntun sehari sudah dilebur),
  // bukan sesi — mulai = sesi pertama, selesai = akhir sesi terakhir.
  const layoutDay = (groups: NormSession[][]) => {
    const sorted = groups
      // [jadwal-blok-gabung-v3] selesai = jam selesai TERJAUH blok (sesi yang jam
      // mulainya kembar bikin "sesi terakhir" belum tentu yang paling belakang).
      .map((items) => ({ items, mulai: items[0]._d.getTime(), selesai: akhirBlokMs(items) }))
      .sort((a, b) => a.mulai - b.mulai);

    const placed: { items: NormSession[]; mulai: number; selesai: number; lane: number; lanes: number }[] = [];
    let kelompok: typeof sorted = [];
    let kelompokSelesai = -Infinity;
    const tutup = () => {
      if (!kelompok.length) return;
      const laneEnd: number[] = [];
      const berlajur = kelompok.map((ev) => {
        let lane = laneEnd.findIndex((end) => end <= ev.mulai);
        if (lane === -1) { lane = laneEnd.length; laneEnd.push(0); }
        laneEnd[lane] = ev.selesai;
        return { ev, lane };
      });
      berlajur.forEach(({ ev, lane }) => placed.push({ items: ev.items, mulai: ev.mulai, selesai: ev.selesai, lane, lanes: laneEnd.length }));
    };
    sorted.forEach((ev) => {
      // mulai kelompok baru begitu ada jeda bersih dari semua blok sebelumnya
      if (ev.mulai >= kelompokSelesai) { tutup(); kelompok = []; }
      kelompokSelesai = kelompok.length ? Math.max(kelompokSelesai, ev.selesai) : ev.selesai;
      kelompok.push(ev);
    });
    tutup();
    return placed;
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
    return `${tt(DOWS_FULL[(d.getDay() + 6) % 7])}, ${dd} ${tt(MONTHS[mm - 1])} ${yy}`;
  }, [agendaIso, tt]);

  const goPrev = () => { setSelected(null); setCursor((c) => mode === "month" ? new Date(c.getFullYear(), c.getMonth() - 1, 1) : addDays(c, mode === "week" ? -7 : -1)); };
  const goNext = () => { setSelected(null); setCursor((c) => mode === "month" ? new Date(c.getFullYear(), c.getMonth() + 1, 1) : addDays(c, mode === "week" ? 7 : 1)); };
  const goToday = () => { setSelected(null); setCursor(new Date()); };

  const periodTitle = (() => {
    if (mode === "month") return `${tt(MONTHS[cursor.getMonth()])} ${cursor.getFullYear()}`;
    if (mode === "day") return `${tt(DOWS_FULL[(cursor.getDay() + 6) % 7])}, ${cursor.getDate()} ${tt(MONTHS[cursor.getMonth()])} ${cursor.getFullYear()}`;
    const s = startOfWeek(cursor), e = addDays(s, 6);
    if (s.getMonth() === e.getMonth()) return `${s.getDate()}–${e.getDate()} ${tt(MONTHS[s.getMonth()])} ${s.getFullYear()}`;
    if (s.getFullYear() === e.getFullYear()) return `${s.getDate()} ${tt(MONTHS_SHORT[s.getMonth()])} – ${e.getDate()} ${tt(MONTHS_SHORT[e.getMonth()])} ${s.getFullYear()}`;
    return `${s.getDate()} ${tt(MONTHS_SHORT[s.getMonth()])} ${s.getFullYear()} – ${e.getDate()} ${tt(MONTHS_SHORT[e.getMonth()])} ${e.getFullYear()}`;
  })();

  const navBtn = "w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition text-[#12172B]";
  const gridCols = { gridTemplateColumns: `${GUTTER_PX}px repeat(${gridDays.length}, minmax(0,1fr))` };

  return (
    <div className="w-full space-y-4">
      {/* [kalender-hari-libur-v1] Warna hari libur ditaruh di CSS, bukan hex inline:
          mode gelap /akun itu class-based (`.lms-dark` di <html>, lihat StudentShell),
          dan warna inline lolos dari aturan itu → merah muda menyala di latar hitam. */}
      <style>{`
        .libur-teks{color:#E11D48;}
        .lms-dark .libur-teks{color:#FB7185;}
        .libur-sel{background-color:#FFF1F2;}
        .lms-dark .libur-sel{background-color:rgba(244,63,94,0.16);}
        .libur-kolom{background-color:rgba(244,63,94,0.05);}
        .lms-dark .libur-kolom{background-color:rgba(244,63,94,0.10);}
      `}</style>
      {hover && <BlokHoverDetail items={hover.items} rect={hover.rect} open={hover.open} now={now} />}
      {/* Jadwal Tetap kelas grup (Reguler & English Test Preparation) — batch + Zoom.
          [jadwal-batch-kalender-v1] pertemuan batch-nya sekarang juga tergambar di
          kalender di bawah; blok ini tetap jadi ringkasan "setiap hari apa, jam berapa". */}
      {regularBatches.length > 0 && (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <h3 className="text-[13px] font-bold text-[#12172B] mb-2.5 inline-flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-[#16796E]" strokeWidth={2.5} /> {tt("Jadwal Tetap (Kelas Grup)")}
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
                        {tt("Setiap")} {tt(b.scheduleDay || "")}{b.scheduleTime ? `, ${b.scheduleTime} WIB` : ""}
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
            <h1 className="text-[20px] font-extrabold leading-tight text-[#12172B]">{tt("Jadwal Kelas")}</h1>
            {/* jadwal-riwayat-v1: `items` termasuk riwayat — hitungannya wajib dari
                `upcoming`, kalau tidak angkanya bohong. */}
            <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">
              {upcoming.length} {tt("sesi mendatang")}{pastCount > 0 ? ` · ${pastCount} ${tt("sudah lewat")}` : ""}
            </p>
          </div>
          <button onClick={goToday} className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-bold text-[#12172B] transition hover:bg-slate-50">
            {tt("Hari ini")}
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
                {tt("Total minggu ini")}: {uiLang === "en" ? fmtDuration(weekMinutes).replace(" jam", " hr").replace("j ", "h ") : fmtDuration(weekMinutes)}
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
                  {/* "Minggu" di kamus = nama hari (Sunday); di sini artinya pekan */}
                  {m === "week" && uiLang === "en" ? "Week" : tt(label)}
                </button>
              ))}
            </div>
            <button onClick={goPrev} aria-label={tt("Sebelumnya")} className={navBtn}><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={goNext} aria-label={tt("Berikutnya")} className={navBtn}><ChevronRight className="w-5 h-5" /></button>
            {/* jadwal-fullscreen-v1: sejajar tombol layar penuh di dashboard pengajar */}
            <button
              onClick={() => setFullscreen((v) => !v)}
              aria-label={fullscreen ? tt("Keluar layar penuh") : tt("Layar penuh")}
              title={fullscreen ? tt("Keluar layar penuh (Esc)") : tt("Layar penuh (F)")}
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
                {DOWS.map((d, i) => <div key={d} className={i >= 5 ? "text-slate-300" : ""}>{tt(d)}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {cells.map((cell, i) => {
                  if (!cell) return <div key={`lead-${i}`} />;
                  const evs = eventsOn(cell.iso);
                  const isToday = cell.iso === todayIso;
                  const isSel = agendaIso === cell.iso;
                  // [kalender-hari-libur-v1] libur nasional & cuti bersama (SKB 3 Menteri).
                  const libur = liburOn(cell.iso);
                  return (
                    <button
                      key={cell.iso}
                      onClick={() => evs.length && setSelected(cell.iso)}
                      tabIndex={evs.length ? 0 : -1}
                      title={libur ? liburTooltip(libur) : undefined}
                      aria-label={`${cell.d} ${tt(MONTHS[cursor.getMonth()])}${libur ? `, ${liburTooltip(libur)}` : ""}${evs.length ? `, ${evs.length} ${tt("sesi")}` : ""}`}
                      className={[
                        "flex min-h-[44px] flex-col gap-1 rounded-xl border border-slate-100 p-1.5 text-left transition sm:min-h-[78px] sm:p-2",
                        evs.length ? "cursor-pointer hover:bg-slate-50" : "cursor-default",
                        // jadwal-weekend-netral-v1: Sabtu/Minggu tidak lagi diberi tint abu.
                        // Tint `#F5F6F8/60` tak tertangkap aturan dark mode di StudentShell
                        // (alias -/60 beda kelas), jadi di mode gelap kolom akhir pekan
                        // menyala putih. Sekarang seragam dengan hari kerja.
                        // [kalender-hari-libur-v1] latar merah tipis pakai kelas `libur-sel`
                        // yang punya pasangan aturan `.lms-dark` (lihat <style> di bawah) —
                        // bukan hex inline, biar tidak jadi kotak merah muda di mode gelap.
                        libur ? "libur-sel" : "bg-white",
                      ].join(" ")}
                      style={isSel ? { outline: "2px solid #16796E" } : undefined}
                    >
                      <span className="flex items-center justify-between gap-1">
                        {isToday ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-extrabold sm:text-[13px]" style={{ background: "#16796E", color: "#fff" }}>{cell.d}</span>
                        ) : (
                          <span className={`text-[12px] font-extrabold sm:text-[13px] ${libur ? "libur-teks" : "text-[#12172B]"}`}>{cell.d}</span>
                        )}
                        {/* [kalender-hari-libur-v1] nama libur — dipotong, lengkapnya di tooltip sel */}
                        {libur && <span className="libur-teks min-w-0 flex-1 truncate text-right text-[9px] font-bold leading-tight">{liburLabel(libur)}</span>}
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
                              title={`${e._time} · ${e.language}${e.level ? ` ${e.level}` : ""}${e.teacher ? ` · ${e.teacher}` : ""}${e._live ? " · Sedang berlangsung" : st ? ` · ${st.label}` : ""}`}
                              className="flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-tight"
                              style={{ background: c.bg, color: c.text, opacity: e._past || isDead(e.status) ? 0.55 : 1 }}
                            >
                              {/* jadwal-flag-avatar-v1: bendera dulu, titik status tetap dipertahankan —
                                  bendera menjawab "kelas apa", titik menjawab "hasilnya apa". */}
                              <LangFlag language={e.language} h={8} className="hidden sm:inline-flex" />
                              {/* jadwal-live-now-v1: titiknya berdenyut merah saat sesinya jalan. */}
                              <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${e._live ? "animate-pulse" : ""}`}
                                style={{ background: e._live ? LIVE_COLOR : st ? st.color : c.dot }}
                              />
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
                  {mode === "day" ? tt("Tidak ada sesi di hari ini") : tt("Tidak ada sesi minggu ini")}
                </p>
                <p className="mt-1 text-[12.5px] font-medium text-[#6B7280]">{mode === "day" ? tt("Pakai panah di atas buat lihat hari lain.") : tt("Pakai panah di atas buat lihat minggu lain.")}</p>
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
                          const libur = liburOn(iso); // [kalender-hari-libur-v1]
                          return (
                            <button
                              key={iso}
                              type="button"
                              onClick={() => setSelected(iso)}
                              title={libur ? liburTooltip(libur) : undefined}
                              className={`flex flex-col items-center gap-0.5 rounded-t-lg py-1.5 transition ${agendaIso === iso ? "bg-[#16796E]/5" : "hover:bg-slate-50"}`}
                            >
                              <span className={`text-[10px] font-bold uppercase tracking-wide ${libur ? "libur-teks" : dow >= 5 ? "text-slate-300" : "text-[#6B7280]"}`}>{tt(DOWS[dow])}</span>
                              <span className={`text-[14px] font-extrabold tabular-nums ${isToday ? "flex h-6 w-6 items-center justify-center rounded-full bg-[#16796E] text-white" : libur ? "libur-teks" : "text-[#12172B]"}`}>
                                {d.getDate()}
                              </span>
                              {/* nama liburnya ikut tergambar — warna merah saja bikin siswa
                                  menebak-nebak "kenapa tanggal ini merah?" */}
                              {libur && (
                                <span className="libur-teks w-full truncate px-0.5 text-center text-[8px] font-bold leading-tight">
                                  {liburLabel(libur)}
                                </span>
                              )}
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
                          const placed = layoutDay(gabungSesiBeruntun(eventsOn(iso)));
                          const isToday = iso === todayIso;
                          const libur = liburOn(iso); // [kalender-hari-libur-v1]
                          return (
                            <div
                              key={iso}
                              // jadwal-weekend-netral-v1: kolom Sabtu/Minggu ikut latar hari kerja.
                              className={`relative border-l border-slate-100 ${libur ? "libur-kolom" : ""}`}
                              style={{ height: totalH }}
                            >
                              {/* [kalender-hari-libur-v1] view Hari tak menggambar kepala hari,
                                  jadi nama liburnya ditempel di kolomnya sendiri. */}
                              {libur && mode === "day" && (
                                <span className="libur-teks libur-sel pointer-events-none absolute left-1.5 top-1.5 z-20 rounded-md px-1.5 py-0.5 text-[10px] font-bold">
                                  {liburTooltip(libur)}
                                </span>
                              )}
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
                              {placed.map(({ items: blok, mulai, selesai, lane, lanes }) => {
                                // [jadwal-blok-gabung-v1] satu kartu per blok beruntun; `e` = sesi pertama
                                const e = blok[0];
                                const c = langColor(e.language);
                                const mins = Math.round((selesai - mulai) / 60000);
                                const hPx = Math.max(((mins / 60) * hourPx) - 2, 22);
                                const w = 100 / lanes;
                                const live = blok.some((s) => s._live);
                                const dead = blok.every((s) => isDead(s.status));
                                const redup = blok.every((s) => s._past || isDead(s.status));
                                const st = statusBlok(blok); // jadwal-riwayat-v1
                                const akhir = fmtTime(new Date(selesai));
                                const nomor = nomorSesiLabel(blok);
                                return (
                                  <button
                                    key={e.id}
                                    onClick={() => setSelected(iso)}
                                    // title bawaan browser dibuang: detailnya sudah dijawab panel hover
                                    aria-label={`${e._time}–${akhir} · ${e.language}${e.level ? ` ${e.level}` : ""}${e.teacher ? ` · ${e.teacher}` : ""}${blok.length > 1 ? ` · ${blok.length} ${tt("sesi")}` : ""}`}
                                    onPointerEnter={(ev) => { if (ev.pointerType === "mouse") bukaHover(blok, ev.currentTarget.getBoundingClientRect()); }}
                                    onPointerLeave={(ev) => { if (ev.pointerType === "mouse") tutupHover(); }}
                                    className={`absolute overflow-hidden rounded-md px-1.5 py-0.5 text-left shadow-sm transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(.16,1,.3,1)] hover:z-20 hover:scale-[1.04] hover:shadow-md ${live ? "z-20" : "z-10"}`}
                                    style={{
                                      top: ((e._d.getHours() * 60 + e._d.getMinutes() - h0 * 60) / 60) * hourPx + 1,
                                      height: hPx,
                                      left: `calc(${lane * w}% + 2px)`,
                                      width: `calc(${w}% - 4px)`,
                                      background: c.bg,
                                      color: c.text,
                                      // jadwal-live-now-v1: sesi berjalan dikelilingi cincin merah
                                      // (sewarna garis "sekarang") biar kelihatan dari seberang layar.
                                      borderLeft: `3px solid ${live ? LIVE_COLOR : st ? st.color : c.dot}`,
                                      boxShadow: live ? `0 0 0 2px ${LIVE_COLOR}` : undefined,
                                      opacity: redup ? 0.6 : 1,
                                    }}
                                  >
                                    {/* Susunan ala Google Calendar: judul kelas dulu, jam di bawahnya.
                                        Blok pendek (< 32px) tak muat dua baris → jam digabung sebaris.
                                        jadwal-flag-avatar-v1: bendera bahasa memimpin baris judul, foto
                                        pengajar nempel di baris jam — dua pertanyaan pertama siswa
                                        ("kelas apa" & "sama siapa") kejawab tanpa buka agenda. */}
                                    <p className="flex items-center gap-1 truncate text-[10px] font-extrabold leading-tight">
                                      {/* jadwal-live-now-v1: titik denyut menggantikan bendera saat
                                          sesinya jalan — di blok sesempit ini cuma muat satu penanda. */}
                                      {live ? (
                                        <span className="relative flex h-2 w-2 shrink-0">
                                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: LIVE_COLOR }} />
                                          <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: LIVE_COLOR }} />
                                        </span>
                                      ) : (
                                        <LangFlag language={e.language} h={9} />
                                      )}
                                      <span className={`truncate ${dead ? "line-through" : ""}`}>{e.language}{e.level ? ` ${e.level}` : ""}</span>
                                      {hPx < 32 && <span className="shrink-0 font-bold opacity-70">{e._time}</span>}
                                      {nomor ? (
                                        <span className="ml-auto shrink-0 rounded-full bg-black/10 px-1.5 text-[8px] font-bold leading-[14px]">{nomor}</span>
                                      ) : null}
                                    </p>
                                    {hPx >= 32 && (
                                      <p className="flex items-center gap-1 text-[10px] font-semibold leading-tight opacity-80">
                                        {live ? (
                                          <span className="truncate font-extrabold" style={{ color: LIVE_COLOR }}>{tt("Sedang berlangsung")}</span>
                                        ) : (
                                          <span className="truncate">{e._time}–{akhir}</span>
                                        )}
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
                <span className="text-[12px] font-semibold text-[#6B7280]">{agendaEvents.length} {tt("sesi")}</span>
              </div>
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-3 sm:p-4">
                {agendaEvents.map((e) => (
                  <SessionCard key={e.id} e={e} now={now} studentName={studentName} aksesRekaman={aksesRekaman} />
                ))}
              </div>
            </div>
          )}

          {/* Keterangan warna — sederet di bawah kalender (dulu numpuk di kolom kiri) */}
          {legend.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-[12px] font-semibold text-[#12172B]">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">{tt("Bahasa")}</span>
              {legend.map(([lang, c]) => (
                <span key={lang} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.dot }} />{lang}
                </span>
              ))}
              {/* jadwal-riwayat-v1: sesi lampau punya penanda presensi — tanpa
                  keterangan ini titik warnanya cuma jadi teka-teki. */}
              {attLegend.length > 0 && (
                <>
                  <span className="ml-1 text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">{tt("Presensi")}</span>
                  {attLegend.map((k) => (
                    <span key={k} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: ATT_META[k].color }} />{tt(ATT_META[k].label)}
                    </span>
                  ))}
                </>
              )}
              {/* [kalender-hari-libur-v1] keterangan tanggal merah — nama liburnya sering
                  terpotong di sel sempit, jadi maknanya dijelaskan sekali di sini. */}
              <span className="libur-teks flex items-center gap-1.5">
                <span className="libur-teks h-2.5 w-2.5 rounded-full bg-current" />{tt("Libur nasional / cuti bersama")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Status satu blok — cuma kalau semua sesinya seragam; campur (Hadir + mendatang) → null. */
function statusBlok(items: NormSession[]) {
  const semua = items.map(statusMeta);
  return semua.every((m) => m?.label === semua[0]?.label) ? semua[0] : null;
}

const HOVER_W = 288;

/**
 * [jadwal-blok-hover-zoom-v1] Panel detail yang membesar dari blok di time-grid
 * saat diarahkan mouse. pointer-events-none: panel menutupi bloknya sendiri, dan
 * kalau ia menangkap pointer, blok menerima pointerleave → panel kedip-kedip.
 */
const HOVER_EASE = "cubic-bezier(.16,1,.3,1)";

function BlokHoverDetail({ items, rect, open, now }: { items: NormSession[]; rect: DOMRect; open: boolean; now: number }) {
  const tt = useT();
  const head = items[0];
  const tail = items[items.length - 1];
  const c = langColor(head.language);
  const selesai = tail._d.getTime() + (tail.durationMinutes || 60) * 60000;
  const mins = Math.round((selesai - head._d.getTime()) / 60000);
  const live = items.some((s) => s._live);
  const mendatang = !live && items.every((s) => !s._past && !isDead(s.status));
  const st = statusBlok(items);
  const nomor = nomorSesiLabel(items);
  const d = head._d;

  // Tengahnya sejajar blok, dijepit ke viewport; blok di bagian bawah layar → panel naik.
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const left = Math.min(Math.max(8, rect.left + rect.width / 2 - HOVER_W / 2), vw - HOVER_W - 8);
  const turun = rect.top < vh * 0.55;
  const pos = turun ? { top: Math.max(8, rect.top - 6) } : { bottom: Math.max(8, vh - rect.bottom - 6) };
  const originX = Math.min(HOVER_W, Math.max(0, rect.left + rect.width / 2 - left));

  return (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-[80] overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-20px_rgba(18,23,43,0.55)] ring-1 ring-slate-200"
      style={{
        ...pos,
        left,
        width: HOVER_W,
        transformOrigin: `${originX}px ${turun ? "0" : "100%"}`,
        opacity: open ? 1 : 0,
        transform: open ? "translateY(0) scale(1)" : `translateY(${turun ? -6 : 6}px) scale(0.94)`,
        transition: `opacity 220ms ease-out, transform 280ms ${HOVER_EASE}, left 280ms ${HOVER_EASE}, top 280ms ${HOVER_EASE}, bottom 280ms ${HOVER_EASE}`,
        willChange: "transform, opacity",
      }}
    >
      <div className="px-3.5 pb-2.5 pt-3" style={{ background: c.bg, color: c.text }}>
        <div className="flex items-center gap-2">
          {langFlagCode(head.language)
            ? <LangFlag language={head.language} h={14} />
            : <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.dot }} />}
          <span className={`min-w-0 flex-1 truncate text-[15px] font-extrabold leading-tight ${isDead(head.status) ? "line-through" : ""}`}>
            {head.language}{head.level ? ` ${head.level}` : ""}
          </span>
          {nomor && <span className="shrink-0 rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-extrabold">{nomor}</span>}
        </div>
        <p className="mt-1 text-[12px] font-bold opacity-80">
          {tt(DOWS_FULL[(d.getDay() + 6) % 7])}, {d.getDate()} {tt(MONTHS[d.getMonth()])} · {head._time}–{fmtTime(new Date(selesai))}
        </p>
      </div>

      <div className="space-y-2.5 px-3.5 py-3">
        {head.teacher && (
          <div className="flex items-center gap-2.5">
            <TeacherAvatar name={head.teacher} src={head.teacherAvatarUrl} size={40} />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-extrabold text-[#12172B]">{head.teacher}</p>
              <p className="text-[11px] font-semibold text-[#6B7280]">{tt("Pengajar")}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] font-semibold text-[#6B7280]">
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" strokeWidth={2.2} /> {mins} {tt("menit")}</span>
          {items.length > 1 && <span>{items.length} {tt("sesi")}</span>}
          {head.product && <span className="truncate">{head.product}</span>}
        </div>

        {(live || st || mendatang) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {live ? <LiveBadge /> : st ? (
              <span className="rounded-full px-2 py-0.5 text-[11px] font-extrabold" style={{ background: `${st.color}1A`, color: st.color }}>{tt(st.label)}</span>
            ) : null}
            {mendatang && <span className="text-[12px] font-bold text-[#16796E]">{countdownLabel(head._d, now)}</span>}
          </div>
        )}

        {/* Blok gabungan: rincian per sesi (nomor, jam, topik, presensi masing-masing). */}
        {items.length > 1 ? (
          <ul className="space-y-1 border-t border-slate-100 pt-2">
            {items.map((s) => {
              const m = statusMeta(s);
              return (
                <li key={s.id} className="flex items-center gap-2 text-[11.5px] font-semibold text-[#6B7280]">
                  <span className="w-8 shrink-0 font-extrabold text-[#12172B]">{s.sessionNumber ? `#${s.sessionNumber}` : "•"}</span>
                  <span className="shrink-0 tabular-nums">{s._time}–{fmtTime(new Date(s._d.getTime() + (s.durationMinutes || 60) * 60000))}</span>
                  <span className="min-w-0 flex-1 truncate">{s.materialTitle || ""}</span>
                  {m && !st && <span className="shrink-0 font-bold" style={{ color: m.color }}>{tt(m.label)}</span>}
                </li>
              );
            })}
          </ul>
        ) : head.materialTitle ? (
          <p className="flex items-center gap-1.5 border-t border-slate-100 pt-2 text-[12px] font-bold text-[#16796E]">
            <BookOpen className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
            <span className="truncate">{head.materialTitle}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Kartu sesi lengkap (jam, kelas, pengajar, aksi, materi) — dipakai agenda di
 * bawah kalender pada SEMUA view.
 */
function SessionCard({ e, now, studentName, aksesRekaman }: { e: NormSession; now: number; studentName?: string; aksesRekaman?: Map<string, AksesAddon> }) {
  const tt = useT(); // [ui-lang-switcher-v1]
  const c = langColor(e.language);
  const st = statusMeta(e); // jadwal-riwayat-v1
  // [rekaman-wajib-beli-v1] Hanya pembeli Recording ("punya") yang dapat tombolnya.
  // Peta belum datang → "memuat" (tak ada tombol, tak ada gembok); registrasi tak
  // dikenal / sesi tanpa registrasi → terkunci.
  const aksesSesi: AksesAddon = !aksesRekaman || aksesRekaman.size === 0
    ? "memuat"
    : (e.registrationId ? aksesRekaman.get(e.registrationId) : undefined) ?? "belum-didata";
  const bolehRekaman = rekamanBolehTampil(aksesSesi);
  const rekamanDikunci = rekamanTerkunci(aksesSesi);
  const rec = e.recordingUrl && bolehRekaman ? studentRecordingHref(e.recordingUrl) : null;
  // [vc-recmodal-v1] Rekaman ditonton di pop-up — kalender tetap di posisinya.
  const [rekaman, setRekaman] = useState<{ url: string; title: string } | null>(null);
  return (
    <div
      className="rounded-2xl bg-slate-50 p-3"
      style={{
        ...(isDead(e.status) ? { opacity: 0.65 } : null),
        // jadwal-live-now-v1: kartu sesi yang lagi jalan dikelilingi garis merah.
        ...(e._live ? { boxShadow: `0 0 0 2px ${LIVE_COLOR}` } : null),
      }}
    >
      <div className="flex items-stretch gap-3">
        <span
          className="flex w-20 shrink-0 flex-col items-center justify-center rounded-xl py-2"
          style={{ background: e._live ? `${LIVE_COLOR}14` : c.bg }}
        >
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
              <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold" style={{ background: c.bg, color: c.text }}>
                {e.isBatch ? tt("Pertemuan") : tt("Sesi")} {e.sessionNumber}
              </span>
            ) : null}
            {/* [jadwal-batch-kalender-v1] penanda kelas grup berjadwal tetap */}
            {e.isBatch && (
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-extrabold text-[#6B7280]">{tt("Jadwal tetap")}</span>
            )}
            {/* jadwal-live-now-v1: sesi yang jamnya lagi jalan */}
            {e._live && <LiveBadge />}
            {/* jadwal-riwayat-v1: hasil sesi (presensi / dibatalkan) */}
            {st && (
              <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold" style={{ background: `${st.color}1A`, color: st.color }}>
                {tt(st.label)}
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
            {e.durationMinutes ? <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" strokeWidth={2} /> {e.durationMinutes} {tt("menit")}</span> : null}
            {e.product && <span className="text-[#9CA3AF]">{e.product}</span>}
            {/* jadwal-riwayat-v1: hitung mundur sesi mendatang. Sesi yang lagi jalan
                sudah dijawab lencana di atas — "sedang berlangsung" dua kali sebaris
                cuma bikin barisnya panjang. */}
            {!e._past && !e._live && !isDead(e.status) && (
              <span className="font-bold text-[#16796E]">{countdownLabel(e._d, now)}</span>
            )}
            {e._live && e._end && (
              <span className="font-bold" style={{ color: LIVE_COLOR }}>{tt("selesai")} {e._end}</span>
            )}
          </span>
        </span>
        <span className="flex shrink-0 flex-col justify-center gap-1.5">
          {e._joinable && (
            <a
              href={e.joinUrl || classRoomUrl(e.id, { title: `Kelas ${e.language}`, name: studentName })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#16796E] px-3.5 py-2 text-[12.5px] font-extrabold text-white hover:bg-[#0F5A52]"
            >
              <Video className="h-3.5 w-3.5" strokeWidth={2.2} /> {tt("Masuk Kelas")}
            </a>
          )}
          {/* [addon-akses-rekaman-v1] rekamannya ada, paketnya tidak mencakup */}
          {e.recordingUrl && rekamanDikunci && (
            <span
              title={tt(PESAN_REKAMAN_TERKUNCI)}
              className="inline-flex max-w-[118px] items-center gap-1.5 text-right text-[11.5px] font-semibold leading-snug text-[#9CA3AF]"
            >
              <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} /> {tt("Rekaman tak termasuk paket")}
            </span>
          )}
          {/* jadwal-riwayat-v1: rekaman sesi lampau */}
          {rec && (isInternalRecordingHref(rec) ? (
            <button
              type="button"
              onClick={() => setRekaman({ url: e.recordingUrl!, title: `${tt("Rekaman")} — ${e.language}` })}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-[12.5px] font-extrabold text-[#16796E] hover:bg-[#EAF3F2]"
            >
              <PlayCircle className="h-3.5 w-3.5" strokeWidth={2.2} /> {tt("Rekaman")}
            </button>
          ) : (
            <a
              href={rec}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-[12.5px] font-extrabold text-[#16796E] hover:bg-[#EAF3F2]"
            >
              <PlayCircle className="h-3.5 w-3.5" strokeWidth={2.2} /> {tt("Rekaman")}
            </a>
          ))}
        </span>
      </div>
      <MaterialBlock s={e} />
      {rekaman && (
        <RecordingModal recordingUrl={rekaman.url} title={rekaman.title} onClose={() => setRekaman(null)} />
      )}
    </div>
  );
}

/**
 * jadwal-recurring-materi-v1: blok "Materi" pada kartu sesi — topik + rincian +
 * berkas/link rujukan yang dilampirkan pengajar. Tak dirender kalau kosong.
 */
function MaterialBlock({ s }: { s: NormSession }) {
  const tt = useT(); // [ui-lang-switcher-v1]
  const links = s.materialLinks ?? [];
  if (!s.materialTitle && !s.materialNotes && links.length === 0) return null;
  return (
    <div className="mt-2.5 rounded-xl bg-white p-3">
      <p className="flex items-center gap-1.5 text-[12px] font-extrabold text-[#16796E]">
        <BookOpen className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
        {s.materialTitle || tt("Materi sesi")}
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
