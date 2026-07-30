"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
// [kelas-detail-resilient-v1] pakai klien BERSAMA — instance GoTrue ganda bikin
// race refresh token (query bisa 401 sesaat padahal user masih login).
import { supabase } from "@/lib/supabase-client";
import { canAccessMateri as canAccessMateriGate } from "@/lib/materiGate"; // [dev-gate-lingbook-v1]
import NotificationBell from "@/components/NotificationBell";
import MobileBottomNav from "@/components/akun/MobileBottomNav";
import { LayoutGrid, BookOpen, Library, CalendarDays, Star, Settings, LogOut, Moon, Sun, ClipboardCheck, Clapperboard, Layers, BookText, MessagesSquare, Menu, X, type LucideIcon } from "lucide-react";

export type AkunTab = "beranda" | "jadwal" | "materi" | "sertifikat" | "akun" | "pustaka" | "simulasi"; // [linguo-patch:shell-pustaka-nav-v1] [simulasi-inshell-v1]

// [shell-nav-groups-v1] key menu yang bukan tab (route terpisah) ikut dipakai sbg
// penanda "active" — dulu di-cast paksa ke AkunTab, jadi highlight-nya ga pernah nyala.
export type NavKey = AkunTab | "watch" | "kosakata" | "lingbook" | "grup";

type NavItem =
  | { key: AkunTab; label: string; icon: LucideIcon; soon?: false }
  | { key: string; label: string; icon: LucideIcon; soon: true }
  // simulasi-paywall-v1 — item link ke route terpisah, bukan tab.
  | { key: string; label: string; icon: LucideIcon; href: string };

// [dev-gate-lingbook-v1] menu yang masih development → cuma tampil buat email allowlist
// (lib/materiGate). Digate DI SINI biar semua halaman yang pakai StudentShell ikut aman,
// bukan cuma /akun.
const DEV_ONLY_KEYS = new Set(["materi", "lingbook"]);

// [shell-nav-groups-v1] menu dikelompokkan + dikasih label seksi. Dulu 10 item rata
// tanpa pengelompokan → semua bobotnya sama, siswa mesti coba-coba satu-satu.
// "Beranda" sengaja di luar grup (pintu masuk, bukan salah satu kategori).
const NAV_HOME: NavItem = { key: "beranda", label: "Beranda", icon: LayoutGrid };

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Belajar",
    items: [
      { key: "materi", label: "Kelas & Materi", icon: BookOpen },
      // [lingbook-phase1-v1] ebook interaktif → route terpisah /akun/lingbook
      { key: "lingbook", label: "Lingbook", icon: BookText, href: "/akun/lingbook" },
      // [simulasi-inshell-v1] jadi tab (sidebar tetap tampil), bukan route terpisah lagi
      { key: "simulasi", label: "Simulasi Tes", icon: ClipboardCheck },
      { key: "watch", label: "Watch & Learn", icon: Clapperboard, href: "/watch" },
      // Entry point global ke flashcard kata tersimpan (halaman /kosakata).
      { key: "kosakata", label: "Kosakata Saya", icon: Layers, href: "/kosakata" },
    ],
  },
  {
    title: "Aktivitas",
    items: [
      { key: "jadwal", label: "Jadwal", icon: CalendarDays },
      // [student-group-chat-v1] grup WhatsApp kelas, dibaca & dibalas dari LMS
      { key: "grup", label: "Grup Kelas", icon: MessagesSquare, href: "/akun/grup" },
      // [perf:sidebar-nav-v1] link langsung ke route-nya (dulu tab → redirect full reload)
      { key: "pustaka", label: "Perpustakaan", icon: Library, href: "/akun/perpustakaan" },
      { key: "sertifikat", label: "Sertifikat", icon: Star },
    ],
  },
  {
    title: "Akun",
    items: [{ key: "akun", label: "Pengaturan", icon: Settings }],
  },
];

// [sidebar-label-v1] item sidebar: ikon + TEKS label (bukan ikon-saja + tooltip)
// supaya menu langsung terbaca tanpa harus hover satu-satu.
// [shell-a11y-focus-v1] + ring fokus keyboard (dulu ga ada sama sekali) dan ikonnya
// ga lagi muter 360° tiap hover (12 elemen berputar = bising, ga nambah informasi).
const NAV_ITEM_BASE =
  "group relative flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";
