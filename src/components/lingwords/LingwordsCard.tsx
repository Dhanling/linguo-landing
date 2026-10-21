'use client';

// [lingwords-v1] Kartu Lingwords di Beranda siswa: posisi kosakata terhadap target
// level (cincin + bar status) dan perkiraan waktu sampai target. [lingwords-card-v2]
// Tata letak ala "vocabulary tracker": pilihan periode 7/30/90 hari/Semua, pil
// target, dan grafik batang aktivitas kata. Rinciannya (tangga level, heatmap,
// tonggak) di /kosakata. [lingwords-kelas-kata-v1] Bar & legenda per kelas kata
// (benda/kerja/sifat/lainnya, ditandai AI di latar); status tetap di /kosakata.
//
// Catatan: kartu "Kosakata Saya" lama dicabut dari Beranda 11 Agu karena layar
// pertama terlalu padat — makanya kartu ini sengaja SATU baris ringkas.

import Link from 'next/link';
import { ChevronRight, Layers, Lightbulb, PartyPopper, Sparkles, Target } from 'lucide-react';
import { useT } from '@/lib/uiLang';
import { computeStats, etaText, type RegLike } from '@/lib/lingwords';
import { langLabel } from '@/lib/quiz/language';
import { LwActivityBars, LwPosBar, LwPosLegend, LwRing, posRows, type LwPeriod } from './LwCharts';
import { ensurePos } from '@/lib/lingwordsTema';
import { useLangPick, useLingwords } from './useLingwords';
import { useEffect, useMemo, useState } from 'react';

const PERIODS: { id: LwPeriod; label: string }[] = [
  { id: '7', label: '7 hari' },
  { id: '30', label: '30 hari' },
  { id: '90', label: '90 hari' },
  { id: 'all', label: 'Semua' },
];
const PERIOD_KEY = 'linguo:lingwords:periode:v1';
const fmt = (n: number) => n.toLocaleString('id-ID');

