'use client';

// [slide-visual-v1] Diagram slide: kontur nada, susunan suku kata, kelompok bunyi,
// jebakan ejaan. Dipakai SlideBody (SlideDeckViewer) saat slide punya `visual`.
//
// ⚠️ Kembarannya ada di linguo-admin-dashboard/src/components/materi/SlideVisual.tsx —
// berkas ini sengaja tanpa impor TTS/alias proyek (fungsi bunyi disuntik lewat
// prop) supaya bisa disalin apa adanya ke repo landing.
//
// Warna ditulis inline (bukan kelas Tailwind) supaya mode gelap /akun dan
// dashboard tidak menimpanya — slide selalu terang [slide-terang-v1].

import { createContext, lazy, Suspense, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Volume2, Wind, X, Check, Play, Square, RotateCcw, Equal, Shuffle, ChevronLeft, ChevronRight } from "lucide-react";
import type { BandingStatus, BandingToken, Nada, SlideVisual as Visual } from "@/lib/materiSlides";
// [isyarat-3d-v1] Avatar 3D bahasa isyarat — three.js dimuat hanya di slide ini.
const SlideIsyarat = lazy(() => import("./SlideIsyarat"));
// [slide-audio-eleven-v1] Klip per kata hasil ElevenLabs eleven_v4 (dibuat sekali,
// konturnya dicek otomatis). Kata yang belum punya klip jatuh ke TTS biasa.
import { AUDIO_SLIDE_ZH, AUDIO_SLIDE_ZH_BASE } from "./audioSlideZh";

/* Warna nada ala kamus Pleco/Hanping: siswa mengaitkan warna dengan kontur. */
export const WARNA_NADA: Record<Nada, string> = {
  1: "#E5484D",
  2: "#E38A00",
  3: "#16A34A",
  4: "#2563EB",
  0: "#6B7280",
};
const NAMA_NADA: Record<Nada, string> = { 1: "Nada 1", 2: "Nada 2", 3: "Nada 3", 4: "Nada 4", 0: "Netral" };
const TANDA_NADA: Record<Nada, string> = { 1: "ˉ", 2: "ˊ", 3: "ˇ", 4: "ˋ", 0: "·" };

/* Kontur nada dalam skala Chao 1–5 (5 = tertinggi) → koordinat viewBox 100×100. */
const Y = (lv: number) => 100 - (lv - 1) * 20 - 10;
const KONTUR: Record<Exclude<Nada, 0>, string> = {
  1: `M12 ${Y(5)} L88 ${Y(5)}`,                                  // 55
  2: `M12 ${Y(3)} C40 ${Y(3)}, 62 ${Y(4.2)}, 88 ${Y(5)}`,         // 35
  3: `M12 ${Y(2)} C30 ${Y(0.6)}, 52 ${Y(0.6)}, 88 ${Y(4)}`,       // 214
  4: `M12 ${Y(5)} C40 ${Y(4.8)}, 64 ${Y(2.6)}, 88 ${Y(1)}`,       // 51
};

/** Nada dari tanda di atas vokal pinyin; tanpa tanda = netral. */
export function nadaPinyin(p: string): Nada {
  if (/[āēīōūǖ]/.test(p)) return 1;
  if (/[áéíóúǘ]/.test(p)) return 2;
  if (/[ǎěǐǒǔǚ]/.test(p)) return 3;
  if (/[àèìòùǜ]/.test(p)) return 4;
  return 0;
}

/** Ikon kontur kecil satu nada. */
function IkonNada({ tone, size = "1.6em" }: { tone: Nada; size?: string }) {
  const w = WARNA_NADA[tone];
  return (
    <svg viewBox="0 0 100 100" style={{ width: size, height: size, flexShrink: 0 }} aria-hidden>
      {[1, 2, 3, 4, 5].map((lv) => (
        <line key={lv} x1="6" x2="94" y1={Y(lv)} y2={Y(lv)} stroke="#E5E7EB" strokeWidth="3" />
      ))}
      {tone === 0
        ? <circle cx="50" cy={Y(2.5)} r="11" fill={w} />
        : <path d={KONTUR[tone]} fill="none" stroke={w} strokeWidth="12" strokeLinecap="round" />}
    </svg>
  );
}

type Ucap = (teks: string) => unknown;

/* ── [slide-audio-eleven-v1] Pemutar klip per kata ─────────────────────────
   TTS biasa (Chirp) melafalkan satu Hanzi lepas dengan nada yang datar —
   naik-turunnya tak terdengar. Untuk kata di slide visual Mandarin dipakai klip
   rekaman ElevenLabs; selesai = saat audionya berakhir, jadi "Dengar berurutan"
   bisa memutar kata satu per satu dan menyalakan kontur yang sedang berbunyi. */
const KlipCtx = createContext(false);
let pemutar: HTMLAudioElement | null = null;
const urlKlip = (teks: string) => (AUDIO_SLIDE_ZH[teks] ? AUDIO_SLIDE_ZH_BASE + AUDIO_SLIDE_ZH[teks] : null);
const jeda = (ms: number) => new Promise<void>((ok) => setTimeout(ok, ms));

function putar(teks: string, ucap: Ucap | undefined, pakaiKlip: boolean): Promise<void> {
  const url = pakaiKlip ? urlKlip(teks) : null;
  if (url && typeof Audio !== "undefined") {
    try { pemutar?.pause(); } catch { /* diam */ }
    const a = new Audio(url);
    pemutar = a;
    return new Promise((ok) => {
      a.onended = () => ok();
      a.onerror = () => { ucap?.(teks); void jeda(900).then(ok); };
      a.play().catch(() => { ucap?.(teks); void jeda(900).then(ok); });
    });
  }
  ucap?.(teks);
  return jeda(1000);
}

