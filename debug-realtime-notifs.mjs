#!/usr/bin/env node
// debug-realtime-notifs.mjs
// Replace StudentRealtimeNotifs.tsx with a VERBOSE debug version:
//   - Console logs at every step (studentId lookup, subscription, events)
//   - Visual connection status dot on bell (grey/yellow/green/red)
//   - Toast click = reload page (so user can see fresh data)
//   - Optional DEBUG flag exposed on window.__linguoDebug
//
// Usage: drag ke ~/linguo-landing → cd ~/linguo-landing → node debug-realtime-notifs.mjs

import fs from 'fs';
import { execSync } from 'child_process';

const FILE = 'src/components/StudentRealtimeNotifs.tsx';
if (!fs.existsSync(FILE)) {
  console.error('❌ Run di ~/linguo-landing');
  process.exit(1);
}

const content = `'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

type NotifPerm = 'default' | 'granted' | 'denied' | 'unsupported';
type ConnState = 'idle' | 'connecting' | 'subscribed' | 'error' | 'closed';

const LOG = (...args: any[]) => console.log('%c[StudentRealtimeNotifs]', 'color:#0a9e9e;font-weight:bold', ...args);
const WARN = (...args: any[]) => console.warn('%c[StudentRealtimeNotifs]', 'color:#e67e22;font-weight:bold', ...args);
const ERR = (...args: any[]) => console.error('%c[StudentRealtimeNotifs]', 'color:#e74c3c;font-weight:bold', ...args);

export default function StudentRealtimeNotifs() {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [notifPerm, setNotifPerm] = useState<NotifPerm>('default');
  const [connState, setConnState] = useState<ConnState>('idle');
  const [toast, setToast] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const audioCtxRef = useRef<any>(null);
  const notifPermRef = useRef<NotifPerm>('default');

  useEffect(() => { notifPermRef.current = notifPerm; }, [notifPerm]);

  // Mount log
  useEffect(() => {
    LOG('🟢 Component mounted');
    // Expose debug helpers
    if (typeof window !== 'undefined') {
      (window as any).__linguoDebug = {
        getState: () => ({ studentId, userEmail, notifPerm, connState, eventCount }),
        testBeep: () => playBeep(),
        testToast: () => fireNotif('🧪 Test notification'),
      };
      LOG('💡 Debug handle: window.__linguoDebug.getState()');
    }
  }, []);

  // Resolve student ID
  useEffect(() => {
    (async () => {
      try {
        LOG('Fetching auth user…');
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr) { ERR('auth.getUser failed:', authErr); return; }
        const email = authData?.user?.email;
        if (!email) { WARN('No authenticated email — user not logged in?'); return; }
        setUserEmail(email);
        LOG('Auth email:', email);

        LOG('Looking up student record by email…');
        const { data: student, error: sErr } = await supabase
          .from('students')
          .select('id, name, email')
          .eq('email', email)
          .limit(1)
          .maybeSingle();
        if (sErr) { ERR('students query failed:', sErr); return; }
        if (!student) {
          WARN('No student found with email', email, '— will NOT subscribe to realtime');
          return;
        }
        LOG('✅ Student resolved:', student.id, student.name);
        setStudentId(student.id);
      } catch (e) {
        ERR('student lookup exception:', e);
      }
    })();

    if (typeof window !== 'undefined') {
      if ('Notification' in window) {
        setNotifPerm(Notification.permission as NotifPerm);
        LOG('Notification permission:', Notification.permission);
      } else {
        setNotifPerm('unsupported');
        WARN('Notification API not supported in this browser');
      }
    }
  }, []);

  // Subscribe to realtime
  useEffect(() => {
    if (!studentId) {
      LOG('Waiting for studentId before subscribing…');
      return;
    }

    LOG('🔌 Subscribing to channel student-notif-' + studentId);
    setConnState('connecting');

    const channelName = \`student-notif-\${studentId}\`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedules', filter: \`student_id=eq.\${studentId}\` },
        (payload: any) => {
          LOG('📨 Event received:', payload.eventType, { old: payload.old, new: payload.new });
          setEventCount((c) => c + 1);
          const msg = buildMessage(payload);
          if (msg) {
            LOG('→ Firing notif:', msg);
            fireNotif(msg);
          } else {
            LOG('→ Event filtered out (likely own action)');
          }
        }
      )
      .subscribe((status, err) => {
        LOG('Subscribe status:', status);
        if (err) ERR('Subscribe error:', err);
        if (status === 'SUBSCRIBED') setConnState('subscribed');
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setConnState('error');
        else if (status === 'CLOSED') setConnState('closed');
      });

    return () => {
      LOG('🔌 Unsubscribing from', channelName);
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  function buildMessage(payload: any): string | null {
    const t = payload.eventType;
    const n = payload.new || {};
    const o = payload.old || {};

    if (t === 'INSERT') {
      if (n.student_confirmed && n.cancelled_by == null) {
        LOG('  INSERT filter: skipped (student self-created)');
        return null;
      }
      const dt = n.scheduled_at ? new Date(n.scheduled_at).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
      return \`📅 Sesi baru dijadwalkan pengajar\${dt ? ' · ' + dt : ''}\`;
    }

    if (t === 'UPDATE') {
      // Note: if REPLICA IDENTITY is not FULL, o will only have primary key → o.status is undefined.
      // We detect using n (new row) primarily.
      if (n.status === 'scheduled' && o.status === 'pending') {
        return '✅ Pengajar meng-approve jadwal kamu!';
      }
      if (n.status === 'scheduled' && o.status === undefined) {
        // Can't verify old status, assume approve
        return '✅ Jadwal di-update oleh pengajar (mungkin approve)';
      }
      if (n.status === 'cancelled' && n.cancelled_by === 'teacher') {
        return \`❌ Pengajar membatalkan sesi\${n.cancel_reason ? ': ' + n.cancel_reason : ''}\`;
      }
      if (n.status === 'cancelled' && n.cancelled_by === 'admin') {
        return \`❌ Admin membatalkan sesi\${n.cancel_reason ? ': ' + n.cancel_reason : ''}\`;
      }
      if (n.status === 'completed') {
        return '🎉 Sesi ditandai selesai — mantap!';
      }
      if (o.scheduled_at && n.scheduled_at && o.scheduled_at !== n.scheduled_at && n.status !== 'cancelled') {
        if (n.notes?.includes('reschedule oleh siswa')) return null;
        const newDt = new Date(n.scheduled_at).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        return \`🔄 Pengajar reschedule sesi ke \${newDt}\`;
      }
    }

    return null;
  }

  function fireNotif(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 8000);
    playBeep();
    if (notifPermRef.current === 'granted' && typeof Notification !== 'undefined') {
      try {
        new Notification('Linguo.id', { body: msg, icon: '/favicon.ico', tag: 'linguo-notif-' + Date.now() });
      } catch (e) { WARN('Notification failed:', e); }
    }
  }

  function playBeep() {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1); gain1.connect(ctx.destination);
      osc1.frequency.setValueAtTime(880, now);
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.12, now + 0.01);
      gain1.gain.linearRampToValueAtTime(0, now + 0.15);
      osc1.start(now); osc1.stop(now + 0.15);
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2); gain2.connect(ctx.destination);
      osc2.frequency.setValueAtTime(1100, now + 0.12);
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.1, now + 0.13);
      gain2.gain.linearRampToValueAtTime(0, now + 0.28);
      osc2.start(now + 0.12); osc2.stop(now + 0.28);
    } catch (e) { WARN('Beep failed:', e); }
  }

  async function requestPermission() {
    if (typeof Notification === 'undefined') {
      setToast('⚠️ Browser kamu tidak mendukung notifikasi');
      setTimeout(() => setToast(null), 3500);
      return;
    }
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (Ctx && !audioCtxRef.current) audioCtxRef.current = new Ctx();
      if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
    } catch {}

    try {
      const p = await Notification.requestPermission();
      setNotifPerm(p as NotifPerm);
      LOG('Permission after request:', p);
      if (p === 'granted') {
        setToast('🔔 Notifikasi aktif! Coba test pengajar Ebi approve/reject jadwal.');
        playBeep();
        setTimeout(() => setToast(null), 5000);
      } else if (p === 'denied') {
        setToast('🔕 Notifikasi diblokir. Aktifkan manual di setting browser.');
        setTimeout(() => setToast(null), 5000);
      }
    } catch (e) {
      ERR('Permission request failed', e);
    }
  }

  // Bell visual state
  const bellClass =
    notifPerm === 'granted' ? 'bg-green-500 text-white hover:bg-green-600'
    : notifPerm === 'denied' ? 'bg-gray-400 text-white cursor-not-allowed'
    : notifPerm === 'unsupported' ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
    : 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500 animate-pulse';

  const bellIcon =
    notifPerm === 'granted' ? '🔔'
    : notifPerm === 'denied' || notifPerm === 'unsupported' ? '🔕'
    : '🔔';

  // Connection dot color
  const dotColor =
    connState === 'subscribed' ? 'bg-green-500'
    : connState === 'connecting' ? 'bg-yellow-500 animate-pulse'
    : connState === 'error' ? 'bg-red-500'
    : connState === 'closed' ? 'bg-gray-500'
    : 'bg-gray-300';

  return (
    <>
      {/* Floating bell with connection-status dot */}
      <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-40 flex flex-col items-end gap-1">
        <button
          onClick={requestPermission}
          title={\`Notif: \${notifPerm} · Realtime: \${connState} · Events: \${eventCount}\`}
          disabled={notifPerm === 'denied' || notifPerm === 'unsupported'}
          className={\`relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all \${bellClass}\`}
          aria-label="Notifikasi"
        >
          <span className="text-xl">{bellIcon}</span>
          {/* Connection indicator dot */}
          <span className={\`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white \${dotColor}\`} />
          {eventCount > 0 && (
            <span className="absolute -top-2 -left-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
              {eventCount > 99 ? '99+' : eventCount}
            </span>
          )}
        </button>
      </div>

      {/* Toast — clickable to reload */}
      {toast && (
        <div
          onClick={() => window.location.reload()}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[130] bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl text-sm font-medium max-w-[92vw] md:max-w-md text-center cursor-pointer hover:bg-gray-800"
          style={{ animation: 'slideDown 0.25s ease-out' }}
        >
          <div>{toast}</div>
          <div className="text-[11px] text-gray-300 mt-1">↻ Klik untuk refresh halaman</div>
        </div>
      )}

      <style jsx global>{\`
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      \`}</style>
    </>
  );
}
`;

fs.writeFileSync(FILE, content);
console.log('✓ Rewrote', FILE, 'with verbose debug version');
console.log('  • Console logs at every step');
console.log('  • Connection status dot on bell (grey/yellow/green/red)');
console.log('  • Event counter badge');
console.log('  • window.__linguoDebug.getState() helper');
console.log('  • Clickable toast to reload');

try {
  console.log('\n🔄 git add / commit / push...');
  execSync('git add -A', { stdio: 'inherit' });
  try {
    execSync('git commit -m "debug(akun): verbose realtime notif component for diagnostic"', { stdio: 'inherit' });
  } catch { console.log('ℹ️  Nothing to commit.'); }
  execSync('git push', { stdio: 'inherit' });
  console.log('\n✅ Pushed.');
  fs.unlinkSync(process.argv[1]);
  console.log('🗑️  Self-deleted.');
} catch (e) {
  console.error('\n❌ Git failed:', e.message);
}