export default function LingwordsCard({
  userId,
  regs,
  previewMode = false,
  previewQuery = '',
  previewStudentId = null,
}: {
  userId?: string | null;
  regs: RegLike[];
  /** POV siswa (staf): sesi milik staf → data asli siswa dibaca lewat /api/preview-lingwords. */
  previewMode?: boolean;
  previewQuery?: string;
  previewStudentId?: string | null;
}) {
  const t = useT();
  const { loading, words, activity, langs } = useLingwords(previewMode ? null : userId, regs, {
    sync: !previewMode,
    previewStudentId: previewMode ? previewStudentId : null,
  });
  const [lang, setLang] = useLangPick(langs);
  const [period, setPeriod] = useState<LwPeriod>('7');
  useEffect(() => {
    try {
      const v = localStorage.getItem(PERIOD_KEY) as LwPeriod | null;
      if (v && PERIODS.some((p) => p.id === v)) setPeriod(v);
    } catch { /* penyimpanan diblokir — pakai bawaan 7 hari */ }
  }, []);
  const pickPeriod = (p: LwPeriod) => {
    setPeriod(p);
    try { localStorage.setItem(PERIOD_KEY, p); } catch { /* abaikan */ }
  };
  const regKey = regs.map((r) => `${r.language}|${r.level}`).join(',');
  const stats = useMemo(
    () => (lang ? computeStats(words, lang, regs, activity) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [words, lang, regKey, activity]
  );
  const href = `/kosakata${previewQuery}`;

  // Kelas kata: kata yang belum ditandai dikirim ke AI per batch (pratinjau POV = cache saja).
  const [posVer, setPosVer] = useState(0);
  const langWords = useMemo(() => (lang ? words.filter((w) => w.lang === lang) : []), [words, lang]);
  const wordKey = langWords.map((w) => w.word).join('|');
  useEffect(() => {
    if (previewMode || !lang || !langWords.length) return;
    let alive = true;
    ensurePos(lang, langWords)
      .then((changed) => { if (alive && changed) setPosVer((v) => v + 1); })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, wordKey, previewMode]);
  const rows = useMemo(
    () => (lang ? posRows(langWords, lang) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [langWords, lang, posVer]
  );

  if (loading) {
    return <div className="h-[196px] animate-pulse rounded-3xl bg-white ring-1 ring-slate-200/70" aria-hidden />;
  }
  if (!stats) return null;

  const total = stats.mastered + stats.counts.dilatih + stats.counts.dikenal;
  const eta = etaText(stats);

  return (
    <div className="@container rounded-3xl bg-white p-4 ring-1 ring-slate-200/70 sm:p-5">
      {/* Kepala: merek + bahasa | periode + tautan */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1A9E9E]/10 text-[#1A9E9E]">
            <Layers className="h-[19px] w-[19px]" strokeWidth={2.4} />
          </span>
          <h3 className="text-[17px] font-extrabold leading-none text-[#12172B]">Lingwords</h3>
          <span className="h-4 w-px shrink-0 bg-slate-200" aria-hidden />
          {langs.length > 1 ? (
            <div className="flex min-w-0 gap-1 overflow-x-auto">
              {langs.slice(0, 4).map((l) => (
                <button key={l} type="button" onClick={() => setLang(l)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-bold transition ${
                    l === stats.lang ? 'bg-[#1A9E9E] text-white' : 'bg-slate-100 text-gray-500 hover:text-[#16796E]'}`}>
                  {langLabel(l)}
                </button>
              ))}
            </div>
          ) : (
            <span className="truncate text-[13px] font-semibold text-gray-500">
              {t('Pelacak kosakata')} · {langLabel(stats.lang)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <div className="flex rounded-full bg-slate-100 p-1" role="tablist" aria-label={t('Periode aktivitas')}>
              {PERIODS.map((p) => (
                <button key={p.id} type="button" role="tab" aria-selected={period === p.id} onClick={() => pickPeriod(p.id)}
                  className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold transition @lg:px-3 ${
                    period === p.id ? 'bg-[#1A9E9E] text-white shadow-sm' : 'text-gray-500 hover:text-[#16796E]'}`}>
                  {t(p.label)}
                </button>
              ))}
            </div>
          )}
          <Link href={href} aria-label={t('Buka Lingwords')}
            className="inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-[12.5px] font-bold text-[#16796E] hover:text-[#0F5A52]">
            <span className="hidden @2xl:inline">{t('Buka Lingwords')}</span> <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {total === 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-[#1A9E9E]/8 p-3.5">
          <Sparkles className="h-5 w-5 shrink-0 text-[#16796E]" />
          <p className="min-w-[200px] flex-1 text-[13px] font-semibold text-[#0F5A52]">
            {t('Target')} {stats.level}: <b>{stats.target} {t('kata')}</b>. {t('Mulai kumpulkan kata dari Watch & Learn, materi kelas, atau e-book — progresmu muncul di sini.')}
          </p>
          <Link href="/watch" className="rounded-xl bg-[#1A9E9E] px-3 py-2 text-[12.5px] font-bold text-white hover:bg-[#16796E]">
            {t('Mulai')}
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid items-center gap-5 @lg:grid-cols-[auto_minmax(0,1fr)] @3xl:grid-cols-[auto_minmax(0,1.15fr)_minmax(0,1fr)] @3xl:gap-7">
          <div className="flex justify-center"><LwRing stats={stats} size={128} stroke={13} /></div>

          <div className="min-w-0">
            <p className="flex items-baseline gap-2 leading-none">
              <span className="text-[34px] font-extrabold tracking-tight text-[#12172B]">{fmt(stats.mastered)}</span>
              <span className="text-[14.5px] font-semibold text-gray-500">/ {fmt(stats.target)} {t('kata dikuasai')}</span>
            </p>
            <div className="mt-3.5" title={t('Warna pekat = dikuasai, pudar = masih dilatih/dikenal')}><LwPosBar stats={stats} rows={rows} /></div>
            <div className="mt-2.5"><LwPosLegend stats={stats} rows={rows} t={t} /></div>
            <p className="mt-3.5 flex items-start gap-2 rounded-2xl bg-[#1A9E9E]/8 px-3.5 py-2.5 text-[12.5px] font-semibold text-[#0F5A52]">
              {stats.remaining > 0 ? (
                <>
                  <Lightbulb className="mt-[1px] h-4 w-4 shrink-0" />
                  <span>
                    {t('Kurang')} <b>{fmt(stats.remaining)} {t('kata')}</b> {t('ke target')} {stats.level}
                    {eta.pace && <> · {t('tempo kamu')} {eta.pace}</>}
                    {eta.suggest && <> · <b>{eta.suggest}</b></>}
                  </span>
                </>
              ) : (
                <>
                  <PartyPopper className="mt-[1px] h-4 w-4 shrink-0" />
                  <span>{t('Target')} {stats.level} {t('tercapai — lanjut ke level berikutnya!')}</span>
                </>
              )}
            </p>
          </div>

          <div className="min-w-0 @lg:col-span-2 @3xl:col-span-1">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 py-1.5 pl-1.5 pr-3 text-[13px] font-bold text-[#12172B]">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white">
                  <Target className="h-4 w-4" strokeWidth={2.4} />
                </span>
                {t('Target')}: {stats.level} <span className="text-gray-400">·</span>
                <span className="text-amber-600">{fmt(stats.target)} {t('kata')}</span>
              </span>
              <span className="text-[11.5px] font-bold text-[#16796E]">+{stats.weekGain} {t('dikuasai pekan ini')}</span>
            </div>
            <LwActivityBars heat={stats.heat} period={period} t={t} />
          </div>
        </div>
      )}
    </div>
  );
}
