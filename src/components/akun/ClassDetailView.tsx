'use client';

// [kelas-detail-page-v1] Konten halaman detail kelas /akun/kelas/[id].
// Dulu ini ClassDetailModal (popup di beranda) — 5 tab + flow reschedule/cancel
// kelewat berat buat modal (modal numpuk modal), jadi dinaikkan ke halaman penuh:
// deep-linkable (?tab=jadwal), tombol back browser jalan, lega di mobile.
// Reschedule & cancel TETAP modal — di situ modal memang tepat (keputusan singkat).

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { getFlagUrl, getLangPhoto, langGlyph } from '@/lib/lang-visuals';
import { ArrowLeft, Calendar, TrendingUp, BookOpen, BarChart2, User, Clock, CreditCard, MessageCircle, ClipboardList, Check, type LucideIcon } from 'lucide-react';

interface Props {
  reg: any; // registration + join teachers(name, title, avatar_url)
  initialTab?: string | null;
}

export type ClassTab = 'overview' | 'jadwal' | 'progress' | 'materi' | 'rapor';
type CancelStep = 'confirm' | 'form';

const TABS: { id: ClassTab; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: ClipboardList },
  { id: 'jadwal', label: 'Jadwal', icon: Calendar },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'materi', label: 'Materi', icon: BookOpen },
  { id: 'rapor', label: 'Rapor', icon: BarChart2 },
];

const isValidTab = (t: string | null | undefined): t is ClassTab =>
  !!t && TABS.some((x) => x.id === t);

