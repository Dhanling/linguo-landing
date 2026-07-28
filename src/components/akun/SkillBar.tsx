'use client';

// [progress-delta-v1] Potongan tampilan skill yang dipakai bareng oleh tab
// Progress detail kelas DAN kartu ringkas di Beranda — biar satu perubahan
// bentuk bar/panah tidak perlu diketik dua kali.

import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cefrBand, scorePct, type SkillDelta } from '@/lib/studentInsights';

/** Panah + selisih persen. Tidak merender apa-apa kalau tak ada pembanding. */
export function DeltaBadge({ delta, before, score, size = 'sm' }: {
  delta: number | null;
  before: number | null;
  score: number;
  size?: 'sm' | 'xs';
}) {
  if (delta === null || before === null) return null;
  const diff = scorePct(score) - scorePct(before);
  const pad = size === 'xs' ? 'px-1 py-[1px] text-[10px]' : 'px-1.5 py-0.5 text-[11px]';
  if (diff === 0) {
    return (
      <span className={`inline-flex items-center gap-0.5 rounded-md bg-slate-100 font-bold text-gray-500 ${pad}`}>
        <Minus className="h-3 w-3" strokeWidth={2.6} /> tetap
      </span>
    );
  }
  const naik = diff > 0;
  const Icon = naik ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md font-bold ${pad} ${naik ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}
      title={naik ? `Naik ${diff}% dari penilaian sebelumnya` : `Turun ${Math.abs(diff)}% dari penilaian sebelumnya`}
    >
      <Icon className="h-3 w-3" strokeWidth={2.8} />
      {naik ? '+' : ''}{diff}%
    </span>
  );
}

/**
 * Satu baris skill: label + band + panah delta, bar sekarang, dan bar bayangan
 * nilai sebelumnya (kalau ada) — pola yang sama dengan kartu progres referensi.
 */
export function SkillRow({ skill, label, Icon, compact = false }: {
  skill: SkillDelta;
  label: string;
  Icon: any;
  compact?: boolean;
}) {
  const pct = scorePct(skill.score);
  const beforePct = skill.before !== null ? scorePct(skill.before) : null;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 font-semibold text-gray-800 ${compact ? 'text-[12px]' : 'text-[13px]'}`}>
          <Icon className="h-4 w-4 text-[#16796E]" strokeWidth={2} /> {label}
        </span>
        {skill.score ? (
          <span className="inline-flex items-center gap-1.5">
            <DeltaBadge delta={skill.delta} before={skill.before} score={skill.score} size={compact ? 'xs' : 'sm'} />
            <span className={`font-bold text-[#16796E] ${compact ? 'text-[12px]' : 'text-[13px]'}`}>
              <span className="mr-1 rounded bg-[#16796E]/10 px-1.5 py-0.5 text-[11px]">{cefrBand(skill.score).band}</span>
              {pct}%
            </span>
          </span>
        ) : (
          <span className="text-xs text-gray-400">belum dinilai</span>
        )}
      </div>
      {/* Bar utama = nilai sekarang. Garis abu di bawahnya = nilai lama, jadi
          kenaikannya kelihatan tanpa perlu baca angka. */}
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-gradient-to-r from-[#16796E] to-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      {beforePct !== null && beforePct !== pct && (
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-50">
            <div className="h-full rounded-full bg-slate-300" style={{ width: `${beforePct}%` }} />
          </div>
          <span className="shrink-0 text-[10px] font-semibold text-gray-400">{beforePct}% sebelumnya</span>
        </div>
      )}
      {!compact && skill.note && <div className="mt-1 text-[11px] text-gray-500">💬 {skill.note}</div>}
    </div>
  );
}
