"use client";

// linguo-patch:akun-sertifikat-tab-v1
// Tab Sertifikat (CEFR) di /akun — port dari Claude Design frame (Sertifikat.html).
// Master-detail: list sertifikat (kiri) + detail (kanan: kartu sertifikat utk terbit,
// hero progress utk yg belum). Data diturunkan dari registrasi (sessions_used/total).
// Fallback dummy kalau `certs` kosong -> otomatis nyerah ke data real.
// Palet inline (config-independent): teal #16796E, accent #F2CB05, ink #12172B.

import { useMemo, useState } from "react";
import {
  Award, BadgeCheck, Lock, Download, Share2, Linkedin, ShieldCheck,
  Flag, Play, CalendarDays, Info, ChevronRight, GraduationCap,
} from "lucide-react";

export type Cert = {
  id: string;
  language: string;
  level: string;
  title: string;
  teacher: string;
  status: "issued" | "progress";
  date?: string;
  score?: number | string | null;
  hours?: number | null;
  idNo?: string | null;
  pct?: number;
  used?: number;
  total?: number;
};

type Col = { accent: string; bg: string; text: string };
const PALETTE: Col[] = [
  { accent: "#16796E", bg: "#16796E1A", text: "#0F5A52" },
  { accent: "#E11D48", bg: "#FFF1F2", text: "#BE123C" },
  { accent: "#4F46E5", bg: "#EEF2FF", text: "#4338CA" },
  { accent: "#D97706", bg: "#FFFBEB", text: "#B45309" },
  { accent: "#0EA5E9", bg: "#F0F9FF", text: "#0369A1" },
  { accent: "#7C3AED", bg: "#F5F3FF", text: "#6D28D9" },
  { accent: "#059669", bg: "#ECFDF5", text: "#047857" },
  { accent: "#EA580C", bg: "#FFF7ED", text: "#C2410C" },
];
const OVERRIDE: Record<string, number> = { Inggris: 0, English: 0, Jepang: 1, Japanese: 1, Korea: 2, Korean: 2 };
function colorOf(lang: string): Col {
  if (lang in OVERRIDE) return PALETTE[OVERRIDE[lang]];
  let h = 0;
  for (let i = 0; i < lang.length; i++) h = (h * 31 + lang.charCodeAt(i)) >>> 0;
  return PALETTE[3 + (h % (PALETTE.length - 3))];
}
const GLYPH: Record<string, string> = {
  Inggris: "Aa", English: "Aa", Jepang: "あ", Japanese: "あ", Korea: "한", Korean: "한",
  Mandarin: "中", Arab: "ع", Arabic: "ع", Rusia: "Я", Russian: "Я", Prancis: "Fr", French: "Fr",
  Jerman: "De", German: "De", Spanyol: "Es", Spanish: "Es",
};
const glyphOf = (lang: string) => GLYPH[lang] || (lang.slice(0, 2) || "Aa");

