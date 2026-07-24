"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
// [kelas-detail-resilient-v1] pakai klien BERSAMA — instance GoTrue ganda bikin
// race refresh token (query bisa 401 sesaat padahal user masih login).
import { supabase } from "@/lib/supabase-client";
import { canAccessMateri as canAccessMateriGate } from "@/lib/materiGate"; // [dev-gate-lingbook-v1]
import { LayoutGrid, BookOpen, Library, CalendarDays, Star, Settings, LogOut, Moon, Sun, ClipboardCheck, Clapperboard, Layers, BookText, type LucideIcon } from "lucide-react";

export type AkunTab = "beranda" | "jadwal" | "materi" | "sertifikat" | "akun" | "pustaka" | "simulasi"; // [linguo-patch:shell-pustaka-nav-v1] [simulasi-inshell-v1]

type NavItem =
  | { key: AkunTab; label: string; icon: LucideIcon; soon?: false }
  | { key: string; label: string; icon: LucideIcon; soon: true }
  // simulasi-paywall-v1 — item link ke route terpisah, bukan tab.
  | { key: string; label: string; icon: LucideIcon; href: string };

// [dev-gate-lingbook-v1] menu yang masih development → cuma tampil buat email allowlist
// (lib/materiGate). Digate DI SINI biar semua halaman yang pakai StudentShell ikut aman,
// bukan cuma /akun.
const DEV_ONLY_KEYS = new Set(["materi", "lingbook"]);

const NAV: NavItem[] = [
  { key: "beranda", label: "Beranda", icon: LayoutGrid },
  { key: "materi", label: "Kelas & Materi", icon: BookOpen },
  // [lingbook-phase1-v1] ebook interaktif → route terpisah /akun/lingbook
  { key: "lingbook", label: "Lingbook", icon: BookText, href: "/akun/lingbook" },
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

// [sidebar-label-v1] item sidebar: ikon + TEKS label (bukan ikon-saja + tooltip)
// supaya menu langsung terbaca tanpa harus hover satu-satu.
const NAV_ITEM_BASE = "group relative flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-[13px] font-semibold transition";

export default function StudentShell({
  active,
  onTabChange,
  canAccessMateri = true,
  children,
}: {
  active: AkunTab;
  onTabChange: (t: AkunTab) => void;
  firstName?: string;
  avatarUrl?: string;
  segment?: "b2c" | "b2b";
  // [materi-gate-v1] menu "Kelas & Materi" masih under development → sembunyikan
  // dari sidebar kalau email tidak masuk allowlist.
  canAccessMateri?: boolean;
  children: ReactNode;
}) {
  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // [dev-gate-lingbook-v1] cek email sesi → menu development (Kelas & Materi, Lingbook)
  // default SEMBUNYI sampai terbukti masuk allowlist, biar ga sempat kelihatan sekilas.
  const [devOk, setDevOk] = useState(false);
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (alive) setDevOk(canAccessMateriGate(session?.user?.email));
    });
    return () => { alive = false; };
  }, []);
  const showNav = (key: string) =>
    !DEV_ONLY_KEYS.has(key) || (devOk && (key !== "materi" || canAccessMateri));

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

        {/* SIDEBAR — desktop only. [sidebar-label-v1] ikon + teks label */}
        <aside className="hidden w-[216px] shrink-0 flex-col px-4 py-7 lg:flex">
          {/* logo — white bubble langsung di atas teal, tanpa kotak putih */}
          <div className="flex items-center gap-2.5 px-2">
            <img src="/images/logo-linguo-icon.png" alt="Linguo" className="h-9 w-9 object-contain" />
            <span className="text-lg font-bold text-white">Linguo</span>
          </div>

          {/* nav */}
          <nav className="mt-10 flex flex-col gap-1.5">
            {NAV.filter((item) => showNav(item.key)).map((item) => {
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
                    className={`${NAV_ITEM_BASE} ${
                      isActiveLink
                        ? "bg-[#0F5A52] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                    aria-current={isActiveLink ? "page" : undefined}
                  >
                    <Icon className="h-[20px] w-[20px] shrink-0 transition-transform duration-500 group-hover:rotate-[360deg]" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              }
              if (item.soon) {
                return (
                  <div key={item.key} className={`${NAV_ITEM_BASE} cursor-default text-white/35`}>
                    <Icon className="h-[20px] w-[20px] shrink-0 transition-transform duration-500 group-hover:rotate-[360deg]" />
                    <span className="truncate">{item.label}</span>
                  </div>
                );
              }
              const isActive = item.key === active;
              return (
                <button
                  key={item.key}
                  onClick={() => onTabChange(item.key as AkunTab)}
                  className={`${NAV_ITEM_BASE} ${
                    isActive
                      ? "bg-[#0F5A52] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-[20px] w-[20px] shrink-0 transition-transform duration-500 group-hover:rotate-[360deg]" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* bottom group: dark toggle + logout */}
          <div className="mt-auto flex flex-col gap-1.5">
            {/* [ling-lms-dark-v1] toggle dark mode (state sync ke lesson player) */}
            <button
              onClick={toggleDark}
              className={`${NAV_ITEM_BASE} text-white/80 hover:bg-[#0F5A52] hover:text-white`}
              aria-label={isDark ? "Mode terang" : "Mode gelap"}
            >
              {isDark ? (
                <Sun className="h-[20px] w-[20px] shrink-0 text-amber-300 transition-transform duration-500 group-hover:rotate-[360deg]" />
              ) : (
                <Moon className="h-[20px] w-[20px] shrink-0 transition-transform duration-500 group-hover:rotate-[360deg]" />
              )}
              <span className="truncate">{isDark ? "Mode terang" : "Mode gelap"}</span>
            </button>
            {/* logout */}
            <button onClick={signOut} className={`${NAV_ITEM_BASE} text-white/80 hover:bg-[#0F5A52] hover:text-white`}>
              <LogOut className="h-[20px] w-[20px] shrink-0 transition-transform duration-500 group-hover:rotate-[360deg]" />
              <span className="truncate">Keluar</span>
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
