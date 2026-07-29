// linguo-patch:placement-picker-rectflag-v1 — bendera rounded rectangle (bukan emoji),
// dipakai bareng di PlacementPicker & PlacementTest. Map slug -> kode negara ISO-2.
import { resolveFlag } from "@blade-flags/core";
import { defaultFlags } from "@blade-flags/core/flags/default";
import { FileText, Globe, GraduationCap, Scroll, Sun } from "lucide-react";

export const FLAG_CODE_BY_SLUG: Record<string, string> = {
  english: "gb", ielts: "gb", "toefl-itp": "gb", japanese: "jp", korean: "kr",
  mandarin: "cn", spanish: "es", french: "fr", german: "de", italian: "it",
  arabic: "sa", hebrew: "il", persian: "ir", javanese: "id", sundanese: "id",
  betawi: "id", bipa: "id", georgian: "ge", greek: "gr", "portuguese-pt": "pt",
  "portuguese-br": "br", dutch: "nl", russian: "ru", swedish: "se", norwegian: "no",
  danish: "dk", finnish: "fi", polish: "pl", czech: "cz", hungarian: "hu",
  romanian: "ro", turkish: "tr", bulgarian: "bg", ukrainian: "ua", icelandic: "is",
  cantonese: "hk", vietnamese: "vn", thai: "th", filipino: "ph", khmer: "kh",
  lao: "la", burmese: "mm", hindi: "in", urdu: "pk", bengali: "bd",
  tamil: "in", punjabi: "in", nepali: "np", mongolian: "mn", balinese: "id",
  minangkabau: "id", batak: "id", bugis: "id", acehnese: "id", banjar: "id",
  madurese: "id", swahili: "ke", zulu: "za", yoruba: "ng", amharic: "et",
  armenian: "am",
};

// Bendera SVG rounded rectangle. Dimensi dihitung dari viewBox agar aspect ratio asli terjaga.
export function RectFlag({ code, h = 28, className = "" }: { code?: string; h?: number; className?: string }) {
  // resolveFlag case-sensitive & mengharap ISO-2 huruf kecil. Sebagian pemanggil
  // (mis. BASE_LANGS) menyimpan kode HURUF BESAR → normalkan biar bendera tetap muncul.
  const svg = code ? resolveFlag(defaultFlags, code.toLowerCase(), "country") : null;
  if (!svg) return <Globe aria-hidden style={{ height: h, width: h }} className={`text-gray-300 shrink-0 ${className}`} />;
  const m = svg.match(/viewBox="([\d.\s-]+)"/);
  let w = Math.round((h * 36) / 26);
  if (m) { const p = m[1].trim().split(/\s+/).map(Number); if (p.length === 4 && p[3]) w = Math.round((h * p[2]) / p[3]); }
  const sized = svg.replace(/<svg /, `<svg width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" style="display:block" `);
  return <span aria-hidden style={{ height: h, width: w }} className={`inline-flex overflow-hidden rounded-[5px] shrink-0 ring-1 ring-black/5 ${className}`} dangerouslySetInnerHTML={{ __html: sized }} />;
}

// linguo-patch:silabus-rect-icon-v1 — sebagian entri silabus BUKAN negara (IELTS,
// TOEFL ITP, Latin, Esperanto, Kurdi) jadi gak punya bendera. Dulu dipaksa emoji
// (🎓 📝 📜 🟢 ☀️) yang render-nya beda-beda per OS & tingginya ikut font, bukan
// kotak. Ganti jadi ubin rounded-rectangle dengan ikon lucide → satu siluet dengan
// bendera di sebelahnya.
const SLUG_TILE: Record<string, { Icon: typeof Globe; bg: string; fg: string }> = {
  ielts:        { Icon: GraduationCap, bg: "linear-gradient(135deg,#1A9E9E,#0E6B6B)", fg: "#ffffff" },
  "toefl-itp":  { Icon: FileText,      bg: "linear-gradient(135deg,#3b82f6,#1e40af)", fg: "#ffffff" },
  latin:        { Icon: Scroll,        bg: "linear-gradient(135deg,#a8a29e,#57534e)", fg: "#ffffff" },
  esperanto:    { Icon: Globe,         bg: "linear-gradient(135deg,#22c55e,#15803d)", fg: "#ffffff" },
  kurdish:      { Icon: Sun,           bg: "linear-gradient(135deg,#fbbf24,#dc2626)", fg: "#ffffff" },
};

/**
 * Bendera/ikon rounded-rectangle untuk sebuah slug bahasa silabus.
 * Urutan resolve: ubin khusus (non-negara) → bendera negara → fallback Globe.
 */
export function LangSlugFlag({ slug, h = 28, className = "" }: { slug: string; h?: number; className?: string }) {
  const tile = SLUG_TILE[slug];
  if (tile) {
    const w = Math.round((h * 36) / 26);
    const s = Math.round(h * 0.62);
    return (
      <span
        aria-hidden
        style={{ height: h, width: w, backgroundImage: tile.bg }}
        className={`inline-flex items-center justify-center overflow-hidden rounded-[5px] shrink-0 ring-1 ring-black/5 ${className}`}
      >
        <tile.Icon style={{ height: s, width: s, color: tile.fg }} strokeWidth={2.1} />
      </span>
    );
  }
  return <RectFlag code={FLAG_CODE_BY_SLUG[slug]} h={h} className={className} />;
}
