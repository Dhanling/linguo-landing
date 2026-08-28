"use client";

import Link from "next/link";
import { Home, Calendar, BookOpen, User, Clapperboard, type LucideIcon } from "lucide-react";
import { useT } from "@/lib/uiLang"; // [ui-lang-switcher-v1]

type TabKey = "beranda" | "jadwal" | "materi" | "akun";

type Props = {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
  // [materi-gate-v1] sembunyikan tab "Materi" kalau email tidak masuk allowlist.
  canAccessMateri?: boolean;
  // [preview-session-v1] mode POV siswa (staf) — tautan wajib bawa ?preview=<id>.
  previewStudentId?: string | null;
};

// Tab biasa memicu onChange; item ber-`href` (Watch & Learn) menavigasi ke route
// terpisah lewat next/link (client-side + prefetch), seperti di icon rail desktop. [perf:sidebar-nav-v1]
type NavItem =
  | { key: TabKey; label: string; icon: LucideIcon }
  | { key: string; label: string; icon: LucideIcon; href: string };

const TABS: NavItem[] = [
  { key: "beranda", label: "Beranda", icon: Home },
  { key: "jadwal",  label: "Jadwal",  icon: Calendar },
  { key: "materi",  label: "Materi",  icon: BookOpen },
  { key: "watch",   label: "Watch",   icon: Clapperboard, href: "/watch" },
  { key: "akun",    label: "Akun",    icon: User },
];

export default function MobileBottomNav({ activeTab, onChange, canAccessMateri = true, previewStudentId = null }: Props) {
  const t = useT(); // [ui-lang-switcher-v1]
  const tabs = TABS.filter((item) => canAccessMateri || item.key !== "materi");
  const withPreview = (href: string) =>
    previewStudentId
      ? `${href}${href.includes("?") ? "&" : "?"}preview=${encodeURIComponent(previewStudentId)}`
      : href;
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label={t("Navigasi utama")}
    >
      <div className={`mx-auto max-w-lg grid h-14 ${tabs.length === 5 ? "grid-cols-5" : "grid-cols-4"}`}>
        {tabs.map((item) => {
          const { key, label, icon: Icon } = item;
          const isActive = !("href" in item) && activeTab === key;
          const inner = (
            <>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-[#1A9E9E]" />
              )}
              <Icon
                className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium">{t(label)}</span>
            </>
          );
          // [shell-a11y-focus-v1] ring fokus keyboard + label non-aktif dinaikkan ke
          // gray-500 (gray-400 di 10px gagal kontras WCAG AA di atas putih).
          const cls = `flex flex-col items-center justify-center gap-0.5 transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1A9E9E] ${
            isActive ? "text-[#1A9E9E]" : "text-gray-500 hover:text-gray-700"
          }`;
          if ("href" in item) {
            return (
              <Link key={key} href={withPreview(item.href)} prefetch className={cls}>
                {inner}
              </Link>
            );
          }
          // [nav-newtab-v1] tab juga tautan asli (/akun?menu=<key>) supaya bisa
          // ditekan-lama → "buka di tab baru". Klik biasa tetap pindah tab in-place.
          return (
            <Link
              key={key}
              href={withPreview(`/akun?menu=${key}`)}
              /* [perf:tab-link-prefetch-v1] dari halaman LMS lain tombol ini benar-benar
                 menavigasi ke /akun — biar chunk dashboard sudah siap sebelum diklik. */
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                onChange(item.key);
              }}
              className={cls}
              aria-current={isActive ? "page" : undefined}
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
