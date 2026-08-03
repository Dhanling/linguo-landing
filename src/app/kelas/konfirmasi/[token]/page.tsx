"use client";

/* [konfirmasi-domain-linguo-v1] Konfirmasi jadwal kelas — siswa, tanpa login.
   Route: linguo.id/kelas/konfirmasi/<confirmation_token>.

   Pindahan dari dashboard staf (teach.linguo.id/confirm/<token>). Link ini dikirim
   ke grup WhatsApp kelas: alamat lama membawa siswa masuk ke aplikasi STAF, dan
   halamannya membaca tabel `schedules` langsung dengan anon key — padahal tabel itu
   tidak punya policy SELECT untuk anon, jadi siswa yang belum login SELALU melihat
   "Jadwal tidak ditemukan". Di sini datanya lewat edge function `schedule-public`
   (service role, token sebagai kunci). Rute lama dibiarkan hidup di dashboard supaya
   link yang sudah tersebar tidak mati.

   Namanya disapa pendek — "Kak Tasya", bukan "Tasya Ariesta Primastuty" — dan
   pengajarnya tampil dengan foto. Halaman ini dibuka dari grup kelas; sapaan yang
   dipakai sehari-hari di grup itu yang bikin pesannya terbaca sebagai kiriman orang,
   bukan notifikasi sistem. */

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  CalendarPlus, Check, CheckCircle2, Clock, Download, Loader2,
  RefreshCw, Rss, XCircle,
} from "lucide-react";
import {
  loadSchedule, actSchedule, sapaan, initial, subscribeUrl,
  type ActionResult, type ScheduleConfirmData, type PublicSchedule,
} from "@/lib/schedulePublic";

const BRAND = "#1A9E9E";

/* ── Waktu ───────────────────────────────────────────────────────────────────
   Selalu dirender di Asia/Jakarta. Labelnya tertulis "WIB", dan siswa yang sedang
   di luar negeri (atau HP-nya salah zona) tidak boleh melihat jam yang berbeda dari
   yang dipegang pengajarnya. */
const WIB = "Asia/Jakarta";

function tanggalPanjang(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: WIB,
  }).format(new Date(iso));
}

function jamWib(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: WIB,
  }).format(new Date(iso));
}

/* ── Kalender ────────────────────────────────────────────────────────────────
   Dua jalur, sengaja dua-duanya:
   • Sekali-klik (Google Calendar / unduh .ics) — instan, tapi SALINAN. Kalau
     jadwalnya digeser pengajar, kalender siswa TIDAK ikut berubah.
   • Langganan feed student-ics — sekali setup, semua jadwal ikut ter-update.
     Ini yang dianjurkan, makanya ditaruh sebagai baris kecil di bawah: yang
     buru-buru tetap kebantu tombol besarnya. */

function icsStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escIcs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function calendarEvent(s: PublicSchedule, pengajar: string) {
  const start = new Date(s.scheduled_at);
  const end = new Date(start.getTime() + (s.duration_minutes || 60) * 60_000);
  const title = `Kelas ${s.language || "Linguo"} — ${pengajar || "Pengajar"}`;
  const details = [
    s.session_title ? `Materi: ${s.session_title}` : "",
    s.notes ? `Catatan: ${s.notes}` : "",
    s.zoom_join_url ? `Link kelas: ${s.zoom_join_url}` : "",
    typeof window !== "undefined" ? `Konfirmasi kehadiran: ${window.location.href}` : "",
  ].filter(Boolean).join("\n");
  return { start, end, title, details };
}

