// [padanan-ujian-v1] Badge kecil "≈ TOPIK II Level 3" di sebelah label level.
// Tanpa hook, jadi aman dipakai di server component (halaman /kursus) maupun klien.
// Tidak merender apa pun kalau bahasa itu tak punya padanan ujian yang dikenal.
import { padananUjian, CATATAN_PADANAN } from "@/lib/levelEquivalence";

export default function PadananUjianBadge({
  bahasa, level, className = "", size = "sm",
}: {
  bahasa: string | null | undefined;
  level: string | null | undefined;
  className?: string;
  size?: "xs" | "sm";
}) {
  const p = padananUjian(bahasa, level);
  if (!p) return null;
  const pad = size === "xs" ? "px-1.5 py-px text-[10px]" : "px-2 py-0.5 text-[11px]";
  return (
    <span
      title={`Perkiraan setara ${p.label}. ${CATATAN_PADANAN}`}
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-slate-100 font-semibold text-slate-600 ring-1 ring-slate-200/70 ${pad} ${className}`}
    >
      ≈ {p.label}
    </span>
  );
}
