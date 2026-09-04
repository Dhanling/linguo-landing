"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
// [kelas-detail-resilient-v1] pakai klien BERSAMA — instance GoTrue ganda bikin
// race refresh token (query bisa 401 sesaat padahal user masih login).
import { supabase } from "@/lib/supabase-client";
import NotificationBell from "@/components/NotificationBell";
import MobileBottomNav from "@/components/akun/MobileBottomNav";
import { LayoutGrid, BookOpen, Library, CalendarDays, Star, Settings, LogOut, Moon, Sun, ClipboardCheck, Clapperboard, Layers, MessagesSquare, Menu, X, Bug, NotebookPen, type LucideIcon } from "lucide-react";
// [bug-report-pengajar-siswa-v1] siswa lapor bug dari LMS → masuk Bug Tracker admin
import BugReportDialog from "@/components/akun/BugReportDialog";
import PosterPopupAkun from "@/components/akun/PosterPopupAkun"; // [poster-popup-akun-v1]
// [ui-lang-switcher-v1] label menu ikut bahasa antarmuka yang dipilih siswa
import { useT } from "@/lib/uiLang";
import UiLangSwitcher from "@/components/akun/UiLangSwitcher";

export type AkunTab = "beranda" | "jadwal" | "materi" | "sertifikat" | "akun" | "pustaka" | "simulasi" | "grup" | "catatan"; // [linguo-patch:shell-pustaka-nav-v1] [simulasi-inshell-v1] [nav-tab-grup-pustaka-v1] [student-workspace-v1]

// [shell-nav-groups-v1] key menu yang bukan tab (route terpisah) ikut dipakai sbg
// penanda "active" — dulu di-cast paksa ke AkunTab, jadi highlight-nya ga pernah nyala.
export type NavKey = AkunTab | "watch" | "kosakata" | "lingbook";

type NavItem =
  | { key: AkunTab; label: string; icon: LucideIcon; soon?: false }
  | { key: string; label: string; icon: LucideIcon; soon: true }
  // simulasi-paywall-v1 — item link ke route terpisah, bukan tab.
  | { key: string; label: string; icon: LucideIcon; href: string };

// [shell-nav-groups-v1] menu dikelompokkan + dikasih label seksi. Dulu 10 item rata
// tanpa pengelompokan → semua bobotnya sama, siswa mesti coba-coba satu-satu.
// "Beranda" sengaja di luar grup (pintu masuk, bukan salah satu kategori).
const NAV_HOME: NavItem = { key: "beranda", label: "Beranda", icon: LayoutGrid };

