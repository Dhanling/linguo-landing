"use client";

// akun-jadwal-lms-v1 — Halaman Jadwal LMS siswa (/akun/jadwal).
// Port dari Claude Design frame (Jadwal.html) ke React/Next, plus polish:
// real-today, support 60+ bahasa (langColor), legend dinamis, empty state,
// responsive, a11y. Warna config-independent (hex inline) -> ga gantung tailwind.config.

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Bell, Video } from "lucide-react";

// ============================================================================
// >>> WIRING POINT <<< — cuma SATU fungsi ini yang perlu disambung ke Supabase.
// ----------------------------------------------------------------------------
// Ganti isi getSessions() dengan query tabel `schedules`. Bentuk row yang
// diharepin komponen ada di tipe ClassSession di bawah. Contoh query (CONFIRM
// nama kolom + join-nya dulu — gue belum liat schema persisnya):
//
//   const { data } = await supabase
//     .from("schedules")
//     .select(`
//       id, session_start_time, session_end_time, recording_url, session_no,
//       registrations ( language, level, teachers ( name ) )
//     `)
//     .order("session_start_time", { ascending: true });
//
//   const sessions: ClassSession[] = (data ?? []).map((r) => {
//     const start = new Date(r.session_start_time);
//     return {
//       id: r.id,
//       date: ymd(start),                              // 'YYYY-MM-DD' lokal
//       startTime: fmtTime(start),                     // '19.00'
//       endTime: r.session_end_time ? fmtTime(new Date(r.session_end_time)) : undefined,
//       language: r.registrations?.language ?? "—",
//       level: r.registrations?.level ?? "",
//       sessionNo: r.session_no ?? undefined,
//       teacher: r.registrations?.teachers?.name ?? "—",
//       recordingUrl: r.recording_url ?? null,
//     };
//   });
//
// Filter siswa (RLS auth.jwt email) + status Lunas/Cicilan idealnya di sisi
// query/RLS. Kalender butuh full bulan (jangan pre-filter >= now di SQL); panel
// "Sesi Mendatang" yang nyaring upcoming-nya di FE.
// ============================================================================

export type ClassSession = {
  id: string;
  date: string; // 'YYYY-MM-DD'
  startTime: string; // '19.00'
  endTime?: string;
  language: string;
  level: string;
  sessionNo?: number;
  teacher: string;
  recordingUrl?: string | null;
};

// ---- DATA (sementara mock; lihat WIRING POINT) -----------------------------
function getSessions(): ClassSession[] {
  // Mock relatif ke hari ini biar preview-nya keliatan hidup.
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const mk = (day: number, language: string, level: string, sesi: number, time: string, end: string, teacher: string, rec?: string): ClassSession => ({
    id: `${language}-${day}-${time}`,
    date: ymd(new Date(y, m, day)),
    startTime: time,
    endTime: end,
    language,
    level,
    sessionNo: sesi,
    teacher,
    recordingUrl: rec ?? null,
  });
  return [
    mk(3, "Jepang", "A1.2", 9, "19.00", "20.00", "Kenji Tanaka", "https://example.com/rec1"),
    mk(5, "Inggris", "Conv. B1", 13, "20.00", "21.00", "Sarah Wijaya"),
    mk(8, "Korea", "A2.1", 6, "18.30", "19.30", "Min-ji Park"),
    mk(11, "Jepang", "A1.2", 10, "19.00", "20.00", "Kenji Tanaka"),
    mk(12, "Inggris", "Conv. B1", 14, "20.00", "21.00", "Sarah Wijaya"),
    mk(16, "Belanda", "A1.1", 3, "17.00", "18.00", "Wouter de Vries"),
    mk(19, "Korea", "A2.1", 7, "18.30", "19.30", "Min-ji Park"),
    mk(22, "Jepang", "A1.2", 11, "19.00", "20.00", "Kenji Tanaka"),
    mk(25, "Inggris", "Conv. B1", 15, "20.00", "21.00", "Sarah Wijaya"),
    mk(28, "Spanyol", "A1.1", 2, "16.00", "17.00", "Lucía Fernández"),
  ];
}