export default function SertifikatTab({
  studentName,
  certs,
  onContinue,
  onSchedule,
}: {
  studentName: string;
  certs: Cert[];
  onContinue?: () => void;
  onSchedule?: () => void;
}) {
  // dummy-fallback: kalau belum ada sertifikat/registrasi, tampilin contoh biar
  // halaman ke-preview. Otomatis nyerah ke data real begitu `certs` keisi.
  const DUMMY: Cert[] = useMemo(() => [
    { id: "d-eng-a2", language: "Inggris", level: "A2", title: "Elementary", teacher: "Sarah Wijaya", status: "issued", date: "14 Feb 2026", score: 88, hours: 32, idNo: "LING-EN-A2-204815" },
    { id: "d-jpn-a1", language: "Jepang", level: "A1.1", title: "Pemula", teacher: "Kenji Tanaka", status: "issued", date: "3 Apr 2026", score: 91, hours: 16, idNo: "LING-JP-A1-205533" },
    { id: "d-eng-b1", language: "Inggris", level: "B1", title: "Conversational", teacher: "Sarah Wijaya", status: "progress", pct: 75, used: 12, total: 16 },
    { id: "d-kor-a2", language: "Korea", level: "A2.1", title: "Pra-Menengah", teacher: "Min-ji Park", status: "progress", pct: 31, used: 5, total: 16 },
  ], []);
  const list = certs.length ? certs : DUMMY;

  const issuedCount = list.filter((c) => c.status === "issued").length;
  const lockedCount = list.filter((c) => c.status === "progress").length;

  const [selectedId, setSelectedId] = useState<string>(list[0]?.id);
  const selected = list.find((c) => c.id === selectedId) || list[0];

  if (!selected) {
    return (
      <div className="w-full">
        <div className="rounded-[26px] border border-slate-100 bg-white p-12 text-center shadow-[0_24px_60px_-40px_rgba(18,23,43,.45)]">
          <Award className="mx-auto mb-3 h-10 w-10 text-slate-300" strokeWidth={1.6} />
          <p className="text-[15px] font-extrabold text-[#12172B]">Belum ada sertifikat</p>
          <p className="mt-1 text-[13px] text-[#6B7280]">Sertifikat terbit otomatis setelah kamu menuntaskan satu sublevel (16 sesi) dan lulus penilaian akhir.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex min-w-0 flex-col-reverse overflow-hidden rounded-[26px] border border-slate-100 bg-white shadow-[0_24px_60px_-40px_rgba(18,23,43,0.45)] lg:flex-row">
        {/* LEFT: list */}
        <section className="flex w-full shrink-0 flex-col border-t border-slate-100 bg-white lg:w-[320px] lg:border-r lg:border-t-0">
          <div className="px-6 pb-3 pt-7">
            <h2 className="text-[18px] font-extrabold text-[#12172B]">Sertifikat</h2>
            <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">{issuedCount} terbit · {lockedCount} dalam proses</p>
          </div>
          <div className="flex max-h-[360px] flex-1 flex-col gap-2.5 overflow-y-auto px-4 pb-4 lg:max-h-none">
            {list.map((ct) => {
              const col = colorOf(ct.language);
              const active = ct.id === selected.id;
              return (
                <button
                  key={ct.id}
                  onClick={() => setSelectedId(ct.id)}
                  className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-[#F5F6F8]"
                  style={active ? { background: "#fff", outline: "2px solid #16796E", boxShadow: "0 16px 36px -22px rgba(18,23,43,.55)" } : undefined}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-extrabold" style={{ background: col.bg, color: col.text, opacity: ct.status === "progress" ? 0.6 : 1 }}>{glyphOf(ct.language)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-extrabold text-[#12172B]">{ct.language} — {ct.level}</span>
                    <span className="block truncate text-[12px] font-medium text-[#6B7280]">CEFR · {ct.title}</span>
                  </span>
                  {ct.status === "issued" ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-600"><BadgeCheck className="h-3.5 w-3.5" />Terbit</span>
                  ) : (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-[#6B7280]"><Lock className="h-3 w-3" />{ct.pct ?? 0}%</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="border-t border-slate-100 px-6 py-4">
            <div className="rounded-2xl bg-[#16796E0D] p-4">
              <p className="flex items-center gap-2 text-[13px] font-extrabold text-[#12172B]"><Info className="h-4 w-4 text-[#16796E]" />Tentang CEFR</p>
              <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-[#6B7280]">Sertifikat terbit otomatis setelah kamu menuntaskan satu sublevel (16 sesi) dan lulus penilaian akhir.</p>
            </div>
          </div>
        </section>

        {/* RIGHT: detail */}
        <main className="min-w-0 flex-1 bg-[#F5F6F8]">
          <div className="flex flex-col gap-6 p-6 lg:p-8">
            {selected.status === "issued" ? <IssuedDetail ct={selected} studentName={studentName} /> : <ProgressDetail ct={selected} onContinue={onContinue} onSchedule={onSchedule} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function IssuedDetail({ ct, studentName }: { ct: Cert; studentName: string }) {
  const col = colorOf(ct.language);
  const stats = [
    ct.score != null ? { k: "Nilai Akhir", v: `${ct.score}/100` } : null,
    ct.hours != null ? { k: "Jam Belajar", v: `${ct.hours} jam` } : null,
    ct.date ? { k: "Tanggal", v: ct.date } : null,
  ].filter(Boolean) as { k: string; v: string }[];
  return (
    <>
      <div
        className="relative overflow-hidden rounded-2xl bg-white"
        style={{
          border: "1px solid #ECECEC",
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(22,121,110,.05) 0 2px, transparent 2px 9px), repeating-linear-gradient(-45deg, rgba(22,121,110,.05) 0 2px, transparent 2px 9px)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 m-3 rounded-xl" style={{ border: `2px solid ${col.accent}1f` }} />
        <div className="pointer-events-none absolute inset-0 m-[18px] rounded-lg" style={{ border: `1px solid ${col.accent}40` }} />
        <div className="relative px-6 py-9 text-center sm:px-10">
          <div className="flex items-center justify-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: col.accent }}><GraduationCap className="h-5 w-5 text-white" /></span>
            <span className="text-[15px] font-extrabold tracking-tight text-[#12172B]">Linguo</span>
          </div>
          <p className="mt-6 text-[12px] font-bold uppercase tracking-[0.25em] text-[#6B7280]">Sertifikat Penyelesaian</p>
          <p className="mt-5 text-[13px] font-medium text-[#6B7280]">Diberikan kepada</p>
          <h2 className="mt-1 text-[26px] font-extrabold leading-tight text-[#12172B] sm:text-[30px]">{studentName}</h2>
          <div className="mx-auto mt-3 h-1 w-16 rounded-full" style={{ background: col.accent }} />
          <p className="mx-auto mt-5 max-w-[440px] text-[13px] font-medium leading-relaxed text-[#6B7280]">
            atas keberhasilan menuntaskan program <b className="text-[#12172B]">Bahasa {ct.language} — Level CEFR {ct.level}</b>{ct.title ? ` (${ct.title})` : ""} di Linguo.
          </p>
          {stats.length > 0 && (
            <div className="mx-auto mt-8 grid max-w-[440px] gap-4 text-left" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
              {stats.map((s) => (
                <div key={s.k}>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">{s.k}</p>
                  <p className="mt-0.5 text-[16px] font-extrabold text-[#12172B]">{s.v}</p>
                </div>
              ))}
            </div>
          )}
          <div className="mx-auto mt-9 flex max-w-[440px] items-end justify-between">
            <div className="text-left">
              <p className="text-[20px] font-bold italic text-[#12172B]">{ct.teacher}</p>
              <div className="mt-1 h-px w-36 bg-slate-300" />
              <p className="mt-1 text-[11px] font-semibold text-[#6B7280]">Pengajar</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ border: `2px solid ${col.accent}` }}><Award className="h-7 w-7" style={{ color: col.accent }} /></div>
          </div>
          {ct.idNo && <p className="mt-7 text-[11px] font-medium text-[#6B7280]">No. Sertifikat: {ct.idNo}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#16796E] px-6 text-[14px] font-extrabold text-white transition hover:bg-[#0F5A52]"><Download className="h-[18px] w-[18px]" />Unduh PDF</button>
        <button className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-[14px] font-bold text-[#12172B] transition hover:bg-slate-50"><Share2 className="h-[18px] w-[18px]" />Bagikan</button>
        <button className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-[14px] font-bold text-[#12172B] transition hover:bg-slate-50"><Linkedin className="h-[18px] w-[18px]" />Tambah ke LinkedIn</button>
        <button className="ml-auto inline-flex h-12 items-center gap-2 px-3 text-[13px] font-bold text-[#16796E] hover:underline"><ShieldCheck className="h-[18px] w-[18px]" />Verifikasi keaslian</button>
      </div>
    </>
  );
}

function ProgressDetail({ ct, onContinue, onSchedule }: { ct: Cert; onContinue?: () => void; onSchedule?: () => void }) {
  const col = colorOf(ct.language);
  const total = ct.total ?? 16;
  const used = ct.used ?? 0;
  const pct = ct.pct ?? (total > 0 ? Math.round((used / total) * 100) : 0);
  const remain = Math.max(0, total - used);
  return (
    <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_50px_-34px_rgba(18,23,43,.5)]">
      <div className="relative flex items-center gap-5 px-6 py-7 text-white sm:px-8" style={{ background: col.accent }}>
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-[34px] font-extrabold">{glyphOf(ct.language)}</span>
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold"><Lock className="h-3 w-3" />Belum Terbit</span>
          <h2 className="mt-2 text-[22px] font-extrabold leading-tight">{ct.language} — CEFR {ct.level}</h2>
          <p className="mt-1 text-[13px] font-medium text-white/85">{ct.title} · {ct.teacher}</p>
        </div>
        <div className="pointer-events-none ml-2 hidden shrink-0 opacity-90 md:flex">
          <div className="h-14 w-14 rotate-6 bg-white/25" style={{ clipPath: "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)", borderRadius: 8 }} />
          <div className="-ml-5 mt-4 h-16 w-16 bg-white/15" style={{ clipPath: "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)", borderRadius: 8 }} />
        </div>
      </div>
      <div className="px-6 py-7 sm:px-8">
        <div className="flex items-center justify-between text-[13px] font-bold text-[#12172B]">
          <span>Progress menuju sertifikat</span><span>{pct}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#E8EAEE]"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#16796E" }} /></div>
        <p className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-[#6B7280]"><Flag className="h-4 w-4 text-[#16796E]" />Tinggal <b className="text-[#12172B]">{remain} sesi</b> lagi ({used}/{total}) untuk membuka sertifikat ini.</p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 p-4 text-center"><p className="text-[22px] font-extrabold text-[#12172B]">{used}/{total}</p><p className="mt-1 text-[12px] font-medium text-[#6B7280]">Sesi Selesai</p></div>
          <div className="rounded-2xl border border-slate-100 p-4 text-center"><p className="text-[22px] font-extrabold text-[#12172B]">{remain}</p><p className="mt-1 text-[12px] font-medium text-[#6B7280]">Sesi Tersisa</p></div>
          <div className="rounded-2xl border border-slate-100 p-4 text-center"><p className="text-[22px] font-extrabold text-[#12172B]">CEFR {ct.level}</p><p className="mt-1 text-[12px] font-medium text-[#6B7280]">Target Level</p></div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button onClick={onContinue} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#16796E] px-6 text-[14px] font-extrabold text-white transition hover:bg-[#0F5A52]"><Play className="h-[18px] w-[18px]" />Lanjut Belajar</button>
          <button onClick={onSchedule} className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-[14px] font-bold text-[#12172B] transition hover:bg-slate-50"><CalendarDays className="h-[18px] w-[18px]" />Lihat Jadwal</button>
        </div>
      </div>
    </div>
  );
}
