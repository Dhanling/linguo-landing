"use client";

import NotificationBell from "@/components/NotificationBell";

type Props = {
  studentId?: string;
  avatarUrl?: string;
  firstName: string;
  onAvatarClick?: () => void;
  onEnrollClick?: () => void;
};

export default function TopBarMinimal({
  studentId,
  avatarUrl,
  firstName,
  onAvatarClick,
  onEnrollClick,
}: Props) {
  const initial = firstName?.[0]?.toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2 group">
          <div className="h-7 w-7 rounded-lg bg-[#1A9E9E] flex items-center justify-center group-hover:bg-[#2ABFBF] transition-colors">
            <img src="/images/logo-white.png" alt="" className="h-4 w-4 object-contain" />
          </div>
          <span className="font-bold text-gray-900">Linguo.id</span>
        </a>

        <div className="flex items-center gap-2 sm:gap-3">
          {onEnrollClick && (
            <button
              onClick={onEnrollClick}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-[#1A9E9E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F6E56] transition-colors"
            >
              + Tambah Kelas
            </button>
          )}

          {studentId && <NotificationBell userId={studentId} userType="student" />}

          <button onClick={onAvatarClick} className="shrink-0" aria-label="Buka akun">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full ring-2 ring-teal-100 object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-[#1A9E9E] font-bold text-sm">
                {initial}
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
