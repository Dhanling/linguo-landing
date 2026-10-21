'use client';

// [lingwords-v1] Halaman Lingwords (/kosakata): posisi kosakata siswa terhadap target
// tiap level CEFR, perkiraan waktu sampai target, grafik perkembangan, heatmap
// aktivitas + hari beruntun, kata yang baru dikuasai, dan tonggak. Latihan
// (flashcard, kuis arti, Hujan Kata) tetap di FlashcardDeck, dibuka dari tombol "Latih".

import { useMemo } from 'react';
import {
  Award, CalendarDays, Check, Clock, Flame, Layers, Lock, Play, Target, TrendingUp, CloudOff,
} from 'lucide-react';
import { useT } from '@/lib/uiLang';
import { computeStats, etaText, LW_LEVELS, type RegLike } from '@/lib/lingwords';
import { LEVEL_VOCAB_TARGET } from '@/lib/vocabProgress';
import { langLabel } from '@/lib/quiz/language';
import { LwHeatmap, LwLegend, LwProgressChart, LwRing, LwStackBar, LW_COLORS } from './LwCharts';
import { useLangPick, useLingwords } from './useLingwords';
import LwThemeMap, { type LwThemePractice } from './LwThemeMap';

const card = 'rounded-3xl bg-white p-4 ring-1 ring-slate-200/70 sm:p-5';
const fmt = (n: number) => n.toLocaleString('id-ID');

