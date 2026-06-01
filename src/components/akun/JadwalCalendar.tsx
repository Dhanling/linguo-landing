"use client";

// akun-jadwal-tab-v1 — Kalender jadwal LMS buat tab "Jadwal" di /akun.
// Dipanggil dari src/app/akun/page.tsx (activeTab === "jadwal").
// Props di-map dari state upcomingSchedules + registrasi Reguler ber-batch.
// Warna config-independent (hex inline), support 60+ bahasa via langColor().

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Video,
  GraduationCap,
  ClipboardList,
} from "lucide-react";

export type JadwalSession = {
  id: string;
  scheduledAt: string; // ISO
  durationMinutes?: number | null;
  language: string;
  level?: string;
  product?: string;
  teacher?: string;
};

export type JadwalRegularBatch = {
  id: string;
  language: string;
  batchCode: string;
  scheduleDay: string;
  scheduleTime: string;
  zoomLink?: string | null;
};

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
const LANG_OVERRIDE: Record<string, number> = {
  Inggris: 0, English: 0,
  Jepang: 1, Japanese: 1,
  Korea: 2, Korean: 2,
};
function langColor(language: string): LangColor {
  if (language in LANG_OVERRIDE) return PALETTE[LANG_OVERRIDE[language]];
  let h = 0;
  for (let i = 0; i < language.length; i++) h = (h * 31 + language.charCodeAt(i)) >>> 0;
  return PALETTE[3 + (h % (PALETTE.length - 3))];
}

type Item = JadwalSession & { dt: Date; iso: string; startTime: string; endTime?: string };

