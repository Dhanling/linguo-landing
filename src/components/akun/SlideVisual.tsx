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

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Volume2, Wind, X, Check, Play, Square } from "lucide-react";
import type { Nada, SlideVisual as Visual } from "@/lib/materiSlides";
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
    <button type="button" className={`text-left transition hover:-translate-y-[1px] hover:shadow-md ${className}`}
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
  if (visual.kind === "nada") return <VisualNada rows={visual.rows} ucap={ucap} siapkan={siapkan} aksen={aksen} />;
  if (visual.kind === "suku-kata") return <VisualSuku rows={visual.rows} ucap={ucap} siapkan={siapkan} />;
  if (visual.kind === "kelompok") return <VisualKelompok groups={visual.groups} ucap={ucap} siapkan={siapkan} aksen={aksen} />;
  if (visual.kind === "jebakan") return <VisualJebakan rows={visual.rows} ucap={ucap} siapkan={siapkan} />;
  return null;
}
