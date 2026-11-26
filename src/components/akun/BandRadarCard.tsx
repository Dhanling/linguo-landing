'use client';

// [kuis-band-radar-siswa-v1] Owner 26 Nov 2026: siswa lihat laporan band IELTS-nya
// sendiri dalam bentuk radar (Overall di puncak + 4 skill), seperti rapor tes resmi.
//
// Muncul begitu ada SATU kuis bergaya IELTS yang sudah dikoreksi — sengaja tidak
// menunggu 16 sesi: umpan balik per kuis yang bikin siswa tahu skill mana yang
// harus dikejar minggu ini. Kuis sebelumnya digambar putus-putus sebagai pembanding.
//
// Radar inline SVG (bukan Recharts) — ringan dan aman di dark mode /akun.

import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { useUiLang } from '@/lib/uiLang';
import type { BandSubmission, SkillBand } from '@/lib/ieltsBand';

const TEAL = '#1A9E9E';

export type BandEntry = { submissionId: string; sessionNo: number; date: string; band: BandSubmission };

// Urutan sumbu searah jarum jam mulai dari atas — sama dengan rapor resmi.
const SUMBU: ('Overall' | SkillBand['label'])[] = ['Overall', 'Listening', 'Reading', 'Writing', 'Speaking'];

function nilaiSumbu(b: BandSubmission, k: (typeof SUMBU)[number]): number | null {
  if (k === 'Overall') return b.overall;
  return b.skill.find((s) => s.label === k)?.band ?? null;
}
function kiraSumbu(b: BandSubmission, k: (typeof SUMBU)[number]): boolean {
  if (k === 'Overall') return b.kira;
  return !!b.skill.find((s) => s.label === k)?.kira;
}

function Radar({ now, prev }: { now: BandSubmission; prev: BandSubmission | null }) {
  const W = 320, H = 290, cx = W / 2, cy = 152, R = 92;
  const sudut = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / SUMBU.length;
  const titik = (i: number, v: number) => {
    const r = (Math.max(0, Math.min(9, v)) / 9) * R;
    return [cx + r * Math.cos(sudut(i)), cy + r * Math.sin(sudut(i))] as const;
  };
  const poligon = (b: BandSubmission) =>
    SUMBU.map((k, i) => titik(i, nilaiSumbu(b, k) ?? 0).join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full max-w-[340px]" role="img" aria-label="Radar band IELTS">
      {[1.8, 3.6, 5.4, 7.2, 9].map((v) => (
        <polygon key={v} points={SUMBU.map((_, i) => titik(i, v).join(',')).join(' ')}
          fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={1} />
      ))}
      {SUMBU.map((_, i) => {
        const [x, y] = titik(i, 9);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="currentColor" strokeOpacity={0.12} />;
      })}
      {prev && (
        <polygon points={poligon(prev)} fill="none" stroke="#94A3B8" strokeWidth={1.6} strokeDasharray="4 4" strokeLinejoin="round" />
      )}
      <polygon points={poligon(now)} fill={`${TEAL}22`} stroke={TEAL} strokeWidth={3} strokeLinejoin="round" />
      {SUMBU.map((k, i) => {
        const v = nilaiSumbu(now, k);
        const a = sudut(i);
        const lx = cx + (R + 38) * Math.cos(a);
        const ly = cy + (R + 30) * Math.sin(a);
        const anchor = Math.abs(Math.cos(a)) < 0.2 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
        const geser = anchor === 'start' ? -22 : anchor === 'end' ? 22 : 0;
        return (
          <g key={k}>
            <text x={lx + geser} y={ly - 4} textAnchor={anchor === 'middle' ? 'middle' : anchor}
              fontSize={22} fontWeight={800} fill={TEAL}>
              {v == null ? '–' : `${kiraSumbu(now, k) ? '≈' : ''}${v.toFixed(1)}`}
            </text>
            <text x={lx + geser} y={ly + 14} textAnchor={anchor === 'middle' ? 'middle' : anchor}
              fontSize={12.5} fill="currentColor" fillOpacity={0.6}>
              {k}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function BandRadarCard({ entries }: { entries: BandEntry[] }) {
  const en = useUiLang() === 'en';
  const x = (id: string, e: string) => (en ? e : id);
  // entries urut lama → baru; bawaan = kuis terbaru.
  const [pilih, setPilih] = useState<string>(entries[entries.length - 1]?.submissionId);
  const idx = Math.max(0, entries.findIndex((e) => e.submissionId === pilih));
  const now = entries[idx];
  const prev = idx > 0 ? entries[idx - 1] : null;

  const delta = useMemo(
    () => (now && prev ? Math.round((now.band.overall - prev.band.overall) * 10) / 10 : null),
    [now, prev],
  );
  if (!now) return null;

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5 text-[#12172B]">
      <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">{x('Laporan Band IELTS', 'IELTS Band Report')}</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {x('Sesi', 'Session')} {now.sessionNo} ·{' '}
            {new Date(now.date).toLocaleDateString(en ? 'en-GB' : 'id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {entries.length > 1 && (
          <select
            value={now.submissionId}
            onChange={(e) => setPilih(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700"
            aria-label={x('Pilih kuis', 'Choose quiz')}
          >
            {[...entries].reverse().map((e) => (
              <option key={e.submissionId} value={e.submissionId}>
                {x('Sesi', 'Session')} {e.sessionNo} · {x('Band', 'Band')} {e.band.overall.toFixed(1)}
              </option>
            ))}
          </select>
        )}
      </div>

      <Radar now={now.band} prev={prev?.band ?? null} />

      <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded" style={{ background: TEAL }} />
          {x('Kuis ini', 'This quiz')}
        </span>
        {prev && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-4 border-t-2 border-dashed border-slate-400" />
            {x('Sesi', 'Session')} {prev.sessionNo}
          </span>
        )}
        {delta !== null && delta !== 0 && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold ${delta > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {delta > 0 ? <TrendingUp className="h-3 w-3" strokeWidth={2.6} /> : <TrendingDown className="h-3 w-3" strokeWidth={2.6} />}
            Overall {delta > 0 ? '+' : ''}{delta.toFixed(1)}
          </span>
        )}
      </div>

      {now.band.kira && (
        <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-gray-50 px-3 py-2 text-[11px] leading-relaxed text-gray-500">
          <Info className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
          {x(
            'Tanda ≈ = perkiraan band dari soal kuis ini, bukan skor tes IELTS resmi. Skill bertanda – belum diuji di kuis ini.',
            '≈ = estimated band from this quiz, not an official IELTS score. Skills marked – were not tested in this quiz.',
          )}
        </p>
      )}
    </section>
  );
}
