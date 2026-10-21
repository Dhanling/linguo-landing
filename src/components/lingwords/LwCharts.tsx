'use client';

// [lingwords-v1] Visual Lingwords: cincin progres, grafik kumulatif, heatmap.
// SVG polos (tanpa pustaka grafik). Satu rona teal bertingkat untuk status kata:
// dikuasai = paling gelap, dilatih = teal brand, dikenal = paling terang. Langkah
// paling terang kontrasnya rendah, jadi selalu ditemani legenda berteks.

import { useMemo, useRef, useState } from 'react';
import type { LwStats } from '@/lib/lingwords';

export const LW_COLORS = {
  bekal: '#5E7F7D', // [lingwords-bekal-v1] bekal level sebelumnya (perkiraan, bukan kata terlacak)
  dikuasai: '#0E6B6B',
  dilatih: '#1A9E9E',
  dikenal: '#8FD3CF',
  track: '#E2E8F0',
  target: '#B45309',
};

/** Cincin dua lapis: dikuasai (penuh) + dilatih (pudar) terhadap target. */
export function LwRing({ stats, size = 132, stroke = 12 }: { stats: LwStats; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const m = Math.min(1, stats.mastered / stats.target);
  const l = Math.min(1, (stats.mastered + stats.counts.dilatih) / stats.target);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img"
        aria-label={`${stats.pct}% target ${stats.level}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={LW_COLORS.track} strokeWidth={stroke} />
        {l > 0 && (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={LW_COLORS.dilatih} strokeOpacity={0.45} strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - l)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        )}
        {m > 0 && (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={LW_COLORS.dikuasai} strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - m)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset .8s ease' }} />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-extrabold leading-none text-[#12172B]" style={{ fontSize: size * 0.22 }}>{stats.pct}%</span>
        <span className="mt-1 text-[11px] font-semibold text-gray-500">target {stats.level}</span>
      </div>
    </div>
  );
}

/** Bar bertumpuk status kata (dikuasai | dilatih | dikenal | belum) terhadap target. */
export function LwStackBar({ stats }: { stats: LwStats }) {
  const base = Math.max(stats.target, stats.mastered + stats.counts.dilatih + stats.counts.dikenal);
  const seg = [
    { k: 'bekal', n: stats.bekal, c: LW_COLORS.bekal },
    { k: 'dikuasai', n: stats.counts.dikuasai, c: LW_COLORS.dikuasai },
    { k: 'dilatih', n: stats.counts.dilatih, c: LW_COLORS.dilatih },
    { k: 'dikenal', n: stats.counts.dikenal, c: LW_COLORS.dikenal },
  ].filter((s) => s.n > 0);
  return (
    <div className="flex h-3.5 gap-[2px] overflow-hidden rounded-full bg-[#E8EAEE]" aria-hidden>
      {seg.map((s) => (
        <div key={s.k} className="h-full first:rounded-l-full" style={{ width: `${(s.n / base) * 100}%`, background: s.c, minWidth: 3 }} />
      ))}
    </div>
  );
}

export function LwLegend({ stats, t }: { stats: LwStats; t: (s: string) => string }) {
  const belum = Math.max(0, stats.target - stats.mastered - stats.counts.dilatih - stats.counts.dikenal);
  const items: [string, string, number][] = [
    ...(stats.bekal ? [[LW_COLORS.bekal, `${t('Bekal')} ${stats.bekalLevel}`, stats.bekal] as [string, string, number]] : []),
    [LW_COLORS.dikuasai, t('Dikuasai'), stats.counts.dikuasai],
    [LW_COLORS.dilatih, t('Dilatih'), stats.counts.dilatih],
    [LW_COLORS.dikenal, t('Dikenal'), stats.counts.dikenal],
    [LW_COLORS.track, t('Belum'), belum],
  ];
  return (
    <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[11.5px] font-semibold text-gray-500">
      {items.map(([c, l, n]) => (
        <span key={l} className="inline-flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c }} />
          {l} <b className="text-[#12172B]">{n}</b>
        </span>
      ))}
    </div>
  );
}

const fmtDate = (ms: number) => new Date(ms).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

/**
 * Grafik area kumulatif "kata dikuasai" per minggu + garis putus target level.
 * `compact` = versi kartu Beranda (tanpa sumbu, tetap ada tooltip).
 */
export function LwProgressChart({ stats, compact = false, t }: { stats: LwStats; compact?: boolean; t: (s: string) => string }) {
  const W = compact ? 320 : 640;
  const H = compact ? 92 : 230;
  const L = compact ? 4 : 38, R = compact ? 4 : 14, T = compact ? 16 : 18, B = compact ? 4 : 26;
  const pts = stats.weekly;
  const maxY = Math.max(stats.target * (compact ? 1 : 1.07), ...pts.map((p) => p.collected), 10);
  const x = (i: number) => L + ((W - L - R) * i) / Math.max(1, pts.length - 1);
  const y = (v: number) => T + (H - T - B) * (1 - v / maxY);
  const line = (k: 'mastered' | 'collected') => pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p[k]).toFixed(1)}`).join(' ');
  const area = `${line('mastered')} L${x(pts.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`;
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const gid = useMemo(() => `lwg-${Math.random().toString(36).slice(2, 8)}`, []);
  const ticks = compact ? [] : niceTicks(maxY);
  const last = pts[pts.length - 1];

  const onMove = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const sx = ((e.clientX - r.left) * W) / r.width;
    setHover(Math.max(0, Math.min(pts.length - 1, Math.round(((sx - L) / (W - L - R)) * (pts.length - 1)))));
  };
  const hp = hover != null ? pts[hover] : null;

  return (
    <div className="relative">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" role="img"
        aria-label={`${t('Kata dikuasai')}: ${last?.mastered ?? 0} / ${stats.target}`}
        onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={LW_COLORS.dilatih} stopOpacity=".28" />
            <stop offset="1" stopColor={LW_COLORS.dilatih} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#94a3b8" strokeOpacity=".18" />
            <text x={L - 6} y={y(v) + 4} fontSize="10.5" fill="#94a3b8" textAnchor="end">{v}</text>
          </g>
        ))}
        {!compact && pts.map((p, i) => (i % 3 === 0 || i === pts.length - 1) && (
          <text key={i} x={x(i)} y={H - 6} fontSize="10.5" fill="#94a3b8" textAnchor="middle">
            {i === pts.length - 1 ? t('Hari ini') : fmtDate(p.start)}
          </text>
        ))}
        {stats.target <= maxY && (
          <>
            <line x1={L} x2={W - R} y1={y(stats.target)} y2={y(stats.target)} stroke={LW_COLORS.target}
              strokeDasharray="5 4" strokeWidth="1.5" />
            <text x={L + 4} y={y(stats.target) - 5} fontSize={compact ? 9.5 : 11} fontWeight="700" fill={LW_COLORS.target}>
              {t('Target')} {stats.level} · {stats.target}
            </text>
          </>
        )}
        {!compact && (
          <path d={line('collected')} fill="none" stroke={LW_COLORS.dikenal} strokeWidth="2" strokeDasharray="2 3" />
        )}
        <path d={area} fill={`url(#${gid})`} />
        <path d={line('mastered')} fill="none" stroke={LW_COLORS.dilatih} strokeWidth="2" strokeLinejoin="round" />
        {last && (
          <circle cx={x(pts.length - 1)} cy={y(last.mastered)} r="4.5" fill={LW_COLORS.dilatih} stroke="#fff" strokeWidth="2" />
        )}
        {hp && hover != null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="#94a3b8" strokeWidth="1" />
            <circle cx={x(hover)} cy={y(hp.mastered)} r="4.5" fill={LW_COLORS.dilatih} stroke="#fff" strokeWidth="2" />
          </>
        )}
        <rect x={L} y={0} width={W - L - R} height={H} fill="transparent" />
      </svg>
      {hp && hover != null && (
        <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-[#0f172a] px-2.5 py-1.5 text-[11.5px] leading-snug text-white shadow-lg"
          style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(hp.mastered) / H) * 100}%`, marginTop: -8 }}>
          <div className="text-white/70">{hover === pts.length - 1 ? t('Hari ini') : `${t('Pekan')} ${fmtDate(hp.start)}`}</div>
          <b>{hp.mastered} {t('kata dikuasai')}</b>
          {hover > 0 && <span className="text-white/70"> · +{hp.mastered - pts[hover - 1].mastered}</span>}
          {!compact && <div className="text-white/70">{hp.collected} {t('kata terkumpul')}</div>}
        </div>
      )}
    </div>
  );
}

function niceTicks(max: number): number[] {
  const step = [10, 25, 50, 100, 200, 250, 500, 1000, 2000].find((s) => max / s <= 5) || 2000;
  const out: number[] = [];
  for (let v = 0; v <= max; v += step) out.push(v);
  return out;
}

const dk = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Heatmap ala GitHub: 18 pekan, kolom = pekan, baris = hari (Sen–Min). */
export function LwHeatmap({ heat, weeks = 18, t }: { heat: Map<string, number>; weeks?: number; t: (s: string) => string }) {
  const cells = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dow = (today.getDay() + 6) % 7; // Senin = 0
    const start = new Date(today);
    start.setDate(today.getDate() - dow - (weeks - 1) * 7);
    const out: { key: string; n: number; future: boolean; date: Date }[] = [];
    for (let i = 0; i < weeks * 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = dk(d);
      out.push({ key, n: heat.get(key) || 0, future: d > today, date: d });
    }
    return out;
  }, [heat, weeks]);
  const lvl = (n: number) => (n <= 0 ? 0 : n < 3 ? 1 : n < 8 ? 2 : n < 15 ? 3 : 4);
  const bg = ['#94a3b822', '#cdeceb', LW_COLORS.dikenal, LW_COLORS.dilatih, LW_COLORS.dikuasai];
  return (
    <div>
      <div className="grid gap-[3px] overflow-x-auto" style={{ gridTemplateRows: 'repeat(7, 12px)', gridAutoFlow: 'column', gridAutoColumns: '12px' }}>
        {cells.map((c) => (
          <i key={c.key} className="block rounded-[3px]"
            style={{ background: c.future ? 'transparent' : bg[lvl(c.n)] }}
            title={c.future ? '' : `${c.date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}: ${c.n} ${t('aktivitas kata')}`} />
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-gray-400">
        {t('Sedikit')}
        {bg.map((b) => <i key={b} className="inline-block h-2.5 w-2.5 rounded-[3px]" style={{ background: b }} />)}
        {t('Banyak')}
      </div>
    </div>
  );
}

// [lingwords-card-v2] Grafik batang aktivitas kata per periode (kartu Beranda).
// 7/30 hari = batang harian, 90 hari = per pekan, Semua = per bulan (maks 12).
export type LwPeriod = '7' | '30' | '90' | 'all';

export function activityBuckets(heat: Map<string, number>, period: LwPeriod): { label: string; title: string; n: number }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayAt = (back: number) => { const d = new Date(today); d.setDate(d.getDate() - back); return d; };
  if (period === '7' || period === '30') {
    const len = Number(period);
    return Array.from({ length: len }, (_, i) => {
      const d = dayAt(len - 1 - i);
      return {
        label: len === 7 ? d.toLocaleDateString('id-ID', { weekday: 'short' }) : String(d.getDate()),
        title: d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }),
        n: heat.get(dk(d)) || 0,
      };
    });
  }
  if (period === '90') {
    return Array.from({ length: 13 }, (_, i) => {
      const end = 12 - i;
      let n = 0;
      for (let j = 0; j < 7; j++) n += heat.get(dk(dayAt(end * 7 + j))) || 0;
      const s = dayAt(end * 7 + 6);
      return { label: s.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }), title: `Pekan ${s.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`, n };
    });
  }
  const per = new Map<string, number>();
  heat.forEach((n, k) => per.set(k.slice(0, 7), (per.get(k.slice(0, 7)) || 0) + n));
  const first = Array.from(per.keys()).sort()[0];
  const months: Date[] = [];
  for (let i = 11; i >= 0; i--) months.push(new Date(today.getFullYear(), today.getMonth() - i, 1));
  const from = first ? months.findIndex((m) => dk(m).slice(0, 7) >= first) : months.length - 1;
  return months.slice(Math.max(0, Math.min(from, months.length - 6))).map((m) => ({
    label: m.toLocaleDateString('id-ID', { month: 'short' }),
    title: m.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    n: per.get(dk(m).slice(0, 7)) || 0,
  }));
}

export function LwActivityBars({ heat, period, t }: { heat: Map<string, number>; period: LwPeriod; t: (s: string) => string }) {
  const b = useMemo(() => activityBuckets(heat, period), [heat, period]);
  const max = Math.max(1, ...b.map((x) => x.n));
  const every = b.length <= 13 ? 1 : 5;
  return (
    <div>
      <div className="flex h-[92px] items-end justify-around gap-[3px] @3xl:gap-1.5" role="img"
        aria-label={`${t('Aktivitas kata')}: ${b.reduce((s, x) => s + x.n, 0)}`}>
        {b.map((x, i) => (
          <div key={i} title={`${x.title}: ${x.n}`} className="max-w-[34px] flex-1 rounded-t-md rounded-b-[3px] transition-[height] duration-500"
            style={{ height: `${Math.max(7, (x.n / max) * 100)}%`, background: i === b.length - 1 ? LW_COLORS.dilatih : x.n ? LW_COLORS.dikenal : 'rgba(143,211,207,0.35)' }} />
        ))}
      </div>
      <div className="mt-1.5 flex justify-around gap-[3px] @3xl:gap-1.5">
        {b.map((x, i) => (
          <span key={i} className="max-w-[34px] flex-1 overflow-visible whitespace-nowrap text-center text-[10.5px] font-semibold text-gray-400">
            {(b.length - 1 - i) % every === 0 ? x.label : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