export default function JadwalCalendar({
  sessions,
  regularBatches = [],
}: {
  sessions: JadwalSession[];
  regularBatches?: JadwalRegularBatch[];
}) {
  const today = useMemo(() => new Date(), []);
  const todayIso = ymd(today);

  const items = useMemo<Item[]>(() => {
    return sessions
      .map((s) => {
        const dt = new Date(s.scheduledAt);
        const end = s.durationMinutes ? new Date(dt.getTime() + s.durationMinutes * 60000) : null;
        return { ...s, dt, iso: ymd(dt), startTime: fmtTime(dt), endTime: end ? fmtTime(end) : undefined };
      })
      .sort((a, b) => a.dt.getTime() - b.dt.getTime());
  }, [sessions]);

  const [view, setView] = useState<{ y: number; m: number }>({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState<string | null>(null);

  const eventsOn = (iso: string) => items.filter((s) => s.iso === iso);

  const legend = useMemo(() => {
    const seen = new Map<string, LangColor>();
    for (const s of items) if (!seen.has(s.language)) seen.set(s.language, langColor(s.language));
    return Array.from(seen.entries()).slice(0, 6);
  }, [items]);

  const sideList = useMemo(() => (selected ? eventsOn(selected) : items), [items, selected]);

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

  function selTitle(iso: string) {
    const [yy, mm, dd] = iso.split("-").map(Number);
    return `${dd} ${MONTHS[mm - 1]} ${yy}`;
  }

  return (
    <div className="flex flex-col gap-5 p-6 lg:p-8">
      <div>
        <h1 className="text-[24px] font-extrabold leading-tight text-[#12172B] sm:text-[26px]">Jadwal</h1>
        <p className="mt-1 text-[13px] font-medium text-gray-500">
          {items.length > 0 ? `${items.length} sesi mendatang · semua kelas live kamu` : "Belum ada sesi terjadwal"}
        </p>
      </div>

      {/* Jadwal Tetap (Kelas Reguler) — strip ekstra, ga ada di frame tapi penting (zoom link + jadwal rutin) */}
      {regularBatches.length > 0 && (
        <div>
          <h3 className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-700">
            <ClipboardList className="h-4 w-4 text-[#16796E]" strokeWidth={2.5} />Jadwal Tetap (Kelas Reguler)
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {regularBatches.map((b) => {
              const c = langColor(b.language);
              return (
                <div key={b.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_10px_30px_-24px_rgba(18,23,43,.5)]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: c.bg }}>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.dot }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#12172B]">{b.language} · {b.batchCode}</p>
                    <p className="text-xs text-gray-500">Setiap {b.scheduleDay}, {b.scheduleTime} WIB</p>
                  </div>
                  {b.zoomLink && (
                    <a href={b.zoomLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-[#16796E] hover:text-[#0F5A52]">
                      <Video className="h-3.5 w-3.5" strokeWidth={2.5} />Zoom
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Card kalender — style sodaraan sama tab Kelas & Materi */}
      <div className="flex flex-col-reverse overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_24px_50px_-34px_rgba(18,23,43,0.5)] lg:grid lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* LEFT: Sesi Mendatang + legend */}
        <aside className="flex flex-col border-t border-slate-100 bg-white lg:border-r lg:border-t-0">
          <div className="flex items-center justify-between px-6 pb-3 pt-6">
            <div>
              <h2 className="text-[18px] font-extrabold text-[#12172B]">{selected ? selTitle(selected) : "Sesi Mendatang"}</h2>
              <p className="mt-0.5 text-[12px] font-medium text-gray-500">{selected ? `${sideList.length} sesi terjadwal` : "Semua kelas aktif"}</p>
            </div>
            {selected && (
              <button onClick={() => setSelected(null)} className="whitespace-nowrap text-[12px] font-bold text-[#16796E] hover:text-[#0F5A52]">Semua</button>
            )}
          </div>

          <div className="flex max-h-[340px] flex-1 flex-col gap-2.5 overflow-y-auto px-4 pb-4 lg:max-h-none">
            {sideList.length ? (
              sideList.map((s) => <SideItem key={s.id} s={s} onClick={() => setSelected(s.iso)} />)
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white px-4 py-10 text-center">
                <Calendar className="mx-auto mb-2 h-10 w-10 text-gray-300" strokeWidth={1.5} />
                <p className="text-[13px] font-medium text-gray-500">Belum ada jadwal mendatang</p>
                <p className="mt-1 text-[12px] text-gray-400">Hubungi admin untuk atur jadwal kelasmu</p>
              </div>
            )}
          </div>

          {legend.length > 0 && (
            <div className="border-t border-slate-100 px-6 py-4">
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-gray-500">Bahasa</p>
              <div className="flex flex-col gap-2 text-[13px] font-semibold text-[#12172B]">
                {legend.map(([lang, c]) => (
                  <span key={lang} className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-full" style={{ background: c.dot }} />{lang}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT: kalender */}
        <main className="flex min-w-0 flex-col bg-[#F5F6F8]">
          <div className="flex items-center justify-between px-6 pt-6 lg:px-8">
            <h2 className="text-[20px] font-extrabold text-[#12172B]">{MONTHS[view.m]} {view.y}</h2>
            <div className="flex items-center gap-2">
              <button onClick={goToday} className="h-10 rounded-xl bg-white px-4 text-[13px] font-bold text-[#12172B] shadow-[0_10px_30px_-22px_rgba(18,23,43,0.6)] transition hover:bg-slate-50">Hari ini</button>
              <button onClick={() => gotoMonth(-1)} aria-label="Bulan sebelumnya" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#12172B] shadow-[0_10px_30px_-22px_rgba(18,23,43,0.6)] transition hover:bg-slate-50">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => gotoMonth(1)} aria-label="Bulan berikutnya" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#12172B] shadow-[0_10px_30px_-22px_rgba(18,23,43,0.6)] transition hover:bg-slate-50">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 px-6 pb-8 pt-4 lg:px-8">
            <div className="rounded-[2rem] bg-white p-3 shadow-[0_24px_50px_-34px_rgba(18,23,43,.5)] sm:p-4">
              <div className="grid grid-cols-7 pb-2 text-center text-[12px] font-bold text-gray-500">
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
                        "flex min-h-[72px] flex-col gap-1 rounded-xl p-1.5 text-left transition sm:min-h-[96px] sm:p-2",
                        evs.length ? "cursor-pointer hover:bg-white" : "cursor-default",
                        weekend ? "bg-[#F5F6F8]/60" : "bg-[#F5F6F8]",
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
                          return (
                            <span key={e.id} className="flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-tight" style={{ background: c.bg, color: c.text }}>
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c.dot }} />
                              <span className="truncate">{e.startTime} {e.language}</span>
                            </span>
                          );
                        })}
                        {evs.length > 2 && (
                          <span className="pl-1 text-[10px] font-bold text-gray-500">+{evs.length - 2} lagi</span>
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
}

function SideItem({ s, onClick }: { s: Item; onClick: () => void }) {
  const c = langColor(s.language);
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-[0_10px_30px_-24px_rgba(18,23,43,.5)] transition hover:-translate-y-0.5 hover:border-[#16796E]/20"
    >
      <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[#F5F6F8] leading-none">
        <span className="text-[15px] font-extrabold text-[#12172B]">{s.dt.getDate()}</span>
        <span className="mt-0.5 text-[10px] font-bold text-gray-500">{MONTHS_SHORT[s.dt.getMonth()]}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.dot }} />
          <span className="truncate text-[14px] font-extrabold text-[#12172B]">{s.language}{s.level ? ` — ${s.level}` : ""}</span>
        </span>
        <span className="mt-0.5 block truncate text-[12px] font-medium text-gray-500">
          {s.dt.toLocaleDateString("id-ID", { weekday: "long" })} · {s.startTime}{s.endTime ? `–${s.endTime}` : ""} WIB{s.durationMinutes ? ` · ${s.durationMinutes} mnt` : ""}
        </span>
        {s.teacher && (
          <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-400">
            <GraduationCap className="h-3 w-3" strokeWidth={2} />{s.teacher}
          </span>
        )}
      </span>
    </button>
  );
}
