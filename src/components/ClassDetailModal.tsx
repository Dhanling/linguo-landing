'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';

interface Props {
  reg: any;
  onClose: () => void;
}

type Tab = 'overview' | 'jadwal' | 'progress' | 'materi' | 'rapor';

export default function ClassDetailModal({ reg, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [teacherName, setTeacherName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Reschedule state
  const [rescheduleSched, setRescheduleSched] = useState<any>(null);
  const [availSlots, setAvailSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());

  // Cancel state
  const [cancelSched, setCancelSched] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!reg) return;
    setActiveTab('overview');
    fetchData();
  }, [reg?.id]);

  async function fetchData() {
    setLoading(true);
    // Teacher info
    if (reg.teacher_id) {
      const { data: t } = await supabase
        .from('teachers')
        .select('name, title')
        .eq('id', reg.teacher_id)
        .maybeSingle();
      if (t) setTeacherName(`${t.title || 'Kak'} ${t.name}`);
    }

    // Schedules for this reg
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
    (booked || []).forEach((b: any) => {
      if (b.id !== sched.id) bSet.add(b.scheduled_at);
    });
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
    if (error) {
      alert('Gagal reschedule: ' + error.message);
      return;
    }
    setRescheduleSched(null);
    setSelectedSlot(null);
    await fetchData();
  }

  async function submitCancel() {
    if (!cancelSched) return;
    if (!cancelReason.trim()) {
      alert('Mohon isi alasan pembatalan');
      return;
    }
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
      // Sesi hangus dianggap ke-charge → increment sessions_used
      await supabase
        .from('registrations')
        .update({ sessions_used: (reg.sessions_used || 0) + 1 })
        .eq('id', reg.id);
    }

    setIsProcessing(false);
    if (error) {
      alert('Gagal cancel: ' + error.message);
      return;
    }
    setCancelSched(null);
    setCancelReason('');
    await fetchData();
  }

  if (!reg) return null;

  // 14-day slot grid for reschedule
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

  const progress = reg.sessions_total ? Math.round(((reg.sessions_used || 0) / reg.sessions_total) * 100) : 0;
  const upcoming = schedules.filter((s: any) => ['pending', 'scheduled'].includes(s.status) && new Date(s.scheduled_at).getTime() > Date.now() - 3600_000);
  const history = schedules.filter((s: any) => !upcoming.includes(s));

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'jadwal', label: 'Jadwal', icon: '📅' },
    { id: 'progress', label: 'Progress', icon: '🎯' },
    { id: 'materi', label: 'Materi', icon: '📚' },
    { id: 'rapor', label: 'Rapor', icon: '📊' },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-3xl md:rounded-3xl rounded-t-3xl max-h-[92vh] md:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between z-10">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 uppercase tracking-wider">{reg.product || 'Kelas'}</div>
            <h3 className="text-lg font-bold text-gray-900 truncate">{reg.language} · {reg.level}</h3>
          </div>
          <button onClick={onClose} className="ml-3 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600" aria-label="Tutup">✕</button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 overflow-x-auto shrink-0">
          <div className="flex min-w-max px-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === t.id ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                <span className="mr-1.5">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading && <div className="text-center text-gray-400 py-10">Memuat…</div>}

          {!loading && activeTab === 'overview' && (
            <div className="space-y-5">
              {teacherName ? (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
                  <div className="text-xs text-green-700 font-semibold uppercase tracking-wider">Pengajar</div>
                  <div className="text-lg font-bold text-gray-900 mt-1">{teacherName}</div>
                </div>
              ) : (
                <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200 text-sm text-yellow-800">
                  Pengajar belum di-assign. Hubungi admin untuk dipasangkan.
                </div>
              )}

              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-gray-700">Progress Sesi</div>
                  <div className="text-sm font-bold text-green-600">{reg.sessions_used || 0} / {reg.sessions_total || 0}</div>
                </div>
                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-gray-200 rounded-2xl p-3">
                  <div className="text-xs text-gray-500">Durasi/Sesi</div>
                  <div className="text-base font-bold text-gray-900 mt-1">{reg.duration || '-'} menit</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-3">
                  <div className="text-xs text-gray-500">Total Pembayaran</div>
                  <div className="text-base font-bold text-gray-900 mt-1">Rp{(reg.total_amount || 0).toLocaleString('id-ID')}</div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setActiveTab('jadwal')} className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700">
                  📅 Lihat Jadwal
                </button>
                <a href="https://wa.me/6282116859493" target="_blank" rel="noreferrer" className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 text-center">
                  💬 Chat Admin
                </a>
              </div>
            </div>
          )}

          {!loading && activeTab === 'jadwal' && (
            <div className="space-y-5">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Akan Datang ({upcoming.length})</div>
                {upcoming.length === 0 ? (
                  <div className="bg-gray-50 rounded-2xl p-4 text-center text-sm text-gray-500">Belum ada sesi terjadwal</div>
                ) : (
                  <div className="space-y-2">
                    {upcoming.map((s: any) => (
                      <ScheduleCard key={s.id} sched={s} onReschedule={() => openReschedule(s)} onCancel={() => { setCancelSched(s); setCancelReason(''); }} />
                    ))}
                  </div>
                )}
              </div>
              {history.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Riwayat ({history.length})</div>
                  <div className="space-y-2">
                    {history.map((s: any) => <ScheduleCard key={s.id} sched={s} />)}
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === 'progress' && (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-2">🎯</div>
              <div className="text-sm">Timeline progress A1→B2</div>
              <div className="text-xs mt-1">Coming in Phase 3c</div>
            </div>
          )}

          {!loading && activeTab === 'materi' && (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-2">📚</div>
              <div className="text-sm">Materi pembelajaran per sesi</div>
              <div className="text-xs mt-1">Coming Soon</div>
            </div>
          )}

          {!loading && activeTab === 'rapor' && (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-sm">Rapor & Sertifikat</div>
              <div className="text-xs mt-1">Coming Soon</div>
            </div>
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduleSched && (
        <div className="fixed inset-0 z-[110] bg-black/70 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl max-h-[85vh] flex flex-col">
            <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between rounded-t-3xl">
              <div>
                <div className="text-xs text-gray-500">Reschedule Sesi</div>
                <div className="font-bold text-gray-900">Pilih waktu baru</div>
              </div>
              <button onClick={() => { setRescheduleSched(null); setSelectedSlot(null); }} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-xs text-gray-500 mb-3">
                Sesi lama: {new Date(rescheduleSched.scheduled_at).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
              </div>
              {buildSlotGrid().length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-6">
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
                        className={`p-2 rounded-lg text-xs font-medium border transition-all ${
                          selectedSlot === s.iso ? 'bg-green-600 text-white border-green-600'
                          : disabled ? 'bg-gray-100 text-gray-400 line-through cursor-not-allowed border-gray-200'
                          : s.isCurrent ? 'bg-yellow-50 text-yellow-800 border-yellow-300 border-dashed'
                          : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
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
            <div className="sticky bottom-0 bg-white border-t p-4">
              <button
                disabled={!selectedSlot || isProcessing}
                onClick={submitReschedule}
                className="w-full py-3 rounded-xl bg-green-600 text-white font-bold disabled:bg-gray-300"
              >
                {isProcessing ? 'Memproses…' : 'Konfirmasi Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelSched && (() => {
        const hoursUntil = (new Date(cancelSched.scheduled_at).getTime() - Date.now()) / 3600_000;
        const willBeHangus = hoursUntil <= 24;
        return (
          <div className="fixed inset-0 z-[110] bg-black/70 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl flex flex-col">
              <div className="px-5 py-4 border-b">
                <div className="text-lg font-bold text-gray-900">Batalkan Sesi?</div>
                <div className="text-sm text-gray-600 mt-1">
                  {new Date(cancelSched.scheduled_at).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="p-5 space-y-4">
                {willBeHangus ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">
                    ⚠️ Sesi ini &lt;24 jam lagi. Kalau dibatalkan, <b>sesi tetap terhitung (sessions_used +1)</b>.
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                    ✓ Sesi ini &gt;24 jam lagi, bisa dibatalkan tanpa di-charge.
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-gray-700">Alasan Pembatalan</label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={3}
                    placeholder="Contoh: ada keperluan mendadak"
                    className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 p-4 border-t">
                <button onClick={() => { setCancelSched(null); setCancelReason(''); }} className="flex-1 py-3 rounded-xl bg-gray-100 font-semibold text-gray-700">
                  Kembali
                </button>
                <button
                  onClick={submitCancel}
                  disabled={isProcessing}
                  className={`flex-1 py-3 rounded-xl font-bold text-white ${willBeHangus ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} disabled:bg-gray-300`}
                >
                  {isProcessing ? '…' : willBeHangus ? 'Batalkan (Hangus)' : 'Batalkan Sesi'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function ScheduleCard({ sched, onReschedule, onCancel }: { sched: any; onReschedule?: () => void; onCancel?: () => void }) {
  const dt = new Date(sched.scheduled_at);
  const hoursUntil = (dt.getTime() - Date.now()) / 3600_000;
  const isPast = hoursUntil < 0;
  const isUpcoming = ['pending', 'scheduled'].includes(sched.status) && !isPast;
  const canReschedule = isUpcoming && hoursUntil > 24;

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'Menunggu Konfirmasi', color: 'bg-yellow-100 text-yellow-800' },
    scheduled: { label: 'Terjadwal', color: 'bg-blue-100 text-blue-800' },
    completed: { label: 'Selesai', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Dibatalkan', color: 'bg-gray-100 text-gray-600' },
    hangus: { label: 'Hangus', color: 'bg-red-100 text-red-700' },
  };
  const st = statusMap[sched.status] || { label: sched.status, color: 'bg-gray-100 text-gray-600' };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-gray-900">
            {dt.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <div className="text-sm text-gray-600">
            {dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB · {sched.duration_minutes || 60} menit
          </div>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${st.color}`}>{st.label}</span>
      </div>
      {sched.notes && <div className="text-xs text-gray-500 mt-2">{sched.notes}</div>}
      {isUpcoming && (onReschedule || onCancel) && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          {onReschedule && (
            <button
              onClick={onReschedule}
              disabled={!canReschedule}
              title={!canReschedule ? 'Reschedule hanya bisa >24 jam sebelum sesi' : ''}
              className="flex-1 py-2 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              🔄 Reschedule
            </button>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100"
            >
              ❌ Batalkan
            </button>
          )}
        </div>
      )}
    </div>
  );
}