// [shell-nav-aktivitas-first-v1] "Aktivitas" naik ke urutan pertama (persis di bawah
// Beranda): jadwal & grup kelas yang paling sering dibuka siswa harian, sementara
// menu "Belajar" sifatnya jelajah dan boleh turun.
const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Aktivitas",
    items: [
      { key: "jadwal", label: "Jadwal", icon: CalendarDays },
      /* [nav-tab-grup-pustaka-v1] Grup Kelas & Perpustakaan jadi TAB di dalam /akun,
         bukan route sendiri. Sebagai route, tiap klik menu = ganti halaman: shell
         dibongkar-pasang dan panelnya sempat kosong — itu kedipan yang terasa waktu
         balik ke Beranda. Sebagai tab, pindahnya cuma ganti isi panel (dan tab yang
         sudah dibuka tetap hidup, lihat [perf:akun-tab-keepalive-v1]).
         Route /akun/grup & /akun/perpustakaan TETAP ada buat tautan langsung. */
      { key: "grup", label: "Grup Kelas", icon: MessagesSquare },
      { key: "pustaka", label: "Perpustakaan", icon: Library },
      { key: "sertifikat", label: "Sertifikat", icon: Star },
    ],
  },
  {
    title: "Belajar",
    items: [
      { key: "materi", label: "Kelas & Materi", icon: BookOpen },
      /* [student-workspace-v1] "Catatan Saya" — ruang siswa MENYIMPAN sendiri
         (catatan, berkas, PR) + Mode Belajar Sendiri (Pomodoro). Sengaja bertetangga
         dengan "Kelas & Materi": yang satu bahan dari pengajar, yang satu bahan
         bikinan siswa sendiri. */
      { key: "catatan", label: "Catatan Saya", icon: NotebookPen },
      /* [lingbook-lebur-pustaka-v1] "Lingbook" DICABUT dari sidebar. Dulu ada tiga
         pintu ke barang yang sama — Kelas & Materi, Perpustakaan, dan Lingbook —
         dan siswa harus menebak yang mana. Sekarang Perpustakaan jadi satu-satunya
         rumah bahan bacaan: Lingbook masuk ke sana sebagai tab "Interaktif".
         Fiturnya utuh & route /akun/lingbook TETAP hidup buat tautan langsung. */
      // [simulasi-inshell-v1] jadi tab (sidebar tetap tampil), bukan route terpisah lagi
      { key: "simulasi", label: "Simulasi Tes", icon: ClipboardCheck },
      { key: "watch", label: "Watch & Learn", icon: Clapperboard, href: "/watch" },
      // Entry point global ke flashcard kata tersimpan (halaman /kosakata).
      { key: "kosakata", label: "Kosakata Saya", icon: Layers, href: "/kosakata" },
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
/* [nav-hover-zoom-v1] Hover = zoom-in halus. Titik tumpunya `origin-left` supaya
   baris membesar ke arah teks (bukan melebar ke dua sisi dan menabrak tepi rail),
   dan `transform-gpu` biar tak ada teks yang berkedip saat diskalakan. Ikonnya
   naik sedikit lebih tinggi dari barisnya — itu yang bikin gerakannya terbaca
   sebagai "maju ke depan", bukan sekadar kotak yang melar. */
const NAV_ITEM_BASE =
  "group relative flex w-full shrink-0 items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-[13px] font-semibold origin-left transform-gpu transition-[transform,background-color,color] duration-200 ease-out hover:scale-[1.045] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 [@media(max-height:820px)]:py-2";
const NAV_ITEM_ACTIVE = "bg-[#0F5A52] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]";
const NAV_ITEM_IDLE = "text-white/70 hover:bg-white/10 hover:text-white";
const NAV_ICON = "h-[20px] w-[20px] shrink-0 transform-gpu transition-transform duration-200 ease-out group-hover:scale-110";
const GROUP_LABEL = "px-3.5 pb-1.5 pt-4 text-[10.5px] font-bold uppercase tracking-[0.09em] text-white/40 [@media(max-height:820px)]:pt-2.5";

/* [shell-tablet-rail-v1] Tablet (md, 768–1023px) dulu dilempar ke tampilan HP:
   sidebar `hidden lg:flex` bikin iPad tegak & laptop kecil kehilangan menu tetap
   dan malah dapat drawer + bottom nav — layar 800px jadi terasa "HP raksasa".
   Sekarang ada tingkat ketiga: RAIL ikon-saja selebar 76px mulai md, melebar jadi
   216px + label mulai lg. Pola ini sengaja kembar dengan rail dashboard pengajar
   supaya dua dashboard terasa satu keluarga.
   AWAS: kelas di bawah HANYA dipakai sidebar. Drawer mobile memakai renderer yang
   sama tapi hidup di bawah md — kalau kelas `lg:`-nya ikut dipasang ke drawer,
   menunya jadi ikon tanpa teks di HP. Itu sebabnya `rail` dioper eksplisit. */
const RAIL_COMPACT = "justify-center gap-0 px-0 lg:justify-start lg:gap-3 lg:px-3.5";
const RAIL_LABEL = "hidden lg:inline";

const DARK_KEY = "lms-dark-mode";

/** Jawaban "punya grup kelas?" ditahan per tab — menunya ikut ke semua halaman LMS. */
export const GROUP_NAV_KEY = "linguo-has-group-v1";


// [shell-dark-fouc-v1] Skrip kecil yang ikut ke-render di HTML awal → kelas `lms-dark`
// nempel ke <html> SEBELUM paint pertama. Dulu tema dibaca di useEffect, jadi user
// mode gelap selalu kena kilat putih dulu tiap buka halaman.
const DARK_BOOT = `try{var d=localStorage.getItem("${DARK_KEY}")==="1";document.documentElement.classList.toggle("lms-dark",d)}catch(e){}`;

// Peta menu → tab bottom nav mobile (bottom nav cuma nampung 5 slot).
const BOTTOM_TAB: Record<string, "beranda" | "jadwal" | "materi" | "akun"> = {
  beranda: "beranda",
  jadwal: "jadwal",
  materi: "materi",
  catatan: "materi", // [student-workspace-v1]
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
  const t = useT(); // [ui-lang-switcher-v1]
  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  /* [lingbook-lebur-pustaka-v1] Gerbang allowlist menu development ikut dicabut
     bersama item Lingbook — tak ada lagi menu yang digate di sidebar, jadi tak
     perlu satu getSession() tiap shell dipasang. Allowlist-nya sendiri masih
     dipakai, cuma pindah ke tab "Interaktif" di dalam Perpustakaan. */
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
      /* [preview-idle-session-v1] "gagal menjawab" ≠ "tidak punya grup". Dulu
         respons 403 (sesi pratinjau habis) ikut dicatat sebagai `false`, jadi
         menu Grup Kelas lenyap dari sidebar dan terbaca seolah siswanya memang
         tak punya grup kelas. Sekarang cuma jawaban yang benar-benar sampai
         yang boleh mengubah keadaan menu. */
      fetch(`/api/preview-group?student=${encodeURIComponent(previewStudentId)}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => { if (j) remember(!!j.groups?.length); })
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
    // [materi-bahasa-siswa-v1] "Kelas & Materi" tampil untuk semua siswa; prop tetap
    // dihormati kalau halaman pemanggil mau menyembunyikannya.
    if (key === "materi") return canAccessMateri;
    return true;
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
  /* [bug-report-pengajar-siswa-v1] Form lapor bug hidup di SHELL supaya tombolnya ikut
     ke semua halaman LMS.
     [bug-report-topbar-pratinjau-v1] Dulu disembunyikan di mode pratinjau (POV staf)
     dengan alasan "laporan atas nama siswa salah alamat" — keliru: RPC
     submit_bug_report meresolve pelapor dari akun yang LOGIN, bukan dari siswa yang
     dilihat. Sementara justru dari POV pratinjau-lah staf menemukan layar rusak,
     jadi menyembunyikannya cuma membuang jalur laporan yang paling sering dipakai. */
  const [bugOpen, setBugOpen] = useState(false);
  const canReportBug = true;
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

  // [preview-session-v1] tiap tautan wajib bawa ?preview=<id> supaya sesi pratinjau
  // staf tidak jatuh saat pindah halaman.
  const withPreview = (href: string) =>
    previewStudentId
      ? `${href}${href.includes("?") ? "&" : "?"}preview=${encodeURIComponent(previewStudentId)}`
      : href;

  /* [nav-newtab-icon-off-v1] Tombol hover "buka di tab baru" DICABUT (permintaan
     19 Agu 2026): ikon panah yang muncul tiap kursor lewat bikin sidebar berkedip
     dan menu terasa punya dua tombol. Kemampuannya tak hilang — tiap menu tetap
     tautan asli (`/akun?menu=<key>`), jadi klik-tengah / Cmd+klik / menu kanan
     "buka di tab baru" tetap jalan seperti tautan biasa. */
  const navRow = (item: NavItem, _href: string, node: ReactNode) => (
    <div key={item.key}>{node}</div>
  );

  // Satu renderer dipakai sidebar desktop & drawer mobile → menunya mustahil beda.
  const renderItem = (item: NavItem, onNavigated?: () => void, rail = false) => {
    const Icon = item.icon;
    // [shell-tablet-rail-v1] di rail sempit label disembunyikan → judulnya pindah ke
    // tooltip supaya menu tetap bisa dikenali tanpa melebarkan sidebar.
    const compact = rail ? ` ${RAIL_COMPACT}` : "";
    const labelCls = rail ? `truncate ${RAIL_LABEL}` : "truncate";
    const railTitle = rail ? t(item.label) : undefined;
    // [nav-newtab-icon-off-v1] tak ada lagi tombol di kanan → tak perlu sisa ruang.
    const NAV_ITEM_LINK = NAV_ITEM_BASE + compact;
    if ("href" in item) {
      // [perf:sidebar-nav-v1] next/link → navigasi client-side + prefetch otomatis
      // (dulu <a> biasa = full page reload tiap pindah menu)
      const isActiveLink = item.key === active;
      const href = withPreview(item.href);
      // [nav-newtab-default-v1] Sisa menu ber-href (Watch & Learn, Kosakata Saya,
      // Lingbook) = bahan JELAJAH → dibuka di TAB BARU: dashboard/kelas yang sedang
      // jalan tak boleh tergantikan cuma karena siswa menengok kosakata.
      // Grup Kelas & Perpustakaan bukan lagi bagian dari sini — keduanya sudah jadi
      // tab di dalam /akun ([nav-tab-grup-pustaka-v1]).
      // Menu yang sedang aktif dikecualikan: membuka salinan halaman yang sama
      // di tab baru cuma bikin tab kembar.
      const newTab = !isActiveLink;
      const node = (
        <Link
          href={href}
          prefetch
          onClick={onNavigated}
          target={newTab ? "_blank" : undefined}
          rel={newTab ? "noopener noreferrer" : undefined}
          title={newTab ? `${t("Buka")} ${t(item.label)} ${t("di tab baru")}` : railTitle}
          className={`${newTab ? NAV_ITEM_BASE + compact : NAV_ITEM_LINK} ${isActiveLink ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE}`}
          aria-current={isActiveLink ? "page" : undefined}
        >
          <Icon className={NAV_ICON} />
          {/* [nav-newtab-noicon-v1] ikon ExternalLink inline dicabut — bikin sidebar
              ramai; perilaku buka tab baru TETAP (target dipertahankan di atas),
              title tetap menjelaskan buat yang hover. */}
          <span className="truncate">{t(item.label)}</span>
        </Link>
      );
      // Sudah membuka tab baru → tombol "buka di tab baru" milik navRow tak perlu.
      return newTab ? <div key={item.key}>{node}</div> : navRow(item, href, node);
    }
    if (item.soon) {
      return (
        <div key={item.key} title={railTitle} className={`${NAV_ITEM_BASE}${compact} cursor-default text-white/35`}>
          <Icon className={NAV_ICON} />
          <span className={labelCls}>{t(item.label)}</span>
        </div>
      );
    }
    // [nav-newtab-v1] Menu tab dulu <button> murni → klik-tengah / Ctrl+klik / menu
    // kanan "buka di tab baru" mustahil, jadi siswa harus balik ke menu awal tiap
    // mau lihat halaman lain. Sekarang tiap tab punya URL asli /akun?menu=<key>
    // (dibaca deep-link parser di app/akun/page.tsx). Klik biasa TETAP pindah tab
    // in-place lewat onTabChange (tanpa reload); klik dengan modifier dilepas ke
    // browser supaya membuka tab baru seperti tautan normal.
    const isActive = item.key === active;
    const href = withPreview(`/akun?menu=${item.key}`);
    return navRow(item, href, (
      <Link
        href={href}
        /* [perf:tab-link-prefetch-v1] Dari halaman LMS lain (Grup Kelas, Perpustakaan,
           Lingbook) menu tab ini benar-benar menavigasi ke /akun. Dengan prefetch mati,
           chunk dashboard baru diunduh SESUDAH diklik → menu terasa menggantung
           beberapa detik. Di /akun sendiri prefetch-nya no-op (rutenya sudah dimuat). */
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          onTabChange(item.key as AkunTab);
          onNavigated?.();
        }}
        title={railTitle}
        className={`${NAV_ITEM_LINK} ${isActive ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE}`}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon className={NAV_ICON} />
        <span className={labelCls}>{t(item.label)}</span>
      </Link>
    ));
  };

  const renderNav = (onNavigated?: () => void, rail = false) => (
    <>
      {renderItem(NAV_HOME, onNavigated, rail)}
      {NAV_GROUPS.map((g) => {
        const items = g.items.filter((it) => showNav(it.key));
        if (items.length === 0) return null;
        return (
          <div key={g.title} className="flex flex-col gap-1.5">
            {/* [shell-tablet-rail-v1] Judul seksi tak muat di rail 76px. Diganti garis
                tipis supaya pengelompokannya tetap kebaca sebagai kelompok, bukan
                satu daftar panjang tanpa jeda. */}
            {rail && <span aria-hidden className="mx-auto mt-3 h-px w-7 rounded-full bg-white/15 lg:hidden" />}
            <p className={`${GROUP_LABEL}${rail ? " hidden lg:block" : ""}`}>{t(g.title)}</p>
            {items.map((it) => renderItem(it, onNavigated, rail))}
          </div>
        );
      })}
    </>
  );

  // [shell-tablet-rail-v1] dulu tiga konstanta JSX — sekarang fungsi, karena di rail
  // tablet ketiganya ikut menciut jadi ikon-saja.
  const themeBtn = (rail = false) => {
    const label = isDark ? t("Mode terang") : t("Mode gelap");
    return (
      <button
        onClick={toggleDark}
        title={rail ? label : undefined}
        className={`${NAV_ITEM_BASE}${rail ? ` ${RAIL_COMPACT}` : ""} text-white/80 hover:bg-[#0F5A52] hover:text-white`}
        aria-label={label}
      >
        {isDark ? <Sun className={`${NAV_ICON} text-amber-300`} /> : <Moon className={NAV_ICON} />}
        <span className={rail ? `truncate ${RAIL_LABEL}` : "truncate"}>{label}</span>
      </button>
    );
  };

  const bugBtn = (rail = false) => canReportBug ? (
    <button
      onClick={() => setBugOpen(true)}
      title={rail ? t("Lapor Bug") : undefined}
      aria-label={t("Lapor Bug")}
      className={`${NAV_ITEM_BASE}${rail ? ` ${RAIL_COMPACT}` : ""} text-white/80 hover:bg-[#0F5A52] hover:text-white`}
    >
      <Bug className={NAV_ICON} />
      <span className={rail ? `truncate ${RAIL_LABEL}` : "truncate"}>{t("Lapor Bug")}</span>
    </button>
  ) : null;

  const logoutBtn = (rail = false) => (
    <button onClick={signOut} title={rail ? t("Keluar") : undefined} aria-label={t("Keluar")}
      className={`${NAV_ITEM_BASE}${rail ? ` ${RAIL_COMPACT}` : ""} text-white/80 hover:bg-[#0F5A52] hover:text-white`}>
      <LogOut className={NAV_ICON} />
      <span className={rail ? `truncate ${RAIL_LABEL}` : "truncate"}>{t("Keluar")}</span>
    </button>
  );

  return (
    /* [linguo-patch:shell-frame-ref-v2] full-bleed: teal isi penuh viewport (no outer grey), white canvas float di dalem */
    <div className="min-h-screen w-full bg-[#EEF1F4] md:flex md:p-0">
      <script dangerouslySetInnerHTML={{ __html: DARK_BOOT }} />
      {/* [ling-lms-dark-v2] dark mode scoped & class-based — !important biar menang atas utility Tailwind.
          Palet HITAM dominan (bukan abu kebiruan) + teks kontras tinggi; nutup juga class gray-* dan
          hex hardcoded (#12172B, #6B7280, dst.) yang dulu lolos & bikin teks tak kebaca.
          [shell-dark-elevation-v1] TANGGA ELEVASI dibalik ke arah yang benar: dulu kartu (`bg-white`
          → #0a0a0a) lebih GELAP dari latar seksinya (#F5F6F8 → #121212), jadi kartu & segmented
          control lenyap ditelan latar. Sekarang mirror light mode: panel < well < kartu. */}
      <style>{`
        /* ── [shell-dark-hairline-v1] Garis polos tanpa warna ──
           Di Tailwind v4 'border-b' (tanpa 'border-<warna>') memakai currentColor,
           jadi di atas hitam ia menjiplak warna TEKS dan muncul sebagai garis putih
           menyala — kelihatan jelas di bawah judul modal "Daftar Kelas Baru".
           Ditaruh di '@layer base' dengan sengaja: layer itu diurut SEBELUM
           'utilities', jadi elemen yang memang menyebut warnanya sendiri
           ('border-amber-200', 'border-transparent', …) tetap menang mutlak.
           Bobot '.lms-dark *' juga masih di atas preflight ('*'). */
        @layer base{
          .lms-dark *,.lms-dark ::before,.lms-dark ::after{border-color:#2a2a2a;}
        }
        /* ── Latar: hitam dominan ── */
        .lms-dark{background:#000000;}
        .lms-dark .bg-\\[\\#EEF1F4\\]{background-color:#000000 !important;}
        .lms-dark .md\\:bg-\\[\\#16796E\\]{background-color:#000000 !important;}
        /* [shell-dark-pure-black-v1] Palet dibikin HITAM PEKAT (samain rasa dgn dashboard
           pengajar). Sebelumnya panel #141414 + kartu #1c1c1c: bidang abu selebar layar
           bikin dashboard kelihatan abu kebiruan, bukan hitam. Sekarang panel & well
           MENYATU sama halaman (#000) dan cuma kartu yang naik setipis mungkin (#101010)
           supaya batasnya masih kebaca tanpa jadi kotak abu. */
        .lms-dark .bg-\\[\\#FFFFFF\\]{background-color:#000000 !important;}
        /* kartu — satu-satunya level yang naik di atas hitam */
        .lms-dark .bg-white{background-color:#101010 !important;}
        /* well / latar seksi — menyatu dgn halaman (recessed), peran sama spt #F5F6F8 di light mode */
        .lms-dark .bg-gray-50,.lms-dark .bg-slate-50,.lms-dark .bg-\\[\\#F5F6F8\\],.lms-dark .bg-\\[\\#F5F7F8\\],.lms-dark .bg-\\[\\#EAEDF0\\]{background-color:#080808 !important;}
        .lms-dark .bg-gray-100,.lms-dark .bg-slate-100,.lms-dark .bg-\\[\\#E8EAEE\\],.lms-dark .bg-\\[\\#F1F3F5\\]{background-color:#1c1c1c !important;}
        .lms-dark .bg-gray-200,.lms-dark .bg-slate-200,.lms-dark .bg-gray-300,.lms-dark .bg-slate-300{background-color:#262626 !important;}
        .lms-dark .bg-white\\/90,.lms-dark .bg-white\\/95{background-color:rgba(16,16,16,0.94) !important;}
        .lms-dark .bg-white\\/60,.lms-dark .bg-white\\/70,.lms-dark .bg-white\\/80{background-color:rgba(16,16,16,0.80) !important;}
        .lms-dark .bg-\\[\\#F0FAF8\\]{background-color:rgba(45,212,191,0.10) !important;}
        /* [sesi-mendatang-flat-dark-v1] Kartu "Sesi Mendatang" jangan ikut jadi kotak abu
           (#1c1c1c) — isinya sudah daftar baris berbingkai sendiri, jadi panelnya cuma
           bikin dua lapis kotak bertumpuk. Panelnya dibikin hitam (menyatu dgn halaman),
           barisnya yang naik selapis biar tetap kebaca sebagai daftar. */
        .lms-dark .sesi-mendatang-panel{background-color:#000000 !important;}
        .lms-dark .sesi-mendatang-panel .sesi-mendatang-item{background-color:#101010 !important;}
        .lms-dark .sesi-mendatang-panel .sesi-mendatang-item:hover{background-color:#1a1a1a !important;}
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
        .lms-dark .bg-emerald-100{background-color:rgba(16,185,129,0.20) !important;}
        .lms-dark .text-emerald-700{color:#6ee7b7 !important;}
        .lms-dark .text-emerald-600{color:#34d399 !important;}
        .lms-dark .border-emerald-100,.lms-dark .border-emerald-200{border-color:rgba(16,185,129,0.32) !important;}
        /* [shell-dark-tint-coverage-v1] Palet yang dulu KELEWAT: rose/indigo/violet/purple/green/
           sky/cyan/orange/yellow. Tanpa aturan ini, tint -50/-100 (mis. lingkaran ikon
           "Sesi minggu ini" = bg-indigo-50) tetap kepakai warna aslinya yang nyaris PUTIH,
           jadi bulatan menyala di atas kartu hitam. Pola sama persis dgn teal/amber/blue:
           latar jadi tint transparan, teks & border dicerahin. */
        .lms-dark .bg-rose-50{background-color:rgba(244,63,94,0.12) !important;}
        .lms-dark .bg-rose-100{background-color:rgba(244,63,94,0.20) !important;}
        .lms-dark .text-rose-800,.lms-dark .text-rose-700{color:#fda4af !important;}
        .lms-dark .text-rose-600,.lms-dark .text-rose-500{color:#fb7185 !important;}
        .lms-dark .border-rose-100,.lms-dark .border-rose-200{border-color:rgba(244,63,94,0.32) !important;}
        .lms-dark .bg-indigo-50{background-color:rgba(99,102,241,0.16) !important;}
        .lms-dark .bg-indigo-100{background-color:rgba(99,102,241,0.24) !important;}
        .lms-dark .text-indigo-700,.lms-dark .text-indigo-600,.lms-dark .text-indigo-500{color:#a5b4fc !important;}
        .lms-dark .border-indigo-100,.lms-dark .border-indigo-200{border-color:rgba(99,102,241,0.32) !important;}
        .lms-dark .bg-violet-50{background-color:rgba(139,92,246,0.14) !important;}
        .lms-dark .bg-violet-100{background-color:rgba(139,92,246,0.22) !important;}
        .lms-dark .text-violet-800,.lms-dark .text-violet-700,.lms-dark .text-violet-600,.lms-dark .text-violet-500{color:#c4b5fd !important;}
        .lms-dark .border-violet-100,.lms-dark .border-violet-200{border-color:rgba(139,92,246,0.32) !important;}
        .lms-dark .bg-purple-50{background-color:rgba(168,85,247,0.14) !important;}
        .lms-dark .bg-purple-100{background-color:rgba(168,85,247,0.22) !important;}
        .lms-dark .text-purple-800,.lms-dark .text-purple-700,.lms-dark .text-purple-600{color:#d8b4fe !important;}
        .lms-dark .border-purple-100,.lms-dark .border-purple-200{border-color:rgba(168,85,247,0.32) !important;}
        .lms-dark .bg-green-50{background-color:rgba(34,197,94,0.12) !important;}
        .lms-dark .bg-green-100{background-color:rgba(34,197,94,0.20) !important;}
        .lms-dark .text-green-800,.lms-dark .text-green-700{color:#86efac !important;}
        .lms-dark .text-green-600{color:#4ade80 !important;}
        .lms-dark .border-green-100,.lms-dark .border-green-200{border-color:rgba(34,197,94,0.32) !important;}
        .lms-dark .bg-sky-50{background-color:rgba(14,165,233,0.14) !important;}
        .lms-dark .bg-sky-100{background-color:rgba(14,165,233,0.22) !important;}
        .lms-dark .text-sky-700,.lms-dark .text-sky-600{color:#7dd3fc !important;}
        .lms-dark .border-sky-100,.lms-dark .border-sky-200{border-color:rgba(14,165,233,0.32) !important;}
        .lms-dark .bg-cyan-50{background-color:rgba(6,182,212,0.14) !important;}
        .lms-dark .text-cyan-700,.lms-dark .text-cyan-600{color:#67e8f9 !important;}
        .lms-dark .bg-orange-50{background-color:rgba(249,115,22,0.14) !important;}
        .lms-dark .text-orange-700,.lms-dark .text-orange-600{color:#fdba74 !important;}
        .lms-dark .bg-yellow-50{background-color:rgba(234,179,8,0.14) !important;}
        .lms-dark .bg-yellow-100{background-color:rgba(234,179,8,0.22) !important;}
        .lms-dark .text-yellow-800,.lms-dark .text-yellow-700{color:#fde047 !important;}
        .lms-dark .border-yellow-200,.lms-dark .border-yellow-300{border-color:rgba(234,179,8,0.35) !important;}
        /* [shell-dark-no-white-ring-v1] cincin putih (avatar profil dll) = outline menyala di
           latar hitam. Dimatikan cuma di dark mode; light mode tetap punya cincinnya. */
        .lms-dark .ring-white{--tw-ring-color:transparent !important;}
        /* ── Border & pemisah: cukup kelihatan buat misahin kartu dari latar hitam ── */
        .lms-dark .border-slate-100,.lms-dark .border-slate-200,.lms-dark .border-gray-100,.lms-dark .border-gray-200{border-color:#2a2a2a !important;}
        .lms-dark .border-slate-300,.lms-dark .border-gray-300{border-color:#3f3f46 !important;}
        .lms-dark .divide-gray-50 > *,.lms-dark .divide-slate-100 > *{border-color:#242424 !important;}
        /* ── Hover state ── */
        .lms-dark .hover\\:bg-gray-50:hover,.lms-dark .hover\\:bg-slate-50:hover,.lms-dark .hover\\:bg-white:hover{background-color:#1a1a1a !important;}
        .lms-dark .hover\\:bg-gray-100:hover,.lms-dark .hover\\:bg-slate-100:hover,.lms-dark .hover\\:bg-gray-200:hover,.lms-dark .hover\\:bg-slate-200:hover{background-color:#262626 !important;}
        .lms-dark .hover\\:bg-\\[\\#F5F6F8\\]:hover{background-color:#1a1a1a !important;}
        /* ── [shell-dark-no-outline-v1] kartu / tab / tabel TANPA garis luar ──
           Di atas latar hitam, ring & border netral kebaca sebagai kotak abu terang yang
           bikin dashboard rame. Pemisahan sekarang murni dari TANGGA ELEVASI (#0d0d0d well
           < #141414 panel < #1c1c1c kartu). Cuma outline PENUH yang dimatiin: utility lebar
           border (semua sisi) + semua ring-* netral. Garis pemisah BERARAH
           (border-t/-b/-l/-r, divide-*) sengaja dibiarkan hidup — itu pemisah baris tabel /
           footer kartu, bukan outline. Aksen berwarna (teal/amber/blue/rose) juga dibiarkan
           karena itu penanda status & seleksi. */
        /* [shell-dark-pure-black-v1] Sejak panel & well ikut hitam, beda tinggi kartu
           (#101010 di atas #000) tinggal setipis rambut — outline yang dulu DIMATIKAN
           total sekarang dihidupkan lagi setipis mungkin (garis rambut, bukan kotak abu)
           supaya kartu tetap punya batas yang kebaca. */
        .lms-dark .ring-slate-100,.lms-dark .ring-slate-200,.lms-dark .ring-slate-200\\/70,.lms-dark .ring-slate-200\\/80,.lms-dark .ring-slate-300,.lms-dark .ring-slate-900\\/5,.lms-dark .ring-gray-100,.lms-dark .ring-gray-200,.lms-dark .ring-gray-300,.lms-dark .ring-black\\/5{--tw-ring-color:rgba(255,255,255,0.07) !important;}
        .lms-dark .border.border-slate-100,.lms-dark .border.border-slate-200,.lms-dark .border.border-slate-200\\/70,.lms-dark .border.border-slate-200\\/80,.lms-dark .border.border-slate-300,.lms-dark .border.border-gray-100,.lms-dark .border.border-gray-200,.lms-dark .border.border-gray-300{border-color:#1f1f1f !important;}
        /* KECUALI kolom isian: input/textarea/select wajib tetap punya outline, kalau nggak
           kolomnya lenyap (bg-white kartu = #1c1c1c, sama persis sama latar kartunya). */
        .lms-dark input.border.border-slate-100,.lms-dark input.border.border-slate-200,.lms-dark input.border.border-slate-300,.lms-dark input.border.border-gray-100,.lms-dark input.border.border-gray-200,.lms-dark input.border.border-gray-300,
        .lms-dark textarea.border.border-slate-100,.lms-dark textarea.border.border-slate-200,.lms-dark textarea.border.border-slate-300,.lms-dark textarea.border.border-gray-100,.lms-dark textarea.border.border-gray-200,.lms-dark textarea.border.border-gray-300,
        .lms-dark select.border.border-slate-100,.lms-dark select.border.border-slate-200,.lms-dark select.border.border-slate-300,.lms-dark select.border.border-gray-100,.lms-dark select.border.border-gray-200,.lms-dark select.border.border-gray-300{border-color:#3a3a3a !important;}
        /* ── [materi-dark-flat-v1] Kelas & Materi: seksi & tab HITAM ──
           Halaman ini isinya daftar kelas + satu panel detail, tapi di mode gelap
           tiap bagiannya jadi kotak abu sendiri-sendiri (well #0d0d0d di bawah kartu
           #1c1c1c) — layar penuh kotak bertumpuk. Sekarang semuanya hitam menyatu
           dengan halaman; yang memisahkan cuma garis rambut, dan kelas yang sedang
           dibuka ditandai cincin teal (bukan kotak abu terang yang gampang ketuker
           sama kartu biasa). Aturannya ditaruh paling bawah supaya menang atas
           aturan hover umum di atas — spesifisitasnya sama, jadi urutan yang nentuin. */
        .lms-dark .materi-flat{background-color:#000000 !important;}
        .lms-dark .materi-panel{background-color:#000000 !important;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.09) !important;}
        .lms-dark .materi-panel:hover{background-color:#0f0f0f !important;}
        .lms-dark .materi-item{background-color:transparent !important;}
        .lms-dark .materi-item:hover{background-color:#101010 !important;}
        .lms-dark .materi-item-sel{background-color:#101010 !important;box-shadow:inset 0 0 0 1px rgba(45,212,191,0.38) !important;}
        /* Lingkar donat progres: warnanya atribut SVG, jadi tak kena aturan bg-* di atas. */
        .lms-dark .materi-pie-track{stroke:#2f2f2f !important;}
        /* ── [shell-dark-tint-opacity-v1] Tint BEROPASITAS ──
           'bg-teal-50/50' itu NAMA KELAS yang berbeda dari 'bg-teal-50', jadi
           semua aturan tint di atas tidak menangkapnya dan warnanya tetap versi
           terang. Paling kentara di modal "Daftar Kelas Baru": kartu ringkasan
           ('bg-teal-50/50') muncul sebagai balok abu pucat, dan label di atasnya
           ('text-gray-500') ikut tenggelam. */
        .lms-dark .bg-teal-50\\/40,.lms-dark .bg-teal-50\\/50,.lms-dark .bg-teal-50\\/60,.lms-dark .bg-teal-50\\/70,.lms-dark .bg-teal-50\\/80{background-color:rgba(45,212,191,0.10) !important;}
        .lms-dark .bg-amber-50\\/50,.lms-dark .bg-amber-50\\/60,.lms-dark .bg-amber-50\\/70,.lms-dark .bg-amber-50\\/80{background-color:rgba(245,158,11,0.12) !important;}
        .lms-dark .bg-blue-50\\/50,.lms-dark .bg-blue-50\\/70,.lms-dark .bg-blue-50\\/80{background-color:rgba(59,130,246,0.12) !important;}
        .lms-dark .bg-rose-50\\/50,.lms-dark .bg-rose-50\\/70,.lms-dark .bg-rose-50\\/80{background-color:rgba(244,63,94,0.12) !important;}
        .lms-dark .bg-emerald-50\\/50,.lms-dark .bg-emerald-50\\/70,.lms-dark .bg-emerald-50\\/80{background-color:rgba(16,185,129,0.12) !important;}
        .lms-dark .bg-green-50\\/50,.lms-dark .bg-green-50\\/70,.lms-dark .bg-green-50\\/80{background-color:rgba(34,197,94,0.12) !important;}
        .lms-dark .bg-indigo-50\\/50,.lms-dark .bg-indigo-50\\/70,.lms-dark .bg-purple-50\\/50,.lms-dark .bg-purple-50\\/70,.lms-dark .bg-violet-50\\/50,.lms-dark .bg-violet-50\\/70{background-color:rgba(139,92,246,0.14) !important;}
        .lms-dark .bg-gray-50\\/50,.lms-dark .bg-gray-50\\/60,.lms-dark .bg-gray-50\\/70,.lms-dark .bg-gray-50\\/80,.lms-dark .bg-slate-50\\/50,.lms-dark .bg-slate-50\\/70,.lms-dark .bg-slate-50\\/80{background-color:rgba(8,8,8,0.9) !important;}
        .lms-dark .bg-gray-100\\/50,.lms-dark .bg-gray-100\\/60,.lms-dark .bg-gray-100\\/70,.lms-dark .bg-gray-100\\/80,.lms-dark .bg-slate-100\\/70,.lms-dark .bg-slate-100\\/80{background-color:rgba(28,28,28,0.9) !important;}
        /* ── Sisa "ink" aksen yang belum tertutup di kelompok atas ── */
        .lms-dark .text-teal-900,.lms-dark .text-teal-800{color:#5eead4 !important;}
        .lms-dark .text-amber-900{color:#fcd34d !important;}
        .lms-dark .text-blue-800{color:#93c5fd !important;}
        .lms-dark .text-red-800{color:#fca5a5 !important;}
        .lms-dark .text-red-500{color:#f87171 !important;}
        .lms-dark .text-amber-500{color:#fbbf24 !important;}
        .lms-dark .border-amber-100,.lms-dark .border-amber-300,.lms-dark .border-amber-400{border-color:rgba(245,158,11,0.35) !important;}
        .lms-dark .border-red-100,.lms-dark .border-red-200,.lms-dark .border-red-300{border-color:rgba(239,68,68,0.32) !important;}
        .lms-dark .border-cyan-100,.lms-dark .border-cyan-200{border-color:rgba(6,182,212,0.32) !important;}
        /* 'text-gray-200' dipakai buat slot jam yang TIDAK bisa dipilih. Tanpa
           aturan ini warnanya nyaris putih — malah terbaca sebagai aktif. */
        .lms-dark .text-gray-200,.lms-dark .text-slate-200{color:#4a4a4a !important;}
        /* ── [shell-dark-glow-v1] Halo putih di sekeliling tombol ──
           'shadow-teal-100' / 'shadow-green-100' itu bayangan berwarna TERANG.
           Di atas hitam hasilnya lingkaran cahaya putih tebal mengelilingi tombol
           "Bayar Otomatis" & "Bayar via Transfer". Bayangan warna terang dimatikan;
           shade pekat (-500 ke atas) dibiarkan karena memang jadi kedalaman. */
        .lms-dark .shadow-teal-100,.lms-dark .shadow-teal-200,.lms-dark .shadow-green-100,.lms-dark .shadow-green-200,.lms-dark .shadow-amber-100,.lms-dark .shadow-amber-200,.lms-dark .shadow-blue-100,.lms-dark .shadow-blue-200,.lms-dark .shadow-rose-100,.lms-dark .shadow-rose-200{--tw-shadow-color:transparent !important;}
        /* ── [shell-dark-hover-tint-v1] Tint pada state HOVER ──
           'hover:bg-teal-50' itu kelas tersendiri (.hover\\:bg-teal-50:hover), jadi
           aturan .bg-teal-50 di atas tidak menangkapnya. Akibatnya begitu kursor
           mampir, tombol berubah jadi BALOK PUTIH dengan tulisan teal — persis yang
           kejadian di 'Selesai & Tambah Kelas Lain'. Aturan hover netral (gray/slate)
           sudah ada di atas; ini melengkapi yang berwarna. */
        .lms-dark .hover\\:bg-teal-50:hover{background-color:rgba(45,212,191,0.14) !important;}
        .lms-dark .hover\\:bg-teal-100:hover{background-color:rgba(45,212,191,0.22) !important;}
        .lms-dark .hover\\:bg-amber-50:hover{background-color:rgba(245,158,11,0.14) !important;}
        .lms-dark .hover\\:bg-amber-100:hover{background-color:rgba(245,158,11,0.22) !important;}
        .lms-dark .hover\\:bg-red-50:hover{background-color:rgba(239,68,68,0.16) !important;}
        .lms-dark .hover\\:bg-red-100:hover{background-color:rgba(239,68,68,0.24) !important;}
        .lms-dark .hover\\:bg-rose-50:hover{background-color:rgba(244,63,94,0.16) !important;}
        .lms-dark .hover\\:bg-rose-100:hover{background-color:rgba(244,63,94,0.24) !important;}
        .lms-dark .hover\\:bg-green-50:hover{background-color:rgba(34,197,94,0.14) !important;}
        .lms-dark .hover\\:bg-green-100:hover{background-color:rgba(34,197,94,0.22) !important;}
        .lms-dark .hover\\:bg-emerald-50:hover{background-color:rgba(16,185,129,0.14) !important;}
        .lms-dark .hover\\:bg-emerald-100:hover{background-color:rgba(16,185,129,0.22) !important;}
        .lms-dark .hover\\:bg-blue-50:hover{background-color:rgba(59,130,246,0.14) !important;}
        .lms-dark .hover\\:bg-indigo-50:hover{background-color:rgba(99,102,241,0.16) !important;}
        .lms-dark .hover\\:bg-violet-50:hover,.lms-dark .hover\\:bg-purple-50:hover{background-color:rgba(139,92,246,0.16) !important;}
        .lms-dark .hover\\:bg-sky-50:hover{background-color:rgba(14,165,233,0.16) !important;}
        .lms-dark .hover\\:bg-cyan-50:hover{background-color:rgba(6,182,212,0.16) !important;}
        .lms-dark .hover\\:bg-orange-50:hover{background-color:rgba(249,115,22,0.16) !important;}
        .lms-dark .hover\\:bg-yellow-50:hover{background-color:rgba(234,179,8,0.16) !important;}
        /* Garis & teks aksen versi hover/focus. */
        .lms-dark .hover\\:border-teal-200:hover,.lms-dark .hover\\:border-teal-300:hover,.lms-dark .hover\\:border-teal-400:hover,.lms-dark .focus\\:border-teal-300:focus,.lms-dark .focus\\:border-teal-400:focus,.lms-dark .focus\\:border-teal-500:focus{border-color:rgba(45,212,191,0.55) !important;}
        .lms-dark .hover\\:border-red-300:hover,.lms-dark .hover\\:border-red-400:hover{border-color:rgba(239,68,68,0.55) !important;}
        .lms-dark .hover\\:text-teal-600:hover,.lms-dark .hover\\:text-teal-700:hover,.lms-dark .group:hover .group-hover\\:text-teal-600,.lms-dark .group:hover .group-hover\\:text-teal-700{color:#5eead4 !important;}
        .lms-dark .hover\\:text-blue-600:hover,.lms-dark .hover\\:text-blue-700:hover{color:#93c5fd !important;}
        .lms-dark .hover\\:text-rose-500:hover,.lms-dark .hover\\:text-rose-600:hover,.lms-dark .group:hover .group-hover\\:text-rose-500{color:#fda4af !important;}
        .lms-dark .hover\\:text-red-500:hover,.lms-dark .hover\\:text-red-600:hover{color:#fca5a5 !important;}
        .lms-dark .hover\\:text-amber-600:hover,.lms-dark .hover\\:text-amber-700:hover{color:#fcd34d !important;}
        /* ── [shell-dark-cta-contrast-v1] Tombol SOLID vs tulisan putih ──
           Warna aksen level -400/-500/-600 itu terang: putih di atasnya cuma
           2,3-3,7:1, di bawah ambang AA (4,5:1) dan paling terasa di tombol WA
           (bg-green-500 = 2,3:1). Di mode gelap saja shade-nya diturunkan satu-dua
           tingkat sampai lolos 4,5:1, hover-nya lebih pekat lagi biar tetap terasa.
           Sengaja pakai selektor gabungan '.bg-x.text-white' supaya HANYA kena
           elemen yang benar-benar bertulisan putih — bilah progres & titik status
           yang memakai warna sama tidak ikut berubah. */
        .lms-dark .bg-teal-500.text-white,.lms-dark .bg-teal-600.text-white{background-color:#0f766e !important;}
        .lms-dark .hover\\:bg-teal-600.text-white:hover,.lms-dark .hover\\:bg-teal-700.text-white:hover{background-color:#115e59 !important;}
        .lms-dark .bg-green-500.text-white,.lms-dark .bg-green-600.text-white{background-color:#15803d !important;}
        .lms-dark .hover\\:bg-green-600.text-white:hover,.lms-dark .hover\\:bg-green-700.text-white:hover{background-color:#166534 !important;}
        .lms-dark .bg-red-500.text-white,.lms-dark .bg-red-600.text-white{background-color:#b91c1c !important;}
        .lms-dark .hover\\:bg-red-600.text-white:hover,.lms-dark .hover\\:bg-red-700.text-white:hover{background-color:#991b1b !important;}
        .lms-dark .bg-amber-400.text-white,.lms-dark .bg-amber-500.text-white{background-color:#b45309 !important;}
        .lms-dark .bg-rose-500.text-white{background-color:#be123c !important;}
        .lms-dark .bg-violet-500.text-white,.lms-dark .bg-indigo-500.text-white{background-color:#4338ca !important;}
        .lms-dark .bg-cyan-600.text-white{background-color:#0e7490 !important;}
        /* [pustaka-dark-cta-v1] Tombol brand teal versi ARBITRARY (bg-[#12A37E]) —
           dulu kelewat karena aturan di atas cuma nyebut skala Tailwind (teal-500/600).
           Akibatnya tombol "Buka"/"Beli" di Perpustakaan tetap teal terang & terasa
           nempel di atas kartu hitam. Di mode gelap dipekatkan ke shade yang sama
           dengan CTA teal lain biar satu keluarga, hover-nya lebih pekat lagi.
           Selektor gabungan '.text-white' → cuma kena elemen bertulisan putih. */
        .lms-dark .bg-\\[\\#12A37E\\].text-white{background-color:#0f766e !important;}
        .lms-dark .hover\\:bg-\\[\\#0C8163\\].text-white:hover{background-color:#115e59 !important;}
        /* Tombol netral "Belum siap": slate-400 nyaris seterang kartu putih → di
           gelap jadi abu pekat, tulisan putihnya tetap kebaca. */
        .lms-dark .bg-slate-400.text-white,.lms-dark .bg-gray-400.text-white{background-color:#2f3338 !important;}
        .lms-dark .hover\\:bg-slate-500.text-white:hover,.lms-dark .hover\\:bg-gray-500.text-white:hover{background-color:#3a3f45 !important;}
      `}</style>
      {/* [shell-tablet-rail-v1] Bingkai teal + tinggi setara layar mulai md (bukan lg):
          itu yang bikin iPad tegak & laptop kecil dapat kanvas dashboard, bukan
          halaman panjang gaya HP.
          [shell-laptop-height-v1] `min-h-[600px]` dilonggarkan ke 520px khusus md–lg:
          laptop Windows 1366×768 (tinggi viewport efektif ±600px setelah bilah
          browser) sebelumnya kena tinggi minimum yang lebih besar dari layarnya
          sendiri → seluruh shell ikut menggulung dan sidebar-nya ikut hanyut. */}
      <div className="w-full md:flex md:h-screen md:min-h-[520px] md:bg-[#16796E] md:p-2.5 lg:min-h-[600px] lg:p-3">

        {/* SIDEBAR — desktop only. [sidebar-label-v1] ikon + teks label */}
        {/* [shell-laptop-height-v1] 10 menu + 3 label seksi + 3 tombol bawah ≈ 750px. Di
            laptop Windows 1366×768 sidebar-nya lebih tinggi dari layar → sebelumnya isinya
            saling dipepet karena flex-item boleh menciut. Sekarang tiap baris `shrink-0`
            (lihat NAV_ITEM_BASE) dan padding-nya menyusut di viewport pendek; kalau tetap
            tak muat, sidebar-nya digulung — bukan menumpuk. */}
        <aside className="hidden w-[76px] shrink-0 flex-col overflow-y-auto overflow-x-hidden px-2.5 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex lg:w-[216px] lg:px-4 lg:py-6">
          {/* logo — white bubble langsung di atas teal, tanpa kotak putih.
              [shell-tablet-rail-v1] di rail sempit tinggal ikonnya. */}
          <div className="flex shrink-0 items-center justify-center gap-2.5 lg:justify-start lg:px-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-linguo-icon.png" alt="Linguo" className="h-9 w-9 object-contain" />
            <span className="hidden text-lg font-bold text-white lg:inline">Linguo</span>
          </div>

          {/* nav */}
          <nav className="mt-6 flex shrink-0 flex-col gap-1.5 lg:mt-7" aria-label="Menu utama">
            {renderNav(undefined, true)}
          </nav>

          {/* bottom group: dark toggle + logout */}
          <div className="mt-auto flex shrink-0 flex-col gap-1.5 pt-6 [@media(max-height:820px)]:pt-3">
            {bugBtn(true)}
            {themeBtn(true)}
            {logoutBtn(true)}
          </div>
        </aside>

        {/* ── TOP BAR MOBILE ── [shell-mobile-drawer-v1]
            Dirender di SHELL (bukan di /akun) supaya semua halaman ber-shell
            (perpustakaan, lingbook, kelas, rekaman) ikut punya navigasi di HP. */}
        <header className={`sticky top-0 z-40 h-14 shrink-0 items-center gap-2 border-b border-gray-100 bg-white/90 px-3 backdrop-blur-lg md:hidden ${immersive ? "hidden" : "flex"}`}>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label={t("Buka menu")}
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
          {canReportBug && (
            <button
              onClick={() => setBugOpen(true)}
              aria-label={t("Lapor Bug")}
              title={t("Lapor Bug")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#12172B] transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16796E]"
            >
              <Bug className="h-5 w-5" strokeWidth={2.2} />
            </button>
          )}
          {/* [ui-lang-switcher-v1] kanan atas juga di HP — di kiri lonceng notifikasi */}
          <UiLangSwitcher />
          {studentId && <NotificationBell userId={studentId} userType="student" />}
        </header>

        {/* ── DRAWER MOBILE ── */}
        {drawerOpen && (
          <div className="fixed inset-0 z-[70] md:hidden">
            <button
              aria-label={t("Tutup menu")}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 h-full w-full bg-black/50"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t("Menu utama")}
              className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col overflow-y-auto bg-[#16796E] px-4 pb-6 pt-5"
            >
              <div className="flex items-center gap-2.5 px-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/logo-linguo-icon.png" alt="Linguo" className="h-8 w-8 object-contain" />
                <span className="flex-1 text-[17px] font-bold text-white">Linguo</span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label={t("Tutup menu")}
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
                    <span className="block truncate text-[14px] font-bold text-white">{firstName || t("Siswa")}</span>
                    <span className="block text-[12px] font-medium text-white/60">{t("Siswa Linguo")}</span>
                  </span>
                </div>
              )}

              <nav className="mt-4 flex flex-col gap-1.5" aria-label={t("Menu utama mobile")}>
                {renderNav(() => setDrawerOpen(false))}
              </nav>

              <div className="mt-auto flex flex-col gap-1.5 pt-6">
                {bugBtn()}
                {themeBtn()}
                {logoutBtn()}
              </div>
            </div>
          </div>
        )}

        {/* WHITE PANEL — semua konten tab masuk sini.
            [shell-dark-elevation-v1] pakai `bg-[#FFFFFF]` (bukan `bg-white`) supaya di dark
            mode panel bisa dibedain levelnya dari kartu — dua-duanya dulu `bg-white`. */}
        <div className={`flex min-h-screen w-full min-w-0 flex-1 flex-col bg-[#FFFFFF] md:min-h-0 md:rounded-[22px] md:pb-0 lg:rounded-[26px] ${immersive ? "" : "pb-20 md:pb-0"} ${active === "materi" ? "md:overflow-y-auto lg:overflow-hidden" : "md:overflow-y-auto"}`}>
          {children}
        </div>
      </div>

      {/* ── BOTTOM NAV MOBILE ── dipindah ke shell (dulu cuma dirender di /akun,
          jadi halaman lain nol navigasi di HP: cuma bisa keluar via back browser). */}
      {canReportBug && <BugReportDialog open={bugOpen} onClose={() => setBugOpen(false)} />}

      {/* [poster-popup-akun-v1] Poster promo e-book — muncul tiap dashboard dimuat
          (buka / refresh), persis pola pop-up di landing. Halaman immersive
          (pemutar sesi, reader) dilewati: di sana siswa lagi mengerjakan sesuatu. */}
      {!immersive && <PosterPopupAkun />}

      {!immersive && (
        <MobileBottomNav
          activeTab={BOTTOM_TAB[active] || "beranda"}
          onChange={onTabChange}
          canAccessMateri={canAccessMateri}
          previewStudentId={previewStudentId}
        />
      )}
    </div>
  );
}
