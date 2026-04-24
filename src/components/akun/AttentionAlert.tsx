"use client";

type Props = {
  count: number;
  onClick?: () => void;
  label?: string;
};

export default function AttentionAlert({ count, onClick, label }: Props) {
  if (count <= 0) return null;

  const text = label || `${count} hal perlu perhatian`;

  return (
    <button
      onClick={onClick}
      className="w-full group flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-left hover:bg-amber-100 transition-colors"
      aria-label={text}
    >
      <span className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-base">
        ⚠️
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900 truncate">{text}</p>
        <p className="text-[11px] text-amber-700/80">
          {count === 1 ? "Lihat kartu dengan badge 'Belum Bayar'" : "Lihat kartu dengan badge kuning / merah"}
        </p>
      </div>
      <span className="shrink-0 text-amber-600 group-hover:translate-x-0.5 transition-transform">›</span>
    </button>
  );
}
