"use client";

// jadwal-gcal-v1: kartu "Sesi Mendatang" — PINDAHAN dari kolom kiri kalender di tab
// Jadwal. Di sana dia memaksa kalender berbagi lebar (kalender jadi sempit, kolomnya
// jangkung sendirian), padahal isinya justru yang paling sering dicari harian. Di
// Beranda dia jadi ringkasan; kalendernya sendiri sekarang lega penuh selebar layar.

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Video } from "lucide-react";
import { classRoomUrl, isJoinable } from "@/lib/classRoom";
import { useT } from "@/lib/uiLang"; // [ui-lang-switcher-v1]
import {
  LIVE_COLOR, LangFlag, LiveBadge, MONTHS_SHORT, countdownLabel, fmtTime, isDead, isLiveNow,
  langColor, langFlagCode, TeacherAvatar,
  type JadwalSession, type NormSession,
} from "./jadwalShared";

// [sesi-beruntun-gabung-v1] Dua sesi berturut-turut di hari & kelas yang sama
// (mis. 08.00–09.00 lalu 09.00–10.00) itu SATU kali datang buat siswa — dia masuk
// satu room, duduk dua jam. Dulu kartunya dua biji lengkap dengan dua tombol
// "Masuk Kelas", dan tombol kedua itu jebakan: room-nya beda dari yang lagi
// dipakai pengajar. Sekarang mereka dilebur jadi satu blok: nomor sesi ditulis
// rentang (#6–7), jamnya jam blok (08.00–10.00), tombolnya satu.
type SesiBlok = {
  key: string;
  items: NormSession[];
  /** Sesi pertama blok — dipakai buat tanggal, bahasa, level, pengajar. */
  head: NormSession;
  _d: Date;
  _time: string;
  /** Jam selesai sesi TERAKHIR di blok. */
  _end: string | null;
  _weekday: string;
  _live: boolean;
  totalMinutes: number;
  /** Sesi yang tombol "Masuk Kelas"-nya dipakai — yang sedang/paling dekat jalan. */
  join: NormSession | null;
};

/** Jeda maksimum antar-sesi yang masih dianggap satu blok (mis. istirahat 10 menit). */
const GAP_TOLERANCE_MS = 20 * 60_000;

function sameClass(a: NormSession, b: NormSession) {
  return (
    a.language === b.language &&
    (a.level || "") === (b.level || "") &&
    (a.teacher || "") === (b.teacher || "")
  );
}

function buildBlocks(list: NormSession[], now: number): SesiBlok[] {
  const out: SesiBlok[] = [];
  for (const s of list) {
    const last = out[out.length - 1];
    const prev = last?.items[last.items.length - 1];
    const prevEnd = prev ? prev._d.getTime() + (prev.durationMinutes || 60) * 60000 : 0;
    const nyambung =
      !!prev &&
      sameClass(prev, s) &&
      prev._d.toDateString() === s._d.toDateString() &&
      s._d.getTime() - prevEnd <= GAP_TOLERANCE_MS &&
      s._d.getTime() >= prevEnd - 60_000;
    if (nyambung) last.items.push(s);
    else out.push({ key: s.id, items: [s], head: s, _d: s._d, _time: s._time, _end: s._end, _weekday: s._weekday, _live: false, totalMinutes: 0, join: null });
  }
  return out.map((b) => {
    const tail = b.items[b.items.length - 1];
    const endMs = tail._d.getTime() + (tail.durationMinutes || 60) * 60000;
    return {
      ...b,
      _end: fmtTime(new Date(endMs)),
      _live: b.items.some((s) => s._live),
      totalMinutes: b.items.reduce((n, s) => n + (s.durationMinutes || 60), 0),
      // Room id itu per sesi (`sched-<id>`), jadi tombolnya harus menunjuk sesi
      // yang jamnya sedang jalan — kalau blok ini dipatok ke sesi pertama terus,
      // pukul 09.10 siswa masuk room kosong sementara pengajar ada di sesi kedua.
      join:
        b.items.find((s) => s._joinable && s._d.getTime() + (s.durationMinutes || 60) * 60000 > now) ||
        b.items.find((s) => s._joinable) ||
        null,
    };
  });
}

