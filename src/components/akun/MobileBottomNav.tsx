"use client";

import { Home, Calendar, BookOpen, User, Clapperboard, type LucideIcon } from "lucide-react";

type TabKey = "beranda" | "jadwal" | "materi" | "akun";

type Props = {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
};

// Tab biasa memicu onChange; item ber-`href` (Watch & Learn) menavigasi ke route
// terpisah lewat <a>, seperti di icon rail desktop.
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

export default function MobileBottomNav({ activeTab, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navigation utama"
    >
      <div className="mx-auto max-w-lg grid grid-cols-5 h-14">
        {TABS.map((item) => {
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
              <span className="text-[10px] font-medium">{label}</span>
            </>
          );
          const cls = `flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
            isActive ? "text-[#1A9E9E]" : "text-gray-400 hover:text-gray-600"
          }`;
          if ("href" in item) {
            return (
              <a key={key} href={item.href} className={cls}>
                {inner}
              </a>
            );
          }
          return (
            <button
              key={key}
              onClick={() => onChange(item.key)}
              className={cls}
              aria-current={isActive ? "page" : undefined}
            >
              {inner}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
