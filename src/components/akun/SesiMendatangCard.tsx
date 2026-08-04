"use client";

// jadwal-gcal-v1: kartu "Sesi Mendatang" — PINDAHAN dari kolom kiri kalender di tab
// Jadwal. Di sana dia memaksa kalender berbagi lebar (kalender jadi sempit, kolomnya
// jangkung sendirian), padahal isinya justru yang paling sering dicari harian. Di
// Beranda dia jadi ringkasan; kalendernya sendiri sekarang lega penuh selebar layar.

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Video } from "lucide-react";
import { classRoomUrl, isJoinable } from "@/lib/classRoom";
import {
  LangFlag, MONTHS_SHORT, fmtTime, isDead, langColor, langFlagCode, TeacherAvatar,
  type JadwalSession, type NormSession,
} from "./jadwalShared";

export default function SesiMendatangCard({
  sessions,
  studentName,
  onOpenJadwal,
  limit = 4,
  layout = "wide",
}: {
  sessions: JadwalSession[];
  studentName?: string;
  /** Buka tab Jadwal — kalender penuh (riwayat, bulan, minggu). */
  onOpenJadwal: () => void;
  limit?: number;
  /** "column" = kartu dipasang di kolom sempit (mis. sebelah kanan Kelas Kamu) → item 1 lajur. */
  layout?: "wide" | "column";
}) {
  // Satu patokan "sekarang" per render, disegarkan tiap menit buat hitung mundur
  // dan jendela tombol Masuk Kelas.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const upcoming = useMemo<NormSession[]>(
    () =>
      sessions
        .filter((s) => s.scheduledAt && !isDead(s.status))
        .map((s) => {
          const d = new Date(s.scheduledAt);
          const end = s.durationMinutes ? new Date(d.getTime() + s.durationMinutes * 60000) : null;
          return {
            ...s,
            _d: d,
            _iso: "",
            _time: fmtTime(d),
            _end: end ? fmtTime(end) : null,
            _weekday: d.toLocaleDateString("id-ID", { weekday: "long" }),
            _past: d.getTime() + (s.durationMinutes || 60) * 60000 < now,
            _joinable: isJoinable(d),
          };
        })
        .filter((s) => !s._past)
        .sort((a, b) => a._d.getTime() - b._d.getTime()),
    [sessions, now]
  );

  // [sesi-mendatang-klik-jadwal-v1] Kartu ini cuma ringkasan — apa pun yang diklik
  // di dalamnya (kecuali tombol Masuk Kelas) langsung membuka tab Jadwal. Ikut
  // digulir ke atas karena kartunya sering ada jauh di bawah lipatan layar: tanpa
  // itu tabnya sudah berganti tapi layar tetap diam, kelihatan seperti tak bereaksi.
  const goJadwal = () => {
    onOpenJadwal();
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? upcoming : upcoming.slice(0, limit);
  const hidden = Math.max(0, upcoming.length - visible.length);

  if (!upcoming.length) return null;

  // `sesi-mendatang-panel` / `sesi-mendatang-item` = penanda buat aturan dark mode
  // di StudentShell (panel hitam polos di mode gelap; mode terang tetap kartu putih).
  return (
    <div className="sesi-mendatang-panel rounded-3xl bg-white p-4 ring-1 ring-slate-200 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="inline-flex items-center gap-1.5 text-[16px] font-extrabold text-[#12172B]">
            <CalendarDays className="h-4 w-4 text-[#16796E]" strokeWidth={2.5} /> Sesi Mendatang
          </h3>
          <p className="mt-0.5 text-[12px] font-medium text-gray-500">
            {upcoming.length} sesi terjadwal · semua kelas aktif
          </p>
        </div>
        <button
          onClick={goJadwal}
          className="inline-flex shrink-0 items-center gap-1 text-[12px] font-bold text-[#16796E] transition hover:text-[#0F5A52]"
        >
          Buka Jadwal <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.6} />
        </button>
      </div>

      {/* Kolom utama Beranda itu lebar — satu lajur bikin kartunya melar & boros
          tinggi, jadi dua lajur begitu ada ruang. Kecuali dipasang sebagai kolom
          samping (layout="column"): di lebar ~360px dua lajur bikin isinya remuk. */}
      <div className={layout === "column" ? "grid gap-2.5" : "grid gap-2.5 sm:grid-cols-2"}>
        {visible.map((s) => (
          <SesiItem key={s.id} s={s} studentName={studentName} onClick={goJadwal} />
        ))}
      </div>

      {(hidden > 0 || expanded) && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 w-full rounded-xl bg-[#F5F6F8] py-2 text-[12px] font-bold text-[#16796E] transition hover:bg-[#EAF3F2]"
        >
          {expanded ? "Ringkas" : `Lihat semua (${upcoming.length})`}
        </button>
      )}
    </div>
  );
}

// [sesi-mendatang-3-baris-v1] Isi kartu dipangkas jadi TEPAT tiga baris — judul
// kelas, waktu, pengajar. Hitung mundur ("8 jam lagi") dan judul materi dibuang:
// keduanya sudah ada di tab Jadwal, dan di kartu ringkasan mereka cuma bikin tiap
// baris tinggi berbeda-beda sehingga daftarnya susah dipindai sekilas.
// Titik warna bahasa diganti bendera — "kelas apa" kebaca tanpa menghafal legenda.
function SesiItem({ s, studentName, onClick }: {
  s: NormSession; studentName?: string; onClick: () => void;
}) {
  const c = langColor(s.language);
  const hasFlag = !!langFlagCode(s.language);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      className="sesi-mendatang-item cursor-pointer rounded-2xl bg-slate-50 p-3 text-left transition hover:bg-slate-100/70"
    >
      <div className="flex w-full items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-white leading-none shadow-[0_10px_30px_-24px_rgba(18,23,43,.5)]">
          <span className="text-[15px] font-extrabold text-[#12172B]">{s._d.getDate()}</span>
          <span className="mt-0.5 text-[10px] font-bold text-[#6B7280]">{MONTHS_SHORT[s._d.getMonth()]}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            {hasFlag ? (
              <LangFlag language={s.language} h={12} />
            ) : (
              // Bahasa tanpa bendera (mis. Latin) tetap punya identitas warnanya.
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.dot }} />
            )}
            <span className="truncate text-[14px] font-extrabold text-[#12172B]">
              {s.language}{s.level ? ` — ${s.level}` : ""}
            </span>
            {s.sessionNumber ? (
              <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold" style={{ background: c.bg, color: c.text }}>#{s.sessionNumber}</span>
            ) : null}
          </span>
          <span className="mt-0.5 block truncate text-[12px] font-medium text-[#6B7280]">
            {s._weekday} · {s._time}{s._end ? `–${s._end}` : ""}{s.durationMinutes ? ` · ${s.durationMinutes} mnt` : ""}
          </span>
          {s.teacher && (
            <span className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-[#6B7280]">
              <TeacherAvatar name={s.teacher} src={s.teacherAvatarUrl} size={18} />
              <span className="truncate">{s.teacher}</span>
            </span>
          )}
        </span>
      </div>

      {s._joinable && (
        <a
          href={classRoomUrl(s.id, { title: `Kelas ${s.language}`, name: studentName })}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#16796E] px-3 py-2 text-[12px] font-extrabold text-white transition hover:bg-[#0F5A52]"
        >
          <Video className="h-3.5 w-3.5" strokeWidth={2.2} /> Masuk Kelas
        </a>
      )}
    </div>
  );
}