/** Tombol yang membunyikan `teks`; tanpa fungsi ucap jadi blok biasa. */
function Bunyi({ teks, ucap, siapkan, children, className = "", style }: {
  teks?: string; ucap?: Ucap; siapkan?: (t: string) => void;
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  const [nyala, setNyala] = useState(false);
  const klip = useContext(KlipCtx);
  if (!ucap || !teks) return <div className={className} style={style}>{children}</div>;
  return (
    // [vc-slide-ketuk-tts-v1] data-ucap dibaca saat slide dipotret untuk Kelas Video.
    <button type="button" data-ucap={teks} className={`text-left transition hover:-translate-y-[1px] hover:shadow-md ${className}`}
      style={{ ...style, ...(nyala ? { boxShadow: "0 0 0 0.18em #99E6DC" } : null) }}
      onMouseEnter={() => siapkan?.(teks)}
      onClick={(e) => {
        e.stopPropagation();
        setNyala(true);
        void putar(teks, ucap, klip).then(() => setNyala(false));
      }}>
      {children}
    </button>
  );
}

const KARTU: React.CSSProperties = {
  background: "rgba(255,255,255,0.92)",
  border: "1px solid #E5E7EB",
  borderRadius: "0.8em",
};

/* ── Empat nada pada satu suku kata ─────────────────────────────────────── */

function VisualNada({ rows, ucap, siapkan, aksen }: { rows: Extract<Visual, { kind: "nada" }>["rows"]; ucap?: Ucap; siapkan?: (t: string) => void; aksen: string }) {
  const klip = useContext(KlipCtx);
  const berkontur = rows.filter((r) => r.tone !== 0);
  /* Baris yang sedang berbunyi: barisnya menyala, konturnya digambar ulang di
     grafik selagi suaranya terdengar — naik-turun nada terlihat DAN terdengar. */
  const [main, setMain] = useState<number | null>(null);
  const [jalan, setJalan] = useState(false);
  const giliran = useRef(0);
  useEffect(() => () => { giliran.current++; try { pemutar?.pause(); } catch { /* diam */ } }, []);
  const nadaMain = main != null ? rows[main]?.tone : null;

  const satu = async (i: number) => {
    const g = ++giliran.current;
    setJalan(false);
    setMain(i);
    await putar(rows[i].hanzi || rows[i].pinyin, ucap, klip);
    if (g === giliran.current) setMain(null);
  };
  const berurutan = async () => {
    if (jalan) { giliran.current++; setJalan(false); setMain(null); try { pemutar?.pause(); } catch { /* diam */ } return; }
    const g = ++giliran.current;
    setJalan(true);
    for (let i = 0; i < rows.length; i++) {
      if (g !== giliran.current) return;
      setMain(i);
      await putar(rows[i].hanzi || rows[i].pinyin, ucap, klip);
      await jeda(450);
    }
    if (g === giliran.current) { setMain(null); setJalan(false); }
  };

  return (
    <div className="grid h-full gap-[1.6cqw]" style={{ gridTemplateColumns: "38% 1fr" }}>
      <div className="flex min-h-0 flex-col p-[1.2cqw]" style={KARTU}>
        <div className="mb-[0.6cqh] text-[0.8em] font-bold uppercase tracking-wider" style={{ color: aksen }}>Kontur nada</div>
        <div className="relative min-h-0 flex-1">
          <svg viewBox="-6 0 108 100" preserveAspectRatio="xMidYMid meet" className="h-full w-full" aria-label="Kontur keempat nada">
            <style>{"@keyframes gambarNada{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}"}</style>
            {[1, 2, 3, 4, 5].map((lv) => (
              <g key={lv}>
                <line x1="8" x2="96" y1={Y(lv)} y2={Y(lv)} stroke="#E5E7EB" strokeWidth="0.8" strokeDasharray={lv === 1 || lv === 5 ? undefined : "2 2"} />
                <text x="2" y={Y(lv) + 2} fontSize="5.5" textAnchor="end" fill="#9CA3AF">{lv}</text>
              </g>
            ))}
            <text x="8" y={Y(5) - 4} fontSize="4.5" fill="#9CA3AF">tinggi</text>
            <text x="8" y={Y(1) + 7} fontSize="4.5" fill="#9CA3AF">rendah</text>
            <defs>
              {berkontur.map((r) => (
                <marker key={r.tone} id={`panah-nada-${r.tone}`} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                  <path d="M0 0 L10 5 L0 10 z" fill={WARNA_NADA[r.tone]} />
                </marker>
              ))}
            </defs>
            {berkontur.map((r) => {
              const ini = nadaMain === r.tone;
              const redup = nadaMain != null && !ini;
              return (
                <path key={ini ? `${r.tone}-${main}` : r.tone} d={KONTUR[r.tone as Exclude<Nada, 0>]} fill="none" stroke={WARNA_NADA[r.tone]}
                  strokeWidth={ini ? 4 : 2.6} strokeLinecap="round" pathLength={100} opacity={redup ? 0.18 : 1}
                  markerEnd={`url(#panah-nada-${r.tone})`}
                  style={ini ? { strokeDasharray: 100, animation: "gambarNada 0.55s ease-out both" } : { transition: "opacity .2s" }} />
              );
            })}
            {nadaMain === 0 && <circle cx="50" cy={Y(2.5)} r="3.2" fill={WARNA_NADA[0]} />}
            {/* Label pinyin di ujung tiap kontur. */}
            {berkontur.map((r) => {
              const ujung: Record<number, [number, number]> = { 1: [50, Y(5) - 3], 2: [70, Y(4.6) + 7], 3: [44, Y(1) + 9], 4: [66, Y(3.4) - 1] };
              const [x, y] = ujung[r.tone];
              return <text key={r.tone} x={x} y={y} fontSize="7" fontWeight="800" textAnchor="middle" fill={WARNA_NADA[r.tone]}
                opacity={nadaMain != null && nadaMain !== r.tone ? 0.25 : 1}>{r.pinyin}</text>;
            })}
          </svg>
        </div>
        {ucap && (
          <button type="button" onClick={(e) => { e.stopPropagation(); void berurutan(); }}
            onMouseEnter={() => rows.forEach((r) => siapkan?.(r.hanzi || r.pinyin))}
            className="mt-[0.8cqh] inline-flex items-center justify-center gap-[0.4em] rounded-full px-[1em] py-[0.35em] text-[0.85em] font-bold text-white shadow-sm transition hover:brightness-110"
            style={{ background: aksen }}>
            {jalan ? <><Square className="h-[0.9em] w-[0.9em]" /> Berhenti</> : <><Play className="h-[1em] w-[1em]" /> Dengar berurutan</>}
          </button>
        )}
      </div>

      <div className="flex min-h-0 flex-col justify-between gap-[0.8cqh]">
        {rows.map((r, i) => {
          const w = WARNA_NADA[r.tone];
          const nyala = main === i;
          const isi = (
            <>
              <div className="flex w-[4.6em] shrink-0 flex-col items-center leading-none">
                <IkonNada tone={r.tone} size="2em" />
                <span className="mt-[0.2em] text-[0.68em] font-bold" style={{ color: w }}>{NAMA_NADA[r.tone]} {TANDA_NADA[r.tone]}</span>
              </div>
              <span className="w-[3.2em] shrink-0 text-[1.75em] font-extrabold leading-none" style={{ color: w }}>{r.pinyin}</span>
              {r.hanzi && <span className="w-[1.4em] shrink-0 text-[1.75em] font-bold leading-none" style={{ color: "#111827" }}>{r.hanzi}</span>}
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block font-bold" style={{ color: "#111827" }}>{r.meaning}</span>
                {r.hint && <span className="block text-[0.82em]" style={{ color: "#6B7280" }}>{r.hint}</span>}
              </span>
              {ucap && <Volume2 className="h-[1.1em] w-[1.1em] shrink-0" style={{ color: w, opacity: nyala ? 1 : 0.7 }} />}
            </>
          );
          const gaya: React.CSSProperties = {
            ...KARTU, borderLeft: `0.4em solid ${w}`,
            ...(nyala ? { background: `${w}14`, boxShadow: `0 0 0 0.15em ${w}`, transform: "scale(1.01)" } : null),
          };
          const kelas = "flex min-h-0 flex-1 items-center gap-[1.2cqw] px-[1.2cqw] py-[0.4cqh] text-left transition";
          return ucap ? (
            <button key={i} type="button" className={kelas} style={gaya}
              onMouseEnter={() => siapkan?.(r.hanzi || r.pinyin)}
              onClick={(e) => { e.stopPropagation(); void satu(i); }}>
              {isi}
            </button>
          ) : <div key={i} className={kelas} style={gaya}>{isi}</div>;
        })}
      </div>
    </div>
  );
}

/* ── Susunan suku kata: inisial + final + nada ──────────────────────────── */

const WARNA_INISIAL = "#0E7C7B";
const WARNA_FINAL = "#C2410C";

function Pil({ isi, warna, label, kosong }: { isi: React.ReactNode; warna: string; label: string; kosong?: boolean }) {
  return (
    <span className="flex shrink-0 flex-col items-center leading-none">
      <span className="grid min-w-[2.6em] place-items-center rounded-[0.6em] px-[0.5em] py-[0.3em] text-[1.25em] font-extrabold"
        style={kosong
          ? { border: `2px dashed ${warna}66`, color: `${warna}99` }
          : { background: `${warna}18`, border: `2px solid ${warna}55`, color: warna }}>
        {isi}
      </span>
      <span className="mt-[0.25em] text-[0.62em] font-bold uppercase tracking-wider" style={{ color: warna }}>{label}</span>
    </span>
  );
}

function VisualSuku({ rows, ucap, siapkan }: { rows: Extract<Visual, { kind: "suku-kata" }>["rows"]; ucap?: Ucap; siapkan?: (t: string) => void }) {
  const tanda = (t: React.ReactNode) => <span className="shrink-0 pb-[0.9em] text-[1.3em] font-bold" style={{ color: "#9CA3AF" }}>{t}</span>;
  return (
    <div className="flex h-full flex-col justify-between gap-[0.8cqh]">
      {rows.map((r, i) => {
        const w = WARNA_NADA[r.tone];
        return (
          <div key={i} className="flex min-h-0 flex-1 items-center gap-[0.9cqw] px-[1.4cqw] py-[0.4cqh]" style={KARTU}>
            <Pil isi={r.initial || "∅"} warna={WARNA_INISIAL} label="inisial" kosong={!r.initial} />
            {tanda("+")}
            <Pil isi={r.final} warna={WARNA_FINAL} label="final" />
            {tanda("+")}
            <Pil isi={<span className="flex items-center gap-[0.2em]"><IkonNada tone={r.tone} size="1.1em" />{r.tone || "·"}</span>} warna={w} label={NAMA_NADA[r.tone].toLowerCase()} />
            {tanda("=")}
            <Bunyi teks={r.hanzi || r.pinyin} ucap={ucap} siapkan={siapkan}
              className="flex shrink-0 items-center gap-[0.6em] rounded-[0.7em] px-[0.8em] py-[0.25em]"
              style={{ background: `${w}12`, border: `2px solid ${w}` }}>
              <span className="text-[1.6em] font-extrabold leading-none" style={{ color: w }}>{r.pinyin}</span>
              {r.hanzi && <span className="text-[1.6em] font-bold leading-none" style={{ color: "#111827" }}>{r.hanzi}</span>}
              {ucap && <Volume2 className="h-[1em] w-[1em]" style={{ color: w, opacity: 0.7 }} />}
            </Bunyi>
            <span className="min-w-0 flex-1 pl-[0.4em] font-semibold leading-tight" style={{ color: "#374151" }}>{r.meaning}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Kelompok bunyi (inisial per posisi lidah, vokal dasar) ─────────────── */

function Keping({ c, ucap, siapkan, aksen }: { c: Extract<Visual, { kind: "kelompok" }>["groups"][number]["chips"][number]; ucap?: Ucap; siapkan?: (t: string) => void; aksen: string }) {
  const contoh = c.sub || c.text;
  const w = c.hanzi ? WARNA_NADA[nadaPinyin(contoh)] : aksen;
  return (
    <Bunyi teks={c.hanzi || contoh} ucap={ucap} siapkan={siapkan}
      className="relative flex min-w-0 flex-1 flex-col items-center rounded-[0.6em] px-[0.4em] py-[0.35em] leading-tight"
      style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
      {c.mark && (
        <span className="absolute right-[0.25em] top-[0.2em] inline-flex items-center gap-[0.15em] rounded-full px-[0.35em] text-[0.55em] font-bold"
          style={{ background: "#E0F2FE", color: "#0369A1" }} title={c.mark}>
          <Wind className="h-[1em] w-[1em]" />{c.mark}
        </span>
      )}
      {c.sub ? (
        <>
          <span className="text-[1.45em] font-extrabold leading-none" style={{ color: "#111827" }}>{c.text}</span>
          <span className="mt-[0.15em] text-[0.88em] font-bold" style={{ color: w }}>
            {c.sub}{c.hanzi && <span className="ml-[0.25em]" style={{ color: "#111827" }}>{c.hanzi}</span>}
          </span>
        </>
      ) : (
        <span className="whitespace-nowrap text-[1.05em] font-extrabold" style={{ color: w }}>
          {c.text}{c.hanzi && <span className="ml-[0.3em]" style={{ color: "#111827" }}>{c.hanzi}</span>}
        </span>
      )}
      {c.meaning && <span className="text-[0.7em]" style={{ color: "#6B7280" }}>{c.meaning}</span>}
    </Bunyi>
  );
}

function VisualKelompok({ groups, ucap, siapkan, aksen }: { groups: Extract<Visual, { kind: "kelompok" }>["groups"]; ucap?: Ucap; siapkan?: (t: string) => void; aksen: string }) {
  const ubin = groups.some((g) => g.big);
  if (ubin) {
    return (
      <div className="grid h-full gap-[1.2cqw]" style={{ gridTemplateColumns: `repeat(${groups.length > 4 ? 3 : 2}, minmax(0,1fr))` }}>
        {groups.map((g, i) => (
          <div key={i} className="flex min-h-0 gap-[1cqw] p-[0.9cqw]" style={{ ...KARTU, borderTop: `0.3em solid ${aksen}` }}>
            <div className="grid w-[2.4em] shrink-0 place-items-center rounded-[0.6em] text-[1.9em] font-extrabold leading-none"
              style={{ background: `${aksen}14`, color: aksen }}>{g.big}</div>
            <div className="flex min-w-0 flex-1 flex-col gap-[0.5cqh]">
              {g.label && <div className="text-[0.9em] font-bold leading-tight" style={{ color: "#111827" }}>{g.label}</div>}
              {g.hint && <div className="text-[0.76em] leading-snug" style={{ color: "#6B7280" }}>{g.hint}</div>}
              <div className="mt-auto flex gap-[0.4em]">
                {g.chips.map((c, ci) => <Keping key={ci} c={c} ucap={ucap} siapkan={siapkan} aksen={aksen} />)}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid h-full gap-x-[1.4cqw] gap-y-[1cqh]" style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))", gridAutoRows: "1fr" }}>
      {groups.map((g, i) => (
        <div key={i} className="flex min-h-0 flex-col px-[0.9cqw] py-[0.6cqh]" style={{ ...KARTU, borderLeft: `0.35em solid ${aksen}` }}>
          <div className="flex items-baseline gap-[0.5em] leading-tight">
            <span className="text-[0.9em] font-bold" style={{ color: "#111827" }}>{g.label}</span>
            {g.hint && <span className="truncate text-[0.72em]" style={{ color: "#6B7280" }}>{g.hint}</span>}
          </div>
          <div className="mt-[0.5cqh] flex min-h-0 flex-1 gap-[0.4em]">
            {g.chips.map((c, ci) => <Keping key={ci} c={c} ucap={ucap} siapkan={siapkan} aksen={aksen} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Jebakan ejaan: tulisan → jangan dibaca → bacanya ───────────────────── */

function VisualJebakan({ rows, ucap, siapkan }: { rows: Extract<Visual, { kind: "jebakan" }>["rows"]; ucap?: Ucap; siapkan?: (t: string) => void }) {
  const kolom = "30% 1fr 1fr";
  return (
    <div className="flex h-full flex-col gap-[0.7cqh]">
      <div className="grid shrink-0 gap-[1cqw] px-[0.6cqw] text-[0.72em] font-bold uppercase tracking-wider" style={{ gridTemplateColumns: kolom, color: "#6B7280" }}>
        <span>Tulisan pinyin</span>
        <span style={{ color: "#BE123C" }}>Jangan dibaca</span>
        <span style={{ color: "#047857" }}>Bacanya</span>
      </div>
      {rows.map((r, i) => {
        const w = WARNA_NADA[nadaPinyin(r.text)];
        return (
          <div key={i} className="grid min-h-0 flex-1 items-stretch gap-[1cqw]" style={{ gridTemplateColumns: kolom }}>
            <Bunyi teks={r.hanzi || r.text} ucap={ucap} siapkan={siapkan}
              className="flex items-center gap-[0.5em] px-[0.8em]" style={{ ...KARTU, borderLeft: `0.35em solid ${w}` }}>
              <span className="text-[1.3em] font-extrabold leading-none" style={{ color: w }}>{r.text}</span>
              {r.hanzi && <span className="text-[1.3em] font-bold leading-none" style={{ color: "#111827" }}>{r.hanzi}</span>}
              {r.meaning && <span className="min-w-0 truncate text-[0.75em]" style={{ color: "#6B7280" }}>{r.meaning}</span>}
              {ucap && <Volume2 className="ml-auto h-[1em] w-[1em] shrink-0" style={{ color: w, opacity: 0.7 }} />}
            </Bunyi>
            <div className="flex items-center gap-[0.5em] rounded-[0.8em] px-[0.8em] text-[0.9em] leading-tight" style={{ background: "#FFF1F2", border: "1px solid #FECDD3", color: "#9F1239" }}>
              <X className="h-[1.1em] w-[1.1em] shrink-0" style={{ color: "#E11D48" }} /><span>{r.wrong}</span>
            </div>
            <div className="flex items-center gap-[0.5em] rounded-[0.8em] px-[0.8em] text-[0.9em] leading-tight" style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46" }}>
              <Check className="h-[1.1em] w-[1.1em] shrink-0" style={{ color: "#059669" }} /><span>{r.right}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── [slide-sejarah-v1] Peta persebaran + linimasa yang bisa diputar ──────────
   Peta dasar = Natural Earth 110m (world-atlas) yang sudah diproyeksikan
   plate carrée ke path SVG: x = (lon+180)·10, y = (90−lat)·10 — berkas statis
   /peta/dunia-110m.json di kedua repo (±34 KB gzip), diunduh sekali saat slide
   sejarah pertama tampil. Sumbu x dipadatkan cos(lintang tengah) supaya bentuk
   daratan tidak melebar; lingkaran persebaran dihitung langsung di koordinat
   layar sehingga tetap bulat. */

let petaDunia: Promise<Record<string, string> | null> | null = null;
const muatPeta = () =>
  (petaDunia ??= fetch("/peta/dunia-110m.json").then((r) => (r.ok ? r.json() : null)).catch(() => { petaDunia = null; return null; }));

const MUNCUL = "@keyframes slideVisMuncul{from{opacity:0;transform:translateY(0.4em)}to{opacity:1;transform:none}}";
export const formatTahun = (t: number) => (t < 0 ? `${-t} SM` : t < 1000 ? `${t} M` : String(t));
const DURASI_PER_PERISTIWA = 2000;

function VisualSejarah({ v, ucap, siapkan, aksen }: { v: Extract<Visual, { kind: "sejarah" }>; ucap?: Ucap; siapkan?: (t: string) => void; aksen: string }) {
  const uid = useId().replace(/:/g, "");
  const [peta, setPeta] = useState<Record<string, string> | null>(null);
  useEffect(() => { let hidup = true; void muatPeta().then((p) => { if (hidup) setPeta(p); }); return () => { hidup = false; }; }, []);

  const ev = v.peristiwa;
  const akhir = ev.length - 1;
  /* pos = posisi pecahan di linimasa (0 … jumlah peristiwa − 1). Mulai di ujung
     supaya peta langsung utuh (juga untuk cuplikan/gambar slide).
     [slide-sejarah-langkah-v1] Pengajar maju satu peristiwa per klik: pos
     dianimasikan menuju `tujuan` lalu berhenti, supaya ada waktu menjelaskan. */
  const [pos, setPos] = useState(akhir);
  const posRef = useRef(akhir);
  const [tujuan, setTujuan] = useState<number | null>(null);
  useEffect(() => {
    if (tujuan === null) return;
    let raf = 0; let lalu = performance.now();
    const langkah = (kini: number) => {
      // stempel rAF pertama bisa lebih awal dari performance.now() → dt negatif.
      const dt = Math.max(0, kini - lalu); lalu = kini;
      const p = posRef.current;
      const arah = Math.sign(tujuan - p);
      let n = p + (arah * dt) / DURASI_PER_PERISTIWA;
      if (arah === 0 || (arah > 0 ? n >= tujuan : n <= tujuan)) n = tujuan;
      posRef.current = n; setPos(n);
      if (n === tujuan) setTujuan(null); else raf = requestAnimationFrame(langkah);
    };
    raf = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(raf);
  }, [tujuan]);
  const lompat = (i: number) => { setTujuan(null); posRef.current = i; setPos(i); };
  const gerak = (i: number) => setTujuan(Math.max(0, Math.min(akhir, i)));

  const i0 = Math.max(0, Math.min(akhir, Math.floor(pos + 1e-6)));
  const frac = pos - i0;
  const tahun = i0 >= akhir ? ev[akhir].tahun : ev[i0].tahun + (ev[i0 + 1].tahun - ev[i0].tahun) * frac;
  const kini = ev[i0];
  const tampak = (t: number) => t <= tahun + 0.5;

  const [lon0, lat0, lon1, lat1] = v.fokus;
  const k = Math.cos((((lat0 + lat1) / 2) * Math.PI) / 180);
  const X = (lon: number) => (lon + 180) * 10 * k;
  const Yg = (lat: number) => (90 - lat) * 10;
  const vb = { x: X(lon0), y: Yg(lat1), w: (lon1 - lon0) * 10 * k, h: (lat1 - lat0) * 10 };
  const u = vb.w / 100; // satuan relatif lebar peta
  const semua = peta ? Object.values(peta).join("") : "";
  const negaraAktif = new Set((v.negara || []).filter((n) => tampak(n.tahun)).map((n) => n.id));

  // Patokan langkah = tujuan yang sedang dituju (klik beruntun tetap maju/mundur satu-satu).
  const diUjung = tujuan === null && pos >= akhir - 1e-3;
  const diAwal = tujuan === null ? pos <= 1e-3 : tujuan === 0;
  const berikutnya = () => (diUjung ? lompat(0) : gerak((tujuan ?? Math.floor(pos + 1e-6)) + 1));
  const sebelumnya = () => gerak((tujuan ?? Math.ceil(pos - 1e-6)) - 1);

  return (
    <div className="grid h-full gap-[1.2cqw]" style={{ gridTemplateColumns: "1fr 37%" }}>
      {/* Peta */}
      <div className="relative min-h-0 overflow-hidden" style={{ ...KARTU, background: "#D9EEF3" }}>
        <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" aria-label="Peta persebaran bahasa">
          <style>{`@keyframes denyut-${uid}{0%{opacity:.7;transform:scale(1)}100%{opacity:0;transform:scale(3.2)}}${MUNCUL}`}</style>
          <defs>
            <radialGradient id={`${uid}-g`}>
              <stop offset="0" stopColor={aksen} stopOpacity="0.62" />
              <stop offset="0.65" stopColor={aksen} stopOpacity="0.42" />
              <stop offset="1" stopColor={aksen} stopOpacity="0" />
            </radialGradient>
            <clipPath id={`${uid}-darat`}><path d={semua} transform={`scale(${k} 1)`} /></clipPath>
          </defs>
          <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="#D9EEF3" />
          {/* Garis lintang/bujur tipis setiap 10° */}
          {Array.from({ length: 37 }, (_, i) => -180 + i * 10).filter((l) => l > lon0 && l < lon1).map((l) => (
            <line key={`b${l}`} x1={X(l)} x2={X(l)} y1={vb.y} y2={vb.y + vb.h} stroke="#C4E2EA" strokeWidth={u * 0.15} />
          ))}
          {Array.from({ length: 19 }, (_, i) => -90 + i * 10).filter((l) => l > lat0 && l < lat1).map((l) => (
            <line key={`l${l}`} y1={Yg(l)} y2={Yg(l)} x1={vb.x} x2={vb.x + vb.w} stroke={l === 0 ? "#AFD5DF" : "#C4E2EA"} strokeWidth={u * (l === 0 ? 0.25 : 0.15)} />
          ))}
          {peta && (
            <g transform={`scale(${k} 1)`}>
              {Object.entries(peta).map(([id, d]) => (
                <path key={id} d={d} fill={negaraAktif.has(id) ? aksen : "#FBF5E6"} fillOpacity={negaraAktif.has(id) ? 0.3 : 1}
                  stroke="#B5A780" strokeWidth={0.6} vectorEffect="non-scaling-stroke" style={{ transition: "fill-opacity .6s, fill .6s" }} />
              ))}
            </g>
          )}
          {/* Persebaran: lingkaran lembut yang dipotong garis pantai */}
          <g clipPath={peta ? `url(#${uid}-darat)` : undefined}>
            {(v.wilayah || []).map((w, i) => (
              <g key={i} transform={`translate(${X(w.lon)} ${Yg(w.lat)})`}>
                <circle r={w.r * 10} fill={`url(#${uid}-g)`}
                  style={{ transform: `scale(${tampak(w.tahun) ? 1 : 0})`, transition: "transform 1.1s cubic-bezier(.2,.8,.2,1)" }} />
              </g>
            ))}
          </g>
          {(v.wilayah || []).filter((w) => w.label).map((w, i) => (
            <text key={i} x={X(w.lon)} y={Yg(w.lat)} textAnchor="middle" fontSize={u * 2.3} fontWeight={800} fontStyle="italic"
              fill="#0B4F4E" stroke="#fff" strokeWidth={u * 0.5} paintOrder="stroke" opacity={tampak(w.tahun) ? 0.9 : 0}
              style={{ transition: "opacity .6s" }}>{w.label}</text>
          ))}
          {/* Rute (mis. pelayaran) digambar bertahap */}
          {(v.rute || []).map((r, i) => {
            const d = r.titik.map(([lo, la], j) => `${j ? "L" : "M"}${X(lo)} ${Yg(la)}`).join("");
            const on = tampak(r.tahun);
            return (
              <g key={i}>
                <path d={d} fill="none" stroke="#B45309" strokeWidth={u * 0.45} strokeLinecap="round" strokeLinejoin="round" pathLength={100}
                  style={{ strokeDasharray: 100, strokeDashoffset: on ? 0 : 100, transition: "stroke-dashoffset 2.2s ease-in-out" }} />
                {r.label && (() => { const [lo, la] = r.di || r.titik[Math.floor(r.titik.length / 2)]; return (
                  <text x={X(lo) + u * 1.2} y={Yg(la)} fontSize={u * 2} fontWeight={700} fill="#92400E" stroke="#fff" strokeWidth={u * 0.45} paintOrder="stroke"
                    opacity={on ? 1 : 0} style={{ transition: "opacity .8s .8s" }}>{r.label}</text>
                ); })()}
              </g>
            );
          })}
          {/* Titik kota/peristiwa */}
          {(v.titik || []).map((t, i) => {
            const on = tampak(t.tahun);
            const baru = on && t.tahun === kini.tahun;
            return (
              <g key={i} transform={`translate(${X(t.lon)} ${Yg(t.lat)})`} opacity={on ? 1 : 0} style={{ transition: "opacity .5s" }}>
                {baru && <circle r={u * 0.9} fill="none" stroke={aksen} strokeWidth={u * 0.3}
                  style={{ animation: `denyut-${uid} 1.4s ease-out infinite`, transformBox: "fill-box", transformOrigin: "center" }} />}
                <circle r={u * (baru ? 0.95 : 0.7)} fill="#fff" stroke={baru ? aksen : "#475569"} strokeWidth={u * 0.3} />
                <text x={u * (t.kiri ? -1.4 : 1.4)} y={u * 0.75} textAnchor={t.kiri ? "end" : "start"} fontSize={u * (baru ? 2.3 : 1.9)} fontWeight={baru ? 800 : 600}
                  fill={baru ? "#0B4F4E" : "#334155"} stroke="#fff" strokeWidth={u * 0.5} paintOrder="stroke">{t.nama}</text>
              </g>
            );
          })}
        </svg>
        {/* Tahun berjalan */}
        <div className="pointer-events-none absolute left-[0.8em] top-[0.6em] rounded-[0.6em] px-[0.7em] py-[0.2em] shadow-sm"
          style={{ background: "rgba(255,255,255,0.92)" }}>
          <div className="text-[0.62em] font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>Tahun</div>
          <div className="text-[1.5em] font-extrabold leading-none tabular-nums" style={{ color: aksen }}>{formatTahun(Math.round(tahun))}</div>
        </div>
        {!peta && <div className="absolute inset-0 grid place-items-center text-[0.8em]" style={{ color: "#6B7280" }}>Memuat peta…</div>}
        {!!v.stat?.length && (
          <div className="pointer-events-none absolute bottom-[0.6em] left-[0.6em] right-[0.6em] flex flex-wrap gap-[0.4em]">
            {v.stat.slice(0, 3).map((x, i) => (
              <div key={i} className="rounded-[0.6em] px-[0.6em] py-[0.2em] leading-tight shadow-sm" style={{ background: "rgba(255,255,255,0.93)" }}>
                <span className="text-[0.95em] font-extrabold" style={{ color: aksen }}>{x.angka}</span>
                <span className="ml-[0.35em] text-[0.66em] font-semibold" style={{ color: "#4B5563" }}>{x.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Linimasa: tombol Sebelumnya/Berikutnya + daftar peristiwa; yang sedang disorot melebar */}
      <div className="flex min-h-0 flex-col gap-[0.6cqh]">
        <div className="flex shrink-0 items-center gap-[0.5em]">
          <button type="button" onClick={(e) => { e.stopPropagation(); sebelumnya(); }} disabled={diAwal}
            className="inline-flex shrink-0 items-center justify-center rounded-full p-[0.35em] text-[0.8em] shadow-sm transition hover:brightness-95 disabled:opacity-40"
            style={{ background: "#fff", border: `1px solid ${aksen}66`, color: aksen }} aria-label="Peristiwa sebelumnya" title="Sebelumnya">
            <ChevronLeft className="h-[1.1em] w-[1.1em]" />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); berikutnya(); }}
            className="inline-flex shrink-0 items-center gap-[0.4em] rounded-full px-[0.9em] py-[0.3em] text-[0.8em] font-bold text-white shadow-sm transition hover:brightness-110"
            style={{ background: aksen }} aria-label={diUjung ? "Mulai dari peristiwa pertama" : "Peristiwa berikutnya"}>
            {diUjung ? <><RotateCcw className="h-[1em] w-[1em]" /> Mulai dari awal</>
              : <>Berikutnya <ChevronRight className="h-[1.1em] w-[1.1em]" /></>}
          </button>
          <div className="relative h-[0.3em] min-w-0 flex-1 rounded-full" style={{ background: "#E5E7EB" }}>
            <div className="absolute inset-y-0 left-0 rounded-full" style={{ background: aksen, width: `${akhir ? (pos / akhir) * 100 : 100}%` }} />
          </div>
          <span className="shrink-0 text-[0.7em] font-bold tabular-nums" style={{ color: "#6B7280" }}>{i0 + 1}/{ev.length}</span>
        </div>
        <div className="relative flex min-h-0 flex-1 flex-col gap-[0.35cqh] overflow-hidden">
          {/* garis linimasa */}
          <div className="absolute bottom-[0.6em] left-[0.55em] top-[0.6em] w-[0.14em]" style={{ background: "#E5E7EB" }} />
          {ev.map((p, i) => {
            const ini = i === i0;
            const lewat = i <= pos + 1e-6;
            return (
              // div ber-role, bukan <button>: di dalamnya ada tombol bunyi (button di dalam button = HTML tak sah).
              <div key={i} role="button" tabIndex={0}
                onClick={(e) => { e.stopPropagation(); lompat(i); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); lompat(i); } }}
                className={`relative flex min-h-0 cursor-pointer items-start gap-[0.6em] rounded-[0.6em] text-left transition ${ini ? "shrink-0" : "flex-1"}`}
                style={ini ? { ...KARTU, padding: "0.35em 0.6em 0.45em 0", borderColor: `${aksen}66`, background: `${aksen}0D` } : { padding: "0 0.6em 0 0" }}>
                <span className="relative z-[1] mt-[0.2em] block shrink-0 rounded-full"
                  style={{ width: "1.1em", height: "1.1em", background: lewat ? aksen : "#fff", border: `0.16em solid ${lewat ? aksen : "#CBD5E1"}`,
                    boxShadow: ini ? `0 0 0 0.22em ${aksen}33` : undefined }} />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="flex items-baseline gap-[0.5em]">
                    <span className="shrink-0 text-[0.78em] font-extrabold tabular-nums" style={{ color: lewat ? aksen : "#9CA3AF" }}>{formatTahun(p.tahun)}</span>
                    <span className={`min-w-0 text-[0.8em] font-bold ${ini ? "" : "truncate"}`} style={{ color: lewat ? "#111827" : "#9CA3AF" }}>{p.judul}</span>
                  </span>
                  {ini && (p.asli || p.info) && (
                    <span className="mt-[0.3em] block" style={{ animation: "slideVisMuncul .35s ease-out" }}>
                      {p.asli && (
                        <Bunyi teks={p.asli} ucap={ucap} siapkan={siapkan}
                          className="mb-[0.25em] inline-flex items-center gap-[0.45em] rounded-[0.5em] px-[0.5em] py-[0.1em]"
                          style={{ background: "#fff", border: `1px solid ${aksen}55` }}>
                          <span className="text-[1.05em] font-bold" style={{ color: "#111827" }}>{p.asli}</span>
                          {p.translit && <span className="text-[0.75em] font-semibold" style={{ color: aksen }}>{p.translit}</span>}
                          {ucap && <Volume2 className="h-[0.9em] w-[0.9em]" style={{ color: aksen, opacity: 0.75 }} />}
                        </Bunyi>
                      )}
                      {p.info && <span className="block text-[0.72em] leading-snug" style={{ color: "#4B5563" }}>{p.info}</span>}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── [slide-banding-v1] Perbandingan tata bahasa dengan bahasa Indonesia ─────
   Kiri: daftar aspek + label Sama/Mirip/Beda. Kanan: contoh kalimat kedua bahasa
   berdampingan; kata yang sepadan diberi warna sama sehingga perbedaan urutan
   kata terlihat sekilas. */

const WARNA_STATUS: Record<BandingStatus, { teks: string; latar: string; label: string }> = {
  sama: { teks: "#047857", latar: "#D1FAE5", label: "Sama" },
  mirip: { teks: "#B45309", latar: "#FEF3C7", label: "Mirip" },
  beda: { teks: "#BE123C", latar: "#FFE4E6", label: "Beda" },
};
const WARNA_PADANAN = ["#0E7C7B", "#C2410C", "#7C3AED", "#2563EB", "#DB2777", "#65A30D", "#0891B2"];
const IKON_STATUS: Record<BandingStatus, typeof Check> = { sama: Equal, mirip: Shuffle, beda: X };

function Token({ t, sisi, ucap, siapkan }: { t: BandingToken; sisi: "id" | "target"; ucap?: Ucap; siapkan?: (t: string) => void }) {
  const w = t.g ? WARNA_PADANAN[(t.g - 1) % WARNA_PADANAN.length] : "#9CA3AF";
  const target = sisi === "target";
  const isi = (
    <>
      {t.tr && <span className="text-[0.85em] font-bold" style={{ color: w }}>{t.tr}</span>}
      <span className={`${target ? "text-[2.1em]" : "text-[1.55em]"} font-extrabold leading-tight`} style={{ color: "#111827" }}>{t.t}</span>
      {t.arti && <span className="text-[0.75em] font-medium" style={{ color: "#6B7280" }}>{t.arti}</span>}
    </>
  );
  const gaya: React.CSSProperties = t.g
    ? { background: `${w}14`, border: `0.13em solid ${w}`, borderBottomWidth: "0.3em" }
    : { background: "#F9FAFB", border: "0.13em dashed #CBD5E1", borderBottomWidth: "0.3em" };
  const kelas = "flex min-w-[3em] flex-col items-center rounded-[0.7em] px-[0.8em] py-[0.3em] leading-tight";
  const data = { "data-sisi": sisi, "data-g": t.g ?? "" };
  return target && ucap ? (
    <span {...data} className="inline-flex"><Bunyi teks={t.t} ucap={ucap} siapkan={siapkan} className={kelas} style={gaya}>{isi}</Bunyi></span>
  ) : <span {...data} className={kelas} style={gaya}>{isi}</span>;
}

/** Garis lengkung dari kata Indonesia ke padanannya — urutan yang bersilang langsung terlihat. */
function useGarisPadanan(kotak: React.RefObject<HTMLDivElement | null>, kunci: unknown) {
  const [garis, setGaris] = useState<Array<{ d: string; w: string }>>([]);
  useLayoutEffect(() => {
    const el = kotak.current;
    if (!el) return;
    const hitung = () => {
      const b = el.getBoundingClientRect();
      const ambil = (sisi: string) => {
        const m = new Map<string, DOMRect>();
        el.querySelectorAll<HTMLElement>(`[data-sisi="${sisi}"]`).forEach((n) => { if (n.dataset.g) m.set(n.dataset.g, n.getBoundingClientRect()); });
        return m;
      };
      const atas = ambil("id"); const bawah = ambil("target");
      const out: Array<{ d: string; w: string }> = [];
      atas.forEach((r1, g) => {
        const r2 = bawah.get(g); if (!r2) return;
        const x1 = r1.left + r1.width / 2 - b.left, y1 = r1.bottom - b.top + 2;
        const x2 = r2.left + r2.width / 2 - b.left, y2 = r2.top - b.top - 2;
        const my = (y1 + y2) / 2;
        out.push({ d: `M${x1} ${y1} C${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`, w: WARNA_PADANAN[(Number(g) - 1) % WARNA_PADANAN.length] });
      });
      setGaris(out);
    };
    hitung();
    const ro = new ResizeObserver(hitung);
    ro.observe(el);
    return () => ro.disconnect();
  }, [kotak, kunci]);
  return garis;
}

function VisualBanding({ v, ucap, siapkan, aksen }: { v: Extract<Visual, { kind: "banding" }>; ucap?: Ucap; siapkan?: (t: string) => void; aksen: string }) {
  const [pilih, setPilih] = useState(0);
  const r = v.rows[Math.min(pilih, v.rows.length - 1)];
  const kotak = useRef<HTMLDivElement>(null);
  const garis = useGarisPadanan(kotak, pilih);
  const st = WARNA_STATUS[r.status];
  const hitung = (s: BandingStatus) => v.rows.filter((x) => x.status === s).length;
  const kalimat = r.teks || r.target.map((t) => t.t).join(/[　-鿿가-힯]/.test(r.target[0]?.t || "") ? "" : " ");
  // [slide-banding-rtl-v1] Aksara Arab/Ibrani: kata pertama di KANAN (urutan baca), garis padanan ikut posisi aslinya.
  const rtl = r.target.some((t) => /[\u0590-\u08FF]/.test(t.t));
  return (
    <div className="grid h-full gap-[1.2cqw]" style={{ gridTemplateColumns: "36% 1fr" }}>
      <style>{MUNCUL}</style>
      <div className="flex min-h-0 flex-col gap-[0.5cqh]">
        <div className="flex shrink-0 gap-[0.4em] text-[0.7em] font-bold">
          {(["sama", "mirip", "beda"] as BandingStatus[]).map((s) => (
            <span key={s} className="rounded-full px-[0.7em] py-[0.15em]" style={{ background: WARNA_STATUS[s].latar, color: WARNA_STATUS[s].teks }}>
              {hitung(s)} {WARNA_STATUS[s].label.toLowerCase()}
            </span>
          ))}
        </div>
        {v.rows.map((x, i) => {
          const s = WARNA_STATUS[x.status];
          const Ikon = IKON_STATUS[x.status];
          const ini = i === pilih;
          return (
            <button key={i} type="button" onClick={(e) => { e.stopPropagation(); setPilih(i); }}
              className="flex min-h-0 flex-1 items-center gap-[0.6em] px-[0.8em] text-left transition"
              style={{ ...KARTU, borderLeft: `0.35em solid ${s.teks}`, ...(ini ? { background: s.latar, boxShadow: `0 0 0 0.14em ${s.teks}` } : null) }}>
              <span className="grid h-[1.6em] w-[1.6em] shrink-0 place-items-center rounded-full" style={{ background: s.latar, color: s.teks }}>
                <Ikon className="h-[0.95em] w-[0.95em]" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[0.88em] font-bold" style={{ color: "#111827" }}>{x.aspek}</span>
              <span className="shrink-0 text-[0.66em] font-extrabold uppercase tracking-wider" style={{ color: s.teks }}>{s.label}</span>
            </button>
          );
        })}
      </div>

      <div key={pilih} className="flex min-h-0 flex-col gap-[0.9cqh] p-[1.3cqw]" style={{ ...KARTU, borderTop: `0.3em solid ${st.teks}`, animation: "slideVisMuncul .3s ease-out" }}>
        <div className="flex items-center gap-[0.6em]">
          <span className="rounded-full px-[0.7em] py-[0.1em] text-[0.72em] font-extrabold uppercase tracking-wider" style={{ background: st.latar, color: st.teks }}>{st.label}</span>
          <span className="text-[1.1em] font-extrabold" style={{ color: "#111827" }}>{r.aspek}</span>
        </div>
        <p className="text-[0.88em] leading-snug" style={{ color: "#374151" }}>{r.ringkas}</p>

        <div ref={kotak} className="relative flex min-h-0 flex-1 flex-col justify-center gap-[9cqh]">
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            {garis.map((l, i) => (
              <path key={i} d={l.d} fill="none" stroke={l.w} strokeWidth={2.5} strokeDasharray="5 4" strokeLinecap="round" opacity={0.75} />
            ))}
          </svg>
          <div className="flex items-center gap-[1em]">
            <span className="w-[5.5em] shrink-0 text-[0.66em] font-bold uppercase leading-tight tracking-wider" style={{ color: "#6B7280" }}>Bahasa Indonesia</span>
            <div className="flex flex-wrap items-end gap-[0.6em]">{r.id.map((t, i) => <Token key={i} t={t} sisi="id" />)}</div>
          </div>
          <div className="flex items-center gap-[1em]">
            <span className="flex w-[5.5em] shrink-0 flex-col items-start gap-[0.4em] text-[0.66em] font-bold uppercase leading-tight tracking-wider" style={{ color: aksen }}>
              {v.bahasa}
              {ucap && (
                <button type="button" data-ucap={kalimat} onClick={(e) => { e.stopPropagation(); ucap(kalimat); }} onMouseEnter={() => siapkan?.(kalimat)}
                  className="inline-flex items-center gap-[0.3em] rounded-full px-[0.7em] py-[0.2em] text-white normal-case tracking-normal" style={{ background: aksen }}>
                  <Volume2 className="h-[1.1em] w-[1.1em]" /> Dengar
                </button>
              )}
            </span>
            <div dir={rtl ? "rtl" : undefined} className="flex flex-wrap items-end gap-[0.6em]">{r.target.map((t, i) => <Token key={i} t={t} sisi="target" ucap={ucap} siapkan={siapkan} />)}</div>
          </div>
        </div>
        {r.catatan && (
          <p className="shrink-0 rounded-[0.7em] px-[0.9em] py-[0.45em] text-[0.8em] leading-snug" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#475569" }}>
            {r.catatan}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── [slide-alfabet-v1] Abjad: satu ubin per huruf, klik = pop-up contoh kata ── */

const WARNA_TANDA = "#E11D48";

/* [slide-alfabet-aksara-v1] Aksara Arab/Ibrani dibaca kanan → kiri. */
const RTL = /[֐-ࣿ]/;
/* Aksara bertanda vokal di atas/bawah (Jawa, Khmer, Lao, Burma) butuh baris lebih longgar supaya tak menabrak romanisasi. */
const AKSARA_TINGGI = /[\uA980-\uA9DF\u1780-\u17FF\u0E80-\u0EFF\u1000-\u109F]/;
const longgar = (t: string): React.CSSProperties | undefined => (AKSARA_TINGGI.test(t) ? { lineHeight: 1.9, paddingBottom: "0.45em" } : undefined);

/** Label bawaan visual; dek BIPA (`ui: "en"`) memakai bahasa Inggris. */
const LABEL = {
  id: { klik: "Klik huruf untuk melihat contoh kata", beda: "bunyinya beda dari bahasa Indonesia", dibaca: "dibaca", khas: "Bunyi khas", contoh: "Contoh kata",
    dengar: "Dengar", tutup: "Tutup", bentuk: "Bentuk", bisu: "tidak dibaca", vokal: "Vokal murni", vokalKet: "pendek & jelas, persis bahasa Indonesia", seperti: "seperti" },
  en: { klik: "Click a letter to see example words", beda: "sounds different from English", dibaca: "sounds like", khas: "Special sound", contoh: "Example words",
    dengar: "Listen", tutup: "Close", bentuk: "Forms", bisu: "silent", vokal: "Pure vowels", vokalKet: "short & clear, always the same sound", seperti: "like" },
};

/** Huruf besar + kecil untuk ubin. Aksara tanpa huruf kapital (Arab, Devanagari, …) cukup sekali;
 *  digraf ditulis "Ch ch" / "Dzs dzs". Georgia: toUpperCase() memberi Mtavruli yang tak dipakai
 *  dalam tulisan sehari-hari, jadi Mkhedruli tetap tampil sekali. */
function bentukKapital(h: string, besarTetap?: string): { besar: string; kecil: string | null } {
  // [slide-alfabet-aksara-v1] `besar` = kapital eksplisit (Turki: i → İ, ı → I — toUpperCase() bawaan salah).
  if (besarTetap) return { besar: besarTetap, kecil: h };
  if (/[Ⴀ-ჿᲐ-Ჿ]/.test(h)) return { besar: h, kecil: null };
  const kecil = h.toLowerCase();
  const [c0, ...sisa] = Array.from(kecil);
  // [slide-alfabet-v1] ß → "SS" kalau di-toUpperCase(); pakai kapital ẞ.
  const besar = (c0 === "ß" ? "ẞ" : (c0 || "").toUpperCase()) + sisa.join("");
  return besar === kecil ? { besar: kecil, kecil: null } : { besar, kecil };
}

function VisualAlfabet({ v, ucap, siapkan, aksen }: { v: Extract<Visual, { kind: "alfabet" }>; ucap?: Ucap; siapkan?: (t: string) => void; aksen: string }) {
  const [buka, setBuka] = useState<number | null>(null);
  const L = LABEL[v.ui === "en" ? "en" : "id"];
  const n = v.huruf.length;
  // Abjad panjang (Ceko 42, Hungaria 44, Georgia 33) tetap muat tanpa gulir.
  const kolom = n > 40 ? 11 : n > 30 ? 10 : n > 24 ? 9 : n > 16 ? 8 : 6;
  const h = buka === null ? null : v.huruf[buka];
  const rtl = v.huruf.some((x) => RTL.test(x.huruf));
  // Huruf berdiakritik yang berdiri sendiri di abjad (č, ö, å, ñ, …) tak boleh dilebur ke huruf dasarnya saat disorot.
  const tetap = new Set(v.huruf.map((x) => x.huruf.toLowerCase().normalize("NFC")).filter((x) => x.normalize("NFD") !== x));
  const suara = (x: { ucap?: string; nama: string }) => x.ucap || x.nama;

  // Selama pop-up terbuka: Esc menutup pop-up (bukan slideshow), panah = huruf sebelum/sesudahnya.
  useEffect(() => {
    if (buka === null) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopImmediatePropagation(); e.preventDefault(); setBuka(null); }
      else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.stopImmediatePropagation(); e.preventDefault();
        setBuka((b) => (b === null ? b : (b + (e.key === "ArrowRight" ? 1 : -1) + n) % n));
      }
    };
    window.addEventListener("keydown", k, true);
    return () => window.removeEventListener("keydown", k, true);
  }, [buka, n]);

  // Buka huruf = namanya langsung dibunyikan (tulisan asli kalau ada `ucap`).
  const pilih = (i: number) => { setBuka(i); ucap?.(suara(v.huruf[i])); };
  const geser = (d: number) => (e: React.MouseEvent) => { e.stopPropagation(); pilih((buka! + d + n) % n); };
  const hb = h ? bentukKapital(h.huruf, h.besar) : null;

  return (
    <div className="relative flex h-full flex-col gap-[0.8cqh]">
      <style>{MUNCUL + "@keyframes alfabetPop{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:none}}"}</style>
      <div className="flex shrink-0 items-center gap-[1.2em] text-[0.72em] font-semibold" style={{ color: "#6B7280" }}>
        <span>{L.klik}</span>
        <span className="inline-flex items-center gap-[0.4em]">
          <span className="h-[0.8em] w-[0.8em] rounded-full" style={{ background: WARNA_TANDA }} /> {v.ket || L.beda}
        </span>
      </div>
      <div dir={rtl ? "rtl" : undefined} className="grid min-h-0 flex-1 gap-[0.7cqw]" style={{ gridTemplateColumns: `repeat(${kolom}, minmax(0,1fr))`, gridAutoRows: "1fr" }}>
        {v.huruf.map((x, i) => {
          const beda = !!x.tanda;
          const w = beda ? WARNA_TANDA : aksen;
          const k = bentukKapital(x.huruf, x.besar);
          return (
            <button key={i} type="button" onMouseEnter={() => siapkan?.(suara(x))}
              onClick={(e) => { e.stopPropagation(); pilih(i); }}
              className="relative flex min-h-0 flex-col items-center justify-center rounded-[0.8em] leading-none transition hover:-translate-y-[2px] hover:shadow-lg"
              style={{ background: beda ? "#FFF1F2" : "#fff", border: `1px solid ${beda ? "#FECDD3" : "#E5E7EB"}`, borderBottom: `0.28em solid ${w}`,
                animation: `slideVisMuncul .35s ease-out ${i * 18}ms both`, ...(buka === i ? { boxShadow: `0 0 0 0.16em ${w}` } : null) }}>
              {beda && <span className="absolute right-[0.4em] top-[0.4em] h-[0.5em] w-[0.5em] rounded-full" style={{ background: WARNA_TANDA }} />}
              <span dir="auto" className={`${kolom > 9 ? "text-[1.75em]" : "text-[2.1em]"} font-extrabold`} style={{ color: k.kecil ? "#111827" : w }}>
                {k.besar}{k.kecil && <span className="ml-[0.04em] text-[0.7em] font-bold" style={{ color: w }}>{k.kecil}</span>}
              </span>
              <span dir="ltr" className="mt-[0.35em] max-w-full truncate px-[0.3em] text-[0.74em] font-semibold" style={{ color: "#4B5563" }}>{x.nama}</span>
            </button>
          );
        })}
      </div>

      {h && hb && (
        <div className="absolute inset-0 z-10 grid place-items-center rounded-[0.8em]" style={{ background: "rgba(15,23,42,0.35)", backdropFilter: "blur(2px)" }}
          onClick={(e) => { e.stopPropagation(); setBuka(null); }}>
          <div key={buka} className="relative flex w-[78%] max-w-full gap-[2cqw] p-[1.8cqw]" onClick={(e) => e.stopPropagation()}
            style={{ ...KARTU, background: "#fff", borderTop: `0.35em solid ${h.tanda ? WARNA_TANDA : aksen}`, boxShadow: "0 1.2cqw 3cqw rgba(15,23,42,0.25)", animation: "alfabetPop .22s ease-out" }}>
            <button type="button" aria-label={L.tutup} onClick={(e) => { e.stopPropagation(); setBuka(null); }}
              className="absolute right-[0.6em] top-[0.6em] grid h-[1.8em] w-[1.8em] place-items-center rounded-full hover:bg-gray-100" style={{ color: "#6B7280" }}>
              <X className="h-[1.1em] w-[1.1em]" />
            </button>
            <div className="flex w-[30%] shrink-0 flex-col items-center justify-center rounded-[0.8em] py-[1em] text-center"
              style={{ background: h.tanda ? "#FFF1F2" : `${aksen}12` }}>
              <span dir="auto" className="text-[4.6em] font-extrabold leading-none" style={{ color: hb.kecil ? "#111827" : h.tanda ? WARNA_TANDA : aksen }}>
                {hb.besar}{hb.kecil && <span className="text-[0.6em]" style={{ color: h.tanda ? WARNA_TANDA : aksen }}>{hb.kecil}</span>}
              </span>
              {h.bentuk && (
                <span className="mt-[1em] text-[0.72em] font-semibold" style={{ color: "#6B7280" }}>
                  {L.bentuk}: <span dir="rtl" className="text-[1.5em] font-bold" style={{ color: "#374151" }}>{h.bentuk}</span>
                </span>
              )}
              <span className="mt-[0.4em] text-[1.25em] font-extrabold" style={{ color: "#111827" }}>{h.nama}</span>
              {h.baca && <span className="px-[0.5em] text-[0.82em]" style={{ color: "#6B7280" }}>{L.dibaca} “{h.baca}”</span>}
              {ucap && (
                <button type="button" onMouseEnter={() => siapkan?.(suara(h))} onClick={(e) => { e.stopPropagation(); ucap(suara(h)); }}
                  className="mt-[0.7em] inline-flex items-center gap-[0.35em] rounded-full px-[0.9em] py-[0.25em] text-[0.8em] font-bold text-white" style={{ background: aksen }}>
                  <Volume2 className="h-[1.1em] w-[1.1em]" /> {L.dengar}
                </button>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-[0.7em] pr-[1.5em]">
              {h.tanda && (
                <span className="self-start rounded-full px-[0.8em] py-[0.15em] text-[0.72em] font-extrabold uppercase tracking-wider" style={{ background: "#FFE4E6", color: "#BE123C" }}>
                  {L.khas} · {h.tanda}
                </span>
              )}
              {h.info && <p className="text-[0.9em] leading-snug" style={{ color: "#374151" }}>{h.info}</p>}
              <div className="text-[0.7em] font-bold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{L.contoh}</div>
              <div dir={rtl ? "rtl" : undefined} className="grid gap-[0.6em]" style={{ gridTemplateColumns: `repeat(${Math.min(h.contoh.length, 3) || 1}, minmax(0,1fr))` }}>
                {h.contoh.map((c, ci) => (
                  <Bunyi key={ci} teks={c.kata} ucap={ucap} siapkan={siapkan}
                    className="flex flex-col items-center rounded-[0.8em] px-[0.6em] py-[0.7em] text-center leading-tight"
                    style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                    {c.ikon && <span className="text-[2em] leading-none">{c.ikon}</span>}
                    <span dir="auto" className="mt-[0.3em] text-[1.25em] font-extrabold" style={{ color: "#111827", ...longgar(c.kata) }}>
                      <Sorot kata={c.kata} sorot={h.sorot || [h.huruf]} tetap={tetap} warna={h.tanda ? WARNA_TANDA : aksen} garis />
                    </span>
                    {c.baca && <span dir="ltr" className="text-[0.82em] font-bold" style={{ color: h.tanda ? WARNA_TANDA : aksen }}>“{c.baca}”</span>}
                    <span dir="ltr" className="text-[0.8em]" style={{ color: "#6B7280" }}>{c.arti}</span>
                    {ucap && <Volume2 className="mt-[0.3em] h-[0.9em] w-[0.9em]" style={{ color: "#9CA3AF" }} />}
                  </Bunyi>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between pt-[0.3em] text-[0.75em] font-semibold" style={{ color: "#6B7280" }}>
                <button type="button" onClick={geser(-1)} className="inline-flex items-center gap-[0.2em] rounded-full px-[0.6em] py-[0.2em] hover:bg-gray-100">
                  <ChevronLeft className="h-[1.1em] w-[1.1em]" /> {bentukKapital(v.huruf[(buka! - 1 + n) % n].huruf, v.huruf[(buka! - 1 + n) % n].besar).besar}
                </button>
                <span>{buka! + 1} / {n}</span>
                <button type="button" onClick={geser(1)} className="inline-flex items-center gap-[0.2em] rounded-full px-[0.6em] py-[0.2em] hover:bg-gray-100">
                  {bentukKapital(v.huruf[(buka! + 1) % n].huruf, v.huruf[(buka! + 1) % n].besar).besar} <ChevronRight className="h-[1.1em] w-[1.1em]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── [slide-bunyi-v1] Vokal murni + bunyi khas ──────────────────────────── */

const WARNA_VOKAL = ["#E11D48", "#EA580C", "#16A34A", "#2563EB", "#7C3AED"];
// Tilde ikut dilebur (Vietnam ũ = u + nada); ñ/ã yang berdiri sendiri dijaga lewat `tetap`.
const tanpaAksen = (c: string) => c.normalize("NFD").replace(/[̀-ͯ]/g, "").normalize("NFC").toLowerCase();

/** Potong `kata` jadi bagian biasa/tersorot: potongan `sorot` terpanjang dicocokkan dulu (rr sebelum r).
 *  Aksen dilebur (á = a), kecuali huruf di `tetap` — huruf berdiakritik yang berdiri sendiri (č ≠ c, ä ≠ a). */
function potongSorot(kata: string, sorot: string[], tetap?: Set<string>): Array<{ t: string; s: boolean }> {
  const lebur = (c: string) => {
    const k = c.toLowerCase().normalize("NFC");
    if (tetap?.has(k)) return k;
    if (!tetap?.size) return tanpaAksen(c);
    // Huruf bertanda nada di atas huruf khas (Vietnam ế = ê + nada) tetap dihitung huruf khas itu.
    const d = Array.from(k.normalize("NFD"));
    let pas = "";
    for (const t of tetap) {
      const td = Array.from(t.normalize("NFD"));
      if (td[0] === d[0] && td.slice(1).every((m) => d.includes(m)) && td.length > Array.from(pas.normalize("NFD")).length) pas = t;
    }
    return pas || tanpaAksen(c);
  };
  const huruf = Array.from(kata.normalize("NFC"));
  const dasar = huruf.map(lebur);
  const pola = [...sorot].map((x) => Array.from(x.normalize("NFC")).map(lebur)).sort((a, b) => b.length - a.length);
  const kena = huruf.map(() => false);
  for (let i = 0; i < huruf.length;) {
    const p = pola.find((q) => q.length && q.every((c, k) => dasar[i + k] === c));
    if (p) { for (let k = 0; k < p.length; k++) kena[i + k] = true; i += p.length; }
    else i++;
  }
  // [slide-alfabet-aksara-v1] Matra Devanagari/Bangla menempel di konsonannya — browser tak bisa mewarnai
  // separuh gugus aksara, jadi yang disorot satu gugus utuh (कु, মা), bukan matra-nya saja.
  const gugus: string[][] = typeof Intl !== "undefined" && "Segmenter" in Intl
    ? Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(huruf.join("")), (g) => Array.from(g.segment))
    : huruf.map((c) => [c]);
  const out: Array<{ t: string; s: boolean }> = [];
  let i = 0;
  for (const g of gugus) {
    const s = g.some((_, k) => kena[i + k]);
    i += g.length;
    const last = out[out.length - 1];
    if (last && last.s === s) last.t += g.join(""); else out.push({ t: g.join(""), s });
  }
  return out;
}

/** Huruf berdiakritik yang disebut di daftar (ä, ø, č, …) — tak dilebur ke huruf dasarnya. */
function hurufTetap(daftar: string[]): Set<string> {
  return new Set(daftar.flatMap((x) => Array.from(x.toLowerCase().normalize("NFC"))).filter((c) => c.normalize("NFD") !== c));
}

/** Huruf yang sedang dibahas diberi warna di dalam contoh katanya.
 *  Aksara Arab/Ibrani: huruf yang bersambung tetap utuh — kata diwarnai tanpa garis bawah supaya sambungannya tak putus. */
function Sorot({ kata, sorot, tetap, warna, garis, coret }: { kata: string; sorot: string[]; tetap?: Set<string>; warna: string; garis?: boolean; coret?: boolean }) {
  const gaya: React.CSSProperties = coret
    ? { color: "#94A3B8", textDecoration: "line-through", textDecorationColor: warna, textDecorationThickness: "0.12em" }
    : garis && !RTL.test(kata) ? { color: warna, textDecoration: "underline", textDecorationThickness: "0.1em", textUnderlineOffset: "0.15em" }
    : { color: warna };
  return <>{potongSorot(kata, sorot, tetap).map((b, k) => b.s ? <span key={k} style={gaya}>{b.t}</span> : <span key={k}>{b.t}</span>)}</>;
}

function VisualBunyi({ v, ucap, siapkan, aksen }: { v: Extract<Visual, { kind: "bunyi" }>; ucap?: Ucap; siapkan?: (t: string) => void; aksen: string }) {
  const L = LABEL[v.ui === "en" ? "en" : "id"];
  const kolom = v.khas.length > 4 ? 3 : 2;
  // Tanpa ubin vokal / kartu cuma satu baris → kartu tinggi; contoh kata dibesarkan supaya tak kosong melompong.
  const lapang = v.vokal.length === 0 || v.khas.length <= kolom;
  const tetap = hurufTetap([...v.vokal.flatMap((x) => [x.huruf, ...(x.sorot || [])]), ...v.khas.flatMap((x) => x.sorot || [x.tulisan])]);
  // Vokal lebih dari 6 (Finlandia 8, Hindi 11) dipecah dua baris.
  const nV = v.vokal.length;
  const dua = nV > 6;
  const kolomV = dua ? Math.ceil(nV / 2) : nV;
  // Lebih dari 7 kolom (Lao 16 vokal): ubin terlalu sempit untuk huruf + kata berdampingan → huruf di atas, kata di bawah.
  const rapat = kolomV > 7;
  return (
    <div className="flex h-full flex-col gap-[1.1cqh]">
      <style>{MUNCUL}</style>
      {nV > 0 && (
        <div className="grid shrink-0 gap-[0.8cqw]"
          style={{ height: v.khas.length ? (dua ? "46%" : "30%") : dua ? "70%" : "45%", gridTemplateColumns: `7.5em repeat(${kolomV}, minmax(0,1fr))`, gridTemplateRows: dua ? "1fr 1fr" : "1fr" }}>
          <div className="flex flex-col justify-center rounded-[0.8em] px-[0.8em] leading-tight" style={{ background: `${aksen}14`, color: aksen, gridRow: dua ? "span 2" : undefined }}>
            <span className="text-[0.66em] font-extrabold uppercase tracking-wider">{v.vokalJudul || L.vokal}</span>
            <span className="mt-[0.2em] text-[0.78em] font-semibold" style={{ color: "#374151" }}>{v.vokalKet || L.vokalKet}</span>
          </div>
          {v.vokal.map((x, i) => {
            const w = WARNA_VOKAL[i % WARNA_VOKAL.length];
            return (
              <Bunyi key={i} teks={x.kata} ucap={ucap} siapkan={siapkan}
                className={`flex min-w-0 items-center rounded-[0.8em] leading-tight ${rapat ? "flex-col justify-center gap-[0.15em] px-[0.3em] text-center" : dua ? "gap-[0.5em] px-[0.6em]" : "gap-[0.7em] px-[0.8em]"}`}
                style={{ background: "#fff", border: "1px solid #E5E7EB", borderBottom: `0.3em solid ${w}`, animation: `slideVisMuncul .35s ease-out ${i * 60}ms both` }}>
                {/* Pasangan "ö · ő" tetap satu baris dan mengecil supaya kata contohnya tak terpotong. */}
                <span dir="auto" className={`${Array.from(x.huruf).length > 2 ? "text-[1.5em]" : dua ? "text-[2.1em]" : "text-[2.6em]"} shrink-0 whitespace-nowrap font-extrabold leading-none`} style={{ color: w }}>{x.huruf}</span>
                <span className={`flex min-w-0 flex-col ${rapat ? "max-w-full items-center" : ""}`}>
                  {x.seperti && <span className="max-w-full truncate text-[0.68em] font-semibold" style={{ color: "#9CA3AF" }}>{L.seperti} “{x.seperti}”</span>}
                  <span dir="auto" className={`max-w-full truncate ${rapat ? "text-[1.05em]" : "text-[1.3em]"} font-extrabold`} style={{ color: "#111827", ...longgar(x.kata) }}>
                    <Sorot kata={x.kata} sorot={x.sorot || [x.huruf]} tetap={tetap} warna={w} />
                  </span>
                  {x.baca && <span className="truncate text-[0.74em] font-bold" style={{ color: w }}>“{x.baca}”</span>}
                  <span className="truncate text-[0.74em]" style={{ color: "#6B7280" }}>{x.arti}</span>
                </span>
                {x.ikon && !rapat && <span className="ml-auto shrink-0 text-[1.9em] leading-none">{x.ikon}</span>}
              </Bunyi>
            );
          })}
        </div>
      )}
      <div className="grid min-h-0 flex-1 gap-[0.8cqw]" style={{ gridTemplateColumns: `repeat(${kolom}, minmax(0,1fr))`, gridAutoRows: "1fr" }}>
        {v.khas.map((x, i) => {
          const w = WARNA_PADANAN[i % WARNA_PADANAN.length];
          return (
            <div key={i} className="flex min-h-0 flex-col gap-[0.5em] p-[0.7em]"
              style={{ ...KARTU, borderTop: `0.3em solid ${w}`, animation: `slideVisMuncul .35s ease-out ${200 + i * 60}ms both` }}>
              <div className="flex items-center gap-[0.6em]">
                <span dir="auto" className="grid h-[2.1em] min-w-[2.1em] shrink-0 place-items-center rounded-[0.6em] px-[0.4em] text-[1.25em] font-extrabold leading-none"
                  style={{ background: `${w}18`, color: w }}>{x.tulisan}</span>
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="text-[1em] font-extrabold" style={{ color: "#111827" }}>
                    {x.bisu ? <span style={{ color: "#9CA3AF" }}>{L.bisu}</span> : <><span style={{ color: "#9CA3AF" }}>{L.dibaca}</span> {x.bunyi}</>}
                  </span>
                  {x.info && <span className="text-[0.72em] leading-snug" style={{ color: "#6B7280" }}>{x.info}</span>}
                </span>
              </div>
              <div className="flex min-h-0 flex-1 gap-[0.4em]">
                {x.contoh.map((c, ci) => (
                  <Bunyi key={ci} teks={c.kata} ucap={ucap} siapkan={siapkan}
                    className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-[0.6em] px-[0.3em] text-center leading-tight"
                    style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                    <span dir="auto" className={`max-w-full truncate ${lapang ? "text-[1.6em]" : "text-[1.05em]"} font-extrabold`} style={{ color: "#111827", ...longgar(c.kata) }}>
                      <Sorot kata={c.kata} sorot={x.sorot || [x.tulisan]} tetap={tetap} warna={w} coret={x.bisu} />
                    </span>
                    {c.baca && <span className={`max-w-full truncate ${lapang ? "text-[1em]" : "text-[0.78em]"} font-bold`} style={{ color: w }}>“{c.baca}”</span>}
                    {c.arti && <span className={`max-w-full truncate ${lapang ? "text-[0.85em]" : "text-[0.66em]"}`} style={{ color: "#6B7280" }}>{c.arti}</span>}
                  </Bunyi>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SlideVisual({ visual, aksen, ucap, siapkan, lang }: {
  visual: Visual; aksen: string;
  /** Kode bahasa slide — klip rekaman hanya dipakai untuk Mandarin ("zh"). */
  lang?: string | null;
  /** Bunyikan teks (Hanzi/aksara asli); tanpa ini visual tidak bisa diklik. */
  ucap?: Ucap;
  siapkan?: (teks: string) => void;
}) {
  const klip = !!ucap && /^zh/i.test(lang || "");
  // Klip kata di slide ini diunduh di muka (±5 KB/kata) supaya klik pertama langsung bunyi.
  useEffect(() => {
    if (!klip) return;
    const teks = visual.kind === "kelompok"
      ? visual.groups.flatMap((g) => g.chips.map((c) => c.hanzi || ""))
      : visual.kind === "sejarah" ? visual.peristiwa.map((p) => p.asli || "")
      : visual.kind === "banding" ? visual.rows.flatMap((r) => r.target.map((t) => t.t))
      : visual.kind === "alfabet" || visual.kind === "bunyi" || visual.kind === "isyarat" ? []
      : visual.rows.map((r) => r.hanzi || "");
    teks.forEach((t) => { const u = urlKlip(t); if (u) void fetch(u, { cache: "force-cache" }).catch(() => {}); });
  }, [visual, klip]);
  // Pindah slide = klip yang masih berbunyi dihentikan.
  useEffect(() => () => { try { pemutar?.pause(); } catch { /* diam */ } }, []);
  // Kata yang punya klip tak perlu dipanaskan di TTS biasa.
  const siap = klip && siapkan ? (t: string) => { if (!urlKlip(t)) siapkan(t); } : siapkan;
  return <KlipCtx.Provider value={klip}><Isi visual={visual} aksen={aksen} ucap={ucap} siapkan={siap} /></KlipCtx.Provider>;
}

function Isi({ visual, aksen, ucap, siapkan }: { visual: Visual; aksen: string; ucap?: Ucap; siapkan?: (teks: string) => void }) {
  if (visual.kind === "isyarat") return <Suspense fallback={null}><SlideIsyarat v={visual} aksen={aksen} /></Suspense>;
  if (visual.kind === "nada") return <VisualNada rows={visual.rows} ucap={ucap} siapkan={siapkan} aksen={aksen} />;
  if (visual.kind === "suku-kata") return <VisualSuku rows={visual.rows} ucap={ucap} siapkan={siapkan} />;
  if (visual.kind === "kelompok") return <VisualKelompok groups={visual.groups} ucap={ucap} siapkan={siapkan} aksen={aksen} />;
  if (visual.kind === "jebakan") return <VisualJebakan rows={visual.rows} ucap={ucap} siapkan={siapkan} />;
  if (visual.kind === "sejarah") return <VisualSejarah v={visual} ucap={ucap} siapkan={siapkan} aksen={aksen} />;
  if (visual.kind === "banding") return <VisualBanding v={visual} ucap={ucap} siapkan={siapkan} aksen={aksen} />;
  if (visual.kind === "bunyi") return <VisualBunyi v={visual} ucap={ucap} siapkan={siapkan} aksen={aksen} />;
  if (visual.kind === "alfabet") return <VisualAlfabet v={visual} ucap={ucap} siapkan={siapkan} aksen={aksen} />;
  return null;
}