/** "#6–7" untuk nomor beruntun, "#6, #9" kalau lompat, "" kalau nomornya kosong. */
function nomorLabel(items: NormSession[]): string {
  const nums = items.map((s) => s.sessionNumber).filter((n): n is number => !!n);
  if (!nums.length) return "";
  if (nums.length === 1) return `#${nums[0]}`;
  const runut = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
  return runut ? `#${nums[0]}–${nums[nums.length - 1]}` : nums.map((n) => `#${n}`).join(", ");
}

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
            // jadwal-live-now-v1: sesi yang jamnya lagi jalan detik ini.
            _live: isLiveNow(d, s.durationMinutes, now, s.status),
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

  // jadwal-live-now-v1: kalau ada kelas yang lagi jalan, itu kabar paling penting
  // di kartu ini — dinaikkan ke subjudul, bukan cuma nempel di salah satu baris.
  const liveCount = upcoming.filter((s) => s._live).length;

  // [sesi-hari-ini-v1] Sesi hari ini dipisah dari sesi hari-hari berikutnya.
  // Sebelumnya semuanya satu tumpuk berurutan tanggal, jadi kelas yang tinggal
  // beberapa jam lagi (atau lagi jalan) kelihatan setara dengan kelas minggu
  // depan — padahal cuma baris pertama itu yang menentukan hari siswa.
  // [sesi-beruntun-gabung-v1] Daftarnya dipakai dalam bentuk BLOK, bukan sesi
  // satuan — 2×60 menit beruntun tampil sebagai satu kartu 08.00–10.00.
  const { hariIni, berikutnya } = useMemo(() => {
    const t = new Date(now);
    const sameDay = (d: Date) =>
      d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
    return {
      hariIni: buildBlocks(upcoming.filter((s) => sameDay(s._d)), now),
      berikutnya: buildBlocks(upcoming.filter((s) => !sameDay(s._d)), now),
    };
  }, [upcoming, now]);

  // Subjudul tetap menghitung SESI (bukan blok) — "2 sesi hari ini" itu yang
  // dibayar & dicatat siswa, sementara blok cuma cara menampilkannya.
  const sesiHariIni = hariIni.reduce((n, b) => n + b.items.length, 0);

  const [expanded, setExpanded] = useState(false);
  // Sesi hari ini TIDAK pernah kena potong `limit` — batasnya berlaku buat
  // hari-hari berikutnya saja.
  const visibleNanti = expanded ? berikutnya : berikutnya.slice(0, Math.max(1, limit - hariIni.length));
  const hidden = Math.max(0, berikutnya.length - visibleNanti.length);

  /* [beranda-insights-hook-order-v1] useT() harus di ATAS `if (!upcoming.length)`.
     Waktu masih di bawahnya, render sebelum jadwal datang (upcoming kosong →
     return null) menjalankan lebih sedikit hook daripada render sesudahnya →
     React error #310, dan yang mati bukan cuma kartu ini melainkan seluruh
     halaman /akun ("This page couldn't load"). */
  const t = useT(); // [ui-lang-switcher-v1]

  if (!upcoming.length) return null;

  const gridCls = layout === "column" ? "grid gap-2.5" : "grid gap-2.5 sm:grid-cols-2";
  const groupLabel = "mb-1.5 mt-3 text-[11px] font-extrabold uppercase tracking-wide text-[#6B7280] first:mt-0";

  // `sesi-mendatang-panel` / `sesi-mendatang-item` = penanda buat aturan dark mode
  // di StudentShell (panel hitam polos di mode gelap; mode terang tetap kartu putih).
  return (
    <div className="sesi-mendatang-panel rounded-3xl bg-white p-4 ring-1 ring-slate-200 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="inline-flex flex-wrap items-center gap-1.5 text-[16px] font-extrabold text-[#12172B]">
            <CalendarDays className="h-4 w-4 text-[#16796E]" strokeWidth={2.5} /> {t("Sesi Mendatang")}
            {liveCount > 0 && <LiveBadge />}
          </h3>
          <p className="mt-0.5 text-[12px] font-medium text-gray-500">
            {/* [sesi-hari-ini-v1] "hari ini" itu angka yang dicari duluan; total
                terjadwal jadi keterangan kedua. */}
            {sesiHariIni > 0
              ? `${sesiHariIni} ${t("sesi hari ini")} · ${upcoming.length} ${t("terjadwal")}`
              : `${upcoming.length} ${t("sesi terjadwal")} · ${t("semua kelas aktif")}`}
          </p>
        </div>
        <button
          onClick={goJadwal}
          className="inline-flex shrink-0 items-center gap-1 text-[12px] font-bold text-[#16796E] transition hover:text-[#0F5A52]"
        >
          {t("Buka Jadwal")} <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.6} />
        </button>
      </div>

      {/* Kolom utama Beranda itu lebar — satu lajur bikin kartunya melar & boros
          tinggi, jadi dua lajur begitu ada ruang. Kecuali dipasang sebagai kolom
          samping (layout="column"): di lebar ~360px dua lajur bikin isinya remuk.
          [sesi-hari-ini-v1] dua kelompok: "Hari Ini" lalu "Berikutnya". Judul
          kelompok cuma muncul kalau memang ada sesi hari ini — kalau tidak, kartu
          ini tetap satu daftar polos seperti sebelumnya. */}
      {hariIni.length > 0 && (
        <>
          <p className={groupLabel}>{t("Hari Ini")}</p>
          <div className={gridCls}>
            {hariIni.map((b) => (
              <SesiItem key={b.key} b={b} studentName={studentName} onClick={goJadwal} today now={now} />
            ))}
          </div>
        </>
      )}
      {visibleNanti.length > 0 && (
        <>
          {hariIni.length > 0 && <p className={groupLabel}>{t("Berikutnya")}</p>}
          <div className={gridCls}>
            {visibleNanti.map((b) => (
              <SesiItem key={b.key} b={b} studentName={studentName} onClick={goJadwal} now={now} />
            ))}
          </div>
        </>
      )}

      {(hidden > 0 || expanded) && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 w-full rounded-xl bg-[#F5F6F8] py-2 text-[12px] font-bold text-[#16796E] transition hover:bg-[#EAF3F2]"
        >
          {expanded ? t("Ringkas") : `${t("Lihat semua")} (${upcoming.length})`}
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
function SesiItem({ b, studentName, onClick, today = false, now }: {
  b: SesiBlok; studentName?: string; onClick: () => void;
  /** [sesi-hari-ini-v1] item di kelompok "Hari Ini" — nama hari diganti hitung mundur. */
  today?: boolean;
  now: number;
}) {
  const t = useT(); // [ui-lang-switcher-v1]
  const s = b.head;
  const c = langColor(s.language);
  const hasFlag = !!langFlagCode(s.language);
  const nomor = nomorLabel(b.items);
  const jumlah = b.items.length;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      className="sesi-mendatang-item cursor-pointer rounded-2xl bg-slate-50 p-3 text-left transition hover:bg-slate-100/70"
      // jadwal-live-now-v1: cincin merah — sama dengan blok di kalender.
      style={b._live ? { boxShadow: `0 0 0 2px ${LIVE_COLOR}` } : undefined}
    >
      <div className="flex w-full items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-white leading-none shadow-[0_10px_30px_-24px_rgba(18,23,43,.5)]">
          <span className="text-[15px] font-extrabold text-[#12172B]">{b._d.getDate()}</span>
          <span className="mt-0.5 text-[10px] font-bold text-[#6B7280]">{t(MONTHS_SHORT[b._d.getMonth()])}</span>
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
            {nomor ? (
              <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold" style={{ background: c.bg, color: c.text }}>{nomor}</span>
            ) : null}
          </span>
          <span className="mt-0.5 block truncate text-[12px] font-medium text-[#6B7280]">
            {b._live ? (
              <span className="font-bold" style={{ color: LIVE_COLOR }}>
                {t("Sedang berlangsung")}{b._end ? ` · ${t("selesai")} ${b._end}` : ""}
              </span>
            ) : today ? (
              // Nama harinya sudah dijawab judul kelompok — ruangnya dipakai buat
              // hitung mundur, yang justru dicari siswa di kelas hari ini.
              <>
                {b._time}{b._end ? `–${b._end}` : ""} · {b.totalMinutes} {t("mnt")}
                {jumlah > 1 ? ` · ${jumlah} ${t("sesi")}` : ""}
                {" · "}
                <span className="font-bold text-[#16796E]">{countdownLabel(b._d, now)}</span>
              </>
            ) : (
              <>
                {t(b._weekday)} · {b._time}{b._end ? `–${b._end}` : ""} · {b.totalMinutes} {t("mnt")}
                {jumlah > 1 ? ` · ${jumlah} ${t("sesi")}` : ""}
              </>
            )}
          </span>
          {s.teacher && (
            <span className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-[#6B7280]">
              <TeacherAvatar name={s.teacher} src={s.teacherAvatarUrl} size={18} />
              <span className="truncate">{s.teacher}</span>
            </span>
          )}
        </span>
      </div>

      {/* [sesi-beruntun-gabung-v1] SATU tombol per blok — menunjuk sesi yang
          room-nya sedang dipakai, bukan selalu sesi pertama. */}
      {b.join && (
        <a
          href={classRoomUrl(b.join.id, { title: `Kelas ${s.language}`, name: studentName })}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#16796E] px-3 py-2 text-[12px] font-extrabold text-white transition hover:bg-[#0F5A52]"
        >
          <Video className="h-3.5 w-3.5" strokeWidth={2.2} /> {t("Masuk Kelas")}
        </a>
      )}
    </div>
  );
}
