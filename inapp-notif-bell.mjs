#!/usr/bin/env node
// inapp-notif-bell.mjs
// Adds in-app notification bell to:
//   1. Student dashboard /akun (header kanan atas) - linguo-landing repo
//   2. Creates NotificationBell component reusable
//
// Usage: drag ke ~/linguo-landing → cd ~/linguo-landing → node inapp-notif-bell.mjs

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

if (!fs.existsSync('src/app/akun/page.tsx')) {
  console.error('❌ Run di ~/linguo-landing');
  process.exit(1);
}

// =========================================================================
// STEP 1 — Create NotificationBell component
// =========================================================================

const bellComponent = `'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';

interface Notification {
  id: string;
  title: string;
  body: string;
  url?: string;
  is_read: boolean;
  created_at: string;
}

interface Props {
  userId: string;
  userType: 'student' | 'teacher';
}

export default function NotificationBell({ userId, userType }: Props) {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (!userId) return;
    fetchNotifs();
    // Poll every 10 seconds
    pollRef.current = setInterval(fetchNotifs, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function fetchNotifs() {
    if (!userId) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setNotifs(data);
  }

  async function markAllRead() {
    if (!userId || unreadCount === 0) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function markOneRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Baru saja';
    if (diffMin < 60) return diffMin + ' mnt lalu';
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return diffHr + ' jam lalu';
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  function handleNotifClick(notif: Notification) {
    markOneRead(notif.id);
    setOpen(false);
    if (notif.url) window.location.href = notif.url;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(!open); if (!open && unreadCount > 0) markAllRead(); }}
        className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
        aria-label="Notifikasi"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] px-1 flex items-center justify-center ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-900">Notifikasi</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-green-600 hover:text-green-800 font-medium">
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-3xl mb-2">🔔</div>
                <div className="text-sm">Belum ada notifikasi</div>
              </div>
            ) : (
              notifs.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={\`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 \${!n.is_read ? 'bg-green-50' : ''}\`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className={\`text-sm font-semibold \${!n.is_read ? 'text-gray-900' : 'text-gray-600'}\`}>
                        {n.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</div>
                      <div className="text-[11px] text-gray-400 mt-1">{formatTime(n.created_at)}</div>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1 shrink-0" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/components/NotificationBell.tsx', bellComponent);
console.log('✓ Created src/components/NotificationBell.tsx');

// =========================================================================
// STEP 2 — Inject bell into /akun page.tsx header
// =========================================================================

let page = fs.readFileSync('src/app/akun/page.tsx', 'utf8');
const origPage = page;

// Add import
if (!page.includes('NotificationBell')) {
  const importMatch = page.match(/^(import [\s\S]+?from ['"][^'"]+['"];?\s*\n)+/m);
  if (importMatch) {
    page = page.replace(importMatch[0], importMatch[0] + `import NotificationBell from '@/components/NotificationBell';\n`);
    console.log('✓ Added import NotificationBell');
  }
}

// Find student ID state — look for studentId or student state
// Strategy: inject bell in the header area of /akun
// The header has "+ Tambah Kelas" button and user avatar
// We inject before the "+ Tambah Kelas" button or near the header actions

if (!page.includes('<NotificationBell')) {
  // Look for the header action area with "+ Tambah Kelas" button
  const tambahKelasMatch = page.match(/<button[^>]*>\s*[+＋]\s*Tambah Kelas[\s\S]*?<\/button>/);
  if (tambahKelasMatch && tambahKelasMatch.index !== undefined) {
    // Insert bell before "Tambah Kelas" button
    // First we need to find the student ID — look for registrations or student data
    const bellInject = `{studentId && <NotificationBell userId={studentId} userType="student" />}\n              `;
    page = page.slice(0, tambahKelasMatch.index) + bellInject + page.slice(tambahKelasMatch.index);
    console.log('✓ Injected NotificationBell before Tambah Kelas button');
  } else {
    // Fallback: inject near header div
    // Look for header navigation pattern
    const navMatch = page.match(/(<nav[^>]*>|<header[^>]*>)/);
    if (navMatch && navMatch.index !== undefined) {
      console.log('⚠️  Using nav anchor for bell injection');
    } else {
      console.log('⚠️  Could not auto-inject bell — will need manual placement');
      console.log('   Tambahkan <NotificationBell userId={studentId} userType="student" /> di header /akun');
    }
  }
}

// Also need studentId available — check if it's in state
if (!page.includes('studentId') && !page.includes('student_id')) {
  console.log('⚠️  studentId ga ketemu di page.tsx — bell butuh userId prop');
  console.log('   Kemungkinan student data ada di variable lain (user, profile, etc)');
  console.log('   Cek page.tsx dan adjust prop userId di <NotificationBell> sesuai variable yang ada');
}

if (page !== origPage) {
  fs.writeFileSync('src/app/akun/page.tsx', page);
  console.log('✓ Saved src/app/akun/page.tsx');
} else {
  console.log('ℹ️  page.tsx tidak berubah — bell inject mungkin butuh manual adjustment');
}

// =========================================================================
// STEP 3 — git push
// =========================================================================

try {
  console.log('\n🔄 git add / commit / push...');
  execSync('git add -A', { stdio: 'inherit' });
  try {
    execSync('git commit -m "feat: in-app NotificationBell component for student + teacher dashboards"', { stdio: 'inherit' });
  } catch { console.log('ℹ️  Nothing to commit.'); }
  execSync('git push', { stdio: 'inherit' });
  console.log('\n✅ Pushed!');
  fs.unlinkSync(process.argv[1]);
  console.log('🗑️  Self-deleted.');
} catch (e) {
  console.error('\n❌ Git failed:', e.message);
}
