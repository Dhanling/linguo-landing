"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
// [kelas-detail-resilient-v1] pakai klien BERSAMA — instance GoTrue ganda bikin
// race refresh token (query bisa 401 sesaat padahal user masih login).
import { supabase } from "@/lib/supabase-client";
import { LayoutGrid, BookOpen, Library, CalendarDays, Star, Settings, LogOut, Moon, Sun, ClipboardCheck, Clapperboard, Layers, type LucideIcon } from "lucide-react";

export type AkunTab = "beranda" | "jadwal" | "materi" | "sertifikat" | "akun" | "pustaka" | "simulasi"; // [linguo-patch:shell-pustaka-nav-v1] [simulasi-inshell-v1]

type NavItem =
  | { key: AkunTab; label: string; icon: LucideIcon; soon?: false }
  | { key: string; label: string; icon: LucideIcon; soon: true }
  // simulasi-paywall-v1 — item link ke route terpisah, bukan tab.
  | { key: string; label: string; icon: LucideIcon; href: string };

const NAV: NavItem[] = [
  { key: "beranda", label: "Beranda", icon: LayoutGrid },
  { key: "materi", label: "Kelas & Materi", icon: BookOpen },
  // [simulasi-inshell-v1] jadi tab (sidebar tetap tampil), bukan route terpisah lagi
  { key: "simulasi", label: "Simulasi Tes", icon: ClipboardCheck },
  { key: "watch", label: "Watch & Learn", icon: Clapperboard, href: "/watch" },
  // Entry point global ke flashcard kata tersimpan (halaman /kosakata).
  { key: "kosakata", label: "Kosakata Saya", icon: Layers, href: "/kosakata" },
  // [perf:sidebar-nav-v1] link langsung ke route-nya (dulu tab → redirect full reload)
  { key: "pustaka", label: "Perpustakaan", icon: Library, href: "/akun/perpustakaan" },
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
      {/* [ling-lms-dark-v2] dark mode scoped & class-based — !important biar menang atas utility Tailwind.
          Palet HITAM dominan (bukan abu kebiruan) + teks kontras tinggi; nutup juga class gray-* dan
          hex hardcoded (#12172B, #6B7280, dst.) yang dulu lolos & bikin teks tak kebaca. */}
      <style>{`
        /* ── Latar: hitam dominan ── */
        .lms-dark{background:#000000;}
        .lms-dark .bg-\\[\\#EEF1F4\\]{background-color:#000000 !important;}
        .lms-dark .lg\\:bg-\\[\\#16796E\\]{background-color:#000000 !important;}
        .lms-dark .bg-white{background-color:#0a0a0a !important;}
        .lms-dark .bg-gray-50,.lms-dark .bg-slate-50,.lms-dark .bg-\\[\\#F5F6F8\\],.lms-dark .bg-\\[\\#F5F7F8\\],.lms-dark .bg-\\[\\#EAEDF0\\]{background-color:#121212 !important;}
        .lms-dark .bg-gray-100,.lms-dark .bg-slate-100,.lms-dark .bg-\\[\\#E8EAEE\\],.lms-dark .bg-\\[\\#F1F3F5\\]{background-color:#1a1a1a !important;}
        .lms-dark .bg-gray-200,.lms-dark .bg-slate-200,.lms-dark .bg-gray-300,.lms-dark .bg-slate-300{background-color:#262626 !important;}
        .lms-dark .bg-white\\/90,.lms-dark .bg-white\\/95{background-color:rgba(5,5,5,0.92) !important;}
        .lms-dark .bg-white\\/60,.lms-dark .bg-white\\/70,.lms-dark .bg-white\\/80{background-color:rgba(10,10,10,0.75) !important;}
        .lms-dark .bg-\\[\\#F0FAF8\\]{background-color:rgba(45,212,191,0.10) !important;}
        /* ── Teks: putih & abu terang (kontras tinggi) ── */
        .lms-dark .text-slate-900,.lms-dark .text-slate-800,.lms-dark .text-slate-700,.lms-dark .text-gray-900,.lms-dark .text-gray-800,.lms-dark .text-gray-700,.lms-dark .text-\\[\\#12172B\\]{color:#ffffff !important;}
        .lms-dark .text-slate-600,.lms-dark .text-gray-600{color:#e5e5e5 !important;}
        .lms-dark .text-slate-500,.lms-dark .text-gray-500,.lms-dark .text-\\[\\#6B7280\\]{color:#c9ced6 !important;}
        .lms-dark .text-slate-400,.lms-dark .text-gray-400,.lms-dark .text-\\[\\#9CA3AF\\]{color:#aab0ba !important;}
        .lms-dark .text-slate-300,.lms-dark .text-gray-300{color:#c9ced6 !important;}
        .lms-dark input::placeholder,.lms-dark textarea::placeholder{color:#8b909a !important;}
        /* ── Aksen teal: dicerahin biar kebaca di atas hitam ── */
        .lms-dark .text-teal-700,.lms-dark .text-teal-600,.lms-dark .text-teal-500,.lms-dark .text-\\[\\#16796E\\],.lms-dark .text-\\[\\#147878\\],.lms-dark .text-\\[\\#0F5A52\\],.lms-dark .text-\\[\\#0C8163\\],.lms-dark .text-\\[\\#12A37E\\]{color:#2dd4bf !important;}
        .lms-dark .bg-teal-50{background-color:rgba(45,212,191,0.12) !important;}
        .lms-dark .bg-teal-100{background-color:rgba(45,212,191,0.18) !important;}
        .lms-dark .border-teal-100,.lms-dark .border-teal-200,.lms-dark .border-teal-300{border-color:rgba(45,212,191,0.35) !important;}
        /* ── Chip status warna (amber/blue/red/emerald): tint gelap + teks terang ── */
        .lms-dark .bg-amber-50{background-color:rgba(245,158,11,0.12) !important;}
        .lms-dark .bg-amber-100{background-color:rgba(245,158,11,0.20) !important;}
        .lms-dark .text-amber-700,.lms-dark .text-amber-800{color:#fcd34d !important;}
        .lms-dark .text-amber-600{color:#fbbf24 !important;}
        .lms-dark .border-amber-200{border-color:rgba(245,158,11,0.35) !important;}
        .lms-dark .bg-blue-50{background-color:rgba(59,130,246,0.12) !important;}
        .lms-dark .text-blue-700{color:#93c5fd !important;}
        .lms-dark .text-blue-600{color:#60a5fa !important;}
        .lms-dark .border-blue-100,.lms-dark .border-blue-200{border-color:rgba(59,130,246,0.30) !important;}
        .lms-dark .bg-red-50{background-color:rgba(239,68,68,0.12) !important;}
        .lms-dark .text-red-700{color:#fca5a5 !important;}
        .lms-dark .text-red-600{color:#f87171 !important;}
        .lms-dark .bg-emerald-50{background-color:rgba(16,185,129,0.12) !important;}
        .lms-dark .text-emerald-700{color:#6ee7b7 !important;}
        .lms-dark .text-emerald-600{color:#34d399 !important;}
        /* ── Border & pemisah: cukup kelihatan buat misahin kartu dari latar hitam ── */
        .lms-dark .border-slate-100,.lms-dark .border-slate-200,.lms-dark .border-gray-100,.lms-dark .border-gray-200{border-color:#262626 !important;}
        .lms-dark .border-slate-300,.lms-dark .border-gray-300{border-color:#3f3f46 !important;}
        .lms-dark .divide-gray-50 > *,.lms-dark .divide-slate-100 > *{border-color:#1f1f1f !important;}
        /* ── Hover state ── */
        .lms-dark .hover\\:bg-gray-50:hover,.lms-dark .hover\\:bg-slate-50:hover,.lms-dark .hover\\:bg-white:hover{background-color:#1a1a1a !important;}
        .lms-dark .hover\\:bg-gray-100:hover,.lms-dark .hover\\:bg-slate-100:hover,.lms-dark .hover\\:bg-gray-200:hover,.lms-dark .hover\\:bg-slate-200:hover{background-color:#262626 !important;}
        .lms-dark .hover\\:bg-\\[\\#F5F6F8\\]:hover{background-color:#1a1a1a !important;}
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
                // [perf:sidebar-nav-v1] next/link → navigasi client-side + prefetch otomatis
                // (dulu <a> biasa = full page reload tiap pindah menu)
                const isActiveLink = item.key === active;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    prefetch
                    className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                      isActiveLink
                        ? "bg-[#0F5A52] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                    aria-current={isActiveLink ? "page" : undefined}
                  >
                    <Icon className="h-[22px] w-[22px] transition-transform duration-500 group-hover:rotate-[360deg]" />
                    <Tip label={item.label} />
                  </Link>
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
