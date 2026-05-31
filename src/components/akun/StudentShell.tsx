"use client";

import type { ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";
import { LayoutDashboard, Calendar, BookOpen, Award, Settings, LogOut } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TEAL_DEEP = "#0F6E56";
const YELLOW = "#FFC93C";

export type AkunTab = "beranda" | "jadwal" | "materi" | "akun";

type Item =
  | { key: AkunTab; label: string; icon: any; soon?: false }
  | { key: string; label: string; icon: any; soon: true };

const NAV: Item[] = [
  { key: "beranda", label: "Beranda", icon: LayoutDashboard },
  { key: "jadwal", label: "Jadwal", icon: Calendar },
  { key: "materi", label: "Materi", icon: BookOpen },
  { key: "sertifikat", label: "Sertifikat", icon: Award, soon: true },
  { key: "akun", label: "Akun", icon: Settings },
];

export default function StudentShell({
  active,
  onTabChange,
  firstName,
  segment = "b2c",
  children,
}: {
  active: AkunTab;
  onTabChange: (t: AkunTab) => void;
  firstName: string;
  avatarUrl?: string;
  segment?: "b2c" | "b2b";
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/80 to-white pb-20 lg:pb-8">
      {/* Desktop sidebar (hidden on mobile — mobile keeps the existing bottom-nav) */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col text-white lg:flex"
        style={{ background: TEAL_DEEP }}
      >
        <div className="flex items-center px-5 py-5">
          <img src="/images/logo-linguo-white-full.png" alt="Linguo" className="h-8 w-auto" />
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const base =
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition text-left";
            if (item.soon) {
              return (
                <div key={item.key} className={`${base} cursor-default text-white/35`} title="Segera hadir">
                  <Icon className="h-[18px] w-[18px]" />
                  <span className="flex-1">{item.label}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/55">
                    Segera
                  </span>
                </div>
              );
            }
            const isActive = item.key === active;
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key as AkunTab)}
                className={`${base} ${
                  isActive ? "font-semibold" : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
                style={isActive ? { background: YELLOW, color: TEAL_DEEP } : undefined}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={() => onTabChange("akun")}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">
                {firstName || "Siswa"}
              </span>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={
                  segment === "b2b"
                    ? { background: YELLOW, color: TEAL_DEEP }
                    : { background: "rgba(255,255,255,0.15)", color: "#fff" }
                }
              >
                {segment === "b2b" ? "Program Korporat" : "Akun Pribadi"}
              </span>
            </span>
          </button>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" /> Keluar
          </button>
        </div>
      </aside>

      {/* Content (offset only on desktop; mobile = original full-width layout) */}
      <div className="lg:pl-64">{children}</div>
    </div>
  );
}
