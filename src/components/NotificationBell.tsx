'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
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
  /** "bell" = floating emoji bell (default, dropdown opens left/down).
   *  "rail" = icon-rail button (teal sidebar), dropdown opens to the right. */
  variant?: 'bell' | 'rail';
}

export default function NotificationBell({ userId, userType, variant = 'bell' }: Props) {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const unreadCount = notifs.filter((n) => !n.is_read).length;
  const isRail = variant === 'rail';

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

  const dropdownPos = isRail
    ? 'absolute left-[calc(100%+12px)] top-0 w-80'
    : 'absolute right-0 top-11 w-80';

  return (
    <div className={isRail ? 'group relative' : 'relative'} ref={dropdownRef}>
      {/* Trigger */}
      {isRail ? (
        <button
          onClick={() => { setOpen(!open); if (!open && unreadCount > 0) markAllRead(); }}
          className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl transition ${
            open
              ? 'bg-[#0F5A52] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
              : 'text-white/70 hover:bg-white/10 hover:text-white'
          }`}
          aria-label="Notifikasi"
        >
          <Bell className="h-[22px] w-[22px]" />
          {unreadCount > 0 && (
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#16796E]" />
          )}
          {!open && (
            <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#0A463F] px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
              Notifikasi
            </span>
          )}
        </button>
      ) : (
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
      )}

      {/* Dropdown */}
      {open && (
        <div className={`${dropdownPos} bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden`}>
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
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${!n.is_read ? 'bg-green-50' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${!n.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
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
