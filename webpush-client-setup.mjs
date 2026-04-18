#!/usr/bin/env node
// webpush-client-setup.mjs
// Setup Web Push notifications (client side):
//   1. Service Worker at public/sw.js (handles push events)
//   2. Upgrade StudentRealtimeNotifs.tsx: hybrid polling + web push
//   3. Register SW + subscribe to push on bell click
//   4. Save subscription to push_subscriptions table
//
// Precondition:
//   - SQL ran (push_subscriptions table + pg_net)
//   - Vercel env var NEXT_PUBLIC_VAPID_PUBLIC_KEY set + redeployed
//
// Usage: drag ke ~/linguo-landing → cd ~/linguo-landing → node webpush-client-setup.mjs

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SW_PATH = 'public/sw.js';
const COMP_PATH = 'src/components/StudentRealtimeNotifs.tsx';

if (!fs.existsSync('src/app/akun/page.tsx')) { console.error('❌ Run di ~/linguo-landing'); process.exit(1); }

// =========================================================================
// STEP 1 — Service Worker
// =========================================================================

const swContent = `// Linguo.id Service Worker — handles push notifications
// Registered from StudentRealtimeNotifs component.

const VERSION = 'v1';
console.log('[SW Linguo] loaded', VERSION);

self.addEventListener('install', (event) => {
  console.log('[SW Linguo] install');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW Linguo] activate');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[SW Linguo] push received');
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Linguo.id', body: event.data ? event.data.text() : 'Notifikasi baru' };
  }

  const title = data.title || 'Linguo.id';
  const options = {
    body: data.body || '',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'linguo',
    data: { url: data.url || '/akun' },
    requireInteraction: false,
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW Linguo] notification clicked');
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/akun';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window with matching origin exists, focus it
      for (const client of windowClients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin) {
          client.focus();
          if ('navigate' in client && clientUrl.pathname !== targetUrl) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      // Otherwise open new window
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
`;

fs.mkdirSync(path.dirname(SW_PATH), { recursive: true });
fs.writeFileSync(SW_PATH, swContent);
console.log('✓ Created', SW_PATH);

// =========================================================================
// STEP 2 — StudentRealtimeNotifs: hybrid polling + web push
// =========================================================================

