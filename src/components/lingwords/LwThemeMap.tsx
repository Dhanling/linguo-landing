'use client';

// [lingwords-v2] Peta Kata per tema: tiap tema punya bar sendiri (dikuasai / semua
// kata tema itu). Tema di bawah 50% ditandai oranye = celah yang perlu dilatih.
// Tombol "Latih" membuka FlashcardDeck yang disaring ke kata tema itu; [lingwords-v3]
// tombol Kuis & Hujan Kata langsung membuka permainan dengan SEMUA kata tema itu.
// Tema berasal dari cache per kata (src/lib/lingwordsTema.ts) — tak dihitung ulang
// tiap render; kata yang belum bertema ditandai AI per batch di latar.

import { useEffect, useMemo, useState } from 'react';
import {
  Utensils, Users, Clock, Bus, Home, CloudSun, ShoppingBag, GraduationCap, MessageCircle, Shapes, Layers,
  Map as MapIcon, Play, Loader2, Zap, CloudRain, type LucideIcon,
} from 'lucide-react';
import type { LwWord } from '@/lib/lingwords';
import { ensureThemes, LW_THEMES, themeOf, type LwThemeId } from '@/lib/lingwordsTema';
import { LW_COLORS } from './LwCharts';

const ICON: Record<LwThemeId, LucideIcon> = {
  makanan: Utensils,
  keluarga: Users,
  angka_waktu: Clock,
  transportasi: Bus,
  rumah: Home,
  cuaca: CloudSun,
  belanja: ShoppingBag,
  sekolah_kerja: GraduationCap,
  sapaan: MessageCircle,
  kata_umum: Shapes,
  lainnya: Layers,
};
const ORANYE = '#F59E0B';
// Kuis butuh 1 jawaban + 3 pengecoh, Hujan Kata minimal 4 kata — keduanya perlu arti.
const MIN_GAME = 4;

export interface LwThemePractice {
  label: string;
  words: LwWord[];
  mode?: 'flashcard' | 'quiz' | 'rain';
}

export default function LwThemeMap({
  words,
  lang,
  allowFetch,
  onPractice,
  t,
}: {
  words: LwWord[]; // kata SATU bahasa
  lang: string;
  allowFetch: boolean; // pratinjau POV = cache lokal saja
  onPractice: (p: LwThemePractice) => void;
  t: (s: string) => string;
}) {
  const [ver, setVer] = useState(0);
  const [busy, setBusy] = useState(false);

  const wordKey = words.map((w) => w.word).join('|');
  useEffect(() => {
    if (!allowFetch || !words.length) return;
    let alive = true;
    setBusy(true);
    ensureThemes(lang, words)
      .then((changed) => { if (alive && changed) setVer((v) => v + 1); })
      .catch(() => {})
      .finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, wordKey, allowFetch]);

  const rows = useMemo(() => {
    const by = new Map<LwThemeId, LwWord[]>();
    let pending = 0;
    words.forEach((w) => {
      const th = themeOf(lang, w.word);
      if (!th) { pending++; return; }
      by.set(th, (by.get(th) || []).concat(w));
    });
    const list = LW_THEMES.map((x) => {
      const ws = by.get(x.id) || [];
      const mastered = ws.filter((w) => w.stage === 'dikuasai').length;
      return { ...x, words: ws, mastered, pct: ws.length ? Math.round((mastered / ws.length) * 100) : 0 };
    })
      .filter((r) => r.words.length > 0)
      .sort((a, b) => (a.id === 'lainnya' ? 1 : b.id === 'lainnya' ? -1 : b.words.length - a.words.length));
    return { list, pending };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, lang, ver]);

  if (!words.length) return null;

  return (
    <section className="@container rounded-3xl bg-white p-4 ring-1 ring-slate-200/70 sm:p-5">
      <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-[#12172B]">
        <MapIcon className="h-[18px] w-[18px] text-[#1A9E9E]" /> {t('Peta kata per tema')}
      </h2>
      <p className="mb-3 mt-0.5 text-[12.5px] text-gray-500">
        {t('Bagian yang masih oranye (di bawah 50% dikuasai) paling layak dilatih dulu.')}
      </p>

      {rows.list.length === 0 ? (
        <p className="flex items-center gap-2 text-[13px] text-gray-500">
          {busy && <Loader2 className="h-4 w-4 animate-spin text-[#1A9E9E]" />}
          {busy ? t('Mengelompokkan kata per tema…') : t('Tema kata belum tersedia — coba muat ulang sebentar lagi.')}
        </p>
      ) : (
        <div className="grid gap-2 @xl:grid-cols-2">
          {rows.list.map((r) => {
            const Icon = ICON[r.id];
            const weak = r.pct < 50;
            const canGame = r.words.filter((w) => w.meaning?.trim()).length >= MIN_GAME;
            const gameBtn = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1A9E9E]/10 text-[#16796E] hover:bg-[#1A9E9E] hover:text-white disabled:pointer-events-none disabled:opacity-35';
            return (
              <div key={r.id} className="flex min-w-0 items-center gap-2 rounded-2xl px-3 py-2.5 ring-1 ring-slate-200/70 @md:gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${weak ? 'bg-amber-50 text-amber-600' : 'bg-[#1A9E9E]/10 text-[#16796E]'}`}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <b className="truncate text-[13px] text-[#12172B]">{t(r.label)}</b>
                    <span className={`shrink-0 text-[11.5px] font-bold ${weak ? 'text-amber-600' : 'text-[#16796E]'}`}>
                      {r.mastered}/{r.words.length} · {r.pct}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#E8EAEE]">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(r.pct, 3)}%`, background: weak ? ORANYE : LW_COLORS.dikuasai }} />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => onPractice({ label: t(r.label), words: r.words })}
                    title={t('Latih flashcard tema ini')} aria-label={t('Latih flashcard tema ini')}
                    className="inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-xl bg-[#1A9E9E]/10 px-2 text-[12px] font-bold text-[#16796E] hover:bg-[#1A9E9E] hover:text-white @md:px-2.5">
                    <Play className="h-3.5 w-3.5" /> <span className="hidden @md:inline">{t('Latih')}</span>
                  </button>
                  <button type="button" disabled={!canGame} className={gameBtn}
                    onClick={() => onPractice({ label: t(r.label), words: r.words, mode: 'quiz' })}
                    title={canGame ? t('Kuis arti kata tema ini') : t('Butuh minimal 4 kata berarti')}
                    aria-label={t('Kuis arti kata tema ini')}>
                    <Zap className="h-4 w-4" />
                  </button>
                  <button type="button" disabled={!canGame} className={gameBtn}
                    onClick={() => onPractice({ label: t(r.label), words: r.words, mode: 'rain' })}
                    title={canGame ? t('Hujan Kata tema ini') : t('Butuh minimal 4 kata berarti')}
                    aria-label={t('Hujan Kata tema ini')}>
                    <CloudRain className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {rows.list.length > 0 && rows.pending > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-[11.5px] font-medium text-gray-400">
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {rows.pending} {t('kata belum dikelompokkan')}
        </p>
      )}
    </section>
  );
}
