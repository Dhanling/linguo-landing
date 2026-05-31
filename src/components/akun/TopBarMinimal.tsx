"use client";

import NotificationBell from "@/components/NotificationBell";

type Props = {
  studentId?: string;
  avatarUrl?: string;
  firstName: string;
  onAvatarClick?: () => void;
};

export default function TopBarMinimal({
  studentId,
}: Props) {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100 lg:bg-transparent lg:border-0 lg:backdrop-blur-none">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-end px-4 sm:px-6">
        {studentId && <NotificationBell userId={studentId} userType="student" />}
      </div>
    </header>
  );
}