const NAV_ITEM_ACTIVE = "bg-[#0F5A52] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]";
const NAV_ITEM_IDLE = "text-white/70 hover:bg-white/10 hover:text-white";
const NAV_ICON = "h-[20px] w-[20px] shrink-0";
const GROUP_LABEL = "px-3.5 pb-1.5 pt-4 text-[10.5px] font-bold uppercase tracking-[0.09em] text-white/40";

const DARK_KEY = "lms-dark-mode";

/** Jawaban "punya grup kelas?" ditahan per tab — menunya ikut ke semua halaman LMS. */
const GROUP_NAV_KEY = "linguo-has-group-v1";

// [shell-dark-fouc-v1] Skrip kecil yang ikut ke-render di HTML awal → kelas `lms-dark`
// nempel ke <html> SEBELUM paint pertama. Dulu tema dibaca di useEffect, jadi user
// mode gelap selalu kena kilat putih dulu tiap buka halaman.
const DARK_BOOT = `try{var d=localStorage.getItem("${DARK_KEY}")==="1";document.documentElement.classList.toggle("lms-dark",d)}catch(e){}`;

// Peta menu → tab bottom nav mobile (bottom nav cuma nampung 5 slot).
const BOTTOM_TAB: Record<string, "beranda" | "jadwal" | "materi" | "akun"> = {
  beranda: "beranda",
  jadwal: "jadwal",
  materi: "materi",
  simulasi: "materi",
  pustaka: "materi",
  lingbook: "materi",
  kosakata: "materi",
  // Grup Kelas paling dekat ke "Jadwal" di bottom nav: dua-duanya soal kelas
  // yang sedang berjalan, bukan bahan belajar.
  grup: "jadwal",
  sertifikat: "akun",
  akun: "akun",
};

