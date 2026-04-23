"use client";

type TabKey = "beranda" | "jadwal" | "materi" | "akun";

type Props = {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
};

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "beranda", label: "Beranda", icon: "\u{1F3E0}" },
  { key: "jadwal", label: "Jadwal", icon: "\u{1F4C5}" },
  { key: "materi", label: "Materi", icon: "\u{1F4D6}" },
  { key: "akun", label: "Akun", icon: "\u{1F464}" },
];

export default function MobileBottomNav({ activeTab, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navigation utama"
    >
      <div className="mx-auto max-w-lg grid grid-cols-4 h-14">
        {TABS.map(({ key, label, icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
                isActive ? "text-[#1A9E9E]" : "text-gray-400 hover:text-gray-600"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-[#1A9E9E]" />
              )}
              <span className={`text-lg leading-none ${isActive ? "scale-110" : ""} transition-transform`}>{icon}</span>
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
