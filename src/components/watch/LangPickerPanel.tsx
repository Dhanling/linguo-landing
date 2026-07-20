"use client";

// Panel isi dropdown "bahasa yang dipelajari" — dipakai di dua tempat dengan
// tampilan sama: header player (VideoLearnPlayer) & bilah menu katalog
// (WatchAndLearn). [watch-learnlang-hover-v1] Dulu tombol ini membuka POP-UP
// layar penuh; kini cukup HOVER → dropdown ini muncul (lebih cepat). Pemilik
// (parent) mengurus posisi + trigger + state buka/tutup lewat hover; komponen
// ini hanya merender kotak: kotak cari + chip "terakhir dipilih" + daftar
// bahasa yang bisa digulir.

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Search } from "lucide-react";
import { RectFlag } from "@/components/RectFlag";
import { IMMERSION_LANGS, getImmersionLang } from "@/lib/immersion";

const TEAL = "#1A9E9E";
const CARD = "#12171A"; // solid supaya terbaca jelas menimpa video
const BORDER = "rgba(255,255,255,0.09)";
const SUB = "rgba(255,255,255,0.5)";

/** Bahasa terjemahan ("Bahasa saya") — hanya subset field yang dibutuhkan panel. */
type BaseLangOption = { code: string; country: string; label: string; english?: string };

export function LangPickerPanel({
  open,
  langCode,
  onPick,
  recentCodes = [],
  width = 300,
  title = "Bahasa target",
  baseLangs,
  baseLangCode,
  onPickBase,
  readyCounts,
}: {
  open: boolean;
  langCode: string;
  onPick: (code: string) => void;
  recentCodes?: string[];
  width?: number;
  /** Judul kecil di atas kotak cari — menegaskan ini pemilih bahasa apa. */
  title?: string;
  /** Jumlah video "Siap" per kode bahasa → badge di tiap baris (biar tahu bahasa
      mana yang katalognya paling banyak). Kosong/undefined = badge disembunyikan. */
  readyCounts?: Record<string, number>;
  /** Kalau diisi, tampilkan section "Bahasa saya" (bahasa terjemahan) di atas —
      menyatukan dua pemilih bahasa jadi satu dropdown. */
  baseLangs?: BaseLangOption[];
  baseLangCode?: string;
  onPickBase?: (code: string) => void;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset teks pencarian & fokus kotak cari tiap kali dropdown dibuka.
  useEffect(() => {
    if (!open) return;
    setQ("");
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = !s
      ? IMMERSION_LANGS
      : IMMERSION_LANGS.filter(
          (l) =>
            l.name.toLowerCase().includes(s) ||
            l.native.toLowerCase().includes(s) ||
            l.code.toLowerCase().includes(s)
        );
    // Tanpa pencarian: dahulukan bahasa yang punya video "Siap" (jumlah terbanyak
    // di atas) supaya pengguna langsung lihat mana yang katalognya sudah terisi.
    // Urutan asli dipertahankan untuk bahasa tanpa video. Saat mencari, biarkan
    // hasil apa adanya (relevansi teks lebih penting).
    if (s || !readyCounts) return base;
    return [...base].sort((a, b) => (readyCounts[b.code] ?? 0) - (readyCounts[a.code] ?? 0));
  }, [q, readyCounts]);

  const recents = useMemo(
    () =>
      recentCodes
        .map((c) => getImmersionLang(c))
        .filter((l): l is NonNullable<typeof l> => !!l)
        .slice(0, 6),
    [recentCodes]
  );

  return (
    <div
      className="flex max-h-[62vh] flex-col overflow-hidden rounded-2xl shadow-2xl"
      style={{ width, backgroundColor: CARD, border: `1px solid ${BORDER}` }}
    >
      {baseLangs && baseLangs.length > 0 && (
        <>
          <div
            className="px-3 pt-2.5 pb-1 text-[11px] font-bold uppercase tracking-wide"
            style={{ color: SUB }}
          >
            Bahasa saya
          </div>
          <div className="px-2 pb-2">
            <div className="flex flex-wrap gap-1.5">
              {baseLangs.map((b) => {
                const on = b.code === baseLangCode;
                return (
                  <button
                    key={b.code}
                    onClick={() => onPickBase?.(b.code)}
                    className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 transition-transform active:scale-95"
                    style={{
                      backgroundColor: on ? "rgba(26,158,158,0.16)" : "rgba(255,255,255,0.06)",
                      border: `1px solid ${on ? "rgba(26,158,158,0.4)" : BORDER}`,
                    }}
                  >
                    <RectFlag code={b.country} h={14} />
                    <span className="text-[12px] font-bold text-white">{b.label}</span>
                    {on && <Check className="h-3.5 w-3.5 shrink-0" color={TEAL} />}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${BORDER}` }} />
        </>
      )}
      {title && (
        <div
          className="px-3 pt-2.5 pb-0.5 text-[11px] font-bold uppercase tracking-wide"
          style={{ color: SUB }}
        >
          {title}
        </div>
      )}
      <div className="p-2">
        <div
          className="flex items-center gap-2 rounded-xl px-3"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        >
          <Search className="h-4 w-4 shrink-0" color={SUB} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari bahasa…"
            className="flex-1 bg-transparent py-2.5 text-[13px] text-white outline-none placeholder:text-white/35"
          />
        </div>
      </div>

      {!q.trim() && recents.length > 0 && (
        <div className="px-2 pb-1.5">
          <div className="flex flex-wrap gap-1.5">
            {recents.map((l) => {
              const on = l.code === langCode;
              return (
                <button
                  key={l.code}
                  onClick={() => onPick(l.code)}
                  className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 transition-transform active:scale-95"
                  style={{
                    backgroundColor: on ? "rgba(26,158,158,0.16)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${on ? "rgba(26,158,158,0.4)" : BORDER}`,
                  }}
                >
                  <RectFlag code={l.country} h={14} />
                  <span className="text-[12px] font-bold text-white">{l.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-1.5">
        {filtered.map((l) => {
          const on = l.code === langCode;
          return (
            <button
              key={l.code}
              onClick={() => onPick(l.code)}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-white/5"
              style={{ backgroundColor: on ? "rgba(26,158,158,0.16)" : "transparent" }}
            >
              <RectFlag code={l.country} h={18} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-bold text-white">{l.name}</span>
                <span className="block truncate text-[11px]" style={{ color: SUB }}>
                  {l.native}
                </span>
              </span>
              <ReadyBadge n={readyCounts?.[l.code]} />
              {on && <Check className="h-4 w-4 shrink-0" color={TEAL} />}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="px-3 py-5 text-center text-[12.5px]" style={{ color: SUB }}>
            Tidak ada bahasa cocok.
          </p>
        )}
      </div>
    </div>
  );
}

/** Badge kecil "N siap" — jumlah video tab "Siap" untuk sebuah bahasa. Disembunyikan
    kalau tak ada video (n falsy) supaya baris bahasa kosong tetap bersih. */
function ReadyBadge({ n }: { n?: number }) {
  if (!n) return null;
  return (
    <span
      className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums"
      style={{ backgroundColor: "rgba(26,158,158,0.16)", color: TEAL }}
      title={`${n} video siap tonton`}
    >
      {n} siap
    </span>
  );
}