function googleCalendarUrl(s: PublicSchedule, pengajar: string): string {
  const { start, end, title, details } = calendarEvent(s, pengajar);
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${icsStamp(start)}/${icsStamp(end)}`,
    details,
    ctz: WIB,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

function downloadIcs(s: PublicSchedule, pengajar: string) {
  const { start, end, title, details } = calendarEvent(s, pengajar);
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Linguo//Konfirmasi Jadwal//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${s.id}@linguo.id`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${escIcs(title)}`,
    `DESCRIPTION:${escIcs(details)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const url = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "kelas-linguo.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Foto orang; jatuh ke inisial kalau tidak ada fotonya (mayoritas data pengajar). */
function Avatar({ src, name, size = 40 }: { src?: string | null; name?: string | null; size?: number }) {
  const [gagal, setGagal] = useState(false);
  const px = { width: size, height: size };

  if (src && !gagal) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name || "Foto"}
        style={px}
        onError={() => setGagal(true)}
        className="shrink-0 rounded-full object-cover ring-2 ring-white/70"
      />
    );
  }
  return (
    <span
      style={{ ...px, background: "#e6f4f4", color: BRAND, fontSize: Math.round(size * 0.4) }}
      className="grid shrink-0 place-items-center rounded-full font-bold ring-2 ring-white/70"
    >
      {initial(name)}
    </span>
  );
}

