'use client';

// [kelas-detail-page-v1] Konten halaman detail kelas /akun/kelas/[id].
// Dulu ini ClassDetailModal (popup di beranda) — 5 tab + flow reschedule/cancel
// kelewat berat buat modal (modal numpuk modal), jadi dinaikkan ke halaman penuh:
// deep-linkable (?tab=progress), tombol back browser jalan, lega di mobile.
// Reschedule & cancel TETAP modal — di situ modal memang tepat (keputusan singkat).

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { getFlagUrl, getLangPhoto, langGlyph } from '@/lib/lang-visuals';
import { displayLanguage } from '@/lib/classLanguage';
// [teacher-sapaan-v1] siswa manggil pengajarnya "Kak Dhani", bukan nama lengkap
import { sapaan } from '@/lib/teacherName';
import ClassProgressTab from '@/components/akun/ClassProgressTab';
import ClassMateriTab from '@/components/akun/ClassMateriTab';
import ClassRaporTab from '@/components/akun/ClassRaporTab';
// [teacher-workspace-v1] PR punya siklus penuh: diberi pengajar → disetor di sini → dinilai
import ClassTugasTab from '@/components/akun/ClassTugasTab';
import { ArrowLeft, Calendar, TrendingUp, BookOpen, BarChart2, User, Clock, MessageCircle, ClipboardList, Check, PenLine, RotateCcw, X, CalendarClock, HelpCircle, AlertTriangle, type LucideIcon } from 'lucide-react';

interface Props {
  reg: any; // registration + join teachers(name, title, avatar_url)
  initialTab?: string | null;
  // [preview-keep-param-v1] POV staf: tautan kembali harus tetap membawa ?preview=,
  // kalau tidak halaman /akun kehilangan identitas pratinjau → mendarat di gate login.
  previewStudentId?: string | null;
  // Jadwal hasil endpoint pratinjau (service role). Di mode pratinjau query
  // `schedules` biasa selalu kosong karena RLS memblok anon.
  previewSchedules?: any[] | null;
}

// [kelas-tab-ramping-v1] Tab Overview & Jadwal dihapus. Isinya dulu tumpang tindih:
// "Sesi Berikutnya" kini kartu tetap di atas tab bar (selalu kelihatan, tak perlu
// diklik), dan seluruh daftar sesi pindah jadi linimasa milestone di tab Materi —
// yang otomatis jadi tab pertama karena itu yang paling sering dibuka siswa.
export type ClassTab = 'materi' | 'progress' | 'tugas' | 'rapor';
type CancelStep = 'confirm' | 'form';

const TABS: { id: ClassTab; label: string; icon: LucideIcon }[] = [
  { id: 'materi', label: 'Materi', icon: BookOpen },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'tugas', label: 'Tugas', icon: PenLine },
  { id: 'rapor', label: 'Rapor', icon: BarChart2 },
];

const isValidTab = (t: string | null | undefined): t is ClassTab =>
  !!t && TABS.some((x) => x.id === t);

// [sesi-berikutnya-v1] Label hitung mundur ringkas. `now` sengaja dioper (bukan
// Date.now() di dalam) supaya nilainya ikut state `tick` — kalau tidak, React
// tak punya alasan me-render ulang dan labelnya membeku.
function hitungMundur(dt: Date, now: number): string {
  const menit = Math.round((dt.getTime() - now) / 60_000);
  if (menit <= 0) return 'sedang berlangsung';
  if (menit < 60) return `${menit} menit lagi`;
  const jam = Math.round(menit / 60);
  if (jam < 24) return `${jam} jam lagi`;
  const hari = Math.round(jam / 24);
  return hari === 1 ? 'besok' : `${hari} hari lagi`;
}