export default function ClassDetailView({ reg, initialTab }: Props) {
  const [activeTab, setActiveTabState] = useState<ClassTab>(isValidTab(initialTab) ? initialTab : 'overview');
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
  const [toast, setToast] = useState<string | null>(null);

  // Sinkron tab ke URL (?tab=) tanpa re-render route — biar bisa di-share/refresh.
  function setActiveTab(t: ClassTab) {
    setActiveTabState(t);
    try {
      const url = new URL(window.location.href);
      if (t === 'overview') url.searchParams.delete('tab');
      else url.searchParams.set('tab', t);
      window.history.replaceState(null, '', url.toString());
    } catch {}
  }

  useEffect(() => {
    if (!reg) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reg?.id]);

  function flashToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
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
    if (error) { alert('Gagal reschedule: ' + error.message); return; }
    setRescheduleSched(null);
    setSelectedSlot(null);
    flashToast('✓ Sesi berhasil di-reschedule. Menunggu konfirmasi pengajar.');
    await fetchData();
  }

  // Dipanggil saat user klik ❌ Batalkan di kartu jadwal
  function requestCancel(sched: any) {
    const hoursUntil = (new Date(sched.scheduled_at).getTime() - Date.now()) / 3600_000;
    setCancelSched(sched);
    setCancelReason('');
    // <24 jam: lewati step opsi reschedule (reschedule memang tak diizinkan)
    setCancelStep(hoursUntil > 24 ? 'confirm' : 'form');
  }

  async function submitCancel() {
    if (!cancelSched) return;
    if (!cancelReason.trim()) { alert('Mohon isi alasan pembatalan'); return; }
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
    if (error) { alert('Gagal cancel: ' + error.message); return; }
    const savedHangus = willBeHangus;
    setCancelSched(null);
    setCancelReason('');
    flashToast(savedHangus ? '✓ Sesi di-hangusin. Pengajar diberitahu.' : '✓ Sesi dibatalkan. Pengajar diberitahu.');
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

  const teacher = reg.teachers || null;
  const teacherName = teacher?.name ? `${teacher.title || 'Kak'} ${teacher.name}` : '';
  const progress = reg.sessions_total ? Math.round(((reg.sessions_used || 0) / reg.sessions_total) * 100) : 0;
  const selesai = (reg.sessions_total > 0 && (reg.sessions_used || 0) >= reg.sessions_total) || !!reg.archived_at;
  const photo = getLangPhoto(reg.language);
  const upcoming = schedules.filter((s: any) => ['pending', 'scheduled'].includes(s.status) && new Date(s.scheduled_at).getTime() > Date.now() - 3600_000);
  const history = schedules.filter((s: any) => !upcoming.includes(s));

  return (
    <main className="mx-auto w-full max-w-[1000px] px-4 pb-16 pt-5 sm:px-6">
      {/* Back */}
      <Link href="/akun" prefetch className="inline-flex items-center gap-1.5 text-[13px] font-bold text-gray-500 transition hover:text-[#16796E]">
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
                {reg.language} · {reg.level || 'TBD'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* ── Info strip: pengajar + progress + chips ── */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {teacherName ? (
          <div className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-[#F0FAF8] p-4">
            {teacher?.avatar_url ? (
              <img src={teacher.avatar_url} alt={teacherName} className="h-11 w-11 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#16796E]/10 text-[#16796E]">
                <User className="h-5 w-5" strokeWidth={2.2} />
              </div>
            )}
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
            <div className="text-sm font-bold text-[#16796E]">{reg.sessions_used || 0} / {reg.sessions_total || 0}</div>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-gradient-to-r from-[#16796E] to-emerald-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* ── Tab bar (sticky di dalam panel scroll shell) ── */}
      <div className="sticky top-0 z-20 -mx-4 mt-6 border-b border-gray-200 bg-white/95 px-4 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex min-w-max overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === t.id ? 'border-[#16796E] text-[#16796E]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />{t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Konten tab ── */}
      <div className="pt-6">
        {loading && <div className="py-10 text-center text-gray-400">Memuat…</div>}

        {!loading && activeTab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-500"><Clock className="h-3.5 w-3.5" strokeWidth={2} />Durasi/Sesi</div>
                <div className="mt-1 text-base font-bold text-gray-900">{reg.duration || '-'} menit</div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-500"><CreditCard className="h-3.5 w-3.5" strokeWidth={2} />Total Pembayaran</div>
                <div className="mt-1 text-base font-bold text-gray-900">Rp{(reg.total_amount || 0).toLocaleString('id-ID')}</div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setActiveTab('jadwal')} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#16796E] py-3 font-semibold text-white hover:bg-[#0F5A52]">
                <Calendar className="h-4 w-4" strokeWidth={2.5} /> Lihat Jadwal
              </button>
              <a href="https://wa.me/6282116859493" target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-900 py-3 text-center font-semibold text-white hover:bg-gray-800">
                <MessageCircle className="h-4 w-4" strokeWidth={2.5} /> Chat Admin
              </a>
            </div>
          </div>
        )}

        {!loading && activeTab === 'jadwal' && (
          <div className="space-y-6">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Akan Datang ({upcoming.length})</div>
              {upcoming.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 p-4 text-center text-sm text-gray-500">Belum ada sesi terjadwal</div>
              ) : (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {upcoming.map((s: any) => (
                    <ScheduleCard key={s.id} sched={s} onReschedule={() => openReschedule(s)} onCancel={() => requestCancel(s)} />
                  ))}
                </div>
              )}
            </div>
            {history.length > 0 && (
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Riwayat ({history.length})</div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {history.map((s: any) => <ScheduleCard key={s.id} sched={s} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'progress' && (
          <div className="py-14 text-center text-gray-400">
            <TrendingUp className="mx-auto mb-2 h-9 w-9" strokeWidth={1.5} />
            <div className="text-sm">Timeline progress A1→B2</div>
            <div className="mt-1 text-xs">Coming in Phase 3c</div>
          </div>
        )}

        {!loading && activeTab === 'materi' && (
          <div className="py-14 text-center text-gray-400">
            <BookOpen className="mx-auto mb-2 h-9 w-9" strokeWidth={1.5} />
            <div className="text-sm">Materi pembelajaran per sesi</div>
            <div className="mt-1 text-xs">Coming Soon</div>
          </div>
        )}

        {!loading && activeTab === 'rapor' && (
          <div className="py-14 text-center text-gray-400">
            <BarChart2 className="mx-auto mb-2 h-9 w-9" strokeWidth={1.5} />
            <div className="text-sm">Rapor & Sertifikat</div>
            <div className="mt-1 text-xs">Coming Soon</div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed left-1/2 top-4 z-[130] -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg animate-[fadeIn_0.2s_ease-out]">
          {toast}
        </div>
      )}

      {/* Modal Reschedule */}
      {rescheduleSched && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 p-0 md:items-center md:p-4">
          <div className="flex max-h-[85vh] w-full flex-col rounded-t-3xl bg-white md:max-w-md md:rounded-3xl">
            <div className="sticky top-0 flex items-center justify-between rounded-t-3xl border-b bg-white px-5 py-4">
              <div>
                <div className="text-xs text-gray-500">Reschedule Sesi</div>
                <div className="font-bold text-gray-900">Pilih waktu baru</div>
              </div>
              <button onClick={() => { setRescheduleSched(null); setSelectedSlot(null); }} className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200">✕</button>
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
                          : 'border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100'
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
                    <div className="mb-2 text-3xl">🤔</div>
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
                      <div className="text-2xl">🔄</div>
                      <div className="flex-1">
                        <div className="font-semibold text-blue-900">Reschedule aja</div>
                        <div className="mt-0.5 text-xs text-blue-700">Pindahin ke waktu lain yang kamu bisa</div>
                      </div>
                      <div className="text-blue-600">→</div>
                    </button>
                    <button
                      onClick={() => setCancelStep('form')}
                      className="flex w-full items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-left transition-colors hover:bg-red-100"
                    >
                      <div className="text-2xl">❌</div>
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
                        ⚠️ Sesi ini &lt;24 jam lagi. Kalau dibatalkan, <b>sesi tetap terhitung (sessions_used +1)</b> — tidak bisa dikembalikan.
                      </div>
                    ) : (
                      <div className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">
                        ✓ Sesi ini &gt;24 jam lagi, bisa dibatalkan tanpa di-charge.
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Alasan Pembatalan *</label>
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        rows={3}
                        placeholder="Contoh: ada keperluan mendadak di kantor"
                        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#16796E] focus:ring-2 focus:ring-[#16796E]/40"
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

function ScheduleCard({ sched, onReschedule, onCancel }: { sched: any; onReschedule?: () => void; onCancel?: () => void }) {
  const dt = new Date(sched.scheduled_at);
  const hoursUntil = (dt.getTime() - Date.now()) / 3600_000;
  const isPast = hoursUntil < 0;
  const isUpcoming = ['pending', 'scheduled'].includes(sched.status) && !isPast;
  const canReschedule = isUpcoming && hoursUntil > 24;
  const isCancelledOrHangus = sched.status === 'cancelled' || sched.status === 'hangus';

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'Menunggu Konfirmasi', color: 'bg-yellow-100 text-yellow-800' },
    scheduled: { label: 'Terjadwal', color: 'bg-blue-100 text-blue-800' },
    completed: { label: 'Selesai', color: 'bg-teal-100 text-teal-800' },
    cancelled: { label: 'Dibatalkan', color: 'bg-gray-200 text-gray-700' },
    hangus: { label: 'Hangus', color: 'bg-red-100 text-red-700' },
  };
  const st = statusMap[sched.status] || { label: sched.status, color: 'bg-gray-100 text-gray-600' };

  const cancelledByLabel: Record<string, string> = {
    student: 'Siswa',
    teacher: 'Pengajar',
    admin: 'Admin',
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className={`font-semibold ${isCancelledOrHangus ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
            {dt.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <div className={`text-sm ${isCancelledOrHangus ? 'text-gray-400' : 'text-gray-600'}`}>
            {dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB · {sched.duration_minutes || 60} menit
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${st.color}`}>{st.label}</span>
      </div>

      {sched.notes && !isCancelledOrHangus && <div className="mt-2 text-xs text-gray-500">{sched.notes}</div>}

      {/* Detail pembatalan untuk cancelled/hangus */}
      {isCancelledOrHangus && (sched.cancel_reason || sched.cancelled_by) && (
        <div className="mt-3 space-y-1 border-t border-gray-100 pt-3">
          {sched.cancel_reason && (
            <div className="text-xs">
              <span className="text-gray-500">Alasan: </span>
              <span className="text-gray-800">{sched.cancel_reason}</span>
            </div>
          )}
          {(sched.cancelled_by || sched.cancelled_at) && (
            <div className="text-[11px] text-gray-500">
              {sched.cancelled_by && `Dibatalkan oleh ${cancelledByLabel[sched.cancelled_by] || sched.cancelled_by}`}
              {sched.cancelled_by && sched.cancelled_at && ' · '}
              {sched.cancelled_at && new Date(sched.cancelled_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      )}

      {isUpcoming && (onReschedule || onCancel) && (
        <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
          {onReschedule && (
            <button
              onClick={onReschedule}
              disabled={!canReschedule}
              title={!canReschedule ? 'Reschedule hanya bisa >24 jam sebelum sesi' : ''}
              className="flex-1 rounded-lg bg-blue-50 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
            >
              🔄 Reschedule
            </button>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 rounded-lg bg-red-50 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              ❌ Batalkan
            </button>
          )}
        </div>
      )}
    </div>
  );
}