export default function StudentShell({
  active,
  onTabChange,
  canAccessMateri = true,
  firstName,
  avatarUrl,
  studentId,
  previewStudentId = null,
  immersive = false,
  children,
}: {
  // [preview-session-v1] mode POV siswa (staf) — menu ikut membawa ?preview=<id>
  // supaya pindah halaman tidak menjatuhkan sesi pratinjau.
  previewStudentId?: string | null;
  active: NavKey;
  onTabChange: (t: AkunTab) => void;
  firstName?: string;
  avatarUrl?: string;
  // [shell-mobile-drawer-v1] dipakai lonceng notifikasi di top bar mobile.
  studentId?: string;
  // Halaman "immersive" (player sesi, pemutar rekaman) punya kontrol & tombol
  // kembalinya sendiri — chrome mobile dimatikan biar ga nutupin kontrol player.
  immersive?: boolean;
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
  /* [student-group-gate-v1] "Grup Kelas" cuma untuk siswa yang PUNYA grup kelas.
     Dulu item ini tampil untuk semua yang login, dan halamannya membaca wa_groups
     langsung — user yang kebetulan juga pengajar/admin jadi melihat seluruh grup
     kelas Linguo di menu siswa. Sekarang daftar & menunya sama-sama bersandar
     pada RPC student_group_list() (tautan wa_group_students milik dirinya).
     Jawabannya di-cache per tab: menu ini ikut ke SEMUA halaman LMS, tak perlu
     satu query tiap pindah halaman. */
  const [hasGroup, setHasGroup] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return sessionStorage.getItem(GROUP_NAV_KEY) === "1"; } catch { return false; }
  });
  useEffect(() => {
    let alive = true;
    const remember = (v: boolean) => {
      if (!alive) return;
      setHasGroup(v);
      try { sessionStorage.setItem(GROUP_NAV_KEY, v ? "1" : "0"); } catch {}
    };
    if (previewStudentId) {
      fetch(`/api/preview-group?student=${encodeURIComponent(previewStudentId)}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => remember(!!j?.groups?.length))
        .catch(() => {});
      return () => { alive = false; };
    }
    supabase.rpc("student_group_list").then(({ data, error }) => {
      if (!error) remember(((data as unknown[]) ?? []).length > 0);
    });
    return () => { alive = false; };
  }, [previewStudentId]);

  const showNav = (key: string) => {
    if (key === "grup") return hasGroup;
    return !DEV_ONLY_KEYS.has(key) || (devOk && (key !== "materi" || canAccessMateri));
  };

  // [ling-lms-dark-v1] dark mode dashboard — state sync dgn LessonPlayer via localStorage "lms-dark-mode"
  const [isDark, setIsDark] = useState(false);
  // `themeReady` penting: tanpa itu, efek sinkronisasi di bawah sempat jalan sekali
  // dengan isDark=false dan MENCOPOT kelas yang barusan dipasang skrip boot → kedip.
  const [themeReady, setThemeReady] = useState(false);
  useEffect(() => {
    let d = false;
    try { d = localStorage.getItem(DARK_KEY) === "1"; } catch {}
    setIsDark(d);
    setThemeReady(true);
  }, []);
  // [shell-dark-fouc-v1] kelas tema ditaruh di <html> (bukan wrapper) biar konsisten
  // sama skrip boot di atas & ga ada frame putih waktu hydrate.
  useEffect(() => {
    if (!themeReady) return;
    document.documentElement.classList.toggle("lms-dark", isDark);
  }, [isDark, themeReady]);
  const toggleDark = () =>
    setIsDark((v) => {
      const nv = !v;
      try { localStorage.setItem(DARK_KEY, nv ? "1" : "0"); } catch {}
      return nv;
    });

  // [shell-mobile-drawer-v1] drawer menu mobile. Sebelum ini sidebar `hidden lg:flex`
  // dan bottom nav cuma punya 5 slot → Lingbook, Simulasi Tes, Kosakata, Perpustakaan
  // & Sertifikat SAMA SEKALI ga bisa dibuka di HP/tablet.
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  // Satu renderer dipakai sidebar desktop & drawer mobile → menunya mustahil beda.
  const renderItem = (item: NavItem, onNavigated?: () => void) => {
    const Icon = item.icon;
    if ("href" in item) {
      // [perf:sidebar-nav-v1] next/link → navigasi client-side + prefetch otomatis
      // (dulu <a> biasa = full page reload tiap pindah menu)
      const isActiveLink = item.key === active;
      const href = previewStudentId
        ? `${item.href}${item.href.includes("?") ? "&" : "?"}preview=${encodeURIComponent(previewStudentId)}`
        : item.href;
      return (
        <Link
          key={item.key}
          href={href}
          prefetch
          onClick={onNavigated}
          className={`${NAV_ITEM_BASE} ${isActiveLink ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE}`}
          aria-current={isActiveLink ? "page" : undefined}
        >
          <Icon className={NAV_ICON} />
          <span className="truncate">{item.label}</span>
        </Link>
      );
    }
    if (item.soon) {
      return (
        <div key={item.key} className={`${NAV_ITEM_BASE} cursor-default text-white/35`}>
          <Icon className={NAV_ICON} />
          <span className="truncate">{item.label}</span>
        </div>
      );
    }
    const isActive = item.key === active;
    return (
      <button
        key={item.key}
        onClick={() => { onTabChange(item.key as AkunTab); onNavigated?.(); }}
        className={`${NAV_ITEM_BASE} ${isActive ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE}`}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon className={NAV_ICON} />
        <span className="truncate">{item.label}</span>
      </button>
    );
  };

  const renderNav = (onNavigated?: () => void) => (
    <>
      {renderItem(NAV_HOME, onNavigated)}
      {NAV_GROUPS.map((g) => {
        const items = g.items.filter((it) => showNav(it.key));
        if (items.length === 0) return null;
        return (
          <div key={g.title} className="flex flex-col gap-1.5">
            <p className={GROUP_LABEL}>{g.title}</p>
            {items.map((it) => renderItem(it, onNavigated))}
          </div>
        );
      })}
    </>
  );

  const themeBtn = (
    <button
      onClick={toggleDark}
      className={`${NAV_ITEM_BASE} text-white/80 hover:bg-[#0F5A52] hover:text-white`}
      aria-label={isDark ? "Mode terang" : "Mode gelap"}
    >
      {isDark ? <Sun className={`${NAV_ICON} text-amber-300`} /> : <Moon className={NAV_ICON} />}
      <span className="truncate">{isDark ? "Mode terang" : "Mode gelap"}</span>
    </button>
  );

  const logoutBtn = (
    <button onClick={signOut} className={`${NAV_ITEM_BASE} text-white/80 hover:bg-[#0F5A52] hover:text-white`}>
      <LogOut className={NAV_ICON} />
      <span className="truncate">Keluar</span>
    </button>
  );

  return (
    /* [linguo-patch:shell-frame-ref-v2] full-bleed: teal isi penuh viewport (no outer grey), white canvas float di dalem */
    <div className="min-h-screen w-full bg-[#EEF1F4] lg:flex lg:p-0">
      <script dangerouslySetInnerHTML={{ __html: DARK_BOOT }} />
      {/* [ling-lms-dark-v2] dark mode scoped & class-based — !important biar menang atas utility Tailwind.
          Palet HITAM dominan (bukan abu kebiruan) + teks kontras tinggi; nutup juga class gray-* dan
          hex hardcoded (#12172B, #6B7280, dst.) yang dulu lolos & bikin teks tak kebaca.
          [shell-dark-elevation-v1] TANGGA ELEVASI dibalik ke arah yang benar: dulu kartu (`bg-white`
          → #0a0a0a) lebih GELAP dari latar seksinya (#F5F6F8 → #121212), jadi kartu & segmented
          control lenyap ditelan latar. Sekarang mirror light mode: panel < well < kartu. */}
      <style>{`
        /* ── Latar: hitam dominan ── */
        .lms-dark{background:#000000;}
        .lms-dark .bg-\\[\\#EEF1F4\\]{background-color:#000000 !important;}
        .lms-dark .lg\\:bg-\\[\\#16796E\\]{background-color:#000000 !important;}
        /* panel utama (kanvas putih) — level elevasi TENGAH */
        .lms-dark .bg-\\[\\#FFFFFF\\]{background-color:#141414 !important;}
        /* kartu — level PALING TERANG, naik di atas panel & well */
        .lms-dark .bg-white{background-color:#1c1c1c !important;}
        /* well / latar seksi — level PALING GELAP (recessed), sama peran spt #F5F6F8 di light mode */
        .lms-dark .bg-gray-50,.lms-dark .bg-slate-50,.lms-dark .bg-\\[\\#F5F6F8\\],.lms-dark .bg-\\[\\#F5F7F8\\],.lms-dark .bg-\\[\\#EAEDF0\\]{background-color:#0d0d0d !important;}
        .lms-dark .bg-gray-100,.lms-dark .bg-slate-100,.lms-dark .bg-\\[\\#E8EAEE\\],.lms-dark .bg-\\[\\#F1F3F5\\]{background-color:#262626 !important;}
        .lms-dark .bg-gray-200,.lms-dark .bg-slate-200,.lms-dark .bg-gray-300,.lms-dark .bg-slate-300{background-color:#303030 !important;}
        .lms-dark .bg-white\\/90,.lms-dark .bg-white\\/95{background-color:rgba(28,28,28,0.94) !important;}
        .lms-dark .bg-white\\/60,.lms-dark .bg-white\\/70,.lms-dark .bg-white\\/80{background-color:rgba(28,28,28,0.78) !important;}
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
        .lms-dark .border-slate-100,.lms-dark .border-slate-200,.lms-dark .border-gray-100,.lms-dark .border-gray-200{border-color:#2a2a2a !important;}
        .lms-dark .border-slate-300,.lms-dark .border-gray-300{border-color:#3f3f46 !important;}
        .lms-dark .divide-gray-50 > *,.lms-dark .divide-slate-100 > *{border-color:#242424 !important;}
        /* ── Hover state ── */
        .lms-dark .hover\\:bg-gray-50:hover,.lms-dark .hover\\:bg-slate-50:hover,.lms-dark .hover\\:bg-white:hover{background-color:#242424 !important;}
        .lms-dark .hover\\:bg-gray-100:hover,.lms-dark .hover\\:bg-slate-100:hover,.lms-dark .hover\\:bg-gray-200:hover,.lms-dark .hover\\:bg-slate-200:hover{background-color:#303030 !important;}
        .lms-dark .hover\\:bg-\\[\\#F5F6F8\\]:hover{background-color:#242424 !important;}
      `}</style>
      <div className="w-full lg:flex lg:bg-[#16796E] lg:p-3 lg:h-screen lg:min-h-[600px]">

        {/* SIDEBAR — desktop only. [sidebar-label-v1] ikon + teks label */}
        <aside className="hidden w-[216px] shrink-0 flex-col overflow-y-auto px-4 py-7 lg:flex">
          {/* logo — white bubble langsung di atas teal, tanpa kotak putih */}
          <div className="flex items-center gap-2.5 px-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-linguo-icon.png" alt="Linguo" className="h-9 w-9 object-contain" />
            <span className="text-lg font-bold text-white">Linguo</span>
          </div>

          {/* nav */}
          <nav className="mt-8 flex flex-col gap-1.5" aria-label="Menu utama">
            {renderNav()}
          </nav>

          {/* bottom group: dark toggle + logout */}
          <div className="mt-auto flex flex-col gap-1.5 pt-6">
            {themeBtn}
            {logoutBtn}
          </div>
        </aside>

        {/* ── TOP BAR MOBILE ── [shell-mobile-drawer-v1]
            Dirender di SHELL (bukan di /akun) supaya semua halaman ber-shell
            (perpustakaan, lingbook, kelas, rekaman) ikut punya navigasi di HP. */}
        <header className={`sticky top-0 z-40 h-14 shrink-0 items-center gap-2 border-b border-gray-100 bg-white/90 px-3 backdrop-blur-lg lg:hidden ${immersive ? "hidden" : "flex"}`}>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Buka menu"
            aria-expanded={drawerOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#12172B] transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16796E]"
          >
            <Menu className="h-5 w-5" strokeWidth={2.2} />
          </button>
          <span className="flex min-w-0 flex-1 items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-linguo-icon.png" alt="" className="h-7 w-7 shrink-0 object-contain" />
            <span className="truncate text-[15px] font-bold text-[#12172B]">Linguo</span>
          </span>
          {studentId && <NotificationBell userId={studentId} userType="student" />}
        </header>

        {/* ── DRAWER MOBILE ── */}
        {drawerOpen && (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <button
              aria-label="Tutup menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 h-full w-full bg-black/50"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Menu utama"
              className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col overflow-y-auto bg-[#16796E] px-4 pb-6 pt-5"
            >
              <div className="flex items-center gap-2.5 px-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/logo-linguo-icon.png" alt="Linguo" className="h-8 w-8 object-contain" />
                <span className="flex-1 text-[17px] font-bold text-white">Linguo</span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Tutup menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                >
                  <X className="h-4 w-4" strokeWidth={2.4} />
                </button>
              </div>

              {(firstName || avatarUrl) && (
                <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/10 p-3">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-[15px] font-extrabold text-white">
                      {(firstName || "?").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold text-white">{firstName || "Siswa"}</span>
                    <span className="block text-[12px] font-medium text-white/60">Siswa Linguo</span>
                  </span>
                </div>
              )}

              <nav className="mt-4 flex flex-col gap-1.5" aria-label="Menu utama mobile">
                {renderNav(() => setDrawerOpen(false))}
              </nav>

              <div className="mt-auto flex flex-col gap-1.5 pt-6">
                {themeBtn}
                {logoutBtn}
              </div>
            </div>
          </div>
        )}

        {/* WHITE PANEL — semua konten tab masuk sini.
            [shell-dark-elevation-v1] pakai `bg-[#FFFFFF]` (bukan `bg-white`) supaya di dark
            mode panel bisa dibedain levelnya dari kartu — dua-duanya dulu `bg-white`. */}
        <div className={`flex min-h-screen w-full min-w-0 flex-1 flex-col bg-[#FFFFFF] lg:min-h-0 lg:pb-0 lg:rounded-[26px] ${immersive ? "" : "pb-20"} ${active === "materi" ? "lg:overflow-hidden" : "lg:overflow-y-auto"}`}>
          {children}
        </div>
      </div>

      {/* ── BOTTOM NAV MOBILE ── dipindah ke shell (dulu cuma dirender di /akun,
          jadi halaman lain nol navigasi di HP: cuma bisa keluar via back browser). */}
      {!immersive && (
        <MobileBottomNav
          activeTab={BOTTOM_TAB[active] || "beranda"}
          onChange={onTabChange}
          canAccessMateri={devOk && canAccessMateri}
        />
      )}
    </div>
  );
}