export default function ClassDetailView({ reg, initialTab, previewStudentId = null, previewSchedules = null }: Props) {
  const [activeTab, setActiveTabState] = useState<ClassTab>(isValidTab(initialTab) ? initialTab : 'materi');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Reschedule state
  const [rescheduleSched, setRescheduleSched] = useState<any>(null);
  const [availSlots, setAvailSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());

  // Cancel state
  const [cancelSched, setCancelSched] = useState<any>(null);
  const [cancelStep, setCancelStep] = useState<CancelStep>('confirm');
  const [cancelReason, setCancelReason] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
  // [sesi-berikutnya-v1] Detak menit buat label hitung mundur — tanpa ini halaman
  // yang dibiarkan terbuka akan terus menampilkan "3 jam lagi" sampai di-refresh.
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // [modal-esc-v1] Esc menutup modal. Refleks standar yang selama ini absen —
  // di desktop satu-satunya jalan keluar cuma tombol ✕ yang kecil.
  useEffect(() => {
    if (!rescheduleSched && !cancelSched) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || isProcessing) return;
      if (rescheduleSched) { setRescheduleSched(null); setSelectedSlot(null); }
      else { setCancelSched(null); setCancelReason(''); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rescheduleSched, cancelSched, isProcessing]);

  // Sinkron tab ke URL (?tab=) tanpa re-render route — biar bisa di-share/refresh.
  function setActiveTab(t: ClassTab) {
    setActiveTabState(t);
    try {
      const url = new URL(window.location.href);
      if (t === 'materi') url.searchParams.delete('tab');
      else url.searchParams.set('tab', t);
      window.history.replaceState(null, '', url.toString());
    } catch {}
  }

  useEffect(() => {
    if (!reg) return;
    if (previewStudentId) {
      setSchedules(previewSchedules || []);
      setLoading(false);
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reg?.id, previewStudentId, previewSchedules]);

  // [teacher-avatar-sync-v1] Tambal data pengajar dari tabel `teachers` (sumber yang
  // SAMA dgn dashboard admin & pengajar) kalau reg (dari handoff/cache lama) belum
  // membawa avatar_url — foto pengajar tetap muncul & sinkron.
  const [teacherFix, setTeacherFix] = useState<any>(null);
  useEffect(() => {
    if (!reg?.teacher_id || reg?.teachers?.avatar_url) { setTeacherFix(null); return; }
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from('teachers')
        .select('name, title, avatar_url')
        .eq('id', reg.teacher_id)
        .maybeSingle();
      if (alive && data) setTeacherFix(data);
    })();
    return () => { alive = false; };
  }, [reg?.teacher_id, reg?.teachers?.avatar_url]);

  // [kelas-tab-badge-v1] Jumlah isi tiap tab, dipakai buat badge di tab bar.
  // Tanpa ini siswa harus mengklik 6 tab satu-satu cuma buat tahu mana yang ada
  // isinya — Materi/Rapor/Tugas jadi jarang dibuka padahal isinya penting.
  // SEMUA query di sini boleh gagal (tabel belum dimigrasi, RLS, mode pratinjau):
  // kalau gagal badge-nya cuma tidak muncul, halaman TIDAK boleh ikut error.
  const [counts, setCounts] = useState<{ materi: number; rapor: number; tugasBaru: number }>({ materi: 0, rapor: 0, tugasBaru: 0 });
  useEffect(() => {
    if (!reg?.id || previewStudentId) return;
    let alive = true;
    (async () => {
      const [mat, rap, sub] = await Promise.all([
        supabase.from('class_materials').select('id', { count: 'exact', head: true }).eq('registration_id', reg.id),
        supabase.from('class_reports').select('id', { count: 'exact', head: true }).eq('registration_id', reg.id).not('published_at', 'is', null),
        supabase.from('homework_submissions').select('schedule_id').eq('registration_id', reg.id),
      ]);
      if (!alive) return;
      const setoran = new Set((sub.data || []).map((s: any) => s.schedule_id));
      setCounts({
        materi: mat.count || 0,
        rapor: rap.count || 0,
        // "Baru" = PR yang diberi pengajar tapi belum disetor siswa — itu yang
        // butuh perhatian, bukan total PR (yang sudah dinilai tak perlu diungkit).
        tugasBaru: schedules.filter((s: any) => (s.homework || '').trim() && !setoran.has(s.id)).length,
      });
    })();
    return () => { alive = false; };
  }, [reg?.id, previewStudentId, schedules]);

  // [toast-satu-jalur-v1] Dulu sukses tampil sebagai toast rapi tapi kegagalan
  // memunculkan alert() bawaan browser — dua bahasa visual untuk kejadian yang sama.
  // Semua umpan balik sekarang lewat sini. Timer disimpan supaya toast beruntun
  // tidak saling memotong dan tidak menyisakan timer saat komponen dilepas.
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  function flashToast(msg: string, err = false) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, err });
    toastTimer.current = setTimeout(() => setToast(null), err ? 5000 : 3000);
  }

  async function fetchData() {
    setLoading(true);
    const { data: s } = await supabase
      .from('schedules')
      .select('*')
      .eq('registration_id', reg.id)
      .order('scheduled_at', { ascending: true });
    setSchedules(s || []);
    setLoading(false);
  }

  async function openReschedule(sched: any) {
    setSelectedSlot(null);
    setRescheduleSched(sched);
    const [{ data: avail }, { data: booked }] = await Promise.all([
      supabase.from('teacher_availability').select('day_of_week, time_slot').eq('teacher_id', reg.teacher_id),
      supabase.from('schedules').select('scheduled_at, id').eq('teacher_id', reg.teacher_id).in('status', ['pending', 'scheduled']),
    ]);
    setAvailSlots(avail || []);
    const bSet = new Set<string>();
    (booked || []).forEach((b: any) => { if (b.id !== sched.id) bSet.add(b.scheduled_at); });
    setBookedSlots(bSet);
  }

  async function submitReschedule() {
    if (!rescheduleSched || !selectedSlot) return;
    setIsProcessing(true);
    const { error } = await supabase
      .from('schedules')
      .update({
        scheduled_at: selectedSlot,
        status: 'pending',
        student_confirmed: true,
        student_confirmed_at: new Date().toISOString(),
        notes: 'Sesi di-reschedule oleh siswa, menunggu konfirmasi pengajar',
      })
      .eq('id', rescheduleSched.id);
    setIsProcessing(false);
    if (error) { flashToast('Gagal mengubah jadwal: ' + error.message, true); return; }
    setRescheduleSched(null);
    setSelectedSlot(null);
    flashToast('Jadwal berhasil diubah. Menunggu konfirmasi pengajar.');
    await fetchData();
  }

  // Dipanggil saat user klik tombol Batalkan di kartu jadwal
  function requestCancel(sched: any) {
    const hoursUntil = (new Date(sched.scheduled_at).getTime() - Date.now()) / 3600_000;
    setCancelSched(sched);
    setCancelReason('');
    // <24 jam: lewati step opsi reschedule (reschedule memang tak diizinkan)
    setCancelStep(hoursUntil > 24 ? 'confirm' : 'form');
  }

  async function submitCancel() {
    if (!cancelSched) return;
    if (!cancelReason.trim()) { flashToast('Mohon isi alasan pembatalan dulu ya.', true); return; }
    const hoursUntil = (new Date(cancelSched.scheduled_at).getTime() - Date.now()) / 3600_000;
    const willBeHangus = hoursUntil <= 24;

    setIsProcessing(true);
    const { error } = await supabase
      .from('schedules')
      .update({
        status: willBeHangus ? 'hangus' : 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: cancelReason,
        cancelled_by: 'student',
      })
      .eq('id', cancelSched.id);

    if (!error && willBeHangus) {
      await supabase
        .from('registrations')
        .update({ sessions_used: (reg.sessions_used || 0) + 1 })
        .eq('id', reg.id);
    }

    setIsProcessing(false);
    if (error) { flashToast('Gagal membatalkan sesi: ' + error.message, true); return; }
    const savedHangus = willBeHangus;
    setCancelSched(null);
    setCancelReason('');
    flashToast(savedHangus ? 'Sesi dibatalkan & terhitung terpakai. Pengajar diberitahu.' : 'Sesi dibatalkan. Pengajar diberitahu.');
    await fetchData();
  }

  if (!reg) return null;

  function buildSlotGrid() {
    const slots: { iso: string; label: string; past: boolean; booked: boolean; isCurrent: boolean }[] = [];
    const now = new Date();
    const currentISO = rescheduleSched?.scheduled_at;
    for (let d = 0; d < 14; d++) {
      const day = new Date(now);
      day.setDate(now.getDate() + d);
      const dow = day.getDay();
      const dayAvail = availSlots.filter((a: any) => a.day_of_week === dow);
      for (const slot of dayAvail) {
        const [hh, mm] = slot.time_slot.split(':').map(Number);
        const dt = new Date(day);
        dt.setHours(hh, mm, 0, 0);
        const iso = dt.toISOString();
        slots.push({
          iso,
          label: dt.toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
          past: dt.getTime() < Date.now(),
          booked: bookedSlots.has(iso),
          isCurrent: iso === currentISO,
        });
      }
    }
    return slots;
  }

  const teacher = (reg.teachers || teacherFix) ? { ...(reg.teachers || {}), ...(teacherFix || {}) } : null;
  const teacherName = sapaan(teacher?.name, teacher?.title);
  // [blok-sync-v2] sessions_used bisa tertinggal dari presensi yang tercatat di `schedules`
  // (sesi ditandai selesai lewat menu Jadwal / konfirmasi siswa cuma menyentuh baris
  // schedule). Dashboard pengajar & tab Progress memakai yang terbesar — samakan di sini
  // supaya "Progress Sesi" tidak menyebut angka yang berbeda dari grid presensinya.
  const sesiTerpakai = Math.min(
    reg.sessions_total || Infinity,
    Math.max(reg.sessions_used || 0, schedules.filter((s: any) => s.status === 'completed').length),
  );
  const progress = reg.sessions_total ? Math.round((sesiTerpakai / reg.sessions_total) * 100) : 0;
  const sisaSesi = Math.max(0, (reg.sessions_total || 0) - sesiTerpakai);
  const selesai = (reg.sessions_total > 0 && sesiTerpakai >= reg.sessions_total) || !!reg.archived_at;
  const photo = getLangPhoto(reg.language);
  // Sesi terdekat yang belum lewat (schedules sudah terurut menaik dari query).
  // Riwayat sesi tidak lagi dihitung di sini — linimasa milestone di tab Materi
  // yang memegangnya.
  const upcoming = schedules.filter((s: any) => ['pending', 'scheduled'].includes(s.status) && new Date(s.scheduled_at).getTime() > Date.now() - 3600_000);
  const nextSched = upcoming[0] || null;
  // [wa-prefill-v1] Bawa konteks kelasnya ke chat — admin tak perlu tanya balik
  // "ini kelas yang mana ya kak".
  const waAdminUrl = `https://wa.me/6282116859493?text=${encodeURIComponent(
    `Halo Admin Linguo, saya mau tanya soal kelas ${displayLanguage(reg.language)} ${reg.level || ''}`.trim(),
  )}`;

  return (
    <main className="mx-auto w-full max-w-[1000px] px-4 pb-16 pt-5 sm:px-6">
      {/* Back */}
      <Link href={previewStudentId ? `/akun?preview=${encodeURIComponent(previewStudentId)}` : "/akun"} prefetch className="inline-flex items-center gap-1.5 text-[13px] font-bold text-gray-500 transition hover:text-[#16796E]">
        <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Kembali ke Beranda
      </Link>

      {/* ── Hero ── */}
      <div className="relative mt-4 overflow-hidden rounded-3xl bg-[#16796E]">
        <div className={`relative flex h-44 items-end sm:h-56 ${selesai ? 'grayscale' : ''}`}>
          {photo ? (
            <>
              <img src={photo} alt={reg.language} className="absolute inset-0 h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
            </>
          ) : (
            <>
              <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[110px] font-extrabold tracking-tight text-white/15 sm:text-[150px]">{langGlyph(reg.language)}</span>
              <div className="absolute -bottom-10 -left-6 h-36 w-36 rounded-full bg-white/10" />
            </>
          )}

          {/* Status badge */}
          {selesai ? (
            <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-gray-500">
              <Check className="h-3 w-3" strokeWidth={3} /> Selesai
            </span>
          ) : (
            <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[#16796E]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#16796E]" /> Aktif
            </span>
          )}

          {/* Judul */}
          <div className="relative w-full px-5 pb-5 sm:px-7 sm:pb-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/80">{reg.product || 'Kelas'}</div>
            <div className="mt-1 flex items-center gap-2.5">
              <img src={getFlagUrl(reg.language)} alt="" className="h-5 w-5 shrink-0 rounded-sm object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              <h1 className="truncate text-[24px] font-extrabold leading-tight text-white sm:text-[30px]">
                {displayLanguage(reg.language)} · {reg.level || 'TBD'}
              </h1>
            </div>
            {/* [kelas-header-paket-v1] Durasi & jumlah sesi nempel di header —
                itu identitas paketnya, sebaris dgn bahasa & levelnya. Total
                pembayaran sengaja TIDAK ditampilkan di sini (sudah ada di
                halaman Pembayaran). */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12px] font-semibold text-white/85">
              <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" strokeWidth={2.2} />{reg.duration || '-'} menit/sesi</span>
              <span className="inline-flex items-center gap-1.5"><ClipboardList className="h-3.5 w-3.5" strokeWidth={2.2} />Paket {reg.sessions_total || 0} sesi</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Info strip: pengajar + progress + chips ── */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {teacherName ? (
          <div className="flex items-center gap-3 rounded-2xl bg-[#F0FAF8] p-4">
            {teacher?.avatar_url ? (
              <img src={teacher.avatar_url} alt={teacherName} className="h-11 w-11 shrink-0 rounded-full bg-white object-cover" onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display = 'none'; el.nextElementSibling?.classList.remove('hidden'); }} />
            ) : null}
            <div className={`${teacher?.avatar_url ? 'hidden' : ''} flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#16796E]/10 text-[#16796E]`}>
              <User className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#16796E]">Pengajar</div>
              <div className="truncate text-[16px] font-extrabold text-[#12172B]">{teacherName}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-medium text-yellow-800">
            Pengajar belum di-assign. Hubungi admin untuk dipasangkan.
          </div>
        )}

        <div className="rounded-2xl bg-gray-50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-700">Progress Sesi</div>
            <div className="text-sm font-bold text-[#16796E]">{sesiTerpakai} / {reg.sessions_total || 0}</div>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-gradient-to-r from-[#16796E] to-emerald-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          {/* [kelas-progress-konteks-v1] "14 / 16" saja tidak memberi tahu apa-apa.
              Sisa sesi yang bikin siswa sadar kapan harus ambil paket berikutnya. */}
          {sisaSesi > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              Sisa <b className="text-gray-700">{sisaSesi} sesi</b> lagi di level ini
            </div>
          )}
          {selesai && (
            <div className="mt-2 text-xs text-gray-500">Semua sesi di level ini sudah selesai</div>
          )}
        </div>
      </div>

      {/* ── Sesi Berikutnya ──
          [sesi-berikutnya-v1] Yang paling dicari siswa saat membuka kelas adalah
          "kapan sesi saya berikutnya". [kelas-tab-ramping-v1] Dulu ini isi tab
          Overview; setelah tab itu dihapus kartunya naik jadi blok tetap di atas
          tab bar — tetap lengkap dengan aksinya (ubah jadwal / batalkan). */}
      {!loading && (
        <div className="mt-5">
          {nextSched ? (
            <div className="rounded-2xl border border-[#16796E]/25 bg-[#F0FAF8] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#16796E]">
                    <CalendarClock className="h-3.5 w-3.5" strokeWidth={2.4} /> Sesi Berikutnya
                  </div>
                  <div className="mt-1.5 text-[18px] font-extrabold leading-tight text-[#12172B] sm:text-[20px]">
                    {new Date(nextSched.scheduled_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                  <div className="mt-0.5 text-sm text-gray-600">
                    {new Date(nextSched.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    {' · '}{nextSched.duration_minutes || reg.duration || 60} menit
                    {nextSched.status === 'pending' ? ' · menunggu konfirmasi pengajar' : ''}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#16796E]">
                  {hitungMundur(new Date(nextSched.scheduled_at), tick)}
                </span>
              </div>
              <div className="mt-3.5 flex flex-wrap gap-2 border-t border-[#16796E]/20 pt-3">
                <button
                  onClick={() => openReschedule(nextSched)}
                  disabled={(new Date(nextSched.scheduled_at).getTime() - Date.now()) / 3600_000 <= 24}
                  title={(new Date(nextSched.scheduled_at).getTime() - Date.now()) / 3600_000 <= 24 ? 'Ubah jadwal hanya bisa lebih dari 24 jam sebelum sesi' : ''}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-[#16796E] hover:bg-white/70 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.4} /> Ubah Jadwal
                </button>
                <button
                  onClick={() => requestCancel(nextSched)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-white/70"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.6} /> Batalkan
                </button>
                <a
                  href={waAdminUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-2 py-2 text-xs font-bold text-gray-600 hover:text-[#16796E]"
                >
                  <MessageCircle className="h-3.5 w-3.5" strokeWidth={2.4} /> Chat Admin
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-gray-50 p-5 text-center">
              <Calendar className="mx-auto h-6 w-6 text-gray-400" strokeWidth={1.8} />
              <div className="mt-2 text-sm font-semibold text-gray-700">
                {selesai ? 'Kelas di level ini sudah selesai' : 'Belum ada sesi terjadwal'}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {selesai ? 'Mau lanjut ke level berikutnya? Hubungi admin.' : 'Hubungi admin untuk menjadwalkan sesi berikutnya.'}
              </div>
              <a href={waAdminUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#16796E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0F5A52]">
                <MessageCircle className="h-4 w-4" strokeWidth={2.4} /> Chat Admin
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── Tab bar (sticky di dalam panel scroll shell) ── */}
      <div className="sticky top-0 z-20 -mx-4 mt-6 border-b border-gray-200 bg-white/95 px-4 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex min-w-max overflow-x-auto" role="tablist">
          {TABS.map((t) => {
            const Icon = t.icon;
            const aktif = activeTab === t.id;
            // Badge: Tugas dihitung yang BELUM disetor (perlu aksi → amber),
            // Materi & Rapor cuma penanda "ada isinya" (netral).
            const badge = t.id === 'tugas' ? counts.tugasBaru : t.id === 'materi' ? counts.materi : t.id === 'rapor' ? counts.rapor : 0;
            const perluAksi = t.id === 'tugas';
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={aktif}
                onClick={() => setActiveTab(t.id)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${aktif ? 'border-[#16796E] text-[#16796E]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />{t.label}
                {badge > 0 && (
                  <span className={`ml-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${perluAksi ? 'bg-amber-100 text-amber-700' : aktif ? 'bg-[#16796E]/12 text-[#16796E]' : 'bg-gray-100 text-gray-600'}`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Konten tab ── */}
      <div className="pt-6">
        {loading && <div className="py-10 text-center text-gray-400">Memuat…</div>}

        {/* [kelas-tab-v1] Progress = skill CEFR (student_skills) + timeline laporan sesi */}
        {!loading && activeTab === 'progress' && <ClassProgressTab reg={reg} schedules={schedules} />}

        {/* [kelas-tab-v1] Materi = lampiran pengajar (class_materials) + recording sesi.
            [kelas-materi-milestone-v1] Sekaligus linimasa milestone seluruh sesi —
            makanya aksi ubah/batalkan jadwal ikut dioper ke sini. */}
        {!loading && activeTab === 'materi' && (
          <ClassMateriTab
            reg={reg}
            schedules={schedules}
            teacherName={teacherName}
            sesiTerpakai={sesiTerpakai}
            onReschedule={openReschedule}
            onCancel={requestCancel}
          />
        )}

        {/* [teacher-workspace-v1] Tugas = PR per sesi + setoran siswa + penilaian pengajar */}
        {!loading && activeTab === 'tugas' && <ClassTugasTab reg={reg} schedules={schedules} />}

        {/* [kelas-tab-v1] Rapor = class_reports yang published + sertifikat (rapor akhir) */}
        {!loading && activeTab === 'rapor' && <ClassRaporTab reg={reg} teacherName={teacherName} teacherFullName={teacher?.name || undefined} />}
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed left-1/2 top-4 z-[130] flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg animate-[fadeIn_0.2s_ease-out] ${toast.err ? 'bg-red-600' : 'bg-gray-900'}`}
        >
          {toast.err ? <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2.4} /> : <Check className="h-4 w-4 shrink-0" strokeWidth={3} />}
          {toast.msg}
        </div>
      )}

      {/* Modal Reschedule */}
      {rescheduleSched && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 p-0 md:items-center md:p-4">
          <div className="flex max-h-[85vh] w-full flex-col rounded-t-3xl bg-white md:max-w-md md:rounded-3xl">
            <div className="sticky top-0 flex items-center justify-between rounded-t-3xl border-b bg-white px-5 py-4">
              <div>
                <div className="text-xs text-gray-500">Ubah Jadwal Sesi</div>
                <div className="font-bold text-gray-900">Pilih waktu baru</div>
              </div>
              <button
                onClick={() => { setRescheduleSched(null); setSelectedSlot(null); }}
                aria-label="Tutup"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <X className="h-4 w-4" strokeWidth={2.4} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-3 text-xs text-gray-500">
                Sesi lama: {new Date(rescheduleSched.scheduled_at).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
              </div>
              {buildSlotGrid().length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500">
                  Pengajar belum set jadwal ketersediaan
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {buildSlotGrid().map((s) => {
                    const disabled = s.past || s.booked;
                    return (
                      <button
                        key={s.iso}
                        onClick={() => !disabled && setSelectedSlot(s.iso)}
                        disabled={disabled}
                        className={`rounded-lg border p-2 text-xs font-medium transition-all ${
                          selectedSlot === s.iso ? 'border-[#16796E] bg-[#16796E] text-white'
                          : disabled ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through'
                          : s.isCurrent ? 'border-dashed border-yellow-300 bg-yellow-50 text-yellow-800'
                          : 'border-transparent bg-teal-50 text-teal-700 hover:bg-teal-100'
                        }`}
                      >
                        {s.label}
                        {s.isCurrent && <div className="text-[10px] opacity-80">(sekarang)</div>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="sticky bottom-0 border-t bg-white p-4">
              <button
                disabled={!selectedSlot || isProcessing}
                onClick={submitReschedule}
                className="w-full rounded-xl bg-[#16796E] py-3 font-bold text-white hover:bg-[#0F5A52] disabled:bg-gray-300"
              >
                {isProcessing ? 'Memproses…' : 'Konfirmasi Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cancel — flow 2 langkah */}
      {cancelSched && (() => {
        const hoursUntil = (new Date(cancelSched.scheduled_at).getTime() - Date.now()) / 3600_000;
        const willBeHangus = hoursUntil <= 24;
        const schedDateStr = new Date(cancelSched.scheduled_at).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

        return (
          <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 p-0 md:items-center md:p-4">
            <div className="flex w-full flex-col rounded-t-3xl bg-white md:max-w-md md:rounded-3xl">
              {/* Step 1 — konfirmasi + opsi reschedule (hanya >24 jam) */}
              {cancelStep === 'confirm' && (
                <>
                  <div className="border-b px-5 py-5 text-center">
                    <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                      <HelpCircle className="h-6 w-6" strokeWidth={2} />
                    </div>
                    <div className="text-lg font-bold text-gray-900">Mau diapain sesi ini?</div>
                    <div className="mt-1 text-sm text-gray-600">{schedDateStr}</div>
                  </div>
                  <div className="space-y-2 p-4">
                    <button
                      onClick={() => {
                        const schedCopy = cancelSched;
                        setCancelSched(null);
                        openReschedule(schedCopy);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-left transition-colors hover:bg-blue-100"
                    >
                      <div className="text-blue-600"><RotateCcw className="h-6 w-6" strokeWidth={2.2} /></div>
                      <div className="flex-1">
                        <div className="font-semibold text-blue-900">Ubah jadwalnya saja</div>
                        <div className="mt-0.5 text-xs text-blue-700">Pindahin ke waktu lain yang kamu bisa</div>
                      </div>
                      <div className="text-blue-600">→</div>
                    </button>
                    <button
                      onClick={() => setCancelStep('form')}
                      className="flex w-full items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-left transition-colors hover:bg-red-100"
                    >
                      <div className="text-red-600"><X className="h-6 w-6" strokeWidth={2.4} /></div>
                      <div className="flex-1">
                        <div className="font-semibold text-red-900">Ya, batalkan sesi</div>
                        <div className="mt-0.5 text-xs text-red-700">Sesi dibatalkan & dibalikin ke kuota</div>
                      </div>
                      <div className="text-red-600">→</div>
                    </button>
                  </div>
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => { setCancelSched(null); setCancelReason(''); }}
                      className="w-full rounded-xl bg-gray-100 py-3 font-semibold text-gray-700 hover:bg-gray-200"
                    >
                      Kembali
                    </button>
                  </div>
                </>
              )}

              {/* Step 2 — form alasan + peringatan hangus */}
              {cancelStep === 'form' && (
                <>
                  <div className="border-b px-5 py-4">
                    <div className="text-lg font-bold text-gray-900">Batalkan Sesi?</div>
                    <div className="mt-1 text-sm text-gray-600">{schedDateStr}</div>
                  </div>
                  <div className="space-y-4 p-5">
                    {willBeHangus ? (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                        <AlertTriangle className="mr-1 inline h-4 w-4 align-[-3px]" strokeWidth={2.2} />
                        Sesi ini kurang dari 24 jam lagi. Kalau dibatalkan, <b>sesi tetap dihitung terpakai</b> — kuotanya tidak bisa dikembalikan.
                      </div>
                    ) : (
                      <div className="rounded-xl bg-teal-50 p-3 text-sm text-teal-800">
                        <Check className="mr-1 inline h-4 w-4 align-[-3px]" strokeWidth={2.6} />
                        Sesi ini masih lebih dari 24 jam lagi, bisa dibatalkan tanpa memotong kuota.
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Alasan Pembatalan *</label>
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        rows={3}
                        placeholder="Contoh: ada keperluan mendadak di kantor"
                        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-slate-300"
                      />
                      <div className="mt-1 text-[11px] text-gray-500">Alasan akan dikirim ke pengajar sebagai notifikasi</div>
                    </div>
                  </div>
                  <div className="flex gap-2 border-t p-4">
                    <button
                      onClick={() => {
                        // Balik ke step confirm kalau masih tersedia (>24 jam), selain itu tutup
                        if (hoursUntil > 24) { setCancelStep('confirm'); }
                        else { setCancelSched(null); setCancelReason(''); }
                      }}
                      className="flex-1 rounded-xl bg-gray-100 py-3 font-semibold text-gray-700 hover:bg-gray-200"
                    >
                      {hoursUntil > 24 ? '← Kembali' : 'Batal'}
                    </button>
                    <button
                      onClick={submitCancel}
                      disabled={isProcessing || !cancelReason.trim()}
                      className={`flex-1 rounded-xl py-3 font-bold text-white ${willBeHangus ? 'bg-red-600 hover:bg-red-700' : 'bg-[#16796E] hover:bg-[#0F5A52]'} disabled:bg-gray-300`}
                    >
                      {isProcessing ? '…' : willBeHangus ? 'Batalkan (Hangus)' : 'Batalkan Sesi'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}
    </main>
  );
}