export default function KonfirmasiJadwalPage() {
  const params = useParams<{ token: string | string[] }>();
  const token = String(Array.isArray(params?.token) ? params.token[0] : (params?.token ?? ""));

  const [data, setData] = useState<ScheduleConfirmData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [aksiErr, setAksiErr] = useState<string | null>(null);
  const [hasil, setHasil] = useState<ActionResult | null>(null);
  const [formBatal, setFormBatal] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let hidup = true;
    (async () => {
      if (!token) { setLoadErr("Link tidak lengkap."); setLoading(false); return; }
      try {
        const d = await loadSchedule(token);
        if (!hidup) return;
        setData(d);
        // Status akhir yang sudah tercatat di database ditampilkan sebagai hasil,
        // supaya siswa yang membuka ulang linknya tidak melihat tombol aksi lagi.
        if (d.schedule.status === "cancelled") setHasil("cancelled");
        if (d.schedule.status === "hangus") setHasil("hangus");
      } catch (e: any) {
        if (hidup) setLoadErr(e?.message || "Jadwal tidak ditemukan.");
      } finally {
        if (hidup) setLoading(false);
      }
    })();
    return () => { hidup = false; };
  }, [token]);

  const jalankan = useCallback(async (aksi: "confirm" | "attend" | "cancel" | "reschedule") => {
    setBusy(true);
    setAksiErr(null);
    try {
      const r = await actSchedule(token, aksi, aksi === "cancel" ? alasan : undefined);
      setHasil(r);
      if (r === "attended" && data) {
        setData({ ...data, schedule: { ...data.schedule, student_confirmed: true } });
      }
    } catch (e: any) {
      setAksiErr(e?.message || "Gagal memproses. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }, [token, alasan, data]);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: BRAND }} />
      </main>
    );
  }

  if (loadErr || !data) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
        <div className="max-w-sm text-center">
          <XCircle className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <h1 className="text-lg font-bold text-slate-800">{loadErr || "Jadwal tidak ditemukan"}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Coba buka lagi link terbaru dari grup kelas, atau tanyakan ke pengajarmu.
          </p>
        </div>
      </main>
    );
  }

  const { schedule: s, student, teacher } = data;
  const sapaSiswa = sapaan(student?.name, "Kak");
  const sapaPengajar = sapaan(teacher?.name, teacher?.title || "Kak");
  const feed = subscribeUrl(data.ics_token);
  const masihHidup = s.status === "scheduled" && !hasil;
  const tampilkanKalender = s.status === "scheduled" && !["cancelled", "hangus", "rescheduled"].includes(hasil ?? "");

  const salinFeed = async () => {
    try {
      await navigator.clipboard.writeText(feed);
    } catch {
      // Safari iOS di dalam WebView WhatsApp kadang menolak clipboard API —
      // prompt masih bisa disalin manual, lebih baik daripada gagal diam-diam.
      window.prompt("Salin link kalender ini:", feed);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:grid sm:place-items-center sm:py-10">
      <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Kepala */}
        <div className="px-5 py-5 text-white" style={{ background: BRAND }}>
          <div className="mb-3 text-[13px] font-bold tracking-wide">Linguo.id</div>
          <div className="flex items-center gap-3">
            <Avatar src={student?.avatar_url} name={student?.name} size={44} />
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight">Konfirmasi Jadwal Kelas</h1>
              <p className="truncate text-sm text-white/85">Halo, {sapaSiswa || "Kak"}!</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {/* Rincian */}
          <div className="mb-5 flex flex-col gap-2 rounded-xl bg-slate-50 p-4">
            <Baris label="Tanggal" value={tanggalPanjang(s.scheduled_at)} />
            <Baris label="Jam" value={`${jamWib(s.scheduled_at)} WIB`} />
            {s.duration_minutes ? <Baris label="Durasi" value={`${s.duration_minutes} menit`} /> : null}
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-slate-500">Pengajar</span>
              <span className="flex min-w-0 items-center gap-2">
                <Avatar src={teacher?.avatar_url} name={teacher?.name} size={26} />
                <span className="truncate font-semibold text-slate-800">{sapaPengajar || "Pengajar"}</span>
              </span>
            </div>
            {s.language ? <Baris label="Bahasa" value={s.language} /> : null}
            {s.session_number ? <Baris label="Pertemuan" value={`Sesi ${s.session_number}`} /> : null}
            {s.session_title ? <Baris label="Materi" value={s.session_title} /> : null}
            {s.notes ? <Baris label="Catatan" value={s.notes} /> : null}
          </div>

          {/* Masuk kalender — hanya untuk kelas yang masih berlaku. Setelah
              dibatalkan/hangus, menawarkan "tambah ke kalender" cuma bikin siswa
              menyimpan jadwal yang sudah mati. */}
          {tampilkanKalender && (
            <div className="mb-5 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={googleCalendarUrl(s, sapaPengajar)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2.5 text-xs font-semibold text-slate-700"
                >
                  <CalendarPlus className="h-3.5 w-3.5" /> Google Calendar
                </a>
                <button
                  type="button"
                  onClick={() => downloadIcs(s, sapaPengajar)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2.5 text-xs font-semibold text-slate-700"
                >
                  <Download className="h-3.5 w-3.5" /> Unduh .ics
                </button>
              </div>
              {feed && (
                <button
                  type="button"
                  onClick={salinFeed}
                  className="flex items-start gap-1.5 rounded-lg px-1 py-1 text-left text-[11px] leading-relaxed text-slate-500"
                >
                  {copied
                    ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                    : <Rss className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                  <span>
                    {copied
                      ? <><strong className="text-green-600">Link kalender disalin.</strong> Tempel di Google Calendar → Kalender lain → Dari URL.</>
                      : <><strong>Sinkron otomatis semua kelasmu</strong> — salin link langganan supaya jadwal baru & perubahan jadwal masuk sendiri ke kalendermu.</>}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Hasil */}
          {hasil === "confirmed" && (
            <Hasil
              icon={<CheckCircle2 className="h-12 w-12 text-green-500" />}
              judul="Kehadiran Terkonfirmasi!"
              teks={`Sampai jumpa di kelas bersama ${sapaPengajar || "pengajar kamu"}.`}
              warna="text-green-600"
            />
          )}
          {hasil === "attended" && (
            <Hasil
              icon={<CheckCircle2 className="h-12 w-12 text-green-500" />}
              judul="Terima kasih!"
              teks="Kehadiranmu sudah tercatat. Sampai jumpa di kelas berikutnya."
              warna="text-green-600"
            />
          )}
          {hasil === "cancelled" && (
            <Hasil
              icon={<XCircle className="h-12 w-12 text-slate-300" />}
              judul="Kelas Dibatalkan"
              teks="Pengajar sudah diberi tahu. Silakan atur jadwal baru lewat grup kelas."
              warna="text-slate-700"
            />
          )}
          {hasil === "hangus" && (
            <Hasil
              icon={<Clock className="h-12 w-12 text-red-500" />}
              judul="Sesi Hangus"
              teks="Pembatalan kurang dari 24 jam sebelum kelas — sesi terhitung terpakai."
              warna="text-red-600"
            />
          )}
          {hasil === "rescheduled" && (
            <Hasil
              icon={<RefreshCw className="h-12 w-12 text-blue-500" />}
              judul="Jadwal Diubah"
              teks="Jadwal lama dibatalkan. Silakan pilih jadwal baru bersama pengajarmu."
              warna="text-blue-600"
            />
          )}

          {/* Tombol aksi — kelas yang akan datang */}
          {masihHidup && (
            <>
              {s.is_hangus && (
                <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-700">
                  Kelas kurang dari 24 jam lagi. Reschedule sudah tidak tersedia, dan kalau
                  dibatalkan sesinya terhitung <strong>hangus</strong>.
                </p>
              )}

              {!formBatal ? (
                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => jalankan("confirm")}
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                    style={{ background: BRAND }}
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Saya Hadir
                  </button>
                  {s.can_reschedule && (
                    <button
                      type="button"
                      onClick={() => jalankan("reschedule")}
                      disabled={busy}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-blue-600 disabled:opacity-60"
                    >
                      <RefreshCw className="h-4 w-4" /> Ganti Jadwal
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setFormBatal(true)}
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-red-600 disabled:opacity-60"
                  >
                    <XCircle className="h-4 w-4" />
                    {s.is_hangus ? "Batalkan (Sesi Hangus)" : "Batalkan Kelas"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Alasan pembatalan (opsional)
                    </label>
                    <textarea
                      value={alasan}
                      onChange={(e) => setAlasan(e.target.value)}
                      rows={3}
                      placeholder="Misalnya: ada keperluan mendadak…"
                      className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => jalankan("cancel")}
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    Konfirmasi Batalkan{s.is_hangus ? " (Sesi Hangus)" : ""}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormBatal(false)}
                    disabled={busy}
                    className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-500"
                  >
                    Kembali
                  </button>
                </div>
              )}
            </>
          )}

          {/* Kelas sudah selesai — konfirmasi kehadiran susulan */}
          {!hasil && s.status === "completed" && (
            s.student_confirmed ? (
              <Hasil
                icon={<CheckCircle2 className="h-12 w-12 text-green-500" />}
                judul="Kehadiran Terkonfirmasi!"
                teks="Terima kasih sudah mengonfirmasi. Sampai jumpa di kelas berikutnya."
                warna="text-green-600"
              />
            ) : (
              <div className="flex flex-col gap-3">
                <div className="rounded-xl border p-4 text-center" style={{ borderColor: "#bfe3e3", background: "#f0fafa" }}>
                  <CheckCircle2 className="mx-auto mb-2 h-8 w-8" style={{ color: BRAND }} />
                  <p className="text-sm font-semibold" style={{ color: "#127373" }}>Kelas sudah selesai</p>
                  <p className="mt-1 text-xs text-slate-500">Mohon konfirmasi kehadiranmu di kelas ini.</p>
                </div>
                <button
                  type="button"
                  onClick={() => jalankan("attend")}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                  style={{ background: BRAND }}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Ya, Saya Hadir di Kelas Ini
                </button>
                <p className="text-center text-[11px] leading-relaxed text-slate-400">
                  Konfirmasi ini dipakai untuk memverifikasi kehadiran sebelum fee pengajar dicairkan.
                </p>
              </div>
            )
          )}

          {/* Status lain yang sudah tidak bisa diapa-apakan */}
          {!hasil && !masihHidup && s.status !== "completed" && (
            <p className="py-3 text-center text-sm text-slate-500">
              Jadwal ini sudah {s.status === "hangus" ? "hangus" : s.status === "cancelled" ? "dibatalkan" : "tidak aktif"}.
            </p>
          )}

          {aksiErr && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-center text-xs text-red-600">
              {aksiErr}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function Baris({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function Hasil({ icon, judul, teks, warna }: { icon: React.ReactNode; judul: string; teks: string; warna: string }) {
  return (
    <div className="py-3 text-center">
      <div className="mb-3 flex justify-center">{icon}</div>
      <h2 className={`text-lg font-bold ${warna}`}>{judul}</h2>
      <p className="mt-1 text-sm text-slate-500">{teks}</p>
    </div>
  );
}