const compContent = `'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

type NotifPerm = 'default' | 'granted' | 'denied' | 'unsupported';
type PollState = 'idle' | 'polling' | 'error' | 'waiting-id';
type PushState = 'unsupported' | 'not-subscribed' | 'subscribing' | 'subscribed' | 'error';

const POLL_INTERVAL_MS = 15000;
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

const LOG = (...a: any[]) => console.log('%c[Notif]', 'color:#0a9e9e;font-weight:bold', ...a);
const WARN = (...a: any[]) => console.warn('%c[Notif]', 'color:#e67e22;font-weight:bold', ...a);
const ERR = (...a: any[]) => console.error('%c[Notif]', 'color:#e74c3c;font-weight:bold', ...a);

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) out[i] = rawData.charCodeAt(i);
  return out;
}

function ab2b64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
}

export default function StudentRealtimeNotifs() {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [notifPerm, setNotifPerm] = useState<NotifPerm>('default');
  const [pushState, setPushState] = useState<PushState>('unsupported');
  const [pollState, setPollState] = useState<PollState>('waiting-id');
  const [toast, setToast] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [lastPollAt, setLastPollAt] = useState<Date | null>(null);

  const lastStateRef = useRef<Map<string, any>>(new Map());
  const initializedRef = useRef<boolean>(false);
  const audioCtxRef = useRef<any>(null);
  const notifPermRef = useRef<NotifPerm>('default');
  const pollRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => { notifPermRef.current = notifPerm; }, [notifPerm]);

  // Mount
  useEffect(() => {
    LOG('🟢 Mounted (polling + web push hybrid)');
    LOG('VAPID key loaded?', VAPID_PUBLIC_KEY ? 'yes (' + VAPID_PUBLIC_KEY.slice(0, 12) + '…)' : 'NO — check Vercel env');

    // Check push support
    if (typeof window !== 'undefined') {
      if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
        setPushState('not-subscribed');
      } else {
        setPushState('unsupported');
        WARN('Browser tidak support Push API');
      }
      if ('Notification' in window) setNotifPerm(Notification.permission as NotifPerm);
      else setNotifPerm('unsupported');
    }

    // Expose debug helpers
    if (typeof window !== 'undefined') {
      (window as any).__linguoDebug = {
        getState: () => ({ studentId, userEmail, notifPerm, pushState, pollState, eventCount, lastPollAt, baseline: lastStateRef.current.size, vapidKey: !!VAPID_PUBLIC_KEY }),
        forcePoll: () => pollRef.current?.(),
        subscribe: () => subscribeToPush(),
        unsubscribe: () => unsubscribePush(),
        testToast: () => fireLocalNotif('🧪 Test notification'),
      };
    }
  }, []);

  // Resolve student ID
  useEffect(() => {
    (async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const email = authData?.user?.email;
        if (!email) return;
        setUserEmail(email);
        const { data: student } = await supabase.from('students').select('id, name').eq('email', email).limit(1).maybeSingle();
        if (student?.id) { LOG('Student:', student.id); setStudentId(student.id); }
      } catch (e) { ERR('student lookup', e); }
    })();
  }, []);

  // Register service worker
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => { LOG('SW registered, scope:', reg.scope); })
      .catch((err) => { ERR('SW register failed', err); });
  }, []);

  // Check if already subscribed on mount (after studentId known)
  useEffect(() => {
    if (!studentId || pushState === 'unsupported') return;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          LOG('Already subscribed to push');
          setPushState('subscribed');
          // Upsert to DB in case missing
          await saveSubscription(sub);
        }
      } catch (e) { WARN('Check existing sub failed', e); }
    })();
  }, [studentId, pushState]);

  // Polling loop (fallback + for instant local update)
  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    initializedRef.current = false;
    lastStateRef.current = new Map();

    async function poll() {
      if (cancelled) return;
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        setPollState('polling');
        const { data, error } = await supabase.from('schedules').select('*').eq('student_id', studentId);
        if (cancelled) return;
        if (error) throw error;
        setLastPollAt(new Date());
        setPollState('idle');

        const list = (data as any[]) || [];
        if (!initializedRef.current) {
          list.forEach((s) => lastStateRef.current.set(s.id, s));
          initializedRef.current = true;
          LOG('Baseline:', list.length);
          return;
        }

        const currentMap = new Map(list.map((s: any) => [s.id, s]));
        for (const [id, s] of currentMap) {
          const old = lastStateRef.current.get(id);
          if (!old) {
            const msg = buildInsertMsg(s);
            if (msg) fireLocalNotif(msg);
          } else {
            const msg = buildUpdateMsg(old, s);
            if (msg) fireLocalNotif(msg);
          }
        }
        lastStateRef.current = currentMap as Map<string, any>;
      } catch (e) { ERR('Poll error:', e); setPollState('error'); }
    }

    pollRef.current = poll;
    poll();
    const intervalId = setInterval(poll, POLL_INTERVAL_MS);
    const visHandler = () => { if (!document.hidden) poll(); };
    document.addEventListener('visibilitychange', visHandler);
    return () => { cancelled = true; clearInterval(intervalId); document.removeEventListener('visibilitychange', visHandler); };
  }, [studentId]);

  function buildInsertMsg(s: any): string | null {
    if (s.student_confirmed && !s.cancelled_by) return null;
    const dt = s.scheduled_at ? new Date(s.scheduled_at).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
    return \`📅 Sesi baru dijadwalkan pengajar\${dt ? ' · ' + dt : ''}\`;
  }

  function buildUpdateMsg(o: any, n: any): string | null {
    if (o.status !== n.status) {
      if (n.status === 'scheduled') return '✅ Pengajar meng-approve jadwal!';
      if (n.status === 'cancelled' && n.cancelled_by === 'teacher') return \`❌ Pengajar cancel sesi\${n.cancel_reason ? ': ' + n.cancel_reason : ''}\`;
      if (n.status === 'cancelled' && n.cancelled_by === 'admin') return \`❌ Admin cancel sesi\${n.cancel_reason ? ': ' + n.cancel_reason : ''}\`;
      if (n.status === 'completed') return '🎉 Sesi selesai!';
    }
    if (o.scheduled_at !== n.scheduled_at && n.status !== 'cancelled' && n.status !== 'hangus') {
      if (n.notes?.includes('reschedule oleh siswa')) return null;
      const newDt = new Date(n.scheduled_at).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      return \`🔄 Pengajar reschedule ke \${newDt}\`;
    }
    return null;
  }

  async function saveSubscription(sub: PushSubscription) {
    if (!studentId) return;
    try {
      const subJson: any = sub.toJSON();
      const payload = {
        user_id: studentId,
        user_type: 'student',
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh || '',
        auth: subJson.keys?.auth || '',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : '',
        last_used_at: new Date().toISOString(),
        failed_count: 0,
      };
      const { error } = await supabase.from('push_subscriptions').upsert(payload, { onConflict: 'endpoint' });
      if (error) { ERR('Save subscription failed', error); }
      else { LOG('Subscription saved to DB for student', studentId); }
    } catch (e) { ERR('saveSubscription exception', e); }
  }

  async function subscribeToPush(): Promise<boolean> {
    if (!VAPID_PUBLIC_KEY) {
      setToast('⚠️ VAPID key belum di-set di Vercel env');
      setTimeout(() => setToast(null), 4000);
      return false;
    }
    if (!studentId) {
      setToast('⚠️ User belum teridentifikasi');
      setTimeout(() => setToast(null), 3000);
      return false;
    }
    if (pushState === 'unsupported') return false;

    try {
      setPushState('subscribing');
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        LOG('New push subscription created');
      } else {
        LOG('Reusing existing push subscription');
      }
      await saveSubscription(sub);
      setPushState('subscribed');
      return true;
    } catch (e) {
      ERR('Subscribe failed', e);
      setPushState('error');
      setToast('⚠️ Gagal subscribe push: ' + (e as Error).message);
      setTimeout(() => setToast(null), 5000);
      return false;
    }
  }

  async function unsubscribePush() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
        setPushState('not-subscribed');
        LOG('Unsubscribed');
      }
    } catch (e) { ERR('Unsubscribe failed', e); }
  }

  function fireLocalNotif(msg: string) {
    setToast(msg);
    setEventCount((c) => c + 1);
    setTimeout(() => setToast(null), 8000);
    playBeep();
    if (notifPermRef.current === 'granted' && typeof Notification !== 'undefined') {
      try { new Notification('Linguo.id', { body: msg, icon: '/favicon.ico' }); } catch {}
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
      const mkTone = (f: number, o: number, d: number, v: number) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.frequency.setValueAtTime(f, now + o); osc.type = 'sine';
        g.gain.setValueAtTime(0, now + o);
        g.gain.linearRampToValueAtTime(v, now + o + 0.01);
        g.gain.linearRampToValueAtTime(0, now + o + d);
        osc.start(now + o); osc.stop(now + o + d);
      };
      mkTone(880, 0, 0.15, 0.12); mkTone(1100, 0.12, 0.16, 0.1);
    } catch {}
  }

  async function handleBellClick() {
    if (typeof Notification === 'undefined') {
      setToast('⚠️ Browser tidak support notifikasi');
      setTimeout(() => setToast(null), 3500);
      return;
    }
    // Prime audio (Safari)
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (Ctx && !audioCtxRef.current) audioCtxRef.current = new Ctx();
      if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
    } catch {}

    // If already granted + subscribed, toggle (unsubscribe)
    if (notifPerm === 'granted' && pushState === 'subscribed') {
      const ok = confirm('Matikan notifikasi push? Kamu tetap bisa dapet notif dalam-halaman.');
      if (ok) await unsubscribePush();
      return;
    }

    // Request permission + subscribe
    try {
      const p = await Notification.requestPermission();
      setNotifPerm(p as NotifPerm);
      if (p === 'granted') {
        const ok = await subscribeToPush();
        if (ok) {
          setToast('🔔 Push notifications aktif! Bakal masuk bahkan pas tab ketutup.');
          playBeep();
          setTimeout(() => setToast(null), 5500);
        }
      } else if (p === 'denied') {
        setToast('🔕 Notifikasi diblokir. Aktifkan manual di setting browser.');
        setTimeout(() => setToast(null), 5000);
      }
    } catch (e) { ERR('Bell click flow failed', e); }
  }

  const bellClass =
    notifPerm === 'granted' && pushState === 'subscribed' ? 'bg-green-500 text-white hover:bg-green-600'
    : notifPerm === 'granted' ? 'bg-blue-400 text-white hover:bg-blue-500'
    : notifPerm === 'denied' ? 'bg-gray-400 text-white cursor-not-allowed'
    : notifPerm === 'unsupported' ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
    : 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500 animate-pulse';

  const bellIcon = notifPerm === 'granted' ? '🔔' : '🔕';

  const dotColor =
    pushState === 'subscribed' ? 'bg-green-500'
    : pushState === 'subscribing' ? 'bg-blue-500 animate-pulse'
    : pushState === 'error' ? 'bg-red-500'
    : pollState === 'idle' && studentId ? 'bg-blue-300'
    : pollState === 'polling' ? 'bg-blue-500 animate-pulse'
    : 'bg-gray-300';

  return (
    <>
      <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-40 flex flex-col items-end gap-1">
        <button
          onClick={handleBellClick}
          title={\`Notif: \${notifPerm} · Push: \${pushState} · Poll: \${pollState} · Events: \${eventCount}\`}
          disabled={notifPerm === 'denied' || notifPerm === 'unsupported'}
          className={\`relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all \${bellClass}\`}
          aria-label="Notifikasi"
        >
          <span className="text-xl">{bellIcon}</span>
          <span className={\`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white \${dotColor}\`} />
          {eventCount > 0 && (
            <span className="absolute -top-2 -left-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
              {eventCount > 99 ? '99+' : eventCount}
            </span>
          )}
        </button>
      </div>

      {toast && (
        <div
          onClick={() => window.location.reload()}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[130] bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl text-sm font-medium max-w-[92vw] md:max-w-md text-center cursor-pointer hover:bg-gray-800"
          style={{ animation: 'slideDown 0.25s ease-out' }}
        >
          <div>{toast}</div>
          <div className="text-[11px] text-gray-300 mt-1">↻ Klik untuk refresh</div>
        </div>
      )}

      <style jsx global>{\`
        @keyframes slideDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      \`}</style>
    </>
  );
}
`;

fs.writeFileSync(COMP_PATH, compContent);
console.log('✓ Rewrote', COMP_PATH);
console.log('  • Service worker registration');
console.log('  • Push subscription flow on bell click');
console.log('  • Saves subscription to push_subscriptions table');
console.log('  • Polling fallback for in-tab instant updates');
console.log('  • window.__linguoDebug.subscribe() / .unsubscribe() / .getState()');

try {
  console.log('\n🔄 git add / commit / push...');
  execSync('git add -A', { stdio: 'inherit' });
  try {
    execSync('git commit -m "feat(akun): web push notifications — service worker + client subscribe"', { stdio: 'inherit' });
  } catch { console.log('ℹ️  Nothing to commit.'); }
  execSync('git push', { stdio: 'inherit' });
  console.log('\n✅ Pushed.');
  fs.unlinkSync(process.argv[1]);
  console.log('🗑️  Self-deleted.');
} catch (e) { console.error('\n❌ Git failed:', e.message); }
