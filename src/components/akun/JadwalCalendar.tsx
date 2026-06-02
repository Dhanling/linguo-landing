"use client";

// linguo-patch:akun-jadwal-tab-v1
// Kalender Jadwal LMS siswa — dipakai di tab "jadwal" /akun (src/app/akun/page.tsx).
// Port dari Claude Design frame (Jadwal.html) -> React, disambung ke data real
// `upcomingSchedules` (kolom `scheduled_at` + resolve bahasa/level/teacher dari registrasi).
// Warna config-independent (hex inline). Palet match shell: teal #16796E.
// + jadwal-compact-v1: tinggi sel diatur (92->56->78) + panel kiri ditipisin (300->268)
//   biar kalender proporsional, ga ke-strech & ga ceper.
// + jadwal-dummy-fill-v1: fallback sesi dummy kalau akun kosong + lepas max-w
//   (lebar dikontrol wrapper di page.tsx) biar ga banyak space mubazir.

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Video, GraduationCap, CalendarDays } from "lucide-react";

export type JadwalSession = {
  id: string;
  scheduledAt: string; // ISO (dari schedules.scheduled_at)
  durationMinutes?: number | null;
  language: string;
  level?: string;
  product?: string;
  teacher?: string;
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

function pad(n: number) { return String(n).padStart(2, "0"); }
function ymd(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function isoOf(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function fmtTime(d: Date) { return `${pad(d.getHours())}.${pad(d.getMinutes())}`; }

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

type NormSession = JadwalSession & { _d: Date; _iso: string; _time: string; _end: string | null; _weekday: string };

export default function JadwalCalendar({
  sessions,
  regularBatches = [],
}: {
  sessions: JadwalSession[];
  regularBatches?: RegularBatch[];
}) {
  const today = useMemo(() => new Date(), []);
  const todayIso = ymd(today);

  // dummy-fallback-v1: kalau akun belum punya sesi real, tampilin contoh biar
  // kalender + "Sesi Mendatang" ga melompong. Otomatis nyerah ke data real
  // begitu prop `sessions` keisi. Mau matiin dummy? hapus DUMMY_SESSIONS +
  // baseSessions, balikin items pakai `sessions`.
  const DUMMY_SESSIONS = useMemo<JadwalSession[]>(() => {
    const mk = (addDays: number, h: number, mi: number, language: string, level: string, product: string, teacher: string, dur: number): JadwalSession => {
      const d = new Date(today);
      d.setDate(d.getDate() + addDays);
      return {
        id: `dummy-${addDays}-${language}`,
        scheduledAt: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:${pad(mi)}:00`,
        durationMinutes: dur, language, level, product, teacher,
      };
    };
    return [
      mk(1, 10, 0, "Inggris", "B1", "Kelas Private", "Kak Sarah", 60),
      mk(3, 19, 0, "Jepang", "A2", "Kelas Private", "Kak Kenji", 60),
      mk(5, 16, 30, "Spanyol", "A1", "Semi Private", "Kak Maria", 45),
      mk(8, 20, 0, "Korea", "A1", "Kelas Private", "Kak Min", 60),
      mk(12, 17, 0, "Prancis", "A2", "Kelas Private", "Kak Lucas", 60),
    ];
  }, [today]);
  const baseSessions = sessions.length ? sessions : DUMMY_SESSIONS;

  const items = useMemo<NormSession[]>(
    () =>
      baseSessions
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
          };
        }),
    [baseSessions]
  );

  const [view, setView] = useState<{ y: number; m: number }>({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState<string | null>(null);

  const eventsOn = (iso: string) => items.filter((i) => i._iso === iso);

  const legend = useMemo(() => {
    const seen = new Map<string, LangColor>();
    for (const i of items) if (!seen.has(i.language)) seen.set(i.language, langColor(i.language));
    return Array.from(seen.entries()).slice(0, 6);
  }, [items]);

  const sideList = useMemo(() => {
    if (selected) return eventsOn(selected);
    return [...items].sort((a, b) => a._d.getTime() - b._d.getTime());
  }, [items, selected]);

  const cells = useMemo(() => {
    const { y, m } = view;
    const lead = (new Date(y, m, 1).getDay() + 6) % 7;
    const days = new Date(y, m + 1, 0).getDate();
    const out: ({ d: number; iso: string } | null)[] = [];
    for (let i = 0; i < lead; i++) out.push(null);
    for (let d = 1; d <= days; d++) out.push({ d, iso: isoOf(y, m, d) });
    return out;
  }, [view]);

  const gotoMonth = (delta: number) => {
    setSelected(null);
    setView((v) => {
      let m = v.m + delta, y = v.y;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { y, m };
    });
  };
  const goToday = () => { setSelected(null); setView({ y: today.getFullYear(), m: today.getMonth() }); };

  return (
    <div className="w-full space-y-4">
      {/* Jadwal Tetap (Kelas Reguler) — recurring batch + Zoom */}
      {regularBatches.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_10px_30px_-24px_rgba(18,23,43,.5)]">
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

      {/* Kalender panel */}
      <div className="bg-white rounded-[26px] overflow-hidden flex flex-col-reverse lg:flex-row min-w-0 shadow-[0_24px_60px_-40px_rgba(18,23,43,0.45)] border border-slate-100">
        {/* LEFT: sesi mendatang + legend */}
        <section className="w-full lg:w-[268px] shrink-0 border-t lg:border-t-0 lg:border-r border-slate-100 flex flex-col bg-white">
          <div className="px-5 pt-6 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-[17px] font-extrabold text-[#12172B]">
                {selected ? selTitle(selected) : "Sesi Mendatang"}
              </h2>
              <p className="text-[12px] text-[#6B7280] font-medium mt-0.5">
                {selected ? `${sideList.length} sesi terjadwal` : "Semua kelas aktif"}
              </p>
            </div>
            {selected && (
              <button onClick={() => setSelected(null)} className="text-[12px] font-bold text-[#16796E] hover:text-[#0F5A52] whitespace-nowrap">Semua</button>
            )}
          </div>
          <div className="px-4 pb-4 flex flex-col gap-2.5 overflow-y-auto flex-1 max-h-[320px] lg:max-h-none">
            {sideList.length ? (
              sideList.map((s) => <SideItem key={s.id} s={s} onClick={() => setSelected(s._iso)} />)
            ) : (
              <div className="text-center text-[13px] text-[#6B7280] font-medium py-10">
                Belum ada sesi mendatang.
                <span className="block text-[12px] text-[#9CA3AF] mt-1">Hubungi admin untuk atur jadwal kelasmu.</span>
              </div>
            )}
          </div>
          {legend.length > 0 && (
            <div className="px-5 py-4 border-t border-slate-100">
              <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide mb-2.5">Bahasa</p>
              <div className="flex flex-col gap-2 text-[13px] font-semibold text-[#12172B]">
                {legend.map(([lang, c]) => (
                  <span key={lang} className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full" style={{ background: c.dot }} />{lang}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* RIGHT: calendar */}
        <main className="flex-1 bg-[#F5F6F8] min-w-0 flex flex-col">
          <div className="px-5 lg:px-7 pt-6 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-[22px] font-extrabold leading-tight text-[#12172B]">Jadwal Kelas</h1>
              <p className="text-[12px] font-medium text-[#6B7280] mt-0.5">{items.length} sesi mendatang</p>
            </div>
            <button onClick={goToday} className="text-[13px] font-bold px-4 h-10 rounded-2xl bg-white shadow-[0_10px_30px_-22px_rgba(18,23,43,0.6)] hover:bg-slate-50 transition text-[#12172B]">Hari ini</button>
          </div>

          <div className="px-5 lg:px-7 mt-4 flex items-center justify-between">
            <h2 className="text-[18px] font-extrabold text-[#12172B]">{MONTHS[view.m]} {view.y}</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => gotoMonth(-1)} aria-label="Bulan sebelumnya" className="w-9 h-9 rounded-xl bg-white shadow-[0_10px_30px_-22px_rgba(18,23,43,0.6)] flex items-center justify-center hover:bg-slate-50 transition text-[#12172B]"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => gotoMonth(1)} aria-label="Bulan berikutnya" className="w-9 h-9 rounded-xl bg-white shadow-[0_10px_30px_-22px_rgba(18,23,43,0.6)] flex items-center justify-center hover:bg-slate-50 transition text-[#12172B]"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="px-5 lg:px-7 pb-7 pt-4 flex-1">
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
                  const dow = (new Date(view.y, view.m, cell.d).getDay() + 6) % 7;
                  return (
                    <button
                      key={cell.iso}
                      onClick={() => evs.length && setSelected(cell.iso)}
                      tabIndex={evs.length ? 0 : -1}
                      aria-label={`${cell.d} ${MONTHS[view.m]}${evs.length ? `, ${evs.length} sesi` : ""}`}
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
                          return (
                            <span key={e.id} className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-tight truncate" style={{ background: c.bg, color: c.text }}>
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.dot }} />
                              <span className="truncate">{e._time} {e.language}</span>
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

function SideItem({ s, onClick }: { s: NormSession; onClick: () => void }) {
  const c = langColor(s.language);
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-[0_10px_30px_-24px_rgba(18,23,43,.5)] p-3 flex items-center gap-3 hover:border-[#16796E]/30 hover:-translate-y-0.5 transition"
    >
      <span className="w-12 h-12 shrink-0 rounded-xl bg-[#F5F6F8] flex flex-col items-center justify-center leading-none">
        <span className="text-[15px] font-extrabold text-[#12172B]">{s._d.getDate()}</span>
        <span className="text-[10px] font-bold text-[#6B7280] mt-0.5">{MONTHS_SHORT[s._d.getMonth()]}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.dot }} />
          <span className="text-[14px] font-extrabold truncate text-[#12172B]">{s.language}{s.level ? ` — ${s.level}` : ""}</span>
        </span>
        <span className="block text-[12px] text-[#6B7280] font-medium mt-0.5 truncate">
          {s._weekday} · {s._time}{s._end ? `–${s._end}` : ""}{s.durationMinutes ? ` · ${s.durationMinutes} mnt` : ""}
        </span>
        {s.teacher && (
          <span className="inline-flex items-center gap-1 text-[11px] text-[#9CA3AF] font-medium mt-0.5">
            <GraduationCap className="w-3 h-3" strokeWidth={2} /> {s.teacher}
          </span>
        )}
      </span>
    </button>
  );
}
