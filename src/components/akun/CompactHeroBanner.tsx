"use client";

type Props = {
  firstName: string;
  greeting: string;
  rankEmoji: string;
  rankLabel: string;
  streak: number;
  activeCount: number;
  onEnrollClick?: () => void;
};

export default function CompactHeroBanner({
  firstName,
  greeting,
  rankEmoji,
  rankLabel,
  streak,
  activeCount,
  onEnrollClick,
}: Props) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1A9E9E] to-[#0F6E56] px-4 py-3.5 sm:px-5 sm:py-4 text-white shadow-md shadow-teal-200/40">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-teal-100 text-[11px] leading-tight">{greeting},</p>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-base sm:text-lg font-bold truncate">{firstName}</h1>
            <span className="text-sm">{rankEmoji}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-teal-100 flex-wrap">
            <span className="inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 font-medium">
              {rankLabel}
            </span>
            {streak > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <span>\u{1F525}</span>
                <span className="font-semibold text-white">{streak}</span>
                <span>minggu</span>
              </span>
            )}
            {activeCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <span>\u00B7</span>
                <span className="font-semibold text-white">{activeCount}</span>
                <span>kursus aktif</span>
              </span>
            )}
          </div>
        </div>

        {onEnrollClick && (
          <button
            onClick={onEnrollClick}
            className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-white text-[#0F6E56] px-3 py-2 text-xs font-bold hover:bg-teal-50 transition-colors shadow-sm"
          >
            <span className="hidden sm:inline">+ Tambah</span>
            <span className="sm:hidden">+ Kelas</span>
          </button>
        )}
      </div>
    </div>
  );
}
