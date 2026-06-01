"use client";

import type { ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";
import { LayoutGrid, BookOpen, CalendarDays, Star, Settings, LogOut, type LucideIcon } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type AkunTab = "beranda" | "jadwal" | "materi" | "akun";

type NavItem =
  | { key: AkunTab; label: string; icon: LucideIcon; soon?: false }
  | { key: string; label: string; icon: LucideIcon; soon: true };

const NAV: NavItem[] = [
  { key: "beranda", label: "Beranda", icon: LayoutGrid },
  { key: "materi", label: "Kelas & Materi", icon: BookOpen },
  { key: "jadwal", label: "Jadwal", icon: CalendarDays },
  { key: "sertifikat", label: "Sertifikat · Segera", icon: Star, soon: true },
  { key: "akun", label: "Pengaturan", icon: Settings },
];

function Tip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#0A463F] px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
      {label}
    </span>
  );
}

export default function StudentShell({
  active,
  onTabChange,
  children,
}: {
  active: AkunTab;
  onTabChange: (t: AkunTab) => void;
  firstName?: string;
  avatarUrl?: string;
  segment?: "b2c" | "b2b";
  children: ReactNode;
}) {
  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen w-full bg-[#EEF1F4] lg:flex lg:justify-center lg:p-6">
      <div className="w-full lg:flex lg:max-w-[1320px] lg:rounded-[40px] lg:bg-[#16796E] lg:p-3 lg:shadow-[0_40px_80px_-30px_rgba(10,70,63,0.45)]">

        {/* ICON RAIL — desktop only */}
        <aside className="hidden w-[96px] shrink-0 flex-col items-center py-7 lg:flex">
          {/* logo */}
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
            <img src="/images/logo-white.png" alt="Linguo" className="h-6 w-6 object-contain" />
          </div>

          {/* nav */}
          <nav className="mt-12 flex flex-col items-center gap-3">
            {NAV.map((item) => {
              const Icon = item.icon;
              if (item.soon) {
                return (
                  <div
                    key={item.key}
                    className="group relative flex h-12 w-12 cursor-default items-center justify-center rounded-2xl text-white/35"
                  >
                    <Icon className="h-[22px] w-[22px]" />
                    <Tip label={item.label} />
                  </div>
                );
              }
              const isActive = item.key === active;
              return (
                <button
                  key={item.key}
                  onClick={() => onTabChange(item.key as AkunTab)}
                  className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                    isActive
                      ? "bg-[#0F5A52] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-[22px] w-[22px]" />
                  <Tip label={item.label} />
                </button>
              );
            })}
          </nav>

          {/* logout */}
          <button
            onClick={signOut}
            className="group relative mt-auto flex h-12 w-12 items-center justify-center rounded-2xl text-white/80 transition hover:bg-[#0F5A52] hover:text-white"
          >
            <LogOut className="h-[22px] w-[22px]" />
            <Tip label="Keluar" />
          </button>
        </aside>

        {/* WHITE PANEL — semua konten tab masuk sini */}
        <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col bg-white pb-20 lg:min-h-0 lg:rounded-[26px] lg:pb-0">
          {children}
        </div>
      </div>
    </div>
  );
}
