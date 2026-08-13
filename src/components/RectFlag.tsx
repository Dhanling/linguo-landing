"use client";

// linguo-patch:placement-picker-rectflag-v1 — bendera rounded rectangle (bukan emoji),
// dipakai bareng di PlacementPicker & PlacementTest. Map slug -> kode negara ISO-2.
import { useEffect, useState } from "react";
import { resolveFlag } from "@blade-flags/core";
import { Globe, Scroll, Sun } from "lucide-react";

export const FLAG_CODE_BY_SLUG: Record<string, string> = {
  // IELTS = ujian Inggris British Council/IDP → bendera UK. TOEFL = ETS, Amerika → bendera US.
  english: "gb", ielts: "gb", "toefl-itp": "us", japanese: "jp", korean: "kr",
  mandarin: "cn", spanish: "es", french: "fr", german: "de", italian: "it",
  arabic: "sa", hebrew: "il", persian: "ir", javanese: "id", sundanese: "id",
  betawi: "id", bipa: "id", georgian: "ge", greek: "gr", "portuguese-pt": "pt",
  "portuguese-br": "br", dutch: "nl", russian: "ru", swedish: "se", norwegian: "no",
  danish: "dk", finnish: "fi", polish: "pl", czech: "cz", hungarian: "hu",
  romanian: "ro", turkish: "tr", bulgarian: "bg", ukrainian: "ua", icelandic: "is",
  cantonese: "hk", vietnamese: "vn", thai: "th", filipino: "ph", khmer: "kh",
  // Dipakai produk Toko Digital (kolom digital_products.language).
  estonian: "ee", serbian: "rs", portuguese: "pt", tagalog: "ph", latvian: "lv",
  lithuanian: "lt", slovak: "sk", slovenian: "si", croatian: "hr", albanian: "al",
  malay: "my",
  lao: "la", burmese: "mm", hindi: "in", urdu: "pk", bengali: "bd",
  tamil: "in", punjabi: "in", nepali: "np", mongolian: "mn", balinese: "id",
  minangkabau: "id", batak: "id", bugis: "id", acehnese: "id", banjar: "id",
  madurese: "id", swahili: "ke", zulu: "za", yoruba: "ng", amharic: "et",
  armenian: "am",
};

// [perf:flags-lazy-v1] Kumpulan bendera blade-flags itu SATU modul berisi SVG
// inline SELURUH negara — 1,2 MB JS, dan karena resolveFlag mencarinya saat
// runtime, tak ada yang bisa di-tree-shake. Sebagai impor biasa dia jadi bagian
// bundel yang WAJIB diunduh & di-parse sebelum halaman boleh tampil; di Watch &
// Learn dia sendirian menyumbang lebih dari separuh JS halaman.
//
// Sekarang datanya diunduh terpisah begitu bendera pertama dirender. Sampai tiba,
// yang tampil ubin kosong seukuran benderanya (bukan Globe — itu penanda "bahasa
// tak dikenal", bukan "sedang dimuat"), jadi tak ada layout shift dan tak ada
// salah baca. Sekali dimuat, seluruh bendera di halaman tergambar bersamaan.
type FlagSet = Parameters<typeof resolveFlag>[0];
let FLAGS: FlagSet | null = null;
let flagsPromise: Promise<void> | null = null;
const flagWaiters = new Set<() => void>();

function loadFlags() {
  if (!flagsPromise) {
    flagsPromise = import("@blade-flags/core/flags/default")
      .then((m) => {
        FLAGS = m.defaultFlags as FlagSet;
        flagWaiters.forEach((fn) => fn());
        flagWaiters.clear();
      })
      .catch(() => {
        // Gagal unduh (jaringan) → biarkan fallback Globe; jangan mengunci retry.
        flagsPromise = null;
      });
  }
  return flagsPromise;
}

/** Mengembalikan set bendera begitu siap; memicu render ulang saat baru tiba. */
function useFlagSet(): FlagSet | null {
  const [set, setSet] = useState<FlagSet | null>(FLAGS);
  useEffect(() => {
    if (FLAGS) {
      if (!set) setSet(FLAGS);
      return;
    }
    let alive = true;
    const notify = () => { if (alive) setSet(FLAGS); };
    flagWaiters.add(notify);
    void loadFlags();
    return () => {
      alive = false;
      flagWaiters.delete(notify);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return set;
}

// Bendera SVG rounded rectangle. Dimensi dihitung dari viewBox agar aspect ratio asli terjaga.
export function RectFlag({ code, h = 28, className = "" }: { code?: string; h?: number; className?: string }) {
  const flags = useFlagSet();
  // resolveFlag case-sensitive & mengharap ISO-2 huruf kecil. Sebagian pemanggil
  // (mis. BASE_LANGS) menyimpan kode HURUF BESAR → normalkan biar bendera tetap muncul.
  const svg = flags && code ? resolveFlag(flags, code.toLowerCase(), "country") : null;
  // Data bendera belum tiba (dan kodenya sah) → ubin kosong seukuran bendera.
  if (!svg && !flags && code) {
    return (
      <span
        aria-hidden
        style={{
          height: h,
          width: Math.round((h * 36) / 26),
          backgroundColor: "rgba(128,128,128,0.18)",
        }}
        className={`inline-flex shrink-0 rounded-[5px] ring-1 ring-black/5 ${className}`}
      />
    );
  }
  if (!svg) return <Globe aria-hidden style={{ height: h, width: h }} className={`text-gray-300 shrink-0 ${className}`} />;
  const m = svg.match(/viewBox="([\d.\s-]+)"/);
  let w = Math.round((h * 36) / 26);
  if (m) { const p = m[1].trim().split(/\s+/).map(Number); if (p.length === 4 && p[3]) w = Math.round((h * p[2]) / p[3]); }
  const sized = svg.replace(/<svg /, `<svg width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" style="display:block" `);
  return <span aria-hidden style={{ height: h, width: w }} className={`inline-flex overflow-hidden rounded-[5px] shrink-0 ring-1 ring-black/5 ${className}`} dangerouslySetInnerHTML={{ __html: sized }} />;
}

// linguo-patch:silabus-rect-icon-v1 — sebagian entri silabus BUKAN negara (Latin,
// Esperanto, Kurdi) jadi gak punya bendera. Dulu dipaksa emoji (📜 🟢 ☀️) yang
// render-nya beda-beda per OS & tingginya ikut font, bukan kotak. Ganti jadi ubin
// rounded-rectangle dengan ikon lucide → satu siluet dengan bendera di sebelahnya.
// IELTS & TOEFL ITP TIDAK di sini: keduanya pakai bendera negara asal ujiannya
// (UK & US) lewat FLAG_CODE_BY_SLUG.
const SLUG_TILE: Record<string, { Icon: typeof Globe; bg: string; fg: string }> = {
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