export default function LingwordsDashboard({
  userId,
  regs,
  previewMode = false,
  onPractice,
  onPracticeTheme,
}: {
  userId?: string | null;
  regs: RegLike[];
  previewMode?: boolean;
  onPractice: (lang: string) => void;
  onPracticeTheme?: (lang: string, p: LwThemePractice) => void;
}) {
  const t = useT();
  const { loading, words, activity, langs, server } = useLingwords(previewMode ? null : userId, regs, { sync: !previewMode });
  const [lang, setLang] = useLangPick(langs);
  const regKey = regs.map((r) => `${r.language}|${r.level}`).join(',');
  const stats = useMemo(
    () => (lang ? computeStats(words, lang, regs, activity) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [words, lang, regKey, activity]
  );
  const langWords = useMemo(() => (lang ? words.filter((w) => w.lang === lang) : []), [words, lang]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[220, 120, 260].map((h) => <div key={h} className="animate-pulse rounded-3xl bg-white ring-1 ring-slate-200/70" style={{ height: h }} />)}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`${card} text-center`}>
        <Layers className="mx-auto h-9 w-9 text-[#1A9E9E]" />
        <h2 className="mt-3 text-lg font-extrabold text-[#12172B]">{t('Lingwords kamu masih kosong')}</h2>
        <p className="mx-auto mt-1 max-w-md text-[13.5px] text-gray-500">
          {t('Simpan kata dari Watch & Learn atau e-book, selesaikan materi kelas, atau terima kiriman pengajar di Lingnote — semua kosakatamu dikumpulkan di sini, lengkap dengan target per level.')}
        </p>
        <a href="/watch" className="mt-4 inline-flex rounded-xl bg-[#1A9E9E] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#16796E]">
          {t('Buka Watch & Learn')}
        </a>
      </div>
    );
  }

  const eta = etaText(stats);
  const perDay30 = Math.ceil(stats.remaining / 30);
  const gainDelta = stats.prevWeekGain > 0 ? Math.round(((stats.weekGain - stats.prevWeekGain) / stats.prevWeekGain) * 100) : null;
  const nextMs = stats.milestones.find((m) => !m.reached);
  const curIdx = LW_LEVELS.indexOf(stats.level as (typeof LW_LEVELS)[number]);

  return (
    <div className="space-y-4">
      {/* Kepala: pilihan bahasa + tombol latih */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {langs.length > 1 ? (
          <div className="flex flex-wrap gap-1 rounded-2xl bg-white p-1 ring-1 ring-slate-200/70">
            {langs.map((l) => (
              <button key={l} type="button" onClick={() => setLang(l)}
                className={`rounded-xl px-3 py-1.5 text-[12.5px] font-bold transition ${
                  l === stats.lang ? 'bg-[#1A9E9E] text-white' : 'text-gray-500 hover:text-[#16796E]'}`}>
                {langLabel(l)}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-[13px] font-bold text-gray-500">{t('Bahasa')} {langLabel(stats.lang)}</span>
        )}
        <button type="button" onClick={() => onPractice(stats.lang)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1A9E9E] px-4 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-[#16796E]">
          <Play className="h-4 w-4" /> {t('Latih kosakata')}
        </button>
      </div>

      {/* Hero: cincin + status + perkiraan */}
      <section className={card}>
        <div className="flex flex-wrap items-center gap-6">
          <LwRing stats={stats} size={164} stroke={14} />
          <div className="min-w-[240px] flex-1">
            <p className="text-[26px] font-extrabold leading-none text-[#12172B]">
              {fmt(stats.mastered)} <span className="text-[15px] font-semibold text-gray-400">/ {fmt(stats.target)} {t('kata dikuasai')}</span>
            </p>
            <p className="mt-1 text-[12.5px] font-medium text-gray-500">
              {t('Target kosakata level')} {stats.level}{!stats.levelKnown && ` (${t('perkiraan — level kelas belum tercatat')})`}
            </p>
            <div className="mt-3"><LwStackBar stats={stats} /></div>
            <div className="mt-2"><LwLegend stats={stats} t={t} /></div>
            <div className="mt-4 flex flex-wrap gap-2">
              {stats.remaining > 0 && (
                <div className="flex items-start gap-2 rounded-2xl bg-[#1A9E9E]/8 px-3 py-2.5 text-[12.5px] font-semibold text-[#0F5A52]">
                  <Clock className="mt-[1px] h-4 w-4 shrink-0" />
                  <span>
                    {t('Kurang')} <b>{fmt(stats.remaining)} {t('kata')}</b>
                    {eta.pace && <> · {t('tempo kamu sekarang')} {eta.pace}</>}
                    {eta.suggest && <> · <b>{eta.suggest}</b></>}
                  </span>
                </div>
              )}
              {stats.remaining > 0 && (
                <div className="flex items-start gap-2 rounded-2xl bg-amber-50 px-3 py-2.5 text-[12.5px] font-semibold text-amber-800">
                  <Target className="mt-[1px] h-4 w-4 shrink-0" />
                  <span>{t('Mau capai target')} {stats.level} {t('dalam 30 hari? Butuh')} <b>{perDay30} {t('kata/hari')}</b></span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tangga level */}
      <section className={card}>
        <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-[#12172B]">
          <TrendingUp className="h-[18px] w-[18px] text-[#1A9E9E]" /> {t('Tangga level')}
        </h2>
        <p className="mb-3 mt-0.5 text-[12.5px] text-gray-500">{t('Jumlah kata dikuasai yang jadi target tiap level (kumulatif).')}</p>
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {LW_LEVELS.map((lv, i) => {
            const tg = LEVEL_VOCAB_TARGET[lv];
            const p = Math.min(100, Math.round((stats.mastered / tg) * 100));
            const done = stats.mastered >= tg;
            const now = i === curIdx;
            return (
              <div key={lv} className={`min-w-[112px] flex-1 rounded-2xl p-3 ring-1 ${
                now ? 'bg-[#1A9E9E]/8 ring-[#1A9E9E]/40' : 'ring-slate-200/70'} ${i > curIdx ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-1.5 text-[15px] font-extrabold text-[#12172B]">
                  {lv}
                  {done ? <Check className="h-3.5 w-3.5 text-[#16796E]" strokeWidth={3} />
                    : i > curIdx ? <Lock className="h-3.5 w-3.5 text-gray-400" />
                      : <Target className="h-3.5 w-3.5 text-[#16796E]" />}
                </div>
                <div className="my-2 h-2 overflow-hidden rounded-full bg-[#E8EAEE]">
                  <div className="h-full rounded-full" style={{ width: `${p}%`, background: done ? LW_COLORS.dikuasai : LW_COLORS.dilatih }} />
                </div>
                <div className="text-[11.5px] font-semibold text-gray-500">{fmt(Math.min(stats.mastered, tg))} / {fmt(tg)}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* [lingwords-v2] Peta kata per tema */}
      <LwThemeMap
        words={langWords}
        lang={stats.lang}
        allowFetch={!previewMode}
        onPractice={(p) => (onPracticeTheme ? onPracticeTheme(stats.lang, p) : onPractice(stats.lang))}
        t={t}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Grafik perkembangan */}
        <section className={`${card} lg:col-span-2`}>
          <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-[#12172B]">
            <TrendingUp className="h-[18px] w-[18px] text-[#1A9E9E]" /> {t('Perkembangan kata dikuasai')}
          </h2>
          <p className="mb-3 mt-0.5 text-[12.5px] text-gray-500">
            {t('Pekan ini')} <b className="text-[#16796E]">+{stats.weekGain} {t('kata')}</b>
            {gainDelta != null && <> · {gainDelta >= 0 ? t('naik') : t('turun')} {Math.abs(gainDelta)}% {t('dari pekan lalu')}</>}
          </p>
          <LwProgressChart stats={stats} t={t} />
          <div className="mt-2 flex flex-wrap gap-4 text-[11.5px] font-semibold text-gray-500">
            <span className="inline-flex items-center gap-1.5"><i className="inline-block h-[2px] w-4" style={{ background: LW_COLORS.dilatih }} />{t('Dikuasai')}</span>
            <span className="inline-flex items-center gap-1.5"><i className="inline-block h-0 w-4 border-t-2 border-dotted" style={{ borderColor: LW_COLORS.dikenal }} />{t('Terkumpul (semua status)')}</span>
            <span className="inline-flex items-center gap-1.5"><i className="inline-block h-0 w-4 border-t-2 border-dashed" style={{ borderColor: LW_COLORS.target }} />{t('Target level')}</span>
          </div>
        </section>

        {/* Heatmap */}
        <section className={card}>
          <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-[#12172B]">
            <CalendarDays className="h-[18px] w-[18px] text-[#1A9E9E]" /> {t('Aktivitas harian')}
          </h2>
          <p className="mb-3 mt-0.5 text-[12.5px] text-gray-500">{t('Makin gelap, makin banyak kata yang kamu simpan & latih.')}</p>
          <LwHeatmap heat={stats.heat} t={t} />
          <div className="mt-4 grid grid-cols-3 gap-2 text-[11.5px] font-semibold text-gray-500">
            <div>
              <b className="flex items-center gap-1 text-[20px] text-[#12172B]"><Flame className="h-4 w-4 text-orange-500" />{stats.streak}</b>
              {t('hari beruntun')}
            </div>
            <div><b className="block text-[20px] text-[#12172B]">{stats.bestStreak}</b>{t('rekor beruntun')}</div>
            <div><b className="block text-[20px] text-[#12172B]">{stats.activeDays}</b>{t('hari aktif')}</div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Kata baru dikuasai */}
        <section className={`${card} lg:col-span-3`}>
          <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-[#12172B]">
            <Check className="h-[18px] w-[18px] text-[#1A9E9E]" /> {t('Baru kamu kuasai')}
          </h2>
          {stats.recent.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {stats.recent.map((w) => (
                <span key={w.word} title={w.meaning || undefined}
                  className="inline-flex max-w-[220px] items-baseline gap-1.5 rounded-xl bg-[#1A9E9E]/8 px-2.5 py-1.5 text-[13px] font-bold text-[#0F5A52]">
                  <span className="truncate">{w.word}</span>
                  {(w.translit || w.meaning) && (
                    <span className="truncate text-[11px] font-medium text-gray-500">
                      {[w.translit, w.meaning].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[13px] text-gray-500">
              {t('Belum ada kata yang dikuasai. Kata naik ke "Dikuasai" setelah kamu review beberapa kali sampai jadwal ulangnya ≥ 3 pekan.')}
            </p>
          )}
        </section>

        {/* Tonggak */}
        <section className={`${card} lg:col-span-2`}>
          <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-[#12172B]">
            <Award className="h-[18px] w-[18px] text-[#1A9E9E]" /> {t('Tonggak')}
          </h2>
          {nextMs && (
            <p className="mb-3 mt-0.5 text-[12.5px] text-gray-500">
              {t('Kurang')} <b>{nextMs.n - stats.mastered}</b> {t('kata lagi ke tonggak')} {fmt(nextMs.n)}.
            </p>
          )}
          <div className="grid grid-cols-3 gap-2">
            {stats.milestones.map((m) => (
              <div key={m.n} className={`rounded-2xl p-2.5 text-center ring-1 ${m.reached ? 'ring-[#1A9E9E]/40' : 'ring-slate-200/70'}`}>
                <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full ${
                  m.reached ? 'bg-[#1A9E9E] text-white' : 'bg-slate-100 text-gray-400'}`}>
                  {m.reached ? <Check className="h-4 w-4" strokeWidth={3} /> : <Lock className="h-4 w-4" />}
                </div>
                <b className={`mt-1.5 block text-[14px] ${m.reached ? 'text-[#12172B]' : 'text-gray-400'}`}>{fmt(m.n)}</b>
                <span className="text-[10.5px] font-semibold text-gray-400">{t('kata')}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <p className="flex items-start justify-center gap-1.5 px-2 text-center text-[11.5px] font-medium leading-relaxed text-gray-400">
        {!server && !previewMode && <CloudOff className="mt-[2px] h-3.5 w-3.5 shrink-0" />}
        <span>
          {t('Dihitung dari kata tersimpan Watch & Learn dan e-book, kiriman pengajar di Lingnote, serta materi & kuis yang sudah kamu selesaikan.')}{' '}
          {previewMode
            ? t('Mode pratinjau: kata tersimpan mengikuti perangkat ini, bukan milik siswanya.')
            : server
              ? t('Tersinkron ke akunmu — tetap ada walau ganti perangkat.')
              : t('Kata tersimpan saat ini masih tercatat per perangkat.')}
        </span>
      </p>
    </div>
  );
}
