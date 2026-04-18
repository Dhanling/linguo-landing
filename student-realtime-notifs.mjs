#!/usr/bin/env node
// student-realtime-notifs.mjs
// Add realtime notification system to student dashboard /akun:
//   - 🔔 Permission bell button (floating bottom-right)
//   - Supabase Realtime subscription to schedules table (filter by student_id)
//   - Toast + browser Notification + beep when teacher approves/reschedules/cancels/completes
//
// Usage: drag to ~/linguo-landing → cd ~/linguo-landing → node student-realtime-notifs.mjs

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const COMP = 'src/components/StudentRealtimeNotifs.tsx';
const PAGE = 'src/app/akun/page.tsx';

if (!fs.existsSync(PAGE)) {
  console.error('❌ Run di ~/linguo-landing');
  process.exit(1);
}

// =========================================================================
// STEP 1 — Create StudentRealtimeNotifs.tsx
// =========================================================================

const compContent = `'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

type NotifPerm = 'default' | 'granted' | 'denied' | 'unsupported';

export default function StudentRealtimeNotifs() {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [notifPerm, setNotifPerm] = useState<NotifPerm>('default');
  const [toast, setToast] = useState<string | null>(null);
  const audioCtxRef = useRef<any>(null);
  const notifPermRef = useRef<NotifPerm>('default');

  useEffect(() => { notifPermRef.current = notifPerm; }, [notifPerm]);

  // Resolve student ID from auth user email
  useEffect(() => {
    (async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const email = authData?.user?.email;
        if (!email) return;
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('email', email)
          .limit(1)
          .maybeSingle();
        if (student?.id) setStudentId(student.id);
      } catch (e) {
        console.warn('[StudentRealtimeNotifs] student lookup failed', e);
      }
    })();

    // Check current notif permission
    if (typeof window !== 'undefined') {
      if ('Notification' in window) {
        setNotifPerm(Notification.permission as NotifPerm);
      } else {
        setNotifPerm('unsupported');
      }
    }
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!studentId) return;
    const channel = supabase
      .channel(\`student-notif-\${studentId}\`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedules', filter: \`student_id=eq.\${studentId}\` },
        (payload: any) => {
          const msg = buildMessage(payload);
          if (msg) fireNotif(msg);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [studentId]);

  function buildMessage(payload: any): string | null {
    const t = payload.eventType;
    const n = payload.new || {};
    const o = payload.old || {};

    if (t === 'INSERT') {
      // Skip if student themselves created it (has student_confirmed=true from /akun booking)
      if (n.student_confirmed && n.cancelled_by == null) return null;
      const dt = n.scheduled_at ? new Date(n.scheduled_at).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
      return \`📅 Sesi baru dijadwalkan pengajar\${dt ? ' · ' + dt : ''}\`;
    }

    if (t === 'UPDATE') {
      // Status change
      if (o.status !== n.status) {
        if (n.status === 'scheduled') {
          return '✅ Pengajar meng-approve jadwal kamu!';
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
      }
      // Reschedule (scheduled_at change, status still pending/scheduled)
      if (o.scheduled_at !== n.scheduled_at && n.status !== 'cancelled') {
        // Check if this was student's own reschedule action
        if (n.cancelled_by == null && n.notes?.includes('reschedule oleh siswa')) return null;
        const newDt = new Date(n.scheduled_at).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        return \`🔄 Pengajar reschedule sesi ke \${newDt}\`;
      }
    }

    return null;
  }

  function fireNotif(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 5500);
    playBeep();
    if (notifPermRef.current === 'granted' && typeof Notification !== 'undefined') {
      try {
        new Notification('Linguo.id', {
          body: msg,
          icon: '/favicon.ico',
          tag: 'linguo-notif',
        });
      } catch {}
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
      // Two-tone chirp (more pleasant than single beep)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1); gain1.connect(ctx.destination);
      osc1.frequency.setValueAtTime(880, now);
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.12, now + 0.01);
      gain1.gain.linearRampToValueAtTime(0, now + 0.15);
      osc1.start(now);
      osc1.stop(now + 0.15);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2); gain2.connect(ctx.destination);
      osc2.frequency.setValueAtTime(1100, now + 0.12);
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.1, now + 0.13);
      gain2.gain.linearRampToValueAtTime(0, now + 0.28);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.28);
    } catch {}
  }

  async function requestPermission() {
    if (typeof Notification === 'undefined') {
      setToast('⚠️ Browser kamu tidak mendukung notifikasi');
      setTimeout(() => setToast(null), 3500);
      return;
    }
    // Prime audio context on user gesture (Safari requirement)
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (Ctx && !audioCtxRef.current) audioCtxRef.current = new Ctx();
      if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
    } catch {}

    try {
      const p = await Notification.requestPermission();
      setNotifPerm(p as NotifPerm);
      if (p === 'granted') {
        setToast('🔔 Notifikasi aktif! Kamu akan dapet update dari pengajar');
        playBeep();
        setTimeout(() => setToast(null), 4000);
      } else if (p === 'denied') {
        setToast('🔕 Notifikasi diblokir. Aktifkan lewat setting browser.');
        setTimeout(() => setToast(null), 4500);
      }
    } catch (e) {
      console.warn('Permission request failed', e);
    }
  }

  const bellClass =
    notifPerm === 'granted' ? 'bg-green-500 text-white hover:bg-green-600'
    : notifPerm === 'denied' ? 'bg-gray-400 text-white cursor-not-allowed'
    : notifPerm === 'unsupported' ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
    : 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500 animate-pulse';

  const bellIcon =
    notifPerm === 'granted' ? '🔔'
    : notifPerm === 'denied' || notifPerm === 'unsupported' ? '🔕'
    : '🔔';

  const bellTitle =
    notifPerm === 'granted' ? 'Notifikasi aktif'
    : notifPerm === 'denied' ? 'Notif diblokir — aktifkan di setting browser'
    : notifPerm === 'unsupported' ? 'Browser tidak mendukung notifikasi'
    : 'Aktifkan notifikasi realtime';

  return (
    <>
      {/* Floating bell — bottom-right (above mobile bottom nav) */}
      <button
        onClick={requestPermission}
        title={bellTitle}
        disabled={notifPerm === 'denied' || notifPerm === 'unsupported'}
        className={\`fixed bottom-24 md:bottom-6 right-4 md:right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-40 transition-all \${bellClass}\`}
        aria-label={bellTitle}
      >
        <span className="text-xl">{bellIcon}</span>
      </button>

      {/* Toast */}
      {toast && (
        <div
          onClick={() => setToast(null)}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[130] bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl text-sm font-medium max-w-[92vw] md:max-w-md text-center cursor-pointer animate-[slideDown_0.25s_ease-out]"
          style={{ animation: 'slideDown 0.25s ease-out' }}
        >
          {toast}
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

fs.mkdirSync(path.dirname(COMP), { recursive: true });
fs.writeFileSync(COMP, compContent);
console.log('✓ Created', COMP);

// =========================================================================
// STEP 2 — Modify page.tsx
// =========================================================================

let page = fs.readFileSync(PAGE, 'utf8');
const orig = page;

// 2a. Import
if (!page.includes('StudentRealtimeNotifs')) {
  const importBlock = page.match(/^(import [\s\S]+?from ['"][^'"]+['"];?\s*\n)+/m);
  if (!importBlock) {
    console.error('❌ Gagal nemu block import.');
    process.exit(1);
  }
  page = page.replace(importBlock[0], importBlock[0] + `import StudentRealtimeNotifs from '@/components/StudentRealtimeNotifs';\n`);
  console.log('✓ Added import');
}

// 2b. Render component — inject before ClassDetailModal render (they're both fixed-position overlays)
if (!page.includes('<StudentRealtimeNotifs')) {
  const anchors = [
    /\{detailReg\s*&&\s*<ClassDetailModal/,
    /\{bookingReg\s*&&\s*\(/,
    /(\n\s*<\/div>\s*\n\s*\)\s*;\s*\n\s*\})/,
  ];
  let injected = false;
  for (const a of anchors) {
    const m = page.match(a);
    if (m && m.index !== undefined) {
      const injection = `<StudentRealtimeNotifs />\n      `;
      page = page.slice(0, m.index) + injection + page.slice(m.index);
      injected = true;
      console.log('✓ Rendered <StudentRealtimeNotifs /> (anchor: ' + a.source.slice(0, 30) + '…)');
      break;
    }
  }
  if (!injected) {
    console.log('⚠️  Gak bisa inject render. Tambahin manual <StudentRealtimeNotifs /> di akhir return JSX.');
  }
}

if (page !== orig) {
  fs.writeFileSync(PAGE, page);
  console.log('✓ Saved', PAGE);
} else {
  console.log('ℹ️  page.tsx tidak berubah.');
}

// =========================================================================
// STEP 3 — Push
// =========================================================================

try {
  console.log('\n🔄 git add / commit / push...');
  execSync('git add -A', { stdio: 'inherit' });
  try {
    execSync('git commit -m "feat(akun): student realtime notif system (bell + toast + sound)"', { stdio: 'inherit' });
  } catch {
    console.log('ℹ️  Nothing to commit.');
  }
  execSync('git push', { stdio: 'inherit' });
  console.log('\n✅ Pushed.');

  fs.unlinkSync(process.argv[1]);
  console.log('🗑️  Self-deleted.');
} catch (e) {
  console.error('\n❌ Git failed:', e.message);
}
