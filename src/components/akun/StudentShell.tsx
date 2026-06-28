"use client";

import { type ReactNode, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { LayoutGrid, BookOpen, Library, CalendarDays, Star, Settings, LogOut, Moon, Sun, ClipboardCheck, type LucideIcon } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type AkunTab = "beranda" | "jadwal" | "materi" | "sertifikat" | "akun" | "pustaka"; // [linguo-patch:shell-pustaka-nav-v1]

type NavItem =
  | { key: AkunTab; label: string; icon: LucideIcon; soon?: false }
  | { key: string; label: string; icon: LucideIcon; soon: true }
  // simulasi-paywall-v1 — item link ke route terpisah (/akun/simulasi), bukan tab.
  | { key: string; label: string; icon: LucideIcon; href: string };

const NAV: NavItem[] = [
  { key: "beranda", label: "Beranda", icon: LayoutGrid },
  { key: "materi", label: "Kelas & Materi", icon: BookOpen },
  { key: "simulasi", label: "Simulasi Tes", icon: ClipboardCheck, href: "/akun/simulasi" },
  { key: "pustaka", label: "Perpustakaan", icon: Library },
  { key: "jadwal", label: "Jadwal", icon: CalendarDays },
  { key: "sertifikat", label: "Sertifikat", icon: Star },
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

  // [ling-lms-dark-v1] dark mode dashboard — state sync dgn LessonPlayer via localStorage "lms-dark-mode"
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    try { setIsDark(localStorage.getItem("lms-dark-mode") === "1"); } catch {}
  }, []);
  const toggleDark = () =>
    setIsDark((v) => {
      const nv = !v;
      try { localStorage.setItem("lms-dark-mode", nv ? "1" : "0"); } catch {}
      return nv;
    });

  return (
    /* [linguo-patch:shell-frame-ref-v2] full-bleed: teal isi penuh viewport (no outer grey), white canvas float di dalem */
    <div className={`min-h-screen w-full bg-[#EEF1F4] lg:flex lg:p-0 ${isDark ? "lms-dark" : ""}`}>
      {/* [ling-lms-dark-v1] dark mode scoped & class-based — !important biar menang atas utility Tailwind */}
      <style>{`
        .lms-dark{background:#0b1220;}
        .lms-dark .bg-\\[\\#EEF1F4\\]{background-color:#0b1220 !important;}
        .lms-dark .bg-white{background-color:#111827 !important;}
        .lms-dark .bg-\\[\\#F5F6F8\\]{background-color:#1f2937 !important;}
        .lms-dark .text-slate-900,.lms-dark .text-slate-800,.lms-dark .text-slate-700,.lms-dark .text-slate-600{color:#f8fafc !important;}
        .lms-dark .text-slate-500,.lms-dark .text-slate-400{color:#cbd5e1 !important;}
        .lms-dark .border-slate-100,.lms-dark .border-slate-200{border-color:#1f2937 !important;}
        .lms-dark .border-slate-300{border-color:#374151 !important;}
      `}</style>
      <div className="w-full lg:flex lg:bg-[#16796E] lg:p-3 lg:h-screen lg:min-h-[600px]">

        {/* ICON RAIL — desktop only */}
        <aside className="hidden w-[96px] shrink-0 flex-col items-center py-7 lg:flex">
          {/* logo — white bubble langsung di atas teal, tanpa kotak putih */}
          <div className="flex h-12 w-12 items-center justify-center">
            <img src="/images/logo-linguo-icon.png" alt="Linguo" className="h-9 w-9 object-contain" />
          </div>

          {/* nav */}
          <nav className="mt-12 flex flex-col items-center gap-3">
            {NAV.map((item) => {
              const Icon = item.icon;
              if ("href" in item) {
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    className="group relative flex h-12 w-12 items-center justify-center rounded-2xl text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="h-[22px] w-[22px] transition-transform duration-500 group-hover:rotate-[360deg]" />
                    <Tip label={item.label} />
                  </a>
                );
              }
              if (item.soon) {
                return (
                  <div
                    key={item.key}
                    className="group relative flex h-12 w-12 cursor-default items-center justify-center rounded-2xl text-white/35"
                  >
                    <Icon className="h-[22px] w-[22px] transition-transform duration-500 group-hover:rotate-[360deg]" />
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
                  <Icon className="h-[22px] w-[22px] transition-transform duration-500 group-hover:rotate-[360deg]" />
                  <Tip label={item.label} />
                </button>
              );
            })}
          </nav>

          {/* bottom group: dark toggle + logout */}
          <div className="mt-auto flex flex-col items-center gap-3">
            {/* [ling-lms-dark-v1] toggle dark mode (state sync ke lesson player) */}
            <button
              onClick={toggleDark}
              className="group relative flex h-12 w-12 items-center justify-center rounded-2xl text-white/80 transition hover:bg-[#0F5A52] hover:text-white"
              aria-label={isDark ? "Mode terang" : "Mode gelap"}
            >
              {isDark ? (
                <Sun className="h-[22px] w-[22px] text-amber-300 transition-transform duration-500 group-hover:rotate-[360deg]" />
              ) : (
                <Moon className="h-[22px] w-[22px] transition-transform duration-500 group-hover:rotate-[360deg]" />
              )}
              <Tip label={isDark ? "Mode terang" : "Mode gelap"} />
            </button>
            {/* logout */}
            <button
              onClick={signOut}
              className="group relative flex h-12 w-12 items-center justify-center rounded-2xl text-white/80 transition hover:bg-[#0F5A52] hover:text-white"
            >
              <LogOut className="h-[22px] w-[22px] transition-transform duration-500 group-hover:rotate-[360deg]" />
              <Tip label="Keluar" />
            </button>
          </div>
        </aside>

        {/* WHITE PANEL — semua konten tab masuk sini */}
        <div className={`flex min-h-screen w-full min-w-0 flex-1 flex-col bg-white pb-20 lg:min-h-0 lg:pb-0 lg:rounded-[26px] ${active === "materi" ? "lg:overflow-hidden" : "lg:overflow-y-auto"}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
