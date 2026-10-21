'use client';

// [lingwords-v1] Kartu Lingwords di Beranda siswa: posisi kosakata terhadap target
// level (cincin + bar status), perkiraan waktu sampai target, dan grafik kecil
// perkembangan 12 pekan. Rinciannya (tangga level, heatmap, tonggak) di /kosakata.
//
// Catatan: kartu "Kosakata Saya" lama dicabut dari Beranda 11 Agu karena layar
// pertama terlalu padat — makanya kartu ini sengaja SATU baris ringkas.

import Link from 'next/link';
import { Clock, Layers, ChevronRight, Sparkles, TrendingUp } from 'lucide-react';
import { useT } from '@/lib/uiLang';
import { computeStats, etaText, type RegLike } from '@/lib/lingwords';
import { langLabel } from '@/lib/quiz/language';
import { LwLegend, LwProgressChart, LwRing, LwStackBar } from './LwCharts';
import { useLangPick, useLingwords } from './useLingwords';
import { useMemo } from 'react';

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
  const regKey = regs.map((r) => `${r.language}|${r.level}`).join(',');
  const stats = useMemo(
    () => (lang ? computeStats(words, lang, regs, activity) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [words, lang, regKey, activity]
  );
  const href = `/kosakata${previewQuery}`;

  if (loading) {
    return <div className="h-[168px] animate-pulse rounded-3xl bg-white ring-1 ring-slate-200/70" aria-hidden />;
  }
  if (!stats) return null;

  const total = stats.mastered + stats.counts.dilatih + stats.counts.dikenal;
  const eta = etaText(stats);
  const gain = stats.weekGain - stats.prevWeekGain;

  return (
    <div className="@container rounded-3xl bg-white p-4 ring-1 ring-slate-200/70 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 text-[15px] font-extrabold text-[#12172B]">
          <Layers className="h-[18px] w-[18px] text-[#1A9E9E]" strokeWidth={2.4} />
          Lingwords
          <span className="text-[12.5px] font-semibold text-gray-500">· {t('Bahasa')} {langLabel(stats.lang)}</span>
        </h3>
        <div className="flex items-center gap-2">
          {langs.length > 1 && (
            <div className="flex gap-1">
              {langs.slice(0, 4).map((l) => (
                <button key={l} type="button" onClick={() => setLang(l)}
                  className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold transition ${
                    l === stats.lang ? 'bg-[#1A9E9E] text-white' : 'bg-slate-100 text-gray-500 hover:text-[#16796E]'}`}>
                  {langLabel(l)}
                </button>
              ))}
            </div>
          )}
          <Link href={href} className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#16796E] hover:text-[#0F5A52]">
            {t('Buka Lingwords')} <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {total === 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-[#1A9E9E]/8 p-3.5">
          <Sparkles className="h-5 w-5 shrink-0 text-[#16796E]" />
          <p className="min-w-[200px] flex-1 text-[13px] font-semibold text-[#0F5A52]">
            {t('Target')} {stats.level}: <b>{stats.target} {t('kata')}</b>. {t('Mulai kumpulkan kata dari Watch & Learn, materi kelas, atau e-book — progresmu muncul di sini.')}
          </p>
          <Link href="/watch" className="rounded-xl bg-[#1A9E9E] px-3 py-2 text-[12.5px] font-bold text-white hover:bg-[#16796E]">
            {t('Mulai')}
          </Link>
        </div>
      ) : (
        <div className="mt-3 grid items-center gap-4 @lg:grid-cols-[auto_minmax(0,1fr)] @3xl:grid-cols-[auto_minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="flex justify-center"><LwRing stats={stats} size={112} stroke={11} /></div>
          <div className="min-w-0">
            <p className="text-[22px] font-extrabold leading-none text-[#12172B]">
              {stats.mastered} <span className="text-[14px] font-semibold text-gray-400">/ {stats.target} {t('kata dikuasai')}</span>
            </p>
            <div className="mt-3"><LwStackBar stats={stats} /></div>
            <div className="mt-2"><LwLegend stats={stats} t={t} /></div>
            {stats.remaining > 0 && (
              <p className="mt-2.5 inline-flex items-start gap-1.5 rounded-xl bg-[#1A9E9E]/8 px-2.5 py-1.5 text-[12px] font-semibold text-[#0F5A52]">
                <Clock className="mt-[1px] h-3.5 w-3.5 shrink-0" />
                <span>
                  {t('Kurang')} <b>{stats.remaining} {t('kata')}</b>
                  {eta.pace && <> · {t('tempo kamu')} {eta.pace}</>}
                  {eta.suggest && <> · <b>{eta.suggest}</b></>}
                </span>
              </p>
            )}
          </div>
          <div className="min-w-0 @lg:col-span-2 @3xl:col-span-1">
            <div className="mb-1 flex items-center justify-between text-[11.5px] font-bold">
              <span className="inline-flex items-center gap-1 text-gray-500"><TrendingUp className="h-3.5 w-3.5" /> {t('12 pekan terakhir')}</span>
              <span className={gain >= 0 ? 'text-[#16796E]' : 'text-amber-700'}>
                +{stats.weekGain} {t('pekan ini')}
              </span>
            </div>
            <LwProgressChart stats={stats} compact t={t} />
          </div>
        </div>
      )}
    </div>
  );
}