// ---- helpers ---------------------------------------------------------------
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const DOWS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;
}
function isoOf(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

type LangColor = { dot: string; bg: string; text: string };
const PALETTE: LangColor[] = [
  { dot: "#16796E", bg: "#16796E1A", text: "#0F5A52" }, // teal (primary)
  { dot: "#E11D48", bg: "#FFF1F2", text: "#BE123C" }, // rose
  { dot: "#6366F1", bg: "#EEF2FF", text: "#4F46E5" }, // indigo
  { dot: "#D97706", bg: "#FFFBEB", text: "#B45309" }, // amber
  { dot: "#0EA5E9", bg: "#F0F9FF", text: "#0369A1" }, // sky
  { dot: "#7C3AED", bg: "#F5F3FF", text: "#6D28D9" }, // violet
  { dot: "#059669", bg: "#ECFDF5", text: "#047857" }, // emerald
  { dot: "#EA580C", bg: "#FFF7ED", text: "#C2410C" }, // orange
  { dot: "#0891B2", bg: "#ECFEFF", text: "#0E7490" }, // cyan
  { dot: "#DB2777", bg: "#FDF2F8", text: "#BE185D" }, // pink
];
const LANG_OVERRIDE: Record<string, number> = { Inggris: 0, Jepang: 1, Korea: 2 };
function langColor(language: string): LangColor {
  if (language in LANG_OVERRIDE) return PALETTE[LANG_OVERRIDE[language]];
  let h = 0;
  for (let i = 0; i < language.length; i++) h = (h * 31 + language.charCodeAt(i)) >>> 0;
  const idx = 3 + (h % (PALETTE.length - 3)); // 3..end, sisain 0-2 buat override umum
  return PALETTE[idx];
}

// ============================================================================
export default function JadwalPage() {
  const sessions = useMemo(() => getSessions(), []);
  const today = useMemo(() => new Date(), []);
  const todayIso = ymd(today);

  const [view, setView] = useState<{ y: number; m: number }>({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState<string | null>(null); // iso date or null

  const eventsOn = (iso: string) => sessions.filter((s) => s.date === iso);

  // legend dinamis: bahasa unik di seluruh jadwal
  const legend = useMemo(() => {
    const seen = new Map<string, LangColor>();
    for (const s of sessions) if (!seen.has(s.language)) seen.set(s.language, langColor(s.language));
    return Array.from(seen.entries()).slice(0, 6);
  }, [sessions]);

  // side list: kalo ada tanggal kepilih -> sesi tanggal itu; else upcoming dari hari ini
  const sideList = useMemo(() => {
    if (selected) return eventsOn(selected);
    return sessions
      .filter((s) => s.date >= todayIso)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.startTime.localeCompare(b.startTime)));
  }, [sessions, selected, todayIso]);

  // calendar cells
  const cells = useMemo(() => {
    const { y, m } = view;
    const lead = (new Date(y, m, 1).getDay() + 6) % 7; // Senin-start
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const out: ({ d: number; iso: string } | null)[] = [];
    for (let i = 0; i < lead; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push({ d, iso: isoOf(y, m, d) });
    return out;
  }, [view]);

  const gotoMonth = (delta: number) => {
    setSelected(null);
    setView((v) => {
      let m = v.m + delta;
      let y = v.y;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { y, m };
    });
  };
  const goToday = () => { setSelected(null); setView({ y: today.getFullYear(), m: today.getMonth() }); };

  return (
    <div className="w-full">
      <div className="bg-white rounded-[26px] overflow-hidden flex flex-col-reverse lg:flex-row min-w-0 shadow-[0_24px_60px_-40px_rgba(18,23,43,0.45)]">
        {/* ---------- LEFT: Sesi Mendatang + legend ---------- */}
        <section className="w-full lg:w-[320px] shrink-0 border-t lg:border-t-0 lg:border-r border-slate-100 flex flex-col bg-white">
          <div className="px-6 pt-7 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-extrabold text-[#12172B]">
                {selected ? formatSelTitle(selected) : "Sesi Mendatang"}
              </h2>
              <p className="text-[12px] text-[#6B7280] font-medium mt-0.5">
                {selected ? `${sideList.length} sesi terjadwal` : "Semua kelas aktif"}
              </p>
            </div>
            {selected && (
              <button
                onClick={() => setSelected(null)}
                className="text-[12px] font-bold text-[#16796E] hover:text-[#0F5A52] whitespace-nowrap"
              >
                Semua
              </button>
            )}
          </div>

          <div className="px-4 pb-4 flex flex-col gap-2.5 overflow-y-auto flex-1 max-h-[340px] lg:max-h-none">
            {sideList.length ? (
              sideList.map((s) => <SideItem key={s.id} s={s} onClick={() => setSelected(s.date)} />)
            ) : (
              <div className="text-center text-[13px] text-[#6B7280] font-medium py-10">Tidak ada sesi.</div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-100">
            <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide mb-2.5">Bahasa</p>
            <div className="flex flex-col gap-2 text-[13px] font-semibold text-[#12172B]">
              {legend.map(([lang, c]) => (
                <span key={lang} className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full" style={{ background: c.dot }} />
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- RIGHT: kalender ---------- */}
        <main className="flex-1 bg-[#F5F6F8] min-w-0 flex flex-col">
          {/* top bar */}
          <div className="px-6 lg:px-8 pt-7 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[12px] font-bold text-[#6B7280] flex items-center gap-1.5">
                <a href="/akun" className="hover:text-[#16796E]">Dashboard</a>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#16796E] whitespace-nowrap">Jadwal</span>
              </p>
              <h1 className="text-[24px] font-extrabold leading-tight mt-1 text-[#12172B]">Jadwal</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={goToday}
                className="text-[13px] font-bold px-4 h-11 rounded-2xl bg-white shadow-[0_10px_30px_-22px_rgba(18,23,43,0.6)] hover:bg-slate-50 transition text-[#12172B]"
              >
                Hari ini
              </button>
              <button
                aria-label="Notifikasi"
                className="w-11 h-11 rounded-2xl bg-white shadow-[0_10px_30px_-22px_rgba(18,23,43,0.6)] flex items-center justify-center hover:bg-slate-50 transition relative text-[#12172B]"
              >
                <Bell className="w-[19px] h-[19px]" />
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>
            </div>
          </div>

          {/* month nav */}
          <div className="px-6 lg:px-8 mt-5 flex items-center justify-between">
            <h2 className="text-[20px] font-extrabold text-[#12172B]">{MONTHS[view.m]} {view.y}</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => gotoMonth(-1)} aria-label="Bulan sebelumnya" className="w-10 h-10 rounded-xl bg-white shadow-[0_10px_30px_-22px_rgba(18,23,43,0.6)] flex items-center justify-center hover:bg-slate-50 transition text-[#12172B]">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => gotoMonth(1)} aria-label="Bulan berikutnya" className="w-10 h-10 rounded-xl bg-white shadow-[0_10px_30px_-22px_rgba(18,23,43,0.6)] flex items-center justify-center hover:bg-slate-50 transition text-[#12172B]">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* calendar */}
          <div className="px-6 lg:px-8 pb-8 pt-4 flex-1">
            <div className="bg-white rounded-[2rem] p-3 sm:p-4 shadow-[0_24px_50px_-34px_rgba(18,23,43,.5)]">
              <div className="grid grid-cols-7 text-center text-[12px] font-bold text-[#6B7280] pb-2">
                {DOWS.map((d, i) => (
                  <div key={d} className={i >= 5 ? "text-slate-300" : ""}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {cells.map((cell, i) => {
                  if (!cell) return <div key={`lead-${i}`} />;
                  const evs = eventsOn(cell.iso);
                  const isToday = cell.iso === todayIso;
                  const isSel = selected === cell.iso;
                  const dow = (new Date(view.y, view.m, cell.d).getDay() + 6) % 7;
                  const weekend = dow >= 5;
                  return (
                    <button
                      key={cell.iso}
                      onClick={() => evs.length && setSelected(cell.iso)}
                      tabIndex={evs.length ? 0 : -1}
                      aria-label={`${cell.d} ${MONTHS[view.m]}${evs.length ? `, ${evs.length} sesi` : ""}`}
                      className={[
                        "text-left rounded-xl p-1.5 sm:p-2 min-h-[72px] sm:min-h-[96px] flex flex-col gap-1 transition",
                        evs.length ? "cursor-pointer hover:bg-white" : "cursor-default",
                        weekend ? "bg-[#F5F6F8]/60" : "bg-[#F5F6F8]",
                      ].join(" ")}
                      style={isSel ? { background: "#fff", outline: "2px solid #16796E" } : undefined}
                    >
                      <span className="flex items-center justify-between">
                        {isToday ? (
                          <span
                            className="inline-flex w-6 h-6 rounded-full items-center justify-center text-[12px] sm:text-[13px] font-extrabold"
                            style={{ background: "#16796E", color: "#fff" }}
                          >
                            {cell.d}
                          </span>
                        ) : (
                          <span className="text-[12px] sm:text-[13px] font-extrabold text-[#12172B]">{cell.d}</span>
                        )}
                      </span>
                      <span className="flex flex-col gap-1 overflow-hidden">
                        {evs.slice(0, 2).map((e) => {
                          const c = langColor(e.language);
                          return (
                            <span
                              key={e.id}
                              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-tight truncate"
                              style={{ background: c.bg, color: c.text }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.dot }} />
                              <span className="truncate">{e.startTime} {e.language}</span>
                            </span>
                          );
                        })}
                        {evs.length > 2 && (
                          <span className="text-[10px] font-bold text-[#6B7280] pl-1">+{evs.length - 2} lagi</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );

  function formatSelTitle(iso: string) {
    const [yy, mm, dd] = iso.split("-").map(Number);
    return `${dd} ${MONTHS[mm - 1]} ${yy}`;
  }
}

// ---- subcomponent: kartu sesi di panel kiri --------------------------------
function SideItem({ s, onClick }: { s: ClassSession; onClick: () => void }) {
  const c = langColor(s.language);
  const [yy, mm, dd] = s.date.split("-").map(Number);
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-[0_10px_30px_-24px_rgba(18,23,43,.5)] p-3 flex items-center gap-3 hover:border-[#16796E]/20 hover:-translate-y-0.5 transition"
    >
      <span className="w-12 h-12 shrink-0 rounded-xl bg-[#F5F6F8] flex flex-col items-center justify-center leading-none">
        <span className="text-[15px] font-extrabold text-[#12172B]">{dd}</span>
        <span className="text-[10px] font-bold text-[#6B7280] mt-0.5">{MONTHS_SHORT[mm - 1]}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.dot }} />
          <span className="text-[14px] font-extrabold truncate text-[#12172B]">{s.language} — {s.level}</span>
        </span>
        <span className="block text-[12px] text-[#6B7280] font-medium mt-0.5 truncate">
          {s.sessionNo ? `Sesi ${s.sessionNo} · ` : ""}{s.startTime}{s.endTime ? `–${s.endTime}` : ""} · {s.teacher}
        </span>
        {s.recordingUrl && (
          <a
            href={s.recordingUrl}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16796E] hover:text-[#0F5A52] mt-1"
          >
            <Video className="w-3.5 h-3.5" /> Rekaman
          </a>
        )}
      </span>
    </button>
  );
}
